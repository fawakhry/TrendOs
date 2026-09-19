import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-baseline-shape-diagnostic-readonly-20260919.gs',import.meta.url),'utf8');
for(const rx of [
/function trendosD1BaselineShapeDiagnosticReadOnly20260919\(/,
/d1OrdersLiveSyncV2LoadBaseline_\(props\)/,
/d1FullGet_\('\/v1\/mirror\/sheets'\)/,
/baselineRowHashEntryCountMatchesRows:/,
/remoteSheetIdNumericNonnegative:/,
/failedCheckNames:/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(s,rx);
for(const rx of [
/\.setPropert(?:y|ies)\s*\(/,
/\.deletePropert(?:y|ies)\s*\(/,
/\bUrlFetchApp\b/,/\bDriveApp\b/,/\bScriptApp\b/,
/\bd1FullPost_\s*\(/,/\.newTrigger\s*\(/,
/\.deleteTrigger\s*\(/,
/Logger\.log\s*\(\s*(?:response|baseline|cat|old|props)\s*\)/
])assert.equal(rx.test(s),false,'diagnostic must not write or log sensitive data '+rx);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
const cats=[
 {sheetName:'الأوردرات',sheetId:'not-numeric',rowCount:633},
 {sheetName:'بنود الأوردرات',sheetId:'75',rowCount:689}
];
const base={version:2,sheets:[
 {sheetName:'الأوردرات',rowCount:633,sourceLastRow:633,sourceLastCol:67,rowHashes:[[1,'x']]},
 {sheetName:'بنود الأوردرات',rowCount:689,sourceLastRow:689,sourceLastCol:82,rowHashes:Array.from({length:689},(_,i)=>[i+1,'x'])}
]};
const logged=[];
const ctx={
PropertiesService:{getScriptProperties(){return {}}},
d1OrdersLiveSyncV2LoadBaseline_(){return base;},
d1FullGet_(path){assert.equal(path,'/v1/mirror/sheets');return {success:true,sheets:cats};},
Logger:{log(x){logged.push(JSON.parse(x));}}
};
vm.runInNewContext(s,ctx);
const result=ctx.trendosD1BaselineShapeDiagnosticReadOnly20260919();
assert.equal(result.mutationPerformed,false);
assert.equal(result.mirrorParityVerified,false);
assert.equal(result.retryOriginalHelperAuthorized,false);
assert.equal(result.tabs[0].checks.remoteSheetIdNumericNonnegative,false);
assert.equal(result.tabs[0].checks.baselineRowHashEntryCountMatchesRows,false);
assert.equal(result.tabs[1].failedCheckNames.length,0);
assert.equal(logged.length,1);
assert.equal(JSON.stringify(logged[0]).includes('not-numeric'),false);
console.log('TrendOS R4 G1 sanitized shape diagnostic PASS: explicit failing predicates, no identifier leakage or writes.');
