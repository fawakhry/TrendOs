/** Synthetic capacity boundary checks only. No live workbook or D1 connector. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {buildIsolated142AllRowPreimageBatch} from '../cloudflare-d1/t12-preview/t12-d1-142-all-row-preimage-guard-isolated-v1.mjs';
import {buildIsolatedPacked128RecoveryPlan} from '../cloudflare-d1/t12-preview/t12-d1-128-packed-cas-planner-isolated-v1.mjs';
const names=['الأوردرات','بنود الأوردرات'];
const note='TrendOS orders live sync V2 quota-aware';
const widths=[77,92];
const asBytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
const makeRow=(n,w,tag,len)=>({rowNumber:n,values:Array.from({length:w},()=>tag.repeat(len)),display:Array.from({length:w},()=>tag.repeat(len)),formulas:Array(w).fill('')});
function fixture({bases=[14,14],size=1}={}){
  const sourceTabs=[],mirrorTabs=[];
  for(let i=0;i<2;i++){
    const width=widths[i],base=bases[i],sheetName=names[i];
    const rows=Array.from({length:base+60},(_,k)=>{
      const n=k+1;
      return makeRow(n,width,n===1?'h':n<=12?'N':n<=base?'s':'t',size);
    });
    const before=Array.from({length:base},(_,k)=>{
      const n=k+1;
      return makeRow(n,width,n===1?'h':n<=12?'o':'s',size);
    });
    const headers=Array.from({length:width},(_,j)=>'c'+j);
    sourceTabs.push({sheetName,sheetId:i+11,headers,sourceLastRow:base+60,sourceLastCol:width,rows});
    mirrorTabs.push({sheetName,catalog:{sheetName,sheetId:i+11,headers,sourceLastRow:base,
      sourceLastCol:width,rowCount:base,status:'ready',note},rows:before});
  }
  return {sourceTabs,mirrorTabs,sourceStable:true,mirrorStable:true,workbookVerified:true};
}
function guardBytes(tab,mirror){
  const pre=[];
  for(let n=1;n<=mirror.rows.length;n++){
    const old=mirror.rows[n-1],src=tab.rows[n-1];
    if(JSON.stringify(old)!==JSON.stringify(src))continue;
    pre.push({n,v:JSON.stringify(old.values),d:JSON.stringify(old.display),f:JSON.stringify(old.formulas)});
  }
  return asBytes(pre);
}
class Stmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  run(){return this.db.raw.prepare(this.sql).run(...this.args);}
}
class FakeDb{prepare(sql){return {bind(...args){return {sql,args};}};}}
class LocalDb extends FakeDb{
  constructor(snap){super();this.raw=new DatabaseSync(':memory:');
    this.raw.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8'));
    for(const tab of snap.mirrorTabs){const c=tab.catalog;
      this.raw.prepare(\`INSERT INTO sheet_catalog (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note) VALUES(?,?,?,?,?,?,'ready',?)\`).run(tab.sheetName,String(c.sheetId),JSON.stringify(c.headers),c.rowCount,c.sourceLastCol,c.rowCount,note);
      const stmt=this.raw.prepare('INSERT INTO sheet_rows(sheet_name,row_number,values_json,display_json,formulas_json) VALUES (?,?,?,?,?)');
      for(const r of tab.rows)stmt.run(tab.sheetName,r.rowNumber,JSON.stringify(r.values),JSON.stringify(r.display),JSON.stringify(r.formulas));
    }
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(stmts){this.raw.exec('BEGIN IMMEDIATE');try{for(const s of stmts)s.run();this.raw.exec('COMMIT');}catch(err){if(this.raw.isTransaction)this.raw.exec('ROLLBACK');throw err;}}
  get(name,n){return this.raw.prepare('SELECT values_json AS v,display_json AS d,formulas_json AS f FROM sheet_rows WHERE sheet_name=? AND row_number=?').get(name,n);}
}
function summarize(label,snap){
  const estimatedGuard=snap.sourceTabs.map((s,i)=>guardBytes(s,snap.mirrorTabs[i]));
  let proposalBytes=null,planError=null;
  try{proposalBytes=buildIsolatedPacked128RecoveryPlan(snap).publicSummary.estimatedPrivateProposalBytes;}
  catch(e){planError=e.message;}
  let guardedStatements=null,guardError=null;
  try{const out=buildIsolated142AllRowPreimageBatch(new FakeDb(),snap);guardedStatements=out.statements.length;}
  catch(e){guardError=e.message;}
  const rec={label,widths,sourceRows:snap.sourceTabs.map(s=>s.sourceLastRow),mirrorRows:snap.mirrorTabs.map(s=>s.catalog.rowCount),candidatePositions:142,estimatedGuardBytesPerTab:estimatedGuard,proposalBytes,planError,guardedStatements,guardError};
  console.log(JSON.stringify(rec));return rec;
}
let checks=0;
// Actual SQLite transaction with 77/92 columns and synthetic short cells.
{
  const snap=fixture(),r=summarize('wide-14-to-74-short',snap);
  assert.equal(r.planError,null);assert.equal(r.guardError,null);
  assert.equal(r.guardedStatements,42);
  const db=new LocalDb(snap),batch=buildIsolated142AllRowPreimageBatch(db,snap);
  await db.batch(batch.statements);
  for(let i=0;i<2;i++){
    assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM sheet_rows WHERE sheet_name=?').get(names[i]).n,74);
    for(const n of [1,2,13,14,15,74]){
      const row=db.get(names[i],n),expected=snap.sourceTabs[i].rows[n-1];
      assert.equal(row.v,JSON.stringify(expected.values));
      assert.equal(row.d,JSON.stringify(expected.display));
      assert.equal(row.f,JSON.stringify(expected.formulas));
    }
  }
  checks++;
}
// Same short fixture but wider generated cells should abort locally at a bound.
{
  const r=summarize('wide-14-to-74-longer',fixture({size:12}));
  assert(r.planError || r.guardError);checks++;
}
// Historical row-count envelope, purely synthetic and NOT a current snapshot.
for(const size of [1,12]){
  const r=summarize('historical-count-envelope-cell-size-'+size,
    fixture({bases:[652,708],size}));
  assert(r.planError || r.guardError);
  assert(r.estimatedGuardBytesPerTab.length===2);checks++;
}
console.log('SYNTHETIC WIDE LOCAL CHECKS='+checks+' PASS; REAL D1 NOT_RUN; PROD NOT_AUTHORIZED');
