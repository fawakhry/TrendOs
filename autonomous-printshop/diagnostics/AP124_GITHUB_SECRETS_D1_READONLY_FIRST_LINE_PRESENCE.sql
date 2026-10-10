-- AP-124: SELECT-only one-snapshot D1 access and first-line review existence.
-- Read-only diagnostic: do not output IDs, raw dates, source references or PII.
-- Cairo offset +03 only for the 2026-10-10 execution window; review future DST.
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
  SELECT trim(dept) AS department,
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
)
SELECT 1 AS connectionOk,
  CASE WHEN EXISTS(
    SELECT 1 FROM normalized n CROSS JOIN params p
    WHERE n.flyText IN ('0','false','no','لا')
      AND n.dueDay IS NOT NULL
      AND date(julianday(n.dueDay))=n.dueDay
      AND n.dueDay>p.cairoDay
  ) THEN 1 ELSE 0 END AS futureReviewLineExists;
