-- Entry682 — OFF / additive staged customer draft immutable seal.
-- This protects draft staging records ONLY; not an official order, payment,
-- finance writer, print job, live D1 migration approval or Google cutover.
-- Do not apply to production without owner-approved independent stage.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customer_portal_native_draft_seals_v1 (
  draft_id TEXT PRIMARY KEY NOT NULL
    REFERENCES customer_portal_native_drafts_v1(draft_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  t12_request_key TEXT NOT NULL UNIQUE,
  snapshot_json TEXT NOT NULL
    CHECK(json_valid(snapshot_json) AND length(snapshot_json) BETWEEN 10 AND 131072),
  sealed_at_ms INTEGER NOT NULL CHECK(sealed_at_ms>1500000000000),
  stage TEXT NOT NULL DEFAULT 'SEALED' CHECK(stage='SEALED'),
  -- Caller has no ability to set "COMMITTED": only canonical T12 ledger can.
  CHECK(t12_request_key GLOB 'cld1_*')
);
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_insert_item_v1
BEFORE INSERT ON customer_portal_native_draft_items_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=NEW.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_update_item_v1
BEFORE UPDATE ON customer_portal_native_draft_items_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id OR s.draft_id=NEW.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_delete_item_v1
BEFORE DELETE ON customer_portal_native_draft_items_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_insert_file_v1
BEFORE INSERT ON customer_portal_native_draft_files_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=NEW.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_update_file_v1
BEFORE UPDATE ON customer_portal_native_draft_files_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id OR s.draft_id=NEW.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_delete_file_v1
BEFORE DELETE ON customer_portal_native_draft_files_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_update_draft_v1
BEFORE UPDATE ON customer_portal_native_drafts_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id OR s.draft_id=NEW.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_delete_draft_v1
BEFORE DELETE ON customer_portal_native_drafts_v1
WHEN EXISTS(SELECT 1 FROM customer_portal_native_draft_seals_v1 s
            WHERE s.draft_id=OLD.draft_id)
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_update_seal_v1
BEFORE UPDATE ON customer_portal_native_draft_seals_v1
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEAL_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS trg_customer_draft_seal_no_delete_seal_v1
BEFORE DELETE ON customer_portal_native_draft_seals_v1
BEGIN SELECT RAISE(ABORT,'CUSTOMER_DRAFT_SEAL_IMMUTABLE'); END;
