-- Autonomous Printshop Machine Identity Evidence V1
-- Additive append-only provenance for stable physical machine identity.
-- This does not register a machine by itself and grants no dispatch authority.

CREATE TABLE IF NOT EXISTS autonomous_machine_identity_events (
  identity_event_id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL,
  identity_source_kind TEXT NOT NULL CHECK(identity_source_kind IN (
    'NAMEPLATE','OWNER_ASSET_REGISTRY'
  )),
  identity_source_ref TEXT NOT NULL,
  serial_or_asset_tag TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(length(trim(machine_id))>0),
  CHECK(length(trim(identity_source_ref))>0),
  CHECK(length(trim(serial_or_asset_tag))>0)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_machine_identity_machine_time
ON autonomous_machine_identity_events(machine_id,observed_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_identity_no_update
BEFORE UPDATE ON autonomous_machine_identity_events
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_IDENTITY_APPEND_ONLY'); END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_identity_no_delete
BEFORE DELETE ON autonomous_machine_identity_events
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_IDENTITY_APPEND_ONLY'); END;
