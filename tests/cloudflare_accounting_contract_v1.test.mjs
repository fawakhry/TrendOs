import assert from 'node:assert/strict';
import {
  TRENDOS_ACCOUNTING_CONTRACT_VERSION,
  accountingContractMetadata,
  validateAccountingCommand
} from '../cloudflare-d1/src/accounting-contract-v1.mjs';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath
} from '../cloudflare-d1/src/accounting-native-module.mjs';

const validLine = {
  entityType: 'SalesInvoiceLine',
  operation: 'upsert-sales-invoice-line',
  idempotencyKey: 'SALE-LINE-ORDER-100-001',
  payload: {
    invoiceLineId: 'INV-100-L1',
    invoiceId: 'INV-100',
    orderId: 'ORDER-100',
    sourceOrderId: 'ORDER-100',
    lineId: 'LINE-9001',
    itemId: 'ITEM-20X30',
    profitCenterId: 'PC-LASER',
    quantity: 2,
    unitPrice: 150,
    recognizedUnitCost: 70,
    lineTotal: 300,
    recognizedCost: 140,
    lineProfit: 160
  }
};

const metadata = accountingContractMetadata();
assert.equal(metadata.success, true);
assert.equal(metadata.version, TRENDOS_ACCOUNTING_CONTRACT_VERSION);
assert.equal(metadata.mode, 'validation-only');
assert.equal(metadata.authoritativeWrites, false);
assert.equal(metadata.persistence, 'none');
assert.ok(metadata.entityTypes.includes('SalesInvoice'));
assert.ok(metadata.entityTypes.includes('StockMovement'));
assert.ok(metadata.entityTypes.includes('CashTransaction'));
assert.deepEqual(metadata.enums.itemType, ['raw_material','semi_finished','finished_product','service']);
assert.ok(metadata.envelope.required.includes('idempotencyKey'));
assert.ok(metadata.invariants.some((x) => x.includes('never persists')));

const valid = validateAccountingCommand(validLine);
assert.equal(valid.success, true);
assert.equal(valid.valid, true);
assert.equal(valid.authoritativeWrites, false);
assert.equal(valid.persistence, 'none');
assert.equal(valid.normalized.payload.quantity, 2);
assert.equal(valid.normalized.payload.unitPrice, 150);
assert.equal(valid.normalized.payload.orderId, 'ORDER-100');
assert.equal(valid.errors.length, 0);

const missingIdempotency = validateAccountingCommand({ ...validLine, idempotencyKey: '' });
assert.equal(missingIdempotency.valid, false);
assert.ok(missingIdempotency.errors.some((x) => x.code === 'invalid-idempotency-key'));

const mismatch = validateAccountingCommand({
  ...validLine,
  idempotencyKey: 'SALE-LINE-MISMATCH-001',
  payload: { ...validLine.payload, sourceOrderId: 'ORDER-999' }
});
assert.equal(mismatch.valid, false);
assert.ok(mismatch.errors.some((x) => x.code === 'line-order-mismatch'));

const forbiddenShare = validateAccountingCommand({
  ...validLine,
  idempotencyKey: 'SALE-LINE-SHARE-001',
  payload: { ...validLine.payload, investorPercentage: 20 }
});
assert.equal(forbiddenShare.valid, false);
assert.ok(forbiddenShare.errors.some((x) => x.code === 'profit-sharing-field-forbidden'));

const invalidMoney = validateAccountingCommand({
  entityType: 'Expense',
  operation: 'create-expense',
  idempotencyKey: 'EXPENSE-INVALID-001',
  payload: { expenseId: 'EXP-1', expenseType: 'electricity', amount: -1, currency: 'EGP' }
});
assert.equal(invalidMoney.valid, false);
assert.ok(invalidMoney.errors.some((x) => x.code === 'invalid-money'));

const invalidQty = validateAccountingCommand({
  entityType: 'StockMovement',
  operation: 'move-stock',
  idempotencyKey: 'STOCK-INVALID-001',
  payload: { stockMovementId: 'SM-1', itemId: 'ITEM-1', direction: 'out', quantity: 0, reason: 'job-consumption' }
});
assert.equal(invalidQty.valid, false);
assert.ok(invalidQty.errors.some((x) => x.code === 'invalid-quantity'));

const invalidItemType = validateAccountingCommand({
  entityType: 'Item',
  operation: 'upsert-item',
  idempotencyKey: 'ITEM-INVALID-001',
  payload: { itemId: 'ITEM-1', itemType: 'mystery', name: 'Test', unit: 'piece' }
});
assert.equal(invalidItemType.valid, false);
assert.ok(invalidItemType.errors.some((x) => x.code === 'invalid-enum'));

const paidOverTotal = validateAccountingCommand({
  entityType: 'SalesInvoice',
  operation: 'create-invoice',
  idempotencyKey: 'INVOICE-OVERPAY-001',
  payload: { invoiceId: 'INV-X', orderId: 'ORDER-X', customerId: 'CUS-X', currency: 'EGP', total: 100, paid: 120 }
});
assert.equal(paidOverTotal.valid, false);
assert.ok(paidOverTotal.errors.some((x) => x.code === 'paid-exceeds-total'));

assert.equal(isAccountingNativeModulePath('/v1/accounting/contract'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/validate'), true);

const contractResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/contract'),
  {}
);
assert.equal(contractResponse.status, 200);
const contractBody = await contractResponse.json();
assert.equal(contractBody.version, TRENDOS_ACCOUNTING_CONTRACT_VERSION);
assert.equal(contractBody.authoritativeWrites, false);
assert.equal(contractBody.persistence, 'none');

const validateResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validLine)
  }),
  {}
);
assert.equal(validateResponse.status, 200);
const validateBody = await validateResponse.json();
assert.equal(validateBody.valid, true);
assert.equal(validateBody.nativeModule, true);
assert.equal(validateBody.authoritativeWrites, false);
assert.equal(validateBody.persistence, 'none');

const mismatchResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...validLine, idempotencyKey: 'RUNTIME-MISMATCH-001', payload: { ...validLine.payload, sourceOrderId: 'ORDER-OTHER' } })
  }),
  {}
);
assert.equal(mismatchResponse.status, 422);
const mismatchBody = await mismatchResponse.json();
assert.equal(mismatchBody.valid, false);
assert.ok(mismatchBody.errors.some((x) => x.code === 'line-order-mismatch'));
assert.equal(mismatchBody.persistence, 'none');

const invalidJsonResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{broken'
  }),
  {}
);
assert.equal(invalidJsonResponse.status, 400);
const invalidJsonBody = await invalidJsonResponse.json();
assert.equal(invalidJsonBody.authoritativeWrites, false);
assert.equal(invalidJsonBody.persistence, 'none');

const contractPost = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/contract', { method: 'POST' }),
  {}
);
assert.equal(contractPost.status, 405);

const validateGet = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/validate'),
  {}
);
assert.equal(validateGet.status, 405);

console.log('TrendOS Accounting Contract V1 tests: PASS');
