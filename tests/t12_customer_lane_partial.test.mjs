import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createT12GeneralOrder } from '../cloudflare-d1/src/t12-general-create.mjs';

const migrations=[5,6,7,10,11,12].map(n=>{
 const names={5:'0005_t12_production_create_canary',6:'0006_t12_operational_runtime',7:'0007_t12_general_create_control',10:'0010_t12_duplicate_order_guard',11:'0011_t12_legacy_line_runtime',12:'0012_t12_customer_lane_claim'};
 return fs.readFileSync(new URL('../cloudflare-d1/migrations/'+names[n]+'.sql',import.meta.url),'utf8');
});
const HEADERS=['رقم الأوردر','كود الأوردر','اسم الشات / المكتب','','القسم','رقم البند','اسم البند','الكمية','مسؤول القسم','الأولوية','الحالة','','','','','','رقم العميل الخارجي'];
class Stmt {
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){return this.db.raw.prepare(this.sql).get(...this.args)||null;}
 async all(){return {results:this.db.raw.prepare(this.sql).all(...this.args)};}
 async run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class D1 {
 constructor(){
  this.raw=new DatabaseSync(':memory:');
  this.raw.exec('PRAGMA foreign_keys=ON;');
  for(const m of migrations)this.raw.exec(m);
  this.raw.exec("CREATE TABLE sheet_catalog (sheet_name TEXT PRIMARY KEY,headers_json TEXT,status TEXT); CREATE TABLE sheet_rows (sheet_name TEXT,row_number INTEGER,values_json TEXT,display_json TEXT);");
  this.raw.prepare('INSERT INTO sheet_catalog VALUES (?,?,?)').run('بنود الأوردرات',JSON.stringify(HEADERS),'ready');
  this.raw.exec("UPDATE t12_prod_create_control SET next_order_number=4323,canary_remaining=0 WHERE singleton=1; UPDATE t12_prod_general_create_control SET mode='GENERAL',canary_remaining=0 WHERE singleton=1;");
  this.queue=Promise.resolve();
 }
 prepare(sql){return new Stmt(this,sql);}
 async batch(statements){
  let done;const prev=this.queue;this.queue=new Promise(r=>done=r);await prev;
  try{
   this.raw.exec('BEGIN IMMEDIATE');
   try{for(const stmt of statements)await stmt.run();this.raw.exec('COMMIT');}
   catch(e){this.raw.exec('ROLLBACK');throw e;}
  }finally{done();}
 }
 n(table){return Number(this.raw.prepare('SELECT COUNT(*) n FROM '+table).get().n);}
 addLegacy({orderId='2200',department='طباعة',status='طلب جديد',phone='01000000111',customer='Test Customer',updatedAt=''}={}){
  const row=Array(HEADERS.length).fill('');
  row[0]=orderId;row[1]=orderId;row[2]=customer;row[4]=department;row[5]=orderId+'-01';
  row[6]='Legacy Item';row[7]='1';row[10]=status;row[16]=phone;
  row[12]=updatedAt;
  this.raw.prepare('INSERT INTO sheet_rows VALUES (?,?,?,?)').run('بنود الأوردرات',this.n('sheet_rows')+2,JSON.stringify(row),JSON.stringify(row));
  return orderId+'-01';
 }
}
const key=(id)=>'cld1_180000000'+String(id).padStart(4,'0')+'_LANE_ROUTE_TEST_1234567890123456';
const make=(id,department='طباعة',fields={})=>({
 clientRequestId:key(id),customerMode:'عميل مسجل',customerName:'Test Customer',
 customerPhone:'01000000111',department,itemName:'Customer Artwork',qty:1,priority:'عادي',
 status:'طلب جديد',source:'داخلي',...fields
});
const create=(db,id,department,fields={})=>createT12GeneralOrder(db,make(id,department,fields),'employee-print',{nowMs:1800001000000+id*1000});
{
 const db=new D1();
 const a=await create(db,1,'طباعة');assert.equal(a.success,true,JSON.stringify(a));
 const b=await create(db,2,'طباعة',{itemName:'DIFFERENT DESIGN',qty:9});
 assert.equal(b.success,false);assert.equal(b.reason,'customer-department-open-order-exists');
 assert.equal(b.existingOrderId,a.orderId);assert.equal(db.n('t12_prod_orders'),1);
 const c=await create(db,3,'ليزر');assert.equal(c.success,true,JSON.stringify(c));
 assert.equal(c.orderId,'4324');assert.deepEqual(c.createdDepartments,['ليزر']);
 const other=await create(db,4,'طباعة',{customerPhone:'01000000112'});
 assert.equal(other.success,true,JSON.stringify(other)); // same name, different known phones => different customer
}
{
 const db=new D1();
 const print=await create(db,10,'طباعة');assert.equal(print.success,true);
 const multi=await create(db,11,'متعدد الأقسام',{heatPress:'نعم'});
 assert.equal(multi.success,true,JSON.stringify(multi));
 assert.equal(multi.partialMultiDepartment,true);
 assert.deepEqual(multi.createdDepartments,['ليزر']);
 assert.deepEqual(multi.skippedDepartments.map(x=>x.department),['طباعة']);
 assert.equal(multi.skippedDepartments[0].orderId,print.orderId);
 assert.deepEqual(multi.lineIds,['4324-01']);
 const row=db.raw.prepare('SELECT department FROM t12_prod_orders WHERE order_id=?').get(multi.orderId);
 assert.equal(row.department,'ليزر');
 const line=db.raw.prepare('SELECT department,item_name AS name FROM t12_prod_lines WHERE order_id=?').get(multi.orderId);
 assert.equal(line.department,'ليزر');assert.equal(line.name,'Customer Artwork - ليزر');
 assert.equal(db.raw.prepare('SELECT heat_press AS press,fly_print AS fly FROM t12_prod_lines WHERE order_id=?').get(multi.orderId).press,0,'Laser-only line must not inherit press flag');
 assert.equal(db.n('t12_prod_outbox'),2);assert.equal(db.n('t12_prod_events'),2);
 db.raw.prepare("INSERT INTO t12_prod_line_runtime (line_id,order_id,status,updated_by) VALUES (?,?,?,?)")
   .run(print.lineId,print.orderId,'تم التسليم','employee-print');
 const replay=await create(db,11,'متعدد الأقسام',{heatPress:'نعم'});
 assert.equal(replay.success,true,JSON.stringify(replay));
 assert.equal(replay.idempotent,true);assert.deepEqual(replay.lineIds,['4324-01']);
 assert.equal(db.n('t12_prod_orders'),2);
}
{
 const db=new D1();
 const laser=await create(db,20,'ليزر');assert.equal(laser.success,true);
 const multi=await create(db,21,'متعدد الأقسام');
 assert.equal(multi.success,true,JSON.stringify(multi));
 assert.deepEqual(multi.createdDepartments,['طباعة']);
 assert.deepEqual(multi.lineIds,['4324-01']);
 assert.equal(db.raw.prepare('SELECT department FROM t12_prod_orders WHERE order_id=?').get(multi.orderId).department,'طباعة');
 const again=await create(db,22,'متعدد الأقسام');
 assert.equal(again.success,false);assert.equal(again.reason,'customer-department-open-order-exists');
 assert.deepEqual(again.blockedDepartments.map(x=>x.department),['طباعة','ليزر']);
 assert.equal(db.n('t12_prod_orders'),2);
}
{
 const db=new D1();
 const multi=await create(db,30,'متعدد الأقسام');
 assert.equal(multi.success,true,JSON.stringify(multi));
 assert.deepEqual(multi.lineIds,['4323-01','4323-02']);
 assert.deepEqual(multi.createdDepartments,['طباعة','ليزر']);
 assert.equal(db.n('t12_prod_outbox'),2);
 const block=await create(db,31,'ليزر');
 assert.equal(block.success,false);assert.equal(block.existingOrderId,'4323');
 db.raw.prepare("INSERT INTO t12_prod_line_runtime (line_id,order_id,status,updated_by) VALUES (?,?,?,?)")
   .run('4323-01','4323','تم التسليم','employee-print');
 const stillBlocked=await create(db,32,'ليزر');assert.equal(stillBlocked.success,false);
 const nowAllowed=await create(db,33,'طباعة');assert.equal(nowAllowed.success,true);
}
{
 const db=new D1();
 const legacyLine=db.addLegacy({status:'جاهز للاستلام'});
 const blocked=await create(db,40,'طباعة');assert.equal(blocked.success,false,JSON.stringify(blocked));
 assert.equal(blocked.existingOrderId,'2200');assert.equal(db.n('t12_prod_orders'),0);
 const other=await create(db,41,'ليزر');assert.equal(other.success,true,JSON.stringify(other));
 const db2=new D1();const l2=db2.addLegacy({status:'طلب جديد'});
 db2.raw.prepare("INSERT INTO t12_legacy_line_runtime (line_id,order_id,status,updated_by) VALUES (?,?,?,?)")
   .run(l2,'2200','تم التسليم','employee-print');
 const free=await create(db2,42,'طباعة');assert.equal(free.success,true,JSON.stringify(free));
 const db3=new D1();db3.addLegacy({status:'ملغى'});
 assert.equal((await create(db3,43,'طباعة')).success,true);
}
{
 const db=new D1();
 db.raw.prepare("UPDATE sheet_catalog SET status='stale'").run();
 const blocked=await create(db,50,'طباعة');
 assert.equal(blocked.success,false);
 assert.equal(blocked.reason,'customer-department-status-unavailable-no-retry');
 assert.equal(db.n('t12_prod_orders'),0);
}
{
 const db=new D1();
 const results=await Promise.all([
   create(db,60,'طباعة',{itemName:'Artwork Alpha',qty:1}),
   create(db,61,'طباعة',{itemName:'Artwork Beta',qty:2})
 ]);
 assert.equal(results.filter(r=>r.success).length,1,JSON.stringify(results));
 assert.equal(results.filter(r=>r.reason==='customer-department-open-order-exists').length,1,JSON.stringify(results));
 assert.equal(db.n('t12_prod_orders'),1);
 assert.equal(db.n('t12_prod_customer_lane_claim'),1);
}
{
 const db=new D1();
 const results=await Promise.all([
   create(db,70,'طباعة',{itemName:'Artwork PRINT'}),
   create(db,71,'متعدد الأقسام',{itemName:'Artwork BOTH'})
 ]);
 assert.ok(results.every(r=>r.success===true||r.reason==='customer-department-open-order-exists'),JSON.stringify(results));
 const open=db.raw.prepare("SELECT department,COUNT(*) n FROM t12_prod_lines GROUP BY department").all();
 assert.equal(open.find(x=>x.department==='طباعة')?.n,1,JSON.stringify(open));
 assert.ok(Number(open.find(x=>x.department==='ليزر')?.n||0)<=1);
 assert.equal(db.n('t12_prod_customer_lane_claim'),open.length);
}
{
 const db=new D1();
 const a=await create(db,80,'طباعة',{itemName:'FIRST DELIVERY'});
 assert.equal(a.success,true);
 db.raw.prepare("INSERT INTO t12_prod_line_runtime(line_id,order_id,status,updated_by) VALUES (?,?,?,?)")
   .run(a.lineId,a.orderId,'تم التسليم','employee-print');
 const b=await create(db,81,'طباعة',{itemName:'NEW INDEPENDENT JOB'});
 assert.equal(b.success,true,JSON.stringify(b));
 assert.equal(db.n('t12_prod_customer_lane_claim'),1,'Previously closed claim must be refreshed');
 assert.equal(db.raw.prepare("SELECT order_id FROM t12_prod_customer_lane_claim LIMIT 1").get().order_id,b.orderId);
}

