#!/usr/bin/env python3
"""ACC237 stage-only D1 bootstrap using the ORIGINAL 13 accounting migrations.

Safe by default: 'plan' is OFFLINE. 'inspect' uses GET-equivalent Wrangler
D1 list + SELECT only. 'apply' requires explicit local owner confirmation,
verified exact provider UUID, an EMPTY stage, full export, successfully tested
local SQLite restore, and exclusive change window. No secrets in arguments.
NO production, NO Worker deployment, NO financial posting, NO auto-rollback.

Run from the TrendOS Git checkout on the owner's Ubuntu machine with an
authenticated Wrangler profile. This is NOT a GitHub Actions deployment.
"""
import argparse
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

from schema_preflight import FILES, MIGRATIONS, EXPECTED_TABLES, preflight

STAGE_NAME = "easystore-accounting-staging"
STAGE_UUID = "c2fe1a54-90f5-4e6f-9d51-80ce23e21328"
HERE = Path(__file__).resolve().parent
CONFIG = HERE / "wrangler.toml"
ROOT = HERE.parents[1]  # repository root
STAGE_PREFIX = "employee_accounting_"
# Cloudflare documents exactly _cf_KV as a reserved D1 storage table.
# Exempt this EXACT name from application schema comparison only; never query,
# remove, migrate, or treat any lookalike/prefix as a reserved system table.
D1_RESERVED_STORAGE_TABLES = frozenset({"_cf_KV"})
READ_TABLES = (
    "SELECT name FROM sqlite_master WHERE type='table' "
    "AND name NOT LIKE 'sqlite_%' ORDER BY name"
)
CONTROL_SQL = ("SELECT marker,mode,next_invoice_number FROM "
               "employee_accounting_control_v1 WHERE singleton=1")
CANARY_SQL = ("SELECT enabled,max_commands,commands_started FROM "
              "employee_accounting_write_canary_v1 WHERE singleton=1")
COLUMNS_SQL = "PRAGMA table_info(employee_accounting_final_invoices_v1)"


class GateError(RuntimeError):
    pass


def stop(reason):
    raise GateError(reason)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def check_config():
    v = tomllib.loads(CONFIG.read_text(encoding="utf-8"))
    if v.get("name") != "easystore-accounting-staging-api" or v.get("workers_dev") is not False:
        stop("WORKER_STAGE_IDENTITY_OR_PRIVACY_MISMATCH")
    databases = v.get("d1_databases", [])
    if databases != [{"binding": "DB", "database_name": STAGE_NAME, "database_id": STAGE_UUID}]:
        stop("EXACT_SINGLE_FINANCE_D1_BINDING_REQUIRED")
    vars_ = v.get("vars", {})
    if (vars_.get("FINANCE_RELEASE") != "NO_GO" or
            vars_.get("FINANCE_WRITES") != "OFF" or
            vars_.get("EASYSTORE_ACCOUNTING_D1_WRITE_MODE") != "OFF" or
            vars_.get("ACCOUNTING_FINANCE_GRANTS_MODE_V1") != "ENFORCE" or
            json.loads(vars_.get("ACCOUNTING_FINANCE_GRANTS_V1", "{}")) != {"version": 1, "grants": []}):
        stop("FINANCIAL_AUTHORITY_MUST_STAY_OFF")
    if (vars_.get("EASYSTORE_CUSTOMER_SOURCE_V1") != "REMOTE_REQUIRED" or
            vars_.get("EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1") != "REMOTE_NATIVE_REQUIRED"):
        stop("INDEPENDENT_CUSTOMER_AND_EMPLOYEE_SOURCE_REQUIRED")
    # The finance Worker never binds TrendOS's operational D1 directly.
    if sorted(x.get("binding") for x in v.get("services", [])) != [
        "TRENDOS_CUSTOMER_FACTS", "TRENDOS_EMPLOYEE_SESSION"
    ]:
        stop("INDEPENDENT_INTERNAL_SERVICE_BINDINGS_MISSING")
    return v


def migration_files():
    if not MIGRATIONS.is_dir() or len(FILES) != 13:
        stop("ORIGINAL_ACCOUNTING_MIGRATIONS_NOT_FOUND")
    report, _ = preflight()
    if report["result"] != "PASS" or report["tables"] != 22:
        stop("ORIGINAL_NATIVE_SCHEMA_PREFLIGHT_FAILED")
    return [(name, digest(MIGRATIONS / name)) for name in FILES]


