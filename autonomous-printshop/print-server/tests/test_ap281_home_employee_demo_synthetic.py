"""AP-281 disposable home staff walkthrough: hosted-only synthetic contract.

Intentionally no customer, printer, TrendOS account, Ubuntu owner or production
resources. Tests a real ephemeral loopback listener, not just a mock method.
"""
from __future__ import annotations

import contextlib
import http.client
import io
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock
from urllib.parse import quote

import employee_home_demo as demo
from offline_pilot import offline_config


class AP281HomeStaffDemo(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap281-hosted-fake-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.cfg = offline_config(self.root)
        self.app = demo.SyntheticEmployeeApp(
            self.cfg, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "fake-only-config.json",
            write_token="",
        )
        demo.seed_synthetic_orders(self.app, self.root)
        self.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), demo.employee_demo_handler(self.app)
        )
        self.server.daemon_threads = True
        self.worker = threading.Thread(
            target=self.server.serve_forever, kwargs={"poll_interval": 0.05},
            daemon=True,
        )
        self.worker.start()
        self.addCleanup(self.close)

    def close(self):
        self.server.shutdown()
        self.worker.join(timeout=2)
        self.server.server_close()
        self.assertFalse(self.worker.is_alive())

    def request(self, method, path, body=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            conn.request(
                method, path, body=body,
                headers={"Content-Type": "application/json"} if body else {},
            )
            response = conn.getresponse()
            return response.status, response.read(65536), dict(response.getheaders())
        finally:
            conn.close()

    def test_operator_sees_two_fake_orders_and_action_categories(self):
        status, raw, _ = self.request("GET", "/api/employee/queue")
        self.assertEqual(status, 200)
        result = json.loads(raw)
        self.assertEqual(result["summary"], {
            "localOrders": 2, "needsManualFolder": 1, "folderSelected": 1,
        })
        self.assertEqual(
            [x["orderId"] for x in result["items"]],
            ["DEMO-281-001", "DEMO-281-002"],
        )
        self.assertFalse(result["authoritativeTrendOSStatus"])
        self.assertFalse(result["designApprovalVerified"])
        self.assertFalse(result["physicalPrintingVerified"])

    def test_demo_report_is_locked_cloud_off_and_no_print_authority(self):
        status, raw, _ = self.request("GET", "/api/status")
        self.assertEqual(status, 200)
        out = json.loads(raw)
        self.assertTrue(out["demoMode"])
        self.assertEqual(out["localWriteAccess"], "LOCKED")
        self.assertEqual(out["trendosReadAdapter"], "DISABLED")
        self.assertFalse(out["trendos"]["connected"])
        self.assertFalse(out["bridge"]["running"])
        self.assertFalse(out["fastMode"]["enabled"])
        self.assertFalse(out["platformBusinessWrites"])

    def test_fake_dashboard_and_static_assets_load(self):
        for path in ("/", "/static/app.js", "/static/styles.css"):
            with self.subTest(path=path):
                status, data, _ = self.request("GET", path)
                self.assertEqual(status, 200)
                self.assertGreater(len(data), 100)
                if path == "/":
                    self.assertIn(b"demoModeBanner", data)
                if path.endswith("app.js"):
                    self.assertIn(b"status.demoMode", data)

    def test_fake_order_click_file_listing_and_preview(self):
        for order in ("DEMO-281-001", "DEMO-281-002"):
            with self.subTest(order=order):
                status, raw, _ = self.request(
                    "GET", "/api/order-files?orderId=" + order
                )
                self.assertEqual(status, 200)
                files = json.loads(raw)["files"]
                if order.endswith("002"):
                    self.assertEqual(len(files), 1)
                    self.assertEqual(files[0]["name"], "demo-sample.png")
                    self.assertTrue(
                        Path(files[0]["fullPath"]).is_relative_to(self.root)
                    )
                    url = "/api/preview?path=" + quote(files[0]["fullPath"], safe="")
                    preview_status, image, _ = self.request("GET", url)
                    self.assertEqual(preview_status, 200)
                    self.assertTrue(image.startswith(b"\\x89PNG\\r\\n\\x1a\\n"))
                else:
                    self.assertEqual(files, [])

    def test_all_write_and_preflight_methods_are_forbidden(self):
        endpoints = (
            "/api/events/order-claimed",
            "/api/orders/manual-folder",
            "/api/events/structured-approval",
            "/api/trendos/login",
            "/api/settings/orders-root",
        )
        before = self.app.state.snapshot()
        for path in endpoints:
            with self.subTest(path=path):
                status, raw, _ = self.request("POST", path, b'{"fake":true}')
                self.assertEqual(status, 403)
                self.assertEqual(json.loads(raw)["error"], "AP281_DEMO_GET_ONLY")
        for method in ("PUT", "PATCH", "DELETE", "OPTIONS"):
            with self.subTest(method=method):
                status, _, _ = self.request(method, "/api/orders")
                self.assertEqual(status, 403)
        self.assertEqual(before, self.app.state.snapshot())

    def test_cloud_login_probe_and_state_dump_are_not_exposed(self):
        for path in (
            "/api/trendos/probe", "/api/state",
            "/api/order-files?orderId=NOT_FAKE",
            "/api/preview?path=/etc/passwd",
            "/api/preview?path=/etc/demo-sample.png",
            "/api/debug", "/api/settings/orders-root",
        ):
            with self.subTest(path=path):
                status, _, _ = self.request("GET", path)
                self.assertEqual(status, 403)

    def test_no_data_outside_disposable_root_was_written(self):
        self.assertFalse(self.app.trendos.enabled)
        self.assertFalse(self.app.bridge.status()["running"])
        self.assertFalse(self.app.fast_mode.status()["enabled"])
        self.assertFalse((self.root / "fake-only-config.json").exists())
        for order in self.app.state.orders():
            self.assertTrue(Path(order["folder"]).is_relative_to(self.root))
        self.assertEqual(len(self.app.state.orders()), 2)

    def test_auto_stop_cleanup_receipt_in_bounded_main(self):
        output = io.StringIO()
        with mock.patch.object(demo, "DEMO_SECONDS", 0.025):
            with contextlib.redirect_stdout(output):
                demo.main([])
        result = output.getvalue()
        self.assertIn("AP281_EMPLOYEE_DEMO_READY=http://127.0.0.1:", result)
        self.assertIn("AUTO_STOP_SECONDS=0.025", result)
        self.assertIn("AP281_EMPLOYEE_DEMO_STOPPED=YES", result)
        self.assertIn("TEMP_CLEANED=YES", result)
        self.assertIn("PRINTING=OFF", result)

    def test_no_unsupported_launch_arguments_accepted(self):
        with self.assertRaisesRegex(SystemExit, "AP281_UNSUPPORTED_ARGUMENTS"):
            demo.main(["--live"])
        with self.assertRaisesRegex(SystemExit, "AP281_UNSUPPORTED_ARGUMENTS"):
            demo.main(["--config", "/anything"])

    def test_operators_cannot_trigger_real_workflow_from_demo(self):
        # In training mode all actionable controls are locally locked in JS;
        # backend remains authoritative and denies every non-GET method.
        script = (
            Path(__file__).resolve().parents[1] / "public" / "app.js"
        ).read_text(encoding="utf-8")
        self.assertIn("status.demoMode === true", script)
        self.assertIn("button.disabled=true", script)
        self.assertIn("lastStatus?.demoMode", script)


if __name__ == "__main__":
    unittest.main()
