#!/usr/bin/env python3
"""ACC-184: source-only financial release STOP and synthetic Worker rollback model.

Never invokes Wrangler, Cloudflare, D1, financial HTTP, or a real rollback.
Historical ACC-183 dry-run identity is pinned, NOT a deployable version.
"""
import argparse
import hashlib
import json
from pathlib import Path

PIN = {
    "schema": "ACC184_G5_OFFLINE_RELEASE_STOP_INPUT_V1",
    "acc183_run_id": 38083057715,
    "acc183_run_result": "SUCCESS_DRYRUN_NOT_DEPLOYED",
    "accounting_source_commit": "9af8c034992d765cf124dbf59768f01c717bc108",
    "shared_source_commit": "7d20cfc463ce084ceaba8ac440dffa53512fe662",
    "actual_offline_merged_tree": "f7413b3e44cd028351f5e8490c6c3a500d01e0a1",
    "wrangler_version": "4.33.2",
    "frontend_last_verified": "OFF",
    "backend_last_verified": "READONLY",
    "authoritative_financial_writes": False,
    "canary_command_budget": 0,
    "previous_live_worker_version_id": None,
    "previous_live_worker_version_provenance": None,
    "real_d1_protected_backup_verified": False,
    "real_d1_independent_restore_verified": False,
    "actual_live_worker_rollback_verified": False,
    "g1_real_custody_close_accepted": False,
    "g2_owner_staff_finance_matrix_signed": False,
    "g3_stock_cash_liabilities_opening_signed": False,
    "g4_actual_finance_business_cycle_accepted": False,
    "g5_owner_prod_release_signed": False,
    "cutover_date_local": None,
    "cutover_auto_activate": False,
    "old_manual_deploy_workflow_approved": False,
    "cloudflare_production_deployed_by_this_stage": False,
    "financial_production_mutations_by_this_stage": 0,
    "release_decision": "NO_GO",
}

BLOCKERS = (
    "G1_REAL_AUTHENTICATED_CUSTODY_CLOSE_NOT_ACCEPTED",
    "G2_REAL_EMPLOYEE_ROLE_MATRIX_NOT_SIGNED",
    "G3_REAL_STOCK_CASH_AND_OBLIGATIONS_NOT_SIGNED_CUTOVER_UNSET",
    "G4_REAL_FINANCIAL_CYCLE_NOT_ACCEPTED",
    "G5_REAL_D1_PROTECTED_BACKUP_AND_RESTORE_NOT_VERIFIED",
    "G5_PREVIOUS_PRODUCTION_WORKER_VERSION_NOT_CAPTURED",
    "G5_REAL_WORKER_ROLLBACK_NOT_VERIFIED",
    "G5_OWNER_PRODUCTION_RELEASE_NOT_SIGNED",
    "G5_OLD_FLOATING_SHARED_DEPLOY_WORKFLOW_UNAPPROVED",
)


class StopRelease(ValueError):
    pass


def require(condition, tag):
    if not condition:
        raise StopRelease("ACC184_STOP_" + tag)


def verify_offline_evidence(receipt):
    """Strict immutable historical NO_GO record; reject forged approvals/drift."""
    require(isinstance(receipt, dict), "RECEIPT_MUST_BE_OBJECT")
    require(set(receipt) == set(PIN), "RECEIPT_KEYS_DRIFT")
    for key, expected in PIN.items():
        value = receipt[key]
        # bool(0) == False in Python; require both type and value equality.
        require(type(value) is type(expected) and value == expected,
                "HISTORICAL_EVIDENCE_CHANGED_" + key.upper())
    return {
        "schema": "ACC184_G5_FINANCE_RELEASE_STOP_REPORT_V1",
        "historical_acc183_run_id": receipt["acc183_run_id"],
        "historical_accounting_git_commit": receipt["accounting_source_commit"],
        "historical_shared_git_commit": receipt["shared_source_commit"],
        "historical_merged_git_tree": receipt["actual_offline_merged_tree"],
        "previous_live_worker_version": None,
        "real_d1_backup_or_restore_proven": False,
        "previous_live_worker_rollback_proven": False,
        "production_live_configuration_queried": False,
        "rollback_isolated_simulation_only": True,
        "owner_cutover_date": None,
        "blocked_release_conditions": list(BLOCKERS),
        "go_live_approval": False,
        "safe_to_dispatch_old_manual_deploy": False,
        "release_decision": "NO_GO",
        "production_mutations": 0,
    }


def simulate_offline_rollback(old_worker, proposed_worker, database_before, database_after):
    """Pure byte-level model, not a Cloudflare rollback or D1 restore.

    Worker-code rollback alone can NEVER undo database mutation. Only model
    cases with an unchanged fake database and distinct fake Worker snapshots.
    """
    require(all(type(x) is bytes and bool(x)
                for x in (old_worker, proposed_worker, database_before, database_after)),
            "MOCK_INPUTS_MUST_BE_NONEMPTY_BYTES")
    require(old_worker != proposed_worker, "MOCK_WORKER_VERSIONS_NOT_DISTINCT")
    require(database_before == database_after, "WORKER_ROLLBACK_CANNOT_REVERT_D1_DATA")
    old_hash = hashlib.sha256(old_worker).hexdigest()
    new_hash = hashlib.sha256(proposed_worker).hexdigest()
    database_hash = hashlib.sha256(database_before).hexdigest()
    return {
        "synthetic_only": True,
        "mock_roll_forward_sha256": new_hash,
        "mock_reverted_worker_sha256": old_hash,
        "mock_database_unchanged_sha256": database_hash,
        "actual_live_rollback_executed": False,
        "actual_cloudflare_version_identified": False,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    try:
        report = verify_offline_evidence(json.loads(args.evidence.read_text(encoding="utf-8")))
        mock = simulate_offline_rollback(
            b"ACC184 synthetic previous Worker v0",
            b"ACC184 synthetic proposed Worker v1",
            b"ACC184 fake finance DB READONLY",
            b"ACC184 fake finance DB READONLY",
        )
        require(mock["actual_live_rollback_executed"] is False,
                "SYNTHETIC_ROLLBACK_NOT_LIVE")
        report["mock_rollback"] = mock
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print("ACC184_EXACT_ACC183_HISTORICAL_IDENTITY=PASS")
        print("ACC184_ALL_G1_TO_G5_RELEASE_BLOCKERS_PRESERVED=PASS")
        print("ACC184_SYNTHETIC_WORKER_ROLLBACK_NO_D1_CHANGE=PASS")
        print("ACC184_PREVIOUS_LIVE_WORKER_VERSION=NOT_CAPTURED")
        print("ACC184_REAL_D1_BACKUP_RESTORE_AND_ROLLBACK=NOT_PERFORMED")
        print("ACC184_RELEASE_DECISION=NO_GO")
        print("ACC184_PRODUCTION_MUTATIONS=ZERO")
    except (StopRelease, OSError, ValueError, UnicodeError) as exc:
        parser.exit(1, str(exc) + "\n")


if __name__ == "__main__":
    main()
