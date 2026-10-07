import tempfile
import threading
import time
import unittest
from pathlib import Path

from src.config import DEFAULT_CONFIG
from src.folders import OrderFolderService
from src.platform_bridge import TrendOSStatusBridge
from src.state import StateStore


class FakeClient:
    def __init__(self):
        self.connected = True
        self.rows = []

    def get_rows(self, screen):
        if screen != "print":
            raise Exception("forbidden")
        return {"success": True, "rows": list(self.rows)}


class BridgeTests(unittest.TestCase):
    def config(self, root):
        import copy
        cfg = copy.deepcopy(DEFAULT_CONFIG)
        cfg["paths"]["ordersRoot"] = str(Path(root) / "orders")
        cfg["paths"]["readyRoot"] = str(Path(root) / "ready")
        cfg["paths"]["stateRoot"] = str(Path(root) / "state")
        cfg["trendos"]["pollScreens"] = ["print"]
        return cfg

    def test_first_snapshot_is_baseline_then_transition_creates_root_only(self):
        with tempfile.TemporaryDirectory() as td:
            cfg = self.config(td)
            state = StateStore(cfg["paths"]["stateRoot"])
            folders = OrderFolderService(cfg, state)
            client = FakeClient()
            prompted = []
            bridge = TrendOSStatusBridge(cfg, client, folders, state, on_order=prompted.append)
            client.rows = [{
                "orderId": "9001",
                "lineId": "L1",
                "customer": "عميل",
                "department": "طباعة",
                "itemName": "مج",
                "heatPress": True,
                "status": "طلب جديد",
            }]
            first = bridge.sync_once()
            self.assertTrue(first["baselineOnly"])
            self.assertEqual([], state.orders())

            client.rows[0]["status"] = "بدأ التنفيذ"
            second = bridge.sync_once()
            self.assertEqual(1, second["triggeredLines"])
            order = state.order("9001")
            self.assertTrue(order)
            self.assertEqual({}, order["routes"])
            self.assertEqual("MANUAL_SELECTION", order["folderMode"])
            self.assertFalse((Path(order["folder"]) / "سبلميشن").exists())
            self.assertEqual(1, len(prompted))
            self.assertEqual("9001", prompted[0]["orderId"])

    def test_active_to_active_does_not_retrigger(self):
        with tempfile.TemporaryDirectory() as td:
            cfg = self.config(td)
            state = StateStore(cfg["paths"]["stateRoot"])
            folders = OrderFolderService(cfg, state)
            client = FakeClient()
            bridge = TrendOSStatusBridge(cfg, client, folders, state)
            client.rows = [{"orderId": "9002", "lineId": "L2", "customer": "عميل", "status": "طلب جديد"}]
            bridge.sync_once()
            client.rows[0]["status"] = "بدأ التنفيذ"
            self.assertEqual(1, bridge.sync_once()["triggeredLines"])
            client.rows[0]["status"] = "تحت التنفيذ"
            self.assertEqual(0, bridge.sync_once()["triggeredLines"])

    def test_async_sync_returns_without_waiting_for_slow_platform_read(self):
        class SlowClient:
            def __init__(self):
                self.connected = True
                self.started = threading.Event()
                self.release = threading.Event()

            def get_rows(self, screen):
                self.started.set()
                self.release.wait(2)
                return {"success": True, "rows": []}

        with tempfile.TemporaryDirectory() as td:
            cfg = self.config(td)
            state = StateStore(cfg["paths"]["stateRoot"])
            folders = OrderFolderService(cfg, state)
            client = SlowClient()
            bridge = TrendOSStatusBridge(cfg, client, folders, state)

            result = bridge.sync_async()
            self.assertTrue(result["scheduled"])
            self.assertTrue(client.started.wait(1))
            self.assertTrue(bridge.status()["syncing"])

            client.release.set()
            deadline = time.time() + 2
            while bridge.status()["syncing"] and time.time() < deadline:
                time.sleep(0.01)
            self.assertFalse(bridge.status()["syncing"])
            self.assertTrue(state.trendos_bridge_state()["initialized"])

    def test_incremental_lines_merge_without_auto_folders(self):
        with tempfile.TemporaryDirectory() as td:
            cfg = self.config(td)
            state = StateStore(cfg["paths"]["stateRoot"])
            folders = OrderFolderService(cfg, state)
            folders.create_for_claimed_order({
                "orderId": "9003",
                "customerName": "عميل",
                "lines": [{"lineId": "A", "itemName": "استيكر"}],
            })
            folders.create_for_claimed_order({
                "orderId": "9003",
                "customerName": "عميل",
                "lines": [{"lineId": "B", "itemName": "ليزر"}],
            })
            order = state.order("9003")
            self.assertEqual({}, order["routes"])
            self.assertEqual(["A", "B"], order["lineIds"])
            folders.create_manual_folder("9003", "digital_sticker")
            self.assertIn("digital_sticker", state.order("9003")["routes"])


if __name__ == "__main__":
    unittest.main()
