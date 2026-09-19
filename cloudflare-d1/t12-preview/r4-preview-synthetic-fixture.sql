-- R4 disposable LOCAL D1 fixture only. Synthetic rows; no production copy.
-- Apply ONLY to wrangler.r4-preview.local.toml with --local.
PRAGMA foreign_keys=ON;
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
CREATE TABLE IF NOT EXISTS sheet_rows (
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  values_json TEXT NOT NULL DEFAULT '[]',
  display_json TEXT NOT NULL DEFAULT '[]',
  formulas_json TEXT NOT NULL DEFAULT '[]',
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(sheet_name,row_number),
  FOREIGN KEY(sheet_name) REFERENCES sheet_catalog(sheet_name) ON DELETE CASCADE
);
INSERT INTO sheet_catalog
(sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
VALUES
('الأوردرات','11','["h"]',2,1,2,'ready','TrendOS orders live sync V2 quota-aware'),
('بنود الأوردرات','12','["h"]',2,1,2,'ready','TrendOS orders live sync V2 quota-aware');
INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json)
VALUES
('الأوردرات',1,'["h"]','["h"]','[""]'),
('الأوردرات',2,'["synthetic-old"]','["synthetic-old"]','[""]'),
('بنود الأوردرات',1,'["h"]','["h"]','[""]'),
('بنود الأوردرات',2,'["synthetic-old"]','["synthetic-old"]','[""]');
