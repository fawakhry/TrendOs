import assert from 'node:assert/strict';
import {buildLiveLineSnapshotHumanReviewV1 as review} from '../core/live-line-snapshot-human-review-v1.mjs';

// AP-116: no live D1, no actual employees, no orders touched.
const now=Date.parse('2026-10-10T15:00:00.000Z');
const SECRET='CUSTOMER_PRIVATE_ORDER_FILE_NEVER_EMIT';
const LINE='PRIVATE_SYNTHETIC_LINE_A';
const SECOND='PRIVATE_SYNTHETIC_LINE_B';
const row={
  lineId:LINE,department:'طباعة',status:'طلب جديد',
  lineActive:true,orderActive:true,archived:false,flyPrint:0,
  dueDate:'2026-10-11',orderId:SECRET,customerName:SECRET,
  designerNotes:SECRET,sourceRef:SECRET,machineSerial:SECRET
};
const base={
  rows:[row],events:[],selectedPrivateLineKey:LINE,nowMs:now,
  source:{kind:'D1_QUALIFIED_SHADOW',authorizedRead:true,
    snapshotComplete:true,observedAtMs:now-1500,secret:SECRET}
};
const run=(overrides={})=>review({...base,...overrides});
const denied=(changes,expected)=>{
  const x=run(changes);
  assert.equal(x.status,'BLOCKED_SAFE');
  assert.equal(x.reviewReason,expected);
  assert.equal(x.manualReviewPacketExists,false);
  assert.equal(x.assignmentAllowed,false);
  assert.equal(x.operatorTaskActivationAllowed,false);
  assert.equal(x.strictEligible,null);
  return x;
};
let x=run();
assert.equal(x.status,'HUMAN_REVIEW_ONLY');
assert.equal(x.manualReviewPacketExists,true);
assert.equal(x.privateSnapshotBound,true);
assert.equal(x.sourceAuthenticatedIndependently,false);
assert.equal(x.sourceAttestationOnly,true);
assert.equal(x.pilotLineSelected,false);
assert.equal(x.sameLineEvidenceVerified,false);
assert.equal(x.evidenceStatusByKind.DESIGN,'NO_SAME_LINE_EVIDENCE');
assert.equal(x.evidenceStatusByKind.MATERIAL,'NO_SAME_LINE_EVIDENCE');
assert.equal(x.evidenceStatusByKind.MACHINE,'NO_SAME_LINE_EVIDENCE');
// No automated line selection from aggregates / rows even when everything
// else is present; the selected private key is mandatory.
denied({selectedPrivateLineKey:null},'EXPLICIT_PRIVATE_LINE_REQUIRED');
denied({selectedPrivateLineKey:SECRET.repeat(40)},'EXPLICIT_PRIVATE_LINE_REQUIRED');
denied({rows:[row,{...row}]},'PRIVATE_LINE_MISSING_OR_AMBIGUOUS');
denied({selectedPrivateLineKey:SECOND},'PRIVATE_LINE_MISSING_OR_AMBIGUOUS');
denied({rows:[{...row,status:'تحت التنفيذ'}]},'LINE_STATUS_OR_ARCHIVE_REVIEW');
denied({rows:[{...row,archived:true}]},'LINE_STATUS_OR_ARCHIVE_REVIEW');
denied({rows:[{...row,lineActive:false}]},'LINE_STATUS_OR_ARCHIVE_REVIEW');
denied({rows:[{...row,orderActive:false}]},'LINE_STATUS_OR_ARCHIVE_REVIEW');
denied({rows:[{...row,department:SECRET}]},'LINE_DEPARTMENT_UNQUALIFIED');
denied({rows:[{...row,flyPrint:1}]},'FLY_FLAG_REVIEW');
denied({rows:[{...row,flyPrint:'maybe'}]},'FLY_FLAG_REVIEW');
denied({rows:[{...row,dueDate:'2026-02-30'}]},'DUE_DATE_UNVERIFIED');
denied({rows:[{...row,dueDate:'2026-10-10T17:00:00Z'}]},'DUE_DATE_UNVERIFIED');
denied({rows:[{...row,dueDate:'2026-10-09'}]},'OVERDUE_HUMAN_ESCALATION');
denied({rows:[{...row,dueDate:'2026-10-10'}]},'DUE_TODAY_HUMAN_REVIEW');
assert.equal(run({rows:[{...row,dueDate:'11/10/2026'}]}).status,'HUMAN_REVIEW_ONLY');
denied({source:{...base.source,observedAtMs:now-60001}},'SNAPSHOT_STALE_OR_FUTURE');
denied({source:{...base.source,observedAtMs:now+1}},'SNAPSHOT_STALE_OR_FUTURE');
denied({source:{...base.source,snapshotComplete:false}},'SOURCE_ENVELOPE_NOT_ATTESTED');
denied({source:{...base.source,authorizedRead:false}},'SOURCE_ENVELOPE_NOT_ATTESTED');
denied({source:{...base.source,kind:'UNAUTHENTICATED_SHEETS'}},'SOURCE_ENVELOPE_NOT_ATTESTED');
denied({nowMs:NaN},'CLOCK_UNVERIFIED');
denied({rows:null},'BOUNDED_SNAPSHOT_NOT_PROVEN');
denied({events:Array(5001).fill({})},'BOUNDED_SNAPSHOT_NOT_PROVEN');

const event=(line,kind)=>({
  lineId:line,kind,state:'BLOCKED',sourceKind:'PRIVATE',
  sourceRef:SECRET,sourceVersion:SECRET,observedAtMs:now-500,
  expiresAtMs:now+10000,customerPhone:SECRET
});
x=run({events:[event(SECOND,'DESIGN'),event(LINE,'MATERIAL')]});
assert.equal(x.evidenceStatusByKind.DESIGN,'NO_SAME_LINE_EVIDENCE');
assert.equal(x.evidenceStatusByKind.MATERIAL,'EVIDENCE_BLOCKED');
const all=[x,run(),denied({rows:[{...row,archived:true}]},
  'LINE_STATUS_OR_ARCHIVE_REVIEW')];
for(const result of all){
 const serialized=JSON.stringify(result);
 for(const value of [SECRET,LINE,SECOND]){
  assert.equal(serialized.includes(value),false,'PRIVATE_ROW_OR_SOURCE_LEAK');
 }
 assert.equal(result.productionWriteAllowed,false);
 assert.equal(result.assignmentAllowed,false);
 assert.equal(result.readyWriteAllowed,false);
 assert.equal(result.pilotLineSelected,false);
}
console.log('AP116_EXPLICIT_SINGLE_PRIVATE_LINE_NO_AGGREGATE_AUTO_SELECTION=PASS');
console.log('AP116_STALE_ACTIVE_STATUS_CHANGE_AND_DUE_FAIL_CLOSED=PASS');
console.log('AP116_CAIRO_FUTURE_ONLY_HUMAN_REVIEW=PASS');
console.log('AP116_SAME_LINE_EVIDENCE_PRIVATE_OUTPUT_ONLY=PASS');
console.log('AP116_LIVE_D1=NOT_ACCESSED; OPERATOR_TASK=OFF; PRODUCTION_DEPLOY=NO');
