-- READ ONLY: owner must verify Cloudflare D1 resource is exactly
-- trendos-t12-synthetic-test / 54a3c05e-cde9-4979-814f-d40f941edcd5.
-- This detects ONLY table-name collisions; it does not authorize DDL, POST, or TEST writes.
-- No customer data, order rows, secrets or other table contents are queried.
WITH actual AS (
  SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
),
legacy AS (
  SELECT name FROM actual WHERE name IN (
    't12_synth_control', 't12_synth_request_ledger', 't12_synth_orders',
    't12_synth_lines', 't12_synth_events', 't12_synth_outbox'
  )
)
SELECT
  CASE WHEN (SELECT COUNT(*) FROM actual) = 6
        AND (SELECT COUNT(*) FROM legacy) = 6
    THEN 'SIX_LEGACY_TABLE_NAMES_MATCH__READ_ONLY__NO_DDL_AUTHORIZATION'
    ELSE 'STOP__UNEXPECTED_OR_MISSING_TABLES__NO_DDL_AUTHORIZATION'
  END AS schema_name_preflight,
  (SELECT COUNT(*) FROM actual) AS actual_table_count,
  (SELECT GROUP_CONCAT(name, ', ') FROM (
    SELECT name FROM actual ORDER BY name
  )) AS actual_table_names;