def safe_output_dir(path):
    if not path:
        stop("PRIVATE_BACKUP_DIRECTORY_REQUIRED")
    requested = Path(path).expanduser()
    if requested.is_symlink() or any(p.is_symlink() for p in requested.parents):
        stop("SYMLINKED_BACKUP_DIRECTORY_PROHIBITED")
    folder = requested.resolve()
    if folder == ROOT or ROOT in folder.parents or folder == Path.cwd():
        stop("NEVER_PUT_BACKUP_IN_GIT_OR_WORKING_TREE")
    if not folder.is_dir() or folder.stat().st_mode & 0o077:
        stop("PRECREATE_BACKUP_DIRECTORY_WITH_MODE_0700")
    if any(folder.iterdir()):
        stop("BACKUP_DIRECTORY_MUST_START_EMPTY")
    return folder


class Wrangler:
    def __init__(self, binary="wrangler"):
        self.binary = binary

    def run(self, *args):
        # never use shell=True or print CLI stdout/stderr; it may contain data
        cmd = [self.binary, *args, "--config", str(CONFIG)]
        try:
            out = subprocess.run(cmd, cwd=HERE, text=True, capture_output=True,
                                 timeout=150, check=False)
        except (OSError, subprocess.TimeoutExpired):
            stop("WRANGLER_UNAVAILABLE_OR_TIMED_OUT")
        if out.returncode:
            stop("WRANGLER_STAGE_OPERATION_FAILED_CHECK_PRIVATE_LOCAL_LOGS")
        return out.stdout.strip()


def strict_json(s):
    try:
        return json.loads(s)
    except (ValueError, TypeError):
        stop("UNEXPECTED_WRANGLER_JSON_SHAPE_OR_LOGS")


def list_identity(cli):
    items = strict_json(cli.run("d1", "list", "--json"))
    if not isinstance(items, list):
        stop("D1_PROVIDER_LIST_INVALID")
    matches = [x for x in items if isinstance(x, dict) and
               x.get("name") == STAGE_NAME]
    if (len(matches) != 1 or not isinstance(matches[0].get("uuid"), str) or
            matches[0]["uuid"].lower() != STAGE_UUID):
        stop("CLOUDFLARE_EXACT_STAGE_UUID_NOT_VERIFIED")
    return {"name": STAGE_NAME, "uuid": STAGE_UUID}


def rows(cli, sql):
    raw = strict_json(cli.run("d1", "execute", STAGE_NAME, "--remote",
                              "--command", sql, "--json"))
    # Wrangler returns a list of D1 execution-result entries. Refuse unknown
    # or ambiguous shapes: no 'best effort' success or guessed empty DB.
    if not isinstance(raw, list) or len(raw) != 1 or not isinstance(raw[0], dict):
        stop("D1_QUERY_RESULT_SHAPE_UNVERIFIED")
    item = raw[0]
    if item.get("success") is not True or not isinstance(item.get("results"), list):
        stop("D1_QUERY_UNSUCCESSFUL_OR_UNKNOWN")
    return item["results"]


def remote_names(cli):
    entries = rows(cli, READ_TABLES)
    if any(not isinstance(e, dict) or not isinstance(e.get("name"), str)
           for e in entries):
        stop("D1_TABLE_RESULT_INVALID")
    values = [e["name"] for e in entries]
    if len(values) != len(set(values)):
        stop("D1_DUPLICATE_TABLE_METADATA")
    return sorted(values)


def application_table_names(names):
    # Names were read verbatim from sqlite_master. Do not use startswith('_cf_')
    # because a similarly named user/application table must still STOP.
    return sorted(n for n in names if n not in D1_RESERVED_STORAGE_TABLES)


def restore_private_export(filepath, should_be_empty):
    if not filepath.is_file() or filepath.stat().st_size == 0:
        stop("REMOTE_EXPORT_EMPTY_OR_ABSENT")
    # Restore into a disposable independent SQLite (not finance DB); never
    # trust metadata alone or mistake an export for tested recovery.
    db = sqlite3.connect(":memory:")
    try:
        db.executescript(filepath.read_text(encoding="utf-8"))
        names = sorted(x[0] for x in db.execute(READ_TABLES))
        user_names = application_table_names(names)
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            stop("BACKUP_RESTORE_INTEGRITY_FAILED")
        if db.execute("PRAGMA foreign_key_check").fetchall():
            stop("BACKUP_RESTORE_FK_FAILED")
        if should_be_empty and user_names:
            stop("REMOTE_BACKUP_NOT_EMPTY_STAGE")
        return {"sha256": digest(filepath), "restoredTables": len(user_names),
                "restoredReservedTables": len(names) - len(user_names)}
    except sqlite3.DatabaseError:
        stop("REMOTE_SQL_EXPORT_LOCAL_RESTORE_FAILED")
    finally:
        db.close()


