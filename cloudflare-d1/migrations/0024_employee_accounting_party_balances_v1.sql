PRAGMA foreign_keys = ON;

-- EasyStore A2.2 authoritative per-party balance guard.
-- Clean A0 baseline means no historical balance backfill is required.
CREATE TABLE IF NOT EXISTS employee_accounting_party_balances_v1 (
  party_type TEXT NOT NULL CHECK(party_type IN ('customer','supplier')),
  party_id TEXT NOT NULL,
  party_name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0 CHECK(balance>=-0.000001),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  last_request_key TEXT NOT NULL DEFAULT '',
  updated_at_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(party_type,party_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_party_balances_name
ON employee_accounting_party_balances_v1(party_type,party_name);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_party_balances_request
ON employee_accounting_party_balances_v1(last_request_key);