{
 const db=new D1();db.addLegacy({department:'مكبس',status:'جاهز للاستلام'});
 const print=await create(db,90,'طباعة');
 assert.equal(print.success,false,'Open legacy press must occupy PRINT');
 assert.equal(print.existingOrderId,'2200');
 const laser=await create(db,91,'ليزر');assert.equal(laser.success,true);
 assert.equal(db.n('t12_prod_orders'),1);
}
{
 const db=new D1();db.addLegacy({phone:'٠١٠٠٠٠٠٠١١١',customer:'Historic Alias',status:'جاهز للاستلام'});
 const same=await create(db,92,'طباعة',{customerPhone:'+20 1000000111',customerName:'Current Alias'});
 assert.equal(same.success,false,'Known Arabic legacy phone must retain identity across names');
 assert.equal(same.existingOrderId,'2200');
 const distinct=await create(db,93,'طباعة',{customerPhone:'01000000112',customerName:'Historic Alias'});
 assert.equal(distinct.success,true,'Two known different phones must not be conflated by matching name');
}
{
 const db=new D1();
 const results=await Promise.all([
  createT12GeneralOrder(db,make(94,'طباعة',{itemName:'EMPLOYEE A PRINT'}),'employee-a',{nowMs:1800001000000}),
  createT12GeneralOrder(db,make(95,'متعدد الأقسام',{itemName:'EMPLOYEE B MULTI',heatPress:'نعم'}),'employee-b',{nowMs:1800001000000})
 ]);
 assert.equal(results[0].success,true,JSON.stringify(results));
 assert.equal(results[1].success,true,'Second employee must save the available LASER lane');
 assert.deepEqual(results[1].createdDepartments,['ليزر']);
 assert.deepEqual(results[1].skippedDepartments,[{department:'طباعة',orderId:results[0].orderId}]);
 assert.deepEqual(db.raw.prepare('SELECT department,COUNT(*) n FROM t12_prod_lines GROUP BY department ORDER BY department').all().map(x=>[x.department,Number(x.n)]),[['طباعة',1],['ليزر',1]]);
 assert.equal(db.n('t12_prod_outbox'),2,'No queue for skipped PRINT');
 assert.equal(db.n('t12_prod_customer_lane_claim'),2);
 const replay=await createT12GeneralOrder(db,make(95,'متعدد الأقسام',{itemName:'EMPLOYEE B MULTI',heatPress:'نعم'}),'employee-b',{nowMs:1800001010000});
 assert.equal(replay.success,true);assert.equal(replay.idempotent,true);
 assert.equal(replay.orderId,results[1].orderId);
 assert.equal(db.n('t12_prod_orders'),2);
}

