PRAGMA foreign_keys = ON;

-- T12 cloud-native duplicate-order guard.
-- Additive schema only. Applying this migration does not enable, disable, or
-- reroute CREATE traffic by itself.
CREATE TABLE IF NOT EXISTS t12_prod_duplicate_order_guard (
  fingerprint TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL DEFAULT '',
  canonical_business_json TEXT NOT NULL,
  claimed_at_ms INTEGER NOT NULL CHECK(claimed_at_ms > 0),
  expires_at_ms INTEGER NOT NULL CHECK(expires_at_ms > claimed_at_ms),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_prod_duplicate_order_guard_expiry
  ON t12_prod_duplicate_order_guard(expires_at_ms);
