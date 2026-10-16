// BOOK20-R2-FILE-AUTH — in-process auth + D1 + R2 fakes ONLY.
// No network, production credential, customer data, deploy, or Cloudflare mutations.
import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { handleEmployeeCommsNativeRequest } from '../cloudflare-d1/src/employee-comms-native-v1.mjs';
import { cloudAuthTokenFingerprint } from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const ID = 'OCF-00000000-0000-4000-8000-000000000001';
const ROOT = 'https://unit.invalid/v1/employee/comms/file/';
const ORDER = 'SYNTHETIC-ORDER-1';
const TOKEN = 'synthetic-ci-session-not-real';
const SECRET = 'synthetic-ci-native-fingerprint-secret';
const ORIGINAL_FETCH = globalThis.fetch;
// Fail any unexpected network: the test must not reach Apps Script/Cloudflare.
globalThis.fetch = async () => { throw new Error('NETWORK_FORBIDDEN_IN_FAKE_TEST'); };

async function fixture({ role='print', username='demo-employee', assigned=true, active=true, file=true, visible=1, publicBase='', orderId=ORDER }={}) {
  const calls={ r2Get:0, r2Put:0, fileMetadata:0, orderLookup:0, writes:0 };
  const env={
    EDGE_SESSION_SECRET:SECRET,
    TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',
    FILES_PUBLIC_BASE_URL:publicBase,
    DB:{ prepare(sql) {
      return {
        bind(...values) { this.values=values; return this; },
        async first() {
          if(sql.includes('FROM employee_auth_sessions_v1 s')) {
            const fp=await cloudAuthTokenFingerprint(username,TOKEN,env);
            if(!active||this.values[1]!==fp)return null;
            return {usernameKey:username.toLowerCase(),canonicalUsername:username,role,department:role,
              screensJson:JSON.stringify([role]),sessionVersion:1,currentSessionVersion:1,
              active:1,expiresAtMs:Date.now()+600000,mustChange:0};
          }
          if(sql.includes('FROM employee_comms_control_v1'))return {mode:'READONLY'};
          if(sql.includes('FROM employee_order_conversation_files_v1')) {
            calls.fileMetadata++;
            return file?{orderId,r2Key:'private/synthetic/fixture',mimeType:'application/pdf',
              visibleToCustomer:visible,uploadedBy:'demo-employee'}:null;
          }
          if(sql.includes('FROM t12_prod_orders')) {
            calls.orderLookup++;
            return {orderId:ORDER,customerName:'Synthetic',phone:'',status:'new'};
          }
          if(sql.includes('FROM t12_prod_lines'))return assigned?{allowed:1}:null;
          if(sql.includes('FROM employee_core_lines_v1'))return null;
          return null;
        },
        async all(){ return {results:[]}; },
        async run(){ calls.writes++; return {success:true}; }
      };
    }},
    FILES: {
      async get() {calls.r2Get++;return {body:new Uint8Array([80,68,70])};},
      async put() {calls.r2Put++;return {};}
    }
  };
  return {env,calls};
}
async function read(env,{username='demo-employee',token=TOKEN,fileId=ID}={}) {
  const headers = {};
  if(username)headers['X-Employee-Username']=username;
  if(token)headers.Authorization='Bearer '+token;
  const response=await handleEmployeeCommsNativeRequest(new Request(ROOT+fileId,{headers}),env);
  return {response,status:response.status,body:response.status===200?await response.arrayBuffer():await response.text()};
}

test('TEST1 GET without sign-in is rejected before file metadata/R2',async()=>{
  const {env,calls}=await fixture();
  const r=await read(env,{username:'',token:''});
  assert.equal(r.status,401);
  assert.equal(calls.fileMetadata,0);
  assert.equal(calls.r2Get,0);
});

test('TEST2 expired/revoked native employee session is rejected',async()=>{
  const {env,calls}=await fixture({active:false});
  const r=await read(env);
  assert.equal(r.status,401);
  assert.equal(calls.fileMetadata,0);
  assert.equal(calls.r2Get,0);
});

test('TEST3 employee not assigned to this order gets 403 without R2 read',async()=>{
  const {env,calls}=await fixture({assigned:false});
  const r=await read(env);
  assert.equal(r.status,403);
  assert.equal(calls.r2Get,0);
});

test('TEST4 assigned employee reads their authorized private file',async()=>{
  const {env,calls}=await fixture();
  const r=await read(env);
  assert.equal(r.status,200);
  assert.equal(calls.r2Get,1);
  assert.equal(r.response.headers.get('cache-control'),'no-store');
  assert.equal(r.response.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual([...new Uint8Array(r.body)],[80,68,70]);
});

test('TEST5 customer role is rejected even if visible_to_customer is 1 or 0',async()=>{
  for(const visible of [0,1]){
    const {env,calls}=await fixture({role:'customer',visible});
    const r=await read(env);
    assert.equal(r.status,403);
    assert.equal(calls.r2Get,0);
  }
});

test('TEST6 missing file is 404 without leaking an R2 key',async()=>{
  const {env,calls}=await fixture({file:false});
  const r=await read(env);
  assert.equal(r.status,404);
  assert.doesNotMatch(r.body,/private\/synthetic|order_id|r2Key/);
  assert.equal(calls.r2Get,0);
});

test('TEST7 missing visibility policy or mismatched order fails before R2',async()=>{
  for(const extra of [{visible:null},{orderId:'SOMEONE-ELSE-ORDER'}]){
    const {env,calls}=await fixture(extra);
    const r=await read(env);
    assert.ok([403,404].includes(r.status));
    assert.equal(calls.r2Get,0);
  }
});

test('TEST8 configured public R2 base disables protected GET, without any R2 read',async()=>{
  const {env,calls}=await fixture({publicBase:'https://public-r2.unit.invalid'});
  const r=await read(env);
  assert.equal(r.status,503);
  assert.equal(calls.r2Get,0);
});

test('reject identity in URL; bearer alone without username header cannot authorize',async()=>{
  const {env,calls}=await fixture();
  const response=await handleEmployeeCommsNativeRequest(
    new Request(ROOT+ID+'?username=demo-employee&token='+encodeURIComponent(TOKEN),
      {headers:{Authorization:'Bearer '+TOKEN}}),env);
  assert.equal(response.status,401);
  assert.equal(calls.r2Get,0);
});

test('reject non-GET file access before R2 and reject untrusted Origin',async()=>{
  const {env,calls}=await fixture();
  const method=await handleEmployeeCommsNativeRequest(new Request(ROOT+ID,{method:'POST'}),env);
  assert.equal(method.status,405);
  const origin=await handleEmployeeCommsNativeRequest(new Request(ROOT+ID,{headers:{Origin:'https://evil.unit.invalid'}}),env);
  assert.equal(origin.status,403);
  assert.equal(calls.r2Get,0);
});

test.after(()=>{globalThis.fetch=ORIGINAL_FETCH;});
