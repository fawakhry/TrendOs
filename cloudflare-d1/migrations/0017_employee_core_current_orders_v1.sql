PRAGMA foreign_keys = ON;

-- Entry614 Zero-Google current operational order authority.
-- Additive/default-OFF: this migration only creates storage for the one-time
-- copy of the current Google order/line sheets. It does not redirect traffic.

CREATE TABLE IF NOT EXISTS employee_core_orders_v1 (
  order_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL DEFAULT '',
  expected_delivery_at TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  source_row INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_core_orders_status
ON employee_core_orders_v1(active,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS employee_core_lines_v1 (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 1,
  assigned_to TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  ready TEXT NOT NULL DEFAULT '',
  heat_press INTEGER NOT NULL DEFAULT 0 CHECK(heat_press IN (0,1)),
  fly_print INTEGER NOT NULL DEFAULT 0 CHECK(fly_print IN (0,1)),
  notes TEXT NOT NULL DEFAULT '',
  debt_amount REAL NOT NULL DEFAULT 0,
  debt_hold INTEGER NOT NULL DEFAULT 0 CHECK(debt_hold IN (0,1)),
  debt_notes TEXT NOT NULL DEFAULT '',
  customer_notified TEXT NOT NULL DEFAULT '',
  notified_at TEXT NOT NULL DEFAULT '',
  notified_by TEXT NOT NULL DEFAULT '',
  last_whatsapp_message TEXT NOT NULL DEFAULT '',
  last_whatsapp_at TEXT NOT NULL DEFAULT '',
  last_whatsapp_by TEXT NOT NULL DEFAULT '',
  registration_sent TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL DEFAULT '',
  expected_delivery_at TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  source_row INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES employee_core_orders_v1(order_id)
);
CREATE INDEX IF NOT EXISTS idx_employee_core_lines_order
ON employee_core_lines_v1(order_id,active,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_core_lines_department
ON employee_core_lines_v1(department,active,status,priority);
