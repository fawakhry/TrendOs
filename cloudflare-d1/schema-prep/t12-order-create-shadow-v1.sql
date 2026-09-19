-- TrendOS T12 Order Create shadow schema PREP ONLY.
-- NOT in migrations/. NOT production-authorized. No existing business table is modified.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS t12_order_create_intents (
  client_request_id TEXT PRIMARY KEY,
  provisional_ref TEXT NOT NULL UNIQUE,
  actor TEXT NOT NULL DEFAULT '',
  identity_mode TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  external_customer_id TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'طلب جديد',
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  canonical_json TEXT NOT NULL,
  qualification_status TEXT NOT NULL DEFAULT 'shadow-planned'
    CHECK (qualification_status IN ('shadow-planned','shadow-qualified','abandoned')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t12_order_create_line_intents (
  client_request_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 1),
  provisional_line_ref TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  assigned_to TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK (qty > 0),
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'طلب جديد',
  heat_press INTEGER NOT NULL DEFAULT 0 CHECK (heat_press IN (0,1)),
  fly_print INTEGER NOT NULL DEFAULT 0 CHECK (fly_print IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_request_id, ordinal),
  FOREIGN KEY (client_request_id) REFERENCES t12_order_create_intents(client_request_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS t12_order_create_shadow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_request_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (client_request_id, event_key),
  FOREIGN KEY (client_request_id) REFERENCES t12_order_create_intents(client_request_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_t12_order_create_intents_status
  ON t12_order_create_intents(qualification_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_t12_order_create_shadow_events_request
  ON t12_order_create_shadow_events(client_request_id, created_at ASC);
