import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY630_COMMS_READONLY_BRIDGE_ZERO_READY_MANIFEST.json','utf8'));
const fetchCalls=[];

assert.equal(manifest.currentFrontendBridgePolicyCount,4);
assert.equal(manifest.commsNativeReadPolicies.length,4);
assert.equal(manifest.businessBridgeActionsAfterCutover,0);

const legacy=async(action,params)=>({success:true,source:'legacy',action,op:params&&params.op});
legacy.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء'],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:4,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[...manifest.commsNativeReadPolicies],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE:'OFF',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:legacy
};

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const u=String(url);fetchCalls.push({url:u,options});
    if(u.endsWith('/v1/employee/auth/health')){
      return new Response(JSON.stringify({
        success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
        nativeOnly:false,plaintextStored:false,legacyBootstrapEnabled:true,nativeReadyCount:5
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/legacy-action/health')){
      return new Response(JSON.stringify({
        success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,allowedPolicyCount:4,
        rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
        assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/legacy-action')){
      return new Response(JSON.stringify({success:true,source:'bridge'}),{status:200,headers:{'content-type':'application/json'}});
    }
    if(u.endsWith('/v1/employee/comms')){
      return new Response(JSON.stringify({success:true,authority:'d1-employee-comms-v1'}),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}});
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeCommsMode(),'OFF');
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.policyAllowed('customerManagerV1',{op:'inbox'}),true);
let out=await windowObject.trendosEmployeeApiV1('customerManagerV1',{username:'ضياء',token:'native-token',op:'inbox'});
assert.equal(out.source,'bridge');

windowObject.MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE='READONLY';
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeCommsMode(),'READONLY');

const cases=[
  ['customerManagerV1',{op:'inbox'}],
  ['customerManagerV1',{op:'thread',phone:'01000000000'}],
  ['getOrderConversation',{orderId:'TEST'}],
  ['goLiveAutopilotV1',{op:'listDrafts'}]
];
for(const [action,extra] of cases){
  const before=fetchCalls.length;
  const r=await windowObject.trendosEmployeeApiV1(action,{username:'ضياء',token:'native-token',...extra});
  assert.equal(r.authority,'d1-employee-comms-v1');
  assert.equal(fetchCalls.length,before+1);
  const call=fetchCalls.at(-1);
  assert.equal(call.url,'https://trendos-d1-api.example.test/v1/employee/comms');
  const sent=JSON.parse(call.options.body);
  assert.equal(sent.action,action);
  assert.equal(sent.username,'ضياء');
  assert.equal(Object.prototype.hasOwnProperty.call(sent,'token'),false);
}

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('customerManagerV1',{username:'ضياء',token:'native-token',op:'send',phone:'01000000000',text:'x'}),
  err=>err&&err.code==='EMPLOYEE_LEGACY_POLICY_DENIED'
);
await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('goLiveAutopilotV1',{username:'ضياء',token:'native-token',op:'prepareReadyInvoice',orderId:'TEST'}),
  err=>err&&err.code==='EMPLOYEE_LEGACY_POLICY_DENIED'
);

const beforeUnknown=fetchCalls.length;
out=await windowObject.trendosEmployeeApiV1('getOrderConversation',{username:'unknown-user',token:'legacy-token',orderId:'TEST'});
assert.equal(out.source,'legacy');
assert.equal(fetchCalls.length,beforeUnknown);

const config=fs.readFileSync('config.js','utf8');
assert.match(config,/MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE = 'OFF'/);
assert.match(source,/var COMMS_PATH = '\/v1\/employee\/comms'/);
assert.match(source,/var COMMS_READ_KEYS = new Set/);
assert.match(source,/shouldRouteCommsNative/);
assert.match(source,/employeeCommsNative/);

console.log('ENTRY630_COMMS_READONLY_DISPATCH=PASS');
console.log('ENTRY630_COMMS_NATIVE_READ_POLICY_COUNT=4');
console.log('ENTRY630_BUSINESS_BRIDGE_ACTIONS_AFTER_CUTOVER=0');
console.log('ENTRY630_COMMS_WRITES_ENABLED=NO');
console.log('ENTRY630_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY630_PRODUCTION_MUTATION=NO');
