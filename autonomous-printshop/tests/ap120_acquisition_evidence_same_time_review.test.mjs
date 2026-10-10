import assert from 'node:assert/strict';
import {buildEvidenceAcquisitionPacketV1 as packet} from '../core/evidence-acquisition-packet-v1.mjs';
const now=1800000000000, lineId='PRIVATE_SYNTHETIC_LINE';
const SECRET='SYNTHETIC_PII_NEVER_EXPOSE';
const pilot={
  exists:true,department:'طباعة',priority:'عادي',
  dueIso:'2026-12-01T00:00:00.000Z',missingKinds:['DESIGN','MATERIAL','MACHINE'],
  machineClassHint:'PRINT'
};
const event=(kind,id,state,when=now-1000,expiresAtMs=now+30000)=>({
  evidenceId:id,lineId,kind,state,
  observedAtMs:when,expiresAtMs,sourceRef:SECRET,
  customerName:SECRET
});
const review=events=>packet(pilot,{lineId,events,nowMs:now});
const base=[
  event('DESIGN','READY-Z','READY'),
  event('DESIGN','BLOCKED-A','BLOCKED')
];
for(const events of [base,base.slice().reverse(),
  [event('DESIGN','READY-Z','READY'),event('DESIGN','READY-A','READY')]]){
  const result=review(events);
  assert.equal(result.review.statusByKind.DESIGN,'AMBIGUOUS_LATEST_EVIDENCE');
  assert.equal(result.review.provenanceQualified,false);
  assert.equal(result.assignmentAllowed,false);
  assert.equal(result.readyWriteAllowed,false);
  assert.equal(result.taskClaimAllowed,false);
  assert.equal(JSON.stringify(result).includes(SECRET),false);
  assert.equal(JSON.stringify(result).includes(lineId),false);
}
const newer=event('DESIGN','NEWER','BLOCKED',now-500);
assert.equal(review([...base,newer]).review.statusByKind.DESIGN,'EVIDENCE_BLOCKED');
assert.equal(review([newer,...base]).review.statusByKind.DESIGN,'EVIDENCE_BLOCKED');
const expired=event('DESIGN','EXPIRED','BLOCKED',now-200,now-1);
assert.equal(review([...base,expired]).review.statusByKind.DESIGN,'EVIDENCE_EXPIRED');
// Disjoint kind/line never interferes with DESIGN.
assert.equal(review([event('DESIGN','D','READY'),event('MATERIAL','M','BLOCKED')])
  .review.statusByKind.DESIGN,'READY_STATE_MISMATCH_REVIEW');
assert.equal(review([event('DESIGN','D','READY'),{...event('DESIGN','X','BLOCKED'),
  lineId:'OTHER_LINE'}]).review.statusByKind.DESIGN,'READY_STATE_MISMATCH_REVIEW');
console.log('AP120_ACQUISITION_LATEST_SAME_TIME=AMBIGUOUS_REVIEW');
console.log('AP120_NEWER_BLOCKED_OR_EXPIRED_TAKES_PRECEDENCE=PASS');
console.log('AP120_NO_PRIVATE_ID_OR_PII_OUTPUT=PASS');
console.log('AP120_LIVE_D1=NOT_QUERIED; BUSINESS_WRITES=0');
