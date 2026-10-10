import assert from 'node:assert/strict';
import {designReadinessEvidenceCandidatesV1} from '../core/design-production-evidence-v1.mjs';
import {materialReadinessEvidenceCandidatesV2} from '../core/material-readiness-candidate-v2.mjs';
import {machineReadinessEvidenceCandidatesV1} from '../core/machine-readiness-v1.mjs';
import {reviewPrivateSameLineProvenanceV1} from '../core/private-line-provenance-review-v1.mjs';

// AP-115 source-level synthetic producer-to-private-review integration ONLY.
// No D1, Cloudflare, real order, machine, customer, stock, or financial writes.
const now=1800000000000;
const A='SYNTHETIC-A-INTERNAL-LINE';
const B='SYNTHETIC-B-INTERNAL-LINE';
const SECRET='CUSTOMER_AND_ASSET_DO_NOT_EXPOSE';
const HASH='c'.repeat(64);
const design=designReadinessEvidenceCandidatesV1({
  artifacts:[{artifactId:SECRET,lineId:A,contentSha256:HASH,createdAtMs:now-6000}],
  approvals:[{approvalEventId:'FAKE-APPROVAL',artifactId:SECRET,
    approvalGate:'REQUIRED',approvalState:'OWNER_APPROVED',observedAtMs:now-5000}],
  preflights:[{preflightRunId:'FAKE-PREFLIGHT',artifactId:SECRET,
    result:'PASS',observedAtMs:now-2000}],
  assetBindings:[{bindingEventId:'FAKE-BINDING',artifactId:SECRET,tenantId:'TENANT_001',
    bindingStatus:'LINKED',privacyClass:'CUSTOMER_PRIVATE',
    storageProvider:'R2',storageRef:'PRIVATE_R2_'+SECRET,observedAtMs:now-4000}]
});
assert.equal(design.length,1);
assert.equal(design[0].state,'READY');
assert.equal(design[0].evidence.preflightResult,'PASS');
assert.equal(design[0].evidence.approvalGate,'REQUIRED');
// The design source has no authoritative TTL; do not synthesize one in source.
assert.equal(design[0].expiresAtMs,undefined);
const review=events=>reviewPrivateSameLineProvenanceV1({
  privateLineKey:A,events,nowMs:now,sourceAccessVerified:true
});
let x=review(design);
assert.equal(x.statusByKind.DESIGN,'EXPIRY_UNVERIFIED');
assert.equal(x.pilotLineApproved,false);

// Both material and machine are synthetic sourced candidates; neither
// constitutes physical real-world verification or authority.
const material=materialReadinessEvidenceCandidatesV2([{
  lineId:A,materialName:'SYNTHETIC_MATERIAL',materialId:'FAKE_M',
  materialConsumption:2,stockQty:10,materialVersion:'1'
}],{nowMs:now,allowReady:true,accountingGeneral:true,
    postCutoverQualified:true,stockAuthorityConfirmed:true});
assert.equal(material.length,1);
const machines=machineReadinessEvidenceCandidatesV1({
  mappings:[{lineId:A,machineId:'FAKE_MACHINE',mappingState:'ACTIVE',
    observedAtMs:now-9000,sourceKind:'OPERATOR_CHECK'}],
  machines:[{machineId:'FAKE_MACHINE',active:1,department:'طباعة',
    machineClass:'PRINT',version:1}],
  observations:[{machineId:'FAKE_MACHINE',observationId:'FAKE_TEST',
    machineState:'READY',sourceKind:'SELF_TEST',
    observedAtMs:now-1000,expiresAtMs:now+60000}]
  ,nowMs:now
});
assert.equal(machines.length,1);
x=review([...design,...material,...machines]);
assert.equal(x.statusByKind.DESIGN,'EXPIRY_UNVERIFIED');
assert.equal(x.statusByKind.MATERIAL,'MATERIAL_LEDGER_EXTERNAL_VERIFICATION_REQUIRED');
assert.equal(x.statusByKind.MACHINE,'MACHINE_REGISTRY_SERIAL_EXTERNAL_VERIFICATION_REQUIRED');
assert.equal(x.designMaterialMachineSourceVerified,false);

// Simulated protected-review timestamp envelope ONLY, not issued by design
// source: used solely to test post-expiry-gate progression, never READY.
const simulated={...design[0],expiresAtMs:now+10000};
x=review([simulated,...material,...machines]);
assert.equal(x.statusByKind.DESIGN,'DESIGN_EXTERNAL_PROVENANCE_REVIEW_REQUIRED');
assert.equal(x.pilotLineApproved,false);
assert.equal(x.assignmentAllowed,false);
assert.equal(x.readinessWriteAllowed,false);
assert.equal(x.productionWriteAllowed,false);

// A fresher revoked approval cannot be represented as a verified design.
// Cross-line material cannot satisfy the line A review.
const crossLineMaterial={...material[0],lineId:B};
x=review([simulated,crossLineMaterial,...machines]);
assert.equal(x.statusByKind.MATERIAL,'NO_SAME_LINE_EVIDENCE');
for(const output of [
  review(design),review([...design,...material,...machines]),
  review([simulated,...material,...machines])
]){
 const safe=JSON.stringify(output);
 for(const marker of [A,B,SECRET,HASH,'FAKE_MACHINE','FAKE_M','FAKE-PREFLIGHT']){
   assert.equal(safe.includes(marker),false,'AP115_PRIVATE_SOURCE_EXPOSED');
 }
 assert.equal(output.pilotLineApproved,false);
 assert.equal(output.operatorTaskActivationAllowed,false);
}
console.log('AP115_PRODUCER_STRUCTURED_PREFLIGHT=PASS');
console.log('AP115_DESIGN_TTL_NOT_INVENTED=PASS');
console.log('AP115_SAME_LINE_3_KIND_SOURCE_PRECHECK=PASS');
console.log('AP115_PRIVATE_REVIEW_NO_IDS_NO_ASSIGNMENT=PASS');
console.log('AP115_PRODUCTION_DEPLOY=NO; LIVE_D1=NOT_ACCESSED');
