#!/usr/bin/env python3
"""ACC-183: receipt for an actual Wrangler --dry-run bundle of pinned Worker source.

This script cannot contact Cloudflare or deploy. It checks a pre-existing offline
ACC-182 source-tree receipt and digestible local bundle files only. A success is
NOT a real immutable production release, a live rollback, or a finance GO.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

EXPECTED_WRANGLER = "4.33.2"
HEX40 = re.compile(r"^[0-9a-f]{40}$")
MAX_FILE_BYTES = 80 * 1024 * 1024


class BundleBlocked(ValueError):
    pass


def must(ok, why):
    if not ok:
        raise BundleBlocked("ACC183_" + why)


def sha256(payload):
    return hashlib.sha256(payload).hexdigest()


def validate_bundle(source_receipt, source_sha, shared_sha, tree_sha, bundle_files, wrangler_version):
    must(all(isinstance(s, str) and HEX40.fullmatch(s) for s in
             (source_sha, shared_sha, tree_sha)), "UNPINNED_OR_INVALID_SHA")
    must(wrangler_version == EXPECTED_WRANGLER, "WRANGLER_VERSION_DRIFT")
    must(isinstance(source_receipt, dict)
         and source_receipt.get("schema") == "ACC182_OFFLINE_EXACT_WORKER_TREE_AND_AUTH_DRIFT_RECEIPT_V1",
         "ACC182_SOURCE_RECEIPT_MISSING")
    must(source_receipt.get("accounting_source_git_sha") == source_sha
         and source_receipt.get("shared_source_git_sha") == shared_sha
         and source_receipt.get("actual_reconciled_uncommitted_git_tree") == tree_sha,
         "SOURCE_RECEIPT_SHA_MISMATCH")
    for field, expected in (
        ("release_decision", "NO_GO"),
        ("safe_to_execute_old_deploy_workflow", False),
        ("production_worker_deploy_executed", False),
        ("production_financial_d1_mutations", 0),
        ("finance_cutover_date", None),
        ("owner_release_authorization_signed", False),
        ("protected_real_production_database_backup_verified", False),
        ("actual_production_database_restore_drill_verified", False),
        ("previous_live_worker_rollback_drill_verified", False),
    ):
        must(field in source_receipt and source_receipt[field] == expected,
             "ACC182_SOURCE_RELEASE_GUARD_DRIFT_" + field)
    must(isinstance(bundle_files, dict) and bundle_files, "NO_GENERATED_BUNDLE")
    clean = {}
    js = []
    for name, content in sorted(bundle_files.items()):
        must(isinstance(name, str) and not name.startswith(".") and
             "/" not in name and "\\" not in name and ".." not in name,
             "BAD_BUNDLE_PATH")
        must(isinstance(content, bytes) and 0 < len(content) <= MAX_FILE_BYTES,
             "BUNDLE_EMPTY_OR_OVERSIZED")
        must(name.endswith((".js", ".json", ".map", ".wasm", ".bin", ".txt", ".md")),
             "UNEXPECTED_BUNDLE_FILE_EXTENSION")
        clean[name] = {"sha256": sha256(content), "byte_length": len(content)}
        if name.endswith(".js"):
            js.append(content)
    must(len(js) >= 1, "NO_WORKER_JAVASCRIPT")
    full_worker = b"\n".join(js)
    for needle in [b"payment_paid", b"HANDOFF", b"employee/accounting"]:
        must(needle in full_worker, "FINANCE_SOURCE_MARKER_MISSING_" + needle.decode())
    # A successful source-matching output is still only a non-deployable receipt.
    return {
        "schema": "ACC183_WRANGLER_PINNED_OFFLINE_DRYRUN_BUNDLE_V1",
        "source_accounting_commit": source_sha,
        "source_shared_commit": shared_sha,
        "actual_uncommitted_merge_tree": tree_sha,
        "wrangler_cli_version_pinned": wrangler_version,
        "generated_bundle_files": clean,
        "worker_js_contains_finance_route_payment_and_custody_code": True,
        "source_tree_verified_from_acc182": True,
        "bundle_built_by_wrangler_deploy_dry_run_only": True,
        "cloudflare_api_credentials_available_to_job": False,
        "cloudflare_network_deployment_attempted": False,
        "published_worker_version_pinned": False,
        "production_d1_backup_verified": False,
        "production_d1_isolated_restore_verified": False,
        "live_worker_rollback_drill_verified": False,
        "signed_finance_employee_grants": False,
        "first_accounting_date_set": False,
        "approved_release_window": False,
        "old_manual_floating_shared_deploy_workflow_safe": False,
        "release_decision": "NO_GO",
        "financial_production_mutations": 0,
        "note": "This is an actual local Wrangler --dry-run compile check on a pinned source tree, NOT a deployable approved immutable artifact or permission to deploy it."
    }


def read_bundle(root):
    must(root.is_dir() and not root.is_symlink(), "BUNDLE_DIRECTORY_MISSING")
    files = {}
    for file in root.iterdir():
        must(file.is_file() and not file.is_symlink(), "INVALID_BUNDLE_FILE_TYPE")
        files[file.name] = file.read_bytes()
    return files


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--acc182-receipt", required=True, type=Path)
    parser.add_argument("--bundle-dir", required=True, type=Path)
    parser.add_argument("--accounting-sha", required=True)
    parser.add_argument("--shared-sha", required=True)
    parser.add_argument("--merged-tree", required=True)
    parser.add_argument("--wrangler-version", required=True)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = validate_bundle(
            json.loads(args.acc182_receipt.read_text()),
            args.accounting_sha, args.shared_sha, args.merged_tree,
            read_bundle(args.bundle_dir), args.wrangler_version
        )
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(receipt, indent=2) + "\n")
        print("ACC183_PINNED_ACTUAL_WRANGLER_DRYRUN_BUNDLE=PASS")
        print("ACC183_BUNDLE_COUNT=" + str(len(receipt["generated_bundle_files"])))
        print("ACC183_SOURCE_AND_BUNDLE_FINANCE_MARKERS=PASS")
        print("ACC183_PRODUCTION_WORKER_DEPLOY=NOT_EXECUTED")
        print("ACC183_RELEASE_DECISION=NO_GO")
        print("ACC183_PRODUCTION_MUTATIONS=ZERO")
    except (OSError, UnicodeError, json.JSONDecodeError, BundleBlocked) as e:
        parser.exit(1, str(e) + "\n")


if __name__ == "__main__":
    main()
