import assert from 'node:assert/strict';
import {
  CHART_OF_ACCOUNTS_V1,
  TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
  buildFinancePostingPlan,
  financeCoreMetadata,
  moneyToMinor,
  minorToMoney,
  reverseJournalPlan,
  validateJournalPlan
} from '../cloudflare-d1/src/accounting-finance-core-v1.mjs';

const base = {
  actorId: 'USER-ACCOUNTING-1',
  source: 'trendos-accounting-test',
  occurredAt: '2026-09-05T00:00:00Z',
  currency: 'EGP'
};

function balanced(plan, amountMinor) {
  assert.equal(plan.success, true, JSON.stringify(plan.errors));
  assert.equal(plan.valid, true);
  assert.equal(plan.persisted, false);
  assert.equal(plan.authoritativeWrites, false);
  assert.equal(plan.balance.balanced, true);
  assert.equal(plan.balance.debitMinor, amountMinor);
  assert.equal(plan.balance.creditMinor, amountMinor);
}

assert.equal(moneyToMinor(10.10), 1010);
assert.equal(moneyToMinor('0.01'), 1);
assert.equal(moneyToMinor(10.005), 1001);
assert.equal(minorToMoney(1001), 10.01);
assert.equal(moneyToMinor(-1), null);
assert.equal(moneyToMinor(''), null);

const metadata = financeCoreMetadata();
assert.equal(metadata.success, true);
assert.equal(metadata.version, TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION);
assert.equal(metadata.phase, 'F2');
assert.equal(metadata.mode, 'posting-plan-only');
assert.equal(metadata.persisted, false);
assert.equal(metadata.authoritativeWrites, false);
assert.equal(metadata.moneyPrecision, 'integer-piastres');
assert.deepEqual(metadata.treasuryAccountRoles.sort(), ['bank','cash-main']);
assert.equal(CHART_OF_ACCOUNTS_V1['1010'].role, 'cash-main');
assert.equal(CHART_OF_ACCOUNTS_V1['1020'].role, 'bank');
assert.equal(CHART_OF_ACCOUNTS_V1['1200'].role, 'inventory');
assert.ok(metadata.invariants.some(x => x.includes('COGS/stock consumption is not invented')));

const sales = buildFinancePostingPlan({
  ...base,
  type: 'sales-invoice.create',
  idempotencyKey: 'REQ-SALE-0001',
  invoiceId: 'INV-3569-1',
  customerId: 'CUST-1',
  orderId: '3569',
  lineId: '3569-1',
  profitCenterId: 'PC-PRINT',
  departmentId: 'DEPT-PRINT',
  itemId: 'ITEM-MUG',
  amount: 100
});
balanced(sales, 10000);
assert.deepEqual(sales.lines.map(x => x.accountCode), ['1100','4100']);
assert.equal(sales.lines[0].partyId, 'CUST-1');
assert.equal(sales.lines[0].orderId, '3569');
assert.equal(sales.lines[0].lineId, '3569-1');
assert.equal(sales.lines[1].profitCenterId, 'PC-PRINT');
assert.equal(sales.metadata.cogsPlanned, false);
assert.ok(!sales.lines.some(x => x.accountCode === '5100'), 'F2 must not invent COGS');

const collection = buildFinancePostingPlan({
  ...base,
  type: 'customer.collect',
  idempotencyKey: 'REQ-COLLECT-0001',
  paymentId: 'PAY-CUST-1',
  customerId: 'CUST-1',
  treasuryAccountCode: '1010',
  amount: 25.55
});
balanced(collection, 2555);
assert.deepEqual(collection.lines.map(x => x.accountCode), ['1010','1100']);
assert.equal(collection.metadata.subledgerEffect, 'receivable-decrease');
assert.equal(collection.metadata.treasuryEffect, 'increase');

const bankCollection = buildFinancePostingPlan({
  ...base,
  type: 'customer.collect',
  idempotencyKey: 'REQ-COLLECT-BANK-1',
  paymentId: 'PAY-CUST-BANK-1',
  customerId: 'CUST-1',
  treasuryAccountCode: '1020',
  amount: 40
});
balanced(bankCollection, 4000);
assert.equal(bankCollection.lines[0].accountCode, '1020');

