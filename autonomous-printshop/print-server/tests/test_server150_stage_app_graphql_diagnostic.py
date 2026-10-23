"""SERVER-150 isolated fake-only qualification; never performs live network calls."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from server150_stage_app_graphql_diagnostic import (
    ACCOUNT, _QUERY, _STAGE_APP, _START, _END, _RAY, _LIMIT,
    sanitize, main, error_bucket,
)

TOKEN = "FAKE_NONSECRET_TEST_ABC_DEF_1234567890"

def event(ray="FAKE_OTHER_RAY_NOT_FOR_OUTPUT", app=_STAGE_APP, when="2026-10-23T19:04:00Z", success=0):
    return {"dimensions": {
        "appId": app, "cfRayId": ray, "datetime": when,
        "isSuccessfulLogin": success,
        "serviceTokenId": "SENSITIVE_SERVICE_TOKEN_ID",
        "approvingPolicyId": "SENSITIVE_POLICY_ID",
    }}

def body(rows):
    return {"data": {"viewer": {"accounts": [
        {"accessLoginRequestsAdaptiveGroups": rows}
    ]}}, "errors": None}

class FakeResponse:
    status = 200
    def __init__(self, payload): self.payload = payload
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, size): return json.dumps(self.payload).encode("utf-8")

class FakeOpener:
    def __init__(self, payload=None, http_status=200):
        self.payload = payload if payload is not None else body([])
        self.http_status = http_status
        self.calls = []
    def open(self, req, timeout):
        self.calls.append((req, timeout))
        if self.http_status >= 400:
            raise HTTPError(req.full_url, self.http_status, "RAW_ERROR_SHOULD_NOT_ESCAPE", {}, None)
        return FakeResponse(self.payload)

class TestServer150FakeOnly(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.folder = Path(t.name) / "private"
        self.folder.mkdir(mode=0o700)
        self.token_file = self.folder / "token"
        self.token_file.write_text(TOKEN)
        self.token_file.chmod(0o600)

    def args(self):
        return ("--stage-only-readonly", "--owner-approved", "--account-tag", ACCOUNT)

    def invoke(self, opener, args=None):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = main(list(args if args is not None else self.args()),
                      opener=opener, token_path=self.token_file)
        return rc, buf.getvalue()

    def test_cli_help_local_and_safe(self):
        fake = FakeOpener()
        with self.assertRaises(SystemExit) as exc:
            with contextlib.redirect_stdout(io.StringIO()):
                main(["--help"], opener=fake, token_path=self.token_file)
        self.assertEqual(exc.exception.code, 0)
        self.assertFalse(fake.calls)

    def test_gates_fail_closed(self):
        fake = FakeOpener()
        rc, out = self.invoke(fake, ("--account-tag", ACCOUNT))
        self.assertEqual(rc, 2)
        self.assertFalse(fake.calls)
        self.assertIn("GATES_CLOSED", out)

    def test_single_account_guard(self):
        fake = FakeOpener()
        rc, out = self.invoke(fake, ("--stage-only-readonly", "--owner-approved",
                                     "--account-tag", "b"*32))
        self.assertEqual(rc, 2)
        self.assertFalse(fake.calls)
        self.assertIn("SCOPE_REJECTED", out)

    def test_private_file_mode_guard(self):
        fake = FakeOpener()
        self.token_file.chmod(0o644)
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 2)
        self.assertFalse(fake.calls)
        self.assertIn("TOKEN_UNSAFE", out)

    def test_one_bounded_stage_only_metadata_call(self):
        fake = FakeOpener(body([event()]))
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 0)
        self.assertEqual(len(fake.calls), 1)
        req, timeout = fake.calls[0]
        self.assertEqual(timeout, 8)
        self.assertEqual(req.full_url, "https://api.cloudflare.com/client/v4/graphql")
        self.assertEqual(req.get_method(), "POST")
        request = json.loads(req.data)
        self.assertEqual(request["variables"], {
            "accountTag": ACCOUNT, "stageAppId": _STAGE_APP,
            "datetimeStart": _START, "datetimeEnd": _END,
        })
        self.assertIn("orderBy: [datetime_ASC]", request["query"])
        self.assertIn("dimensions {\n          datetime\n          appId", request["query"])
        self.assertIn("limit: 20", request["query"])
        for forbidden in ("ipAddress", "userUuid", "orders", "firewallEvents", "httpRequestsAdaptive"):
            self.assertNotIn(forbidden, request["query"])
        self.assertEqual(json.loads(out)["resultCode"], "SERVER150_STAGE_APP_EVENTS_BUT_NO_TARGET_RAY")
        for private in (TOKEN, ACCOUNT, "FAKE_OTHER_RAY_NOT_FOR_OUTPUT",
                        "SENSITIVE_SERVICE_TOKEN_ID", "SENSITIVE_POLICY_ID", _STAGE_APP):
            self.assertNotIn(private, out)

    def test_http200_query_errors_are_not_empty_events(self):
        msg = "GraphQL variable error; SENSITIVE_EMAIL a@b.com"
        fake = FakeOpener({"errors": [{"message": msg}], "data": None})
        rc, out = self.invoke(fake)
        self.assertEqual(rc, 2)
        result = json.loads(out)
        self.assertEqual(result["resultCode"], "SERVER150_GRAPHQL_ERRORS_CLASSIFIED")
        self.assertEqual(result["errorCategory"], "GRAPHQL_VALIDATION")
        self.assertIsNone(result["appEventsCount"])
        self.assertIsNone(result["exactRayEvents"])
        self.assertNotIn(msg, out)

    def test_unknown_graphql_errors_redacted(self):
        result = sanitize(200, {"errors": [{"message": "EMAIL_SUPER_SECRET"}]})
        self.assertEqual(result["resultCode"], "SERVER150_GRAPHQL_ERRORS_CLASSIFIED")
        self.assertEqual(result["errorCategory"], "UNCLASSIFIED")
        self.assertNotIn("EMAIL_SUPER_SECRET", str(result))

    def test_403_is_not_event_evidence(self):
        rc, out = self.invoke(FakeOpener(http_status=403))
        self.assertEqual(rc, 2)
        self.assertIsNone(json.loads(out)["appEventsCount"])
        self.assertNotIn("RAW_ERROR_SHOULD_NOT_ESCAPE", out)

    def test_matching_ray_denied_only_metadata(self):
        result = sanitize(200, body([event(ray=_RAY)]))
        self.assertEqual(result["exactRayEvents"], 1)
        self.assertEqual(result["matchingRayOutcome"], "ACCESS_DENIED_EVENT_FOR_TARGET_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertEqual(result["ordersRead"], 0)

    def test_matching_ray_allowed_not_worker_proof(self):
        result = sanitize(200, body([event(ray=_RAY, success=1)]))
        self.assertEqual(result["matchingRayOutcome"], "ACCESS_ALLOWED_EVENT_FOR_TARGET_RAY")
        self.assertFalse(result["stageAccessAuthenticatedProven"])
        self.assertFalse(result["productionWorkerTouched"])

    def test_zero_events_must_be_unproven(self):
        result = sanitize(200, body([]))
        self.assertEqual(result["resultCode"], "SERVER150_NO_STAGE_APP_EVENTS_UNPROVEN")
        self.assertEqual(result["appEventsCount"], 0)
        self.assertFalse(result["stageAccessAuthenticatedProven"])

    def test_limit_reached_without_ray_is_inconclusive(self):
        result = sanitize(200, body([event() for _ in range(_LIMIT)]))
        self.assertTrue(result["partialLimitReached"])
        self.assertEqual(result["resultCode"], "SERVER150_LIMIT_REACHED_TARGET_RAY_UNVERIFIED")

    def test_foreign_stage_app_response_rejected(self):
        result = sanitize(200, body([event(app="PRODUCTION_APP_SHOULD_NOT_PRINT")]))
        self.assertEqual(result["resultCode"], "SERVER150_UNEXPECTED_OR_FOREIGN_EVENT")
        self.assertIsNone(result["appEventsCount"])
        self.assertNotIn("PRODUCTION_APP_SHOULD_NOT_PRINT", str(result))

    def test_out_of_window_rejected(self):
        result = sanitize(200, body([event(when="2026-10-22T15:00:00Z")]))
        self.assertEqual(result["resultCode"], "SERVER150_RESPONSE_TIME_OR_SHAPE_REJECTED")
        self.assertIsNone(result["appEventsCount"])

    def test_no_timestamp_rejected(self):
        row = event()
        del row["dimensions"]["datetime"]
        result = sanitize(200, body([row]))
        self.assertEqual(result["resultCode"], "SERVER150_RESPONSE_TIME_OR_SHAPE_REJECTED")

    def test_error_bucket_does_not_return_any_raw_input(self):
        for msg, expected in [
            ("Unauthorized", "PERMISSION"),
            ("too many requests", "QUOTA"),
            ("datetime ASC invalid", "TIME_OR_SORT"),
            ("Cannot query field u", "GRAPHQL_VALIDATION"),
            ("sensitive string ABC XYZ", "UNCLASSIFIED")
        ]:
            code = error_bucket([{"message": msg}])
            self.assertEqual(code, expected)
            self.assertNotIn(msg, code)

if __name__ == "__main__":
    unittest.main()
