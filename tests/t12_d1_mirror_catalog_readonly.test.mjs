import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-mirror-catalog-readonly-20260919.gs',import.meta.url),'utf8');
for (const pattern of [
/function trendosD1MirrorCatalogReadOnly20260919\(/,
/d1FullGet_\('\/v1\/mirror\/sheets'\)/,
/getLastRow\(\)/,
/getLastColumn\(\)/,
/rowContentParityVerified: false/,
/triggerRestartAuthorizedByThisAudit: false/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(source,pattern);
for(const bad of [
/\.setPropert(?:y|ies)\s*\(/,/\.deletePropert(?:y|ies)\s*\(/,
/\bUrlFetchApp\b/,/\bDriveApp\b/,/\bScriptApp\b/,
/\bd1FullPost_\s*\(/,/\.setValues\s*\(/,
/\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/
])assert.equal(bad.test(source),false,'Mirror catalog helper must stay read-only: '+bad);
assert.equal((source.match(/Logger\.log\s*\(/g)||[]).length,1);
const sh=(r,c)=>({getLastRow:()=>r,getLastColumn:()=>c});
const rows={'الأوردرات':sh(634,14),'بنود الأوردرات':sh(690,25)};
const logs=[];const ctx={
 d1FullSpreadsheet_(){return {getName(){return 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY'},getSheetByName(n){return rows[n]}};},
 d1FullGet_(p){assert.equal(p,'/v1/mirror/sheets');return {success:true,sheets:[
 {sheetName:'الأوردرات',rowCount:633,sourceLastRow:633,sourceLastCol:14,status:'ready',syncedAt:'2026-09-19T16:38:26Z'},
 {sheetName:'بنود الأوردرات',rowCount:689,sourceLastRow:689,sourceLastCol:25,status:'ready',syncedAt:'2026-09-19T16:38:26Z'}]};},
 Logger:{log(v){logs.push(JSON.parse(v));}}
};vm.runInNewContext(source,ctx);
const result=ctx.trendosD1MirrorCatalogReadOnly20260919();
assert.equal(result.mutationPerformed,false);
assert.equal(result.remoteMethod,'GET');
assert.equal(result.allCatalogDimensionsMatch,false);
assert.equal(result.rowContentParityVerified,false);
assert.equal(result.mirror.length,2);
assert.equal(result.mirror[0].rowCountMatchesSource,false);
assert.equal(result.mirror[1].sourceLastRowMatches,false);
assert.equal(logs.length,1);
console.log('TrendOS R4 D1 read-only catalog check PASS: mocked lag detection, no remote writes or unsafe logging.');
