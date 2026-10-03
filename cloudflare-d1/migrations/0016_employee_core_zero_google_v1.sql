PRAGMA foreign_keys = ON;

-- Entry614 Zero-Google Employee Core.
-- Additive/default-OFF. Applying this schema cannot redirect employee traffic.
CREATE TABLE IF NOT EXISTS employee_core_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_EMPLOYEE_CORE_V1'),
  mode TEXT NOT NULL CHECK(mode IN ('OFF','READONLY','GENERAL')),
  policy_epoch INTEGER NOT NULL DEFAULT 0,
  data_version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_core_control_v1
(singleton,marker,mode,policy_epoch,data_version)
VALUES(1,'ENTRY614_EMPLOYEE_CORE_V1','OFF',0,1);

CREATE TABLE IF NOT EXISTS employee_core_request_ledger_v1 (
  request_key TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  response_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_core_archive_orders_v1 (
  order_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  archived_by TEXT NOT NULL,
  request_key TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_core_archive_lines_v1 (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  archived_by TEXT NOT NULL,
  request_key TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_core_archive_lines_order
ON employee_core_archive_lines_v1(order_id,archived_at DESC);

CREATE TABLE IF NOT EXISTS employee_core_events_v1 (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_core_events_created
ON employee_core_events_v1(created_at DESC);
