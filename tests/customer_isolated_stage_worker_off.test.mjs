import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import stage from '../cloudflare-d1/customer-stage/index.mjs';
import {CUSTOMER_STAGE_POLICY_V0} from '../cloudflare-d1/customer-stage/stage-policy-v0.mjs';
import {hashNewCustomerPasswordV0}
  from '../cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs';
import {fingerprintCustomerSessionV0}
  from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const BASE='https://only-isolated-stage.example.test';
const ORIGIN='http://127.0.0.1:8000';
const PASSWORD='FAKE-Staging-Owner-NotReal-Passphrase-2026!';
const CODE='PC-FAKE-OWNER-1';
const SECRET='FAKE-Stage-Native-Session-HMAC-Secret-Over-32-Bytes';
const RATE_SECRET='FAKE-Stage-Rate-Secret-For-HMAC-Over-32-Bytes';
const ORDERS='/v1/customer/native/orders';
const LOGIN='/v1/customer/native/login';
const LOGOUT='/v1/customer/native/logout';
const hex64='a'.repeat(64);
const failBody=async response=>({status:response.status,body:await response.json()});
const envOff=()=>({
  CORS_ORIGINS:ORIGIN,TRENDOS_CUSTOMER_PORTAL_STAGE_MODE:'isolated-customer-stage-v0',
  TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'false',
  TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:'false',
  TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED:'false',
  TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED:'false'
});
function request(path,method='GET',extra={}){
  const headers={Origin:ORIGIN,...extra.headers};
  const r=new Request(BASE+path,{method,headers,body:method==='POST'?
    (extra.body??undefined):undefined});
  if(extra.edge)Object.defineProperty(r,'cf',{value:{colo:'CAI'}});
  return r;
}
test('dedicated staging Wrangler cannot address production Worker or customer D1',()=>{
  const cfg=readFileSync('cloudflare-d1/wrangler.customer-stage.toml','utf8');
  const prod=readFileSync('cloudflare-d1/wrangler.toml','utf8');
  const prodEntry=readFileSync('cloudflare-d1/production-shadow/index.js','utf8');
  const prodV2=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
  assert.match(cfg,/name\s*=\s*"trendos-customer-portal-isolated-stage-v0"/);
  assert.match(cfg,/main\s*=\s*"customer-stage\/index.mjs"/);
  assert.match(cfg,/workers_dev\s*=\s*false/);
  assert.match(cfg,/preview_urls\s*=\s*false/);
  assert.match(cfg,/TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED\s*=\s*"false"/);
  for(const x of ['NATIVE_LOGIN_HTTP_V0','NATIVE_ORDERS_READ_V0','NATIVE_LOGOUT_V0'])
    assert.match(cfg,new RegExp('TRENDOS_CUSTOMER_PORTAL_'+x+'_ENABLED\\s*=\\s*"false"'));
  assert.doesNotMatch(cfg,/\[\[d1_databases\]\]|database_id|\[\[r2_buckets\]\]|routes?\s*=|account_id\s*=/);
  assert.doesNotMatch(cfg,/5c4b92bf-e043-4f6e-bd6d-d514a92cd825|script\.google\.com/);
  assert.match(prod,/main\s*=\s*"production-shadow\/index.js"/);
  assert.doesNotMatch(prodEntry,/customer-stage\/index|customer-portal-native-login-http-off|customer-portal-native-logout-v0/);
  assert.doesNotMatch(prodV2,/customer-stage\/index|customer-portal-native-login-http-off|customer-portal-native-logout-v0|handleCustomerNativeOrdersReadV0/);
  assert.equal(CUSTOMER_STAGE_POLICY_V0.defaultEnabled,false);
  assert.equal(CUSTOMER_STAGE_POLICY_V0.productionEntrypointChanged,false);
  assert.equal(CUSTOMER_STAGE_POLICY_V0.productionDbBinding,false);
  assert.equal(CUSTOMER_STAGE_POLICY_V0.deployed,false);
});
test('the new stage is its own API; no passthrough of legacy/employee/finance URLs',async()=>{
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true'};
  for(const path of ['/','/health','/v1/legacy-api','/v1/orders','/v1/customer',
    '/v1/employee/auth/login','/v1/t12/general/create','/v1/accounting/preview',
    LOGIN+'/',LOGIN.toUpperCase(),'/v1/customer/native/verify']){
    const r=await failBody(await stage.fetch(request(path),env));
    assert.equal(r.status,404,path);
    assert.equal(r.body.code,'CUSTOMER_STAGE_ROUTE_NOT_FOUND');
  }
});
test('global stage kill-switch and separate mode fail before DB/auth/headers',async()=>{
  const env=envOff();
  let hits=0;
  env.DB={prepare(){hits++;throw Error('DB should not be touched');}};
  for(const path of [LOGIN,LOGOUT,ORDERS]){
    const r=await failBody(await stage.fetch(request(path),env));
    assert.equal(r.status,503);
    assert.equal(r.body.code,'CUSTOMER_STAGE_OFF');
  }
  env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED='true';
  env.TRENDOS_CUSTOMER_PORTAL_STAGE_MODE='wrong';
  for(const path of [LOGIN,LOGOUT,ORDERS]){
    const r=await failBody(await stage.fetch(request(path),env));
    assert.equal(r.status,503);
    assert.equal(r.body.code,'CUSTOMER_STAGE_OFF');
  }
  assert.equal(hits,0);
});
test('stage Origin allowlist is exact, requires Origin and rejects customer ID/phone query',async()=>{
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true'};
  for(const origin of ['https://evil.test','null',ORIGIN+'.evil',null]){
    const headers=origin===null?{}:{Origin:origin};
    const r=await failBody(await stage.fetch(new Request(BASE+ORDERS,{headers}),env));
    assert.equal(r.status,403);
    assert.equal(r.body.code,'CUSTOMER_STAGE_ORIGIN_FORBIDDEN');
  }
  for(const path of [LOGIN+'?customerId=C1',LOGOUT+'?token=a',
    ORDERS+'?phone=01000000000',ORDERS+'?customerCode=PC1']){
    const r=await failBody(await stage.fetch(request(path),env));
    assert.equal(r.status,400,path);
    assert.equal(r.body.code,'CUSTOMER_STAGE_QUERY_DENIED');
  }
});
test('per-endpoint flags remain OFF even with isolated stage master flag ON',async()=>{
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET};
  const outcomes=[
    [LOGIN,'POST','CUSTOMER_NATIVE_LOGIN_HTTP_OFF'],
    [LOGOUT,'POST','CUSTOMER_NATIVE_LOGOUT_OFF'],
    [ORDERS,'GET','CUSTOMER_NATIVE_ORDER_ROUTE_OFF']
  ];
  for(const [path,method,code] of outcomes){
    const headers=method==='POST'?{'Content-Type':'application/json',Authorization:'Bearer '+hex64}:
      {Authorization:'Bearer '+hex64};
    const data=await failBody(await stage.fetch(request(path,method,{
      edge:true,headers,body:method==='POST'?JSON.stringify({portalCode:CODE,password:PASSWORD}):undefined
    }),env));
    assert.equal(data.status,503,path);
    assert.equal(data.body.code,code,path);
  }
});
test('login flag without real durable rate limiter fails before DB access',async()=>{
  let dbHits=0;
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET:RATE_SECRET,
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    DB:{prepare(){dbHits++;throw Error('should not touch D1');}}};
  const r=await failBody(await stage.fetch(request(LOGIN,'POST',{
    edge:true,headers:{'Content-Type':'application/json',
      'CF-Connecting-IP':'192.0.2.17'},
    body:JSON.stringify({portalCode:CODE,password:PASSWORD})
  }),env));
  assert.equal(r.status,503);
  assert.equal(r.body.code,'CUSTOMER_NATIVE_LOGIN_DURABLE_THROTTLE_UNAVAILABLE');
  assert.equal(dbHits,0);
});
test('logout/orders missing D1 or bearer fail securely with all stage route flags enabled',async()=>{
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET};
  const orders=await failBody(await stage.fetch(request(ORDERS,'GET',{
    headers:{Authorization:'Bearer '+hex64}}),env));
  assert.equal(orders.status,503);
  assert.equal(orders.body.code,'NATIVE_CUSTOMER_DB_UNAVAILABLE');
  const logout=await failBody(await stage.fetch(request(LOGOUT,'POST',{
    headers:{Authorization:'Bearer '+hex64}}),env));
  assert.equal(logout.status,503);
  assert.equal(logout.body.code,'CUSTOMER_NATIVE_DB_UNAVAILABLE');
});

