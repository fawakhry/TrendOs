"""AP-276: hosted-only *existing production components* E2E, synthetic data.

Tests real PrintServerApp/TrendOSStatusBridge/manual folders/approval/HTTP over
one disposable loopback listener with fake platform rows, no prod config or
remote calls. This does NOT authorize real API endpoints or any printer use.
"""
from __future__ import annotations

import copy
import http.client
import json
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

from offline_pilot import offline_config
from src.folders import file_sha256
from src.server import PrintServerApp, make_handler


class FakeReadOnlyRows:
    def __init__(self):
        self.connected = True
        self.rows = []

    def get_rows(self, screen):
        if screen != "print":
            raise AssertionError("UNEXPECTED_PLATFORM_SCREEN")
        return {"success": True, "rows": copy.deepcopy(self.rows)}


class AP276OperationalFlow(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap276-synthetic-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.cfg = offline_config(self.root)
        self.cfg["trendos"]["pollScreens"] = ["print"]
        self.app = PrintServerApp(
            self.cfg, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "local.json",
        )
        self.fake = FakeReadOnlyRows()
        self.app.bridge.client = self.fake
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.app))
        self.server.daemon_threads = True
        self.worker = threading.Thread(
            target=self.server.serve_forever, kwargs={"poll_interval": 0.05},
            daemon=True,
        )
        self.worker.start()
        self.addCleanup(self._close)
        for key in ("ordersRoot", "readyRoot", "stateRoot"):
            self.assertTrue(
                Path(self.cfg["paths"][key]).resolve().is_relative_to(self.root)
            )
        self.assertFalse(self.cfg["trendos"]["enabled"])
        self.assertEqual(self.cfg["trendos"]["baseUrl"], "")
        self.assertFalse(self.cfg["fastMode"]["enabled"])

    def _close(self):
        self.server.shutdown()
        self.worker.join(timeout=2)
        self.server.server_close()
        self.assertFalse(self.worker.is_alive())

    def api(self, method, endpoint, payload=None):
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_address[1], timeout=2
        )
        try:
            body = json.dumps(payload).encode("utf-8") if payload is not None else None
            connection.request(
                method, endpoint, body=body,
                headers={"Content-Type": "application/json"} if body else {},
            )
            response = connection.getresponse()
            data = response.read(32768)
            return response.status, json.loads(data.decode("utf-8"))
        finally:
            connection.close()

    @staticmethod
    def event(order_id="SYNTH001"):
        return {
            "orderId": order_id, "customerName": "SYNTHETIC CUSTOMER",
            "claimedAt": "2026-10-12T10:00:00+03:00",
            "lines": [{"lineId": "TEST-L1", "itemName": "TEST PAPER"}],
        }

    def test_status_is_offline_and_no_external_authority(self):
        code, output = self.api("GET", "/api/status")
        self.assertEqual(code, 200)
        self.assertEqual(output["service"], "TrendOS Print Server")
        self.assertEqual(output["trendosReadAdapter"], "DISABLED")
        self.assertFalse(output["trendos"]["connected"])
        self.assertFalse(output["bridge"]["running"])
        self.assertFalse(output["fastMode"]["enabled"])
        for key in (
            "designReadyWrites", "operatorTaskWrites", "employeeAssignmentWrites",
            "accountingWrites", "platformBusinessWrites",
        ):
            self.assertIs(output[key], False, key)

    def test_actual_bridge_baseline_then_transition_creates_root_once(self):
        self.fake.rows = [{
            "orderId": "SYNTH200", "lineId": "L0", "customer": "TEST",
            "status": "طلب جديد", "itemName": "TEST ONLY",
        }]
        baseline = self.app.bridge.sync_once()
        self.assertTrue(baseline["baselineOnly"])
        self.assertEqual(self.app.state.orders(), [])

        self.fake.rows[0]["status"] = "بدأ التنفيذ"
        result = self.app.bridge.sync_once()
        self.assertFalse(result["baselineOnly"])
        self.assertEqual(result["triggeredLines"], 1)
        self.assertEqual(result["created"][0]["orderId"], "SYNTH200")
        order = self.app.state.order("SYNTH200")
        self.assertTrue(Path(order["folder"]).resolve().is_relative_to(self.root))
        self.assertEqual(order["routes"], {})
        self.assertEqual(order["folderMode"], "MANUAL_SELECTION")

        self.fake.rows[0]["status"] = "تحت التنفيذ"
        repeat = self.app.bridge.sync_once()
        self.assertEqual(repeat["triggeredLines"], 0)
        self.assertEqual(len(self.app.state.orders()), 1)

    def test_synthetic_http_order_to_manual_route_to_ready_file(self):
        order = self.event()
        code, created = self.api("POST", "/api/events/order-claimed", {"order": order})
        self.assertEqual(code, 201)
        workroot = Path(created["result"]["folder"]).resolve()
        self.assertTrue(workroot.is_relative_to(self.root))
        self.assertEqual(created["result"]["routes"], {})

        code, assigned = self.api("POST", "/api/orders/manual-folder", {
            "orderId": order["orderId"], "folderKey": "digital_sticker",
            "openExplorer": False,
        })
        self.assertEqual(code, 201)
        self.assertFalse(assigned["result"]["explorerOpened"])
        route = Path(assigned["result"]["path"]).resolve()
        self.assertEqual(route.parent, workroot)
        self.assertTrue((route / "x").is_dir())

        source = route / "synthetic-proof.txt"
        source.write_bytes(b"synthetic-test-only-no-customer-files")
        code, published = self.api("POST", "/api/events/structured-approval", {
            "orderId": order["orderId"], "lineId": "TEST-L1",
            "sourceFile": str(source), "routeKey": "digital_sticker",
            "approval": {
                "decision": "APPROVE", "sourceKind": "OWNER_STRUCTURED_APPROVAL",
                "subjectSha256": file_sha256(source),
            },
        })
        self.assertEqual(code, 201)
        ready = Path(published["result"]["readyFile"]).resolve()
        self.assertTrue(ready.is_relative_to(self.root))
        self.assertEqual(ready.read_bytes(), source.read_bytes())
        self.assertFalse(published["result"]["designReadyGranted"])

        code, persisted = self.api("GET", "/api/orders")
        self.assertEqual(code, 200)
        self.assertEqual(len(persisted["orders"]), 1)
        self.assertEqual(persisted["orders"][0]["orderId"], order["orderId"])

    def test_untrusted_or_wrong_approval_fails_without_ready_file(self):
        event = self.event("SYNTH202")
        code, _ = self.api("POST", "/api/events/order-claimed", {"order": event})
        self.assertEqual(code, 201)
        code, response = self.api("POST", "/api/orders/manual-folder", {
            "orderId": "SYNTH202", "folderKey": "laser", "openExplorer": False,
        })
        self.assertEqual(code, 201)
        source = Path(response["result"]["path"]) / "synthetic.txt"
        source.write_text("not a customer file", encoding="utf-8")
        for bad in [
            {"decision": "APPROVE", "sourceKind": "FREE_TEXT",
             "subjectSha256": file_sha256(source)},
            {"decision": "APPROVE", "sourceKind": "OWNER_STRUCTURED_APPROVAL",
             "subjectSha256": "0"*64},
            {"decision": "REJECT", "sourceKind": "OWNER_STRUCTURED_APPROVAL",
             "subjectSha256": file_sha256(source)},
        ]:
            with self.subTest(bad=bad):
                code, rejected = self.api("POST", "/api/events/structured-approval", {
                    "orderId": "SYNTH202", "lineId": "TEST-L1",
                    "sourceFile": str(source), "routeKey": "laser",
                    "approval": bad,
                })
                self.assertEqual(code, 422)
                self.assertIs(rejected["ok"], False)
        self.assertEqual(list(Path(self.cfg["paths"]["readyRoot"]).rglob("*")), [])

    def test_cannot_publish_file_outside_synthetic_order_root(self):
        event = self.event("SYNTH203")
        self.api("POST", "/api/events/order-claimed", {"order": event})
        self.api("POST", "/api/orders/manual-folder", {
            "orderId": "SYNTH203", "folderKey": "photo_print",
            "openExplorer": False,
        })
        source = self.root / "outside-order.txt"
        source.write_text("fixture", encoding="utf-8")
        code, denied = self.api("POST", "/api/events/structured-approval", {
            "orderId": "SYNTH203", "lineId": "TEST-L1",
            "sourceFile": str(source), "routeKey": "photo_print",
            "approval": {
                "decision": "APPROVE", "sourceKind": "OWNER_STRUCTURED_APPROVAL",
                "subjectSha256": file_sha256(source),
            },
        })
        self.assertEqual(code, 422)
        self.assertEqual(denied["error"], "SOURCE_FILE_OUTSIDE_ORDER_FOLDER")

    def test_no_real_platform_login_or_order_polling_can_be_claimed(self):
        # The fake is test-only; AP-276 must never start a real polling thread
        # or the print server's production entry point.
        self.assertFalse(self.app.trendos.enabled)
        self.assertFalse(self.app.trendos.connected)
        self.assertFalse(self.app.bridge.status()["running"])
        self.assertFalse(self.app.fast_mode.status()["enabled"])


if __name__ == "__main__":
    unittest.main()
