import assert from 'node:assert/strict';
import { buildEvidenceAcquisitionPacketV1 } from '../core/evidence-acquisition-packet-v1.mjs';

let x=buildEvidenceAcquisitionPacketV1({
  exists:true,
  department:'ليزر',
  priority:'عاجل',
  dueIso:'2026-10-07T23:59:59.000Z',
  urgent:true,
  missingKinds:['DESIGN','MATERIAL','MACHINE'],
  machineClassHint:'LASER'
});

assert.equal(x.exists,true);
assert.equal(x.externalEvidenceRequired,true);
assert.equal(x.machineClassHint,'LASER');
assert.deepEqual(Object.keys(x.requirements),['DESIGN','MATERIAL','MACHINE']);
assert.ok(x.requirements.DESIGN.includes('CONTENT_SHA256'));
assert.ok(x.requirements.DESIGN.includes('STRUCTURED_APPROVAL'));
assert.ok(x.requirements.MATERIAL.includes('ACTIVE_NON_CANARY_MATERIAL'));
assert.ok(x.requirements.MATERIAL.includes('POSITIVE_MATERIAL_CONSUMPTION'));
assert.ok(x.requirements.MACHINE.includes('SERIAL_OR_ASSET_TAG'));
assert.ok(x.requirements.MACHINE.includes('DIRECT_OPERATOR_CHECK_OR_SELF_TEST'));
assert.equal(x.assignmentAllowed,false);
assert.equal(x.taskClaimAllowed,false);
assert.equal(x.readyWriteAllowed,false);
assert.equal(x.operatorTaskActivationAllowed,false);
assert.equal(x.rawOrderIdsExposed,false);
assert.equal(x.rawLineIdsExposed,false);
assert.equal(x.customerPiiExposed,false);
assert.equal(Object.hasOwn(x,'orderId'),false);
assert.equal(Object.hasOwn(x,'lineId'),false);

x=buildEvidenceAcquisitionPacketV1({exists:false});
assert.equal(x.exists,false);
assert.equal(x.externalEvidenceRequired,false);
assert.deepEqual(x.requirements,{});
assert.equal(x.machineClassHint,'UNKNOWN');


const now=1800000000000;
const line='SYNTHETIC-SECRET-LINE-A';
const otherLine='SYNTHETIC-SECRET-LINE-B';
const pilot={
  exists:true,department:'ليزر',priority:'عاجل',dueIso:'2026-10-12T10:00:00.000Z',
  urgent:true,missingKinds:['MATERIAL','MACHINE'],machineClassHint:'LASER',
  customerName:'NEVER_SHOW_CUSTOMER',orderId:'NEVER_SHOW_ORDER',lineId:line
};
const evt=(id,kind,state,observedAtMs,expiresAtMs,atLine=line)=>({
  evidenceId:id,lineId:atLine,evidenceKind:kind,evidenceState:state,
  sourceRef:'NEVER_SHOW_PRIVATE_SOURCE',sourceVersion:'NEVER_SHOW_VERSION',
  observedAtMs,expiresAtMs,customerName:'NEVER_SHOW_CUSTOMER'
});
const summary=events=>buildEvidenceAcquisitionPacketV1(pilot,{lineId:line,events,nowMs:now});
let y=summary([evt('other-line-ready','MATERIAL','READY',now-1000,now+10000,otherLine)]);
assert.equal(y.review.statusByKind.MATERIAL,'NO_RECORDED_EVIDENCE');
assert.equal(y.review.statusByKind.MACHINE,'NO_RECORDED_EVIDENCE');
assert.equal(y.review.provenanceQualified,false);
assert.equal(y.review.actionableWriteAllowed,false);
assert.deepEqual(y.missingKinds,['MATERIAL','MACHINE']);
const older=evt('earlier-ready','MATERIAL','READY',now-10000,now+20000);
const laterExpired=evt('latest-blocked','MATERIAL','BLOCKED',now-1000,now-1);
y=summary([older,laterExpired]);
assert.equal(y.review.statusByKind.MATERIAL,'EVIDENCE_EXPIRED');
assert.equal(y.externalEvidenceRequired,true);
assert.equal(y.readyWriteAllowed,false);
assert.equal(summary([older,evt('latest-blocked','MATERIAL','BLOCKED',now-1000,now+5000)]).review.statusByKind.MATERIAL,'EVIDENCE_BLOCKED');
assert.equal(summary([older,evt('latest-future','MATERIAL','READY',now+1000,now+8000)]).review.statusByKind.MATERIAL,'FUTURE_OBSERVATION');
assert.equal(summary([older,evt('latest-corrupt','MATERIAL','READY',now-1000,'invalid')]).review.statusByKind.MATERIAL,'INVALID_EXPIRY');
assert.equal(summary([older,evt('latest-unknown','MATERIAL','UNKNOWN',now-1000,now+5000)]).review.statusByKind.MATERIAL,'EVIDENCE_UNKNOWN');
assert.equal(summary([older,evt('latest-ready','MATERIAL','READY',now-1000,now+5000)]).review.statusByKind.MATERIAL,'READY_STATE_MISMATCH_REVIEW');
assert.equal(summary([older,evt('bad-time','MATERIAL','READY','broken',now+5000)]).review.statusByKind.MATERIAL,'SOURCE_TIME_UNVERIFIED');
assert.equal(buildEvidenceAcquisitionPacketV1(pilot,{events:[older],nowMs:now}).review.statusByKind.MATERIAL,'SOURCE_LINE_UNVERIFIED');
assert.equal(buildEvidenceAcquisitionPacketV1(pilot,{lineId:line,events:[older],nowMs:NaN}).review.statusByKind.MATERIAL,'SOURCE_CLOCK_UNVERIFIED');
const malicious=buildEvidenceAcquisitionPacketV1({
  ...pilot,missingKinds:['__proto__','constructor','MATERIAL','material','toString'],
  machineClassHint:'NEVER_SHOW_MACHINE_PRIVATE_TAG'
},{lineId:line,events:[laterExpired],nowMs:now});
assert.deepEqual(malicious.missingKinds,['MATERIAL']);
assert.deepEqual(Object.keys(malicious.requirements),['MATERIAL']);
assert.equal(malicious.machineClassHint,'UNKNOWN');
assert.equal(malicious.review.statusByKind.MATERIAL,'EVIDENCE_EXPIRED');
for(const marker of [line,otherLine,'NEVER_SHOW_ORDER','NEVER_SHOW_CUSTOMER',
  'NEVER_SHOW_PRIVATE_SOURCE','NEVER_SHOW_VERSION','NEVER_SHOW_MACHINE_PRIVATE_TAG']){
  assert.equal(JSON.stringify({y,malicious}).includes(marker),false,'PRIVATE_SOURCE_DETAILS_MUST_NOT_LEAK');
}
assert.deepEqual(buildEvidenceAcquisitionPacketV1({exists:false}).review.statusByKind,{});
console.log('AP097_REASON_CODE_TRIAGE=PASS');
console.log('AP097_NEWEST_EXPIRY_AND_CROSS_LINE=FAIL_CLOSED');
console.log('AP097_PUBLIC_PACKET_ALLOWLIST_AND_NO_IDS=PASS');
console.log('AP097_PRODUCTION_CALLS=0; FINANCIAL_WRITES=0; ASSIGNMENTS=0');


