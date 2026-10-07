import json
import tempfile
import time
import unittest
from pathlib import Path

from PIL import Image
import ezdxf

from src.config import DEFAULT_CONFIG, _deep_merge, _resolve_paths
from src.folders import OrderFolderService, file_sha256
from src.preview import build_preview
from src.state import StateStore
from src.watcher import FinishedFolderWatcher


class PrintServerTests(unittest.TestCase):
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
        self.service = OrderFolderService(self.cfg, self.state)

    def tearDown(self):
        self.temp.cleanup()

    def _order(self, order_id="15428", lines=None):
        return {
            "orderId": order_id,
            "customerName": "أحمد محمد",
            "claimedAt": "2026-10-07T10:15:00+03:00",
            "lines": lines or [
                {"lineId": "L1", "heatPress": True, "itemName": "مج"},
                {"lineId": "L2", "itemName": "استيكر"},
            ],
        }

    def test_claim_creates_order_root_only_and_never_auto_classifies(self):
        result = self.service.create_for_claimed_order(self._order())
        root = Path(result["folder"])
        self.assertTrue(root.is_dir())
        self.assertEqual({}, result["routes"])
        self.assertEqual([], result["unclassified"])
        self.assertEqual("MANUAL_SELECTION", result["folderMode"])
        self.assertEqual(["L1", "L2"], result["lineIds"])
        self.assertFalse((root / "سبلميشن").exists())
        self.assertFalse((root / "استيكر").exists())
        self.assertFalse((root / "ليزر").exists())

    def test_manual_sublimation_creates_direct_folder_with_x(self):
        result = self.service.create_for_claimed_order(self._order())
        root = Path(result["folder"])
        made = self.service.create_manual_folder("15428", "photo_sublimation")
        self.assertEqual("سبلميشن", made["displayName"])
        self.assertTrue(Path(made["path"]).samefile(root / "سبلميشن"))
        self.assertTrue((root / "سبلميشن" / "x").is_dir())
        self.assertFalse((root / "طباعة" / "فوتو" / "سبلميشن").exists())

    def test_multiple_manual_folders_can_exist_for_one_order(self):
        result = self.service.create_for_claimed_order(self._order("200"))
        root = Path(result["folder"])
        self.service.create_manual_folder("200", "photo_sublimation")
        self.service.create_manual_folder("200", "digital_sticker")
        self.service.create_manual_folder("200", "laser")
        order = self.state.order("200")
        self.assertEqual(
            {"photo_sublimation", "digital_sticker", "laser"},
            set(order["routes"].keys()),
        )
        self.assertTrue((root / "سبلميشن" / "x").is_dir())
        self.assertTrue((root / "استيكر" / "x").is_dir())
        self.assertTrue((root / "ليزر" / "x").is_dir())

    def test_unknown_manual_folder_is_rejected(self):
        self.service.create_for_claimed_order(self._order("201"))
        with self.assertRaisesRegex(ValueError, "UNKNOWN_MANUAL_FOLDER"):
            self.service.create_manual_folder("201", "unknown")

    def test_repeated_manual_folder_is_idempotent(self):
        self.service.create_for_claimed_order(self._order("202"))
        first = self.service.create_manual_folder("202", "digital_couche")
        second = self.service.create_manual_folder("202", "digital_couche")
        self.assertFalse(first["alreadyExisted"])
        self.assertTrue(second["alreadyExisted"])
        self.assertEqual(first["path"], second["path"])

    def test_structured_approval_can_use_explicit_manual_route(self):
        result = self.service.create_for_claimed_order(self._order("300", [{"lineId": "S1"}]))
        made = self.service.create_manual_folder("300", "digital_sticker")
        source = Path(made["path"]) / "design.png"
        Image.new("RGB", (20, 10), "white").save(source)
        sha = file_sha256(source)
        ready = self.service.publish_structured_approval(
            "300",
            "S1",
            str(source),
            {
                "decision": "APPROVE",
                "sourceKind": "STRUCTURED_CUSTOMER_APPROVAL",
                "subjectSha256": sha,
            },
            route_key="digital_sticker",
        )
        self.assertTrue(Path(ready["readyFile"]).is_file())
        self.assertFalse(ready["designReadyGranted"])
        self.assertEqual("digital_sticker", ready["routeKey"])
        self.assertIn(str(Path("استيكر")), ready["readyFile"])

    def test_free_text_or_hash_mismatch_cannot_publish(self):
        self.service.create_for_claimed_order(self._order("301", [{"lineId": "C1"}]))
        made = self.service.create_manual_folder("301", "digital_couche")
        source = Path(made["path"]) / "proof.jpg"
        Image.new("RGB", (10, 10), "white").save(source)
        with self.assertRaisesRegex(ValueError, "QUALIFIED_STRUCTURED_APPROVAL_REQUIRED"):
            self.service.publish_structured_approval(
                "301", "C1", str(source),
                {"decision": "APPROVE", "sourceKind": "FREE_TEXT", "subjectSha256": file_sha256(source)},
                route_key="digital_couche",
            )
        with self.assertRaisesRegex(ValueError, "APPROVAL_HASH_MISMATCH"):
            self.service.publish_structured_approval(
                "301", "C1", str(source),
                {"decision": "APPROVE", "sourceKind": "CUSTOMER_PORTAL", "subjectSha256": "0" * 64},
                route_key="digital_couche",
            )

    def test_tiff_preview_is_real_png(self):
        result = self.service.create_for_claimed_order(self._order("400", [{"lineId": "P1"}]))
        made = self.service.create_manual_folder("400", "photo_print")
        path = Path(made["path"]) / "sample.tif"
        Image.new("RGB", (31, 17), "red").save(path, format="TIFF")
        data, mime, meta = build_preview(str(path), self.cfg)
        self.assertEqual(mime, "image/png")
        self.assertTrue(data.startswith(b"\x89PNG"))
        self.assertEqual((meta["width"], meta["height"]), (31, 17))

    def test_dxf_preview_is_svg_with_layers_and_dimensions(self):
        self.service.create_for_claimed_order(self._order("401", [{"lineId": "L1"}]))
        made = self.service.create_manual_folder("401", "laser")
        path = Path(made["path"]) / "cut.dxf"
        doc = ezdxf.new("R2010")
        doc.layers.add("CUT")
        msp = doc.modelspace()
        msp.add_line((0, 0), (100, 50), dxfattribs={"layer": "CUT"})
        msp.add_circle((50, 25), 10, dxfattribs={"layer": "CUT"})
        doc.saveas(path)
        data, mime, meta = build_preview(str(path), self.cfg)
        self.assertTrue(mime.startswith("image/svg+xml"))
        self.assertIn(b"<svg", data)
        self.assertIn("CUT", meta["layers"])
        self.assertGreaterEqual(meta["width"], 100)
        self.assertGreaterEqual(meta["height"], 50)

    def test_x_watcher_records_local_signal_only(self):
        self.service.create_for_claimed_order(self._order("500", [{"lineId": "S1"}]))
        made = self.service.create_manual_folder("500", "digital_sticker")
        xdir = Path(made["path"]) / "x"
        watcher = FinishedFolderWatcher(self.cfg["paths"]["ordersRoot"], "x", self.state, 1)
        watcher.start()
        try:
            (xdir / "printed.cdr").write_text("test", encoding="utf-8")
            time.sleep(1.4)
        finally:
            watcher.stop()
        audit = Path(self.cfg["paths"]["stateRoot"]) / "audit.jsonl"
        records = [json.loads(line) for line in audit.read_text(encoding="utf-8").splitlines()]
        xevents = [r for r in records if r["event"] == "LOCAL_X_SIGNAL"]
        self.assertEqual(len(xevents), 1)
        self.assertFalse(xevents[0]["authoritativePrintedWrite"])
        self.assertFalse(xevents[0]["designReadyGranted"])


if __name__ == "__main__":
    unittest.main()
