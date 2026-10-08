import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dispatcher=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const backend=fs.readFileSync('cloudflare-d1/src/employee-core-native-v1.mjs','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.match(backend,/READ_ACTIONS=new Set\(\['getRows','getRowsPageV1931','getDashboard'/);
assert.match(backend,/action==='getRows'\|\|action==='getRowsPageV1931'/);
assert.match(backend,/serverPaged:false/);
assert.match(backend,/dataSource:'employee-core-d1'/);
assert.match(index,/employee-api-dispatcher-v1\.js\?v=20261008-entry650-core-order-page-read/);

const calls=[];
const downstream=async(action,params)=>({success:true,source:'edge',action,params});
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
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'GENERAL',
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
    calls.push({url:String(url),options});
    if(String(url).endsWith('/v1/employee/core')){
      return new Response(JSON.stringify({
        success:true,rows:[{orderId:'6501'}],serverPaged:false,dataSource:'employee-core-d1'
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}});
  }
};
vm.runInNewContext(dispatcher,sandbox,{filename:'employee-api-dispatcher-v1.js'});

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.shouldRouteCoreNative(
  'getRowsPageV1931',{username:'ضياء',token:'tok'}
),true);

const out=await windowObject.trendosEmployeeApiV1('getRowsPageV1931',{
  username:'ضياء',token:'native-token',screen:'print',page:1,pageSize:5,statusFilter:'__ACTIVE__'
});
assert.equal(out.success,true);
assert.equal(out.dataSource,'employee-core-d1');
assert.equal(out.serverPaged,false);
assert.equal(calls.length,1);
assert.equal(calls[0].url,'https://trendos-d1-api.example.test/v1/employee/core');
assert.equal(calls[0].options.headers.authorization,'Bearer native-token');
const sent=JSON.parse(calls[0].options.body);
assert.equal(sent.action,'getRows');
assert.equal(sent.screen,'print');
assert.equal(Object.prototype.hasOwnProperty.call(sent,'token'),false);

console.log('ENTRY650_EMPLOYEE_CORE_ORDER_PAGE_READ=PASS');
console.log('ENTRY650_STALE_MIRROR_DEPENDENCY=REMOVED_FROM_ORDER_PAGE_READ');
