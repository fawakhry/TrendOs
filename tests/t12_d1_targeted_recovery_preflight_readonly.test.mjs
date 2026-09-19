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
 {sheetName:'الأوردرات',rowCount:1,sourceLastRow:1,sourceLastCol:1,status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'t'},
 {sheetName:'بنود الأوردرات',rowCount:2,sourceLastRow:2,sourceLastCol:1,status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'t'}
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
    {sheetName:'الأوردرات',rows:srcRows[0],headers:['h'],sourceLastRow:2,sourceLastCol:1,hash:'a'},
    {sheetName:'بنود الأوردرات',rows:srcRows[1],headers:['h'],sourceLastRow:2,sourceLastCol:1,hash:'b'}
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
console.log('TrendOS R4 targeted recovery preflight PASS: direct diff + property projection, read-only.');
