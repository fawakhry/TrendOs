PRAGMA foreign_keys = ON;

-- EasyStore A1.4/A2-prep deterministic day-operations read model.
-- Additive only. No mode/authority change and no data backfill.
ALTER TABLE employee_accounting_dept_lines_v1
ADD COLUMN work_date TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN work_date TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS employee_accounting_purchase_invoices_v1 (
  purchase_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  supplier_party_id TEXT NOT NULL DEFAULT '',
  supplier_name TEXT NOT NULL DEFAULT '',
  supplier_invoice_no TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  material_id TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  remaining REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  work_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK(status IN ('POSTED','REVERSED')),
  source_daily_purchase_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_purchase_day_dept
ON employee_accounting_purchase_invoices_v1(work_date,department,status);

CREATE TABLE IF NOT EXISTS employee_accounting_daily_purchases_v1 (
  daily_purchase_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  employee_key TEXT NOT NULL,
  department TEXT NOT NULL,
  supplier_party_id TEXT NOT NULL DEFAULT '',
  supplier_name TEXT NOT NULL DEFAULT '',
  supplier_invoice_no TEXT NOT NULL DEFAULT '',
  material_id TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty>0),
  unit_cost REAL NOT NULL CHECK(unit_cost>0),
  total REAL NOT NULL CHECK(total>0),
  payment_method TEXT NOT NULL DEFAULT '',
  paid REAL NOT NULL DEFAULT 0,
  remaining REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','REVERSED')),
  approved_at_ms INTEGER,
  approved_by TEXT NOT NULL DEFAULT '',
  official_purchase_id TEXT NOT NULL DEFAULT '',
  stock_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_daily_purchase_day
ON employee_accounting_daily_purchases_v1(work_date,status,department,employee_key);

CREATE TABLE IF NOT EXISTS employee_accounting_cashbox_v1 (
  cashbox_tx_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  party_id TEXT NOT NULL DEFAULT '',
  party_name TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL CHECK(amount>0),
  payment_method TEXT NOT NULL DEFAULT '',
  ref_no TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_cashbox_day
ON employee_accounting_cashbox_v1(work_date,department,movement_type);

CREATE TABLE IF NOT EXISTS employee_accounting_waste_v1 (
  waste_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  department TEXT NOT NULL,
  order_id TEXT NOT NULL DEFAULT '',
  line_id TEXT NOT NULL DEFAULT '',
  material_id TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL DEFAULT '',
  reason_code TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  recovered_amount REAL NOT NULL DEFAULT 0,
  evidence_ref TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_waste_day
ON employee_accounting_waste_v1(work_date,department);

CREATE TABLE IF NOT EXISTS employee_accounting_custody_events_v1 (
  custody_event_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  employee_key TEXT NOT NULL,
  department TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('HANDOFF','PURCHASE_SETTLEMENT','PURCHASE_REVERSAL','RETURN','EXTRA_PAYMENT')),
  amount REAL NOT NULL CHECK(amount>=0),
  payment_method TEXT NOT NULL DEFAULT '',
  ref_no TEXT NOT NULL DEFAULT '',
  source_purchase_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_custody_day
ON employee_accounting_custody_events_v1(work_date,department,employee_key);

CREATE TABLE IF NOT EXISTS employee_accounting_custody_closes_v1 (
  custody_close_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  employee_key TEXT NOT NULL,
  department TEXT NOT NULL,
  balance_before REAL NOT NULL DEFAULT 0,
  settlement_type TEXT NOT NULL DEFAULT '',
  settlement_amount REAL NOT NULL DEFAULT 0,
  balance_after REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(work_date,employee_key,department)
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_custody_close_day
ON employee_accounting_custody_closes_v1(work_date,department);

CREATE TABLE IF NOT EXISTS employee_accounting_day_closes_v1 (
  day_close_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  work_date TEXT NOT NULL,
  department TEXT NOT NULL,
  report_json TEXT NOT NULL,
  integrity_status TEXT NOT NULL DEFAULT 'PASS' CHECK(integrity_status IN ('PASS','FAIL')),
  notes TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(work_date,department)
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_day_close_date
ON employee_accounting_day_closes_v1(work_date,department);
