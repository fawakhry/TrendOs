/**
 * LOCAL ONLY contract test for the historical-shape 142 TEST qualification worker.
 * No Cloudflare remote IO, no deploy, no production data.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handle142Qualification} from
  '../cloudflare-d1/t12-preview/t12-existing-test-mirror-142-remote-dev-worker-20260926.mjs';

const schema=fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8');
const NOTE='TrendOS orders live sync V2 quota-aware';
const tiny=[
 {name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
  next:'["SYNTHETIC TEST MIRROR NEW ORDER"]'},
 {name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
  next:'["SYNTHETIC TEST MIRROR NEW LINE"]'}
];
class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 run(){return this.db.raw.prepare(this.sql).run(...this.args);}
 first(){return this.db.raw.prepare(this.sql).get(...this.args);}
}
class MockD1{
 constructor(){
  this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);
  this.raw.exec('CREATE TABLE t12_synth_control (singleton INTEGER PRIMARY KEY, fixture_marker TEXT NOT NULL)');
  this.raw.prepare('INSERT INTO t12_synth_control VALUES(1,?)').run('T12_SYNTHETIC_ONLY');
  const header='["synthetic_header"]',f='[""]';
  for(const t of tiny){
   this.raw.prepare(`INSERT INTO sheet_catalog
    (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
    VALUES (?,?,?,2,1,2,'ready',?)`).run(t.name,t.sheetId,header,NOTE);
   this.raw.prepare('INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json) VALUES(?,?,?,?,?)')
    .run(t.name,1,header,header,f);
   this.raw.prepare('INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json) VALUES(?,?,?,?,?)')
    .run(t.name,2,t.next,t.next,f);
  }
 }
 prepare(sql){return new Statement(this,sql);}
 async batch(statements,{loseResponse=false}={}){
  this.raw.exec('BEGIN IMMEDIATE');
  try{
   for(const s of statements)s.run();
   this.raw.exec('COMMIT');
   if(loseResponse)throw Error('synthetic-response-lost-after-commit');
  }catch(e){
   if(this.raw.isTransaction)this.raw.exec('ROLLBACK');
   throw e;
  }
 }
}
const env=db=>({T12_SYNTHETIC_DB:db});
const req=(method,body)=>new Request('http://127.0.0.1/__t12/local/142-qualification',{
 method,headers:body?{'content-type':'application/json'}:undefined,
 body:body?JSON.stringify(body):undefined
});
const data=async r=>({status:r.status,body:await r.json()});
let cases=0;
{
 const db=new MockD1();
 let r=await data(await handle142Qualification(req('GET'),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.state.state,'TINY_NEW');cases++;

 r=await data(await handle142Qualification(req('POST',{
  action:'seed',confirmation:'SEED_142_SYNTHETIC_FROM_TINY_NEW'
 }),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.code,'seed-pass');
 assert.equal(r.body.after.state,'LARGE_BASELINE');
 assert.equal(r.body.after.catalogRows,2);assert.equal(r.body.after.mirrorRows,1360);
 assert.equal(r.body.after.migrationRows,0);cases++;

 r=await data(await handle142Qualification(req('GET'),env(db)));
 assert.equal(r.body.state.state,'LARGE_BASELINE');cases++;

 r=await data(await handle142Qualification(req('POST',{
  action:'positive',confirmation:'RUN_142_POSITIVE_ON_EXISTING_TEST_ONLY'
 }),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.code,'positive-pass');
 assert.equal(r.body.publicPlan.candidateUpserts,142);
 assert.equal(r.body.publicPlan.statements,42);
 assert(r.body.publicPlan.guardChunkCounts.every(n=>n>1));
 assert.equal(r.body.after.state,'LARGE_TARGET');
 assert.equal(r.body.after.mirrorRows,1480);cases++;

 r=await data(await handle142Qualification(req('GET'),env(db)));
 assert.equal(r.body.state.state,'LARGE_TARGET');
 assert.equal(r.body.state.tabs[0].newChanged,11);
 assert.equal(r.body.state.tabs[1].newChanged,11);
 assert.equal(r.body.state.tabs[0].tailRows,60);
 assert.equal(r.body.state.tabs[1].tailRows,60);cases++;

 r=await data(await handle142Qualification(req('POST',{
  action:'seed',confirmation:'SEED_142_SYNTHETIC_FROM_TINY_NEW'
 }),env(db)));
 assert.equal(r.status,409);assert.equal(r.body.code,'seed-requires-tiny-new');cases++;

 r=await data(await handle142Qualification(req('POST',{
  action:'positive',confirmation:'RUN_142_POSITIVE_ON_EXISTING_TEST_ONLY'
 }),env(db)));
 assert.equal(r.status,503);assert.equal(r.body.code,'positive-requires-large-baseline');cases++;
}
{
 const db=new MockD1();
 const original=db.batch.bind(db);
 let calls=0;
 db.batch=async statements=>{
  calls++;
  if(calls===1){await original(statements);throw Error('lost-seed-ack');}
  return original(statements);
 };
 const r=await data(await handle142Qualification(req('POST',{
  action:'seed',confirmation:'SEED_142_SYNTHETIC_FROM_TINY_NEW'
 }),env(db)));
 assert.equal(r.status,200);
 assert.equal(r.body.code,'seed-committed-response-error');
 assert.equal(r.body.after.state,'LARGE_BASELINE');cases++;
}
assert.equal(cases,8);
console.log('T12 real-D1 142 qualification worker LOCAL contract PASS '+cases+'/8; NO REMOTE IO.');