const invalidCollectionTreasury = buildFinancePostingPlan({
  ...base,
  type: 'customer.collect',
  idempotencyKey: 'REQ-COLLECT-BAD-1',
  paymentId: 'PAY-CUST-BAD-1',
  customerId: 'CUST-1',
  treasuryAccountCode: '1200',
  amount: 40
});
assert.equal(invalidCollectionTreasury.success, false);
assert.ok(invalidCollectionTreasury.errors.some(x => x.includes('cash/bank treasury account')));

const purchaseInventory = buildFinancePostingPlan({
  ...base,
  type: 'purchase.create',
  idempotencyKey: 'REQ-PUR-0001',
  purchaseId: 'PUR-1',
  supplierId: 'SUP-1',
  itemId: 'ITEM-PAPER',
  departmentId: 'DEPT-PRINT',
  purchaseKind: 'inventory',
  amount: 300
});
balanced(purchaseInventory, 30000);
assert.deepEqual(purchaseInventory.lines.map(x => x.accountCode), ['1200','2100']);
assert.equal(purchaseInventory.metadata.purchaseKind, 'inventory');
assert.equal(purchaseInventory.metadata.subledgerEffect, 'payable-increase');

const purchaseExpense = buildFinancePostingPlan({
  ...base,
  type: 'purchase.create',
  idempotencyKey: 'REQ-PUR-EXP-1',
  purchaseId: 'PUR-EXP-1',
  supplierId: 'SUP-1',
  purchaseKind: 'expense',
  expenseAccountCode: '5200',
  amount: 50
});
balanced(purchaseExpense, 5000);
assert.deepEqual(purchaseExpense.lines.map(x => x.accountCode), ['5200','2100']);

const supplierPayment = buildFinancePostingPlan({
  ...base,
  type: 'purchase.pay',
  idempotencyKey: 'REQ-SUP-PAY-1',
  paymentId: 'PAY-SUP-1',
  supplierId: 'SUP-1',
  treasuryAccountCode: '1010',
  amount: 75
});
balanced(supplierPayment, 7500);
assert.deepEqual(supplierPayment.lines.map(x => x.accountCode), ['2100','1010']);
assert.equal(supplierPayment.metadata.subledgerEffect, 'payable-decrease');

const badSupplierTreasury = buildFinancePostingPlan({
  ...base,
  type: 'purchase.pay',
  idempotencyKey: 'REQ-SUP-PAY-BAD-1',
  paymentId: 'PAY-SUP-BAD-1',
  supplierId: 'SUP-1',
  treasuryAccountCode: '1300',
  amount: 75
});
assert.equal(badSupplierTreasury.success, false);
assert.ok(badSupplierTreasury.errors.some(x => x.includes('cash/bank treasury account')));

const cashExpense = buildFinancePostingPlan({
  ...base,
  type: 'expense.create',
  idempotencyKey: 'REQ-EXP-CASH-1',
  expenseId: 'EXP-CASH-1',
  expenseAccountCode: '5200',
  paymentMode: 'cash',
  treasuryAccountCode: '1010',
  departmentId: 'DEPT-PRINT',
  profitCenterId: 'PC-PRINT',
  amount: 20
});
balanced(cashExpense, 2000);
assert.deepEqual(cashExpense.lines.map(x => x.accountCode), ['5200','1010']);
assert.equal(cashExpense.metadata.treasuryEffect, 'decrease');

const payableExpense = buildFinancePostingPlan({
  ...base,
  type: 'expense.create',
  idempotencyKey: 'REQ-EXP-PAY-1',
  expenseId: 'EXP-PAY-1',
  supplierId: 'SUP-2',
  expenseAccountCode: '5200',
  paymentMode: 'payable',
  amount: 85
});
balanced(payableExpense, 8500);
assert.deepEqual(payableExpense.lines.map(x => x.accountCode), ['5200','2100']);
assert.equal(payableExpense.metadata.subledgerEffect, 'payable-increase');

const payableExpenseMissingSupplier = buildFinancePostingPlan({
  ...base,
  type: 'expense.create',
  idempotencyKey: 'REQ-EXP-PAY-MISSING',
  expenseId: 'EXP-PAY-MISSING',
  paymentMode: 'payable',
  amount: 85
});
assert.equal(payableExpenseMissingSupplier.success, false);
assert.ok(payableExpenseMissingSupplier.errors.some(x => x.includes('partyId/supplierId is required')));

