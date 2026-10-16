import test from 'node:test';
import assert from 'node:assert/strict';
import {
  latestReadinessEvidenceV1,
  applyReadinessEvidenceV1,
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';
import {machineReadinessEvidenceCandidatesV1} from '../core/machine-readiness-v1.mjs';

// BOOK24-READINESS-PARITY — entirely synthetic, no worker, D1 or machines.
const now=1800000000000;
const row={orderId:'FAKE-1',lineId:'FAKE-L1',department:'ليزر',status:'طلب جديد',
  priority:'عاجل',expectedDelivery:'2026-10-16'};
function event(kind,state,at,expiry,id){
  return {evidenceId:id,lineId:'FAKE-L1',kind,state,observedAtMs:at,
    ...(expiry===undefined?{}:{expiresAtMs:expiry}),sourceKind:'FAKE_SHADOW'};
}
function trio(machineEvents){
  return [
    event('DESIGN','READY',now-30000,undefined,'fake-design'),
    event('MATERIAL','READY',now-30000,undefined,'fake-material'),
    ...machineEvents
  ];
}
const qualified=(events)=>buildReadinessQualifiedRealityV1([row],events,{nowMs:now,
  requiredKinds:['design','material','machine'],operatorAvailable:true,activeTask:null});
const machine={machineId:'fake-laser-1',machineClass:'LASER',department:'ليزر',active:1,version:1};
const mapping=(timestamp=now-1000,id='fake-m1',state='ACTIVE')=>({
  mappingEventId:id,lineId:'FAKE-L1',machineId:'fake-laser-1',
  mappingState:state,observedAtMs:timestamp,sourceKind:'FAKE'
});
const observation=(timestamp=now-1000,id='fake-o1',state='READY',expiry=now+10000)=>({
  observationId:id,machineId:'fake-laser-1',machineState:state,
  confidence:1,observedAtMs:timestamp,expiresAtMs:expiry,sourceKind:'FAKE'
});
function machineCandidates(mappings,observations){
  return machineReadinessEvidenceCandidatesV1({mappings,observations,machines:[machine],nowMs:now});
}

test('BOOK24: later expired BLOCKED must not revive earlier unexpired READY',()=>{
  const e=[event('MACHINE','READY',now-10000,now+10000,'old-ready'),
    event('MACHINE','BLOCKED',now-5000,now-1,'new-blocked')];
  assert.equal(latestReadinessEvidenceV1(e,now).has('FAKE-L1::MACHINE'),false);
  assert.equal(applyReadinessEvidenceV1([row],e,{nowMs:now})[0].machineReady,null);
  const x=qualified(trio(e));
  assert.equal(x.reality.ordinary.length,0);
  assert.equal(x.recommendation.recommended,null);
  assert.equal(x.reality.exceptions[0].reason,'READINESS_UNKNOWN');
});
test('BOOK24: later expired READY must not revive earlier still-valid READY',()=>{
  const e=[event('MACHINE','READY',now-10000,now+10000,'old-ready'),
    event('MACHINE','READY',now-5000,now-1,'new-ready')];
  assert.equal(latestReadinessEvidenceV1(e,now).has('FAKE-L1::MACHINE'),false);
  assert.equal(qualified(trio(e)).reality.ordinary.length,0);
});
test('BOOK24: latest UNKNOWN expired prevents previous READY resurrection',()=>{
  const e=[event('MACHINE','READY',now-10000,now+10000,'old-ready'),
    event('MACHINE','UNKNOWN',now-2000,now-1000,'new-unknown')];
  assert.equal(latestReadinessEvidenceV1(e,now).has('FAKE-L1::MACHINE'),false);
  assert.equal(qualified(trio(e)).reality.ordinary.length,0);
});
test('BOOK24: expired newest DESIGN evidence is unknown even if earlier READY not expired',()=>{
  const e=trio([event('MACHINE','READY',now-1000,now+10000,'machine')]);
  e.push(event('DESIGN','BLOCKED',now-1000,now-100,'new-design-blocked'));
  const x=qualified(e);
  assert.equal(x.rows[0].designReady,null);
  assert.equal(x.recommendation.recommended,null);
  assert.equal(x.reality.exceptions[0].reason,'READINESS_UNKNOWN');
});
test('BOOK24: future READY event cannot qualify dispatch',()=>{
  const e=trio([
    event('MACHINE','READY',now-10000,now+10000,'old-ready'),
    event('MACHINE','READY',now+1000,now+10000,'future-ready')
  ]);
  const x=qualified(e);
  assert.equal(x.rows[0].machineReady,null);
  assert.equal(x.recommendation.recommended,null);
});
test('BOOK24: future BLOCKED event also tombstones older READY',()=>{
  const e=[
    event('MACHINE','READY',now-10000,now+10000,'old-ready'),
    event('MACHINE','BLOCKED',now+1000,now+10000,'future-blocked')
  ];
  assert.equal(latestReadinessEvidenceV1(e,now).has('FAKE-L1::MACHINE'),false);
});
test('BOOK24: future evidence without older evidence is never READY',()=>{
  const e=[event('MACHINE','READY',now+1000,now+10000,'only-future')];
  assert.equal(latestReadinessEvidenceV1(e,now).size,0);
});
test('BOOK24: invalid/earlier-than-observed expiry is a tombstone, not prior fallback',()=>{
  for(const expiry of [now-1000,'not-a-number',now-5000]){
    const e=[
      event('MACHINE','READY',now-10000,now+10000,'old-ready'),
      event('MACHINE','READY',now-4000,expiry,'bad-window')
    ];
    assert.equal(latestReadinessEvidenceV1(e,now).has('FAKE-L1::MACHINE'),false);
  }
});
test('BOOK24: valid most-recent READY still permits shadow-only recommendation',()=>{
  const x=qualified(trio([
    event('MACHINE','BLOCKED',now-10000,now+10000,'old-blocked'),
    event('MACHINE','READY',now-3000,now+10000,'new-ready')
  ]));
  assert.equal(x.reality.ordinary.length,1);
  assert.equal(x.recommendation.recommended.lineId,'FAKE-L1');
});
test('BOOK24: same-millisecond evidence keeps deterministic larger evidence ID',()=>{
  const a=event('MACHINE','READY',now-1000,now+10000,'a'),
    b=event('MACHINE','BLOCKED',now-1000,now+10000,'b');
  assert.equal(latestReadinessEvidenceV1([b,a],now).get('FAKE-L1::MACHINE').state,'BLOCKED');
  assert.equal(latestReadinessEvidenceV1([a,b],now).get('FAKE-L1::MACHINE').state,'BLOCKED');
});
test('BOOK24: machine READY observation in future is ignored despite otherwise valid TTL',()=>{
  const result=machineCandidates([mapping()],[
    observation(now-4000,'old-ready','READY',now+10000),
    observation(now+1000,'future-ready','READY',now+11000)
  ]);
  assert.equal(result.length,0);
});
test('BOOK24: future ACTIVE line-machine mapping cannot qualify earlier observation',()=>{
  const result=machineCandidates([mapping(now+1000,'future-map')],[observation()]);
  assert.equal(result.length,0);
});
test('BOOK24: future REMOVED mapping does not revive older ACTIVE machine mapping',()=>{
  const result=machineCandidates([
    mapping(now-5000,'old-active'),
    mapping(now+1000,'future-removed','REMOVED')
  ],[observation()]);
  assert.equal(result.length,0);
});
test('BOOK24: mapping and observation observed at now are accepted with valid TTL',()=>{
  const result=machineCandidates([mapping(now)],[observation(now,'at-now','READY',now+10000)]);
  assert.equal(result.length,1);
  assert.equal(result[0].state,'READY');
});
test('BOOK24: inverted machine expiry window does not grant READY',()=>{
  const result=machineCandidates([mapping()],[observation(now-1000,'bad','READY',now-1500)]);
  assert.equal(result.length,0);
});
test('BOOK24: latest valid MAINTENANCE still blocks machine',()=>{
  const result=machineCandidates([mapping()],[observation(now-1000,'maintenance','MAINTENANCE',now+60000)]);
  assert.equal(result.length,1);
  assert.equal(result[0].state,'BLOCKED');
});
