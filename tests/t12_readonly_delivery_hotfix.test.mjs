import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {t12DeliveryForCreation,cairoCreationDate} from '../cloudflare-d1/src/t12-delivery-date-policy.mjs';
import {mapT12CloudNativeRows,readT12CloudNativeOverlay} from '../cloudflare-d1/src/t12-read-overlay.mjs';

const observed=[
 ['5685','2026-11-01 15:40:11','2026-11-03'],
 ['5724','2026-11-02 14:14:09','2026-11-04'],
 ['5741','2026-11-02 18:49:04','2026-11-04'],
 ['5743','2026-11-02 18:59:22','2026-11-04'],
 ['5744','2026-11-02 19:02:22','2026-11-04']
];
const mock=(id,created,fly=0)=>({
 orderId:id,lineId:id+'-01',ordinal:1,department:'طباعة',assignedTo:'',
 itemName:'fixture',qty:1,priority:'عادي',status:'طلب جديد',
 heatPress:0,flyPrint:fly,lineCreatedAt:created,lineUpdatedAt:created,
 customerMode:'registered',customerName:'Fixture',customerPhone:'',
 externalCustomerId:'',source:'fixture',notes:'',
 orderCreatedAt:created,orderUpdatedAt:created
});

test('five verified Cloudflare D1 order creation times yield exact fixed calendar delivery dates',()=>{
 for(const [id,created,due] of observed){
  assert.equal(t12DeliveryForCreation(created,0),due);
  const row=mapT12CloudNativeRows([mock(id,created)],'print')[0];
  assert.equal(row.expectedDeliveryAt,due);
  assert.equal(row.receivedAt,created);
  assert.equal(row.deliveryDateSource,'policy-derived-legacy-unverified');
  assert.match(row.expectedDeliveryText,/محسوب حسب سياسة النظام/);
  assert.doesNotMatch(row.expectedDeliveryText,/^2026-11-01$/);
 }
});

test('same-day fly-print and Cairo midnight/DST are calculated from original creation',()=>{
 assert.equal(t12DeliveryForCreation('2026-11-02 18:49:04',1),'2026-11-02');
 assert.equal(t12DeliveryForCreation('2026-11-02 18:49:04',0),'2026-11-04');
 assert.equal(cairoCreationDate('2026-11-02 23:40:00'),'2026-11-03');
 assert.equal(t12DeliveryForCreation('2026-11-02 23:40:00',0),'2026-11-05');
 const row=mapT12CloudNativeRows([mock('5741','2026-11-02 18:49:04',1)],'service')[0];
 assert.match(row.expectedDeliveryText,/نفس اليوم/);
 assert.equal(t12DeliveryForCreation('',0),'');
});

test('uses old production D1 schema (no new columns) and never changes existing order rows',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0005_t12_production_create_canary.sql',import.meta.url),'utf8'));
 db.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0006_t12_operational_runtime.sql',import.meta.url),'utf8'));
 for(const [id,created] of observed){
  db.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) VALUES(?,?,?,?,?,'COMMITTED','{}')")
   .run('req_'+id,'owner','test','{}',id);
  db.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,department,priority,status,actor,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
   .run(id,'req_'+id,'registered','Fixture','طباعة','عادي','طلب جديد','owner',created);
  db.prepare("INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,item_name,qty,priority,status,heat_press,fly_print,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
   .run(id+'-01',id,'req_'+id,1,'طباعة','Fixture',1,'عادي','طلب جديد',0,0,created);
 }
 const wrapper={DB:{prepare(sql){return {async first(){return db.prepare(sql).get()||null},async all(){return {results:db.prepare(sql).all()}}}}}};
 const before=db.prepare("SELECT COUNT(*) AS n FROM t12_prod_orders").get();
 const result=await readT12CloudNativeOverlay(wrapper,'print');
 assert.equal(result.rows.length,5);
 for(const [id,created,due] of observed){
  const row=result.rows.find(x=>x.orderId===id);
  assert.ok(row);
  assert.equal(row.expectedDeliveryAt,due);
  assert.equal(row.receivedAt,created);
 }
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM t12_prod_orders").get().n,before.n);
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('t12_prod_orders') WHERE name='expected_delivery_date'").get().n,0);
});

test('hotfix changes only read result; no mutation or schema dependency in source',()=>{
 const code=fs.readFileSync(new URL('../cloudflare-d1/src/t12-read-overlay.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\b(?:INSERT\s+INTO|UPDATE\s+t12_prod|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i);
 assert.doesNotMatch(code,/expected_delivery_date/i);
 assert.match(code,/t12DeliveryForCreation/);
});
