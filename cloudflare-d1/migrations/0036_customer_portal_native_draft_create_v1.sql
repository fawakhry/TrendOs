-- Entry664 — FUTURE customer draft staging only. Not an order, invoice,
-- finance request, D1 production migration authorization, or Apps Script cutover.
-- This migration is ADDITIVE and MUST NOT be run on production without
-- a separate owner-approved stage, backups and current deployed parity.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customer_portal_native_drafts_v1 (
  draft_id TEXT PRIMARY KEY NOT NULL
    CHECK (length(draft_id)=36 AND substr(draft_id,1,4)='CDR-'
      AND substr(draft_id,5) NOT GLOB '*[^0-9a-f]*'),
  customer_id TEXT NOT NULL
    REFERENCES customer_portal_native_accounts_v1(customer_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE
    CHECK (length(request_key)=32 AND request_key NOT GLOB '*[^0-9a-f]*'),
  state TEXT NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','CANCELLED','SUBMITTED')),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms>0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms>=created_at_ms),
  -- There is intentionally no order_id, price, debt, file, financial amount or
  -- background production job. A draft is NOT a confirmed production order.
  CHECK (state='DRAFT' OR state='CANCELLED' OR state='SUBMITTED')
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_native_draft_request_v1
 ON customer_portal_native_drafts_v1(request_key);
CREATE INDEX IF NOT EXISTS idx_customer_native_draft_owner_time_v1
 ON customer_portal_native_drafts_v1(customer_id,created_at_ms DESC);
