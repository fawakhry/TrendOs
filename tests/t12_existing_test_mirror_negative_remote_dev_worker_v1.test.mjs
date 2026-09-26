/**
 * LOCAL ONLY contract test for the remote-binding negative worker.
 * No Cloudflare, D1 remote, Worker deploy, Google or Apps Script IO.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  handleNegativeRemoteDev
} from '../cloudflare-d1/t12-preview/t12-existing-test-mirror-negative-remote-dev-worker-20260926.mjs';

const schema=fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8');
const NOTE='TrendOS orders live sync V2 quota-aware';
const HEADER='["synthetic_header"]';
const FORMULAS='[""]';
const tabs=[
  {name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
   old:'["SYNTHETIC TEST MIRROR OLD ORDER"]'},
  {name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
   old:'["SYNTHETIC TEST MIRROR OLD LINE"]'}
];
class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
  first(){return this.db.raw.prepare(this.sql).get(...this.args);}
}
class MockD1{
  constructor(){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec(schema);
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
    try{
      for(const s of statements)s.run();
      this.raw.exec('COMMIT');
    }catch(e){
      if(this.raw.isTransaction)this.raw.exec('ROLLBACK');
      throw e;
    }
  }
  row(name,n){
    return this.raw.prepare('SELECT values_json v,display_json d,formulas_json f FROM sheet_rows WHERE sheet_name=? AND row_number=?').get(name,n);
  }
}
const env=db=>({T12_SYNTHETIC_DB:db});
const req=(method,body)=>new Request('http://127.0.0.1/__t12/local/mirror-negative',{
  method,headers:body?{'content-type':'application/json'}:undefined,
  body:body?JSON.stringify(body):undefined
});
async function data(response){return {status:response.status,body:await response.json()};}
function old(db){
  for(const t of tabs){
    assert.equal(db.row(t.name,1).v,HEADER);
    assert.equal(db.row(t.name,2).v,t.old);
  }
}
let cases=0;
{
  const db=new MockD1();
  const r=await data(await handleNegativeRemoteDev(req('GET'),env(db)));
  assert.equal(r.status,200);assert.equal(r.body.success,true);
  assert.equal(r.body.baseline.exact,true);old(db);cases++;
}
{
  const db=new MockD1();
  const r=await data(await handleNegativeRemoteDev(req('POST',{
    scenario:'negative-conflict',
    confirmation:'RUN_NEGATIVE_ROLLBACK_ON_EXISTING_TEST_ONLY'
  }),env(db)));
  assert.equal(r.status,200);
  assert.equal(r.body.negativeRollbackVerified,true);
  assert.equal(r.body.expectedConstraintObserved,true);
  assert.equal(r.body.blindRetryAllowed,false);
  assert.equal(r.body.baseline.exact,true);old(db);cases++;
}
{
  const db=new MockD1();
  db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? AND row_number=1')
    .run('["DRIFT"]',tabs[1].name);
  const r=await data(await handleNegativeRemoteDev(req('POST',{
    scenario:'negative-conflict',
    confirmation:'RUN_NEGATIVE_ROLLBACK_ON_EXISTING_TEST_ONLY'
  }),env(db)));
  assert.equal(r.status,409);
  assert.equal(r.body.code,'baseline-mismatch-no-write');
  assert.equal(db.row(tabs[0].name,2).v,tabs[0].old);
  assert.equal(db.row(tabs[1].name,2).v,tabs[1].old);cases++;
}
{
  const db=new MockD1();
  const r=await data(await handleNegativeRemoteDev(req('POST',{
    scenario:'positive',confirmation:'wrong'
  }),env(db)));
  assert.equal(r.status,400);old(db);cases++;
}
{
  const db=new MockD1();
  db.batch=async()=>[];
  const r=await data(await handleNegativeRemoteDev(req('POST',{
    scenario:'negative-conflict',
    confirmation:'RUN_NEGATIVE_ROLLBACK_ON_EXISTING_TEST_ONLY'
  }),env(db)));
  assert.equal(r.status,500);
  assert.equal(r.body.code,'negative-batch-unexpectedly-resolved-no-retry');
  old(db);cases++;
}
{
  const r=await data(await handleNegativeRemoteDev(req('GET'),{}));
  assert.equal(r.status,503);
  assert.equal(r.body.code,'test-d1-binding-missing');cases++;
}
assert.equal(cases,6);
console.log('T12 remote-binding negative worker LOCAL contract PASS '+cases+'/6; NO REMOTE IO.');
