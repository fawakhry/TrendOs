PRAGMA foreign_keys = ON;

-- BOOK19/BOOK18/BOOK28: SOURCE-ONLY immutable official-customer-ID review.
-- Applying this additive schema NEVER enables finance/delivery writes.
-- Existing T12 orders have no attested immutable customer FK; their
-- external_customer_id is caller input, NOT the official t12_customers key.
-- This table only records a *human-supplied candidate for manual review*.
-- NO application INSERT/UPDATE/DELETE authority is provided by this change.
-- Even a real FK match does NOT certify that this order belongs to that
-- customer. Finance/delivery must NOT consult these rows as approval.
CREATE TABLE IF NOT EXISTS t12_order_customer_binding_review_v1 (
  order_id TEXT PRIMARY KEY NOT NULL
    REFERENCES t12_prod_orders(order_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL
    REFERENCES t12_customers(customer_id) ON DELETE RESTRICT,
  review_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK(review_status='UNVERIFIED'),
  candidate_kind TEXT NOT NULL DEFAULT 'MANUAL_OFFLINE_CANDIDATE'
    CHECK(candidate_kind='MANUAL_OFFLINE_CANDIDATE'),
  evidence_ref TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL CHECK(length(trim(recorded_by))>0),
  finance_authorized INTEGER NOT NULL DEFAULT 0
    CHECK(finance_authorized=0),
  delivery_authorized INTEGER NOT NULL DEFAULT 0
    CHECK(delivery_authorized=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_order_customer_binding_review_customer
  ON t12_order_customer_binding_review_v1(customer_id);

-- Append-once for forensic traceability. A mistaken review proposal cannot
-- be silently replaced or deleted; separately owner-approved correction
-- workflow is deliberately NOT implemented in this NO_GO draft.
CREATE TRIGGER IF NOT EXISTS t12_order_customer_binding_review_no_update
BEFORE UPDATE ON t12_order_customer_binding_review_v1
BEGIN
  SELECT RAISE(ABORT, 'BOOK19_REVIEW_BINDING_IMMUTABLE_NO_UPDATE');
END;

CREATE TRIGGER IF NOT EXISTS t12_order_customer_binding_review_no_delete
BEFORE DELETE ON t12_order_customer_binding_review_v1
BEGIN
  SELECT RAISE(ABORT, 'BOOK19_REVIEW_BINDING_IMMUTABLE_NO_DELETE');
END;
