PRAGMA foreign_keys = ON;

-- EasyStore A2.5B direct-sale costing.
ALTER TABLE employee_accounting_final_invoices_v1
ADD COLUMN manual_cost REAL NOT NULL DEFAULT 0;
