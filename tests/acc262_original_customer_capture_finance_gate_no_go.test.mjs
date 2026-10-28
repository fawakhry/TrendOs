import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {
 inspectOriginalCustomerReadinessACC262 as inspect,
 classifyUntrustedFinanceInboundACC262 as classify,POLICY,
 TABLES_SQL,CONTROL_SQL,CAPTURE_SQL
} from '../cloudflare-d1/src/t12-original-at-create-finance-readiness-acc262-sourceonly.mjs';
import {
 ACC257_PLATFORM_ORDER_SQL as ORDER,
 ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,
 ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';

const root=resolve(process.env.ACC260_ORIGINAL_SOURCE_DIR||'__original_source_missing__');
const source=resolve(root,'cloudflare-d1/src');
const {verifyNativeEmployeeSession}=await import(pathToFileURL(
 resolve(source,'employee-auth-native-v1.mjs')).href);
const {cloudAuthTokenFingerprint}=await import(pathToFileURL(
 resolve(source,'cloud-auth-shadow-v1.mjs')).href);
const nativeDDL=readFileSync(resolve(root,
 'cloudflare-d1/migrations/0009_employee_auth_native_v1.sql'),'utf8');
const customerDDL=readFileSync(resolve(root,
 'cloudflare-d1/migrations/0008_t12_customer_master.sql'),'utf8');
const captureDDL=readFileSync(resolve(root,
 'cloudflare-d1/migrations/0035_t12_order_customer_at_create_sourceonly_v1.sql'),'utf8');
const NOW=Date.now(),OID='4323',REQ='ACC262_FAKE_CREATE_REQUEST_0001',
 CUSTOMER='CUST262-FAKE-01',EMPLOYEE='وائل',EMPLOYEETOKEN='ACC262_NATIVE_FAKE_WAEL_TOKEN_12345';
const safeStatements=new Set([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME]);
function fixture({customerMaster=true,captureTables=false,captureRow=false,
 controlOff=false}={}){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0005_t12_production_create_canary','0006_t12_operational_runtime'])
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+name+'.fixture.sql.txt','utf8'));
 raw.exec(nativeDDL);
 if(customerMaster)raw.exec(customerDDL);
 if(captureTables)raw.exec(captureDDL);
 raw.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,'svc-actor','fake','{}',?,'COMMITTED')").run(REQ,OID);
 raw.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES (?,?,'existing','FAKE CUSTOMER','FAKE PHONE','EX-CUSTOMER-262','multi','عادي','طلب جديد','svc-actor')").run(OID,REQ);
 for(const [i,department,who] of [[1,'طباعة','وائل'],[2,'ليزر','جابر']]){
  const id=OID+'-'+String(i).padStart(2,'0');
  raw.prepare("INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES (?,?,?,?,?,?,'FAKE ITEM',1,'عادي','طلب جديد',0,0)").run(id,OID,REQ,i,department,who);
  raw.prepare("INSERT INTO t12_prod_outbox(request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,?,?,?,'trend-master-status-intent','pending','{}')").run(REQ,'queue:'+String(i).padStart(2,'0'),OID,id);
 }
 raw.prepare("INSERT INTO t12_prod_events(request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create','{}')").run(REQ,OID);
 for(const table of ['t12_prod_orders','t12_prod_request_ledger','t12_prod_lines','t12_prod_outbox','t12_prod_events'])
  raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'");
 if(customerMaster){
  raw.prepare("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,phone,source,active,version) VALUES (?,'FAKE CUSTOMER','fake customer','NOT-A-LIVE-PHONE','cloud-native','نعم',1)").run(CUSTOMER);
 }
 if(captureTables){
  if(!controlOff)raw.exec("UPDATE t12_order_customer_at_create_control_v1 SET mode='ISOLATED'");
  if(captureRow){
   raw.prepare("INSERT INTO t12_order_customer_at_create_v1(order_id,request_key,customer_id,external_customer_id,customer_version,actor_subject,evidence_ref,selector_role,selector_session_sha256,selector_issued_at,selector_expires_at) VALUES (?,?,?,?,?,'svc-actor','acc262:isolated:evidence:sample','service',?, ?,?)").run(OID,REQ,CUSTOMER,'EX-CUSTOMER-262',1,'a'.repeat(64),NOW-1500,NOW+1500);
  }
 }
 const stats={batches:0,nonBatchQueries:0,writes:0};
 const DB={
  prepare(sql){
   assert.match(sql.trim(),/^SELECT /i,'never write via source D1');
   stats.nonBatchQueries++;
   const make=(args)=>({
    sql,args,
    async first(){return raw.prepare(sql).get(...args)??null},
    async all(){return {results:raw.prepare(sql).all(...args)}},
    async run(){stats.writes++;throw Error('read only')}
   });
   return {...make([]),bind(...args){return make(args)}};
  },
  async batch(statements){
   stats.batches++;
   assert.equal(statements.length,5);
   statements.forEach(stmt=>assert.ok(safeStatements.has(stmt.sql),'original five native SQL only'));
   return statements.map(stmt=>({success:true,
    results:raw.prepare(stmt.sql).all(...stmt.args)}));
  }
 };
 const env={DB,EDGE_SESSION_SECRET:'ACC262_fake_original_secret_000',
  TRENDOS_DEPARTMENT_REVIEW_ACC259_MODE:'ISOLATED_NATIVE_REVIEW_READONLY',
  ACC262_MODE:'ISOLATED_READONLY'};
 return {raw,env,stats,close:()=>raw.close()};
}
async function login(f){
 const hash=await cloudAuthTokenFingerprint(EMPLOYEE,EMPLOYEETOKEN,f.env);
 f.raw.prepare("INSERT INTO employee_auth_users_v1(employee_id,username_key,canonical_username,role,department,screens_json,active,must_change,session_version) VALUES('fake-user262',? ,? ,'print','طباعة','[\"print\"]',1,0,1)").run(EMPLOYEE,EMPLOYEE);
 f.raw.prepare("INSERT INTO employee_auth_sessions_v1(username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms,source) VALUES(?,?,1,?,?,?,'d1-native')").run(EMPLOYEE,hash,NOW-2000,NOW+60000,NOW-1000);
}
function call(f,extra={}){
 return inspect({env:f.env,orderId:OID,lineId:'4323-01',
  username:EMPLOYEE,employeeToken:EMPLOYEETOKEN,
  expectedOfficialCustomerId:CUSTOMER,
  verifyOriginalNativeSession:verifyNativeEmployeeSession,
  nowMs:NOW,mode:'ISOLATED_READONLY',...extra});
}
async function withFixture(opts,fn){const f=fixture(opts);try{await login(f);return await fn(f)}finally{f.close()}}
test('ACC262 executes actual original 0005 0008 0035 SQL and verifier, not clones',()=>{
 assert.equal(typeof verifyNativeEmployeeSession,'function');
 assert.match(customerDDL,/CREATE TABLE IF NOT EXISTS t12_customers/);
 assert.match(captureDDL,/capture_status TEXT NOT NULL DEFAULT 'SOURCE_ONLY_NOT_ATTESTED'/);
 assert.match(captureDDL,/finance_authorized INTEGER NOT NULL DEFAULT 0 CHECK\(finance_authorized=0\)/);
 assert.equal(POLICY.workerWired,false);
 assert.equal(POLICY.financeRelease,'NO_GO');
});
test('ACC262 fails closed when original 0035 at-create capture not installed',()=>withFixture({},async f=>{
 const result=await call(f);
 assert.equal(result.code,'ACC262_ORIGINAL_0008_OR_0035_NOT_APPLIED');
 assert.equal(result.financeAuthorized,false);
 assert.equal(f.stats.writes,0);
}));
test('ACC262 original 0035 OFF control denies even with native order and staff',()=>withFixture({captureTables:true,controlOff:true},async f=>{
 const result=await call(f);
 assert.equal(result.code,'ACC262_ORIGINAL_0035_DEFAULT_OFF');
 assert.equal(result.financeAuthorized,false);
}));
test('ACC262 original 0035 ISOLATED has no historical backfill; missing source capture denied',()=>withFixture({captureTables:true},async f=>{
 const result=await call(f);
 assert.equal(result.code,'ACC262_ORIGINAL_AT_CREATE_CAPTURE_ABSENT');
}));
test('ACC262 exactly matched original SOURCE-ONLY row is still NOT owner attestation',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 const before=f.raw.prepare('SELECT total_changes() n').get().n;
 const result=await call(f);
 assert.equal(result.success,true,JSON.stringify(result));
 assert.equal(result.customerIdShapeMatched,true);
 assert.equal(result.employeeReviewerVerified,true);
 assert.equal(result.captureStatus,'SOURCE_ONLY_NOT_ATTESTED');
 assert.equal(result.officialCustomerOwnerAttested,false);
 assert.equal(result.realSignedFinancialApproval,false);
 assert.equal(result.canPublishToEasyStore,false);
 assert.equal(result.canRequestInvoice,false);
 assert.equal(result.financeAuthorized,false);
 assert.equal(result.financeRelease,'NO_GO');
 assert.equal(f.stats.batches,2);
 assert.equal(f.stats.writes,0);
 assert.equal(f.raw.prepare('SELECT total_changes() n').get().n,before,
  'no source DB change from any readiness scan');
 assert.equal(JSON.stringify(result).includes('FAKE CUSTOMER'),false);
 assert.equal(JSON.stringify(result).includes('FAKE PHONE'),false);
 assert.equal(JSON.stringify(result).includes('acc262:isolated:evidence:sample'),false);
}));
test('ACC262 refuses wrong customer ID instead of phone/name match',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 const r=await call(f,{expectedOfficialCustomerId:'CUST262-FORGED-02'});
 assert.equal(r.success,false);
 assert.equal(r.code,'ACC262_CUSTOMER_CAPTURE_SOURCE_LINEAGE_MISMATCH');
}));
test('ACC262 refuses inactive or changed-version existing official customer row',async()=>{
 for(const query of [
  "UPDATE t12_customers SET active='لا' WHERE customer_id='CUST262-FAKE-01'",
  "UPDATE t12_customers SET version=2 WHERE customer_id='CUST262-FAKE-01'"
 ])await withFixture({captureTables:true,captureRow:true},async f=>{
  f.raw.exec(query);
  const r=await call(f);
  assert.equal(r.code,'ACC262_CUSTOMER_CAPTURE_SOURCE_LINEAGE_MISMATCH');
 });
});
test('ACC262 source capture uses immutable external ID equality, not caller-supplied data',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 f.raw.exec("UPDATE t12_prod_orders SET external_customer_id='CHANGED-CODE' WHERE order_id='4323'");
 const r=await call(f);
 assert.equal(r.code,'ACC262_CUSTOMER_CAPTURE_SOURCE_LINEAGE_MISMATCH');
}));
test('ACC262 verifies original actor and request ledger chain not plain customer copy',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 f.raw.exec("UPDATE t12_prod_orders SET actor='ANOTHER-ACTOR' WHERE order_id='4323'");
 const r=await call(f);
 assert.equal(r.success,false);
 assert.equal(r.financeAuthorized,false);
}));
test('ACC262 original native revoked staff cannot make any customer readiness claim',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 f.raw.prepare('UPDATE employee_auth_sessions_v1 SET revoked_at_ms=?').run(NOW-1);
 const r=await call(f);
 assert.equal(r.code,'ACC262_NATIVE_EMPLOYEE_OR_ORDER_NOT_VERIFIED');
 assert.equal(r.financeAuthorized,false);
}));
test('ACC262 rejects mode OFF, spoofed legacy orders and missing native verifier',()=>withFixture({captureTables:true,captureRow:true},async f=>{
 assert.equal((await call(f,{mode:'OFF'})).code,'ACC262_DEFAULT_OFF');
 assert.equal((await call(f,{orderId:'sheet_rows:4323'})).success,false);
 assert.equal((await call(f,{verifyOriginalNativeSession:null})).success,false);
 assert.equal((await call(f,{expectedOfficialCustomerId:'FAKE PHONE'})).success,false);
}));
test('ACC262 signed ACC261 operational intent cannot be finance approval',()=>{
 const e={event_type:'operational_review_intent',
  contract_version:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  evidence_refs:['acc261:review:fake']};
 const r=classify({event:e,captureReview:{captureShapeMatched:true}});
 assert.equal(r.code,'ACC262_OPERATIONAL_REVIEW_INTENT_NOT_FINANCE_APPROVAL');
 assert.equal(r.financeAuthorized,false);
});
test('ACC262 unsigned or fake order_line_approved never gets EasyStore posting rights',()=>{
 const evt={event_type:'order_line_approved',
  contract_version:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  evidence_refs:['proof:unverified']};
 for(const e of [
  {...evt,contract_version:'FAKE_V2'},
  {...evt,evidence_refs:[]},
  evt
 ]){
  const r=classify({event:e,captureReview:{captureShapeMatched:true}});
  assert.equal(r.financeAuthorized,false);
  assert.equal(r.canPostInvoice,false);
  assert.equal(r.canPublishToEasyStore,false);
  assert.equal(r.officialCustomerOwnerAttested,false);
 }
 assert.equal(classify({event:evt}).code,
  'ACC262_REAL_SOURCE_SIGNER_AND_OFFICIAL_OWNER_MISSING');
});
test('ACC262 module not deployed/linked into public or finance Worker',()=>{
 const main=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(main.includes('acc262'),false);
 assert.equal(main.includes('t12-original-at-create-finance-readiness'),false);
 assert.equal(POLICY.invoiceAllowed,false);
 assert.equal(POLICY.realSignedFinancialApproval,false);
});
