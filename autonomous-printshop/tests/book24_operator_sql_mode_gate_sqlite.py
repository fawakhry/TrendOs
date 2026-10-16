#!/usr/bin/env python3
"""BOOK24: Execute the EXACT claim and complete SQL extracted from JS in sqlite3.
Entire test is in-memory; no real D1, workers, Google, orders or machines.
"""
import re
import sqlite3
from pathlib import Path

src = Path("autonomous-printshop/core/operator-task-authority-v1.mjs").read_text()
migration = Path("autonomous-printshop/migrations/0020_operator_task_authority_v1.sql").read_text()

def extract(var):
    match = re.search(r"const " + var + r"=db\.prepare\(\`(.*?)\`\)\.bind\(", src, flags=re.S)
    assert match, "missing exact source SQL: " + var
    return match.group(1)

claim_sql = extract("insertTask")
complete_sql = extract("updateTask")
assert claim_sql.count("?") == 11, "claim mutation must bind operator to control"
assert complete_sql.count("?") == 5, "complete mutation must bind operator to control"
assert "operator_task_control" in claim_sql and "operator_task_control" in complete_sql
assert "canary_operator_id" in claim_sql and "canary_operator_id" in complete_sql

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(migration)

def mode(value, canary=None):
    db.execute("UPDATE operator_task_control SET mode=?,canary_operator_id=?,epoch=epoch+1,updated_by='BOOK24_FAKE_TEST',change_reason='OFFLINE_TEST'",(value,canary))

def claim(op, num):
    args = [f"BOOK24_FAKE_TASK_{num}",f"BOOK24_FAKE_ORDER_{num}",f"BOOK24_FAKE_LINE_{num}",
            "طباعة",op,"عاجل",None,"FAKE_VERSION","FAKE_HASH",f"BOOK24_FAKE_KEY_{num}",op]
    return db.execute(claim_sql,args).rowcount

def complete(task, op, key):
    return db.execute(complete_sql,[key,"{}",task,op,op]).rowcount

# Initial migration OFF: no writes even if application preflight was stale.
assert db.execute("SELECT mode FROM operator_task_control").fetchone()[0]=="OFF"
assert claim("wael",1)==0
mode("SHADOW")
assert claim("wael",2)==0
mode("CANARY","gaber")
assert claim("wael",3)==0
assert claim("gaber",4)==1
assert complete("BOOK24_FAKE_TASK_4","wael","NO_WRONG_OPERATOR")==0
assert complete("BOOK24_FAKE_TASK_4","gaber","BOOK24_FINISH_CANARY")==1
assert db.execute("SELECT status FROM operator_tasks WHERE task_id='BOOK24_FAKE_TASK_4'").fetchone()[0]=="COMPLETED"

mode("GENERAL")
assert claim("wael",5)==1
# Simulate a mode flip AFTER caller read GENERAL, BEFORE its UPDATE SQL.
mode("OFF")
assert complete("BOOK24_FAKE_TASK_5","wael","NO_OFF_COMPLETE")==0
assert db.execute("SELECT status FROM operator_tasks WHERE task_id='BOOK24_FAKE_TASK_5'").fetchone()[0]=="ACTIVE"
mode("SHADOW")
assert complete("BOOK24_FAKE_TASK_5","wael","NO_SHADOW_COMPLETE")==0
mode("CANARY","gaber")
assert complete("BOOK24_FAKE_TASK_5","wael","NO_WRONG_CANARY")==0
mode("CANARY","wael")
assert complete("BOOK24_FAKE_TASK_5","wael","BOOK24_FINISH_VALID")==1
assert complete("BOOK24_FAKE_TASK_5","wael","BOOK24_FINISH_VALID")==0
assert db.execute("SELECT COUNT(*) FROM operator_tasks WHERE status='COMPLETED'").fetchone()[0]==2

# Flip mode after GENERAL preflight but before INSERT: SQL gate still denies.
mode("GENERAL")
mode("OFF")
assert claim("gaber",6)==0
assert db.execute("SELECT COUNT(*) FROM operator_task_events").fetchone()[0]==0, "SQL fixture tests mutations only, no event path side effects"
print("BOOK24_SQLITE_SOURCE_MUTATION_GATE=PASS")
print("OFF_SHADOW=NO_MUTATION")
print("CANARY_MISMATCH=NO_MUTATION")
print("CANARY_EXACT_AND_GENERAL=ALLOW")
print("STALE_PREFLIGHT_MODE_CHANGE=FAIL_CLOSED")
