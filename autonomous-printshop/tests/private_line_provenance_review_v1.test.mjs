import assert from 'node:assert/strict';
import {reviewPrivateSameLineProvenanceV1 as review} from '../core/private-line-provenance-review-v1.mjs';

const now=1800000000000;
const A='PRIVATE_FAKE_ORDER_LINE_A';
const B='PRIVATE_FAKE_ORDER_LINE_B';
const secret='CUSTOMER_PHONE_0109999_PRIVATE';
const base=(line,kind,sourceKind,extra={})=>({
  lineId:line,kind,state:'READY',sourceKind,sourceRef:'PRIVATE_SOURCE_'+kind,
  sourceVersion:'private-version',
  observedAtMs:now-2000,expiresAtMs:now+12000,
  customerName:secret,customerPhone:secret,orderId:secret,...extra
});
const design=base(A,'DESIGN','DESIGN_PREFLIGHT',{
  sourceVersion:'a'.repeat(64),
  evidence:{assetBindingState:'READY',preflightResult:'PASS',approvalGate:'REQUIRED',approvalState:'OWNER_APPROVED',
    artifactId:secret,contentSha256:'a'.repeat(64)}
});
const materialB=base(B,'MATERIAL','MATERIAL_LEDGER',{
  evidence:{postCutoverQualified:true,required:2,available:5,materialName:secret}
});
const machine=base(A,'MACHINE','MACHINE_AGENT',{
  evidence:{machineId:'PRIVATE_SERIAL_ID',observationSource:'OPERATOR_CHECK',
    mappingSource:'OWNER_ASSET_REGISTRY',machineSerial:secret}
});
const audit=rows=>review({privateLineKey:A,events:rows,nowMs:now,sourceAccessVerified:true});
let x=audit([design,materialB,machine]);
assert.equal(x.classification,'PRIVATE_CLAIM_PRECHECK_ONLY');
assert.equal(x.statusByKind.DESIGN,'DESIGN_EXTERNAL_PROVENANCE_REVIEW_REQUIRED');
assert.equal(x.statusByKind.MATERIAL,'NO_SAME_LINE_EVIDENCE');
assert.equal(x.statusByKind.MACHINE,'MACHINE_REGISTRY_SERIAL_EXTERNAL_VERIFICATION_REQUIRED');
assert.equal(x.sourceAuthentication,'CALLER_ATTESTED_NOT_INDEPENDENTLY_VERIFIED');
assert.equal(x.designMaterialMachineSourceVerified,false);
assert.equal(x.pilotLineApproved,false);
assert.equal(x.productionWriteAllowed,false);
assert.equal(x.assignmentAllowed,false);

// Even all-three READY claims, without independent protected source checks,
// can NEVER turn into a qualified physical or business order line.
const materialA={...materialB,lineId:A,sourceRef:'PRIVATE_MATERIAL_LEDGER'};
x=audit([design,materialA,machine]);
assert.equal(x.statusByKind.MATERIAL,'MATERIAL_LEDGER_EXTERNAL_VERIFICATION_REQUIRED');
assert.equal(x.designMaterialMachineSourceVerified,false);
assert.equal(x.readinessWriteAllowed,false);
const malformedMaterial={...materialA,evidence:{postCutoverQualified:true,required:6,available:2}};
assert.equal(audit([design,malformedMaterial,machine]).statusByKind.MATERIAL,
  'MATERIAL_STOCK_CONSUMPTION_UNVERIFIED');
assert.equal(audit([{...design,sourceKind:'PUBLIC_UNTRUSTED'}]).statusByKind.DESIGN,
  'SOURCE_KIND_UNQUALIFIED');
assert.equal(audit([{...design,sourceRef:''}]).statusByKind.DESIGN,
  'SOURCE_PROVENANCE_REFERENCE_MISSING');
assert.equal(audit([{...design,evidence:{...design.evidence,approvalState:'UNKNOWN'}}]).statusByKind.DESIGN,
  'DESIGN_APPROVAL_UNVERIFIED');
assert.equal(audit([{...design,evidence:{...design.evidence,approvalGate:'UNKNOWN'}}])
  .statusByKind.DESIGN,'DESIGN_APPROVAL_UNVERIFIED');
