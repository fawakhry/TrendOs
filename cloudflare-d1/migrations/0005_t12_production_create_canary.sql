PRAGMA foreign_keys = ON;

-- T12 owner-approved fresh-start Production CREATE canary schema.
-- Applying this migration does NOT enable writes. Control starts with budget=0.
CREATE TABLE IF NOT EXISTS t12_prod_create_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='T12_PROD_CREATE_CANARY_V1'),
  next_order_number INTEGER NOT NULL CHECK(next_order_number>=1001),
  canary_remaining INTEGER NOT NULL CHECK(canary_remaining IN (0,1)),
  policy_epoch TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO t12_prod_create_control
(singleton,marker,next_order_number,canary_remaining,policy_epoch)
VALUES (1,'T12_PROD_CREATE_CANARY_V1',4322,0,'owner_fresh_start_20260926');

CREATE TABLE IF NOT EXISTS t12_prod_request_ledger (
  request_key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  policy_epoch TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS t12_prod_orders (
  order_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE REFERENCES t12_prod_request_ledger(request_key),
  customer_mode TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  external_customer_id TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='طلب جديد'),
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS t12_prod_lines (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id),
  request_key TEXT NOT NULL REFERENCES t12_prod_request_ledger(request_key),
  ordinal INTEGER NOT NULL CHECK(ordinal>=1 AND ordinal<=99),
  department TEXT NOT NULL,
  assigned_to TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty>0),
  priority TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='طلب جديد'),
  heat_press INTEGER NOT NULL CHECK(heat_press IN (0,1)),
  fly_print INTEGER NOT NULL CHECK(fly_print IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_key,ordinal)
);
CREATE TABLE IF NOT EXISTS t12_prod_events (
  request_key TEXT NOT NULL REFERENCES t12_prod_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id),
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(request_key,event_key)
);
CREATE TABLE IF NOT EXISTS t12_prod_outbox (
  request_key TEXT NOT NULL REFERENCES t12_prod_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id),
  line_id TEXT NOT NULL REFERENCES t12_prod_lines(line_id),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','done','failed')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(request_key,event_key)
);
CREATE INDEX IF NOT EXISTS idx_t12_prod_lines_order ON t12_prod_lines(order_id,ordinal);
CREATE INDEX IF NOT EXISTS idx_t12_prod_orders_status ON t12_prod_orders(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_t12_prod_outbox_status ON t12_prod_outbox(status,order_id);
