#!/usr/bin/env python3
"""ACC-180 adversarial offline backup/restore validation: no production data."""
import hashlib
import importlib.util
import sqlite3
import tempfile
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "acc180", "scripts/easystore_acc180_finance_backup_isolated_restore.py"
)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

report, original, expected = m.backup_restore_synthetic()
assert report["actual_migration_count"] == 12
assert report["required_finance_tables_present"]
assert report["source_vs_export_restored_schema_and_all_rows_match"]
assert report["source_vs_native_backup_all_rows_match"]
assert report["sqlite_integrity_and_foreign_keys"] == "PASS"
assert report["synthetic_only"] is True
assert report["actual_cloudflare_d1_backup_created"] is False
assert report["actual_production_backup_restored"] is False
assert report["finance_release_decision"] == "NO_GO"
assert report["production_mutations"] == 0

with tempfile.TemporaryDirectory(prefix="acc180-adversarial-") as directory:
    folder = Path(directory)
    def denied(data, checksum, expected_snapshot, message, filename):
        try:
            m.restore_sql_dump(data, checksum, expected_snapshot, folder / filename)
        except m.RestoreBlocked as e:
            assert message in str(e), f"expected {message}, got {e}"
        else:
            raise AssertionError("MUST_BLOCK_INVALID_RESTORE:" + message)

    valid_hash = hashlib.sha256(original).hexdigest()
    denied(original + b"\n-- subtle unapproved trailing-byte change\n",
           valid_hash, expected, "BACKUP_SHA256_MISMATCH", "tamper-hash.db")
    denied(original[:-140], valid_hash, expected,
           "BACKUP_SHA256_MISMATCH", "truncated.db")
    denied(original, "0" * 64, expected,
           "BACKUP_SHA256_MISMATCH", "wrong-checksum.db")

    # An adversary can recompute a hash, but still cannot pass the separately
    # held exact pre-export table-by-table source snapshot.
    assert b"ACC180_FAKE_PAPER" in original
    edited = original.replace(b"ACC180_FAKE_PAPER", b"ACC180_TAMPERED_PAPER")
    denied(edited, hashlib.sha256(edited).hexdigest(), expected,
           "RESTORE_SCHEMA_OR_ROWS_MISMATCH", "changed-row.db")

    # Even with the authentic original dump, an inconsistent independently
    # captured expectation forces a fail-closed restoration.
    altered_expectation = dict(expected)
    altered_expectation["schema_sha256"] = "0" * 64
    denied(original, valid_hash, altered_expectation,
           "RESTORE_SCHEMA_OR_ROWS_MISMATCH", "wrong-source-snapshot.db")

    marker = b"'ENTRY614_ACCOUNTING_V1','READONLY'"
    assert marker in original, "export must contain a seeded READONLY control row"
    changed_mode = original.replace(marker, b"'ENTRY614_ACCOUNTING_V1','GENERAL'", 1)
    denied(changed_mode, hashlib.sha256(changed_mode).hexdigest(), expected,
           "ACCOUNTING_MODE_NOT_READONLY", "unsafe-mode.db")

    assert b"ACC180-FAKE-CMD" in original
    removed_ledger = original.replace(b"ACC180-FAKE-CMD", b"ACC180-OTHER-CMD")
    denied(removed_ledger, hashlib.sha256(removed_ledger).hexdigest(), expected,
           "RESTORE_SCHEMA_OR_ROWS_MISMATCH", "mismatch-ledger.db")

    # A corrupt SQL body with a recomputed checksum cannot pass parse/restore.
    broken = b"THIS IS NOT AN SQLITE SQL EXPORT;\n"
    denied(broken, hashlib.sha256(broken).hexdigest(), expected,
           "SQLITE_RESTORE_FAILED", "garbled-sql.db")

    # A complete but missing accounting table cannot count as a valid restore.
    db = sqlite3.connect(":memory:")
    try:
        db.executescript("CREATE TABLE employee_accounting_control_v1(singleton INTEGER);")
        try:
            m.snapshot(db)
        except m.RestoreBlocked as e:
            assert "MISSING_REQUIRED_ACCOUNTING_TABLE" in str(e)
        else:
            raise AssertionError("INCOMPLETE_FINANCE_SCHEMA_WAS_ACCEPTED")
    finally:
        db.close()

print("ACC180_EXACT_SCHEMA_ALL_ROWS_AND_FINANCE_STATE_RESTORED=PASS")
print("ACC180_CHANGED_BYTES_OR_INCORRECT_CHECKSUM_REJECTED=PASS")
print("ACC180_REHASHED_TAMPERED_ROWS_AND_INCOMPLETE_SCHEMA_REJECTED=PASS")
print("ACC180_RESTORED_WRITES_OR_CANARY_CANNOT_AUTO_ARM=PASS")
print("ACC180_NO_LIVE_BACKUP_OR_PRODUCTION_RESTORE=PASS")
