PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cloud_write_events (
  idempotency_key TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'd1_committed',
  actor TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  sheets_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_cloud_write_events_entity
  ON cloud_write_events(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_write_events_sheets_status
  ON cloud_write_events(sheets_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS cloud_write_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_key) REFERENCES cloud_write_events(idempotency_key) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_write_outbox_event_unique
  ON cloud_write_outbox(event_key, operation);

CREATE INDEX IF NOT EXISTS idx_cloud_write_outbox_pending
  ON cloud_write_outbox(status, next_attempt_at, id);
