-- Entry657: additive customer phone OTP enrollment foundation only.
-- SOURCE_ONLY / UNAPPLIED in Production / NO customer rows backfilled.
-- Requires prior UNAPPLIED 0032 customer portal native accounts schema.
-- No customer can enroll without a separately reviewed and approved grant.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_portal_phone_grants_v1 (
  customer_id TEXT PRIMARY KEY NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  phone_fingerprint_hex TEXT NOT NULL
    CHECK(length(phone_fingerprint_hex)=64
      AND phone_fingerprint_hex NOT GLOB '*[^0-9a-f]*'),
  state TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(state IN ('PENDING','APPROVED','REVOKED')),
  evidence_ref TEXT NOT NULL DEFAULT ''
    CHECK(length(evidence_ref)<=200),
  reviewed_by TEXT NOT NULL DEFAULT ''
    CHECK(length(reviewed_by)<=120),
  reviewed_at_ms INTEGER NOT NULL DEFAULT 0
    CHECK(reviewed_at_ms>=0),
  expires_at_ms INTEGER NOT NULL DEFAULT 0
    CHECK(expires_at_ms>=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(state<>'APPROVED' OR (
    length(trim(evidence_ref))>0
    AND length(trim(reviewed_by))>0
    AND reviewed_at_ms>0
    AND expires_at_ms>reviewed_at_ms
    AND expires_at_ms-reviewed_at_ms<=2592000000
  ))
);

-- Multiple users sharing a phone CANNOT be independently self-enrolled.
-- Exact customer phone matches in t12_customers must also be rechecked
-- against BOTH primary and extra phones by future atomic application logic.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_portal_grant_phone_v1
ON customer_portal_phone_grants_v1(phone_fingerprint_hex)
WHERE state='APPROVED';

CREATE TABLE IF NOT EXISTS customer_portal_phone_challenges_v1 (
  challenge_id TEXT PRIMARY KEY NOT NULL
    CHECK(length(challenge_id) BETWEEN 24 AND 100),
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_phone_grants_v1(customer_id) ON DELETE RESTRICT,
  phone_fingerprint_hex TEXT NOT NULL
    CHECK(length(phone_fingerprint_hex)=64
      AND phone_fingerprint_hex NOT GLOB '*[^0-9a-f]*'),
  otp_mac_hex TEXT NOT NULL
    CHECK(length(otp_mac_hex)=64 AND otp_mac_hex NOT GLOB '*[^0-9a-f]*'),
  status TEXT NOT NULL DEFAULT 'PREPARED'
    CHECK(status IN ('PREPARED','DELIVERED','VERIFIED','VOID')),
  issued_at_ms INTEGER NOT NULL CHECK(issued_at_ms>0),
  expires_at_ms INTEGER NOT NULL CHECK(
    expires_at_ms>issued_at_ms
    AND expires_at_ms-issued_at_ms<=300000
  ),
  delivered_at_ms INTEGER NOT NULL DEFAULT 0
    CHECK(delivered_at_ms>=0),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
  consumed_at_ms INTEGER NOT NULL DEFAULT 0 CHECK(consumed_at_ms>=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(status NOT IN ('DELIVERED','VERIFIED') OR delivered_at_ms>=issued_at_ms),
  CHECK(status<>'VERIFIED' OR (
    consumed_at_ms>=delivered_at_ms
    AND consumed_at_ms<expires_at_ms
  )),
  CHECK(status<>'PREPARED' OR (delivered_at_ms=0 AND consumed_at_ms=0))
);
CREATE INDEX IF NOT EXISTS idx_customer_portal_challenges_customer_v1
ON customer_portal_phone_challenges_v1(customer_id,issued_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_customer_portal_challenges_phone_v1
ON customer_portal_phone_challenges_v1(phone_fingerprint_hex,issued_at_ms DESC);

-- Future writers must implement atomic rate/cooldown CAS semantics:
-- max 3 SMS issues per hour + min 60s between issues per HMAC phone ID,
-- max 5 tries/challenge, and challenge redemption at most once.
CREATE TABLE IF NOT EXISTS customer_portal_phone_rate_v1 (
  phone_fingerprint_hex TEXT PRIMARY KEY NOT NULL
    CHECK(length(phone_fingerprint_hex)=64
      AND phone_fingerprint_hex NOT GLOB '*[^0-9a-f]*'),
  window_started_at_ms INTEGER NOT NULL CHECK(window_started_at_ms>=0),
  sent_in_window INTEGER NOT NULL DEFAULT 0 CHECK(sent_in_window BETWEEN 0 AND 3),
  last_sent_at_ms INTEGER NOT NULL DEFAULT 0 CHECK(last_sent_at_ms>=0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- No OTP, raw phone, password, customer Google session or SMS provider secret
-- is stored in these tables. No triggers/INSERT into grants/challenges/rate.
-- Applying only this migration does not activate any API or message.
