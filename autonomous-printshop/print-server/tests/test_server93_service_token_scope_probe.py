"""SERVER-93: all tests use fake Access responses, no Internet or secrets."""
import importlib.util
import io
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location(
    "s93", Path("autonomous-printshop/print-server/tools/server93_service_token_scope_probe.py"))
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)
ACCOUNT = "a" * 32
FAKE = "LOCAL_FAKE_ACCESS_TOKEN_NEVER_REAL_123456789"

class Response:
    status = 200
    def __init__(self, payload):
        self.data = io.BytesIO(json.dumps(payload).encode())
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.data.close()
    def read(self, n):
        return self.data.read(n)

class FakeOpener:
    def __init__(self, denied=False, page=1):
        self.calls = []
        self.denied = denied
        self.page = page
    def open(self, req, timeout):
        self.calls.append(req)
        assert req.get_method() == "GET"
        assert timeout == 15
        assert req.full_url == (
            "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT +
            "/access/service_tokens?page=1&per_page=100")
        assert req.get_header("Authorization") == "Bearer " + FAKE
        if self.denied:
            raise HTTPError(req.full_url, 403, "Forbidden", {}, None)
        return Response({
            "success": True,
            "result": [{"name": "PRIVATE_DONT_PRINT_SERVICE",
                        "client_id": "PRIVATE_DONT_PRINT_ID",
                        "id": "PRIVATE_DONT_PRINT_UUID"}],
            "result_info": {"total_pages": self.page}
        })

class TestProbe(unittest.TestCase):
    def test_api_read_ok_never_claims_usable_machine_credential(self):
        fake = FakeOpener()
        report = s.get_status(ACCOUNT, FAKE, fake)
        self.assertEqual(report["readServiceTokenInventory"], "GET_OK")
        self.assertFalse(report["machineServiceTokenCreated"])
        self.assertFalse(report["stageGo"])
        self.assertEqual(len(fake.calls), 1)
        payload = json.dumps(report)
        for secret in ("PRIVATE_DONT_PRINT_SERVICE","PRIVATE_DONT_PRINT_ID",
                       "PRIVATE_DONT_PRINT_UUID", FAKE, ACCOUNT):
            self.assertNotIn(secret, payload)

    def test_access_read_denied_is_visible_as_scope_blocker(self):
        report = s.get_status(ACCOUNT, FAKE, FakeOpener(denied=True))
        self.assertTrue(report["missingReadPrivilegeLikely"])
        self.assertEqual(report["readServiceTokenInventory"], "PERMISSION_NOT_VERIFIED")
        self.assertFalse(report["stageGo"])

    def test_incomplete_page_fails_closed(self):
        with self.assertRaisesRegex(s.Blocked, "PAGINATION_INCOMPLETE"):
            s.get_status(ACCOUNT, FAKE, FakeOpener(page=2))

    def test_invalid_credentials_before_network(self):
        with self.assertRaises(s.Blocked):
            s.get_status("BAD", FAKE, FakeOpener())
        with self.assertRaises(s.Blocked):
            s.get_status(ACCOUNT, "bad", FakeOpener())

    def test_run_requires_explicit_read_only_approval(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(s.main(["--get-only"]), 2)
            self.assertEqual(s.main([]), 64)

if __name__ == "__main__":
    unittest.main()
