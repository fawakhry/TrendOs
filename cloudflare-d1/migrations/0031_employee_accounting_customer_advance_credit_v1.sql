PRAGMA foreign_keys = ON;

-- ACC-OWNER-20261016: customer overpayment is an ADVANCE / LIABILITY owed
-- by the workshop. This separate table does NOT weaken the nonnegative
-- party debt CHECK in migration 0024. Feature stays runtime-OFF by default.
-- Amounts here are INTEGER EGP PIASTRES, never approximated money floats.
CREATE TABLE IF NOT EXISTS employee_accounting_customer_credits_v1 (
  customer_id TEXT PRIMARY KEY,
  credit_cents INTEGER NOT NULL DEFAULT 0 CHECK(credit_cents>=0),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  last_request_key TEXT NOT NULL DEFAULT '',
  updated_at_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_credit_request_v1
  ON employee_accounting_customer_credits_v1(last_request_key);

CREATE TABLE IF NOT EXISTS employee_accounting_customer_credit_events_v1 (
  event_id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('RECEIPT_EXCESS','INVOICE_CREDIT_APPLIED','INVOICE_EXCESS')),
  amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
  delta_cents INTEGER NOT NULL CHECK(delta_cents<>0),
  credit_before_cents INTEGER NOT NULL CHECK(credit_before_cents>=0),
  credit_after_cents INTEGER NOT NULL CHECK(credit_after_cents>=0),
  related_invoice_no TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(credit_before_cents+delta_cents=credit_after_cents),
  CHECK((kind='INVOICE_CREDIT_APPLIED' AND delta_cents<0) OR
        (kind IN ('RECEIPT_EXCESS','INVOICE_EXCESS') AND delta_cents>0)),
  CHECK(amount_cents=abs(delta_cents))
);
CREATE INDEX IF NOT EXISTS idx_employee_accounting_customer_credit_history_v1
  ON employee_accounting_customer_credit_events_v1(customer_id,created_at_ms);

-- Keep old paid/remaining and all existing historical invoice columns.
-- New fields distinguish actual cash from prior customer credit applied.
-- Existing invoices retain zero defaults and are NOT rewritten/backfilled.
ALTER TABLE employee_accounting_final_invoices_v1
  ADD COLUMN credit_applied REAL NOT NULL DEFAULT 0 CHECK(credit_applied>=0);
ALTER TABLE employee_accounting_final_invoices_v1
  ADD COLUMN cash_received REAL NOT NULL DEFAULT 0 CHECK(cash_received>=0);
ALTER TABLE employee_accounting_final_invoices_v1
  ADD COLUMN credit_created REAL NOT NULL DEFAULT 0 CHECK(credit_created>=0);
