-- Zero Google customer PRIVATE file QUARANTINE ledger, SOURCE ONLY / NO LIVE APPLY.
-- This additive D1-safe schema preserves untrusted file origin and makes
-- quarantine sticky. READY R2 != scanned, trusted, or printable.
-- No customer/file/employee/finance/T12 production writes are authorized.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS customer_portal_native_file_quarantine_v1 (
  file_id TEXT PRIMARY KEY NOT NULL
    REFERENCES customer_portal_native_draft_files_v1(file_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  draft_id TEXT NOT NULL
    REFERENCES customer_portal_native_drafts_v1(draft_id) ON DELETE RESTRICT,
  item_id TEXT NOT NULL
    REFERENCES customer_portal_native_draft_items_v1(item_id) ON DELETE RESTRICT,
  sha256_hex TEXT NOT NULL
    CHECK(length(sha256_hex)=64 AND sha256_hex NOT GLOB '*[^0-9a-f]*'),
  byte_size INTEGER NOT NULL CHECK(byte_size BETWEEN 8 AND 5242880),
  content_type TEXT NOT NULL
    CHECK(content_type IN ('image/png','image/jpeg','application/pdf')),
  disposition TEXT NOT NULL DEFAULT 'QUARANTINED'
    CHECK(disposition='QUARANTINED'),
  scan_completed INTEGER NOT NULL DEFAULT 0 CHECK(scan_completed=0),
  print_release_authorized INTEGER NOT NULL DEFAULT 0
    CHECK(print_release_authorized=0),
  created_at_ms INTEGER NOT NULL CHECK(created_at_ms>0)
);
CREATE INDEX IF NOT EXISTS idx_customer_native_quarantine_draft_v1
 ON customer_portal_native_file_quarantine_v1(draft_id,customer_id);

-- Backfill for pre-migration private staging; no object is trusted.
INSERT OR IGNORE INTO customer_portal_native_file_quarantine_v1
 (file_id,customer_id,draft_id,item_id,sha256_hex,byte_size,content_type,
  disposition,scan_completed,print_release_authorized,created_at_ms)
SELECT file_id,customer_id,draft_id,item_id,sha256_hex,byte_size,
       content_type,'QUARANTINED',0,0,created_at_ms
 FROM customer_portal_native_draft_files_v1;

-- Every NEW R2 staging reservation gets a quarantine record atomically,
-- even if its future private object write fails and state remains PENDING.
CREATE TRIGGER IF NOT EXISTS trg_customer_native_file_quarantine_insert_v1
AFTER INSERT ON customer_portal_native_draft_files_v1
BEGIN
  INSERT INTO customer_portal_native_file_quarantine_v1
   (file_id,customer_id,draft_id,item_id,sha256_hex,byte_size,content_type,
    disposition,scan_completed,print_release_authorized,created_at_ms)
  VALUES(NEW.file_id,NEW.customer_id,NEW.draft_id,NEW.item_id,
    NEW.sha256_hex,NEW.byte_size,NEW.content_type,'QUARANTINED',0,0,
    NEW.created_at_ms);
END;

-- D1 cannot silently relabel a quarantined file as clean/released by UPDATE
-- or delete the quarantine trail. A FUTURE scanner requires its own separate
-- owner-approved attestation migration with cryptographic source identity.
CREATE TRIGGER IF NOT EXISTS trg_customer_native_quarantine_no_update_v1
BEFORE UPDATE ON customer_portal_native_file_quarantine_v1
BEGIN SELECT RAISE(ABORT,'CUSTOMER_FILE_QUARANTINE_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_native_quarantine_no_delete_v1
BEFORE DELETE ON customer_portal_native_file_quarantine_v1
BEGIN SELECT RAISE(ABORT,'CUSTOMER_FILE_QUARANTINE_IMMUTABLE'); END;

-- Keep original staged object hash/ownership/scope immutable after reserve.
-- PENDING->READY may update only state and updated_at_ms as before.
CREATE TRIGGER IF NOT EXISTS trg_customer_native_file_scope_no_update_v1
BEFORE UPDATE OF file_id,customer_id,draft_id,item_id,request_key,
 sha256_hex,byte_size,content_type,r2_object_key,created_at_ms
 ON customer_portal_native_draft_files_v1
BEGIN SELECT RAISE(ABORT,'CUSTOMER_FILE_SOURCE_METADATA_IMMUTABLE'); END;
