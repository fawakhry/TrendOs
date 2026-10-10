import assert from 'node:assert/strict';
import {
  latestReadinessEvidenceV1,applyReadinessEvidenceV1,
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';

// Synthetic per-line conflicts only. Never reads live D1 or writes readiness.
const now=1800000000000, lineId='SYNTHETIC_PRIVATE_LINE_A';
const row={lineId,orderId:'SYNTHETIC_PRIVATE_ORDER',department:'ليزر',
  status:'طلب جديد',expectedDelivery:'2026-10-12'};
const event=(kind,id,state,observedAtMs=now-1000)=>({
  lineId,kind,evidenceId:id,state,observedAtMs,expiresAtMs:now+20000,
  sourceKind:kind==='DESIGN'?'DESIGN_PREFLIGHT':
    kind==='MATERIAL'?'MATERIAL_LEDGER':'MACHINE_AGENT',
  sourceRef:'PRIVATE_SOURCE_REFERENCE',sourceVersion:'synthetic-v1',
  confidence:1
});
const design=event('DESIGN','D0','READY');
const machine=event('MACHINE','M0','READY');
const materialReady=event('MATERIAL','Z-READY','READY');
const materialBlocked=event('MATERIAL','A-BLOCKED','BLOCKED');
const make=events=>buildReadinessQualifiedRealityV1([row],events,{
  nowMs:now,requiredKinds:['design','material','machine']
});
for(const pair of [
  [materialReady,materialBlocked],
  [materialBlocked,materialReady],
  [materialReady,{...materialReady,evidenceId:'Y-READY-ALIAS'}]
]){
  const events=[design,machine,...pair];
  const record=latestReadinessEvidenceV1(events,now).get(lineId+'::MATERIAL');
  assert.equal(record?.ambiguousSameInstant,true);
  assert.equal(record?.state,'UNKNOWN');
  assert.equal(record?.value,null);
  const source=applyReadinessEvidenceV1([row],events,{nowMs:now})[0];
  assert.equal(source.materialReady,null);
  const result=make(events);
  assert.equal(result.coverage.MATERIAL.unknown,1);
  assert.equal(result.reality.ordinary.length,0);
  assert.equal(result.recommendation.recommended,null);
}
const later={...materialReady,evidenceId:'STRICTLY_LATER',
  observedAtMs:now-500};
const repaired=make([design,machine,materialReady,materialBlocked,later]);
assert.equal(repaired.coverage.MATERIAL.ready,1);
assert.equal(repaired.reality.ordinary.length,1);
assert.equal(repaired.recommendation.recommended?.lineId,lineId);
const older={...materialBlocked,evidenceId:'OLDER',observedAtMs:now-5000};
assert.equal(make([design,machine,later,older]).reality.ordinary.length,1);
const latestExpired={...materialBlocked,evidenceId:'LATEST_EXPIRED',
  observedAtMs:now-100,expiresAtMs:now-1};
assert.equal(make([design,machine,materialReady,latestExpired]).reality.ordinary.length,0);
// No cross-kind or cross-line collisions.
const other={...materialBlocked,lineId:'DIFFERENT_PRIVATE_LINE'};
assert.equal(make([design,machine,materialReady,other]).reality.ordinary.length,1);
console.log('AP118_SAME_LINE_KIND_EQUAL_TIME_AMBIGUITY=BLOCKED_SAFE');
console.log('AP118_EVENT_ID_LEXICAL_TIE_CANNOT_SELECT_READY=PASS');
console.log('AP118_STRICTLY_LATER_RESOLVES; EXPIRED_DOES_NOT_REVIVE=PASS');
console.log('AP118_LIVE_D1=NOT_QUERIED; READINESS_WRITES=0; PRODUCTION_DEPLOY=NO');
