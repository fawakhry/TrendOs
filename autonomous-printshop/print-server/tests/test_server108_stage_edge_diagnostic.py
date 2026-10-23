"""SERVER-108 tests use FakeTransport exclusively: no HTTP, Access secret or devices."""
import io
import sys
import unittest
from contextlib import redirect_stdout
from email.message import Message
from pathlib import Path
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path("autonomous-printshop/print-server/src").resolve()))
from server108_stage_edge_diagnostic import diagnose_stage_once, main

CLIENT_ID = "FAKE_STAGE_TEST_ID01234567890"
CLIENT_SECRET = "FAKE_STAGE_TEST_SECRET_01234567890"
GATES = {"enabled": True, "owner_authorized": True, "route_qualified": True}


def make_headers(*, ray="abcd1234abcd1234-AMS", ct="text/plain", mitigated=None):
    headers = Message()
    headers["CF-Ray"] = ray
    headers["Content-Type"] = ct
    if mitigated is not None:
        headers["CF-Mitigated"] = mitigated
    headers["X-Sensitive-Dummy"] = "DO_NOT_COPY_TO_REPORT"
    return headers


class FakeResponse:
    def __init__(self, status=204, headers=None):
        self.status = status
        self.headers = headers if headers is not None else make_headers()
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False
    def read(self, *_):
        raise AssertionError("NO BODY MAY BE READ")


class FakeTransport:
    def __init__(self, status=403, headers=None):
        self.status = status
        self.headers = headers if headers is not None else make_headers()
        self.requests = []
    def open(self, request, timeout):
        self.requests.append((request, timeout))
        if self.status == "NETWORK":
            raise URLError("fake NETWORK detail")
        if self.status >= 400:
            raise HTTPError(request.full_url, self.status, "Unauthorized fake",
                            self.headers, None)
        return FakeResponse(self.status, self.headers)


def run(fake, **flags):
    return diagnose_stage_once(client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
                               opener=fake, **flags)


class Server108Tests(unittest.TestCase):
    def test_no_network_by_default_or_partial_owner_gates(self):
        t = FakeTransport()
        for flags in ({}, {"enabled": True}, {"owner_authorized": True},
                      {"enabled": True, "owner_authorized": True}):
            out = run(t, **flags)
            self.assertEqual(out["resultCode"], "SERVER95_STAGE_ROUTE_OR_OWNER_GATE_CLOSED")
            self.assertEqual(out["outboundHttpsGets"], 0)
        self.assertFalse(t.requests)

    def test_one_stage_root_get_403_capture_without_body_or_secret(self):
        t = FakeTransport()
        out = run(t, **GATES)
        self.assertEqual(out["status"], 403)
        self.assertEqual(out["cfRay"], "abcd1234abcd1234-AMS")
        self.assertEqual(out["contentType"], "text/plain")
        self.assertTrue(out["stageProbeReturned"])  # SERVER-95 returns a bounded 403 status, NOT auth proof
        self.assertFalse(out["accessAuthenticatedProven"])
        self.assertEqual(len(t.requests), 1)
        req, timeout = t.requests[0]
        self.assertEqual(req.full_url,
                         "https://trendos-server68-isolated-stage.trendmall-contact.workers.dev/")
        self.assertEqual(req.get_method(), "GET")
        self.assertEqual(timeout, 5)
        self.assertIsNone(req.get_header("Authorization"))
        self.assertEqual(req.get_header("Cf-access-client-id"), CLIENT_ID)
        self.assertEqual(req.get_header("Cf-access-client-secret"), CLIENT_SECRET)
        for forbidden in (CLIENT_ID, CLIENT_SECRET, "DO_NOT_COPY_TO_REPORT"):
            self.assertNotIn(forbidden, str(out))

    def test_dont_claim_200_as_access_or_order_auth(self):
        out = run(FakeTransport(200), **GATES)
        self.assertEqual(out["status"], 200)
        self.assertTrue(out["stageProbeReturned"])
        self.assertFalse(out["accessAuthenticatedProven"])
        self.assertEqual(out["ordersRead"], 0)
        self.assertFalse(out["printerOrLaserCommands"])
        self.assertFalse(out["productionTouched"])

    def test_reject_untrusted_ray_and_do_not_return_raw_headers(self):
        headers = make_headers(ray="FAKE_SECRET_SHOULD_NOT_PRINT",
                               ct="image/png", mitigated="challenge")
        out = run(FakeTransport(403, headers), **GATES)
        self.assertIsNone(out["cfRay"])
        self.assertEqual(out["contentType"], "other")
        self.assertTrue(out["cfMitigatedChallenge"])
        self.assertNotIn("FAKE_SECRET_SHOULD_NOT_PRINT", str(out))
        self.assertNotIn("DO_NOT_COPY_TO_REPORT", str(out))

    def test_302_metadata_is_returned_but_not_success(self):
        out = run(FakeTransport(302), **GATES)
        self.assertEqual(out["status"], 302)
        self.assertEqual(out["resultCode"], "SERVER95_STAGE_HTTP_RESPONSE_UNVERIFIED")
        self.assertFalse(out["accessAuthenticatedProven"])

    def test_invalid_secret_rejected_pre_request_and_never_echoed(self):
        fake = FakeTransport()
        out = diagnose_stage_once(client_id=CLIENT_ID, client_secret="NOT VALID\nSECRET",
                                  opener=fake, **GATES)
        self.assertEqual(out["outboundHttpsGets"], 0)
        self.assertEqual(out["resultCode"], "SERVER95_INVALID_ACCESS_SECRET")
        self.assertNotIn("NOT VALID", str(out))
        self.assertEqual(fake.requests, [])

    def test_transport_error_never_leaks_fake_exception(self):
        out = run(FakeTransport("NETWORK"), **GATES)
        self.assertEqual(out["resultCode"], "SERVER95_STAGE_TRANSPORT_FAILED")
        self.assertIsNone(out["status"])
        self.assertFalse(out["accessAuthenticatedProven"])
        self.assertNotIn("fake NETWORK", str(out))

    def test_cli_no_flags_returns_before_prompt_network(self):
        s = io.StringIO()
        with redirect_stdout(s):
            rc = main([])
        self.assertEqual(rc, 2)
        self.assertIn("SERVER108_STAGE_OR_OWNER_GATES_CLOSED", s.getvalue())


if __name__ == "__main__":
    unittest.main()
