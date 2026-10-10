-- AP-099 / SOURCE_ONLY / READ ONLY.
-- Run ONLY inside authenticated Cloudflare D1 Console on the owner-approved
-- trendos-main database. Results are NON-PII aggregate numbers only.
-- Do not publish as a Worker endpoint or include raw IDs/logs.
-- Query derived from production-shadow/worker.mjs currentRows and AP-094/095
-- latest-evidence logic. Counts are preliminary signals, NOT a dispatch permit.
WITH
imported AS (
  SELECT l.line_id AS lineId,
         l.order_id AS orderId,
         COALESCE(lr.status,l.status,'') AS lineStatus,
         COALESCE(l.expected_delivery_at,'') AS dueAt,
         COALESCE(l.fly_print,0) AS flyPrint,
         0 AS originRank
    FROM employee_core_lines_v1 l
    JOIN employee_core_orders_v1 o ON o.order_id=l.order_id
    LEFT JOIN t12_legacy_line_runtime lr
      ON lr.line_id=l.line_id AND lr.order_id=l.order_id
    LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
   WHERE l.active=1 AND o.active=1 AND a.line_id IS NULL
),
native AS (
  SELECT l.line_id AS lineId,
         l.order_id AS orderId,
         COALESCE(r.status,l.status,'') AS lineStatus,
         COALESCE(s.expected_delivery_date,'') AS dueAt,
         COALESCE(l.fly_print,0) AS flyPrint,
         1 AS originRank
    FROM t12_prod_lines l
    JOIN t12_prod_orders o ON o.order_id=l.order_id
    LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
    LEFT JOIN t12_prod_order_schedule s ON s.order_id=o.order_id
    LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
   WHERE a.line_id IS NULL
),
combined AS (
  SELECT * FROM imported UNION ALL SELECT * FROM native
),
rankedLines AS (
  SELECT *,ROW_NUMBER() OVER (
    PARTITION BY lineId
    ORDER BY originRank DESC, dueAt DESC, lineStatus DESC, orderId DESC
  ) AS lineRank
  FROM combined
),
currentLines AS (
  SELECT lineId,orderId,trim(lineStatus) AS lineStatus,dueAt,flyPrint
  FROM rankedLines WHERE lineRank=1
),
rankedEvidence AS (
  SELECT line_id AS lineId,
         evidence_kind AS kind,
         evidence_state AS state,
         observed_at_ms AS observedMs,
         expires_at_ms AS expiresMs,
         ROW_NUMBER() OVER(
           PARTITION BY line_id,evidence_kind
           ORDER BY observed_at_ms DESC,evidence_id DESC
         ) AS evidenceRank
  FROM autonomous_readiness_evidence
),
safeEvidence AS (
  SELECT lineId,kind,
         CASE WHEN state='READY'
               AND observedMs>0
               AND observedMs<=CAST(unixepoch('now') AS INTEGER)*1000
               AND (expiresMs IS NULL OR (
                 expiresMs>observedMs
                 AND expiresMs>CAST(unixepoch('now') AS INTEGER)*1000
               ))
              THEN 1 ELSE 0 END AS isReady
  FROM rankedEvidence WHERE evidenceRank=1
),
perLine AS (
  SELECT l.lineId,l.lineStatus,l.dueAt,l.flyPrint,
         COALESCE(MAX(CASE WHEN e.kind='DESIGN' THEN e.isReady END),0) AS designReady,
         COALESCE(MAX(CASE WHEN e.kind='MATERIAL' THEN e.isReady END),0) AS materialReady,
         COALESCE(MAX(CASE WHEN e.kind='MACHINE' THEN e.isReady END),0) AS machineReady
  FROM currentLines l
  LEFT JOIN safeEvidence e ON e.lineId=l.lineId
  GROUP BY l.lineId,l.lineStatus,l.dueAt,l.flyPrint
),
flags AS (
  SELECT *,
    CASE WHEN lineStatus='طلب جديد'
           AND trim(COALESCE(dueAt,''))<>''
           AND CAST(flyPrint AS INTEGER)<>1
         THEN 1 ELSE 0 END AS baselinePossible
  FROM perLine
)
SELECT
  COUNT(*) AS totalCurrentLineKeys,
  COALESCE(SUM(CASE WHEN lineStatus IN (
    'تم التسليم','جاهز للاستلام','ملغي','ملغى',
    'مكرر','مدمج','مغلق','ملغي/مغلق'
  ) THEN 1 ELSE 0 END),0) AS closedStatusLines,
  COALESCE(SUM(CASE WHEN lineStatus='طلب جديد' THEN 1 ELSE 0 END),0) AS newStatusLines,
  COALESCE(SUM(CASE WHEN lineStatus NOT IN (
    'طلب جديد','تم التسليم','جاهز للاستلام','ملغي',
    'ملغى','مكرر','مدمج','مغلق','ملغي/مغلق'
  ) THEN 1 ELSE 0 END),0) AS otherStatusLines,
  COALESCE(SUM(baselinePossible),0) AS potentialBaselineLines,
  COALESCE(SUM(CASE WHEN baselinePossible=1 AND designReady=0
    THEN 1 ELSE 0 END),0) AS potentialMissingDesign,
  COALESCE(SUM(CASE WHEN baselinePossible=1 AND materialReady=0
    THEN 1 ELSE 0 END),0) AS potentialMissingMaterial,
  COALESCE(SUM(CASE WHEN baselinePossible=1 AND machineReady=0
    THEN 1 ELSE 0 END),0) AS potentialMissingMachine,
  COALESCE(SUM(CASE WHEN baselinePossible=1
    AND designReady=1 AND materialReady=1 AND machineReady=1
    THEN 1 ELSE 0 END),0) AS allThreeSignalsReady,
  (SELECT COUNT(*) FROM combined) - (SELECT COUNT(*) FROM currentLines)
    AS duplicateLineSourceRows
FROM flags;
