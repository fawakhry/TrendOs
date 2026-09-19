import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-script-properties-quota-audit-readonly.gs',import.meta.url),'utf8');
assert.match(source,/function trendosPropertyQuotaAuditReadOnly20260919\(/);
assert.match(source,/props\.getKeys\(\)/);
assert.match(source,/props\.getProperty\(name\)/);
assert.match(source,/totalBytesApprox/);
assert.match(source,/replayOlderThan48Hours/);
assert.match(source,/baselineChunkCountObserved/);
for (const forbidden of [
  /\.setPropert(?:y|ies)\s*\(/,
  /\.deletePropert(?:y|ies)\s*\(/,
  /\.deleteAllProperties\s*\(/,
  /\bSpreadsheetApp\b/,
  /\bUrlFetchApp\b/,
  /\bScriptApp\b/,
  /\bDriveApp\b/,
  /\bMailApp\b/,
  /\beval\s*\(/,
  /Logger\.log\s*\(\s*(?:value|props|keys)\s*\)/,
  /console\.log\s*\(\s*(?:value|props|keys)\s*\)/
])assert.equal(forbidden.test(source),false,'R1 diagnostics must be strictly read-only, local, and not log unredacted secrets: '+forbidden);
const consoleLogCount=(source.match(/Logger\.log\s*\(/g)||[]).length;
assert.equal(consoleLogCount,1,'Exactly one aggregated report may be logged');
assert.match(source,/Logger\.log\(JSON\.stringify\(result\)\)/);
assert.equal(source.includes('Logger.log(JSON.stringify(properties))'),false);
console.log('TrendOS R1 Script Properties audit static safety PASS: read-only; no secret value logging or mutation.');
