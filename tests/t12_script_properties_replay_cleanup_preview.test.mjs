import assert from 'node:assert/strict';
import fs from 'node:fs';

const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-script-properties-replay-cleanup-preview.gs',import.meta.url),'utf8');
assert.match(s,/function trendosReplayCleanupPreviewReadOnly20260919\(/);
assert.match(s,/sevenDaysMs = 7 \* 24/);
assert.match(s,/newerThan48HoursMs = 48 \*/);
assert.match(s,/parsed\.success !== true/);
assert.match(s,/parsed\.orderId/);
assert.match(s,/Date\.parse\(String\(parsed\.savedAt/);
assert.match(s,/eligible\.sort/);
assert.match(s,/eligible\.slice\(0, 150\)/);
assert.match(s,/mutationPerformed: false/);
for(const forbidden of [
  /\.setProperty\s*\(/,/\.setProperties\s*\(/,
  /\.deleteProperty\s*\(/,/\.deleteAllProperties\s*\(/,
  /\bDriveApp\b/,/\bSpreadsheetApp\b/,/\bUrlFetchApp\b/,/\bScriptApp\b/,
  /Logger\.log\s*\(\s*(?:raw|name|key|parsed|props)\s*\)/,
  /Logger\.log\s*\(\s*JSON\.stringify\(\s*(?:eligible|previewBatch|parsed)/
])assert.equal(forbidden.test(s),false,'Read-only preview must not mutate or leak individual keys/values: '+forbidden);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
assert.match(s,/Logger\.log\(JSON\.stringify\(result\)\)/);
console.log('TrendOS R2 replay cleanup preview static safety PASS: no mutations; 7-day eligibility; aggregate-only output.');
