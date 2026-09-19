import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-source-baseline-drift-readonly-20260919.gs',import.meta.url),'utf8');
for(const pattern of [
/function trendosD1SourceBaselineDriftReadOnly20260919\(/,
/d1OrdersLiveSyncV2LoadBaseline_\(props\)/,
/d1OrdersLiveSyncV2CaptureAll_\(\)/,
/d1OrdersLiveSyncV2ComputeDelta_\(capture, baseline\)/,
/sourceChangedSinceBaseline:/,
/totalChangedOrNewRows:/,
/totalDeletedTailRows:/,
/fullRebaseDueBy24HourPolicy:/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(source,pattern);
for(const forbidden of [
/\.setPropert(?:y|ies)\s*\(/,
/\.deletePropert(?:y|ies)\s*\(/,
/\bUrlFetchApp\b/,/\bDriveApp\b/,
/\bScriptApp\b/,/\bMailApp\b/,
/\bd1FullPost_\s*\(/,
/\bd1FullGet_\s*\(/,
/\bd1OrdersLiveSyncTickV2\s*\(/,
/\bd1OrdersLiveSyncV2SaveBaseline_\s*\(/,
/\.newTrigger\s*\(/,
/Logger\.log\s*\(\s*(?:capture|baseline|delta|snapshot|row)\s*\)/
])assert.equal(forbidden.test(source),false,'Read-only check must avoid remote calls, writes and raw data logs: '+forbidden);
assert.equal((source.match(/Logger\.log\s*\(/g)||[]).length,1);
const properties={getProperty(key){return key==='D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT'?'2026-09-19T14:13:49.388Z':''}};
const baseline={version:2,savedAt:'2026-09-19T16:38:26Z',fingerprint:'old',sheets:[
{sheetName:'orders',hash:'x',rowCount:1,rowHashes:[[1,'ha']]},
{sheetName:'lines',hash:'y',rowCount:1,rowHashes:[[1,'hb']]}
]};
const capture={fingerprint:'new',snapshots:[
{sheetName:'orders',hash:'x2',rows:[{rowNumber:1}],sourceLastRow:1},
{sheetName:'lines',hash:'y',rows:[{rowNumber:1}],sourceLastRow:1}
]};
const logged=[];
const context={
PropertiesService:{getScriptProperties(){return properties;}},
d1OrdersLiveSyncV2LoadBaseline_(){return baseline;},
d1OrdersLiveSyncV2CaptureAll_(){return capture;},
d1OrdersLiveSyncV2ComputeDelta_(){return {changedRows:1,deletedRows:0};},
d1OrdersLiveSyncV2DigestHex_(s){return s.includes('rowNumber')?'hb':'';},
Logger:{log(msg){logged.push(JSON.parse(msg));}}
};
vm.runInNewContext(source,context);
const result=context.trendosD1SourceBaselineDriftReadOnly20260919();
assert.equal(result.mutationPerformed,false);
assert.equal(result.sourceChangedSinceBaseline,true);
assert.equal(result.rowLevelDeltaComputable,true);
assert.equal(result.totalChangedOrNewRows,1);
assert.equal(result.pendingByTab.length,2);
assert.equal(logged.length,1);
assert.equal(logged[0].audit,'TRENDOS_D1_SOURCE_BASELINE_DRIFT_READ_ONLY_20260919');
console.log('TrendOS R4 source-to-local-baseline drift helper PASS: mock row drift and read-only safety.');
