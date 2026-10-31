PRAGMA foreign_keys = ON;

-- ACC277: ORIGINAL EasyStore finance D1, not a parallel accounting database.
-- SOURCE-ONLY ADDITIVE MIGRATION; never deployed as part of this PR.
-- DRAFT does not create or modify the authoritative party ledger, balances,
-- cashbox, invoices, or inventory. Signed real openings need separate cutover.
CREATE TABLE IF NOT EXISTS employee_accounting_opening_intake_batches_v1 (
  batch_id TEXT PRIMARY KEY NOT NULL,
  cutover_date TEXT NOT NULL,
  currency TEXT NOT NULL CHECK(currency='EGP'),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status='DRAFT'),
  preparer_ref TEXT NOT NULL,
  source_evidence_ref TEXT NOT NULL,
  supplier_total_cents INTEGER NOT NULL DEFAULT 0 CHECK(supplier_total_cents>=0),
  separate_installment_total_cents INTEGER NOT NULL DEFAULT 0 CHECK(separate_installment_total_cents>=0),
  total_liability_cents INTEGER NOT NULL DEFAULT 0 CHECK(total_liability_cents>=0),
  request_key TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(total_liability_cents=supplier_total_cents+separate_installment_total_cents)
);

CREATE TABLE IF NOT EXISTS employee_accounting_opening_supplier_drafts_v1 (
  batch_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  balance_cents INTEGER NOT NULL CHECK(balance_cents>=0),
  evidence_ref TEXT NOT NULL,
  PRIMARY KEY(batch_id,supplier_id),
  FOREIGN KEY(batch_id) REFERENCES employee_accounting_opening_intake_batches_v1(batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS employee_accounting_opening_installment_drafts_v1 (
  batch_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  creditor_ref TEXT NOT NULL,
  supplier_id TEXT NOT NULL DEFAULT '',
  liability_treatment TEXT NOT NULL CHECK(liability_treatment IN
    ('INCLUDED_IN_SUPPLIER_OPENING','SEPARATE_CREDITOR')),
  contract_total_cents INTEGER NOT NULL CHECK(contract_total_cents>0),
  paid_to_cutover_cents INTEGER NOT NULL CHECK(paid_to_cutover_cents>=0),
  remaining_cents INTEGER NOT NULL CHECK(remaining_cents>0),
  installment_cents INTEGER NOT NULL CHECK(installment_cents>0),
  frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','quarterly','yearly')),
  next_due_date TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  PRIMARY KEY(batch_id,contract_id),
  CHECK(contract_total_cents=paid_to_cutover_cents+remaining_cents),
  CHECK(installment_cents<=remaining_cents),
  CHECK(
    (liability_treatment='INCLUDED_IN_SUPPLIER_OPENING' AND length(supplier_id)>0)
    OR (liability_treatment='SEPARATE_CREDITOR' AND supplier_id='')
  ),
  FOREIGN KEY(batch_id) REFERENCES employee_accounting_opening_intake_batches_v1(batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_easy_opening_supplier_draft_id
ON employee_accounting_opening_supplier_drafts_v1(supplier_id,batch_id);
CREATE INDEX IF NOT EXISTS idx_easy_opening_installment_due_draft
ON employee_accounting_opening_installment_drafts_v1(next_due_date,batch_id);

-- Inspection surface explicitly states DRAFT, not a posted financial balance.
-- Included supplier instalments never add a second creditor exposure.
CREATE VIEW IF NOT EXISTS employee_accounting_opening_draft_totals_v1 AS
SELECT b.batch_id,b.cutover_date,b.currency,b.status,
  b.total_liability_cents AS claimed_total_cents,
  COALESCE((SELECT SUM(s.balance_cents)
     FROM employee_accounting_opening_supplier_drafts_v1 s WHERE s.batch_id=b.batch_id),0)
    AS supplier_draft_cents,
  COALESCE((SELECT SUM(i.remaining_cents)
     FROM employee_accounting_opening_installment_drafts_v1 i
     WHERE i.batch_id=b.batch_id AND i.liability_treatment='SEPARATE_CREDITOR'),0)
    AS separate_installment_draft_cents,
  COALESCE((SELECT SUM(i.remaining_cents)
     FROM employee_accounting_opening_installment_drafts_v1 i
     WHERE i.batch_id=b.batch_id AND i.liability_treatment='INCLUDED_IN_SUPPLIER_OPENING'),0)
    AS already_in_supplier_draft_cents
FROM employee_accounting_opening_intake_batches_v1 b;
