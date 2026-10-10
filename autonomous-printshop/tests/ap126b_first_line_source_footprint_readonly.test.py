#!/usr/bin/env python3
"""AP-126B source record footprint on synthetic D1 tables: NEVER authorizes READY."""
import sqlite3,re,runpy
from pathlib import Path
sql=Path("autonomous-printshop/diagnostics/AP126B_D1_FIRST_LINE_SOURCE_FOOTPRINT_READONLY.sql").read_text()
body="\n".join(s for s in sql.splitlines() if not s.lstrip().startswith("--"))
assert body.lstrip().startswith("WITH\n") and sqlite3.complete_statement(body)
assert body.count(";")==1
assert not re.search(r"\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|PRAGMA|ATTACH|DETACH|VACUUM)\b",body,re.I)
names=["cloudLineFile","cloudDesignHashCandidate","designArtifact","designApproval",
"designPreflight","designAssetBinding","materialLine","materialCatalogMatch",
"machineMappingHistory","machineRegistryViaMapping","machineIdentityHistory",
"machineObservationHistory"]
ns=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
db=ns["c"];db.row_factory=sqlite3.Row
for q in (
"CREATE TABLE employee_order_conversation_files_v1(line_id TEXT,order_id TEXT,r2_key TEXT,content_sha256 TEXT,mime_type TEXT)",
"CREATE TABLE autonomous_design_artifacts(artifact_id TEXT,line_id TEXT)",
"CREATE TABLE autonomous_design_approval_events(artifact_id TEXT,line_id TEXT)",
"CREATE TABLE autonomous_design_preflight_runs(artifact_id TEXT,line_id TEXT)",
"CREATE TABLE autonomous_design_asset_binding_events(artifact_id TEXT)",
"CREATE TABLE employee_accounting_dept_lines_v1(line_id TEXT,department TEXT,material_name TEXT,material_consumption REAL)",
"CREATE TABLE employee_accounting_materials_v1(department TEXT,material_name TEXT,active INTEGER)",
"CREATE TABLE autonomous_line_machine_mapping_events(line_id TEXT,machine_id TEXT)",
"CREATE TABLE autonomous_machines(machine_id TEXT)",
"CREATE TABLE autonomous_machine_identity_events(machine_id TEXT)",
"CREATE TABLE autonomous_machine_observations(machine_id TEXT)"
):db.execute(q)
def read():
  rows=[dict(x) for x in db.execute(body)]
  assert len(rows)==1,rows
  row=rows[0]
  assert set(row)==set(names)|{"anonymousSampleCount","sampleDepartmentClass"},row
  assert row["anonymousSampleCount"] in (0,1)
  assert row["sampleDepartmentClass"] in ("PRINT","LASER","NO_SAMPLE")
  assert all(row[n] in (0,1) for n in names)
  return row
a=read()
assert a["anonymousSampleCount"]==1 and a["sampleDepartmentClass"]=="PRINT"
assert sum(a[n] for n in names)==0
# Synthetic candidate SL2/NO2, never real data.
db.execute("INSERT INTO employee_order_conversation_files_v1 VALUES(?,?,?,?,?)",
  ("SL2","NO2","R2_FAKE","f"*64,"image/png"))
db.execute("INSERT INTO autonomous_design_artifacts VALUES('FAKE_ART','SL2')")
db.execute("INSERT INTO autonomous_design_approval_events VALUES('FAKE_ART','SL2')")
db.execute("INSERT INTO autonomous_design_preflight_runs VALUES('FAKE_ART','SL2')")
db.execute("INSERT INTO autonomous_design_asset_binding_events VALUES('FAKE_ART')")
db.execute("INSERT INTO employee_accounting_dept_lines_v1 VALUES('SL2','طباعة','ورق',2)")
db.execute("INSERT INTO employee_accounting_materials_v1 VALUES('طباعة','ورق',1)")
db.execute("INSERT INTO autonomous_line_machine_mapping_events VALUES('SL2','FAKE_MACHINE')")
db.execute("INSERT INTO autonomous_machines VALUES('FAKE_MACHINE')")
db.execute("INSERT INTO autonomous_machine_identity_events VALUES('FAKE_MACHINE')")
db.execute("INSERT INTO autonomous_machine_observations VALUES('FAKE_MACHINE')")
b=read()
assert all(b[n]==1 for n in names),b
# A source record for another line must not satisfy this sample.
db.execute("DELETE FROM employee_order_conversation_files_v1 WHERE line_id='SL2'")
db.execute("INSERT INTO employee_order_conversation_files_v1 VALUES(?,?,?,?,?)",
  ("SL5","SO5","R2_FAKE","a"*64,"image/png"))
c=read()
assert c["cloudLineFile"]==0 and c["cloudDesignHashCandidate"]==0
# Never expose synthetic or actual ID; as live snapshots evolve a new
# sampled line requires rerunning the source checks.
db.execute("UPDATE t12_prod_lines SET status='تم التسليم' WHERE line_id='SL2'")
d=read()
assert d["anonymousSampleCount"]==1 and d["cloudLineFile"]==1
db.execute("UPDATE employee_core_lines_v1 SET status='تم التسليم' WHERE line_id='SL5'")
e=read()
assert e["anonymousSampleCount"]==0 and e["sampleDepartmentClass"]=="NO_SAMPLE"
assert all(e[n]==0 for n in names),e
print("AP126B_ONE_LINE_SOURCE_RECORD_FOOTPRINT_SYNTHETIC=PASS")
print("AP126B_CLOUD_DESIGN_MATERIAL_MACHINE_SAME_LINE_LINKS=PASS")
print("AP126B_SNAPSHOT_CHANGE_AND_NO_SAMPLE=PASS")
print("AP126B_LIVE_D1=NOT_ACCESSED_IN_TEST; READINESS_READY=NOT_ESTABLISHED")
