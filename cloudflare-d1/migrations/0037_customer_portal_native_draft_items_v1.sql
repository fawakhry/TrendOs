-- Entry665 — additive source-only draft staging items; NEVER production
-- orders, finance, print execution, attachments or live Worker release.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customer_portal_native_draft_items_v1(
  item_id TEXT PRIMARY KEY NOT NULL
    CHECK(length(item_id)=36 AND substr(item_id,1,4)='CDI-'
      AND substr(item_id,5) NOT GLOB '*[^0-9a-f]*'),
  draft_id TEXT NOT NULL
    REFERENCES customer_portal_native_drafts_v1(draft_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE
    CHECK(length(request_key)=32 AND request_key NOT GLOB '*[^0-9a-f]*'),
  payload_mac_hex TEXT NOT NULL
    CHECK(length(payload_mac_hex)=64 AND payload_mac_hex NOT GLOB '*[^0-9a-f]*'),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 1 AND 50),
  department TEXT NOT NULL CHECK(department IN ('طباعة','ليزر')),
  item_name TEXT NOT NULL CHECK(length(trim(item_name)) BETWEEN 1 AND 120),
  qty INTEGER NOT NULL CHECK(qty BETWEEN 1 AND 99),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
  heat_press INTEGER NOT NULL DEFAULT 0 CHECK(heat_press IN (0,1)),
  fly_print INTEGER NOT NULL DEFAULT 0 CHECK(fly_print IN (0,1)),
  created_at_ms INTEGER NOT NULL CHECK(created_at_ms>0),
  CHECK(department='طباعة' OR (heat_press=0 AND fly_print=0)),
  UNIQUE(draft_id,ordinal)
);
CREATE INDEX IF NOT EXISTS idx_customer_native_draft_item_order_v1
 ON customer_portal_native_draft_items_v1(draft_id,ordinal);
