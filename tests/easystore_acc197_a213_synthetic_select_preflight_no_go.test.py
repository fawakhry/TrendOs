#!/usr/bin/env python3
"""Never runs a real canary: falsified control/custody states must STOP offline."""
import importlib.util
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/easystore_acc197_a213_synthetic_select_preflight_no_go.py"
SPEC = importlib.util.spec_from_file_location("acc197_no_go", SCRIPT)
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)


class A213SyntheticOnly(unittest.TestCase):
    def setUp(self):
        self.db = guard.new_synthetic_readonly_db()
        self.addCleanup(self.db.close)

    def tamper(self, sql):
        # The perturbation is fabricated in disposable local :memory: SQLite,
        # then query_only is reenabled to prove read-only checks reject it.
        self.db.execute("PRAGMA query_only=OFF")
        self.db.execute(sql)
        self.db.commit()
        self.db.execute("PRAGMA query_only=ON")
        with self.assertRaises(guard.A213Stop):
            guard.audit_readonly_preflight(self.db)

    def test_clean_readonly_no_go(self):
        result=guard.audit_readonly_preflight(self.db)
        self.assertEqual(result["g1"], "OPEN")
        self.assertEqual(result["release_decision"], "NO_GO")
        self.assertFalse(result["real_d1_queried"])
        self.assertFalse(result["real_employee_session"])
        self.assertIsNone(result["trial_run_id"])
        self.assertEqual(result["checked_tables"], len(guard.FINANCIAL_TABLES))

    def test_query_only_rejects_any_fake_financial_write(self):
        guard.verify_sqlite_write_denial(self.db)

    def test_general_mode_rejected(self):
        self.tamper("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1")

    def test_canary_mode_rejected(self):
        self.tamper("UPDATE employee_accounting_control_v1 SET mode='CANARY' WHERE singleton=1")

    def test_disabled_canary_guard_rejected(self):
        self.tamper("UPDATE employee_accounting_write_canary_v1 SET enabled=0 WHERE singleton=1")

    def test_employee_allowlist_rejected(self):
        self.tamper("""UPDATE employee_accounting_write_canary_v1
                       SET allowed_usernames_json='["FAKE_EMPLOYEE"]' WHERE singleton=1""")

    def test_action_allowlist_rejected(self):
        self.tamper("""UPDATE employee_accounting_write_canary_v1
                       SET allowed_actions_json='["closeCustodyV1"]' WHERE singleton=1""")

    def test_amount_budget_rejected(self):
        self.tamper("UPDATE employee_accounting_write_canary_v1 SET max_amount=1 WHERE singleton=1")

    def test_command_budget_rejected(self):
        self.tamper("UPDATE employee_accounting_write_canary_v1 SET max_commands=1 WHERE singleton=1")

    def test_command_counter_rejected(self):
        self.tamper("UPDATE employee_accounting_write_canary_v1 SET commands_started=1 WHERE singleton=1")

    def test_expiration_rejected(self):
        self.tamper("UPDATE employee_accounting_write_canary_v1 SET expires_at_ms=999999 WHERE singleton=1")

    def test_unexpected_fake_purchase_rejected(self):
        self.tamper("""INSERT INTO employee_accounting_purchase_invoices_v1
                       (purchase_id,request_key,work_date,created_at_ms)
                       VALUES('FAKE-BUY','FAKE-RQ','2099-01-01',1)""")

    def test_query_only_flag_off_rejected(self):
        self.db.execute("PRAGMA query_only=OFF")
        with self.assertRaises(guard.A213Stop):
            guard.audit_readonly_preflight(self.db)


if __name__ == "__main__":
    unittest.main()
