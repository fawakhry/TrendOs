/** SYNTHETIC / NOT ROUTED. No real orders, live D1, Sheets or CI. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { buildIsolated142AllRowPreimageBatch } from
  '../cloudflare-d1/t12-preview/t12-d1-142-all-row-preimage-guard-isolated-v1.mjs';
const names=['الأوردرات','بنود الأوردرات'];
const note='TrendOS orders live sync V2 quota-aware';
const schema=fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8');
const row=(n,v)=>({rowNumber:n,values:[v],display:[v],formulas:['']});
function fixture(){
  return {
    sourceTabs:names.map((sheetName,i)=>({sheetName,sheetId:i+11,headers:['h'],
      sourceLastRow:74,sourceLastCol:1,rows:Array.from({length:74},(_,k)=>{
        const n=k+1;
        return row(n,n===1?'h':n<=12?'new-'+i+'-'+n:
          n<=14?'same-'+i+'-'+n:'tail-'+i+'-'+n);
      })})),
    mirrorTabs:names.map((sheetName,i)=>({sheetName,
      catalog:{sheetName,sheetId:i+11,headers:['h'],sourceLastRow:14,
        sourceLastCol:1,rowCount:14,status:'ready',note},
      rows:Array.from({length:14},(_,k)=>{
        const n=k+1;return row(n,n===1?'h':n<=12?'old-'+i+'-'+n:
          'same-'+i+'-'+n);
      })})),
    sourceStable:true,mirrorStable:true,workbookVerified:true
  };
}
class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class MockD1{
  constructor(){
    this.raw=new DatabaseSync(':memory:');this.raw.exec(schema);
    for(const tab of fixture().mirrorTabs){
      const c=tab.catalog;
      this.raw.prepare(`INSERT INTO sheet_catalog
        (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,
         row_count,status,note) VALUES (?,?,?,?,?,?,'ready',?)`)
        .run(tab.sheetName,String(c.sheetId),JSON.stringify(c.headers),
          c.rowCount,c.sourceLastCol,c.rowCount,note);
      for(const r of tab.rows){
        this.raw.prepare(`INSERT INTO sheet_rows
          (sheet_name,row_number,values_json,display_json,formulas_json)
          VALUES (?,?,?,?,?)`).run(tab.sheetName,r.rowNumber,
          JSON.stringify(r.values),JSON.stringify(r.display),
          JSON.stringify(r.formulas));
      }
    }
  }
  prepare(sql){return new Statement(this,sql);}
  async batch(statements,{failAt=0,loseResponse=false}={}){
    this.raw.exec('BEGIN IMMEDIATE');
    try{
      for(const [i,s] of statements.entries()){
        if(i+1===failAt)throw Error('synthetic-mid-batch-failure');
        s.run();
      }
      this.raw.exec('COMMIT');
      if(loseResponse)throw Error('synthetic-response-lost-after-commit');
    }catch(e){if(this.raw.isTransaction)this.raw.exec('ROLLBACK');throw e;}
  }
  one(sql,...args){return this.raw.prepare(sql).get(...args);}
  count(name){return this.one('SELECT COUNT(*) AS n FROM sheet_rows WHERE sheet_name=?',name).n;}
  catalog(name){return this.one('SELECT row_count AS n FROM sheet_catalog WHERE sheet_name=?',name).n;}
  get(name,n){
    const r=this.one('SELECT values_json AS v,display_json AS d,formulas_json AS f FROM sheet_rows WHERE sheet_name=? AND row_number=?',name,n);
    return r?{rowNumber:n,values:JSON.parse(r.v),display:JSON.parse(r.d),formulas:JSON.parse(r.f)}:null;
  }
  edit(name,n,key,value){
    this.raw.prepare('UPDATE sheet_rows SET '+key+'=? WHERE sheet_name=? AND row_number=?')
      .run(JSON.stringify(value),name,n);
  }
}
const build=(db,snap=fixture())=>buildIsolated142AllRowPreimageBatch(db,snap);
function checkOriginal(db,{allowSecondTabRow13Change=false}={}){
  for(const [i,name] of names.entries()){
    assert.equal(db.catalog(name),14);
    assert.equal(db.count(name),i===1 && allowSecondTabRow13Change &&
      db.get(name,13)===null?13:14);
    assert.deepEqual(db.get(name,2),row(2,'old-'+i+'-2'));
    if(i===0 || !allowSecondTabRow13Change)
      assert.deepEqual(db.get(name,13),row(13,'same-'+i+'-13'));
  }
}
function checkParity(db){
  for(const tab of fixture().sourceTabs){
    assert.equal(db.catalog(tab.sheetName),74);
    assert.equal(db.count(tab.sheetName),74);
    for(const r of tab.rows)assert.deepEqual(db.get(tab.sheetName,r.rowNumber),r);
  }
}
let cases=0;
{
  const db=new MockD1(),batch=build(db);
  assert.equal(batch.publicSummary.totalCandidateUpserts,142);
  assert.deepEqual(batch.publicSummary.tabCounts.map(x=>
    [x.changedExistingRows,x.appendedRows,x.candidateUpserts]),
    [[11,60,71],[11,60,71]]);
  assert.deepEqual(batch.guardedUnchangedRowCounts,[3,3]);
  assert.equal(batch.hypotheticalBatchStatements,42); // + 2 full unchanged guards
  assert.equal(batch.productionWriteAuthorized,false);
  for(const stmt of batch.statements){
    assert(stmt.args.length<=100);
    assert(new TextEncoder().encode(stmt.sql).length<=100000);
  }
  checkOriginal(db);await db.batch(batch.statements);checkParity(db);cases++;
}
for(const key of ['values_json','display_json','formulas_json']){
  const db=new MockD1(),batch=build(db);
  db.edit(names[1],13,key,['competitor-'+key]);
  const external=db.get(names[1],13);
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  checkOriginal(db,{allowSecondTabRow13Change:true});
  assert.deepEqual(db.get(names[1],13),external);
  assert.equal(db.catalog(names[1]),14);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('DELETE FROM sheet_rows WHERE sheet_name=? AND row_number=?')
    .run(names[1],13);
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  checkOriginal(db,{allowSecondTabRow13Change:true});
  assert.equal(db.get(names[1],13),null);
  assert.equal(db.catalog(names[1]),14);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.edit(names[0],1,'values_json',['foreign-header']);
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  assert.equal(db.catalog(names[0]),14);
  assert.deepEqual(db.get(names[0],1).values,['foreign-header']);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.edit(names[1],2,'values_json',['foreign-candidate']);
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  assert.equal(db.catalog(names[0]),14);
  assert.deepEqual(db.get(names[0],2),row(2,'old-0-2'));
  assert.deepEqual(db.get(names[1],2).values,['foreign-candidate']);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('INSERT INTO sheet_rows (sheet_name,row_number,values_json,display_json,formulas_json) VALUES (?,?,?,?,?)')
    .run(names[0],15,'["foreign"]','["foreign"]','[""]');
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  assert.equal(db.catalog(names[0]),14);assert.equal(db.count(names[0]),15);
  assert.equal(db.catalog(names[1]),14);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  db.raw.prepare('UPDATE sheet_catalog SET source_last_col=2 WHERE sheet_name=?').run(names[1]);
  await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
  assert.equal(db.catalog(names[0]),14);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  await assert.rejects(db.batch(batch.statements,{failAt:25}),
    /synthetic-mid-batch-failure/);
  checkOriginal(db);cases++;
}
{
  const db=new MockD1(),batch=build(db);
  await assert.rejects(db.batch(batch.statements,{loseResponse:true}),
    /synthetic-response-lost-after-commit/);
  checkParity(db);
  await assert.rejects(db.batch(batch.statements));checkParity(db);cases++;
}
{
  const db=new MockD1(),snap=fixture();snap.sourceStable=false;
  assert.throws(()=>build(db,snap),/R4_PLAN_ABORT_UNSTABLE_OR_UNVERIFIED_SNAPSHOT/);
  checkOriginal(db);cases++;
}
{
  const db=new MockD1(),snap=fixture();
  // The original proposal budget permits this unchanged row, but the new
  // preimage guard must refuse a too-large JSON payload rather than omit it.
  const oversized='x'.repeat(110000);
  snap.mirrorTabs[0].rows[12].values=[oversized];
  snap.sourceTabs[0].rows[12].values=[oversized];
  assert.throws(()=>build(db,snap),/R4_ALL_ROW_GUARD_ABORT_GUARD_PAYLOAD_BYTES/);
  checkOriginal(db);cases++;
}
assert.equal(cases,13);
console.log('Synthetic 142 all-row preimage SQLite scenarios='+cases+
  '; guarded statements=42; unchanged-row drift REJECTED; LOCAL ONLY; NO PRODUCTION AUTHORIZATION.');
