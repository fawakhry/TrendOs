import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs', 'utf8');

const requiredTargets = [
  'واجهة خدمة العملاء',
  'واجهة الطباعة',
  'واجهة الليزر',
  'واجهة المكبس'
];
for (const name of requiredTargets) {
  assert.equal(source.includes(`'${name}'`), true, `Missing bounded target: ${name}`);
}

assert.match(source, /TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_ENABLED/);
assert.match(source, /D1_SCREEN_VIEW_REFRESH_02CQ_SPREADSHEET_ID\s*=\s*'1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI'/);
assert.match(source, /SpreadsheetApp\.openById\(D1_SCREEN_VIEW_REFRESH_02CQ_SPREADSHEET_ID\)/);
assert.match(source, /getProperty\('D1_API_URL'\)/);
assert.match(source, /getProperty\('D1_MIGRATION_SECRET'\)/);
assert.match(source, /'x-migration-secret':\s*migrationSecret/);
assert.match(source, /refreshD1ScreenViewMirrors02CQ/);
assert.match(source, /runD1ScreenViewMirrorRefresh02CQOnce/);
assert.match(source, /getD1ScreenViewMirrorRefresh02CQStatus/);
assert.match(source, /atomicAction:\s*'stage'/);
assert.match(source, /atomicAction:\s*'promote'/);
assert.match(source, /sheetNames:\s*D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS\.slice\(\)/);
assert.match(source, /printSource\.lastRow\s*<=\s*1/);
assert.match(source, /getValues\(\)/);
assert.match(source, /getDisplayValues\(\)/);
assert.match(source, /getFormulas\(\)/);
assert.match(source, /productionMirrorMutated/);
assert.match(source, /stagingMayHaveMutated/);

// Candidate must be self-contained; deploying 02CQ must not require D1_Full_Migration.gs.
for (const dependency of ['d1FullConfig_', 'd1FullSpreadsheet_', 'd1FullHeaders_', 'd1FullBuildRows_', 'd1FullPost_', 'd1FullGet_']) {
  assert.equal(source.includes(dependency), false, `02CQ must not depend on external full-migration helper: ${dependency}`);
}

// Default-OFF must be a hard gate before the executable refresh path can stage/promote.
const refreshStart = source.indexOf('function refreshD1ScreenViewMirrors02CQ()');
const refreshEnd = source.indexOf('function runD1ScreenViewMirrorRefresh02CQOnce()', refreshStart);
assert.ok(refreshStart >= 0 && refreshEnd > refreshStart, 'Refresh function boundaries missing');
const refreshBody = source.slice(refreshStart, refreshEnd);
const gateIndex = refreshBody.indexOf('if (!d1ScreenViewRefresh02CQEnabled_())');
const stageCallIndex = refreshBody.indexOf('d1ScreenViewRefresh02CQStageOne_(');
const promoteCallIndex = refreshBody.indexOf("atomicAction: 'promote'");
assert.ok(gateIndex >= 0, 'Default-OFF gate missing');
assert.ok(stageCallIndex > gateIndex, 'Stage call appears before default-OFF gate');
assert.ok(promoteCallIndex > gateIndex, 'Promote call appears before default-OFF gate');

// One-shot runner opens only this gate and always clears it in finally.
const onceStart = source.indexOf('function runD1ScreenViewMirrorRefresh02CQOnce()');
const onceEnd = source.indexOf('function getD1ScreenViewMirrorRefresh02CQStatus()', onceStart);
assert.ok(onceStart >= 0 && onceEnd > onceStart, 'One-shot runner boundaries missing');
const onceBody = source.slice(onceStart, onceEnd);
assert.match(onceBody, /if \(before === '1'\)/);
assert.match(onceBody, /props\.setProperty\(D1_SCREEN_VIEW_REFRESH_02CQ_ENABLED_KEY, '1'\)/);
assert.match(onceBody, /return refreshD1ScreenViewMirrors02CQ\(\)/);
assert.match(onceBody, /finally\s*\{/);
assert.match(onceBody, /props\.deleteProperty\(D1_SCREEN_VIEW_REFRESH_02CQ_ENABLED_KEY\)/);
assert.equal((onceBody.match(/setProperty\(/g) || []).length, 1, 'One-shot runner must set exactly one Script Property');
assert.equal((onceBody.match(/deleteProperty\(/g) || []).length, 1, 'One-shot runner must clear exactly one Script Property');

// Exactly one production promote action exists, after bounded staging.
const promoteCount = (source.match(/atomicAction:\s*'promote'/g) || []).length;
assert.equal(promoteCount, 1, '02CQ must contain exactly one atomic promote action');

// 02CQ must not broaden into legacy/full migration, cutover, reconciliation, or secret rotation lanes.
const forbidden = [
  'startD1FullMigration(',
  'd1FullMigrationTick(',
  'enableD1OrdersPrimaryRead(',
  'wrangler deploy',
  'secret' + ' put',
  'd1 execute --' + 'file',
  'wrangler d1 migrations' + ' apply',
  'generic outbox' + ' drain',
  '/v1/qualification/cloud-write/reconcile/' + 'order',
  'EDGE_SESSION_SECRET',
  'MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true'
];
for (const token of forbidden) {
  assert.equal(source.includes(token), false, `Forbidden 02CQ boundary token: ${token}`);
}

// Candidate must not log source payloads / PII or return migration-secret values.
assert.equal(source.includes('Logger.log'), false, '02CQ candidate must not log source rows or payloads');
assert.equal(source.includes('customerPhone'), false, '02CQ candidate must not inspect/log customer phone fields');
assert.equal(source.includes('debtNotes'), false, '02CQ candidate must not inspect/log notes fields');
assert.equal(source.includes('return migrationSecret'), false, '02CQ must not return the migration secret from a helper');
assert.equal(source.includes('secret: migrationSecret'), false, '02CQ must not put migration secret in returned objects');
assert.equal(source.includes('secret: secret'), false, '02CQ must not put migration secret in returned objects');

console.log('PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH_CANDIDATE_SAFETY_PASS');
