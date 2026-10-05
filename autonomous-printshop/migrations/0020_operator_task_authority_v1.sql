-- Autonomous Printshop Operator Task Authority V1
-- Repo-only candidate. Default OFF. Applying schema alone must not assign or mutate work.

CREATE TABLE IF NOT EXISTS operator_task_control (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK (mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  canary_operator_id TEXT,
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO operator_task_control (
  singleton_id, mode, canary_operator_id, epoch, updated_by, change_reason
) VALUES (1, 'OFF', NULL, 1, 'bootstrap', 'INITIAL_OFF');

CREATE TABLE IF NOT EXISTS operator_tasks (
  task_id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL DEFAULT 'ORDINARY' CHECK (task_type IN ('ORDINARY','PRESS_BATCH','EXCEPTION')),
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  department TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED','FAILED','SUPERSEDED')),

  priority_snapshot TEXT NOT NULL DEFAULT '',
  due_at_snapshot TEXT,
  source_data_version TEXT NOT NULL DEFAULT '',
  source_input_hash TEXT NOT NULL DEFAULT '',

  claim_idempotency_key TEXT NOT NULL UNIQUE,
  completion_idempotency_key TEXT UNIQUE,

  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at TEXT,
  completion_result_json TEXT,

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- One active ordinary task per operator.
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_tasks_one_active_operator
  ON operator_tasks(operator_id)
  WHERE task_type = 'ORDINARY' AND status = 'ACTIVE';

-- A line cannot be actively owned by two ordinary tasks.
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_tasks_one_active_line
  ON operator_tasks(line_id)
  WHERE task_type = 'ORDINARY' AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_operator_tasks_operator_status
  ON operator_tasks(operator_id, status, started_at);

CREATE INDEX IF NOT EXISTS idx_operator_tasks_order_line
  ON operator_tasks(order_id, line_id, created_at);

CREATE TABLE IF NOT EXISTS operator_task_events (
  event_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('CLAIMED','COMPLETED','CANCELLED','FAILED','SUPERSEDED','EXCEPTION_REPORTED')
  ),
  actor_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  event_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (task_id) REFERENCES operator_tasks(task_id)
);

CREATE INDEX IF NOT EXISTS idx_operator_task_events_task
  ON operator_task_events(task_id, created_at);

CREATE TABLE IF NOT EXISTS operator_task_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_canary_operator_id TEXT,
  to_canary_operator_id TEXT,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_operator_task_control_events_created
  ON operator_task_control_events(created_at);

CREATE TRIGGER IF NOT EXISTS trg_operator_task_control_audit
AFTER UPDATE OF mode, canary_operator_id, epoch, updated_by, change_reason
ON operator_task_control
BEGIN
  INSERT INTO operator_task_control_events (
    control_event_id,
    from_mode, to_mode,
    from_canary_operator_id, to_canary_operator_id,
    from_epoch, to_epoch,
    actor_id, reason
  ) VALUES (
    'operator-task-control-' || lower(hex(randomblob(16))),
    OLD.mode, NEW.mode,
    OLD.canary_operator_id, NEW.canary_operator_id,
    OLD.epoch, NEW.epoch,
    NEW.updated_by, NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_operator_task_events_no_update
BEFORE UPDATE ON operator_task_events
BEGIN
  SELECT RAISE(ABORT, 'OPERATOR_TASK_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_operator_task_events_no_delete
BEFORE DELETE ON operator_task_events
BEGIN
  SELECT RAISE(ABORT, 'OPERATOR_TASK_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_operator_task_control_events_no_update
BEFORE UPDATE ON operator_task_control_events
BEGIN
  SELECT RAISE(ABORT, 'OPERATOR_TASK_CONTROL_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_operator_task_control_events_no_delete
BEFORE DELETE ON operator_task_control_events
BEGIN
  SELECT RAISE(ABORT, 'OPERATOR_TASK_CONTROL_EVENTS_APPEND_ONLY');
END;
