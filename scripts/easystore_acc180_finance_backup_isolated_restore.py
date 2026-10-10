#!/usr/bin/env python3
"""ACC-180: isolated actual accounting SQLite schema export/restore integrity probe.

No Cloudflare credentials, production exports, production database, or network.
All input and output are generated in a disposable local temporary directory.
Success is NOT evidence that a production D1 backup/restore was attempted.
"""
import hashlib
import json
import sqlite3
import tempfile
from pathlib import Path

MIGRATIONS = (
    "0015_employee_accounting_zero_google_v1.sql",
    "0020_employee_accounting_party_master_v1.sql",
    "0021_employee_accounting_material_dimensions_v1.sql",
    "0022_employee_accounting_day_ops_v1.sql",
    "0023_employee_accounting_command_audit_v1.sql",
    "0024_employee_accounting_party_balances_v1.sql",
    "0025_employee_accounting_final_reversal_day_close_v1.sql",
    "0026_employee_accounting_tx_guard_v1.sql",
    "0027_employee_accounting_direct_sale_cost_v1.sql",
    "0028_employee_accounting_write_canary_v1.sql",
    "0029_employee_accounting_canary_mode_v1.sql",
    "0030_employee_accounting_write_canary_budget_v1.sql",
)
ROOT = Path(__file__).resolve().parents[1]
REQUIRED_TABLES = (
    "employee_accounting_control_v1",
    "employee_accounting_write_canary_v1",
    "employee_accounting_request_ledger_v1",
    "employee_accounting_materials_v1",
    "employee_accounting_party_balances_v1",
    "employee_accounting_party_ledger_v1",
    "employee_accounting_cashbox_v1",
    "employee_accounting_custody_closes_v1",
    "employee_accounting_custody_events_v1",
    "employee_accounting_events_v1",
)


class RestoreBlocked(Exception):
    pass


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def sqlite_integrity(conn):
    integrity = conn.execute("PRAGMA integrity_check").fetchall()
    if integrity != [("ok",)]:
        raise RestoreBlocked("SQLITE_INTEGRITY_CHECK_FAILED")
    if conn.execute("PRAGMA foreign_key_check").fetchall():
        raise RestoreBlocked("SQLITE_FOREIGN_KEY_CHECK_FAILED")


def canonical_value(v):
    if isinstance(v, bytes):
        return {"binary_hex": v.hex()}
    return v


def snapshot(conn):
    sqlite_integrity(conn)
    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_schema WHERE type='table' "
        "AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )]
    if not set(REQUIRED_TABLES).issubset(tables):
        raise RestoreBlocked("MISSING_REQUIRED_ACCOUNTING_TABLE")
    schema = list(conn.execute(
        "SELECT type,name,tbl_name,sql FROM sqlite_schema "
        "WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL "
        "ORDER BY type,name,tbl_name,sql"
    ))
    schema_digest = sha256(json.dumps(schema, ensure_ascii=False, separators=(",", ":")).encode())
    rows = {}
    for table in tables:
        escaped = '"' + table.replace('"', '""') + '"'
        values = [
            json.dumps([canonical_value(x) for x in row], ensure_ascii=False,
                       separators=(",", ":"), allow_nan=False)
            for row in conn.execute("SELECT * FROM " + escaped)
        ]
        values.sort()
        rows[table] = {
            "count": len(values),
            "rows_sha256": sha256(("\n".join(values) + "\n").encode()),
        }
    state = conn.execute(
        "SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1"
    ).fetchone()
    canary = conn.execute(
        "SELECT enabled,allowed_usernames_json,allowed_actions_json,"
        "max_amount,expires_at_ms,max_commands,commands_started "
        "FROM employee_accounting_write_canary_v1 WHERE singleton=1"
    ).fetchone()
    if state != ("READONLY",):
        raise RestoreBlocked("ACCOUNTING_MODE_NOT_READONLY")
    if canary != (1, "[]", "[]", 0, 0, 0, 0):
        raise RestoreBlocked("ACCOUNTING_CANARY_NOT_ZERO")
    return {
        "schema_sha256": schema_digest,
        "tables": rows,
        "accounting_mode": state[0],
        "canary_denied": True,
    }


def apply_actual_finance_migrations(conn):
    for name in MIGRATIONS:
        file = ROOT / "cloudflare-d1" / "migrations" / name
        if not file.is_file():
            raise RestoreBlocked("ACCOUNTING_MIGRATION_MISSING:" + name)
        conn.executescript(file.read_text(encoding="utf-8"))


def seed_synthetic_finance(conn):
    # Only synthetic values, in a disposable disk database.
    conn.execute(
        "UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1"
    )
    conn.execute(
        "INSERT INTO employee_accounting_materials_v1 "
        "(material_id,department,material_name,stock_qty,unit_cost) "
        "VALUES ('ACC180-FAKE-MAT-1','طباعة','ACC180_FAKE_PAPER',3,12.5)"
    )
    conn.execute(
        "INSERT INTO employee_accounting_party_balances_v1 "
        "(party_type,party_id,party_name,balance) "
        "VALUES ('supplier','ACC180-FAKE-SUP','ACC180_FAKE_SUPPLIER',37.5)"
    )
    conn.execute(
        "INSERT INTO employee_accounting_request_ledger_v1 "
        "(request_key,operation,actor,canonical_json,status) "
        "VALUES ('ACC180-FAKE-CMD','synthetic-restore','ACC180_NONPERSON','{}','COMMITTED')"
    )
    conn.commit()


