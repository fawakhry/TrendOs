"""ACC237 stage bootstrap fixture tests: NO network, NO live Cloudflare."""
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import stage_d1_bootstrap as b


def expected_tables():
    db = sqlite3.connect(":memory:")
    try:
        for name in b.FILES:
            db.executescript((b.MIGRATIONS / name).read_text(encoding="utf-8"))
        return sorted(r[0] for r in db.execute(b.READ_TABLES))
    finally:
        db.close()


class OfflineWrangler:
    def __init__(self, uuid=b.STAGE_UUID, present=None, bad_export=False,
                 fail_after=None, drift_on_second_read=False):
        self.uuid = uuid
        self.present = present if present is not None else []
        self.bad_export = bad_export
        self.fail_after = fail_after
        self.drift_on_second_read = drift_on_second_read
        self.commands = []
        self.apply_files = []
        self.table_reads = 0

    def run(self, *cmd):
        self.commands.append(cmd)
        if cmd[:2] == ("d1", "list"):
            return json.dumps([{"name": b.STAGE_NAME, "uuid": self.uuid}])
        if cmd[:2] == ("d1", "export"):
            target = Path(cmd[cmd.index("--output") + 1])
            target.write_text(
                "THIS-IS-NOT-SQL" if self.bad_export else
                "BEGIN TRANSACTION;\nCOMMIT;\n", encoding="utf-8"
            )
            return ""
        if cmd[:2] == ("d1", "execute") and "--command" in cmd:
            sql = cmd[cmd.index("--command") + 1]
            if sql == b.READ_TABLES:
                self.table_reads += 1
                present = (self.present + ["t12_customers"]) if (
                    self.drift_on_second_read and self.table_reads == 2) else self.present
                return json.dumps([{"success": True,
                                    "results": [{"name": x} for x in present]}])
            if sql == b.CONTROL_SQL:
                return json.dumps([{"success": True,"results":[{
                    "marker": "ENTRY614_ACCOUNTING_V1",
                    "mode": "OFF", "next_invoice_number": 1
                }]}])
            if sql == b.CANARY_SQL:
                return json.dumps([{"success": True,"results":[{
                    "enabled": 1, "max_commands": 0, "commands_started": 0
                }]}])
            if sql == b.COLUMNS_SQL:
                return json.dumps([{"success": True, "results":[{"name":x} for x in
                    ["customer_party_id", "manual_cost", "credit_applied",
                     "cash_received", "credit_created"]]}])
            raise AssertionError("UNRECOGNIZED_REMOTE_SQL")
        if cmd[:2] == ("d1", "execute") and "--file" in cmd:
            name = Path(cmd[cmd.index("--file") + 1]).name
            if self.fail_after is not None and len(self.apply_files) >= self.fail_after:
                raise b.GateError("SIMULATED_MIGRATION_APPLY_FAILURE")
            self.apply_files.append(name)
            if len(self.apply_files) == len(b.FILES):
                self.present = expected_tables()
            return '[{"success":true,"results":[]}]'
        raise AssertionError("UNRECOGNIZED_FAKE_WRANGLER_COMMAND")


