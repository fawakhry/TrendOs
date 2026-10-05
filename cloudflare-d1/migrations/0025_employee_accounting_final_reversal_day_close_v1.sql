PRAGMA foreign_keys = ON;

-- EasyStore A2.5 final-invoice reversal + day-close integrity fields.
-- Additive only. No runtime mode or authority change.
ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN customer_party_id TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN held_paid REAL NOT NULL DEFAULT 0;

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN replacement_invoice_no TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN reversed_at_ms INTEGER;

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN reversed_by TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN reversal_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN reversal_ref TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_employee_accounting_final_customer
ON employee_accounting_final_invoices_v1(customer_party_id,status,created_at_ms DESC);

ALTER TABLE employee_accounting_day_closes_v1
ADD COLUMN report_hash TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_day_closes_v1
ADD COLUMN blockers_json TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_employee_accounting_day_close_hash
ON employee_accounting_day_closes_v1(work_date,department,report_hash);
