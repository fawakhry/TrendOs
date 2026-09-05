'use strict';

var assert = require('assert');
var caller = require('./preview-persistence-caller-v1');
var composition = require('./persistence-composition-v1');

function plan() {
  return {
    idempotencyKey: 'EVT-PREVIEW-001',
    payloadFingerprint: 'fp-preview-001',
    decision: 'failed',
    transactionId: null,
    operations: [],
    decisionId: 'DEC-EVT-PREVIEW-001',
    orderId: 'TM260630015',
    lineId: 'TM260630015-001',
    sourceTransactionId: 'SRC-PREVIEW-001',
    result: { ok: false, reason: 'TEST_ZERO_OPERATION_DECISION' }
  };
}

function fakeDb() {
  var state = { batchCalls: 0 };
  return {
    state: state,
    prepare: function(sql) {
      return {
        bind: function() {
          return {
            first: async function() { return null; },
            run: async function() { return { success: true }; }
          };
        }
      };
    },
    batch: async function(statements) {
      state.batchCalls += 1;
      return statements.map(function() { return { success: true }; });
    }
  };
}

(async function() {
  var db1 = fakeDb();
  var disabled = caller.createPreviewPersistenceCaller({ db: db1 });
  var zero = await disabled.execute(plan());
  assert.strictEqual(zero.status, 'ZERO_WRITE');
  assert.strictEqual(db1.state.batchCalls, 0);

  var db2 = fakeDb();
  var prod = caller.createPreviewPersistenceCaller({
    stage: 'production',
    capabilities: [composition.WRITE_CAPABILITY],
    allowWrite: true,
    db: db2
  });
  var prodResult = await prod.execute(plan());
  assert.strictEqual(prodResult.status, 'ZERO_WRITE');
  assert.strictEqual(db2.state.batchCalls, 0);

  var invalidFailed = false;
  try { await disabled.execute({ idempotencyKey: 'EVT-X' }); }
  catch (err) { invalidFailed = err.code === 'ACCOUNTING_PLAN_INCOMPLETE'; }
  assert.strictEqual(invalidFailed, true);

  var db3 = fakeDb();
  var preview = caller.createPreviewPersistenceCaller({
    stage: 'preview',
    capabilities: [composition.WRITE_CAPABILITY],
    allowWrite: true,
    db: db3
  });
  assert.strictEqual(preview.mode, 'D1_PREVIEW_WRITE');
  var committed = await preview.execute(plan());
  assert.strictEqual(committed.status, 'COMMITTED');
  assert.strictEqual(committed.decision, 'failed');
  assert.strictEqual(committed.operationCount, 0);
  assert.strictEqual(db3.state.batchCalls, 1);

  console.log('preview-persistence-caller-v1 tests: PASS');
})().catch(function(err) {
  console.error(err);
  process.exitCode = 1;
});
