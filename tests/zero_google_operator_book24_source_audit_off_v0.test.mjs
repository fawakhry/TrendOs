import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  OPERATOR_ROUTES_V0,OPERATOR_SOURCE_FILES_V0,
  inspectOperatorBook24SourceOnlyV0 as inspect,
  auditOperatorBook24RepositoryV0 as audit
} from '../tools/zero_google_operator_book24_source_audit_off_v0.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const orig=Object.fromEntries(Object.entries(OPERATOR_SOURCE_FILES_V0).map(
  ([k,v])=>[k,fs.readFileSync(path.join(ROOT,v),'utf8')]
));
function mutate(key,from,to){
  assert.ok(orig[key].includes(from),'mutation anchor '+key+' '+from);
  return inspect({...orig,[key]:orig[key].replace(from,to)});
}
function blocked(r){
  assert.equal(r.productionGo,false);
  assert.equal(r.stopAppsScriptNowAllowed,false);
  assert.equal(r.operatorWriterActivationAllowed,false);
  assert.equal(r.printOrTaskExecutionAuthorized,false);
  assert.equal(r.productionTaskMutationsPerformed,false);
  assert.equal(r.operatorGoogleCallsRetiredLiveProven,false);
  assert.equal(r.crossProjectScriptLockExclusivityProven,false);
  assert.equal(r.book24OwnerSingleWriterApproved,false);
  assert.equal(r.book24TwoScriptLaneDeploymentInventoryAttested,false);
  assert.equal(r.book24ActualD1ControlModeAndEpochVerified,false);
  assert.equal(r.activeTasksZeroOnAllExistingAuthoritiesVerified,false);
  assert.equal(r.productionGoogleCustomerActionsRetiredLastProven,0);
  assert.equal(r.customerGoogleActionCount,9);
  assert.equal(JSON.stringify(r).includes('TRENDOS_OPERATOR_TASK_PROXY_SECRET='),
    false);
}
test('current 6 routes: 4 reads, 2 writes and permissions exact, Google retained',()=>{
  const r=audit(ROOT);assert.equal(r.sourceInventoryComplete,true,
    JSON.stringify(r.failedSourceChecks));
  assert.equal(r.status,'SOURCE_INVENTORY_PASS_BOOK24_AUTHORITY_AND_GOOGLE_CUTOVER_BLOCKED');
  assert.deepEqual(r.failedSourceChecks,[]);
  assert.equal(Object.keys(OPERATOR_ROUTES_V0).length,6);
  assert.equal(r.sourceRoutes.length,6);
  assert.deepEqual(r.mutationOps,['claimNext','completeTask']);
  assert.deepEqual(r.readOnlyOps,['status','flyPrint','pressCandidates','metrics']);
  assert.deepEqual(r.sourceRoutes.filter(x=>x.mutation).map(x=>x.path),[
    '/v1/operator/tasks/claim-next','/v1/operator/tasks/complete'
  ]);
  assert.equal(r.sourceRoutes.find(x=>x.path==='/v1/operator/fly-print').roles.join(','),'WAEL');
  assert.equal(r.sourceRoutes.find(x=>x.path==='/v1/operator/tasks/metrics').roles.join(','),'MANAGER');
  assert.equal(r.googleAppsScriptProxyStillInSource,true);
  assert.equal(r.edgeBook24ConflictGuardReferencedInThisSource,false);
  blocked(r);
});
test('an unapproved new route fails complete inventory',()=>{
  const s=orig.edge.replace("  '/v1/operator/tasks/status':",
    "  '/v1/operator/tasks/undocumented': { method: 'POST', op: 'unsafeWrite', roles: ['WAEL'], mutation: true },\n  '/v1/operator/tasks/status':");
  const r=inspect({...orig,edge:s});
  assert.equal(r.sourceInventoryComplete,false);
  assert.ok(r.failedSourceChecks.includes('exactSixOperatorRoutesAndRoleMethods'));
  blocked(r);
});
test('changing role, method, mutation classification fails closed',()=>{
  for(const [from,to] of [
    ["roles: ['MANAGER'], mutation: false","roles: ['WAEL'], mutation: false"],
    ["op: 'claimNext', roles: ['WAEL', 'GABER'], mutation: true",
      "op: 'claimNext', roles: ['WAEL', 'GABER'], mutation: false"],
    ["method: 'POST', op: 'completeTask'","method: 'GET', op: 'completeTask'"]
  ]){
    const r=mutate('edge',from,to);
    assert.equal(r.sourceInventoryComplete,false);
    blocked(r);
  }
});
test('removing old Google proxy is source drift, not evidence of a safe cutover',()=>{
  const r=mutate('edge',"action: 'operatorTaskEdgeProxyV2'",
    "action: 'unverified-new-authority'");
  assert.equal(r.sourceInventoryComplete,false);
  assert.equal(r.googleAppsScriptProxyStillInSource,false);
  blocked(r);
});
test('HMAC session or idempotency guard loss blocks source signoff',()=>{
  for(const [from,to] of [
    ['verifyEdgeSessionToken','bypassEdgeAuthUnknown'],
    ['IDEMPOTENCY_KEY_REQUIRED','MUTATION_KEY_IGNORED'],
    ['signOperatorTaskAssertion','unsignedTaskPayload']
  ]){
    const r=mutate('edge',from,to);
    assert.equal(r.sourceInventoryComplete,false);
    assert.equal(r.sourceChecks.edgeTokenRolesAndMutationIdempotencySource,false);
    blocked(r);
  }
});
test('Apps Script proxy HMAC stale and replay controls must remain visible',()=>{
  for(const [from,to] of [
    ['EDGE_PROXY_SIGNATURE_INVALID','SIGNATURE_UNVERIFIED'],
    ['EDGE_PROXY_IDEMPOTENCY_REQUIRED','REPLAY_UNCHECKED'],
    ['EDGE_PROXY_ASSERTION_STALE','CLOCK_NOT_CHECKED']
  ]){
    const r=mutate('proxy',from,to);
    assert.equal(r.sourceInventoryComplete,false);
    assert.equal(r.sourceChecks.appsScriptProxyVerifiesSignedDelegationAndLegacyActor,false);
    blocked(r);
  }
});
test('Google writer flag or local ScriptLock removal blocks inventory',()=>{
  const w=mutate('workQueue','TRENDOS_WORK_QUEUE_V1_ENABLED','WORK_QUEUE_MUTATION_ALWAYS_ON');
  assert.equal(w.sourceInventoryComplete,false);blocked(w);
  const v=mutate('operatorV2','TRENDOS_OPERATOR_TASK_V2_ENABLED','OPERATOR_MUTATION_ALWAYS_ON');
  assert.equal(v.sourceInventoryComplete,false);blocked(v);
  for(const kind of ['workQueue','operatorV2']){
    const r=mutate(kind,'LockService.getScriptLock()','unsafeProjectLock()');
    assert.equal(r.sourceInventoryComplete,false);
    assert.equal(r.sourceChecks.bothLegacyScriptSourcesUseOnlyLocalScriptLocks,false);
    blocked(r);
  }
});
test('missing source, not just missing proof, always holds',()=>{
  for(const kind of Object.keys(orig)){
    const r=inspect({...orig,[kind]:''});
    assert.equal(r.sourceInventoryComplete,false);
    assert.equal(r.status,'SOURCE_DRIFT_HOLD_REVIEW_REQUIRED');
    blocked(r);
  }
});
test('source checks alone NEVER prove two separate script project writer locks',()=>{
  const r=inspect(orig);
  assert.equal(r.sourceInventoryComplete,true);
  assert.equal(r.sourceChecks.bothLegacyScriptSourcesUseOnlyLocalScriptLocks,true);
  assert.equal(r.crossProjectScriptLockExclusivityProven,false);
  assert.equal(r.book24TwoScriptLaneDeploymentInventoryAttested,false);
  assert.equal(r.book24ActualD1ControlModeAndEpochVerified,false);
  assert.equal(r.stopAppsScriptNowAllowed,false);
  blocked(r);
});
