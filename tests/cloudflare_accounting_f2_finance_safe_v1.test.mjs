import assert from 'node:assert/strict';
import {
  buildSafeFinancePostingPlan,
  financeSafeMetadata,
  validateFinancePlanDimensions,
  TRENDOS_ACCOUNTING_FINANCE_SAFE_VERSION
} from '../cloudflare-d1/src/accounting-finance-safe-v1.mjs';

function base(type, suffix) {
  return {
    type,
    idempotencyKey: `F2-${suffix}-REQ-001`,
    actorId: 'USER-ACCOUNTING-1',
    source: 'trendos-accounting-test',
    occurredAt: '2026-09-05T01:00:00Z',
    currency: 'EGP'
  };
}

function assertSafe(plan) {
  assert.equal(plan.version, TRENDOS_ACCOUNTING_FINANCE_SAFE_VERSION);
  assert.equal(plan.success, true, JSON.stringify(plan.errors));
  assert.equal(plan.valid, true, JSON.stringify(plan.errors));
  assert.equal(plan.persisted, false);
  assert.equal(plan.authoritativeWrites, false);
  assert.equal(plan.persistence, 'none');
  assert.equal(plan.mutationExecuted, false);
  assert.equal(plan.balance.balanced, true);
  assert.equal(plan.balance.debitMinor, plan.balance.creditMinor);
  assert.ok(plan.balance.debitMinor > 0);
  assert.equal(validateFinancePlanDimensions(plan).ok, true);
}

const metadata = financeSafeMetadata();
assert.equal(metadata.authoritativeWrites, false);
assert.equal(metadata.persistence, 'none');
assert.equal(metadata.treasuryIdentity.requiredForTreasuryLegs, true);
assert.equal(metadata.commandTypeBridge['treasury.transfer'], 'treasury.post');
assert.equal(metadata.commandTypeBridge['journal.reverse'], 'reversal.create');

const sale = buildSafeFinancePostingPlan({
  ...base('sales-invoice.create', 'SALE'),
  documentId: 'INV-100',
  customerId: 'CUST-100',
  orderId: '3569',
  lineId: '3569-1',
  profitCenterId: 'PC-PRINT',
  amount: 125.55
});
assertSafe(sale);
assert.equal(sale.balance.debitMinor, 12555);
assert.equal(sale.lines[0].accountCode, '1100');
assert.equal(sale.lines[0].partyId, 'CUST-100');
assert.equal(sale.lines[1].accountCode, '4100');
assert.equal(sale.lines[1].orderId, '3569');
assert.equal(sale.lines[1].lineId, '3569-1');
assert.equal(sale.lines[1].profitCenterId, 'PC-PRINT');

const collection = buildSafeFinancePostingPlan({
  ...base('customer.collect', 'COLLECT'),
  documentId: 'PAY-CUST-100',
  customerId: 'CUST-100',
  cashboxId: 'CASHBOX-BENHA-MAIN',
  treasuryAccountCode: '1010',
  amount: 25.55
});
assertSafe(collection);
assert.equal(collection.lines.find(x => x.accountCode === '1010').treasuryId, 'CASHBOX-BENHA-MAIN');
assert.equal(collection.lines.find(x => x.accountCode === '1100').partyId, 'CUST-100');

const missingTreasury = buildSafeFinancePostingPlan({
  ...base('customer.collect', 'COLLECT-NO-CASHBOX'),
  documentId: 'PAY-CUST-101',
  customerId: 'CUST-101',
  amount: 10
});
assert.equal(missingTreasury.success, false);
assert.ok(missingTreasury.errors.some(x => /treasuryId/.test(x)));
assert.equal(missingTreasury.persisted, false);

const purchase = buildSafeFinancePostingPlan({
  ...base('purchase.create', 'PURCHASE'),
  documentId: 'PUR-500',
  supplierId: 'SUP-500',
  purchaseKind: 'inventory',
  itemId: 'ITEM-PAPER-A3',
  departmentId: 'DEPT-PRINT',
  amount: 900.10
});
assertSafe(purchase);
assert.equal(purchase.balance.debitMinor, 90010);
assert.equal(purchase.lines[0].accountCode, '1200');
assert.equal(purchase.lines[1].accountCode, '2100');
assert.equal(purchase.lines[1].partyId, 'SUP-500');

