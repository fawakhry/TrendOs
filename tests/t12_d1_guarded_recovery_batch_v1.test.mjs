import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { buildIsolatedGuardedRecoveryBatch } from
  '../cloudflare-d1/t12-preview/t12-d1-guarded-recovery-batch-v1.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',
  import.meta.url),'utf8');
const names=['الأوردرات','بنود الأوردرات'];
const note='TrendOS orders live sync V2 quota-aware';
const row=(n,v)=>({rowNumber:n,values:[v],display:[v],formulas:['']});
function snapshot() {
  return {sourceTabs:names.map((sheetName,i)=>({
    sheetName,sheetId:i+11,headers:['h'],sourceLastRow:3,sourceLastCol:1,
    rows:[row(1,'h'),row(2,'updated'),row(3,'new')]
  })),mirrorTabs:names.map((sheetName,i)=>({
    sheetName,catalog:{sheetName,sheetId:i+11,headers:['h'],
      sourceLastRow:2,sourceLastCol:1,rowCount:2,status:'ready',note},
    rows:[row(1,'h'),row(2,'old')]
  })),sourceStable:true,mirrorStable:true,workbookVerified:true};
}
class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class D1Sqlite {
  constructor(){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec(schema);
    for (const [i,name] of names.entries()) {
      this.raw.prepare(`INSERT INTO sheet_catalog
        (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,
         row_count,status,note)
        VALUES(?,?,?,?,?,?,'ready',?)`).run(name,String(i+11),'["h"]',2,1,2,note);
      for (const r of [row(1,'h'),row(2,'old')]) {
        this.raw.prepare(`INSERT INTO sheet_rows
          (sheet_name,row_number,values_json,display_json,formulas_json)
          VALUES(?,?,?,?,?)`).run(name,r.rowNumber,JSON.stringify(r.values),
            JSON.stringify(r.display),JSON.stringify(r.formulas));
      }
    }
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(statements,{failAt=0,simulateLostResponse=false}={}){
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      let index=0;
      for(const stmt of statements){
        index++;
        if(failAt===index) throw new Error('synthetic-mid-batch-failure');
        stmt.run();
      }
      this.raw.exec('COMMIT');
      if(simulateLostResponse) throw new Error('synthetic-response-lost-after-commit');
      return {success:true};
    } catch(err) {
      if(this.raw.isTransaction) this.raw.exec('ROLLBACK');
      throw err;
    }
  }
  catalogCount(name){return Number(this.raw.prepare(
    'SELECT row_count AS n FROM sheet_catalog WHERE sheet_name=?').get(name).n);}
  rowValue(name,n){return JSON.parse(this.raw.prepare(
    'SELECT values_json AS v FROM sheet_rows WHERE sheet_name=? AND row_number=?'
  ).get(name,n).v)[0];}
  rowCount(name){return Number(this.raw.prepare(
    'SELECT COUNT(*) AS n FROM sheet_rows WHERE sheet_name=?').get(name).n);}
}
function prepare(db){return buildIsolatedGuardedRecoveryBatch(db,snapshot());}
function checkOriginal(db){
  for(const name of names){
    assert.equal(db.catalogCount(name),2);
    assert.equal(db.rowCount(name),2);
    assert.equal(db.rowValue(name,2),'old');
  }
}
let cases=0;
{
  const db=new D1Sqlite();
  const batch=prepare(db);
  assert.equal(batch.productionWriteAuthorized,false);
  assert.equal(batch.requiresSingleTransactionalBatch,true);
  assert.equal(batch.publicSummary.totalCandidateUpserts,4);
  assert.equal(batch.statements.length,8); // 2 guards + 4 upserts + 2 catalogs
  checkOriginal(db); // constructing candidate is pure
  await db.batch(batch.statements);
  for(const name of names){
    assert.equal(db.catalogCount(name),3);
    assert.equal(db.rowCount(name),3);
    assert.equal(db.rowValue(name,2),'updated');
    assert.equal(db.rowValue(name,3),'new');
  }
  cases++;
}
{
  const db=new D1Sqlite();
  const batch=prepare(db);
  // A writer changed the mirror after our GET. Abort without clobbering it.
  db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? AND row_number=2')
    .run('["foreign-write"]',names[1]);
  await assert.rejects(db.batch(batch.statements));
  assert.equal(db.catalogCount(names[0]),2);
  assert.equal(db.rowValue(names[0],2),'old'); // first-tab write rolled back
  assert.equal(db.rowValue(names[1],2),'foreign-write');
  assert.equal(db.rowCount(names[0]),2);
  cases++;
}
{
  const db=new D1Sqlite();
  const batch=prepare(db);
  db.raw.prepare('INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json) VALUES(?,?,?,?,?)')
    .run(names[0],3,'["foreign"]','["foreign"]','[""]');
  await assert.rejects(db.batch(batch.statements));
  assert.equal(db.catalogCount(names[0]),2);
  assert.equal(db.rowValue(names[0],2),'old');
  assert.equal(db.rowCount(names[0]),3); // concurrent writer remains unchanged
  cases++;
}
{
  const db=new D1Sqlite();
  const batch=prepare(db);
  await assert.rejects(db.batch(batch.statements,{failAt:6}),
    /synthetic-mid-batch-failure/);
  checkOriginal(db);
  cases++;
}
{
  const db=new D1Sqlite();
  const batch=prepare(db);
  await assert.rejects(db.batch(batch.statements,{simulateLostResponse:true}),
    /synthetic-response-lost-after-commit/);
  // Ambiguous result: no retry; GET shows full parity against captured snapshot.
  for(const name of names) {
    assert.equal(db.catalogCount(name),3);
    assert.equal(db.rowValue(name,2),'updated');
  }
  // If caller incorrectly retries the old proposal, the CAS guard blocks it.
  await assert.rejects(db.batch(batch.statements));
  cases++;
}
{
  const db=new D1Sqlite();
  const input=snapshot();input.sourceStable=false;
  assert.throws(()=>buildIsolatedGuardedRecoveryBatch(db,input),
    /R4_PLAN_ABORT_UNSTABLE_OR_UNVERIFIED_SNAPSHOT/);
  checkOriginal(db);
  cases++;
}
console.log('R4 guarded two-tab SQLite batch PASS: '+cases+
  ' scenarios; atomic commit, stale-content/range rejection, rollback, ambiguous response, fail-closed source.');
