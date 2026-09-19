import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-script-properties-replay-backup-sheet-verify-readonly.gs',import.meta.url),'utf8');
for (const pattern of [
  /function trendosReplayBackupSheetVerifyReadOnly20260919\(/,
  /backupFiles\.length !== 1/,
  /getSharingAccess\(\) !== DriveApp\.Access\.PRIVATE/,
  /backup\.records\.length !== 150/,
  /properties\.getProperty\(rec\.key\)/,
  /current !== rec\.value/,
  /workbookName !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY'/,
  /'الأوردرات'/,/'بنود الأوردرات'/,/'أرشيف الأوردرات'/,/'أرشيف بنود الأوردرات'/,
  /getRange\(2, col, count, 1\)\.getDisplayValues\(\)/,
  /missingSummary: missingSummary/,
  /missingLines: missingLines/,
  /backupAndSheetChecksPass: verified/,
  /mutationPerformed: false/,
  /deletionPerformed: false/,
  /deletionAuthorizedByThisReport: false/
])assert.match(s,pattern);
for(const forbidden of [
  /\.setProperty\s*\(/,/\.setProperties\s*\(/,
  /\.deleteProperty\s*\(/,/\.deleteAllProperties\s*\(/,
  /\.setValue\s*\(/,/\.setValues\s*\(/,
  /\.createFile\s*\(/,/\.setTrashed\s*\(/,
  /\bUrlFetchApp\b/,/\bMailApp\b/,
  /Logger\.log\s*\(\s*(?:backup|content|file|rec|id|key)\s*\)/,
  /Logger\.log\s*\(\s*JSON\.stringify\(\s*(?:backup|records|idToRecords)/
])assert.equal(forbidden.test(s),false,'No mutations or sensitive detail logs: '+forbidden);
assert.equal((s.match(/Logger\.log\s*\(/g)||[]).length,1);
assert.match(s,/Logger\.log\(JSON\.stringify\(result\)\)/);
console.log('TrendOS R2 verified-backup and authoritative Sheet parity READ-ONLY static safety PASS.');
