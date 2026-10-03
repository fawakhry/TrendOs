PRAGMA foreign_keys = ON;

-- Entry614 Zero-Google authoritative Accounting V1.
-- Additive and default-OFF. No financial write authority changes when applied.
CREATE TABLE IF NOT EXISTS employee_accounting_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_ACCOUNTING_V1'),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','READONLY','GENERAL')),
  next_invoice_number INTEGER NOT NULL DEFAULT 1 CHECK(next_invoice_number>=1),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_accounting_control_v1(singleton,marker,mode,next_invoice_number,policy_epoch)
VALUES(1,'ENTRY614_ACCOUNTING_V1','OFF',1,1);

CREATE TABLE IF NOT EXISTS employee_accounting_request_ledger_v1 (
  request_key TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  actor TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_accounting_materials_v1 (
  material_id TEXT PRIMARY KEY,
  department TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL,
  material_kind TEXT NOT NULL DEFAULT '',
  material_class TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  stock_qty REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  computed_unit_cost REAL NOT NULL DEFAULT 0,
  official_sale_price REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '[]',
  formula TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  raw_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department,material_name)
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_materials_dept
ON employee_accounting_materials_v1(department,active,material_name);

CREATE TABLE IF NOT EXISTS employee_accounting_templates_v1 (
  template_id TEXT PRIMARY KEY,
  department TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL DEFAULT '',
  output_count REAL NOT NULL DEFAULT 0,
  ink_cost REAL NOT NULL DEFAULT 0,
  fixed_cost REAL NOT NULL DEFAULT 0,
  computed_cost REAL NOT NULL DEFAULT 0,
  suggested_sale_price REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  raw_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department,item_name)
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_templates_dept
ON employee_accounting_templates_v1(department,active,item_name);

CREATE TABLE IF NOT EXISTS employee_accounting_dept_lines_v1 (
  accounting_line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 1,
  material_name TEXT NOT NULL DEFAULT '',
  material_consumption REAL NOT NULL DEFAULT 0,
  material_cost REAL NOT NULL DEFAULT 0,
  operating_cost REAL NOT NULL DEFAULT 0,
  other_cost REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  system_cost REAL NOT NULL DEFAULT 0,
  system_sale_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  profit REAL NOT NULL DEFAULT 0,
  billing_status TEXT NOT NULL DEFAULT '',
  approval_status TEXT NOT NULL DEFAULT '',
  approved_by TEXT NOT NULL DEFAULT '',
  approved_at_ms INTEGER,
  approval_batch_id TEXT NOT NULL DEFAULT '',
  approval_notes TEXT NOT NULL DEFAULT '',
  stock_deducted INTEGER NOT NULL DEFAULT 0 CHECK(stock_deducted IN (0,1)),
  stock_deducted_at_ms INTEGER,
  close_status TEXT NOT NULL DEFAULT '',
  final_invoice_no TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_dept_order
ON employee_accounting_dept_lines_v1(order_id,department,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_dept_line
ON employee_accounting_dept_lines_v1(line_id);

CREATE TABLE IF NOT EXISTS employee_accounting_final_invoices_v1 (
  invoice_no TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  accounting_line_ids_json TEXT NOT NULL DEFAULT '[]',
  manual_item TEXT NOT NULL DEFAULT '',
  manual_amount REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  final_total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  remaining REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  finance_department TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'مغلق',
  closed_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_invoice_order
ON employee_accounting_final_invoices_v1(order_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_accounting_party_ledger_v1 (
  transaction_id TEXT PRIMARY KEY,
  request_key TEXT UNIQUE,
  party_type TEXT NOT NULL CHECK(party_type IN ('customer','supplier')),
  party_name TEXT NOT NULL,
  party_code TEXT NOT NULL DEFAULT '',
  operation TEXT NOT NULL,
  operation_label TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL CHECK(amount>0),
  effect INTEGER NOT NULL CHECK(effect IN (-1,1)),
  payment_method TEXT NOT NULL DEFAULT '',
  ref_no TEXT NOT NULL DEFAULT '',
  balance_before REAL NOT NULL DEFAULT 0,
  balance_after REAL NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'TrendOS D1',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_party
ON employee_accounting_party_ledger_v1(party_type,party_name,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_accounting_stock_moves_v1 (
  stock_move_id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES employee_accounting_materials_v1(material_id),
  move_type TEXT NOT NULL,
  order_id TEXT NOT NULL DEFAULT '',
  line_id TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL DEFAULT '',
  qty_in REAL NOT NULL DEFAULT 0,
  qty_out REAL NOT NULL DEFAULT 0,
  balance_before REAL NOT NULL DEFAULT 0,
  balance_after REAL NOT NULL DEFAULT 0,
  actor TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  request_key TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_stock_material
ON employee_accounting_stock_moves_v1(material_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_accounting_events_v1 (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_events_entity
ON employee_accounting_events_v1(entity_type,entity_id,created_at_ms DESC);
