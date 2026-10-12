"""AP-279: TrendOSStatusBridge shadow mode and safe baseline lineage tests.

No remote network, production credentials, cloud account, customer row or printer.
"""
from __future__ import annotations

import copy
import tempfile
import unittest
from pathlib import Path

from offline_pilot import offline_config
from src.server import PrintServerApp
from src.trendos_client import TrendOSError


class FakeEmployeeRows:
    def __init__(self):
        self.connected = True
        self.rows = []
        self.denied = set()
        self.calls = []

    def get_rows(self, screen):
        self.calls.append(screen)
        if screen in self.denied:
            raise TrendOSError("SYNTHETIC_SCREEN_DENIED")
        return {"success": True, "rows": copy.deepcopy(self.rows)}


class AP279ReadOnlyShadow(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="ap279-bridge-shadow-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.cfg = offline_config(self.root)
        self.cfg["trendos"]["pollScreens"] = ["print"]
        self.app = PrintServerApp(
            self.cfg, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "config.json",
            write_token="AP279_TEST_ONLY_TOKEN_NEVER_FOR_PRODUCTION_2026",
        )
        self.fake = FakeEmployeeRows()
        self.app.bridge.client = self.fake

    @staticmethod
    def row(status="طلب جديد", line="FAKE-L1", order="SYNTH279"):
        return {
            "orderId": order, "lineId": line,
            "customer": "FAKE TEST CUSTOMER", "status": status,
        }

    def test_default_bridge_is_shadow_no_local_folders(self):
        self.assertTrue(self.cfg["trendos"]["observeOnly"])
        self.assertTrue(self.app.bridge.status()["observeOnly"])
        self.assertFalse(self.app.bridge.status()["localFolderWrites"])
        self.fake.rows = [self.row()]
        first = self.app.bridge.sync_once()
        self.assertTrue(first["baselineOnly"])
        self.fake.rows[0]["status"] = "بدأ التنفيذ"
        second = self.app.bridge.sync_once()
        self.assertEqual(second["triggeredLines"], 1)
        self.assertEqual(second["candidateOrders"], 1)
        self.assertEqual(second["created"], [])
        self.assertTrue(second["observeOnly"])
        self.assertEqual(self.app.state.orders(), [])
        self.assertEqual(list((self.root / "orders").iterdir()), [])
        self.assertFalse(self.app.trendos.enabled)

    def test_new_active_line_after_baseline_is_not_transition(self):
        self.fake.rows = [self.row()]
        self.app.bridge.sync_once()
        self.fake.rows.append(self.row(status="بدأ التنفيذ", line="FAKE-L2", order="NEW279"))
        output = self.app.bridge.sync_once()
        self.assertEqual(output["triggeredLines"], 0)
        self.assertEqual(output["candidateOrders"], 0)
        self.assertEqual(self.app.state.orders(), [])

    def test_same_active_status_not_duplicate_shadow_candidate(self):
        self.fake.rows = [self.row()]
        self.app.bridge.sync_once()
        self.fake.rows[0]["status"] = "بدأ التنفيذ"
        self.assertEqual(self.app.bridge.sync_once()["triggeredLines"], 1)
        self.assertEqual(self.app.bridge.sync_once()["triggeredLines"], 0)
        self.assertEqual(self.app.state.orders(), [])

    def test_partial_screens_do_not_change_prior_baseline(self):
        self.app.bridge.screens = ["print", "laser"]
        self.fake.rows = [self.row()]
        self.fake.denied.add("laser")
        with self.assertRaisesRegex(TrendOSError, "INCOMPLETE_EMPLOYEE_SCREEN_SNAPSHOT"):
            self.app.bridge.sync_once()
        self.assertFalse(self.app.state.trendos_bridge_state().get("initialized"))
        self.assertEqual(self.app.state.orders(), [])

    def test_partial_failure_after_baseline_keeps_previous_values(self):
        self.fake.rows = [self.row()]
        self.app.bridge.sync_once()
        prior = self.app.state.trendos_bridge_state()
        self.app.bridge.screens = ["print", "laser"]
        self.fake.rows[0]["status"] = "بدأ التنفيذ"
        self.fake.denied.add("laser")
        with self.assertRaisesRegex(TrendOSError, "INCOMPLETE_EMPLOYEE_SCREEN_SNAPSHOT"):
            self.app.bridge.sync_once()
        after = self.app.state.trendos_bridge_state()
        self.assertEqual(after["lineStatuses"], prior["lineStatuses"])
        self.assertEqual(self.app.state.orders(), [])

    def test_only_literal_false_can_allow_synthetic_folder_creation(self):
        # This is direct code-level fake-data configuration only, NOT a host grant.
        for untrusted in ("false", 0, None):
            with self.subTest(untrusted=untrusted):
                config = offline_config(self.root / ("config-" + str(untrusted)))
                config["trendos"]["observeOnly"] = untrusted
                bridge_app = PrintServerApp(
                    config, Path(__file__).resolve().parents[1] / "public",
                    config_path=self.root / "synthetic-config.json",
                    write_token="AP279_TEST_ONLY_TOKEN_NEVER_FOR_PRODUCTION_2026",
                )
                self.assertTrue(bridge_app.bridge.status()["observeOnly"])
        config = offline_config(self.root / "explicit-allow")
        config["trendos"]["pollScreens"] = ["print"]
        config["trendos"]["observeOnly"] = False
        enabled_app = PrintServerApp(
            config, Path(__file__).resolve().parents[1] / "public",
            config_path=self.root / "synthetic-config-explicit.json",
            write_token="AP279_TEST_ONLY_TOKEN_NEVER_FOR_PRODUCTION_2026",
        )
        enabled_app.bridge.client = self.fake
        self.fake.rows = [self.row()]
        self.assertTrue(enabled_app.bridge.sync_once()["baselineOnly"])
        self.fake.rows[0]["status"] = "بدأ التنفيذ"
        created = enabled_app.bridge.sync_once()
        self.assertFalse(created["observeOnly"])
        self.assertEqual(len(created["created"]), 1)
        self.assertEqual(len(enabled_app.state.orders()), 1)
        self.assertTrue(Path(created["created"][0]["folder"]).is_relative_to(self.root))

    def test_inactive_status_does_not_raise_candidate(self):
        self.fake.rows = [self.row()]
        self.app.bridge.sync_once()
        self.fake.rows[0]["status"] = "تحت المراجعة"
        output = self.app.bridge.sync_once()
        self.assertEqual(output["candidateOrders"], 0)
        self.assertEqual(self.app.state.orders(), [])

    def test_fake_readonly_adapter_never_starts_polling_or_login(self):
        self.assertFalse(self.app.trendos.enabled)
        self.assertFalse(self.app.bridge.status()["running"])
        self.assertEqual(self.fake.calls, [])


if __name__ == "__main__":
    unittest.main()
