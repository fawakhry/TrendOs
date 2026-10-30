"""SERVER-170 fake-only security and shape tests. Never call live Cloudflare."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from server170_recent_stage_ray_graphql import (
    ACCOUNT, _STAGE_APP, _RAY, _START, _END, _QUERY,
    sanitize, main,
)

TOKEN = "FAKE_TEST_ONLY_TOKEN_ABC_123456789012345"

def event(*, ray=_RAY, app=_STAGE_APP, when="2026-10-23T21:11:00Z", success=0):
    return {"dimensions": {
        "appId": app,
        "cfRayId": ray,
        "datetime": when,
        "isSuccessfulLogin": success,
        "serviceTokenId": "PRIVATE_SERVICE_TOKEN_ID",
        "approvingPolicyId": "PRIVATE_POLICY_ID",
    }}

def body(rows):
    return {"data": {"viewer": {"accounts": [
        {"accessLoginRequestsAdaptiveGroups": rows}
    ]}}, "errors": None}

class FakeResponse:
    status = 200
    def __init__(self, value):
        self.value = value
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self, size):
        return json.dumps(self.value).encode("utf-8")

class FakeOpener:
    def __init__(self, value=None, *, status=200):
        self.value = value if value is not None else body([])
        self.status = status
        self.calls = []
    def open(self, request, timeout):
        self.calls.append((request, timeout))
        if self.status >= 400:
            raise HTTPError(request.full_url, self.status, "NEVER_PRINT_SERVER_ERROR", {}, None)
        return FakeResponse(self.value)

class TestServer170FakeOnly(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.private = Path(tmp.name) / "private"
        self.private.mkdir(mode=0o700)
        self.token = self.private / "token"
        self.token.write_text(TOKEN)
        self.token.chmod(0o600)

    def args(self):
        return ["--stage-only-readonly", "--owner-approved", "--account-tag", ACCOUNT]

    def invoke(self, opener, args=None):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = main(self.args() if args is None else args, opener=opener, token_path=self.token)
        return rc, out.getvalue()

    def test_help_has_no_network_or_token_requirement(self):
        opener = FakeOpener()
        self.token.unlink()
        with self.assertRaises(SystemExit) as x:
            with contextlib.redirect_stdout(io.StringIO()):
                main(["--help"], opener=opener, token_path=self.token)
        self.assertEqual(x.exception.code, 0)
        self.assertEqual(opener.calls, [])

    def test_owner_and_stage_flags_required(self):
        fake = FakeOpener()
        rc, out = self.invoke(fake, ["--account-tag", ACCOUNT])
        self.assertEqual(rc, 2)
        self.assertIn("GATES_CLOSED", out)
        self.assertEqual(fake.calls, [])

    def test_account_hard_scope_required(self):
        fake = FakeOpener()
        rc, out = self.invoke(fake, ["--stage-only-readonly", "--owner-approved", "--account-tag", "b"*32])
        self.assertEqual(rc, 2)
        self.assertIn("SCOPE_REJECTED", out)
        self.assertEqual(fake.calls, [])

    def test_token_file_mode_0600_required(self):
        self.token.chmod(0o644)
        fake = FakeOpener()
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 2)
        self.assertIn("TOKEN_UNSAFE", out)
        self.assertEqual(fake.calls, [])

    def test_single_bounded_exact_ray_and_stage_app_query(self):
        fake = FakeOpener(body([event()]))
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 0)
        self.assertEqual(len(fake.calls), 1)
        request, timeout = fake.calls[0]
        self.assertEqual(timeout, 8)
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.full_url, "https://api.cloudflare.com/client/v4/graphql")
        payload = json.loads(request.data)
        self.assertEqual(payload["variables"], {
            "accountTag": ACCOUNT,
            "stageAppId": _STAGE_APP,
            "rayId": _RAY,
            "datetimeStart": _START,
            "datetimeEnd": _END,
        })
        self.assertIn("cfRayId: $rayId", payload["query"])
        self.assertIn("appId: $stageAppId", payload["query"])
        self.assertIn("limit: 10", payload["query"])
        self.assertIn("datetime\n          appId", payload["query"])
        self.assertIn("orderBy: [datetime_ASC]", payload["query"])
        for forbidden in ("ipAddress", "userUuid", "orderReader", "firewallEvents", "httpRequestsAdaptive"):
            self.assertNotIn(forbidden, payload["query"])
        result = json.loads(out)
        self.assertEqual(result["resultCode"], "SERVER170_DENIED_EVENT_FOUND")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertTrue(result["serviceTokenReferenced"])
        self.assertTrue(result["approvingPolicyReferenced"])
        for forbidden in (TOKEN, ACCOUNT, _STAGE_APP, _RAY, "PRIVATE_SERVICE_TOKEN_ID", "PRIVATE_POLICY_ID"):
            self.assertNotIn(forbidden, out)

    def test_graphql_http200_errors_do_not_become_zero_rows(self):
        msg = "Cannot query field sensitive_private@example.com"
        fake = FakeOpener({"data": None, "errors": [{"message": msg}]})
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 2)
        result = json.loads(out)
        self.assertEqual(result["resultCode"], "SERVER170_GRAPHQL_ERRORS_CLASSIFIED")
        self.assertEqual(result["errorCategory"], "GRAPHQL_VALIDATION")
        self.assertIsNone(result["eventCount"])
        self.assertNotIn(msg, out)

    def test_http403_is_not_success(self):
        fake = FakeOpener(status=403)
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 2)
        result = json.loads(out)
        self.assertEqual(result["resultCode"], "SERVER170_GRAPHQL_PERMISSION_DENIED")
        self.assertIsNone(result["eventCount"])
        self.assertNotIn("NEVER_PRINT_SERVER_ERROR", out)

    def test_no_events_is_unproven(self):
        result = sanitize(200, body([]))
        self.assertEqual(result["resultCode"], "SERVER170_NO_EVENT_UNPROVEN")
        self.assertEqual(result["eventCount"], 0)
        self.assertFalse(result["stageAccessAuthenticatedProven"])

    def test_exact_ray_denied_metadata_only(self):
        result = sanitize(200, body([event(success=0)]))
        self.assertEqual(result["decision"], "ACCESS_DENIED_EVENT_FOR_EXACT_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertEqual(result["ordersRead"], 0)

    def test_exact_ray_allowed_does_not_prove_worker_execution(self):
        result = sanitize(200, body([event(success=1)]))
        self.assertEqual(result["decision"], "ACCESS_ALLOWED_EVENT_FOR_EXACT_RAY")
        self.assertTrue(result["stageAccessAuthenticatedProven"])
        self.assertFalse(result["productionWorkerTouched"])

    def test_foreign_app_rejected_without_data(self):
        x = sanitize(200, body([event(app="PRODUCTION_APP_NEVER_ECHO")]))
        self.assertEqual(x["resultCode"], "SERVER170_FOREIGN_OR_INVALID_RESPONSE")
        self.assertIsNone(x["eventCount"])
        self.assertNotIn("PRODUCTION_APP_NEVER_ECHO", str(x))

    def test_other_ray_rejected_without_data(self):
        x = sanitize(200, body([event(ray="PRIVATE_OTHER_RAY_NEVER_ECHO")]))
        self.assertEqual(x["resultCode"], "SERVER170_FOREIGN_OR_INVALID_RESPONSE")
        self.assertIsNone(x["eventCount"])
        self.assertNotIn("PRIVATE_OTHER_RAY_NEVER_ECHO", str(x))

    def test_out_of_window_rejected(self):
        x = sanitize(200, body([event(when="2026-10-23T18:59:00Z")]))
        self.assertEqual(x["resultCode"], "SERVER170_FOREIGN_OR_INVALID_RESPONSE")
        self.assertIsNone(x["eventCount"])

    def test_time_field_missing_rejected(self):
        r = event()
        del r["dimensions"]["datetime"]
        x = sanitize(200, body([r]))
        self.assertEqual(x["resultCode"], "SERVER170_FOREIGN_OR_INVALID_RESPONSE")

    def test_mixed_decisions_are_not_success(self):
        x = sanitize(200, body([event(success=0), event(success=1)]))
        self.assertEqual(x["resultCode"], "SERVER170_MIXED_DECISIONS_UNVERIFIED")
        self.assertFalse(x["stageAccessAuthenticatedProven"])

    def test_ten_row_limit_is_marked_partial(self):
        x = sanitize(200, body([event() for _ in range(10)]))
        self.assertTrue(x["partialLimitReached"])

    def test_unexpected_shape_rejected_without_events(self):
        x = sanitize(200, {"data": {"viewer": {"accounts": []}}, "errors": None})
        self.assertEqual(x["resultCode"], "SERVER170_FOREIGN_OR_INVALID_RESPONSE")
        self.assertIsNone(x["eventCount"])

if __name__ == "__main__":
    unittest.main()
