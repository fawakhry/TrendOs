import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {cloudAuthTokenFingerprint} from '../../src/cloud-auth-shadow-v1.mjs';
import {handleEmployeeAccountingNativeRequest} from '../../src/employee-accounting-native-v1.mjs';
import {verifyEmployeeSessionIsolatedV1} from '../../src/accounting-employee-session-bridge-v1.mjs';
import sessionWorker from '../trendos-native-session-source.mjs';
import customerWorker from '../trendos-customer-facts-source.mjs';

function d1(db, log, forbid=''){
 return {prepare(sql){
   if(forbid && new RegExp(forbid,'i').test(sql)) throw Error('CROSS_D1_SQL_BLOCKED');
   log.push(sql);
   let args=[],q=String(sql);
   const stmt={
     bind(...values){args=values;return stmt;},
     async first(){return db.prepare(q).get(...args)||null;},
     async all(){return {results:db.prepare(q).all(...args)};},
     async run(){return db.prepare(q).run(...args);}
   };return stmt;
 }};
}
const FINANCE_SCHEMA=[
 '0015_employee_accounting_zero_google_v1.sql',
 ...fs.readdirSync('cloudflare-d1/migrations').filter(x=>
   /^00(?:2[0-9]|3[01])_employee_accounting_/.test(x)).sort()
];
test('real native SSO + real native finance READONLY across physically separate D1s',async()=>{
 const op=new DatabaseSync(':memory:'),fin=new DatabaseSync(':memory:'),opSql=[],finSql=[];
 try{
  op.exec(fs.readFileSync('cloudflare-d1/migrations/0009_employee_auth_native_v1.sql','utf8'));
  op.exec(fs.readFileSync('cloudflare-d1/migrations/0008_t12_customer_master.sql','utf8'));
  for(const name of FINANCE_SCHEMA)fin.exec(fs.readFileSync('cloudflare-d1/migrations/'+name,'utf8'));
  fin.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
  op.exec("UPDATE employee_auth_control_v1 SET mode='NATIVE' WHERE singleton=1");
  op.prepare("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,active,source) VALUES(?,?,?,?,?)")
    .run('FAKE-CUSTOMER-236','ACC236 Fictional', 'acc236 fictional','نعم','cloud-native');
  fin.prepare("INSERT INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('customer',?,?,27.25,1,'',0)")
    .run('FAKE-CUSTOMER-236','ACC236 Fictional');
  const authSecret='local-offline-edge-fingerprint-key-'+('q'.repeat(48));
  const tok='ACC236_TEST_BEARER_TOKEN_NOT_REAL';
  const user='acc236_fake_final';
  const fingerprint=await cloudAuthTokenFingerprint(user,tok,{EDGE_SESSION_SECRET:authSecret});
  const now=Date.now();
  op.prepare("INSERT INTO employee_auth_users_v1(employee_id,username_key,canonical_username,role,department,screens_json,must_change,active,session_version) VALUES(?,?,?,?,?,'[]',0,1,1)")
    .run('ACC236-FAKE-EMPLOYEE',user,user,'service','خدمة');
  op.prepare("INSERT INTO employee_auth_sessions_v1(username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms) VALUES(?,?,1,?,?,?)")
    .run(user,fingerprint,now-5000,now+3600000,now-5000);
  const opDB=d1(op,opSql),finDB=d1(fin,finSql,'\\bt12_|\\bemployee_auth_');
  const sessionHmac='ACC236_TEST_ONLY_SESSION_SERVICE_HMAC_KEY_64_CHARS';
  const customerHmac='ACC236_TEST_ONLY_CUSTOMER_SERVICE_HMAC_KEY_64_CHARS';
  const operationalEnv={
    DB:opDB,EDGE_SESSION_SECRET:authSecret,
    TRENDOS_NATIVE_SESSION_SOURCE_V1:'ENFORCE',
    TRENDOS_EMPLOYEE_AUTH_V1_ENABLED:'true',
    TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',
    TRENDOS_EMPLOYEE_SESSION_HMAC_V1:sessionHmac,
    TRENDOS_CUSTOMER_FACTS_HMAC_V1:customerHmac,
    TRENDOS_CUSTOMER_FACTS_SOURCE_V1:'ENFORCE'
  };
  const financeEnv={
    DB:finDB, EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED',
    ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
    ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({version:1,grants:[{username:user,mode:'final'}]}),
    TRENDOS_EMPLOYEE_SESSION_HMAC_V1:sessionHmac,
    TRENDOS_CUSTOMER_FACTS_HMAC_V1:customerHmac,
    TRENDOS_EMPLOYEE_SESSION:{fetch:req=>sessionWorker.fetch(req,operationalEnv)},
    TRENDOS_CUSTOMER_FACTS:{fetch:req=>customerWorker.fetch(req,operationalEnv)}
  };
  const send=async(payload,token=tok,username=user)=>{
    const res=await handleEmployeeAccountingNativeRequest(new Request('https://finance.internal/v1/employee/accounting',{
      method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},
      body:JSON.stringify({username,...payload})
    }),financeEnv);
    return {status:res.status,body:await res.json()};
  };
  const read=await send({action:'getCustomerAccountV1915',customerId:'FAKE-CUSTOMER-236'});
  assert.equal(read.status,200,JSON.stringify(read));
  assert.equal(read.body.balance,27.25);
  assert.equal(read.body.authSource,'d1-native-employee-v1-readonly');
  assert.equal(read.body.customer.customerId,'FAKE-CUSTOMER-236');
  const before=op.prepare('SELECT last_seen_at_ms AS lastSeen FROM employee_auth_sessions_v1 WHERE username_key=?').get(user);
  assert.equal(before.lastSeen,now-5000,'readonly verifier cannot touch last_seen');
  const denied=await send({action:'saveAccountingFinalInvoice',orderId:'FAKE-ORDER',customerId:'FAKE-CUSTOMER-236'});
  assert.equal(denied.status,503);
  assert.equal(denied.body.code,'employee-accounting-readonly');
  const forged=await send({action:'getCustomerAccountV1915',customerId:'FAKE-CUSTOMER-236',role:'admin'},'FAKE_WRONG_TOKEN');
  assert.equal(forged.status,401);
  assert.equal(forged.body.code,'employee-session-rejected');
  // Session still active, but no explicit independent finance grant => rejected.
  financeEnv.ACCOUNTING_FINANCE_GRANTS_V1=JSON.stringify({version:1,grants:[]});
  const noGrant=await send({action:'getEasyStoreCustomers'});
  assert.equal(noGrant.status,403);
  financeEnv.ACCOUNTING_FINANCE_GRANTS_V1=JSON.stringify({version:1,grants:[{username:user,mode:'final'}]});
  // Native-only source cannot authorize expired, forced-password-change or
  // stale session versions; NONE may fall back to old Apps Script/shadow auth.
  op.exec("UPDATE employee_auth_control_v1 SET mode='TRANSITIONAL' WHERE singleton=1");
  const wrongMode=await send({action:'getEasyStoreCustomers'});
  assert.equal(wrongMode.status,401);
  op.exec("UPDATE employee_auth_control_v1 SET mode='NATIVE' WHERE singleton=1");
  op.prepare("UPDATE employee_auth_users_v1 SET must_change=1 WHERE username_key=?").run(user);
  const forcedPassword=await send({action:'getEasyStoreCustomers'});
  assert.equal(forcedPassword.status,401);
  op.prepare("UPDATE employee_auth_users_v1 SET must_change=0,session_version=2 WHERE username_key=?").run(user);
  const staleVersion=await send({action:'getEasyStoreCustomers'});
  assert.equal(staleVersion.status,401);
  op.prepare("UPDATE employee_auth_users_v1 SET session_version=1 WHERE username_key=?").run(user);
  op.prepare("UPDATE employee_auth_sessions_v1 SET expires_at_ms=? WHERE username_key=?").run(Date.now()-1000,user);
  const expired=await send({action:'getEasyStoreCustomers'});
  assert.equal(expired.status,401);
  op.prepare("UPDATE employee_auth_sessions_v1 SET expires_at_ms=? WHERE username_key=?").run(Date.now()+3600000,user);
  op.prepare('UPDATE employee_auth_sessions_v1 SET revoked_at_ms=? WHERE username_key=?').run(Date.now(),user);
  const revoked=await send({action:'getEasyStoreCustomers'});
  assert.equal(revoked.status,401);
  assert.equal(op.prepare("SELECT last_seen_at_ms AS lastSeen FROM employee_auth_sessions_v1 WHERE username_key=?").get(user).lastSeen,now-5000);
  assert.equal(fin.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='employee_auth_users_v1'").get().n,0);
  assert.equal(fin.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='t12_customers'").get().n,0);
  assert.equal(fin.prepare("SELECT COUNT(*) AS n FROM employee_accounting_final_invoices_v1").get().n,0);
  assert.equal(fin.prepare("SELECT COUNT(*) AS n FROM employee_accounting_cashbox_v1").get().n,0);
  assert.ok(opSql.every(q=>!/(INSERT|UPDATE|DELETE)/i.test(q)));
  assert.ok(finSql.every(q=>!/\\bt12_|\\bemployee_auth_/i.test(q)));
 }finally{fin.close();op.close();}
});
