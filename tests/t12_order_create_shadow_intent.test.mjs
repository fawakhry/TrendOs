import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildT12OrderCreateShadowIntent, T12_SHADOW_INTENT_VERSION } from '../cloudflare-d1/src/t12-order-create-shadow-intent.mjs';

const src = fs.readFileSync(new URL('../cloudflare-d1/src/t12-order-create-shadow-intent.mjs',import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const cloudWrite = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write.mjs',import.meta.url),'utf8');

for(const forbidden of [/\bSpreadsheetApp\s*\./,/\bPropertiesService\s*\./,/\bfetch\s*\(/,/\.prepare\s*\(/,/\.batch\s*\(/,/\bnew\s+Response\s*\(/,/orderId\s*:/]) {
  assert.equal(forbidden.test(src),false,'shadow planner must stay pure/no business Order ID allocation: '+forbidden);
}
assert.equal(index.includes('t12-order-create-shadow-intent'),false);
assert.equal(cloudWrite.includes('t12-order-create-shadow-intent'),false);
assert.match(T12_SHADOW_INTENT_VERSION,/T12_ORDER_CREATE_SHADOW_INTENT/);

function base(overrides={}){
  return {clientRequestId:'T12-SHADOW-001',customerName:'عميل اختبار',customerPhone:'01012345678',department:'طباعة',itemName:'تابلوه',qty:2,status:'طلب جديد',...overrides};
}
let x=buildT12OrderCreateShadowIntent(base(),'wael');
assert.equal(x.success,true);
assert.equal(x.businessOrderIdAllocated,false);
assert.equal(x.lineIdsAllocated,false);
assert.equal(x.lines.length,1);
assert.equal(x.lines[0].department,'طباعة');
assert.equal(x.lines[0].assignedTo,'وائل');
assert.equal(x.requestKey,'T12-SHADOW-001');
assert.equal(x.provisionalRef,'t12-order-intent:T12-SHADOW-001');
assert.equal(x.productionCutoverAuthorized,false);
assert.equal(x.unresolvedAuthority.includes('business-order-id-allocation'),true);

const replay=buildT12OrderCreateShadowIntent(base(),'wael');
assert.deepEqual(replay,x,'pure planner must be deterministic for the same input');

x=buildT12OrderCreateShadowIntent(base({clientRequestId:'T12-SHADOW-MULTI',department:'متعدد الأقسام',itemName:'كومبو'}),'manager');
assert.equal(x.success,true);
assert.equal(x.lines.length,2);
assert.deepEqual(x.lines.map(y=>y.department),['طباعة','ليزر']);
assert.deepEqual(x.lines.map(y=>y.assignedTo),['وائل','جابر']);
assert.equal(x.lines[0].itemName,'كومبو - طباعة');
assert.equal(x.lines[1].itemName,'كومبو - ليزر');
assert.equal(x.queuePlans.length,2);

x=buildT12OrderCreateShadowIntent(base({clientRequestId:'T12-SHADOW-PRESS',department:'مكبس'}),'wael');
assert.equal(x.success,true);
assert.equal(x.order.department,'طباعة');
assert.equal(x.order.heatPress,'نعم');

x=buildT12OrderCreateShadowIntent({
  clientRequestId:'T12-SHADOW-EXT',customerMode:'خارجي / عابر',externalCustomerId:'987',
  department:'ليزر',itemName:'حفر',qty:1
},'gaber');
assert.equal(x.success,true);
assert.equal(x.identity.mode,'external');
assert.equal(x.identity.externalCustomerId,'987');

x=buildT12OrderCreateShadowIntent({...base(),orderId:'1001'},'wael');
assert.equal(x.success,false);
assert.equal(x.reason,'unsupported-create-fields-must-be-mapped');
assert.equal(x.productionCutoverAuthorized,false);

console.log('T12 pure shadow-intent planner PASS; no business Order/Line IDs allocated; no runtime wiring.');
