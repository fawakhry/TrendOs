/**
 * Zero Google operator task Google dependency / BOOK24 source inventory OFF.
 *
 * Read checked-in files only. Never calls Google, Cloudflare, D1, Apps Script,
 * BOOK24 handoff, Printshop or real tasks. Never toggles writer settings.
 * A source PASS is an inventory result, NOT a cutover certificate.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const OPERATOR_GOOGLE_SOURCE_AUDIT_V0='ZERO_GOOGLE_OPERATOR_BOOK24_SOURCE_ONLY_OFF_20261031';
export const OPERATOR_ROUTES_V0=Object.freeze({
  '/v1/operator/tasks/status':{method:'GET',op:'status',roles:['WAEL','GABER','MANAGER'],mutation:false},
  '/v1/operator/tasks/claim-next':{method:'POST',op:'claimNext',roles:['WAEL','GABER'],mutation:true},
  '/v1/operator/tasks/complete':{method:'POST',op:'completeTask',roles:['WAEL','GABER'],mutation:true},
  '/v1/operator/fly-print':{method:'GET',op:'flyPrint',roles:['WAEL'],mutation:false},
  '/v1/operator/press-candidates':{method:'GET',op:'pressCandidates',roles:['WAEL'],mutation:false},
  '/v1/operator/tasks/metrics':{method:'GET',op:'metrics',roles:['MANAGER'],mutation:false}
});
export const OPERATOR_SOURCE_FILES_V0=Object.freeze({
  edge:'cloudflare-d1/src/operator-task-edge-v2.mjs',
  proxy:'operator-task-edge-proxy-v2.gs',
  workQueue:'work-queue-backend-v1.gs',
  operatorV2:'operator-task-workflow-v2.gs'
});
const is=(x)=>x===true;
function parseRouteDeclarations(edge){
  const extracted=[];
  const re=/^\s*'(\/v1\/operator\/[^']+)':\s*\{\s*method:\s*'([A-Z]+)',\s*op:\s*'([A-Za-z]+)',\s*roles:\s*\[([^\]]+)\],\s*mutation:\s*(true|false)\s*\},?\s*$/gm;
  for(const match of edge.matchAll(re)){
    extracted.push({
      path:match[1],method:match[2],op:match[3],
      roles:Array.from(match[4].matchAll(/'([A-Z]+)'/g),m=>m[1]),
      mutation:match[5]==='true'
    });
  }
  return extracted;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
export function inspectOperatorBook24SourceOnlyV0(sources={}){
  const {edge,proxy,workQueue,operatorV2}=sources;
  const checks={};
  const pass=(key,value)=>{checks[key]=is(value);};
  const provided=[edge,proxy,workQueue,operatorV2].every(x=>typeof x==='string'&&x.length>200);
  pass('allOriginalSourcesPresent',provided);
  const routes=typeof edge==='string'?parseRouteDeclarations(edge):[];
  pass('exactSixOperatorRoutesAndRoleMethods',
    routes.length===6&&
    Object.entries(OPERATOR_ROUTES_V0).every(([pathname,expected])=>
      routes.filter(x=>x.path===pathname).length===1&&same(
        Object.fromEntries(['method','op','roles','mutation'].map(k=>[k,routes.find(x=>x.path===pathname)[k]])),
        expected
      )));
  pass('twoMutatingRoutesExactly',
    routes.length===6&&
    same(routes.filter(x=>x.mutation).map(x=>x.op).sort(),['claimNext','completeTask']));
  pass('edgeUsesExistingAppsScriptGoogleProxy',
    /function\s+appsScriptUrl\s*\(env\)/.test(edge||'')&&
    /APPS_SCRIPT_API_URL/.test(edge||'')&&
    /action:\s*'operatorTaskEdgeProxyV2'/.test(edge||'')&&
    /await\s+callAppsScript\(/.test(edge||'')&&
    /return\s+json\(upstream\.body,\s*upstream\.status,\s*cors\)/.test(edge||''));
  pass('edgeTokenRolesAndMutationIdempotencySource',
    /verifyEdgeSessionToken/.test(edge||'')&&
    /OPERATOR_TASK_V2_EDGE_ENABLED/.test(edge||'')&&
    /OPERATOR_TASK_PROXY_SECRET/.test(edge||'')&&
    /roleFromSession/.test(edge||'')&&
    /IDEMPOTENCY_KEY_REQUIRED/.test(edge||'')&&
    /signOperatorTaskAssertion/.test(edge||'')&&
    /HMAC/.test(edge||''));
  pass('appsScriptProxyVerifiesSignedDelegationAndLegacyActor',
    /function\s+operatorTaskEdgeProxyV2_\s*\(/.test(proxy||'')&&
    /EDGE_PROXY_SIGNATURE_INVALID/.test(proxy||'')&&
    /EDGE_PROXY_IDEMPOTENCY_REQUIRED/.test(proxy||'')&&
    /EDGE_PROXY_ASSERTION_STALE/.test(proxy||'')&&
    /findUser_\(/.test(proxy||'')&&
    /otClaimNextV2_\(/.test(proxy||'')&&
    /otCompleteTaskV2_\(/.test(proxy||''));
  pass('bothLegacyTaskWriterCandidatesStillHaveIndependentFeatureFlags',
    /TRENDOS_WORK_QUEUE_V1_ENABLED/.test(workQueue||'')&&
    /TRENDOS_OPERATOR_TASK_V2_ENABLED/.test(operatorV2||''));
  pass('bothLegacyScriptSourcesUseOnlyLocalScriptLocks',
    /LockService\.getScriptLock\(\)/.test(workQueue||'')&&
    /LockService\.getScriptLock\(\)/.test(operatorV2||'')&&
    /wqWithLockV1_\(/.test(workQueue||'')&&
    /otWithLockV2_\(/.test(operatorV2||''));
  // Book24 source lives on separate unmerged Draft #194/#197 branches.
  // Whether a guard appears in *this* checked-in Edge is not runtime proof.
  const embeddedBook24Guard=/\bcheckOperatorEdgeD1WriterConflictV1\s*\(/.test(edge||'');
  const missingSourceChecks=Object.entries(checks).filter(([,v])=>v!==true).map(([key])=>key);
  return {
    version:OPERATOR_GOOGLE_SOURCE_AUDIT_V0,
    mode:'READ_ONLY_OFFLINE_SOURCE_INVENTORY_NO_SECRETS',
    sourceInventoryComplete:missingSourceChecks.length===0,
    failedSourceChecks:missingSourceChecks,
    sourceChecks:checks,
    exactOperatorRouteCount:routes.length,
    sourceRoutes:routes.map(r=>({path:r.path,method:r.method,mutation:r.mutation,roles:r.roles})),
    mutationOps:['claimNext','completeTask'],
    readOnlyOps:['status','flyPrint','pressCandidates','metrics'],
    googleAppsScriptProxyStillInSource:checks.edgeUsesExistingAppsScriptGoogleProxy,
    workQueueV1CandidateStillInSource:checks.bothLegacyTaskWriterCandidatesStillHaveIndependentFeatureFlags,
    operatorTaskV2CandidateStillInSource:checks.bothLegacyTaskWriterCandidatesStillHaveIndependentFeatureFlags,
    edgeBook24ConflictGuardReferencedInThisSource:embeddedBook24Guard,
    // An offline ScriptLock serializes only one SCRIPT PROJECT, never all
    // separate Apps Script deployments nor D1. No current branch migration.
    crossProjectScriptLockExclusivityProven:false,
    book24TwoScriptLaneDeploymentInventoryAttested:false,
    book24ActualD1ControlModeAndEpochVerified:false,
    activeTasksZeroOnAllExistingAuthoritiesVerified:false,
    book24OwnerSingleWriterApproved:false,
    realGoogleToD1TaskCutoverProven:false,
    operatorGoogleCallsRetiredLiveProven:false,
    productionTaskMutationsPerformed:false,
    operatorWriterActivationAllowed:false,
    stopAppsScriptNowAllowed:false,
    printOrTaskExecutionAuthorized:false,
    productionGoogleCustomerActionsRetiredLastProven:0,
    customerGoogleActionCount:9,
    productionGo:false,
    status:missingSourceChecks.length?
      'SOURCE_DRIFT_HOLD_REVIEW_REQUIRED':
      'SOURCE_INVENTORY_PASS_BOOK24_AUTHORITY_AND_GOOGLE_CUTOVER_BLOCKED',
    nextEvidence:[
      'BOOK24 approved exact deployed WORK_QUEUE_V1 and OPERATOR_TASK_V2 script lane fingerprints and code versions',
      'Independent read-only D1 mode+epoch, Edge flag and direct Google Script writer guard evidence',
      'Zero in-flight claims/completions across all Task writers and script-project lock isolation proof',
      'Owner-approved single writer cutover with real rollback and idempotent task ACK reconciliation'
    ]
  };
}
export function auditOperatorBook24RepositoryV0(root){
  const source={};
  for(const [kind,file] of Object.entries(OPERATOR_SOURCE_FILES_V0)){
    try {source[kind]=fs.readFileSync(path.join(root,file),'utf8');}
    catch {source[kind]='';}
  }
  return inspectOperatorBook24SourceOnlyV0(source);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out=auditOperatorBook24RepositoryV0(path.resolve(process.argv[2]||process.cwd()));
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
  if(!out.sourceInventoryComplete)process.exitCode=1;
}