class StageBootstrapTests(unittest.TestCase):
    def test_plan_is_offline_and_schema_untouched(self):
        plan = b.plan()
        self.assertFalse(plan["remoteContacted"])
        self.assertFalse(plan["writes"])
        self.assertEqual(plan["uuid"], b.STAGE_UUID)
        self.assertEqual(len(plan["migrations"]), 13)
        self.assertEqual(plan["migrations"][0]["name"], b.FILES[0])
        self.assertEqual(plan["migrations"][-1]["name"], b.FILES[-1])
        self.assertTrue(all(len(x["sha256"]) == 64 for x in plan["migrations"]))

    def test_success_only_on_exact_stage_after_private_restored_backup(self):
        with tempfile.TemporaryDirectory() as folder:
            cli = OfflineWrangler()
            evidence = b.apply_stage(cli, folder, b.STAGE_UUID,
                                     "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(evidence["result"], "STAGE_SCHEMA_APPLIED_POSTCHECKED")
            self.assertEqual(evidence["remoteFinanceWrites"], "OFF")
            self.assertEqual(cli.apply_files, b.FILES)
            self.assertEqual(evidence["verifiedTables"], 22)
            self.assertEqual(evidence["backup"]["restoredTables"], 0)
            path = Path(folder) / "pre_migration_original_stage.sql"
            self.assertEqual(evidence["backup"]["sha256"], b.digest(path))
            self.assertEqual(path.stat().st_mode & 0o077, 0)
            self.assertTrue((Path(folder) / "stage_schema_evidence.json").is_file())
            self.assertFalse(any("trendos-main" in str(c) for c in cli.commands))
            self.assertFalse(any("delete" in c or "restore" in c
                                 for cmd in cli.commands for c in cmd))

    def test_absent_explicit_owner_gate_cannot_touch_any_remote_api(self):
        cli = OfflineWrangler()
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(b.GateError, "ACK_REQUIRED"):
                b.apply_stage(cli, folder, "", "")
        self.assertEqual(cli.commands, [])

    def test_wrong_stage_uuid_stops_before_backup_or_migrations(self):
        with tempfile.TemporaryDirectory() as folder:
            cli = OfflineWrangler(uuid="00000000-0000-0000-0000-000000000000")
            with self.assertRaisesRegex(b.GateError, "UUID_NOT_VERIFIED"):
                b.apply_stage(cli, folder, b.STAGE_UUID,
                              "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, [])
            self.assertFalse(any(c[:2] == ("d1", "export") for c in cli.commands))

    def test_nonempty_finance_or_operational_stage_is_immutable(self):
        for name in ("employee_accounting_control_v1", "t12_customers", "orders"):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                cli = OfflineWrangler(present=[name])
                with self.assertRaisesRegex(b.GateError, "EXISTING_STAGE_HAS_TABLES"):
                    b.apply_stage(cli, folder, b.STAGE_UUID,
                                  "EXCLUSIVE_STAGE_CHANGE_WINDOW")
                self.assertEqual(cli.apply_files, [])
                self.assertFalse(any(c[:2] == ("d1", "export") for c in cli.commands))

    def test_invalid_or_incomplete_backup_never_runs_migrations(self):
        with tempfile.TemporaryDirectory() as folder:
            cli = OfflineWrangler(bad_export=True)
            with self.assertRaisesRegex(b.GateError, "LOCAL_RESTORE_FAILED"):
                b.apply_stage(cli, folder, b.STAGE_UUID,
                              "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, [])

    def test_drift_during_export_halts_without_migrations(self):
        with tempfile.TemporaryDirectory() as folder:
            cli = OfflineWrangler(drift_on_second_read=True)
            with self.assertRaisesRegex(b.GateError, "STAGE_CHANGED_DURING_BACKUP"):
                b.apply_stage(cli, folder, b.STAGE_UUID,
                              "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, [])

    def test_partial_remote_apply_never_auto_restores_or_retries(self):
        with tempfile.TemporaryDirectory() as folder:
            cli = OfflineWrangler(fail_after=3)
            with self.assertRaisesRegex(b.GateError, "SIMULATED_MIGRATION_APPLY_FAILURE"):
                b.apply_stage(cli, folder, b.STAGE_UUID,
                              "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, b.FILES[:3])
            self.assertTrue((Path(folder) / "pre_migration_original_stage.sql").exists())
            self.assertFalse((Path(folder) / "stage_schema_evidence.json").exists())
            self.assertFalse(any(x in c for cmd in cli.commands for c in cmd
                                 for x in ("time-travel", "restore", "delete")))

    def test_wrong_configuration_or_unprotected_backup_halts_before_remote(self):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder).chmod(0o755)
            with self.assertRaisesRegex(b.GateError, "MODE_0700"):
                b.safe_output_dir(folder)
            Path(folder).chmod(0o700)
            (Path(folder) / "existing_file").write_text("not safe", encoding="utf-8")
            with self.assertRaisesRegex(b.GateError, "START_EMPTY"):
                b.safe_output_dir(folder)

    def test_response_shape_fails_closed_even_if_json_looks_successful(self):
        class Invalid(OfflineWrangler):
            def run(self,*cmd):
                if "--command" in cmd: return '{"results":[]}'
                return super().run(*cmd)
        with self.assertRaisesRegex(b.GateError, "RESULT_SHAPE"):
            b.remote_names(Invalid())


if __name__ == "__main__":
    unittest.main()
