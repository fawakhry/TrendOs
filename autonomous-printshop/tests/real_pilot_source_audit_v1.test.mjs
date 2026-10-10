import assert from 'node:assert/strict';
import {buildRealPilotSourceAuditV1} from '../core/real-pilot-source-audit-v1.mjs';

// Replays only the *aggregate status histogram* observed 2026-10-10
// in the bounded legacy Sheets range A2:AS251. All IDs here are SYNTHETIC.
// It must NEVER be described as D1 parity or a real eligible order.
const now=1800000000000;
const summary=[['تم التسليم',129],['جاهز للاستلام',73],['مكرر',28],['ملغى',20]];
const historical=summary.flatMap(([status,count])=>
  Array.from({length:count},(_,i)=>({
    orderId:'FAKE-ORDER-'+status+'-'+i,
    lineId:'FAKE-LINE-'+status+'-'+i,
    department:'ليزر',status,priority:'عادي',
    expectedDeliveryAt:'2026-10-12',
    customer:'NEVER_SHOW_CUSTOMER',
    assignedTo:'NEVER_SHOW_EMPLOYEE'
  }))
);
assert.equal(historical.length,250);
let x=buildRealPilotSourceAuditV1({
  rows:historical,
  source:{kind:'GOOGLE_SHEETS_LEGACY',authorizedRead:true,snapshotComplete:true,observedAtMs:now},
  nowMs:now
});
assert.equal(x.counts.observedRows,250);
assert.equal(x.counts.closed,250);
assert.equal(x.counts.ordinary,0);
assert.equal(x.sourceQualified,false);
assert.equal(x.sourceStatus,'NON_AUTHORITATIVE_SOURCE');
assert.equal(x.strictEligible,null);
assert.equal(x.candidateExists,false);
assert.equal(x.acquisitionPacket.exists,false);
assert.equal(x.productionWritesAllowed,false);
assert.equal(x.actualTaskAssignmentAllowed,false);

// A forged, incomplete, stale or unauthenticated D1 snapshot cannot become
// a qualified real pilot merely because it contains an apparently READY row.
const row={orderId:'PRIVATE_ORDER',lineId:'PRIVATE_LINE',
  customer:'NEVER_SHOW_CUSTOMER',assignedTo:'NEVER_SHOW_EMPLOYEE',
  status:'طلب جديد',department:'ليزر',priority:'عاجل',
  expectedDeliveryAt:'2026-10-12'};
const source={kind:'D1_QUALIFIED_SHADOW',authorizedRead:true,snapshotComplete:true,observedAtMs:now-2000};
const cases=[
  [{...source,authorizedRead:false},'AUTHORIZED_READ_NOT_PROVEN'],
  [{...source,snapshotComplete:false},'SNAPSHOT_INCOMPLETE'],
  [{...source,observedAtMs:now-300001},'SOURCE_STALE_OR_CLOCK_UNVERIFIED'],
  [{...source,observedAtMs:now+100},'SOURCE_STALE_OR_CLOCK_UNVERIFIED'],
  [{kind:'LEGACY_SHEET',...source},'D1_EVIDENCE_REVIEW']
];
for(const [fixture,expected] of cases.slice(0,4)){
  x=buildRealPilotSourceAuditV1({rows:[row],source:fixture,nowMs:now});
  assert.equal(x.sourceQualified,false);
  assert.equal(x.sourceStatus,expected);
  assert.equal(x.strictEligible,null);
  assert.equal(x.acquisitionPacket.exists,false);
}
// With the clean source envelope, real evidence must still be same-line
// and must contain current DESIGN / MATERIAL / MACHINE proofs.
const event=(kind,id,line='PRIVATE_LINE',state='READY',observedAtMs=now-1000,expiresAtMs=now+10000)=>({
  evidenceId:id,lineId:line,kind,state,observedAtMs,expiresAtMs
});
x=buildRealPilotSourceAuditV1({
  rows:[row],source,nowMs:now,
  events:[event('DESIGN','DESIGN_OK'),event('MACHINE','MACHINE_OK'),
    event('MATERIAL','OTHER_MATERIAL','OTHER_PRIVATE_LINE')]
});
assert.equal(x.sourceQualified,true);
assert.equal(x.strictEligible,0);
assert.equal(x.candidateExists,true);
assert.deepEqual(x.acquisitionPacket.missingKinds,['MATERIAL']);
assert.equal(x.acquisitionPacket.review.statusByKind.MATERIAL,'NO_RECORDED_EVIDENCE');
assert.equal(x.actualTaskAssignmentAllowed,false);

// Even with all three READY facts, diagnostics cannot authorize dispatch.
x=buildRealPilotSourceAuditV1({
  rows:[row],source,nowMs:now,
  events:[event('DESIGN','DESIGN_OK'),event('MACHINE','MACHINE_OK'),
    event('MATERIAL','MATERIAL_OK')]
});
assert.equal(x.strictEligible,1);
assert.equal(x.candidateExists,false);
assert.equal(x.productionWritesAllowed,false);
assert.equal(x.actualTaskAssignmentAllowed,false);

for(const marker of ['PRIVATE_ORDER','PRIVATE_LINE','OTHER_PRIVATE_LINE',
  'NEVER_SHOW_CUSTOMER','NEVER_SHOW_EMPLOYEE','DESIGN_OK','MACHINE_OK','MATERIAL_OK']){
  assert.ok(!JSON.stringify(x).includes(marker),'raw source value leaked: '+marker);
}
assert.equal(buildRealPilotSourceAuditV1().sourceQualified,false);
console.log('AP098_LEGACY_SHEETS_250_CLOSED_BOUNDED_FIXTURE=PASS');
console.log('AP098_D1_SOURCE_AUTH_COMPLETENESS_FRESHNESS=FAIL_CLOSED');
console.log('AP098_SAME_LINE_EVIDENCE_REQUIRED=PASS');
console.log('AP098_PILOT_READONLY_NO_IDS_NO_ASSIGNMENT=PASS');
console.log('AP098_LIVE_D1_READ=NOT_PERFORMED; PRODUCTION_MUTATIONS=0');
