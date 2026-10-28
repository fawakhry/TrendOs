/* ACC260 — genuine ORIGINAL TrendOS native session verification in offline CI.
 * Joined to current isolated ACC259 ORIGINAL T12 source, not to a copied auth
 * module. The real verifier is imported from an exact-pinned original PR commit.
 * All DB rows/tokens/order lines below are synthetic and ephemeral SQLite.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {inspectOriginalNativeReviewerACC259 as inspect} from
 '../cloudflare-d1/src/t12-native-department-review-acc259-sourceonly.mjs';
import {
 ACC257_PLATFORM_ORDER_SQL as ORDER,ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';

const source=process.env.ACC260_ORIGINAL_SOURCE_DIR;
assert.ok(source,'ACC260 needs exact pinned original TrendOS source checkout');
const original=resolve(source,'cloudflare-d1/src');
const {verifyNativeEmployeeSession}=await import(pathToFileURL(
 resolve(original,'employee-auth-native-v1.mjs')).href);
const {cloudAuthTokenFingerprint}=await import(pathToFileURL(
 resolve(original,'cloud-auth-shadow-v1.mjs')).href);
const originalDDL=readFileSync(resolve(source,
 'cloudflare-d1/migrations/0009_employee_auth_native_v1.sql'),'utf8');
const SECRET='ACC260-FAKE-native-fingerprint-test-only-not-production';
const AT='2026-09-21 14:13:20',ID='4323',KEY='cld1_FAKE_ACC260';
const MODE='ISOLATED_NATIVE_REVIEW_READONLY';
const NOW=Date.now();
const EMPLOYEES=[{who:'وائل',role:'print',department:'طباعة',screen:'print'},
 {who:'جابر',role:'laser',department:'ليزر',screen:'laser'}];
function fixture(){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0005_t12_production_create_canary','0006_t12_operational_runtime']){
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+
   name+'.fixture.sql.txt','utf8'));
 }
 raw.exec(originalDDL);
 raw.prepare("INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES (?,?, 'FAKE','{}',?,'COMMITTED')").run(KEY,'fake-creator',ID);
 raw.prepare("INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES (?,?,'external','FAKE CUSTOMER','0000-FAKE','FAKE_CODE','متعدد الأقسام','عادي','طلب جديد',?)").run(ID,KEY,'fake-creator');
 for(const [i,p] of EMPLOYEES.entries()){
  const line=ID+'-'+String(i+1).padStart(2,'0');
  raw.prepare("INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) VALUES (?,?,?,?,?,?,'FAKE ITEM',1,'عادي','طلب جديد',0,0)").run(line,ID,KEY,i+1,p.department,p.who);
  raw.prepare("INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) VALUES (?,?,?,?,'trend-master-status-intent','pending','{}')").run(KEY,'queue:'+String(i+1).padStart(2,'0'),ID,line);
 }
 raw.prepare("INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) VALUES (?,'activity',?,'order-create','{}')").run(KEY,ID);
 for(const tbl of ['t12_prod_orders','t12_prod_request_ledger','t12_prod_lines','t12_prod_outbox','t12_prod_events'])
  raw.exec("UPDATE "+tbl+" SET created_at='"+AT+"'");
 const stats={batches:0,selects:0,writes:0};
 const permitted=new Set([ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME]);
 const db={
  prepare(sql){
   const clean=sql.trim();
   if(!/^SELECT\s/i.test(clean))throw Error('ACC260 SQL NOT SELECT');
   stats.selects++;
   return {bind(...args){return {
    sql,args,
    async first(){return raw.prepare(sql).get(...args)??null},
    async all(){return {results:raw.prepare(sql).all(...args)}},
    async run(){stats.writes++;throw Error('ACC260 SOURCE READ-ONLY')}
   }}};
  },
  async batch(statements){
   stats.batches++;
   assert.equal(statements.length,5);
   for(const s of statements)assert.ok(permitted.has(s.sql),
    'only existing original T12 five-query reader allowed');
   raw.exec('SAVEPOINT acc260_read');
   try{return statements.map(s=>({success:true,
      results:raw.prepare(s.sql).all(...s.args)}))}
   finally{raw.exec('RELEASE SAVEPOINT acc260_read')}
  }
 };
 return {
  raw,db,stats,env:{DB:db,EDGE_SESSION_SECRET:SECRET,
  TRENDOS_DEPARTMENT_REVIEW_ACC259_MODE:MODE},
  close:()=>raw.close()
 };
}
async function enroll(f,p,opts={}){
 const token='FAKE_NATIVE_TOKEN_'+p.role+'_ACC260_0001';
 const fingerprint=await cloudAuthTokenFingerprint(p.who,token,f.env);
 f.raw.prepare("INSERT INTO employee_auth_users_v1 (employee_id,username_key,canonical_username,must_change,active,role,department,screens_json,session_version) VALUES (?,?,?,?,?,?,?,?,?)").run(
  'fake-'+p.role,p.who.toLowerCase(),p.who,
  opts.mustChange?1:0,opts.inactive?0:1,
  opts.role||p.role,opts.department||p.department,
  JSON.stringify(opts.screens??[p.screen]),opts.userVersion??1
 );
 f.raw.prepare("INSERT INTO employee_auth_sessions_v1 (username_key,token_fingerprint,session_version,issued_at_ms,expires_at_ms,last_seen_at_ms,source) VALUES (?,?,?,?,?,?,'d1-native')").run(
  p.who.toLowerCase(),fingerprint,
  opts.sessionVersion??1,NOW-1000,
  opts.expired?NOW-1000:NOW+60000,NOW-1000
 );
 return token;
}
function run(f,p,token,opts={}){
 return inspect({
  env:f.env,orderId:ID,lineId:opts.lineId||(
   ID+'-'+String(EMPLOYEES.indexOf(p)+1).padStart(2,'0')),
  username:opts.username||p.who,
  employeeToken:opts.token||token,nowMs:NOW,
  verifyOriginalNativeSession:verifyNativeEmployeeSession,mode:opts.mode??MODE
 });
}
async function withFixture(fn){const f=fixture();try{return await fn(f)}
 finally{f.close()}}
test('ACC260 ORIGINAL native session source is real implementation, not fake hook',()=>{
 assert.equal(typeof verifyNativeEmployeeSession,'function');
 assert.equal(typeof cloudAuthTokenFingerprint,'function');
 assert.match(originalDDL,/CREATE TABLE IF NOT EXISTS employee_auth_users_v1/);
 assert.match(originalDDL,/CREATE TABLE IF NOT EXISTS employee_auth_sessions_v1/);
 assert.equal(original.includes('source-original'),true);
});
test('ACC260 authentic original Print/Wael token → actual T12 line, strictly readonly',()=>withFixture(async f=>{
 const token=await enroll(f,EMPLOYEES[0]);
 const baseline=f.raw.prepare('SELECT total_changes() n').get().n;
 const r=await run(f,EMPLOYEES[0],token);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(r.employeeNativeSessionVerified,true);
 assert.equal(r.operationalReviewerMatched,true);
 assert.equal(r.department,'طباعة');
 assert.equal(r.lineId,'4323-01');
 assert.equal(r.realSignedLineApproval,false);
 assert.equal(r.financeAuthorized,false);
 assert.equal(r.invoicePostingAllowed,false);
 assert.equal(r.customerOwnershipAttested,false);
 assert.equal(r.approvalEventPublished,false);
 assert.equal(f.stats.batches,2);
 assert.equal(f.stats.writes,0);
 assert.equal(f.raw.prepare('SELECT total_changes() n').get().n,baseline,
  'verifier readOnly:true may not mutate last_seen');
}));
test('ACC260 original Laser/Gaber native session → exact original laser line',()=>withFixture(async f=>{
 const token=await enroll(f,EMPLOYEES[1]);
 const r=await run(f,EMPLOYEES[1],token);
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(r.lineId,'4323-02');
 assert.equal(r.department,'ليزر');
 assert.equal(r.financeAuthorized,false);
}));
test('ACC260 wrong token or employee-session revocation rejected by ORIGINAL verifier',()=>withFixture(async f=>{
 const p=EMPLOYEES[0],token=await enroll(f,p);
 assert.equal((await run(f,p,token,{token:'FORGED_FAKE_NATIVE_TOKEN'})).success,false);
 f.raw.prepare("UPDATE employee_auth_sessions_v1 SET revoked_at_ms=? WHERE username_key=?").run(NOW-100,p.who);
 const r=await run(f,p,token);
 assert.equal(r.success,false);
 assert.equal(r.code,'ACC259_ORIGINAL_NATIVE_EMPLOYEE_SESSION_UNVERIFIED');
 assert.equal(r.financeAuthorized,false);
}));
test('ACC260 source-native session expiration, stale session version or disabled account fail',async()=>{
 for(const opts of [{expired:true},{sessionVersion:2},{inactive:true},{mustChange:true}]){
  await withFixture(async f=>{
   const token=await enroll(f,EMPLOYEES[0],opts);
   const result=await run(f,EMPLOYEES[0],token);
   assert.equal(result.success,false,JSON.stringify({opts,result}));
   assert.equal(result.financeAuthorized,false);
  });
 }
});
test('ACC260 native grant ≠ approval: wrong role/screen/department or admin bypass fail',async()=>{
 for(const opts of [{role:'laser'},{role:'admin',screens:['print','laser']},
  {department:'ليزر'},{screens:['service']}])await withFixture(async f=>{
   const p=EMPLOYEES[0],token=await enroll(f,p,opts),r=await run(f,p,token);
   assert.equal(r.success,false,JSON.stringify({opts,r}));
   assert.equal(r.realSignedLineApproval,false);
 });
});
test('ACC260 no anonymous admin, cross-department line or guessed username',()=>withFixture(async f=>{
 const p=EMPLOYEES[0],token=await enroll(f,p);
 assert.equal((await run(f,p,token,{lineId:'4323-02'})).success,false);
 assert.equal((await run(f,p,token,{username:'another-employee'})).success,false);
 assert.equal((await run(f,p,token,{mode:'OFF'})).success,false);
 assert.equal(f.stats.writes,0);
}));
test('ACC260 native runtime cancellation cannot become financial approval',()=>withFixture(async f=>{
 const p=EMPLOYEES[0],token=await enroll(f,p);
 f.raw.prepare("INSERT INTO t12_prod_line_runtime (line_id,order_id,status,updated_by,version) VALUES ('4323-01','4323','ملغى','وائل',1)").run();
 f.raw.prepare("INSERT INTO t12_prod_runtime_events (order_id,line_id,event_type,old_status,new_status,actor) VALUES ('4323','4323-01','line-update','طلب جديد','ملغى','وائل')").run();
 const r=await run(f,p,token);
 assert.equal(r.success,false);
 assert.equal(r.realSignedLineApproval,false);
}));
test('ACC260 no customer master/capture or financial tables; no production entry import',()=>withFixture(async f=>{
 const names=f.raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 assert.equal(names.includes('t12_customers'),false);
 assert.equal(names.some(x=>/easystore|invoice|at_create/i.test(x)),false);
 const entry=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(entry.includes('acc260'),false);
}));
