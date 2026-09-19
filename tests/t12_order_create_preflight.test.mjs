import assert from 'node:assert/strict';
import {
  buildT12OrderCreatePreflight as preflight,
  T12_ORDER_CREATE_PREFLIGHT_VERSION
} from '../cloudflare-d1/t12/order-create-preflight.mjs';

const VALID = Object.freeze({
  clientRequestId: 'T12-test-1',
  customerName: 'عميل اختبار',
  customerPhone: '01001112233',
  department: 'طباعة',
  itemName: 'كارت',
  qty: 2
});
const SHA = 'a'.repeat(64);
const SIDE_EFFECTS = [
  'authorize-canCreateOrder','script-lock','v1908-request-idempotency',
  'customer-or-external-identity','debt-policy','department-normalization',
  'recent-duplicate-guard','open-order-department-scope',
  'apps-script-business-order-id-allocation','line-id-allocation',
  'orders-summary-upsert','order-lines-create','activity-log',
  'trend-master-message-queue','data-version-bump','saved-response-replay'
];
const EVIDENCE = Object.freeze({
  productionVersion: 155,
  productionVersion155SourceVerified: true,
  productionVersion155SourceFingerprint: SHA,
  verifiedSideEffects: SIDE_EFFECTS,
  orderNumberAllocatorVerified: true,
  atomicOrderAndLinesWriteVerified: true,
  idempotentReplayVerified: true,
  authoritativeWriteCutoverApproved: true
});
function failed(result, reason) {
  assert.equal(result.success, false);
  assert.equal(result.readyForImplementation, false);
  assert.equal(result.readyForProduction, false);
  assert.equal(result.mutationFree, true);
  assert.equal(result.productionRouteIntegrated, false);
  assert.ok(result.errors.includes(reason), JSON.stringify(result.errors));
}

const noEvidence = preflight(VALID);
failed(noEvidence, 'production-version-155-source-unverified');
assert.equal(noEvidence.canonicalCreateParams.clientRequestId, VALID.clientRequestId);
assert.ok(noEvidence.missingSideEffects.includes('line-id-allocation'));

const wrongVersion = preflight(VALID, {...EVIDENCE, productionVersion: 154});
failed(wrongVersion, 'production-version-155-source-unverified');

const unprovenAllocator = preflight(VALID, {...EVIDENCE, orderNumberAllocatorVerified: false});
failed(unprovenAllocator, 'cloud-order-number-allocation-unverified');

const noAtomic = preflight(VALID, {...EVIDENCE, atomicOrderAndLinesWriteVerified: false});
failed(noAtomic, 'atomic-order-and-lines-write-unverified');

const noReplay = preflight(VALID, {...EVIDENCE, idempotentReplayVerified: false});
failed(noReplay, 'idempotent-replay-unverified');

const noApproval = preflight(VALID, {...EVIDENCE, authoritativeWriteCutoverApproved: false});
failed(noApproval, 'authoritative-write-cutover-not-approved');

const missingSideEffect = preflight(VALID, {...EVIDENCE, verifiedSideEffects: SIDE_EFFECTS.slice(1)});
failed(missingSideEffect, 'canonical-create-side-effects-unverified');

for (const [field,value] of [
  ['orderId','1001'], ['items',[{itemName:'كارت'}]], ['lineItems',[]],
  ['payment',{amount:10}], ['total',120], ['الإجمالي',120]
]) {
  const result = preflight({...VALID, [field]:value}, EVIDENCE);
  failed(result, 'unsupported-create-fields-must-be-mapped');
  assert.ok(result.unsupportedFields.includes(field));
}
const noId = preflight({...VALID, clientRequestId:''}, EVIDENCE);
failed(noId, 'valid-client-request-id-required');

const noDepartment = preflight({...VALID, department:'غير معروف'}, EVIDENCE);
failed(noDepartment, 'supported-department-required');

const noSource = preflight(VALID,{...EVIDENCE,productionVersion155SourceFingerprint:'bad'});
failed(noSource,'production-version-155-source-unverified');

const validPaperPlan = preflight(VALID,EVIDENCE);
assert.equal(validPaperPlan.version,T12_ORDER_CREATE_PREFLIGHT_VERSION);
assert.equal(validPaperPlan.success,true);
assert.equal(validPaperPlan.readyForImplementation,true);
assert.equal(validPaperPlan.readyForProduction,false);
assert.equal(validPaperPlan.mutationFree,true);
assert.equal(validPaperPlan.businessOrderIdStrategy,'cloud-allocator-not-implemented');
assert.equal(validPaperPlan.canonicalCreateParams.itemName,'كارت');

console.log('T12 BRANCH-ONLY PREFLIGHT TESTS: PASS; no writes, no production routing.');
