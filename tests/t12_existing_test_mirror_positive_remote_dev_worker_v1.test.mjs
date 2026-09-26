/**
 * LOCAL ONLY contract test for positive remote-binding worker.
 * No Cloudflare remote IO or deployment.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handlePositiveRemoteDev} from
  '../cloudflare-d1/t12-preview/t12-existing-test-mirror-positive-remote-dev-worker-20260926.mjs';

const schema=fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8');
const NOTE='TrendOS orders live sync V2 quota-aware';
const HEADER='["synthetic_header"]', FORMULAS='[""]';
const tabs=[
 {name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
  old:'["SYNTHETIC TEST MIRROR OLD ORDER"]',next:'["SYNTHETIC TEST MIRROR NEW ORDER"]'},
 {name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
  old:'["SYNTHETIC TEST MIRROR OLD LINE"]',next:'["SYNTHETIC TEST MIRROR NEW LINE"]'}
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
  for(const t of tabs){
   this.raw.prepare(`INSERT INTO sheet_catalog
    (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
    VALUES (?,?,?,2,1,2,'ready',?)`).run(t.name,t.sheetId,HEADER,NOTE);
   this.raw.prepare('INSERT INTO sheet_rows (sheet_name,row_number,values_json,display_json,formulas_json) VALUES (?,?,?,?,?)')
    .run(t.name,1,HEADER,HEADER,FORMULAS);
   this.raw.prepare('INSERT INTO sheet_rows (sheet_name,row_number,values_json,display_json,formulas_json) VALUES (?,?,?,?,?)')
    .run(t.name,2,t.old,t.old,FORMULAS);
  }
 }
 prepare(sql){return new Statement(this,sql);}
 async batch(statements){
  this.raw.exec('BEGIN IMMEDIATE');
  try{for(const s of statements)s.run();this.raw.exec('COMMIT');}
  catch(e){if(this.raw.isTransaction)this.raw.exec('ROLLBACK');throw e;}
 }
 row(name,n){return this.raw.prepare(
  'SELECT values_json v,display_json d,formulas_json f FROM sheet_rows WHERE sheet_name=? AND row_number=?'
 ).get(name,n);}
}
const env=db=>({T12_SYNTHETIC_DB:db});
const req=(method,body)=>new Request('http://127.0.0.1/__t12/local/mirror-positive',{
 method,headers:body?{'content-type':'application/json'}:undefined,
 body:body?JSON.stringify(body):undefined
});
const data=async r=>({status:r.status,body:await r.json()});
const body={scenario:'positive',confirmation:'RUN_POSITIVE_ON_EXISTING_TEST_ONLY'};
let cases=0;
{
 const db=new MockD1(),r=await data(await handlePositiveRemoteDev(req('GET'),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.state.state,'OLD');cases++;
}
{
 const db=new MockD1(),r=await data(await handlePositiveRemoteDev(req('POST',body),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.positiveCommitVerified,true);
 assert.equal(r.body.batchResponseObserved,true);assert.equal(r.body.state.state,'NEW');
 for(const t of tabs)assert.equal(db.row(t.name,2).v,t.next);cases++;
}
{
 const db=new MockD1();
 db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? AND row_number=1')
  .run('["DRIFT"]',tabs[0].name);
 const r=await data(await handlePositiveRemoteDev(req('POST',body),env(db)));
 assert.equal(r.status,409);assert.equal(r.body.code,'positive-requires-exact-old-no-write');
 assert.equal(db.row(tabs[0].name,2).v,tabs[0].old);
 assert.equal(db.row(tabs[1].name,2).v,tabs[1].old);cases++;
}
{
 const db=new MockD1(),r=await data(await handlePositiveRemoteDev(req('POST',{
  scenario:'negative-conflict',confirmation:'wrong'
 }),env(db)));
 assert.equal(r.status,400);
 assert.equal(db.row(tabs[0].name,2).v,tabs[0].old);cases++;
}
{
 const db=new MockD1();db.batch=async()=>{throw Error('before-commit');};
 const r=await data(await handlePositiveRemoteDev(req('POST',body),env(db)));
 assert.equal(r.status,503);assert.equal(r.body.code,'positive-batch-error-no-retry');
 assert.equal(r.body.state.state,'OLD');cases++;
}
{
 const db=new MockD1(),real=db.batch.bind(db);
 db.batch=async statements=>{await real(statements);throw Error('lost-ack-after-commit');};
 const r=await data(await handlePositiveRemoteDev(req('POST',body),env(db)));
 assert.equal(r.status,200);assert.equal(r.body.positiveCommitVerified,true);
 assert.equal(r.body.batchResponseObserved,false);assert.equal(r.body.state.state,'NEW');cases++;
}
{
 const db=new MockD1();await handlePositiveRemoteDev(req('POST',body),env(db));
 const r=await data(await handlePositiveRemoteDev(req('POST',body),env(db)));
 assert.equal(r.status,409);assert.equal(r.body.state.state,'NEW');cases++;
}
assert.equal(cases,7);
console.log('T12 positive remote-binding worker LOCAL contract PASS '+cases+'/7; NO REMOTE IO.');
