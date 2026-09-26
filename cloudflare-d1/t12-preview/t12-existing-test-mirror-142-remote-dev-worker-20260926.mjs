/**
 * TEST ONLY / REMOTE BINDING DEV ONLY.
 * Historical-shape 142-position qualification using fabricated data only.
 * Reuses ONLY sheet_catalog/sheet_rows/sheet_migration_runs in the isolated TEST D1.
 * Never deploy, never bind trendos-main, never touch legacy t12_synth_* rows.
 */
import {buildIsolated142ChunkedPreimageBatch} from
  './t12-d1-142-chunked-preimage-guard-isolated-v1.mjs';

const ROUTE='/__t12/local/142-qualification';
const NOTE='TrendOS orders live sync V2 quota-aware';
const FORMULAS=s=>JSON.stringify(Array(s).fill(''));
const specs=Object.freeze([
  Object.freeze({name:'الأوردرات',sheetId:'T12_142_SYNTHETIC_9001',width:77,base:652}),
  Object.freeze({name:'بنود الأوردرات',sheetId:'T12_142_SYNTHETIC_9002',width:92,base:708})
]);
const tiny=Object.freeze([
  Object.freeze({name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
    old:'["SYNTHETIC TEST MIRROR OLD ORDER"]',
    next:'["SYNTHETIC TEST MIRROR NEW ORDER"]'}),
  Object.freeze({name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
    old:'["SYNTHETIC TEST MIRROR OLD LINE"]',
    next:'["SYNTHETIC TEST MIRROR NEW LINE"]'})
]);
const tag=(w,v)=>JSON.stringify(Array(w).fill(v));
const headers=w=>Array.from({length:w},(_,i)=>'c'+i);
const payloads=s=>({
  h:tag(s.width,'h'),o:tag(s.width,'o'),n:tag(s.width,'N'),
  same:tag(s.width,'s'),tail:tag(s.width,'t'),f:FORMULAS(s.width),
  headers:JSON.stringify(headers(s.width))
});
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
function row(n,w,v){
  return {rowNumber:n,values:Array(w).fill(v),
    display:Array(w).fill(v),formulas:Array(w).fill('')};
}
function snapshot(){
  const sourceTabs=[],mirrorTabs=[];
  for(const s of specs){
    const h=headers(s.width);
    const sourceRows=Array.from({length:s.base+60},(_,i)=>{
      const n=i+1;return row(n,s.width,n===1?'h':n<=12?'N':n<=s.base?'s':'t');
    });
    const mirrorRows=Array.from({length:s.base},(_,i)=>{
      const n=i+1;return row(n,s.width,n===1?'h':n<=12?'o':'s');
    });
    sourceTabs.push({sheetName:s.name,sheetId:s.sheetId,headers:h,
      sourceLastRow:s.base+60,sourceLastCol:s.width,rows:sourceRows});
    mirrorTabs.push({sheetName:s.name,catalog:{sheetName:s.name,sheetId:s.sheetId,
      headers:h,sourceLastRow:s.base,sourceLastCol:s.width,rowCount:s.base,
      status:'ready',note:NOTE},rows:mirrorRows});
  }
  return {sourceTabs,mirrorTabs,sourceStable:true,mirrorStable:true,workbookVerified:true};
}
async function globals(db){
  const r=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM sheet_catalog) catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows) mirror_rows,
    (SELECT COUNT(*) FROM sheet_migration_runs) migration_rows,
    (SELECT COUNT(*) FROM t12_synth_control
      WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY') control_matches`).first();
  return {catalogRows:Number(r?.catalog_rows||0),mirrorRows:Number(r?.mirror_rows||0),
    migrationRows:Number(r?.migration_rows||0),controlMatches:Number(r?.control_matches||0)};
}
async function tinyNewExact(db,g){
  if(g.catalogRows!==2||g.mirrorRows!==4||g.migrationRows!==0||g.controlMatches!==1)
    return false;
  const header='["synthetic_header"]', f='[""]';
  let cats=0,rows=0;
  for(const t of tiny){
    const c=await db.prepare(`SELECT COUNT(*) n FROM sheet_catalog WHERE
      sheet_name=? AND sheet_id=? AND headers_json=? AND source_last_row=2
      AND source_last_col=1 AND row_count=2 AND status='ready' AND note=?`)
      .bind(t.name,t.sheetId,header,NOTE).first();
    cats+=Number(c?.n||0);
    for(const [n,v] of [[1,header],[2,t.next]]){
      const q=await db.prepare(`SELECT COUNT(*) n FROM sheet_rows WHERE
        sheet_name=? AND row_number=? AND values_json=? AND display_json=?
        AND formulas_json=?`).bind(t.name,n,v,v,f).first();
      rows+=Number(q?.n||0);
    }
  }
  return cats===2&&rows===4;
}
async function tabState(db,s){
  const p=payloads(s);
  const cat=await db.prepare(`SELECT
    SUM(CASE WHEN sheet_id=? AND headers_json=? AND source_last_row=? AND
      source_last_col=? AND row_count=? AND status='ready' AND note=? THEN 1 ELSE 0 END) base_cat,
    SUM(CASE WHEN sheet_id=? AND headers_json=? AND source_last_row=? AND
      source_last_col=? AND row_count=? AND status='ready' AND note=? THEN 1 ELSE 0 END) target_cat
    FROM sheet_catalog WHERE sheet_name=?`)
    .bind(s.sheetId,p.headers,s.base,s.width,s.base,NOTE,
      s.sheetId,p.headers,s.base+60,s.width,s.base+60,NOTE,s.name).first();
  const r=await db.prepare(`SELECT COUNT(*) rows,
    SUM(CASE WHEN row_number=1 AND values_json=? AND display_json=? AND formulas_json=? THEN 1 ELSE 0 END) header_ok,
    SUM(CASE WHEN row_number BETWEEN 2 AND 12 AND values_json=? AND display_json=? AND formulas_json=? THEN 1 ELSE 0 END) old_changed,
    SUM(CASE WHEN row_number BETWEEN 2 AND 12 AND values_json=? AND display_json=? AND formulas_json=? THEN 1 ELSE 0 END) new_changed,
    SUM(CASE WHEN row_number BETWEEN 13 AND ? AND values_json=? AND display_json=? AND formulas_json=? THEN 1 ELSE 0 END) same_rows,
    SUM(CASE WHEN row_number BETWEEN ? AND ? AND values_json=? AND display_json=? AND formulas_json=? THEN 1 ELSE 0 END) tail_rows
    FROM sheet_rows WHERE sheet_name=?`)
    .bind(p.h,p.h,p.f,p.o,p.o,p.f,p.n,p.n,p.f,
      s.base,p.same,p.same,p.f,s.base+1,s.base+60,p.tail,p.tail,p.f,s.name).first();
  return {
    baseCatalog:Number(cat?.base_cat||0),targetCatalog:Number(cat?.target_cat||0),
    rows:Number(r?.rows||0),headerOk:Number(r?.header_ok||0),
    oldChanged:Number(r?.old_changed||0),newChanged:Number(r?.new_changed||0),
    sameRows:Number(r?.same_rows||0),tailRows:Number(r?.tail_rows||0)
  };
}
async function readState(db){
  const g=await globals(db);
  if(await tinyNewExact(db,g))return {...g,state:'TINY_NEW',tabs:[]};
  const tabs=[];
  for(const s of specs)tabs.push(await tabState(db,s));
  const base=tabs.every((x,i)=>x.baseCatalog===1&&x.targetCatalog===0&&
    x.rows===specs[i].base&&x.headerOk===1&&x.oldChanged===11&&
    x.newChanged===0&&x.sameRows===specs[i].base-12&&x.tailRows===0);
  const target=tabs.every((x,i)=>x.baseCatalog===0&&x.targetCatalog===1&&
    x.rows===specs[i].base+60&&x.headerOk===1&&x.oldChanged===0&&
    x.newChanged===11&&x.sameRows===specs[i].base-12&&x.tailRows===60);
  const globalBase=g.catalogRows===2&&g.migrationRows===0&&g.controlMatches===1;
  return {...g,tabs,state:globalBase&&base&&g.mirrorRows===1360?'LARGE_BASELINE':
    globalBase&&target&&g.mirrorRows===1480?'LARGE_TARGET':'MISMATCH'};
}
function seedStatements(db){
  const out=[
    db.prepare('DELETE FROM sheet_migration_runs'),
    db.prepare('DELETE FROM sheet_rows'),
    db.prepare('DELETE FROM sheet_catalog')
  ];
  for(const s of specs){
    const p=payloads(s);
    out.push(db.prepare(`INSERT INTO sheet_catalog
      (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
      VALUES (?,?,?,?,?,?,'ready',?)`)
      .bind(s.name,s.sheetId,p.headers,s.base,s.width,s.base,NOTE));
  }
  for(const s of specs){
    const p=payloads(s);
    out.push(db.prepare(`WITH RECURSIVE seq(n) AS (
      SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<?
    ) INSERT INTO sheet_rows
      (sheet_name,row_number,values_json,display_json,formulas_json)
      SELECT ?,n,
        CASE WHEN n=1 THEN ? WHEN n BETWEEN 2 AND 12 THEN ? ELSE ? END,
        CASE WHEN n=1 THEN ? WHEN n BETWEEN 2 AND 12 THEN ? ELSE ? END,
        ? FROM seq`)
      .bind(s.base,s.name,p.h,p.o,p.same,p.h,p.o,p.same,p.f));
  }
  return out;
}
async function seed(db){
  const before=await readState(db);
  if(before.state!=='TINY_NEW')
    return {ok:false,code:'seed-requires-tiny-new',before};
  try{await db.batch(seedStatements(db));}
  catch(error){
    const after=await readState(db);
    return {ok:after.state==='LARGE_BASELINE',
      code:after.state==='LARGE_BASELINE'?'seed-committed-response-error':'seed-failed-no-retry',
      after};
  }
  const after=await readState(db);
  return {ok:after.state==='LARGE_BASELINE',
    code:after.state==='LARGE_BASELINE'?'seed-pass':'seed-postflight-mismatch',after};
}
async function positive(db){
  const before=await readState(db);
  if(before.state!=='LARGE_BASELINE')
    return {ok:false,code:'positive-requires-large-baseline',before};
  const built=buildIsolated142ChunkedPreimageBatch(db,snapshot());
  const publicPlan={
    candidateUpserts:built.publicSummary.totalCandidateUpserts,
    statements:built.hypotheticalBatchStatements,
    guardChunkCounts:built.guardChunkCounts,
    guardPayloadBytes:built.guardPayloadBytes,
    guardBindCounts:built.guardBindCounts
  };
  try{await db.batch(built.statements);}
  catch(error){
    const after=await readState(db);
    return {ok:after.state==='LARGE_TARGET',
      code:after.state==='LARGE_TARGET'?'positive-committed-response-error':
        'positive-batch-error-no-retry',publicPlan,after};
  }
  const after=await readState(db);
  return {ok:after.state==='LARGE_TARGET',
    code:after.state==='LARGE_TARGET'?'positive-pass':'positive-postflight-mismatch',
    publicPlan,after};
}
export async function handle142Qualification(request,env={}){
  if(new URL(request.url).pathname!==ROUTE)
    return json({success:false,code:'not-found'},404);
  const db=env.T12_SYNTHETIC_DB;
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
    return json({success:false,code:'test-d1-binding-missing'},503);
  if(request.method==='GET'){
    try{return json({success:true,productionAuthorized:false,state:await readState(db)});}
    catch{return json({success:false,code:'state-read-failed'},503);}
  }
  if(request.method!=='POST')return json({success:false,code:'post-only'},405);
  let body;try{body=await request.json();}catch{return json({success:false,code:'invalid-json'},400);}
  if(!body||Object.keys(body).sort().join(',')!=='action,confirmation')
    return json({success:false,code:'exact-action-confirmation-required'},400);
  if(body.action==='seed'&&body.confirmation==='SEED_142_SYNTHETIC_FROM_TINY_NEW'){
    const out=await seed(db);return json({success:out.ok,productionAuthorized:false,...out},
      out.ok?200:409);
  }
  if(body.action==='positive'&&body.confirmation==='RUN_142_POSITIVE_ON_EXISTING_TEST_ONLY'){
    const out=await positive(db);return json({success:out.ok,productionAuthorized:false,...out},
      out.ok?200:503);
  }
  return json({success:false,code:'unsupported-action-or-confirmation'},400);
}
export default {fetch:handle142Qualification};
