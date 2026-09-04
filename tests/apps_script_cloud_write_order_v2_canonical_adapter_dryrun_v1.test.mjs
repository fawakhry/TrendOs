import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildCanonicalOrderCreateIntentV2 } from '../cloudflare-d1/src/cloud-write-order-contract-v2.mjs';

const adapterPath = new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1.gs', import.meta.url);
const source = fs.readFileSync(adapterPath, 'utf8');

function assertStaticSafety() {
  const forbidden = [
    /SpreadsheetApp/,
    /UrlFetchApp/,
    /DriveApp/,
    /PropertiesService/,
    /LockService/,
    /CacheService/,
    /ScriptApp/,
    /\.appendRow\s*\(/,
    /\.setValue\s*\(/,
    /\.setValues\s*\(/,
    /\.deleteRow\s*\(/,
    /\.insertRow\s*\(/,
    /\.clear(?:Content|Format)?\s*\(/,
    /\.setProperty\s*\(/,
    /\.deleteProperty\s*\(/,
    /makeOrderId_\s*\(/,
    /Utilities\./
  ];
  for (const pattern of forbidden) {
    assert.equal(pattern.test(source), false, `forbidden adapter capability: ${pattern}`);
  }
}

const context = vm.createContext({ console });
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1.gs' });
const adapt = context.trendosCloudWriteOrderV2CanonicalAdapterDryRunV1_;
assert.equal(typeof adapt, 'function');

// If the adapter ever tries to invoke the canonical writer, the runtime test must fail immediately.
context.createManualOrder_ = () => { throw new Error('CREATE_MANUAL_ORDER_MUST_NOT_BE_CALLED'); };

function assertCommon(result) {
  assert.equal(result.success, true);
  assert.equal(result.valid, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.mutationFree, true);
  assert.equal(result.wouldCall, 'createManualOrder_');
  assert.equal(result.wouldInvoke, false);
  assert.equal(result.canonicalEnvelopeReady, true);
  assert.equal(result.canonicalInvocationAuthorized, false);
  assert.equal(result.safeForCanonicalInvocation, false);
  assert.equal(result.businessOrderIdStrategy, 'apps-script-allocated');
  assert.equal(result.orderIdPresent, false);
  assert.equal(result.sheetsWritten, false);
  assert.equal(result.mutationCount, 0);
  assert.equal(result.networkRequests, 0);
  assert.equal(result.propertyWrites, 0);
  assert.deepEqual(Array.from(result.authBoundary.requiredFields), ['username', 'token']);
  assert.equal(result.authBoundary.requiredByCanonicalPath, true);
  assert.equal(result.authBoundary.credentialsAcceptedFromCloudPlan, false);
  assert.equal(result.authBoundary.supplied, false);
  assert.equal(result.authBoundary.resolution, 'separate-authorized-internal-bridge-required');
  assert.equal(Object.hasOwn(result.canonicalParameterEnvelope, 'orderId'), false);
  assert.equal(Object.hasOwn(result.canonicalParameterEnvelope, 'username'), false);
  assert.equal(Object.hasOwn(result.canonicalParameterEnvelope, 'token'), false);
}

assertStaticSafety();

// Registered printing customer: exact createManualOrder_ public aliases.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-REGISTERED-001',
    customerName: 'V2 Registered Qualification',
    customerPhone: '01012345678',
    department: 'طباعة',
    itemName: 'V2 Canonical Adapter Test',
    qty: 2,
    priority: 'عادي',
    status: 'طلب جديد',
    source: 'Cloud Write V2',
    notes: 'adapter dry-run'
  });
  assert.equal(plan.success, true);
  const result = adapt(plan);
  assertCommon(result);
  assert.deepEqual(JSON.parse(JSON.stringify(result.canonicalParameterEnvelope)), {
    clientRequestId: 'CWV2-ADAPTER-REGISTERED-001',
    customerName: 'V2 Registered Qualification',
    customerPhone: '01012345678',
    customerMode: 'عميل مسجل',
    externalCustomerId: '',
    department: 'طباعة',
    itemName: 'V2 Canonical Adapter Test',
    qty: 2,
    priority: 'عادي',
    status: 'طلب جديد',
    heatPress: 'لا',
    flyPrint: 'لا',
    source: 'Cloud Write V2',
    notes: 'adapter dry-run'
  });
}

// External/light customer identity must preserve the exact aliases consumed by createManualOrder_.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-EXTERNAL-001',
    customerMode: 'خارجي',
    externalCustomerId: '778899',
    customerName: 'عميل خارجي - 778899',
    department: 'ليزر',
    itemName: 'Laser synthetic item',
    qty: 1
  });
  assert.equal(plan.success, true);
  const result = adapt(plan);
  assertCommon(result);
  assert.equal(result.canonicalParameterEnvelope.customerMode, 'خارجي / عابر');
  assert.equal(result.canonicalParameterEnvelope.externalCustomerId, '778899');
  assert.equal(result.canonicalParameterEnvelope.department, 'ليزر');
}

// Press normalization must arrive at the canonical Apps Script aliases.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-PRESS-001',
    customerName: 'Press Qualification',
    customerPhone: '01022223333',
    department: 'مكبس',
    itemName: 'Mug press test',
    qty: 1
  });
  const result = adapt(plan);
  assertCommon(result);
  assert.equal(result.canonicalParameterEnvelope.department, 'طباعة');
  assert.equal(result.canonicalParameterEnvelope.heatPress, 'نعم');
}

