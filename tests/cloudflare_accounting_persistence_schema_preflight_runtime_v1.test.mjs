import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAccountingNativeModuleRequest, isAccountingNativeModulePath } from '../cloudflare-d1/src/accounting-native-module.mjs';

const BASE_SCHEMAS = {
  accounting_operation_idempotency: ['idempotency_key','transaction_id','command_fingerprint','status','order_id','line_id','source_transaction_id','result_json','created_at'],
  accounting_stock_movements: ['operation_id','stock_movement_id','transaction_id','transaction_idempotency_key','movement_idempotency_key','movement_type','item_id','quantity_in','quantity_out','unit','unit_cost_minor','recognized_cost_minor','order_id','line_id','source_transaction_id','created_at']
};

function d1Spy(schemas = BASE_SCHEMAS) {
  const calls = { prepare:0, all:0, bind:0, run:0, batch:0 };
  return { calls, db: {
    prepare(sql) {
      calls.prepare += 1;
      if (/sqlite_master/.test(sql)) return { bind() { calls.bind += 1; return { async all() { calls.all += 1; return { results:Object.keys(schemas).map(name => ({ name })) }; } }; } };
      const match = sql.match(/PRAGMA table_info\("([^"]+)"\)/);
      if (match) return { async all() { calls.all += 1; return { results:(schemas[match[1]] || []).map(name => ({ name })) }; } };
      throw new Error('unexpected SQL');
    },
    batch() { calls.batch += 1; throw new Error('preflight must not batch'); }
  }};
}

async function request(env = {}, method = 'GET') {
  const response = await handleAccountingNativeModuleRequest(new Request('https://preview.test/v1/accounting/persistence-schema-preflight', { method }), env);
  return { response, body:await response.json() };
}

test('route detector includes schema preflight diagnostic', () => {
  assert.equal(isAccountingNativeModulePath('/v1/accounting/persistence-schema-preflight'), true);
  assert.equal(isAccountingNativeModulePath('/v1/accounting/persistence-schema-preflight/'), true);
});

test('missing explicit preview D1 fails closed', async () => {
  const { response, body } = await request();
  assert.equal(response.status, 503); assert.equal(body.success, false); assert.equal(body.code, 'D1_NOT_INJECTED');
  assert.equal(body.readOnly, true); assert.equal(body.authoritativeWrites, false); assert.equal(body.mutationPerformed, false);
});

test('generic env.DB is never used as fallback', async () => {
  const generic = d1Spy();
  const { response, body } = await request({ DB:generic.db });
  assert.equal(response.status, 503); assert.equal(body.code, 'D1_NOT_INJECTED');
  assert.deepEqual(generic.calls, { prepare:0, all:0, bind:0, run:0, batch:0 });
});

test('explicit preview D1 performs metadata reads only and reports compatible schema', async () => {
  const spy = d1Spy();
  const { response, body } = await request({ TRENDOS_ACCOUNTING_PREVIEW_DB:spy.db });
  assert.equal(response.status, 200); assert.equal(body.success, true); assert.equal(body.code, 'SCHEMA_COMPATIBLE'); assert.equal(body.compatible, true);
  assert.equal(body.readOnly, true); assert.equal(body.authoritativeWrites, false); assert.equal(body.mutationPerformed, false);
  assert.equal(spy.calls.run, 0); assert.equal(spy.calls.batch, 0); assert.ok(spy.calls.prepare > 0); assert.ok(spy.calls.all > 0);
});

test('missing required column is reported deterministically without mutation', async () => {
  const schemas = { ...BASE_SCHEMAS, accounting_stock_movements:BASE_SCHEMAS.accounting_stock_movements.filter(name => name !== 'recognized_cost_minor') };
  const spy = d1Spy(schemas);
  const { response, body } = await request({ TRENDOS_ACCOUNTING_PREVIEW_DB:spy.db });
  assert.equal(response.status, 200); assert.equal(body.code, 'SCHEMA_INCOMPATIBLE'); assert.equal(body.compatible, false);
  assert.deepEqual(body.missingColumns.accounting_stock_movements, ['recognized_cost_minor']);
  assert.equal(body.authoritativeWrites, false); assert.equal(body.mutationPerformed, false); assert.equal(spy.calls.run, 0); assert.equal(spy.calls.batch, 0);
});

test('non-GET schema preflight is rejected without touching D1', async () => {
  const spy = d1Spy();
  const { response, body } = await request({ TRENDOS_ACCOUNTING_PREVIEW_DB:spy.db }, 'POST');
  assert.equal(response.status, 405); assert.equal(body.code, 'accounting-persistence-schema-preflight-read-only');
  assert.equal(body.authoritativeWrites, false); assert.equal(body.mutationPerformed, false);
  assert.deepEqual(spy.calls, { prepare:0, all:0, bind:0, run:0, batch:0 });
});
