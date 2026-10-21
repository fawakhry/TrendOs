import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  CUSTOMER_NATIVE_DRAFT_CREATE_PATH_V0,
  CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0,
  CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0,
  CUSTOMER_NATIVE_DRAFT_POLICY_V0,
  newNativeCustomerDraftIdV0,
  createNativeCustomerDraftV0,handleCustomerNativeDraftCreateV0
} from '../cloudflare-d1/src/customer-portal-native-draft-create-v0.mjs';
import {fingerprintCustomerSessionV0} from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const TOKEN='ab'.repeat(32), SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const REQUEST_KEY='cd'.repeat(16), NOW=1800000000000;
const ORIGIN='https://customer.fake.test';
const random={getRandomValues(a){a.fill(34);return a;}};
let calls=[];
const mock=(changes=1,existing={draftId:'CDR-'+'22'.repeat(16),state:'DRAFT'},broken=false)=>({
 prepare(sql){
   const kind=sql.includes('INSERT OR IGNORE')?'insert':'readback';
   calls.push({kind,stage:'prepare',sql});
   return {bind(...args){
     calls.push({kind,stage:'bind',args});
     return{
       async run(){if(broken)throw Error('SECRET_SQL_PRIVATE');return {meta:{changes}};},
       async first(){if(broken)throw Error('SECRET_SQL_PRIVATE');return existing;}
     };
   }};
 }
});
const run=(db=mock(),more={})=>createNativeCustomerDraftV0({
 db,token:TOKEN,secret:SECRET,requestKey:REQUEST_KEY,nowMs:NOW,random,...more
});
const req=(payload={requestKey:REQUEST_KEY},extra={},method='POST')=>new Request(
 'https://api.fake.invalid/v1/customer/native/drafts',{
 method,headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN,
 'content-type':'application/json',...extra},
 ...(method==='POST'?{body:typeof payload==='string'?payload:JSON.stringify(payload)}:{})
});
const env=(overrides={})=>({
  DB:mock(),CORS_ORIGINS:ORIGIN,
  TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED:'true',
  TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,...overrides
});
test('source-only defaults OFF, additive 0036 schema, no published Worker route or official order mutations',()=>{
 const ddl=readFileSync('cloudflare-d1/migrations/0036_customer_portal_native_draft_create_v1.sql','utf8');
 assert.match(ddl,/customer_portal_native_drafts_v1/);
 const statements=ddl.split('\n').filter(s=>!/^\s*--/.test(s)).join('\n');
 assert.doesNotMatch(statements,/\b(?:INSERT\s+INTO|UPDATE|CREATE\s+TABLE)\s+t12_prod_orders\b/i);
 assert.doesNotMatch(statements,/\b(?:INSERT\s+INTO|UPDATE|CREATE\s+TABLE)\s+[a-z_]*finance[a-z_]*\b/i);
 assert.equal(CUSTOMER_NATIVE_DRAFT_POLICY_V0.defaultEnabled,false);
 assert.equal(CUSTOMER_NATIVE_DRAFT_POLICY_V0.workerEntryWired,false);
 assert.equal(CUSTOMER_NATIVE_DRAFT_POLICY_V0.officialOrderCreation,false);
 assert.equal(CUSTOMER_NATIVE_DRAFT_POLICY_V0.productionRelease,'NO_GO');
 const index=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(index,/customer-portal-native-draft-create-v0\.mjs/);
 assert.equal(CUSTOMER_NATIVE_DRAFT_CREATE_PATH_V0,'/v1/customer/native/drafts');
 assert.match(newNativeCustomerDraftIdV0(random),/^CDR-[a-f0-9]{32}$/);
});
test('insert binds server HMAC, account-derived customer scope and 20/day limit; no client customerId',async()=>{
 calls=[];
 const value=await run();
 assert.equal(value.status,201);
 assert.equal(value.body.success,true);
 assert.equal(value.body.officialOrderCreated,false);
 assert.equal(value.body.draftId,'CDR-'+'22'.repeat(16));
 assert.equal(value.body.alreadyCreated,false);
 const i=calls.find(c=>c.kind==='insert'&&c.stage==='bind');
 const back=calls.find(c=>c.kind==='readback'&&c.stage==='bind');
 const mac=await fingerprintCustomerSessionV0(TOKEN,SECRET);
 assert.deepEqual(i.args,[
   'CDR-'+'22'.repeat(16),REQUEST_KEY,NOW,NOW,mac,NOW,NOW,NOW-86400000
 ]);
 assert.deepEqual(back.args,[REQUEST_KEY,mac,NOW,NOW]);
 assert.match(CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0,/a\.session_version=s\.session_version/);
 assert.match(CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0,/ctl\.mode='GENERAL'/);
 assert.match(CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0,/NOT EXISTS/);
 assert.match(CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0,/s\.revoked_at_ms IS NULL/);
 assert.match(CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0,/s\.customer_id=a\.customer_id/);
 assert.doesNotMatch(JSON.stringify(value),/FAKE-only|ab{10}|cdcdcdcdcdcdcdcd|customerId|phone|customerName/);
});
test('same key returns existing draft, unowned/revoked replay never reveals IDs',async()=>{
 const replay=await run(mock(0));
 assert.equal(replay.status,200);
 assert.equal(replay.body.alreadyCreated,true);
 assert.equal(replay.body.draftId,'CDR-'+'22'.repeat(16));
 const denied=await run(mock(0,null));
 assert.equal(denied.status,409);
 assert.equal(denied.body.success,false);
 assert.equal(JSON.stringify(denied).includes('CDR-'),false);
});
test('unknown D1 acknowledgment, untrusted row and SQL exception fail closed',async()=>{
 assert.equal((await run(mock(undefined))).status,201);
 assert.equal((await run(mock(null))).status,503);
 assert.equal((await run(mock(2))).status,503);
 assert.equal((await run(mock(0,{draftId:'FOREIGN-ORDER',state:'DRAFT'}))).status,409);
 const bad=await run(mock(1,null,true));
 assert.equal(bad.status,503);
 assert.doesNotMatch(JSON.stringify(bad),/SECRET_SQL_PRIVATE/);
});
test('HTTP is OFF by default, checks origin and method before touching database',async()=>{
 calls=[];
 let response=await handleCustomerNativeDraftCreateV0(req(),env({
   TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED:undefined
 }));
 assert.equal(response.status,503);
 assert.equal((await response.json()).code,'NATIVE_CUSTOMER_DRAFT_CREATE_OFF');
 assert.equal(calls.length,0);
 response=await handleCustomerNativeDraftCreateV0(req({}, {Origin:'https://bad.invalid'}),env());
 assert.equal(response.status,403);
 response=await handleCustomerNativeDraftCreateV0(req({}, {},'GET'),env());
 assert.equal(response.status,405);
 response=await handleCustomerNativeDraftCreateV0(req({}, {Authorization:'Bearer bad'}),env());
 assert.equal(response.status,401);
 assert.equal(calls.length,0);
});
test('HTTP accepts only opaque 128-bit idempotency key and 256-byte max JSON',async()=>{
 const wrong=[
   {requestKey:REQUEST_KEY,customerId:'OTHER'},
   {requestKey:'not-a-key'},
   {requestKey:REQUEST_KEY.toUpperCase()},
   {requestKey:REQUEST_KEY,amount:0},
   'not json',
   JSON.stringify({requestKey:REQUEST_KEY,extra:'A'.repeat(300)})
 ];
 for(const item of wrong){
   calls=[];const q=await handleCustomerNativeDraftCreateV0(req(item),env());
   assert.equal(q.status,400);
   assert.equal(calls.length,0);
 }
 const out=await handleCustomerNativeDraftCreateV0(req(),env());
 assert.equal(out.status,201);
 assert.equal(out.headers.get('cache-control'),'no-store');
 assert.equal(out.headers.get('access-control-allow-origin'),ORIGIN);
 const body=await out.json();
 assert.equal(body.success,true);
 assert.equal(body.officialOrderCreated,false);
});
