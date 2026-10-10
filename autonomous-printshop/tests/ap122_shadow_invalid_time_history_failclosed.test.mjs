import assert from 'node:assert/strict';
import {latestReadinessEvidenceV1,applyReadinessEvidenceV1,
  buildReadinessQualifiedRealityV1} from '../core/readiness-evidence-v1.mjs';

// AP-122 source boundary integration, entirely synthetic. No live D1/Workers.
const now=1800000000000, key='PRIVATE_SYNTHETIC_LINE';
const row={lineId:key,orderId:'FAKE_ORDER',department:'طباعة',
  status:'طلب جديد',expectedDelivery:'2026-10-12'};
const event=kind=>({
  evidenceId:'FAKE_'+kind,lineId:key,kind,state:'READY',
  sourceKind:'SYSTEM',sourceRef:'FAKE_INTERNAL_SOURCE',
  observedAtMs:now-1000,expiresAtMs:now+10000
});
const facts=[event('DESIGN'),event('MATERIAL'),event('MACHINE')];
const build=events=>buildReadinessQualifiedRealityV1([row],events,{nowMs:now});
assert.equal(build(facts).reality.ordinary.length,1);
// The SELECT's ROW ordering may hide an old corrupted timestamp but its
// aggregate invalidTimeInHistory must force null for that exact kind.
for(const flagged of [
  {...facts[1],invalidTimeInHistory:true},
  {...facts[1],invalid_time_in_history:true}
]){
  const events=[facts[0],flagged,facts[2]];
  assert.equal(latestReadinessEvidenceV1(events,now).has(key+'::MATERIAL'),false);
  const result=build(events);
  assert.equal(result.reality.ordinary.length,0);
  assert.equal(result.recommendation.recommended,null);
  assert.equal(applyReadinessEvidenceV1([row],events,{nowMs:now})[0].materialReady,null);
}
// The flag must not affect another line/kind or become an invented
// assignment prohibition exception. A newer READY does not clear corrupt
// historical chronology without independent source remediation.
const flaggedOther={...facts[1],lineId:'OTHER_SYNTHETIC_LINE',
  invalidTimeInHistory:true};
assert.equal(build([...facts,flaggedOther]).reality.ordinary.length,1);
const repaired={...facts[1],observedAtMs:now-1};
assert.equal(build([facts[0],{...facts[1],invalidTimeInHistory:true},facts[2],repaired])
  .reality.ordinary.length,0);
// A fractional timestamp is not a millisecond integer and must fail closed.
const fractional={...facts[1],observedAtMs:now-0.5};
assert.equal(build([facts[0],fractional,facts[2]]).reality.ordinary.length,0);
assert.equal(latestReadinessEvidenceV1([fractional],now).size,0);
console.log('AP122_SQL_INVALID_HISTORY_FLAG_TO_READINESS=BLOCKED_SAFE');
console.log('AP122_SAME_LINE_KIND_ONLY_NO_RESET_BY_LATER_READY=PASS');
console.log('AP122_FRACTIONAL_OBSERVED_CLOCK=BLOCKED_SAFE');
console.log('AP122_LIVE_D1=NOT_QUERIED; TASK_ASSIGNMENT=NO; PRODUCTION_DEPLOY=NO');
