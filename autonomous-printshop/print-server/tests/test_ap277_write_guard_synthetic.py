"""AP-277: fail-closed synthetic local HTTP mutation authorization regression tests.

No production config, passwords, real platform calls, printers, or customer data.
Only temporary paths and an ephemeral loopback listener are used.
"""
from __future__ import annotations

import http.client
import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

from offline_pilot import offline_config
from src.server import PrintServerApp, make_handler, main


TEST_TOKEN = "AP277_SYNTHETIC_OPERATOR_TOKEN_NOT_A_REAL_SECRET_2026"


class AP277LocalWriteGuard(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap277-no-customer-data-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.cfg = offline_config(self.root)
        self.app = PrintServerApp(
            self.cfg, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "config.json",
            write_token=TEST_TOKEN,
        )
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.app))
        self.server.daemon_threads = True
        self.worker = threading.Thread(
            target=self.server.serve_forever, kwargs={"poll_interval": 0.05},
            daemon=True,
        )
        self.worker.start()
        self.addCleanup(self._close)

    def _close(self):
        self.server.shutdown()
        self.worker.join(timeout=2)
        self.server.server_close()
        self.assertFalse(self.worker.is_alive())

    def request(self, method="POST", path="/api/events/order-claimed", *,
                token=None, origin=None, host=None, fetch_site=None,
                content_type="application/json"):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        headers = {"Content-Type": content_type}
        if token is not None:
            headers["X-TrendOS-Write-Token"] = token
        if origin is not None:
            headers["Origin"] = origin
        if host is not None:
            headers["Host"] = host
        if fetch_site is not None:
            headers["Sec-Fetch-Site"] = fetch_site
        body = json.dumps({"order": {
            "orderId": "TEST277", "customerName": "FAKE",
            "lines": [{"lineId": "FAKE-1"}],
        }}).encode("utf-8")
        try:
            conn.request(method, path, body=body if method == "POST" else None, headers=headers)
            response = conn.getresponse()
            data = response.read(65536)
            return response.status, json.loads(data) if data else {}, dict(response.getheaders())
        finally:
            conn.close()

    def test_no_configured_write_token_is_locked(self):
        self.app.write_token = ""
        status, payload, _ = self.request(token=TEST_TOKEN)
        self.assertEqual((status, payload["error"]), (403, "LOCAL_WRITES_LOCKED"))
        self.assertEqual(self.app.state.orders(), [])
        self.assertFalse((self.root / "orders" / "TEST277").exists())

    def test_missing_token_fails_without_files(self):
        status, payload, _ = self.request()
        self.assertEqual((status, payload["error"]), (403, "LOCAL_WRITE_TOKEN_REQUIRED"))
        self.assertEqual(self.app.state.orders(), [])

    def test_wrong_token_fails(self):
        status, payload, _ = self.request(token="WRONG"*10)
        self.assertEqual((status, payload["error"]), (403, "LOCAL_WRITE_TOKEN_REQUIRED"))
        self.assertEqual(self.app.state.orders(), [])

    def test_cross_origin_fails_even_with_valid_token(self):
        status, payload, _ = self.request(token=TEST_TOKEN, origin="https://evil.example")
        self.assertEqual((status, payload["error"]), (403, "UNTRUSTED_ORIGIN"))
        self.assertEqual(self.app.state.orders(), [])

    def test_untrusted_host_fails_even_with_valid_token(self):
        status, payload, _ = self.request(token=TEST_TOKEN, host="bad.example")
        self.assertEqual((status, payload["error"]), (403, "UNTRUSTED_LOCAL_HOST"))
        self.assertEqual(self.app.state.orders(), [])

    def test_browser_cross_site_header_rejected(self):
        status, payload, _ = self.request(token=TEST_TOKEN, fetch_site="cross-site")
        self.assertEqual((status, payload["error"]), (403, "CROSS_SITE_WRITE_BLOCKED"))

    def test_simple_form_content_type_fails(self):
        status, payload, _ = self.request(token=TEST_TOKEN, content_type="text/plain")
        self.assertEqual((status, payload["error"]), (415, "JSON_CONTENT_TYPE_REQUIRED"))
        self.assertEqual(self.app.state.orders(), [])

    def test_authorized_synthetic_post_succeeds(self):
        origin = f"http://127.0.0.1:{self.server.server_port}"
        status, payload, _ = self.request(
            token=TEST_TOKEN, origin=origin, fetch_site="same-origin"
        )
        self.assertEqual(status, 201)
        self.assertEqual(payload["result"]["orderId"], "TEST277")
        self.assertTrue(Path(payload["result"]["folder"]).resolve().is_relative_to(self.root))

    def test_probe_only_exposes_write_access_state_not_token(self):
        status, payload, _ = self.request("GET", "/api/status")
        self.assertEqual(status, 200)
        self.assertEqual(payload["localWriteAccess"], "TOKEN_GATED")
        self.assertNotIn(TEST_TOKEN, json.dumps(payload))

    def test_cross_origin_preflight_receives_no_cors_permission(self):
        status, _payload, headers = self.request("OPTIONS", "/api/events/order-claimed",
                                                 origin="https://evil.example")
        self.assertEqual(status, 204)
        self.assertNotIn("Access-Control-Allow-Origin", headers)
        self.assertEqual(self.app.state.orders(), [])

    def test_all_write_endpoints_guarded_before_parsing_body(self):
        endpoints = (
            "/api/trendos/login", "/api/trendos/logout", "/api/trendos/sync",
            "/api/settings/orders-root", "/api/settings/orders-root/select",
            "/api/orders/manual-folder", "/api/orders/open-folder",
            "/api/events/order-claimed", "/api/events/structured-approval",
        )
        for path in endpoints:
            with self.subTest(path=path):
                status, payload, _ = self.request(path=path)
                self.assertEqual(status, 403)
                self.assertEqual(payload["error"], "LOCAL_WRITE_TOKEN_REQUIRED")
        self.assertEqual(self.app.state.orders(), [])

    def test_default_live_entrypoint_fails_before_server_or_network(self):
        # Safe: main() rejects default live capabilities before constructing
        # PrintServerApp, opening a socket, polling, or touching shop devices.
        config = self.root / "live-default-test.json"
        config.write_text("{}", encoding="utf-8")
        with mock.patch.dict(os.environ, {"TRENDOS_PRINTSHOP_ALLOW_LIVE": ""}):
            with self.assertRaisesRegex(RuntimeError, "AP277_LIVE_CAPABILITIES_BLOCKED"):
                main(["--config", str(config), "--no-browser"])
        self.assertEqual(self.app.state.orders(), [])


if __name__ == "__main__":
    unittest.main()
