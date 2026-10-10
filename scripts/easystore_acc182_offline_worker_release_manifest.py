#!/usr/bin/env python3
"""ACC-182: independent offline receipt for a fully staged, reproducible Worker tree.

NO Cloudflare credentials, production deployment, live D1 query, secrets, finance
POST or change to published employee authentication. Git merge happens only in
an ephemeral GitHub Actions checkout. The receipt is ALWAYS finance NO_GO.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tomllib
from pathlib import Path

PINNED_SHARED = "7d20cfc463ce084ceaba8ac440dffa53512fe662"
FILES = (
    "cloudflare-d1/production-shadow/index.js",
    "cloudflare-d1/src/index_v2.js",
    "cloudflare-d1/src/employee-accounting-native-v1.mjs",
    "cloudflare-d1/wrangler.toml",
    "docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json",
    ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml",
)
UNCHANGED = (
    "cloudflare-d1/production-shadow/index.js",
    "cloudflare-d1/src/index_v2.js",
    "cloudflare-d1/src/employee-accounting-native-v1.mjs",
    "docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json",
    ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml",
)
AUTH_VARS = {
    "TRENDOS_EMPLOYEE_AUTH_V1_ENABLED",
    "TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1",
}
NO_GO = "NO_GO"


class CandidateBlocked(ValueError):
    pass


def digest(b):
    return hashlib.sha256(b).hexdigest()


def git(root, *args):
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        capture_output=True, text=True, check=True
    )
    return result.stdout.strip()


def read_sources(root):
    return {p: (root / p).read_bytes() for p in FILES}


def require(cond, reason):
    if not cond:
        raise CandidateBlocked("ACC182_" + reason)


def verify_source_contract(accounting, merged, accounting_sha, shared_sha, merged_tree):
    require(all(re.fullmatch("[0-9a-f]{40}", s or "") for s in
                (accounting_sha, shared_sha, merged_tree)), "SOURCE_SHA_INVALID")
    require(shared_sha == PINNED_SHARED, "SHARED_REVISION_UNPINNED_OR_MOVED")
    require(set(accounting) == set(FILES) and set(merged) == set(FILES),
            "REQUIRED_SOURCE_FILES_MISSING")
    for file in UNCHANGED:
        require(accounting[file] == merged[file], "UNEXPECTED_MERGED_CHANGE_" + file)
    worker = merged["cloudflare-d1/src/employee-accounting-native-v1.mjs"].decode("utf-8")
    require("'payment_paid',?,?,-1" in worker, "SUPPLIER_SQL_REPAIR_MISSING")
    require("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)" in worker,
            "CUSTODY_SQL_REPAIR_MISSING")
    require("function approvedAccountingModeV1(env,verifiedUsername,user)" in worker,
            "CLOUD_VERIFIED_ROLE_SCOPE_MISSING")
    require("import core from '../src/index_v2.js'" in
            merged["cloudflare-d1/production-shadow/index.js"].decode(),
            "SHADOW_CORE_ENTRYPOINT_MISSING")
    require("return handleEmployeeAccountingNativeRequest(request, env, ctx)" in
            merged["cloudflare-d1/src/index_v2.js"].decode(), "ACCOUNTING_ROUTE_MISSING")
    try:
        previous = tomllib.loads(accounting["cloudflare-d1/wrangler.toml"].decode())
        final = tomllib.loads(merged["cloudflare-d1/wrangler.toml"].decode())
    except (tomllib.TOMLDecodeError, UnicodeError) as e:
        raise CandidateBlocked("ACC182_INVALID_WORKER_CONFIG") from e
    require(previous["name"] == final["name"] == "trendos-d1-api",
            "WORKER_BINDING_NAME_CHANGED")
    require(previous["main"] == final["main"] == "production-shadow/index.js",
            "WORKER_ENTRYPOINT_CHANGED")
    require(previous["d1_databases"] == final["d1_databases"],
            "PRODUCTION_D1_BINDING_CHANGED")
    require(previous.get("workers_dev") == final.get("workers_dev") is True,
            "WORKERS_DEV_CONFIG_CHANGED")
    require(set(previous) == set(final), "WRANGLER_TOPLEVEL_CHANGED")
    for key in previous:
        if key != "vars":
            require(previous[key] == final[key], "WRANGLER_CONFIG_CHANGE_" + key)
    original_vars, merged_vars = previous["vars"], final["vars"]
    require(set(original_vars) == set(merged_vars), "WRANGLER_ENV_KEYS_DRIFT")
    changed = sorted(k for k in original_vars if original_vars[k] != merged_vars[k])
    require(changed == sorted(AUTH_VARS), "WRANGLER_UNEXPECTED_VARIABLE_DRIFT")
    for key in AUTH_VARS:
        require(original_vars[key] == "false" and merged_vars[key] == "true",
                "NATIVE_AUTH_CHANGE_NOT_REVIEWED_" + key)
    # The two source flags differ in Git, but this manifest DOES NOT assert
    # these values are currently deployed or authorize a future config change.
    try:
        cutover = json.loads(merged[
            "docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json"
        ])
    except (UnicodeError, json.JSONDecodeError) as e:
        raise CandidateBlocked("ACC182_G3_MANIFEST_PARSE_FAILED") from e
    require(cutover.get("owner_direction") == "START_NEW_ACCOUNTING_BOOKS_FROM_ZERO"
            and cutover.get("cutover_date_local") is None
            and cutover.get("cutover_auto_activate") is False
            and cutover.get("program_completion_is_not_release_authorization") is True
            and cutover.get("current_backend_policy") == "READONLY"
            and cutover.get("current_frontend_write_mode") == "OFF"
            and cutover.get("release_decision") == NO_GO
            and cutover.get("production_changes_performed") is False,
            "UNSIGNED_ZERO_OPENING_CUTOVER_OR_FINANCE_GO")
    deploy = merged[".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml"].decode()
    require("git merge --no-edit FETCH_HEAD" in deploy
            and "wrangler deploy --config" in deploy
            and "wrangler rollback" in deploy
            and "out.append('keep_vars = true')" in deploy,
            "OLD_DEPLOY_CONTRACT_CHANGED")
    return {
        "schema": "ACC182_OFFLINE_EXACT_WORKER_TREE_AND_AUTH_DRIFT_RECEIPT_V1",
        "accounting_source_git_sha": accounting_sha,
        "shared_source_git_sha": shared_sha,
        "actual_reconciled_uncommitted_git_tree": merged_tree,
        "approved_preserved_worker_bytes": {k: digest(merged[k]) for k in UNCHANGED},
        "original_accounting_wrangler_sha256": digest(accounting["cloudflare-d1/wrangler.toml"]),
        "merged_wrangler_sha256": digest(merged["cloudflare-d1/wrangler.toml"]),
        "merged_config_change_exactly": {
            k: {"accounting": original_vars[k], "shared_merge": merged_vars[k]}
            for k in changed
        },
        "production_variables_updated": False,
        "production_auth_configuration_verified": False,
        "prior_live_worker_version_captured": False,
        "protected_real_production_database_backup_verified": False,
        "actual_production_database_restore_drill_verified": False,
        "previous_live_worker_rollback_drill_verified": False,
        "owner_release_authorization_signed": False,
        "staff_finance_role_matrix_signed": False,
        "finance_cutover_date": None,
        "book_reconciliation_source": "ACC178_ISOLATED_3_WAY",
        "release_decision": NO_GO,
        "safe_to_execute_old_deploy_workflow": False,
        "production_worker_deploy_executed": False,
        "production_financial_d1_mutations": 0,
        "note": "Source-only exact reconciled tree rehearsal. Shared native-auth flags differ from accounting base; no release approval or live configuration changes. Existing historic deploy workflow remains protected and unapproved."
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--accounting-root", type=Path, required=True)
    p.add_argument("--merged-root", type=Path, required=True)
    p.add_argument("--accounting-sha", required=True)
    p.add_argument("--shared-sha", required=True)
    p.add_argument("--merged-tree", required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    try:
        require(git(args.accounting_root, "rev-parse", "HEAD") == args.accounting_sha,
                "ACCOUNTING_CHECKOUT_NOT_PINNED")
        require(git(args.merged_root, "rev-parse", "HEAD") == args.accounting_sha,
                "MERGE_BASE_NOT_ACCOUNTING")
        require(git(args.merged_root, "write-tree") == args.merged_tree,
                "MERGED_INDEX_TREE_SHA_CHANGED")
        require(not git(args.merged_root, "ls-files", "-u"),
                "MERGE_HAS_UNRESOLVED_PATHS")
        require(not git(args.merged_root, "diff", "--name-only"),
                "MERGED_INDEX_DOES_NOT_MATCH_WORKTREE")
        before, after = read_sources(args.accounting_root), read_sources(args.merged_root)
        result = verify_source_contract(
            before, after, args.accounting_sha, args.shared_sha, args.merged_tree
        )
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print("ACC182_ACTUAL_MERGED_GIT_TREE_PINNED=" + args.merged_tree)
        print("ACC182_ACCOUNTING_WORKER_SOURCE_UNCHANGED=PASS")
        print("ACC182_SHARED_AUTH_SOURCE_FLAG_DRIFT_REVIEWED=PASS")
        print("ACC182_OWNER_DEFERRED_CUTOVER_DATE_UNSET=PASS")
        print("ACC182_OLD_DEPLOY_NOT_SAFE_TO_DISPATCH=YES")
        print("ACC182_RELEASE_DECISION=NO_GO")
        print("ACC182_PRODUCTION_MUTATIONS=ZERO")
    except (OSError, subprocess.CalledProcessError, CandidateBlocked, ValueError) as e:
        p.exit(1, str(e) + "\n")


if __name__ == "__main__":
    main()
