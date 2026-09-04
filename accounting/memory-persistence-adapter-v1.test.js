const assert = require('assert');
const tx = require('./transaction-contract-v1');
const memory = require('./memory-persistence-adapter-v1');

function expectError(fn, code) {
  let thrown = null;
  try { fn(); } catch (err) { thrown = err; }
  assert(thrown, 'Expected an error');
  assert.strictEqual(thrown.code, code);
}

const items = [
  { itemId: 'RAW-PHOTO', name: 'Photo raw', itemType: 'RAW_MATERIAL', baseUnit: 'piece', recognizedUnitCost: 2 },
  { itemId: 'RAW-LAM', name: 'Lamination raw', itemType: 'RAW_MATERIAL', baseUnit: 'piece', recognizedUnitCost: 1 },
  { itemId: 'TABLEAU-20X30', name: 'Tableau 20x30', itemType: 'FINISHED_PRODUCT', baseUnit: 'piece', recognizedUnitCost: 0 }
];

const boms = {
  'TABLEAU-20X30': [
    { componentItemId: 'RAW-PHOTO', quantity: 1 },
    { componentItemId: 'RAW-LAM', quantity: 1 }
  ]
};

function args(overrides) {
  return Object.assign({
    eventId: 'EVT-TM260630015-001-FORM-1',
    orderId: 'TM260630015',
    lineId: 'TM260630015-001',
    sourceTransactionId: 'TX-TM260630015-001',
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  }, overrides || {});
}

(function testFirstCommitAndExactReplayAreIdempotent() {
  const store = memory.createMemoryPersistence();
  const plan = tx.planFormationTransaction(args());

  const first = store.commit(plan);
  assert.strictEqual(first.status, 'COMMITTED');
  assert.strictEqual(first.operationCount, 3);

  const afterFirst = store.snapshot();
  assert.strictEqual(Object.keys(afterFirst.decisions).length, 1);
  assert.strictEqual(Object.keys(afterFirst.operations).length, 3);

  const replay = store.commit(tx.planFormationTransaction(args({
    stock: { 'RAW-PHOTO': 999, 'RAW-LAM': 999 }
  })));
  assert.strictEqual(replay.status, 'REPLAY');
  assert.deepStrictEqual(store.snapshot(), afterFirst);
})();

(function testConflictingEventPayloadIsRejectedWithoutMutation() {
  const store = memory.createMemoryPersistence();
  store.commit(tx.planFormationTransaction(args()));
  const before = store.snapshot();

  expectError(() => store.commit(tx.planFormationTransaction(args({ quantity: 3 }))), 'IDEMPOTENCY_KEY_REUSE_CONFLICT');
  assert.deepStrictEqual(store.snapshot(), before);
})();

(function testSimulatedAbortAfterStagingLeavesNoPartialState() {
  const store = memory.createMemoryPersistence();
  const plan = tx.planFormationTransaction(args({ eventId: 'EVT-TM260630015-002-FORM-1', lineId: 'TM260630015-002' }));

  expectError(() => store.commit(plan, { failBeforeCommit: true }), 'SIMULATED_ATOMIC_ABORT');
  const after = store.snapshot();
  assert.strictEqual(Object.keys(after.decisions).length, 0);
  assert.strictEqual(Object.keys(after.operations).length, 0);
  assert.strictEqual(Object.keys(after.transactionOperations).length, 0);
})();

(function testFailedBusinessDecisionPersistsWithoutOperations() {
  const store = memory.createMemoryPersistence();
  const plan = tx.planFormationTransaction(args({
    eventId: 'EVT-TM260630015-003-FORM-1',
    lineId: 'TM260630015-003',
    stock: { 'RAW-PHOTO': 0, 'RAW-LAM': 0 }
  }));
  assert.strictEqual(plan.decision, 'failed');

  const result = store.commit(plan);
  assert.strictEqual(result.status, 'COMMITTED');
  assert.strictEqual(result.decision, 'failed');
  assert.strictEqual(result.operationCount, 0);

  const snap = store.snapshot();
  assert.strictEqual(Object.keys(snap.decisions).length, 1);
  assert.strictEqual(Object.keys(snap.operations).length, 0);
})();

(function testOperationIdCollisionRejectsWholeSecondTransaction() {
  const store = memory.createMemoryPersistence();
  const firstPlan = tx.planFormationTransaction(args());
  store.commit(firstPlan);
  const before = store.snapshot();

  const secondPlan = JSON.parse(JSON.stringify(tx.planFormationTransaction(args({
    eventId: 'EVT-TM260630015-004-FORM-1',
    lineId: 'TM260630015-004'
  }))));

  secondPlan.operations[0].operationId = firstPlan.operations[0].operationId;

  expectError(() => store.commit(secondPlan), 'OPERATION_ID_COLLISION');
  assert.deepStrictEqual(store.snapshot(), before);
})();

console.log('TrendOS Accounting memory-persistence-adapter-v1 tests: PASS');
