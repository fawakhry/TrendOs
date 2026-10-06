import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY628_CORE_READONLY_BRIDGE_REDUCTION_MANIFEST.json','utf8'));
const fetchCalls=[];
const legacyCalls=[];

assert.equal(manifest.currentBridgePolicyCount,17);
assert.equal(manifest.targetBridgePolicyCount,13);
assert.equal(manifest.coreNativeReads.length,4);
assert.equal(manifest.remainingBridgePolicies.length,13);
assert.equal(new Set(manifest.remainingBridgePolicies).size,13);

const legacy=async(action,params)=>{
  legacyCalls.push({action,params:{...(params||{})}});
  return {success:true,source:'legacy',action};
};
legacy.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء'],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:13,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:manifest.remainingBridgePolicies,
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'OFF',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:legacy
};

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    fetchCalls.push({url:String(url),options});
    return new Response(JSON.stringify({success:true,authority:'d1-employee-core-v1'}),{
      status:200,headers:{'content-type':'application/json'}
    });
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeCoreMode(),'OFF');
let out=await windowObject.trendosEmployeeApiV1('getDashboard',{username:'ضياء',token:'native-token',screen:'service'});
assert.equal(out.source,'legacy');
assert.equal(fetchCalls.length,0);

windowObject.MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE='READONLY';
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeCoreMode(),'READONLY');

for(const action of manifest.coreNativeReads){
  const before=fetchCalls.length;
  const body={username:'ضياء',token:'native-token',screen:'service',limit:10};
  const r=await windowObject.trendosEmployeeApiV1(action,body);
  assert.equal(r.authority,'d1-employee-core-v1');
  assert.equal(fetchCalls.length,before+1);
  const call=fetchCalls.at(-1);
  assert.equal(call.url,'https://trendos-d1-api.example.test/v1/employee/core');
  assert.equal(call.options.headers.authorization,'Bearer native-token');
  const sent=JSON.parse(call.options.body);
  assert.equal(sent.action,action);
  assert.equal(sent.username,'ضياء');
  assert.equal(Object.prototype.hasOwnProperty.call(sent,'token'),false);
}

const beforeKnowledge=fetchCalls.length;
out=await windowObject.trendosEmployeeApiV1('getKnowledge',{username:'ضياء',token:'native-token'});
assert.equal(out.success,true);
assert.equal(fetchCalls.length,beforeKnowledge+1);
assert.equal(fetchCalls.at(-1).url,'https://trendos-d1-api.example.test/v1/employee/legacy-action');
assert.equal(JSON.parse(fetchCalls.at(-1).options.body).action,'getKnowledge');

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('bulkUpdateDepartmentStatusV1926',{
    username:'ضياء',token:'native-token',screen:'service',fromStatus:'طلب جديد',toStatus:'بدأ التنفيذ'
  }),
  err=>err&&err.code==='EMPLOYEE_LEGACY_POLICY_DENIED'
);

const beforeUnknown=fetchCalls.length;
out=await windowObject.trendosEmployeeApiV1('getDashboard',{username:'unknown-user',token:'legacy-token',screen:'service'});
assert.equal(out.source,'legacy');
assert.equal(fetchCalls.length,beforeUnknown);

const config=fs.readFileSync('config.js','utf8');
assert.match(config,/MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE = 'OFF'/);
assert.match(source,/var CORE_PATH = '\/v1\/employee\/core'/);
assert.match(source,/var CORE_READ_ACTIONS = new Set/);
assert.match(source,/shouldRouteCoreNative/);
assert.match(source,/employeeCoreNative/);

console.log('ENTRY628_CORE_READONLY_DISPATCH=PASS');
console.log('ENTRY628_CORE_NATIVE_READ_COUNT=4');
console.log('ENTRY628_TARGET_BRIDGE_POLICY_COUNT=13');
console.log('ENTRY628_CORE_WRITES_ENABLED=NO');
console.log('ENTRY628_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY628_PRODUCTION_MUTATION=NO');
