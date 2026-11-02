import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {closeAndArchiveT12OrderV1,nativeT12ArchiveWriteFenceV1} from '../cloudflare-d1/src/t12-native-close-archive-v1.mjs';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {handleEmployeeCoreNativeRequest} from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import {cloudAuthTokenFingerprint} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;
  CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,department TEXT NOT NULL,priority TEXT NOT NULL,
    source TEXT NOT NULL,notes TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'طلب جديد',
    customer_mode TEXT NOT NULL DEFAULT 'registered',external_customer_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT REFERENCES t12_prod_orders(order_id),
    ordinal INTEGER,department TEXT,item_name TEXT,qty REAL,priority TEXT,status TEXT NOT NULL DEFAULT 'طلب جديد',
    assigned_to TEXT NOT NULL DEFAULT '',heat_press INTEGER NOT NULL DEFAULT 0,
    fly_print INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE t12_prod_line_runtime(line_id TEXT PRIMARY KEY REFERENCES t12_prod_lines(line_id),
    order_id TEXT,status TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',
    customer_notified TEXT NOT NULL DEFAULT '',notified_at TEXT NOT NULL DEFAULT '',
    notified_by TEXT NOT NULL DEFAULT '',last_whatsapp_message TEXT NOT NULL DEFAULT '',
    last_whatsapp_at TEXT NOT NULL DEFAULT '',last_whatsapp_by TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
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
    action TEXT NOT NULL,entity_type TEXT NOT NULL DEFAULT '',entity_id TEXT NOT NULL DEFAULT '',
    actor TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE employee_core_control_v1(singleton INTEGER PRIMARY KEY,
    marker TEXT NOT NULL DEFAULT 'ENTRY614_EMPLOYEE_CORE_V1',
    mode TEXT NOT NULL DEFAULT 'GENERAL',
    policy_epoch INTEGER NOT NULL DEFAULT 1,
    data_version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  INSERT INTO employee_core_control_v1(singleton,data_version) VALUES(1,1);
  INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department,priority,source,notes)
    VALUES('4322','عميل تجريبي','01000000000','طباعة','عادي','T12','');
  INSERT INTO t12_prod_lines(line_id,order_id,ordinal,department,item_name,qty,priority)
    VALUES('L4322A','4322',1,'طباعة','لوحة',1,'عادي'),
          ('L4322B','4322',2,'ليزر','قص',1,'عادي');`);
  // Execute the actual additive original-D1 migration, NOT a mock of its guards.
  const migration=readFileSync(new URL('../cloudflare-d1/migrations/0032_t12_native_archive_guard_v1.sql',import.meta.url),'utf8');
  db.exec(migration);
  db.prepare("UPDATE t12_native_archive_guard_control_v1 SET mode='GUARDED' WHERE singleton=1").run();
  const adapter={
    prepare(sql){return {
      first:async()=>db.prepare(sql).get()||null,
      all:async()=>({results:db.prepare(sql).all()}),
      run:async()=>db.prepare(sql).run(),
      bind(...args){return {
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
test('SQLite fixture exactly preserves original NOT NULL event actor safety constraint',()=>{
  const {db}=fixture();
  const columns=db.prepare("PRAGMA table_info(employee_core_events_v1)").all();
  assert.equal(columns.find(c=>c.name==='actor')?.notnull,1);
  assert.throws(()=>db.prepare("INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json) VALUES('a','order','4322',NULL,'{}')").run(),/NOT NULL/);
});
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
  // First prove the actual armed trigger prevents tampering.
  assert.throws(()=>f.db.prepare(`UPDATE employee_core_archive_lines_v1 SET request_key='wrong-key'
    WHERE line_id='L4322A'`).run(),/native-t12-order-already-archived/);
  // Simulate earlier archival corruption from before the new migration was armed:
  // deliberately OFF in fixture, inject old data, arm again, then verify replay.
  f.db.prepare("UPDATE t12_native_archive_guard_control_v1 SET mode='OFF' WHERE singleton=1").run();
  f.db.prepare(`UPDATE employee_core_archive_lines_v1 SET request_key='wrong-key'
    WHERE line_id='L4322A'`).run();
  f.db.prepare("UPDATE t12_native_archive_guard_control_v1 SET mode='GUARDED' WHERE singleton=1").run();
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,
    'native-close-archive-existing-incomplete-review');
});
test('native archive write fence blocks status edits after closure and lets open orders edit',async()=>{
  const f=fixture();deliver(f.db);
  assert.equal((await nativeT12ArchiveWriteFenceV1(f.env,'4322','L4322A')).allowed,true);
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).success,true);
  const gate=await nativeT12ArchiveWriteFenceV1(f.env,'4322','L4322A');
  assert.equal(gate.allowed,false);assert.equal(gate.code,'native-archived-order-immutable');
  assert.equal((await nativeT12ArchiveWriteFenceV1({...f.env,TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED:'false'},'4322','L4322A')).allowed,true);
});
test('partial previous archive already blocks status updates in native close mode',async()=>{
  const f=fixture();deliver(f.db);
  f.db.prepare("INSERT INTO employee_core_archive_lines_v1(line_id,order_id,qty,archived_by,request_key) VALUES('L4322A','4322',1,'other','earlier')").run();
  const a=await nativeT12ArchiveWriteFenceV1(f.env,'4322','L4322A');
  assert.equal(a.allowed,false);assert.equal(a.code,'native-archived-order-immutable');
  assert.equal((await nativeT12ArchiveWriteFenceV1(f.env,'4322','L4322B')).allowed,true);
});
test('enabled archive gate fails closed on absent or broken database',async()=>{
  const f=fixture();
  assert.equal((await nativeT12ArchiveWriteFenceV1({TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED:'true'},'4322','L4322A')).code,
    'native-archive-write-state-unavailable');
  const bad={TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED:'true',
    DB:{prepare(){throw new Error('table missing');}}};
  assert.equal((await nativeT12ArchiveWriteFenceV1(bad,'4322','L4322A')).allowed,false);
});
test('migration defaults OFF; worker flag true cannot archive until D1 guard independently armed',async()=>{
  const f=fixture();deliver(f.db);
  f.db.prepare("UPDATE t12_native_archive_guard_control_v1 SET mode='OFF' WHERE singleton=1").run();
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-archive-db-guard-not-armed');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),0);
  f.db.prepare("UPDATE t12_native_archive_guard_control_v1 SET mode='GUARDED' WHERE singleton=1").run();
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).success,true);
});
test('archive requires original D1 trigger schema: no control means fail closed',async()=>{
  const f=fixture();deliver(f.db);
  f.db.exec("DROP TABLE t12_native_archive_guard_control_v1");
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).code,'native-archive-db-guard-unavailable');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
});
test('actual D1 triggers seal the T12 original order, its lines, runtime, archive snapshots',async()=>{
  const f=fixture();deliver(f.db);
  assert.equal((await closeAndArchiveT12OrderV1(f.env,f.user,f.body)).success,true);
  const sql=[
    "UPDATE t12_prod_line_runtime SET status='متوقف' WHERE line_id='L4322A'",
    "DELETE FROM t12_prod_line_runtime WHERE line_id='L4322A'",
    "INSERT INTO t12_prod_line_runtime(line_id,order_id,status) VALUES('L4322A','4322','متوقف')",
    "UPDATE t12_prod_lines SET item_name='Tamper' WHERE line_id='L4322A'",
    "DELETE FROM t12_prod_lines WHERE line_id='L4322A'",
    "INSERT INTO t12_prod_lines(line_id,order_id,ordinal,department,item_name,qty,priority) VALUES('L4322C','4322',3,'طباعة','Tamper',1,'عادي')",
    "UPDATE t12_prod_orders SET notes='Tamper' WHERE order_id='4322'",
    "DELETE FROM t12_prod_orders WHERE order_id='4322'",
    "UPDATE employee_core_archive_orders_v1 SET notes='Tamper' WHERE order_id='4322'",
    "DELETE FROM employee_core_archive_orders_v1 WHERE order_id='4322'",
    "UPDATE employee_core_archive_lines_v1 SET notes='Tamper' WHERE line_id='L4322A'",
    "DELETE FROM employee_core_archive_lines_v1 WHERE line_id='L4322A'"
  ];
  for(const statement of sql)assert.throws(()=>f.db.exec(statement),/native-t12-order-already-archived/,
    'D1 trigger must reject: '+statement);
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),1);
  assert.equal(count(f.db,'employee_core_archive_lines_v1'),2);
  assert.equal(f.db.prepare("SELECT status FROM t12_prod_line_runtime WHERE line_id='L4322A'").get().status,'تم التسليم');
});
test('non-archived new T12 order remains editable with D1 guard armed',()=>{
  const f=fixture();
  f.db.exec("UPDATE t12_prod_orders SET notes='safe-edit' WHERE order_id='4322'");
  f.db.exec("UPDATE t12_prod_lines SET item_name='safe-edit' WHERE line_id='L4322A'");
  f.db.exec("INSERT INTO t12_prod_line_runtime(line_id,order_id,status) VALUES('L4322A','4322','تحت التنفيذ')");
  assert.equal(f.db.prepare("SELECT status FROM t12_prod_line_runtime WHERE line_id='L4322A'").get().status,'تحت التنفيذ');
});
test('actual native Employee Core Request over local HTTP: deny bad session/origin/role then archive+replay',async()=>{
  const f=fixture();deliver(f.db);
  const nativeMigration=readFileSync(new URL('../cloudflare-d1/migrations/0009_employee_auth_native_v1.sql',import.meta.url),'utf8');
  f.db.exec(nativeMigration);
  const now=Date.now();
  f.env.EDGE_SESSION_SECRET='synthetic-local-only-not-production-auth-fingerprint';
  f.env.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1='true';
  f.db.prepare(`INSERT INTO employee_auth_users_v1
    (employee_id,username_key,canonical_username,must_change,active,role,department,screens_json,session_version)
    VALUES('e1','rahma','Rahma',0,1,'service','service','["service"]',1)`).run();
  const token='synthetic-local-employee-session';
  const fingerprint=await cloudAuthTokenFingerprint('rahma',token,f.env);
  f.db.prepare(`INSERT INTO employee_auth_sessions_v1
    (username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms)
    VALUES('rahma',?,1,?,?,?)`).run(fingerprint,now,now+60_000,now);
  const srv=createServer(async(req,res)=>{
    try{
      const bytes=[];for await(const piece of req)bytes.push(piece);
      const request=new Request('http://127.0.0.1'+req.url,{
        method:req.method,headers:req.headers,
        body:req.method==='GET'||req.method==='HEAD'?undefined:Buffer.concat(bytes)
      });
      const result=await handleEmployeeCoreNativeRequest(request,f.env);
      res.writeHead(result.status,Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    }catch(err){res.writeHead(500);res.end(String(err?.message||'failed'));}
  });
  await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+srv.address().port+'/v1/employee/core';
  const post=async(body,auth=token,origin='https://fawakhry.github.io')=>{
    const headers={'content-type':'application/json','origin':origin};
    if(auth)headers.authorization='Bearer '+auth;
    const resp=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
    return {status:resp.status,data:await resp.json()};
  };
  try{
    let req={...f.body,username:'rahma',action:'closeAndArchiveT12OrderV1'};
    let r=await post(req,'bad-session');
    assert.equal(r.status,401);assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
    r=await post(req,token,'https://untrusted.example');
    assert.equal(r.status,403);assert.equal(count(f.db,'employee_core_archive_orders_v1'),0);
    f.db.prepare("UPDATE employee_auth_users_v1 SET role='print',department='print',screens_json='[\"print\"]' WHERE username_key='rahma'").run();
    r=await post(req);
    assert.equal(r.status,400);assert.equal(r.data.code,'native-close-archive-forbidden');
    f.db.prepare("UPDATE employee_auth_users_v1 SET role='service',department='service',screens_json='[\"service\"]' WHERE username_key='rahma'").run();
    r=await post(req);assert.equal(r.status,200);
    assert.equal(r.data.success,true);assert.equal(r.data.archivedLines,2);
    assert.equal(count(f.db,'employee_core_archive_orders_v1'),1);
    r=await post(req);assert.equal(r.status,200);assert.equal(r.data.idempotent,true);
    assert.equal(count(f.db,'employee_core_events_v1'),1);
    req={...req,requestId:'another-live-local-request'};
    r=await post(req);assert.equal(r.status,400);assert.equal(r.data.code,'order-already-archived');
  }finally{await new Promise(resolve=>srv.close(resolve));}
});
test('existing employee archive button calls only complete original T12 orders, never imported Google orders',async()=>{
  const f=fixture();deliver(f.db);
  for(const migration of [
    '0008_t12_customer_master.sql','0016_employee_core_zero_google_v1.sql',
    '0017_employee_core_current_orders_v1.sql'
  ])f.db.exec(readFileSync(new URL('../cloudflare-d1/migrations/'+migration,import.meta.url),'utf8'));
  // Deliberate historical/imported row that MUST remain active and unarchived.
  f.db.prepare(`INSERT INTO employee_core_orders_v1(order_id,customer_name,active)
    VALUES('GOOGLE-OLDER-100','Old Imported',1)`).run();
  f.db.prepare(`INSERT INTO employee_core_lines_v1(line_id,order_id,customer_name,department,item_name,status,active)
    VALUES('OLD-L100','GOOGLE-OLDER-100','Old Imported','طباعة','Old Item','تم التسليم',1)`).run();
  f.env.EDGE_SESSION_SECRET='synthetic-local-only-not-production-auth-fingerprint';
  f.env.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1='true';
  f.db.exec(readFileSync(new URL('../cloudflare-d1/migrations/0009_employee_auth_native_v1.sql',import.meta.url),'utf8'));
  f.db.prepare(`INSERT INTO employee_auth_users_v1
    (employee_id,username_key,canonical_username,must_change,active,role,department,screens_json,session_version)
    VALUES('e1','rahma','Rahma',0,1,'service','service','["service"]',1)`).run();
  const now=Date.now(),token='synthetic-archive-button-session';
  const fingerprint=await cloudAuthTokenFingerprint('rahma',token,f.env);
  f.db.prepare(`INSERT INTO employee_auth_sessions_v1
    (username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms)
    VALUES('rahma',?,1,?,?,?)`).run(fingerprint,now,now+60000,now);
  const req=new Request('https://trendos-d1-api.example.test/v1/employee/core',{
    method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token,
      'origin':'https://fawakhry.github.io'},
    body:JSON.stringify({action:'archiveDeliveredDepartmentV1926',username:'rahma',
      screen:'service',requestId:'ARCHIVE-20261102-ui-button-test'})
  });
  const response=await handleEmployeeCoreNativeRequest(req,f.env),out=await response.json();
  assert.equal(response.status,200,JSON.stringify(out));
  assert.equal(out.success,true);assert.equal(out.archivedOrders,1);
  assert.equal(out.archivedLines,2);assert.equal(out.cloudNative,true);
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),1);
  assert.equal(f.db.prepare("SELECT active FROM employee_core_orders_v1 WHERE order_id='GOOGLE-OLDER-100'").get().active,1);
  assert.equal(f.db.prepare("SELECT active FROM employee_core_lines_v1 WHERE line_id='OLD-L100'").get().active,1);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM employee_core_archive_lines_v1 WHERE line_id='OLD-L100'").get().n,0);
});
test('one archive click can continue 45 complete original T12 orders in exactly 3 bounded requests',async()=>{
  const f=fixture();deliver(f.db);
  f.db.exec(readFileSync(new URL('../cloudflare-d1/migrations/0009_employee_auth_native_v1.sql',import.meta.url),'utf8'));
  const now=Date.now(),token='synthetic-batched-archive-token';
  f.env.EDGE_SESSION_SECRET='synthetic-batch-test-only';
  f.env.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1='true';
  f.db.prepare(`INSERT INTO employee_auth_users_v1
    (employee_id,username_key,canonical_username,must_change,active,role,department,screens_json,session_version)
    VALUES('e1','rahma','Rahma',0,1,'service','service','["service"]',1)`).run();
  const fingerprint=await cloudAuthTokenFingerprint('rahma',token,f.env);
  f.db.prepare(`INSERT INTO employee_auth_sessions_v1
    (username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms)
    VALUES('rahma',?,1,?,?,?)`).run(fingerprint,now,now+60000,now);
  for(let i=0;i<44;i++){
    const id=String(5000+i);
    f.db.prepare(`INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department,priority,source,notes)
      VALUES(?,'عميل افتراضي','01000000000','طباعة','عادي','T12','')`).run(id);
    f.db.prepare(`INSERT INTO t12_prod_lines(line_id,order_id,ordinal,department,item_name,qty,priority,status)
      VALUES(?,?,1,'طباعة','ملصق',1,'عادي','تم التسليم')`).run('L-'+id,id);
  }
  f.db.prepare(`INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department,priority,source,notes)
    VALUES('9000','غير مكتمل','01000000000','طباعة','عادي','T12','')`).run();
  f.db.prepare(`INSERT INTO t12_prod_lines(line_id,order_id,ordinal,department,item_name,qty,priority,status)
    VALUES('L9000','9000',1,'طباعة','غير مكتمل',1,'عادي','بدأ التنفيذ')`).run();
  const requestId='ARCHIVE-20261102-45-orders-one-click';
  async function run(){
    const req=new Request('https://trendos-d1-api.example.test/v1/employee/core',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+token,
        'origin':'https://fawakhry.github.io'},
      body:JSON.stringify({action:'archiveDeliveredDepartmentV1926',username:'rahma',screen:'service',requestId})
    });
    const response=await handleEmployeeCoreNativeRequest(req,f.env);
    return {status:response.status,body:await response.json()};
  }
  const first=await run();
  assert.equal(first.status,200,JSON.stringify(first.body));
  assert.equal(first.body.archivedOrders,20);
  assert.equal(first.body.remainingEligible,25);
  assert.equal(first.body.hasMore,true);
  assert.equal(first.body.version,'T12_NATIVE_COMPLETE_ORDERS_AUTO_BATCH_V2');
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),20);
  const second=await run();
  assert.equal(second.body.archivedOrders,20);
  assert.equal(second.body.remainingEligible,5);
  assert.equal(second.body.hasMore,true);
  const third=await run();
  assert.equal(third.body.archivedOrders,5);
  assert.equal(third.body.remainingEligible,0);
  assert.equal(third.body.hasMore,false);
  assert.equal(count(f.db,'employee_core_archive_orders_v1'),45);
  const fourth=await run();
  assert.equal(fourth.body.archivedOrders,0);
  assert.equal(fourth.body.hasMore,false);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM employee_core_archive_orders_v1 WHERE order_id='9000'").get().n,0);
  assert.equal(count(f.db,'employee_core_events_v1'),45);
});
test('auto-archive UI loops only on hasMore with 200 batch guard and explicit progress',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const start=app.indexOf('  async function archiveDeliveredDepartment() {');
  const end=app.indexOf('  function applyFiltersAndRender(',start);
  assert.ok(start>0&&end>start);
  const block=app.slice(start,end);
  assert.match(block,/if \(!res.hasMore\)/);
  assert.match(block,/if \(Number\(res.archivedOrders \|\| 0\) < 1\)/);
  assert.match(block,/if \(\+\+rounds > 200\)/);
  assert.match(block,/remainingEligible/);
  assert.match(block,/T12_NATIVE_COMPLETE_ORDERS_AUTO_BATCH_V2/);
  assert.doesNotMatch(block,/شيت الأرشيف/);
});
test('original Core read returns exact D1 whole-order count, hides partially archived orders from ready',async()=>{
  const f=fixture();deliver(f.db);
  for(const migration of ['0008_t12_customer_master.sql','0016_employee_core_zero_google_v1.sql',
    '0017_employee_core_current_orders_v1.sql','0009_employee_auth_native_v1.sql']){
    f.db.exec(readFileSync(new URL('../cloudflare-d1/migrations/'+migration,import.meta.url),'utf8'));
  }
  // One T12 order is completely delivered but has an earlier line archived
  // WITHOUT its whole order archive: must be classified as partial, not ready.
  f.db.prepare(`INSERT INTO employee_core_archive_lines_v1
    (line_id,order_id,qty,archived_by,request_key)
    VALUES('L4322A','4322',1,'previous-legacy-writer','old-archive')`).run();
  f.db.prepare(`INSERT INTO t12_prod_orders
    (order_id,customer_name,customer_phone,department,priority,source,notes)
    VALUES('54321','New Synthetic','01000000000','ليزر','عادي','T12','')`).run();
  f.db.prepare(`INSERT INTO t12_prod_lines
    (line_id,order_id,ordinal,department,item_name,qty,priority,status)
    VALUES('L54321','54321',1,'ليزر','جاهز',1,'عادي','تم التسليم')`).run();
  f.db.prepare(`INSERT INTO t12_prod_orders
    (order_id,customer_name,customer_phone,department,priority,source,notes)
    VALUES('54322','Incomplete Synthetic','01000000000','ليزر','عادي','T12','')`).run();
  f.db.prepare(`INSERT INTO t12_prod_lines
    (line_id,order_id,ordinal,department,item_name,qty,priority,status)
    VALUES('L54322','54322',1,'ليزر','غير جاهز',1,'عادي','بدأ التنفيذ')`).run();
  const now=Date.now(),token='synthetic-archive-counter-employee';
  f.env.EDGE_SESSION_SECRET='local-fixture-counter-only';
  f.env.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1='true';
  f.db.prepare(`INSERT INTO employee_auth_users_v1
    (employee_id,username_key,canonical_username,must_change,active,role,department,screens_json,session_version)
    VALUES('ec1','rahma','Rahma',0,1,'service','service','["service"]',1)`).run();
  const fingerprint=await cloudAuthTokenFingerprint('rahma',token,f.env);
  f.db.prepare(`INSERT INTO employee_auth_sessions_v1
    (username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms)
    VALUES('rahma',?,1,?,?,?)`).run(fingerprint,now,now+60000,now);
  const call=async(action,extra={})=>{
    const request=new Request('https://trendos-d1-api.example.test/v1/employee/core',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+token,
        'origin':'https://fawakhry.github.io'},
      body:JSON.stringify({action,username:'rahma',screen:'service',...extra})
    });
    const r=await handleEmployeeCoreNativeRequest(request,f.env);
    return {code:r.status,data:await r.json()};
  };
  const before=await call('getRows');
  assert.equal(before.code,200,JSON.stringify(before.data));
  assert.equal(before.data.archiveEligibility?.available,true);
  assert.equal(before.data.archiveEligibility.eligibleOrders,1);
  assert.equal(before.data.archiveEligibility.partiallyArchivedOrders,1);
  assert.ok(before.data.rows.some(x=>x.lineId==='L4322B'&&x.status==='تم التسليم'));
  const separate=await call('getArchiveEligibilityV1');
  assert.equal(separate.code,200,JSON.stringify(separate.data));
  assert.equal(separate.data.archiveEligibility.available,true);
  assert.equal(separate.data.archiveEligibility.eligibleOrders,1);
  assert.equal(separate.data.archiveEligibility.partiallyArchivedOrders,1);
  assert.ok(!before.data.rows.some(x=>x.lineId==='L4322A'));
  const archived=await call('archiveDeliveredDepartmentV1926',{
    requestId:'ARCHIVE-CORRECT-COUNT-SINGLE'
  });
  assert.equal(archived.code,200,JSON.stringify(archived.data));
  assert.equal(archived.data.archivedOrders,1);
  assert.equal(archived.data.remainingEligible,0);
  assert.equal(archived.data.hasMore,false);
  const after=await call('getRows');
  assert.equal(after.code,200,JSON.stringify(after.data));
  assert.equal(after.data.archiveEligibility.eligibleOrders,0);
  assert.equal(after.data.archiveEligibility.partiallyArchivedOrders,1);
  const separateAfter=await call('getArchiveEligibilityV1');
  assert.equal(separateAfter.code,200);
  assert.equal(separateAfter.data.archiveEligibility.eligibleOrders,0);
  assert.ok(!after.data.rows.some(x=>x.lineId==='L54321'));
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM employee_core_archive_orders_v1 WHERE order_id='4322'").get().n,0);
});
test('UI renders D1 eligible whole-order counter after reload, not stale delivered lines',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const idx=app.indexOf('  function archiveDeliveredDetails() {');
  const end=app.indexOf('  function updateBulkStatusCount()',idx);
  assert.ok(idx>0&&end>idx);
  const calc=app.slice(idx,end);
  assert.match(app,/state.archiveEligibility = eligibility/);
  assert.match(app,/api\("getArchiveEligibilityV1"/);
  assert.match(app,/تعذر قراءة عداد D1/);
  assert.match(calc,/eligible\.eligibleOrders/);
  assert.match(calc,/eligible\.partiallyArchivedOrders/);
  assert.match(app,/جاهز للأرشفة على D1/);
  assert.match(app,/!archiveDetails\.eligibleKnown/);
  assert.doesNotMatch(calc,/serverStatusCounts\["تم التسليم"\]/);
});
test('archive health probe executes D1 SQL but never leaks eligible counts without authentication',async()=>{
  const f=fixture();deliver(f.db);
  const req=new Request('https://trendos-d1-api.example.test/v1/employee/core/health?archiveProbe=1',{method:'GET'});
  const r=await handleEmployeeCoreNativeRequest(req,f.env),body=await r.json();
  assert.equal(r.status,200);
  assert.equal(body.archiveProbe?.available,true);
  assert.equal(body.archiveEligibilityVersion,'T12_NATIVE_ARCHIVE_ELIGIBILITY_V4');
  assert.equal(body.archiveProbe?.eligibleOrders,undefined);
  assert.equal(body.archiveProbe?.partiallyArchivedOrders,undefined);
  assert.ok(body.actions.includes('getArchiveEligibilityV1'));
});
test('frontend explicitly routes D1 count read and never shows endless checking after a failed response',()=>{
  const core=readFileSync(new URL('../cloudflare-d1/src/employee-core-native-v1.mjs',import.meta.url),'utf8');
  const dispatch=readFileSync(new URL('../employee-api-dispatcher-v1.js',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(core,/getArchiveEligibilityV1/);
  assert.match(dispatch,/getArchiveEligibilityV1/);
  assert.match(core,/nativeArchiveEligibilitySql\(screen\)\}\`\)\.first\(\)/);
  assert.match(app,/archive-count-network-error/);
  assert.match(app,/orders-read-failed/);
  assert.match(app,/تعذر قراءة عداد D1/);
  assert.doesNotMatch(app,/state\.archiveEligibility = res\.archiveEligibility\s*&&/);
});
test('new archive action preserves original legacy bulk route only while feature OFF',()=>{
  const core=readFileSync(new URL('../cloudflare-d1/src/employee-core-native-v1.mjs',import.meta.url),'utf8');
  assert.match(core,/if\(env\?\.TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED==='true'\)/);
  assert.match(core,/FROM t12_prod_orders o/);
  assert.match(core,/COALESCE\(r.status,l.status\)<>'تم التسليم'/);
  assert.match(core,/remainingEligible>0/);
  assert.match(core,/closeAndArchiveT12OrderV1\(env,user/);
});
test('source integration prevents competing bulk archive writer in native-only mode',()=>{
  const core=readFileSync(new URL('../cloudflare-d1/src/employee-core-native-v1.mjs',import.meta.url),'utf8');
  assert.match(core,/CLOSE_ARCHIVE_ACTION\)out=await closeAndArchiveT12OrderV1/);
  assert.match(core,/archiveDeliveredDepartmentV1926'\)out=await archiveDelivered/);
  assert.match(core,/T12_NATIVE_COMPLETE_ORDERS_AUTO_BATCH_V2/);
  assert.match(core,/if\(env\?\.TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED==='true'\)/);
  const runtime=readFileSync(new URL('../cloudflare-d1/src/t12-operational-runtime-handler.mjs',import.meta.url),'utf8');
  assert.match(runtime,/nativeT12ArchiveWriteFenceV1\(env,orderId,lineId\)/);
  assert.match(core,/nativeT12ArchiveWriteFenceV1\(env,cloud.orderId,lineId\)/);
  const source=readFileSync(new URL('../cloudflare-d1/src/t12-native-close-archive-v1.mjs',import.meta.url),'utf8');
  assert.match(source,/TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED!=='true'/);
  assert.match(source,/native-archive-db-guard-not-armed/);
  const migration=readFileSync(new URL('../cloudflare-d1/migrations/0032_t12_native_archive_guard_v1.sql',import.meta.url),'utf8');
  assert.equal((migration.match(/CREATE TRIGGER IF NOT EXISTS/g)||[]).length,12);
  assert.match(migration,/VALUES\(1,'T12_NATIVE_ARCHIVE_GUARD_V1','OFF'\)/);
  assert.doesNotMatch(source,/APPS_SCRIPT_API_URL|script.google.com|employee_core_lines_v1/);
});
