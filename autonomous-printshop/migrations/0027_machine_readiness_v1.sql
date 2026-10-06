-- Autonomous Printshop Machine Readiness V1
-- Default-OFF machine registry + append-only observations/mapping.
-- No production dispatch authority.

CREATE TABLE IF NOT EXISTS autonomous_machine_control (
  singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO autonomous_machine_control(singleton_id,mode,epoch,updated_by,change_reason)
VALUES(1,'OFF',1,'bootstrap','INITIAL_OFF');

CREATE TABLE IF NOT EXISTS autonomous_machines (
  machine_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  machine_class TEXT NOT NULL,
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS autonomous_machine_observations (
  observation_id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES autonomous_machines(machine_id),
  machine_state TEXT NOT NULL CHECK(machine_state IN ('READY','BLOCKED','MAINTENANCE','UNKNOWN')),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('SENSOR','OPERATOR_CHECK','SELF_TEST','MAINTENANCE','SYSTEM')),
  source_ref TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1 CHECK(confidence>=0 AND confidence<=1),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  observed_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(expires_at_ms>observed_at_ms)
);
CREATE INDEX IF NOT EXISTS idx_autonomous_machine_observation_time
ON autonomous_machine_observations(machine_id,observed_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_line_machine_mapping_events (
  mapping_event_id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL,
  machine_id TEXT NOT NULL REFERENCES autonomous_machines(machine_id),
  mapping_state TEXT NOT NULL CHECK(mapping_state IN ('ACTIVE','REMOVED')),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('SCHEDULER','OPERATOR','SYSTEM_POLICY','IMPORT')),
  source_ref TEXT NOT NULL DEFAULT '',
  observed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_autonomous_line_machine_mapping_time
ON autonomous_line_machine_mapping_events(line_id,observed_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_machine_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_control_audit
AFTER UPDATE OF mode,epoch,updated_by,change_reason
ON autonomous_machine_control
BEGIN
  INSERT INTO autonomous_machine_control_events(
    control_event_id,from_mode,to_mode,from_epoch,to_epoch,actor_id,reason
  ) VALUES (
    'machine-control-'||lower(hex(randomblob(16))),
    OLD.mode,NEW.mode,OLD.epoch,NEW.epoch,NEW.updated_by,NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_observations_no_update
BEFORE UPDATE ON autonomous_machine_observations
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_OBSERVATIONS_APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_observations_no_delete
BEFORE DELETE ON autonomous_machine_observations
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_OBSERVATIONS_APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_mapping_no_update
BEFORE UPDATE ON autonomous_line_machine_mapping_events
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_MAPPING_APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS trg_autonomous_machine_mapping_no_delete
BEFORE DELETE ON autonomous_line_machine_mapping_events
BEGIN SELECT RAISE(ABORT,'AUTONOMOUS_MACHINE_MAPPING_APPEND_ONLY'); END;
