-- Autonomous Printshop Design Asset Binding V1
-- Storage-agnostic append-only asset linkage.
-- No Google-specific assumptions.

CREATE TABLE IF NOT EXISTS autonomous_design_asset_binding_events (
  binding_event_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'TENANT_001',
  binding_status TEXT NOT NULL CHECK(binding_status IN (
    'LINKED','PENDING_UPLOAD','MISSING','REMOVED'
  )),
  privacy_class TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK(privacy_class IN (
    'PUBLIC_SAFE','CUSTOMER_PRIVATE','UNKNOWN'
  )),
  storage_provider TEXT NOT NULL DEFAULT '',
  storage_ref TEXT NOT NULL DEFAULT '',
  source_asset_id TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(
    binding_status <> 'LINKED'
    OR (length(trim(storage_provider))>0 AND length(trim(storage_ref))>0)
  ),
  CHECK(
    NOT (
      privacy_class='CUSTOMER_PRIVATE'
      AND upper(trim(storage_provider)) IN ('GITHUB_PUBLIC','PUBLIC_GIT','PUBLIC_URL')
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_asset_binding_artifact_time
ON autonomous_design_asset_binding_events(artifact_id,observed_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_asset_binding_tenant_time
ON autonomous_design_asset_binding_events(tenant_id,observed_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_asset_binding_no_update
BEFORE UPDATE ON autonomous_design_asset_binding_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_ASSET_BINDING_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_asset_binding_no_delete
BEFORE DELETE ON autonomous_design_asset_binding_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_ASSET_BINDING_APPEND_ONLY');
END;
