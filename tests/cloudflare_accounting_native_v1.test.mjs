import assert from 'node:assert/strict';
import {
  handleAccountingNativeModuleRequest,
  isAccountingNativeModulePath,
  TRENDOS_ACCOUNTING_NATIVE_VERSION
} from '../cloudflare-d1/src/accounting-native-module.mjs';

const env = { TRENDOS_CLOUD_WRITE_V1_ENABLED: 'false' };

assert.equal(isAccountingNativeModulePath('/trendos/accounting'), true);
assert.equal(isAccountingNativeModulePath('/v1/accounting/integration'), true);
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
assert.equal(integration.authoritativeWrites, false);
assert.equal(integration.writeAuthority, 'google-sheets-apps-script');
assert.equal(integration.sharedIdentity.orderKey, 'Order ID');
assert.equal(integration.sharedIdentity.lineKey, 'Line ID');
assert.ok(integration.operationsToAccounting.includes('approved selling price / approved line amount'));
assert.ok(integration.accountingToOperations.includes('factual line profit'));
assert.ok(integration.invariants.some(x => x.includes('never invents an operational price')));
assert.ok(integration.invariants.some(x => x.includes('same event')));
assert.ok(integration.invariants.some(x => x.includes('profit-sharing percentages')));

const nativePageResponse = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/trendos/accounting'),
  env
);
assert.equal(nativePageResponse.status, 200);
assert.equal(nativePageResponse.headers.get('x-trendos-native-module'), 'accounting');
const html = await nativePageResponse.text();
assert.match(html, /TrendOS Native Module/);
assert.match(html, /Order ID \/ Line ID/);
assert.match(html, /TrendOS Accounting/);
assert.match(html, /بدون كتابة على الإنتاج/);

const blocked = await handleAccountingNativeModuleRequest(
  new Request('https://preview.test/v1/accounting/integration', { method: 'POST' }),
  env
);
assert.equal(blocked.status, 405);
const blockedBody = await blocked.json();
assert.equal(blockedBody.nativeModule, true);
assert.equal(blockedBody.authoritativeWrites, false);

console.log('TrendOS Accounting Native Module V1 tests: PASS');
