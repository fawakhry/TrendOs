import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  createT12BusinessCandidate,T12_BUSINESS_CREATE_CANDIDATE_VERSION
} from '../cloudflare-d1/src/t12-business-create-candidate.mjs';

const schema=fs.readFileSync(new URL(
  '../cloudflare-d1/schema-prep/t12-business-create-candidate-v1.sql',
  import.meta.url),'utf8');
const candidate=fs.readFileSync(new URL(
  '../cloudflare-d1/src/t12-business-create-candidate.mjs',import.meta.url),'utf8');
for(const p of ['cloudflare-d1/src/index_v2.js','cloudflare-d1/production-shadow/index.js',
  'cloudflare-d1/wrangler.toml']){
  const source=fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
  assert.doesNotMatch(source,/t12-business-create-candidate/,
    'isolated business candidate must not be production-wired: '+p);
}
assert.doesNotMatch(candidate,/\b(?:fetch|SpreadsheetApp|PropertiesService|ScriptApp)\s*\(/);
assert.doesNotMatch(candidate,/new\s+Response\s*\(/);
assert.doesNotMatch(schema,/\b(?:DROP|DELETE|ALTER)\b/i);
assert.match(T12_BUSINESS_CREATE_CANDIDATE_VERSION,/ISOLATED/);

class Stmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...params){this.params=params;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class CandidateD1{
  constructor({seed=true,badFence=false,policyEpoch='test_epoch_20260926'}={}){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    this.raw.exec(schema);
    if(seed)this.raw.prepare(`
      INSERT INTO t12_biz_control
      (singleton,fixture_marker,google_writer_fenced,r5_mirror_writer_fenced,
       next_order_number,policy_epoch)
      VALUES (1,'T12_BUSINESS_CANDIDATE_ONLY',?,?,5001,?)
    `).run(badFence?0:1,1,policyEpoch);
    this.failStatement=0;
    this.ambiguousAfterCommit=false;
    this.turn=Promise.resolve();
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(statements){
    let release;
    const prev=this.turn;
    this.turn=new Promise(resolve=>{release=resolve;});
    await prev;
    try{
      this.raw.exec('BEGIN IMMEDIATE');
      try{
        for(let i=0;i<statements.length;i++){
          if(this.failStatement===i+1)throw Error('SIMULATED_BATCH_FAILURE');
          await statements[i].run();
        }
        this.raw.exec('COMMIT');
      }catch(err){
        try{this.raw.exec('ROLLBACK');}catch{}
        throw err;
      }
      if(this.ambiguousAfterCommit)throw Error('SIMULATED_ACK_LOST_AFTER_COMMIT');
    }finally{release();}
  }
  count(table){return Number(this.raw.prepare('SELECT COUNT(*) AS n FROM '+table).get().n);}
  next(){return Number(this.raw.prepare(
    'SELECT next_order_number AS n FROM t12_biz_control WHERE singleton=1').get().n);}
  close(){this.raw.close();}
}

const gates={
  mode:'isolated-business-create-candidate',
  allowCandidateMutation:true,
  testDatabaseIsolationVerified:true,
  googleCreateFrozenInTest:true,
  r5MirrorFencedInTest:true
};
const context={
  policyEpoch:'test_epoch_20260926',
  authCanCreateOrder:true,
  customerIdentityVerified:true,
  debtPolicyApproved:true,
  duplicateAndOpenOrderChecked:true,
  createNewOrderApproved:true,
  stableClientRequestVerified:true
};
const actor='employee-001';
const input=(key='cld1_1790000000000_BUSINESS_1234567890123456',qty=1,extra={})=>({
  clientRequestId:key,
  customerMode:'عميل مسجل',
  customerName:'SYNTHETIC BUSINESS CUSTOMER',
  customerPhone:'01000000000',
  department:'طباعة',
  itemName:'TEST BUSINESS MUG',
  qty,
  priority:'عادي',
  status:'طلب جديد',
  source:'T12 isolated business candidate',
  ...extra
});
const add=(db,p=input(),who=actor,ctx=context,g=gates)=>
  createT12BusinessCandidate(db,p,who,ctx,g);
const tables=['t12_biz_request_ledger','t12_biz_orders','t12_biz_lines',
  't12_biz_events','t12_biz_outbox'];
function noWrites(db){
  for(const t of tables)assert.equal(db.count(t),0,t);
  assert.equal(db.next(),5001);
}
function counts(db,{requests=1,orders=1,lines=1,events=1,outbox=1}={}){
  assert.equal(db.count('t12_biz_request_ledger'),requests);
  assert.equal(db.count('t12_biz_orders'),orders);
  assert.equal(db.count('t12_biz_lines'),lines);
  assert.equal(db.count('t12_biz_events'),events);
  assert.equal(db.count('t12_biz_outbox'),outbox);
}

{
  const db=new CandidateD1();
  let r=await add(db,input(),actor,context,{});
  assert.equal(r.reason,'isolated-candidate-gates-not-met');
  for(const k of Object.keys(gates)){
    r=await add(db,input(),actor,context,{...gates,[k]:false});
    assert.equal(r.success,false,k);
  }
  for(const k of ['authCanCreateOrder','customerIdentityVerified','debtPolicyApproved',
    'duplicateAndOpenOrderChecked','createNewOrderApproved','stableClientRequestVerified']){
    r=await add(db,input(),actor,{...context,[k]:false});
    assert.equal(r.reason,'verified-business-policy-context-required',k);
  }
  assert.equal((await add(db,input(),'',context,gates)).reason,
    'authenticated-actor-subject-required');
  assert.equal((await add(db,input('co_1790000000000_legacy'))).reason,
    'legacy-request-read-only-or-reconcile-no-create');
  assert.equal((await add(db,input('bad-key'))).reason,
    'new-cloud-request-namespace-required');
  assert.equal((await add(db,{...input(),requestId:'other'})).reason,
    'exactly-one-raw-cloud-client-key-required');
  noWrites(db);db.close();
}
{
  const db=new CandidateD1({badFence:true});
  assert.equal((await add(db)).reason,'candidate-db-identity-fence-or-policy-mismatch');
  db.close();
}
{
  const db=new CandidateD1();
  const first=await add(db);
  assert.equal(first.success,true);
  assert.equal(first.productionAuthorized,false);
  assert.equal(first.cutoverAuthorized,false);
  assert.equal(first.stored,true);
  assert.equal(first.idempotent,false);
  assert.equal(first.orderId,'5001');
  assert.deepEqual(first.lineIds,['5001-01']);
  assert.equal(db.next(),5002);counts(db,{});
  const replay=await add(db);
  assert.equal(replay.success,true);
  assert.equal(replay.stored,false);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.orderId,'5001');
  assert.deepEqual(replay.lineIds,['5001-01']);
  assert.equal(db.next(),5002);counts(db,{});
  const conflict=await add(db,input(undefined,2));
  assert.equal(conflict.reason,'same-key-actor-payload-or-policy-conflict');
  assert.equal(db.next(),5002);counts(db,{});
  const actorConflict=await add(db,input(),'employee-002');
  assert.equal(actorConflict.reason,'same-key-actor-payload-or-policy-conflict');
  db.close();
}
{
  const db=new CandidateD1();
  const multi=await add(db,input(
    'cld1_1790000000001_MULTI_12345678901234567',1,
    {department:'متعدد الأقسام',itemName:'TEST MULTI ITEM'}));
  assert.equal(multi.success,true);
  assert.deepEqual(multi.lineIds,['5001-01','5001-02']);
  counts(db,{lines:2,outbox:2});
  const deps=db.raw.prepare(
    'SELECT department,assigned_to AS assignedTo FROM t12_biz_lines ORDER BY ordinal').all();
  assert.deepEqual(deps.map(x=>x.department),['طباعة','ليزر']);
  assert.deepEqual(deps.map(x=>x.assignedTo),['وائل','جابر']);
  db.close();
}
{
  const db=new CandidateD1();
  const press=await add(db,input(
    'cld1_1790000000002_PRESS_1234567890123456',2,{department:'مكبس'}));
  assert.equal(press.success,true);
  const line=db.raw.prepare(
    'SELECT department,heat_press AS heatPress FROM t12_biz_lines').get();
  assert.equal(line.department,'طباعة');
  assert.equal(Number(line.heatPress),1);
  db.close();
}
for(let failAt=1;failAt<=7;failAt++){
  const db=new CandidateD1();db.failStatement=failAt;
  const r=await add(db);
  assert.equal(r.success,false,'failAt='+failAt);
  assert.equal(r.reason,'transaction-outcome-unknown-no-retry','failAt='+failAt);
  noWrites(db);db.close();
}
{
  const db=new CandidateD1();db.ambiguousAfterCommit=true;
  const r=await add(db);
  assert.equal(r.success,true);
  assert.equal(r.idempotent,true);
  assert.equal(r.stored,false);
  assert.equal(r.ambiguousAckRecovered,true);
  assert.equal(r.orderId,'5001');
  counts(db,{});assert.equal(db.next(),5002);db.close();
}
{
  const db=new CandidateD1();
  const jobs=await Promise.all(Array.from({length:8},()=>add(db)));
  assert.equal(jobs.every(x=>x.success===true),true);
  assert.equal(new Set(jobs.map(x=>x.orderId)).size,1);
  assert.equal(jobs.filter(x=>x.stored===true).length,1);
  counts(db,{});assert.equal(db.next(),5002);db.close();
}
{
  const db=new CandidateD1();
  const bodies=[input(undefined,1),input(undefined,2),input(undefined,1),input(undefined,2)];
  const rs=await Promise.all(bodies.map(x=>add(db,x)));
  assert.equal(rs.filter(x=>x.success&&x.stored).length,1);
  assert.equal(rs.filter(x=>x.success&&x.idempotent).length,1);
  assert.equal(rs.filter(x=>!x.success&&x.reason==='same-key-actor-payload-or-policy-conflict').length,2);
  counts(db,{});assert.equal(db.next(),5002);db.close();
}
{
  const db=new CandidateD1();
  const jobs=Array.from({length:5},(_,i)=>add(db,input(
    'cld1_179000000001'+i+'_DISTINCT_'+String(i).padStart(16,'0'))));
  const rs=await Promise.all(jobs);
  assert.equal(rs.every(x=>x.success&&x.stored),true);
  assert.deepEqual(rs.map(x=>Number(x.orderId)).sort((a,b)=>a-b),
    [5001,5002,5003,5004,5005]);
  counts(db,{requests:5,orders:5,lines:5,events:5,outbox:5});
  assert.equal(db.next(),5006);db.close();
}

console.log('T12 isolated BUSINESS CREATE candidate PASS: numeric allocator, one/multi-line atomic commit, durable replay/conflict, rollback, lost-ACK readback, concurrency, activity/outbox and no production wiring');
