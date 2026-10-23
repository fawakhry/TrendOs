import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
 inspectT12EmployeeOrderFinanceCandidate as inspect,
 T12_EMPLOYEE_INTAKE_ORDER_SQL as ORDER,
 T12_EMPLOYEE_INTAKE_LINES_SQL as LINES,
 T12_EMPLOYEE_FINANCE_INTAKE_POLICY as POLICY
} from '../cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs';
const C='CUS-FAKE-228',ORDER_ID='4323',KEY='cld1_1800000000000_EMPLOYEE228_TEST0001';
const A='service-actor-228';
function fixture(lanes=2){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0005_t12_production_create_canary.sql',
    '0008_t12_customer_master.sql',
    '0035_t12_order_customer_at_create_sourceonly_v1.sql']){
  raw.exec(readFileSync('cloudflare-d1/migrations/'+file,'utf8'));
 }
 raw.prepare("INSERT INTO t12_customers (customer_id,customer_name,customer_name_key,source,version) VALUES (?,'FAKE CLIENT','fake client','cloud-native',1)").run(C);
 raw.prepare("INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,?, 'FAKE_POLICY','{}',?,'COMMITTED')").run(KEY,A,ORDER_ID);
 raw.prepare("INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,source,notes,actor) VALUES (?,?,'external','FAKE CLIENT','01000000000','999002',?,'عادي','طلب جديد','T12 General Create','',?)").run(ORDER_ID,KEY,lanes===2?'متعدد الأقسام':'طباعة',A);
 const rows=[
   {department:'طباعة',who:'وائل',name:'FAKE MUG - طباعة'},
   {department:'ليزر',who:'جابر',name:'FAKE MUG - ليزر'}];
 for(let i=0;i<lanes;i++){
  const l=rows[i];
  raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES (?,?,?,?,?,?,?,1,'عادي','طلب جديد',0,0)")
   .run(ORDER_ID+'-'+String(i+1).padStart(2,'0'),ORDER_ID,KEY,i+1,l.department,l.who,l.name);
 }
 raw.exec("UPDATE t12_order_customer_at_create_control_v1 SET mode='ISOLATED'");
 raw.prepare("INSERT INTO t12_order_customer_at_create_v1 (order_id,request_key,customer_id,external_customer_id,customer_version,actor_subject,evidence_ref,selector_role,selector_session_sha256,selector_issued_at,selector_expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  .run(ORDER_ID,KEY,C,'999002',1,A,'FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE',
      'service','a'.repeat(64),1800000000,1800000600);
 let batches=0;
 const db={
  prepare(sql){
   assert.ok(sql===ORDER||sql===LINES,'no arbitrary SQL');
   return {bind(...args){
    return {kind:sql,params:args,first(){throw Error('UNSAFE_SEPARATE_FIRST')},
      all(){throw Error('UNSAFE_SEPARATE_ALL')}};
   }};
  },
  async batch(list){
   batches++;
   raw.exec('SAVEPOINT acc228_read');
   try{return list.map(x=>({success:true,results:raw.prepare(x.kind).all(...x.params)}));}
   finally{raw.exec('RELEASE SAVEPOINT acc228_read');}
  }
 };
 return {raw,db,batches:()=>batches,dispose(){raw.close()}};
}
async function withFixture(fn,lanes=2){
 const x=fixture(lanes);try{return await fn(x);}finally{x.dispose();}
}
const request=x=>inspect({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C});
test('new source has no HTTP endpoint, T12/finance creation, or direct D1 finance link',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const source=readFileSync('cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs','utf8');
 assert.doesNotMatch(worker,/t12-employee-order-finance-intake-sourceonly/);
 assert.doesNotMatch(source,/createT12GeneralOrder\s*\(|saveAccountingFinalInvoice\s*\(|fetch\s*\(|INSERT INTO|UPDATE\s+(employee_accounting|t12_prod)/);
 assert.equal(POLICY.workerEntryWired,false);
 assert.equal(POLICY.httpRouteAvailable,false);
 assert.equal(POLICY.usesOfficialNativeCustomerId,true);
 assert.equal(POLICY.departmentApprovalsVerified,false);
 assert.equal(POLICY.financeWriteAuthorized,false);
 assert.equal(POLICY.productionRelease,'NO_GO');
});
test('committed employee T12 with immutable at-create source and 2 full lanes yields NON-FINANCIAL preview',()=>withFixture(async x=>{
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const res=await request(x);
 assert.equal(res.status,200,JSON.stringify(res));
 assert.equal(res.body.operationalSourceShapeVerified,true);
 assert.equal(res.body.officialCustomerId,C);
 assert.equal(res.body.orderId,ORDER_ID);
 assert.equal(res.body.lineCount,2);
 assert.deepEqual(res.body.lines.map(l=>l.department),['طباعة','ليزر']);
 assert.deepEqual(res.body.lines.map(l=>l.lineId),['4323-01','4323-02']);
 assert.equal(res.body.officialCustomerOwnershipAttested,false);
 assert.equal(res.body.canRequestInvoice,false);
 assert.equal(res.body.financeAuthorized,false);
 assert.equal(res.body.departmentApprovalsVerified,false);
 assert.equal(res.body.connectorEventPublished,false);
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 for(const secret of ['FAKE CLIENT','01000000000','999002','FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE','a'.repeat(64)]){
  assert.equal(JSON.stringify(res).includes(secret),false);
 }
}));
test('single Print department source is valid, but still no finance release',()=>withFixture(async x=>{
 const r=await request(x);
 assert.equal(r.status,200);
 assert.equal(r.body.lineCount,1);
 assert.equal(r.body.canRequestInvoice,false);
},1));
test('missing original ACC223 source capture cannot authorize owner by order name/phone',()=>withFixture(async x=>{
 x.raw.exec("DELETE FROM t12_order_customer_at_create_v1"); // trigger must prevent
},1).then(()=>assert.fail('immutable trigger should reject delete')).catch(e=>assert.match(String(e),/ACC223_SOURCE_CAPTURE_IMMUTABLE/)));
test('wrong exact customer ID, missing session-bound capture and wrong version fail closed',()=>withFixture(async x=>{
 assert.equal((await inspect({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:'CUS-OTHER'})).status,409);
 x.raw.exec("UPDATE t12_customers SET version=2 WHERE customer_id='CUS-FAKE-228'");
 const r=await request(x);
 assert.equal(r.status,409);
 assert.equal(r.body.code,'OFFICIAL_CUSTOMER_CAPTURE_NOT_MATCHING_OR_UNATTESTED');
}));
test('PREPARED, changed original actor, modified external customer ID are blocked',()=>withFixture(async x=>{
 for(const [sql,code] of [
  ["UPDATE t12_prod_request_ledger SET status='PREPARED'",'T12_ORDER_NOT_COMMITTED_OR_ACTOR_CONFLICT'],
  ["UPDATE t12_prod_request_ledger SET status='COMMITTED'; UPDATE t12_prod_orders SET actor='FAKE-SWAP'",'T12_ORDER_NOT_COMMITTED_OR_ACTOR_CONFLICT'],
  ["UPDATE t12_prod_orders SET actor='service-actor-228'; UPDATE t12_prod_orders SET external_customer_id='123456'",'T12_IMMUTABLE_SELECTOR_EVIDENCE_MISMATCH']
 ]){
  x.raw.exec(sql);
  const res=await request(x);
  assert.equal(res.status,409);
  assert.equal(res.body.code,code);
 }
}));
test('missing/extra/cross-order/incorrectly assigned Print+Laser lines fail closed',()=>withFixture(async x=>{
 x.raw.exec("UPDATE t12_prod_lines SET assigned_to='دخيل' WHERE line_id='4323-02'");
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
 x.raw.exec("UPDATE t12_prod_lines SET assigned_to='جابر' WHERE line_id='4323-02'");
 x.raw.exec("DELETE FROM t12_prod_lines WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-01',?,?,1,'طباعة','وائل','FAKE',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 assert.equal((await request(x)).status,200);
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-03',?,?,3,'ليزر','جابر','UNEXPECTED',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
}));
test('without D1 batch, broken transaction or broken schema return generic fail closed',async()=>{
 const lacking=await inspect({db:{prepare(){}},orderId:ORDER_ID,expectedOfficialCustomerId:C});
 assert.equal(lacking.status,503);
 await withFixture(async x=>{
  x.db.batch=async()=>[{success:true,results:[]},{success:false,results:[]}];
  assert.equal((await request(x)).status,503);
  x.db.batch=async()=>{throw Error('PRIVATE_CUSTOMER_DATA_SQL');};
  const bad=await request(x);
  assert.equal(bad.status,503);
  assert.equal(JSON.stringify(bad).includes('PRIVATE_CUSTOMER_DATA_SQL'),false);
 });
});