assert.equal(audit([{...design,evidence:{...design.evidence,
  approvalGate:'NOT_REQUIRED_BY_POLICY',approvalState:'POLICY_APPROVED',approvalPolicyRef:''}}])
  .statusByKind.DESIGN,'DESIGN_APPROVAL_UNVERIFIED');
assert.equal(audit([{...design,evidence:{...design.evidence,
  approvalGate:'NOT_REQUIRED_BY_POLICY',approvalState:'POLICY_APPROVED',approvalPolicyRef:'POLICY-FAKE'}}])
  .statusByKind.DESIGN,'DESIGN_EXTERNAL_PROVENANCE_REVIEW_REQUIRED');
assert.equal(audit([{...design,evidence:{...design.evidence,
  approvalGate:'REQUIRED',approvalState:'POLICY_APPROVED',approvalPolicyRef:'POLICY-FAKE'}}])
  .statusByKind.DESIGN,'DESIGN_APPROVAL_UNVERIFIED');
assert.equal(audit([{...machine,evidence:{machineId:'M',observationSource:'SENSOR',mappingSource:'OWNER'}}])
  .statusByKind.MACHINE,'MACHINE_ID_OR_DIRECT_CHECK_UNVERIFIED');

// Latest expired BLOCKED invalidates a formerly READY claim. No older fallback.
const expired={...materialA,state:'BLOCKED',
  observedAtMs:now-500,expiresAtMs:now-1};
assert.equal(audit([materialA,expired]).statusByKind.MATERIAL,'LATEST_EVIDENCE_EXPIRED');
assert.equal(audit([materialA,{...materialA,state:'BLOCKED'}]).statusByKind.MATERIAL,
  'AMBIGUOUS_LATEST_EVIDENCE');
assert.equal(audit([{...materialA,state:'BLOCKED'},materialA]).statusByKind.MATERIAL,
  'AMBIGUOUS_LATEST_EVIDENCE');
assert.equal(audit([{...design,evidence:{...design.evidence,preflightResult:undefined}}])
  .statusByKind.DESIGN,'DESIGN_BINDING_OR_PREFLIGHT_UNVERIFIED');
assert.equal(audit([materialA,{...expired,observedAtMs:now+1,expiresAtMs:now+1000}])
  .statusByKind.MATERIAL,'FUTURE_OBSERVATION');
assert.equal(audit([materialA,{...expired,observedAtMs:'malformed'}])
  .statusByKind.MATERIAL,'SOURCE_TIME_UNVERIFIED');
assert.equal(audit([materialA,{...expired,expiresAtMs:null}])
  .statusByKind.MATERIAL,'EXPIRY_UNVERIFIED');
assert.equal(review({privateLineKey:'',events:[design],nowMs:now}).classification,'BLOCKED_SAFE');
assert.equal(review({privateLineKey:A,events:[],nowMs:NaN}).pilotLineApproved,false);

// Serialized report may only include fixed enumerations / booleans, never
// raw SHA, event reference, customer details, protected line key or machine IDs.
for(const state of [x,audit([design,materialB,machine]),audit([design,materialA,machine])]){
  const out=JSON.stringify(state);
  for(const key of [A,B,secret,'PRIVATE_SOURCE_DESIGN','PRIVATE_MATERIAL_LEDGER',
    'PRIVATE_SERIAL_ID','a'.repeat(64)]){
    assert.equal(out.includes(key),false,'PRIVATE_PROVENANCE_LEAK');
  }
}
console.log('AP110_CROSS_LINE_EVIDENCE=NO_JOIN');
console.log('AP110_REAL_DESIGN_MATERIAL_MACHINE_PROOFS=INDEPENDENT_SOURCE_REQUIRED');
console.log('AP110_LATEST_EXPIRY_AND_TIME=FAIL_CLOSED');
console.log('AP110_PRIVATE_IDENTIFIERS=NOT_EXPOSED');
console.log('AP110_LIVE_D1=NOT_ACCESSED; READY_WRITES=0; ASSIGNMENTS=0');
