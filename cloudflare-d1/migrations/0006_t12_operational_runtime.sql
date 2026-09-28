PRAGMA foreign_keys = ON;

-- T12 operational runtime overlay for Cloud-native order lines.
-- Keeps the immutable CREATE canary rows intact and layers mutable operational state.
CREATE TABLE IF NOT EXISTS t12_prod_line_runtime (
  line_id TEXT PRIMARY KEY REFERENCES t12_prod_lines(line_id),
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id),
  status TEXT NOT NULL CHECK(status IN (
    'طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام',
    'تم التسليم','متوقف','مكرر','ملغى'
  )),
  notes TEXT NOT NULL DEFAULT '',
  customer_notified TEXT NOT NULL DEFAULT '',
  notified_at TEXT NOT NULL DEFAULT '',
  notified_by TEXT NOT NULL DEFAULT '',
  last_whatsapp_message TEXT NOT NULL DEFAULT '',
  last_whatsapp_at TEXT NOT NULL DEFAULT '',
  last_whatsapp_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t12_prod_runtime_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id),
  line_id TEXT NOT NULL REFERENCES t12_prod_lines(line_id),
  event_type TEXT NOT NULL,
  old_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_prod_runtime_order
ON t12_prod_line_runtime(order_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_t12_prod_runtime_events_line
ON t12_prod_runtime_events(line_id, created_at DESC);
