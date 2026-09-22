-- TrendOS T12: owner-only, production D1 READ-ONLY aggregate evidence.
-- PREPARED, NOT EXECUTED. NO D1/Worker/Google mutation.
-- Owner must independently confirm in Cloudflare dashboard that the SELECT
-- is attached to the actual business production account and database,
-- not the separate trendos-t12-synthetic-test D1 or a local/staging DB.
-- Run QUERY 1, then each later SELECT SEPARATELY in that verified D1 Console.
-- If QUERY 1 lacks any required table, STOP; do not run later statements.
-- Never share raw order IDs, customer rows, headers_json, values_json,
-- display_json, tokens, account IDs, binding UUIDs or customer fields.
-- The four tab names are structural selectors, not evidence of live binding.
-- Online reads are non-atomic and NEVER a final post-writer-fence seed.

-- QUERY 1: required table names only.
SELECT name AS recognized_table
FROM sqlite_master
WHERE type='table'
  AND name IN ('orders','sheet_catalog','sheet_rows')
ORDER BY name;

-- QUERY 2: selected mirror catalog, dates, and aggregate row counts only.
SELECT c.sheet_name AS tab_name,
       c.status AS mirror_status,
       c.source_last_row AS source_last_row_including_header,
       c.source_last_col AS source_column_count,
       c.row_count AS reported_mirror_rows_including_header,
       (SELECT COUNT(*) FROM sheet_rows AS r
         WHERE r.sheet_name=c.sheet_name) AS observed_mirror_rows_including_header,
       c.synced_at AS reported_last_sync_at
FROM sheet_catalog AS c
WHERE c.sheet_name IN (
  'الأوردرات','بنود الأوردرات','أرشيف الأوردرات','أرشيف بنود الأوردرات'
)
ORDER BY c.sheet_name;

-- QUERY 3: normalized D1 orders are NOT proof of raw mirror/source parity.
WITH classified AS (
  SELECT order_id,
         CASE WHEN order_id GLOB '[1-9]*'
                    AND order_id NOT GLOB '*[^0-9]*'
                    AND LENGTH(order_id)<=16
                    AND CAST(order_id AS INTEGER) BETWEEN 1001 AND 9007199254740990
              THEN 1 ELSE 0 END AS valid_numeric
    FROM orders
)
SELECT COUNT(*) AS normalized_orders_count,
       COALESCE(SUM(valid_numeric),0) AS numeric_id_rows,
       MAX(CASE WHEN valid_numeric=1 THEN CAST(order_id AS INTEGER) END)
         AS highest_normalized_numeric_order_id,
       COALESCE(SUM(CASE WHEN valid_numeric=0 THEN 1 ELSE 0 END),0)
         AS noncanonical_or_legacy_order_id_rows
FROM classified;

-- QUERY 4: extract ONLY the first displayed (order-number) column internally;
-- output aggregates, NEVER rows or raw displayed order IDs.
WITH mirror_ids AS (
  SELECT sheet_name, row_number, synced_at,
         CASE WHEN json_valid(display_json)=1 THEN
                CASE WHEN json_type(display_json)='array'
                     THEN CAST(json_extract(display_json,'$[0]') AS TEXT)
                     ELSE NULL END
              ELSE NULL END AS displayed_id,
         json_valid(display_json) AS valid_json
  FROM sheet_rows
  WHERE sheet_name IN (
    'الأوردرات','بنود الأوردرات','أرشيف الأوردرات','أرشيف بنود الأوردرات'
  ) AND row_number>1
), classified AS (
  SELECT sheet_name,synced_at,displayed_id,valid_json,
         CASE WHEN displayed_id GLOB '[1-9]*'
                   AND displayed_id NOT GLOB '*[^0-9]*'
                   AND LENGTH(displayed_id)<=16
                   AND CAST(displayed_id AS INTEGER) BETWEEN 1001 AND 9007199254740990
              THEN 1 ELSE 0 END AS valid_numeric
  FROM mirror_ids
)
SELECT sheet_name AS tab_name,
       COUNT(*) AS mirrored_nonheader_rows,
       COALESCE(SUM(valid_numeric),0) AS mirrored_numeric_order_id_rows,
       MAX(CASE WHEN valid_numeric=1 THEN CAST(displayed_id AS INTEGER) END)
         AS highest_mirrored_numeric_order_id,
       COALESCE(SUM(CASE WHEN valid_numeric=0 THEN 1 ELSE 0 END),0)
         AS missing_legacy_or_noncanonical_id_rows,
       COALESCE(SUM(CASE WHEN valid_json<>1 THEN 1 ELSE 0 END),0)
         AS invalid_json_rows,
       MAX(synced_at) AS latest_row_sync_at
FROM classified
GROUP BY sheet_name
ORDER BY sheet_name;
