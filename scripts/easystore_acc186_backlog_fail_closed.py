#!/usr/bin/env python3
"""ACC-186: fail-closed, pure offline finance completion tracker.

This validates evidence and scope. It does NOT execute release/Cloudflare/D1,
GitHub write actions, old canaries, Worker rollback or actual finance flows.
"""
import argparse
import copy
import json
from pathlib import Path

class BacklogStop(ValueError):
    pass

REQUIRED_STAGES = tuple(f"ACC-{n}" for n in range(187, 200))
REQUIRED_GATES = ("G1", "G2", "G3", "G4", "G5")
HISTORIC_PROOF = {
    "ACC-183": (64, "9af8c034992d765cf124dbf59768f01c717bc108", 38083057715),
    "ACC-184": (66, "59a79b37deb948ba7f25ceffc84633f1aaa65e78", 38084795842),
    "ACC-185": (67, "9505c896c9c27869cf2950e1f72be423e64868ee", 38085491124),
}
ACCEPTED_QUEUE_STATUSES = frozenset(("QUEUED_UNVERIFIED", "IN_PROGRESS_UNVERIFIED", "VERIFIED_COMPLETE"))
REQUIRED_FORBIDDEN = frozenset((
    "PRODUCTION_WORKER_OR_PAGES_DEPLOY",
    "D1_REMOTE_FINANCIAL_SQL",
    "FINANCE_POST",
    "ARM_OR_REPLAY_CANARY",
    "REAL_EMPLOYEE_PERMISSION_CHANGE",
    "DELETE_OR_ZERO_PRODUCTION_DATA",
    "LIVE_BACKUP_OR_RESTORE",
    "ROLLBACK_PRODUCTION",
    "SET_CUTOVER_DATE",
    "ALTER_EMPLOYEE_LOGIN_PRODUCTION",
))
EXPECTED_EVIDENCE = ["SOURCE_COMMIT", "ISOLATED_TEST_OUTPUT", "GITHUB_ACTIONS_RUN_CONCLUSION", "APPEND_ONLY_MASTER_BOOK"]


def demand(value, label):
    if not value:
        raise BacklogStop("ACC186_STOP_" + label)


