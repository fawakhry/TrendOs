-- TrendOS Accounting Operations V1 — PREPARED SCHEMA ONLY
-- DO NOT APPLY TO D1 OR PRODUCTION WITHOUT A SEPARATE CUTOVER GATE.
-- This schema stores operational Accounting decisions and stock movements.
-- It intentionally does not reuse finance journal idempotency: a successful
-- stock formation is not itself a financial journal.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounting_operation_idempotency (
  idempotency_key TEXT PRIMARY KEY NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  command_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed','failed','ambiguous')),
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  source_transaction_id TEXT NOT NULL,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounting_operation_idempotency_order_line
  ON accounting_operation_idempotency(order_id, line_id, created_at);

CREATE TABLE IF NOT EXISTS accounting_stock_movements (
  operation_id TEXT PRIMARY KEY NOT NULL,
  stock_movement_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT NOT NULL,
  transaction_idempotency_key TEXT NOT NULL,
  movement_idempotency_key TEXT NOT NULL UNIQUE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('PRODUCTION_CONSUMPTION','PRODUCTION_OUTPUT')),
  item_id TEXT NOT NULL,
  quantity_in REAL NOT NULL DEFAULT 0 CHECK (quantity_in >= 0),
  quantity_out REAL NOT NULL DEFAULT 0 CHECK (quantity_out >= 0),
  unit TEXT NOT NULL,
  unit_cost_minor INTEGER NOT NULL CHECK (unit_cost_minor >= 0),
  recognized_cost_minor INTEGER NOT NULL CHECK (recognized_cost_minor >= 0),
  order_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  source_transaction_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((quantity_in > 0 AND quantity_out = 0) OR (quantity_out > 0 AND quantity_in = 0)),
  FOREIGN KEY (transaction_idempotency_key)
    REFERENCES accounting_operation_idempotency(idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_accounting_stock_movements_transaction
  ON accounting_stock_movements(transaction_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_stock_movements_item
  ON accounting_stock_movements(item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_stock_movements_order_line
  ON accounting_stock_movements(order_id, line_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounting_stock_movements_source_tx
  ON accounting_stock_movements(source_transaction_id, created_at);

-- Operational facts are immutable. Corrections are future explicit compensating
-- movements; no UPDATE/DELETE lifecycle is introduced by this prepared slice.
CREATE TRIGGER IF NOT EXISTS accounting_operation_idempotency_no_update
BEFORE UPDATE ON accounting_operation_idempotency
BEGIN
  SELECT RAISE(ABORT, 'accounting_operation_idempotency is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_operation_idempotency_no_delete
BEFORE DELETE ON accounting_operation_idempotency
BEGIN
  SELECT RAISE(ABORT, 'accounting_operation_idempotency is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_stock_movements_no_update
BEFORE UPDATE ON accounting_stock_movements
BEGIN
  SELECT RAISE(ABORT, 'accounting_stock_movements is append-only');
END;

CREATE TRIGGER IF NOT EXISTS accounting_stock_movements_no_delete
BEFORE DELETE ON accounting_stock_movements
BEGIN
  SELECT RAISE(ABORT, 'accounting_stock_movements is append-only');
END;
