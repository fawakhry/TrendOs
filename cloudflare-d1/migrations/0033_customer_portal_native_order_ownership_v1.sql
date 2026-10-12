-- Entry655: source-only, additive future customer-to-Cloud Order ownership proof.
-- NOT authorized for production apply. No data migration, imports or live route.
PRAGMA foreign_keys = ON;

-- Exclusively fresh Cloud-native orders in t12_prod_orders. Historical Sheets
-- and employee_core_orders_v1 are intentionally NOT treated as customer-owned
-- merely because customer name or telephone matches.
CREATE TABLE IF NOT EXISTS customer_portal_native_order_ownership_v1 (
  order_id TEXT PRIMARY KEY NOT NULL
    REFERENCES t12_prod_orders(order_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  source TEXT NOT NULL CHECK(source='t12-cloud-native'),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','VERIFIED','REVOKED')),
  proof_ref TEXT NOT NULL UNIQUE CHECK(length(trim(proof_ref)) BETWEEN 1 AND 200),
  proof_method TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK(proof_method IN ('UNVERIFIED','OWNER_REVIEWED_EXACT_ID')),
  verified_by TEXT NOT NULL DEFAULT '' CHECK(length(verified_by)<=120),
  verified_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- A claimed code/name/phone match is not sufficient ownership evidence.
  -- An application verifier must independently prove this reference, scope
  -- and authenticated customer session before any user-facing order access.
  CHECK(status<>'VERIFIED' OR (
    proof_method='OWNER_REVIEWED_EXACT_ID'
    AND length(trim(verified_by))>0
    AND length(trim(verified_at))>0
  ))
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_order_owner_v1
  ON customer_portal_native_order_ownership_v1(customer_id,status,updated_at DESC);

-- No triggers, no INSERT into ownership table, no order GET endpoint.
