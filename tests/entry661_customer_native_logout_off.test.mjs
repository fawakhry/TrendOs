import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  revokeCustomerNativeSessionV0,handleCustomerNativeLogoutV0,
  CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0,CUSTOMER_NATIVE_LOGOUT_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-logout-v0.mjs';
import {fingerprintCustomerSessionV0}
  from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';
const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const ORIGIN='https://customer.fake.test';
const hits=[];
const mockDb=(changes=1,throwDb=false)=>({prepare(sql){
  hits.push({stage:'prepare',sql});
  return{bind(...args){
    hits.push({stage:'bind',args});
    return{async run(){
      if(throwDb)throw new Error('PRIVATE-DB-NOTES');
      return {meta:{changes}};
    }};
  }};
}});
const req=(headers={},method='POST',path='/v1/customer/native/logout')=>new Request(
  'https://cloud.fake.test'+path,{method,
    headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN,...headers}}
);
const env=(obj={})=>({
  CORS_ORIGINS:ORIGIN,
  TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED:'true',
  TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
  DB:mockDb(),
  ...obj
});
test('logout remains OFF source and tied to existing D1 session ownership',()=>{
  assert.equal(CUSTOMER_NATIVE_LOGOUT_POLICY_V0.defaultEnabled,false);
  assert.equal(CUSTOMER_NATIVE_LOGOUT_POLICY_V0.workerEntryWired,false);
  assert.equal(CUSTOMER_NATIVE_LOGOUT_POLICY_V0.googleFallback,false);
  assert.equal(CUSTOMER_NATIVE_LOGOUT_POLICY_V0.productionRelease,'NO_GO');
  const entry=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');
  assert.doesNotMatch(entry,/customer-portal-native-logout-v0\.mjs/);
  assert.match(CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0,/revoked_at_ms IS NULL/);
  assert.match(CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0,/a\.session_version=customer_portal_native_sessions_v1\.session_version/);
  assert.match(CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0,/ctl\.mode='GENERAL'/);
  assert.doesNotMatch(CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0,/customer_name|customer_phone|debt_amount|sheet_rows/i);
});
test('atomic CAS affects only authenticated fingerprint and returns no token/PII',async()=>{
  hits.length=0;
  const result=await revokeCustomerNativeSessionV0({
    db:mockDb(),token:TOKEN,secret:SECRET,nowMs:123456
  });
  assert.equal(result.status,200);
  assert.equal(result.body.success,true);
  assert.equal(result.body.sessionRevoked,true);
  const args=hits.find(x=>x.stage==='bind').args;
  assert.deepEqual(args.slice(2),[123456,123456]);
  assert.equal(args[0],123456);
  assert.equal(args[1],await fingerprintCustomerSessionV0(TOKEN,SECRET));
  assert.equal(JSON.stringify(result).includes(TOKEN),false);
  assert.equal(JSON.stringify(result).includes(SECRET),false);
});
test('replay/missing session denied; database unknown outcome never success',async()=>{
  const base={token:TOKEN,secret:SECRET,nowMs:123456};
  assert.equal((await revokeCustomerNativeSessionV0({...base,db:mockDb(0)})).status,401);
  assert.equal((await revokeCustomerNativeSessionV0({...base,db:mockDb(undefined)})).status,503);
  const broken=await revokeCustomerNativeSessionV0({...base,db:mockDb(1,true)});
  assert.equal(broken.status,503);
  assert.doesNotMatch(JSON.stringify(broken),/PRIVATE-DB-NOTES/);
  assert.equal((await revokeCustomerNativeSessionV0({...base,token:'BAD',db:mockDb()})).status,401);
});
test('route default OFF, disallowed origin/method and short secret never reach DB',async()=>{
  hits.length=0;
  const off=await handleCustomerNativeLogoutV0(req(),env({
    TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED:undefined
  }));
  assert.equal(off.status,503);
  assert.equal((await off.json()).code,'CUSTOMER_NATIVE_LOGOUT_OFF');
  assert.equal(hits.length,0);
  assert.equal((await handleCustomerNativeLogoutV0(
    req({Origin:'https://attack.invalid'}),env())).status,403);
  assert.equal((await handleCustomerNativeLogoutV0(req({},'GET'),env())).status,405);
  assert.equal((await handleCustomerNativeLogoutV0(req(),env({
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:'weak'
  }))).status,503);
  assert.equal(hits.length,0);
});
test('HTTP logout POST only, no-store and no Google call',async()=>{
  hits.length=0;
  const response=await handleCustomerNativeLogoutV0(req(),env());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await response.json()).sessionRevoked,true);
  assert.equal(hits.filter(x=>x.stage==='bind').length,1);
});
