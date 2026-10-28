import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
 inspectOriginalNativeReviewerACC259 as inspect,
 ACC259_POLICY,ACC259_ASSIGNED_LINE_SQL
} from '../cloudflare-d1/src/t12-native-department-review-acc259-sourceonly.mjs';
import {
 ACC257_PLATFORM_ORDER_SQL as ORDER,ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';

const ORDER_ID='4323',KEY='cld1_FAKE_ACC259',ACTOR='owner-fake';
function fixture(){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0005_t12_production_create_canary','0006_t12_operational_runtime']){
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+name+'.fixture.sql.txt','utf8'));
 }
 raw.prepare(`INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,?,'fake','{}',?,'COMMITTED')`).run(KEY,ACTOR,ORDER_ID);
 raw.prepare(`INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES (?,?,'external','TEST NAME','TEST PHONE','TEST_CODE','متعدد الأقسام','عادي','طلب جديد',?)`).run(ORDER_ID,KEY,ACTOR);
 for(const [i,dept,who] of [[1,'طباعة','وائل'],[2,'ليزر','جابر']]){
  const lineId=ORDER_ID+'-'+String(i).padStart(2,'0');
  raw.prepare(`INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES (?,?,?,?,?,?,'test-print',1,'عادي','طلب جديد',0,0)`).run(lineId,ORDER_ID,KEY,i,dept,who);
  raw.prepare(`INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,?,?,?,'trend-master-status-intent','pending','{}')`).run(KEY,'queue:'+String(i).padStart(2,'0'),ORDER_ID,lineId);
 }
 raw.prepare(`INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create','{}')`).run(KEY,ORDER_ID);
 for(const table of ['t12_prod_orders','t12_prod_request_ledger','t12_prod_lines','t12_prod_outbox','t12_prod_events'])
  raw.exec("UPDATE "+table+" SET created_at='2026-09-21 14:13:20'");
 const allowed=new Set([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME,ACC259_ASSIGNED_LINE_SQL]);
 let batches=0,reads=0;
 const db={
  prepare(sql){
   assert.ok(allowed.has(sql),'Only original T12 native source reads permitted');
   return {bind(...args){return {
    async all(){reads++;return {results:raw.prepare(sql).all(...args)}},
    first(){throw Error('Unexpected nonbatch first()')},
    run(){throw Error('ACC259 must never write')}
   }}}
  },
  async batch(statements){
   batches++;
   return statements.map(x=>{throw Error('Prepared SQL missing')});
  }
 };
 // A D1-compatible prepared statement batch can keep source reads grouped.
 db.prepare=sql=>{
  assert.ok(allowed.has(sql),'Unexpected query');
  return {bind(...args){return {
   sql,args,
   async all(){reads++;return {results:raw.prepare(sql).all(...args)}},
   first(){throw Error('Nonbatch first forbidden')},
   run(){throw Error('ACC259 write forbidden')}
  }}};
 };
 db.batch=async stmts=>{
  batches++;
  raw.exec('SAVEPOINT acc259_read');
  try{return stmts.map(s=>({success:true,results:raw.prepare(s.sql).all(...s.args)}))}
  finally{raw.exec('RELEASE SAVEPOINT acc259_read')}
 };
 return {raw,db,batches:()=>batches,reads:()=>reads,close:()=>raw.close()};
}
const now=Date.now();
function verifier({role,dept,username,active=true,mustChange=false,expired=false,source='d1-native-employee-v1'}={}){
 return async (u,t,env,ms,opts)=>{
  assert.deepEqual(opts,{readOnly:true},'must call ORIGINAL session verifier read-only');
  assert.equal(u,username||u);
  if(t!=='FAKE_NATIVE_SESSION_TOKEN')return {hit:false};
  return {hit:true,authSource:source,expiresAtMs:expired?ms-1:ms+60000,
   body:{success:true,user:{username:username||u,active,mustChange,
    role:role||((u==='وائل')?'print':'laser'),
    department:dept||((u==='وائل')?'طباعة':'ليزر'),
    screens:[role||((u==='وائل')?'print':'laser')]}}};
 };
}
function run(f,{lineId=ORDER_ID+'-01',username='وائل',token='FAKE_NATIVE_SESSION_TOKEN',
  auth=verifier(),mode='ISOLATED_NATIVE_REVIEW_READONLY',config=mode,orderId=ORDER_ID}={}){
 return inspect({env:{DB:f.db,TRENDOS_DEPARTMENT_REVIEW_ACC259_MODE:config},
  orderId,lineId,username,employeeToken:token,
  verifyOriginalNativeSession:auth,mode,nowMs:now});
}
async function withFixture(fn){const f=fixture();try{return await fn(f)}finally{f.close()}}
test('ACC259 checks original native T12 print/Wael assignee and source rev without write',()=>withFixture(async f=>{
 const original=f.raw.prepare('SELECT total_changes() AS n').get().n;
 const r=await run(f);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(r.employeeNativeSessionVerified,true);
 assert.equal(r.operationalReviewerMatched,true);
 assert.equal(r.assignedTo,'وائل');assert.equal(r.lineId,'4323-01');
 assert.equal(r.currentOperationalLineVersion,0);
 assert.equal(r.realSignedLineApproval,false);
 assert.equal(r.customerOwnershipAttested,false);
 assert.equal(r.financeAuthorized,false);
 assert.equal(r.invoicePostingAllowed,false);
 assert.equal(r.approvalEventPublished,false);
 assert.equal(r.productionRelease,'NO_GO');
 assert.equal(f.batches(),2);
 assert.equal(f.reads(),1);
 assert.equal(f.raw.prepare('SELECT total_changes() AS n').get().n,original);
}));
test('ACC259 laser/Gaber resolves same original native order',()=>withFixture(async f=>{
 const r=await run(f,{lineId:'4323-02',username:'جابر'});
 assert.equal(r.success,true);
 assert.equal(r.department,'ليزر');
 assert.equal(r.currentOperationalLineVersion,0);
}));
test('ACC259 requires original native verifier hook and explicit OFF config',()=>withFixture(async f=>{
 assert.equal((await run(f,{auth:null})).success,false);
 assert.equal((await run(f,{mode:'OFF'})).code,'ACC259_DISABLED');
 assert.equal((await run(f,{config:'OFF'})).code,'ACC259_DISABLED');
 assert.equal(ACC259_POLICY.workerWired,false);
 assert.equal(f.batches(),0);
}));
test('ACC259 rejects stale, false or non-native sessions',()=>withFixture(async f=>{
 for(const p of [{auth:verifier({expired:true})},
   {auth:verifier({active:false})},{auth:verifier({mustChange:true})},
   {auth:verifier({source:'legacy-google-session'})},
   {token:'BAD_SESSION_TOKEN'}]){
  const r=await run(f,p);assert.equal(r.success,false,JSON.stringify(r));
 }
 assert.equal(f.batches(),0);
}));
test('ACC259 rejects admin bypass, wrong department, screen, wrong line actor',()=>withFixture(async f=>{
 for(const opts of [
  {auth:verifier({role:'admin'})},
  {auth:verifier({dept:'ليزر'})},
  {auth:verifier({role:'laser'})},
  {lineId:'4323-02',username:'وائل'},
  {lineId:'4323-01',username:'جابر'}
 ]){
  const r=await run(f,opts);assert.equal(r.success,false,JSON.stringify(r));
 }
}));
test('ACC259 rejects login username different from original assignedTo, no guessed alias',()=>withFixture(async f=>{
 const r=await run(f,{username:'print-operator',auth:verifier({username:'print-operator',role:'print',dept:'طباعة'})});
 assert.equal(r.code,'ACC259_ORIGINAL_LINE_ASSIGNEE_NOT_VERIFIED');
}));
test('ACC259 never accepts cross-source, non-native order, changed assignment',()=>withFixture(async f=>{
 assert.equal((await run(f,{orderId:'sheet_rows:4323'})).success,false);
 assert.equal((await run(f,{lineId:'4324-01'})).success,false);
 f.raw.prepare("UPDATE t12_prod_lines SET assigned_to='غير معتمد' WHERE line_id='4323-01'").run();
 assert.equal((await run(f)).code,'ACC259_NATIVE_ORDER_UNQUALIFIED');
}));
test('ACC259 rejects cancelled original runtime; status update is not approval',()=>withFixture(async f=>{
 f.raw.prepare("INSERT INTO t12_prod_line_runtime (line_id,order_id,status,updated_by,version) VALUES ('4323-01','4323','ملغى','وائل',1)").run();
 f.raw.prepare("INSERT INTO t12_prod_runtime_events (order_id,line_id,event_type,old_status,new_status,actor) VALUES ('4323','4323-01','line-update','طلب جديد','ملغى','وائل')").run();
 const r=await run(f);
 assert.equal(r.success,false);assert.equal(r.financeAuthorized,false);
}));
test('ACC259 no public Worker route or independent finance event',()=>{
 const main=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(main.includes('t12-native-department-review-acc259-sourceonly'),false);
 assert.equal(ACC259_POLICY.approvalEventPublished,false);
 assert.equal(ACC259_POLICY.independentFinancialGrantVerified,false);
 assert.equal(ACC259_POLICY.realSignedLineApproval,false);
});