const supplierPay = buildSafeFinancePostingPlan({
  ...base('purchase.pay', 'SUP-PAY'),
  documentId: 'PAY-SUP-500',
  supplierId: 'SUP-500',
  treasuryId: 'BANK-CIB-01',
  treasuryAccountCode: '1020',
  amount: 300
});
assertSafe(supplierPay);
assert.equal(supplierPay.lines.find(x => x.accountCode === '1020').treasuryId, 'BANK-CIB-01');
assert.equal(supplierPay.lines.find(x => x.accountCode === '2100').partyId, 'SUP-500');

const cashExpense = buildSafeFinancePostingPlan({
  ...base('expense.create', 'EXP-CASH'),
  documentId: 'EXP-100',
  paymentMode: 'cash',
  expenseAccountCode: '5200',
  cashboxId: 'CASHBOX-BENHA-MAIN',
  amount: 75
});
assertSafe(cashExpense);
assert.equal(cashExpense.lines.find(x => x.accountCode === '1010').treasuryId, 'CASHBOX-BENHA-MAIN');

const payableExpense = buildSafeFinancePostingPlan({
  ...base('expense.create', 'EXP-PAYABLE'),
  documentId: 'EXP-101',
  paymentMode: 'payable',
  supplierId: 'SUP-ELECTRIC',
  expenseAccountCode: '5200',
  amount: 450
});
assertSafe(payableExpense);
assert.equal(payableExpense.lines.find(x => x.accountCode === '2100').partyId, 'SUP-ELECTRIC');
assert.equal(payableExpense.lines.some(x => x.treasuryId), false);

const transfer = buildSafeFinancePostingPlan({
  ...base('treasury.transfer', 'TRANSFER'),
  documentId: 'TRF-1',
  fromAccountCode: '1010',
  toAccountCode: '1020',
  fromCashboxId: 'CASHBOX-BENHA-MAIN',
  toTreasuryId: 'BANK-CIB-01',
  amount: 1000
});
assertSafe(transfer);
assert.equal(transfer.metadata.fromTreasuryId, 'CASHBOX-BENHA-MAIN');
assert.equal(transfer.metadata.toTreasuryId, 'BANK-CIB-01');
assert.equal(transfer.lines.find(x => x.creditMinor > 0).treasuryId, 'CASHBOX-BENHA-MAIN');
assert.equal(transfer.lines.find(x => x.debitMinor > 0).treasuryId, 'BANK-CIB-01');

const sameTreasuryTransfer = buildSafeFinancePostingPlan({
  ...base('treasury.transfer', 'TRANSFER-SAME'),
  documentId: 'TRF-2',
  fromAccountCode: '1010',
  toAccountCode: '1020',
  fromTreasuryId: 'TREASURY-X',
  toTreasuryId: 'TREASURY-X',
  amount: 50
});
assert.equal(sameTreasuryTransfer.success, false);
assert.ok(sameTreasuryTransfer.errors.includes('treasury transfer entities must differ'));

const reversal = buildSafeFinancePostingPlan({
  ...base('journal.reverse', 'REVERSAL'),
  documentId: 'REV-PAY-CUST-100',
  reason: 'اختبار عكس التحصيل',
  originalPlan: collection
});
assertSafe(reversal);
assert.equal(reversal.metadata.originalJournalId, collection.journalId);
assert.equal(reversal.lines[0].debitMinor, collection.lines[0].creditMinor);
assert.equal(reversal.lines[0].creditMinor, collection.lines[0].debitMinor);
assert.equal(reversal.lines.find(x => x.accountCode === '1010').treasuryId, 'CASHBOX-BENHA-MAIN');
assert.equal(reversal.lines.find(x => x.accountCode === '1100').partyId, 'CUST-100');

const unbalancedOriginal = {
  ...collection,
  journalId: 'JRN-BROKEN',
  lines: collection.lines.map((x, i) => i === 0 ? { ...x, debitMinor: x.debitMinor + 1, debit: x.debit + 0.01 } : x)
};
const rejectedReversal = buildSafeFinancePostingPlan({
  ...base('journal.reverse', 'REV-BROKEN'),
  documentId: 'REV-BROKEN',
  reason: 'must reject',
  originalPlan: unbalancedOriginal
});
assert.equal(rejectedReversal.success, false);
assert.ok(rejectedReversal.errors.some(x => /original journal plan/.test(x)));

const missingPartyJournal = {
  ...collection,
  lines: collection.lines.map(x => x.accountCode === '1100' ? { ...x, partyId: '' } : x)
};
const dimensionCheck = validateFinancePlanDimensions(missingPartyJournal);
assert.equal(dimensionCheck.ok, false);
assert.ok(dimensionCheck.errors.some(x => /partyId/.test(x)));

console.log('TrendOS Accounting F2 Safe Finance tests: PASS');
