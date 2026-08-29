PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sheet_catalog (
  sheet_name TEXT PRIMARY KEY,
  sheet_id TEXT NOT NULL DEFAULT '',
  headers_json TEXT NOT NULL DEFAULT '[]',
  source_last_row INTEGER NOT NULL DEFAULT 0,
  source_last_col INTEGER NOT NULL DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready',
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sheet_catalog_status
  ON sheet_catalog(status, synced_at DESC);

CREATE TABLE IF NOT EXISTS sheet_rows (
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  values_json TEXT NOT NULL DEFAULT '[]',
  display_json TEXT NOT NULL DEFAULT '[]',
  formulas_json TEXT NOT NULL DEFAULT '[]',
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sheet_name, row_number),
  FOREIGN KEY (sheet_name) REFERENCES sheet_catalog(sheet_name) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_row
  ON sheet_rows(sheet_name, row_number);

CREATE TABLE IF NOT EXISTS sheet_migration_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sheet_name TEXT NOT NULL,
  source_last_row INTEGER NOT NULL DEFAULT 0,
  source_last_col INTEGER NOT NULL DEFAULT 0,
  copied_rows INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'running',
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sheet_migration_runs_sheet
  ON sheet_migration_runs(sheet_name, id DESC);
