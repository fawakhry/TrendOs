import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION,
  buildCanonicalOrderCreateIntentV2
} from '../cloudflare-d1/src/cloud-write-order-contract-v2.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'cloudflare-d1/src/cloud-write-order-contract-v2.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const productionIndex = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
const cloudWriteV1 = fs.readFileSync(path.join(root, 'cloudflare-d1/src/cloud-write.mjs'), 'utf8');
const wrangler = fs.readFileSync(path.join(root, 'cloudflare-d1/wrangler.toml'), 'utf8');

assert.equal(CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION, 'CLOUD_WRITE_ORDER_CONTRACT_V2_20260904');

// The V2 contract must remain a pure planning layer with no runtime mutation/transport APIs.
for (const forbidden of [
  /\bSpreadsheetApp\b/,
  /\bPropertiesService\b/,
  /\bUrlFetchApp\b/,
  /\bDriveApp\b/,
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.prepare\s*\(/,
  /\.batch\s*\(/,
  /\bfetch\s*\(/,
  /new\s+Response\s*\(/
]) {
  assert.equal(forbidden.test(source), false, `V2 contract contains forbidden side effect: ${forbidden}`);
}

// It must not be imported/wired into the production Worker or current V1 write handler.
assert.equal(productionIndex.includes('cloud-write-order-contract-v2'), false);
assert.equal(cloudWriteV1.includes('cloud-write-order-contract-v2'), false);
assert.match(wrangler, /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/);
assert.equal(/TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"true"/.test(wrangler), false);

function registered(overrides = {}) {
  return {
    clientRequestId: 'CWV2-CI-001',
    customerMode: 'عميل مسجل',
    customerName: 'عميل اختبار V2',
    customerPhone: '01012345678',
    department: 'طباعة',
    itemName: 'تابلوه اختبار',
    qty: 2,
    priority: 'عادي',
    status: 'طلب جديد',
    heatPress: false,
    flyPrint: false,
    source: 'Cloud Write V2 CI',
    notes: 'pure contract test',
    ...overrides
  };
}

let result = buildCanonicalOrderCreateIntentV2(registered());
assert.equal(result.success, true);
assert.equal(result.valid, true);
assert.equal(result.mutationFree, true);
assert.equal(result.productionRouteIntegrated, false);
assert.equal(result.intentType, 'createManualOrder');
assert.equal(result.businessOrderIdStrategy, 'apps-script-allocated');
assert.equal(result.canonicalCreateParams.department, 'طباعة');
assert.equal(result.canonicalCreateParams.itemName, 'تابلوه اختبار');
assert.equal(result.canonicalCreateParams.qty, 2);
assert.equal(result.canonicalCreateParams.heatPress, 'لا');
assert.equal(result.canonicalCreateParams.flyPrint, 'لا');
assert.equal(Object.prototype.hasOwnProperty.call(result.canonicalCreateParams, 'orderId'), false);
assert.ok(result.requiredCanonicalSideEffects.includes('order-lines-create'));
assert.ok(result.requiredCanonicalSideEffects.includes('activity-log'));
assert.ok(result.requiredCanonicalSideEffects.includes('apps-script-business-order-id-allocation'));

// A preallocated business Order ID is explicitly refused.
result = buildCanonicalOrderCreateIntentV2(registered({ orderId: 'CW-123' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('business-order-id-preallocation-refused'));

// Idempotent request identity is mandatory and syntax-limited.
result = buildCanonicalOrderCreateIntentV2(registered({ clientRequestId: '' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('valid-client-request-id-required'));
result = buildCanonicalOrderCreateIntentV2(registered({ clientRequestId: 'bad request key' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('valid-client-request-id-required'));

// Canonical operational line intent is mandatory.
result = buildCanonicalOrderCreateIntentV2(registered({ itemName: '' }));
assert.ok(result.errors.includes('item-name-required'));
result = buildCanonicalOrderCreateIntentV2(registered({ qty: 0 }));
assert.ok(result.errors.includes('positive-qty-required'));
result = buildCanonicalOrderCreateIntentV2(registered({ department: 'غير معروف' }));
assert.ok(result.errors.includes('supported-department-required'));

// First controlled V2 lane only creates an initial new order state.
result = buildCanonicalOrderCreateIntentV2(registered({ status: 'تحت التنفيذ' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('initial-status-must-be-new'));

// Registered customers must carry an unambiguous name+phone identity in V2.
result = buildCanonicalOrderCreateIntentV2(registered({ customerPhone: '' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('registered-customer-phone-required'));
result = buildCanonicalOrderCreateIntentV2(registered({ customerName: '' }));
assert.ok(result.errors.includes('registered-customer-name-required'));

// External/light customer contract follows the canonical minimum-ID rule and never requires a registered customer write.
result = buildCanonicalOrderCreateIntentV2({
  clientRequestId: 'CWV2-EXT-001',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '987',
  department: 'ليزر',
  itemName: 'حفر اختبار',
  qty: 1
});
assert.equal(result.success, true);
assert.equal(result.normalized.identityMode, 'external');
assert.equal(result.canonicalCreateParams.externalCustomerId, '987');
assert.equal(result.canonicalCreateParams.customerName, 'عميل خارجي - 987');
assert.equal(result.canonicalCreateParams.department, 'ليزر');

result = buildCanonicalOrderCreateIntentV2({
  clientRequestId: 'CWV2-EXT-002',
  customerMode: 'external',
  externalCustomerId: '12',
  department: 'ليزر',
  itemName: 'حفر اختبار',
  qty: 1
});
assert.equal(result.success, false);
assert.ok(result.errors.includes('external-customer-id-min-3-digits'));

// مكبس is canonicalized to Printing + heatPress=true, matching createManualOrder_.
result = buildCanonicalOrderCreateIntentV2(registered({ department: 'مكبس' }));
assert.equal(result.success, true);
assert.equal(result.canonicalCreateParams.department, 'طباعة');
assert.equal(result.canonicalCreateParams.heatPress, 'نعم');

// Fly print is Printing-only and promotes priority to urgent.
result = buildCanonicalOrderCreateIntentV2(registered({ department: 'طباعة', flyPrint: true, priority: 'عادي' }));
assert.equal(result.success, true);
assert.equal(result.canonicalCreateParams.priority, 'عاجل');
assert.equal(result.canonicalCreateParams.flyPrint, 'نعم');
result = buildCanonicalOrderCreateIntentV2(registered({ department: 'ليزر', flyPrint: true }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('fly-print-requires-print-department'));

// Multi-department remains explicit so the future Apps Script adapter can split Printing + Laser lines canonically.
result = buildCanonicalOrderCreateIntentV2(registered({ department: 'متعدد الأقسام' }));
assert.equal(result.success, true);
assert.equal(result.canonicalCreateParams.department, 'متعدد الأقسام');
assert.equal(result.canonicalCreateParams.heatPress, 'لا');

// Unsupported priority fails closed rather than inventing a business value.
result = buildCanonicalOrderCreateIntentV2(registered({ priority: 'فوري جدًا' }));
assert.equal(result.success, false);
assert.ok(result.errors.includes('supported-priority-required'));

console.log('Cloud Write Order Contract V2: PURE + APPS-SCRIPT-ID-OWNED + CANONICAL-CREATE-INTENT + NO-PRODUCTION-INTEGRATION PASS');
