PRAGMA foreign_keys = ON;

-- T12 Cloud-native customer master.
-- Additive only. Applying this migration does NOT enable customer writes.
CREATE TABLE IF NOT EXISTS t12_customer_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='T12_CUSTOMER_MASTER_V1'),
  mode TEXT NOT NULL CHECK(mode IN ('OFF','CANARY','GENERAL')),
  canary_remaining INTEGER NOT NULL CHECK(canary_remaining IN (0,1)),
  next_customer_number INTEGER NOT NULL CHECK(next_customer_number>=1),
  policy_epoch TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO t12_customer_control
(singleton,marker,mode,canary_remaining,next_customer_number,policy_epoch)
VALUES (1,'T12_CUSTOMER_MASTER_V1','OFF',0,1,'customer_native_20260929');

CREATE TABLE IF NOT EXISTS t12_customers (
  customer_id TEXT PRIMARY KEY,
  legacy_row_number INTEGER UNIQUE,
  customer_name TEXT NOT NULL,
  customer_name_key TEXT NOT NULL,
  manager TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  extra_phone TEXT NOT NULL DEFAULT '',
  customer_type TEXT NOT NULL DEFAULT 'خارجي',
  active TEXT NOT NULL DEFAULT 'نعم' CHECK(active IN ('نعم','لا')),
  debt_amount REAL NOT NULL DEFAULT 0 CHECK(debt_amount>=0),
  notes TEXT NOT NULL DEFAULT '',
  branch_code TEXT NOT NULL DEFAULT '',
  branch_name TEXT NOT NULL DEFAULT '',
  legacy_chat_code TEXT NOT NULL DEFAULT '',
  legacy_customer_code TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK(source IN ('legacy-mirror','cloud-native')),
  created_by TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_customers_name_key
ON t12_customers(customer_name_key);

CREATE INDEX IF NOT EXISTS idx_t12_customers_phone
ON t12_customers(phone);

CREATE INDEX IF NOT EXISTS idx_t12_customers_extra_phone
ON t12_customers(extra_phone);

CREATE INDEX IF NOT EXISTS idx_t12_customers_active
ON t12_customers(active, updated_at DESC);

CREATE TABLE IF NOT EXISTS t12_customer_request_ledger (
  request_key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  policy_epoch TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('CREATE','UPDATE')),
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES t12_customers(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_t12_customer_request_customer
ON t12_customer_request_ledger(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS t12_customer_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL REFERENCES t12_customers(customer_id),
  request_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('customer-create','customer-update','legacy-bootstrap')),
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_customer_events_customer
ON t12_customer_events(customer_id, created_at DESC);
