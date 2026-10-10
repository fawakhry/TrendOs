#!/usr/bin/env python3
"""AP-124: exact read-only Cloudflare D1 access probe SQL on synthetic schema."""
from pathlib import Path
import runpy,re,sqlite3
path=Path("autonomous-printshop/diagnostics/AP124_GITHUB_SECRETS_D1_READONLY_FIRST_LINE_PRESENCE.sql")
sql=path.read_text(encoding="utf-8")
body="\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))
assert body.lstrip().startswith("WITH\n")
assert sqlite3.complete_statement(body)
assert body.count(";")==1
assert not re.search(r"\b(?:INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|PRAGMA|ATTACH|DETACH|VACUUM)\b",body,re.I)
assert "SELECT 1 AS connectionOk" in body
assert "futureReviewLineExists" in body
assert "nativeMatches" in body and "legacyMatches" in body
assert "ORDER BY originRank DESC" in body
assert "JOIN employee_core_orders_v1" in body and "JOIN t12_prod_orders" in body
assert "a.line_id IS NULL" in body
assert "date('now','+3 hours')" in body
assert "date(julianday(n.dueDay))=n.dueDay" in body
ns=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
db=ns["c"]
def probe():
    rows=[dict(x) for x in db.execute(body)]
    assert len(rows)==1
    assert set(rows[0])=={"connectionOk","futureReviewLineExists"}
    assert rows[0]["connectionOk"]==1
    return rows[0]["futureReviewLineExists"]
assert probe()==1
# Remove both future candidates in the *synthetic test database only*.
db.execute("UPDATE t12_prod_lines SET status='تم التسليم' WHERE line_id='SL2'")
db.execute("UPDATE employee_core_lines_v1 SET status='تم التسليم' WHERE line_id='SL5'")
assert probe()==0
# A duplicated native runtime (including the current native line) must
# never produce a qualifying source for that line.
db.execute("UPDATE t12_prod_lines SET status='طلب جديد' WHERE line_id='SL2'")
db.executemany("INSERT INTO t12_prod_line_runtime VALUES (?,?)",[
 ("SL2","طلب جديد"),("SL2","طلب جديد")
])
assert probe()==0
# A single explicit matching runtime is reviewable again.
db.execute("DELETE FROM t12_prod_line_runtime WHERE line_id='SL2'")
db.execute("INSERT INTO t12_prod_line_runtime VALUES ('SL2','طلب جديد')")
assert probe()==1
print("AP124_READ_ONLY_SOURCE_SQLITE_SYNTHETIC=PASS")
print("AP124_NO_ID_OR_PII_IN_RESULT=PASS")
print("AP124_DUPLICATE_NATIVE_RUNTIME_NOT_QUALIFIED=PASS")
print("AP124_LIVE_D1=NOT_ACCESSED_IN_TEST; BUSINESS_WRITES=0")
