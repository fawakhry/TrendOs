#!/usr/bin/env python3
"""ACC-184 negative tests: all synthetic, no browser, D1, credentials, deploy."""
import copy
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "acc184", "scripts/easystore_acc184_release_stop_rollback_model.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
fixture = json.loads(Path(
    "docs/trendos/staging/ACC184_G5_RELEASE_STOP_INPUT_NO_GO_20261010.json"
).read_text(encoding="utf-8"))
report = mod.verify_offline_evidence(fixture)
assert report["release_decision"] == "NO_GO"
assert report["go_live_approval"] is False
assert report["owner_cutover_date"] is None
assert report["previous_live_worker_version"] is None
assert len(report["blocked_release_conditions"]) == 9
assert report["production_mutations"] == 0
assert report["safe_to_dispatch_old_manual_deploy"] is False
assert "G5_PREVIOUS_PRODUCTION_WORKER_VERSION_NOT_CAPTURED" in report["blocked_release_conditions"]

def must_stop(receipt, label):
    try:
        mod.verify_offline_evidence(receipt)
    except mod.StopRelease:
        return
    raise AssertionError("ACC184_FAIL_OPEN_" + label)

must_stop({}, "missing_evidence")
for key, changed in (
    ("acc183_run_id", 123),
    ("acc183_run_result", "SUCCESS_DEPLOYED"),
    ("accounting_source_commit", "f" * 40),
    ("shared_source_commit", "f" * 40),
    ("actual_offline_merged_tree", "f" * 40),
    ("wrangler_version", "4.40.0"),
    ("frontend_last_verified", "CANARY"),
    ("backend_last_verified", "GENERAL"),
    ("authoritative_financial_writes", True),
    ("canary_command_budget", 1),
    ("previous_live_worker_version_id", "FAKE_OLD_VERSION"),
    ("previous_live_worker_version_provenance", "imaginary"),
    ("real_d1_protected_backup_verified", True),
    ("real_d1_independent_restore_verified", True),
    ("actual_live_worker_rollback_verified", True),
    ("g1_real_custody_close_accepted", True),
    ("g2_owner_staff_finance_matrix_signed", True),
    ("g3_stock_cash_liabilities_opening_signed", True),
    ("g4_actual_finance_business_cycle_accepted", True),
    ("g5_owner_prod_release_signed", True),
    ("cutover_date_local", "2026-10-10"),
    ("cutover_auto_activate", True),
    ("old_manual_deploy_workflow_approved", True),
    ("cloudflare_production_deployed_by_this_stage", True),
    ("financial_production_mutations_by_this_stage", 1),
    ("release_decision", "GO"),
):
    mutated = copy.deepcopy(fixture)
    mutated[key] = changed
    must_stop(mutated, key)
for key in ("schema", "cutover_date_local", "g2_owner_staff_finance_matrix_signed"):
    mutated = copy.deepcopy(fixture)
    del mutated[key]
    must_stop(mutated, "missing_" + key)
mutated = copy.deepcopy(fixture)
mutated["approved"] = True
must_stop(mutated, "unrecognized_grant")
for key in ("authoritative_financial_writes", "cloudflare_production_deployed_by_this_stage"):
    mutated = copy.deepcopy(fixture)
    mutated[key] = 0
    must_stop(mutated, "type_coercion_" + key)

simulation = mod.simulate_offline_rollback(b"old_fake", b"new_fake", b"db", b"db")
assert simulation["synthetic_only"] is True
assert simulation["actual_live_rollback_executed"] is False
assert simulation["actual_cloudflare_version_identified"] is False

def must_stop_rollback(args, label):
    try:
        mod.simulate_offline_rollback(*args)
    except mod.StopRelease:
        return
    raise AssertionError("ACC184_ROLLBACK_FAIL_OPEN_" + label)

must_stop_rollback((b"old", b"new", b"db_before", b"db_after"), "D1_mutated")
must_stop_rollback((b"same", b"same", b"db", b"db"), "no_version_difference")
must_stop_rollback((b"", b"new", b"db", b"db"), "empty_version")
must_stop_rollback(("real_version_id", b"new", b"db", b"db"), "non_bytes")
print("ACC184_RELEASE_STOP_NEGATIVE_VARIANTS=PASS")
print("ACC184_FAKE_GO_AUTH_DATE_D1_WORKER_AND_EMPLOYEE_DRIFT_REJECTED=PASS")
print("ACC184_WORKER_CODE_ROLLBACK_CANNOT_REVERSE_D1_MUTATIONS=PASS")
print("ACC184_RELEASE_DECISION=NO_GO")
print("ACC184_PRODUCTION_MUTATIONS=ZERO")
