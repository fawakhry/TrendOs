import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');

function harness({bridge=false,nativeOnly=true,ready=5,bootstrap=false}={}){
  const calls=[];
  const legacyCalls=[];
  const legacy=async(action,params)=>{legacyCalls.push({action,params});return{success:true,source:'legacy'};};
  legacy.__trendosEdgeOrdersReadV1=true;

  const policies=bridge?Array.from({length:17},(_,i)=>'p'+i):[];
  const windowObject={
    MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء','diaa','وائل','wael','جابر','gaber','jaber','رحمه','رحمة','rahma','ريفان','ريڤان','revan','rivan'],
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES:bridge?17:0,
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT:5,
    MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:bridge,
    MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:policies,
    MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE:'GENERAL',
    MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE:'READONLY',
    MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE:'READONLY',
    MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',
    MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE:'READONLY',
    MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
    MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
    trendosSecureApiV1922:legacy
  };

  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
  const sandbox={
    window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
    setTimeout,clearTimeout,setInterval,clearInterval,Response,
    fetch:async(url,options={})=>{
      const u=String(url);
      let body=null;try{body=options.body?JSON.parse(options.body):null}catch{}
      calls.push({url:u,body});
      if(u.endsWith('/v1/employee/auth/health')) return json({
        success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
        legacyBootstrapEnabled:bootstrap,legacySessionEnrollEnabled:false,nativeOnly,
        userCount:ready,nativeReadyCount:ready,plaintextStored:false
      });
      if(u.endsWith('/v1/employee/legacy-action/health')) return json({
        success:true,enabled:true,upstreamConfigured:true,secretConfigured:true,allowedPolicyCount:17,
        rawNativeTokenForwarded:false,plaintextPasswordForwarded:false,
        assertionBoundToAction:true,assertionBoundToPayload:true,replayNonceIssued:true
      });
      if(u.endsWith('/v1/employee/auth/login')) return json({
        success:true,authSource:'d1-native-employee-v1',
        user:{username:body.username,name:body.username,token:'native-token'}
      });
      throw new Error('unexpected fetch '+u);
    }
  };
  vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});
  return {windowObject,calls,legacyCalls};
}

{
  const h=harness({bridge:false,nativeOnly:true,ready:5,bootstrap:false});
  const out=await h.windowObject.trendosEmployeeApiV1('login',{username:'rivan',password:'x'});
  assert.equal(out.authSource,'d1-native-employee-v1');
  const login=h.calls.find(x=>x.url.endsWith('/v1/employee/auth/login'));
  assert.ok(login);
  assert.equal(login.body.username,'ريفان');
  assert.equal(h.calls.filter(x=>x.url.endsWith('/v1/employee/auth/health')).length,1);
  assert.equal(h.calls.filter(x=>x.url.endsWith('/v1/employee/legacy-action/health')).length,0);
}

{
  const h=harness({bridge:true,nativeOnly:true,ready:5,bootstrap:false});
  await assert.rejects(
    ()=>h.windowObject.trendosEmployeeApiV1('login',{username:'ضياء',password:'x'}),
    err=>err&&err.code==='EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED'&&err.detail==='native-only-with-bridge'
  );
  assert.equal(h.calls.filter(x=>x.url.endsWith('/v1/employee/auth/login')).length,0);
}

{
  const h=harness({bridge:false,nativeOnly:true,ready:4,bootstrap:false});
  await assert.rejects(
    ()=>h.windowObject.trendosEmployeeApiV1('login',{username:'ضياء',password:'x'}),
    err=>err&&err.code==='EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED'&&err.detail==='native-ready-count'
  );
}

{
  const h=harness({bridge:false,nativeOnly:true,ready:5,bootstrap:false});
  const before=h.calls.length;
  const out=await h.windowObject.trendosEmployeeApiV1('login',{username:'unknown-employee',password:'x'});
  assert.equal(out.source,'legacy');
  assert.equal(h.calls.length,before);
}

assert.match(source,/native-only-with-bridge/);
assert.match(source,/T12_ENTRY635_NATIVE_ONLY_BRIDGE_FREE_PREFLIGHT_V1_20261006/);

console.log('ENTRY635_BRIDGE_FREE_NATIVE_ONLY_PREFLIGHT=PASS');
console.log('ENTRY635_BRIDGE_PRESENT_NATIVE_ONLY_FAIL_CLOSED=PASS');
console.log('ENTRY635_READY_4_OF_5_FAIL_CLOSED=PASS');
console.log('ENTRY635_ALIAS_CANONICALIZATION_PRESERVED=PASS');
console.log('ENTRY635_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY635_PRODUCTION_MUTATION=NO');