def ensure_baseline(cli, expected_names):
    names = application_table_names(remote_names(cli))
    if names != expected_names:
        stop("STAGE_SCHEMA_DRIFT_OR_UNEXPECTED_TABLES")
    ctrl = rows(cli, CONTROL_SQL)
    if len(ctrl) != 1 or tuple(ctrl[0].get(k) for k in
         ("marker", "mode", "next_invoice_number")) != (
         "ENTRY614_ACCOUNTING_V1", "OFF", 1):
        stop("STAGE_NATIVE_FINANCE_CONTROL_NOT_OFF")
    canary = rows(cli, CANARY_SQL)
    if len(canary) != 1 or tuple(canary[0].get(k) for k in
         ("enabled", "max_commands", "commands_started")) != (1, 0, 0):
        stop("STAGE_CANARY_NOT_DENY_DEFAULT")
    cols = rows(cli, COLUMNS_SQL)
    have = {c.get("name") for c in cols}
    required = {"customer_party_id", "manual_cost", "credit_applied",
                "cash_received", "credit_created"}
    if not required.issubset(have):
        stop("STAGE_FINAL_INVOICE_0031_SCHEMA_UNVERIFIED")
    return True


def inspect_stage(cli):
    """Read-only provider inventory with STRICT original-schema qualification.

    An arbitrary single table is NOT proof that all native accounting
    migrations applied, and a populated stage is NEVER safe to reapply.
    This is provider metadata only, not release or backup certification.
    """
    identity = list_identity(cli)
    names = remote_names(cli)
    user_names = application_table_names(names)
    report = {
        "target": identity, "tables": names, "userTables": user_names,
        "reservedStorageTables": sorted(set(names) & D1_RESERVED_STORAGE_TABLES),
        "readOnly": True,
        "schemaApplied": False, "financeRelease": "NO_GO",
        "financeWrites": "OFF", "mayApplyMigrations": False,
        "backupAndRestoreVerified": False,
    }
    if not user_names:
        report["inspectState"] = "EMPTY_STAGE_UNMIGRATED"
        return report

    # Compare the COMPLETE live table set to a fresh reconstruction of the
    # ORIGINAL thirteen checked-in files, without modifying the provider.
    artifacts = migration_files()
    db = sqlite3.connect(":memory:")
    try:
        for name, _ in artifacts:
            db.executescript((MIGRATIONS / name).read_text(encoding="utf-8"))
        expected = sorted(x[0] for x in db.execute(READ_TABLES))
    finally:
        db.close()
    if len(expected) != EXPECTED_TABLES:
        stop("LOCAL_EXPECTED_TABLE_SET_NOT_22")
    if user_names != expected:
        report["inspectState"] = "NONEMPTY_SCHEMA_UNQUALIFIED_STOP"
        return report

    # Even 22 matching tables could have unauthorized finance control flags
    # or a missing native 0031 invoice column. Require OFF + deny canary.
    ensure_baseline(cli, expected)
    report["inspectState"] = "NATIVE_SCHEMA_VERIFIED_WRITES_OFF"
    report["schemaApplied"] = True
    return report


def plan():
    check_config()
    artifacts = migration_files()
    return {"target": STAGE_NAME, "uuid": STAGE_UUID, "mode": "OFF",
            "migrations": [{"name": n, "sha256": h} for n, h in artifacts],
            "remoteContacted": False, "writes": False}


