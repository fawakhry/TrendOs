#!/usr/bin/env python3
"""ACC-183 adversarial unit checks; all inputs fake and local."""
import importlib.util
spec=importlib.util.spec_from_file_location(
 "acc183", "scripts/easystore_acc183_wrangler_dryrun_bundle_receipt.py"
)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
a="a"*40
b="7d20cfc463ce084ceaba8ac440dffa53512fe662"
t="c"*40
source={
 "schema":"ACC182_OFFLINE_EXACT_WORKER_TREE_AND_AUTH_DRIFT_RECEIPT_V1",
 "accounting_source_git_sha":a,
 "shared_source_git_sha":b,
 "actual_reconciled_uncommitted_git_tree":t,
 "release_decision":"NO_GO",
 "safe_to_execute_old_deploy_workflow":False,
 "production_worker_deploy_executed":False,
 "production_financial_d1_mutations":0,
 "finance_cutover_date":None,
 "owner_release_authorization_signed":False,
 "protected_real_production_database_backup_verified":False,
 "actual_production_database_restore_drill_verified":False,
 "previous_live_worker_rollback_drill_verified":False,
}
bundle={"index.js":b"function payment_paid(){};const HANDOFF=1;const p='/v1/employee/accounting';"}
def check(s=source, files=bundle, account=a, shared=b, tree=t, version="4.33.2"):
 return m.validate_bundle(s,account,shared,tree,files,version)
result=check()
assert result["release_decision"]=="NO_GO"
assert result["financial_production_mutations"]==0
assert result["published_worker_version_pinned"] is False
assert result["cloudflare_api_credentials_available_to_job"] is False
assert result["old_manual_floating_shared_deploy_workflow_safe"] is False
assert result["generated_bundle_files"]["index.js"]["byte_length"] == len(bundle["index.js"])
def deny(part, reason):
 try:
  check(**part)
 except m.BundleBlocked as ex:
  assert reason in str(ex),f"unexpected reason {ex}"
 else:
  raise AssertionError("ACC183_FAIL_OPEN:"+reason)
deny({"account":"not-a-sha"},"UNPINNED_OR_INVALID_SHA")
deny({"shared":"f"*40},"SOURCE_RECEIPT_SHA_MISMATCH")
deny({"tree":"d"*40},"SOURCE_RECEIPT_SHA_MISMATCH")
deny({"version":"4.35.0"},"WRANGLER_VERSION_DRIFT")
deny({"files":{}},"NO_GENERATED_BUNDLE")
deny({"files":{"index.js":b"hello"}},"FINANCE_SOURCE_MARKER_MISSING")
deny({"files":{"index.js":b"payment_paid HANDOFF only"}},"FINANCE_SOURCE_MARKER_MISSING")
deny({"files":{"index.txt":bundle["index.js"]}},"NO_WORKER_JAVASCRIPT")
deny({"files":{"../bad.js":bundle["index.js"]}},"BAD_BUNDLE_PATH")
deny({"files":{"x.js":b""}},"BUNDLE_EMPTY_OR_OVERSIZED")
deny({"files":{"a.exe":bundle["index.js"]}},"UNEXPECTED_BUNDLE_FILE_EXTENSION")
for field,val in [
 ("release_decision","GO"),
 ("safe_to_execute_old_deploy_workflow",True),
 ("production_worker_deploy_executed",True),
 ("production_financial_d1_mutations",1),
 ("finance_cutover_date","2026-10-10"),
 ("owner_release_authorization_signed",True),
 ("protected_real_production_database_backup_verified",True),
 ("actual_production_database_restore_drill_verified",True),
 ("previous_live_worker_rollback_drill_verified",True)
]:
 wrong=dict(source);wrong[field]=val
 deny({"s":wrong},"ACC182_SOURCE_RELEASE_GUARD_DRIFT")
missing=dict(source);missing.pop("finance_cutover_date")
deny({"s":missing},"ACC182_SOURCE_RELEASE_GUARD_DRIFT")
print("ACC183_SOURCE_SHA_WRANGLER_VERSION_AND_BUNDLE_PATH_NEGATIVES=PASS")
print("ACC183_MISSING_FINANCE_ROUTE_AND_SQL_MARKERS_DENIED=PASS")
print("ACC183_FALSE_PRODUCTION_BACKUP_ROLLBACK_AUTHORIZATION_GO_DENIED=PASS")
print("ACC183_OFFLINE_BUNDLE_NEVER_FINANCE_GO=PASS")
print("ACC183_PRODUCTION_MUTATIONS=ZERO")
