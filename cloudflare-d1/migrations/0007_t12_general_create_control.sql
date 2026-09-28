PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS t12_prod_general_create_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='T12_GENERAL_CREATE_V1'),
  mode TEXT NOT NULL CHECK(mode IN ('OFF','CANARY','GENERAL')),
  canary_remaining INTEGER NOT NULL CHECK(canary_remaining IN (0,1)),
  policy_epoch TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO t12_prod_general_create_control
(singleton,marker,mode,canary_remaining,policy_epoch)
VALUES (1,'T12_GENERAL_CREATE_V1','OFF',0,'owner_fresh_start_20260926');
