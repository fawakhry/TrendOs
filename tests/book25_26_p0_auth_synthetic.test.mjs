// BOOK25 / BOOK26 P0 — ONLY fake D1 and synthetic sessions. No external fetch.
import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { handleMirrorRequest } from '../cloudflare-d1/src/mirror-gate.mjs';
import { handleEmployeeCoreNativeRequest } from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import { cloudAuthTokenFingerprint } from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto) globalThis.crypto=webcrypto;

const SECRET='synthetic-test-only-worker-secret';
const MIGRATION_SECRET='synthetic-migration-operator-secret';
const TOKEN='synthetic-employee-token';
let fakeNetworkCalls=0;
const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>{fakeNetworkCalls++;throw new Error('NO_EXTERNAL_NETWORK_ALLOWED');};
test.after(()=>{globalThis.fetch=oldFetch;});

function fakeMirrorEnv(){
  const calls={sql:0};
  const env={ MIGRATION_SECRET, DB:{prepare(sql) {
    calls.sql++;
    return { bind(){return this;},async all(){return {results:[]};},async first(){
      return {sheetCount:0,rowCount:0,readySheets:0,pendingSheets:0};
    }};
  }}};
  return {env,calls};
}
async function mirror(path,headers={},env){
  const r=await handleMirrorRequest(new Request('https://fixture.invalid'+path,{headers}),env);
  return {status:r.status,body:await r.json()};
}
test('BOOK26: anonymous GET for all four mirror routes denies BEFORE D1 SQL',async()=>{
  const names=['/v1/mirror/sheet?name=private','/v1/mirror/sheets','/v1/mirror/stats','/v1/mirror/capabilities'];
  for(const path of names){
    const {env,calls}=fakeMirrorEnv();
    const x=await mirror(path,{},env);
    assert.equal(x.status,401,path);
    assert.equal(x.body.code,'mirror-read-unauthorized');
    assert.equal(calls.sql,0,path);
  }
});
test('BOOK26: invalid mirror secret denied before D1 SQL',async()=>{
  const {env,calls}=fakeMirrorEnv();
  const x=await mirror('/v1/mirror/sheet?name=private',{'x-migration-secret':'wrong'},env);
  assert.equal(x.status,401);
  assert.equal(calls.sql,0);
});
test('BOOK26: missing server configured migration secret fails closed',async()=>{
  const {env,calls}=fakeMirrorEnv();delete env.MIGRATION_SECRET;
  assert.equal((await mirror('/v1/mirror/stats',{},env)).status,401);
  assert.equal(calls.sql,0);
});
test('BOOK26: authorized migration operator can inspect stats/capabilities/sheets',async()=>{
  for(const path of ['/v1/mirror/stats','/v1/mirror/capabilities','/v1/mirror/sheets']){
    const {env,calls}=fakeMirrorEnv();
    const x=await mirror(path,{'x-migration-secret':MIGRATION_SECRET},env);
    assert.equal(x.status,200,path);
    assert.equal(x.body.success,true);
    assert.ok(calls.sql>0);
  }
});

async function fakeCoreEnv({role='print',username='fixture-user',active=true,expired=false}={}){
  const calls={managerSQL:0,sql:0};
  const env={EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',
    DB:{prepare(sql){
      calls.sql++;
      if(/employee_accounting_materials|t12_customers|employee_core_archive_orders|t12_prod_runtime_events|employee_core_events_v1|t12_prod_lines|t12_prod_orders/.test(sql))calls.managerSQL++;
      return {bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM employee_auth_sessions_v1 s')){
            const fp=await cloudAuthTokenFingerprint(username,TOKEN,env);
            if(!active||expired||this.args[1]!==fp)return null;
            return {canonicalUsername:username,role,department:role,screensJson:'[]',sessionVersion:1,
              currentSessionVersion:1,active:1,expiresAtMs:Date.now()+10000,mustChange:0};
          }
          if(sql.includes('FROM employee_core_control_v1'))return {mode:'GENERAL',policyEpoch:1,dataVersion:1};
          if(sql.includes('COUNT(*) AS n'))return {n:0};
          return null;
        },
        async all(){return {results:[]};},
        async run(){return {success:true};}
      };
    }}
  };
  return {env,calls};
}
async function core(action,role='print',active=true){
  const {env,calls}=await fakeCoreEnv({role,active});
  const request=new Request('https://fixture.invalid/v1/employee/core',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({username:'fixture-user',action})});
  const response=await handleEmployeeCoreNativeRequest(request,env);
  return {status:response.status,body:await response.json(),calls};
}
test('BOOK25: print/laser/service cannot read manager debt or employee activity',async()=>{
  for(const role of ['print','laser','service']){
    for(const action of ['getActivityLog','getTrendMasterCenterV1931']){
      const x=await core(action,role);
      assert.equal(x.status,403,role+action);
      assert.equal(x.body.code,'manager-access-denied');
      assert.equal(x.calls.managerSQL,0,'no private data SQL before denial');
    }
  }
});
test('BOOK25: verified explicit admin role can retrieve manager and activity results',async()=>{
  for(const action of ['getActivityLog','getTrendMasterCenterV1931']){
    const x=await core(action,'admin');
    assert.equal(x.status,200,action);
    assert.equal(x.body.success,true);
    assert.ok(x.calls.managerSQL>0);
  }
});
test('BOOK25: invalid/expired employee session cannot access private data',async()=>{
  const x=await core('getTrendMasterCenterV1931','admin',false);
  assert.equal(x.status,401);
  assert.equal(x.calls.managerSQL,0);
});
test('BOOK25/26: no live external fetch or remote contact occurs',()=>assert.equal(fakeNetworkCalls,0));
