import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-rows-parity-readonly-20260919.gs',import.meta.url),'utf8');
for (const pattern of [
/function trendosD1RowsParityReadOnly20260919\(/,
/d1FullGet_\('\/v1\/mirror\/sheets'\)/,
/d1FullGet_\('\/v1\/mirror\/sheet\?name='/,
/d1OrdersLiveSyncV2CaptureAll_\(\)/,
/JSON\.stringify\(row\) !== JSON\.stringify\(remoteRows\[number\]\)/,
/remoteCatalogStableDuringComparison:/,
/sourceStableDuringComparison:/,
/triggerRestartAuthorizedByThisAudit: false/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(source,pattern);
for(const forbidden of [
/\.setPropert(?:y|ies)\s*\(/,/\.deletePropert(?:y|ies)\s*\(/,
/\bUrlFetchApp\b/,/\bDriveApp\b/,/\bScriptApp\b/,
/\bd1FullPost_\s*\(/,/\bd1OrdersLiveSyncTickV2\s*\(/,
/\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/,
/Logger\.log\s*\(\s*(?:row|sheet|sourceBefore|remoteRows|page|sourceAfter)\s*\)/,
])assert.equal(forbidden.test(source),false,'R4 must be no-write and not log source/remote sensitive rows: '+forbidden);
assert.equal((source.match(/Logger\.log\s*\(/g)||[]).length,1);
const rows1=[{rowNumber:1,values:['ID'],display:['ID'],formulas:['']},{rowNumber:2,values:['alpha'],display:['alpha'],formulas:['']}];
const rows2=[{rowNumber:1,values:['ID'],display:['ID'],formulas:['']},{rowNumber:2,values:['beta'],display:['beta'],formulas:['']}];
const catalog=[
{sheetName:'الأوردرات',sheetId:7,rowCount:1,sourceLastRow:1,sourceLastCol:1,status:'ready',syncedAt:'t'},
{sheetName:'بنود الأوردرات',sheetId:8,rowCount:2,sourceLastRow:2,sourceLastCol:1,status:'ready',syncedAt:'t'}
];
const calls=[];
const ctx={
 d1FullSpreadsheet_(){return {getName(){return 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY';}};},
 d1OrdersLiveSyncV2CaptureAll_(){return {fingerprint:'unchanged',snapshots:[
 {sheetName:'الأوردرات',rows:rows1,headers:['ID'],sourceLastRow:2,sourceLastCol:1},
 {sheetName:'بنود الأوردرات',rows:rows2,headers:['ID'],sourceLastRow:2,sourceLastCol:1}
 ]};},
 d1FullGet_(path){
   calls.push(path);
   if(path==='/v1/mirror/sheets')return {success:true,sheets:catalog};
   const sheetName=decodeURIComponent(path.match(/name=([^&]+)/)[1]);
   const remoteRows=sheetName==='الأوردرات'?[rows1[0]]:[rows2[0],{rowNumber:2,values:['old'],display:['old'],formulas:['']}];
   const item=catalog.find(s=>s.sheetName===sheetName);
   return {success:true,sheet:{...item,headers:['ID'],offset:0,limit:250,rows:remoteRows}};
 },
 Logger:{log(s){assert.deepEqual(JSON.parse(s).audit,'TRENDOS_D1_ROWS_PARITY_READ_ONLY_20260919');}}
};
vm.runInNewContext(source,ctx);
const out=ctx.trendosD1RowsParityReadOnly20260919();
assert.equal(out.mutationPerformed,false);
assert.equal(out.allRowsMatchAtSnapshot,false);
assert.equal(out.sourceStableDuringComparison,true);
assert.equal(out.remoteCatalogStableDuringComparison,true);
assert.equal(out.rowsByTab[0].missingInMirror,1);
assert.equal(out.rowsByTab[1].changedContent,1);
assert.equal(out.rowsByTab[0].changedContent,0);
assert.equal(out.rowsByTab[1].missingInMirror,0);
assert.equal(calls.length,4);
assert(calls.every(p=>p.startsWith('/v1/mirror/sheet')));
console.log('TrendOS R4 GET-only mirror row-content parity mock PASS: missing row, changed content and sanitized aggregate output.');
