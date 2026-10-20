import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  issueNativeCustomerSessionFromPasswordV0,
  newNativeCustomerSessionTokenV0,
  CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0,
  CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0,
  CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,
  CUSTOMER_NATIVE_LOGIN_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-login-v0.mjs';
import {hashNewCustomerPasswordV0}
  from '../cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs';
import {fingerprintCustomerSessionV0}
  from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const PASSWORD='FAKE-Owner-Passphrase-Not-Real-2026!';
const SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const NOW=1800000000000;
const calls=[];
const rnd={getRandomValues(a){a.fill(31);return a;}};
const token='1f'.repeat(32);
let record;
async function account(){
  const hash=await hashNewCustomerPasswordV0(PASSWORD,new Uint8Array(16).fill(9));
  return {customerId:'FAKE-C1',portalCode:'PC-FAKE-1',
    ...hash,sessionVersion:5,failedAttempts:0,lockedUntilMs:0};
}
const fixture=(options={})=>({prepare(sql){
  const kind=sql.includes('SELECT a.customer_id AS customerId')?'lookup':
    sql.includes('UPDATE customer_portal_native_accounts_v1')?'failure':'issue';
  calls.push({kind,sql,phase:'prepare'});
  return {bind(...params){
    calls.push({kind,params,phase:'bind'});
    return {
      async first(){if(options.throwDb)throw Error('PRIVATE_DB_ERROR');
        return options.row===null?null:options.row||record;
      },
      async run(){if(options.throwDb)throw Error('PRIVATE_DB_ERROR');
        return {meta:{changes:options.changes===undefined?1:options.changes}};
      }
    };
  }};
}});
const doLogin=(password=PASSWORD,options={})=>issueNativeCustomerSessionFromPasswordV0({
  db:fixture(options),portalCode:'PC-FAKE-1',password,secret:SECRET,
  nowMs:NOW,random:rnd
});
test('reuses PBKDF2 from Entry657 and exact session HMAC from Entry660',async()=>{
  record=await account();
  assert.equal(newNativeCustomerSessionTokenV0(rnd),token);
  const res=await doLogin();
  assert.equal(res.status,200);
  assert.equal(res.body.token,token);
  assert.equal(res.body.customerSessionIssued,true);
  assert.equal(res.body.expiresAtMs,NOW+8*60*60*1000);
  assert.doesNotMatch(JSON.stringify(res),/FAKE-C1|PC-FAKE-1|password|FAKE-Owner|SECRET/);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.defaultEnabled,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.loginHttpRouteAvailable,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.googleFallback,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.globalRateThrottleAdded,false);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.productionRelease,'NO_GO');
  assert.doesNotMatch(fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8'),
    /customer-portal-native-login-v0/);
});
test('session INSERT binds only HMAC, verified active account and current verifier/version',async()=>{
  record=await account();calls.length=0;
  const x=await doLogin();
  assert.equal(x.status,200);
  const lookup=calls.find(c=>c.kind==='lookup'&&c.phase==='bind');
  const issue=calls.find(c=>c.kind==='issue'&&c.phase==='bind');
  assert.deepEqual(lookup.params,['PC-FAKE-1']);
  assert.deepEqual(issue.params,[
    await fingerprintCustomerSessionV0(token,SECRET),
    NOW,NOW+8*60*60*1000,'FAKE-C1','PC-FAKE-1',
    record.passwordSaltHex,record.passwordHashHex,5,0,NOW
  ]);
  assert.doesNotMatch(JSON.stringify(issue.params),new RegExp(PASSWORD));
  assert.match(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,/a\.password_hash_hex=\?/);
  assert.match(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,/a\.session_version=\?/);
  assert.match(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,/a\.failed_attempts=\?/);
  assert.match(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,/ctl\.mode='GENERAL'/);
});
test('wrong password only advances source-scoped lockout CAS, never issues a token',async()=>{
  record=await account();calls.length=0;
  const res=await doLogin('WRONG-BUT-LONG-PASSWORD-2026!');
  assert.equal(res.status,401);
  assert.equal(res.body.code,'CUSTOMER_LOGIN_REJECTED');
  assert.equal(calls.filter(x=>x.kind==='issue').length,0);
  const fail=calls.find(x=>x.kind==='failure'&&x.phase==='bind');
  assert.deepEqual(fail.params,[
    NOW+900000,'FAKE-C1','PC-FAKE-1',record.passwordSaltHex,
    record.passwordHashHex,5,0,NOW
  ]);
  assert.match(CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0,/failed_attempts=\?/);
  assert.match(CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0,/session_version=\?/);
});
test('missing account, expired lock, bad secret and ambiguous D1 ack are not login success',async()=>{
  record=await account();calls.length=0;
  assert.equal((await doLogin(PASSWORD,{row:null})).status,401);
  assert.equal(calls.filter(x=>x.kind==='issue').length,0);
  record={...record,lockedUntilMs:NOW+30000};
  assert.equal((await doLogin()).status,401);
  record=await account();
  assert.equal((await doLogin(PASSWORD,{changes:0})).status,503);
  assert.equal((await doLogin(PASSWORD,{changes:null})).status,503);
  assert.equal((await doLogin(PASSWORD,{throwDb:true})).status,503);
  assert.equal((await issueNativeCustomerSessionFromPasswordV0({
    db:fixture(),portalCode:'PC-FAKE-1',password:PASSWORD,secret:'short',nowMs:NOW
  })).status,503);
});
test('source has no Google fallback or public self-enrollment and keeps endpoint OFF',()=>{
  const source=fs.readFileSync('cloudflare-d1/src/customer-portal-native-login-v0.mjs','utf8');
  assert.doesNotMatch(source,/fetch\s*\(|APPS_SCRIPT|script\.google\.com|legacy_chat_token|googlePassword/);
  assert.match(CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0,/verified_enrollment_ref/);
  assert.match(CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0,/NOT EXISTS/);
  assert.match(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0,/NOT EXISTS/);
  assert.equal(CUSTOMER_NATIVE_LOGIN_POLICY_V0.liveOtpSender,false);
});
