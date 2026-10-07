-- Autonomous Printshop Employee Supervisor Blocker Events V1
-- Structured append-only Andon/blocker ledger.
-- Default OFF. Schema application alone grants no employee, order, task, or accounting authority.

CREATE TABLE IF NOT EXISTS autonomous_employee_supervisor_control (
  singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','SHADOW','CANARY','GENERAL')),
  epoch INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'bootstrap',
  change_reason TEXT NOT NULL DEFAULT 'INITIAL_OFF',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO autonomous_employee_supervisor_control(
  singleton_id,mode,epoch,updated_by,change_reason
) VALUES(1,'OFF',1,'bootstrap','INITIAL_OFF');

CREATE TABLE IF NOT EXISTS autonomous_employee_blocker_events (
  event_id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN (
    'REPORTED','ACKNOWLEDGED','RESOLVED'
  )),
  reason_code TEXT NOT NULL CHECK(reason_code IN (
    'MACHINE_BREAKDOWN',
    'MATERIAL_MISSING',
    'WAITING_CUSTOMER',
    'PRICE_OR_OWNER_DECISION',
    'QUALITY_ISSUE',
    'HELP_NEEDED'
  )),
  operator_id TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  line_id TEXT NOT NULL DEFAULT '',
  detail_text TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL CHECK(source_kind IN (
    'EMPLOYEE','SUPERVISOR','SYSTEM'
  )),
  actor_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  occurred_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(length(trim(blocker_id))>0),
  CHECK(length(trim(actor_id))>0),
  CHECK(length(trim(idempotency_key))>0),
  CHECK(length(detail_text)<=500),
  CHECK(occurred_at_ms>0)
);

CREATE INDEX IF NOT EXISTS idx_autonomous_employee_blocker_blocker_time
ON autonomous_employee_blocker_events(blocker_id,occurred_at_ms,event_id);

CREATE INDEX IF NOT EXISTS idx_autonomous_employee_blocker_operator_time
ON autonomous_employee_blocker_events(operator_id,occurred_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_employee_blocker_department_time
ON autonomous_employee_blocker_events(department,occurred_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_employee_blocker_reason_time
ON autonomous_employee_blocker_events(reason_code,occurred_at_ms DESC);

CREATE TABLE IF NOT EXISTS autonomous_employee_supervisor_control_events (
  control_event_id TEXT PRIMARY KEY,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  from_epoch INTEGER,
  to_epoch INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_autonomous_employee_supervisor_control_events_created
ON autonomous_employee_supervisor_control_events(created_at);

CREATE TRIGGER IF NOT EXISTS trg_autonomous_employee_supervisor_control_audit
AFTER UPDATE OF mode,epoch,updated_by,change_reason
ON autonomous_employee_supervisor_control
BEGIN
  INSERT INTO autonomous_employee_supervisor_control_events(
    control_event_id,from_mode,to_mode,from_epoch,to_epoch,actor_id,reason
  ) VALUES (
    'employee-supervisor-control-'||lower(hex(randomblob(16))),
    OLD.mode,NEW.mode,OLD.epoch,NEW.epoch,NEW.updated_by,NEW.change_reason
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_employee_blocker_events_no_update
BEFORE UPDATE ON autonomous_employee_blocker_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_employee_blocker_events_no_delete
BEFORE DELETE ON autonomous_employee_blocker_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_employee_supervisor_control_events_no_update
BEFORE UPDATE ON autonomous_employee_supervisor_control_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_EMPLOYEE_SUPERVISOR_CONTROL_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomous_employee_supervisor_control_events_no_delete
BEFORE DELETE ON autonomous_employee_supervisor_control_events
BEGIN
  SELECT RAISE(ABORT,'AUTONOMOUS_EMPLOYEE_SUPERVISOR_CONTROL_EVENTS_APPEND_ONLY');
END;
