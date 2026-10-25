import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
 ACC257_PLATFORM_CONTEXT_POLICY as POLICY,
 inspectPlatformNativeOrderContextReadOnly as inspect,
 ACC257_PLATFORM_ORDER_SQL as ORDER,
 ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,
 ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';
const ID='4323',KEY='cld1_FAKE_OPERATIONAL_CREATED_257',ACTOR='owner-fake';
function fixture(laneCount=2) {
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 // Reuse ACTUAL original TrendOS migrations as text fixture, not Stage/production
 // DDL. No customer 0008, at-create ownership 0035 or EasyStore finance table.
 for(const name of ['0005_t12_production_create_canary','0006_t12_operational_runtime']){
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+name+'.fixture.sql.txt','utf8'));
 }
 raw.prepare(`INSERT INTO t12_prod_request_ledger
 (request_key,actor,policy_epoch,canonical_json,order_id,status)
 VALUES (?,?,'synthetic','{}',?,'COMMITTED')`).run(KEY,ACTOR,ID);
 raw.prepare(`INSERT INTO t12_prod_orders
 (order_id,request_key,customer_mode,customer_name,customer_phone,
 external_customer_id,department,priority,status,actor)
 VALUES (?,?,'external','FAKE PRIVATE CUSTOMER','010_FAKE_PII','999_FAKE',
 ?,'عادي','طلب جديد',?)`).run(ID,KEY,laneCount===2?'متعدد الأقسام':'طباعة',ACTOR);
 const people=[{department:'طباعة',name:'وائل'},{department:'ليزر',name:'جابر'}];
 for(let i=0;i<laneCount;i++){
  const id=ID+'-'+String(i+1).padStart(2,'0'),part=people[i];
  raw.prepare(`INSERT INTO t12_prod_lines
    (line_id,order_id,request_key,ordinal,department,assigned_to,
    item_name,qty,priority,status,heat_press,fly_print)
    VALUES(?,?,?,?,?,?,'FAKE DOCUMENT',1,'عادي','طلب جديد',0,0)`)
   .run(id,ID,KEY,i+1,part.department,part.name);
  raw.prepare(`INSERT INTO t12_prod_outbox
    (request_key,event_key,order_id,line_id,event_type,status,payload_json)
    VALUES (?,?,?,?,'trend-master-status-intent','pending','{}')`)
   .run(KEY,'queue:'+String(i+1).padStart(2,'0'),ID,id);
 }
 raw.prepare(`INSERT INTO t12_prod_events
   (request_key,event_key,order_id,event_type,payload_json)
   VALUES (?,'activity',?,'order-create','{}')`).run(KEY,ID);
 for(const table of ['t12_prod_orders','t12_prod_request_ledger',
  't12_prod_lines','t12_prod_outbox','t12_prod_events']){
  raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'");
 }
 let batches=0;
 const allowed=new Set([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME]);
 const db={
  prepare(sql){
   assert.ok(allowed.has(sql),'Unexpected SQL in operational reader');
   return {bind(...args){return {sql,args,
    first(){throw Error('NONATOMIC_FIRST_NOT_ALLOWED')},
    all(){throw Error('NONATOMIC_ALL_NOT_ALLOWED')}};}};
  },
  async batch(statements){
   batches++;
   raw.exec('SAVEPOINT fake_acc257');
   try{return statements.map(q=>({
    success:true,results:raw.prepare(q.sql).all(...q.args)
   }));}finally{raw.exec('RELEASE SAVEPOINT fake_acc257')}
  }
 };
 return {raw,db,batches:()=>batches,close:()=>raw.close()};
}
async function withFixture(fn,lines=2){
 const f=fixture(lines);try{return await fn(f)}finally{f.close()}
}
const run=f=>inspect({db:f.db,orderId:ID});
test('ACC257 reads EXISTING platform order/Print+Laser without any customer master/0035 schema',()=>withFixture(async f=>{
 const tables=f.raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 assert.equal(tables.includes('t12_order_customer_at_create_v1'),false);
 assert.equal(tables.includes('t12_customers'),false);
 const baseline=f.raw.prepare('SELECT total_changes() n').get().n;
 const r=await run(f);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.sourceSystem,'trendos_t12_native');
 assert.equal(r.body.sourceCreatedAt,'2026-09-21T14:13:20Z');
 assert.deepEqual(r.body.lines,[
  {lineId:'4323-01',department:'طباعة',ordinal:1},
  {lineId:'4323-02',department:'ليزر',ordinal:2}
 ]);
 assert.deepEqual(r.body.operationalRevision.lineVersions,[
  {lineId:'4323-01',version:0},{lineId:'4323-02',version:0}
 ]);
 assert.equal(r.body.customerIdentity,'UNVERIFIED_NOT_INCLUDED');
 assert.equal(r.body.customerOwnershipAttested,false);
 assert.equal(r.body.financeAuthorized,false);
 assert.equal(r.body.canRequestInvoice,false);
 assert.equal(r.body.realSignedLineApprovalsVerified,false);
 assert.equal(r.body.posted,false);
 assert.equal(JSON.stringify(r.body).includes('FAKE PRIVATE CUSTOMER'),false);
 assert.equal(JSON.stringify(r.body).includes('010_FAKE_PII'),false);
 assert.equal(JSON.stringify(r.body).includes('999_FAKE'),false);
 assert.equal(f.batches(),1);
 assert.equal(f.raw.prepare('SELECT total_changes() n').get().n,baseline);
}));
test('ACC257 supports single native print lane with original order identity',()=>withFixture(async f=>{
 const r=await run(f);
 assert.equal(r.status,200);
 assert.equal(r.body.lines.length,1);
 assert.equal(r.body.lines[0].lineId,'4323-01');
},1));
test('ACC257 has no financial authority, customer identity or live service exposure',()=>{
 assert.equal(POLICY.sourceSystem,'trendos_t12_native');
 assert.equal(POLICY.requiresAtCreateCustomerCapture,false);
 assert.equal(POLICY.returnsCustomerIdentity,false);
 assert.equal(POLICY.financialWritesAllowed,false);
 assert.equal(POLICY.actualCloudflareWorkerWired,false);
 assert.equal(POLICY.productionRelease,'NO_GO');
 const main=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(main.includes('t12-platform-order-context-readonly-acc257'),false);
});
test('ACC257 does not use legacy mirror or finance D1 via SQL and requires same D1 batch',()=>withFixture(async f=>{
 for(const sql of [ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME]){
  assert.doesNotMatch(sql,/\bsheet_rows\b|\borders\b|easystore|customer_name|customer_phone|external_customer_id|0035|t12_customers/i);
 }
 assert.equal((await run(f)).status,200);
 assert.equal(f.batches(),1);
 const noBatch=await inspect({db:{prepare:f.db.prepare},orderId:ID});
 assert.equal(noBatch.status,409);
 const throwBatch=await inspect({db:{prepare:f.db.prepare,batch:async()=>{throw Error('PRIVATE DB ERROR')}},orderId:ID});
 assert.equal(throwBatch.status,409);
 assert.equal(JSON.stringify(throwBatch).includes('PRIVATE DB ERROR'),false);
}));
test('ACC257 rejects canceled native Print/Laser runtime before source context',()=>withFixture(async f=>{
 f.raw.prepare(`INSERT INTO t12_prod_line_runtime
 (line_id,order_id,status,updated_by,version) VALUES
 ('4323-02','4323','ملغى','fake-gaber',1)`).run();
 f.raw.prepare(`INSERT INTO t12_prod_runtime_events
 (order_id,line_id,event_type,old_status,new_status,actor)
 VALUES ('4323','4323-02','line-update','طلب جديد','ملغى','fake-gaber')`).run();
 const r=await run(f);assert.equal(r.status,409);
 assert.equal(r.body.financeAuthorized,false);
}));
test('ACC257 tracks native runtime revision after valid operation, still cannot bill',()=>withFixture(async f=>{
 f.raw.prepare(`INSERT INTO t12_prod_line_runtime
 (line_id,order_id,status,updated_by,version) VALUES
 ('4323-01','4323','بدأ التنفيذ','fake-wael',1)`).run();
 f.raw.prepare(`INSERT INTO t12_prod_runtime_events
 (order_id,line_id,event_type,old_status,new_status,actor)
 VALUES ('4323','4323-01','line-update','طلب جديد','بدأ التنفيذ','fake-wael')`).run();
 const r=await run(f);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.deepEqual(r.body.operationalRevision.lineVersions.map(x=>x.version),[1,0]);
 assert.equal(r.body.financeAuthorized,false);
}));
test('ACC257 rejects mutated line identity, duplicate department or failed outbox',()=>withFixture(async f=>{
 f.raw.exec("UPDATE t12_prod_outbox SET status='failed' WHERE line_id='4323-01'");
 assert.equal((await run(f)).status,409);
 f.raw.exec("UPDATE t12_prod_outbox SET status='pending' WHERE line_id='4323-01'");
 f.raw.exec("UPDATE t12_prod_lines SET assigned_to='wrong-worker' WHERE line_id='4323-01'");
 assert.equal((await run(f)).status,409);
 f.raw.exec("UPDATE t12_prod_lines SET assigned_to='وائل' WHERE line_id='4323-01'");
 f.raw.exec("UPDATE t12_prod_lines SET department='طباعة', assigned_to='وائل' WHERE line_id='4323-02'");
 assert.equal((await run(f)).status,409);
}));
test('ACC257 rejects noncommitted ledger, mismatched line, missing source create activity',()=>withFixture(async f=>{
 f.raw.exec("UPDATE t12_prod_request_ledger SET status='PREPARED'");
 assert.equal((await run(f)).status,409);
 f.raw.exec("UPDATE t12_prod_request_ledger SET status='COMMITTED'");
 f.raw.exec("DELETE FROM t12_prod_events WHERE event_key='activity'");
 assert.equal((await run(f)).status,409);
}));
test('ACC257 rejects original source timestamp mutation and partial outbox',()=>withFixture(async f=>{
 f.raw.exec("UPDATE t12_prod_orders SET created_at='2026-09-21 15:44:00'");
 assert.equal((await run(f)).status,409);
 f.raw.exec("UPDATE t12_prod_orders SET created_at='2026-09-21 14:13:20'");
 f.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:02'");
 assert.equal((await run(f)).status,409);
}));
test('ACC257 exact invalid order id, nonexistent ID and unqualified D1 reader fail closed',()=>withFixture(async f=>{
 assert.equal((await inspect({db:f.db,orderId:' bad '})).status,409);
 assert.equal((await inspect({db:f.db,orderId:'missing'})).status,409);
 assert.equal((await inspect({db:null,orderId:ID})).status,409);
 assert.equal((await inspect({db:f.db,orderId:ID+'\u0000'})).status,409);
}));
