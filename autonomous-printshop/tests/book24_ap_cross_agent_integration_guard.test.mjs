import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {latestReadinessEvidenceV1} from '../core/readiness-evidence-v1.mjs';
import {designReadinessEvidenceCandidatesV1} from '../core/design-production-evidence-v1.mjs';

const now=1800000000000;
const row=(id,state,observedAtMs=now-10000,kind='DESIGN',lineId='FAKE-LINE')=>({
  evidenceId:id,lineId,kind,state,observedAtMs,expiresAtMs:now+30000,
  sourceKind:'DESIGN_PREFLIGHT',sourceRef:'fake',sourceVersion:'v1'
});
test('AP121: malformed same-kind time poisons even newer valid READY',()=>{
  for(const bad of [0,-1,NaN,1.5,'invalid']){
    const xs=[row('ready','READY',now-100),row('bad','BLOCKED',bad)];
    assert.equal(latestReadinessEvidenceV1(xs,now).has('FAKE-LINE::DESIGN'),false);
  }
});
test('AP122: invalidTimeInHistory from SQL poisons selected newest READY',()=>{
  assert.equal(latestReadinessEvidenceV1([
    {...row('latest','READY',now-100),invalidTimeInHistory:true}
  ],now).has('FAKE-LINE::DESIGN'),false);
});
test('AP121: damaged DESIGN history does not affect other line/kind',()=>{
  const m=latestReadinessEvidenceV1([
    row('old','READY'),row('bad','BLOCKED',0),
    row('good','READY',now-200,'MACHINE','OTHER-LINE')
  ],now);
  assert.equal(m.has('FAKE-LINE::DESIGN'),false);
  assert.equal(m.get('OTHER-LINE::MACHINE').value,true);
});
test('AP118: equal-millisecond evidence conflicts must not resolve lexically',()=>{
  for(const xs of [[row('z','READY'),row('a','BLOCKED')],[row('a','BLOCKED'),row('z','READY')]]){
    const x=latestReadinessEvidenceV1(xs,now).get('FAKE-LINE::DESIGN');
    assert.equal(x.state,'UNKNOWN');assert.equal(x.value,null);
  }
});
test('AP094: expired latest and future latest never resurrect older READY',()=>{
  for(const newest of [
    {...row('expired','BLOCKED',now-300),expiresAtMs:now-1},
    row('future','READY',now+1000)
  ]) assert.equal(latestReadinessEvidenceV1([row('old','READY'),newest],now).has('FAKE-LINE::DESIGN'),false);
});
test('AP115 plus #183: later rejected design keeps private preflight claim',()=>{
  const h='b'.repeat(64);
  const candidate=designReadinessEvidenceCandidatesV1({
    nowMs:now,artifacts:[{artifactId:'fake',lineId:'FAKE-LINE',contentSha256:h,createdAtMs:now-20000}],
    approvals:[{artifactId:'fake',approvalEventId:'yes',approvalGate:'REQUIRED',approvalState:'CUSTOMER_APPROVED',observedAtMs:now-15000},
      {artifactId:'fake',approvalEventId:'no',approvalGate:'REQUIRED',approvalState:'REJECTED',observedAtMs:now-1000}],
    preflights:[{artifactId:'fake',preflightRunId:'p1',result:'PASS',observedAtMs:now-10000}],
    assetBindings:[{artifactId:'fake',bindingEventId:'b1',tenantId:'TENANT_001',bindingStatus:'LINKED',
      privacyClass:'CUSTOMER_PRIVATE',storageProvider:'R2',storageRef:'fake',observedAtMs:now-12000}]
  })[0];
  assert.equal(candidate.state,'BLOCKED');
  assert.equal(candidate.observedAtMs,now-1000);
  assert.equal(candidate.evidence.preflightResult,'PASS');
  assert.equal(candidate.evidence.approvalState,'REJECTED');
});
test('combined SQL contracts: Shadow tie-safe, Machine latest observation before expiry',()=>{
  const shadow=fs.readFileSync('autonomous-printshop/production-shadow/worker.mjs','utf8');
  const adapters=fs.readFileSync('autonomous-printshop/core/readiness-source-adapters-v1.mjs','utf8');
  assert.match(shadow,/DENSE_RANK\(\) OVER/);
  assert.match(shadow,/invalidTimeInHistory/);
  assert.match(adapters,/ROW_NUMBER\(\) OVER/);
  assert.match(adapters,/PARTITION BY machine_id/);
});
