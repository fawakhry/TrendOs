import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-sync-metadata-readonly-20260919.gs',import.meta.url),'utf8');
for(const re of [
/function trendosD1SyncMetadataReadOnly20260919\(/,
/baselineVersion2/,
/missingBaselineChunks/,
/lowUsageTriggerCount/,
/enrichmentTriggerCount/,
/Logger\.log\(JSON\.stringify\(result\)\)/
])assert.match(s,re);
for(const forbidden of [
/\.setProperty\s*\(/,/\.setProperties\s*\(/,/\.deleteProperty\s*\(/,
/\bUrlFetchApp\b/,/\bSpreadsheetApp\b/,/\bDriveApp\b/,
/\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/,
/Logger\.log\s*\(\s*(?:rawBaseline|chunk|parsed|props)\s*\)/
])assert.equal(forbidden.test(s),false,'D1 checkpoint must read local metadata only: '+forbidden);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
console.log('TrendOS R4 local-only baseline/trigger metadata read-only static safety PASS.');
