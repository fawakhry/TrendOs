#!/usr/bin/env python3
"""ACC197: A2.13 protocol SELECT-only rehearsal on throwaway local SQLite.

No Cloudflare credentials, live D1, actual employee sessions, canary execution,
production read or accounting/printshop business data. Genuine G1 remains OPEN.
"""
import importlib.util
import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/easystore_acc180_finance_backup_isolated_restore.py"
SPEC = importlib.util.spec_from_file_location("acc180_synthetic_only", SOURCE)
ACC180 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ACC180)
CUSTODY_TABLES = (
    "employee_accounting_custody_events_v1",
    "employee_accounting_custody_closes_v1",
)
FINANCIAL_TABLES = (
    "employee_accounting_materials_v1",
    "employee_accounting_parties_v1",
    "employee_accounting_purchase_invoices_v1",
    "employee_accounting_final_invoices_v1",
    "employee_accounting_cashbox_v1",
    "employee_accounting_party_balances_v1",
    "employee_accounting_party_ledger_v1",
    "employee_accounting_stock_moves_v1",
    "employee_accounting_custody_events_v1",
    "employee_accounting_custody_closes_v1",
    "employee_accounting_request_ledger_v1",
    "employee_accounting_events_v1",
    "employee_accounting_day_closes_v1",
)


class A213Stop(ValueError):
    pass


def require(ok, why):
    if not ok:
        raise A213Stop("ACC197_SAFE_STOP_" + why)


def new_synthetic_readonly_db():
    """Migrations and fake fixtures touch ONLY an SQLite :memory: database."""
    conn = sqlite3.connect(":memory:")
    try:
        require(len(ACC180.MIGRATIONS) == 12, "EXPECTED_12_ACCOUNTING_MIGRATIONS")
        ACC180.apply_actual_finance_migrations(conn)
        # Simulated READONLY preflight matches historical expected mode, NOT
        # a change to the real Worker, production account or D1 state.
        conn.execute(
            "UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1"
        )
        conn.commit()
        conn.execute("PRAGMA query_only=ON")
        require(conn.execute("PRAGMA query_only").fetchone() == (1,), "QUERY_ONLY_NOT_SET")
        return conn
    except Exception:
        conn.close()
        raise


def audit_readonly_preflight(conn):
    """Only SELECT and read-only PRAGMAs. Reject any unapproved fixture drift."""
    require(conn.execute("PRAGMA query_only").fetchone() == (1,), "SELECT_ONLY_GUARD_OFF")
    require(conn.execute("PRAGMA integrity_check").fetchall() == [("ok",)],
            "SQLITE_INTEGRITY_FAILURE")
    require(not conn.execute("PRAGMA foreign_key_check").fetchall(),
            "SQLITE_FOREIGN_KEYS_INVALID")
    control = conn.execute(
        "SELECT mode,policy_epoch,next_invoice_number FROM "
        "employee_accounting_control_v1 WHERE singleton=1"
    ).fetchone()
    require(control is not None, "CONTROL_ROW_MISSING")
    require(control[0] == "READONLY", "MODE_NOT_READONLY")
    require(control[1] >= 1 and control[2] == 1, "CONTROL_BASELINE_DRIFT")
    canary = conn.execute(
        "SELECT enabled,allowed_usernames_json,allowed_actions_json,max_amount,"
        "expires_at_ms,max_commands,commands_started "
        "FROM employee_accounting_write_canary_v1 WHERE singleton=1"
    ).fetchone()
    # enabled=1 means the default deny-all guard is ACTIVE, not that anyone
    # has been authorized to execute a canary.
    require(canary == (1, "[]", "[]", 0, 0, 0, 0),
            "CANARY_NOT_STRICT_DENY_ALL")
    counts = {}
    for name in FINANCIAL_TABLES:
        count = conn.execute('SELECT COUNT(*) FROM "' + name + '"').fetchone()[0]
        require(count == 0, "SYNTHETIC_OPENING_DIFF_" + name)
        counts[name] = count
    return {
        "schema": "ACC197_A213_ISOLATED_SELECT_PREFLIGHT_V1",
        "source": "CHECKED_IN_SQL_MIGRATIONS_SYNTHETIC_ONLY",
        "finance_state": "READONLY",
        "server_canary": "DENY_ALL",
        "read_authority": "QUERY_ONLY",
        "checked_tables": len(counts),
        "real_d1_queried": False,
        "real_employee_session": False,
        "trial_run_id": None,
        "trial_budget": 0,
        "g1": "OPEN",
        "release_decision": "NO_GO",
    }


def verify_sqlite_write_denial(conn):
    """A negative local SQLite write attempt must fail before any row changes."""
    before = conn.execute(
        "SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1"
    ).fetchone()
    try:
        conn.execute("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1")
    except sqlite3.OperationalError:
        pass
    else:
        raise A213Stop("ACC197_SAFE_STOP_SQLITE_WROTE_WHILE_QUERY_ONLY")
    after = conn.execute(
        "SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1"
    ).fetchone()
    require(before == after == ("READONLY",), "SQLITE_WRITE_DENIAL_CHANGED_MODE")


def main():
    db = new_synthetic_readonly_db()
    try:
        proof = audit_readonly_preflight(db)
        verify_sqlite_write_denial(db)
        assert proof["g1"] == "OPEN" and proof["release_decision"] == "NO_GO"
        print("ACC197_A213_12_REAL_MIGRATIONS_SYNTHETIC_SELECT_ONLY=PASS")
        print("ACC197_SQLITE_PRAGMA_QUERY_ONLY_WRITE_DENIED=PASS")
        print("ACC197_AUTHENTIC_CUSTODY_TRIAL=NOT_EXECUTED")
        print("ACC197_OWNER_G1=OPEN")
        print("FINANCE_RELEASE=NO_GO")
        return proof
    finally:
        db.close()


if __name__ == "__main__":
    try:
        main()
    except (A213Stop, sqlite3.Error, OSError, AssertionError, ValueError) as exc:
        print("ACC197_SYNTHETIC_PREFLIGHT=FAIL: " + str(exc), file=sys.stderr)
        sys.exit(1)
