import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const schemaPath = 'cloudflare-d1/schema-prep/accounting-operations-v1.sql';
const schema = fs.readFileSync(schemaPath, 'utf8');
assert.match(schema, /PREPARED SCHEMA ONLY/);
assert.match(schema, /DO NOT APPLY TO D1 OR PRODUCTION/);
assert.equal(fs.existsSync('cloudflare-d1/migrations/accounting-operations-v1.sql'), false);

const db = new DatabaseSync(':memory:');
db.exec(schema);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'accounting_%'").all().map(r => r.name);
assert(tables.includes('accounting_operation_idempotency'));
assert(tables.includes('accounting_stock_movements'));

const decision = {
  key: 'EVT-TM260630015-001-FORM-1',
  transaction: 'EVT-TM260630015-001-FORM-1-TXN',
  fingerprint: 'FNV1A32-ABCDEF01',
  order: 'TM260630015',
  line: 'TM260630015-001',
  source: 'TX-TM260630015-001'
};

db.prepare(`INSERT INTO accounting_operation_idempotency
  (idempotency_key, transaction_id, command_fingerprint, status, order_id, line_id, source_transaction_id, result_json)
  VALUES (?, ?, ?, 'completed', ?, ?, ?, ?)`)
  .run(decision.key, decision.transaction, decision.fingerprint, decision.order, decision.line, decision.source, '{"code":"FORMATION_PLANNED"}');

db.prepare(`INSERT INTO accounting_stock_movements
  (operation_id, stock_movement_id, transaction_id, transaction_idempotency_key, movement_idempotency_key,
   movement_type, item_id, quantity_in, quantity_out, unit, unit_cost_minor, recognized_cost_minor,
   order_id, line_id, source_transaction_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(
    `${decision.transaction}-OP-001`, `${decision.key}-CONSUME-001-RAW-PHOTO`, decision.transaction, decision.key,
    `${decision.key}-CONSUME-001-RAW-PHOTO`, 'PRODUCTION_CONSUMPTION', 'RAW-PHOTO', 0, 2, 'piece', 213, 425,
    decision.order, decision.line, decision.source
  );

const stored = db.prepare('SELECT unit_cost_minor, recognized_cost_minor, quantity_out FROM accounting_stock_movements').get();
assert.equal(stored.unit_cost_minor, 213);
assert.equal(stored.recognized_cost_minor, 425);
assert.equal(stored.quantity_out, 2);

assert.throws(() => db.prepare(`INSERT INTO accounting_operation_idempotency
  (idempotency_key, transaction_id, command_fingerprint, status, order_id, line_id, source_transaction_id)
  VALUES (?, ?, ?, 'completed', ?, ?, ?)`)
  .run(decision.key, 'OTHER-TXN', decision.fingerprint, decision.order, decision.line, decision.source), /UNIQUE/);

assert.throws(() => db.prepare('UPDATE accounting_stock_movements SET quantity_out = 3').run(), /append-only/);
assert.throws(() => db.prepare('DELETE FROM accounting_stock_movements').run(), /append-only/);
assert.throws(() => db.prepare("UPDATE accounting_operation_idempotency SET status = 'failed'").run(), /append-only/);
assert.throws(() => db.prepare('DELETE FROM accounting_operation_idempotency').run(), /append-only/);

assert.throws(() => db.prepare(`INSERT INTO accounting_stock_movements
  (operation_id, stock_movement_id, transaction_id, transaction_idempotency_key, movement_idempotency_key,
   movement_type, item_id, quantity_in, quantity_out, unit, unit_cost_minor, recognized_cost_minor,
   order_id, line_id, source_transaction_id)
  VALUES ('BAD-OP','BAD-MOVE',?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  .run(decision.transaction, decision.key, 'BAD-MOVE', 'PRODUCTION_CONSUMPTION', 'RAW-PHOTO', 1, 1, 'piece', 100, 100, decision.order, decision.line, decision.source), /CHECK/);

console.log('TrendOS Accounting F2 operations prepared schema tests: PASS');
