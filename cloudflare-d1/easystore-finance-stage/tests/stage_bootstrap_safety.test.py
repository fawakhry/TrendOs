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
                # D1's reserved storage table persists independently of the
                # original EasyStore finance schema migrations.
                self.present = sorted(set(expected_tables()) |
                                      (set(self.present) & b.D1_RESERVED_STORAGE_TABLES))
            return '[{"success":true,"results":[]}]'
        raise AssertionError("UNRECOGNIZED_FAKE_WRANGLER_COMMAND")


class StageBootstrapTests(unittest.TestCase):
    def test_inspect_empty_has_no_false_positive_or_provider_write(self):
        cli = OfflineWrangler()
        report = b.inspect_stage(cli)
        self.assertEqual(report["inspectState"], "EMPTY_STAGE_UNMIGRATED")
        self.assertFalse(report["schemaApplied"])
        self.assertFalse(report["mayApplyMigrations"])
        self.assertFalse(report["backupAndRestoreVerified"])
        self.assertEqual(report["financeRelease"], "NO_GO")
        self.assertEqual(report["financeWrites"], "OFF")
        self.assertFalse(any(c[:2] == ("d1", "export") or "--file" in c
                             for c in cli.commands))

    def test_inspect_exact_cloudflare_storage_table_is_not_finance_schema(self):
        cli = OfflineWrangler(present=["_cf_KV"])
        report = b.inspect_stage(cli)
        self.assertEqual(report["target"]["uuid"], b.STAGE_UUID)
        self.assertEqual(report["tables"], ["_cf_KV"])
        self.assertEqual(report["reservedStorageTables"], ["_cf_KV"])
        self.assertEqual(report["userTables"], [])
        self.assertEqual(report["inspectState"], "EMPTY_STAGE_UNMIGRATED")
        self.assertFalse(report["schemaApplied"])
        self.assertFalse(report["mayApplyMigrations"])
        self.assertFalse(report["backupAndRestoreVerified"])
        self.assertEqual(report["financeWrites"], "OFF")
        self.assertEqual(report["financeRelease"], "NO_GO")
        self.assertFalse(any("export" in c or "--file" in c
                             for cmd in cli.commands for c in cmd))

    def test_only_exact_cf_reserved_spelling_is_exempted(self):
        for name in ("_cf_kv", "_cf_KV_backup", "_cf_KV2", "_cf_OTHER",
                     "trendos_customer", "employee_accounting_unexpected"):
            with self.subTest(name=name):
                cli = OfflineWrangler(present=["_cf_KV", name])
                report = b.inspect_stage(cli)
                self.assertEqual(report["inspectState"],
                                 "NONEMPTY_SCHEMA_UNQUALIFIED_STOP")
                self.assertEqual(report["userTables"], [name])
                self.assertFalse(report["schemaApplied"])
                self.assertFalse(report["mayApplyMigrations"])
                with tempfile.TemporaryDirectory() as folder:
                    rejected = OfflineWrangler(present=["_cf_KV", name])
                    with self.assertRaisesRegex(b.GateError, "EXISTING_STAGE_HAS_TABLES"):
                        b.apply_stage(rejected, folder, b.STAGE_UUID,
                                      "EXCLUSIVE_STAGE_CHANGE_WINDOW")
                    self.assertEqual(rejected.apply_files, [])
                    self.assertFalse(any(cmd[:2] == ("d1", "export")
                                         for cmd in rejected.commands))

    def test_native_schema_plus_cf_reserved_still_checks_canary_off(self):
        cli = OfflineWrangler(present=["_cf_KV", *expected_tables()])
        report = b.inspect_stage(cli)
        self.assertTrue(report["schemaApplied"])
        self.assertEqual(report["inspectState"], "NATIVE_SCHEMA_VERIFIED_WRITES_OFF")
        self.assertEqual(report["reservedStorageTables"], ["_cf_KV"])
        self.assertEqual(len(report["userTables"]), 22)
        self.assertFalse(report["mayApplyMigrations"])
        self.assertFalse(report["backupAndRestoreVerified"])

    def test_synthetic_stage_apply_with_cf_storage_reservation_keeps_preflight(self):
        # Offline FakeWrangler only, exercising the pre-existing owner gate,
        # private export+restore, recheck and all original migrations.
        # This is NOT a grant or a remote migration.
        class ExportWithCfTable(OfflineWrangler):
            def run(self, *cmd):
                if cmd[:2] == ("d1", "export"):
                    self.commands.append(cmd)
                    target = Path(cmd[cmd.index("--output") + 1])
                    target.write_text(
                        "CREATE TABLE _cf_KV(key TEXT PRIMARY KEY, value BLOB)"
                        " WITHOUT ROWID;\\n", encoding="utf-8")
                    return ""
                return super().run(*cmd)

        with tempfile.TemporaryDirectory() as folder:
            cli = ExportWithCfTable(present=["_cf_KV"])
            evidence = b.apply_stage(cli, folder, b.STAGE_UUID,
                                     "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, b.FILES)
            self.assertEqual(evidence["backup"]["restoredTables"], 0)
            self.assertEqual(evidence["backup"]["restoredReservedTables"], 1)
            self.assertEqual(evidence["remoteFinanceWrites"], "OFF")
            self.assertIn("_cf_KV", cli.present)
            self.assertEqual(len(b.application_table_names(cli.present)), 22)

    def test_inspect_partial_or_mixed_schema_never_certified(self):
        native = expected_tables()
        for tables in ([native[0]], native[:-1],
                       native + ["t12_customers"], ["t12_prod_orders"]):
            with self.subTest(count=len(tables)):
                cli = OfflineWrangler(present=tables)
                report = b.inspect_stage(cli)
                self.assertEqual(report["inspectState"],
                                 "NONEMPTY_SCHEMA_UNQUALIFIED_STOP")
                self.assertFalse(report["schemaApplied"])
                self.assertFalse(report["mayApplyMigrations"])
                self.assertFalse(any(c[:2] == ("d1", "export") or
                                     "--file" in c for c in cli.commands))

    def test_inspect_exact_native_schema_requires_off_and_canary(self):
        cli = OfflineWrangler(present=expected_tables())
        report = b.inspect_stage(cli)
        self.assertEqual(report["inspectState"], "NATIVE_SCHEMA_VERIFIED_WRITES_OFF")
        self.assertTrue(report["schemaApplied"])
        self.assertFalse(report["mayApplyMigrations"])
        self.assertFalse(report["backupAndRestoreVerified"])
        self.assertEqual(report["financeRelease"], "NO_GO")
        self.assertFalse(any(c[:2] == ("d1", "export") or
                             "--file" in c for c in cli.commands))

        class UnsafeCanary(OfflineWrangler):
            def run(self, *cmd):
                if "--command" in cmd and cmd[cmd.index("--command") + 1] == b.CANARY_SQL:
                    return json.dumps([{"success": True, "results": [
                        {"enabled": 1, "max_commands": 1, "commands_started": 0}
                    ]}])
                return super().run(*cmd)

        with self.assertRaisesRegex(b.GateError, "STAGE_CANARY_NOT_DENY_DEFAULT"):
            b.inspect_stage(UnsafeCanary(present=expected_tables()))

    def test_inspect_wrong_provider_uuid_fails_before_any_query(self):
        cli = OfflineWrangler(uuid="00000000-0000-0000-0000-000000000000")
        with self.assertRaisesRegex(b.GateError, "UUID_NOT_VERIFIED"):
            b.inspect_stage(cli)
        self.assertEqual(len(cli.commands), 1)
        self.assertEqual(cli.commands[0][:2], ("d1", "list"))

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

    def test_provider_soft_failure_does_not_count_as_applied(self):
        class SoftFail(OfflineWrangler):
            def run(self, *cmd):
                if "--file" in cmd:
                    return '[{"success":false,"results":[]}]'
                return super().run(*cmd)
        with tempfile.TemporaryDirectory() as folder:
            cli = SoftFail()
            with self.assertRaisesRegex(
                b.GateError, "REMOTE_MIGRATION_APPLY_RESULT_NOT_CONFIRMED"
            ):
                b.apply_stage(cli, folder, b.STAGE_UUID,
                              "EXCLUSIVE_STAGE_CHANGE_WINDOW")
            self.assertEqual(cli.apply_files, [])
            self.assertTrue((Path(folder) / "pre_migration_original_stage.sql").is_file())
            self.assertFalse((Path(folder) / "stage_schema_evidence.json").exists())

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