test('FULL offline Native stage login → own D1 order read → server CAS logout → session rejection',async()=>{
  const account={customerId:'FAKE-C1',portalCode:CODE,
    ...await hashNewCustomerPasswordV0(PASSWORD,new Uint8Array(16).fill(9)),
    sessionVersion:5,failedAttempts:0,lockedUntilMs:0};
  const state={sessionFingerprint:'',revoked:false,operations:[],gate:[]};
  const db={prepare(sql){
    const kind=sql.includes('SELECT a.customer_id AS customerId,a.portal_code')?'loginLookup':
      sql.includes('INSERT INTO customer_portal_native_sessions_v1')?'issue':
      sql.includes('UPDATE customer_portal_native_sessions_v1')?'logout':
      sql.includes('SELECT a.customer_id AS customerId')?'sessionLookup':
      sql.includes('SELECT o.order_id AS orderId')?'orders':'unknown';
    if(kind==='unknown')throw Error('unexpected SQL in fake isolated D1');
    return {bind(...params){
      state.operations.push({kind,params});
      return {
        async first(){
          if(kind==='loginLookup')return account;
          if(kind==='sessionLookup')
            return params[0]===state.sessionFingerprint&&!state.revoked?
              {customerId:'FAKE-C1'}:null;
          throw Error('unexpected first');
        },
        async all(){
          if(kind!=='orders')throw Error('unexpected all');
          assert.equal(params[0],'FAKE-C1');
          return {results:[{
            orderId:'FAKE-T12-O1',createdAt:'2026-10-23T09:00:00Z',
            lineId:'FAKE-T12-L1',ordinal:1,department:'طباعة',
            itemName:'ملف تجريبي',qty:1,status:'طلب جديد'
          }]};
        },
        async run(){
          if(kind==='issue') {
            state.sessionFingerprint=params[0];
            state.revoked=false;
            return {meta:{changes:1}};
          }
          if(kind==='logout'){
            const ok=params[1]===state.sessionFingerprint&&!state.revoked;
            if(ok)state.revoked=true;
            return {meta:{changes:ok?1:0}};
          }
          throw Error('unexpected run');
        }
      };
    }};
  }};
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET:RATE_SECRET,
    // Simulated CF namespace only in synthetic E2E. The production Stage
    // router now ignores an untrusted env-injected reserveMany() object.
    CUSTOMER_LOGIN_RATE_STAGE_V0:{
      idFromName(name){
        assert.equal(name,'singleton-customer-native-login-stage-v0');
        return 'synthetic-stage-do-id';
      },
      get(id){
        assert.equal(id,'synthetic-stage-do-id');
        return {async fetch(url,options){
          assert.equal(new URL(url).pathname,'/internal/customer-login-rate/reserve');
          assert.equal(options.method,'POST');
          const {keys,policy}=JSON.parse(options.body);
          state.gate.push({keys,policy});
          return new Response(JSON.stringify({allowed:true,persisted:true}),{
            status:200,headers:{'content-type':'application/json'}
          });
        }};
      }
    },DB:db};
  const login=await failBody(await stage.fetch(request(LOGIN,'POST',{
    edge:true,
    headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.17'},
    body:JSON.stringify({portalCode:CODE,password:PASSWORD})
  }),env));
  assert.equal(login.status,200);
  assert.equal(login.body.success,true);
  assert.equal(login.body.customerSessionIssued,true);
  assert.match(login.body.token,/^[a-f0-9]{64}$/);
  assert.equal(state.gate.length,1);
  assert.ok(state.gate[0].keys.every(x=>/^[a-f0-9]{64}$/.test(x)));
  assert.doesNotMatch(JSON.stringify(state.gate),/FAKE-C1|PC-FAKE|192\.0\.2\.17/);
  assert.equal(state.sessionFingerprint,
    await fingerprintCustomerSessionV0(login.body.token,SECRET));
  const bearer={Authorization:'Bearer '+login.body.token};
  const orders=await failBody(await stage.fetch(request(ORDERS,'GET',{headers:bearer}),env));
  assert.equal(orders.status,200);
  assert.equal(orders.body.success,true);
  assert.equal(orders.body.lines.length,1);
  assert.equal(orders.body.lines[0].orderId,'FAKE-T12-O1');
  assert.equal(orders.body.hasMore,false);
  const logout=await failBody(await stage.fetch(request(LOGOUT,'POST',{headers:bearer}),env));
  assert.equal(logout.status,200);
  assert.equal(logout.body.source,'customer-d1-native-logout-v0');
  assert.equal(logout.body.sessionRevoked,true);
  assert.equal(state.revoked,true);
  const after=await failBody(await stage.fetch(request(ORDERS,'GET',{headers:bearer}),env));
  assert.equal(after.status,401);
  assert.equal(after.body.code,'CUSTOMER_SESSION_REJECTED');
  const replay=await failBody(await stage.fetch(request(LOGOUT,'POST',{headers:bearer}),env));
  assert.equal(replay.status,401);
  assert.equal(replay.body.code,'CUSTOMER_SESSION_REJECTED');
  const serialized=JSON.stringify(state.operations);
  assert.doesNotMatch(serialized,new RegExp(PASSWORD));
});

