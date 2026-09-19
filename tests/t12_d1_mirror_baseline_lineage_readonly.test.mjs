import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-mirror-baseline-lineage-readonly-20260919.gs',import.meta.url),'utf8');
for(const pattern of [
/function trendosD1MirrorBaselineLineageReadOnly20260919\(/,
/d1OrdersLiveSyncV2LoadBaseline_\(props\)/,
/d1FullGet_\('\/v1\/mirror\/sheets'\)/,
/d1FullGet_\('\/v1\/mirror\/sheet\?name='/,
/mirrorCatalogStableDuringRead:/,
/allMirrorRowsMatchLocalBaseline:/,
/deltaExecutionAuthorizedByThisAudit: false/,
/triggerRestartAuthorizedByThisAudit: false/,
/Logger\.log\(JSON\.stringify\(result\)\)/
]) assert.match(src,pattern);
for(const bad of [
/\.setPropert(?:y|ies)\s*\(/,
/\.deletePropert(?:y|ies)\s*\(/,
/\bUrlFetchApp\b/,/\bDriveApp\b/,/\bScriptApp\b/,
/\bd1FullPost_\s*\(/,
/\bd1OrdersLiveSyncTickV2\s*\(/,
/\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/
])assert.equal(bad.test(src),false,'lineage helper may not write: '+bad);
assert.equal((src.match(/Logger\.log\s*\(/g)||[]).length,1);
const name=['الأوردرات','بنود الأوردرات'];
const hex=s=>'a'.repeat(64);
const rows=[{rowNumber:1,values:['ID'],display:['ID'],formulas:['']}];
const catalogs=name.map((sheetName,i)=>({
  sheetName,sheetId:12+i,sourceLastRow:1,sourceLastCol:1,rowCount:1,
  status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'2026-09-19 16:38:25'
}));
const baseline={
  version:2,fingerprint:hex('fingerprint'),
  savedAt:'2026-09-19T16:38:26Z',
  sheets:name.map((sheetName)=>({
    sheetName,sourceLastRow:1,sourceLastCol:1,rowCount:1,
    hash:hex('sheet'),rowHashes:[[1,hex('row')]]
  }))
};
function simulate({mismatched=false,drift=false}={}){
 const calls=[],log=[];
 const ctx={
  PropertiesService:{getScriptProperties(){return {}}},
  d1OrdersLiveSyncV2LoadBaseline_(){return baseline;},
  d1OrdersLiveSyncV2DigestHex_(){return mismatched?'b'.repeat(64):hex('anything');},
  d1FullGet_(path){
    calls.push(path);
    if(path==='/v1/mirror/sheets')return {success:true,sheets:drift && calls.length>2?catalogs.map((x,i)=>i===0?{...x,syncedAt:'changed'}:x):catalogs};
    const tab=decodeURIComponent(path.match(/name=([^&]+)/)[1]);
    return {success:true,sheet:{...catalogs.find(x=>x.sheetName===tab),headers:['ID'],offset:0,limit:200,rows}};
  },
  Logger:{log(s){log.push(JSON.parse(s));}}
 };
 vm.runInNewContext(src,ctx);
 return {result:ctx.trendosD1MirrorBaselineLineageReadOnly20260919(),calls,log};
}
const ok=simulate();
assert.equal(ok.result.mutationPerformed,false);
assert.equal(ok.result.allMirrorRowsMatchLocalBaseline,true);
assert.equal(ok.result.tabs.length,2);
assert.equal(ok.calls.length,4);
assert(ok.calls.every(x=>x.startsWith('/v1/mirror/sheet')));
assert.equal(ok.log.length,1);
assert.equal(ok.log[0].tabs[0].fullSheetSnapshotHashMatch,true);
const wrong=simulate({mismatched:true}).result;
assert.equal(wrong.allMirrorRowsMatchLocalBaseline,false);
assert.equal(wrong.tabs[0].mismatchedRowHashes,1);
const unstable=simulate({drift:true}).result;
assert.equal(unstable.mirrorCatalogStableDuringRead,false);
assert.equal(unstable.allMirrorRowsMatchLocalBaseline,false);
console.log('TrendOS R4 mirror-vs-local-baseline lineage PASS: matching rows, hash mismatch, metadata drift; no writes.');
