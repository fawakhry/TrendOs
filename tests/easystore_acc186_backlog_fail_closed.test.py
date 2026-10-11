#!/usr/bin/env python3
"""ACC-186 adversarial no-GO/owner-scope tests; source-only."""
import copy
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("acc186","scripts/easystore_acc186_backlog_fail_closed.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
original = json.loads(Path("docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json").read_text(encoding="utf-8"))
book = Path("TrendOS_MASTER_BOOK.md").read_text(encoding="utf-8")
report = m.validate(original, book)
assert len(report["source_safe_stages_queued"]) == 13
assert len(report["owner_only_gates"]) == 5
assert report["release_decision"] == "NO_GO"
assert report["previous_live_worker_version_captured"] is False

def stop(edit, tag):
    candidate = copy.deepcopy(original)
    edit(candidate)
    try:
        m.validate(candidate, book)
    except m.BacklogStop as e:
        assert tag in str(e), (tag, str(e))
    else:
        raise AssertionError("ACC186_FAIL_OPEN_" + tag)

stop(lambda x: x.update(release_decision="GO"), "FINANCE_GO_NOT_AUTHORIZED")
stop(lambda x: x.update(production_mutations_this_stage=True), "PRODUCTION_CHANGE_FORGED")
stop(lambda x: x["source_state_only"].update(accounting_backend_last_reported="GENERAL"), "OPERATING_MODE_CHANGED")
stop(lambda x: x["source_state_only"].update(canary_budget=1), "CANARY_BUDGET_CHANGED")
stop(lambda x: x["source_state_only"].update(previous_live_worker_version_id="fake-prod-id"), "PREVIOUS_LIVE_WORKER_VERSION_FORGED")
stop(lambda x: x["source_state_only"].update(real_d1_protected_backup_verified=True), "FORGED_PRODUCTION_EVIDENCE")
stop(lambda x: x["owner_decisions"].update(cutover_date_local="2026-10-12"), "UNAUTHORIZED_DATE")
stop(lambda x: x["owner_decisions"].update(delete_historical_records=True), "OWNER_DIRECTION_DRIFT")
stop(lambda x: x["owner_decisions"].update(auto_start_on_program_completion=True), "OWNER_DIRECTION_DRIFT")
stop(lambda x: x["gates"].update(G1="CLOSED"), "GATE_CLAIMED_CLOSED")
stop(lambda x: x["prohibited_work"].remove("D1_REMOTE_FINANCIAL_SQL"), "FORBIDDEN_OPERATIONS_REMOVED")
stop(lambda x: x["allowed_work"].append("PRODUCTION_WORKER_OR_PAGES_DEPLOY"), "UNSAFE_ALLOWED_ACTION")
stop(lambda x: x["complete_verified"][0]["evidence"].update(postmerge_run=1), "HISTORIC_GITHUB_EVIDENCE_CHANGED")
stop(lambda x: x["safe_queue"][0].update(state="VERIFIED_COMPLETE"), "STAGE_FALSIFIED_COMPLETE")
stop(lambda x: x["safe_queue"][0].update(pr=999), "UNVERIFIED_STAGE_WITH_PRETEND_PROOF")
stop(lambda x: x["safe_queue"][0].update(deployment_allowed=True), "UNSAFE_AUTONOMOUS_SCOPE")
stop(lambda x: x["safe_queue"][0].update(depends_on=["ACC-198"]), "UNMET_OR_FORWARD_DEPENDENCY")
stop(lambda x: x["safe_queue"][0].update(proof_required=["SOURCE_COMMIT"]), "EVIDENCE_GATES_WEAKENED")
stop(lambda x: x["owner_approval_queue"][0].update(production_action_allowed=True), "OWNER_GATE_BYPASSED")
stop(lambda x: x["owner_approval_queue"][0].update(state="VERIFIED_COMPLETE"), "OWNER_GATE_BYPASSED")
stop(lambda x: x["owner_approval_queue"].pop(), "OWNER_GATES_MISSING")
stop(lambda x: x["safe_queue"].pop(), "SAFE_QUEUE_COUNT_CHANGED")
try:
    m.validate(original, "not the master book")
except m.BacklogStop as e:
    assert "HISTORY_NOT_LINKED_IN_MASTER_BOOK" in str(e)
else:
    raise AssertionError("ACC186_MISSING_MASTER_BOOK_EVIDENCE_FAIL_OPEN")
print("ACC186_23_NEGATIVE_APPROVAL_GATES_AND_EVIDENCE_TESTS=PASS")
print("ACC186_HISTORY_183_184_185_GITHUB_PROVENANCE=PASS")
print("ACC186_ZERO_IMPORT_NO_DATE_AND_NO_PRODUCTION_DEPLOY=PASS")
print("ACC186_RELEASE_DECISION=NO_GO")
