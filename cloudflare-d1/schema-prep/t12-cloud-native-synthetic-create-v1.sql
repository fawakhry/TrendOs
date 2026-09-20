-- T12 Cloud-native synthetic atomic-create qualification ONLY.
-- NEVER run this DDL against production. No migration, route or live binding.
-- All table names are t12_synth_* and all order/customer records are fabricated.
PRAGMA foreign_keys = ON;

CREATE TABLE t12_synth_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  fixture_marker TEXT NOT NULL CHECK(fixture_marker='T12_SYNTHETIC_ONLY'),
  google_writer_fenced INTEGER NOT NULL CHECK(google_writer_fenced=1),
  r5_mirror_writer_fenced INTEGER NOT NULL CHECK(r5_mirror_writer_fenced=1),
  next_order_number INTEGER NOT NULL CHECK(next_order_number>=1001)
);
CREATE TABLE t12_synth_request_ledger (
  request_key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status='COMMITTED'),
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE t12_synth_orders (
  order_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE
    REFERENCES t12_synth_request_ledger(request_key),
  customer_name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'طلب جديد'
    CHECK(status='طلب جديد'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE t12_synth_lines (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES t12_synth_orders(order_id),
  request_key TEXT NOT NULL UNIQUE
    REFERENCES t12_synth_request_ledger(request_key),
  item_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty>0),
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'طلب جديد'
);
CREATE TABLE t12_synth_events (
  request_key TEXT NOT NULL
    REFERENCES t12_synth_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_synth_orders(order_id),
  event_type TEXT NOT NULL CHECK(event_type='order-created'),
  PRIMARY KEY(request_key,event_key)
);
CREATE TABLE t12_synth_outbox (
  request_key TEXT NOT NULL
    REFERENCES t12_synth_request_ledger(request_key),
  event_key TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES t12_synth_orders(order_id),
  line_id TEXT NOT NULL REFERENCES t12_synth_lines(line_id),
  status TEXT NOT NULL CHECK(status='pending'),
  PRIMARY KEY(request_key,event_key)
);
