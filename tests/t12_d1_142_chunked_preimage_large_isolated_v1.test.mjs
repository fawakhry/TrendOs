/** Full historical-count SHAPE ONLY; ALL cells fabricated, no real order payload. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {buildIsolated142ChunkedPreimageBatch} from
 '../cloudflare-d1/t12-preview/t12-d1-142-chunked-preimage-guard-isolated-v1.mjs';
const names=['الأوردرات','بنود الأوردرات'], widths=[77,92],bases=[652,708];
const note='TrendOS orders live sync V2 quota-aware';
const row=(n,w,v)=>({rowNumber:n,values:Array(w).fill(v),display:Array(w).fill(v),formulas:Array(w).fill('')});
const fixture=(size=1)=>{
 const sourceTabs=[],mirrorTabs=[];
 for(let i=0;i<2;i++){
  const w=widths[i],base=bases[i],name=names[i],head=Array.from({length:w},(_,j)=>'c'+j);
  const newRows=Array.from({length:base+60},(_,k)=>{let n=k+1;return row(n,w,(n===1?'h':n<=12?'N':n<=base?'s':'t').repeat(size));});
  const oldRows=Array.from({length:base},(_,k)=>{let n=k+1;return row(n,w,(n===1?'h':n<=12?'o':'s').repeat(size));});
  sourceTabs.push({sheetName:name,sheetId:i+11,headers:head,sourceLastRow:base+60,sourceLastCol:w,rows:newRows});
  mirrorTabs.push({sheetName:name,catalog:{sheetName:name,sheetId:i+11,headers:head,sourceLastRow:base,sourceLastCol:w,rowCount:base,status:'ready',note},rows:oldRows});
 }
 return {sourceTabs,mirrorTabs,sourceStable:true,mirrorStable:true,workbookVerified:true};
};
class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class LocalDb{
 constructor(snap){
  this.raw=new DatabaseSync(':memory:');this.raw.exec(fs.readFileSync(new URL(
    '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8'));
  for(const tab of snap.mirrorTabs){const c=tab.catalog;
   this.raw.prepare("INSERT INTO sheet_catalog (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note) VALUES (?,?,?,?,?,?,'ready',?)").run(tab.sheetName,String(c.sheetId),JSON.stringify(c.headers),c.rowCount,c.sourceLastCol,c.rowCount,note);
   const put=this.raw.prepare('INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json) VALUES (?,?,?,?,?)');
   for(const r of tab.rows)put.run(tab.sheetName,r.rowNumber,JSON.stringify(r.values),JSON.stringify(r.display),JSON.stringify(r.formulas));
  }
 }
 prepare(sql){return new Statement(this,sql);}
 async batch(stmts,{failAt=0,loseResponse=false}={}){
  this.raw.exec('BEGIN IMMEDIATE');
  try{for(const [i,s] of stmts.entries()){
   if(i+1===failAt)throw Error('synthetic-mid-batch-failure');s.run();
  }this.raw.exec('COMMIT');if(loseResponse)throw Error('synthetic-reply-lost-after-commit');}
  catch(e){if(this.raw.isTransaction)this.raw.exec('ROLLBACK');throw e;}
 }
 one(sql,...args){return this.raw.prepare(sql).get(...args);}
 catalog(name){return this.one('SELECT row_count n FROM sheet_catalog WHERE sheet_name=?',name).n;}
 count(name){return this.one('SELECT COUNT(*) n FROM sheet_rows WHERE sheet_name=?',name).n;}
 get(name,n){return this.one('SELECT values_json v,display_json d,formulas_json f FROM sheet_rows WHERE sheet_name=? AND row_number=?',name,n);}
 edit(name,n,key,values){this.raw.prepare('UPDATE sheet_rows SET '+key+'=? WHERE sheet_name=? AND row_number=?').run(JSON.stringify(values),name,n);}
}
function oldUnchanged(db){
 assert.equal(db.catalog(names[0]),652);assert.equal(db.catalog(names[1]),708);
 assert.equal(db.count(names[0]),652);assert.equal(db.count(names[1]),708);
 assert.equal(JSON.parse(db.get(names[0],2).v)[0][0],'o');
 assert.equal(JSON.parse(db.get(names[1],2).v)[0][0],'o');
}
function parity(db,snap){
 for(let i=0;i<2;i++){
  const tab=snap.sourceTabs[i];assert.equal(db.catalog(names[i]),bases[i]+60);
  assert.equal(db.count(names[i]),bases[i]+60);
  for(let n=1;n<=bases[i]+60;n++){
   const observed=db.get(names[i],n),r=tab.rows[n-1];
   assert(observed);assert.equal(observed.v,JSON.stringify(r.values));
   assert.equal(observed.d,JSON.stringify(r.display));
   assert.equal(observed.f,JSON.stringify(r.formulas));
  }
 }
}
let cases=0,summary;
{
 const snap=fixture(),db=new LocalDb(snap),batch=buildIsolated142ChunkedPreimageBatch(db,snap);
 assert.equal(batch.publicSummary.totalCandidateUpserts,142);
 assert.equal(batch.hypotheticalBatchStatements,42);
 assert(batch.guardChunkCounts.every(x=>x>1));
 assert(batch.guardBindCounts.every(x=>x<=100));
 assert(batch.statements.every(s=>s.args.length<=100));
 assert.equal(batch.productionWriteAuthorized,false);
 oldUnchanged(db);await db.batch(batch.statements);parity(db,snap);
 summary={statements:batch.hypotheticalBatchStatements,chunks:batch.guardChunkCounts,
  guardBytes:batch.guardPayloadBytes,bindCounts:batch.guardBindCounts};cases++;
}
for(const key of ['values_json','display_json','formulas_json']){
 const snap=fixture(),db=new LocalDb(snap),batch=buildIsolated142ChunkedPreimageBatch(db,snap);
 db.edit(names[1],500,key,['external-before-batch']);const external=db.get(names[1],500);
 await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
 oldUnchanged(db);assert.deepEqual(db.get(names[1],500),external);
 assert.equal(db.get(names[0],660),undefined);cases++;
}
{
 const snap=fixture(),db=new LocalDb(snap),batch=buildIsolated142ChunkedPreimageBatch(db,snap);
 db.raw.prepare('DELETE FROM sheet_rows WHERE sheet_name=? AND row_number=?').run(names[1],500);
 await assert.rejects(db.batch(batch.statements),/NOT NULL|constraint/i);
 assert.equal(db.catalog(names[0]),652);assert.equal(db.count(names[0]),652);
 assert.equal(db.catalog(names[1]),708);assert.equal(db.count(names[1]),707);
 assert.equal(db.get(names[1],500),undefined);cases++;
}
{
 const snap=fixture(),db=new LocalDb(snap),batch=buildIsolated142ChunkedPreimageBatch(db,snap);
 await assert.rejects(db.batch(batch.statements,{failAt:30}),/synthetic-mid-batch-failure/);
 oldUnchanged(db);cases++;
}
{
 const snap=fixture(12),db=new LocalDb(snap);
 assert.throws(()=>buildIsolated142ChunkedPreimageBatch(db,snap),/R4_PLAN_ABORT_PAYLOAD_BUDGET/);
 oldUnchanged(db);cases++;
}
{
 const snap=fixture(),db=new LocalDb(snap),batch=buildIsolated142ChunkedPreimageBatch(db,snap);
 await assert.rejects(db.batch(batch.statements,{loseResponse:true}),/synthetic-reply-lost-after-commit/);
 parity(db,snap);await assert.rejects(db.batch(batch.statements));parity(db,snap);cases++;
}
assert.equal(cases,8);
console.log(JSON.stringify({status:'PASS',cases,summary,scope:'SYNTHETIC_LOCAL_ONLY',realD1:'NOT_RUN',productionAuthorization:false}));
