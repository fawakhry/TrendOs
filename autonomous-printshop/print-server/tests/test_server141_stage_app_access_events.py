"""SERVER-141 fake-only safety tests: never send a real Cloudflare request."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from server141_stage_app_access_events import (
    _STAGE_APP, _START, _END, _LIMIT, _RAY, _QUERY, sanitize, main,
)
from server136_access_ray_graphql import _ENDPOINT

FAKE_TOKEN = "EXPLICIT_FAKE_VALUE_NOT_A_SECRET_123456789"
ACCOUNT = "a" * 32

def event(app=_STAGE_APP, ray=_RAY, succeeded=0):
    return {"dimensions": {
        "appId": app,
        "cfRayId": ray,
        "isSuccessfulLogin": succeeded,
        "serviceTokenId": "FAKE_PSEUDONYMOUS_TOKEN_ID",
        "approvingPolicyId": "FAKE_PSEUDONYMOUS_POLICY_ID",
        "ipAddress": "SENSITIVE_IP_DO_NOT_PRINT",
        "userUuid": "SENSITIVE_USER_DO_NOT_PRINT",
    }}

def doc(rows):
    return {"data": {"viewer": {"accounts": [{"accessLoginRequestsAdaptiveGroups": rows}]}},
            "errors": None}

class FakeResponse:
    def __init__(self, payload): self.status, self.payload = 200, payload
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, max_bytes): return json.dumps(self.payload).encode("utf-8")

class FakeOpener:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []
    def open(self, request, timeout):
        self.calls.append((request, timeout))
        return FakeResponse(self.payload)

class StageAppCrossCheck(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name) / "private"
        self.directory.mkdir(mode=0o700)
        self.token_file = self.directory / "token"
        self.token_file.write_text(FAKE_TOKEN)
        self.token_file.chmod(0o600)

    def call(self, fake, *args):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            status = main(list(args), opener=fake, token_path=self.token_file)
        return status, out.getvalue()

    def good_args(self):
        return ("--stage-only-readonly", "--owner-approved", "--account-tag", ACCOUNT)

    def test_no_flags_no_call(self):
        fake = FakeOpener(doc([event()]))
        rc, out = self.call(fake, "--account-tag", ACCOUNT)
        self.assertEqual(rc, 2)
        self.assertEqual(fake.calls, [])
        self.assertIn("GATES_CLOSED", out)

    def test_account_id_validation_before_token_read(self):
        fake = FakeOpener(doc([event()]))
        rc, out = self.call(fake, "--stage-only-readonly", "--owner-approved",
                            "--account-tag", "bad")
        self.assertEqual(rc, 2)
        self.assertFalse(fake.calls)
        self.assertIn("ACCOUNT_TAG_INVALID", out)

    def test_no_loose_private_token(self):
        fake = FakeOpener(doc([event()]))
        self.token_file.chmod(0o644)
        rc, out = self.call(fake, *self.good_args())
        self.assertEqual(rc, 2)
        self.assertEqual(fake.calls, [])
        self.assertIn("TOKEN_NOT_READABLE_OR_UNSAFE", out)

    def test_read_only_exact_stage_app_filter_time_and_limit(self):
        fake = FakeOpener(doc([event(ray="OTHER_RAY_SHOULD_NOT_ECHO")]))
        rc, text = self.call(fake, *self.good_args())
        self.assertEqual(rc, 0)
        self.assertEqual(len(fake.calls), 1)
        req, timeout = fake.calls[0]
        self.assertEqual(timeout, 8)
        self.assertEqual(req.full_url, _ENDPOINT)
        self.assertEqual(req.get_method(), "POST")
        self.assertEqual(req.get_header("Authorization"), "Bearer " + FAKE_TOKEN)
        payload = json.loads(req.data)
        self.assertEqual(payload["variables"], {
            "accountTag": ACCOUNT,
            "stageAppId": _STAGE_APP,
            "datetimeStart": _START,
            "datetimeEnd": _END,
        })
        self.assertIn("appId: $stageAppId", payload["query"])
        self.assertIn("limit: 20", payload["query"])
        self.assertNotIn("ipAddress", payload["query"])
        self.assertNotIn("userUuid", payload["query"])
        result = json.loads(text)
        self.assertEqual(result["appEventsCount"], 1)
        self.assertEqual(result["exactRayEvents"], 0)
        self.assertEqual(result["resultCode"], "SERVER141_STAGE_APP_EVENTS_BUT_NO_TARGET_RAY")
        for secret in (FAKE_TOKEN, ACCOUNT, "OTHER_RAY_SHOULD_NOT_ECHO", "SENSITIVE_IP",
                       "SENSITIVE_USER", "FAKE_PSEUDONYMOUS_TOKEN_ID"):
            self.assertNotIn(secret, text)

    def test_matching_denied_ray_is_still_not_auth_proof(self):
        result = sanitize(200, doc([event()]))
        self.assertEqual(result["exactRayEvents"], 1)
        self.assertEqual(result["matchingRayOutcome"], "ACCESS_DENIED_EVENT_FOR_TARGET_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertFalse(result["printerOrLaserCommands"])

    def test_matching_allowed_ray_is_not_proof_of_live_worker(self):
        result = sanitize(200, doc([event(succeeded=1)]))
        self.assertEqual(result["matchingRayOutcome"], "ACCESS_ALLOWED_EVENT_FOR_TARGET_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])

    def test_no_app_events_remains_unproven(self):
        result = sanitize(200, doc([]))
        self.assertEqual(result["resultCode"], "SERVER141_NO_STAGE_APP_EVENTS_UNPROVEN")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertEqual(result["ordersRead"], 0)

    def test_foreign_app_in_response_rejected_without_echo(self):
        result = sanitize(200, doc([event(app="PRODUCTION_SHOULD_NEVER_PRINT")]))
        self.assertEqual(result["resultCode"], "SERVER141_UNEXPECTED_OR_FOREIGN_EVENT")
        self.assertNotIn("PRODUCTION_SHOULD_NEVER_PRINT", str(result))
        self.assertEqual(result["appEventsCount"], 0)

    def test_graphql_error_redacted(self):
        result = sanitize(200, {"errors": [{"message": "FAKE_SECRET_RAW_ERROR"}]})
        self.assertEqual(result["resultCode"], "SERVER141_GRAPHQL_ERRORS_REDACTED")
        self.assertNotIn("FAKE_SECRET_RAW_ERROR", str(result))

    def test_unauthorized_token_no_echo(self):
        result = sanitize(403, doc([event()]))
        self.assertEqual(result["resultCode"], "SERVER141_GRAPHQL_PERMISSION_DENIED")
        self.assertEqual(result["appEventsCount"], 0)

    def test_partial_limit_marked(self):
        result = sanitize(200, doc([event(ray="OTHER_RAY") for _ in range(_LIMIT)]))
        self.assertTrue(result["partialLimitReached"])
        self.assertEqual(result["exactRayEvents"], 0)

    def test_event_cardinality_above_limit_rejected(self):
        result = sanitize(200, doc([event() for _ in range(_LIMIT + 1)]))
        self.assertEqual(result["resultCode"], "SERVER141_UNEXPECTED_OR_FOREIGN_EVENT")

if __name__ == "__main__":
    unittest.main()