// AP-108: allow only fixed operational metadata in publicly visible
// acquisition diagnostics; never echo free-text source values.
let safe=buildEvidenceAcquisitionPacketV1({
  exists:true,department:'طباعة',priority:'عادي',
  dueIso:'2026-10-12T23:59:59.000Z',
  missingKinds:['DESIGN','MATERIAL','MACHINE'],machineClassHint:'PRINT'
});
assert.equal(safe.department,'طباعة');
assert.equal(safe.priority,'عادي');
assert.equal(safe.dueIso,'2026-10-12T23:59:59.000Z');
assert.equal(safe.machineClassHint,'PRINT');
assert.equal(safe.assignmentAllowed,false);
const secret='CLIENT_ACCOUNT_AND_PRIVATE_NOTE_NEVER_PUBLISH';
const maliciousMetadata=buildEvidenceAcquisitionPacketV1({
  exists:true,department:secret,priority:secret,dueIso:secret,
  urgent:true,missingKinds:['DESIGN','MATERIAL','MACHINE'],
  machineClassHint:secret,
  orderId:'SECRET_ORDER_ID',lineId:'SECRET_LINE_ID',
  customer:secret,assignedTo:secret
});
assert.equal(maliciousMetadata.department,'UNKNOWN');
assert.equal(maliciousMetadata.priority,'UNKNOWN');
assert.equal(maliciousMetadata.dueIso,'');
assert.equal(maliciousMetadata.machineClassHint,'UNKNOWN');
for(const key of [secret,'SECRET_ORDER_ID','SECRET_LINE_ID']){
  assert.equal(JSON.stringify(maliciousMetadata).includes(key),false);
}
for(const raw of [
  '2026-02-30T10:00:00.000Z',
  '2026-10-12T10:00:00.000+03:00',
  '2026-10-12',
  'PRIVATE_DATE_2026-10-12',
  '2026-10-12T99:99:99.000Z'
]){
  assert.equal(buildEvidenceAcquisitionPacketV1({
    exists:true,department:'طباعة',priority:'عادي',dueIso:raw,
    missingKinds:['DESIGN']
  }).dueIso,'',raw);
}
assert.equal(buildEvidenceAcquisitionPacketV1({
  exists:true,department:'ليزر',priority:'vip',dueIso:'2026-10-12T23:59:59.000Z',
  missingKinds:['MACHINE']
}).priority,'VIP');
console.log('AP108_FIXED_METADATA_ALLOWLIST=PASS');
console.log('AP108_RAW_PRIVATE_FIELD_REDaction=PASS');
console.log('AP108_INVALID_OR_NONCANONICAL_DUE=NOT_EXPOSED');
console.log('AP108_BUSINESS_WRITES=0; PRODUCTION_DEPLOY=NO');

console.log('EVIDENCE_ACQUISITION_PACKET_V1=PASS');
console.log('EXTERNAL_EVIDENCE_REQUIREMENTS=EXPLICIT');
console.log('READY_WRITE=NO');
console.log('OPERATOR_TASK_ACTIVATION=NO');
console.log('RAW_IDS_EXPOSED=NO');
