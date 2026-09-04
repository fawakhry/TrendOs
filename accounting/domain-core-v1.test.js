const assert = require('assert');
const domain = require('./domain-core-v1');

function expectDomainError(fn, code) {
  let thrown = null;
  try { fn(); } catch (err) { thrown = err; }
  assert(thrown, 'Expected an error');
  assert.strictEqual(thrown.code, code);
}

(function testIdNormalization() {
  assert.strictEqual(domain.normalizeOrderId(' tm260630015 '), 'TM260630015');
  assert.strictEqual(domain.normalizeLineId(' tm260630015-001 ', 'TM260630015'), 'TM260630015-001');
  assert.strictEqual(domain.normalizeItemId(' item-20x30 '), 'ITEM-20X30');
})();

(function testLineOrderMismatch() {
  expectDomainError(
    () => domain.normalizeLineId('TM260630016-001', 'TM260630015'),
    'LINE_ORDER_MISMATCH'
  );
})();

const items = [
  { itemId: 'RAW-PHOTO', name: 'Photo raw', itemType: 'RAW_MATERIAL', baseUnit: 'piece', recognizedUnitCost: 2 },
  { itemId: 'RAW-LAM', name: 'Lamination raw', itemType: 'RAW_MATERIAL', baseUnit: 'piece', recognizedUnitCost: 1 },
  { itemId: 'CARD-20X30', name: 'Card 20x30', itemType: 'SEMI_FINISHED', baseUnit: 'piece', recognizedUnitCost: 3 },
  { itemId: 'TABLEAU-20X30', name: 'Tableau 20x30', itemType: 'FINISHED_PRODUCT', baseUnit: 'piece', recognizedUnitCost: 0 }
];

const boms = {
  'CARD-20X30': [
    { componentItemId: 'RAW-PHOTO', quantity: 1 }
  ],
  'TABLEAU-20X30': [
    { componentItemId: 'CARD-20X30', quantity: 1 },
    { componentItemId: 'RAW-LAM', quantity: 1 }
  ]
};

(function testRecursiveExpansion() {
  const result = domain.expandBomRequirements({
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'CARD-20X30': 0, 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  });
  assert.deepStrictEqual({ ...result.requirements }, {
    'RAW-PHOTO': 2,
    'RAW-LAM': 2
  });
})();

(function testAvailableIntermediateThenRecursiveRemainder() {
  const result = domain.expandBomRequirements({
    itemId: 'TABLEAU-20X30',
    quantity: 3,
    items,
    boms,
    stock: { 'CARD-20X30': 1, 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  });
  assert.deepStrictEqual({ ...result.requirements }, {
    'CARD-20X30': 1,
    'RAW-PHOTO': 2,
    'RAW-LAM': 3
  });
})();

(function testSharedIntermediateStockReservedOnlyOnce() {
  const localItems = [
    { itemId: 'RAW', name: 'Raw', itemType: 'RAW_MATERIAL', recognizedUnitCost: 1 },
    { itemId: 'SEMI', name: 'Semi', itemType: 'SEMI_FINISHED', recognizedUnitCost: 2 },
    { itemId: 'BRANCH-A', name: 'Branch A', itemType: 'SEMI_FINISHED', recognizedUnitCost: 0 },
    { itemId: 'BRANCH-B', name: 'Branch B', itemType: 'SEMI_FINISHED', recognizedUnitCost: 0 },
    { itemId: 'FINAL', name: 'Final', itemType: 'FINISHED_PRODUCT', recognizedUnitCost: 0 }
  ];
  const localBoms = {
    SEMI: [{ componentItemId: 'RAW', quantity: 1 }],
    'BRANCH-A': [{ componentItemId: 'SEMI', quantity: 1 }],
    'BRANCH-B': [{ componentItemId: 'SEMI', quantity: 1 }],
    FINAL: [
      { componentItemId: 'BRANCH-A', quantity: 1 },
      { componentItemId: 'BRANCH-B', quantity: 1 }
    ]
  };
  const result = domain.expandBomRequirements({
    itemId: 'FINAL',
    quantity: 1,
    items: localItems,
    boms: localBoms,
    stock: { SEMI: 1, RAW: 5 }
  });
  assert.deepStrictEqual({ ...result.requirements }, {
    SEMI: 1,
    RAW: 1
  });
})();

(function testBomCycle() {
  const cycleItems = [
    { itemId: 'A', name: 'A', itemType: 'SEMI_FINISHED', recognizedUnitCost: 0 },
    { itemId: 'B', name: 'B', itemType: 'SEMI_FINISHED', recognizedUnitCost: 0 }
  ];
  const cycleBoms = {
    A: [{ componentItemId: 'B', quantity: 1 }],
    B: [{ componentItemId: 'A', quantity: 1 }]
  };
  expectDomainError(() => domain.expandBomRequirements({ itemId: 'A', quantity: 1, items: cycleItems, boms: cycleBoms, stock: {} }), 'BOM_CYCLE');
})();

(function testShortageAndNoMutation() {
  const stock = { 'RAW-PHOTO': 1, 'RAW-LAM': 1 };
  const before = JSON.stringify(stock);
  const plan = domain.planFormation({
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock
  });
  assert.strictEqual(plan.ok, false);
  assert.strictEqual(plan.mutation, null);
  assert.strictEqual(JSON.stringify(stock), before);
  assert.strictEqual(plan.shortages.length, 2);
})();

(function testRecognizedCost() {
  const plan = domain.planFormation({
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.recognizedCost, 6);
})();

(function testMovementPlanIsDeterministicAndLinked() {
  const args = {
    eventId: 'EVT-TM260630015-001-FORM-1',
    orderId: 'TM260630015',
    lineId: 'TM260630015-001',
    sourceTransactionId: 'TX-TM260630015-001',
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'RAW-PHOTO': 10, 'RAW-LAM': 10 }
  };
  const first = domain.planFormationMovements(args);
  const second = domain.planFormationMovements(args);
  assert.deepStrictEqual(first, second);
  assert.strictEqual(first.ok, true);
  assert.strictEqual(first.movements.length, 3);
  first.movements.forEach(m => {
    assert.strictEqual(m.orderId, 'TM260630015');
    assert.strictEqual(m.lineId, 'TM260630015-001');
  });
  assert.strictEqual(first.movements[2].movementType, 'PRODUCTION_OUTPUT');
})();

(function testMovementPlanBlocksOnShortage() {
  const result = domain.planFormationMovements({
    eventId: 'EVT-TM260630015-002-FORM-1',
    orderId: 'TM260630015',
    lineId: 'TM260630015-002',
    itemId: 'TABLEAU-20X30',
    quantity: 2,
    items,
    boms,
    stock: { 'RAW-PHOTO': 1, 'RAW-LAM': 1 }
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.movements.length, 0);
  assert(result.shortages.length > 0);
})();

console.log('TrendOS Accounting domain-core-v1 tests: PASS');
