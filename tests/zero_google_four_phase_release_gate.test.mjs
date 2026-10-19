import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  ZERO_GOOGLE_FOUR_PHASE_VERSION,CUSTOMER_ACTION_CUTOVER_CONTRACT_V1,
  CUTOVER_STEPS_V1,assessCustomerLegacyCutoverV1,
  assessTaskSingleWriterV1,assessCloudflareDeployedParityV1,
  rehearseFailClosedRollbackV1,assessZeroGoogleFourPhasesV1
} from '../tools/zero-google-release-v1/four-phase-gate.mjs';
import {LEGACY_CUSTOMER_PORTAL_ACTIONS_V0} from
  '../cloudflare-d1/src/customer-portal-native-readiness-v0.mjs';
import {LEGACY_BROWSER_ACTIONS,handleLegacyBrowserTransport} from
  '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';

const load=p=>readFileSync(p,'utf8');
const nine=[...LEGACY_CUSTOMER_PORTAL_ACTIONS_V0];
const env={
  CORS_ORIGINS:'https://fixture.example.test',
  APPS_SCRIPT_API_URL:'https://script.google.com/macros/s/FAKE-NO-NETWORK/exec'
};
const makeReq=action=>new Request('https://fictional.edge.invalid/v1/legacy-api',{
  method:'POST',headers:{Origin:env.CORS_ORIGINS,'content-type':'application/json'},
  body:JSON.stringify({action,username:'NOT_REAL',token:'NOT_REAL'})
});

test('phase 1: nine customer actions are exactly documented in live legacy allowlist',()=>{
  assert.equal(nine.length,9);
  assert.equal(new Set(nine).size,9);
  assert.deepEqual(nine.sort(),Object.keys(CUSTOMER_ACTION_CUTOVER_CONTRACT_V1).sort());
  for(const a of nine)assert.equal(LEGACY_BROWSER_ACTIONS.has(a),true,a);
  const source=load('cloudflare-d1/src/legacy-browser-transport-v1.mjs');
  assert.match(source,/LEGACY_CUSTOMER_SESSION_ACTIONS/);
  const index=load('cloudflare-d1/src/index_v2.js');
  assert.match(index,/handleLegacyBrowserTransport\(request, env\)/);
  const readiness=load('cloudflare-d1/src/customer-portal-native-readiness-v0.mjs');
  const ownership=load('cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs');
  assert.match(readiness,/customerAuthRuntimeReady:\s*false/);
  assert.match(ownership,/customerOrderReadAuthority:\s*false/);
  assert.equal(assessCustomerLegacyCutoverV1(nine).inventoryExact,true);
  for(const change of [nine.slice(1),[...nine,'customerCreateAdmin'],[...nine.slice(1),nine[1]]]){
    const report=assessCustomerLegacyCutoverV1(change);
    assert.equal(report.inventoryExact,false);
    assert.ok(report.blockers.includes('CUSTOMER_ACTION_LIST_DRIFT'));
  }
});

test('phase 1: each action has its own evidence dependency, synthetic claims cannot release customers',()=>{
  const p=assessCustomerLegacyCutoverV1(nine);
  assert.equal(p.actions.length,9);
  assert.equal(p.customerProductionReady,false);
  assert.equal(p.googleDependencyRemoved,false);
  assert.equal(p.actions.find(x=>x.action==='getCustomerOrders').missingControls.includes('VERIFIED_ORDER_OWNERSHIP'),true);
  assert.equal(p.actions.find(x=>x.action==='uploadCustomerDraftFile').missingControls.includes('OBJECT_ACL'),true);
  assert.equal(p.actions.find(x=>x.action==='submitCustomerDraft').missingControls.includes('FINANCE_BOUNDARY'),true);
  const proofs=Object.fromEntries(Object.entries(CUSTOMER_ACTION_CUTOVER_CONTRACT_V1).map(
    ([action,entry])=>[action,{...Object.fromEntries(entry.requires.map(k=>[k,true])),syntheticOnly:true}]));
  const fake=assessCustomerLegacyCutoverV1(nine,proofs);
  assert.equal(fake.sourceReadyForReview,true);
  assert.equal(fake.customerProductionReady,false);
  assert.equal(fake.googleDependencyRemoved,false);
  assert.ok(fake.actions.every(x=>!x.customerRuntimeAuthorized));
});