const transfer = buildFinancePostingPlan({
  ...base,
  type: 'treasury.transfer',
  idempotencyKey: 'REQ-TRANSFER-1',
  transferId: 'TRF-1',
  fromAccountCode: '1010',
  toAccountCode: '1020',
  amount: 100
});
balanced(transfer, 10000);
assert.deepEqual(transfer.lines.map(x => x.accountCode), ['1020','1010']);
assert.equal(transfer.metadata.transfer, true);

const invalidTransferToInventory = buildFinancePostingPlan({
  ...base,
  type: 'treasury.transfer',
  idempotencyKey: 'REQ-TRANSFER-BAD-1',
  transferId: 'TRF-BAD-1',
  fromAccountCode: '1010',
  toAccountCode: '1200',
  amount: 100
});
assert.equal(invalidTransferToInventory.success, false);
assert.ok(invalidTransferToInventory.errors.some(x => x.includes('cash/bank treasury accounts')));

const reverse = reverseJournalPlan(sales, {
  ...base,
  type: 'journal.reverse',
  idempotencyKey: 'REQ-REV-SALE-1',
  reversalId: 'REV-INV-3569-1'
});
balanced(reverse, 10000);
assert.equal(reverse.metadata.reversal, true);
assert.equal(reverse.metadata.originalJournalId, sales.journalId);
assert.equal(reverse.lines[0].accountCode, sales.lines[0].accountCode);
assert.equal(reverse.lines[0].debitMinor, sales.lines[0].creditMinor);
assert.equal(reverse.lines[0].creditMinor, sales.lines[0].debitMinor);
assert.equal(reverse.lines[1].debitMinor, sales.lines[1].creditMinor);
assert.equal(reverse.lines[1].creditMinor, sales.lines[1].debitMinor);

const missingIdempotency = buildFinancePostingPlan({
  ...base,
  type: 'customer.collect',
  paymentId: 'PAY-NO-IDEMP',
  customerId: 'CUST-1',
  amount: 10
});
assert.equal(missingIdempotency.success, false);
assert.ok(missingIdempotency.errors.some(x => x.includes('idempotencyKey is required')));

const wrongCurrency = buildFinancePostingPlan({
  ...base,
  currency: 'USD',
  type: 'customer.collect',
  idempotencyKey: 'REQ-USD-1',
  paymentId: 'PAY-USD-1',
  customerId: 'CUST-1',
  amount: 10
});
assert.equal(wrongCurrency.success, false);
assert.ok(wrongCurrency.errors.some(x => x.includes('currency must be EGP')));

const profitShareBlocked = buildFinancePostingPlan({
  ...base,
  type: 'sales-invoice.create',
  idempotencyKey: 'REQ-SHARE-1',
  invoiceId: 'INV-SHARE-1',
  customerId: 'CUST-1',
  orderId: '4000',
  lineId: '4000-1',
  profitCenterId: 'PC-PRINT',
  amount: 100,
  partnerPercentage: 40
});
assert.equal(profitShareBlocked.success, false);
assert.ok(profitShareBlocked.errors.some(x => x.includes('profit-sharing fields are forbidden')));

const nestedProfitShareBlocked = buildFinancePostingPlan({
  ...base,
  type: 'expense.create',
  idempotencyKey: 'REQ-SHARE-NESTED-1',
  expenseId: 'EXP-SHARE-1',
  paymentMode: 'cash',
  amount: 10,
  metadata: { investorPercentage: 20 }
});
assert.equal(nestedProfitShareBlocked.success, false);
assert.ok(nestedProfitShareBlocked.errors.some(x => x.includes('metadata.investorPercentage')));

const invalidUnbalanced = validateJournalPlan({
  lines: [
    { accountCode: '1010', debitMinor: 1000, creditMinor: 0 },
    { accountCode: '4100', debitMinor: 0, creditMinor: 900 }
  ]
});
assert.equal(invalidUnbalanced.valid, false);
assert.equal(invalidUnbalanced.balanced, false);
assert.ok(invalidUnbalanced.errors.includes('journal is not balanced'));

console.log('TrendOS Accounting F2 Finance Core V1 tests: PASS');
