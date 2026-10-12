"""Synthetic tests for AP-247; never call Print Server's default main()."""
import ast
import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path

from src.server import PrintServerApp
from offline_pilot import check_status, offline_config, pilot_handler
from http.server import ThreadingHTTPServer


class OfflinePilotTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap247-ci-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.cfg = offline_config(self.root)
        self.app = PrintServerApp(self.cfg, self.root)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), pilot_handler(self.app))
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
        self.thread.start()
        self.addCleanup(self._stop)

    def _stop(self):
        self.server.shutdown()
        self.thread.join(timeout=2)
        self.server.server_close()
        self.assertFalse(self.thread.is_alive())

    def request(self, method, path, body=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_address[1], timeout=2)
        try:
            conn.request(method, path, body=body)
            r = conn.getresponse()
            return r.status, r.read(32768)
        finally:
            conn.close()

    def test_local_live_http_status(self):
        check_status(self.server.server_address[1])
        status, data = self.request("GET", "/api/status")
        self.assertEqual(status, 200)
        body = json.loads(data)
        self.assertEqual(body["service"], "TrendOS Print Server")
        self.assertEqual(body["trendosReadAdapter"], "DISABLED")
        self.assertFalse(body["bridge"]["running"])
        self.assertFalse(body["fastMode"]["enabled"])
        self.assertFalse(body["platformBusinessWrites"])

    def test_all_synthetic_paths(self):
        for key in ("ordersRoot", "readyRoot", "stateRoot"):
            self.assertTrue(Path(self.cfg["paths"][key]).is_relative_to(self.root))
        self.assertTrue(self.cfg["server"]["host"] == "127.0.0.1")
        self.assertFalse(self.cfg["trendos"]["enabled"])
        self.assertEqual(self.cfg["trendos"]["baseUrl"], "")
        self.assertFalse(self.cfg["fastMode"]["enabled"])

    def test_read_only_methods_block(self):
        for method in ("POST", "PUT", "PATCH", "DELETE", "OPTIONS"):
            with self.subTest(method=method):
                code, raw = self.request(method, "/api/events/order-claimed", '{}')
                self.assertEqual(code, 403)
                self.assertEqual(json.loads(raw)["error"], "OFFLINE_PILOT_ROUTE_BLOCKED")
        self.assertEqual(self.app.state.orders(), [])

    def test_risky_get_routes_blocked(self):
        for path in ("/api/trendos/probe", "/api/preview?path=/etc/passwd", "/api/order-files?orderId=42", "/api/unknown"):
            with self.subTest(path=path):
                code, raw = self.request("GET", path)
                self.assertEqual(code, 403)
                self.assertEqual(json.loads(raw)["error"], "OFFLINE_PILOT_ROUTE_BLOCKED")

    def test_synthetic_read_api(self):
        for path in ("/api/orders", "/api/state", "/api/settings"):
            with self.subTest(path=path):
                code, raw = self.request("GET", path)
                self.assertEqual(code, 200)
                self.assertTrue(json.loads(raw)["ok"])

    def test_invalid_cli_args_rejected_without_start(self):
        from offline_pilot import main
        with self.assertRaises(SystemExit):
            main(["--host=0.0.0.0"])

    def test_finite_lifetime_self_probes_then_stops(self):
        import contextlib
        import io
        from unittest.mock import patch
        from offline_pilot import main
        stream = io.StringIO()
        with patch("offline_pilot.PILOT_SECONDS", 0.04), contextlib.redirect_stdout(stream):
            main([])
        self.assertIn("AP247_OFFLINE_UI_READY=http://127.0.0.1:", stream.getvalue())
        self.assertIn("AP247_OFFLINE_UI_STOPPED=YES; TEMP_CLEANED=YES", stream.getvalue())

    def test_source_has_no_default_main_import_or_cloud_probe(self):
        source = Path(__file__).resolve().parents[1] / "offline_pilot.py"
        ast.parse(source.read_text(encoding="utf-8"))
        contents = source.read_text(encoding="utf-8")
        self.assertNotIn("run.py", contents.split("\ndef main(")[1])
        self.assertNotIn(".probe(", contents)
        self.assertNotIn(".start()\n", contents.split("def main(")[1].split("if __name__")[0].replace("service.start()\n", ""))


if __name__ == "__main__":
    unittest.main(verbosity=2)
