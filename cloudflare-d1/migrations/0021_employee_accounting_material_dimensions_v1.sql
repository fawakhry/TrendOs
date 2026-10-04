PRAGMA foreign_keys = ON;

-- EasyStore A1.3 deterministic quote dimensions.
-- Additive only; no runtime mode/authority change.
ALTER TABLE employee_accounting_materials_v1
ADD COLUMN raw_width REAL NOT NULL DEFAULT 0;

ALTER TABLE employee_accounting_materials_v1
ADD COLUMN raw_height REAL NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_employee_accounting_material_dimensions
ON employee_accounting_materials_v1(department,active,raw_width,raw_height);
