import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY631_BRIDGE_FREE_CANARY_AUTH_PREFLIGHT_MANIFEST.json','utf8'));

assert.equal(manifest.globalNativeAuth,false);
assert.equal(manifest.canaryRequiredNativeReadyCount,5);
assert.equal(manifest.frontendBridgeEnabled,false);
assert.equal(manifest.frontendBridgePolicyCount,0);
assert.equal(manifest.canaryMinimumBridgePolicies,0);

function makeHarness(nativeReadyCount=5){
  const fetchCalls=[];
  const legacyCalls=[];
  const legacy=async(action,params)=>{
    legacyCalls.push({action,params:{...(params||{})}});
    return {success:true,source:'legacy',action};
  };
  legacy.__trendosEdgeOrdersReadV1=true;

  const windowObject={
    MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:false,
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:true,
    MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS:['ضياء','diaa','وائل','wael','جابر','gaber','jaber','رحمه','رحمة','rahma','ريفان','ريڤان','revan','rivan'],
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

  const sandbox={
    window:windowObject,console,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,
    setTimeout,clearTimeout,setInterval,clearInterval,Response,
    fetch:async(url,options={})=>{
      const u=String(url);fetchCalls.push({url:u,options});
      if(u.endsWith('/v1/employee/auth/health')){
        return new Response(JSON.stringify({
          success:true,schemaReady:true,mode:'TRANSITIONAL',envEnabled:true,
          legacyBootstrapEnabled:true,nativeOnly:false,plaintextStored:false,
          userCount:nativeReadyCount,nativeReadyCount
        }),{status:200,headers:{'content-type':'application/json'}});
      }
      if(u.endsWith('/v1/employee/legacy-action/health')){
        throw new Error('bridge health must not be called in bridge-free canary mode');
      }
      if(u.endsWith('/v1/employee/auth/login')){
        const body=JSON.parse(options.body||'{}');
        return new Response(JSON.stringify({
          success:true,authSource:'d1-native-employee-v1',
          user:{username:String(body.username||''),token:'native-token'}
        }),{status:200,headers:{'content-type':'application/json'}});
      }
      if(u.endsWith('/v1/employee/core')) return new Response(JSON.stringify({success:true,version:'ENTRY614_D1_EMPLOYEE_CORE_V1',rows:[],dashboard:{}}),{status:200,headers:{'content-type':'application/json'}});
      if(u.endsWith('/v1/employee/content')) return new Response(JSON.stringify({success:true,authority:'d1-employee-content-v1',knowledge:[]}),{status:200,headers:{'content-type':'application/json'}});
      if(u.endsWith('/v1/employee/comms')) return new Response(JSON.stringify({success:true,authority:'d1-employee-comms-v1',conversations:[]}),{status:200,headers:{'content-type':'application/json'}});
      return new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}});
    }
  };
  vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});
  return {windowObject,fetchCalls,legacyCalls};
}

{
  const h=makeHarness(5);
  assert.equal(h.windowObject.TrendOSEmployeeApiDispatcherV1.canaryMinimumBridgePolicies(),0);
  assert.equal(h.windowObject.TrendOSEmployeeApiDispatcherV1.canaryRequiredNativeReadyCount(),5);
  assert.equal(h.windowObject.TrendOSEmployeeApiDispatcherV1.bridgeFreeCanaryConfigured(),true);

  const out=await h.windowObject.trendosEmployeeApiV1('login',{username:'ضياء',password:'x'});
  assert.equal(out.authSource,'d1-native-employee-v1');
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/auth/health')).length,1);
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/legacy-action/health')).length,0);
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/auth/login')).length,1);

  const dash=await h.windowObject.trendosEmployeeApiV1('getDashboard',{username:'ضياء',token:'native-token'});
  assert.equal(dash.success,true);
  assert.equal(h.fetchCalls.at(-1).url,'https://trendos-d1-api.example.test/v1/employee/core');

  const content=await h.windowObject.trendosEmployeeApiV1('getKnowledge',{username:'ضياء',token:'native-token'});
  assert.equal(content.authority,'d1-employee-content-v1');

  const comms=await h.windowObject.trendosEmployeeApiV1('customerManagerV1',{username:'ضياء',token:'native-token',op:'inbox'});
  assert.equal(comms.authority,'d1-employee-comms-v1');

  await assert.rejects(
    ()=>h.windowObject.trendosEmployeeApiV1('saveKnowledge',{username:'ضياء',token:'native-token',title:'x'}),
    err=>err&&err.code==='EMPLOYEE_LEGACY_BRIDGE_DISABLED'
  );

  const before=h.fetchCalls.length;
  const unknown=await h.windowObject.trendosEmployeeApiV1('login',{username:'unknown-new-employee',password:'legacy'});
  assert.equal(unknown.source,'legacy');
  assert.equal(h.fetchCalls.length,before);
}

{
  const h=makeHarness(4);
  await assert.rejects(
    ()=>h.windowObject.trendosEmployeeApiV1('login',{username:'ضياء',password:'x'}),
    err=>err&&err.code==='EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED'&&err.detail==='native-ready-count'
  );
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/auth/health')).length,1);
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/legacy-action/health')).length,0);
  assert.equal(h.fetchCalls.filter(x=>x.url.endsWith('/v1/employee/auth/login')).length,0);
}

const config=fs.readFileSync('config.js','utf8');
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT = 0/);
assert.match(source,/function bridgeFreeCanaryConfigured\(\)/);
assert.match(source,/canaryRequiredNativeReadyCount/);

console.log('ENTRY631_BRIDGE_FREE_CANARY_PREFLIGHT=PASS');
console.log('ENTRY631_AUTH_HEALTH_ONLY=PASS');
console.log('ENTRY631_BRIDGE_HEALTH_CALLS=0');
console.log('ENTRY631_REQUIRED_NATIVE_READY_COUNT=5');
console.log('ENTRY631_READY_4_OF_5_FAIL_CLOSED=PASS');
console.log('ENTRY631_UNKNOWN_EMPLOYEE_LEGACY=PASS');
console.log('ENTRY631_GLOBAL_NATIVE_AUTH=OFF');
console.log('ENTRY631_PRODUCTION_MUTATION=NO');
