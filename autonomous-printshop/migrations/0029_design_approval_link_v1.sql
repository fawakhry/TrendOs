-- Autonomous Printshop Design Approval Link V1
-- Additive/default-inert one-time approval provenance.
-- No public endpoint or approval authority is enabled by this schema.

CREATE TABLE IF NOT EXISTS autonomous_design_approval_link_offers (
  offer_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES autonomous_design_artifacts(artifact_id),
  line_id TEXT NOT NULL,
  token_sha256 TEXT NOT NULL UNIQUE,
  expires_at_ms INTEGER NOT NULL,
  source_ref TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(length(token_sha256)=64),
  CHECK(token_sha256=lower(token_sha256)),
  CHECK(token_sha256 NOT GLOB '*[^0-9a-f]*'),
  CHECK(expires_at_ms>created_at_ms)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_approval_offer_artifact
ON autonomous_design_approval_link_offers(artifact_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_design_approval_link_redemptions (
  redemption_id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL UNIQUE REFERENCES autonomous_design_approval_link_offers(offer_id),
  artifact_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
  evidence_ref TEXT NOT NULL,
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_approval_redemption_artifact
ON autonomous_design_approval_link_redemptions(artifact_id,observed_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_offer_no_update
BEFORE UPDATE ON autonomous_design_approval_link_offers
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_OFFER_APPEND_ONLY'); END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_offer_no_delete
BEFORE DELETE ON autonomous_design_approval_link_offers
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_OFFER_APPEND_ONLY'); END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_redemption_no_update
BEFORE UPDATE ON autonomous_design_approval_link_redemptions
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_REDEMPTION_APPEND_ONLY'); END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_redemption_no_delete
BEFORE DELETE ON autonomous_design_approval_link_redemptions
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_REDEMPTION_APPEND_ONLY'); END;
