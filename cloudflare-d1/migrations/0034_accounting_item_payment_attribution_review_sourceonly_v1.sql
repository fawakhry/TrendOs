PRAGMA foreign_keys=ON;

-- ACC210 / G4 / BOOK18/19 (SOURCE-ONLY, NEVER A MONEY/REFUND WRITER).
-- Dormant, initially EMPTY, synthetic fixture-only item/payment attribution
-- REVIEW PROPOSALS. SQL rows NEVER certify an allocation or authorize payout.
-- There is intentionally no app INSERT API, approver/auth session, automatic
-- discount prorating, mutable correction, refund, or financial integration.
-- An actor_role_label and evidence hash are provided claims, NOT SSO.
CREATE TABLE IF NOT EXISTS employee_accounting_invoice_item_payment_review_v1 (
  proposal_id TEXT PRIMARY KEY NOT NULL
    CHECK(length(proposal_id) BETWEEN 8 AND 140),
  invoice_no TEXT NOT NULL
    REFERENCES employee_accounting_final_invoices_v1(invoice_no),
  accounting_line_id TEXT NOT NULL
    REFERENCES employee_accounting_dept_lines_v1(accounting_line_id),
  receipt_ledger_request_key TEXT NOT NULL
    REFERENCES employee_accounting_party_ledger_v1(request_key),
  customer_id TEXT NOT NULL CHECK(length(customer_id) BETWEEN 3 AND 180),
  proposed_cents INTEGER NOT NULL
    CHECK(typeof(proposed_cents)='integer' AND proposed_cents>0
      AND proposed_cents<=9007199254740991),
  actor_subject TEXT NOT NULL CHECK(length(actor_subject) BETWEEN 8 AND 180),
  actor_role_label TEXT NOT NULL DEFAULT 'admin' CHECK(actor_role_label='admin'),
  evidence_sha256 TEXT NOT NULL
    CHECK(length(evidence_sha256)=64
      AND evidence_sha256 NOT GLOB '*[^0-9a-f]*'),
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 500),
  proposed_at_ms INTEGER NOT NULL CHECK(proposed_at_ms>0),
  review_status TEXT NOT NULL DEFAULT 'NOT_ATTESTED'
    CHECK(review_status='NOT_ATTESTED'),
  finance_authorized INTEGER NOT NULL DEFAULT 0 CHECK(finance_authorized=0),
  refund_authorized INTEGER NOT NULL DEFAULT 0 CHECK(refund_authorized=0),
  delivery_authorized INTEGER NOT NULL DEFAULT 0 CHECK(delivery_authorized=0),
  cash_out_authorized INTEGER NOT NULL DEFAULT 0 CHECK(cash_out_authorized=0),
  UNIQUE(invoice_no,accounting_line_id,receipt_ledger_request_key)
);

CREATE INDEX IF NOT EXISTS idx_acc210_item_review_invoice
  ON employee_accounting_invoice_item_payment_review_v1(invoice_no,customer_id);
CREATE INDEX IF NOT EXISTS idx_acc210_item_review_receipt
  ON employee_accounting_invoice_item_payment_review_v1(receipt_ledger_request_key);

-- SQLite proves only that the two SOURCE records are currently structurally
-- compatible. That is NOT proof of ownership, funds tender, returnable amount,
-- discount/partial-payment splitting or historical completeness.
CREATE TRIGGER IF NOT EXISTS trg_acc210_item_payment_proposal_source_check
BEFORE INSERT ON employee_accounting_invoice_item_payment_review_v1
BEGIN
  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM employee_accounting_final_invoices_v1 i
    WHERE i.invoice_no=NEW.invoice_no
      AND i.customer_party_id=NEW.customer_id
      AND EXISTS(
        SELECT 1 FROM employee_accounting_request_ledger_v1 r
        WHERE r.request_key=i.request_key AND r.status='COMMITTED'
          AND r.operation IN ('direct-sale','credit-direct-sale','final-invoice')
      )
  ) THEN RAISE(ABORT,'invoice-customer-id-mismatch') END;

  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM employee_accounting_dept_lines_v1 d
    WHERE d.accounting_line_id=NEW.accounting_line_id
      AND d.final_invoice_no=NEW.invoice_no
  ) THEN RAISE(ABORT,'invoice-item-line-not-attached') END;

  -- The source may be initial invoice cash receipt's -LEDGER-PAYMENT OR an
  -- ordinary later party-ledger:customer:payment_received command. In BOTH
  -- forms the parent command must be actually COMMITTED and physical cash
  -- must exist; later free-text invoice refs are untrusted and are NOT an FK.
  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM employee_accounting_party_ledger_v1 l
    INNER JOIN employee_accounting_request_ledger_v1 parent
      ON parent.request_key=(CASE
        WHEN substr(l.request_key,-15)='-LEDGER-PAYMENT'
          THEN substr(l.request_key,1,length(l.request_key)-15)
        ELSE l.request_key END)
    INNER JOIN employee_accounting_cashbox_v1 c
      ON c.request_key=(CASE
        WHEN substr(l.request_key,-15)='-LEDGER-PAYMENT'
          THEN substr(l.request_key,1,length(l.request_key)-15)
        ELSE l.request_key END)||'-CASH'
    WHERE l.request_key=NEW.receipt_ledger_request_key
      AND l.party_type='customer'
      AND l.party_id=NEW.customer_id
      AND l.operation='payment_received' AND l.effect=-1 AND l.amount>0
      AND parent.status='COMMITTED'
      AND ((substr(l.request_key,-15)='-LEDGER-PAYMENT'
        AND parent.operation IN ('direct-sale','credit-direct-sale','final-invoice'))
       OR (substr(l.request_key,-15)<>'-LEDGER-PAYMENT'
        AND parent.operation='party-ledger:customer:payment_received'))
      AND c.party_id=NEW.customer_id AND c.movement_type='CUSTOMER_RECEIPT'
      AND c.amount>0 AND CAST(ROUND(c.amount*100) AS INTEGER)>=CAST(ROUND(l.amount*100) AS INTEGER)
  ) THEN RAISE(ABORT,'receipt-not-committed-with-matching-cash') END;

  -- Across ALL invoices/items, never propose more than one receipt's ACTUAL
  -- ledger amount. Prior physical cash > ledger (customer advance) does not
  -- make excess cash allocatable to these unverified invoice candidates.
  SELECT CASE WHEN (
    SELECT COALESCE(SUM(existing.proposed_cents),0)
    FROM employee_accounting_invoice_item_payment_review_v1 existing
    WHERE existing.receipt_ledger_request_key=NEW.receipt_ledger_request_key
  )+NEW.proposed_cents > (
    SELECT CAST(ROUND(l.amount*100) AS INTEGER)
    FROM employee_accounting_party_ledger_v1 l
    WHERE l.request_key=NEW.receipt_ledger_request_key
  ) THEN RAISE(ABORT,'source-receipt-total-exceeded') END;
END;

-- No edit, delete, status promotion or silent correction. A different
-- explicitly designed immutable superseding event can be added ONLY after
-- future authenticated owner approval; there is no such path in ACC210.
CREATE TRIGGER IF NOT EXISTS trg_acc210_review_immutable_update
BEFORE UPDATE ON employee_accounting_invoice_item_payment_review_v1
BEGIN
  SELECT RAISE(ABORT,'immutable-review-row');
END;
CREATE TRIGGER IF NOT EXISTS trg_acc210_review_immutable_delete
BEFORE DELETE ON employee_accounting_invoice_item_payment_review_v1
BEGIN
  SELECT RAISE(ABORT,'immutable-review-row');
END;
