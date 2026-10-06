import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY633_NATIVE_USERNAME_CANONICALIZATION_MANIFEST.json','utf8'));
const fetchCalls=[];
const legacyCalls=[];

const legacy=async(action,params)=>{
  legacyCalls.push({action,params:{...(params||{})}});
  return {success:true,source:'legacy',action,username:params&&params.username};
};
legacy.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:Object.keys(manifest.aliasMap),
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:0,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT:5,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:legacy
};

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const u=String(url);
    const body=options.body?JSON.parse(options.body):null;
    fetchCalls.push({url:u,body,headers:options.headers||{}});
    if(u.endsWith('/v1/employee/auth/health')) return json({
      success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
      legacyBootstrapEnabled:true,legacySessionEnrollEnabled:false,nativeOnly:false,
      userCount:5,nativeReadyCount:5,plaintextStored:false
    });
    if(u.endsWith('/v1/employee/auth/login')){
      return json({success:true,authSource:'d1-native-employee-v1',user:{username:body.username,name:body.username,token:'native-token'}});
    }
    if(u.endsWith('/v1/employee/core')) return json({success:true,version:'ENTRY614_D1_EMPLOYEE_CORE_V1',rows:[],dashboard:{}});
    if(u.endsWith('/v1/employee/ops')) return json({success:true,authority:'d1-employee-ops-v1'});
    if(u.endsWith('/v1/employee/accounting')) return json({success:true,authority:'d1-employee-accounting-v1'});
    if(u.endsWith('/v1/employee/content')) return json({success:true,authority:'d1-employee-content-v1'});
    if(u.endsWith('/v1/employee/comms')) return json({success:true,authority:'d1-employee-comms-v1'});
    throw new Error('unexpected fetch '+u);
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

for(const [alias,canonical] of Object.entries(manifest.aliasMap)){
  assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.nativeCanonicalUsername(alias),canonical);
  const before=fetchCalls.length;
  const out=await windowObject.trendosEmployeeApiV1('login',{username:alias,password:'x'});
  assert.equal(out.authSource,'d1-native-employee-v1');
  const login=fetchCalls.slice(before).find(x=>x.url.endsWith('/v1/employee/auth/login'));
  assert.ok(login,'login fetch missing for '+alias);
  assert.equal(login.body.username,canonical,'login canonical mismatch for '+alias);
}

for(const [alias,canonical] of [
  ['revan','ريفان'],
  ['rahma','رحمه'],
  ['jaber','جابر'],
  ['wael','وائل'],
  ['diaa','ضياء']
]){
  const before=fetchCalls.length;
  await windowObject.trendosEmployeeApiV1('getDashboard',{username:alias,token:'native-token'});
  const core=fetchCalls.slice(before).find(x=>x.url.endsWith('/v1/employee/core'));
  assert.ok(core,'core fetch missing');
  assert.equal(core.body.username,canonical,'core canonical mismatch');
}

const beforeUnknown=fetchCalls.length;
const unknown=await windowObject.trendosEmployeeApiV1('login',{username:'unknown-employee',password:'legacy'});
assert.equal(unknown.source,'legacy');
assert.equal(fetchCalls.length,beforeUnknown);
assert.equal(legacyCalls.at(-1).params.username,'unknown-employee');

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.nativeCanonicalUsername('NotKnown'),'NotKnown');
assert.match(source,/NATIVE_USERNAME_CANONICAL/);
assert.match(source,/canonicalizeNativeParams/);

console.log('ENTRY633_NATIVE_ALIAS_CANONICALIZATION=PASS');
console.log('ENTRY633_ALIAS_COUNT='+Object.keys(manifest.aliasMap).length);
console.log('ENTRY633_NATIVE_ROUTE_CANONICALIZATION=PASS');
console.log('ENTRY633_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY633_PRODUCTION_MUTATION=NO');
