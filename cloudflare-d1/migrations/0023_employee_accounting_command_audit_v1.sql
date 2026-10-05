PRAGMA foreign_keys = ON;

-- EasyStore A2.1 command/idempotency/audit foundation.
-- Additive only. No accounting mode or authority change.
ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN request_hash TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN source_system TEXT NOT NULL DEFAULT 'EasyStore';

ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN correlation_id TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN evidence_refs_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN policy_epoch INTEGER NOT NULL DEFAULT 0;

ALTER TABLE employee_accounting_request_ledger_v1
ADD COLUMN command_version TEXT NOT NULL DEFAULT 'A2_COMMAND_V1';

CREATE INDEX IF NOT EXISTS idx_employee_accounting_request_correlation
ON employee_accounting_request_ledger_v1(correlation_id,created_at);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_request_source
ON employee_accounting_request_ledger_v1(source_system,operation,created_at);

ALTER TABLE employee_accounting_events_v1
ADD COLUMN request_key TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_events_v1
ADD COLUMN correlation_id TEXT NOT NULL DEFAULT '';

ALTER TABLE employee_accounting_events_v1
ADD COLUMN source_system TEXT NOT NULL DEFAULT 'EasyStore';

ALTER TABLE employee_accounting_events_v1
ADD COLUMN evidence_refs_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE employee_accounting_events_v1
ADD COLUMN policy_epoch INTEGER NOT NULL DEFAULT 0;

ALTER TABLE employee_accounting_events_v1
ADD COLUMN autonomy_level TEXT NOT NULL DEFAULT 'HUMAN';

CREATE INDEX IF NOT EXISTS idx_employee_accounting_events_request
ON employee_accounting_events_v1(request_key,created_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_employee_accounting_events_correlation
ON employee_accounting_events_v1(correlation_id,created_at_ms DESC);
