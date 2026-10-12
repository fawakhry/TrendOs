"""AP-278: path confinement regression on disposable synthetic directory tree.

No real files, platform, printers, device mounts or production service.
"""
from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from offline_pilot import offline_config
from src.folders import file_sha256
from src.server import PrintServerApp


class AP278LocalPathConfinement(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap278-path-only-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.cfg = offline_config(self.root)
        self.app = PrintServerApp(
            self.cfg, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "fake-config.json",
            write_token="AP278_TEST_ONLY_TOKEN_NOT_A_REAL_TOKEN_2026",
        )
        self.outside = self.root / "outside-order-root"
        self.outside.mkdir()
        self.orders = Path(self.cfg["paths"]["ordersRoot"])
        self.ready = Path(self.cfg["paths"]["readyRoot"])

    def fake_order(self, order_id="SYNTH278"):
        return {
            "orderId": order_id, "customerName": "FAKE",
            "claimedAt": "2026-10-12T10:00:00+03:00",
            "lines": [{"lineId": "FAKE-L1"}],
        }

    def create_route(self):
        state = self.app.folders.create_for_claimed_order(self.fake_order())
        route = self.app.folders.create_manual_folder("SYNTH278", "laser")
        return Path(state["folder"]), Path(route["path"])

    def publish(self, source: Path, sha=None):
        return self.app.folders.publish_structured_approval(
            "SYNTH278", "FAKE-L1", str(source),
            {
                "decision": "APPROVE", "sourceKind": "OWNER_STRUCTURED_APPROVAL",
                "subjectSha256": sha or file_sha256(source),
            },
            "laser",
        )

    def test_order_root_candidate_symlink_outside_is_blocked(self):
        data = self.fake_order()
        shortcut = self.orders / self.app.folders.order_folder_name(data)
        shortcut.symlink_to(self.outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.app.folders.create_for_claimed_order(data)
        self.assertEqual(list(self.outside.iterdir()), [])
        self.assertEqual(self.app.state.orders(), [])

    def test_poisoned_state_order_folder_outside_root_is_blocked(self):
        self.app.state.upsert_order("SYNTH278", {
            "orderId": "SYNTH278", "folder": str(self.outside), "routes": {},
        })
        with self.assertRaisesRegex(ValueError, "PATH_OUTSIDE_CONFIGURED_ROOT"):
            self.app.folders.create_manual_folder("SYNTH278", "laser")
        self.assertEqual(list(self.outside.iterdir()), [])

    def test_manual_route_symlink_cannot_create_external_directory(self):
        state = self.app.folders.create_for_claimed_order(self.fake_order())
        (Path(state["folder"]) / "ليزر").symlink_to(self.outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.app.folders.create_manual_folder("SYNTH278", "laser")
        self.assertEqual(list(self.outside.iterdir()), [])

    def test_finished_x_symlink_is_refused(self):
        _, route = self.create_route()
        finished = route / "x"
        finished.rmdir()
        finished.symlink_to(self.outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.app.folders.create_manual_folder("SYNTH278", "laser")
        self.assertEqual(list(self.outside.iterdir()), [])

    def test_source_symlink_cannot_copy_file_outside_order(self):
        _, route = self.create_route()
        external = self.outside / "secret.txt"
        external.write_bytes(b"synthetic sensitive marker")
        linked = route / "proof.txt"
        linked.symlink_to(external)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.publish(linked, file_sha256(external))
        self.assertEqual(list(self.ready.iterdir()), [])

    def test_ready_route_symlink_cannot_write_outside(self):
        _, route = self.create_route()
        src = route / "proof.txt"
        src.write_bytes(b"fake proof bytes")
        (self.ready / "ليزر").symlink_to(self.outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.publish(src)
        self.assertEqual(list(self.outside.iterdir()), [])

    def test_existing_ready_destination_symlink_is_never_overwritten(self):
        _, route = self.create_route()
        src = route / "proof.txt"
        src.write_bytes(b"fake proof bytes")
        ready_dir = self.ready / "ليزر"
        ready_dir.mkdir()
        external = self.outside / "marker.txt"
        external.write_bytes(b"outside remains intact")
        (ready_dir / "SYNTH278 - FAKE - proof.txt").symlink_to(external)
        with self.assertRaisesRegex(ValueError, "SYMLINK_PATH_FORBIDDEN"):
            self.publish(src)
        self.assertEqual(external.read_bytes(), b"outside remains intact")

    def test_existing_ready_file_preserved_on_name_conflict(self):
        _, route = self.create_route()
        src = route / "proof.txt"
        src.write_bytes(b"new fake content")
        ready_dir = self.ready / "ليزر"
        ready_dir.mkdir()
        original = ready_dir / "SYNTH278 - FAKE - proof.txt"
        original.write_bytes(b"old fake content")
        result = self.publish(src)
        self.assertEqual(original.read_bytes(), b"old fake content")
        self.assertNotEqual(Path(result["readyFile"]), original)
        self.assertEqual(Path(result["readyFile"]).read_bytes(), src.read_bytes())

    def test_same_hash_reapproval_does_not_overwrite_existing_file(self):
        _, route = self.create_route()
        src = route / "proof.txt"
        src.write_bytes(b"approved fixture")
        first = self.publish(src)
        dest = Path(first["readyFile"])
        before = dest.stat().st_mtime_ns
        second = self.publish(src)
        self.assertEqual(first["readyFile"], second["readyFile"])
        self.assertEqual(dest.stat().st_mtime_ns, before)
        self.assertEqual(dest.read_bytes(), src.read_bytes())

    def test_poisoned_route_path_outside_order_blocked(self):
        _, route = self.create_route()
        src = route / "proof.txt"
        src.write_bytes(b"fake payload")
        state = self.app.state.order("SYNTH278")
        state["routes"]["laser"]["path"] = str(self.outside)
        self.app.state.upsert_order("SYNTH278", state)
        with self.assertRaisesRegex(ValueError, "PATH_OUTSIDE_CONFIGURED_ROOT"):
            self.publish(src)
        self.assertEqual(list(self.ready.iterdir()), [])

    def test_no_cloud_or_real_device_was_enabled(self):
        self.assertFalse(self.app.trendos.enabled)
        self.assertFalse(self.app.bridge.status()["running"])
        self.assertFalse(self.app.fast_mode.status()["enabled"])


if __name__ == "__main__":
    unittest.main()
