import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { handleR5ProductionRecoveryRequest, R5_PRODUCTION_RECOVERY_PATH } from
  '../cloudflare-d1/t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs';

const script=fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/r5-orders-periodic-bound-appsscript-candidate.gs',
  import.meta.url),'utf8');
const productionEntry=fs.readFileSync(new URL(
  '../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
const productionCfg=fs.readFileSync(new URL(
  '../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');
assert.equal(productionEntry.includes('r5-orders-periodic-guarded-handler-candidate'),true);
assert.equal(productionEntry.includes('if (isR5ProductionRecoveryPath(path))'),true);
assert.match(productionCfg,/TRENDOS_R5_PERIODIC_ENABLED = "false"/);
assert.match(productionCfg,/TRENDOS_R4_RECOVERY_ENABLED = "false"/);
assert.equal(productionCfg.includes('TRENDOS_R5_PERIODIC_TARGET = "trendos-main/5c4b92bf-e043-4f6e-bd6d-d514a92cd825"'),true);
assert.equal(productionCfg.includes('TRENDOS_R5_PERIODIC_ENABLED = "true"'),false);
new vm.Script(script); // Syntax check of the actual isolated GAS candidate.
for (const forbidden of [/getScriptProperties\s*\(/,/setProperty\s*\(/,
  /deleteProperty\s*\(/,/\/v1\/mirror\/delta/,
  /startD1OrdersLowUsageSyncV1\s*\(/,/d1OrdersLiveSyncTickV2\s*\(/,
  /d1OrdersLiveSyncV2ClearBaseline_\s*\(/,/\/v1\/admin\/r4\//]) {
  assert.equal(forbidden.test(script),false,'forbidden legacy/properties action');
}
assert.match(script,/postflightRowParityVerified:true/);
assert.match(script,/everyMinutes\(10\)/);
assert.match(script,/R5_PERIODIC_POST_OUTCOME_UNCERTAIN_NO_RETRY/);

const secret='r5-synthetic-authentication-secret-32';
const request=(method='POST',body={})=>new Request('https://example.invalid'+R5_PRODUCTION_RECOVERY_PATH,{
  method,headers:{'x-migration-secret':secret,'content-type':'application/json'},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})
});
const environment=(extra={})=>({
  TRENDOS_R5_PERIODIC_ENABLED:'true',
  TRENDOS_R5_PERIODIC_TARGET:'trendos-main/5c4b92bf-e043-4f6e-bd6d-d514a92cd825',
  MIGRATION_SECRET:secret,DB:{prepare(){throw Error('should not prepare')},async batch(){throw Error('should not batch')}},
  ...extra
});
async function code(expected,req,env) {
  const response=await handleR5ProductionRecoveryRequest(req,env);
  assert.equal(response.status,expected);
  const data=await response.json();
  assert.equal(data.automaticRetryAllowed,false);
  assert.equal(data.triggerRestartAuthorized,false);
  return data;
}
assert.equal((await code(423,request(),environment({TRENDOS_R5_PERIODIC_ENABLED:'false'}))).reason,
  'periodic-disabled-or-wrong-target');
assert.equal((await code(423,request(),environment({TRENDOS_R5_PERIODIC_TARGET:'wrong'}))).reason,
  'periodic-disabled-or-wrong-target');
assert.equal((await code(405,request('GET'),environment())).reason,'method-not-allowed');
assert.equal((await code(400,request('POST',{}),environment())).reason,'invalid-recovery-contract');
assert.equal((await code(409,request('POST',{operation:'r5-orders-periodic-apply',proposal:{}}),environment())).reason,
  'preflight-rejected');

const names=['الأوردرات','بنود الأوردرات'];
const row=(n,v)=>({rowNumber:n,values:[v],display:[v],formulas:['']});
function fakePlatform({needUpdate=false, ambiguous=false, drift=false, ownTrigger=false,
  sourceRaceAfterPost=false}={}) {
  const source=names.map((sheetName,i)=>({sheetName,sheetId:i+11,sourceLastRow:3,
    sourceLastCol:1,headers:['h'],rows:[row(1,'h'),row(2,'synthetic-new'),row(3,'synthetic-tail')]}));
  const remote=names.map((name,i)=>({sheetName:name,sheetId:i+11,
    sourceLastRow:needUpdate?2:3,sourceLastCol:1,rowCount:needUpdate?2:3,
    status:drift?'drift':'ready',note:'TrendOS orders live sync V2 quota-aware',
    syncedAt:'2026-09-20 12:00:00',
    rows:needUpdate?[row(1,'h'),row(2,'synthetic-old')]:source[i].rows.map(r=>({...r}))}));
  const catalog=s=>({sheetName:s.sheetName,sheetId:s.sheetId,
    sourceLastRow:s.sourceLastRow,sourceLastCol:s.sourceLastCol,
    rowCount:s.rowCount,status:s.status,note:s.note,syncedAt:s.syncedAt});
  const triggers=ownTrigger?[{getHandlerFunction(){return 'trendosR5PeriodicOrdersTick20260920'}}]:[];
  const logs=[];let posts=0,propsWrites=0;
  const ctx={
    LockService:{getScriptLock(){return {tryLock(){return true},releaseLock(){}}}},
    ScriptApp:{getProjectTriggers(){return [...triggers]},deleteTrigger(t){
      const i=triggers.indexOf(t);if(i>=0)triggers.splice(i,1);
    },newTrigger(){throw Error('unexpected trigger creation in tick')}},
    d1FullSpreadsheet_(){return {getId(){return '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI'}}},
    d1OrdersLiveSyncV2CaptureAll_(){const snap=source.map(s=>({
      ...s,rows:s.rows.map(r=>({...r})),headers:[...s.headers]}));
      return {snapshots:snap,fingerprint:JSON.stringify(snap)};
    },
    d1FullGet_(path){
      if(path==='/v1/mirror/sheets')return {success:true,sheets:remote.map(catalog)};
      const u=new URL('https://fixture.invalid'+path);
      const name=u.searchParams.get('name'),offset=Number(u.searchParams.get('offset')),
        limit=Number(u.searchParams.get('limit')),found=remote.find(s=>s.sheetName===name);
      assert.ok(found,'unknown mirror sheet');
      return {success:true,sheet:{...catalog(found),headers:['h'],offset,limit,
        rows:found.rows.slice(offset,offset+limit).map(r=>({...r}))}};
    },
    d1FullPost_(path,payload){
      assert.equal(path,'/v1/admin/r5/orders-periodic/apply');
      assert.equal(payload.operation,'r5-orders-periodic-apply');
      posts++;
      const total=payload.proposal.publicSummary.totalCandidateUpserts;
      for(const s of payload.proposal.sheets){
        const m=remote.find(x=>x.sheetName===s.sheetName);
        for(const u of s.upserts){
          assert.equal(JSON.stringify(m.rows[u.rowNumber-1]||null),JSON.stringify(u.expectedBefore));
          m.rows[u.rowNumber-1]={...u.replacement};
        }
        m.rowCount=s.sourceLastRow;m.sourceLastRow=s.sourceLastRow;
        m.syncedAt='2026-09-20 12:00:01';
      }
      if(sourceRaceAfterPost&&posts===1)source[0].rows[1]=row(2,'synthetic-newer');
      if(ambiguous)throw Error('synthetic response lost after commit');
      return {success:true,reason:'periodic-d1-commit-observed',
        summary:{totalCandidateUpserts:total}};
    },
    Utilities:{newBlob(s){return {getBytes(){return Buffer.from(s,'utf8')}}}},
    Logger:{log(x){logs.push(x)}},URL,JSON,encodeURIComponent
  };
  vm.createContext(ctx);vm.runInContext(script,ctx);
  return {ctx,remote,source,triggers,logs,getPosts(){return posts},
    getPropsWrites(){return propsWrites}};
}
{
  const p=fakePlatform({ownTrigger:true});
  const receipt=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.equal(receipt.postflightRowParityVerified,true);
  assert.equal(receipt.alreadyInParity,true);
  assert.equal(p.getPosts(),0);
  assert.equal(p.triggers.length,1);
}
{
  const p=fakePlatform({needUpdate:true,ownTrigger:true});
  const receipt=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.equal(receipt.postflightRowParityVerified,true);
  assert.equal(receipt.totalCandidateUpserts,4);
  assert.equal(p.getPosts(),1);
  assert.equal(p.triggers.length,1);
  assert.equal(p.remote[0].rows.length,3);
  assert.equal(p.remote[1].rows.length,3);
}
{
  const p=fakePlatform({needUpdate:true,ambiguous:true,ownTrigger:true});
  const receipt=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.equal(receipt.outcomeUnknown,true);
  assert.equal(receipt.scheduledSyncDisarmed,true);
  assert.equal(p.triggers.length,0);
  assert.equal(p.getPosts(),1);
  assert.equal(p.remote[0].rows.length,3); // commit could have succeeded
}
{
  const p=fakePlatform({drift:true,ownTrigger:true});
  const receipt=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.notEqual(receipt.postflightRowParityVerified,true);
  assert.equal(receipt.scheduledSyncDisarmed,true);
  assert.equal(p.getPosts(),0);
  assert.equal(p.triggers.length,0);
}
{
  const p=fakePlatform({needUpdate:true,sourceRaceAfterPost:true,ownTrigger:true});
  const first=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.equal(first.postConfirmed,true);
  assert.equal(first.errorCode,'R5_PERIODIC_ABORT_POSTFLIGHT_SOURCE_CHANGED');
  assert.equal(p.triggers.length,1); // confirmed write, no ambiguous retry
  const next=p.ctx.trendosR5PeriodicOrdersTick20260920();
  assert.equal(next.postflightRowParityVerified,true);
  assert.equal(p.getPosts(),2); // second fresh snapshot, not blind repeat
  assert.equal(p.triggers.length,1);
}
// An already stale mirror must NOT be restarted as the 10-minute small-delta
// worker: >5 additional source rows per tab is an explicit no-write guard.
// Synthetic rows only; this is NOT a live database observation or recovery.
for (const [extra,expectPass] of [[4,true],[5,false]]) {
  const p=fakePlatform({needUpdate:true,ownTrigger:true});
  // Initial synthetic source has 3 rows and synthetic remote has 2;
  // append 4 => gap 5 (permitted), append 5 => gap 6 (must fail closed).
  for(let i=4;i<4+extra;i++)p.source[0].rows.push(row(i,'synthetic-append-'+i));
  p.source[0].sourceLastRow=p.source[0].rows.length;
  const result=p.ctx.trendosR5PeriodicOrdersTick20260920();
  if(expectPass){
    assert.equal(result.postflightRowParityVerified,true,'5-row fixture stays within isolated cap');
    assert.equal(p.getPosts(),1);
    assert.equal(p.triggers.length,1);
  }else{
    assert.equal(result.errorCode,'R5_PERIODIC_ABORT_SOURCE_REMOTE_SHAPE');
    assert.notEqual(result.postflightRowParityVerified,true,'inner error receipt must never qualify parity');
    const publicReceipt=JSON.parse(p.logs.at(-1));
    assert.equal(publicReceipt.postflightRowParityVerified,false,'public audit normalizes absent field to false');
    assert.equal(publicReceipt.errorCode,'R5_PERIODIC_ABORT_SOURCE_REMOTE_SHAPE');
    assert.equal(result.mutationPerformed,false);
    assert.equal(result.outcomeUnknown,false);
    assert.equal(result.scheduledSyncDisarmed,true);
    assert.equal(p.getPosts(),0,'gap beyond 5 must NEVER call production-like write handler');
    assert.equal(p.triggers.length,0,'unsafe large-gap scheduled run disarms itself');
    assert.equal(p.remote[0].rows.length,2,'synthetic D1 remote remains untouched');
  }
}
console.log('R5 isolated candidate PASS: default-off/auth/target/syntax/routing, idle, bounded CAS, ambiguous outcome disarm, source-race fresh next tick, schema drift disarm, 5-vs-6 row growth gate; synthetic only.');
