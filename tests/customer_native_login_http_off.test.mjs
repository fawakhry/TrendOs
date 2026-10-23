import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleCustomerNativeLoginHttpV0, CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0}
  from '../cloudflare-d1/src/customer-portal-native-login-http-off-v0.mjs';
import {hashNewCustomerPasswordV0}
  from '../cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs';

const ORIGIN='https://portal.example.test';
const PATH='https://worker.example.test/v1/customer/native/login';
const CODE='PC-FAKE-1';
const PASSWORD='FAKE-Password-Synthetic-NeverReal-2026!';
const SECRET='FAKE-Native-HMAC-Session-Secret-Length-Over-32';
const THROTTLE='FAKE-Native-Durable-Throttle-HMAC-Key-Len-Over32';
const input={portalCode:CODE,password:PASSWORD};
let verifier;
async function seededAccount(){
  const pass=await hashNewCustomerPasswordV0(PASSWORD,new Uint8Array(16).fill(9));
  return {
    customerId:'FAKE-C1',portalCode:CODE,...pass,
    sessionVersion:5,failedAttempts:0,lockedUntilMs:0
  };
}
function fixture(options={}){
  const calls={db:[],rate:[],sql:[],keys:[]};
  const db={prepare(sql){
    calls.sql.push(sql);
    const kind=sql.includes('SELECT a.customer_id AS customerId')?'read':
      sql.includes('INSERT INTO customer_portal_native_sessions_v1')?'issue':'fail';
    calls.db.push({phase:'prepare',kind});
    return {bind(...args){
      calls.db.push({phase:'bind',kind,args});
      return {
        async first(){if(options.dbError)throw Error('DB PRIVATE');
          return options.unknownAccount?null:verifier;},
        async run(){if(options.dbError)throw Error('DB PRIVATE');
          return {meta:{changes:options.ambiguousD1?0:1}};
        }
      };
    }};
  }};
  const rate={async reserveMany(arg){
    calls.rate.push(arg);
    if(options.rateThrow)throw Error('RATE PRIVATE');
    return {persisted:!options.rateUnpersisted,allowed:!options.rateDenied};
  }};
  const env={
    CORS_ORIGINS:ORIGIN,
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:
      options.enabled===false?'false':'true',
    TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET:THROTTLE,
    CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0:rate,
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    DB:db
  };
  if(options.missingGate)delete env.CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0;
  if(options.missingSecret)delete env.TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET;
  if(options.noDB)delete env.DB;
  const request=(overrides={})=>{
    const {url=PATH,method='POST',origin=ORIGIN,ip='192.0.2.77',
      type='application/json',body=input,contentLength,edge=true}=overrides;
    const headers={'Content-Type':type};
    if(origin!==null)headers.Origin=origin;
    if(ip!==null)headers['CF-Connecting-IP']=ip;
    if(contentLength!==undefined)headers['Content-Length']=String(contentLength);
    const req=new Request(url,{method,headers,
      body:method==='POST'?
        (typeof body==='string'?body:JSON.stringify(body)):undefined});
    if(edge)Object.defineProperty(req,'cf',{value:{colo:'CAI'}});
    return req;
  };
  const call=(overrides={})=>handleCustomerNativeLoginHttpV0(request(overrides),env);
  return {calls,env,request,call};
}
test('source is OFF-unimported, separate from customer master and browser live flag',()=>{
  const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
  assert.doesNotMatch(worker,/customer-portal-native-login-http-off-v0/);
  const config=readFileSync('config.js','utf8');
  assert.match(config,/TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED\s*=\s*false/);
  const source=readFileSync('cloudflare-d1/src/customer-portal-native-login-http-off-v0.mjs','utf8');
  assert.doesNotMatch(source,/script\.google\.com|APPS_SCRIPT_API_URL|fetch\(/);
  assert.equal(CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0.defaultEnabled,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0.workerEntryWired,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0.durableRateGateImplementedHere,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0.productionRelease,'NO_GO');
});
test('feature OFF denies before reading credentials or touching D1/rate gate',async()=>{
  const h=fixture({enabled:false});
  const r=await h.call();
  assert.equal(r.status,503);
  assert.equal((await r.json()).code,'CUSTOMER_NATIVE_LOGIN_HTTP_OFF');
  assert.equal(h.calls.rate.length,0);assert.equal(h.calls.db.length,0);
});
test('wrong URL, query or methods denied before DB',async()=>{
  const h=fixture();
  for(const o of [
    {url:'https://worker.example.test/v1/customer/native/logins'},
    {url:PATH+'?customerId=FAKE-C1'},
    {method:'GET'},
    {method:'PUT'}
  ]){
    const r=await h.call(o);
    assert.ok([404,405].includes(r.status));assert.equal(h.calls.db.length,0);
  }
});
test('only configured origin, explicit browser Origin and POST allowed',async()=>{
  const h=fixture();
  for(const origin of [null,'null','https://evil.example.test',ORIGIN+'.evil.test']){
    const r=await h.call({origin});
    assert.equal(r.status,403);
    assert.equal(h.calls.rate.length,0);assert.equal(h.calls.db.length,0);
    assert.equal(r.headers.get('access-control-allow-origin'),null);
  }
  const options=await h.call({method:'OPTIONS'});
  assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),ORIGIN);
  assert.equal(h.calls.db.length,0);
});
test('unattested Cloudflare edge, ambiguous client-IP fails closed',async()=>{
  const h=fixture();
  for(const o of [{edge:false},{ip:null},{ip:'evil.test'},{ip:'192.0.2.1, 192.0.2.2'}]){
    const r=await h.call(o);
    assert.equal(r.status,503);
  }
  assert.equal(h.calls.rate.length,0);assert.equal(h.calls.db.length,0);
});
test('reject JSON types, oversized body, unknown identity/privilege fields',async()=>{
  const h=fixture();
  const cases=[
    {type:'text/plain'}, {body:'bad json'},
    {body:[]}, {body:{...input,customerId:'FAKE-C1'}},
    {body:{portalCode:CODE,password:PASSWORD,role:'admin'}},
    {body:{portalCode:CODE,password:22}},
    {body:{portalCode:' '+CODE,password:PASSWORD}},
    {body:{portalCode:CODE,password:'short'}},
    {body:{portalCode:CODE,password:PASSWORD+'x'.repeat(130)}},
    {contentLength:9999}, {body:' '.repeat(3000)}
  ];
  for(const o of cases){
    const r=await h.call(o);
    assert.ok([400,413,415].includes(r.status),JSON.stringify(o));
  }
  assert.equal(h.calls.rate.length,0);assert.equal(h.calls.db.length,0);
});
test('missing or failed global durable rate gate always denies before D1',async()=>{
  for(const x of [{missingGate:true},{missingSecret:true},{rateThrow:true},
    {rateUnpersisted:true},{rateDenied:true}]){
    const h=fixture(x);
    const r=await h.call();
    assert.ok([429,503].includes(r.status));
    assert.equal(h.calls.db.length,0);
    assert.doesNotMatch(await r.clone().text(),new RegExp(PASSWORD));
  }
});
test('rate reservation uses two opaque HMAC keys, never raw account/IP/password',async()=>{
  const h=fixture({unknownAccount:true});
  const r=await h.call();
  assert.equal(r.status,401);
  const arr=h.calls.rate;
  assert.equal(arr.length,1);
  assert.equal(arr[0].policy,'customer-login-dual-v0');
  assert.equal(arr[0].keys.length,2);
  assert.ok(arr[0].keys.every(k=>/^[a-f0-9]{64}$/.test(k)));
  assert.notEqual(arr[0].keys[0],arr[0].keys[1]);
  assert.doesNotMatch(JSON.stringify(arr),/PC-FAKE|192\.0\.2\.77|FAKE-Password/);
});
test('same portalCode across different IP preserves identifier throttle fingerprint',async()=>{
  const a=fixture({unknownAccount:true}),b=fixture({unknownAccount:true});
  await a.call({ip:'192.0.2.10'});
  await b.call({ip:'192.0.2.11'});
  assert.equal(a.calls.rate[0].keys[0],b.calls.rate[0].keys[0]);
  assert.notEqual(a.calls.rate[0].keys[1],b.calls.rate[0].keys[1]);
});
test('unknown account and wrong password return generic rejection without details',async()=>{
  verifier=await seededAccount();
  const h=fixture({unknownAccount:true});
  const r=await h.call(); assert.equal(r.status,401);
  assert.equal((await r.json()).code,'CUSTOMER_LOGIN_REJECTED');
  verifier=await seededAccount();
  const b=fixture();
  const wrong=await b.call({body:{...input,password:'FAKE-Wrong-Password-NotReal-2026!'}});
  assert.equal(wrong.status,401);
  assert.equal((await wrong.json()).code,'CUSTOMER_LOGIN_REJECTED');
  assert.ok(b.calls.db.some(x=>x.kind==='fail'));
  assert.ok(!b.calls.db.some(x=>x.kind==='issue'));
  assert.doesNotMatch(JSON.stringify({success:false,code:'CUSTOMER_LOGIN_REJECTED'}),/FAKE-C1|PC-FAKE-1|Password/);
});
test('valid mocked account issues real PBKDF2-verified opaque bearer and no private response fields',async()=>{
  verifier=await seededAccount();
  const h=fixture();
  const r=await h.call();
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.success,true);
  assert.equal(body.customerSessionIssued,true);
  assert.match(body.token,/^[a-f0-9]{64}$/);
  assert.equal(r.headers.get('cache-control'),'no-store');
  assert.equal(r.headers.get('access-control-allow-origin'),ORIGIN);
  assert.ok(h.calls.db.some(x=>x.kind==='issue'));
  const bound=JSON.stringify(h.calls.db);
  assert.doesNotMatch(bound,new RegExp(PASSWORD));
  assert.doesNotMatch(JSON.stringify(body),/FAKE-C1|PC-FAKE-1|Password/);
});
test('D1 failures and ambiguous writes return 503 without exposing DB state or tokens',async()=>{
  verifier=await seededAccount();
  for(const opts of [{dbError:true},{ambiguousD1:true},{noDB:true}]){
    const h=fixture(opts);
    const r=await h.call();
    assert.equal(r.status,503);
    const data=await r.json();
    assert.equal(data.success,false);
    assert.equal(data.customerSessionIssued,false);
    assert.ok(!('token' in data));
    assert.doesNotMatch(JSON.stringify(data),/FAKE-C1|PRIVATE|DB PRIVATE/);
  }
});
