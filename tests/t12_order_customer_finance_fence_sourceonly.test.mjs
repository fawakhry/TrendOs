import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {inspectOfficialT12OrderCustomerShape} from '../cloudflare-d1/src/t12-order-customer-finance-fence-sourceonly.mjs';

function dbSource(){
  const db=new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  for(const migration of [
    '0005_t12_production_create_canary.sql',
    '0008_t12_customer_master.sql'
  ])db.exec(readFileSync(new URL('../cloudflare-d1/migrations/'+migration,import.meta.url),'utf8'));
  db.prepare('INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source) VALUES(?,?,?,?)')
    .run('CUS-FAKE-1','عميل اختبار','عميل اختبار','cloud-native');
  db.prepare('INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES(?,?,?,?,?,?)')
    .run('FAKE-REQ-0001','FAKE_OPERATOR','fake','{}','FAKE-ORDER-1','COMMITTED');
  db.prepare('INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run('FAKE-ORDER-1','FAKE-REQ-0001','خارجي','عميل اختبار','0000000000','CUS-FAKE-1','متعدد الأقسام','عادي','طلب جديد','FAKE_OPERATOR');
  db.prepare('INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('FAKE-PRINT-1','FAKE-ORDER-1','FAKE-REQ-0001',1,'طباعة','وائل','لوحة',1,'عادي','طلب جديد',0,0);
  db.prepare('INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('FAKE-LASER-2','FAKE-ORDER-1','FAKE-REQ-0001',2,'ليزر','جابر','حفر',1,'عادي','طلب جديد',0,0);
  const wrapper={
    prepare(sql){
      const native=db.prepare(sql);
      return {
        all(){return native.all()},
        first(){return native.get()},
        bind(...params){return {all(){return native.all(...params)},first(){return native.get(...params)}}}
      };
    }
  };
  return {db,wrapper};
}
const proof=()=>({
  orderId:'FAKE-ORDER-1',customerId:'CUS-FAKE-1',
  expectedLineIds:['FAKE-PRINT-1','FAKE-LASER-2']
});
function noGo(x){
  assert.equal(x.success,false);
  assert.equal(x.postingAllowed,false);
  assert.equal(x.financeAuthorized,false);
  assert.equal(x.ownerAttested,false);
  assert.equal(x.provenanceVerified,false);
  assert.equal(x.liveRuntimeVerified,false);
}
test('existing ORIGINAL T12 order FK is missing; untrusted external ID is not money evidence',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,proof());
 noGo(result);
 assert.equal(result.code,'OFFICIAL_CUSTOMER_ID_AND_FK_NOT_IN_SCHEMA');
 assert.equal(result.sourceShapeQualified,false);
});
test('an external customer name/phone match still cannot bypass missing FK',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,{
   ...proof(),customerId:'CUS-FAKE-1'});
 noGo(result);
 assert.equal(result.code,'OFFICIAL_CUSTOMER_ID_AND_FK_NOT_IN_SCHEMA');
});
test('future add-on FK remains ONLY shape evidence; it NEVER authorizes money',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,proof());
 noGo(result);
 assert.equal(result.code,'RELATIONAL_SHAPE_ONLY_UNATTESTED');
 assert.equal(result.sourceShapeQualified,true);
 assert.equal(result.lineCount,2);
});
test('FK matched wrong customer is denied even if customer records exist',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,{...proof(),customerId:'CUS-WRONG'});
 noGo(result);assert.equal(result.code,'ORDER_CUSTOMER_NOT_EXACT');
});
test('inactive customer is rejected',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 db.prepare('UPDATE t12_customers SET active=? WHERE customer_id=?').run('لا','CUS-FAKE-1');
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,proof());
 noGo(result);assert.equal(result.code,'OFFICIAL_CUSTOMER_INACTIVE_OR_MISSING');
});
test('prepared/uncommitted production ledger prevents shape qualification',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 db.prepare('UPDATE t12_prod_request_ledger SET status=? WHERE request_key=?').run('PREPARED','FAKE-REQ-0001');
 const result=await inspectOfficialT12OrderCustomerShape(wrapper,proof());
 noGo(result);assert.equal(result.code,'ORDER_CREATION_NOT_COMMITTED');
});
test('partial / cross-order line set rejected; duplicate submitted line id stopped',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 for(const lines of [
   ['FAKE-PRINT-1'],['FAKE-LASER-2'],['FAKE-PRINT-1','FOREIGN-1']
 ]){
   const result=await inspectOfficialT12OrderCustomerShape(wrapper,{...proof(),expectedLineIds:lines});
   noGo(result);assert.equal(result.code,'INCOMPLETE_OR_CROSS_ORDER_LINE_SET');
 }
 const dup=await inspectOfficialT12OrderCustomerShape(wrapper,
    {...proof(),expectedLineIds:['FAKE-PRINT-1','FAKE-PRINT-1']});
 noGo(dup);assert.equal(dup.code,'INVALID_OR_DUPLICATED_EXACT_IDS');
});
test('untrusted IDs / missing source or SQL read failure never become authority',async()=>{
 const {db,wrapper}=dbSource();
 try{
   for(const bad of [null,{}, {orderId:'\u202eX',customerId:'CUS-FAKE-1',expectedLineIds:['X']},
     {orderId:'FAKE-ORDER-1',customerId:'CUS-FAKE-1',expectedLineIds:[]} ]){
     const out=await inspectOfficialT12OrderCustomerShape(wrapper,bad);
     noGo(out);
   }
   const missing=await inspectOfficialT12OrderCustomerShape(null,proof());
   noGo(missing);assert.equal(missing.code,'READONLY_DB_AND_REQUEST_REQUIRED');
   const broken=await inspectOfficialT12OrderCustomerShape({prepare(){throw Error('fake sqlite unavailable')}},proof());
   noGo(broken);assert.equal(broken.code,'OFFICIAL_SOURCE_READ_UNAVAILABLE');
 }finally{db.close()}
});
test('asynchronous Cloudflare D1 style {results} / Promise first remains NO_GO',async t=>{
 const {db,wrapper}=dbSource();t.after(()=>db.close());
 db.exec('ALTER TABLE t12_prod_orders ADD COLUMN customer_id TEXT REFERENCES t12_customers(customer_id)');
 db.prepare('UPDATE t12_prod_orders SET customer_id=? WHERE order_id=?').run('CUS-FAKE-1','FAKE-ORDER-1');
 const asyncD1={
   prepare(sql){
     const original=wrapper.prepare(sql);
     return {
       all:async()=>({results:original.all()}),
       first:async()=>original.first(),
       bind(...args){
         const bound=original.bind(...args);
         return {all:async()=>({results:bound.all()}),first:async()=>bound.first()};
       }
     };
   }
 };
 const result=await inspectOfficialT12OrderCustomerShape(asyncD1,proof());
 noGo(result);
 assert.equal(result.code,'RELATIONAL_SHAPE_ONLY_UNATTESTED');
 assert.equal(result.sourceShapeQualified,true);
});
test('ACC222 source-only tests are not owner deployment approval',()=>{
 console.log('ACC222_OFFICIAL_CORE_CUSTOMER_FK_EXISTING=ABSENT');
 console.log('ACC222_EXTERNAL_CUSTOMER_ID_NOT_A_FINANCE_FK=PASS');
 console.log('ACC222_FUTURE_RELATIONAL_SHAPE_STILL_NOT_AUTHORITY=PASS');
 console.log('ACC222_REAL_TRUSTED_SSO_SOURCE=NOT_VERIFIED');
 console.log('ACC222_LEDGER_POSTING=ZERO');
 console.log('ACC222_FINANCE_RELEASE=NO_GO');
});
