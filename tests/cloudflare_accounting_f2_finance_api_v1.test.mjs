import assert from 'node:assert/strict';
import {
  handleAccountingFinanceApiRequest,
  isAccountingFinanceApiPath
} from '../cloudflare-d1/src/accounting-finance-api-v1.mjs';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath,
  TRENDOS_ACCOUNTING_NATIVE_VERSION
} from '../cloudflare-d1/src/accounting-native-module.mjs';

assert.equal(isAccountingFinanceApiPath('/v1/accounting/finance'), true);
assert.equal(isAccountingFinanceApiPath('/v1/accounting/finance/plan'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/finance'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/finance/plan'), true);

const metadataResponse = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance')
);
assert.equal(metadataResponse.status, 200);
assert.equal(metadataResponse.headers.get('x-trendos-accounting-persistence'), 'none');
const metadata = await metadataResponse.json();
assert.equal(metadata.success, true);
assert.equal(metadata.phase, 'F2');
assert.equal(metadata.authoritativeWrites, false);
assert.equal(metadata.persisted, false);
assert.equal(metadata.persistence, 'none');
assert.equal(metadata.treasuryIdentity.requiredForTreasuryLegs, true);

const collectionCommand = {
  type: 'customer.collect',
  idempotencyKey: 'F2-API-COLLECT-001',
  actorId: 'ACCOUNTANT-1',
  source: 'trendos-accounting-preview',
  occurredAt: '2026-09-05T01:15:00Z',
  documentId: 'PAY-API-1',
  customerId: 'CUST-API-1',
  cashboxId: 'CASHBOX-MAIN',
  treasuryAccountCode: '1010',
  amount: 100.25
};

const planResponse = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(collectionCommand)
  })
);
assert.equal(planResponse.status, 200);
assert.equal(planResponse.headers.get('x-trendos-accounting-persistence'), 'none');
const plan = await planResponse.json();
assert.equal(plan.success, true);
assert.equal(plan.valid, true);
assert.equal(plan.planningOnly, true);
assert.equal(plan.persisted, false);
assert.equal(plan.authoritativeWrites, false);
assert.equal(plan.persistence, 'none');
assert.equal(plan.balance.debitMinor, 10025);
assert.equal(plan.balance.creditMinor, 10025);
assert.equal(plan.lines.find(x => x.accountCode === '1010').treasuryId, 'CASHBOX-MAIN');
assert.equal(plan.lines.find(x => x.accountCode === '1100').partyId, 'CUST-API-1');

const missingCashboxResponse = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...collectionCommand, idempotencyKey: 'F2-API-COLLECT-002', cashboxId: '' })
  })
);
assert.equal(missingCashboxResponse.status, 422);
const missingCashbox = await missingCashboxResponse.json();
assert.equal(missingCashbox.valid, false);
assert.equal(missingCashbox.persisted, false);
assert.ok(missingCashbox.errors.some(x => /treasuryId/.test(x)));

const invalidJson = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance/plan', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken'
  })
);
assert.equal(invalidJson.status, 400);
const invalidJsonBody = await invalidJson.json();
assert.equal(invalidJsonBody.authoritativeWrites, false);
assert.equal(invalidJsonBody.persistence, 'none');

const blockedMetadataPost = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance', { method: 'POST' })
);
assert.equal(blockedMetadataPost.status, 405);

const blockedPlanGet = await handleAccountingFinanceApiRequest(
  new Request('https://preview.test/v1/accounting/finance/plan')
);
assert.equal(blockedPlanGet.status, 405);

const nativeIntegrationResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/integration'), {}
);
assert.equal(nativeIntegrationResponse.status, 200);
const nativeIntegration = await nativeIntegrationResponse.json();
assert.equal(nativeIntegration.version, TRENDOS_ACCOUNTING_NATIVE_VERSION);
assert.equal(nativeIntegration.sharedIdentity.treasuryKey, 'Treasury ID / Cashbox ID');
assert.ok(nativeIntegration.financeEndpoints.some(x => x.includes('/v1/accounting/finance/plan')));

const nativePlanResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/finance/plan', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(collectionCommand)
  }), {}
);
assert.equal(nativePlanResponse.status, 200);
const nativePlan = await nativePlanResponse.json();
assert.equal(nativePlan.planningOnly, true);
assert.equal(nativePlan.persistence, 'none');
assert.equal(nativePlan.authoritativeWrites, false);

console.log('TrendOS Accounting F2 Finance API V1 tests: PASS');
