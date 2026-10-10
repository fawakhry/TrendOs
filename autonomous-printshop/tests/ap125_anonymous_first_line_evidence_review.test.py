#!/usr/bin/env python3
"""AP-125: test exact anonymous first-line evidence query on synthetic SQLite."""
import sqlite3,re,runpy
from pathlib import Path
src=Path("autonomous-printshop/diagnostics/AP125_D1_ANONYMOUS_FIRST_LINE_EVIDENCE_RECORD_REVIEW.sql").read_text()
sql="\n".join(x for x in src.splitlines() if not x.lstrip().startswith("--"))
assert sql.lstrip().startswith("WITH\n") and sqlite3.complete_statement(sql)
assert sql.count(";")==1
assert not re.search(r"\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|PRAGMA|ATTACH|DETACH|VACUUM)\b",sql,re.I)
assert "ORDER BY n.dueDay ASC,n.department ASC,n.lineId ASC" in sql
assert "PARTITION BY e.evidence_kind" in sql and "DENSE_RANK()" in sql
assert "JOIN first_review_sample s ON s.lineId=e.line_id" in sql
ns=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
db=ns["c"];db.row_factory=sqlite3.Row
db.execute("""CREATE TABLE autonomous_readiness_evidence(
  evidence_id TEXT PRIMARY KEY,line_id TEXT NOT NULL,evidence_kind TEXT,
  evidence_state TEXT,observed_at_ms INTEGER,expires_at_ms INTEGER)""")
def query():
  rows=[dict(x) for x in db.execute(sql)]
  assert len(rows)==1,rows
  row=rows[0]
  assert set(row)=={"anonymousSampleCount","sampleDepartmentClass",
    "designRecordReview","materialRecordReview","machineRecordReview"},row
  assert row["anonymousSampleCount"] in (0,1)
  assert row["sampleDepartmentClass"] in ("NO_SAMPLE","PRINT","LASER")
  assert all(x in ("NO_SAMPLE","NO_RECORDED_EVIDENCE","SOURCE_TIME_UNVERIFIED",
    "AMBIGUOUS_LATEST_EVIDENCE","FUTURE_TIME_REVIEW","EXPIRY_NOT_VERIFIED",
    "BLOCKED_CLAIM","READY_CLAIM_SOURCE_UNVERIFIED","UNKNOWN_CLAIM") for x in
    (row["designRecordReview"],row["materialRecordReview"],row["machineRecordReview"]))
  return row
one=query()
assert one["anonymousSampleCount"]==1 and one["sampleDepartmentClass"]=="PRINT",one
assert one["designRecordReview"]=="NO_RECORDED_EVIDENCE"
assert one["materialRecordReview"]=="NO_RECORDED_EVIDENCE"
assert one["machineRecordReview"]=="NO_RECORDED_EVIDENCE"
now_ms=int(db.execute("SELECT strftime('%s','now')").fetchone()[0])*1000
db.executemany("""INSERT INTO autonomous_readiness_evidence VALUES(?,?,?,?,?,?)""",[
 ("d-ready","SL2","DESIGN","READY",now_ms-1000,now_ms+100000),
 ("m-block","SL2","MATERIAL","BLOCKED",now_ms-1000,now_ms+100000),
 ("mc-no-ttl","SL2","MACHINE","READY",now_ms-1000,None),
 ("other-line","SL5","DESIGN","BLOCKED",now_ms-100,now_ms+100000)
])
one=query()
assert one["designRecordReview"]=="READY_CLAIM_SOURCE_UNVERIFIED",one
assert one["materialRecordReview"]=="BLOCKED_CLAIM",one
assert one["machineRecordReview"]=="EXPIRY_NOT_VERIFIED",one
db.execute("INSERT INTO autonomous_readiness_evidence VALUES(?,?,?,?,?,?)",
  ("m-equal","SL2","MATERIAL","READY",now_ms-1000,now_ms+100000))
assert query()["materialRecordReview"]=="AMBIGUOUS_LATEST_EVIDENCE"
db.execute("INSERT INTO autonomous_readiness_evidence VALUES(?,?,?,?,?,?)",
  ("m-history-invalid","SL2","MATERIAL","UNKNOWN",-1,None))
assert query()["materialRecordReview"]=="SOURCE_TIME_UNVERIFIED"
# Old source order goes away, leaving next synthetic candidate only.
db.execute("UPDATE t12_prod_lines SET status='تم التسليم' WHERE line_id='SL2'")
result=query()
assert result["anonymousSampleCount"]==1
assert result["designRecordReview"]=="BLOCKED_CLAIM"
assert result["materialRecordReview"]=="NO_RECORDED_EVIDENCE"
db.execute("UPDATE employee_core_lines_v1 SET status='تم التسليم' WHERE line_id='SL5'")
none=query()
assert none["anonymousSampleCount"]==0 and none["sampleDepartmentClass"]=="NO_SAMPLE"
assert none["designRecordReview"]=="NO_SAMPLE"
print("AP125_ANONYMOUS_ONE_FIRST_LINE_SQLITE=PASS")
print("AP125_DESIGN_MATERIAL_MACHINE_SAME_LINE_SIGNAL=PASS")
print("AP125_TIES_INVALID_HISTORY_EXPIRY_FAIL_CLOSED=PASS")
print("AP125_PRIVATE_ORDER_LINE_IDS_NOT_IN_OUTPUT=PASS")
print("AP125_LIVE_D1=NOT_ACCESSED_IN_TEST")
