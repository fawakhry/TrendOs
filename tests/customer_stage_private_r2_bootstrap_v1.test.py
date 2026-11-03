"""Execute the actual control-plane helper with synthetic HTTP; never network."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "r2_bootstrap", ROOT / "tools/customer_stage_private_r2_bootstrap_v1.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
ACCOUNT = "0" * 32
R2_TOKEN = "SYNTHETIC_R2_ONLY_NOT_A_CREDENTIAL"
WORKER_TOKEN = "SYNTHETIC_WORKER_ONLY_NOT_A_CREDENTIAL"


class Response:
    def __init__(self, value):
        self.data = json.dumps({"success": True, "result": value}).encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        return self.data[:limit]


class Opener:
    def __init__(self, responses):
        self.responses, self.requests = list(responses), []

    def open(self, request, timeout):
        self.requests.append(request)
        result = self.responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return Response(result)


def env():
    return {"GITHUB_EVENT_NAME": "workflow_dispatch",
            "GITHUB_REPOSITORY": "fawakhry/TrendOs",
            "GITHUB_SHA": "a" * 40, "R2_EXPECTED_SOURCE_SHA": "a" * 40,
            "R2_STAGE_CONFIRMATION": m.CONFIRMATION,
            "CLOUDFLARE_ACCOUNT_ID": ACCOUNT, "CLOUDFLARE_API_TOKEN": WORKER_TOKEN,
            "CLOUDFLARE_R2_STAGE_API_TOKEN": R2_TOKEN}


class Tests(unittest.TestCase):
    def test_plan_does_not_touch_network_or_credentials(self):
        with patch.object(m, "original_stage_preflight") as preflight, \
                patch.object(m, "StageR2Api") as api, \
                contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(m.main(["--plan"], {}), 0)
            self.assertFalse(json.loads(out.getvalue())["networkRequests"])
            preflight.assert_not_called()
            api.assert_not_called()

    def test_missing_separate_secret_stops_before_any_provider_read(self):
        data = env()
        del data["CLOUDFLARE_R2_STAGE_API_TOKEN"]
        with patch.object(m, "original_stage_preflight") as preflight:
            with self.assertRaisesRegex(m.Stop, "DEDICATED_R2_STAGE_SECRET_REQUIRED"):
                m.main(["--execute", "unused"], data)
            preflight.assert_not_called()

    def test_reject_automatic_events_forks_unreviewed_sha_and_wrong_confirmation(self):
        for key, value in [("GITHUB_EVENT_NAME", "pull_request"),
                           ("GITHUB_EVENT_NAME", "push"),
                           ("GITHUB_REPOSITORY", "other/TrendOs"),
                           ("R2_EXPECTED_SOURCE_SHA", "b" * 40),
                           ("R2_STAGE_CONFIRMATION", "go")]:
            data = env()
            data[key] = value
            with self.subTest(key=key, value=value), self.assertRaises(m.Stop):
                m.execution_credentials(data)

    def test_generic_worker_token_cannot_be_reused_as_r2_secret(self):
        data = env()
        data["CLOUDFLARE_R2_STAGE_API_TOKEN"] = WORKER_TOKEN
        with self.assertRaisesRegex(m.Stop, "MUST_BE_SEPARATE"):
            m.execution_credentials(data)

    def test_reject_other_bucket_public_domain_edits_objects_and_deletion(self):
        opener = Opener([])
        api = m.StageR2Api(ACCOUNT, R2_TOKEN, opener)
        for method, path, payload in [
            ("POST", m.PREFIX, {"name": "production-bucket"}),
            ("PUT", m.TARGET + "/domains/managed", {"enabled": True}),
            ("DELETE", m.TARGET, None),
            ("GET", "/r2/buckets/production-bucket/domains/managed", None),
            ("POST", m.TARGET + "/objects/customer.png", {}),
            ("GET", m.PREFIX + "?per_page=1000", {"unexpected": True}),
        ]:
            with self.subTest(path=path), self.assertRaises(m.Stop):
                api.call(method, path, payload)
        self.assertEqual(opener.requests, [])

    def test_r2_403_stops_before_create_and_does_not_print_provider_secret(self):
        error = urllib.error.HTTPError("https://api.cloudflare.com", 403, "Forbidden",
            {}, io.BytesIO(json.dumps({"errors": [{"code": 10000, "message": R2_TOKEN}]}).encode()))
        opener = Opener([error])
        with self.assertRaises(m.Stop) as raised:
            m.bootstrap(m.StageR2Api(ACCOUNT, R2_TOKEN, opener))
        self.assertIn("403_CODES_10000", str(raised.exception))
        self.assertNotIn(R2_TOKEN, str(raised.exception))
        self.assertEqual([r.method for r in opener.requests], ["GET"])

    def test_existing_same_name_bucket_is_not_adopted_or_recreated(self):
        opener = Opener([{"buckets": [{"name": m.BUCKET}]}])
        with self.assertRaisesRegex(m.Stop, "ALREADY_EXISTS"):
            m.bootstrap(m.StageR2Api(ACCOUNT, R2_TOKEN, opener))
        self.assertEqual(len(opener.requests), 1)

    def test_one_empty_private_create_uses_only_dedicated_token(self):
        opener = Opener([{"buckets": []}, {"name": m.BUCKET},
                         {"enabled": False}, {"domains": []}])
        with contextlib.redirect_stdout(io.StringIO()):
            report = m.bootstrap(m.StageR2Api(ACCOUNT, R2_TOKEN, opener))
        self.assertFalse(report["customerProductionReady"])
        self.assertFalse(report["objectWrites"])
        self.assertFalse(report["workerBindingChanged"])
        self.assertEqual([r.method for r in opener.requests], ["GET", "POST", "GET", "GET"])
        self.assertEqual(json.loads(opener.requests[1].data), {"name": m.BUCKET})
        for request in opener.requests:
            self.assertTrue(request.full_url.startswith(
                "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT + "/r2/buckets"))
            self.assertEqual(request.get_header("Authorization"), "Bearer " + R2_TOKEN)
            self.assertEqual(request.get_header("User-agent"), m.CLIENT)

    def test_public_or_custom_domain_readback_blocks_without_modifying_domains(self):
        for managed, custom in [({"enabled": True}, {"domains": []}),
                                ({"enabled": False}, {"domains": [{"domain": "fake.test"}]})]:
            opener = Opener([{"buckets": []}, {"name": m.BUCKET}, managed, custom])
            with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(m.Stop):
                m.bootstrap(m.StageR2Api(ACCOUNT, R2_TOKEN, opener))
            self.assertEqual([r.method for r in opener.requests].count("POST"), 1)
            self.assertTrue(all(r.method == "GET" for r in opener.requests[2:]))

    def test_redirects_cannot_forward_dedicated_authorization(self):
        self.assertIsNone(m.NoRedirect().redirect_request(None, None, 302, "", {},
                                                        "https://evil.invalid"))
        error = urllib.error.HTTPError("https://api.cloudflare.com", 302, "Redirect",
                                      {}, io.BytesIO(b""))
        opener = Opener([error])
        with self.assertRaisesRegex(m.Stop, "HTTP_302"):
            m.StageR2Api(ACCOUNT, R2_TOKEN, opener).call("GET", m.PREFIX + "?per_page=1000")
        self.assertEqual(len(opener.requests), 1)

    def test_original_source_pin_checked_before_loading_or_accessing_provider(self):
        with patch.object(m.subprocess, "check_output", return_value="b" * 40), \
                patch.object(m.importlib.util, "spec_from_file_location") as loader:
            with self.assertRaisesRegex(m.Stop, "SOURCE_SHA_MISMATCH"):
                m.original_stage_preflight("unused", ACCOUNT, WORKER_TOKEN)
            loader.assert_not_called()


if __name__ == "__main__":
    unittest.main()
