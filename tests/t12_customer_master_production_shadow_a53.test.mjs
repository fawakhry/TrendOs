import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import prod from '../cloudflare-d1/production-shadow/index.js';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0008_t12_customer_master.sql',import.meta.url),'utf8');
const raw=new DatabaseSync(':memory:');
raw.exec('PRAGMA foreign_keys=ON;');
raw.exec(schema);

class Stmt {
  constructor(sql){this.sql=sql;this.params=[];}
  bind(...p){this.params=p;return this;}
  async first(){return raw.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:raw.prepare(this.sql).all(...this.params)};}
  async run(){return raw.prepare(this.sql).run(...this.params);}
}
const DB={
  prepare(sql){return new Stmt(sql);},
  async batch(items){
    raw.exec('BEGIN IMMEDIATE');
    try{for(const item of items) await item.run(); raw.exec('COMMIT');}
    catch(e){try{raw.exec('ROLLBACK');}catch{} throw e;}
  }
};
const env={
  DB,
  CORS_ORIGINS:'https://fawakhry.github.io',
  EDGE_SESSION_SECRET:'unit-secret',
  TRENDOS_PRODUCTION_SHADOW_V2_ENABLED:'true'
};

let res=await prod.fetch(new Request('https://prod.test/v1/t12/customers/write/health'),env,{});
assert.equal(res.status,200);
let body=await res.json();
assert.equal(body.success,true);
assert.equal(body.schemaReady,true);
assert.equal(body.mode,'OFF');

res=await prod.fetch(new Request('https://prod.test/v1/t12/customers/write',{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:'{}'
}),env,{});
assert.equal(res.status,401);
body=await res.json();
assert.equal(body.success,false);

console.log('T12 A53 production-shadow customer write wiring PASS');
