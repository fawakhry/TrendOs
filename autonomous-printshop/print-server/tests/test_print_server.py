import json
import tempfile
import time
import unittest
from pathlib import Path

from PIL import Image
import ezdxf

from src.classifier import classify_line
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

    def test_heat_press_is_sublimation(self):
        result = classify_line({"heatPress": "نعم", "itemName": "مج"}, self.cfg)
        self.assertEqual(result.route_key, "photo_sublimation")
        self.assertEqual(result.path_parts, ("طباعة", "فوتو", "سبلميشن"))

    def test_known_routes_and_unknown_fail_closed(self):
        cases = [
            ({"itemName": "استيكر شفاف"}, "digital_sticker"),
            ({"itemName": "كوشيه 300 جرام"}, "digital_couche"),
            ({"itemName": "تابلوه 30x40"}, "photo_tableaux"),
            ({"department": "ليزر"}, "laser"),
        ]
        for line, expected in cases:
            self.assertEqual(classify_line(line, self.cfg).route_key, expected)
        self.assertIsNone(classify_line({"itemName": "منتج جديد غير معروف"}, self.cfg).route_key)

    def test_creates_only_required_order_folders(self):
        result = self.service.create_for_claimed_order({
            "orderId": "15428",
            "customerName": "أحمد محمد",
            "claimedAt": "2026-10-07T10:15:00+03:00",
            "lines": [
                {"lineId": "L1", "heatPress": True, "itemName": "مج"},
                {"lineId": "L2", "itemName": "استيكر"},
            ],
        })
        root = Path(result["folder"])
        self.assertTrue((root / "طباعة" / "فوتو" / "سبلميشن" / "x").is_dir())
        self.assertTrue((root / "طباعة" / "ديجتال" / "استيكر" / "x").is_dir())
        self.assertFalse((root / "طباعة" / "فوتو" / "تابلوهات").exists())
        self.assertFalse((root / "ليزر").exists())
        self.assertIn("15428", root.name)
        self.assertIn("07-10-2026", root.name)
        self.assertIn("أحمد محمد", root.name)

    def test_laser_is_one_folder_with_x(self):
        result = self.service.create_for_claimed_order({
            "orderId": "200",
            "customerName": "عميل ليزر",
            "lines": [{"lineId": "LZ1", "department": "ليزر"}],
        })
        root = Path(result["folder"])
        self.assertTrue((root / "ليزر" / "x").is_dir())
        self.assertFalse((root / "ليزر" / "ماكينة 1").exists())

    def test_structured_approval_copies_to_ready_without_design_ready(self):
        result = self.service.create_for_claimed_order({
            "orderId": "300",
            "customerName": "منى",
            "lines": [{"lineId": "S1", "itemName": "استيكر"}],
        })
        source = Path(result["routes"]["digital_sticker"]["path"]) / "design.png"
        Image.new("RGB", (20, 10), "white").save(source)
        sha = file_sha256(source)
        ready = self.service.publish_structured_approval("300", "S1", str(source), {
            "decision": "APPROVE",
            "sourceKind": "STRUCTURED_CUSTOMER_APPROVAL",
            "subjectSha256": sha,
        })
        self.assertTrue(Path(ready["readyFile"]).is_file())
        self.assertFalse(ready["designReadyGranted"])
        self.assertIn(str(Path("طباعة") / "ديجتال" / "استيكر"), ready["readyFile"])

    def test_free_text_or_hash_mismatch_cannot_publish(self):
        result = self.service.create_for_claimed_order({
            "orderId": "301", "customerName": "سارة",
            "lines": [{"lineId": "C1", "itemName": "كوشيه"}],
        })
        source = Path(result["routes"]["digital_couche"]["path"]) / "proof.jpg"
        Image.new("RGB", (10, 10), "white").save(source)
        with self.assertRaisesRegex(ValueError, "QUALIFIED_STRUCTURED_APPROVAL_REQUIRED"):
            self.service.publish_structured_approval("301", "C1", str(source), {
                "decision": "APPROVE", "sourceKind": "FREE_TEXT", "subjectSha256": file_sha256(source)
            })
        with self.assertRaisesRegex(ValueError, "APPROVAL_HASH_MISMATCH"):
            self.service.publish_structured_approval("301", "C1", str(source), {
                "decision": "APPROVE", "sourceKind": "CUSTOMER_PORTAL", "subjectSha256": "0" * 64
            })

    def test_tiff_preview_is_real_png(self):
        result = self.service.create_for_claimed_order({
            "orderId": "400", "customerName": "TIF",
            "lines": [{"lineId": "P1", "department": "فوتو"}],
        })
        path = Path(result["routes"]["photo_print"]["path"]) / "sample.tif"
        Image.new("RGB", (31, 17), "red").save(path, format="TIFF")
        data, mime, meta = build_preview(str(path), self.cfg)
        self.assertEqual(mime, "image/png")
        self.assertTrue(data.startswith(b"\x89PNG"))
        self.assertEqual((meta["width"], meta["height"]), (31, 17))

    def test_dxf_preview_is_svg_with_layers_and_dimensions(self):
        result = self.service.create_for_claimed_order({
            "orderId": "401", "customerName": "DXF",
            "lines": [{"lineId": "L1", "department": "ليزر"}],
        })
        path = Path(result["routes"]["laser"]["path"]) / "cut.dxf"
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
        result = self.service.create_for_claimed_order({
            "orderId": "500", "customerName": "X",
            "lines": [{"lineId": "S1", "itemName": "استيكر"}],
        })
        xdir = Path(result["routes"]["digital_sticker"]["path"]) / "x"
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
