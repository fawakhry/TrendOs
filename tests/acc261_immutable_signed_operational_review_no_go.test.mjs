import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {
 recordIsolatedReview as record,FIXTURE_DDL,POLICY,DOMAIN,
 verifyReview,signReview
} from '../cloudflare-d1/src/t12-native-operational-review-intent-acc261-fixture.mjs';
import {
 ACC257_PLATFORM_ORDER_SQL as ORDER,ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';
const root=resolve(process.env.ACC260_ORIGINAL_SOURCE_DIR||'__missing_original');
const sourceOriginal=resolve(root,'cloudflare-d1/src');
const {verifyNativeEmployeeSession}=await import(pathToFileURL(
 resolve(sourceOriginal,'employee-auth-native-v1.mjs')).href);
const {cloudAuthTokenFingerprint}=await import(pathToFileURL(
 resolve(sourceOriginal,'cloud-auth-shadow-v1.mjs')).href);
const originalDDL=readFileSync(resolve(root,
 'cloudflare-d1/migrations/0009_employee_auth_native_v1.sql'),'utf8');
const NOW=Date.now(),ORDER_ID='4323',KEY='acc261_fake_order_key',
 REQUEST='99000000-0000-4000-8000-000000000001';
const SECRET='ACC261_ISOLATED_FAKE_DEDICATED_HMAC_KEY_1234567890';
const employees=[
 {name:'وائل',department:'طباعة',role:'print',screen:'print',lineId:'4323-01'},
 {name:'جابر',department:'ليزر',role:'laser',screen:'laser',lineId:'4323-02'}
];
function fixture(){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0005_t12_production_create_canary','0006_t12_operational_runtime']){
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+name+
   '.fixture.sql.txt','utf8'));
 }
 raw.exec(originalDDL);
 raw.exec(FIXTURE_DDL);
 raw.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,'fixture-admin','isolated','{}',?,'COMMITTED')").run(KEY,ORDER_ID);
 raw.prepare("INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES (?,?,'external','FAKE','0000','FAKE','mixed','عادي','طلب جديد','fixture-admin')").run(ORDER_ID,KEY);
 for(const [i,p] of employees.entries()){
  raw.prepare("INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES(?,?,?,?,?,?,'item',1,'عادي','طلب جديد',0,0)").run(p.lineId,ORDER_ID,KEY,i+1,p.department,p.name);
  raw.prepare("INSERT INTO t12_prod_outbox(request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES(?,?,?,?,'trend-master-status-intent','pending','{}')").run(KEY,'queue:'+String(i+1).padStart(2,'0'),ORDER_ID,p.lineId);
 }
 raw.prepare("INSERT INTO t12_prod_events(request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create','{}')").run(KEY,ORDER_ID);
 for(const tbl of ['t12_prod_orders','t12_prod_request_ledger','t12_prod_lines','t12_prod_outbox','t12_prod_events'])
  raw.exec("UPDATE "+tbl+" SET created_at='2026-09-21 14:13:20'");
 const approvedRead=new Set([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME]);
 const stats={writes:0,batches:0};
 const DB={
  prepare(sql){
   assert.match(sql.trim(),/^SELECT /i,'D1 interface may only read');
   return {bind(...args){return {
    sql,args,async all(){return {results:raw.prepare(sql).all(...args)}},
    async first(){return raw.prepare(sql).get(...args)??null},
    async run(){stats.writes++;throw Error('No D1 write in ACC261')},
   }}};
  },
  async batch(statements){
   stats.batches++;
   assert.equal(statements.length,5);
   for(const s of statements)assert.ok(approvedRead.has(s.sql),'only original five T12 queries');
   return statements.map(s=>({success:true,results:raw.prepare(s.sql).all(...s.args)}));
  }
 };
 return {raw,stats,env:{
  DB,EDGE_SESSION_SECRET:'FAKE_EDGE_SHADOW_123',
  TRENDOS_DEPARTMENT_REVIEW_ACC259_MODE:'ISOLATED_NATIVE_REVIEW_READONLY',
  ACC261_MODE:'ISOLATED_SIGNED_REVIEW_SQLITE',
  ACC261_HMAC_SECRET:SECRET
 },close:()=>raw.close()};
}
async function login(f,p,opts={}){
 const token='ACC261_FAKE_NATIVE_TOKEN_'+p.role+'_12345';
 const fp=await cloudAuthTokenFingerprint(p.name,token,f.env);
 f.raw.prepare('INSERT INTO employee_auth_users_v1(employee_id,username_key,canonical_username,role,department,screens_json,active,must_change,session_version) VALUES(?,?,?,?,?,?,?,?,?)').run(
  p.role,p.name,p.name,opts.role||p.role,opts.department||p.department,
  JSON.stringify(opts.screens||[p.screen]),opts.inactive?0:1,opts.mustChange?1:0,1);
 f.raw.prepare("INSERT INTO employee_auth_sessions_v1(username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms,source) VALUES (?,?,?,?,?,?,'d1-native')").run(
  p.name,fp,opts.badVersion?2:1,NOW-3000,opts.expired?NOW-1:NOW+60000,NOW-1000);
 return token;
}
function issue(f,p,token,overrides={}){
 return record({env:f.env,fixtureDb:f.raw,
  verifyOriginalNativeSession:verifyNativeEmployeeSession,orderId:ORDER_ID,lineId:p.lineId,
  username:p.name,employeeToken:token,expectedVersion:0,
  requestKey:REQUEST,decision:'CONFIRM_OPERATIONAL_REVIEW_ONLY',
  nowMs:NOW,mode:'ISOLATED_SIGNED_REVIEW_SQLITE',...overrides});
}
async function run(fn){const f=fixture();try{await fn(f)}finally{f.close()}}
test('ACC261 original native login + immutable signed print/Wael review intent, no money',()=>run(async f=>{
 const token=await login(f,employees[0]);
 const before=f.raw.prepare('SELECT total_changes() n').get().n;
 const r=await issue(f,employees[0],token);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(r.idempotent,false);
 assert.equal(r.receipt.eventType,'operational_review_intent');
 assert.equal(r.receipt.department,'طباعة');
 assert.equal(r.receipt.sourceLineVersion,0);
 assert.equal(r.receipt.realSignedFinancialApproval,false);
 assert.equal(r.financeAuthorized,false);
 assert.equal(r.customerOwnershipAttested,false);
 assert.equal(r.financeRelease,'NO_GO');
 assert.equal(r.connectorEventPublished,false);
 assert.equal(await verifyReview(SECRET,r.receipt,r.signatureHex),true);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,1);
 assert.equal(f.raw.prepare('SELECT total_changes() n').get().n-before,1,
  'only fixture receipt is stored');
 assert.equal(f.stats.writes,0);
 assert.equal(f.raw.prepare('SELECT last_seen_at_ms n FROM employee_auth_sessions_v1').get().n,NOW-1000);
}));
test('ACC261 second department Gaber/laser gets a unique signed review receipt',()=>run(async f=>{
 const a=await login(f,employees[0]);
 const b=await login(f,employees[1]);
 const x=await issue(f,employees[0],a);
 const y=await issue(f,employees[1],b,{
  requestKey:'99000000-0000-4000-8000-000000000002'});
 assert.equal(x.success,true);assert.equal(y.success,true,JSON.stringify(y));
 assert.equal(y.receipt.department,'ليزر');
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,2);
}));
test('ACC261 same idempotency key replays exact unchanged bytes, never new line',()=>run(async f=>{
 const token=await login(f,employees[0]);
 const a=await issue(f,employees[0],token);
 const b=await issue(f,employees[0],token);
 assert.equal(a.success,true);assert.equal(b.success,true);
 assert.equal(b.idempotent,true);
 assert.deepEqual(a.receipt,b.receipt);
 assert.equal(a.signatureHex,b.signatureHex);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,1);
}));
test('ACC261 rejects new event ID for same source line revision, leaves original immutable',()=>run(async f=>{
 const token=await login(f,employees[0]);
 const a=await issue(f,employees[0],token);
 const b=await issue(f,employees[0],token,{
  requestKey:'99000000-0000-4000-8000-000000000009'});
 assert.equal(a.success,true);assert.equal(b.success,false);
 assert.equal(b.code,'ACC261_REPLAY_REVISION_SESSION_OR_TX_CONFLICT_NO_RETRY');
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,1);
}));
test('ACC261 rejects same idempotency key reused across another department',()=>run(async f=>{
 const a=await login(f,employees[0]),b=await login(f,employees[1]);
 assert.equal((await issue(f,employees[0],a)).success,true);
 assert.equal((await issue(f,employees[1],b)).success,false);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,1);
}));
test('ACC261 refuses tampered/nonfinancial escape signatures and wrong HMAC secret',()=>run(async f=>{
 const token=await login(f,employees[0]),r=await issue(f,employees[0],token);
 assert.equal(r.success,true);
 assert.equal(await verifyReview(SECRET,{...r.receipt,financeRelease:'GO'},r.signatureHex),false);
 assert.equal(await verifyReview(SECRET,{...r.receipt,eventType:'order_line_approved'},r.signatureHex),false);
 assert.equal(await verifyReview(SECRET,{...r.receipt,sourceLineVersion:3},r.signatureHex),false);
 assert.equal(await verifyReview('WRONG_ISOLATED_HMAC_SECRET_DO_NOT_USE_123',r.receipt,r.signatureHex),false);
 assert.equal(await verifyReview(SECRET,r.receipt,'0'.repeat(64)),false);
 assert.equal(DOMAIN.includes('NOT_FINANCE'),true);
}));
test('ACC261 exact explicit decision, isolated mode, fixture marker and strong key required',()=>run(async f=>{
 const token=await login(f,employees[0]);
 for(const q of [
  {decision:'approve'},{decision:'order_line_approved'},
  {mode:'OFF'},{expectedVersion:1},{requestKey:'bad'},
  {orderId:'sheet_rows:4323'}, {lineId:'4324-01'}
 ]){
  const r=await issue(f,employees[0],token,q);assert.equal(r.success,false,JSON.stringify(q));
 }
 f.env.ACC261_HMAC_SECRET='weak';
 assert.equal((await issue(f,employees[0],token)).code,'ACC261_HMAC_NOT_CONFIGURED');
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,0);
 assert.equal(POLICY.workerWired,false);
}));
test('ACC261 revoked/expired original native employee session is rejected',async()=>{
 for(const p of [{expired:true},{badVersion:true},{inactive:true},{mustChange:true}])
 await run(async f=>{
  const token=await login(f,employees[0],p);
  const r=await issue(f,employees[0],token);
  assert.equal(r.success,false,JSON.stringify({p,r}));
  assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,0);
 });
 await run(async f=>{
  const token=await login(f,employees[0]);
  f.raw.prepare('UPDATE employee_auth_sessions_v1 SET revoked_at_ms=?').run(NOW-1);
  assert.equal((await issue(f,employees[0],token)).success,false);
 });
});
test('ACC261 changed operational source revision/status cannot issue review',()=>run(async f=>{
 const token=await login(f,employees[0]);
 f.raw.prepare("INSERT INTO t12_prod_line_runtime(line_id,order_id,status,updated_by,version) VALUES ('4323-01','4323','ملغى','وائل',1)").run();
 f.raw.prepare("INSERT INTO t12_prod_runtime_events(order_id,line_id,event_type,old_status,new_status,actor) VALUES ('4323','4323-01','line-update','طلب جديد','ملغى','وائل')").run();
 assert.equal((await issue(f,employees[0],token)).success,false);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,0);
}));
test('ACC261 original employee session double-check catches revocation before SQLite commit',()=>run(async f=>{
 const token=await login(f,employees[0]);
 let count=0;
 const verify=async (...args)=>{
  const a=await verifyNativeEmployeeSession(...args);
  count++;
  if(count===2)f.raw.prepare('UPDATE employee_auth_sessions_v1 SET revoked_at_ms=?').run(NOW-1);
  return count===2?await verifyNativeEmployeeSession(...args):a;
 };
 const r=await issue(f,employees[0],token,{verifyOriginalNativeSession:verify});
 assert.equal(r.success,false);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,0);
}));
test('ACC261 fixture records strictly immutable; no finance or original runtime writes',()=>run(async f=>{
 const token=await login(f,employees[0]);
 assert.equal((await issue(f,employees[0],token)).success,true);
 assert.throws(()=>f.raw.exec("UPDATE acc261_intents SET actor='admin'"));
 assert.throws(()=>f.raw.exec("DELETE FROM acc261_intents"));
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM t12_prod_runtime_events').get().n,0);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM t12_prod_line_runtime').get().n,0);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM acc261_intents').get().n,1);
 const main=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(main.includes('acc261'),false);
 assert.equal(POLICY.realSignedFinancialApproval,false);
}));
