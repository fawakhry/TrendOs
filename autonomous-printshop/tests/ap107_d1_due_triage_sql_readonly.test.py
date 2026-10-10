#!/usr/bin/env python3
"""AP-107 D1 printed/laser due-date triage — exact SQL on synthetic SQLite.

Never connects to Cloudflare. Only returns aggregate counts; no user/order IDs.
"""
import re, sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone

sql=Path("autonomous-printshop/diagnostics/AP107_D1_PRINTING_DATE_TRIAGE_READONLY.sql").read_text(encoding="utf-8")
assert sql.startswith("-- AP-107 / REVIEW ONLY / SELECT ONLY")
code="\n".join(line for line in sql.splitlines() if not line.lstrip().startswith("--"))
assert code.count(";")==1 and code.rstrip().endswith(";")
for forbidden in ("INSERT","DELETE","UPDATE","REPLACE","DROP","ALTER","CREATE","PRAGMA","ATTACH","DETACH","VACUUM"):
    assert not re.search(r"\b"+forbidden+r"\b",code,re.I),f"READ_ONLY_VIOLATION:{forbidden}"
assert "PARTITION BY lineId" in sql and "ORDER BY originRank DESC" in sql
assert "SELECT department,dueBucket,COUNT(*) AS lineCount" in sql
assert "date('now','+3 hours')" in sql
assert "date(julianday(n.normalizedDay))<>n.normalizedDay" in sql
assert "DATE_FORMAT_OR_TIME_REVIEW" in sql
assert "FLY_FLAG_REVIEW" in sql

c=sqlite3.connect(":memory:");c.row_factory=sqlite3.Row
tables=[
"CREATE TABLE employee_core_orders_v1(order_id TEXT PRIMARY KEY,active INTEGER)",
"CREATE TABLE employee_core_lines_v1(line_id TEXT PRIMARY KEY,order_id TEXT,active INTEGER,status TEXT,department TEXT,expected_delivery_at TEXT,fly_print TEXT)",
"CREATE TABLE employee_core_archive_lines_v1(line_id TEXT PRIMARY KEY)",
"CREATE TABLE t12_legacy_line_runtime(line_id TEXT,order_id TEXT,status TEXT)",
"CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY)",
"CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT,status TEXT,department TEXT,fly_print TEXT)",
"CREATE TABLE t12_prod_line_runtime(line_id TEXT,status TEXT)",
"CREATE TABLE t12_prod_order_schedule(order_id TEXT,expected_delivery_date TEXT)"
]
for q in tables:c.execute(q)

cairo_today=datetime.now(timezone(timedelta(hours=3))).date()
old=(cairo_today-timedelta(days=1)).isoformat()
today=cairo_today.isoformat()
future=(cairo_today+timedelta(days=2)).isoformat()
dayfirst=(cairo_today+timedelta(days=3)).strftime("%d/%m/%Y")
c.executemany("INSERT INTO employee_core_orders_v1 VALUES (?,?)",[
 ("SO1",1),("SO2",1),("SO3",1),("SO4",1),("SO5",1),("SO6",1),
 ("SO7",1),("SO8",1),("SO9",1),("SO10",1),("SO11",0)
])
c.executemany("INSERT INTO employee_core_lines_v1 VALUES (?,?,?,?,?,?,?)",[
 ("SL1","SO1",1,"طلب جديد","طباعة",old,"0"),
 ("SL2","SO2",1,"طلب جديد","طباعة",old,"0"), # native overrides this to future
 ("SL3","SO3",1,"طلب جديد","طباعة",today,"0"),
 ("SL4","SO4",1,"طلب جديد","طباعة","2026-02-30","0"),
 ("SL5","SO5",1,"طلب جديد","طباعة",dayfirst,"0"),
 ("SL6","SO6",1,"طلب جديد","ليزر",today+"T09:00:00Z","0"),
 ("SL7","SO7",1,"طلب جديد","طباعة",today,"maybe"),
 ("SL8","SO8",1,"طلب جديد","طباعة",today,"0"), # archived
 ("SL9","SO9",1,"تم التسليم","طباعة",today,"0"),
 ("SL10","SO10",1,"طلب جديد","طباعة",today,"1"), # Fly Print
 ("SL11","SO11",1,"طلب جديد","طباعة",today,"0") # inactive order
])
c.executemany("INSERT INTO t12_prod_orders VALUES (?)",[("NO2",),("NO12",)])
c.executemany("INSERT INTO t12_prod_lines VALUES (?,?,?,?,?)",[
 ("SL2","NO2","طلب جديد","طباعة","0"),
 ("NL12","NO12","طلب جديد","ليزر","0")
])
c.executemany("INSERT INTO t12_prod_order_schedule VALUES (?,?)",[
 ("NO2",future),("NO12",old)
])
c.execute("INSERT INTO employee_core_archive_lines_v1 VALUES ('SL8')")
result=[dict(x) for x in c.execute(sql)]
counts={(x["department"],x["dueBucket"]):x["lineCount"] for x in result}
expected={
 ("طباعة","OVERDUE_HUMAN_REVIEW"):1,
 ("طباعة","DUE_TODAY_HUMAN_REVIEW"):1,
 ("طباعة","FUTURE_DATE_EVIDENCE_REVIEW"):2,
 ("طباعة","INVALID_CALENDAR_DATE_REVIEW"):1,
 ("طباعة","FLY_FLAG_REVIEW"):1,
 ("ليزر","DATE_FORMAT_OR_TIME_REVIEW"):1,
 ("ليزر","OVERDUE_HUMAN_REVIEW"):1
}
assert counts==expected,(counts,expected)
assert sum(counts.values())==8
assert set(result[0])=={"department","dueBucket","lineCount"}
for row in result:
    assert row["department"] in ("طباعة","ليزر")
    assert row["dueBucket"] in (
        "OVERDUE_HUMAN_REVIEW","DUE_TODAY_HUMAN_REVIEW","FUTURE_DATE_EVIDENCE_REVIEW",
        "INVALID_CALENDAR_DATE_REVIEW","DATE_FORMAT_OR_TIME_REVIEW","FLY_FLAG_REVIEW"
    )
    assert isinstance(row["lineCount"],int)
print("AP107_DUE_BUCKET_SQL_SYNTHETIC=PASS")
print("AP107_CAIRO_UTC_PLUS_3_REVIEW_CLOCK=PASS")
print("AP107_NATIVE_PRECEDENCE_CLOSED_ARCHIVED_FLY=PASS")
print("AP107_DMY_LEAP_INVALID_TIMESTAMP_REVIEW=PASS")
print("AP107_NO_IDS_OR_DATA_WRITES=PASS")
print("AP107_LIVE_D1_QUERY=NOT_RUN")