test('a mock caller-supplied rate gate cannot bypass missing Stage Durable Object binding',async()=>{
  let dbHits=0,untrustedCalled=0;
  const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET:RATE_SECRET,
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0:{async reserveMany(){
      untrustedCalled++;return {allowed:true,persisted:true};
    }},
    DB:{prepare(){dbHits++;throw Error('must deny first');}}};
  const result=await failBody(await stage.fetch(request(LOGIN,'POST',{
    edge:true,headers:{'Content-Type':'application/json',
      'CF-Connecting-IP':'192.0.2.17'},
    body:JSON.stringify({portalCode:CODE,password:PASSWORD})
  }),env));
  assert.equal(result.status,503);
  assert.equal(result.body.code,'CUSTOMER_NATIVE_LOGIN_DURABLE_THROTTLE_UNAVAILABLE');
  assert.equal(dbHits,0);
  assert.equal(untrustedCalled,0);
});
test('Durable Object reservation failure stops the original customer D1 password verifier',async()=>{
  for(const outcome of [
    {status:503,payload:{allowed:false,persisted:false}},
    {status:200,payload:{allowed:true,persisted:false}},
    {status:200,payload:{allowed:false,persisted:true}}
  ]){
    let dbHits=0;
    const env={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
      TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED:'true',
      TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET:RATE_SECRET,
      TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
      CUSTOMER_LOGIN_RATE_STAGE_V0:{
        idFromName(){return 'fake-only-in-test';},
        get(){return {async fetch(){
          return new Response(JSON.stringify(outcome.payload),{status:outcome.status});
        }};}
      },
      DB:{prepare(){dbHits++;throw Error('no D1 work permitted');}}
    };
    const result=await failBody(await stage.fetch(request(LOGIN,'POST',{
      edge:true,headers:{'Content-Type':'application/json',
        'CF-Connecting-IP':'192.0.2.17'},
      body:JSON.stringify({portalCode:CODE,password:PASSWORD})
    }),env));
    assert.equal(result.status,outcome.status===200&&outcome.payload.persisted?429:503);
    assert.equal(dbHits,0);
  }
});


