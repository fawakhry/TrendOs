#!/usr/bin/env python3
"""ACC292 private owner-run G1 prerequisite inventory. Read-only, no secrets printed.

This is NOT employee provisioning, native SSO proof, independent recovery,
financial authorization, supplier posting, or production GO.
Only fixed exact Stage D1 identities, Wrangler secret *names*, and aggregate
operational native-auth SELECTs are read. No personal rows or credentials.
"""
import argparse
import json
import subprocess
import sys
import tomllib
from pathlib import Path

HERE = Path(__file__).resolve().parent
OP_CFG = HERE / "wrangler.trendos-native-session-source.toml"
FIN_CFG = HERE / "wrangler.toml"
OP_NAME, OP_UUID = "trendos-staging", "bfe05bde-a3a1-49bc-ad3d-3f0b94a8f8a6"
FIN_NAME, FIN_UUID = "easystore-accounting-staging", "c2fe1a54-90f5-4e6f-9d51-80ce23e21328"
SECRET_SETS = {
    "easystore-accounting-staging-api": (
        "TRENDOS_EMPLOYEE_SESSION_HMAC_V1", "TRENDOS_CUSTOMER_FACTS_HMAC_V1"),
    "trendos-native-session-stage-source": (
        "TRENDOS_EMPLOYEE_SESSION_HMAC_V1", "EDGE_SESSION_SECRET"),
    "trendos-customer-facts-stage-source": ("TRENDOS_CUSTOMER_FACTS_HMAC_V1",),
}
CONTROL_SQL = ("SELECT mode FROM employee_auth_control_v1 "
               "WHERE singleton=1 AND marker='T12_EMPLOYEE_AUTH_V1'")
COUNT_SQL = (
    "SELECT "
    "(SELECT COUNT(*) FROM employee_auth_users_v1) AS users, "
    "(SELECT COUNT(*) FROM employee_auth_users_v1 "
    " WHERE active=1 AND must_change=0) AS eligible_users, "
    "(SELECT COUNT(*) FROM employee_auth_sessions_v1 "
    " WHERE revoked_at_ms IS NULL AND "
    " expires_at_ms > CAST(strftime('%s','now') AS INTEGER)*1000) AS live_sessions"
)

class Stop(RuntimeError):
    pass

def require(condition, reason):
    if not condition:
        raise Stop(reason)

def check_local_config():
    op = tomllib.loads(OP_CFG.read_text(encoding="utf-8"))
    fin = tomllib.loads(FIN_CFG.read_text(encoding="utf-8"))
    require(op.get("name") == "trendos-native-session-stage-source" and
            op.get("workers_dev") is False and
            op.get("d1_databases") == [{"binding": "DB",
                                        "database_name": OP_NAME,
                                        "database_id": OP_UUID}],
            "OPERATIONAL_STAGE_CONFIG_IDENTITY_STOP")
    require(fin.get("name") == "easystore-accounting-staging-api" and
            fin.get("workers_dev") is False and
            fin.get("d1_databases") == [{"binding": "DB",
                                        "database_name": FIN_NAME,
                                        "database_id": FIN_UUID}],
            "FINANCE_STAGE_CONFIG_IDENTITY_STOP")
    flags = fin.get("vars", {})
    require(all(flags.get(k) == v for k, v in (
        ("FINANCE_WRITES", "OFF"), ("FINANCE_RELEASE", "NO_GO"),
        ("EASYSTORE_STAGE_READONLY_API_V1", "OFF"),
        ("EASYSTORE_STAGE_SUPPLIER_MASTER_INTAKE_V1", "OFF"),
        ("EASYSTORE_SUPPLIER_MASTER_INTAKE_V1", "OFF"),
        ("EASYSTORE_OPENING_DRAFT_INTAKE_V1", "OFF"),
        ("EASYSTORE_ACCOUNTING_D1_WRITES", "false"),
        ("EASYSTORE_ACCOUNTING_D1_WRITE_MODE", "OFF"),
    )), "FINANCE_FLAGS_NOT_ALL_OFF_STOP")
    require(json.loads(flags.get("ACCOUNTING_FINANCE_GRANTS_V1", "{}")) ==
            {"version": 1, "grants": []}, "UNEXPECTED_FINANCE_GRANTS_STOP")

def run(cli, args):
    # No shell, files, input secrets, auth tokens, logs or provider stdout.
    command = [str(cli), *args]
    try:
        p = subprocess.run(command, cwd=HERE, capture_output=True,
                           text=True, check=False, timeout=90)
    except (OSError, subprocess.TimeoutExpired):
        raise Stop("LOCAL_WRANGLER_UNAVAILABLE_OR_TIMEOUT") from None
    require(p.returncode == 0 and len(p.stdout) < 1000000,
            "WRANGLER_READONLY_PROVIDER_COMMAND_FAILED")
    try:
        return json.loads(p.stdout)
    except ValueError:
        raise Stop("WRANGLER_UNEXPECTED_JSON_SHAPE") from None

