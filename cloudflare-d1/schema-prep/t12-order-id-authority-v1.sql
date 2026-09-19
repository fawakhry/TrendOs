-- T12 business Order-ID authority candidate, ISOLATED TEST ONLY.
-- Not a migration. Never apply to Production. No existing table is touched.
CREATE TABLE IF NOT EXISTS t12_order_id_sequence_candidate (
  authority_key TEXT PRIMARY KEY CHECK (authority_key = 'order'),
  next_value INTEGER NOT NULL CHECK (next_value >= 1001),
  seeded_from_max_order_id INTEGER NOT NULL CHECK (seeded_from_max_order_id >= 1000),
  source_snapshot TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'isolated-test' CHECK (mode = 'isolated-test'),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
