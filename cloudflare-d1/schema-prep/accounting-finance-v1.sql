-- TrendOS Accounting Finance V1 — PREPARED SCHEMA ONLY
-- DO NOT APPLY TO D1 OR PRODUCTION WITHOUT A SEPARATE CUTOVER GATE.
-- Canonical money storage is integer EGP minor units (piastres).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounting_accounts (
  account_code TEXT PRIMARY KEY NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  normal_side TEXT NOT NULL CHECK (normal_side IN ('debit','credit')),
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_accounts_role
  ON accounting_accounts(role);

CREATE TABLE IF NOT EXISTS accounting_treasuries (
  treasury_id TEXT PRIMARY KEY NOT NULL,
  treasury_name TEXT NOT NULL,
  account_code TEXT NOT NULL,
  treasury_type TEXT NOT NULL CHECK (treasury_type IN ('cashbox','bank','wallet','clearing')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_code) REFERENCES accounting_accounts(account_code)
);

CREATE INDEX IF NOT EXISTS idx_accounting_treasuries_account
  ON accounting_treasuries(account_code, active);

CREATE TABLE IF NOT EXISTS accounting_journals (
  journal_id TEXT PRIMARY KEY NOT NULL,
  journal_type TEXT NOT NULL,
  source_document_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  command_fingerprint TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  total_debit_minor INTEGER NOT NULL CHECK (total_debit_minor > 0),
  total_credit_minor INTEGER NOT NULL CHECK (total_credit_minor > 0),
  reversal_of_journal_id TEXT,
  reversal_reason TEXT,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','reversed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (total_debit_minor = total_credit_minor),
  CHECK ((reversal_of_journal_id IS NULL AND reversal_reason IS NULL) OR
         (reversal_of_journal_id IS NOT NULL AND length(trim(reversal_reason)) > 0)),
  FOREIGN KEY (reversal_of_journal_id) REFERENCES accounting_journals(journal_id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_journals_source_document
  ON accounting_journals(source_document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_journals_reversal
  ON accounting_journals(reversal_of_journal_id, created_at);

CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  entry_id TEXT PRIMARY KEY NOT NULL,
  journal_id TEXT NOT NULL,
  line_no INTEGER NOT NULL CHECK (line_no > 0),
  account_code TEXT NOT NULL,
  debit_minor INTEGER NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor INTEGER NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  party_id TEXT,
  treasury_id TEXT,
  order_id TEXT,
  line_id TEXT,
  item_id TEXT,
  department_id TEXT,
  profit_center_id TEXT,
  source_document_id TEXT NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((debit_minor > 0 AND credit_minor = 0) OR (credit_minor > 0 AND debit_minor = 0)),
  UNIQUE (journal_id, line_no),
  FOREIGN KEY (journal_id) REFERENCES accounting_journals(journal_id),
  FOREIGN KEY (account_code) REFERENCES accounting_accounts(account_code),
  FOREIGN KEY (treasury_id) REFERENCES accounting_treasuries(treasury_id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_party
  ON accounting_journal_entries(party_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_treasury
  ON accounting_journal_entries(treasury_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_order_line
  ON accounting_journal_entries(order_id, line_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_profit_center
  ON accounting_journal_entries(profit_center_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_source_document
  ON accounting_journal_entries(source_document_id, created_at);

CREATE TABLE IF NOT EXISTS accounting_idempotency (
  idempotency_key TEXT PRIMARY KEY NOT NULL,
  command_type TEXT NOT NULL,
  command_fingerprint TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('claimed','completed','failed','ambiguous')),
  journal_id TEXT,
  result_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (journal_id) REFERENCES accounting_journals(journal_id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_idempotency_journal
  ON accounting_idempotency(journal_id);

CREATE TABLE IF NOT EXISTS accounting_audit_events (
  audit_event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  idempotency_key TEXT,
  journal_id TEXT,
  order_id TEXT,
  line_id TEXT,
  party_id TEXT,
  treasury_id TEXT,
  department_id TEXT,
  profit_center_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES accounting_journals(journal_id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_audit_entity
  ON accounting_audit_events(entity_type, entity_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_order_line
  ON accounting_audit_events(order_id, line_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_idempotency
  ON accounting_audit_events(idempotency_key, occurred_at);

-- Immutable financial facts: reversals are new rows, never updates/deletes.
CREATE TRIGGER IF NOT EXISTS accounting_journals_no_update
BEFORE UPDATE ON accounting_journals
BEGIN
  SELECT RAISE(ABORT, 'accounting_journals is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_journals_no_delete
BEFORE DELETE ON accounting_journals
BEGIN
  SELECT RAISE(ABORT, 'accounting_journals is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_entries_no_update
BEFORE UPDATE ON accounting_journal_entries
BEGIN
  SELECT RAISE(ABORT, 'accounting_journal_entries is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_entries_no_delete
BEFORE DELETE ON accounting_journal_entries
BEGIN
  SELECT RAISE(ABORT, 'accounting_journal_entries is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_idempotency_no_update
BEFORE UPDATE ON accounting_idempotency
BEGIN
  SELECT RAISE(ABORT, 'accounting_idempotency is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_idempotency_no_delete
BEFORE DELETE ON accounting_idempotency
BEGIN
  SELECT RAISE(ABORT, 'accounting_idempotency is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_audit_no_update
BEFORE UPDATE ON accounting_audit_events
BEGIN
  SELECT RAISE(ABORT, 'accounting_audit_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_audit_no_delete
BEFORE DELETE ON accounting_audit_events
BEGIN
  SELECT RAISE(ABORT, 'accounting_audit_events is append-only');
END;

-- Prepared Chart of Accounts seed. This file is not an active migration.
INSERT OR IGNORE INTO accounting_accounts(account_code, account_name, account_type, normal_side, role) VALUES
  ('1010','الخزنة الرئيسية','asset','debit','cash-main'),
  ('1020','بنك / محفظة','asset','debit','bank'),
  ('1100','العملاء - مدينون','asset','debit','accounts-receivable'),
  ('1200','المخزون','asset','debit','inventory'),
  ('1300','العهد والسلف','asset','debit','custody'),
  ('2100','الموردون - دائنون','liability','credit','accounts-payable'),
  ('2200','دفعات مقدمة من العملاء','liability','credit','customer-advances'),
  ('3100','حقوق الملكية الافتتاحية','equity','credit','opening-equity'),
  ('4100','إيراد المبيعات','revenue','credit','sales-revenue'),
  ('5100','تكلفة البضاعة / الشغل المباع','expense','debit','cogs'),
  ('5200','مصروفات تشغيل','expense','debit','operating-expense'),
  ('5300','هالك وتسويات','expense','debit','waste-adjustment');
