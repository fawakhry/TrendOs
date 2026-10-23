#!/usr/bin/env python3
"""ACC234: rehearse ORIGINAL EasyStore native schema in disposable SQLite only.

No D1 credentials, no network, no Wrangler invocation, no production mutations.
Migration inputs are copied verbatim from this same TrendOS branch; never from
operational migrations or a secondary finance engine.
"""
import argparse
import json
import re
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
MIGRATIONS = HERE.parent / "migrations"
FILES = [
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
    "0031_employee_accounting_customer_advance_credit_v1.sql",
]
EXPECTED_TABLES = 22
REQUIRED_FINAL_COLUMNS = {
    "customer_party_id", "manual_cost", "credit_applied",
    "cash_received", "credit_created"
}

def assert_safe_sql(filename: str, source: str):
    # The baseline's only durable objects must be from the native accounting
    # namespace. Never allow an operational table as a schema prerequisite.
    refs = re.findall(
        r"\b(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE|"
        r"DROP\s+TABLE(?:\s+IF\s+EXISTS)?)\s+([A-Za-z_][A-Za-z_0-9]*)",
        source, flags=re.I,
    )
    if not refs or any(not x.lower().startswith("employee_accounting_") for x in refs):
        raise RuntimeError(f"Foreign schema DDL prohibited in {filename}: {refs}")
    # A finance baseline must never depend on a local copy of customer/order
    # truth. SQL referencing the original operational tables is unsafe here.
    if re.search(r"\bt12_[A-Za-z_0-9]+\b", source, re.I):
        raise RuntimeError(f"Operational T12 dependency prohibited in {filename}")

def preflight(root: Path = MIGRATIONS):
    connection = sqlite3.connect(":memory:")
    connection.execute("PRAGMA foreign_keys=ON")
    texts = []
    try:
        for name in FILES:
            sql = (root / name).read_text(encoding="utf-8")
            assert_safe_sql(name, sql)
            connection.executescript(sql)
            texts.append((name, sql))
        tables = {
            row[0] for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        if len(tables) != EXPECTED_TABLES or any(
            not name.startswith("employee_accounting_") for name in tables
        ):
            raise RuntimeError(f"Unexpected standalone accounting table set ({len(tables)}): {sorted(tables)}")
        control = connection.execute(
            "SELECT marker,mode,next_invoice_number FROM employee_accounting_control_v1 WHERE singleton=1"
        ).fetchone()
        if control != ("ENTRY614_ACCOUNTING_V1", "OFF", 1):
            raise RuntimeError(f"Native control must be OFF on isolated bootstrap: {control}")
        canary = connection.execute(
            "SELECT enabled,max_commands,commands_started FROM employee_accounting_write_canary_v1 WHERE singleton=1"
        ).fetchone()
        if canary != (1, 0, 0):
            raise RuntimeError(f"Write canary must deny by default: {canary}")
        cols = {
            row[1] for row in connection.execute(
                "PRAGMA table_info(employee_accounting_final_invoices_v1)"
            )
        }
        missing = REQUIRED_FINAL_COLUMNS - cols
        if missing:
            raise RuntimeError(f"Native invoice schema missing columns: {sorted(missing)}")
        if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("SQLite integrity check failed")
        if connection.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("Foreign key violations")
        for table in tables - {
            "employee_accounting_control_v1", "employee_accounting_write_canary_v1"
        }:
            if connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] != 0:
                raise RuntimeError(f"Nonempty finance table on fresh bootstrap: {table}")
        # Exercise the ORIGINAL idempotency unique key with fake values only.
        fake = ("ACC234-FAKE-REQUEST", "synthetic_test", "ACC234_FAKE", "{}")
        connection.execute(
            "INSERT INTO employee_accounting_request_ledger_v1 "
            "(request_key,operation,actor,canonical_json,status) VALUES(?,?,?,?,'PREPARED')", fake
        )
        try:
            connection.execute(
                "INSERT INTO employee_accounting_request_ledger_v1 "
                "(request_key,operation,actor,canonical_json,status) VALUES(?,?,?,?,'PREPARED')", fake
            )
        except sqlite3.IntegrityError:
            pass
        else:
            raise RuntimeError("Duplicate financial request was accepted")
        connection.rollback()
        return {"result": "PASS", "environment": "DISPOSABLE_SQLITE_ONLY",
                "schema": "ORIGINAL_NATIVE_ACCOUNTING_0015_0020_TO_0031",
                "migrations": len(texts), "tables": len(tables),
                "control": "OFF", "canary": "DENY",
                "idempotency": "DUPLICATE_REJECTED",
                "cloudflareStageTouched": False}, texts
    finally:
        connection.close()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--emit-sql", type=Path, help="Optional LOCAL SQL bundle only; never applies to Cloudflare")
    args = parser.parse_args()
    report, files = preflight()
    if args.emit_sql:
        args.emit_sql.write_text(
            "-- ACC234 LOCAL REVIEW ARTIFACT. DO NOT EXECUTE BEFORE OWNER STAGE GATES.\n"
            + "\n".join(f"\n-- ORIGINAL: {name}\n{sql}\n" for name,sql in files),
            encoding="utf-8")
    print(json.dumps(report, sort_keys=True))

if __name__ == "__main__":
    main()
