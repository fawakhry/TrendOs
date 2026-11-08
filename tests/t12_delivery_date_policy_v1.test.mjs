import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {cairoCreationDate,t12DeliveryForCreation,validStoredDeliveryDay} from '../cloudflare-d1/src/t12-delivery-date-policy.mjs';
import {mapT12CloudNativeRows,readT12CloudNativeOverlay} from '../cloudflare-d1/src/t12-read-overlay.mjs';

const ids=[
  ['5685','2026-11-01 15:40:11','2026-11-03'],
  ['5724','2026-11-02 14:14:09','2026-11-04'],
  ['5741','2026-11-02 18:49:04','2026-11-04'],
  ['5743','2026-11-02 18:59:22','2026-11-04'],
  ['5744','2026-11-02 19:02:22','2026-11-04']
];

function sample(orderId='5741', created='2026-11-02 18:49:04', flyPrint=0){
 return {
  lineId:orderId+'-01', orderId, ordinal:1,department:'طباعة',assignedTo:'',
  itemName:'Test item',qty:1,priority:'عادي',status:'طلب جديد',heatPress:0,flyPrint,
  customerMode:'registered',customerName:'Fixture',customerPhone:'',
  externalCustomerId:'',source:'fixture',notes:'',orderCreatedAt:created,
  lineCreatedAt:created,orderUpdatedAt:created,lineUpdatedAt:created,
  lineExpectedDeliveryDate:'',orderExpectedDeliveryDate:''
 };
}

test('actual owner-reported D1 creation instants yield stable policy dates for five orders',()=>{
 for(const [id,created,due] of ids){
  assert.equal(t12DeliveryForCreation(created,0),due,id);
  const row=mapT12CloudNativeRows([sample(id,created,0)],'print')[0];
  assert.equal(row.expectedDeliveryAt,due,id);
  assert.equal(row.deliveryDateSource,'policy-derived-legacy-unverified');
  assert.match(row.expectedDeliveryText,/محسوب حسب سياسة النظام/);
 }
});

test('same-day fly-print, Cairo DST and local-midnight changes never depend on read day',()=>{
 assert.equal(t12DeliveryForCreation('2026-11-02 23:30:00',1),'2026-11-03');
 assert.equal(t12DeliveryForCreation('2026-11-02 23:30:00',0),'2026-11-05');
 assert.equal(cairoCreationDate('2026-11-02 23:30:00'),'2026-11-03');
 assert.equal(t12DeliveryForCreation('2026-10-29 22:30:00',0), '2026-11-01');
 const sameDay=mapT12CloudNativeRows([sample('6001','2026-11-02 18:49:04',1)],'print')[0];
 assert.equal(sameDay.expectedDeliveryAt,'2026-11-02');
 assert.match(sameDay.expectedDeliveryText,/نفس اليوم/);
 assert.equal(t12DeliveryForCreation('',0),'');
 assert.equal(validStoredDeliveryDay('2026-02-30'),'');
});

test('explicit persisted date beats any historical computed date, even when overdue',()=>{
 const row=sample('6002','2026-11-02 18:49:04');
 row.lineExpectedDeliveryDate='2026-11-06';
 row.lineExpectedDeliverySource='policy-at-create-v1';
 row.orderExpectedDeliveryDate='2026-11-04';
 assert.equal(mapT12CloudNativeRows([row],'print')[0].expectedDeliveryAt,'2026-11-06');
 assert.equal(mapT12CloudNativeRows([row],'print')[0].deliveryDateSource,'policy-at-create-v1');
 assert.doesNotMatch(mapT12CloudNativeRows([row],'print')[0].expectedDeliveryText,/محسوب/);
});

test('schema migration is additive and does not backfill or change any preexisting order',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0005_t12_production_create_canary.sql',import.meta.url),'utf8'));
 db.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) VALUES(?,?,?,?,?,'COMMITTED','{}')")
  .run('fixture_req_5741','owner','test_epoch','{}','5741');
 db.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,department,priority,status,actor,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
  .run('5741','fixture_req_5741','registered','Fixture','طباعة','عادي','طلب جديد','owner','2026-11-02 18:49:04');
 db.prepare("INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,item_name,qty,priority,status,heat_press,fly_print,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
  .run('5741-01','5741','fixture_req_5741',1,'طباعة','Test',1,'عادي','طلب جديد',0,0,'2026-11-02 18:49:04');
 const old=db.prepare('SELECT created_at FROM t12_prod_orders WHERE order_id=?').get('5741');
 db.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0033_t12_expected_delivery_date_v1.sql',import.meta.url),'utf8'));
 const now=db.prepare('SELECT created_at,expected_delivery_date,expected_delivery_source FROM t12_prod_orders WHERE order_id=?').get('5741');
 const line=db.prepare('SELECT expected_delivery_date FROM t12_prod_lines WHERE order_id=?').get('5741-01');
 assert.equal(now.created_at,old.created_at);
 assert.equal(now.expected_delivery_date,'');
 assert.equal(now.expected_delivery_source,'');
 assert.equal(line.expected_delivery_date,'');
});

test('real overlay SQL reads projected date columns and preserves original registration',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0005_t12_production_create_canary.sql',import.meta.url),'utf8'));
 sqlite.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0006_t12_operational_runtime.sql',import.meta.url),'utf8'));
 sqlite.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0033_t12_expected_delivery_date_v1.sql',import.meta.url),'utf8'));
 sqlite.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) VALUES(?,?,?,?,?,'COMMITTED','{}')")
  .run('fixture_req_5741','owner','test_epoch','{}','5741');
 sqlite.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,department,priority,status,actor,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
  .run('5741','fixture_req_5741','registered','Fixture','طباعة','عادي','طلب جديد','owner','2026-11-02 18:49:04');
 sqlite.prepare("INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,item_name,qty,priority,status,heat_press,fly_print,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
  .run('5741-01','5741','fixture_req_5741',1,'طباعة','Test',1,'عادي','طلب جديد',0,0,'2026-11-02 18:49:04');
 const env={DB:{prepare(sql){return {async first(){return sqlite.prepare(sql).get()||null},async all(){return {results:sqlite.prepare(sql).all()}}}}}};
 const res=await readT12CloudNativeOverlay(env,'print');
 assert.equal(res.rows.length,1);
 assert.equal(res.rows[0].orderId,'5741');
 assert.equal(res.rows[0].expectedDeliveryAt,'2026-11-04');
 assert.equal(res.rows[0].deliveryDateSource,'policy-derived-legacy-unverified');
 assert.equal(res.rows[0].receivedAt,'2026-11-02 18:49:04');
});
