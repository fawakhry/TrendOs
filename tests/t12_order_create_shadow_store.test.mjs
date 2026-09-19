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
  async first(){return this.db.raw.prepare(this.sql).get(...this.params) || null;}
  run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class D1Sqlite {
  constructor({failAfter=0}={}){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec(schema);
    this.failAfter=failAfter;
  }
  prepare(sql){return new D1Stmt(this,sql);}
  async batch(statements){
    this.raw.exec('BEGIN IMMEDIATE');
    try{
      let i=0;
      for(const s of statements){
        i++;
        if(this.failAfter && i===this.failAfter) throw new Error('injected-batch-failure');
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

console.log('T12 isolated D1 shadow store PASS; auth gate, atomic batch, replay, conflict and rollback verified.');
