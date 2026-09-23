import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { buildIsolatedPacked128GuardedBatch } from
  '../cloudflare-d1/t12-preview/t12-d1-128-packed-cas-batch-isolated-v1.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',
  import.meta.url),'utf8');
const names=['الأوردرات','بنود الأوردرات'];
const note='TrendOS orders live sync V2 quota-aware';
const row=(n,v)=>({rowNumber:n,values:[v],display:[v],formulas:['']});
// Entirely FABRICATED: 12 rows in each mirror, 65 in each source;
// rows 1..11 differ, row 12 matches, 53 new tail => 128 total candidates.
function snapshot(){
  return {sourceTabs:names.map((sheetName,i)=>({
    sheetName,sheetId:i+11,headers:['h'],sourceLastRow:65,sourceLastCol:1,
    rows:Array.from({length:65},(_,index)=>{
      const n=index+1;return row(n,n<=11?'updated-'+n:(n===12?'same':'tail-'+n));
    })
  })),mirrorTabs:names.map((sheetName,i)=>({
    sheetName,catalog:{sheetName,sheetId:i+11,headers:['h'],
      sourceLastRow:12,sourceLastCol:1,rowCount:12,status:'ready',note},
    rows:Array.from({length:12},(_,index)=>{
      const n=index+1;return row(n,n<=11?'old-'+n:'same');
    })
  })),sourceStable:true,mirrorStable:true,workbookVerified:true};
}
class Stmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class D1Sqlite{
  constructor(){
    this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);
    const input=snapshot();
    for(const [i,name] of names.entries()){
      const mirror=input.mirrorTabs[i];
      this.raw.prepare(`INSERT INTO sheet_catalog
        (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,
         row_count,status,note) VALUES(?,?,?,?,?,?,'ready',?)`)
        .run(name,String(i+11),'["h"]',12,1,12,note);
      for(const r of mirror.rows){
        this.raw.prepare(`INSERT INTO sheet_rows
          (sheet_name,row_number,values_json,display_json,formulas_json)
          VALUES(?,?,?,?,?)`).run(name,r.rowNumber,JSON.stringify(r.values),
          JSON.stringify(r.display),JSON.stringify(r.formulas));
      }
    }
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(statements,{failAt=0,loseResponse=false}={}){
    this.raw.exec('BEGIN IMMEDIATE');
    try{
      for(const [i,stmt] of statements.entries()){
        if(failAt===i+1)throw Error('synthetic-mid-batch-failure');
        stmt.run();
      }
      this.raw.exec('COMMIT');
      if(loseResponse)throw Error('synthetic-response-lost-after-commit');
    }catch(err){
      if(this.raw.isTransaction)this.raw.exec('ROLLBACK');
      throw err;
    }
  }
  count(name){return Number(this.raw.prepare(
    'SELECT COUNT(*) AS n FROM sheet_rows WHERE sheet_name=?').get(name).n);}
  catalog(name){return Number(this.raw.prepare(
    'SELECT row_count AS n FROM sheet_catalog WHERE sheet_name=?').get(name).n);}
  value(name,n){return JSON.parse(this.raw.prepare(
    'SELECT values_json AS v FROM sheet_rows WHERE sheet_name=? AND row_number=?')
    .get(name,n).v)[0];}
}
function original(db){
  for(const name of names){
    assert.equal(db.catalog(name),12);
    assert.equal(db.count(name),12);
    assert.equal(db.value(name,2),'old-2');
  }
}
const build=db=>buildIsolatedPacked128GuardedBatch(db,snapshot());
let cases=0;
{
  const db=new D1Sqlite(),b=build(db);
  assert.equal(b.publicSummary.totalCandidateUpserts,128);
  assert.equal(b.hypotheticalBatchStatements,36); // 2 guards+32 packs+2 advances
  assert.equal(b.statements.length,36);
  assert.equal(b.productionWriteAuthorized,false);
  assert.equal(b.requiresDedicatedTestD1Qualification,true);
  assert.equal(b.requiresAccountAndRealPayloadQualification,true);
  for(const stmt of b.statements){
    assert(stmt.args.length<=100,'packed SQL must fit 100 parameter limit');
    assert(new TextEncoder().encode(stmt.sql).length<=100000);
  }
  original(db); // constructing candidate does not mutate local SQLite
  await db.batch(b.statements); // LOCAL SQLITE TEST ONLY
  for(const name of names){
    assert.equal(db.catalog(name),65);
    assert.equal(db.count(name),65);
    assert.equal(db.value(name,2),'updated-2');
    assert.equal(db.value(name,12),'same');
    assert.equal(db.value(name,65),'tail-65');
  }
  cases++;
}
{
  const db=new D1Sqlite(),b=build(db);
  db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? AND row_number=?')
    .run('["foreign-write"]',names[1],2);
  await assert.rejects(db.batch(b.statements));
  assert.equal(db.catalog(names[0]),12);
  assert.equal(db.value(names[0],2),'old-2'); // all first-tab rows ROLLED BACK
  assert.equal(db.value(names[1],2),'foreign-write'); // outside change survives
  assert.equal(db.count(names[0]),12);
  cases++;
}
{
  const db=new D1Sqlite(),b=build(db);
  db.raw.prepare(`INSERT INTO sheet_rows
      (sheet_name,row_number,values_json,display_json,formulas_json)
      VALUES(?,?,?,?,?)`).run(names[0],13,'["foreign"]','["foreign"]','[""]');
  await assert.rejects(db.batch(b.statements));
  assert.equal(db.catalog(names[0]),12);
  assert.equal(db.value(names[0],2),'old-2');
  assert.equal(db.count(names[0]),13); // foreign append stays unchanged
  cases++;
}
{
  const db=new D1Sqlite(),b=build(db);
  await assert.rejects(db.batch(b.statements,{failAt:20}),/synthetic-mid-batch-failure/);
  original(db);cases++;
}
{
  const db=new D1Sqlite(),b=build(db);
  await assert.rejects(db.batch(b.statements,{loseResponse:true}),
    /synthetic-response-lost-after-commit/);
  for(const name of names){
    assert.equal(db.catalog(name),65);
    assert.equal(db.count(name),65);
  }
  // The old proposal must never be automatically retried.
  await assert.rejects(db.batch(b.statements));
  cases++;
}
{
  const db=new D1Sqlite(),s=snapshot();s.sourceStable=false;
  assert.throws(()=>buildIsolatedPacked128GuardedBatch(db,s),
    /R4_PLAN_ABORT_UNSTABLE_OR_UNVERIFIED_SNAPSHOT/);
  original(db);cases++;
}
// Explicit isolation: no code in live Worker/App Script imports the proof.
for(const name of ['../cloudflare-d1/production-shadow/index.js',
  '../cloudflare-d1/src/index_v2.js',
  '../cloudflare-d1/src/r4-guarded-recovery-production.mjs']){
  const live=fs.readFileSync(new URL(name,import.meta.url),'utf8');
  assert.equal(live.includes('t12-d1-128-packed-cas-batch-isolated-v1'),false);
  assert.equal(live.includes('t12-d1-128-packed-cas-planner-isolated-v1'),false);
}
console.log('T12 isolated 128 packed CAS SQLite PASS: '+cases+
  ' fabricated commit/rollback/stale/unknown scenarios, 36 statements, no live route.');
