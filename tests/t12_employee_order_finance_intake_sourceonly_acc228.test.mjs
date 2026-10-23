import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ACC235_ISOLATED_SCHEMA as OUTBOX_SCHEMA,ACC235_SIGNED_OUTBOX_POLICY as OUTBOX_POLICY,persistOriginalSignedFixtureOnly as persistSigned,reserveSignedFixtureForSimulatedRetry as reserveSigned,releaseUnconfirmedFixtureLease as releaseSigned,isolateDeadLetterFixtureOnly as deadSigned} from '../cloudflare-d1/src/t12-finance-signed-outbox-acc235-offline.mjs';

import {
 buildT12SignedOrderCreatedSourceOnly as signOrder,
 verifyT12SignedOrderCreatedSourceOnly as verifyOrder,
 T12_FINANCE_ORDER_CREATED_POLICY as SIGNER_POLICY
} from '../cloudflare-d1/src/t12-finance-connector-v1-order-created-sourceonly.mjs';
import {
 inspectT12EmployeeOrderFinanceCandidate as inspect,
 T12_EMPLOYEE_INTAKE_ORDER_SQL as ORDER,
 T12_EMPLOYEE_INTAKE_LINES_SQL as LINES,
 T12_EMPLOYEE_INTAKE_ACTIVITY_SQL as ACTIVITY,
 T12_EMPLOYEE_INTAKE_OUTBOX_SQL as OUTBOX,
 T12_EMPLOYEE_INTAKE_RUNTIME_SQL as RUNTIME,
 T12_EMPLOYEE_FINANCE_INTAKE_POLICY as POLICY
} from '../cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs';
const C='CUS-FAKE-228',ORDER_ID='4323',KEY='cld1_1800000000000_EMPLOYEE228_TEST0001';
const A='service-actor-228';
function fixture(lanes=2,skipCapture=false){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0005_t12_production_create_canary.sql',
    '0006_t12_operational_runtime.sql',
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
 if(!skipCapture){
 raw.exec("UPDATE t12_order_customer_at_create_control_v1 SET mode='ISOLATED'");
 raw.prepare("INSERT INTO t12_order_customer_at_create_v1 (order_id,request_key,customer_id,external_customer_id,customer_version,actor_subject,evidence_ref,selector_role,selector_session_sha256,selector_issued_at,selector_expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  .run(ORDER_ID,KEY,C,'999002',1,A,'FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE',
      'service','a'.repeat(64),1800000000,1800000600);
 }


 // ACC229: emulate the ORIGINAL T12 writer's existing canonical_json shape,
 // including at-create signed selector source and exact old order line payload.
 const canonical={
  actor:A,policyEpoch:'FAKE_POLICY',requestKey:KEY,
  identity:{mode:'external',customerName:'FAKE CLIENT',customerPhone:'01000000000',externalCustomerId:'999002'},
  order:{department:lanes===2?'متعدد الأقسام':'طباعة',priority:'عادي',status:'طلب جديد',
   source:'T12 General Create',notes:'',heatPress:'لا',flyPrint:'لا'},
  lines:rows.slice(0,lanes).map((l,i)=>({
    ordinal:i+1,department:l.department,assignedTo:l.who,itemName:l.name,
    qty:1,priority:'عادي',status:'طلب جديد',heatPress:'لا',flyPrint:'لا'
  })),
  activityPlan:{requestKey:KEY,eventType:'order-create-intent'},
  queuePlans:rows.slice(0,lanes).map(l=>({
   requestKey:KEY,department:l.department,assignedTo:l.who,
   eventType:'trend-master-status-intent'
  }))
 };
 if(!skipCapture)canonical.sourceCapture={
  customerId:C,externalCustomerId:'999002',customerVersion:1,
  evidenceRef:'FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE',
  selectorRole:'service',selectorSessionSha256:'a'.repeat(64),
  selectorIssuedAt:1800000000,selectorExpiresAt:1800000600
 };
 raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?')
  .run(JSON.stringify(canonical),KEY);

 // The ORIGINAL T12 writer inserts one matching operational activity and
 // one per-line outbox row within its existing atomic create transaction.
 raw.prepare("INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create',?)")
  .run(KEY,ORDER_ID,JSON.stringify(canonical.activityPlan));
 for(let i=0;i<lanes;i++){
  raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,?,? ,?,'trend-master-status-intent','pending',?)")
   .run(KEY,'queue:'+String(i+1).padStart(2,'0'),ORDER_ID,
    ORDER_ID+'-'+String(i+1).padStart(2,'0'),JSON.stringify(canonical.queuePlans[i]));
 }
 // ACC234: fixed original create-time in disposable SQLite test fixture.
 for(const table of ['t12_prod_request_ledger','t12_prod_orders',
  't12_prod_lines','t12_prod_events','t12_prod_outbox']){
  raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'");
 }
 let batches=0;
 const db={
  prepare(sql){
   assert.ok([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME].includes(sql),'no arbitrary SQL');
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
async function withFixture(fn,lanes=2,skipCapture=false){
 const x=fixture(lanes,skipCapture);try{return await fn(x);}finally{x.dispose();}
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
 assert.equal(POLICY.comparesOriginalT12ActivityAndOutbox,true);
 assert.equal(POLICY.comparesCurrentT12RuntimeAndLastMutation,true);
 assert.equal(POLICY.validatesOriginalCreateTimestamps,true);
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
 assert.equal(res.body.sourceCreatedAt,'2026-09-21T14:13:20Z');
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
test('same-name committed T12 order without immutable customer capture is denied',()=>withFixture(async x=>{
 const r=await request(x);
 assert.equal(r.status,409);
 assert.equal(r.body.code,'OFFICIAL_CUSTOMER_CAPTURE_NOT_MATCHING_OR_UNATTESTED');
 assert.equal(r.body.financeAuthorized,false);
},1,true));
test('immutable T12 at-create source evidence cannot be removed or reassigned',()=>withFixture(async x=>{
 assert.throws(()=>x.raw.exec("DELETE FROM t12_order_customer_at_create_v1"),/ACC223_SOURCE_CAPTURE_IMMUTABLE/);
 assert.equal((await request(x)).status,200);
},1));
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
 // The original outbox FK protects lines; remove only its fake dependent
 // record first to model a truly partial/contradictory disposable database.
 x.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:01'");
 x.raw.exec("DELETE FROM t12_prod_lines WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-01',?,?,1,'طباعة','وائل','FAKE MUG - طباعة',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 x.raw.exec("UPDATE t12_prod_lines SET created_at='2026-09-21 14:13:20' WHERE line_id='4323-01'");
 const original=JSON.parse(x.raw.prepare('SELECT canonical_json AS c FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).c);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,'queue:01',?,?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-01',JSON.stringify(original.queuePlans[0]));
 x.raw.exec("UPDATE t12_prod_outbox SET created_at='2026-09-21 14:13:20' WHERE event_key='queue:01'");
 assert.equal((await request(x)).status,200);
 x.raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES ('4323-03',?,?,3,'ليزر','جابر','UNEXPECTED',1,'عادي','طلب جديد',0,0)").run(ORDER_ID,KEY);
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
}));
test('ACC229 detects mutated quantity, item name, priority or print flags even when old IDs stay correct',()=>withFixture(async x=>{
 for(const [change,undo] of [
  ["UPDATE t12_prod_lines SET qty=7 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET qty=1 WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET item_name='ALTERED' WHERE line_id='4323-02'",
   "UPDATE t12_prod_lines SET item_name='FAKE MUG - ليزر' WHERE line_id='4323-02'"],
  ["UPDATE t12_prod_lines SET priority='VIP' WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET priority='عادي' WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET heat_press=1 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET heat_press=0 WHERE line_id='4323-01'"],
  ["UPDATE t12_prod_lines SET fly_print=1 WHERE line_id='4323-01'",
   "UPDATE t12_prod_lines SET fly_print=0 WHERE line_id='4323-01'"]
 ]){
  x.raw.exec(change);
  const result=await request(x);
  assert.equal(result.status,409,change);
  assert.equal(result.body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED',change);
  x.raw.exec(undo);
  assert.equal((await request(x)).status,200,undo);
 }
}));
test('ACC229 detects changed original customer/department/notes and even matching-name based relabel',()=>withFixture(async x=>{
 for(const [change,undo] of [
  ["UPDATE t12_prod_orders SET customer_name='SAME-NAME-OTHER-USER'",
   "UPDATE t12_prod_orders SET customer_name='FAKE CLIENT'"],
  ["UPDATE t12_prod_orders SET customer_phone='01099999999'",
   "UPDATE t12_prod_orders SET customer_phone='01000000000'"],
  ["UPDATE t12_prod_orders SET notes='EXTRA PRIVATE NOTE'",
   "UPDATE t12_prod_orders SET notes=''"],
  ["UPDATE t12_prod_orders SET department='طباعة'",
   "UPDATE t12_prod_orders SET department='متعدد الأقسام'"],
  ["UPDATE t12_prod_orders SET source='UNTRUSTED'",
   "UPDATE t12_prod_orders SET source='T12 General Create'"]
 ]){
  x.raw.exec(change);
  const result=await request(x);
  assert.equal(result.body.code,'T12_ORIGINAL_CREATE_ORDER_DRIFT',change);
  x.raw.exec(undo);
  assert.equal((await request(x)).status,200,undo);
 }
}));
test('ACC229 refuses missing/corrupted ledger intent or edited selector capture inside ledger',()=>withFixture(async x=>{
 const original=x.raw.prepare('SELECT canonical_json val FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).val;
 for(const altered of ['{}','not-valid-json',
  JSON.stringify({...JSON.parse(original),sourceCapture:{
    ...JSON.parse(original).sourceCapture,evidenceRef:'FORGED_CHANGED_SELECTOR_PROOF'
  }}),
  JSON.stringify({...JSON.parse(original),lines:[JSON.parse(original).lines[0]]})
 ]){
  x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?').run(altered,KEY);
  const res=await request(x);
  assert.equal(res.status,409,altered.slice(0,60));
  assert.equal(res.body.financeAuthorized,false);
  x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?').run(original,KEY);
  assert.equal((await request(x)).status,200);
 }
}));
test('ACC229 policy epoch drift and wrong original queue plan do not qualify source',()=>withFixture(async x=>{
 x.raw.prepare("UPDATE t12_prod_request_ledger SET policy_epoch='CHANGED_POLICY' WHERE request_key=?").run(KEY);
 assert.equal((await request(x)).body.code,'ORIGINAL_T12_CREATE_INTENT_NOT_AVAILABLE');
 x.raw.prepare("UPDATE t12_prod_request_ledger SET policy_epoch='FAKE_POLICY' WHERE request_key=?").run(KEY);
 const canonical=JSON.parse(x.raw.prepare('SELECT canonical_json AS json FROM t12_prod_request_ledger WHERE request_key=?').get(KEY).json);
 canonical.queuePlans[1].department='طباعة';
 x.raw.prepare('UPDATE t12_prod_request_ledger SET canonical_json=? WHERE request_key=?')
   .run(JSON.stringify(canonical),KEY);
 assert.equal((await request(x)).body.code,'T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
}));
test('ACC230 original activity event missing, corrupted or wrong type stops operational finance candidate',()=>withFixture(async x=>{
 const before=x.raw.prepare("SELECT payload_json AS p FROM t12_prod_events WHERE event_key='activity'").get().p;
 x.raw.exec("UPDATE t12_prod_events SET payload_json='{}' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
 x.raw.prepare("UPDATE t12_prod_events SET payload_json=? WHERE event_key='activity'").run(before);
 assert.equal((await request(x)).status,200);
 x.raw.exec("UPDATE t12_prod_events SET event_type='finance-post' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
 x.raw.exec("UPDATE t12_prod_events SET event_type='order-create' WHERE event_key='activity'");
 x.raw.exec("DELETE FROM t12_prod_events WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ACTIVITY_EVENT_MISSING_OR_AMBIGUOUS');
}));
test('ACC230 rejects missing or extra queue event per original Print and Laser source line',()=>withFixture(async x=>{
 x.raw.exec("DELETE FROM t12_prod_outbox WHERE event_key='queue:02'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_OUTBOX_LINES_MISSING_OR_EXTRA');
 const original=JSON.parse(x.raw.prepare('SELECT canonical_json AS c FROM t12_prod_request_ledger').get().c);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?, 'queue:02', ?, ?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-02',JSON.stringify(original.queuePlans[1]));
 x.raw.exec("UPDATE t12_prod_outbox SET created_at='2026-09-21 14:13:20' WHERE event_key='queue:02'");
 assert.equal((await request(x)).status,200);
 x.raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?, 'queue:03', ?, ?,'trend-master-status-intent','pending',?)")
  .run(KEY,ORDER_ID,ORDER_ID+'-01',JSON.stringify(original.queuePlans[0]));
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_OUTBOX_LINES_MISSING_OR_EXTRA');
}));
test('ACC230 rejects wrong outbox line, wrong type, failed delivery, missing or corrupt payload',()=>withFixture(async x=>{
 for(const [change,undo,code] of [
  ["UPDATE t12_prod_outbox SET line_id='4323-01' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET line_id='4323-02' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET event_type='invoice-post' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET event_type='trend-master-status-intent' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET status='failed' WHERE event_key='queue:02'",
   "UPDATE t12_prod_outbox SET status='pending' WHERE event_key='queue:02'",'T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED'],
  ["UPDATE t12_prod_outbox SET payload_json='{}' WHERE event_key='queue:02'",
   null,'T12_ORIGINAL_OUTBOX_PAYLOAD_DRIFT']
 ]){
  const original=x.raw.prepare("SELECT payload_json AS p FROM t12_prod_outbox WHERE event_key='queue:02'").get().p;
  x.raw.exec(change);
  assert.equal((await request(x)).body.code,code,change);
  if(undo)x.raw.exec(undo);
  else x.raw.prepare("UPDATE t12_prod_outbox SET payload_json=? WHERE event_key='queue:02'").run(original);
  assert.equal((await request(x)).status,200);
 }
 x.raw.exec("UPDATE t12_prod_outbox SET status='done' WHERE event_key='queue:02'");
 const done=await request(x);
 assert.equal(done.status,200);
 assert.equal(done.body.financeAuthorized,false);
 assert.equal(done.body.connectorEventPublished,false);
}));
test('ACC230 no extra finance event or orders generated from initial T12 outbox',()=>withFixture(async x=>{
 const prior=x.raw.prepare("SELECT total_changes() AS n").get().n;
 const inspected=await request(x);
 assert.equal(inspected.status,200);
 assert.equal(x.raw.prepare("SELECT total_changes() AS n").get().n,prior);
 assert.equal(x.raw.prepare("SELECT COUNT(*) AS n FROM t12_prod_outbox").get().n,2);
 assert.equal(x.raw.prepare("SELECT COUNT(*) AS n FROM t12_prod_events").get().n,1);
 assert.equal(inspected.body.departmentApprovalsVerified,false);
 assert.equal(inspected.body.canRequestInvoice,false);
}));
// ACC232 current runtime is a source safety veto, NEVER a line approval.
function runtimeState(x,lineId,status,actor='wael-synthetic',version=1){
 x.raw.prepare(`INSERT INTO t12_prod_line_runtime
  (line_id,order_id,status,notes,updated_by,version)
  VALUES (?, ?, ?, '', ?, ?)`).run(lineId,ORDER_ID,status,actor,version);
}
function runtimeEvent(x,lineId,oldStatus,newStatus,actor='wael-synthetic',type='line-update'){
 x.raw.prepare(`INSERT INTO t12_prod_runtime_events
  (order_id,line_id,event_type,old_status,new_status,actor,payload_json)
  VALUES (?,?,?,?,?,?, '{}')`).run(ORDER_ID,lineId,type,oldStatus,newStatus,actor);
}
test('ACC232 current runtime cancels, blocks or duplicates any source line without changing finance authority',()=>withFixture(async x=>{
 assert.equal((await request(x)).status,200);
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 assert.equal((await request(x)).status,200);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 for(const blocked of ['ملغى','مكرر','متوقف']){
  runtimeState(x,'4323-02',blocked,'jaber-synthetic');
  runtimeEvent(x,'4323-02','طلب جديد',blocked,'jaber-synthetic');
  const r=await request(x);
  assert.equal(r.status,409,blocked);
  assert.equal(r.body.code,'T12_RUNTIME_LINE_CANCELLED_DUPLICATE_OR_STOPPED',blocked);
  assert.equal(r.body.financeAuthorized,false);
  x.raw.exec("DELETE FROM t12_prod_runtime_events WHERE line_id='4323-02'");
  x.raw.exec("DELETE FROM t12_prod_line_runtime WHERE line_id='4323-02'");
 }
}));
test('ACC232 healthy runtime and WhatsApp status do not confer Wail/Gaber financial approval',()=>withFixture(async x=>{
 runtimeState(x,'4323-01','جاهز للاستلام');
 runtimeEvent(x,'4323-01','طلب جديد','جاهز للاستلام');
 let r=await request(x);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.departmentApprovalsVerified,false);
 assert.equal(r.body.canRequestInvoice,false);
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=2 WHERE line_id='4323-01'");
 runtimeEvent(x,'4323-01','جاهز للاستلام','جاهز للاستلام','wael-synthetic','whatsapp-ready_notify');
 r=await request(x);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.connectorEventPublished,false);
 assert.equal(r.body.canRequestInvoice,false);
}));
test('ACC232 missing last runtime event, altered actor/status/version or orphan event fails closed',()=>withFixture(async x=>{
 runtimeState(x,'4323-01','بدأ التنفيذ');
 let r=await request(x);
 assert.equal(r.body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 runtimeEvent(x,'4323-01','طلب جديد','بدأ التنفيذ');
 assert.equal((await request(x)).status,200);
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=2 WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("UPDATE t12_prod_line_runtime SET version=1,updated_by='FORGED' WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("UPDATE t12_prod_line_runtime SET updated_by='wael-synthetic',status='جاهز للاستلام' WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_STATUS_EVENT_OR_ACTOR_DRIFT');
 x.raw.exec("DELETE FROM t12_prod_line_runtime WHERE line_id='4323-01'");
 assert.equal((await request(x)).body.code,'T12_RUNTIME_EVENT_WITHOUT_STATE');
}));
test('ACC232 original unmodified create and current runtime remain a single read-only D1 batch',()=>withFixture(async x=>{
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const r=await request(x);
 assert.equal(r.status,200);
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 assert.equal(r.body.sourceOnly,true);
 assert.equal(r.body.readOnly,true);
 assert.equal(r.body.officialCustomerOwnershipAttested,false);
}));

// ACC233 signed order-created: only invented keys/data, never the accounting DB.
const FIXTURE_KEY_ID='ACC233_FAKE_SIGNING_KEY';
const fakeSignKey=()=>webcrypto.subtle.importKey('raw',
 new Uint8Array(32).fill(31),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const otherSignKey=()=>webcrypto.subtle.importKey('raw',
 new Uint8Array(32).fill(42),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const SIGN_TIME=1790000000000;
const signed=(x,signKey)=>signOrder({
 db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
 signKey,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME
});
const verified=(message,verifyKey,nowMs=SIGN_TIME)=>verifyOrder({
 message,verifyKey,expectedKeyId:FIXTURE_KEY_ID,nowMs
});
test('ACC233 signed order-created is OFF, not Worker-wired, and never a financial approval',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const signer=readFileSync('cloudflare-d1/src/t12-finance-connector-v1-order-created-sourceonly.mjs','utf8');
 assert.doesNotMatch(worker,/t12-finance-connector-v1-order-created-sourceonly/);
 assert.doesNotMatch(signer,/saveAccountingFinalInvoice\s*\(|fetch\s*\(|INSERT INTO|UPDATE\s+t12_prod/);
 assert.equal(SIGNER_POLICY.defaultMode,'OFF');
 assert.equal(SIGNER_POLICY.onlyEventType,'order_created');
 assert.equal(SIGNER_POLICY.departmentApprovalsVerified,false);
 assert.equal(SIGNER_POLICY.invoicePostingAllowed,false);
});
test('ACC233 signs EXACT source-owned T12 order_created V1 envelope with no personal or financial data',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const r=await signed(x,key);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(x.batches(),1);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 assert.equal(r.message.envelope.event_type,'order_created');
 assert.equal(r.message.envelope.contract_version,'ACCOUNTING_CONNECTOR_CONTRACT_V1');
 assert.equal(r.message.envelope.occurred_at,'2026-09-21T14:13:20Z');
 assert.equal(SIGNER_POLICY.timestampAnchoredToOriginalT12Create,true);
 assert.equal(r.message.envelope.payload.expected_line_count,2);
 assert.deepEqual(r.message.envelope.payload.lines.map(l=>l.department),['طباعة','ليزر']);
 assert.equal(r.message.envelope.payload.customer_id,C);
 assert.equal(r.message.envelope.payload.finance_authorized,false);
 assert.equal(r.connectorEventPublished,false);
 for(const privateText of ['FAKE CLIENT','01000000000','999002','FAKE_ACC228_SIGNED_SELECTOR_EVIDENCE']){
  assert.equal(JSON.stringify(r).includes(privateText),false);
 }
 const v=await verified(r.message,key);
 assert.equal(v.success,true,JSON.stringify(v));
 assert.equal(v.cryptographicSignatureVerified,true);
 assert.equal(v.officialCustomerOwnershipAttested,false);
 assert.equal(v.departmentApprovalsVerified,false);
 assert.equal(v.invoicePostingAllowed,false);
 assert.equal(v.replayLedgerVerified,false);
}));
test('ACC233 deterministic event identity/signature for retries but no replay ledger attested',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const a=await signed(x,key),b=await signOrder({
  db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME+120000
 });
 assert.equal(a.success,true);assert.equal(b.success,true);
 assert.deepEqual(a.message,b.message);
 assert.equal(a.message.envelope.event_id,'t12:order_created:'+ORDER_ID);
 assert.equal(a.message.envelope.idempotency_key,a.message.envelope.event_id);
 assert.equal((await verified(a.message,key)).replayLedgerVerified,false);
},1));
test('ACC233 rejects unauthorized modes, missing/wrong keys and incomplete source',()=>withFixture(async x=>{
 const k=await fakeSignKey();
 const deny=await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:C,signKey:k,keyId:FIXTURE_KEY_ID});
 assert.equal(deny.code,'SIGNER_DEFAULT_OFF');
 assert.equal(x.batches(),0);
 assert.equal((await signed(x,null)).code,'SIGNING_INPUT_OR_KEY_UNQUALIFIED');
 assert.equal((await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:'WRONG_CUSTOMER',signKey:k,
  keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME}))
 .code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
}));
test('ACC233 existing order after cancelled T12 line cannot obtain a signed operational message',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 runtimeState(x,'4323-02','ملغى','jaber-synthetic');
 runtimeEvent(x,'4323-02','طلب جديد','ملغى','jaber-synthetic');
 const r=await signed(x,key);
 assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
 assert.equal(r.connectorEventPublished,false);
}));
test('ACC233 altered signed line, customer, event type and hidden finance flag fail contract/signature',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const created=await signed(x,key);
 assert.equal(created.success,true);
 for(const patch of [
  m=>{m.envelope.payload.customer_id='ANOTHER';},
  m=>{m.envelope.payload.lines[1].department='طباعة';},
  m=>{m.envelope.event_type='order_line_approved';},
  m=>{m.envelope.payload.finance_authorized=true;},
  m=>{m.envelope.payload.lines[0].line_id='4323-02';}
 ]){
  const forged=structuredClone(created.message);patch(forged);
  const result=await verified(forged,key);
  assert.equal(result.success,false,JSON.stringify(result));
  assert.equal(result.invoicePostingAllowed,false);
 }
 const reworded=structuredClone(created.message);
 reworded.envelope.evidence_refs[0]='t12:original-ledger:OTHER';
 assert.equal((await verified(reworded,key)).success,false);
}));
test('ACC233 mismatched signer identity, wrong verifier key and corrupted signature fail closed',()=>withFixture(async x=>{
 const key=await fakeSignKey(),other=await otherSignKey();
 const created=await signed(x,key);assert.equal(created.success,true);
 assert.equal((await verified(created.message,other)).code,'SOURCE_SIGNATURE_MISMATCH');
 assert.equal((await verifyOrder({message:created.message,verifyKey:key,
  expectedKeyId:'ANOTHER_KEY',nowMs:SIGN_TIME})).code,'UNTRUSTED_SIGNER_OR_ENVELOPE');
 const forged=structuredClone(created.message);
 forged.signature='THIS_IS_NOT_BASE64_SIGNATURE';
 assert.equal((await verified(forged,key)).code,'MALFORMED_SOURCE_SIGNATURE');
}));
test('ACC233 event expiry and future timestamp reject even valid cryptographic HMAC',()=>withFixture(async x=>{
 const key=await fakeSignKey(),r=await signed(x,key);
 assert.equal(r.success,true);
 assert.equal((await verified(r.message,key,SIGN_TIME+301000)).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
 assert.equal((await verified(r.message,key,SIGN_TIME-61000)).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
 assert.equal((await verified(r.message,key,SIGN_TIME+299000)).success,true);
}));
test('ACC233 no absent capture, changed original item, or forged runtime signature from original T12',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 x.raw.exec("UPDATE t12_prod_lines SET item_name='UNTRUSTED ITEM' WHERE line_id='4323-01'");
 const r=await signed(x,key);
 assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
},2));


