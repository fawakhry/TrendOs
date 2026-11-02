import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {closeAndArchiveT12OrderV1} from '../cloudflare-d1/src/t12-native-close-archive-v1.mjs';
import {readFileSync} from 'node:fs';

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;
  CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,department TEXT NOT NULL,priority TEXT NOT NULL,
    source TEXT NOT NULL,notes TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'طلب جديد');
  CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT REFERENCES t12_prod_orders(order_id),
    ordinal INTEGER,department TEXT,item_name TEXT,qty REAL,priority TEXT,status TEXT NOT NULL DEFAULT 'طلب جديد');
  CREATE TABLE t12_prod_line_runtime(line_id TEXT PRIMARY KEY REFERENCES t12_prod_lines(line_id),
    order_id TEXT,status TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '');
  CREATE TABLE employee_core_archive_orders_v1(order_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',department TEXT NOT NULL DEFAULT '',priority TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',
    snapshot_json TEXT NOT NULL DEFAULT '{}',archived_by TEXT NOT NULL,request_key TEXT NOT NULL,
    archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE employee_core_archive_lines_v1(line_id TEXT PRIMARY KEY,order_id TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',item_name TEXT NOT NULL DEFAULT '',
    qty REAL NOT NULL DEFAULT 1,priority TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',snapshot_json TEXT NOT NULL DEFAULT '{}',archived_by TEXT NOT NULL,
    request_key TEXT NOT NULL,archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE employee_core_events_v1(event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,entity_type TEXT,entity_id TEXT,actor TEXT,payload_json TEXT);
  CREATE TABLE employee_core_control_v1(singleton INTEGER PRIMARY KEY,data_version INTEGER,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  INSERT INTO employee_core_control_v1(singleton,data_version) VALUES(1,1);
  INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department,priority,source,notes)
    VALUES('4322','عميل تجريبي','01000000000','طباعة','عادي','T12','');
  INSERT INTO t12_prod_lines(line_id,order_id,ordinal,department,item_name,qty,priority)
    VALUES('L4322A','4322',1,'طباعة','لوحة',1,'عادي'),
          ('L4322B','4322',2,'ليزر','قص',1,'عادي');`);
  const adapter={
    prepare(sql){return {bind(...args){return {
      first:async()=>db.prepare(sql).get(...args)||null,
      all:async()=>({results:db.prepare(sql).all(...args)}),
      run:async()=>db.prepare(sql).run(...args),
      sql,args
    };}};},
    async batch(stmts){db.exec('BEGIN IMMEDIATE');try{
      for(const s of stmts)db.prepare(s.sql).run(...s.args);
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}}
  };
  return {db,env:{DB:adapter,TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED:'true'},
    user:{username:'رحمة',role:'service',screens:['service']},
    body:{orderId:'4322',requestId:'close-native-4322-unique'}};
}
const count=(db,table)=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
function deliver(db,which=['L4322A','L4322B']){
  for(const id of which)db.prepare("INSERT INTO t12_prod_line_runtime(line_id,order_id,status) VALUES(?,'4322','تم التسليم')").run(id);
}
test('default OFF, insufficient privilege, invalid request, and legacy-only ID never mutate',async()=>{
  const f=fixture();deliver(f.db);
  assert.equal((await closeAndArchiveT12OrderV1({...f.env,TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED:'false'},f.user,f.body)).code,'native-close-archive-off');
  assert.equal((await closeAndArchiveT12OrderV1(f.env,{username:'وائل',role:'print'},f.body)).code,'native-close-archive-forbidden');
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,{...f.body,orderId:'old-legacy-1'})).code,'native-order-not-found');
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,{...f.body,requestId:'bad'})).code,'request-id-invalid');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
});
test('mixed completed/active order has no partial archive',async()=>{
  const f=fixture();deliver(f.db,['L4322A']);
  const r=await closeAndArchiveT12OrderV1(f.env,f.user,f.body);
  assert.equal(r.code,'native-order-not-all-delivered');assert.equal(r.deliveredLines,1);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
});
test('atomic closure and archive of two delivered native lines; one immutable order snapshot',async()=>{
  const f=fixture();deliver(f.db);
  const r=await closeAndArchiveT12OrderV1(f.env,f.user,f.body);
  assert.equal(r.success,true);assert.equal(r.archivedOrders,1);assert.equal(r.archivedLines,2);
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),1);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),2);
  assert.equal(count(f.db,'employee_core_events_v1'),1);
  assert.equal(f.db.prepare("SELECT status FROM t12_prod_orders WHERE order_id='4322'").get().status,'طلب جديد');
  assert.equal(f.db.prepare('SELECT data_version FROM employee_core_control_v1').get().data_version,2);
  const again=await closeAndArchiveT12OrderV1(f.env,f.user,f.body);
  assert.equal(again.idempotent,true);assert.equal(count(f.db,'employee_core_events_v1'),1);
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,{...f.body,requestId:'another-request-4322-uuid'})).code,'order-already-archived');
});
test('previous partial legacy archive of same ID fails safely',async()=>{
  const f=fixture();deliver(f.db);
  f.db.prepare("INSERT INTO employee_core_archive_lines_v1(line_id,order_id,qty,archived_by,request_key) VALUES('L4322A','4322',1,'another-writer','earlier')").run();
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-order-partially-archived-review');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
});
test('status race between preflight and D1 batch never closes an unfinished order',async()=>{
  const f=fixture();deliver(f.db);
  const batch=f.env.DB.batch;f.env.DB.batch=async(stmts)=>{
    f.db.prepare("UPDATE t12_prod_line_runtime SET status='متوقف' WHERE line_id='L4322B'").run();
    return batch(stmts);
  };
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-close-archive-outcome-unknown-check-d1');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
});
test('mid-batch SQLite SQL error rolls back all archive rows',async()=>{
  const f=fixture();deliver(f.db);const batch=f.env.DB.batch;
  f.env.DB.batch=async(stmts)=>batch([...stmts.slice(0,1),{sql:'INSERT INTO missing_table VALUES(1)',args:[]},...stmts.slice(1)]);
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-close-archive-outcome-unknown-check-d1');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
});
test('new fully-delivered T12 line added after preflight forces atomic rollback, not partial archive',async()=>{
  const f=fixture();deliver(f.db);const batch=f.env.DB.batch;
  f.env.DB.batch=async(stmts)=>{
    f.db.prepare(`INSERT INTO t12_prod_lines
      (line_id,order_id,ordinal,department,item_name,qty,priority)
      VALUES('L4322C','4322',3,'طباعة','إضافي',1,'عادي')`).run();
    f.db.prepare(`INSERT INTO t12_prod_line_runtime(line_id,order_id,status)
      VALUES('L4322C','4322','تم التسليم')`).run();
    return batch(stmts);
  };
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-close-archive-outcome-unknown-check-d1');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
  assert.equal(count(f.db,'employee_core_events_v1'),0);
});
test('same request ID does not falsely accept missing archive lines or audit event',async()=>{
  const f=fixture();deliver(f.db);
  f.db.prepare(`INSERT INTO employee_core_archive_orders_v1
    (order_id,status,archived_by,request_key)
    VALUES('4322','تم التسليم','رحمة',?)`).run(f.body.requestId);
  const result=await closeAndArchiveT12OrderV1(f.env,f.user,f.body);
  assert.equal(result.code,'native-close-archive-existing-incomplete-review');
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
});
test('lost D1 response after a fully committed transaction recovers without duplicate writes',async()=>{
  const f=fixture();deliver(f.db);const batch=f.env.DB.batch;
  f.env.DB.batch=async(stmts)=>{await batch(stmts);throw new Error('simulated ACK loss');};
  const r=await closeAndArchiveT12OrderV1(f.env,f.user,f.body);
  assert.equal(r.success,true);assert.equal(r.ambiguousAckRecovered,true);
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),1);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),2);
  assert.equal(count(f.db,'employee_core_events_v1'),1);
});
test('tampered archived line request ID rejects replay as incomplete rather than success',async()=>{
  const f=fixture();deliver(f.db);
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).success,true);
  f.db.prepare(`UPDATE employee_core_archive_lines_v1 SET request_key='wrong-key'
    WHERE line_id='L4322A'`).run();
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,
    'native-close-archive-existing-incomplete-review');
});
test('source integration only: action wired with protected flag; existing archives remain separate',()=>{
  const core=readFileSync(new URL('../cloudflare-d1/src/employee-core-native-v1.mjs',import.meta.url),'utf8');
  assert.match(core,/CLOSE_ARCHIVE_ACTION\)out=await closeAndArchiveT12OrderV1/);
  assert.match(core,/archiveDeliveredDepartmentV1926'\)out=await archiveDelivered/);
  const source=readFileSync(new URL('../cloudflare-d1/src/t12-native-close-archive-v1.mjs',import.meta.url),'utf8');
  assert.match(source,/TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED!=='true'/);
  assert.doesNotMatch(source,/APPS_SCRIPT_API_URL|script.google.com|employee_core_lines_v1/);
});
