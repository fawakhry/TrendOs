"""SERVER-146 fake-only tests; never contact a Cloudflare endpoint."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from server146_access_schema_preflight import (
    _ACCOUNT_TAG, _QUERY, sanitize, main,
)

FAKE_TOKEN = "FAKE_TEST_TOKEN_NO_SECRET_1234567890"
REQ_FILTERS = ("appId", "datetime_geq", "datetime_leq", "cfRayId")
REQ_DIMS = ("appId", "cfRayId", "isSuccessfulLogin", "serviceTokenId", "approvingPolicyId")


def schema_payload(filters=REQ_FILTERS, dims=REQ_DIMS):
    return {"data": {
        "filterType": {
            "name": "AccountAccessLoginRequestsAdaptiveGroupsFilter_InputObject",
            "inputFields": [{"name": name} for name in filters],
        },
        "dimensionsType": {
            "name": "AccountAccessLoginRequestsAdaptiveGroupsDimensions",
            "fields": [{"name": name} for name in dims],
        },
    }, "errors": None}


class FakeResponse:
    status = 200

    def __init__(self, data): self.data = data
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, size): return json.dumps(self.data).encode()


class FakeOpener:
    def __init__(self, payload=None, status=200):
        self.payload = payload if payload is not None else schema_payload()
        self.status = status
        self.calls = []

    def open(self, req, timeout):
        self.calls.append((req, timeout))
        if self.status >= 400:
            raise HTTPError(req.full_url, self.status, "PRIVATE_API_ERROR", {}, None)
        return FakeResponse(self.payload)


class TestServer146(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.directory = Path(self.tmp.name) / "private"
        self.directory.mkdir(mode=0o700)
        self.token = self.directory / "token"
        self.token.write_text(FAKE_TOKEN)
        self.token.chmod(0o600)

    def run_case(self, opener, *args):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            status = main(list(args), opener=opener, token_path=self.token)
        return status, buf.getvalue()

    def args(self):
        return ("--stage-only-readonly", "--owner-approved", "--account-tag", _ACCOUNT_TAG)

    def test_help_is_local_and_does_not_read_secret(self):
        opener = FakeOpener()
        out = io.StringIO()
        with contextlib.redirect_stdout(out), self.assertRaises(SystemExit) as caught:
            main(["--help"], opener=opener, token_path=self.token)
        self.assertEqual(caught.exception.code, 0)
        self.assertEqual(opener.calls, [])
        self.assertIn("SERVER-146", out.getvalue())

    def test_owner_gates_prevent_requests(self):
        opener = FakeOpener()
        for argv in ((), ("--owner-approved",), ("--stage-only-readonly",)):
            status, text = self.run_case(opener, *argv)
            self.assertEqual(status, 2)
            self.assertIn("GATES_CLOSED", text)
        self.assertEqual(opener.calls, [])

    def test_exact_single_account_gate(self):
        opener = FakeOpener()
        status, text = self.run_case(opener, "--stage-only-readonly", "--owner-approved",
                                     "--account-tag", "b"*32)
        self.assertEqual(status, 2)
        self.assertIn("SCOPE_REJECTED", text)
        self.assertEqual(opener.calls, [])

    def test_private_file_mode_check(self):
        opener = FakeOpener()
        self.token.chmod(0o644)
        status, text = self.run_case(opener, *self.args())
        self.assertEqual(status, 2)
        self.assertEqual(opener.calls, [])
        self.assertIn("UNSAFE", text)

    def test_query_is_schema_only_and_output_has_no_credential_or_event(self):
        opener = FakeOpener()
        code, output = self.run_case(opener, *self.args())
        self.assertEqual(code, 0)
        self.assertEqual(len(opener.calls), 1)
        req, timeout = opener.calls[0]
        self.assertEqual(req.full_url, "https://api.cloudflare.com/client/v4/graphql")
        self.assertEqual(req.get_method(), "POST")
        self.assertEqual(timeout, 8)
        self.assertEqual(req.get_header("Authorization"), "Bearer " + FAKE_TOKEN)
        submitted = json.loads(req.data)
        self.assertEqual(submitted["variables"], {})
        self.assertIn("__type(", submitted["query"])
        for forbidden in ("accessLoginRequestsAdaptiveGroups(", "ipAddress", "userUuid",
                          "worker", "orders", "firewallEvents"):
            self.assertNotIn(forbidden, submitted["query"])
        response = json.loads(output)
        self.assertTrue(response["schemaIntrospectionAvailable"])
        self.assertTrue(response["stageAppFilterSupported"])
        self.assertTrue(response["datetimeBoundsSupported"])
        self.assertTrue(response["rayFilterSupported"])
        self.assertTrue(response["stageAppDimensionSupported"])
        self.assertTrue(response["minimumDecisionFieldsSupported"])
        self.assertFalse(response["canExplainPreviousGraphqlError"])
        self.assertEqual(response["eventsQueried"], 0)
        self.assertEqual(response["ordersRead"], 0)
        self.assertFalse(response["productionWorkerTouched"])
        self.assertFalse(response["printerOrLaserCommands"])
        self.assertNotIn(FAKE_TOKEN, output)
        self.assertNotIn(_ACCOUNT_TAG, output)

    def test_missing_filter_schema_clearly_flagged(self):
        value = sanitize(200, schema_payload(filters=("cfRayId", "datetime_geq", "datetime_leq")))
        self.assertEqual(value["resultCode"], "SERVER146_SCHEMA_FIELDS_MISSING")
        self.assertFalse(value["stageAppFilterSupported"])
        self.assertTrue(value["schemaIntrospectionAvailable"])

    def test_missing_dimension_schema_flagged(self):
        value = sanitize(200, schema_payload(dims=("cfRayId", "serviceTokenId", "approvingPolicyId")))
        self.assertEqual(value["resultCode"], "SERVER146_SCHEMA_FIELDS_MISSING")
        self.assertFalse(value["minimumDecisionFieldsSupported"])

    def test_graphql_error_is_redacted(self):
        value = sanitize(200, {"errors": [{"message": "PRIVATE_USER_IDENTIFIERS"}], "data": None})
        self.assertEqual(value["resultCode"], "SERVER146_SCHEMA_INTROSPECTION_ERRORS_REDACTED")
        self.assertNotIn("PRIVATE_USER_IDENTIFIERS", str(value))
        self.assertFalse(value["schemaIntrospectionAvailable"])

    def test_unknown_type_fails_closed(self):
        value = sanitize(200, {"data": {"filterType": None, "dimensionsType": None}})
        self.assertEqual(value["resultCode"], "SERVER146_SCHEMA_TYPE_NOT_FOUND_OR_UNEXPECTED")

    def test_http_403_must_not_claim_schema_result(self):
        opener = FakeOpener(status=403)
        status, output = self.run_case(opener, *self.args())
        self.assertEqual(status, 2)
        self.assertEqual(json.loads(output)["resultCode"], "SERVER146_SCHEMA_API_AUTH_OR_PERMISSION_FAILURE")
        self.assertNotIn("PRIVATE_API_ERROR", output)

    def test_no_full_schema_copied_to_output(self):
        value = sanitize(200, schema_payload(filters=(*REQ_FILTERS, "PRIVATE_EXTENSIBLE_FIELD_NAME")))
        self.assertTrue(value["schemaIntrospectionAvailable"])
        self.assertNotIn("PRIVATE_EXTENSIBLE_FIELD_NAME", str(value))


if __name__ == "__main__":
    unittest.main()
