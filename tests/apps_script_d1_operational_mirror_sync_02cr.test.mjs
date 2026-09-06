import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../cloudflare-d1/D1_Operational_Mirror_Sync_02CR.gs', import.meta.url), 'utf8');

assert.match(src, /TRENDOS_PERF_CF_02CR_OPERATIONAL_SYNC_ENABLED/);
assert.match(src, /function runD1OperationalMirrorSync02CROnce\(\)/);
assert.match(src, /props\.deleteProperty\(D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY\)/, 'one-shot must close private gate');
assert.match(src, /atomicAction:\s*'stage'/);
assert.match(src, /atomicAction:\s*'promote'/);
assert.match(src, /sheetNames:\s*D1_OPERATIONAL_SYNC_02CR_TARGETS\.slice\(\)/);
assert.match(src, /PERF-CF-02CR operational mirror V1/);
assert.match(src, /SpreadsheetApp\.openById\(D1_OPERATIONAL_SYNC_02CR_SPREADSHEET_ID\)/);
assert.match(src, /D1_API_URL/);
assert.match(src, /D1_MIGRATION_SECRET/);
assert.doesNotMatch(src, /Logger\.log|console\.log/);
assert.doesNotMatch(src, /EDGE_SESSION_SECRET/);
assert.doesNotMatch(src, /genericDrain|02CL|cutover\s*=|MATBAGY_EDGE_ORDERS_READ_V1_ENABLED/);
assert.doesNotMatch(src, /setValue\(|setValues\(|appendRow\(|insertRow|deleteRow/);

const targetBlock = src.match(/const D1_OPERATIONAL_SYNC_02CR_TARGETS = Object\.freeze\(\[([\s\S]*?)\]\);/);
assert.ok(targetBlock, 'exact target allow-list is required');
const targets = [...targetBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.deepEqual(targets, [
  'الأوردرات',
  'بنود الأوردرات',
  'العملاء',
  'عملاء منع التسليم بالمديونية'
]);

const refreshBody = src.slice(src.indexOf('function refreshD1OperationalMirrors02CR()'), src.indexOf('function runD1OperationalMirrorSync02CROnce()'));
const offGate = refreshBody.indexOf('if (!d1OperationalSync02CREnabled_())');
const stageCall = refreshBody.indexOf('d1OperationalSync02CRStage_');
const promoteCall = refreshBody.indexOf("atomicAction: 'promote'");
assert.ok(offGate >= 0 && stageCall > offGate && promoteCall > offGate, 'OFF gate must precede operational mutations');

assert.match(src, /lines\.lastRow <= 1/);
assert.match(src, /customers\.lastRow <= 1/);
assert.match(src, /result\.d1RowCount === result\.googleLastRow/);
assert.match(src, /result\.d1Note === D1_OPERATIONAL_SYNC_02CR_NOTE/);

console.log('PERF_CF_02CR_OPERATIONAL_SYNC_CANDIDATE_SAFETY_PASS');
