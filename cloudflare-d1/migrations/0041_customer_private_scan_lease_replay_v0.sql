-- Zero Google: private signed scan lease replay journal, SOURCE ONLY / NO LIVE APPLY.
-- Add ONLY to disposable D1/SQLite test databases on a separately approved
-- isolated staging migration. NEVER migrate production without owner approval.
-- A consumed nonce is kept forever in this V0 source; expiry does NOT free it
-- for reuse. No malware scan, signed verdict, T12, Google or print permission.
CREATE TABLE IF NOT EXISTS customer_private_scan_lease_replay_v0 (
  nonce_digest_hex TEXT PRIMARY KEY NOT NULL
    CHECK(length(nonce_digest_hex)=64
      AND nonce_digest_hex NOT GLOB '*[^0-9a-f]*'),
  signed_lease_digest_hex TEXT NOT NULL
    CHECK(length(signed_lease_digest_hex)=64
      AND signed_lease_digest_hex NOT GLOB '*[^0-9a-f]*'),
  issued_at_ms INTEGER NOT NULL CHECK(issued_at_ms>=1500000000000),
  expires_at_ms INTEGER NOT NULL
    CHECK(expires_at_ms>issued_at_ms
      AND expires_at_ms-issued_at_ms BETWEEN 1 AND 120000),
  consumed_at_ms INTEGER NOT NULL
    CHECK(consumed_at_ms>=issued_at_ms-5000
      AND consumed_at_ms<expires_at_ms)
) WITHOUT ROWID;

-- Auditable denial of changing or deleting a spent nonce. A scanner verdict
-- is NEVER written here. No customer reference, filename, R2 key or token.
CREATE TRIGGER IF NOT EXISTS trg_customer_private_scan_replay_no_update_v0
BEFORE UPDATE ON customer_private_scan_lease_replay_v0
BEGIN SELECT RAISE(ABORT,'CUSTOMER_SCAN_LEASE_REPLAY_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_private_scan_replay_no_delete_v0
BEFORE DELETE ON customer_private_scan_lease_replay_v0
BEGIN SELECT RAISE(ABORT,'CUSTOMER_SCAN_LEASE_REPLAY_IMMUTABLE'); END;
