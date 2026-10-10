#!/usr/bin/env python3
"""AP-126: source schema presence is NOT real same-line evidence."""
import sqlite3,re
from pathlib import Path
sql=Path("autonomous-printshop/diagnostics/AP126_LIVE_FIRST_LINE_SOURCE_SCHEMAS_READONLY.sql").read_text()
code="\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))
flags=["cloudFiles","designArtifacts","designApprovals","designPreflights",
"designBindings","materialDeptLines","materialCatalog","materialControl",
"machineMappings","machineRegistry","machineObservations","machineIdentity"]
assert code.lstrip().startswith("SELECT")
assert sqlite3.complete_statement(code) and code.count(";")==1
assert not re.search(r"\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|PRAGMA|ATTACH|DETACH|VACUUM)\b",code,re.I)
db=sqlite3.connect(":memory:")
db.row_factory=sqlite3.Row
def read():
  rows=[dict(x) for x in db.execute(code)]
  assert len(rows)==1 and set(rows[0])==set(flags)
  assert all(v in (0,1) for v in rows[0].values())
  return rows[0]
assert all(v==0 for v in read().values())
db.execute("CREATE TABLE employee_order_conversation_files_v1 (id TEXT)")
db.execute("CREATE TABLE employee_accounting_materials_v1 (id TEXT)")
db.execute("CREATE TABLE autonomous_machines (id TEXT)")
r=read()
assert r["cloudFiles"]==1 and r["materialCatalog"]==1 and r["machineRegistry"]==1
assert sum(r.values())==3
print("AP126_SCHEMA_ONLY_SELECT_ALLOWLIST=PASS")
print("AP126_NO_CUSTOMER_ORDER_MACHINE_SERIAL_OR_STOCK_ROWS=PASS")
print("AP126_LIVE_D1=NOT_ACCESSED_IN_TEST; REAL_SOURCE_PROOF=NOT_ESTABLISHED")
