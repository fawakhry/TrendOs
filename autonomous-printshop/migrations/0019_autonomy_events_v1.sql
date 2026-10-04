-- Autonomous Printshop Autonomy Events V1
-- Repo-only migration candidate. Applying this migration does not enable Autopilot.
-- Control row is fail-closed OFF.
--
-- Design invariants:
-- 1) autonomy_events = immutable decision facts only.
-- 2) later human/runtime observations live in autonomy_observations.
-- 3) actual policy decision and recommended decision are both persisted.
-- 4) autonomy_control changes are automatically audit-logged.
-- 5) all evidence/history tables are append-only.

CREATE TABLE IF NOT EXISTS autonomy_control (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK (mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  policy_version TEXT NOT NULL DEFAULT 'v1',
  min_confidence REAL NOT NULL DEFAULT 0.92,
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO autonomy_control (
  singleton_id, mode, policy_version, min_confidence, epoch, updated_by, change_reason
) VALUES (1, 'OFF', 'v1', 0.92, 1, 'bootstrap', 'INITIAL_OFF');

CREATE TABLE IF NOT EXISTS autonomy_events (
  event_id TEXT PRIMARY KEY,
  task_family TEXT NOT NULL,
  task_key TEXT NOT NULL,
  order_id TEXT,
  line_id TEXT,
  actor_kind TEXT NOT NULL DEFAULT 'AI',

  decision TEXT NOT NULL CHECK (
    decision IN ('AI_AUTO','HUMAN_PHYSICAL','HUMAN_EXCEPTION','OWNER_ONLY','BLOCKED')
  ),
  reason TEXT NOT NULL,
  target_queue TEXT NOT NULL,

  recommended_decision TEXT NOT NULL CHECK (
    recommended_decision IN ('AI_AUTO','HUMAN_PHYSICAL','HUMAN_EXCEPTION','OWNER_ONLY','BLOCKED')
  ),
  recommended_reason TEXT NOT NULL,
  recommended_target_queue TEXT NOT NULL,

  confidence REAL NOT NULL DEFAULT 0,
  policy_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,

  execution_status TEXT NOT NULL DEFAULT 'SHADOW_ONLY' CHECK (
    execution_status IN ('SHADOW_ONLY','PENDING','EXECUTED','FAILED','CANCELLED','SUPERSEDED')
  ),
  execution_ref TEXT,

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_events_task_hash
  ON autonomy_events(task_key, input_hash, policy_version);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_created
  ON autonomy_events(created_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_order
  ON autonomy_events(order_id, created_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_decision
  ON autonomy_events(decision, recommended_decision, execution_status, created_at);

CREATE TABLE IF NOT EXISTS autonomy_observations (
  observation_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  observer_kind TEXT NOT NULL DEFAULT 'HUMAN',
  observer_id TEXT,
  observed_action TEXT NOT NULL,
  matched_recommendation INTEGER CHECK (matched_recommendation IN (0,1) OR matched_recommendation IS NULL),
  outcome TEXT,
  evidence_json TEXT,
  observed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (event_id) REFERENCES autonomy_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_autonomy_observations_event
  ON autonomy_observations(event_id, observed_at);

CREATE TABLE IF NOT EXISTS autonomy_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_policy_version TEXT,
  to_policy_version TEXT NOT NULL,
  from_min_confidence REAL,
  to_min_confidence REAL NOT NULL,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomy_control_events_created
  ON autonomy_control_events(created_at);

CREATE TRIGGER IF NOT EXISTS trg_autonomy_control_audit
AFTER UPDATE OF mode, policy_version, min_confidence, epoch, updated_by, change_reason
ON autonomy_control
BEGIN
  INSERT INTO autonomy_control_events (
    control_event_id,
    from_mode, to_mode,
    from_policy_version, to_policy_version,
    from_min_confidence, to_min_confidence,
    from_epoch, to_epoch,
    actor_id, reason
  ) VALUES (
    'autonomy-control-' || lower(hex(randomblob(16))),
    OLD.mode, NEW.mode,
    OLD.policy_version, NEW.policy_version,
    OLD.min_confidence, NEW.min_confidence,
    OLD.epoch, NEW.epoch,
    NEW.updated_by, NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_events_no_update
BEFORE UPDATE ON autonomy_events
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_events_no_delete
BEFORE DELETE ON autonomy_events
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_observations_no_update
BEFORE UPDATE ON autonomy_observations
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_OBSERVATIONS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_observations_no_delete
BEFORE DELETE ON autonomy_observations
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_OBSERVATIONS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_control_events_no_update
BEFORE UPDATE ON autonomy_control_events
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_CONTROL_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_control_events_no_delete
BEFORE DELETE ON autonomy_control_events
BEGIN
  SELECT RAISE(ABORT, 'AUTONOMY_CONTROL_EVENTS_APPEND_ONLY');
END;
