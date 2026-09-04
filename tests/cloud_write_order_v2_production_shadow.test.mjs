import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProductionOrderShadowV1 } from '../cloudflare-d1/src/cloud-write-order-v2-production-shadow.mjs';

const source = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write-order-v2-production-shadow.mjs', import.meta.url), 'utf8');

for (const forbidden of [
  /fetch\s*\(/,
  /D1Database/,
  /\.prepare\s*\(/,
  /SpreadsheetApp/,
  /PropertiesService/,
  /UrlFetchApp/,
  /createManualOrder_/,
  /wrangler/,
  /cloudflare\.com/,
  /script\.google\.com/
]) {
  assert.equal(forbidden.test(source), false, `forbidden shadow capability: ${forbidden}`);
}

const base = {
  clientRequestId: 'prod-shadow-qualification-001',
  customerName: 'Production Shadow Qualification',
  customerPhone: '01001112233',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '991',
  department: 'طباعة',
  itemName: 'Production Shadow Qualification Item',
  qty: 1,
  priority: 'عادي',
  status: 'طلب جديد',
  heatPress: 'لا',
  flyPrint: 'لا',
  source: 'TrendOS Production Shadow',
  notes: 'No-write production shadow qualification'
};

const first = buildProductionOrderShadowV1(base);
assert.equal(first.success, true);
assert.equal(first.valid, true);
assert.equal(first.shadowOnly, true);
assert.equal(first.productionShadow, true);
assert.equal(first.readOnly, true);
assert.equal(first.mutationFree, true);
assert.equal(first.canonicalWriterInvoked, false);
assert.equal(first.d1Written, false);
assert.equal(first.sheetsWritten, false);
assert.equal(first.mutationCount, 0);
assert.equal(first.networkRequests, 0);
assert.equal(first.propertyWrites, 0);
assert.equal(first.productionWriteEnabled, false);
assert.equal(first.productionCutover, false);
assert.equal(first.productionRouteIntegrated, false);
assert.equal(first.businessOrderIdStrategy, 'apps-script-allocated');
assert.equal(first.orderIdPresent, false);
assert.equal(Object.hasOwn(first.canonicalCreateParams, 'orderId'), false);
assert.equal(first.canonicalCreateParams.clientRequestId, base.clientRequestId);
assert.equal(first.canonicalCreateParams.department, 'طباعة');
assert.equal(first.canonicalCreateParams.itemName, base.itemName);
assert.match(first.shadowFingerprint, /^[a-f0-9]{64}$/);

// Deterministic replay of the same shadow input must have the same fingerprint.
const replay = buildProductionOrderShadowV1({ ...base });
assert.equal(replay.success, true);
assert.equal(replay.shadowFingerprint, first.shadowFingerprint);
assert.deepEqual(replay.canonicalCreateParams, first.canonicalCreateParams);

// Business Order ID must remain Apps Script-owned.
const withOrderId = buildProductionOrderShadowV1({ ...base, orderId: '9999' });
assert.equal(withOrderId.success, false);
assert.equal(withOrderId.code, 'canonical-contract-rejected');
assert.equal(withOrderId.sheetsWritten, false);
assert.equal(withOrderId.d1Written, false);

// Credentials are refused before planning.
const withCredentials = buildProductionOrderShadowV1({ ...base, token: 'must-not-enter-shadow' });
assert.equal(withCredentials.success, false);
assert.equal(withCredentials.code, 'credentials-refused');
assert.equal(withCredentials.networkRequests, 0);

// Invalid business contract is fail-closed and mutation-free.
const invalid = buildProductionOrderShadowV1({ ...base, itemName: '', qty: 0 });
assert.equal(invalid.success, false);
assert.equal(invalid.code, 'canonical-contract-rejected');
assert.equal(invalid.mutationFree, true);
assert.equal(invalid.sheetsWritten, false);
assert.equal(invalid.d1Written, false);

console.log('CLOUD_WRITE_ORDER_V2_PRODUCTION_SHADOW_CONTRACT_PASS');
