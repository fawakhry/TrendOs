PRAGMA foreign_keys=ON;

-- T12 customer + department admission claims (2026-10-08 candidate).
-- Additive table only: creating it does NOT alter any existing order/status,
-- does not enable CREATE, and does not reroute traffic.
-- One key per strong, normalized customer identity and requested department.
-- Claims are refreshed atomically with new order persistence; old claims remain
-- for audit and can be replaced only after their effective native lines close.
CREATE TABLE IF NOT EXISTS t12_prod_customer_lane_claim (
  identity_key TEXT NOT NULL CHECK(length(identity_key)=64),
  department TEXT NOT NULL CHECK(department IN ('طباعة','ليزر')),
  order_id TEXT NOT NULL,
  request_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_key,department)
);
CREATE INDEX IF NOT EXISTS idx_t12_prod_customer_lane_claim_order
  ON t12_prod_customer_lane_claim(order_id);
