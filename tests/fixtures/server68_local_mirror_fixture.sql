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

-- SERVER-69: synthetic printshop reader contract (never real clients/printers).
-- Matching sheet catalog must be qualified; data only in a disposable local D1.
INSERT INTO sheet_catalog
(sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,synced_at,note)
VALUES ('بنود الأوردرات','TEST_ONLY_LINES','["رقم الأوردر","كود الأوردر","اسم العميل","رقم البند","القسم","الكمية","الحالة"]',1,7,1,'ready','2026-10-16 00:00:00','TrendOS orders live sync V1')
ON CONFLICT(sheet_name) DO UPDATE SET row_count=1,status='ready',note='TrendOS orders live sync V1';
INSERT OR REPLACE INTO sheet_rows
(sheet_name,row_number,values_json,display_json,formulas_json,synced_at)
VALUES ('بنود الأوردرات',1,'["رقم الأوردر"]','["رقم الأوردر"]','[]','2026-10-16 00:00:00');

CREATE TABLE IF NOT EXISTS t12_prod_create_control
(singleton INTEGER PRIMARY KEY,marker TEXT);
CREATE TABLE IF NOT EXISTS t12_prod_lines (
  line_id TEXT PRIMARY KEY, order_id TEXT, department TEXT,
  status TEXT, qty INTEGER, created_at TEXT, ordinal INTEGER
);
CREATE TABLE IF NOT EXISTS t12_prod_line_runtime
(line_id TEXT PRIMARY KEY,status TEXT);
INSERT OR REPLACE INTO t12_prod_create_control(singleton,marker)
VALUES(1,'T12_PROD_CREATE_CANARY_V1');
INSERT OR REPLACE INTO t12_prod_lines
(line_id,order_id,department,status,qty,created_at,ordinal)
VALUES ('DEMO-LINE-PRINT','DEMO-ORDER-PRINT','طباعة','طلب جديد',2,'2026-10-16 00:00:00',1);
INSERT OR REPLACE INTO t12_prod_lines
(line_id,order_id,department,status,qty,created_at,ordinal)
VALUES ('DEMO-LINE-LASER','DEMO-ORDER-LASER','ليزر','طلب جديد',1,'2026-10-16 00:00:00',2);
