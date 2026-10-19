import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  fingerprintCustomerSessionV0,
  readVerifiedCustomerOrderLinesV0,
  handleCustomerNativeOrdersReadV0,
  CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,
  CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,
  CUSTOMER_NATIVE_ORDERS_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const TOKEN='ab'.repeat(32);
const SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const ORIGIN='https://customer.fake.test';
const sample=[{orderId:'ORDER-FAKE-1',createdAt:'2026-01-01',lineId:'LINE-FAKE-1',
  ordinal:1,department:'الطباعة',itemName:'منتج وهمي',qty:2,status:'تحت التنفيذ'}];
const calls=[];
function db({session=true,rows=sample,broken=false}={}){
  return {prepare(sql){
    const isSession=sql.includes('FROM customer_portal_native_sessions_v1');
    calls.push({sql,stage:'prepare'});
    return {bind(...params){
      calls.push({sql,params,stage:'bind'});
      return {
        async first(){
          if(broken)throw new Error('PRIVATE-DB-SQL-FAIL');
          return session?{customerId:'CUSTOMER-FAKE-1'}:null;
        },
        async all(){
          if(broken)throw new Error('PRIVATE-DB-SQL-FAIL');
          return {results:rows};
        }
      };
    }};
  }};
}
function req(path='/v1/customer/native/orders',headers={},method='GET'){
  return new Request('https://cloud.fake.test'+path,{
    method,headers:{Origin:ORIGIN,'Authorization':'Bearer '+TOKEN,...headers}
  });
}
function env(overrides={}){
  return {CORS_ORIGINS:ORIGIN,
    TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,DB:db(),
    ...overrides};
}

test('session secret HMAC is stable, domain-separated and rejects malformed token/short key',async()=>{
  const value=await fingerprintCustomerSessionV0(TOKEN,SECRET);
  assert.match(value,/^[a-f0-9]{64}$/);
  assert.notEqual(value,TOKEN);
  assert.equal(value,await fingerprintCustomerSessionV0(TOKEN,SECRET));
  assert.notEqual(value,await fingerprintCustomerSessionV0('cd'.repeat(32),SECRET));
  await assert.rejects(()=>fingerprintCustomerSessionV0('BAD',SECRET));
  await assert.rejects(()=>fingerprintCustomerSessionV0(TOKEN,'weak'));
});

test('source-only control and exact D1 session + ownership SQL are fail-closed',()=>{
  assert.equal(CUSTOMER_NATIVE_ORDERS_POLICY_V0.defaultEnabled,false);
  assert.equal(CUSTOMER_NATIVE_ORDERS_POLICY_V0.workerEntryWired,false);
  assert.equal(CUSTOMER_NATIVE_ORDERS_POLICY_V0.genuineCustomerSessionsIssuedHere,false);
  assert.equal(CUSTOMER_NATIVE_ORDERS_POLICY_V0.googleFallback,false);
  assert.equal(CUSTOMER_NATIVE_ORDERS_POLICY_V0.productionRelease,'NO_GO');
  const entry=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');
  assert.doesNotMatch(entry,/customer-portal-native-orders-v0\.mjs/);
  assert.match(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,/s\.revoked_at_ms IS NULL/);
  assert.match(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,/a\.session_version=s\.session_version/);
  assert.match(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,/ctl\.mode='GENERAL'/);
  assert.match(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,/c\.active='نعم'/);
  assert.match(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,/own\.customer_id=\?/);
  assert.match(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,/own\.status='VERIFIED'/);
  assert.match(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,/own\.proof_method='OWNER_REVIEWED_EXACT_ID'/);
  assert.match(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,/o\.external_customer_id/);
  assert.doesNotMatch(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0,/phone|customer_name|notes|debt|sheet_rows/i);
});

