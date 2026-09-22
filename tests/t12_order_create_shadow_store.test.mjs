import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { persistT12OrderCreateShadow, T12_SHADOW_STORE_VERSION } from '../cloudflare-d1/src/t12-order-create-shadow-store.mjs';

const schema = fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql',import.meta.url),'utf8');
const source = fs.readFileSync(new URL('../cloudflare-d1/src/t12-order-create-shadow-store.mjs',import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const cloudWrite = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write.mjs',import.meta.url),'utf8');

assert.match(T12_SHADOW_STORE_VERSION,/T12_ORDER_CREATE_SHADOW_STORE/);
assert.equal(index.includes('t12-order-create-shadow-store'),false,'T12 store must not be routed');
assert.equal(cloudWrite.includes('t12-order-create-shadow-store'),false,'legacy Cloud Write must remain unchanged');
assert.equal(/\bINSERT\s+INTO\s+(?:orders|customers|cloud_write_)/i.test(source),false);
assert.equal(/\bUPDATE\s+(?:orders|customers|cloud_write_)/i.test(source),false);
assert.equal(/\bDELETE\s+FROM\s+(?:orders|customers|cloud_write_)/i.test(source),false);
assert.equal(/\bnew\s+Response\s*\(/.test(source),false);
assert.equal(/\bfetch\s*\(/.test(source),false);

class D1Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...params){this.params=params;return this;}
  async first(){this.db.readCalls++;if(this.db.failReadAt && this.db.readCalls===this.db.failReadAt)throw new Error('injected-initial-ledger-read-unavailable');return this.db.raw.prepare(this.sql).get(...this.params) || null;}
  run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class D1Sqlite {
  constructor({failAfter=0,truncateAfter=0,failReadAt=0}={}){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec(schema);
    this.failAfter=failAfter;
    this.truncateAfter=truncateAfter;
    this.failReadAt=failReadAt;
    this.readCalls=0;
  }
  prepare(sql){return new D1Stmt(this,sql);}
  async batch(statements){
    this.raw.exec('BEGIN IMMEDIATE');
    try{
      let i=0;
      for(const s of statements){
        i++;
        if(this.failAfter && i===this.failAfter) throw new Error('injected-batch-failure');
        if(this.truncateAfter && i>this.truncateAfter) break;
        s.run();
      }
      this.raw.exec('COMMIT');
      return statements.map(()=>({success:true}));
    }catch(err){
      this.raw.exec('ROLLBACK');
      throw err;
    }
  }
  count(table,where='',params=[]){
    const q='SELECT COUNT(*) AS c FROM '+table+(where?' WHERE '+where:'');
    return Number(this.raw.prepare(q).get(...params).c);
  }
}
function base(overrides={}){
  return {clientRequestId:'T12-STORE-001',customerName:'عميل اختبار',customerPhone:'01012345678',department:'طباعة',itemName:'تابلوه',qty:2,status:'طلب جديد',...overrides};
}

// An unavailable FIRST ledger read must fail closed before *any* batch write.
const initialReadUnavailable=new D1Sqlite({failReadAt:1});
const noRead=await persistT12OrderCreateShadow(initialReadUnavailable,base({clientRequestId:'T12-READ-UNAVAILABLE'}),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(noRead.success,false);
assert.equal(noRead.reason,'shadow-initial-ledger-read-unavailable-no-retry');
assert.equal(noRead.stored,false);
for(const table of ['t12_order_create_intents','t12_order_create_line_intents','t12_order_create_shadow_events'])
  assert.equal(initialReadUnavailable.count(table),0,'no INSERT on unavailable initial ledger read');

// The same failure on a previously committed key must not invent a new order.
const priorReadUnavailable=new D1Sqlite();
const priorForm=base({clientRequestId:'T12-PRIOR-READ-UNAVAILABLE'});
assert.equal((await persistT12OrderCreateShadow(priorReadUnavailable,priorForm,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true})).success,true);
priorReadUnavailable.failReadAt=priorReadUnavailable.readCalls+1;
const failedReplayRead=await persistT12OrderCreateShadow(priorReadUnavailable,priorForm,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(failedReplayRead.success,false);
assert.equal(failedReplayRead.reason,'shadow-initial-ledger-read-unavailable-no-retry');
assert.equal(priorReadUnavailable.count('t12_order_create_intents'),1);
assert.equal(priorReadUnavailable.count('t12_order_create_line_intents'),1);
assert.equal(priorReadUnavailable.count('t12_order_create_shadow_events'),2);

let db=new D1Sqlite();
let x=await persistT12OrderCreateShadow(db,base(),'wael',{});
assert.equal(x.success,false);
assert.equal(x.reason,'shadow-mutation-not-authorized');
assert.equal(db.count('t12_order_create_intents'),0);

x=await persistT12OrderCreateShadow(db,base(),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(x.success,true);
assert.equal(x.stored,true);
assert.equal(x.businessOrderIdAllocated,false);
assert.equal(x.lineIntentCount,1);
assert.equal(db.count('t12_order_create_intents'),1);
assert.equal(db.count('t12_order_create_line_intents'),1);
assert.equal(db.count('t12_order_create_shadow_events'),2);

let replay=await persistT12OrderCreateShadow(db,base(),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(replay.success,true);
assert.equal(replay.idempotent,true);
assert.equal(replay.stored,false);
assert.equal(db.count('t12_order_create_intents'),1);
assert.equal(db.count('t12_order_create_line_intents'),1);
assert.equal(db.count('t12_order_create_shadow_events'),2);

let conflict=await persistT12OrderCreateShadow(db,base({itemName:'تصميم مختلف'}),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(conflict.success,false);
assert.equal(conflict.conflict,true);
assert.equal(conflict.reason,'idempotency-key-payload-conflict');

let multi=await persistT12OrderCreateShadow(db,base({clientRequestId:'T12-STORE-MULTI',department:'متعدد الأقسام',itemName:'كومبو'}),'manager',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(multi.success,true);
assert.equal(multi.lineIntentCount,2);
assert.equal(multi.eventIntentCount,3);
assert.equal(db.count('t12_order_create_line_intents','client_request_id=?',['T12-STORE-MULTI']),2);
assert.equal(db.count('t12_order_create_shadow_events','client_request_id=?',['T12-STORE-MULTI']),3);

let invalid=await persistT12OrderCreateShadow(db,base({clientRequestId:'T12-BAD',orderId:'1001'}),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(invalid.success,false);
assert.equal(invalid.reason,'shadow-intent-invalid');
assert.equal(db.count('t12_order_create_intents','client_request_id=?',['T12-BAD']),0);

db=new D1Sqlite({failAfter:2});
let failed=await persistT12OrderCreateShadow(db,base({clientRequestId:'T12-ROLLBACK'}),'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(failed.success,false);
assert.equal(failed.reason,'shadow-transaction-failed');
assert.equal(db.count('t12_order_create_intents','client_request_id=?',['T12-ROLLBACK']),0);
assert.equal(db.count('t12_order_create_line_intents','client_request_id=?',['T12-ROLLBACK']),0);
assert.equal(db.count('t12_order_create_shadow_events','client_request_id=?',['T12-ROLLBACK']),0);


// A saved header alone must never qualify an incomplete same-key replay.
for(const [name,sql] of [
  ['missing-line',"DELETE FROM t12_order_create_line_intents WHERE client_request_id='T12-CORRUPT'"],
  ['changed-quantity',"UPDATE t12_order_create_line_intents SET qty=99 WHERE client_request_id='T12-CORRUPT'"],
  ['missing-event',"DELETE FROM t12_order_create_shadow_events WHERE client_request_id='T12-CORRUPT' AND event_key='queue:01'"],
  ['changed-event',"UPDATE t12_order_create_shadow_events SET payload_json='{}' WHERE client_request_id='T12-CORRUPT' AND event_key='activity'"],
  ['abandoned',"UPDATE t12_order_create_intents SET qualification_status='abandoned' WHERE client_request_id='T12-CORRUPT'"]
]){
  const corrupt=new D1Sqlite(),form=base({clientRequestId:'T12-CORRUPT'});
  assert.equal((await persistT12OrderCreateShadow(corrupt,form,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true})).success,true,name);
  corrupt.raw.exec(sql);
  const before={intents:corrupt.count('t12_order_create_intents'),lines:corrupt.count('t12_order_create_line_intents'),events:corrupt.count('t12_order_create_shadow_events')};
  const reply=await persistT12OrderCreateShadow(corrupt,form,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
  assert.equal(reply.success,false,name);
  assert.equal(reply.reason,'shadow-ledger-incomplete-no-retry',name);
  assert.equal(reply.stored,false,name);
  assert.deepEqual({intents:corrupt.count('t12_order_create_intents'),lines:corrupt.count('t12_order_create_line_intents'),events:corrupt.count('t12_order_create_shadow_events')},before,name);
}

// A faulty adapter that resolves an incomplete batch must not report success.
const truncated=new D1Sqlite({truncateAfter:2});
const truncatedInput=base({clientRequestId:'T12-TRUNCATED'});
const truncatedResult=await persistT12OrderCreateShadow(truncated,truncatedInput,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true});
assert.equal(truncatedResult.success,false);
assert.equal(truncatedResult.reason,'shadow-commit-footprint-unverified-no-retry');
assert.equal(truncated.count('t12_order_create_intents'),1);
assert.equal(truncated.count('t12_order_create_line_intents'),1);
assert.equal(truncated.count('t12_order_create_shadow_events'),0);
assert.equal((await persistT12OrderCreateShadow(truncated,truncatedInput,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true})).reason,'shadow-ledger-incomplete-no-retry');

const mismatchedActor=new D1Sqlite(),actorInput=base({clientRequestId:'T12-ACTOR'});
assert.equal((await persistT12OrderCreateShadow(mismatchedActor,actorInput,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true})).success,true);
mismatchedActor.raw.prepare('UPDATE t12_order_create_intents SET actor=? WHERE client_request_id=?').run('another-actor','T12-ACTOR');
assert.equal((await persistT12OrderCreateShadow(mismatchedActor,actorInput,'wael',{mode:'isolated-shadow-qualification',allowShadowMutation:true})).reason,'idempotency-key-payload-conflict');

console.log('T12 isolated D1 shadow store PASS; failed initial ledger reads refuse writes/replays, atomic replay, actor binding and incomplete footprint fail closed.');
