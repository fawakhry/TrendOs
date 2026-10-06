import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dispatcherSource=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const m=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY627_EMPLOYEE_NATIVE_ALIAS_CANARY_MANIFEST.json','utf8'));

assert.equal(m.globalNativeAuth,false);
assert.equal(m.bridgePolicyCount,17);
assert.equal(m.authMode,'TRANSITIONAL');
assert.equal(m.opsMode,'GENERAL');
assert.equal(m.accountingMode,'READONLY');

const legacy=async(action,params)=>({success:true,source:'legacy',action,username:params&&params.username});
legacy.__trendosEdgeOrdersReadV1=true;

const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:m.targetCanaryUsers,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:17,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:true,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  trendosSecureApiV1922:legacy
};

const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,Response,
  fetch:async(url,options={})=>{
    const u=String(url);
    if(u.endsWith('/v1/employee/auth/health')) return new Response(JSON.stringify({
      success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
      legacyBootstrapEnabled:true,legacySessionEnrollEnabled:false,nativeOnly:false,
      nativeReadyCount:2,plaintextStored:false
    }),{status:200,headers:{'content-type':'application/json'}});
    if(u.endsWith('/v1/employee/legacy-action/health')) return new Response(JSON.stringify({
      success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,allowedPolicyCount:17,
      rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
      assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
    }),{status:200,headers:{'content-type':'application/json'}});
    if(u.endsWith('/v1/employee/auth/login')){
      const body=JSON.parse(options.body||'{}');
      const username=String(body.username||'');
      return new Response(JSON.stringify({
        success:true,authSource:'d1-native-bootstrap-v1',
        user:{username,name:username,role:'employee',department:'',token:'native-token'}
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response(JSON.stringify({success:true,source:'bridge'}),{status:200,headers:{'content-type':'application/json'}});
  }
};

vm.runInNewContext(dispatcherSource,sandbox,{filename:'employee-api-dispatcher-v1.js'});

for(const username of ['diaa','wael','gaber','jaber','rahma','revan','rivan']){
  const out=await windowObject.trendosEmployeeApiV1('login',{username,password:'x'});
  assert.equal(out.authSource,'d1-native-bootstrap-v1');
}
const unknown=await windowObject.trendosEmployeeApiV1('login',{username:'unknown-user',password:'x'});
assert.equal(unknown.source,'legacy');

console.log('ENTRY627_ALIAS_CANARY_CONTRACT=PASS');
console.log('ENTRY627_REVEN_ALIASES_NATIVE=PASS');
console.log('ENTRY627_UNKNOWN_EMPLOYEE_LEGACY=PASS');
