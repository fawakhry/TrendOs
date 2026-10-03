PRAGMA foreign_keys = ON;

-- Entry615 current-data backfill retention/parity metadata.
-- Additive only; no runtime route depends on these tables.
CREATE TABLE IF NOT EXISTS employee_zero_google_backfill_runs_v1 (
  run_id TEXT PRIMARY KEY,
  source_label TEXT NOT NULL DEFAULT '',
  source_spreadsheet_id TEXT NOT NULL DEFAULT '',
  source_snapshot_sha256 TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL CHECK(mode IN ('PREVIEW','APPLY')),
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED','FAILED')),
  source_counts_json TEXT NOT NULL DEFAULT '{}',
  target_counts_json TEXT NOT NULL DEFAULT '{}',
  dedupe_counts_json TEXT NOT NULL DEFAULT '{}',
  parity_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS employee_zero_google_legacy_rows_v1 (
  snapshot_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL DEFAULT '',
  source_sheet TEXT NOT NULL,
  source_row INTEGER NOT NULL,
  natural_key TEXT NOT NULL DEFAULT '',
  disposition TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  row_json TEXT NOT NULL DEFAULT '{}',
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_sheet,source_row)
);
CREATE INDEX IF NOT EXISTS idx_employee_zero_google_legacy_sheet
ON employee_zero_google_legacy_rows_v1(source_sheet,disposition,source_row);

CREATE TABLE IF NOT EXISTS employee_zero_google_parity_v1 (
  run_id TEXT NOT NULL,
  family TEXT NOT NULL,
  metric TEXT NOT NULL,
  source_value TEXT NOT NULL DEFAULT '',
  target_value TEXT NOT NULL DEFAULT '',
  pass INTEGER NOT NULL DEFAULT 0 CHECK(pass IN (0,1)),
  details_json TEXT NOT NULL DEFAULT '{}',
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(run_id,family,metric)
);
CREATE INDEX IF NOT EXISTS idx_employee_zero_google_parity_pass
ON employee_zero_google_parity_v1(run_id,pass,family);