test('ACC234 original event timestamp stabilizes retries but unsigned history has a five-minute limit',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const a=await signed(x,key);
 const b=await signOrder({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME+300000});
 assert.equal(a.success,true);
 assert.equal(b.success,true);
 assert.deepEqual(a.message,b.message);
 assert.equal(a.message.envelope.occurred_at,'2026-09-21T14:13:20Z');
 const old=await signOrder({db:x.db,orderId:ORDER_ID,
  expectedOfficialCustomerId:C,signKey:key,keyId:FIXTURE_KEY_ID,
  mode:'ISOLATED_SOURCE_ONLY',nowMs:SIGN_TIME+300001});
 assert.equal(old.code,'ORIGINAL_T12_CREATE_OUTSIDE_SIGNING_WINDOW');
 assert.equal(old.connectorEventPublished,false);
 assert.equal((await verifyOrder({message:a.message,verifyKey:key,
  expectedKeyId:FIXTURE_KEY_ID,nowMs:SIGN_TIME+300001})).code,
  'EXPIRED_OR_FUTURE_SOURCE_EVENT');
}));
test('ACC234 source time cannot be borrowed from changed ledger, order or line',()=>withFixture(async x=>{
 for(const table of ['t12_prod_request_ledger','t12_prod_orders','t12_prod_lines']){
  const where=table==='t12_prod_lines'?" WHERE line_id='4323-02'":'';
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:15:30'"+where);
  const r=await request(x);
  assert.equal(r.status,409,table);
  assert.equal(r.body.code,'T12_ORIGINAL_CREATE_TIMESTAMP_MISSING_OR_DRIFTED',table);
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'"+where);
  assert.equal((await request(x)).status,200,table);
 }
}));
test('ACC234 activity/outbox creation timestamps cannot come from retry wall-clock',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 for(const [table,where] of [
  ['t12_prod_events'," WHERE event_key='activity'"],
  ['t12_prod_outbox'," WHERE event_key='queue:02'"]
 ]){
  x.raw.exec("UPDATE "+table+" SET created_at='1970-01-01 00:00:00'"+where);
  const r=await signed(x,key);
  assert.equal(r.code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED',table);
  x.raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'"+where);
  assert.equal((await signed(x,key)).success,true,table);
 }
 x.raw.exec("UPDATE t12_prod_events SET created_at='2026-02-30 14:13:20' WHERE event_key='activity'");
 assert.equal((await request(x)).body.code,'T12_ORIGINAL_CREATE_TIMESTAMP_MISSING_OR_DRIFTED');
}));
test('ACC234 rejects future creation and ambiguous local timestamp values',()=>withFixture(async x=>{
 const key=await fakeSignKey();
 const future=await signOrder({db:x.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
  signKey:key,keyId:FIXTURE_KEY_ID,mode:'ISOLATED_SOURCE_ONLY',
  nowMs:SIGN_TIME-61000});
 assert.equal(future.code,'ORIGINAL_T12_CREATE_OUTSIDE_SIGNING_WINDOW');
 x.raw.exec("UPDATE t12_prod_orders SET created_at='2026-09-21T14:13:20Z'");
 assert.equal((await signed(x,key)).code,'ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
}));


function acc235OfflineDb(filename=':memory:',initialize=true){
 const raw=new DatabaseSync(filename);if(initialize)raw.exec(OUTBOX_SCHEMA);
 const db={prepare(sql){const stmt=raw.prepare(sql);return {bind(...args){return {
  async first(){return stmt.get(...args)||null},async run(){return stmt.run(...args)}
 }}}}};
 const row=()=>raw.prepare('SELECT * FROM acc235_signed_outbox_fixture').get();
 return {raw,db,row,close(){raw.close()}};
}
const acc235Mode='ISOLATED_SQLITE_FIXTURE';
const acc235Event='t12:order_created:'+ORDER_ID;
const acc235Stage=(x,store,key,nowMs=SIGN_TIME,verifyKey=key)=>persistSigned({
 sourceDb:x.db,outboxDb:store.db,orderId:ORDER_ID,expectedOfficialCustomerId:C,
 signKey:key,verifyKey,keyId:FIXTURE_KEY_ID,nowMs,mode:acc235Mode});
const acc235Reserve=(store,key,nowMs=SIGN_TIME+1000,leaseOwner='A')=>reserveSigned({
 outboxDb:store.db,eventId:acc235Event,verifyKey:key,keyId:FIXTURE_KEY_ID,
 nowMs,leaseOwner,mode:acc235Mode});
test('ACC235-OUTBOX remains isolated OFF, signed bytes immutable, source D1 read-only',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey(),before=x.raw.prepare('SELECT total_changes() n').get().n;
  assert.equal(OUTBOX_POLICY.defaultMode,'OFF');
  assert.equal(OUTBOX_POLICY.financialPostingAllowed,false);
  assert.doesNotMatch(readFileSync('cloudflare-d1/src/index_v2.js','utf8'),/t12-finance-signed-outbox-acc235-offline/);
  assert.equal((await persistSigned({sourceDb:x.db,outboxDb:store.db,orderId:ORDER_ID,
   expectedOfficialCustomerId:C,signKey:key,verifyKey:key,keyId:FIXTURE_KEY_ID,
   nowMs:SIGN_TIME})).code,'OUTBOX_DEFAULT_OFF');
  const r=await acc235Stage(x,store,key);assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.connectorEventPublished,false);
  assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
  assert.equal(store.row().state,'PENDING');
  assert.equal(JSON.parse(store.row().payload_json).envelope.event_type,'order_created');
  assert.throws(()=>store.raw.exec("UPDATE acc235_signed_outbox_fixture SET payload_json='{}'"),/ACC235_SIGNED_BYTES_IMMUTABLE/);
  assert.throws(()=>store.raw.exec('DELETE FROM acc235_signed_outbox_fixture'),/ACC235_SIGNED_OUTBOX_NO_DELETE/);
 }finally{store.close()}
}));
test('ACC235-OUTBOX same order HMAC persisted only once across different retry seconds',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const before=store.row();const r=await acc235Stage(x,store,key,SIGN_TIME+120000);
  assert.equal(r.success,true,JSON.stringify(r));assert.deepEqual(store.row(),before);
  assert.equal(store.raw.prepare('SELECT COUNT(*) n FROM acc235_signed_outbox_fixture').get().n,1);
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME+301000)).code,'ORIGINAL_SOURCE_NOT_SIGNABLE');
 }finally{store.close()}
}));
test('ACC235-OUTBOX CAS lease excludes second sender and retries exact original bytes after crash',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const original=store.row().payload_json;
  const first=await acc235Reserve(store,key);assert.equal(first.success,true,JSON.stringify(first));
  assert.equal((await acc235Reserve(store,key,SIGN_TIME+1000,'OTHER')).code,'OUTBOX_ALREADY_LEASED');
  assert.equal((await releaseSigned({outboxDb:store.db,eventId:acc235Event,
   leaseOwner:'OTHER',nowMs:SIGN_TIME+2000,mode:acc235Mode})).success,false);
  const retry=await acc235Reserve(store,key,SIGN_TIME+17000,'OTHER');
  assert.equal(retry.success,true,JSON.stringify(retry));
  assert.equal(retry.attempts,2);
  assert.equal(JSON.stringify(retry.originalSignedMessage),original);
  assert.equal(first.consumerAcknowledged,false);
 }finally{store.close()}
}));
test('ACC235-OUTBOX enforces max attempts, explicit dead letter and rejects re-stage of dead event',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey();assert.equal((await acc235Stage(x,store,key)).success,true);
  const a=await acc235Reserve(store,key);assert.equal(a.success,true);
  assert.equal((await deadSigned({outboxDb:store.db,eventId:acc235Event,
   nowMs:SIGN_TIME+2000,mode:acc235Mode})).success,false);
  const b=await acc235Reserve(store,key,SIGN_TIME+17000,'B');assert.equal(b.success,true);
  const c=await acc235Reserve(store,key,SIGN_TIME+33000,'C');assert.equal(c.success,true);
  assert.equal((await acc235Reserve(store,key,SIGN_TIME+49000,'D')).code,'OUTBOX_RETRY_BUDGET_EXHAUSTED');
  const dead=await deadSigned({outboxDb:store.db,eventId:acc235Event,
   nowMs:SIGN_TIME+49000,mode:acc235Mode});
  assert.equal(dead.success,true);assert.equal(dead.consumerAcknowledged,false);
  assert.equal(store.row().state,'DEAD_LETTER');
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME+50000)).code,'OUTBOX_IMMUTABLE_EVENT_IDEMPOTENCY_CONFLICT');
 }finally{store.close()}
}));
test('ACC235-OUTBOX verifies pinned signer, source cancellation and stale event before claiming',()=>withFixture(async x=>{
 const store=acc235OfflineDb();try{
  const key=await fakeSignKey(),wrong=await otherSignKey();
  assert.equal((await acc235Stage(x,store,key,SIGN_TIME,wrong)).code,'OUTBOX_SIGNER_VERIFIER_UNMATCHED');
  assert.equal((await acc235Stage(x,store,key)).success,true);
  assert.equal((await acc235Reserve(store,wrong)).code,'OUTBOX_SIGNATURE_STALE_OR_UNVERIFIED');
  assert.equal((await acc235Reserve(store,key,SIGN_TIME+301000)).code,'OUTBOX_SIGNATURE_STALE_OR_UNVERIFIED');
  assert.equal(store.row().attempts,0);
 }finally{store.close()}
}));
test('ACC235-OUTBOX survives close/reopen of disposable disk SQLite and concurrent claims are exclusive',()=>withFixture(async x=>{
 const dir=mkdtempSync(join(tmpdir(),'trend-acc235-')),file=join(dir,'test.sqlite');
 let store;try{
  const key=await fakeSignKey();store=acc235OfflineDb(file);
  assert.equal((await acc235Stage(x,store,key)).success,true);
  const signed=store.row().payload_json;store.close();store=null;
  store=acc235OfflineDb(file,false);
  const [a,b]=await Promise.all([
   acc235Reserve(store,key,SIGN_TIME+1000,'A'),
   acc235Reserve(store,key,SIGN_TIME+1000,'B')
  ]);
  assert.equal([a,b].filter(v=>v.success).length,1,JSON.stringify([a,b]));
  assert.equal(JSON.stringify((a.success?a:b).originalSignedMessage),signed);
  assert.equal(store.row().attempts,1);
 }finally{store?.close();rmSync(dir,{recursive:true,force:true})}
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
