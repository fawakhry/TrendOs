import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  rotateNativeCustomerPasswordV0,
  CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0,
  CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,
  CUSTOMER_NATIVE_PASSWORD_ROTATION_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-change-password-v0.mjs';
import {hashNewCustomerPasswordV0,verifyNewCustomerPasswordV0}
  from '../cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs';
import {fingerprintCustomerSessionV0}
  from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';
const PASSWORD='FAKE-Owner-Passphrase-Not-Real-2026!';
const NEXT='FAKE-Next-Passphrase-Not-Real-2027!';
const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const NOW=1800000000000;
const random={getRandomValues(a){a.fill(17);return a;}};
let row,calls;
const db=({changes=1,broken=false,missing=false}={})=>({prepare(sql){
  const kind=sql.includes('SELECT a.customer_id AS customerId')?'lookup':'change';
  calls.push({stage:'prepare',kind,sql});
  return {bind(...args){
    calls.push({stage:'bind',kind,args});
    return{
      async first(){if(broken)throw Error('PRIVATE_SQL');return missing?null:row;},
      async run(){if(broken)throw Error('PRIVATE_SQL');return {meta:{changes}};}
    };
  }};
}});
const run=(changes=1,options={})=>rotateNativeCustomerPasswordV0({
  db:db({changes,...options}),token:TOKEN,secret:SECRET,
  nowMs:NOW,currentPassword:PASSWORD,newPassword:NEXT,random
});
test('successful rotation reuses existing PBKDF2 and HMAC; no passwords returned',async()=>{
  calls=[];
  row={customerId:'FAKE-C1',portalCode:'PC-C1',sessionVersion:1,
    ...(await hashNewCustomerPasswordV0(PASSWORD,new Uint8Array(16).fill(9)))};
  const result=await run();
  assert.equal(result.status,200);
  assert.equal(result.body.customerSessionsInvalidated,true);
  assert.equal(result.body.reloginRequired,true);
  const bind=calls.find(x=>x.stage==='bind'&&x.kind==='change').args;
  assert.equal(bind[0],'11'.repeat(16));
  assert.equal(bind[1].length,64);
  assert.notEqual(bind[1],row.passwordHashHex);
  assert.deepEqual(bind.slice(2),[
    'FAKE-C1','PC-C1',row.passwordSaltHex,row.passwordHashHex,1,
    await fingerprintCustomerSessionV0(TOKEN,SECRET),NOW,NOW
  ]);
  assert.equal(await verifyNewCustomerPasswordV0(NEXT,{
    passwordScheme:'pbkdf2-sha256-v1',passwordIterations:100000,
    passwordSaltHex:bind[0],passwordHashHex:bind[1]
  }),true);
  assert.doesNotMatch(JSON.stringify(result),/FAKE-C1|PC-C1|FAKE-Next|FAKE-Owner|ab{15}/);
});
test('wrong old password, equal passwords, absent session and ambiguous CAS denied',async()=>{
  calls=[];
  row={customerId:'FAKE-C1',portalCode:'PC-C1',sessionVersion:1,
    ...(await hashNewCustomerPasswordV0(PASSWORD,new Uint8Array(16).fill(8)))};
  const wrong=await rotateNativeCustomerPasswordV0({
    db:db(),token:TOKEN,secret:SECRET,nowMs:NOW,
    currentPassword:'WRONG-OLD-PASSWORD-2026!',newPassword:NEXT,random
  });
  assert.equal(wrong.status,401);
  assert.equal(calls.filter(x=>x.kind==='change').length,0);
  assert.equal((await rotateNativeCustomerPasswordV0({
    db:db(),token:TOKEN,secret:SECRET,nowMs:NOW,
    currentPassword:PASSWORD,newPassword:PASSWORD,random
  })).status,401);
  assert.equal((await run(1,{missing:true})).status,401);
  assert.equal((await run(0)).status,503);
  assert.equal((await run(null)).status,503);
  const bad=await run(1,{broken:true});
  assert.equal(bad.status,503);
  assert.doesNotMatch(JSON.stringify(bad),/PRIVATE_SQL/);
});
test('rotation protects session, version and exact password snapshot at SQL commit',()=>{
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/session_version=session_version\+1/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/password_hash_hex=\?/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/s\.revoked_at_ms IS NULL/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/s\.token_fingerprint_hex=\?/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/s\.session_version=customer_portal_native_accounts_v1\.session_version/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0,/a\.session_version=s\.session_version/);
  assert.match(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0,/ctl\.mode='GENERAL'/);
});
test('source stays OFF, no legacy or public Worker route',()=>{
  const source=fs.readFileSync('cloudflare-d1/src/customer-portal-native-change-password-v0.mjs','utf8');
  assert.doesNotMatch(source,/script\.google\.com|APPS_SCRIPT_API_URL|fetch\s*\(/);
  assert.doesNotMatch(fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8'),
    /customer-portal-native-change-password-v0/);
  assert.equal(CUSTOMER_NATIVE_PASSWORD_ROTATION_POLICY_V0.httpRouteAvailable,false);
  assert.equal(CUSTOMER_NATIVE_PASSWORD_ROTATION_POLICY_V0.googleFallback,false);
  assert.equal(CUSTOMER_NATIVE_PASSWORD_ROTATION_POLICY_V0.productionRelease,'NO_GO');
});
