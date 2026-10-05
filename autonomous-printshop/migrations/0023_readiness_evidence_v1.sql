-- Autonomous Printshop Readiness Evidence V1
-- Additive/default-OFF foundation. Applying schema does not block or assign work.

CREATE TABLE IF NOT EXISTS autonomous_readiness_control (
  singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  canary_operator_id TEXT,
  require_design INTEGER NOT NULL DEFAULT 1 CHECK(require_design IN (0,1)),
  require_material INTEGER NOT NULL DEFAULT 1 CHECK(require_material IN (0,1)),
  require_machine INTEGER NOT NULL DEFAULT 1 CHECK(require_machine IN (0,1)),
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO autonomous_readiness_control (
  singleton_id,mode,canary_operator_id,
  require_design,require_material,require_machine,
  epoch,updated_by,change_reason
) VALUES (
  1,'OFF',NULL,1,1,1,1,'bootstrap','INITIAL_OFF'
);

CREATE TABLE IF NOT EXISTS autonomous_readiness_evidence (
  evidence_id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL,
  evidence_kind TEXT NOT NULL CHECK(evidence_kind IN ('DESIGN','MATERIAL','MACHINE')),
  evidence_state TEXT NOT NULL CHECK(evidence_state IN ('READY','BLOCKED','UNKNOWN')),
  source_kind TEXT NOT NULL CHECK(source_kind IN (
    'DESIGN_PREFLIGHT','MATERIAL_LEDGER','MACHINE_AGENT','OPERATOR',
    'TRENDOS_LEGACY','SYSTEM'
  )),
  source_ref TEXT NOT NULL DEFAULT '',
  source_version TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1 CHECK(confidence>=0 AND confidence<=1),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  observed_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(expires_at_ms IS NULL OR expires_at_ms>observed_at_ms)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_readiness_line_kind_time
ON autonomous_readiness_evidence(line_id,evidence_kind,observed_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_readiness_expiry
ON autonomous_readiness_evidence(expires_at_ms);

CREATE TABLE IF NOT EXISTS autonomous_readiness_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomous_readiness_control_events_created
ON autonomous_readiness_control_events(created_at);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_readiness_control_audit
AFTER UPDATE OF mode,canary_operator_id,require_design,require_material,require_machine,epoch,updated_by,change_reason
ON autonomous_readiness_control
BEGIN
  INSERT INTO autonomous_readiness_control_events (
    control_event_id,from_mode,to_mode,from_epoch,to_epoch,actor_id,reason
  ) VALUES (
    'readiness-control-' || lower(hex(randomblob(16))),
    OLD.mode,NEW.mode,OLD.epoch,NEW.epoch,NEW.updated_by,NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_readiness_evidence_no_update
BEFORE UPDATE ON autonomous_readiness_evidence
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_READINESS_EVIDENCE_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_readiness_evidence_no_delete
BEFORE DELETE ON autonomous_readiness_evidence
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_READINESS_EVIDENCE_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_readiness_control_events_no_update
BEFORE UPDATE ON autonomous_readiness_control_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_READINESS_CONTROL_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_readiness_control_events_no_delete
BEFORE DELETE ON autonomous_readiness_control_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_READINESS_CONTROL_EVENTS_APPEND_ONLY');
END;
