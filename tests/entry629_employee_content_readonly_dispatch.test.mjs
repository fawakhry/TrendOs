import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY629_CONTENT_READONLY_BRIDGE_REDUCTION_MANIFEST.json','utf8'));
const fetchCalls=[];
const legacyCalls=[];

assert.equal(manifest.currentFrontendBridgePolicyCount,13);
assert.equal(manifest.targetFrontendBridgePolicyCount,4);
assert.equal(manifest.contentNativeReads.length,9);
assert.equal(manifest.remainingBridgePolicies.length,4);

const legacy=async(action,params)=>{
  legacyCalls.push({action,params:{...(params||{})}});
  return {success:true,source:'legacy',action};
};
legacy.__trendosEdgeOrdersReadV1=true;

const initialPolicies=[...manifest.contentNativeReads,...manifest.remainingBridgePolicies];
const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء'],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:13,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:initialPolicies,
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'OFF',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:legacy
};

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const u=String(url); fetchCalls.push({url:u,options});
    if(u.endsWith('/v1/employee/auth/health')){
      return new Response(JSON.stringify({
        success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
        nativeOnly:false,plaintextStored:false,legacyBootstrapEnabled:true,nativeReadyCount:5
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/legacy-action/health')){
      return new Response(JSON.stringify({
        success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,
        allowedPolicyCount:windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES.length,
        rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
        assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/legacy-action')){
      return new Response(JSON.stringify({success:true,source:'bridge'}),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/content')){
      return new Response(JSON.stringify({success:true,authority:'d1-employee-content-v1'}),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/core')){
      return new Response(JSON.stringify({success:true,version:'ENTRY614_D1_EMPLOYEE_CORE_V1'}),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}});
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeContentMode(),'OFF');
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.policyAllowed('getKnowledge',{}),true);
let out=await windowObject.trendosEmployeeApiV1('getKnowledge',{username:'ضياء',token:'native-token'});
assert.equal(out.source,'bridge');

windowObject.MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE='READONLY';
windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES=4;
windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=manifest.remainingBridgePolicies;
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeContentMode(),'READONLY');

for(const action of manifest.contentNativeReads){
  const before=fetchCalls.length;
  const r=await windowObject.trendosEmployeeApiV1(action,{username:'ضياء',token:'native-token'});
  assert.equal(r.authority,'d1-employee-content-v1');
  assert.equal(fetchCalls.length,before+1);
  const call=fetchCalls.at(-1);
  assert.equal(call.url,'https://trendos-d1-api.example.test/v1/employee/content');
  assert.equal(call.options.headers.authorization,'Bearer native-token');
  const sent=JSON.parse(call.options.body);
  assert.equal(sent.action,action);
  assert.equal(sent.username,'ضياء');
  assert.equal(Object.prototype.hasOwnProperty.call(sent,'token'),false);
}

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('saveKnowledge',{username:'ضياء',token:'native-token',title:'x',content:'y'}),
  err=>err&&err.code==='EMPLOYEE_LEGACY_POLICY_DENIED'
);

const beforeComms=fetchCalls.length;
out=await windowObject.trendosEmployeeApiV1('getOrderConversation',{username:'ضياء',token:'native-token',orderId:'TEST'});
assert.equal(out.success,true);
// saveKnowledge immediately above already revalidated the new 4-policy canary key;
// the remaining comms action therefore uses the fresh preflight cache and only
// performs the actual bridge request.
assert.equal(fetchCalls.length,beforeComms+1);
assert.equal(fetchCalls.at(-1).url,'https://trendos-d1-api.example.test/v1/employee/legacy-action');

const beforeUnknown=fetchCalls.length;
out=await windowObject.trendosEmployeeApiV1('getKnowledge',{username:'unknown-user',token:'legacy-token'});
assert.equal(out.source,'legacy');
assert.equal(fetchCalls.length,beforeUnknown);

const config=fs.readFileSync('config.js','utf8');
assert.match(config,/MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE = 'OFF'/);
assert.match(source,/var CONTENT_PATH = '\/v1\/employee\/content'/);
assert.match(source,/var CONTENT_READ_ACTIONS = new Set/);
assert.match(source,/shouldRouteContentNative/);
assert.match(source,/employeeContentNative/);

console.log('ENTRY629_CONTENT_READONLY_DISPATCH=PASS');
console.log('ENTRY629_CONTENT_NATIVE_READ_COUNT=9');
console.log('ENTRY629_TARGET_FRONTEND_BRIDGE_POLICY_COUNT=4');
console.log('ENTRY629_CONTENT_WRITES_ENABLED=NO');
console.log('ENTRY629_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY629_PRODUCTION_MUTATION=NO');
