PRAGMA foreign_keys = ON;

-- EasyStore A2.7 server-side write canary guard.
-- Default-deny when enabled. GENERAL mode cannot expose writes until an explicit
-- user/action allowlist is armed. Disabling the guard is the later full-cutover gate.
CREATE TABLE IF NOT EXISTS employee_accounting_write_canary_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='EASYSTORE_A2_WRITE_CANARY_V1'),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  allowed_usernames_json TEXT NOT NULL DEFAULT '[]',
  allowed_actions_json TEXT NOT NULL DEFAULT '[]',
  max_amount REAL NOT NULL DEFAULT 0 CHECK(max_amount>=0),
  expires_at_ms INTEGER NOT NULL DEFAULT 0 CHECK(expires_at_ms>=0),
  policy_epoch INTEGER NOT NULL DEFAULT 1 CHECK(policy_epoch>=1),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO employee_accounting_write_canary_v1(
  singleton,marker,enabled,allowed_usernames_json,allowed_actions_json,max_amount,expires_at_ms,policy_epoch
) VALUES(1,'EASYSTORE_A2_WRITE_CANARY_V1',1,'[]','[]',0,0,1);
