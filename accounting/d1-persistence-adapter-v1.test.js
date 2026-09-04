const assert = require('assert');
const tx = require('./transaction-contract-v1');
const d1 = require('./d1-persistence-adapter-v1');

const items = [
  { itemId: 'RAW-PHOTO', name: 'Photo raw', itemType: 'RAW_MATERIAL', baseUnit: 'piece', recognizedUnitCost: 2.125 },
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

function fakeD1() {
  const decisions = new Map();
  const batches = [];
  function stmt(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async first() {
        if (!sql.startsWith('SELECT idempotency_key')) throw new Error('Unexpected first() SQL');
        return decisions.get(this.values[0]) || null;
      }
    };
  }
  return {
    prepare: stmt,
    async batch(statements) {
      const inserts = statements.map(s => ({ sql: s.sql, values: s.values.slice() }));
      const decisionStatement = inserts[0];
      assert(decisionStatement.sql.includes('accounting_operation_idempotency'));
      const key = decisionStatement.values[0];
      if (decisions.has(key)) throw new Error('UNIQUE constraint failed');
      // Atomic fake: validate every statement before exposing the decision.
      inserts.slice(1).forEach(s => assert(s.sql.includes('accounting_stock_movements')));
      decisions.set(key, {
        idempotency_key: decisionStatement.values[0],
        transaction_id: decisionStatement.values[1],
        command_fingerprint: decisionStatement.values[2],
        status: decisionStatement.values[3],
        result_json: decisionStatement.values[7]
      });
      batches.push(inserts);
      return inserts.map(() => ({ success: true }));
    },
    _decisions: decisions,
    _batches: batches
  };
}

(async function run() {
  assert.strictEqual(d1.toMinorUnits(2.125), 213);

  const db = fakeD1();
  const store = d1.createD1Persistence(db);
  const plan = tx.planFormationTransaction(args());
  const built = store.buildBatch(plan);
  assert.strictEqual(built.movements.length, 3);
  assert.strictEqual(built.statements.length, 4);
  assert.strictEqual(built.movements[0].unitCostMinor, 100);
  assert.strictEqual(built.movements[1].unitCostMinor, 213);
  assert.strictEqual(built.movements[2].recognizedCostMinor, 625);

  const committed = await store.commit(plan);
  assert.strictEqual(committed.status, 'COMMITTED');
  assert.strictEqual(committed.operationCount, 3);
  assert.strictEqual(db._batches.length, 1);

  const replay = await store.commit(tx.planFormationTransaction(args({ stock: { 'RAW-PHOTO': 999, 'RAW-LAM': 999 } })));
  assert.strictEqual(replay.status, 'REPLAY');
  assert.strictEqual(db._batches.length, 1, 'Replay must not issue another batch');

  let conflict = null;
  try { await store.commit(tx.planFormationTransaction(args({ quantity: 3 }))); } catch (err) { conflict = err; }
  assert(conflict);
  assert.strictEqual(conflict.code, 'IDEMPOTENCY_KEY_REUSE_CONFLICT');
  assert.strictEqual(db._batches.length, 1);

  const failedDb = fakeD1();
  const failedStore = d1.createD1Persistence(failedDb);
  const failedPlan = tx.planFormationTransaction(args({
    eventId: 'EVT-TM260630015-002-FORM-1',
    lineId: 'TM260630015-002',
    stock: { 'RAW-PHOTO': 0, 'RAW-LAM': 0 }
  }));
  const failed = await failedStore.commit(failedPlan);
  assert.strictEqual(failed.decision, 'failed');
  assert.strictEqual(failed.operationCount, 0);
  assert.strictEqual(failedDb._batches[0].length, 1, 'Failed decision persists only idempotency decision');

  console.log('TrendOS Accounting d1-persistence-adapter-v1 tests: PASS');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
