#!/usr/bin/env python3
"""AP-113 SELECT-only owner D1 gate-coverage diagnostic, synthetic SQLite ONLY.

Same AP-107 legacy/native/dedupe joins. Exhaustive mutually exclusive buckets:
  DUE_FIELD_MISSING_REVIEW > FLY_PRINT_1_EXCLUDED > IN_AP112_CAIRO_TRIAGE.
Never exports raw customer/order/line/source IDs, dates or private values.
"""
import re, sqlite3, runpy
from pathlib import Path

root=Path("autonomous-printshop/diagnostics")
original=(root/"AP107_D1_PRINTING_DATE_TRIAGE_READONLY.sql").read_text(encoding="utf-8")
sql=(root/"AP113_D1_DUE_SCREEN_COVERAGE_RECONCILE_READONLY.sql").read_text(encoding="utf-8")
prefix=original[original.index("WITH\n"):original.index("screened AS (")]
prefix=re.sub(r"\s+"," ",prefix).strip()
actual_prefix=sql.split("reconciled AS (",1)[0].strip()
assert actual_prefix==prefix,"AP113_MUST_REUSE_AP107_SOURCE_AND_PRECEDENCE"
assert sql.startswith("WITH params AS") and sql.count(";")==1
assert sql.rstrip().endswith(";") and sql.count("\n")==1
assert sqlite3.complete_statement(sql)
for forbidden in ("INSERT","DELETE","UPDATE","REPLACE","DROP","ALTER","CREATE",
                  "PRAGMA","ATTACH","DETACH","VACUUM"):
    assert not re.search(r"\b"+forbidden+r"\b",sql,re.I),forbidden
assert "WHERE rn=1" in sql
assert "trim(lineStatus)='طلب جديد'" in sql
assert "trim(dept) IN ('طباعة','ليزر')" in sql
assert "SELECT department,coverageBucket,COUNT(*) AS lineCount" in sql
assert sql.index("DUE_FIELD_MISSING_REVIEW")<sql.index("FLY_PRINT_1_EXCLUDED")
assert sql.index("FLY_PRINT_1_EXCLUDED")<sql.index("IN_AP112_CAIRO_TRIAGE")

# In-memory schema and AP-107 native precedence, archived and status fixtures.
ns=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
conn=ns["c"]
ap107_source=ns["sql"]
old_result=[dict(x) for x in conn.execute(ap107_source)]
assert sum(x["lineCount"] for x in old_result)==8
def buckets():
    return {(x["department"],x["coverageBucket"]):x["lineCount"]
            for x in [dict(y) for y in conn.execute(sql)]}
initial=buckets()
assert initial=={
    ("طباعة","IN_AP112_CAIRO_TRIAGE"):6,
    ("طباعة","FLY_PRINT_1_EXCLUDED"):1,
    ("ليزر","IN_AP112_CAIRO_TRIAGE"):2
},initial
# Additional synthetic source items, with missing due, Fly=1 and BOTH flags.
conn.executemany("INSERT INTO employee_core_orders_v1 VALUES (?,?)",
                 [("SO12",1),("SO13",1),("SO14",1),("SO15",1)])
conn.executemany("INSERT INTO employee_core_lines_v1 VALUES (?,?,?,?,?,?,?)",[
    ("SL12","SO12",1,"طلب جديد","طباعة","","0"),
    ("SL13","SO13",1,"طلب جديد","طباعة","2026-10-12","1"),
    ("SL14","SO14",1,"طلب جديد","طباعة","","1"),
    ("SL15","SO15",1,"طلب جديد","SECRET_PERSON_NAME","2026-10-12","0")
])
computed=buckets()
assert computed=={
    ("طباعة","IN_AP112_CAIRO_TRIAGE"):6,
    ("طباعة","FLY_PRINT_1_EXCLUDED"):2,
    ("طباعة","DUE_FIELD_MISSING_REVIEW"):2,
    ("ليزر","IN_AP112_CAIRO_TRIAGE"):2
},computed
replayed=[dict(x) for x in conn.execute(ap107_source)]
ap107_in_count=sum(row["lineCount"] for row in replayed)
assert ap107_in_count==8==sum(v for (d,k),v in computed.items()
                                    if k=="IN_AP112_CAIRO_TRIAGE")
assert sum(computed.values())==12
# A line with both missing due + Fly 1 goes into the DUE bucket ONLY:
# not double counted. The rows omitted by AP-112 are NOT marked deleted.
assert computed["طباعة","DUE_FIELD_MISSING_REVIEW"]==2
assert sum(v for (d,k),v in computed.items() if k!="IN_AP112_CAIRO_TRIAGE")==4
for dept,bucket in computed:
    assert dept in {"طباعة","ليزر"}
    assert bucket in {"DUE_FIELD_MISSING_REVIEW","FLY_PRINT_1_EXCLUDED","IN_AP112_CAIRO_TRIAGE"}
assert "SECRET_PERSON_NAME" not in str(computed)
print("AP113_AGGREGATE_ONLY_PRIVACY=PASS")
print("AP113_SAME_AP107_DEDUPE_AND_NATIVE_PRECEDENCE=PASS")
print("AP113_SCREENED_PLUS_EXCLUSIONS_EQUALS_NEW_LINES_SYNTHETIC=PASS")
print("AP113_MISSING_DUE_AND_FLY1_OVERLAP_ONCE=PASS")
print("AP113_REAL_D1_RECONCILIATION=NOT_RUN; D1_WRITES=0")
