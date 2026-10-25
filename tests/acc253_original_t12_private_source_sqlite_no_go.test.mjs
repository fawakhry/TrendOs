import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import sourceWorker from '../cloudflare-d1/easystore-finance-stage/trendos-original-order-context-source.mjs';
import {
 VERSION,PATH,signBody,verifyBody,readOriginalOrderContextV1,
 validRequest,validReply,POLICY
} from '../cloudflare-d1/src/accounting-original-order-context-v1.mjs';
import {
 inspectT12EmployeeOrderFinanceCandidate as inspect,
 T12_EMPLOYEE_INTAKE_ORDER_SQL as ORDER,
 T12_EMPLOYEE_INTAKE_LINES_SQL as LINES,
 T12_EMPLOYEE_INTAKE_ACTIVITY_SQL as ACTIVITY,
 T12_EMPLOYEE_INTAKE_OUTBOX_SQL as OUTBOX,
 T12_EMPLOYEE_INTAKE_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const SECRET='ACC253-FAKE-ISOLATED-ORIGINAL-ORDER-SOURCE'.repeat(3);
const userReq=({orderId=ORDER_ID,customerId=C,issuedAt=Date.now(),
 nonce='a8a58bc6-a1f7-42a5-9fc4-901237560111'}={})=>({
 version:VERSION,orderId,customerId,issuedAt,nonce});
const sourceEnv=(x,mode='ENFORCE')=>({
 TRENDOS_ORDER_CONTEXT_SOURCE_V1:mode,
 TRENDOS_ORDER_CONTEXT_HMAC_V1:SECRET,DB:x.db});
async function sourceHttp(x,payload=userReq(),overrideEnv=sourceEnv(x)){
 const raw=JSON.stringify(payload);
 const signature=await signBody(SECRET,raw);
 return sourceWorker.fetch(new Request('https://private-t12.internal'+PATH,{
  method:'POST',headers:{'content-type':'application/json',
   'x-order-context-signature':signature},body:raw
 }),overrideEnv);
}
const privateConsumer=x=>({
 EASYSTORE_ORDER_CONTEXT_SOURCE_V1:'REMOTE_REQUIRED',
 TRENDOS_ORDER_CONTEXT_HMAC_V1:SECRET,
 TRENDOS_ORDER_CONTEXT:{fetch:req=>sourceWorker.fetch(req,sourceEnv(x))}
});

const C='CUS-FAKE-228',ORDER_ID='4323',KEY='cld1_1800000000000_EMPLOYEE228_TEST0001';
const A='service-actor-228';
function fixture(lanes=2,skipCapture=false){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0005_t12_production_create_canary.sql',
    '0006_t12_operational_runtime.sql',
    '0008_t12_customer_master.sql',
    '0035_t12_order_customer_at_create_sourceonly_v1.sql']){
  raw.exec(readFileSync('tests/fixtures/acc253-original-t12/'+file.replace('.sql','.fixture.sql.txt'),'utf8'));
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


test('ACC253 isolated private source is OFF; config binds only original Stage, no public route/finance or migration',()=>{
 const toml=readFileSync('cloudflare-d1/easystore-finance-stage/wrangler.trendos-original-order-context-source.toml','utf8');
 assert.match(toml,/workers_dev = false/);
 assert.match(toml,/TRENDOS_ORDER_CONTEXT_SOURCE_V1 = "OFF"/);
 assert.match(toml,/FINANCE_WRITES = "OFF"/);
 assert.match(toml,/FINANCE_RELEASE = "NO_GO"/);
 assert.match(toml,/database_name = "trendos-staging"/);
 assert.doesNotMatch(toml,/easystore-accounting-staging/);
 assert.equal(POLICY.financialAuthority,false);
 assert.equal(POLICY.invoicePostingAllowed,false);
 assert.equal(POLICY.allowedEffect,'prepare_context_only');
 const liveIndex=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(liveIndex,/trendos-original-order-context-source|accounting-original-order-context-v1/);
});
test('ACC253 private source requires exact signed POST and OFF always fails closed',()=>withFixture(async x=>{
 assert.equal((await sourceHttp(x,userReq(),sourceEnv(x,'OFF'))).status,503);
 assert.equal((await sourceWorker.fetch(new Request('https://private-t12.internal/bad'),sourceEnv(x))).status,404);
 assert.equal((await sourceWorker.fetch(new Request('https://private-t12.internal'+PATH),sourceEnv(x))).status,405);
 const bad=await sourceWorker.fetch(new Request('https://private-t12.internal'+PATH,{
  method:'POST',body:JSON.stringify(userReq()),
  headers:{'x-order-context-signature':'0'.repeat(64)}
 }),sourceEnv(x));
 assert.equal(bad.status,401);
 assert.equal((await sourceHttp(x,userReq({issuedAt:Date.now()-130000}))).status,400);
}));
test('ACC253 original T12 five-select inspector backs private signed source and consumer',()=>withFixture(async x=>{
 const before=x.raw.prepare('SELECT total_changes() n').get().n;
 const response=await sourceHttp(x);
 assert.equal(response.status,200,await response.clone().text());
 const raw=await response.text();
 assert.equal(await verifyBody(SECRET,raw,response.headers.get('x-order-context-signature')),true);
 const original=JSON.parse(raw);
 const payload=userReq({issuedAt:original.issuedAt,nonce:original.nonce});
 assert.equal(validReply(original,payload),true);
 assert.equal(original.sourceCreatedAt,'2026-09-21T14:13:20Z');
 assert.deepEqual(original.lines.map(x=>x.department),['طباعة','ليزر']);
 assert.deepEqual(original.operationalRevision.lineVersions.map(x=>x.version),[0,0]);
 assert.equal(original.ownerAttested,false);
 assert.equal(original.approvedLineEventsVerified,false);
 assert.equal(original.financialAuthority,false);
 assert.equal(JSON.stringify(original).includes('FAKE CLIENT'),false);
 assert.equal(JSON.stringify(original).includes('01000000000'),false);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 const received=await readOriginalOrderContextV1(privateConsumer(x),{orderId:ORDER_ID,customerId:C});
 assert.equal(received.customerId,C);
 assert.equal(received.contextOnly,true);
 assert.equal(received.financialAuthority,false);
 assert.equal(x.raw.prepare('SELECT total_changes() n').get().n,before);
 assert.equal(x.batches(),2);
}));
test('ACC253 at-create immutable customer candidate missing means no original order context',()=>
 withFixture(async x=>{
  const r=await sourceHttp(x);
  assert.equal(r.status,409);
 },2,true));
test('ACC253 invalid official customer selector and canceled runtime reject authentic signed HTTP',()=>withFixture(async x=>{
 const wrong=await sourceHttp(x,userReq({customerId:'WRONG_CANDIDATE_ID'}));
 assert.equal(wrong.status,409);
 x.raw.prepare("INSERT INTO t12_prod_line_runtime (line_id,order_id,status,updated_by,version) VALUES (?,?,?,?,?)")
  .run('4323-02','4323','ملغى','fake-synthetic-jaber',1);
 const cancelled=await sourceHttp(x);
 assert.equal(cancelled.status,409);
 assert.equal((await cancelled.text()).includes('FAKE CLIENT'),false);
}));
test('ACC253 missing/broken D1 source cannot become finance data or leak backend errors',()=>withFixture(async x=>{
 const badDb={prepare:x.db.prepare,batch:async()=>{throw Error('PRIVATE_ORIGINAL_SOURCE_SQL_ERROR')}};
 const resp=await sourceHttp(x,userReq(),{...sourceEnv(x),DB:badDb});
 assert.equal(resp.status,409);
 assert.equal((await resp.text()).includes('PRIVATE_ORIGINAL_SOURCE_SQL_ERROR'),false);
 const disabled=await sourceHttp(x,userReq(),{...sourceEnv(x),DB:undefined});
 assert.equal(disabled.status,503);
}));
test('ACC253 signature/nonce/domain cannot be escalated to invoices, approvals or prices',()=>withFixture(async x=>{
 const rep=await readOriginalOrderContextV1(privateConsumer(x),{orderId:ORDER_ID,customerId:C});
 assert.deepEqual(Object.keys(rep).sort(),[
 'version','orderId','customerId','issuedAt','nonce','source',
 'contextOnly','financialAuthority','ownerAttested','approvedLineEventsVerified',
 'sourceCreatedAt','operationalRevision','lines'].sort());
 assert.equal(Object.hasOwn(rep,'price'),false);
 assert.equal(Object.hasOwn(rep,'invoice'),false);
 assert.equal(Object.hasOwn(rep,'approved'),false);
 assert.equal(rep.contextOnly,true);
 assert.equal(rep.financialAuthority,false);
 assert.equal(validRequest({...userReq(),financialAuthority:true}),false);
}));
