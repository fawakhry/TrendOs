import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY644_CORE_GENERAL_CUTOVER_MANIFEST.json','utf8'));
const fetchCalls=[];
const downstreamCalls=[];

const downstream=async(action,params)=>{
  downstreamCalls.push({action,params:{...(params||{})}});
  return {success:true,source:'downstream',action};
};
downstream.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:[],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:0,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT:6,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:downstream
};

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const u=String(url);
    fetchCalls.push({url:u,options});
    if(u.endsWith('/v1/employee/core')){
      return new Response(JSON.stringify({success:true,authority:'d1-employee-core-v1'}),{
        status:200,headers:{'content-type':'application/json'}
      });
    }
    return new Response(JSON.stringify({success:true}),{
      status:200,headers:{'content-type':'application/json'}
    });
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

const api=windowObject.TrendOSEmployeeApiDispatcherV1;
assert.equal(api.employeeCoreMode(),'READONLY');
for(const action of manifest.coreNativeReads) assert.equal(api.shouldRouteCoreNative(action,{username:'ضياء'}),true);
for(const action of manifest.coreNativeWrites) assert.equal(api.shouldRouteCoreNative(action,{username:'ضياء'}),false);

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('bulkUpdateDepartmentStatusV1926',{
    username:'ضياء',token:'native-token',screen:'service',
    fromStatus:'طلب جديد',toStatus:'بدأ التنفيذ',requestId:'entry644-readonly-probe'
  }),
  err=>err&&err.code==='EMPLOYEE_LEGACY_BRIDGE_DISABLED'
);
console.log('ENTRY644_READONLY_WRITES_STILL_FAIL_CLOSED=PASS');

windowObject.MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE='GENERAL';
assert.equal(api.employeeCoreMode(),'GENERAL');

for(const action of [...manifest.coreNativeReads,...manifest.coreNativeWrites]){
  assert.equal(api.shouldRouteCoreNative(action,{username:'ضياء'}),true);
  const before=fetchCalls.length;
  const out=await windowObject.trendosEmployeeApiV1(action,{
    username:'diaa',
    token:'native-token',
    password:'must-not-forward',
    screen:'service',
    fromStatus:'طلب جديد',
    toStatus:'بدأ التنفيذ',
    requestId:'entry644-'+action,
    lineId:'entry644-line'
  });
  assert.equal(out.authority,'d1-employee-core-v1');
  assert.equal(fetchCalls.length,before+1);
  const call=fetchCalls.at(-1);
  assert.equal(call.url,'https://trendos-d1-api.example.test/v1/employee/core');
  assert.equal(call.options.headers.authorization,'Bearer native-token');
  const sent=JSON.parse(call.options.body);
  assert.equal(sent.action,action);
  assert.equal(sent.username,'ضياء');
  assert.equal(Object.prototype.hasOwnProperty.call(sent,'token'),false);
  assert.equal(Object.prototype.hasOwnProperty.call(sent,'password'),false);
}
console.log('ENTRY644_CORE_GENERAL_8_OF_8_ROUTE=PASS');

const beforeEdge=downstreamCalls.length;
const edgeOut=await windowObject.trendosEmployeeApiV1('searchCustomers',{username:'ضياء',token:'native-token',query:'x'});
assert.equal(edgeOut.source,'downstream');
assert.equal(downstreamCalls.length,beforeEdge+1);
console.log('ENTRY644_NON_CORE_EDGE_ROUTE_PRESERVED=PASS');

windowObject.MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE='OFF';
assert.equal(api.employeeCoreMode(),'OFF');
assert.equal(api.shouldRouteCoreNative('getDashboard',{username:'ضياء'}),false);

assert.match(source,/var CORE_WRITE_ACTIONS = new Set/);
assert.match(source,/var CORE_ACTIONS = new Set/);
assert.match(source,/mode === 'READONLY' \|\| mode === 'GENERAL'/);

console.log('ENTRY644_CORE_GENERAL_DISPATCH_REPO_GATE=PASS');
console.log('ENTRY644_CORE_NATIVE_READS=4');
console.log('ENTRY644_CORE_NATIVE_WRITES=4');
console.log('ENTRY644_PRODUCTION_MUTATION=NO');