test('isolated Stage submit preflight is GET-only, OFF-by-default, no T12 order write',async()=>{
  const draft='CDR-'+'11'.repeat(16);
  const path='/v1/customer/native/drafts/'+draft+'/submit-preflight';
  const stageEnabled={...envOff(),TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true'};
  let accessed=0;
  stageEnabled.DB={prepare(){accessed++;throw Error('preflight must stop before D1');}};
  const withoutBearer=await failBody(await stage.fetch(request(path,'GET'),stageEnabled));
  assert.equal(withoutBearer.status,503);
  assert.equal(withoutBearer.body.code,'DRAFT_PREFLIGHT_ROUTE_OFF');
  const badOrigin=await failBody(await stage.fetch(new Request(BASE+path,{
    headers:{Origin:'https://evil.test',Authorization:'Bearer '+hex64}
  }),stageEnabled));
  assert.equal(badOrigin.status,403);
  const query=await failBody(await stage.fetch(request(path+'?customerId=FAKE-C2','GET'),stageEnabled));
  assert.equal(query.status,400);
  const post=await failBody(await stage.fetch(request(path,'POST',{
    headers:{Authorization:'Bearer '+hex64,'Content-Type':'application/json'},body:'{}'
  }),{...stageEnabled,TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED:'true'}));
  assert.equal(post.status,405);
  const wrongPath=await failBody(await stage.fetch(request(
    '/v1/customer/native/drafts/INVALID/submit-preflight','GET'),stageEnabled));
  assert.equal(wrongPath.status,404);
  assert.equal(accessed,0);
  const source=readFileSync('cloudflare-d1/customer-stage/submit-preflight-ro-v0.mjs','utf8');
  assert.doesNotMatch(source,/createT12GeneralOrder|INSERT INTO t12_prod_orders|APPS_SCRIPT_API_URL/);
  assert.match(source,/preflightNativeCustomerDraftSubmitV0/);
  const cfg=readFileSync('cloudflare-d1/wrangler.customer-stage.toml','utf8');
  assert.ok(cfg.includes('TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED = "false"'));
});
