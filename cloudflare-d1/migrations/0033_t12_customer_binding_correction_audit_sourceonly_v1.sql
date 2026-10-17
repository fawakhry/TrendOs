PRAGMA foreign_keys=ON;

-- BOOK19 / BOOK18 / BOOK28: OFFLINE/SOURCE-ONLY manual review evidence trail.
-- Additive dormant schema: no app INSERT route, no owner attestation endpoint,
-- no finance/delivery permission and NO upgrade of unverified customer identity.
-- There is no binding to t12_prod_orders that can authorize accounting.
-- Evidence pointers + SHA-256 hashes are asserted by a future reviewer; the
-- schema cannot independently verify the document, actor, or customer consent.
CREATE TABLE IF NOT EXISTS t12_order_customer_binding_revision_v1 (
  revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT NOT NULL UNIQUE CHECK(length(trim(request_key)) BETWEEN 12 AND 180),
  order_id TEXT NOT NULL REFERENCES t12_prod_orders(order_id) ON DELETE RESTRICT,
  candidate_customer_id TEXT NOT NULL REFERENCES t12_customers(customer_id) ON DELETE RESTRICT,
  event_kind TEXT NOT NULL CHECK(event_kind IN ('PROPOSE','CORRECT','WITHDRAW')),
  supersedes_revision_id INTEGER REFERENCES t12_order_customer_binding_revision_v1(revision_id) ON DELETE RESTRICT,
  actor_subject TEXT NOT NULL CHECK(length(trim(actor_subject)) BETWEEN 3 AND 140),
  actor_role TEXT NOT NULL CHECK(actor_role='admin'),
  evidence_ref TEXT NOT NULL CHECK(length(trim(evidence_ref)) BETWEEN 12 AND 256),
  evidence_sha256 TEXT NOT NULL
    CHECK(length(evidence_sha256)=64 AND evidence_sha256 NOT GLOB '*[^0-9a-f]*'),
  reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 12 AND 500),
  review_status TEXT NOT NULL DEFAULT 'NOT_ATTESTED'
    CHECK(review_status='NOT_ATTESTED'),
  finance_authorized INTEGER NOT NULL DEFAULT 0 CHECK(finance_authorized=0),
  delivery_authorized INTEGER NOT NULL DEFAULT 0 CHECK(delivery_authorized=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK((event_kind='PROPOSE' AND supersedes_revision_id IS NULL)
     OR (event_kind IN ('CORRECT','WITHDRAW') AND supersedes_revision_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_t12_order_customer_binding_revision_order
  ON t12_order_customer_binding_revision_v1(order_id,revision_id DESC);
CREATE INDEX IF NOT EXISTS idx_t12_order_customer_binding_revision_candidate
  ON t12_order_customer_binding_revision_v1(candidate_customer_id);

CREATE TRIGGER IF NOT EXISTS t12_order_customer_binding_revision_guard_insert
BEFORE INSERT ON t12_order_customer_binding_revision_v1
BEGIN
  -- T12 request ledger must be committed even to RECORD a manual candidate.
  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM t12_prod_orders o JOIN t12_prod_request_ledger r
      ON r.request_key=o.request_key AND r.order_id=o.order_id
    WHERE o.order_id=NEW.order_id AND r.status='COMMITTED'
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_ORDER_NOT_COMMITTED') END;

  -- Do not store a proposed link to a presently inactive customer.
  SELECT CASE WHEN NOT EXISTS(
    SELECT 1 FROM t12_customers c
    WHERE c.customer_id=NEW.candidate_customer_id AND c.active='نعم'
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_CUSTOMER_INACTIVE_OR_ABSENT') END;

  -- One initial proposal for each order. Every following event must supersede
  -- exactly the CURRENT tail, in the same SQLite transaction. Corrections
  -- therefore retain all old evidence without silently replacing it.
  SELECT CASE WHEN NEW.event_kind='PROPOSE' AND EXISTS(
    SELECT 1 FROM t12_order_customer_binding_revision_v1 WHERE order_id=NEW.order_id
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_PROPOSAL_EXISTS') END;

  SELECT CASE WHEN NEW.event_kind<>'PROPOSE' AND NOT EXISTS(
    SELECT 1 FROM t12_order_customer_binding_revision_v1 prev
    WHERE prev.revision_id=NEW.supersedes_revision_id
      AND prev.order_id=NEW.order_id
      AND prev.event_kind<>'WITHDRAW'
      AND prev.revision_id=(SELECT MAX(tail.revision_id)
        FROM t12_order_customer_binding_revision_v1 tail
        WHERE tail.order_id=NEW.order_id)
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_STALE_OR_INVALID_PARENT') END;

  SELECT CASE WHEN NEW.event_kind='CORRECT' AND EXISTS(
    SELECT 1 FROM t12_order_customer_binding_revision_v1 prev
    WHERE prev.revision_id=NEW.supersedes_revision_id
      AND prev.candidate_customer_id=NEW.candidate_customer_id
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_NOOP_CORRECTION') END;

  -- Withdraw records the same previously proposed candidate; never silently
  -- writes a new person into the withdrawal event.
  SELECT CASE WHEN NEW.event_kind='WITHDRAW' AND EXISTS(
    SELECT 1 FROM t12_order_customer_binding_revision_v1 prev
    WHERE prev.revision_id=NEW.supersedes_revision_id
      AND prev.candidate_customer_id<>NEW.candidate_customer_id
  ) THEN RAISE(ABORT,'BOOK19_REVIEW_WITHDRAW_ID_MISMATCH') END;
END;

CREATE TRIGGER IF NOT EXISTS t12_order_customer_binding_revision_no_update
BEFORE UPDATE ON t12_order_customer_binding_revision_v1
BEGIN
  SELECT RAISE(ABORT,'BOOK19_REVIEW_REVISION_IMMUTABLE_NO_UPDATE');
END;

CREATE TRIGGER IF NOT EXISTS t12_order_customer_binding_revision_no_delete
BEFORE DELETE ON t12_order_customer_binding_revision_v1
BEGIN
  SELECT RAISE(ABORT,'BOOK19_REVIEW_REVISION_IMMUTABLE_NO_DELETE');
END;
