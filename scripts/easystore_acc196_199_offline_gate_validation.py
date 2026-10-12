#!/usr/bin/env python3
"""ACC196-199 isolated simulated rollback and fail-closed gate audit. Never deploys."""
import hashlib
import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/trendos/staging/ACC196_199_SAFE_PREPARATION_NO_GO_20261012.json"
GATES = ("G1", "G2", "G3", "G4", "G5")
STAGES = ("ACC-196", "ACC-197", "ACC-198", "ACC-199")


def demand(ok, reason):
    if not ok:
        raise ValueError(reason)


def validate_manifest(doc):
    demand(doc.get("schema") == "ACC196_199_SAFE_PREPARATION_V1", "invalid schema")
    demand(doc.get("release_decision") == "NO_GO", "finance release must remain NO_GO")
    demand(doc.get("production_mutations") == 0, "production mutation claimed")
    demand(doc.get("cutover_date_local") is None, "real cutover requested")
    demand(doc.get("previous_live_worker_version_id") is None, "real Worker version may not be inferred")
    demand(doc.get("production_rollback_approved") is False, "actual rollback forbidden")
    demand(doc.get("real_canary_approved") is False, "real canary forbidden")
    demand(doc.get("real_employee_grants_approved") is False, "real grants forbidden")
    demand(doc.get("real_d1_restore_approved") is False, "real restore forbidden")
    demand(doc.get("remote_operations") == [], "unexpected network/production operations")
    demand(doc.get("gates") == dict.fromkeys(GATES, "OPEN"), "an owner gate was closed")
    stages = doc.get("stages")
    demand(isinstance(stages, dict) and set(stages) == set(STAGES), "stage list changed")
    demand(stages["ACC-196"]["status"] == "PREPARED_TEST_ONLY", "rollback simulation overclaimed")
    demand(stages["ACC-197"]["status"] == "PROTOCOL_ONLY_OWNER_BLOCKED", "A2.13 approved without owner")
    demand(stages["ACC-198"]["status"] == "PARTIAL_SYNTHETIC_ONLY", "integrated production acceptance forged")
    demand(stages["ACC-199"]["status"] == "HANDOFF_DRAFT_NO_GO", "handoff is not actual release")
    demand(stages["ACC-196"]["depends_on"] == ["ACC-194", "ACC-195"], "rollback dependencies changed")
    demand(stages["ACC-197"]["depends_on"] == ["ACC-190", "ACC-196"], "A2.13 dependencies changed")
    demand(stages["ACC-198"]["depends_on"] == ["ACC-187", "ACC-188", "ACC-189", "ACC-190", "ACC-191", "ACC-192", "ACC-193"], "integrated acceptance dependencies changed")
    demand(stages["ACC-199"]["depends_on"] == ["ACC-196", "ACC-197", "ACC-198"], "handoff dependencies changed")
    demand(doc.get("gaps") == {"ACC-187": "REFUND_POLICY_AND_HANDLER_MISSING", "ACC-191": "REAL_BROWSER_SSO_UNVERIFIED"}, "real blockers concealed")
    p = doc.get("a213_protocol")
    demand(isinstance(p, dict), "missing A2.13 protocol")
    demand(p.get("status") == "NOT_EXECUTED", "A2.13 protocol executed")
    demand(p.get("real_employee_session") is False and p.get("trial_budget") == 0, "A2.13 armed")
    demand(p.get("planned_owner_approval") is None and p.get("trial_run_id") is None, "A2.13 approval falsely recorded")
    demand(p.get("planned_verifications") == ["PUBLIC_GET_READONLY", "SOURCE_ONLY_SELECT_REVIEW", "STOP_ON_MISMATCH"], "read-only protocol modified")
    return True


def fake_finance_snapshot(db):
    return hashlib.sha256("\n".join(db.iterdump()).encode("utf-8")).hexdigest()


def simulate_code_pointer_rollback(health="FAIL", mutate_data=False):
    """Changes ONLY a fake in-memory Worker version pointer, never database rows."""
    demand(health in ("FAIL", "PASS"), "unexpected fake health")
    db = sqlite3.connect(":memory:")
    try:
        db.execute("CREATE TABLE fake_ledger(id TEXT PRIMARY KEY, cents INTEGER NOT NULL)")
        db.executemany("INSERT INTO fake_ledger VALUES(?, ?)", [("SYNTHETIC-A", 1200), ("SYNTHETIC-B", -1200)])
        db.commit()
        before = fake_finance_snapshot(db)
        active = "SYNTHETIC_CANDIDATE"
        if mutate_data:
            db.execute("UPDATE fake_ledger SET cents=9999 WHERE id='SYNTHETIC-A'")
            db.commit()
        if health == "FAIL":
            active = "SYNTHETIC_PREVIOUS"
        after = fake_finance_snapshot(db)
        demand(before == after, "fake ledger changed during code-only rollback")
        demand(db.execute("SELECT SUM(cents) FROM fake_ledger").fetchone()[0] == 0, "fake ledger unbalanced")
        return active, before
    finally:
        db.close()


def main():
    doc = json.loads(MANIFEST.read_text(encoding="utf-8"))
    validate_manifest(doc)
    active, _ = simulate_code_pointer_rollback("FAIL")
    demand(active == "SYNTHETIC_PREVIOUS", "fake rollback selection failed")
    no_failure, _ = simulate_code_pointer_rollback("PASS")
    demand(no_failure == "SYNTHETIC_CANDIDATE", "fake healthy candidate should be retained")
    print("ACC196_SYNTHETIC_WORKER_POINTER_ROLLBACK_D1_LEDGER_INVARIANT=PASS")
    print("ACC197_A213_PROTOCOL_PREPARED_BUT_TRIAL_NOT_EXECUTED=PASS")
    print("ACC198_REAL_INTEGRATED_ACCEPTANCE=BLOCKED_ACC187_ACC191")
    print("ACC199_HANDOFF_STATUS=DRAFT_NO_GO")
    print("ACCOUNTING_G1_G5=OPEN")
    print("FINANCE_RELEASE=NO_GO")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, sqlite3.Error) as exc:
        print("ACC196_199_OFFLINE_GATE_VALIDATION=FAIL: " + str(exc), file=sys.stderr)
        sys.exit(1)
