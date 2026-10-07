import json
import tempfile
import unittest
from pathlib import Path

from src.config import DEFAULT_CONFIG, _deep_merge, _resolve_paths
from src.local_settings import LocalSettingsError
from src.server import PrintServerApp


class StorageSettingsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        cfg = _deep_merge(DEFAULT_CONFIG, {
            "paths": {
                "ordersRoot": str(self.base / "orders-old"),
                "readyRoot": str(self.base / "ready"),
                "stateRoot": str(self.base / "state"),
            }
        })
        self.cfg = _resolve_paths(cfg, self.base)
        self.config_path = self.base / "config" / "local.json"
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config_path.write_text(
            json.dumps({"paths": {"ordersRoot": str(self.base / "orders-old")}}, ensure_ascii=False),
            encoding="utf-8",
        )
        self.public = self.base / "public"
        self.public.mkdir()
        self.app = PrintServerApp(self.cfg, self.public, self.config_path)

    def tearDown(self):
        self.temp.cleanup()

    def _order(self, order_id):
        return {
            "orderId": order_id,
            "customerName": "عميل",
            "lines": [{"lineId": "L-" + order_id, "itemName": "استيكر"}],
        }

    def test_changing_orders_root_affects_new_orders_only(self):
        old_order = self.app.folders.create_for_claimed_order(self._order("100"))
        old_root = Path(old_order["folder"])
        self.assertEqual(old_root.parent, self.base / "orders-old")

        new_root = self.base / "Trend Print"
        result = self.app.set_orders_root(str(new_root))
        self.assertTrue(result["changed"])
        self.assertFalse(result["existingOrdersMoved"])
        self.assertEqual(Path(result["ordersRoot"]), new_root.resolve())
        self.assertTrue(old_root.exists())

        new_order = self.app.folders.create_for_claimed_order(self._order("101"))
        self.assertEqual(Path(new_order["folder"]).parent, new_root.resolve())
        self.assertEqual(self.app.watcher.root, new_root.resolve())

        persisted = json.loads(self.config_path.read_text(encoding="utf-8"))
        self.assertEqual(Path(persisted["paths"]["ordersRoot"]), new_root.resolve())

    def test_relative_orders_root_is_rejected(self):
        with self.assertRaises(LocalSettingsError):
            self.app.set_orders_root("relative-folder")


if __name__ == "__main__":
    unittest.main()