def apply_stage(cli, destination, confirmation, exclusive):
    if confirmation != STAGE_UUID or exclusive != "EXCLUSIVE_STAGE_CHANGE_WINDOW":
        stop("OWNER_STAGE_UUID_AND_EXCLUSIVE_WINDOW_ACK_REQUIRED")
    artifacts = migration_files()
    check_config()
    folder = safe_output_dir(destination)
    identity = list_identity(cli)
    pre_export_tables = remote_names(cli)
    if application_table_names(pre_export_tables):
        stop("EXISTING_STAGE_HAS_TABLES_STOP_NO_REAPPLY")
    # Export BEFORE any remote SQL modification, including one supposedly empty
    # D1. A locally tested SQL restore and private SHA256 are mandatory.
    backup = folder / "pre_migration_original_stage.sql"
    if backup.exists():
        stop("PRIVATE_BACKUP_PATH_ALREADY_EXISTS")
    cli.run("d1", "export", STAGE_NAME, "--remote",
            "--output", str(backup), "--skip-confirmation")
    backup.chmod(0o600)
    proof = restore_private_export(backup, should_be_empty=True)
    # Avoid quietly rewriting an intermediate state changed by another agent.
    if remote_names(cli) != pre_export_tables:
        stop("STAGE_CHANGED_DURING_BACKUP_STOP")
    statement_names = []
    try:
        for name, expected_sha in artifacts:
            target = MIGRATIONS / name
            if digest(target) != expected_sha:
                stop("MIGRATION_SOURCE_CHANGED_AFTER_PREFLIGHT")
            # Explicit file input: no operational migrations_dir and never
            # migration 0031 first. No automatic retries after partial failure.
            raw = strict_json(cli.run(
                "d1", "execute", STAGE_NAME, "--remote", "--file", str(target),
                "--yes", "--json"
            ))
            if (not isinstance(raw, list) or not raw or
                    any(not isinstance(x, dict) or x.get("success") is not True
                        for x in raw)):
                stop("REMOTE_MIGRATION_APPLY_RESULT_NOT_CONFIRMED")
            statement_names.append(name)
        # Independent expected names are built by replaying the ORIGINAL files.
        db = sqlite3.connect(":memory:")
        try:
            for name, _ in artifacts:
                db.executescript((MIGRATIONS / name).read_text(encoding="utf-8"))
            expected = sorted(x[0] for x in db.execute(READ_TABLES))
        finally:
            db.close()
        if len(expected) != EXPECTED_TABLES:
            stop("LOCAL_EXPECTED_TABLE_SET_NOT_22")
        ensure_baseline(cli, expected)
    except Exception:
        # NO destructive time-travel restore without a separate owner decision.
        # Log only migration filenames (not data/secrets); retain original SQL
        # export and stop all automation so an operator can inspect the failure.
        print("STAGE_STOP_NO_AUTOMATIC_ROLLBACK; completed_migrations=" +
              ",".join(statement_names), file=sys.stderr)
        raise
    evidence = {
        "result": "STAGE_SCHEMA_APPLIED_POSTCHECKED",
        "providerStage": identity, "remoteFinanceWrites": "OFF",
        "originalMigrations": statement_names, "verifiedTables": EXPECTED_TABLES,
        "backup": {"localFile": backup.name, **proof},
        "financialPostingTest": "NOT_RUN", "employeeService": "NOT_DEPLOYED",
        "orderOwnership": "NOT_ATTESTED", "financeRelease": "NO_GO"
    }
    (folder / "stage_schema_evidence.json").write_text(
        json.dumps(evidence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (folder / "stage_schema_evidence.json").chmod(0o600)
    return evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["plan", "inspect", "apply"])
    parser.add_argument("--private-backup-dir")
    parser.add_argument("--confirm-stage-uuid", default="")
    parser.add_argument("--exclusive-stage-window", default="")
    parser.add_argument("--wrangler", default="wrangler")
    args = parser.parse_args()
    try:
        if args.action == "plan":
            result = plan()
        else:
            check_config()
            cli = Wrangler(args.wrangler)
            if args.action == "inspect":
                result = inspect_stage(cli)
            else:
                if os.environ.get("CI", "").lower() == "true" or os.environ.get("GITHUB_ACTIONS"):
                    stop("LIVE_D1_APPLY_FORBIDDEN_FROM_CI")
                result = apply_stage(cli, args.private_backup_dir,
                                     args.confirm_stage_uuid,
                                     args.exclusive_stage_window)
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    except (GateError, ValueError, OSError) as exc:
        # Fail closed and print no credentials / SQL / financial values.
        print("ACC237_STOP: " + (str(exc) if isinstance(exc, GateError)
                                  else "LOCAL_PREFLIGHT_ERROR"), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
