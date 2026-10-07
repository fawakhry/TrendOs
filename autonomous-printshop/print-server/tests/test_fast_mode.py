import tempfile
import unittest
from pathlib import Path

from src.config import DEFAULT_CONFIG, _deep_merge, _resolve_paths
from src.fast_mode import FastModeController
from src.folders import OrderFolderService
from src.state import StateStore


class FastModeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        cfg = _deep_merge(DEFAULT_CONFIG, {
            "paths": {
                "ordersRoot": str(base / "orders"),
                "readyRoot": str(base / "ready"),
                "stateRoot": str(base / "state"),
            }
        })
        self.cfg = _resolve_paths(cfg, base)
        self.state = StateStore(self.cfg["paths"]["stateRoot"])
        self.folders = OrderFolderService(self.cfg, self.state)
        self.opened = []
        self.fast = FastModeController(
            self.cfg,
            self.folders,
            self.state,
            opener=lambda path: self.opened.append(path),
        )

    def tearDown(self):
        self.temp.cleanup()

    def create_order(self, order_id="700"):
        return self.folders.create_for_claimed_order({
            "orderId": order_id,
            "customerName": "عميل سريع",
            "lines": [{"lineId": "L-" + order_id}],
        })

    def test_notify_does_not_create_work_folder(self):
        order = self.create_order()
        result = self.fast.notify_order(order)
        self.assertTrue(result["ok"])
        self.assertEqual({}, self.state.order("700")["routes"])
        self.assertEqual(1, self.fast.status()["promptCount"])

    def test_one_click_creates_folder_and_opens_explorer(self):
        self.create_order()
        result = self.fast.choose_folder("700", "photo_sublimation")
        path = Path(result["path"])
        self.assertTrue((path / "x").is_dir())
        self.assertTrue(result["explorerOpened"])
        self.assertEqual([str(path)], self.opened)
        self.assertEqual(1, self.fast.status()["openedFolderCount"])

    def test_multiple_work_types_for_same_order(self):
        self.create_order("701")
        self.fast.choose_folder("701", "photo_sublimation")
        self.fast.choose_folder("701", "digital_sticker")
        order = self.state.order("701")
        self.assertEqual(
            {"photo_sublimation", "digital_sticker"},
            set(order["routes"].keys()),
        )
        self.assertEqual(2, len(self.opened))

    def test_open_order_folder(self):
        order = self.create_order("702")
        result = self.fast.open_order_folder("702")
        self.assertTrue(result["explorerOpened"])
        self.assertEqual(str(Path(order["folder"]).resolve()), self.opened[-1])


if __name__ == "__main__":
    unittest.main()