def validate(m, book):
    demand(isinstance(m, dict), "MANIFEST_NOT_OBJECT")
    demand(isinstance(book, str) and book, "MASTER_BOOK_MISSING")
    demand(m.get("schema") == "ACC186_FINANCE_SAFE_BACKLOG_AND_EXECUTION_LEDGER_V1", "SCHEMA_DRIFT")
    demand(m.get("release_decision") == "NO_GO", "FINANCE_GO_NOT_AUTHORIZED")
    demand(type(m.get("production_mutations_this_stage")) is int and
           m["production_mutations_this_stage"] == 0, "PRODUCTION_CHANGE_FORGED")
    state = m.get("source_state_only", {})
    demand(isinstance(state, dict), "SOURCE_STATE_NOT_OBJECT")
    demand(state.get("frontend_last_reported") == "OFF" and
           state.get("accounting_backend_last_reported") == "READONLY", "OPERATING_MODE_CHANGED")
    for k in ("finance_authoritative_writes", "production_deployment_verified_this_stage",
              "real_d1_protected_backup_verified", "real_d1_restore_verified"):
        demand(type(state.get(k)) is bool and state[k] is False, "FORGED_PRODUCTION_EVIDENCE_" + k)
    demand(type(state.get("canary_budget")) is int and state["canary_budget"] == 0,
           "CANARY_BUDGET_CHANGED")
    demand("previous_live_worker_version_id" in state and
           state["previous_live_worker_version_id"] is None,
           "PREVIOUS_LIVE_WORKER_VERSION_FORGED")
    owner = m.get("owner_decisions", {})
    demand(isinstance(owner, dict), "OWNER_DECISIONS_INVALID")
    for k, expected in (
        ("new_books_without_legacy_transactions", True),
        ("delete_historical_records", False),
        ("auto_start_on_program_completion", False),
        ("begin_date_only_with_separate_actual_go_live_approval", True),
    ):
        demand(type(owner.get(k)) is bool and owner[k] is expected, "OWNER_DIRECTION_DRIFT_" + k)
    demand("cutover_date_local" in owner and owner["cutover_date_local"] is None, "UNAUTHORIZED_DATE")
    forbidden = m.get("prohibited_work")
    demand(type(forbidden) is list and set(forbidden) >= REQUIRED_FORBIDDEN,
           "FORBIDDEN_OPERATIONS_REMOVED")
    allowed = m.get("allowed_work")
    demand(type(allowed) is list and len(allowed) == len(set(allowed)) and
           not any("PRODUCTION" in x or "D1_REMOTE" in x or "FINANCE_POST" in x
                   for x in allowed), "UNSAFE_ALLOWED_ACTION")
    gates = m.get("gates")
    demand(type(gates) is dict and set(gates) == set(REQUIRED_GATES) and
           all(gates[k] == "OPEN" for k in REQUIRED_GATES), "GATE_CLAIMED_CLOSED")
    done = m.get("complete_verified")
    demand(type(done) is list and len(done) == len(HISTORIC_PROOF),
           "HISTORICAL_STAGE_COUNT_CHANGED")
    for entry in done:
        demand(type(entry) is dict and entry.get("stage") in HISTORIC_PROOF, "BAD_HISTORY_STAGE")
        num, sha, run = HISTORIC_PROOF[entry["stage"]]
        proof = entry.get("evidence", {})
        demand(entry.get("state") == "VERIFIED_COMPLETE" and
               proof == {"pr": num, "merge_sha": sha, "postmerge_run": run},
               "HISTORIC_GITHUB_EVIDENCE_CHANGED")
        demand(f"/pull/{num}" in book and f"/actions/runs/{run}" in book,
               "HISTORY_NOT_LINKED_IN_MASTER_BOOK")
    queue = m.get("safe_queue")
    demand(type(queue) is list and len(queue) == len(REQUIRED_STAGES), "SAFE_QUEUE_COUNT_CHANGED")
    ids = [x.get("id") if type(x) is dict else None for x in queue]
    demand(tuple(ids) == REQUIRED_STAGES, "QUEUE_ORDER_OR_STAGE_CHANGED")
    completed = set(HISTORIC_PROOF) | {"ACC-180"}
    verified_dependencies = set(completed)
    for task in queue:
        stage = task["id"]
        demand(task.get("gate") in REQUIRED_GATES, "BAD_GATE_" + stage)
        demand(type(task.get("title")) is str and task["title"].strip() and
               type(task.get("acceptance_definition")) is str and
               len(task["acceptance_definition"].strip()) > 30,
               "NO_TESTABLE_ACCEPTANCE_" + stage)
        demand(task.get("state") in ACCEPTED_QUEUE_STATUSES, "QUEUE_STATE_INVALID_" + stage)
        demand(task.get("deployment_allowed") is False and
               task.get("owner_approval_needed_for_this_safe_scope") is False,
               "UNSAFE_AUTONOMOUS_SCOPE_" + stage)
        demand(task.get("proof_required") == EXPECTED_EVIDENCE, "EVIDENCE_GATES_WEAKENED_" + stage)
        deps = task.get("depends_on")
        demand(type(deps) is list and deps and len(deps) == len(set(deps)) and
               all(d in completed for d in deps), "UNMET_OR_FORWARD_DEPENDENCY_" + stage)
        if task["state"] == "VERIFIED_COMPLETE":
            demand(all(d in verified_dependencies for d in deps),
                   "UNVERIFIED_DEPENDENCY_" + stage)
            demand(type(task.get("pr")) is int and task["pr"] > 0 and
                   type(task.get("ci_run")) is int and task["ci_run"] > 0 and
                   isinstance(task.get("verified_at"), str) and task["verified_at"],
                   "STAGE_FALSIFIED_COMPLETE_" + stage)
        else:
            demand(task.get("pr") is None and task.get("ci_run") is None and
                   task.get("verified_at") is None,
                   "UNVERIFIED_STAGE_WITH_PRETEND_PROOF_" + stage)
        completed.add(stage)
        if task["state"] == "VERIFIED_COMPLETE":
            verified_dependencies.add(stage)
    approvals = m.get("owner_approval_queue")
    demand(type(approvals) is list and len(approvals) == 5, "OWNER_GATES_MISSING")
    demand([x.get("gate") for x in approvals] == list(REQUIRED_GATES), "OWNER_GATES_CHANGED")
    for x in approvals:
        demand(x.get("state") == "BLOCKED_OWNER_APPROVAL" and
               x.get("owner_required") is True and
               x.get("production_action_allowed") is False and
               x.get("evidence_verified") is False and
               type(x.get("condition")) is str and bool(x["condition"]),
               "OWNER_GATE_BYPASSED_" + str(x.get("gate")))
    demand("### ACC-186 " in book, "ACC186_STAGE_NOT_IN_BOOK")
    return {
        "schema": "ACC186_GITHUB_SAFE_WORK_QUEUE_STATIC_PROOF_V1",
        "historic_stages_verified_from_record": list(HISTORIC_PROOF),
        "source_safe_stages_queued": [x["id"] for x in queue if x["state"] == "QUEUED_UNVERIFIED"],
        "source_safe_stages_validated_complete": [x["id"] for x in queue if x["state"] == "VERIFIED_COMPLETE"],
        "source_safe_stages_in_progress": [x["id"] for x in queue if x["state"] == "IN_PROGRESS_UNVERIFIED"],
        "owner_only_gates": list(REQUIRED_GATES),
        "all_owner_approvals_still_required": True,
        "cutover_date_local": None,
        "live_production_configuration_queried": False,
        "previous_live_worker_version_captured": False,
        "release_decision": "NO_GO",
        "production_mutations": 0,
    }


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--manifest", type=Path, required=True)
    cli.add_argument("--master-book", type=Path, required=True)
    cli.add_argument("--out", type=Path, required=True)
    args = cli.parse_args()
    report = validate(json.loads(args.manifest.read_text(encoding="utf-8")),
                      args.master_book.read_text(encoding="utf-8"))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ACC186_HISTORICAL_ACC183_TO_ACC185_PROOF=PASS")
    print("ACC186_SAFE_QUEUE_STAGES=" + str(len(report["source_safe_stages_queued"])))
    print("ACC186_OWNER_ONLY_GATES=5")
    print("ACC186_DATE_AND_LIVE_WORKER_VERSION=UNSET")
    print("ACC186_NO_UNAUTHORIZED_PRODUCTION_ACTIONS=PASS")
    print("ACC186_RELEASE_DECISION=NO_GO")
    print("ACC186_PRODUCTION_MUTATIONS=ZERO")


if __name__ == "__main__":
    try:
        main()
    except (BacklogStop, ValueError, OSError) as exc:
        raise SystemExit(str(exc)) from exc
