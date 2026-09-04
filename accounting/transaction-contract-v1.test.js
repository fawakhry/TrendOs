const assert = require('assert');
const tx = require('./transaction-contract-v1');

function expectContractError(fn, code) {
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

function baseArgs(overrides) {
  return Object.assign({
    eventId: 'EVT-TM260630015-001-FORM-1',
    orderId: 'TM260630015',
    lineId: 'TM260630015-001',
    sourceTransactionId: 'TX-TM260630015-001',
    eventType: 'FORMATION_REQUESTED',
    sourceVersion: 'ops-v1',
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  }, overrides || {});
}

(function testCanonicalFingerprintIgnoresObjectKeyOrder() {
  const left = tx.fingerprint({ b: 2, a: { z: 3, y: 4 } });
  const right = tx.fingerprint({ a: { y: 4, z: 3 }, b: 2 });
  assert.strictEqual(left, right);
})();

(function testIdenticalEventProducesIdenticalPlan() {
  const first = tx.planFormationTransaction(baseArgs());
  const second = tx.planFormationTransaction(baseArgs());
  assert.deepStrictEqual(first, second);
  assert.strictEqual(first.idempotencyKey, 'EVT-TM260630015-001-FORM-1');
  assert.strictEqual(first.transactionId, 'EVT-TM260630015-001-FORM-1-TXN');
  assert.strictEqual(first.decision, 'completed');
})();

(function testSuccessfulFormationProducesDeterministicOperations() {
  const plan = tx.planFormationTransaction(baseArgs());
  assert.strictEqual(plan.decision, 'completed');
  assert.strictEqual(plan.operations.length, 3);
  plan.operations.forEach((operation, index) => {
    assert.strictEqual(operation.operationType, 'STOCK_MOVEMENT_APPEND');
    assert.strictEqual(operation.operationId, `EVT-TM260630015-001-FORM-1-TXN-OP-${String(index + 1).padStart(3, '0')}`);
    assert.strictEqual(operation.payload.orderId, 'TM260630015');
    assert.strictEqual(operation.payload.lineId, 'TM260630015-001');
  });
})();

(function testShortageProducesFinalFailedDecisionWithoutOperations() {
  const plan = tx.planFormationTransaction(baseArgs({
    eventId: 'EVT-TM260630015-001-FORM-SHORT',
    stock: { 'RAW-PHOTO': 1, 'RAW-LAM': 1 }
  }));
  assert.strictEqual(plan.decision, 'failed');
  assert.strictEqual(plan.result.code, 'INSUFFICIENT_STOCK');
  assert.strictEqual(plan.operations.length, 0);
  assert(plan.result.shortages.length > 0);
})();

(function testSameEventSamePayloadIsReplayEvenIfRuntimeStockChanged() {
  const initial = tx.planFormationTransaction(baseArgs());
  const replayAttempt = tx.planFormationTransaction(baseArgs({
    stock: { 'RAW-PHOTO': 999, 'RAW-LAM': 999 }
  }));
  assert.strictEqual(initial.payloadFingerprint, replayAttempt.payloadFingerprint);

  const replay = tx.classifyReplay({
    idempotencyKey: initial.idempotencyKey,
    payloadFingerprint: initial.payloadFingerprint,
    decision: initial.decision,
    transactionId: initial.transactionId,
    result: initial.result
  }, replayAttempt);

  assert.strictEqual(replay.status, 'REPLAY');
  assert.strictEqual(replay.decision, 'completed');
})();

(function testSameEventDifferentPayloadRaisesConflict() {
  const initial = tx.planFormationTransaction(baseArgs());
  const conflicting = tx.planFormationTransaction(baseArgs({ quantity: 3 }));

  expectContractError(() => tx.classifyReplay({
    idempotencyKey: initial.idempotencyKey,
    payloadFingerprint: initial.payloadFingerprint,
    decision: initial.decision,
    transactionId: initial.transactionId,
    result: initial.result
  }, conflicting), 'IDEMPOTENCY_KEY_REUSE_CONFLICT');
})();

(function testPersistenceIntentIsAtomicAppendOnlyFinalDecision() {
  const plan = tx.planFormationTransaction(baseArgs());
  const intent = tx.persistenceIntent(plan);
  assert.strictEqual(intent.atomic, true);
  assert.strictEqual(intent.appendOnly, true);
  assert.strictEqual(intent.idempotencyKey, plan.idempotencyKey);
  assert.strictEqual(intent.finalDecision, 'completed');
  assert.strictEqual(intent.operations.length, plan.operations.length);
  assert.strictEqual(intent.decisionRecord.decision, 'completed');
  assert.strictEqual(intent.decisionRecord.orderId, 'TM260630015');
  assert.strictEqual(intent.decisionRecord.lineId, 'TM260630015-001');
})();

console.log('TrendOS Accounting transaction-contract-v1 tests: PASS');
