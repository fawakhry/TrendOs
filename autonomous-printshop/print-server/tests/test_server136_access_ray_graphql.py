"""Fake-only tests: Cloudflare API is NEVER called by this suite."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from server136_access_ray_graphql import (
    _ENDPOINT, _RAY, _END, _START, _read_private_token, _sanitized_status, main,
)
SECRET = "FAKE_TOKEN_NO_REAL_CLOUDFLARE_TOKEN_0000000"
ACCOUNT = "1" * 32


class FakeResponse:
    def __init__(self, status, value):
        self.status = status
        self.value = value
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, amount):
        assert amount == 131073
        return self.value


class FakeOpener:
    def __init__(self, document=None, status=200, throw=False):
        self.document = document or {}
        self.status = status
        self.throw = throw
        self.calls = []
    def open(self, req, timeout):
        self.calls.append((req, timeout))
        if self.throw:
            raise URLError("fake transport secret DO_NOT_ECHO")
        if self.status >= 400:
            raise HTTPError(req.full_url, self.status, "FAKE_PRIVATE_BODY", {}, None)
        return FakeResponse(self.status, json.dumps(self.document).encode())


def event(*, success=0, ray=_RAY, token="FAKE_TOKEN_ID", policy="FAKE_POLICY_ID"):
    return {"dimensions": {
        "cfRayId": ray, "isSuccessfulLogin": success,
        "serviceTokenId": token, "approvingPolicyId": policy,
        "ipAddress": "SENSITIVE_IP_MUST_NOT_LOG",
        "userUuid": "SENSITIVE_USER_MUST_NOT_LOG",
    }}


def doc(events):
    return {"data": {"viewer": {"accounts": [
        {"accessLoginRequestsAdaptiveGroups": events}]}}, "errors": None}


class TestServer136(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.private = Path(self.tmp.name) / "private"
        self.private.mkdir(mode=0o700)
        self.path = self.private / "token"
        self.path.write_text(SECRET)
        self.path.chmod(0o600)

    def run_cli(self, transport, *args):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            code = main(list(args), opener=transport, token_path=self.path)
        return code, output.getvalue()

    def test_gates_no_request_and_no_secret_display(self):
        opener = FakeOpener(doc([event()]))
        for args in ([], ["--owner-approved"], ["--stage-only-readonly"]):
            code, output = self.run_cli(opener, *args)
            self.assertEqual(code, 2)
            self.assertIn("GATES_CLOSED", output)
            self.assertNotIn(SECRET, output)
        self.assertEqual(opener.calls, [])

    def test_reject_malformed_account_tag_before_credential_read(self):
        opener = FakeOpener()
        code, output = self.run_cli(opener, "--stage-only-readonly", "--owner-approved",
                                    "--account-tag", "not-an-id")
        self.assertEqual(code, 2)
        self.assertIn("ACCOUNT_TAG_INVALID", output)
        self.assertFalse(opener.calls)

    def test_local_file_is_private_and_symlink_rejected(self):
        self.assertEqual(_read_private_token(self.path), SECRET)
        self.path.chmod(0o644)
        code, out = self.run_cli(FakeOpener(), "--stage-only-readonly", "--owner-approved",
                                  "--account-tag", ACCOUNT)
        self.assertEqual(code, 2)
        self.assertIn("UNSAFE", out)
        self.path.chmod(0o600)
        link = self.private / "symlink"
        link.symlink_to(self.path)
        with self.assertRaises(Exception):
            _read_private_token(link)

    def test_payload_filters_stage_ray_and_exact_narrow_window(self):
        transport = FakeOpener(doc([event(success=0)]))
        rc, output = self.run_cli(transport, "--stage-only-readonly", "--owner-approved",
                                  "--account-tag", ACCOUNT)
        self.assertEqual(rc, 0)
        self.assertEqual(len(transport.calls), 1)
        req, timeout = transport.calls[0]
        self.assertEqual(req.full_url, _ENDPOINT)
        self.assertEqual(req.get_method(), "POST")
        self.assertEqual(timeout, 8)
        self.assertEqual(req.get_header("Authorization"), "Bearer " + SECRET)
        data = json.loads(req.data)
        self.assertEqual(data["variables"], {
            "accountTag": ACCOUNT, "rayId": _RAY,
            "datetimeStart": _START, "datetimeEnd": _END,
        })
        self.assertIn("limit: 5", data["query"])
        self.assertNotIn("ipAddress", data["query"])
        result = json.loads(output)
        self.assertEqual(result["eventsMatched"], 1)
        self.assertEqual(result["decision"], "ACCESS_AUTH_FAILURE_RECORDED_FOR_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertTrue(result["serviceTokenReferenced"])
        self.assertTrue(result["policyReferenced"])
        for banned in (SECRET, ACCOUNT, "SENSITIVE_IP", "SENSITIVE_USER", "FAKE_TOKEN_ID", "FAKE_POLICY_ID"):
            self.assertNotIn(banned, output)

    def test_success_event_does_not_claim_real_worker_access(self):
        out = _sanitized_status(200, doc([event(success=1)]))
        self.assertEqual(out["decision"], "ACCESS_AUTH_SUCCESS_RECORDED_FOR_RAY")
        self.assertFalse(out["stageAccessAuthenticatedProven"])
        self.assertFalse(out["productionWorkerTouched"])
        self.assertEqual(out["ordersRead"], 0)
        self.assertFalse(out["printerOrLaserCommands"])

    def test_no_event_unproven(self):
        out = _sanitized_status(200, doc([]))
        self.assertEqual(out["eventsMatched"], 0)
        self.assertEqual(out["resultCode"], "SERVER136_NO_MATCHING_ACCESS_EVENT_UNPROVEN")
        self.assertEqual(out["decision"], "UNVERIFIED")

    def test_graphql_errors_never_echo(self):
        out = _sanitized_status(200, {"errors": ["SECRET_SERVER_DETAILS"], "data": None})
        self.assertEqual(out["resultCode"], "SERVER136_GRAPHQL_ERRORS_REDACTED")
        self.assertNotIn("SECRET_SERVER_DETAILS", str(out))

    def test_wrong_ray_or_shape_no_attribution(self):
        for data in (doc([event(ray="totally-unrelated")]),
                     {"data": {"viewer": {"accounts": []}}},
                     doc([event()] * 6)):
            out = _sanitized_status(200, data)
            self.assertEqual(out["resultCode"], "SERVER136_GRAPHQL_UNEXPECTED_SHAPE")
            self.assertEqual(out["eventsMatched"], 0)

    def test_bad_json_body_is_not_treated_as_auth_proof(self):
        out = _sanitized_status(200, "not a json object")
        self.assertEqual(out["resultCode"], "SERVER136_GRAPHQL_TRANSPORT_OR_JSON_FAILED")

    def test_api_http_errors_return_only_codes(self):
        for s in (401, 403, 500):
            opener = FakeOpener(status=s)
            rc, out = self.run_cli(opener, "--stage-only-readonly", "--owner-approved",
                                   "--account-tag", ACCOUNT)
            self.assertEqual(rc, 2)
            self.assertEqual(json.loads(out)["graphqlHttpStatus"], s)
            self.assertNotIn("FAKE_PRIVATE_BODY", out)
            self.assertNotIn(SECRET, out)

    def test_transport_failure_never_exposes_error(self):
        rc, out = self.run_cli(FakeOpener(throw=True), "--stage-only-readonly",
                               "--owner-approved", "--account-tag", ACCOUNT)
        self.assertEqual(rc, 2)
        self.assertEqual(json.loads(out)["graphqlHttpStatus"], "other")
        self.assertNotIn("DO_NOT_ECHO", out)


if __name__ == "__main__":
    unittest.main()
