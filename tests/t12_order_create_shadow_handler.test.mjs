import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { issueEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';
import { handleT12OrderCreateShadowRequest, T12_SHADOW_PATH } from '../cloudflare-d1/t12-preview/order-create-shadow-handler.mjs';

const SECRET='t12-shadow-test-secret';
const schema=fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql',import.meta.url),'utf8');
const prodIndex=fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const prodShadow=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
assert.equal(prodIndex.includes('order-create-shadow-handler'),false);
assert.equal(prodShadow.includes('order-create-shadow-handler'),false);

class Stmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...params){this.params=params;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class DB{
  constructor(){this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);}
  prepare(sql){return new Stmt(this,sql);}
  async batch(stmts){
    this.raw.exec('BEGIN IMMEDIATE');
    try{for(const s of stmts)s.run();this.raw.exec('COMMIT');}
    catch(e){this.raw.exec('ROLLBACK');throw e;}
    return stmts.map(()=>({success:true}));
  }
  count(table){return Number(this.raw.prepare('SELECT COUNT(*) AS c FROM '+table).get().c);}
}
function env(overrides={}){return {DB:new DB(),EDGE_SESSION_SECRET:SECRET,TRENDOS_T12_ORDER_CREATE_SHADOW_ENABLED:'false',...overrides};}
async function authHeaders(user='wael'){
  const token=await issueEdgeSessionToken({sub:user},SECRET);
  return {authorization:'Bearer '+token,'content-type':'application/json'};
}
function payload(overrides={}){
  return {clientRequestId:'T12-HTTP-001',customerName:'عميل اختبار',customerPhone:'01012345678',department:'طباعة',itemName:'تابلوه',qty:1,status:'طلب جديد',...overrides};
}

let e=env();
let res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers:await authHeaders(),body:JSON.stringify(payload())}),e);
assert.equal(res.status,423);
assert.equal(e.DB.count('t12_order_create_intents'),0);

e=env({TRENDOS_T12_ORDER_CREATE_SHADOW_ENABLED:'true'});
res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload())}),e);
assert.equal(res.status,401);
assert.equal(e.DB.count('t12_order_create_intents'),0);

const headers=await authHeaders();
res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers,body:JSON.stringify(payload())}),e);
assert.equal(res.status,201);
let body=await res.json();
assert.equal(body.success,true);
assert.equal(body.shadowOnly,true);
assert.equal(body.productionCutoverAuthorized,false);
assert.equal(body.businessOrderIdAllocated,false);
assert.equal(e.DB.count('t12_order_create_intents'),1);
assert.equal(e.DB.count('t12_order_create_line_intents'),1);

res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers,body:JSON.stringify(payload())}),e);
assert.equal(res.status,200);
body=await res.json();
assert.equal(body.idempotent,true);
assert.equal(e.DB.count('t12_order_create_intents'),1);

res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers,body:JSON.stringify(payload({itemName:'مختلف'}))}),e);
assert.equal(res.status,409);
body=await res.json();
assert.equal(body.conflict,true);

res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test'+T12_SHADOW_PATH,{method:'POST',headers,body:JSON.stringify(payload({clientRequestId:'T12-HTTP-BAD',orderId:'1001'}))}),e);
assert.equal(res.status,400);
body=await res.json();
assert.equal(body.success,false);
assert.equal(e.DB.count('t12_order_create_intents'),1);

res=await handleT12OrderCreateShadowRequest(new Request('https://t12.test/unknown',{method:'POST',headers,body:'{}'}),e);
assert.equal(res.status,404);

console.log('T12 isolated shadow HTTP handler PASS; default-off, auth, idempotency, conflict, no production wiring.');
