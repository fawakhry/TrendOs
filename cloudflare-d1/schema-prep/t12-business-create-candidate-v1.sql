-- TrendOS T12 isolated business CREATE candidate ONLY.
-- NEVER run against production. No production migration/route/binding.
-- Candidate tables are t12_biz_* and require an explicit isolated control fixture.
PRAGMA foreign_keys = ON;

CREATE TABLE t12_biz_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  fixture_marker TEXT NOT NULL CHECK(fixture_marker='T12_BUSINESS_CANDIDATE_ONLY'),
  google_writer_fenced INTEGER NOT NULL CHECK(google_writer_fenced=1),
  r5_mirror_writer_fenced INTEGER NOT NULL CHECK(r5_mirror_writer_fenced=1),
  next_order_number INTEGER NOT NULL CHECK(next_order_number>=1001),
  policy_epoch TEXT NOT NULL
);

CREATE TABLE t12_biz_request_ledger (
  request_key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  policy_epoch TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t12_biz_orders (
  order_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE REFERENCES t12_biz_request_ledger(request_key),
  customer_mode TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  external_customer_id TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='طلب جديد'),
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t12_biz_lines (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES t12_biz_orders(order_id),
  request_key TEXT NOT NULL REFERENCES t12_biz_request_ledger(request_key),
  ordinal INTEGER NOT NULL CHECK(ordinal>=1 AND ordinal<=99),
  department TEXT NOT NULL,
  assigned_to TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty>0),
  priority TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='طلب جديد'),
  heat_press INTEGER NOT NULL CHECK(heat_press IN (0,1)),
  fly_print INTEGER NOT NULL CHECK(fly_print IN (0,1)),
  UNIQUE(request_key, ordinal)
);

CREATE TABLE t12_biz_events (
  request_key TEXT NOT NULL REFERENCES t12_biz_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_biz_orders(order_id),
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY(request_key,event_key)
);

CREATE TABLE t12_biz_outbox (
  request_key TEXT NOT NULL REFERENCES t12_biz_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_biz_orders(order_id),
  line_id TEXT NOT NULL REFERENCES t12_biz_lines(line_id),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='pending'),
  payload_json TEXT NOT NULL,
  PRIMARY KEY(request_key,event_key)
);

CREATE INDEX idx_t12_biz_lines_order ON t12_biz_lines(order_id, ordinal);
CREATE INDEX idx_t12_biz_outbox_status ON t12_biz_outbox(status, order_id);
