-- Entry654: additive FUTURE customer-portal identity foundation only.
-- This migration is NOT authorized for Production application.
-- It has NO INSERT into any customer account/credential/session table,
-- NO migration of Google tokens/password hashes, and NO runtime route enable.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_portal_native_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  marker TEXT NOT NULL CHECK (marker = 'ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'),
  mode TEXT NOT NULL CHECK (mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  policy_epoch INTEGER NOT NULL CHECK (policy_epoch >= 1),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO customer_portal_native_control_v1
  (singleton, marker, mode, policy_epoch)
VALUES (1, 'ENTRY654_CUSTOMER_PORTAL_NATIVE_V1', 'OFF', 1);

-- Explicit verified binding only. A customer code or shared phone/name is
-- NEVER by itself proof that a person owns a D1 customer_id.
-- No automatic INSERT from t12_customers, Sheets or Apps Script is allowed.
CREATE TABLE IF NOT EXISTS customer_portal_native_accounts_v1 (
  customer_id TEXT PRIMARY KEY NOT NULL
    REFERENCES t12_customers(customer_id) ON DELETE RESTRICT,
  portal_code TEXT NOT NULL UNIQUE
    CHECK (length(trim(portal_code)) BETWEEN 1 AND 80),
  state TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING','ACTIVE','DISABLED')),
  password_scheme TEXT NOT NULL DEFAULT 'UNSET'
    CHECK (password_scheme IN ('UNSET','pbkdf2-sha256-v1')),
  password_salt_hex TEXT NOT NULL DEFAULT '',
  password_hash_hex TEXT NOT NULL DEFAULT '',
  password_iterations INTEGER NOT NULL DEFAULT 0
    CHECK (password_iterations IN (0,100000)),
  must_change INTEGER NOT NULL DEFAULT 1 CHECK (must_change IN (0,1)),
  session_version INTEGER NOT NULL DEFAULT 1 CHECK (session_version >= 1),
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until_ms INTEGER NOT NULL DEFAULT 0 CHECK (locked_until_ms >= 0),
  verified_enrollment_ref TEXT NOT NULL DEFAULT ''
    CHECK (length(verified_enrollment_ref) <= 200),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- ACTIVE always implies an independently provisioned, PBKDF2-only verifier.
  -- No Google password, customer default or legacy session fallback.
  CHECK (
    state <> 'ACTIVE' OR (
      password_scheme = 'pbkdf2-sha256-v1'
      AND length(password_salt_hex) = 32
      AND password_salt_hex NOT GLOB '*[^0-9a-f]*'
      AND length(password_hash_hex) = 64
      AND password_hash_hex NOT GLOB '*[^0-9a-f]*'
      AND password_iterations = 100000
      AND length(trim(verified_enrollment_ref)) > 0
    )
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_portal_account_code_v1
  ON customer_portal_native_accounts_v1(portal_code);

-- Store only a one-way secret-keyed token fingerprint, never raw session tokens.
CREATE TABLE IF NOT EXISTS customer_portal_native_sessions_v1 (
  token_fingerprint_hex TEXT PRIMARY KEY NOT NULL
    CHECK (
      length(token_fingerprint_hex) = 64
      AND token_fingerprint_hex NOT GLOB '*[^0-9a-f]*'
    ),
  customer_id TEXT NOT NULL REFERENCES customer_portal_native_accounts_v1(customer_id)
    ON DELETE RESTRICT,
  session_version INTEGER NOT NULL CHECK (session_version >= 1),
  issued_at_ms INTEGER NOT NULL CHECK (issued_at_ms > 0),
  expires_at_ms INTEGER NOT NULL CHECK (expires_at_ms > issued_at_ms),
  revoked_at_ms INTEGER CHECK (revoked_at_ms IS NULL OR revoked_at_ms >= issued_at_ms),
  source TEXT NOT NULL CHECK (source = 'd1-customer-native')
);
CREATE INDEX IF NOT EXISTS idx_customer_portal_sessions_by_customer_v1
  ON customer_portal_native_sessions_v1(customer_id, expires_at_ms);

-- There is intentionally NO self-enrollment, credential conversion,
-- Google password reading, draft mutation, order creation or live endpoint.
