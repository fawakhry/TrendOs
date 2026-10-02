PRAGMA foreign_keys = ON;

-- T12 legacy-line operational runtime overlay.
-- Additive only. This table never rewrites the historical sheet_rows snapshot.
-- It layers current Cloud operational state over legacy mirror identities.
CREATE TABLE IF NOT EXISTS t12_legacy_line_runtime (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN (
    'طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام',
    'تم التسليم','متوقف','مكرر','ملغى'
  )),
  notes TEXT NOT NULL DEFAULT '',
  source_row_number INTEGER NOT NULL DEFAULT 0,
  source_mirror_synced_at TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL,
  update_source TEXT NOT NULL DEFAULT 'runtime'
    CHECK(update_source IN ('runtime','verified-reconciliation')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_t12_legacy_runtime_order_line
ON t12_legacy_line_runtime(order_id,line_id);

CREATE INDEX IF NOT EXISTS idx_t12_legacy_runtime_order_updated
ON t12_legacy_line_runtime(order_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS t12_legacy_line_runtime_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  old_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  source_row_number INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_t12_legacy_runtime_events_line
ON t12_legacy_line_runtime_events(line_id,created_at DESC);
