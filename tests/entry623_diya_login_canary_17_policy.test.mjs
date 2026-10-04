import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dispatcherSource=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const repoConfig=fs.readFileSync('config.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY623_DIYA_LOGIN_CANARY_17_POLICY_MANIFEST.json','utf8'));

assert.equal(manifest.canaryUsername,'ضياء');
assert.equal(manifest.bridgePolicyCount,17);
assert.equal(manifest.policies.length,17);
assert.equal(new Set(manifest.policies).size,17);
assert.equal(manifest.accountingMode,'READONLY');
assert.equal(manifest.opsMode,'GENERAL');
assert.equal(manifest.globalNativeAuth,false);

const forbidden=new Set([
  'getAccounting','getDeptInvoiceDraftV1887','getPartyAccountV1858',
  'approveAccountingDeptInvoice','saveAccountingDeptLine','saveAccountingFinalInvoice',
  'saveAccountingMaterial','saveAccountingTemplate','savePartyLedgerTransaction',
  'attendanceV1:state','attendanceV1:start','attendanceV1:pause','attendanceV1:resume',
  'attendanceV1:restStart','attendanceV1:prayerStart','attendanceV1:confirm',
  'attendanceV1:missedCheck','attendanceV1:end','attendanceClockinV1:clockin',
  'cleaningV1:complete','hrV1:myRequests','hrV1:requests','hrV1:submitRequest',
  'pressControlV1:status','pressControlV1:start','pressControlV1:stop'
]);
for(const p of manifest.policies) assert.equal(forbidden.has(p),false,'forbidden bridge policy '+p);

assert.match(repoConfig,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1\s*=\s*false/);
assert.match(repoConfig,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1\s*=\s*false/);
assert.match(repoConfig,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1\s*=\s*false/);
assert.match(dispatcherSource,/function canaryMinimumBridgePolicies\(\)/);
assert.match(dispatcherSource,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES/);

const fetchCalls=[];
const legacyCalls=[];
const baseLegacy=async (action,params)=>{legacyCalls.push({action,params:{...(params||{})}});return{success:true,source:'legacy',action};};
baseLegacy.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء'],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:17,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:manifest.policies,
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:baseLegacy
};

function jsonResponse(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const call={url:String(url),options};fetchCalls.push(call);
    if(call.url.endsWith('/v1/employee/auth/health')) return jsonResponse({
      success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
      legacyBootstrapEnabled:true,legacySessionEnrollEnabled:false,nativeOnly:false,
      nativeReadyCount:0,plaintextStored:false
    });
    if(call.url.endsWith('/v1/employee/legacy-action/health')) return jsonResponse({
      success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,allowedPolicyCount:17,
      rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
      assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
    });
    if(call.url.endsWith('/v1/employee/auth/login')) return jsonResponse({
      success:true,authSource:'d1-native-bootstrap-v1',
      user:{username:'ضياء',name:'ضياء',role:'admin',department:'',token:'native-token'}
    });
    if(call.url.endsWith('/v1/employee/legacy-action')) return jsonResponse({success:true,source:'bridge'});
    if(call.url.endsWith('/v1/employee/ops')) return jsonResponse({success:true,source:'d1-ops'});
    if(call.url.endsWith('/v1/employee/accounting')) return jsonResponse({success:true,source:'d1-accounting'});
    return jsonResponse({success:false,code:'unexpected-route'},500);
  }
};

vm.runInNewContext(dispatcherSource,sandbox,{filename:'employee-api-dispatcher-v1.js'});

let out=await windowObject.trendosEmployeeApiV1('login',{username:'ضياء',password:'only-to-native-login'});
assert.equal(out.authSource,'d1-native-bootstrap-v1');
assert.ok(fetchCalls.some(x=>x.url.endsWith('/v1/employee/auth/login')));
assert.equal(legacyCalls.length,0);

out=await windowObject.trendosEmployeeApiV1('getDashboard',{username:'ضياء',token:'native-token'});
assert.equal(out.source,'bridge');

out=await windowObject.trendosEmployeeApiV1('attendanceV1',{op:'start',username:'ضياء',token:'native-token'});
assert.equal(out.source,'d1-ops');

out=await windowObject.trendosEmployeeApiV1('getAccounting',{username:'ضياء',token:'native-token'});
assert.equal(out.source,'d1-accounting');

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('saveKnowledge',{username:'ضياء',token:'native-token',title:'x'}),
  err=>err&&err.code==='EMPLOYEE_LEGACY_POLICY_DENIED'
);

out=await windowObject.trendosEmployeeApiV1('login',{username:'جابر',password:'legacy'});
assert.equal(out.source,'legacy');

console.log('ENTRY623_17_POLICY_CANARY_CONTRACT=PASS');
console.log('ENTRY623_CANARY_USER=ضياء');
console.log('ENTRY623_NON_CANARY_LEGACY_PRESERVED=YES');
console.log('ENTRY623_DASHBOARD_READ_BRIDGE=PASS');
console.log('ENTRY623_OPS_GENERAL_NATIVE=PASS');
console.log('ENTRY623_ACCOUNTING_READ_NATIVE=PASS');
console.log('ENTRY623_UNLISTED_LEGACY_ACTION_FAIL_CLOSED=PASS');
console.log('ENTRY623_ACCOUNTING_BRIDGE_POLICIES=0');
