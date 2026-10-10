-- AP-126: public-safe schema coverage, D1 read-only. This is schema, NOT line proof.
-- Do not return data rows, identifiers, customer content or credentials.
SELECT
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='employee_order_conversation_files_v1') THEN 1 ELSE 0 END AS cloudFiles,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_design_artifacts') THEN 1 ELSE 0 END AS designArtifacts,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_design_approval_events') THEN 1 ELSE 0 END AS designApprovals,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_design_preflight_runs') THEN 1 ELSE 0 END AS designPreflights,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_design_asset_binding_events') THEN 1 ELSE 0 END AS designBindings,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='employee_accounting_dept_lines_v1') THEN 1 ELSE 0 END AS materialDeptLines,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='employee_accounting_materials_v1') THEN 1 ELSE 0 END AS materialCatalog,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='employee_accounting_control_v1') THEN 1 ELSE 0 END AS materialControl,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_line_machine_mapping_events') THEN 1 ELSE 0 END AS machineMappings,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_machines') THEN 1 ELSE 0 END AS machineRegistry,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_machine_observations') THEN 1 ELSE 0 END AS machineObservations,
  CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='autonomous_machine_identity_events') THEN 1 ELSE 0 END AS machineIdentity;
