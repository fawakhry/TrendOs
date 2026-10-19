"""SERVER-78 contract: NO remote except opted-in, GET-only, safe/sparse output."""
import importlib.util
import io
import json
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "server78_unified_six_gate_reality.py"
spec = importlib.util.spec_from_file_location("server78_reality", SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

ACCOUNT = "a" * 32
TOKEN = "FAKE_TOKEN_NOT_A_REAL_CLOUDFLARE_SECRET"
QUEUE = {
    "schema": "trendos.server69.review-decision-queue.v1",
    "decisions": [{"id": f"D{i:02d}", "status": "owner_approval_pending",
                   "defaultSafe": "DENY", "requiredBefore": "remote gate"}
                  for i in range(1, 7)],
}


class Response:
    def __init__(self, body, status=200):
        self.body = io.BytesIO(body)
        self.status = status
    def read(self, n=-1):
        return self.body.read(n)
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.body.close()


class FakeOpener:
    def __init__(self, *, no_stage=True):
        self.requests = []
        self.no_stage = no_stage
    def open(self, req, timeout):
        self.requests.append(req)
        assert timeout == 15
        assert req.get_method() == "GET"
        assert req.full_url.startswith(
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/workers/scripts/"
        )
        assert req.get_header("Authorization") == "Bearer " + TOKEN
        path = req.full_url
        if path.endswith("/content/v2"):
            # Fake bearer-looking customer text MUST NOT be reflected.
            source = b"/v1/edge/orders/02cr/page" + b"/v1/edge/customers/search" + b"FAKE_PRIVATE_CUSTOMER_12345"
            return Response(source)
        if path.endswith("/settings"):
            payload = {"success": True, "result": {"bindings": [
                {"name": "DB", "type": "d1", "id": "DO_NOT_REPORT_PRIVATE_D1_ID"},
                {"name": "TRENDOSSHOP_SERVICE_READ_ENABLED", "type": "plain_text", "text": "false"},
                {"name": "TRENDOSSHOP_READER_TOKEN_SHA256_HEX", "type": "secret_text",
                 "text": "DO_NOT_REPORT_SECRET_VALUE"},
                {"name": "SOME_SECRET", "type": "secret_text", "text": "PRIVATE"},
            ]}}
        else:
            payload = {"success": True, "result": {"deployments": [{
                "id": "EXACT_WORKER_DEPLOYMENT_IDENTIFIER_SHOULD_NOT_BE_PRINTED",
                "created_on": "2026-10-19T12:30:00Z",
                "versions": [{"version_id": "01234567-89ab-cdef-0123-456789abcdef",
                              "percentage": 100}],
            }]}}
        return Response(json.dumps(payload).encode())


class SixGateRealityTest(unittest.TestCase):
    def test_default_no_network(self):
        op = FakeOpener()
        for args in ({}, {"opener": op, "token": TOKEN, "account": ACCOUNT},
                     {"opener": op, "token": TOKEN, "account": ACCOUNT, "enabled": False},
                     {"opener": op, "token": "bad", "account": ACCOUNT, "enabled": True}):
            r = m.unified_report(QUEUE, **args)
            self.assertEqual(op.requests, [])
            self.assertEqual(r["release"], "NO_GO")
            self.assertFalse(r["remoteCloudflareApiGetPerformed"])
            self.assertEqual(len(r["steps"]), 6)

    def test_opted_in_restricted_pinned_gets(self):
        op = FakeOpener()
        out = m.unified_report(QUEUE, op, TOKEN, ACCOUNT, enabled=True)
        self.assertTrue(out["remoteCloudflareApiGetPerformed"])
        self.assertEqual(len(op.requests), 7)  # 2 prod shell + 3 D1 API + 1 old stage + 1 isolated stage.
        self.assertEqual([x["id"] for x in out["steps"]], list(m._GATE_IDS))
        self.assertTrue(all(x["status"] == "DEFERRED_NO_GO" for x in out["steps"]))
        self.assertTrue(all(not x["liveAccepted"] for x in out["steps"]))
        self.assertEqual(out["release"], "NO_GO")

    def test_secrets_and_customer_never_enter_report(self):
        op = FakeOpener()
        out = m.unified_report(QUEUE, op, TOKEN, ACCOUNT, enabled=True)
        serial = json.dumps(out)
        for forbidden in (TOKEN, ACCOUNT, "PRIVATE", "FAKE_PRIVATE_CUSTOMER_12345",
                          "DO_NOT_REPORT", "SOME_SECRET", "SECRET_VALUE",
                          "EXACT_WORKER_DEPLOYMENT_IDENTIFIER"):
            self.assertNotIn(forbidden, serial)
        self.assertEqual(out["workers"]["trendos-d1-api"]["settings"]["bindingTypes"]["DB"], "d1")
        self.assertEqual(out["workers"]["trendos-d1-api"]["settings"]["readerFlagState"]
                         ["TRENDOSSHOP_SERVICE_READ_ENABLED"], "EXACT_FALSE")

    def test_marker_presence_is_not_active_source_parity(self):
        out = m.unified_report(QUEUE, FakeOpener(), TOKEN, ACCOUNT, enabled=True)
        code = out["workers"]["trendos-d1-api"]["code"]
        self.assertTrue(code["markers"]["ordersPageSource"])
        self.assertTrue(code["markers"]["customersSearchSource"])
        self.assertFalse(code["markers"]["ubuntuServiceReaderSource"])
        self.assertEqual(code["versionParity"], "NOT_PROVEN")
        self.assertEqual(out["workers"]["trendos-d1-api"]["deployment"]
                         ["sourceGitCommitParity"], "NOT_PROVEN")

    def test_declared_binding_name_is_not_approval(self):
        out = m.unified_report(QUEUE, FakeOpener(), TOKEN, ACCOUNT, enabled=True)
        self.assertEqual(out["workers"]["trendos-d1-api"]["settings"]
                         ["bindingTypes"]["TRENDOSSHOP_READER_TOKEN_SHA256_HEX"], "secret_text")
        self.assertEqual(out["steps"][1]["status"], "DEFERRED_NO_GO")
        self.assertEqual(out["steps"][4]["status"], "DEFERRED_NO_GO")

    def test_invalid_queue_never_silent_approves(self):
        for changed in (
            {"schema": "wrong", "decisions": QUEUE["decisions"]},
            {"schema": QUEUE["schema"], "decisions": QUEUE["decisions"][:-1]},
            {"schema": QUEUE["schema"], "decisions": [
                {**x, "status": "approved"} if x["id"] == "D01" else x
                for x in QUEUE["decisions"]]},
        ):
            with self.assertRaisesRegex(m.RemoteEvidenceError, "QUEUE_UNVERIFIED"):
                m.unified_report(changed, FakeOpener(), TOKEN, ACCOUNT, enabled=True)

    def test_refuse_unapproved_endpoint_or_worker(self):
        op = FakeOpener()
        for worker, suffix in (("trendos-main", "/deployments"),
                               ("trendos", "/d1/query"),
                               ("trendos", "/content/v2?steal=1")):
            with self.assertRaisesRegex(m.RemoteEvidenceError, "UNEXPECTED_WORKER_OR_API_PATH"):
                m._api_get(op, TOKEN, ACCOUNT, worker, suffix, byte_limit=100)
        self.assertEqual(op.requests, [])

    def test_missing_stage_remains_no_go_even_if_deployment_exists(self):
        out = m.unified_report(QUEUE, FakeOpener(), TOKEN, ACCOUNT, enabled=True)
        self.assertEqual(out["steps"][0]["status"], "DEFERRED_NO_GO")

    def test_result_no_business_reads_or_host_calls(self):
        out = m.unified_report(QUEUE, FakeOpener(), TOKEN, ACCOUNT, enabled=True)
        for k in ("d1Queries", "customerOrOrderReads", "realUbuntuAccess",
                  "fileDownloads", "printerOrLaserCommands", "cloudflareWrites",
                  "credentialValuesPrinted"):
            self.assertIs(out[k], False)

    def test_missing_result_never_fabricates_deployment(self):
        self.assertFalse(m._deployments({"verified": True, "result": {"deployments": []}})["verified"])
        self.assertFalse(m._settings({"verified": True, "result": {}})["verified"])
        self.assertEqual(m._code({"verified": False, "reason": "AUTH_DENIED"})["reason"], "AUTH_DENIED")

    def test_empty_credential_prevents_remote(self):
        op = FakeOpener()
        r = m.unified_report(QUEUE, op, token="", account=ACCOUNT, enabled=True)
        self.assertFalse(r["remoteCloudflareApiGetPerformed"])
        self.assertEqual(op.requests, [])

    def test_main_requires_explicit_flag_before_any_io(self):
        self.assertEqual(m.main([], {}), 64)


if __name__ == "__main__":
    unittest.main()