{
 const db=new D1();
 db.addLegacy({department:'ليزر',status:'جاهز للاستلام',updatedAt:'2026-10-01T12:00:00Z'});
 db.addLegacy({department:'ليزر',status:'تم التسليم',updatedAt:'2026-10-02T12:00:00Z'});
 const created=await create(db,101,'ليزر');
 assert.equal(created.success,false,'Conflicting mirror-only copies remain fail-closed without native authority');
 assert.equal(db.n('t12_prod_orders'),0);
 const repeated=await create(db,102,'ليزر',{itemName:'Different new work'});
 assert.equal(repeated.success,false,'An ambiguous mirror line must not be bypassed by changing the payload');
}
{
 const db=new D1();
 db.addLegacy({department:'ليزر',status:'تم التسليم',updatedAt:'2026-10-01T12:00:00Z'});
 db.addLegacy({department:'ليزر',status:'جاهز للاستلام',updatedAt:'2026-10-02T12:00:00Z'});
 assert.equal((await create(db,103,'ليزر')).success,false,'A currently ready but undelivered line remains open');
}
{
 const db=new D1();const old=await create(db,104,'ليزر');assert.equal(old.success,true);
 db.raw.prepare("INSERT INTO t12_prod_line_runtime(line_id,order_id,status,updated_by) VALUES (?,?,?,?)").run(old.lineId,old.orderId,'تم التسليم','employee-a');
 db.addLegacy({orderId:old.orderId,department:'ليزر',status:'طلب جديد'});
 assert.equal((await create(db,105,'ليزر',{itemName:'New laser artwork'})).success,true,'Closed native authority must supersede its historical open mirror');
}
console.log('T12 customer+department lane and partial multi create isolated + concurrent distinct-payload atomic claim PASS');
