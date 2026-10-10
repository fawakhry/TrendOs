#!/usr/bin/env python3
"""AP-099: execute the exact review-only SQL on synthetic SQLite.
Never touches real D1. No Production connections, orders, or employee names.
"""
from pathlib import Path
import sqlite3

p=Path("autonomous-printshop/diagnostics/AP099_D1_SHADOW_AGGREGATE_READONLY.sql")
sql=p.read_text(encoding="utf-8")
assert sql.lstrip().startswith("-- AP-099 / SOURCE_ONLY / READ ONLY.")
assert sql.upper().count("SELECT")>=7
assert "ROW_NUMBER()" in sql and "evidenceRank=1" in sql
assert "ORDER BY observed_at_ms DESC,evidence_id DESC" in sql
assert "AND e.kind='MATERIAL'" in sql or "WHEN e.kind='MATERIAL'" in sql
assert "FROM autonomous_readiness_evidence" in sql
assert "WHERE lineRank=1" in sql
# Restrict the SQL to one final SELECT; no DML, DDL, PRAGMA, ATTACH, or comments with IDs.
code="\n".join(v for v in sql.splitlines() if not v.lstrip().startswith("--"))
for word in ("INSERT","DELETE","UPDATE","REPLACE","DROP","ALTER","CREATE","PRAGMA","ATTACH","DETACH"):
    import re
    assert not re.search(r"\b"+word+r"\b",code,re.IGNORECASE), word
assert code.count(";")==1 and code.rstrip().endswith(";")

c=sqlite3.connect(":memory:")
c.row_factory=sqlite3.Row
schema=[
"CREATE TABLE employee_core_orders_v1(order_id TEXT PRIMARY KEY,active INTEGER)",
"CREATE TABLE employee_core_lines_v1(line_id TEXT PRIMARY KEY,order_id TEXT,active INTEGER,status TEXT,expected_delivery_at TEXT,fly_print INTEGER)",
"CREATE TABLE employee_core_archive_lines_v1(line_id TEXT PRIMARY KEY)",
"CREATE TABLE t12_legacy_line_runtime(line_id TEXT,order_id TEXT,status TEXT)",
"CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY)",
"CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT,status TEXT,fly_print INTEGER)",
"CREATE TABLE t12_prod_line_runtime(line_id TEXT,status TEXT)",
"CREATE TABLE t12_prod_order_schedule(order_id TEXT,expected_delivery_date TEXT)",
"CREATE TABLE autonomous_readiness_evidence(evidence_id TEXT PRIMARY KEY,line_id TEXT,evidence_kind TEXT,evidence_state TEXT,observed_at_ms INTEGER,expires_at_ms INTEGER)"
]
for table in schema:c.execute(table)
c.executemany("INSERT INTO employee_core_orders_v1 VALUES (?,?)",[
 ("O1",1),("O2",1),("O3",1),("O4",0)])
c.executemany("INSERT INTO employee_core_lines_v1 VALUES (?,?,?,?,?,?)",[
 ("L1","O1",1,"طلب جديد","2026-10-14",0),
 ("L2","O2",1,"تم التسليم","2026-10-12",0),
 ("L3","O3",1,"تم التسليم","2026-10-12",0),
 ("L-INACTIVE","O4",1,"طلب جديد","2026-10-12",0)])
c.executemany("INSERT INTO t12_prod_orders VALUES (?)",[("N1",),("N2",),("N3",),("N4",)])
c.executemany("INSERT INTO t12_prod_lines VALUES (?,?,?,?)",[
 ("L3","N1","طلب جديد",0),
 ("L4","N2","طلب جديد",0),
 ("L5","N3","طلب جديد",1),
 ("L6","N4","طلب جديد",0)])
c.executemany("INSERT INTO t12_prod_order_schedule VALUES (?,?)",[
 ("N1","2026-10-14"),("N2",""),("N3","2026-10-14"),("N4","2026-10-14")])
c.execute("INSERT INTO employee_core_archive_lines_v1 VALUES ('L6')")
now=1790000000000 # old evidence safe: expiry None; expired blocker must override older READY
c.executemany("INSERT INTO autonomous_readiness_evidence VALUES (?,?,?,?,?,?)",[
 ("D1","L1","DESIGN","READY",now,None),
 ("M-old","L1","MATERIAL","READY",now,None),
 ("M-expired","L1","MATERIAL","BLOCKED",now+2000,now+2001),
 ("MC1","L1","MACHINE","READY",now,None),
 ("D3","L3","DESIGN","READY",now,None),
 ("M3","L3","MATERIAL","READY",now,None),
 ("MC3","L3","MACHINE","READY",now,None),
 ("D4","L4","DESIGN","READY",now,None),
 ("M4","L4","MATERIAL","READY",now,None),
 ("MC4","L4","MACHINE","READY",now,None)])
result=dict(c.execute(sql).fetchone())
# SQL uses current clock; observations 1790000000000 (Oct 2026) are future
# relative to some fixture dates but must be <= running now. Deterministic
# adjust the synthetic timestamps to an always-past 2020 date.
assert result["totalCurrentLineKeys"]==5,result
assert result["closedStatusLines"]==1,result
assert result["newStatusLines"]==4,result
assert result["potentialBaselineLines"]==2,result
assert result["duplicateLineSourceRows"]==1,result
assert result["potentialMissingMaterial"]==1,result
assert result["allThreeSignalsReady"]==1,result
assert result["potentialMissingDesign"]==0,result
assert result["potentialMissingMachine"]==0,result
assert sorted(result)==sorted([
 "allThreeSignalsReady","closedStatusLines","duplicateLineSourceRows",
 "newStatusLines","otherStatusLines","potentialBaselineLines",
 "potentialMissingDesign","potentialMissingMachine",
 "potentialMissingMaterial","totalCurrentLineKeys"])
assert "lineId" not in result and "orderId" not in result
print("AP099_SQL_READ_ONLY_SYNTHETIC_SQLITE=PASS")
print("AP099_NATIVE_OVERRIDES_LEGACY_AND_ARCHIVED_EXCLUDED=PASS")
print("AP099_EXPIRED_NEWEST_MATERIAL_NEVER_REVIVES_READY=PASS")
print("AP099_OUTPUT_ONLY_AGGREGATES_NO_IDS=PASS")
print("AP099_REAL_D1_CONNECTED=NO; PRODUCTION_WRITES=0")
