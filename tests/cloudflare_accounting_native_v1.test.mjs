import assert from 'node:assert/strict';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath,
  TRENDOS_ACCOUNTING_NATIVE_VERSION
} from '../cloudflare-d1/src/accounting-native-module.mjs';

const env = { TRENDOS_CLOUD_WRITE_V1_ENABLED: 'false' };

assert.equal(isAccountingNativeModulePath('/trendos/accounting'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/integration'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/capabilities'), true);
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
assert.ok(integration.invariants.some(x => x.includes('never invents an operational price')));
assert.ok(integration.invariants.some(x => x.includes('same event')));
assert.ok(integration.invariants.some(x => x.includes('profit-sharing percentages')));
assert.ok(integration.invariants.some(x => x.includes('EasyStore behavior')));

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
assert.ok(capabilities.capabilities.some(x => x.id === 'treasury'));
assert.ok(capabilities.capabilities.some(x => x.id === 'custody'));
assert.ok(capabilities.capabilities.some(x => x.id === 'day-close'));
assert.ok(capabilities.capabilities.some(x => x.id === 'line-profit'));
assert.equal(capabilities.idContracts.orderId.owner, 'TrendOS Operations');
assert.equal(capabilities.idContracts.lineId.owner, 'TrendOS Operations');
assert.equal(capabilities.idContracts.invoiceId.owner, 'TrendOS Accounting');
assert.ok(capabilities.nonNegotiables.some(x => x.includes('no employee-name authorization')));
assert.ok(capabilities.nonNegotiables.some(x => x.includes('Line ID + Profit Center')));

const nativePageResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/trendos/accounting'),
  env
);
assert.equal(nativePageResponse.status, 200);
assert.equal(nativePageResponse.headers.get('x-trendos-native-module'), 'accounting');
const html = await nativePageResponse.text();
assert.match(html, /TrendOS Native Module/);
assert.match(html, /EasyStore/);
assert.match(html, /Order ID \/ Line ID/);
assert.match(html, /TrendOS Accounting/);
assert.match(html, /بدون كتابة على الإنتاج/);

for (const path of ['/v1/accounting/integration', '/v1/accounting/capabilities']) {
  const blocked = await handleAccountingNativeModuleRequest(
    new Request(`https://preview.test${path}`, { method: 'POST' }),
    env
  );
  assert.equal(blocked.status, 405);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.nativeModule, true);
  assert.equal(blockedBody.authoritativeWrites, false);
}

console.log('TrendOS Accounting Native Module V1 tests: PASS');
