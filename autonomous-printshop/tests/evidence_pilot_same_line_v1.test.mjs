import assert from 'node:assert/strict';
import {buildReadinessQualifiedRealityV1} from '../core/readiness-evidence-v1.mjs';
import {selectEvidencePilotTargetV1} from '../core/evidence-pilot-target-v1.mjs';
import {buildEvidenceAcquisitionPacketV1} from '../core/evidence-acquisition-packet-v1.mjs';

// Synthetic in-memory evidence ONLY: no operational data, API, worker or DB write.
const now=1800000000000;
const rows=[
  {orderId:'SYNTHETIC-ORDER-A',lineId:'SYNTHETIC-LINE-A',customer:'PRIVATE_CUSTOMER_NEVER_EXPOSE',
   assignedTo:'PRIVATE_EMPLOYEE_NEVER_EXPOSE',department:'ليزر',priority:'عاجل',
   status:'طلب جديد',expectedDelivery:'2026-10-11'},
  {orderId:'SYNTHETIC-ORDER-B',lineId:'SYNTHETIC-LINE-B',customer:'PRIVATE_CUSTOMER_NEVER_EXPOSE',
   assignedTo:'PRIVATE_EMPLOYEE_NEVER_EXPOSE',department:'طباعة',priority:'عادي',
   status:'طلب جديد',expectedDelivery:'2026-10-12'}
];
const event=(id,line,kind,state='READY',observedAtMs=now-2000,expiresAtMs=now+20000)=>({
  evidenceId:id,lineId:line,kind,state,
  sourceKind:kind==='DESIGN'?'DESIGN_PREFLIGHT':kind==='MATERIAL'?'MATERIAL_LEDGER':'MACHINE_AGENT',
  sourceRef:'synthetic-authority',sourceVersion:'synthetic-v1',
  observedAtMs,expiresAtMs
});
const initial=[
  event('a-design','SYNTHETIC-LINE-A','DESIGN'),
  event('a-machine','SYNTHETIC-LINE-A','MACHINE'),
  event('b-material','SYNTHETIC-LINE-B','MATERIAL'),
  event('b-machine','SYNTHETIC-LINE-B','MACHINE')
];
const project=events=>buildReadinessQualifiedRealityV1(rows,events,{nowMs:now,
  requiredKinds:['design','material','machine']});
const packetFor=state=>{
  const pilot=selectEvidencePilotTargetV1(state.rows,{requiredKinds:['design','material','machine']});
  return {pilot,packet:buildEvidenceAcquisitionPacketV1(pilot)};
};

let state=project(initial);
assert.equal(state.reality.ordinary.length,0,'NEVER_CROSS_JOIN_DESIGN_MATERIAL_MACHINE');
assert.equal(state.recommendation.recommended,null);
assert.deepEqual(state.coverage.DESIGN,{ready:1,blocked:0,unknown:1});
assert.deepEqual(state.coverage.MATERIAL,{ready:1,blocked:0,unknown:1});
let {pilot,packet}=packetFor(state);
assert.equal(pilot.exists,true);
assert.equal(pilot.sourceIndex,0);
assert.deepEqual(pilot.missingKinds,['MATERIAL']);
assert.deepEqual(Object.keys(packet.requirements),['MATERIAL']);
assert.equal(packet.externalEvidenceRequired,true);
assert.equal(packet.completionRule,'SAME_LINE_REQUIRES_DESIGN_MATERIAL_MACHINE_READY');
assert.equal(packet.assignmentAllowed,false);
assert.equal(packet.operatorTaskActivationAllowed,false);
for(const marker of ['SYNTHETIC-ORDER-A','SYNTHETIC-LINE-A','PRIVATE_CUSTOMER_NEVER_EXPOSE',
                     'PRIVATE_EMPLOYEE_NEVER_EXPOSE']){
  assert.equal(JSON.stringify({pilot,packet}).includes(marker),false,'PRIVATE_IDS_CANNOT_LEAK');
}

// One line is independently qualified; the next pilot remains the other line's
// missing evidence, not an order assignment.
const aReady=event('a-material','SYNTHETIC-LINE-A','MATERIAL','READY',now-1000);
state=project([...initial,aReady]);
assert.equal(state.reality.ordinary.length,1);
assert.equal(state.recommendation.recommended?.lineId,'SYNTHETIC-LINE-A');
({pilot,packet}=packetFor(state));
assert.equal(pilot.exists,true);
assert.equal(pilot.sourceIndex,1);
assert.deepEqual(pilot.missingKinds,['DESIGN']);
assert.deepEqual(Object.keys(packet.requirements),['DESIGN']);
assert.equal(packet.taskClaimAllowed,false);

// A later expired BLOCKED observation must not revive the older READY MATERIAL.
state=project([...initial,aReady,event('a-expired','SYNTHETIC-LINE-A',
 'MATERIAL','BLOCKED',now-100,now-1)]);
assert.equal(state.reality.ordinary.length,0);
assert.equal(state.recommendation.recommended,null);
({pilot,packet}=packetFor(state));
assert.equal(pilot.sourceIndex,0);
assert.deepEqual(pilot.missingKinds,['MATERIAL']);
assert.equal(packet.readyWriteAllowed,false);

console.log('AP096_CROSS_LINE_EVIDENCE_COMPOSITION=BLOCKED_SAFE');
console.log('AP096_ONE_SAME_LINE_READY_AND_OTHER_STILL_MISSING=PASS');
console.log('AP096_NEWEST_EXPIRED_BARRIER_IN_PILOT=PASS');
console.log('AP096_PRIVATE_IDS=NOT_EXPOSED; ASSIGNMENTS=0; BUSINESS_WRITES=0');
