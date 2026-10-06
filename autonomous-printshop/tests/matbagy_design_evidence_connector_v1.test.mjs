import assert from 'node:assert/strict';
import {
  qualifyMatbagyDesignCaseForReadinessV1,
  matbagyDesignReadinessCandidateV1
} from '../core/matbagy-design-evidence-connector-v1.mjs';

const base={
  tenantId:'TENANT_001',
  caseId:'DESIGN-2026-000013',
  orderId:'4323',
  lineId:'4323-01',
  approvalStatus:'FINAL_APPROVED',
  assetBindingStatus:'LINKED',
  storageProvider:'GOOGLE_DRIVE',
  storageRef:'drive:file:abc',
  contentSha256:'a'.repeat(64),
  preflightStatus:'PASS'
};

let q=qualifyMatbagyDesignCaseForReadinessV1(base);
assert.equal(q.qualified,true);

let out=matbagyDesignReadinessCandidateV1(base,{observedAtMs:1800000000000});
assert.equal(out.candidate.kind,'DESIGN');
assert.equal(out.candidate.state,'READY');
assert.equal(out.candidate.lineId,'4323-01');
assert.equal(out.candidate.sourceKind,'MATBAGY_OS');

for(const patch of [
  {orderId:'UNKNOWN'},
  {lineId:''},
  {approvalStatus:'NOT_CONFIRMED'},
  {assetBindingStatus:'PENDING_UPLOAD'},
  {storageRef:''},
  {contentSha256:''},
  {preflightStatus:'UNKNOWN'}
]){
  const bad=matbagyDesignReadinessCandidateV1({...base,...patch});
  assert.equal(bad.candidate,null);
  assert.equal(bad.qualification.qualified,false);
}

const saved=matbagyDesignReadinessCandidateV1({...base,approvalStatus:'SAVED'});
assert.equal(saved.candidate,null);

console.log('MATBAGY_DESIGN_EVIDENCE_CONNECTOR_V1=PASS');
console.log('EXPLICIT_ORDER_AND_LINE_REQUIRED=YES');
console.log('SAVED_IS_APPROVED=NO');
console.log('LINKED_ASSET_REQUIRED=YES');
console.log('CONTENT_SHA256_REQUIRED=YES');
console.log('PREFLIGHT_PASS_REQUIRED=YES');