def export_dump(conn):
    return ("\n".join(conn.iterdump()) + "\n").encode("utf-8")


def restore_sql_dump(dump, expected_checksum, expected_snapshot, dest_path):
    if sha256(dump) != expected_checksum:
        raise RestoreBlocked("BACKUP_SHA256_MISMATCH")
    # Only known source CI fixtures may be supplied here; never run untrusted
    # SQL or provide production financial data to this public CI.
    restored = sqlite3.connect(dest_path)
    try:
        restored.executescript(dump.decode("utf-8"))
        restored.execute("PRAGMA foreign_keys=ON")
        actual = snapshot(restored)
        if actual != expected_snapshot:
            raise RestoreBlocked("RESTORE_SCHEMA_OR_ROWS_MISMATCH")
        return actual
    except (sqlite3.DatabaseError, UnicodeError, ValueError) as e:
        raise RestoreBlocked("SQLITE_RESTORE_FAILED:" + type(e).__name__) from e
    finally:
        restored.close()


def backup_restore_synthetic():
    with tempfile.TemporaryDirectory(prefix="acc180-local-") as directory:
        folder = Path(directory)
        source = sqlite3.connect(folder / "synthetic-source.db")
        source.execute("PRAGMA foreign_keys=ON")
        try:
            apply_actual_finance_migrations(source)
            seed_synthetic_finance(source)
            before = snapshot(source)
            if before["tables"]["employee_accounting_materials_v1"]["count"] != 1:
                raise RestoreBlocked("FIXTURE_MATERIAL_MISSING")
            if before["tables"]["employee_accounting_request_ledger_v1"]["count"] != 1:
                raise RestoreBlocked("FIXTURE_LEDGER_MISSING")
            if before["tables"]["employee_accounting_party_balances_v1"]["count"] != 1:
                raise RestoreBlocked("FIXTURE_PARTY_BALANCE_MISSING")
            dump = export_dump(source)
            export_hash = sha256(dump)
            dump_path = folder / "synthetic-accounting-export.sql"
            dump_path.write_bytes(dump)
            if sha256(dump_path.read_bytes()) != export_hash:
                raise RestoreBlocked("BACKUP_FILE_CHECKSUM_MISMATCH")
            restored = restore_sql_dump(
                dump_path.read_bytes(), export_hash, before, folder / "isolated-restored.db"
            )
            # A second independent, SQLite-native backup/restore tests byte/
            # page-level copy alongside the D1-style SQL export/import path.
            copy = sqlite3.connect(folder / "isolated-sqlite-backup.db")
            try:
                source.backup(copy)
                if snapshot(copy) != before:
                    raise RestoreBlocked("SQLITE_NATIVE_BACKUP_MISMATCH")
            finally:
                copy.close()
            if restored != before:
                raise RestoreBlocked("RESTORED_LEDGER_MISMATCH")
            report = {
                "schema": "ACC180_ACCOUNTING_SQLITE_SYNTHETIC_RESTORE_V1",
                "actual_migration_count": len(MIGRATIONS),
                "synthetic_sql_export_sha256": export_hash,
                "synthetic_sql_export_bytes": len(dump),
                "synthetic_schema_sha256": before["schema_sha256"],
                "accounting_tables_probed": len(before["tables"]),
                "required_finance_tables_present": True,
                "source_vs_export_restored_schema_and_all_rows_match": True,
                "source_vs_native_backup_all_rows_match": True,
                "sqlite_integrity_and_foreign_keys": "PASS",
                "source_and_restored_authority": "READONLY_ZERO_CANARY",
                "synthetic_only": True,
                "actual_cloudflare_d1_backup_created": False,
                "actual_production_backup_restored": False,
                "production_worker_rollback_proved": False,
                "finance_release_decision": "NO_GO",
                "production_mutations": 0,
            }
            # Do not persist dump, physical SQLite backup, or row data as CI artifacts.
            return report, dump, before
        finally:
            source.close()


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    report, _, _ = backup_restore_synthetic()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("ACC180_REAL_ACCOUNTING_MIGRATIONS=" + str(report["actual_migration_count"]))
    print("ACC180_ISOLATED_SQL_EXPORT_RESTORE_SCHEMA_ALL_ROWS=PASS")
    print("ACC180_ISOLATED_SQLITE_NATIVE_BACKUP_RESTORE=PASS")
    print("ACC180_READONLY_AND_ZERO_CANARY_IN_RESTORED_DATA=PASS")
    print("ACC180_PRODUCTION_D1_BACKUP_AND_RESTORE=NOT_PERFORMED")
    print("ACC180_RELEASE_DECISION=NO_GO")
    print("ACC180_PRODUCTION_MUTATIONS=ZERO")


if __name__ == "__main__":
    main()
