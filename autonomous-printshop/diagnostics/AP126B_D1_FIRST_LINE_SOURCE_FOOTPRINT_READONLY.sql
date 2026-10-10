-- AP-126B: source-record footprint for one anonymous sampled first line.
-- Real data access READ ONLY, never log internal IDs, dates, file links,
-- materials, machine serials, customer names, phone, SHA or source refs.
-- Historical source records do not prove current READY, approval or stock.
WITH
params AS (SELECT date('now','+3 hours') AS cairoDay),
legacy AS (
  SELECT l.line_id AS lineId,l.order_id AS orderId,
    COALESCE(lr.status,l.status,'') AS lineStatus,
    COALESCE(l.department,'') AS dept,
    COALESCE(l.expected_delivery_at,'') AS dueAt,
    COALESCE(l.fly_print,0) AS flyFlag,
    0 AS originRank
  FROM employee_core_lines_v1 l
  JOIN employee_core_orders_v1 o ON o.order_id=l.order_id
  LEFT JOIN t12_legacy_line_runtime lr
    ON lr.line_id=l.line_id AND lr.order_id=l.order_id
  LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
  WHERE l.active=1 AND o.active=1 AND a.line_id IS NULL
),
native AS (
  SELECT l.line_id AS lineId,l.order_id AS orderId,
    COALESCE(r.status,l.status,'') AS lineStatus,
    COALESCE(l.department,'') AS dept,
    COALESCE(s.expected_delivery_date,'') AS dueAt,
    COALESCE(l.fly_print,0) AS flyFlag,
    1 AS originRank
  FROM t12_prod_lines l
  JOIN t12_prod_orders o ON o.order_id=l.order_id
  LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
  LEFT JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
  LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
  WHERE a.line_id IS NULL
),
combined AS (
  SELECT * FROM legacy UNION ALL SELECT * FROM native
),
ranked AS (
  SELECT *,
    SUM(CASE WHEN originRank=1 THEN 1 ELSE 0 END) OVER
      (PARTITION BY lineId) AS nativeMatches,
    SUM(CASE WHEN originRank=0 THEN 1 ELSE 0 END) OVER
      (PARTITION BY lineId) AS legacyMatches,
    ROW_NUMBER() OVER (
      PARTITION BY lineId
      ORDER BY originRank DESC,dueAt DESC,lineStatus DESC,orderId DESC
    ) AS rn
  FROM combined
),
normalized AS (
  SELECT lineId,orderId,trim(dept) AS department,
         lower(trim(CAST(flyFlag AS TEXT))) AS flyText,
    CASE
      WHEN trim(dueAt) GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        THEN trim(dueAt)
      WHEN trim(dueAt) GLOB '[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]'
        THEN printf('%04d-%02d-%02d',
          CAST(substr(trim(dueAt),7,4) AS INTEGER),
          CAST(substr(trim(dueAt),4,2) AS INTEGER),
          CAST(substr(trim(dueAt),1,2) AS INTEGER))
      ELSE NULL
    END AS dueDay
  FROM ranked
  WHERE rn=1 AND trim(lineStatus)='طلب جديد'
    AND trim(dept) IN ('طباعة','ليزر')
    AND (nativeMatches=1 OR (nativeMatches=0 AND legacyMatches=1))
),
first_review_sample AS (
  SELECT n.lineId,n.orderId,n.department,n.dueDay
  FROM normalized n CROSS JOIN params p
  WHERE n.flyText IN ('0','false','no','لا')
    AND n.dueDay IS NOT NULL
    AND date(julianday(n.dueDay))=n.dueDay
    AND n.dueDay>p.cairoDay
  ORDER BY n.dueDay ASC,n.department ASC,n.lineId ASC
  LIMIT 1
)
SELECT
  (SELECT COUNT(*) FROM first_review_sample) AS anonymousSampleCount,
  COALESCE((SELECT CASE department WHEN 'طباعة' THEN 'PRINT' WHEN 'ليزر' THEN 'LASER' ELSE 'UNKNOWN' END FROM first_review_sample),'NO_SAMPLE') AS sampleDepartmentClass,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM employee_order_conversation_files_v1 f WHERE f.line_id=s.lineId AND f.order_id=s.orderId) THEN 1 ELSE 0 END AS cloudLineFile,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM employee_order_conversation_files_v1 f WHERE f.line_id=s.lineId AND f.order_id=s.orderId AND trim(COALESCE(f.r2_key,''))<>'' AND length(trim(COALESCE(f.content_sha256,'')))=64 AND lower(trim(f.content_sha256)) NOT GLOB '*[^0-9a-f]*' AND (lower(f.mime_type) LIKE 'image/%' OR lower(f.mime_type) IN ('application/pdf','application/postscript'))) THEN 1 ELSE 0 END AS cloudDesignHashCandidate,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_design_artifacts a WHERE a.line_id=s.lineId) THEN 1 ELSE 0 END AS designArtifact,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_design_artifacts a JOIN autonomous_design_approval_events e ON e.artifact_id=a.artifact_id AND e.line_id=s.lineId WHERE a.line_id=s.lineId) THEN 1 ELSE 0 END AS designApproval,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_design_artifacts a JOIN autonomous_design_preflight_runs p ON p.artifact_id=a.artifact_id AND p.line_id=s.lineId WHERE a.line_id=s.lineId) THEN 1 ELSE 0 END AS designPreflight,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_design_artifacts a JOIN autonomous_design_asset_binding_events b ON b.artifact_id=a.artifact_id WHERE a.line_id=s.lineId) THEN 1 ELSE 0 END AS designAssetBinding,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM employee_accounting_dept_lines_v1 d WHERE d.line_id=s.lineId AND trim(COALESCE(d.material_name,''))<>'' AND d.material_consumption>0) THEN 1 ELSE 0 END AS materialLine,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM employee_accounting_dept_lines_v1 d JOIN employee_accounting_materials_v1 m ON m.department=d.department AND m.material_name=d.material_name AND m.active=1 WHERE d.line_id=s.lineId AND d.material_consumption>0) THEN 1 ELSE 0 END AS materialCatalogMatch,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_line_machine_mapping_events e WHERE e.line_id=s.lineId) THEN 1 ELSE 0 END AS machineMappingHistory,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_line_machine_mapping_events e JOIN autonomous_machines m ON m.machine_id=e.machine_id WHERE e.line_id=s.lineId) THEN 1 ELSE 0 END AS machineRegistryViaMapping,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_line_machine_mapping_events e JOIN autonomous_machine_identity_events i ON i.machine_id=e.machine_id WHERE e.line_id=s.lineId) THEN 1 ELSE 0 END AS machineIdentityHistory,
  CASE WHEN (SELECT COUNT(*) FROM first_review_sample)=1 AND EXISTS(SELECT 1 FROM autonomous_line_machine_mapping_events e JOIN autonomous_machine_observations o ON o.machine_id=e.machine_id WHERE e.line_id=s.lineId) THEN 1 ELSE 0 END AS machineObservationHistory
FROM first_review_sample s
UNION ALL
SELECT 0 AS anonymousSampleCount, 'NO_SAMPLE' AS sampleDepartmentClass,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
WHERE NOT EXISTS(SELECT 1 FROM first_review_sample);
