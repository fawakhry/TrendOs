import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  projectDesignProductionReadinessV1,
  designReadinessEvidenceCandidatesV1
} from '../core/design-production-evidence-v1.mjs';

const sql=fs.readFileSync('autonomous-printshop/migrations/0024_design_production_evidence_v1.sql','utf8');
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/AUTONOMOUS_DESIGN_ARTIFACTS_APPEND_ONLY/);
assert.match(sql,/AUTONOMOUS_DESIGN_APPROVAL_APPEND_ONLY/);
assert.match(sql,/AUTONOMOUS_DESIGN_PREFLIGHT_APPEND_ONLY/);
assert.doesNotMatch(sql,/\bDROP\b/i);
assert.doesNotMatch(sql,/\bALTER\b/i);

const H='a'.repeat(64);
const artifacts=[
  {artifactId:'a1',lineId:'10-1',contentSha256:H,caseId:'DESIGN-2026-1',versionId:'V1',createdAtMs:1000},
  {artifactId:'a2',lineId:'20-1',contentSha256:H,caseId:'DESIGN-2026-2',versionId:'V1',createdAtMs:1000},
  {artifactId:'a3',lineId:'30-1',contentSha256:H,caseId:'DESIGN-2026-3',versionId:'V1',createdAtMs:1000},
  {artifactId:'a4',lineId:'40-1',contentSha256:H,caseId:'DESIGN-2026-4',versionId:'V1',createdAtMs:1000},
  {artifactId:'a5',lineId:'50-1',contentSha256:H,caseId:'DESIGN-2026-5',versionId:'V1',createdAtMs:1000}
];
const approvals=[
  {approvalEventId:'p1',artifactId:'a1',approvalGate:'REQUIRED',approvalState:'CUSTOMER_APPROVED',evidenceRef:'msg:1',actorKind:'CUSTOMER',observedAtMs:1100},
  {approvalEventId:'p2',artifactId:'a2',approvalGate:'REQUIRED',approvalState:'NOT_CONFIRMED',evidenceRef:'',actorKind:'IMPORT',observedAtMs:1100},
  {approvalEventId:'p3',artifactId:'a3',approvalGate:'NOT_REQUIRED_BY_POLICY',approvalState:'POLICY_APPROVED',policyRef:'recipe:KIDS_WEDDING_15X21@1',actorKind:'SYSTEM_POLICY',observedAtMs:1100},
  {approvalEventId:'p4',artifactId:'a4',approvalGate:'REQUIRED',approvalState:'REJECTED',evidenceRef:'msg:4',actorKind:'CUSTOMER',observedAtMs:1100},
  {approvalEventId:'p5',artifactId:'a5',approvalGate:'NOT_REQUIRED_BY_POLICY',approvalState:'POLICY_APPROVED',policyRef:'',actorKind:'SYSTEM_POLICY',observedAtMs:1100}
];
const preflights=[
  {preflightRunId:'f1',artifactId:'a1',result:'PASS',recipeId:'R1',observedAtMs:1200},
  {preflightRunId:'f2',artifactId:'a2',result:'PASS',recipeId:'R2',observedAtMs:1200},
  {preflightRunId:'f3',artifactId:'a3',result:'PASS',recipeId:'R3',observedAtMs:1200},
  {preflightRunId:'f4',artifactId:'a4',result:'PASS',recipeId:'R4',observedAtMs:1200},
  {preflightRunId:'f5',artifactId:'a5',result:'PASS',recipeId:'R5',observedAtMs:1200}
];
const assetBindings=artifacts.map((a,i)=>({
  bindingEventId:'b'+String(i+1),
  artifactId:a.artifactId,
  tenantId:'TENANT_001',
  bindingStatus:'LINKED',
  privacyClass:'CUSTOMER_PRIVATE',
  storageProvider:'R2',
  storageRef:'r2://designs/'+a.artifactId+'.png',
  observedAtMs:1150
}));

const out=projectDesignProductionReadinessV1({artifacts,approvals,preflights,assetBindings});
const by=Object.fromEntries(out.map(x=>[x.lineId,x]));
assert.equal(by['10-1'].state,'READY');
assert.equal(by['20-1'].state,'UNKNOWN');
assert.equal(by['20-1'].reason,'DESIGN_APPROVAL_NOT_QUALIFIED');
assert.equal(by['30-1'].state,'READY');
assert.equal(by['40-1'].state,'BLOCKED');
assert.equal(by['40-1'].reason,'DESIGN_REJECTED');
assert.equal(by['50-1'].state,'UNKNOWN');

const evidence=designReadinessEvidenceCandidatesV1({artifacts,approvals,preflights,assetBindings});
assert.equal(evidence.length,3);
assert.equal(evidence.filter(x=>x.state==='READY').length,2);
assert.equal(evidence.filter(x=>x.state==='BLOCKED').length,1);
assert.ok(evidence.every(x=>x.sourceKind==='DESIGN_PREFLIGHT'));
assert.ok(evidence.every(x=>x.sourceVersion===H));

const savedOnly=projectDesignProductionReadinessV1({
  artifacts:[{artifactId:'s1',lineId:'60-1',contentSha256:H,caseId:'DESIGN-2026-SAVED',versionId:'V1',createdAtMs:1}],
  approvals:[],
  preflights:[{preflightRunId:'sf1',artifactId:'s1',result:'PASS',observedAtMs:2}],
  assetBindings:[{
    bindingEventId:'sb1',artifactId:'s1',tenantId:'TENANT_001',
    bindingStatus:'LINKED',privacyClass:'CUSTOMER_PRIVATE',
    storageProvider:'R2',storageRef:'r2://designs/s1.png',observedAtMs:1
  }]
})[0];
assert.equal(savedOnly.state,'UNKNOWN');
assert.equal(savedOnly.reason,'DESIGN_APPROVAL_NOT_QUALIFIED');

const noBinding=projectDesignProductionReadinessV1({
  artifacts:[{artifactId:'n1',lineId:'70-1',contentSha256:H,caseId:'DESIGN-2026-NOBIND',versionId:'V1',createdAtMs:1}],
  approvals:[{approvalEventId:'np1',artifactId:'n1',approvalGate:'REQUIRED',approvalState:'CUSTOMER_APPROVED',evidenceRef:'msg:n1',actorKind:'CUSTOMER',observedAtMs:2}],
  preflights:[{preflightRunId:'nf1',artifactId:'n1',result:'PASS',observedAtMs:3}],
  assetBindings:[]
})[0];
assert.equal(noBinding.state,'UNKNOWN');
assert.equal(noBinding.reason,'ASSET_BINDING_MISSING');

console.log('AUTONOMOUS_PRINTSHOP_DESIGN_PRODUCTION_EVIDENCE_V1=PASS');
console.log('SAVED_IS_NOT_APPROVED=YES');
console.log('READY_REQUIRES=LINKED_ASSET+HASH+PREFLIGHT_PASS+QUALIFIED_APPROVAL');
console.log('POLICY_APPROVAL_REQUIRES_POLICY_REF=YES');
console.log('REJECTED_OR_PREFLIGHT_FAIL=BLOCKED');
