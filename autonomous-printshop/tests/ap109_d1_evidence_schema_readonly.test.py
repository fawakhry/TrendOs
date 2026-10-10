#!/usr/bin/env python3
"""AP-109: source-verified schema presence only, in-memory SQLite.

No production D1 connection, credentials, customer data, financial amounts
or writes. Even complete schema never means READY.
"""
import re
import sqlite3
from pathlib import Path

file=Path("autonomous-printshop/diagnostics/AP109_D1_EVIDENCE_SOURCE_SCHEMA_READONLY.sql")
sql=file.read_text(encoding="utf-8")
assert sql.startswith("-- AP-109 / OWNER-CONSOLE READ ONLY")
clean="\n".join(x for x in sql.splitlines() if not x.lstrip().startswith("--"))
assert clean.count(";")==1 and clean.rstrip().endswith(";")
for forbidden in ("INSERT","DELETE","UPDATE","REPLACE","DROP","ALTER","CREATE","PRAGMA","ATTACH","DETACH","VACUUM"):
    assert not re.search(r"\b"+forbidden+r"\b",clean,re.I),forbidden
assert "FROM expected e" in clean and "LEFT JOIN sqlite_master m" in clean
assert "SUM(present)" in clean and "SCHEMA_MISSING_BLOCKED_SAFE" in clean

expected={
  "DESIGN":[
    "autonomous_design_artifacts","autonomous_design_asset_binding_events",
    "autonomous_design_approval_events","autonomous_design_preflight_runs",
    "autonomous_design_approval_receipts"
  ],
  "MATERIAL":[
    "employee_accounting_control_v1","employee_accounting_dept_lines_v1",
    "employee_accounting_materials_v1"
  ],
  "MACHINE":[
    "autonomous_machines","autonomous_machine_identity_events",
    "autonomous_machine_observations","autonomous_line_machine_mapping_events"
  ],
  "READINESS":["autonomous_readiness_evidence"]
}
source={
  "autonomous_design_artifacts":"autonomous-printshop/migrations/0024_design_production_evidence_v1.sql",
  "autonomous_design_asset_binding_events":"autonomous-printshop/migrations/0025_design_asset_binding_v1.sql",
  "autonomous_design_approval_events":"autonomous-printshop/migrations/0024_design_production_evidence_v1.sql",
  "autonomous_design_preflight_runs":"autonomous-printshop/migrations/0024_design_production_evidence_v1.sql",
  "autonomous_design_approval_receipts":"autonomous-printshop/migrations/0029_design_approval_receipt_v1.sql",
  "autonomous_machines":"autonomous-printshop/migrations/0027_machine_readiness_v1.sql",
  "autonomous_machine_identity_events":"autonomous-printshop/migrations/0028_machine_identity_evidence_v1.sql",
  "autonomous_machine_observations":"autonomous-printshop/migrations/0027_machine_readiness_v1.sql",
  "autonomous_line_machine_mapping_events":"autonomous-printshop/migrations/0027_machine_readiness_v1.sql",
  "autonomous_readiness_evidence":"autonomous-printshop/migrations/0023_readiness_evidence_v1.sql"
}
material_source=Path("autonomous-printshop/core/accounting-material-evidence-connector-v1.mjs").read_text(encoding="utf-8")
for kind,tables in expected.items():
    for table in tables:
        assert f"('{kind}','{table}')" in sql,table
        if table in source:
            code=Path(source[table]).read_text(encoding="utf-8")
            assert re.search(r"CREATE TABLE IF NOT EXISTS\s+"+re.escape(table)+r"\b",code,re.I),table
        else:
            assert kind=="MATERIAL" and table in material_source,table
assert sum(map(len,expected.values()))==13
db=sqlite3.connect(":memory:")
db.row_factory=sqlite3.Row
def run():
    return {row["kind"]:dict(row) for row in db.execute(sql)}
initial=run()
for kind,tables in expected.items():
    assert initial[kind]["requiredTables"]==len(tables)
    assert initial[kind]["existingTables"]==0
    assert initial[kind]["missingTables"]==len(tables)
    assert initial[kind]["schemaStatus"]=="SCHEMA_MISSING_BLOCKED_SAFE"
# Only synthetic schema is created in this local test, not in actual D1.
chosen=["autonomous_design_artifacts","autonomous_design_preflight_runs",
        "autonomous_machines","employee_accounting_dept_lines_v1",
        "autonomous_readiness_evidence"]
for table in chosen:db.execute(f"CREATE TABLE {table}(synthetic_id INTEGER)")
partial=run()
assert partial["DESIGN"]["existingTables"]==2
assert partial["MATERIAL"]["existingTables"]==1
assert partial["MACHINE"]["existingTables"]==1
assert partial["READINESS"]["existingTables"]==1
assert partial["READINESS"]["schemaStatus"]=="SCHEMA_PRESENT_EVIDENCE_UNVERIFIED"
for table in [x for xs in expected.values() for x in xs if x not in chosen]:
    db.execute(f"CREATE TABLE {table}(synthetic_id INTEGER)")
complete=run()
assert all(x["missingTables"]==0 for x in complete.values())
assert all(x["schemaStatus"]=="SCHEMA_PRESENT_EVIDENCE_UNVERIFIED" for x in complete.values())
assert all(set(x)=={"kind","requiredTables","existingTables","missingTables","schemaStatus"} for x in complete.values())
print("AP109_D1_SCHEMA_CATALOG_AGGREGATE=PASS")
print("AP109_DESIGN_MATERIAL_MACHINE_READINESS_SOURCE_MAP=PASS")
print("AP109_PARTIAL_AND_FULL_SCHEMA_NOT_READY=PASS")
print("AP109_REAL_D1_ACCESS=NONE; PRODUCTION_WRITES=0")
