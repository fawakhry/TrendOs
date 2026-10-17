-- SERVER-68 entirely synthetic SQLITE fixture for Wrangler --local only.
-- No production data, no real customer identifiers or personal details.
CREATE TABLE IF NOT EXISTS sheet_catalog (
  sheet_name TEXT PRIMARY KEY, sheet_id TEXT, headers_json TEXT,
  source_last_row INTEGER, source_last_col INTEGER, row_count INTEGER,
  status TEXT, synced_at TEXT, note TEXT
);
CREATE TABLE IF NOT EXISTS sheet_rows (
  sheet_name TEXT, row_number INTEGER,
  values_json TEXT, display_json TEXT, formulas_json TEXT,
  synced_at TEXT,
  PRIMARY KEY (sheet_name,row_number)
);
CREATE TABLE IF NOT EXISTS sheet_staging_catalog (sheet_name TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS sheet_staging_rows (sheet_name TEXT, row_number INTEGER);
INSERT INTO sheet_catalog (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,synced_at,note)
VALUES ('الأوردرات','TEST_ONLY','["كود الأوردر"]',1,1,1,'ready','2026-10-16 00:00:00','SYNTHETIC')
ON CONFLICT(sheet_name) DO UPDATE SET row_count=1;
INSERT OR REPLACE INTO sheet_rows (sheet_name,row_number,values_json,display_json,formulas_json,synced_at)
VALUES ('الأوردرات',1,'["FAKE-ORDER-0001"]','["FAKE-ORDER-0001"]','[]','2026-10-16 00:00:00');
