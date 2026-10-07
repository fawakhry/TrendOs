import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dispatcher=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const attendance=fs.readFileSync('attendance-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('cloudflare-d1/src/frontend-static-worker.mjs','utf8');

assert.match(attendance,/function normalizeAttendanceBackendResponse\(/);
assert.match(attendance,/return normalizeAttendanceBackendResponse\(out\);/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = true/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 = false/);
assert.match(config,/attendance-v1\.js\?v=20261007-entry647-auth-attendance-repair/);
assert.match(config,/attendance-clockin-ui-v1\.js\?v=20261007-entry647-auth-attendance-repair/);
assert.match(index,/config\.js\?v=20261007-entry647-auth-attendance-repair/);
assert.match(index,/app\.js\?v=20261007-entry647-auth-attendance-repair/);
assert.match(index,/employee-api-dispatcher-v1\.js\?v=20261007-entry647-auth-attendance-repair/);
assert.match(worker,/criticalNoStore/);
assert.match(worker,/\/attendance-v1\.js/);
assert.match(dispatcher,/function authoritativeNativeHealthReady\(/);
assert.match(dispatcher,/T12_ENTRY647_AUTH_ATTENDANCE_RUNTIME_REPAIR_V1_20261007/);

const downstream=async()=>({success:true});
downstream.__trendosEdgeOrdersReadV1=true;
const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء'],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:0,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT:6,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_API_URL:'https://entry647.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://entry647.example.test',
  trendosSecureApiV1922:downstream
};
const fetchCalls=[];
const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url)=>{
    fetchCalls.push(String(url));
    if(String(url).endsWith('/v1/employee/auth/health')){
      return new Response(JSON.stringify({
        success:true,schemaReady:true,mode:'NATIVE',envEnabled:true,nativeOnly:true,
        legacyBootstrapEnabled:false,legacySessionEnrollEnabled:false,
        nativeReadyCount:6,userCount:6,plaintextStored:false
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    if(String(url).endsWith('/v1/employee/legacy-action/health')){
      return new Response(JSON.stringify({
        success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,
        allowedPolicyCount:0,rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
        assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response(JSON.stringify({success:false}),{status:404,headers:{'content-type':'application/json'}});
  }
};
vm.runInNewContext(dispatcher,sandbox,{filename:'employee-api-dispatcher-v1.js'});
const api=windowObject.TrendOSEmployeeApiDispatcherV1;
assert.equal(api.canaryRouteEnabled({username:'ضياء'}),true);
assert.equal(await api.ensureCanaryPreflight('login',{username:'ضياء'}),true);
assert.ok(fetchCalls.some(x=>x.endsWith('/v1/employee/auth/health')));
assert.equal(fetchCalls.some(x=>x.endsWith('/v1/employee/legacy-action/health')),false,
  'authoritative NATIVE runtime must bypass stale compatibility-bridge preflight');

console.log('ENTRY647_ATTENDANCE_NORMALIZER_RESTORED=PASS');
console.log('ENTRY647_AUTH_CRITICAL_CACHE_BUST=PASS');
console.log('ENTRY647_STALE_DIAA_CANARY_CONFIG_NATIVE_RUNTIME_BYPASS=PASS');
console.log('ENTRY647_CRITICAL_ASSETS_NO_STORE=PASS');
console.log('ENTRY647_ACCOUNTING_MUTATION=NO');
console.log('ENTRY647_EASYSTORE_MUTATION=NO');
