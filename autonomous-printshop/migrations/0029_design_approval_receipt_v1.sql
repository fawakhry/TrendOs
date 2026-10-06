-- Autonomous Printshop Structured Design Approval Receipt V1
-- Additive append-only source receipts. A receipt alone never grants READY.

CREATE TABLE IF NOT EXISTS autonomous_design_approval_receipts (
  receipt_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
  actor_kind TEXT NOT NULL CHECK(actor_kind IN ('CUSTOMER','OWNER')),
  source_kind TEXT NOT NULL CHECK(source_kind IN (
    'CUSTOMER_PORTAL_STRUCTURED',
    'OWNER_CONSOLE_STRUCTURED',
    'VERIFIED_IMPORT'
  )),
  source_ref TEXT NOT NULL,
  source_version TEXT NOT NULL DEFAULT '',
  subject_sha256 TEXT NOT NULL,
  receipt_sha256 TEXT NOT NULL,
  observed_at_ms INTEGER NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(length(trim(artifact_id))>0),
  CHECK(length(trim(line_id))>0),
  CHECK(length(trim(source_ref))>0),
  CHECK(length(subject_sha256)=64),
  CHECK(length(receipt_sha256)=64)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_approval_receipts_artifact_time
ON autonomous_design_approval_receipts(artifact_id, observed_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_approval_receipts_line_time
ON autonomous_design_approval_receipts(line_id, observed_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_receipts_no_update
BEFORE UPDATE ON autonomous_design_approval_receipts
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_RECEIPTS_APPEND_ONLY'); END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_receipts_no_delete
BEFORE DELETE ON autonomous_design_approval_receipts
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_RECEIPTS_APPEND_ONLY'); END;
