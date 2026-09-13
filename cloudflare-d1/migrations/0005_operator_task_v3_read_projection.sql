-- TrendOS Cloud Migration V3 / T4
-- Repository-only candidate. Do NOT apply to Production without a separate migration decision.
-- Read projection only: no claim/complete authority and no task mutation ledger.

CREATE TABLE IF NOT EXISTS operator_task_v3_projection (
  line_id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL,
  source_row_number INTEGER NOT NULL DEFAULT 0,
  source_fingerprint TEXT NOT NULL DEFAULT '',
  lane TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  priority_rank INTEGER NOT NULL DEFAULT 9,
  expected_delivery TEXT NOT NULL DEFAULT '',
  expected_delivery_sort INTEGER NOT NULL DEFAULT 0,
  source_status TEXT NOT NULL DEFAULT '',
  eligibility TEXT NOT NULL DEFAULT 'BLOCKED',
  fly_print INTEGER NOT NULL DEFAULT 0 CHECK (fly_print IN (0,1)),
  press_candidate INTEGER NOT NULL DEFAULT 0 CHECK (press_candidate IN (0,1)),
  customer_name TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL DEFAULT '',
  quantity REAL,
  updated_at_ms INTEGER NOT NULL,
  projection_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_operator_task_v3_dispatch
  ON operator_task_v3_projection (
    lane,
    eligibility,
    priority_rank,
    expected_delivery_sort,
    updated_at_ms,
    source_row_number
  );

CREATE INDEX IF NOT EXISTS idx_operator_task_v3_fly_print
  ON operator_task_v3_projection (
    fly_print,
    eligibility,
    priority_rank,
    expected_delivery_sort
  );

CREATE INDEX IF NOT EXISTS idx_operator_task_v3_press
  ON operator_task_v3_projection (
    press_candidate,
    eligibility,
    priority_rank,
    expected_delivery_sort
  );

CREATE TABLE IF NOT EXISTS operator_task_v3_projection_meta (
  projection_key TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'unready',
  synced_at_ms INTEGER NOT NULL DEFAULT 0,
  source_last_row INTEGER NOT NULL DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  source_version TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  schema_version INTEGER NOT NULL DEFAULT 1
);
