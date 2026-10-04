PRAGMA foreign_keys = ON;

-- EasyStore A1.2 stable Party/Supplier master.
-- Additive schema only. No runtime authority or accounting mode change.
CREATE TABLE IF NOT EXISTS employee_accounting_parties_v1 (
  party_id TEXT PRIMARY KEY,
  party_type TEXT NOT NULL CHECK(party_type IN ('customer','supplier')),
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  source_system TEXT NOT NULL DEFAULT 'EasyStore',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(party_type,normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_parties_type_active
ON employee_accounting_parties_v1(party_type,active,display_name);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_parties_external
ON employee_accounting_parties_v1(source_system,external_id);

ALTER TABLE employee_accounting_party_ledger_v1
ADD COLUMN party_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_employee_accounting_party_id_time
ON employee_accounting_party_ledger_v1(party_type,party_id,created_at_ms DESC);
