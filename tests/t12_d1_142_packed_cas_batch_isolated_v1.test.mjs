/**
 * SYNTHETIC / NOT ROUTED: fabricated ONE-COLUMN 12->72 row tabs, 11 changed
 * existing + 60 appended per tab => 142 candidate ROW POSITIONS, not orders.
 * No real customer data, Cloudflare credentials, HTTP, Apps Script or live D1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { buildIsolatedPacked128GuardedBatch } from
  '../cloudflare-d1/t12-preview/t12-d1-128-packed-cas-batch-isolated-v1.mjs';
const names = ['الأوردرات', 'بنود الأوردرات'];
const note = 'TrendOS orders live sync V2 quota-aware';
const schema = fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql', import.meta.url), 'utf8');
const row = (n,v) => ({ rowNumber:n, values:[v], display:[v], formulas:[''] });
function fixture() {
  return {
    sourceTabs:names.map((sheetName,i)=>({
      sheetName, sheetId:i+11, headers:['h'], sourceLastRow:72, sourceLastCol:1,
      rows:Array.from({length:72},(_,k)=>{
        const n=k+1; return row(n,n===1?'h':n<=12?'new-'+i+'-'+n:'tail-'+i+'-'+n);
      })
    })),
    mirrorTabs:names.map((sheetName,i)=>({
      sheetName, catalog:{sheetName,sheetId:i+11,headers:['h'],
        sourceLastRow:12,sourceLastCol:1,rowCount:12,status:'ready',note},
      rows:Array.from({length:12},(_,k)=>{
        const n=k+1;return row(n,n===1?'h':'old-'+i+'-'+n);
      })
    })),
    sourceStable:true,mirrorStable:true,workbookVerified:true
  };
}
class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class MockD1 {
  constructor(){
    this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);
    for(const [i,name] of names.entries()){
      this.raw.prepare('INSERT INTO sheet_catalog '+
        '(sheet_name,sheet_id,headers_json,source_last_row,source_last_col,'+
        "row_count,status,note) VALUES(?,?,?,?,?,?,'ready',?)")
        .run(name,String(i+11),'["h"]',12,1,12,note);
      for(const r of fixture().mirrorTabs[i].rows){
        this.raw.prepare('INSERT INTO sheet_rows '+
          '(sheet_name,row_number,values_json,display_json,formulas_json) '+
          'VALUES(?,?,?,?,?)').run(name,r.rowNumber,JSON.stringify(r.values),
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
    }catch(e){if(this.raw.isTransaction)this.raw.exec('ROLLBACK');throw e;}
  }
  one(sql,...binds){return this.raw.prepare(sql).get(...binds);}
  count(name){return this.one(
    'SELECT COUNT(*) AS n FROM sheet_rows WHERE sheet_name=?',name).n;}
  catalog(name){return this.one(
    'SELECT row_count AS n FROM sheet_catalog WHERE sheet_name=?',name).n;}
  row(name,n){
    const r=this.one('SELECT values_json AS v,display_json AS d,'+
      'formulas_json AS f FROM sheet_rows WHERE sheet_name=? AND row_number=?',
      name,n);
    return {rowNumber:n,values:JSON.parse(r.v),display:JSON.parse(r.d),
      formulas:JSON.parse(r.f)};
  }
}
const build=db=>buildIsolatedPacked128GuardedBatch(db,fixture());
function checkOriginal(db){
  names.forEach((name,i)=>{
    assert.equal(db.catalog(name),12);assert.equal(db.count(name),12);
    assert.deepEqual(db.row(name,2),row(2,'old-'+i+'-2'));
  });
}
function checkParity(db){
  fixture().sourceTabs.forEach((tab)=>{
    assert.equal(db.catalog(tab.sheetName),72);
    assert.equal(db.count(tab.sheetName),72);
    for(const r of tab.rows)assert.deepEqual(db.row(tab.sheetName,r.rowNumber),r);
  });
}
let cases=0;
{
  const db=new MockD1(),batch=build(db);
  assert.equal(batch.publicSummary.totalCandidateUpserts,142);
  assert.deepEqual(batch.publicSummary.tabCounts.map(x=>
    [x.changedExistingRows,x.appendedRows,x.candidateUpserts]),
    [[11,60,71],[11,60,71]]);
  assert.equal(batch.hypotheticalBatchStatements,40);
  assert.equal(batch.statements.length,40); // 2 guards + 18*2 packs + 2 advances
  assert.equal(batch.productionWriteAuthorized,false);
  assert.equal(batch.triggerRestartAuthorized,false);
  for(const stmt of batch.statements){
    assert(stmt.args.length<=100);
    assert(new TextEncoder().encode(stmt.sql).length<=100000);
  }
  checkOriginal(db); // planning is not writing
  await db.batch(batch.statements);checkParity(db);cases++;
}
{
  // A stale changed row in the second tab must roll back ALL first-tab updates.
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? '+
    'AND row_number=?').run('["foreign"]',names[1],2);
  await assert.rejects(db.batch(batch.statements));
  assert.equal(db.catalog(names[0]),12);
  assert.deepEqual(db.row(names[0],2),row(2,'old-0-2'));
  assert.deepEqual(db.row(names[1],2).values,['foreign']);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('INSERT INTO sheet_rows '+
    '(sheet_name,row_number,values_json,display_json,formulas_json) '+
    'VALUES(?,?,?,?,?)').run(names[0],13,'["foreign"]','["foreign"]','[""]');
  await assert.rejects(db.batch(batch.statements));
  assert.equal(db.catalog(names[0]),12);
  assert.equal(db.count(names[0]),13);
  assert.equal(db.catalog(names[1]),12);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('UPDATE sheet_catalog SET source_last_col=? WHERE sheet_name=?')
    .run(2,names[1]);
  await assert.rejects(db.batch(batch.statements));
  assert.equal(db.catalog(names[0]),12);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  await assert.rejects(db.batch(batch.statements,{failAt:20}),
    /synthetic-mid-batch-failure/);
  checkOriginal(db);cases++;
}
{
  // Ambiguous response after COMMIT: observe already-applied rows; do not retry.
  const db=new MockD1(),batch=build(db);
  await assert.rejects(db.batch(batch.statements,{loseResponse:true}),
    /synthetic-response-lost-after-commit/);
  checkParity(db);
  await assert.rejects(db.batch(batch.statements));
  checkParity(db);cases++;
}
{
  const db=new MockD1(),snap=fixture();snap.sourceStable=false;
  assert.throws(()=>buildIsolatedPacked128GuardedBatch(db,snap),
    /R4_PLAN_ABORT_UNSTABLE_OR_UNVERIFIED_SNAPSHOT/);
  checkOriginal(db);cases++;
}
{
  // IMPORTANT NEGATIVE CONTRACT: changed-row CAS does NOT guard UNCHANGED rows.
  // This batch can commit while full content parity is FALSE. All-writer
  // fencing or full-snapshot transactional guarding and GET postflight required.
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('UPDATE sheet_rows SET values_json=? WHERE sheet_name=? '+
    'AND row_number=?').run('["foreign-unchanged"]',names[0],1);
  await db.batch(batch.statements);
  assert.equal(db.catalog(names[0]),72);
  assert.equal(db.count(names[0]),72);
  assert.deepEqual(db.row(names[0],1).values,['foreign-unchanged']);
  assert.notDeepEqual(db.row(names[0],1),fixture().sourceTabs[0].rows[0]);
  assert.deepEqual(db.row(names[0],2),fixture().sourceTabs[0].rows[1]);
  cases++;
}
assert.equal(cases,8);
console.log('Synthetic 142 packed-CAS SQLite scenarios='+cases+
  '; 40 statements; UNCHANGED ROW NOT CAS-GUARDED; NO PRODUCTION AUTHORIZATION.');
