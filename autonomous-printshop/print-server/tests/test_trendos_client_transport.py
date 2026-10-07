import json
import unittest
from unittest import mock

from src.config import DEFAULT_CONFIG
from src.trendos_client import TrendOSReadClient


class _Resp:
    status = 200
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self):
        return json.dumps({
            "success": True,
            "user": {"username": "employee", "token": "tok"}
        }).encode("utf-8")


class TrendOSClientTransportTests(unittest.TestCase):
    def test_browser_compatible_user_agent_is_sent(self):
        cfg = {"trendos": dict(DEFAULT_CONFIG["trendos"])}
        client = TrendOSReadClient(cfg)
        seen = {}
        def fake_open(req, timeout=0):
            seen["ua"] = req.get_header("User-agent")
            seen["content_type"] = req.get_header("Content-type")
            return _Resp()
        with mock.patch("urllib.request.urlopen", side_effect=fake_open):
            client.login("employee", "secret")
        self.assertIn("Mozilla/5.0", seen["ua"])
        self.assertIn("TrendOS-Print-Server/0.2", seen["ua"])
        self.assertIn("application/json", seen["content_type"])


if __name__ == "__main__":
    unittest.main()