// Fly Print must remain printing-only and urgent.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-FLY-001',
    customerName: 'Fly Print Qualification',
    customerPhone: '01033334444',
    department: 'طباعة',
    itemName: 'Fly print test',
    qty: 1,
    flyPrint: true
  });
  const result = adapt(plan);
  assertCommon(result);
  assert.equal(result.canonicalParameterEnvelope.flyPrint, 'نعم');
  assert.equal(result.canonicalParameterEnvelope.priority, 'عاجل');
}

// Multi-department remains explicit; createManualOrder_ owns expansion/line IDs.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-MULTI-001',
    customerName: 'Multi Qualification',
    customerPhone: '01044445555',
    department: 'متعدد الأقسام',
    itemName: 'Multi test',
    qty: 1
  });
  const result = adapt(plan);
  assertCommon(result);
  assert.equal(result.canonicalParameterEnvelope.department, 'متعدد الأقسام');
  assert.equal(result.canonicalParameterEnvelope.heatPress, 'لا');
  assert.equal(result.canonicalParameterEnvelope.flyPrint, 'لا');
}

// Invalid/unqualified plan must fail closed.
{
  const result = adapt({});
  assert.equal(result.success, false);
  assert.equal(result.code, 'validated-v2-plan-required');
  assert.equal(result.sheetsWritten, false);
  assert.equal(result.mutationCount, 0);
}

// Business Order ID injected after V2 validation must still be refused by the adapter.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-ORDERID-001',
    customerName: 'Order ID Refusal',
    customerPhone: '01055556666',
    department: 'طباعة',
    itemName: 'Order ID refusal',
    qty: 1
  });
  plan.canonicalCreateParams.orderId = '999999';
  const result = adapt(plan);
  assert.equal(result.success, false);
  assert.equal(result.code, 'business-order-id-preallocation-refused');
  assert.equal(result.sheetsWritten, false);
}

// Credentials must never arrive from the Cloud plan.
{
  const plan = buildCanonicalOrderCreateIntentV2({
    clientRequestId: 'CWV2-ADAPTER-CREDS-001',
    customerName: 'Credential Refusal',
    customerPhone: '01066667777',
    department: 'طباعة',
    itemName: 'Credentials refusal',
    qty: 1
  });
  plan.canonicalCreateParams.username = 'must-not-cross';
  plan.canonicalCreateParams.token = 'must-not-cross';
  const result = adapt(plan);
  assert.equal(result.success, false);
  assert.equal(result.code, 'credentials-in-v2-plan-refused');
  assert.equal(result.sheetsWritten, false);
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_PASS');
