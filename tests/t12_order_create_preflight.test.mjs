import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  evaluateT12OrderCreatePreflight, T12_REQUIRED_EVIDENCE,
  T12_REQUIRED_SIDE_EFFECTS, T12_PREFLIGHT_VERSION
} from '../cloudflare-d1/src/t12-order-create-preflight.mjs';

const good = () => ({
  clientRequestId: 'T12-CI-ONLY-001', customerName: 'عميل اختبار',
  customerPhone: '01012345678', department: 'طباعة', itemName: 'تابلوه',
  qty: 2, status: 'طلب جديد'
});
const allEvidence = Object.fromEntries(T12_REQUIRED_EVIDENCE.map(k => [k,true]));
const preflight = fs.readFileSync(new URL('../cloudflare-d1/src/t12-order-create-preflight.mjs',import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const legacy = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write.mjs',import.meta.url),'utf8');
assert.match(T12_PREFLIGHT_VERSION,/T12_ORDER_CREATE_PREFLIGHT/);
assert.equal(index.includes('t12-order-create-preflight'),false,'No production router wiring');
assert.equal(legacy.includes('t12-order-create-preflight'),false,'Legacy Cloud Write unchanged');
for(const forbidden of [/\bSpreadsheetApp\b/,/\bPropertiesService\b/,/\bfetch\s*\(/,/\.prepare\s*\(/,/\.batch\s*\(/,/\bnew\s+Response\s*\(/,/\bsetProperty\s*\(/]) {
  assert.equal(forbidden.test(preflight),false,'Preflight must be pure');
}
let n = 0;
function blocked(input,evidence,reason) {
  const out=evaluateT12OrderCreatePreflight(input,evidence);
  assert.equal(out.success,false);assert.equal(out.ready,false);
  assert.equal(out.productionCutoverAuthorized,false);
  assert.equal(out.mutationFree,true);assert.equal(out.routeIntegrated,false);
  assert.equal(out.reason,reason);n++;return out;
}
blocked(null,{},'invalid-input');
blocked(good(),null,'invalid-input');
blocked({...good(),clientRequestId:''},{},'canonical-intent-invalid');
blocked({...good(),orderId:'CW-123'},{},'unsupported-create-fields-must-be-mapped');
blocked({...good(),qty:0},{},'canonical-intent-invalid');
blocked({...good(),department:'مجهول'},{},'canonical-intent-invalid');
const partial=blocked(good(),{},'qualification-evidence-missing');
assert.deepEqual(partial.missing,T12_REQUIRED_EVIDENCE);
for(const key of T12_REQUIRED_EVIDENCE) {
  const evidence={...allEvidence,[key]:false};
  const x=blocked(good(),evidence,'qualification-evidence-missing');
  assert.deepEqual(x.missing,[key]);
}
const complete=blocked(good(),allEvidence,'owner-authorized-production-cutover-not-in-scope');
assert.equal(complete.evidenceQualified,true);
assert.equal(complete.intent.canonicalCreateParams.clientRequestId,good().clientRequestId);
assert.equal(complete.intent.businessOrderIdStrategy,'apps-script-allocated');
assert.equal(Object.hasOwn(complete.intent.canonicalCreateParams,'orderId'),false);
assert(T12_REQUIRED_SIDE_EFFECTS.every(s=>complete.intent.requiredCanonicalSideEffects.includes(s)));
assert.equal(Object.isFrozen(T12_REQUIRED_EVIDENCE),true);
assert.equal(Object.isFrozen(T12_REQUIRED_SIDE_EFFECTS),true);
console.log('T12 isolated fail-closed preflight tests PASS; assertions=' + n);
