PRAGMA foreign_keys = ON;

-- Entry614 Zero-Google customer communications / feedback / go-live domain.
-- Additive only; authority remains OFF until explicit family cutover.
CREATE TABLE IF NOT EXISTS employee_comms_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_EMPLOYEE_COMMS_V1'),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','READONLY','GENERAL')),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  feedback_enabled_at_ms INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_comms_control_v1
(singleton,marker,mode,policy_epoch,feedback_enabled_at_ms)
VALUES(1,'ENTRY614_EMPLOYEE_COMMS_V1','OFF',1,0);

CREATE TABLE IF NOT EXISTS employee_feedback_requests_v1 (
  feedback_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  delivered_at_ms INTEGER NOT NULL,
  requested_at_ms INTEGER NOT NULL,
  request_status TEXT NOT NULL DEFAULT 'Pending',
  rating INTEGER CHECK(rating IS NULL OR (rating>=1 AND rating<=5)),
  customer_note TEXT NOT NULL DEFAULT '',
  replied_at_ms INTEGER,
  needs_followup INTEGER NOT NULL DEFAULT 0 CHECK(needs_followup IN (0,1)),
  followup_status TEXT NOT NULL DEFAULT '',
  followup_owner TEXT NOT NULL DEFAULT '',
  meta_message_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_phone
ON employee_feedback_requests_v1(phone,requested_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_followup
ON employee_feedback_requests_v1(needs_followup,updated_at DESC);

CREATE TABLE IF NOT EXISTS employee_go_live_drafts_v1 (
  draft_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  order_status TEXT NOT NULL DEFAULT '',
  proposed_total REAL NOT NULL DEFAULT 0,
  proposed_paid REAL NOT NULL DEFAULT 0,
  proposed_remaining REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '',
  blocker TEXT NOT NULL DEFAULT '',
  accounting_line_ids_json TEXT NOT NULL DEFAULT '[]',
  invoice_no TEXT NOT NULL DEFAULT '',
  final_total REAL NOT NULL DEFAULT 0,
  final_remaining REAL NOT NULL DEFAULT 0,
  message_status TEXT NOT NULL DEFAULT '',
  meta_message_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_go_live_status
ON employee_go_live_drafts_v1(status,updated_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_order_conversation_files_v1 (
  file_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL DEFAULT '',
  message_id TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  public_url TEXT NOT NULL DEFAULT '',
  visible_to_customer INTEGER NOT NULL DEFAULT 1 CHECK(visible_to_customer IN (0,1)),
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_order_conv_files_order
ON employee_order_conversation_files_v1(order_id,line_id,created_at DESC);

CREATE TABLE IF NOT EXISTS employee_comms_events_v1 (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_comms_events_entity
ON employee_comms_events_v1(domain,entity_id,created_at_ms DESC);