test('default OFF, forbidden origin, invalid method and missing key stop before database',async()=>{
  calls.length=0;
  const o=await handleCustomerNativeOrdersReadV0(req(),env({
    TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED:undefined
  }));
  assert.equal(o.status,503);
  assert.equal((await o.json()).code,'CUSTOMER_NATIVE_ORDER_ROUTE_OFF');
  assert.equal(calls.length,0);
  const disallowed=await handleCustomerNativeOrdersReadV0(
    req('/v1/customer/native/orders',{Origin:'https://bad.invalid'}),env());
  assert.equal(disallowed.status,403);
  assert.equal(calls.length,0);
  assert.equal((await handleCustomerNativeOrdersReadV0(req(
    '/v1/customer/native/orders',{},'POST'),env())).status,405);
  assert.equal(calls.length,0);
  assert.equal((await handleCustomerNativeOrdersReadV0(req(),
    env({TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:''}))).status,503);
  assert.equal(calls.length,0);
});

test('GET native bearer derives customer only from session and restricts output',async()=>{
  calls.length=0;
  const response=await handleCustomerNativeOrdersReadV0(req(
    '/v1/customer/native/orders?limit=1&offset=0&customerId=OTHER_USER&phone=01000000000'),env());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  const body=await response.json();
  assert.equal(body.success,true);
  assert.equal(body.lines.length,1);
  assert.equal(body.lines[0].orderId,'ORDER-FAKE-1');
  assert.equal(body.lines[0].status,'تحت التنفيذ');
  assert.deepEqual(Object.keys(body.lines[0]).sort(),
    ['orderId','createdAt','lineId','ordinal','department','itemName','qty','status'].sort());
  assert.equal(JSON.stringify(body).includes('CUSTOMER-FAKE-1'),false);
  assert.equal(JSON.stringify(body).includes('01000000000'),false);
  assert.equal(JSON.stringify(body).includes(TOKEN),false);
  assert.equal(JSON.stringify(body).includes(SECRET),false);
  assert.equal(calls.filter(x=>x.stage==='bind').length,2);
  const [session,order]=calls.filter(x=>x.stage==='bind');
  assert.match(session.params[0],/^[a-f0-9]{64}$/);
  assert.notEqual(session.params[0],TOKEN);
  assert.equal(order.params[0],'CUSTOMER-FAKE-1');
  assert.deepEqual(order.params.slice(1),[2,0]);
});

test('invalid bearer, revoked D1 session or broken schema never reaches Google',async()=>{
  calls.length=0;
  const invalid=await handleCustomerNativeOrdersReadV0(req(
    '/v1/customer/native/orders',{Authorization:'Bearer invalid'}),env());
  assert.equal(invalid.status,401);
  assert.equal(calls.length,0);
  const response=await handleCustomerNativeOrdersReadV0(req(),env({DB:db({session:false})}));
  assert.equal(response.status,401);
  assert.equal((await response.json()).code,'CUSTOMER_SESSION_REJECTED');
  const failed=await handleCustomerNativeOrdersReadV0(req(),env({DB:db({broken:true})}));
  assert.equal(failed.status,503);
  assert.doesNotMatch(JSON.stringify(await failed.json()),/PRIVATE-DB-SQL-FAIL/);
});

test('paging and invalid row shape fail closed; no unbounded read',async()=>{
  for(const query of ['?limit=0','?limit=41','?limit=-1','?limit=1.2',
      '?offset=10001','?offset=1%20OR%201','?limit=Infinity']){
    const response=await handleCustomerNativeOrdersReadV0(req(
      '/v1/customer/native/orders'+query),env());
    assert.equal(response.status,400,query);
  }
  const extra=await readVerifiedCustomerOrderLinesV0({
    db:db({rows:[...sample,...sample]}),token:TOKEN,secret:SECRET,
    nowMs:123456,limit:1,offset:0
  });
  assert.equal(extra.status,200);
  assert.equal(extra.body.hasMore,true);
  assert.equal(extra.body.lines.length,1);
  const invalid=await readVerifiedCustomerOrderLinesV0({
    db:db({rows:[{...sample[0],qty:-9}]}),token:TOKEN,secret:SECRET,
    nowMs:123456
  });
  assert.equal(invalid.status,503);
  assert.equal(invalid.body.code,'CUSTOMER_ORDER_ROW_INVALID');
});
