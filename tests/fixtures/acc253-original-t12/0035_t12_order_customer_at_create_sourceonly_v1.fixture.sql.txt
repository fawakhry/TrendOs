PRAGMA foreign_keys=ON;

-- ACC223: source-only addition for the EXISTING T12 general CREATE transaction.
-- Not wired in current Worker route. Never grants customer owner attestation,
-- delivery, finance, debt, cash, payment or opening balance authority.
-- Financial release remains NO_GO. Historical orders are not backfilled.
CREATE TABLE IF NOT EXISTS t12_order_customer_at_create_control_v1 (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 marker TEXT NOT NULL CHECK(marker='ACC223_ORDER_CUSTOMER_SOURCE_CAPTURE_V1'),
 mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','ISOLATED')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO t12_order_customer_at_create_control_v1(singleton,marker,mode)
VALUES(1,'ACC223_ORDER_CUSTOMER_SOURCE_CAPTURE_V1','OFF');

CREATE TABLE IF NOT EXISTS t12_order_customer_at_create_v1 (
 order_id TEXT PRIMARY KEY NOT NULL
   REFERENCES t12_prod_orders(order_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE
   REFERENCES t12_prod_request_ledger(request_key) ON DELETE RESTRICT,
 customer_id TEXT NOT NULL
   REFERENCES t12_customers(customer_id) ON DELETE RESTRICT,
 external_customer_id TEXT NOT NULL CHECK(length(external_customer_id) BETWEEN 3 AND 180),
 customer_version INTEGER NOT NULL CHECK(customer_version>=1),
 actor_subject TEXT NOT NULL CHECK(length(trim(actor_subject)) BETWEEN 3 AND 140),
 evidence_ref TEXT NOT NULL CHECK(length(trim(evidence_ref)) BETWEEN 12 AND 180),
 -- Existing Orders Edge employee-session audit ONLY; neither account identity
 -- nor customer ownership is attested by these source-only selectors.
 selector_role TEXT NOT NULL CHECK(selector_role IN ('admin','service')),
 selector_session_sha256 TEXT NOT NULL CHECK(length(selector_session_sha256)=64),
 selector_issued_at INTEGER NOT NULL CHECK(selector_issued_at>0),
 selector_expires_at INTEGER NOT NULL CHECK(selector_expires_at>selector_issued_at),
 capture_status TEXT NOT NULL DEFAULT 'SOURCE_ONLY_NOT_ATTESTED'
   CHECK(capture_status='SOURCE_ONLY_NOT_ATTESTED'),
 finance_authorized INTEGER NOT NULL DEFAULT 0 CHECK(finance_authorized=0),
 delivery_authorized INTEGER NOT NULL DEFAULT 0 CHECK(delivery_authorized=0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_acc223_order_customer_capture_customer
ON t12_order_customer_at_create_v1(customer_id,order_id);

-- All assertions are checked at INSERT, IN THE SAME EXISTING general CREATE
-- batch. Even a direct SQL insert cannot turn a candidate into finance proof.
CREATE TRIGGER IF NOT EXISTS t12_order_customer_at_create_guard_v1
BEFORE INSERT ON t12_order_customer_at_create_v1
BEGIN
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM t12_order_customer_at_create_control_v1
   WHERE singleton=1 AND marker='ACC223_ORDER_CUSTOMER_SOURCE_CAPTURE_V1'
     AND mode='ISOLATED'
 ) THEN RAISE(ABORT,'ACC223_ISOLATED_CAPTURE_DISABLED') END;
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM t12_prod_orders o
   JOIN t12_prod_request_ledger l
     ON l.request_key=o.request_key AND l.order_id=o.order_id
   WHERE o.order_id=NEW.order_id AND o.request_key=NEW.request_key
     AND o.actor=NEW.actor_subject AND l.actor=NEW.actor_subject
     AND l.status='COMMITTED'
     AND o.external_customer_id=NEW.external_customer_id
 ) THEN RAISE(ABORT,'ACC223_ORDER_COMMIT_ACTOR_AND_INPUT_MISMATCH') END;
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM t12_customers c WHERE c.customer_id=NEW.customer_id
     AND c.active='نعم' AND c.version=NEW.customer_version
 ) THEN RAISE(ABORT,'ACC223_CUSTOMER_MISSING_INACTIVE_OR_VERSION_DRIFT') END;
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM t12_prod_lines line
     WHERE line.order_id=NEW.order_id AND line.request_key=NEW.request_key
 ) THEN RAISE(ABORT,'ACC223_ORDER_LINES_MISSING') END;
END;
CREATE TRIGGER IF NOT EXISTS t12_order_customer_at_create_no_update_v1
BEFORE UPDATE ON t12_order_customer_at_create_v1
BEGIN
 SELECT RAISE(ABORT,'ACC223_SOURCE_CAPTURE_IMMUTABLE');
END;
CREATE TRIGGER IF NOT EXISTS t12_order_customer_at_create_no_delete_v1
BEFORE DELETE ON t12_order_customer_at_create_v1
BEGIN
 SELECT RAISE(ABORT,'ACC223_SOURCE_CAPTURE_IMMUTABLE');
END;
