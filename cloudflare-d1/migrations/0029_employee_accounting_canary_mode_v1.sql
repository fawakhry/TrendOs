PRAGMA foreign_keys = ON;

-- EasyStore A2.7 dedicated bounded CANARY runtime mode.
-- Schema-only capability change: preserves the current control row and does not
-- switch Production out of READONLY when applied.
--
-- SQLite cannot widen a CHECK constraint in place, so rebuild only the singleton
-- accounting control table with the same columns plus CANARY in the mode domain.
ALTER TABLE employee_accounting_control_v1
RENAME TO employee_accounting_control_v1_pre_canary;

CREATE TABLE employee_accounting_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_ACCOUNTING_V1'),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','READONLY','CANARY','GENERAL')),
  next_invoice_number INTEGER NOT NULL DEFAULT 1 CHECK(next_invoice_number>=1),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employee_accounting_control_v1(
  singleton,marker,mode,next_invoice_number,policy_epoch,updated_at
)
SELECT singleton,marker,mode,next_invoice_number,policy_epoch,updated_at
FROM employee_accounting_control_v1_pre_canary;

DROP TABLE employee_accounting_control_v1_pre_canary;
