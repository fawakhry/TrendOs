import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {
  T12_SYNTHETIC_TEST_ROUTE,handleT12SyntheticTestRequest
} from '../cloudflare-d1/t12-preview/t12-cloud-native-synthetic-test-worker.mjs';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const workerSource=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-cloud-native-synthetic-test-worker.mjs',import.meta.url),'utf8');
const production=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
const normal=fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const wrangler=fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');
const schema=fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-cloud-native-synthetic-create-v1.sql',import.meta.url),'utf8');
for(const s of [production,normal,wrangler])
  assert.doesNotMatch(s,/t12-cloud-native-synthetic-test-worker|T12_SYNTHETIC_DB/);
assert.match(workerSource,/T12_SYNTHETIC_TEST_ENABLED/);
assert.doesNotMatch(workerSource,/env\.DB\.prepare/);
class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...a){this.params=a;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class Db {
  constructor(){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    this.raw.exec(schema);
    this.raw.prepare(`INSERT INTO t12_synth_control
      (singleton,fixture_marker,google_writer_fenced,r5_mirror_writer_fenced,next_order_number)
      VALUES (1,'T12_SYNTHETIC_ONLY',1,1,2001)`).run();
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(statements){
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      for(const item of statements)await item.run();
      this.raw.exec('COMMIT');
    }catch(err){try{this.raw.exec('ROLLBACK');}catch{}throw err;}
  }
  count(){return Number(this.raw.prepare('SELECT COUNT(*) AS n FROM t12_synth_orders').get().n);}
  next(){return Number(this.raw.prepare('SELECT next_order_number AS n FROM t12_synth_control').get().n);}
}
const db=new Db(),secret='SYNTHETIC_SECRET_12345678901234567890';
const env={
  T12_SYNTHETIC_TEST_ENABLED:'true',
  T12_SYNTHETIC_DB:db,
  T12_SYNTHETIC_TEST_ATTESTATION:'ISOLATED_T12_SYNTHETIC_ONLY',
  T12_SYNTHETIC_TEST_BEARER_SECRET:secret
};
const payload=(id='cld1_1790000000000_TEST_12345678901',qty=1)=>({
  clientRequestId:id,customerName:'SYNTHETIC TEST CUSTOMER',
  customerPhone:'01000000000',itemName:'TEST MUG',qty,
  department:'طباعة',priority:'عادي',status:'طلب جديد'
});
const req=(p=payload(),token=secret,method='POST',pathname=T12_SYNTHETIC_TEST_ROUTE)=>
  new Request('https://separate-test.invalid'+pathname,{
    method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    ...(method==='POST'?{body:JSON.stringify(p)}:{})
  });
const run=async(request,environment=env)=>{
  const response=await handleT12SyntheticTestRequest(request,environment);
  assert.equal(response.headers.get('cache-control'),'no-store');
  return {status:response.status,body:await response.json()};
};
{
  const r=await run(req(),{...env,T12_SYNTHETIC_TEST_ENABLED:'false'});
  assert.equal(r.status,423);assert.equal(r.body.success,false);
  assert.equal(db.count(),0);
}
assert.equal((await run(req(),{...env,DB:{prepare(){throw Error('PRODUCTION')}}})).status,503);
assert.equal((await run(req(),{...env,APPS_SCRIPT_API_URL:'https://example.invalid'})).status,503);
assert.equal((await run(req(),{...env,EDGE_SESSION_SECRET:'prod'})).status,503);
assert.equal((await run(req(),{...env,T12_SYNTHETIC_DB:null})).status,503);
assert.equal((await run(req(),{...env,T12_SYNTHETIC_TEST_ATTESTATION:''})).status,503);
assert.equal((await run(req(),{...env,T12_SYNTHETIC_TEST_BEARER_SECRET:''})).status,503);
assert.equal((await run(req(payload(),'incorrect-test-token-long-enough-123456789012345'))).status,401);
assert.equal((await run(req({...payload(),customerName:'REAL NAME'}))).status,400);
assert.equal((await run(req({...payload(),customerPhone:'01111111111'}))).status,400);
assert.equal((await run(req({...payload(),itemName:'REAL ITEM'}))).status,400);
assert.equal((await run(req(payload('co_1790000000000_legacy')))).status,422);
assert.equal((await run(req(payload(),secret,'GET'))).status,405);
assert.equal((await run(req(payload(),secret,'POST','/wrong'))).status,404);
assert.equal(db.count(),0);
assert.equal(db.next(),2001);
{
  const first=await run(req());
  assert.equal(first.status,201);
  assert.equal(first.body.success,true);
  assert.equal(first.body.syntheticOnly,true);
  assert.equal(first.body.productionAuthorized,false);
  assert.equal(first.body.orderId,'2001');
  assert.equal(db.count(),1);
  assert.equal(db.next(),2002);
  const replay=await run(req());
  assert.equal(replay.status,200);
  assert.equal(replay.body.idempotent,true);
  assert.equal(replay.body.orderId,'2001');
  assert.equal(db.count(),1);
  assert.equal(db.next(),2002);
  const conflict=await run(req(payload(undefined,2)));
  assert.equal(conflict.status,409);
  assert.equal(conflict.body.success,false);
  assert.equal(db.count(),1);
}
console.log('T12 standalone TEST Worker PASS: default off, no production bindings, separate bearer, fabricated payload only, remote-test handler idempotency and conflict');
