import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectDesignProductionReadinessV1,
  designReadinessEvidenceCandidatesV1
} from '../core/design-production-evidence-v1.mjs';
import { latestReadinessEvidenceV1 } from '../core/readiness-evidence-v1.mjs';

// Entirely synthetic input: no Google, D1, network, machines or customer records.
const now=1800000000000;
const H='b'.repeat(64);
const artifact={artifactId:'fake-a1',lineId:'fake-line',contentSha256:H,createdAtMs:now-10000};
const approval=(id,state,time)=>({
  approvalEventId:id,artifactId:artifact.artifactId,lineId:artifact.lineId,
  approvalGate:'REQUIRED',approvalState:state,evidenceRef:'fake:'+id,
  actorKind:'CUSTOMER',observedAtMs:time
});
const preflight=(id,result,time)=>({
  preflightRunId:id,artifactId:artifact.artifactId,lineId:artifact.lineId,
  result,recipeId:'fake-recipe',observedAtMs:time
});
const binding=(id,state,time)=>({
  bindingEventId:id,artifactId:artifact.artifactId,tenantId:'TENANT_001',
  bindingStatus:state,privacyClass:'CUSTOMER_PRIVATE',
  storageProvider:'R2',storageRef:'fake://designs/a1',
  observedAtMs:time
});
function data(extra={}){
  return {
    artifacts:[artifact],
    approvals:[approval('approved','CUSTOMER_APPROVED',now-8000)],
    preflights:[preflight('pass','PASS',now-6000)],
    assetBindings:[binding('linked','LINKED',now-7000)],
    tenantId:'TENANT_001',nowMs:now,...extra
  };
}
function project(extra){return projectDesignProductionReadinessV1(data(extra))[0];}
function candidate(extra){return designReadinessEvidenceCandidatesV1(data(extra))[0];}

test('valid READY uses the newest contributing source time, not arbitrary collector now',()=>{
  assert.equal(project().state,'READY');
  assert.equal(candidate().observedAtMs,now-6000);
  assert.equal(candidate().sourceKind,'DESIGN_PREFLIGHT');
  assert.equal(candidate().sourceVersion,H);
});

test('later rejected approval outranks earlier preflight when evidence is persisted',()=>{
  const input={approvals:[
    approval('approved','CUSTOMER_APPROVED',now-8000),
    approval('rejected','REJECTED',now-1000)
  ]};
  assert.equal(project(input).reason,'DESIGN_REJECTED');
  assert.equal(candidate(input).state,'BLOCKED');
  assert.equal(candidate(input).observedAtMs,now-1000);
});

test('later REMOVED binding outranks the preflight time',()=>{
  const input={assetBindings:[
    binding('linked','LINKED',now-7000),
    binding('removed','REMOVED',now-500)
  ]};
  assert.equal(project(input).reason,'ASSET_REMOVED');
  assert.equal(candidate(input).state,'BLOCKED');
  assert.equal(candidate(input).observedAtMs,now-500);
});

test('later MISSING binding also produces a newer BLOCKED evidence',()=>{
  const input={assetBindings:[
    binding('linked','LINKED',now-7000),
    binding('missing','MISSING',now-1200)
  ]};
  assert.equal(candidate(input).state,'BLOCKED');
  assert.equal(candidate(input).observedAtMs,now-1200);
});

test('intermediate legacy READY can no longer mask a later approval rejection',()=>{
  const input={approvals:[
    approval('approved','CUSTOMER_APPROVED',now-8000),
    approval('rejected','REJECTED',now-1000)
  ]};
  const d=candidate(input);
  const events=[
    {lineId:artifact.lineId,kind:'DESIGN',state:'READY',
     evidenceId:'legacy',observedAtMs:now-4000},
    {...d,evidenceId:'rejected'}
  ];
  const latest=latestReadinessEvidenceV1(events,now).get(artifact.lineId+'::DESIGN');
  assert.equal(latest.state,'BLOCKED');
});

test('intermediate legacy READY cannot mask a later binding revocation',()=>{
  const d=candidate({assetBindings:[
    binding('linked','LINKED',now-7000),
    binding('removed','REMOVED',now-500)
  ]});
  const events=[
    {lineId:artifact.lineId,kind:'DESIGN',state:'READY',
     evidenceId:'legacy',observedAtMs:now-4000},
    {...d,evidenceId:'revocation'}
  ];
  assert.equal(latestReadinessEvidenceV1(events,now).get(artifact.lineId+'::DESIGN').state,'BLOCKED');
});

test('later reapproval after rejection remains READY when all components qualify',()=>{
  const x=candidate({approvals:[
    approval('rejected','REJECTED',now-8000),
    approval('reapproved','CUSTOMER_APPROVED',now-800)
  ]});
  assert.equal(x.state,'READY');
  assert.equal(x.observedAtMs,now-800);
});

test('future latest approval is fail-closed and cannot resurrect older READY',()=>{
  const x=candidate({approvals:[
    approval('approved','CUSTOMER_APPROVED',now-8000),
    approval('future','CUSTOMER_APPROVED',now+1000)
  ]});
  assert.equal(x.state,'BLOCKED');
  assert.equal(x.observedAtMs,now);
  assert.equal(x.evidence.reason,'DESIGN_SOURCE_TIMESTAMP_INVALID');
  assert.equal(x.evidence.sourceClockInvalid,true);
});

test('future latest binding is fail-closed instead of falling back to old LINKED',()=>{
  const x=candidate({assetBindings:[
    binding('linked','LINKED',now-7000),
    binding('future','LINKED',now+1000)
  ]});
  assert.equal(x.state,'BLOCKED');
  assert.equal(x.observedAtMs,now);
  assert.equal(x.evidence.reason,'DESIGN_SOURCE_TIMESTAMP_INVALID');
});

test('future latest PASS preflight is fail-closed instead of reusing older PASS',()=>{
  const x=candidate({preflights:[
    preflight('pass','PASS',now-6000),
    preflight('future','PASS',now+1000)
  ]});
  assert.equal(x.state,'BLOCKED');
  assert.equal(x.observedAtMs,now);
});

test('future-dated artifact cannot qualify as READY',()=>{
  const x=candidate({artifacts:[{...artifact,createdAtMs:now+1000}]});
  assert.equal(x.state,'BLOCKED');
  assert.equal(x.observedAtMs,now);
});

test('an unapproved design is still UNKNOWN with no READY candidate',()=>{
  const x=project({approvals:[]});
  assert.equal(x.state,'UNKNOWN');
  assert.equal(designReadinessEvidenceCandidatesV1(data({approvals:[]})).length,0);
});

test('later preflight FAIL stays BLOCKED with its actual event time',()=>{
  const x=candidate({preflights:[
    preflight('pass','PASS',now-6000),
    preflight('fail','FAIL',now-300)
  ]});
  assert.equal(x.state,'BLOCKED');
  assert.equal(x.observedAtMs,now-300);
});

test('later approved binding supports newer READY without fabricating preflight time',()=>{
  const x=candidate({assetBindings:[
    binding('pending','PENDING_UPLOAD',now-7000),
    binding('linked','LINKED',now-100)
  ]});
  assert.equal(x.state,'READY');
  assert.equal(x.observedAtMs,now-100);
});
