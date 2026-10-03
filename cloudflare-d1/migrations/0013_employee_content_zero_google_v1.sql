PRAGMA foreign_keys = ON;

-- Entry614 Zero-Google content/config domain store.
CREATE TABLE IF NOT EXISTS employee_content_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_EMPLOYEE_CONTENT_V1'),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','READONLY','GENERAL')),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_content_control_v1(singleton,marker,mode,policy_epoch)
VALUES(1,'ENTRY614_EMPLOYEE_CONTENT_V1','OFF',1);

CREATE TABLE IF NOT EXISTS employee_content_records_v1 (
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  sort_order REAL NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  source_legacy_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(collection,record_id)
);
CREATE INDEX IF NOT EXISTS idx_employee_content_collection_active
ON employee_content_records_v1(collection,active,sort_order,updated_at DESC);

CREATE TABLE IF NOT EXISTS employee_content_files_v1 (
  file_id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  owner_record_id TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  public_url TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_content_files_owner
ON employee_content_files_v1(collection,owner_record_id,created_at DESC);

CREATE TABLE IF NOT EXISTS employee_content_events_v1 (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_content_events_record
ON employee_content_events_v1(collection,record_id,created_at DESC);

-- Preserve original default seed behavior without Google Sheets.
INSERT OR IGNORE INTO employee_content_records_v1(collection,record_id,record_json,active,sort_order,updated_by)
VALUES
('platform_sections','DTF','{"code":"DTF","name":"DTF","description":"طباعة DTF للملابس والتيشيرتات","sectionType":"مورد خارجي","executionType":"وسيط","designServicePrice":10}',1,1,'system'),
('platform_sections','BANNER','{"code":"BANNER","name":"Banner","description":"طباعة بنر ولافتات ومطبوعات خارجية","sectionType":"مورد خارجي","executionType":"وسيط","designServicePrice":10}',1,2,'system'),
('platform_sections','DTFUV','{"code":"DTFUV","name":"DTF UV","description":"طباعة DTF UV للاستيكرات والهدايا","sectionType":"مورد خارجي","executionType":"وسيط","designServicePrice":10}',1,3,'system'),
('platform_sections','UV','{"code":"UV","name":"UV","description":"طباعة UV على الخامات والهدايا","sectionType":"مورد خارجي","executionType":"وسيط","designServicePrice":10}',1,4,'system'),
('franchise_branches','MB-BANHA-HQ','{"code":"MB-BANHA-HQ","displayName":"مطبعجي بنها الرئيسي","internalName":"مطبعجي بنها","governorate":"القليوبية","city":"بنها","visibleArea":"بنها","branchRole":"فرنشايز كامل","customerVisibility":"ظاهر كفرع مطبعجي","matbagyShare":100,"receivesOrders":true,"executes":true,"deliversAsMatbagy":true,"customerDescription":"الفرع الرئيسي لمطبعجي بنها للاستلام والتسليم والمتابعة.","internalNotes":"بداية شبكة مطبعجي مصر."}',1,1,'system'),
('service_provider_routes','SR-BANNER-RAHMA','{"code":"SR-BANNER-RAHMA","serviceName":"Banner","serviceType":"طباعة","sendMethod":"من خلال رحمة","providerName":"رحمة","unit":"متر","accountingMethod":"نسبة على الوحدة","matbagyValue":"15","notes":"ربط افتراضي كبداية. عدّله من لوحة الإدارة."}',1,1,'system');
