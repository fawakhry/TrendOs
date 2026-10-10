import assert from 'node:assert/strict';
import {
  latestReadinessEvidenceV1,applyReadinessEvidenceV1,
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';
const now=1800000000000;
const LINE='SYNTHETIC_LINE_A';
const otherLine='SYNTHETIC_LINE_B';
const row={lineId:LINE,orderId:'SYNTHETIC_ORDER',status:'طلب جديد',
  department:'طباعة',expectedDelivery:'2026-10-12'};
const fresh=(kind,id,lineId=LINE)=>({
 lineId,kind,state:'READY',evidenceId:id,observedAtMs:now-1000,
 expiresAtMs:now+60000,sourceKind:'SYSTEM'
});
const design=fresh('DESIGN','d');
const material=fresh('MATERIAL','m');
const machine=fresh('MACHINE','mc');
assert.equal(buildReadinessQualifiedRealityV1([row],[design,material,machine],
  {nowMs:now}).reality.ordinary.length,1);
for(const badAt of ['not-a-timestamp',0,-100,NaN,Infinity,null]){
  const bad={...material,evidenceId:'malformed',observedAtMs:badAt};
  for(const order of [
    [design,material,machine,bad],[bad,design,material,machine]
  ]){
    const latest=latestReadinessEvidenceV1(order,now);
    assert.equal(latest.has(LINE+'::MATERIAL'),false);
    const projected=applyReadinessEvidenceV1([row],order,{nowMs:now})[0];
    assert.equal(projected.materialReady,null);
    const result=buildReadinessQualifiedRealityV1([row],order,{nowMs:now});
    assert.equal(result.reality.ordinary.length,0);
    assert.equal(result.recommendation.recommended,null);
  }
}
// The time poison must remain scoped to exactly one line and evidence kind.
const corruptedOther={...material,evidenceId:'bad-other',lineId:otherLine,
  observedAtMs:'invalid'};
assert.equal(buildReadinessQualifiedRealityV1([row],
  [design,material,machine,corruptedOther],{nowMs:now}).reality.ordinary.length,1);
const corruptDesign={...design,evidenceId:'bad-design',observedAtMs:'invalid'};
assert.equal(applyReadinessEvidenceV1([row],
  [design,material,machine,corruptDesign],{nowMs:now})[0].designReady,null);
console.log('AP121_MALFORMED_SAME_LINE_TIME_NEVER_REVIVES_READY=PASS');
console.log('AP121_OTHER_LINE_OR_KIND_ISOLATION=PASS');
console.log('AP121_LIVE_D1=NOT_READ; SOURCE_TEST_ONLY; D1_WRITES=0');
