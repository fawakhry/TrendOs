import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-targeted-recovery-preflight-readonly-20260919.gs',import.meta.url),'utf8');
for(const rx of [
/function trendosD1TargetedRecoveryPreflightReadOnly20260919\(/,
/d1OrdersLiveSyncV2CaptureAll_\(\)/,
/d1FullGet_\('\/v1\/mirror\/sheets'\)/,
/projectedBaselineChunkCount:/,
/structuralDeltaPreconditionsPass:/,
/productionWriteAuthorizedByThisAudit:false/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(s,rx);
for(const bad of [
/\.setPropert(?:y|ies)\s*\(/,/\.deletePropert(?:y|ies)\s*\(/,
/\bd1FullPost_\s*\(/,/\bd1OrdersLiveSyncTickV2\s*\(/,
/\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/,
/\.setValues\s*\(/
])assert.equal(bad.test(s),false,'preflight must stay read-only '+bad);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
const srcRows=[
 [{rowNumber:1,values:['h'],display:['h'],formulas:['']},{rowNumber:2,values:['new'],display:['new'],formulas:['']}],
 [{rowNumber:1,values:['h'],display:['h'],formulas:['']},{rowNumber:2,values:['x'],display:['x'],formulas:['']}]
];
const cats=[
 {sheetName:'الأوردرات',sheetId:11,headers:['h'],rowCount:1,sourceLastRow:1,sourceLastCol:1,status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'t'},
 {sheetName:'بنود الأوردرات',sheetId:22,headers:['h'],rowCount:2,sourceLastRow:2,sourceLastCol:1,status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'t'}
];
const propsData={
 A:'1',
 D1_ORDERS_LIVE_SYNC_V2_BASELINE_0:'old'
};
const props={
 getKeys(){return Object.keys(propsData)},
 getProperty(k){return Object.prototype.hasOwnProperty.call(propsData,k)?propsData[k]:null}
};
let capCount=0;
const ctx={
 LockService:{getScriptLock(){return {tryLock(){return true},releaseLock(){}}}},
 PropertiesService:{getScriptProperties(){return props}},
 d1OrdersLiveSyncV2CaptureAll_(){
   capCount++;
   return {fingerprint:'same',snapshots:[
    {sheetName:'الأوردرات',sheetId:11,rows:srcRows[0],headers:['h'],sourceLastRow:2,sourceLastCol:1,hash:'a'},
    {sheetName:'بنود الأوردرات',sheetId:22,rows:srcRows[1],headers:['h'],sourceLastRow:2,sourceLastCol:1,hash:'b'}
   ]};
 },
 d1OrdersLiveSyncV2BuildBaseline_(c){return {version:2,savedAt:'t',fingerprint:c.fingerprint,sheets:[]}},
 d1FullGet_(path){
   if(path==='/v1/mirror/sheets')return {success:true,sheets:cats};
   const name=decodeURIComponent(path.match(/name=([^&]+)/)[1]);
   const rows=name==='الأوردرات'?[srcRows[0][0]]:[srcRows[1][0],{rowNumber:2,values:['old'],display:['old'],formulas:['']}];
   const cat=cats.find(x=>x.sheetName===name);
   return {success:true,sheet:{...cat,offset:0,limit:250,rows}};
 },
 Utilities:{newBlob(v){return {getBytes(){return Array.from(Buffer.from(String(v),'utf8'))}}}},
 Logger:{log(v){JSON.parse(v)}}
};
vm.runInNewContext(s,ctx);
const out=ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919();
assert.equal(out.mutationPerformed,false);
assert.equal(out.sourceStableDuringRead,true);
assert.equal(out.d1CatalogStableDuringRead,true);
assert.equal(out.tabs[0].missingSourceRowsInD1,1);
assert.equal(out.tabs[0].changedExistingRows,0);
assert.equal(out.tabs[1].changedExistingRows,1);
assert.equal(out.totalCandidateRowsForUpsert,2);
assert.equal(out.structuralDeltaPreconditionsPass,true);
assert.equal(out.productionWriteAuthorizedByThisAudit,false);
assert.equal(out.triggerRestartAuthorizedByThisAudit,false);
assert.equal(capCount,2);
assert.equal(out.tabs.every(t=>t.sourceSheetIdentityMatchesD1 && t.sourceRowsContiguous &&
  t.remoteHeadersMatchSource && t.remoteRowsInRange && t.catalogRowCountMatchesSourceLastRow),true);

// New fail-closed regression cases; all mocks contain synthetic one-column rows.
cats[0].sheetId=999;
let drift=ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919();
assert.equal(drift.tabs[0].sourceSheetIdentityMatchesD1,false);
assert.equal(drift.structuralDeltaPreconditionsPass,false);
cats[0].sheetId=11;

cats[1].headers=['different'];
drift=ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919();
assert.equal(drift.tabs[1].remoteHeadersMatchSource,false);
assert.equal(drift.structuralDeltaPreconditionsPass,false);
cats[1].headers=['h'];

cats[0].sourceLastRow=2; // catalog count must equal its recorded last row
drift=ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919();
assert.equal(drift.tabs[0].catalogRowCountMatchesSourceLastRow,false);
assert.equal(drift.structuralDeltaPreconditionsPass,false);
cats[0].sourceLastRow=1;

srcRows[0][1].rowNumber=3; // noncontiguous authoritative source
drift=ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919();
assert.equal(drift.tabs[0].sourceRowsContiguous,false);
assert.equal(drift.structuralDeltaPreconditionsPass,false);
srcRows[0][1].rowNumber=2;

assert.equal(drift.productionWriteAuthorizedByThisAudit,false);
assert.equal(drift.triggerRestartAuthorizedByThisAudit,false);

// Preflight lock denial and D1 GET fault are isolated tests: no actual
// Apps Script lock, Cloudflare GET, customer records or production calls.
const originalLockService=ctx.LockService;
const originalGet=ctx.d1FullGet_;
const capturesBeforeDeniedLock=capCount;
let deniedReleaseCalls=0, deniedGetCalls=0;
ctx.LockService={getScriptLock(){return {
  tryLock(waitMs){assert.equal(waitMs,30000);return false;},
  releaseLock(){deniedReleaseCalls++;}
}}};
ctx.d1FullGet_=()=>{deniedGetCalls++;throw new Error('unexpected D1 access after denied lock');};
assert.throws(
  ()=>ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919(),
  /R4_RECOVERY_PREFLIGHT_ABORT_SCRIPT_LOCK/
);
assert.equal(capCount,capturesBeforeDeniedLock,'denied lock must prevent source capture');
assert.equal(deniedGetCalls,0,'denied lock must prevent all D1 GETs');
assert.equal(deniedReleaseCalls,0,'lock that was not acquired must not be released');

let acquiredLocks=0, releasedLocks=0, sheetPageReads=0;
ctx.LockService={getScriptLock(){return {
  tryLock(waitMs){assert.equal(waitMs,30000);acquiredLocks++;return true;},
  releaseLock(){releasedLocks++;}
}}};
ctx.d1FullGet_=(path)=>{
  if(path.startsWith('/v1/mirror/sheet?')){
    sheetPageReads++;
    throw new Error('SYNTHETIC_D1_GET_INTERRUPTED');
  }
  return originalGet(path);
};
assert.throws(
  ()=>ctx.trendosD1TargetedRecoveryPreflightReadOnly20260919(),
  /SYNTHETIC_D1_GET_INTERRUPTED/
);
assert.equal(sheetPageReads,1,'test must fail during D1 row pagination');
assert.equal(acquiredLocks,1);
assert.equal(releasedLocks,1,'acquired lock must release after a failed D1 GET');
ctx.LockService=originalLockService;
ctx.d1FullGet_=originalGet;

console.log('TrendOS R4 preflight PASS: synthetic identity/header/catalog/source-row drift fails closed; no writes.');
