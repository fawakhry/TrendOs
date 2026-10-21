-- SERVER-82: completely synthetic Cloudflare D1 dataset. NEVER load into trendos-main.
-- This file contains no production customer/order identifiers, phone numbers or secrets.
CREATE TABLE IF NOT EXISTS sheet_catalog (
  sheet_name TEXT PRIMARY KEY,
  headers_json TEXT NOT NULL DEFAULT '[]',
  source_last_row INTEGER NOT NULL DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready',
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sheet_rows (
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  values_json TEXT NOT NULL DEFAULT '[]',
  display_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (sheet_name,row_number)
);
CREATE TABLE IF NOT EXISTS t12_prod_create_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS t12_prod_lines (
  line_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  qty REAL NOT NULL,
  created_at TEXT NOT NULL,
  ordinal INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS t12_prod_line_runtime (
  line_id TEXT PRIMARY KEY,
  status TEXT NOT NULL
);
INSERT INTO sheet_catalog
(sheet_name,headers_json,source_last_row,row_count,status,note)
VALUES ('بنود الأوردرات','[]',0,0,'ready','TrendOS orders live sync V1');
INSERT INTO t12_prod_create_control (singleton,marker)
VALUES (1,'T12_PROD_CREATE_CANARY_V1');
INSERT INTO t12_prod_lines
(line_id,order_id,department,status,qty,created_at,ordinal)
VALUES ('FAKE-S82-PRINT','FAKE-S82-ORDER','طباعة','طلب جديد',2,'2026-10-20T00:00:00Z',1);
INSERT INTO t12_prod_lines
(line_id,order_id,department,status,qty,created_at,ordinal)
VALUES ('FAKE-S82-LASER','FAKE-S82-ORDER','ليزر','طلب جديد',1,'2026-10-20T00:00:00Z',2);
