"""AP-280: employee-facing queue from synthetic local state only.

No customer data, Cloudflare login, live TrendOS statuses, approval mutation,
Windows shop files, printer spool or owner Ubuntu access.
"""
from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

from offline_pilot import offline_config
from src.employee_assist import local_employee_queue
from src.server import PrintServerApp, make_handler


class AP280EmployeeQueue(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="ap280-fake-employee-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.cfg = offline_config(self.root)
        self.app = PrintServerApp(
            self.cfg,
            Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "synthetic-config.json",
            write_token="",  # no local mutation authorization
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

    def get(self, path="/api/employee/queue"):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            conn.request("GET", path)
            res = conn.getresponse()
            return res.status, json.loads(res.read())
        finally:
            conn.close()

    @staticmethod
    def row(id, *, manual=False, created="2026-10-12T12:00:00Z", path=None):
        return {
            "orderId": id, "customerName": "FAKE CUSTOMER",
            "createdAt": created, "updatedAt": created,
            "lineIds": ["TEST-L1"],
            "routes": ({
                "laser": {
                    "path": path or "/synthetic/laser",
                    "manual": True, "displayName": "ليزر",
                }
            } if manual else {}),
        }

    def test_empty_queue_does_not_infer_cloud_orders(self):
        code, data = self.get()
        self.assertEqual(code, 200)
        self.assertEqual(data["items"], [])
        self.assertEqual(data["summary"], {
            "localOrders": 0, "needsManualFolder": 0, "folderSelected": 0,
        })
        self.assertFalse(data["authoritativeTrendOSStatus"])
        self.assertFalse(data["physicalPrintingVerified"])

    def test_routed_orders_are_actionable_but_not_printed_or_approved(self):
        data = local_employee_queue([self.row("T-1", manual=True)])
        self.assertEqual(data["summary"]["folderSelected"], 1)
        item = data["items"][0]
        self.assertEqual(item["localStage"], "FOLDER_SELECTED")
        self.assertEqual(item["manualFolderCount"], 1)
        self.assertIn("الموافقة البشرية", item["nextAction"])
        self.assertFalse(data["designApprovalVerified"])
        self.assertFalse(data["physicalPrintingVerified"])

    def test_unrouted_orders_are_first_oldest_first(self):
        items = [
            self.row("route", manual=True, created="2026-10-01T08:00:00Z"),
            self.row("new", created="2026-10-12T12:00:00Z"),
            self.row("old", created="2026-10-02T12:00:00Z"),
        ]
        out = local_employee_queue(items)
        self.assertEqual([i["orderId"] for i in out["items"]], ["old", "new", "route"])
        self.assertEqual(out["summary"]["needsManualFolder"], 2)

    def test_poisoned_legacy_route_is_not_assumed_manual(self):
        legacy = self.row("legacy")
        legacy["routes"] = {"photo": {"path": "/real/looking", "manual": False}}
        data = local_employee_queue([legacy])
        self.assertEqual(data["items"][0]["localStage"], "NEEDS_WORK_FOLDER")

    def test_untrusted_and_missing_state_fail_conservatively(self):
        invalid = self.row("unknown")
        invalid.update({"routes": ["wrong"], "createdAt": "invalid-date", "lineIds": "not-a-list"})
        data = local_employee_queue([None, {}, invalid])
        self.assertEqual(data["summary"]["localOrders"], 1)
        self.assertEqual(data["items"][0]["lineCount"], 0)
        self.assertEqual(data["items"][0]["localStage"], "NEEDS_WORK_FOLDER")

    def test_queue_read_does_not_change_state_or_audit(self):
        self.app.state.upsert_order("T-1", self.row("T-1"))
        initial = self.app.state.snapshot()
        status, reply = self.get()
        self.assertEqual(status, 200)
        self.assertEqual(reply["summary"]["needsManualFolder"], 1)
        self.assertEqual(self.app.state.snapshot(), initial)
        self.assertFalse(self.app.state.audit_path.exists())
        self.assertFalse(self.app.trendos.enabled)
        self.assertFalse(self.app.bridge.status()["running"])

    def test_read_does_not_grant_write_access(self):
        _, queue = self.get()
        self.assertFalse(queue["platformBusinessWrites"])
        self.assertEqual(self.app.status()["localWriteAccess"], "LOCKED")
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            conn.request(
                "POST", "/api/events/order-claimed", body=b"{}",
                headers={"Content-Type": "application/json"},
            )
            res = conn.getresponse()
            data = json.loads(res.read())
            self.assertEqual(res.status, 403)
            self.assertEqual(data["error"], "LOCAL_WRITES_LOCKED")
        finally:
            conn.close()

    def test_platform_business_state_not_claimed(self):
        result = local_employee_queue([self.row("T-1")])
        self.assertEqual(result["source"], "LOCAL_PRINT_SERVER_STATE_ONLY")
        self.assertFalse(result["authoritativeTrendOSStatus"])
        self.assertFalse(result["designApprovalVerified"])
        self.assertFalse(result["physicalPrintingVerified"])
        self.assertFalse(result["platformBusinessWrites"])
        self.assertNotIn("printed", result["items"][0])
        self.assertNotIn("overdue", result["items"][0])

    def test_queue_does_not_echo_local_absolute_paths(self):
        raw_path = "/some-sensitive-folder-not-for-display"
        result = local_employee_queue([self.row("T-1", manual=True, path=raw_path)])
        self.assertNotIn(raw_path, json.dumps(result))

    def test_screen_has_employee_panel_and_no_fake_print_confirmation(self):
        page = (Path(__file__).resolve().parents[1] / "public" / "index.html").read_text(encoding="utf-8")
        script = (Path(__file__).resolve().parents[1] / "public" / "app.js").read_text(encoding="utf-8")
        self.assertIn('id="employeeQueueItems"', page)
        self.assertIn('id="employeeQueueSummary"', page)
        self.assertIn("/api/employee/queue", script)
        self.assertIn("esc(item.nextAction)", script)
        self.assertIn("مش حالة TrendOS الفعلية", page)


if __name__ == "__main__":
    unittest.main()