test('phase 1: real transport code still forwards nine customer actions — fake network only',async()=>{
  const original=globalThis.fetch;
  const seen=[];
  globalThis.fetch=async(url,opts)=>{
    seen.push({url:String(url),action:JSON.parse(opts.body).action});
    return new Response(JSON.stringify({success:true,synthetic:true}),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  try{
    for(const action of nine){
      const result=await handleLegacyBrowserTransport(makeReq(action),{
        ...env,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true'
      });
      assert.equal(result.status,200,action);
    }
    assert.deepEqual(seen.map(x=>x.action),nine);
    assert.ok(seen.every(x=>x.url===env.APPS_SCRIPT_API_URL));
  }finally{globalThis.fetch=original;}
});

test('phase 2: existing BOOK24 preflight is consumed, never treated as a global mutex',()=>{
  const ops=load('cloudflare-d1/src/operator-task-edge-v2.mjs');
  assert.match(ops,/operatorTaskEdgeProxyV2/);
  assert.match(ops,/callAppsScript\(route, request, env, session/);
  const data={
    version:'BOOK24_TASK_WRITER_CUTOVER_PREFLIGHT_V1',
    checkedLanes:['WORK_QUEUE_V1','OPERATOR_TASK_V2'],
    selectedOwner:'D1',
    configurationConsistent:true,
    currentDisposition:'CONFIGURATION_ONLY_REVIEW_REQUIRED',
    activationCertified:false,activationPerformed:false
  };
  const p=assessTaskSingleWriterV1(data);
  assert.equal(p.preflightVersionRecognized,true);
  assert.equal(p.scriptLaneInventoryExact,true);
  assert.equal(p.configurationOnly,true);
  assert.equal(p.singleWriterProductionCertified,false);
  assert.equal(p.mutationsAuthorized,false);
  assert.ok(p.blockers.includes('CROSS_PROJECT_SCRIPTLOCK_NOT_GLOBAL_D1_MUTEX'));
  const forged={...data,activationCertified:true};
  assert.equal(assessTaskSingleWriterV1(forged).configurationOnly,false);
  for(const bad of [null,{...data,checkedLanes:['WORK_QUEUE_V1','UNKNOWN']},
    {...data,checkedLanes:['OPERATOR_TASK_V2','OPERATOR_TASK_V2']},
    {...data,version:'WRONG'}]){
    assert.equal(assessTaskSingleWriterV1(bad).configurationOnly,false);
  }
  const claims=assessTaskSingleWriterV1(data,{
    source:'CLOUDFLARE_GOOGLE_READONLY_VERIFIED',
    bothScriptProjectsInspected:true,d1VersionInspected:true,
    edgeVersionInspected:true,crossStoreFenceProved:true,
    noConcurrentWritersObserved:true
  });
  assert.equal(claims.independentEvidenceClaimComplete,true);
  assert.equal(claims.singleWriterProductionCertified,false);
});

test('phase 3: historical book versions NEVER qualify as current deployed provenance',()=>{
  const expected={
    'trendos-ui':{versionId:'adfb5056-af23-4d7f-8e12-7de6417dfce2',
      deploymentId:'a066abb8-4c33-4050-813b-123df4140450'},
    'trendos-d1-api':{versionId:'ce156662-a698-47fc-b73c-dfd4657be9f5',
      deploymentId:'477ee04d-10ac-4fc3-9ba6-e81691bcd286'}
  };
  const missing=assessCloudflareDeployedParityV1(expected);
  assert.equal(missing.configurationIdsMatch,false);
  assert.equal(missing.productionVerified,false);
  const fakeObserved=Object.fromEntries(Object.entries(expected).map(([k,v])=>[
    k,{...v,readOnlyEvidence:true,ownerAuthorizedInventory:true,bundleCompared:true}
  ]));
  const match=assessCloudflareDeployedParityV1(expected,fakeObserved);
  assert.equal(match.configurationIdsMatch,true);
  assert.equal(match.currentRuntimeProved,false);
  assert.equal(match.productionVerified,false,
    'equal inventory strings can be fabricated and do not prove current deployment');
  fakeObserved['trendos-ui'].versionId='different-version-2026';
  assert.equal(assessCloudflareDeployedParityV1(expected,fakeObserved).configurationIdsMatch,false);
  const wrangler=load('cloudflare-d1/wrangler.toml');
  assert.match(wrangler,/name = "trendos-d1-api"/);
  assert.match(wrangler,/database_name = "trendos-main"/);
  assert.match(wrangler,/TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "true"/);
  assert.match(wrangler,/APPS_SCRIPT_API_URL = "/);
});

test('phase 4: every cutover failure point has a deterministic no-mutation rollback rehearsal',()=>{
  assert.equal(CUTOVER_STEPS_V1.length,10);
  for(const step of CUTOVER_STEPS_V1){
    const before=rehearseFailClosedRollbackV1({injectFailureAt:step});
    assert.equal(before.haltedOn,step);
    assert.equal(before.failureInjected,true);
    assert.equal(before.productionGo,false);
    assert.equal(before.realWrites,0);
    assert.equal(before.networkCalls,0);
    assert.equal(before.deployedChanges,0);
    assert.equal(before.rollbackExecuted,false);
    assert.deepEqual(before.rollbackPlan,['LEAVE_CURRENT_GOOGLE_D1_ROUTING_UNCHANGED']);
    const after=rehearseFailClosedRollbackV1({injectFailureAt:step,claimLiveSwitch:true});
    assert.ok(after.rollbackPlan.includes('STOP_NEW_WRITES_AND_FENCE_DUAL_WRITERS'));
    assert.ok(after.rollbackPlan.includes('VERIFY_D1_LEDGER_WITHOUT_REPLAYING_WRITES'));
    assert.equal(after.rollbackExecuted,false);
  }
  const unknown=rehearseFailClosedRollbackV1({injectFailureAt:'UNKNOWN_GATE'});
  assert.equal(unknown.failureInjected,false);
  assert.equal(unknown.ownerSwitchAuthorized,false);
});

test('four-phase source audit completes the REVIEW, not the production transition',()=>{
  const report=assessZeroGoogleFourPhasesV1();
  assert.equal(report.version,ZERO_GOOGLE_FOUR_PHASE_VERSION);
  assert.deepEqual(report.phases.map(x=>x.phase),[
    'CUSTOMER_ACTIONS','SINGLE_WRITER','DEPLOYED_PARITY','ROLLBACK_DRY_RUN'
  ]);
  assert.equal(report.distinctPhasesCompletedAsOfflineReview,4);
  assert.equal(report.customerActionsDocumented,9);
  assert.equal(report.productionRelease,'NO_GO');
  assert.equal(report.zeroGoogleComplete,false);
  assert.equal(report.cloudflareTouched,false);
  assert.equal(report.googleTouched,false);
  assert.equal(report.financeTouched,false);
  assert.equal(report.singleWriterActivated,false);
  assert.equal(report.decisionsDeferred.length,4);
});
