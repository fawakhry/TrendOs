import test from 'node:test';
import assert from 'node:assert/strict';

import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath
} from '../cloudflare-d1/src/accounting-native-module.mjs';
import { ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY } from '../cloudflare-d1/src/accounting-persistence-readiness-v1.mjs';

function d1Spy() {
  const calls = { prepare: 0, batch: 0 };
  return {
    calls,
    db: {
      prepare() {
        calls.prepare += 1;
        throw new Error('diagnostic route must not prepare SQL');
      },
      batch() {
        calls.batch += 1;
        throw new Error('diagnostic route must not execute a batch');
      }
    }
  };
}

async function getReadiness(env = {}) {
  const response = await handleAccountingNativeModuleRequest(
    new Request('https://preview.test/v1/accounting/persistence-readiness'),
    env
  );
  return { response, body: await response.json() };
}

test('native route detector includes persistence readiness diagnostic', () => {
  assert.equal(isAccountingNativeModulePath('/v1/accounting/persistence-readiness'), true);
  assert.equal(isAccountingNativeModulePath('/v1/accounting/persistence-readiness/'), true);
});

test('runtime diagnostic defaults to ZERO_WRITE and non-authoritative', async () => {
  const { response, body } = await getReadiness();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.persistence, 'diagnostic-only');
  assert.equal(body.mode, 'ZERO_WRITE');
  assert.equal(body.ready, false);
  assert.equal(body.authoritativeWrites, false);
  assert.equal(body.mutationPerformed, false);
});

test('production remains blocked even with every other readiness prerequisite', async () => {
  const spy = d1Spy();
  const { body } = await getReadiness({
    TRENDOS_ACCOUNTING_PERSISTENCE_STAGE: 'production',
    TRENDOS_ACCOUNTING_CAPABILITIES: ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY,
    TRENDOS_ACCOUNTING_D1_WRITE_PREVIEW_ENABLED: 'true',
    TRENDOS_ACCOUNTING_PREVIEW_DB: spy.db
  });

  assert.equal(body.productionBlocked, true);
  assert.equal(body.ready, false);
  assert.equal(body.mode, 'ZERO_WRITE');
  assert.equal(body.authoritativeWrites, false);
  assert.equal(body.mutationPerformed, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('explicit preview prerequisites can report readiness without any D1 operation', async () => {
  const spy = d1Spy();
  const { body } = await getReadiness({
    TRENDOS_ACCOUNTING_PERSISTENCE_STAGE: 'preview',
    TRENDOS_ACCOUNTING_CAPABILITIES: `READ_ONLY,${ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY}`,
    TRENDOS_ACCOUNTING_D1_WRITE_PREVIEW_ENABLED: 'true',
    TRENDOS_ACCOUNTING_PREVIEW_DB: spy.db
  });

  assert.equal(body.ready, true);
  assert.equal(body.mode, 'D1_PREVIEW_WRITE_READY');
  assert.equal(body.authoritativeWrites, false);
  assert.equal(body.mutationPerformed, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('non-GET diagnostic request is rejected without mutation', async () => {
  const spy = d1Spy();
  const response = await handleAccountingNativeModuleRequest(
    new Request('https://preview.test/v1/accounting/persistence-readiness', { method: 'POST' }),
    {
      TRENDOS_ACCOUNTING_PERSISTENCE_STAGE: 'preview',
      TRENDOS_ACCOUNTING_CAPABILITIES: ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY,
      TRENDOS_ACCOUNTING_D1_WRITE_PREVIEW_ENABLED: 'true',
      TRENDOS_ACCOUNTING_PREVIEW_DB: spy.db
    }
  );
  const body = await response.json();

  assert.equal(response.status, 405);
  assert.equal(body.authoritativeWrites, false);
  assert.equal(body.persistence, 'none');
  assert.equal(body.mutationPerformed, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});
