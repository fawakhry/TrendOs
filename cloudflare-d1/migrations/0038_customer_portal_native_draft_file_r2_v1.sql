-- Entry666 — SOURCE ONLY. No live migration or R2 bucket binding exists.
-- Private customer draft staging ONLY, never public URLs or print machine file.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customer_portal_native_draft_files_v1 (
  file_id TEXT PRIMARY KEY NOT NULL
    CHECK (length(file_id)=36 AND substr(file_id,1,4)='CDF-'
      AND substr(file_id,5) NOT GLOB '*[^0-9a-f]*'),
  draft_id TEXT NOT NULL
    REFERENCES customer_portal_native_drafts_v1(draft_id) ON DELETE RESTRICT,
  item_id TEXT NOT NULL
    REFERENCES customer_portal_native_draft_items_v1(item_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE
    CHECK (length(request_key)=32 AND request_key NOT GLOB '*[^0-9a-f]*'),
  sha256_hex TEXT NOT NULL
    CHECK (length(sha256_hex)=64 AND sha256_hex NOT GLOB '*[^0-9a-f]*'),
  content_type TEXT NOT NULL
    CHECK (content_type IN ('image/jpeg','image/png','application/pdf')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  r2_object_key TEXT NOT NULL UNIQUE
    CHECK (length(r2_object_key)=52 AND substr(r2_object_key,1,16)='customer-drafts/'
      AND substr(r2_object_key,17,4)='CDF-'
      AND substr(r2_object_key,21) NOT GLOB '*[^0-9a-f]*'),
  state TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING','READY')),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms>0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms>=created_at_ms),
  UNIQUE(item_id,request_key)
);
CREATE INDEX IF NOT EXISTS idx_customer_portal_native_draft_files_item_v1
 ON customer_portal_native_draft_files_v1(item_id,state);
CREATE INDEX IF NOT EXISTS idx_customer_portal_native_draft_files_draft_v1
 ON customer_portal_native_draft_files_v1(draft_id,customer_id);
