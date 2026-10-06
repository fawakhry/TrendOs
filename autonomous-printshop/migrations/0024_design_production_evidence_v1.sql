-- Autonomous Printshop Design Production Evidence V1
-- Additive/default-OFF foundation.
-- A saved asset is never equivalent to production approval.

CREATE TABLE IF NOT EXISTS autonomous_design_control (
  singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  canary_line_id TEXT,
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO autonomous_design_control (
  singleton_id,mode,canary_line_id,epoch,updated_by,change_reason
) VALUES (1,'OFF',NULL,1,'bootstrap','INITIAL_OFF');

CREATE TABLE IF NOT EXISTS autonomous_design_artifacts (
  artifact_id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL,
  case_id TEXT NOT NULL DEFAULT '',
  version_id TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT '',
  content_sha256 TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT '',
  storage_ref TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  width_mm REAL,
  height_mm REAL,
  dpi REAL,
  source_kind TEXT NOT NULL CHECK(source_kind IN (
    'MATBAGY_CASE','DESIGN_RECIPE','CUSTOMER_UPLOAD','GENERATED','SYSTEM'
  )),
  source_ref TEXT NOT NULL DEFAULT '',
  supersedes_artifact_id TEXT,
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(line_id,content_sha256),
  CHECK(length(content_sha256)=64),
  CHECK(width_mm IS NULL OR width_mm>0),
  CHECK(height_mm IS NULL OR height_mm>0),
  CHECK(dpi IS NULL OR dpi>0)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_artifacts_line_time
ON autonomous_design_artifacts(line_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_design_approval_events (
  approval_event_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES autonomous_design_artifacts(artifact_id),
  line_id TEXT NOT NULL,
  approval_gate TEXT NOT NULL CHECK(approval_gate IN ('REQUIRED','NOT_REQUIRED_BY_POLICY')),
  approval_state TEXT NOT NULL CHECK(approval_state IN (
    'CUSTOMER_APPROVED','OWNER_APPROVED','POLICY_APPROVED',
    'REJECTED','NOT_CONFIRMED'
  )),
  evidence_ref TEXT NOT NULL DEFAULT '',
  policy_ref TEXT NOT NULL DEFAULT '',
  actor_kind TEXT NOT NULL CHECK(actor_kind IN ('CUSTOMER','OWNER','SYSTEM_POLICY','IMPORT')),
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_approval_artifact_time
ON autonomous_design_approval_events(artifact_id,observed_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_design_preflight_runs (
  preflight_run_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES autonomous_design_artifacts(artifact_id),
  line_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL','UNKNOWN')),
  recipe_id TEXT NOT NULL DEFAULT '',
  policy_version TEXT NOT NULL DEFAULT 'v1',
  checks_json TEXT NOT NULL DEFAULT '{}',
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomous_design_preflight_artifact_time
ON autonomous_design_preflight_runs(artifact_id,observed_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_design_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_control_audit
AFTER UPDATE OF mode,canary_line_id,epoch,updated_by,change_reason
ON autonomous_design_control
BEGIN
  INSERT INTO autonomous_design_control_events (
    control_event_id,from_mode,to_mode,from_epoch,to_epoch,actor_id,reason
  ) VALUES (
    'design-control-' || lower(hex(randomblob(16))),
    OLD.mode,NEW.mode,OLD.epoch,NEW.epoch,NEW.updated_by,NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_artifacts_no_update
BEFORE UPDATE ON autonomous_design_artifacts
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_ARTIFACTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_artifacts_no_delete
BEFORE DELETE ON autonomous_design_artifacts
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_ARTIFACTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_no_update
BEFORE UPDATE ON autonomous_design_approval_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_approval_no_delete
BEFORE DELETE ON autonomous_design_approval_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_APPROVAL_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_preflight_no_update
BEFORE UPDATE ON autonomous_design_preflight_runs
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_PREFLIGHT_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_design_preflight_no_delete
BEFORE DELETE ON autonomous_design_preflight_runs
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_DESIGN_PREFLIGHT_APPEND_ONLY');
END;
