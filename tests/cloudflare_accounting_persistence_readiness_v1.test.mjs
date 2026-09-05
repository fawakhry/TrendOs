import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY,
  accountingPersistenceReadinessFromEnv,
  evaluateAccountingPersistenceReadiness
} from '../cloudflare-d1/src/accounting-persistence-readiness-v1.mjs';

function dbSpy() {
  const calls = { prepare: 0, batch: 0 };
  return {
    calls,
    db: {
      prepare() {
        calls.prepare += 1;
        throw new Error('readiness evaluator must not prepare SQL');
      },
      batch() {
        calls.batch += 1;
        throw new Error('readiness evaluator must not execute a batch');
      }
    }
  };
}

test('defaults to ZERO_WRITE with no runtime configuration', () => {
  const result = evaluateAccountingPersistenceReadiness();
  assert.equal(result.ready, false);
  assert.equal(result.mode, 'ZERO_WRITE');
  assert.equal(result.authoritativeWrites, false);
  assert.equal(result.mutationPerformed, false);
});

test('production is blocked even when every other prerequisite is present', () => {
  const spy = dbSpy();
  const result = evaluateAccountingPersistenceReadiness({
    stage: 'production',
    capabilities: [ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY],
    allowWrite: true,
    db: spy.db
  });

  assert.equal(result.productionBlocked, true);
  assert.equal(result.ready, false);
  assert.equal(result.mode, 'ZERO_WRITE');
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('preview stays fail-closed when any explicit prerequisite is missing', () => {
  const spy = dbSpy();
  const base = {
    stage: 'preview',
    capabilities: [ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY],
    allowWrite: true,
    db: spy.db
  };

  assert.equal(evaluateAccountingPersistenceReadiness({ ...base, capabilities: [] }).ready, false);
  assert.equal(evaluateAccountingPersistenceReadiness({ ...base, allowWrite: false }).ready, false);
  assert.equal(evaluateAccountingPersistenceReadiness({ ...base, db: null }).ready, false);
  assert.equal(evaluateAccountingPersistenceReadiness({ ...base, stage: 'disabled' }).ready, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('preview readiness is reported only after all prerequisites are explicit and evaluator remains zero-mutation', () => {
  const spy = dbSpy();
  const result = evaluateAccountingPersistenceReadiness({
    stage: 'preview',
    capabilities: [ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY],
    allowWrite: true,
    db: spy.db
  });

  assert.equal(result.ready, true);
  assert.equal(result.mode, 'D1_PREVIEW_WRITE_READY');
  assert.equal(result.authoritativeWrites, false);
  assert.equal(result.mutationPerformed, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('test stage can be readiness-ready but never authoritative', () => {
  const spy = dbSpy();
  const result = evaluateAccountingPersistenceReadiness({
    stage: 'test',
    capabilities: ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY,
    allowWrite: true,
    db: spy.db
  });

  assert.equal(result.ready, true);
  assert.equal(result.authoritativeWrites, false);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});

test('env adapter requires exact explicit preview-write flag and injected preview DB binding', () => {
  const spy = dbSpy();
  const result = accountingPersistenceReadinessFromEnv({
    TRENDOS_ACCOUNTING_PERSISTENCE_STAGE: 'preview',
    TRENDOS_ACCOUNTING_CAPABILITIES: `READ_ONLY,${ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY}`,
    TRENDOS_ACCOUNTING_D1_WRITE_PREVIEW_ENABLED: 'true',
    TRENDOS_ACCOUNTING_PREVIEW_DB: spy.db
  });

  assert.equal(result.ready, true);
  assert.equal(result.capabilityGranted, true);
  assert.equal(result.dbInjected, true);
  assert.deepEqual(spy.calls, { prepare: 0, batch: 0 });
});
