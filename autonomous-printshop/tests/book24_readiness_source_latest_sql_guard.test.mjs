import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyDesignEvidenceCandidatesV1} from '../core/readiness-source-adapters-v1.mjs';
import {machineReadinessEvidenceCandidatesV1} from '../core/machine-readiness-v1.mjs';
import {latestReadinessEvidenceV1} from '../core/readiness-evidence-v1.mjs';

// All records synthetic; never read D1/Google/machine sensors.
const now=1800000000000;
const legacy=(lineId,ready,updatedAt)=>({lineId,ready,updatedAt});
const sqlTime=(millis)=>new Date(millis).toISOString();

test('BOOK24-adapter: future legacy DESIGN READY is not candidate evidence',()=>{
  assert.deepEqual(legacyDesignEvidenceCandidatesV1([
    legacy('fake-design','نعم',sqlTime(now+1000))
  ],{nowMs:now}),[]);
});
test('BOOK24-adapter: future legacy BLOCKED is also discarded, not used as current state',()=>{
  assert.equal(legacyDesignEvidenceCandidatesV1([
    legacy('fake-design','لا',sqlTime(now+1000))
  ],{nowMs:now}).length,0);
});
test('BOOK24-adapter: past legacy READY/BLOCKED remain eligible with explicit field',()=>{
  const rows=[
    legacy('fake-ready','نعم',sqlTime(now-10000)),
    legacy('fake-blocked','لا',sqlTime(now-12000))
  ];
  const out=legacyDesignEvidenceCandidatesV1(rows,{nowMs:now});
  assert.deepEqual(out.map(x=>x.state),['READY','BLOCKED']);
  assert.equal(out[0].observedAtMs,now-10000);
  assert.equal(out[0].sourceKind,'TRENDOS_LEGACY');
});
test('BOOK24-adapter: invalid timestamps, blanks and missing ready are excluded',()=>{
  const out=legacyDesignEvidenceCandidatesV1([
    legacy('invalid','نعم','not-a-timestamp'),
    legacy('empty','',sqlTime(now)),
    legacy('empty-id','نعم',sqlTime(now)),legacy('valid','نعم',sqlTime(now))
  ].map(x=>x.lineId==='empty-id'?{...x,lineId:''}:x),{nowMs:now});
  assert.equal(out.length,1);
  assert.equal(out[0].lineId,'valid');
});
test('BOOK24-adapter: valid at-now design timestamp stays qualified',()=>{
  const out=legacyDesignEvidenceCandidatesV1([
    legacy('fake-now','جاهز',sqlTime(now))
  ],{nowMs:now});
  assert.equal(out.length,1);
  assert.equal(out[0].state,'READY');
});
const machine={machineId:'fake-machine',machineClass:'LASER',department:'ليزر',active:1,version:1};
const map={lineId:'fake-line',machineId:'fake-machine',mappingEventId:'fake-map',mappingState:'ACTIVE',observedAtMs:now-10000};
const observation=(observationId,observedAtMs,expiresAtMs,machineState='READY')=>({
  observationId,machineId:'fake-machine',machineState,observedAtMs,expiresAtMs,sourceKind:'SELF_TEST',confidence:1
});
function candidates(observations){
  return machineReadinessEvidenceCandidatesV1({mappings:[map],machines:[machine],observations,nowMs:now});
}
test('BOOK24-adapter: old READY plus newest expired BLOCKED yields NO machine evidence',()=>{
  assert.equal(candidates([
    observation('older',now-10000,now+10000,'READY'),
    observation('newer',now-2000,now-1,'BLOCKED')
  ]).length,0);
});
test('BOOK24-adapter: old READY plus newest expired READY yields NO machine evidence',()=>{
  assert.equal(candidates([
    observation('older',now-10000,now+10000,'READY'),
    observation('newer',now-1000,now-1,'READY')
  ]).length,0);
});
test('BOOK24-adapter: future newest observation does not fall back to older READY',()=>{
  assert.equal(candidates([
    observation('older',now-10000,now+10000,'READY'),
    observation('newer',now+1000,now+10000,'READY')
  ]).length,0);
});
test('BOOK24-adapter: latest valid at-now READY is still a candidate',()=>{
  const out=candidates([observation('now',now,now+10000,'READY')]);
  assert.equal(out.length,1);
  assert.equal(out[0].state,'READY');
});
test('BOOK24-adapter: latest maintenance remains BLOCKED when within TTL',()=>{
  const out=candidates([observation('maint',now-1000,now+10000,'MAINTENANCE')]);
  assert.equal(out.length,1);
  assert.equal(out[0].state,'BLOCKED');
});
test('BOOK24-adapter: readiness projection still tombstones newer expired record',()=>{
  const xs=[
    {lineId:'fake-line',kind:'MACHINE',state:'READY',evidenceId:'old',observedAtMs:now-10000,expiresAtMs:now+10000},
    {lineId:'fake-line',kind:'MACHINE',state:'BLOCKED',evidenceId:'new',observedAtMs:now-2000,expiresAtMs:now-1}
  ];
  assert.equal(latestReadinessEvidenceV1(xs,now).has('fake-line::MACHINE'),false);
});
