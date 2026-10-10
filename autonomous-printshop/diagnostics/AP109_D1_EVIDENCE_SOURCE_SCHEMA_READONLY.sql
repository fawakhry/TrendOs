-- AP-109 / OWNER-CONSOLE READ ONLY / SCHEMA INSPECTION.
-- Run only inside authenticated owner-approved trendos-main D1 Console.
-- Reads sqlite_master table NAMES only, never any row, ID, price, stock or PII.
-- Presence of tables is NOT proof of applied migrations, adequate source
-- contents, qualified READY, source authority or working operator deployment.
WITH expected(kind,tableName) AS (
  VALUES
    ('DESIGN','autonomous_design_artifacts'),
    ('DESIGN','autonomous_design_asset_binding_events'),
    ('DESIGN','autonomous_design_approval_events'),
    ('DESIGN','autonomous_design_preflight_runs'),
    ('DESIGN','autonomous_design_approval_receipts'),
    ('MATERIAL','employee_accounting_control_v1'),
    ('MATERIAL','employee_accounting_dept_lines_v1'),
    ('MATERIAL','employee_accounting_materials_v1'),
    ('MACHINE','autonomous_machines'),
    ('MACHINE','autonomous_machine_identity_events'),
    ('MACHINE','autonomous_machine_observations'),
    ('MACHINE','autonomous_line_machine_mapping_events'),
    ('READINESS','autonomous_readiness_evidence')
),
checked AS (
  SELECT e.kind,e.tableName,
         CASE WHEN m.name IS NULL THEN 0 ELSE 1 END AS present
    FROM expected e
    LEFT JOIN sqlite_master m ON m.type='table' AND m.name=e.tableName
)
SELECT kind,
       COUNT(*) AS requiredTables,
       COALESCE(SUM(present),0) AS existingTables,
       COUNT(*)-COALESCE(SUM(present),0) AS missingTables,
       CASE WHEN COALESCE(SUM(present),0)=COUNT(*)
         THEN 'SCHEMA_PRESENT_EVIDENCE_UNVERIFIED'
         ELSE 'SCHEMA_MISSING_BLOCKED_SAFE'
       END AS schemaStatus
  FROM checked
 GROUP BY kind
 ORDER BY kind;
