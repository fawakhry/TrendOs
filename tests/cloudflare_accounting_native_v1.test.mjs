import assert from 'node:assert/strict';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath,
  TRENDOS_ACCOUNTING_NATIVE_VERSION
} from '../cloudflare-d1/src/accounting-native-module.mjs';

const env = {
  TRENDOS_CLOUD_WRITE_V1_ENABLED: 'false',
  EDGE_SESSION_SECRET: 'native-ci-test-secret'
};

for (const path of [
  '/trendos/accounting',
  '/v1/accounting/integration',
  '/v1/accounting/capabilities',
  '/v1/accounting/contract',
  '/v1/accounting/validate',
  '/v1/accounting/foundation',
  '/v1/accounting/foundation/validate',
  '/v1/accounting/operations/line'
]) {
  assert.equal(isAccountingNativeModulePath(path), true, `native Accounting route missing: ${path}`);
}
assert.equal(isAccountingNativeModulePath('/accounting'), false);

const integrationResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/integration'),
  env
);
assert.equal(integrationResponse.status, 200);
const integration = await integrationResponse.json();
assert.equal(integration.success, true);
assert.equal(integration.version, TRENDOS_ACCOUNTING_NATIVE_VERSION);
assert.equal(integration.platform, 'TrendOS');
assert.equal(integration.nativeModule, true);
assert.equal(integration.standaloneProduct, false);
assert.equal(integration.easyStoreRole, 'historical-working-trendos-accounting-baseline');
assert.equal(integration.authoritativeWrites, false);
assert.equal(integration.writeAuthority, 'google-sheets-apps-script');
assert.equal(integration.sharedIdentity.orderKey, 'Order ID');
assert.equal(integration.sharedIdentity.lineKey, 'Line ID');
assert.equal(integration.sharedIdentity.profitCenterKey, 'Profit Center ID');
assert.ok(integration.operationsToAccounting.includes('approved selling price / approved line amount'));
assert.ok(integration.operationsToAccounting.includes('Profit Center ID'));
assert.ok(integration.accountingToOperations.includes('factual line profit'));
const invariantText = integration.invariants.map(x => String(x).toLowerCase());
assert.ok(invariantText.some(x => x.includes('never invents an operational price')));
assert.ok(invariantText.some(x => x.includes('same event')));
assert.ok(invariantText.some(x => x.includes('profit-sharing percentages')));
assert.ok(invariantText.some(x => x.includes('easystore behavior')));
assert.ok(Array.isArray(integration.foundationEndpoints));
assert.ok(integration.foundationEndpoints.some(x => x.includes('/v1/accounting/operations/line')));

const capabilitiesResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/capabilities'),
  env
);
assert.equal(capabilitiesResponse.status, 200);
const capabilities = await capabilitiesResponse.json();
assert.equal(capabilities.success, true);
assert.equal(capabilities.product, 'TrendOS Accounting');
assert.equal(capabilities.nativeModule, true);
assert.equal(capabilities.easyStoreRole, 'historical-working-trendos-accounting-baseline');
assert.equal(capabilities.authoritativeWrites, false);
assert.equal(capabilities.migrationStrategy, 'preserve-verified-behavior-capability-by-capability');
for (const capability of ['treasury','custody','day-close','line-profit']) {
  assert.ok(capabilities.capabilities.some(x => x.id === capability), `missing capability ${capability}`);
}
assert.equal(capabilities.idContracts.orderId.owner, 'TrendOS Operations');
assert.equal(capabilities.idContracts.lineId.owner, 'TrendOS Operations');
assert.equal(capabilities.idContracts.invoiceId.owner, 'TrendOS Accounting');
assert.ok(capabilities.nonNegotiables.some(x => x.toLowerCase().includes('no employee-name authorization')));
assert.ok(capabilities.nonNegotiables.some(x => x.includes('Line ID + Profit Center')));

const contractResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/contract'),
  env
);
assert.equal(contractResponse.status, 200);
const contract = await contractResponse.json();
assert.equal(contract.success, true);
assert.equal(contract.authoritativeWrites, false);
assert.equal(contract.persistence, 'none');
assert.ok(contract.envelope.required.includes('idempotencyKey'));

const foundationResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/foundation'),
  env
);
assert.equal(foundationResponse.status, 200);
const foundation = await foundationResponse.json();
assert.equal(foundation.success, true);
assert.equal(foundation.authoritativeWrites, false);

// UI copy/Arabic text is verified by the dedicated deployed runtime workflow.
// Native CI only proves that the shell is routed and remains a non-write response.
const nativePageResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/trendos/accounting'),
  env
);
assert.equal(nativePageResponse.status, 200);
assert.equal(nativePageResponse.headers.get('x-trendos-native-module'), 'accounting');
assert.match(nativePageResponse.headers.get('content-type') || '', /text\/html/);

for (const path of [
  '/v1/accounting/integration',
  '/v1/accounting/capabilities',
  '/v1/accounting/contract',
  '/v1/accounting/foundation'
]) {
  const blocked = await handleAccountingNativeModuleRequest(
    new Request(`https://preview.test${path}`, { method: 'POST' }),
    env
  );
  assert.equal(blocked.status, 405, `POST must be blocked for ${path}`);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.authoritativeWrites, false);
}

const unauthenticatedLineRead = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/operations/line?orderId=ORDER-1&lineId=LINE-1'),
  env
);
assert.equal(unauthenticatedLineRead.status, 401);
const unauthenticatedLineBody = await unauthenticatedLineRead.json();
assert.equal(unauthenticatedLineBody.authoritativeWrites, false);

console.log('TrendOS Accounting Native Module V1 tests: PASS');