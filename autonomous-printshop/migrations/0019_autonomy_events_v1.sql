-- TrendOS Autonomy Events V1
-- Repo-only migration candidate. Applying this migration does not enable Autopilot.
-- Control row is fail-closed OFF.

CREATE TABLE IF NOT EXISTS autonomy_control (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK (mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  policy_version TEXT NOT NULL DEFAULT 'v1',
  min_confidence REAL NOT NULL DEFAULT 0.92,
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO autonomy_control (
  singleton_id, mode, policy_version, min_confidence, epoch
) VALUES (1, 'OFF', 'v1', 0.92, 1);

CREATE TABLE IF NOT EXISTS autonomy_events (
  event_id TEXT PRIMARY KEY,
  task_family TEXT NOT NULL,
  task_key TEXT NOT NULL,
  order_id TEXT,
  line_id TEXT,
  actor_kind TEXT NOT NULL DEFAULT 'AI',
  decision TEXT NOT NULL CHECK (decision IN ('AI_AUTO','HUMAN_PHYSICAL','HUMAN_EXCEPTION','OWNER_ONLY','BLOCKED')),
  reason TEXT NOT NULL,
  target_queue TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0,
  policy_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'SHADOW_ONLY' CHECK (
    execution_status IN ('SHADOW_ONLY','PENDING','EXECUTED','FAILED','CANCELLED','SUPERSEDED')
  ),
  execution_ref TEXT,
  observed_human_action TEXT,
  matched_human_action INTEGER CHECK (matched_human_action IN (0,1) OR matched_human_action IS NULL),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_events_task_hash
  ON autonomy_events(task_key, input_hash, policy_version);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_created
  ON autonomy_events(created_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_order
  ON autonomy_events(order_id, created_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_decision
  ON autonomy_events(decision, execution_status, created_at);

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