def provider_identity(cli):
    items = run(cli, ["d1", "list", "--json", "--config", str(OP_CFG)])
    require(isinstance(items, list), "D1_LIST_FORMAT_STOP")
    for name, uuid in ((OP_NAME, OP_UUID), (FIN_NAME, FIN_UUID)):
        hits = [x for x in items if isinstance(x, dict) and
                x.get("name") == name and
                (x.get("uuid") or x.get("id")) == uuid]
        require(len(hits) == 1, "D1_STAGE_IDENTITY_DRIFT_STOP")

def secret_names(cli):
    missing = []
    for worker, expected in SECRET_SETS.items():
        cfg = OP_CFG if worker == "trendos-native-session-stage-source" else FIN_CFG
        # --name picks exact private Worker; no secret values available in API.
        out = run(cli, ["secret", "list", "--name", worker, "--format", "json",
                        "--config", str(cfg)])
        require(isinstance(out, list) and
                all(isinstance(x, dict) and isinstance(x.get("name"), str)
                    for x in out),
                "WORKER_SECRET_NAME_LIST_UNVERIFIED_STOP")
        found = {x["name"] for x in out}
        missing += [f"{worker}:{key}" for key in expected if key not in found]
    return missing

def select_aggregate(cli, sql, allowed):
    require(sql in (CONTROL_SQL, COUNT_SQL), "NON_AGGREGATE_QUERY_FORBIDDEN")
    raw = run(cli, ["d1", "execute", OP_NAME, "--remote", "--json",
                    "--config", str(OP_CFG), "--command", sql])
    require(isinstance(raw, list) and len(raw) == 1 and
            isinstance(raw[0], dict) and raw[0].get("success") is True,
            "STAGE_SELECT_RESULT_INVALID")
    result = raw[0]
    meta = result.get("meta", {})
    require(isinstance(meta, dict) and
            meta.get("rows_written") == 0 and
            meta.get("changes") == 0, "STAGE_SQL_METADATA_WRITES_OR_UNKNOWN_STOP")
    rows = result.get("results")
    require(isinstance(rows, list) and len(rows) == 1 and
            isinstance(rows[0], dict) and
            set(rows[0]) == set(allowed), "STAGE_AGGREGATE_ROW_UNEXPECTED")
    return rows[0]

def audit(cli, *, inventory_despite_missing_signer=False):
    check_local_config()
    require(Path(cli).is_file(), "LOCAL_WRANGLER_BINARY_NOT_FOUND")
    provider_identity(cli)
    print("ACC292_EXACT_SEPARATE_STAGE_IDENTITIES=PASS")
    missing = secret_names(cli)
    if missing:
        # Names are not secret values. Never print any token, password or hash.
        print("ACC292_REQUIRED_SECRET_NAMES=MISSING")
        print("ACC292_MISSING_SECRET_NAMES=" + ",".join(missing))
        print("ACC292_G1_REAL_SESSION=NOT_QUALIFIED")
        print("ACC292_FINANCE_WRITES=OFF")
        if not inventory_despite_missing_signer:
            raise Stop("REQUIRED_SECRET_NAMES_MISSING_STOP")
        print("ACC294_AGGREGATE_INVENTORY_ONLY=YES")
    else:
        print("ACC292_REQUIRED_SECRET_NAMES=PRESENT_NOT_VALUE_MATCH_PROOF")
    ctrl = select_aggregate(cli, CONTROL_SQL, ("mode",))
    counts = select_aggregate(cli, COUNT_SQL,
                              ("users", "eligible_users", "live_sessions"))
    require(ctrl["mode"] in ("OFF", "TRANSITIONAL", "NATIVE") and
            all(type(counts[k]) is int and counts[k] >= 0
                for k in ("users", "eligible_users", "live_sessions")),
            "STAGE_AUTH_COUNTS_INVALID")
    print("ACC292_STAGE_AUTH_MODE=" + ctrl["mode"])
    print("ACC292_STAGE_USER_COUNT=" + str(counts["users"]))
    print("ACC292_STAGE_ELIGIBLE_USER_COUNT=" + str(counts["eligible_users"]))
    print("ACC292_STAGE_ACTIVE_SESSION_COUNT=" + str(counts["live_sessions"]))
    print("ACC292_NATIVE_SESSION_SIGNER_EQUALITY=NOT_VERIFIED")
    print("ACC292_REAL_EMPLOYEE_SSO=NOT_TESTED")
    print("ACC292_G1_REAL_SESSION=NOT_QUALIFIED")
    print("ACC292_FINANCE_WRITES=OFF")
    if missing:
        raise Stop("REQUIRED_SECRET_NAMES_MISSING_STOP")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wrangler", default=str(Path.home() /
        ".local/share/trendos-finance-tools/node_modules/.bin/wrangler"))
    parser.add_argument("--inventory-despite-missing-signer", action="store_true",
        help="Read only fixed Stage auth mode/count aggregates; missing secrets still exit STOP. No key recovery or G1 clearance.")
    args = parser.parse_args()
    try:
        audit(args.wrangler, inventory_despite_missing_signer=
              args.inventory_despite_missing_signer)
    except (Stop, OSError, ValueError, tomllib.TOMLDecodeError) as e:
        # Do not echo provider stdout, stderr, exception backtraces or secrets.
        print("ACC292_STOP=" + (str(e) if isinstance(e, Stop)
                               else "LOCAL_VALIDATION_FAILED"))
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
