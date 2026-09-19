import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  seedT12OrderIdAuthorityCandidate,
  allocateT12OrderIdCandidate,
  T12_ORDER_ID_AUTHORITY_VERSION
} from '../cloudflare-d1/src/t12-order-id-authority-candidate.mjs';

const schema = fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-order-id-authority-v1.sql',import.meta.url),'utf8');
const source = fs.readFileSync(new URL('../cloudflare-d1/src/t12-order-id-authority-candidate.mjs',import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const prodShadow = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');

assert.match(T12_ORDER_ID_AUTHORITY_VERSION,/T12_ORDER_ID_AUTHORITY/);
assert.equal(index.includes('t12-order-id-authority-candidate'),false);
assert.equal(prodShadow.includes('t12-order-id-authority-candidate'),false);
assert.equal(/\b(?:orders|sheet_rows|sheet_catalog|cloud_write_events)\b/i.test(schema),false);
assert.equal(/\bnew\s+Response\s*\(/.test(source),false);
assert.equal(/\bfetch\s*\(/.test(source),false);

class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...params){this.params=params;return this;}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null;}
  async run(){return this.db.prepare(this.sql).run(...this.params);}
}
class D1 {
  constructor(){this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);}
  prepare(sql){return new Stmt(this.raw,sql);}
}
const gates={
  mode:'isolated-exclusive-qualification',
  allowTestAllocation:true,
  productionVersion155SourceExact:true,
  googleCreateFrozen:true,
  idempotencyLedgerQualified:true,
  rollbackReady:true
};

let db=new D1();
let x=await seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId:1200,sourceSnapshot:'snap-A'},{});
assert.equal(x.success,false);
assert.equal(x.reason,'exclusive-authority-gates-not-satisfied');

x=await seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId:1200,sourceSnapshot:'snap-A'},gates);
assert.equal(x.success,true);
assert.equal(x.seeded,true);
assert.equal(x.nextValue,1201);
assert.equal(x.productionAuthorized,false);

let replay=await seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId:1200,sourceSnapshot:'snap-A'},gates);
assert.equal(replay.success,true);
assert.equal(replay.idempotent,true);
assert.equal(replay.nextValue,1201);

let mismatch=await seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId:1201,sourceSnapshot:'snap-B'},gates);
assert.equal(mismatch.success,false);
assert.equal(mismatch.reason,'sequence-already-seeded-with-different-source');

let a=await allocateT12OrderIdCandidate(db,{});
assert.equal(a.success,false);
assert.equal(a.reason,'exclusive-authority-gates-not-satisfied');

a=await allocateT12OrderIdCandidate(db,gates);
assert.equal(a.success,true);
assert.equal(a.orderId,'1201');
assert.equal(a.productionAuthorized,false);
let b=await allocateT12OrderIdCandidate(db,gates);
assert.equal(b.orderId,'1202');
assert.equal(b.nextValue,1203);

const ids=[];
for(let i=0;i<50;i++) ids.push((await allocateT12OrderIdCandidate(db,gates)).orderId);
assert.equal(new Set(ids).size,50);
assert.equal(ids[0],'1203');
assert.equal(ids.at(-1),'1252');

db=new D1();
a=await allocateT12OrderIdCandidate(db,gates);
assert.equal(a.success,false);
assert.equal(a.reason,'sequence-not-seeded');

x=await seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId:999,sourceSnapshot:'snap-X'},gates);
assert.equal(x.success,false);
assert.equal(x.reason,'invalid-max-observed-order-id');

console.log('T12 isolated Order-ID authority candidate PASS; exclusive gates, seed pinning and monotonic allocation verified.');
