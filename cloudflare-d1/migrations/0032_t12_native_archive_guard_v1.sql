PRAGMA foreign_keys = ON;

-- Source-only additive migration for T12 new-order archive sealing.
-- All triggers are inert until separately armed by owner: mode='GUARDED'.
-- No old/imported Google order or mirror table is written by this migration.
CREATE TABLE IF NOT EXISTS t12_native_archive_guard_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='T12_NATIVE_ARCHIVE_GUARD_V1'),
  mode TEXT NOT NULL CHECK(mode IN ('OFF','GUARDED')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO t12_native_archive_guard_control_v1(singleton,marker,mode)
VALUES(1,'T12_NATIVE_ARCHIVE_GUARD_V1','OFF');

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_lines_insert
BEFORE INSERT ON t12_prod_lines
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_lines_update
BEFORE UPDATE ON t12_prod_lines
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id OR x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_lines_delete
BEFORE DELETE ON t12_prod_lines
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_line_runtime_insert
BEFORE INSERT ON t12_prod_line_runtime
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_line_runtime_update
BEFORE UPDATE ON t12_prod_line_runtime
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id OR x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_line_runtime_delete
BEFORE DELETE ON t12_prod_line_runtime
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_orders_update
BEFORE UPDATE ON t12_prod_orders
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id OR x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_prod_orders_delete
BEFORE DELETE ON t12_prod_orders
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_archive_orders_v1_update
BEFORE UPDATE ON employee_core_archive_orders_v1
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id OR x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_archive_orders_v1_delete
BEFORE DELETE ON employee_core_archive_orders_v1
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_archive_lines_v1_update
BEFORE UPDATE ON employee_core_archive_lines_v1
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id OR x.order_id=NEW.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_native_archive_v1_archive_lines_v1_delete
BEFORE DELETE ON employee_core_archive_lines_v1
WHEN (SELECT mode FROM t12_native_archive_guard_control_v1
      WHERE singleton=1 AND marker='T12_NATIVE_ARCHIVE_GUARD_V1')='GUARDED'
 AND EXISTS (SELECT 1 FROM t12_prod_orders x
    JOIN employee_core_archive_orders_v1 a ON a.order_id=x.order_id
    WHERE (x.order_id=OLD.order_id))
BEGIN
  SELECT RAISE(ABORT, 'native-t12-order-already-archived');
END;
