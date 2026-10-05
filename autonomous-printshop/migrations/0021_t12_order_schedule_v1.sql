-- Autonomous Printshop / T12 Native Order Schedule V1
-- Additive operational metadata for deterministic scheduling.
-- Historical backfill is safe for the qualified native-order window:
-- 2026-09-27..2026-10-04, with zero orders at UTC hour >= 21.
-- Cairo was UTC+3 in this observed window.
--
-- Policy parity with legacy TrendOS:
-- Fly Print => same local business date.
-- Normal => registration local business date + 2 calendar days.

CREATE TABLE IF NOT EXISTS t12_prod_order_schedule (
  order_id TEXT PRIMARY KEY,
  expected_delivery_date TEXT NOT NULL,
  policy_code TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_created_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_prod_order_schedule_due
  ON t12_prod_order_schedule(expected_delivery_date, order_id);

INSERT OR IGNORE INTO t12_prod_order_schedule (
  order_id,
  expected_delivery_date,
  policy_code,
  source_kind,
  source_created_at
)
SELECT
  o.order_id,
  CASE
    WHEN EXISTS (
      SELECT 1
        FROM t12_prod_lines l
       WHERE l.order_id = o.order_id
         AND l.fly_print = 1
    )
    THEN date(datetime(o.created_at, '+3 hours'))
    ELSE date(datetime(o.created_at, '+3 hours'), '+2 days')
  END,
  'LEGACY_D0_FLY_D2_STANDARD_V1',
  'ENTRY_NATIVE_BACKFILL_CAIRO_UTC3_SAFE_WINDOW',
  o.created_at
FROM t12_prod_orders o;
