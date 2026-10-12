#!/usr/bin/env python3
"""ACC194 sanitized synthetic data only; refuse to claim owner G5."""
import importlib.util
import json
spec=importlib.util.spec_from_file_location("acc194","scripts/easystore_acc194_synthetic_encrypted_backup_restore.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
report=module.run_safe_audit()
assert report["schema"]=="ACC194_SYNTHETIC_ENCRYPTED_FINANCE_BACKUP_RESTORE_V1"
assert report["source"]=="LOCALLY_CREATED_SQLITE_FAKE_FINANCIAL_ROWS_ONLY"
assert report["original_migrations"]==12
assert report["table_count"]>=10
assert report["encrypted_bundle_bytes"]>1000
assert len(report["encrypted_bundle_sha256"])==64
assert report["encrypted_bundle_restored_schema_and_all_rows_equal"] is True
assert report["sqlite_native_backup_schema_and_all_rows_equal"] is True
assert report["sqlite_integrity_and_foreign_key_check"]=="PASS"
assert report["tampered_or_wrong_key_restore_denials"]==7
for k in ["real_cloudflare_d1_export_or_backup","real_production_database_ever_accessed",
          "real_backup_encryption_or_retention_policy_approved","real_production_backup_restore_or_worker_rollback"]:
    assert report[k] is False,k
assert report["owner_G5"]=="OPEN" and report["finance_release_decision"]=="NO_GO"
assert report["production_mutations"]==0 and report["temporary_artifacts_destroyed_after_test"] is True
public=json.dumps(report)
for secret in ("ACC180_FAKE_PAPER","ACC180_FAKE_SUPPLIER","ACC180-FAKE-CMD",
               "BEGIN TRANSACTION","INSERT INTO","secret.txt","synthetic.sql","BEGIN PRIVATE KEY"):
    assert secret not in public,secret
print("ACC194_ENCRYPTED_SYNTHETIC_EXPORT_INDEPENDENT_RESTORE=PASS")
print("ACC194_SEVEN_TAMPER_WRONG_KEY_FALSE_SNAPSHOT_AND_MODE_ATTACKS_DENIED=PASS")
print("ACC194_SANITIZED_REPORT_NO_CREDENTIALS_OR_ROWS=PASS")
print("ACC194_REAL_G5_PROTECTED_BACKUP_RESTORE_ROLLBACK=NOT_PERFORMED")
print("ACC194_RELEASE_DECISION=NO_GO")
