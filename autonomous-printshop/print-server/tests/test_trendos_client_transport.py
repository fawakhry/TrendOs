import threading
import time
import unittest
from unittest import mock

import requests

from src.config import DEFAULT_CONFIG
from src.trendos_client import TrendOSError, TrendOSReadClient


class _Resp:
    status_code = 200
    def json(self):
        return {
            "success": True,
            "user": {"username": "employee", "token": "tok"},
            "expiresAt": "2099-01-01T00:00:00Z",
        }


class TrendOSClientTransportTests(unittest.TestCase):
    def client(self):
        return TrendOSReadClient({"trendos": dict(DEFAULT_CONFIG["trendos"])})

    def test_browser_compatible_user_agent_is_sent(self):
        client = self.client()
        seen = {}

        def fake_request(method, url, **kwargs):
            seen["method"] = method
            seen["ua"] = kwargs["headers"]["User-Agent"]
            seen["timeout"] = kwargs["timeout"]
            return _Resp()

        with mock.patch("requests.request", side_effect=fake_request):
            client.login("employee", "secret")

        self.assertEqual("POST", seen["method"])
        self.assertIn("Mozilla/5.0", seen["ua"])
        self.assertIn("TrendOS-Print-Server/0.3", seen["ua"])
        self.assertEqual(5, seen["timeout"][0])

    def test_background_login_does_not_block_local_server_path(self):
        client = self.client()
        entered = threading.Event()
        release = threading.Event()
        callback = threading.Event()

        def slow_login(username, password):
            entered.set()
            release.wait(2)
            return {
                "username": username,
                "token": "tok",
                "user": {"username": username},
                "expiresAt": "",
            }

        with mock.patch.object(client, "_perform_login", side_effect=slow_login):
            started = time.time()
            result = client.begin_login("employee", "secret", callback.set)
            elapsed = time.time() - started

            self.assertTrue(result["accepted"])
            self.assertLess(elapsed, 0.5)
            self.assertTrue(entered.wait(1))
            self.assertEqual("PENDING", client.status()["loginState"])

            release.set()
            self.assertTrue(callback.wait(1))
            self.assertTrue(client.status()["connected"])
            self.assertEqual("CONNECTED", client.status()["loginState"])

    def test_timeout_becomes_diagnostic_error(self):
        client = self.client()
        with mock.patch("requests.request", side_effect=requests.exceptions.Timeout()):
            with self.assertRaises(TrendOSError) as ctx:
                client.probe()
        self.assertIn("TRENDOS_NETWORK_TIMEOUT", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
