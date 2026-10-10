#!/usr/bin/env python3
"""AP-123: actual JS constant bound single-line SQL on AP-107 synthetic D1 schema.

SOURCE ONLY. No Cloudflare calls, network requests, or real order/line/customer data.
"""
from pathlib import Path
import re, runpy, sqlite3
source=Path("autonomous-printshop/core/private-first-line-d1-review-v1.mjs").read_text(encoding="utf-8")
match=re.search(r"export const PRIVATE_FIRST_LINE_D1_SELECT_SQL=\x60(.*?)\x60;",source,re.S)
assert match,"STATIC_QUERY_NOT_FOUND"
sql=match.group(1)
assert sql.lstrip().startswith("WITH legacy AS")
assert sqlite3.complete_statement(sql+";")
assert sql.count("?")==2 and "WHERE l.line_id=?" in sql
assert "ORDER BY originRank DESC" in sql
assert "sourceAmbiguous" in sql
assert "FROM employee_core_lines_v1" in sql and "FROM t12_prod_lines" in sql
assert "COALESCE(lr.status,l.status" in sql
assert "COALESCE(r.status,l.status" in sql
assert "SELECT lineId,lineStatus AS status,department,dueDate,flyPrint" in sql
assert "CASE WHEN nativeMatches>1" in sql
for forbidden in ("INSERT","UPDATE","DELETE","REPLACE","DROP","ALTER",
                  "CREATE","PRAGMA","ATTACH","DETACH","VACUUM"):
    assert not re.search(r"\b"+forbidden+r"\b",sql,re.I),forbidden
ns=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
db=ns["c"]
def select(key):
    rows=[dict(r) for r in db.execute(sql,(key,key))]
    assert len(rows)<=1,(key,rows)
    return rows[0] if rows else None

# Historical data alone does NOT supply live source authority; this checks
# exact join semantics matching previously tested AP-107 source precedence.
selected=select("SL2")
assert selected["lineId"]=="SL2"
assert selected["originRank"]==1,"NATIVE_OVERRIDES_LEGACY"
assert selected["sourceAmbiguous"]==0
assert selected["status"]=="طلب جديد"
assert selected["dueDate"]==ns["future"]
assert selected["lineActive"]==1 and selected["orderActive"]==1
assert selected["archived"]==0
assert select("DOES_NOT_EXIST") is None
assert select("SL8")["archived"]==1
assert select("SL11")["orderActive"]==0
assert select("SL9")["status"]=="تم التسليم"
assert str(select("SL10")["flyPrint"])=="1"
assert select("NL12")["originRank"]==1
assert select("NL12")["department"]=="ليزر"
# A runtime multi-match for a chosen *native* line must fail closed, rather
# than picking a lexically convenient event as proof of current state.
db.executemany("INSERT INTO t12_prod_line_runtime VALUES (?,?)",[
  ("SL2","طلب جديد"),("SL2","تحت التنفيذ")
])
assert select("SL2")["sourceAmbiguous"]==1
# Legacy runtime duplicates with no native record also become ambiguous.
db.executemany("INSERT INTO t12_legacy_line_runtime VALUES (?,?,?)",[
  ("SL1","SO1","طلب جديد"),("SL1","SO1","تحت التنفيذ")
])
assert select("SL1")["sourceAmbiguous"]==1
print("AP123_BOUND_PRIVATE_ONE_LINE_SELECT=PASS")
print("AP123_NATIVE_LEGACY_SAME_SOURCE_PRECEDENCE=PASS")
print("AP123_ARCHIVED_INACTIVE_CHANGED_AND_MULTIMATCH_REJECT=PASS")
print("AP123_PRIVATE_RAW_ID_ONLY_INSIDE_SQL_TEST=YES")
print("AP123_LIVE_D1_ACCESS=NONE; BUSINESS_MUTATIONS=0")
