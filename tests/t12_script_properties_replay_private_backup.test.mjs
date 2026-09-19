import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-script-properties-replay-private-backup.gs',import.meta.url),'utf8');
assert.match(s,/function trendosReplayPrivateBackupOnce20260919\(/);
assert.match(s,/waitLock\(30000\)/);
assert.match(s,/now - keyTime < sevenDaysMs/);
assert.match(s,/now - savedTime < sevenDaysMs/);
assert.match(s,/response\.success !== true/);
assert.match(s,/response\.orderId/);
assert.match(s,/candidates\.sort/);
assert.match(s,/candidates\.slice\(0, 150\)/);
assert.match(s,/properties\.getProperty\(rec\.key\) !== rec\.value/);
assert.match(s,/DriveApp\.createFile\(filename, data, MimeType\.PLAIN_TEXT\)/);
assert.match(s,/getSharingAccess\(\) !== DriveApp\.Access\.PRIVATE/);
assert.match(s,/getEditors\(\)\.length !== 0/);
assert.match(s,/getViewers\(\)\.length !== 0/);
assert.match(s,/file\.getBlob\(\)\.getDataAsString\('UTF-8'\)/);
assert.match(s,/restored !== data/);
assert.match(s,/replayPropertiesDeleted: 0/);
assert.match(s,/cleanupAllowedAutomatically: false/);
for (const p of [
/\.setProperty\s*\(/,/\.setProperties\s*\(/,
/\.deleteProperty\s*\(/,/\.deleteAllProperties\s*\(/,
/\bUrlFetchApp\b/,/\bSpreadsheetApp\b/,
/Logger\.log\s*\(\s*(?:raw|name|key|records|data|backup|file)\s*\)/,
/Logger\.log\s*\(\s*JSON\.stringify\(\s*(?:records|backup|file)/
])assert.equal(p.test(s),false,'Backup must not mutate Script Properties or print sensitive data: '+p);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
assert.match(s,/Logger\.log\(JSON\.stringify\(result\)\)/);
console.log('TrendOS R2 private backup static safety PASS: full private verified backup, zero property deletions, sanitized receipt.');
