#!/usr/bin/env python3
"""ACC-182: fail-closed provenance, role, source and config diff negative tests."""
import json
from pathlib import Path
import importlib.util
spec = importlib.util.spec_from_file_location(
    "acc182", "scripts/easystore_acc182_offline_worker_release_manifest.py"
)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
CandidateBlocked, PINNED_SHARED, read_sources, verify_source_contract = (
    m.CandidateBlocked, m.PINNED_SHARED, m.read_sources, m.verify_source_contract
)

ACCOUNTING = "a" * 40
TREE = "b" * 40
previous = read_sources(Path("."))
source_cfg = previous["cloudflare-d1/wrangler.toml"]
auth_false = (
    b'TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"',
    b'TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"',
)
auth_true = (
    b'TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "true"',
    b'TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "true"',
)
merged = dict(previous)
cfg = source_cfg
for old, new in zip(auth_false, auth_true):
    assert cfg.count(old) == 1
    cfg = cfg.replace(old, new, 1)
merged["cloudflare-d1/wrangler.toml"] = cfg


def run(before=None, after=None, a=ACCOUNTING, s=PINNED_SHARED, tree=TREE):
    return verify_source_contract(
        before if before is not None else previous,
        after if after is not None else merged,
        a, s, tree
    )


receipt = run()
assert receipt["release_decision"] == "NO_GO"
assert receipt["production_auth_configuration_verified"] is False
assert receipt["production_variables_updated"] is False
assert receipt["safe_to_execute_old_deploy_workflow"] is False
assert receipt["protected_real_production_database_backup_verified"] is False
assert receipt["finance_cutover_date"] is None
assert receipt["production_worker_deploy_executed"] is False
assert receipt["production_financial_d1_mutations"] == 0
assert sorted(receipt["merged_config_change_exactly"]) == sorted([
    "TRENDOS_EMPLOYEE_AUTH_V1_ENABLED",
    "TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1",
])


def blocked(after, expected, before=None, a=ACCOUNTING, s=PINNED_SHARED, tree=TREE):
    try:
        run(before=before, after=after, a=a, s=s, tree=tree)
    except CandidateBlocked as e:
        assert expected in str(e), f"unexpected cause: {e}"
    else:
        raise AssertionError("ACC182_DID_NOT_STOP_ON_" + expected)


blocked(merged, "SHARED_REVISION_UNPINNED", s="f" * 40)
blocked(merged, "SOURCE_SHA_INVALID", a="not-an-exact-sha")
blocked(merged, "SOURCE_SHA_INVALID", tree="ff")
for path in (
    "cloudflare-d1/src/employee-accounting-native-v1.mjs",
    "cloudflare-d1/production-shadow/index.js",
    "cloudflare-d1/src/index_v2.js",
    "docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json"
):
    alternate = dict(merged)
    alternate[path] += b"\n# alter original source\n"
    blocked(alternate, "UNEXPECTED_MERGED_CHANGE_")

wrong_config = dict(merged)
wrong_config["cloudflare-d1/wrangler.toml"] = cfg.replace(
    b'TRENDOS_T12_PROD_CREATE_CANARY_ENABLED = "false"',
    b'TRENDOS_T12_PROD_CREATE_CANARY_ENABLED = "true"'
)
blocked(wrong_config, "WRANGLER_UNEXPECTED_VARIABLE_DRIFT")
wrong_config = dict(merged)
wrong_config["cloudflare-d1/wrangler.toml"] = source_cfg
blocked(wrong_config, "WRANGLER_UNEXPECTED_VARIABLE_DRIFT")
wrong_config = dict(merged)
wrong_config["cloudflare-d1/wrangler.toml"] = cfg.replace(
    b'database_name = "trendos-main"', b'database_name = "wrong-production-database"'
)
blocked(wrong_config, "PRODUCTION_D1_BINDING_CHANGED")
wrong_config = dict(merged)
wrong_config["cloudflare-d1/wrangler.toml"] = cfg.replace(
    b'main = "production-shadow/index.js"', b'main = "bad-entrypoint.js"'
)
blocked(wrong_config, "WORKER_ENTRYPOINT_CHANGED")
cutover_path = "docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json"
x = json.loads(merged[cutover_path])
for field, unsafe in [
    ("cutover_date_local", "2026-10-11"),
    ("cutover_auto_activate", True),
    ("program_completion_is_not_release_authorization", False),
    ("current_backend_policy", "GENERAL"),
    ("current_frontend_write_mode", "CANARY"),
    ("release_decision", "GO")
]:
    alternate = dict(merged)
    changed = dict(x)
    changed[field] = unsafe
    alternate[cutover_path] = json.dumps(changed).encode()
    # mismatch detection is intentionally BEFORE accepting changed policy.
    blocked(alternate, "UNEXPECTED_MERGED_CHANGE_")
deploy_path=".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml"
alternate = dict(merged)
alternate[deploy_path] = alternate[deploy_path].replace(
    b"out.append('keep_vars = true')", b"out.append('keep_vars = false')"
)
blocked(alternate, "UNEXPECTED_MERGED_CHANGE_")
missing = dict(merged)
missing.pop(deploy_path)
blocked(missing, "REQUIRED_SOURCE_FILES_MISSING")
print("ACC182_SOURCE_SHA_AND_SHARED_REF_TAMPER_DENIED=PASS")
print("ACC182_EMPLOYEE_AUTH_FLAG_DIFF_EXACTLY_TWO=PASS")
print("ACC182_FINANCE_ROUTING_AND_SQL_UNEXPECTED_MERGE_CHANGE_DENIED=PASS")
print("ACC182_D1_BINDING_SHARED_CONFIG_DRIFT_AND_CUTOVER_AUTO_GO_DENIED=PASS")
print("ACC182_PRODUCTION_MUTATIONS=ZERO")
