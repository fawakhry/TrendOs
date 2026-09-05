import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA,
  evaluateAccountingPersistenceSchemaPreflight
} from '../cloudflare-d1/src/accounting-persistence-schema-preflight-v1.mjs';

function mockDb(schema = {}) {
  const calls = { prepare: 0, all: 0, run: 0, batch: 0 };

  const db = {
    prepare(sql) {
      calls.prepare += 1;
      const statement = {
        bind() {
          return statement;
        },
        async all() {
          calls.all += 1;
          if (sql.includes('sqlite_master')) {
            return {
              results: Object.keys(schema).map((name) => ({ name }))
            };
          }
          const pragma = sql.match(/PRAGMA\s+table_info\("([^"]+)"\)/i);
          if (pragma) {
            return {
              results: (schema[pragma[1]] || []).map((name, cid) => ({ cid, name }))
            };
          }
          return { results: [] };
        },
        async run() {
          calls.run += 1;
          throw new Error('schema preflight must never run a mutation statement');
        }
      };
      return statement;
    },
    async batch() {
      calls.batch += 1;
      throw new Error('schema preflight must never execute a batch');
    }
  };

  return { db, calls };
}

test('fails closed when no explicit D1 read handle is injected', async () => {
  const result = await evaluateAccountingPersistenceSchemaPreflight();
  assert.equal(result.compatible, false);
  assert.equal(result.code, 'D1_NOT_INJECTED');
  assert.equal(result.readOnly, true);
  assert.equal(result.authoritativeWrites, false);
  assert.equal(result.mutationPerformed, false);
  assert.deepEqual(result.missingTables, Object.keys(ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA));
});

test('reports missing required tables deterministically without mutation', async () => {
  const onlyIdempotency = {
    accounting_operation_idempotency: ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA.accounting_operation_idempotency
  };
  const { db, calls } = mockDb(onlyIdempotency);
  const result = await evaluateAccountingPersistenceSchemaPreflight(db);

  assert.equal(result.compatible, false);
  assert.equal(result.code, 'SCHEMA_INCOMPATIBLE');
  assert.deepEqual(result.missingTables, ['accounting_stock_movements']);
  assert.deepEqual(result.missingColumns, {});
  assert.equal(calls.run, 0);
  assert.equal(calls.batch, 0);
});

test('reports missing columns for existing tables', async () => {
  const schema = {
    accounting_operation_idempotency: ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA.accounting_operation_idempotency,
    accounting_stock_movements: ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA.accounting_stock_movements.filter(
      (column) => !['recognized_cost_minor', 'source_transaction_id'].includes(column)
    )
  };
  const { db, calls } = mockDb(schema);
  const result = await evaluateAccountingPersistenceSchemaPreflight(db);

  assert.equal(result.compatible, false);
  assert.deepEqual(result.missingTables, []);
  assert.deepEqual(result.missingColumns.accounting_stock_movements, [
    'recognized_cost_minor',
    'source_transaction_id'
  ]);
  assert.equal(calls.run, 0);
  assert.equal(calls.batch, 0);
});

test('reports compatible only for the full adapter schema contract', async () => {
  const schema = Object.fromEntries(
    Object.entries(ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA).map(([table, columns]) => [table, [...columns]])
  );
  const { db, calls } = mockDb(schema);
  const result = await evaluateAccountingPersistenceSchemaPreflight(db);

  assert.equal(result.compatible, true);
  assert.equal(result.code, 'SCHEMA_COMPATIBLE');
  assert.deepEqual(result.missingTables, []);
  assert.deepEqual(result.missingColumns, {});
  assert.deepEqual(result.checkedTables, Object.keys(ACCOUNTING_PERSISTENCE_REQUIRED_SCHEMA));
  assert.equal(result.readOnly, true);
  assert.equal(result.authoritativeWrites, false);
  assert.equal(result.mutationPerformed, false);
  assert.equal(calls.run, 0);
  assert.equal(calls.batch, 0);
  assert.ok(calls.prepare >= 3);
  assert.ok(calls.all >= 3);
});
