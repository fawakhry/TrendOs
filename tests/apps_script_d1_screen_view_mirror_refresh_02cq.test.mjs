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
assert.match(source, /refreshD1ScreenViewMirrors02CQ/);
assert.match(source, /getD1ScreenViewMirrorRefresh02CQStatus/);
assert.match(source, /atomicAction:\s*'stage'/);
assert.match(source, /atomicAction:\s*'promote'/);
assert.match(source, /sheetNames:\s*D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS\.slice\(\)/);
assert.match(source, /printSource\.lastRow\s*<=\s*1/);
assert.match(source, /d1FullBuildRows_/);
assert.match(source, /d1FullPost_/);
assert.match(source, /d1FullGet_/);
assert.match(source, /d1FullSpreadsheet_/);
assert.match(source, /D1_SCREEN_VIEW_REFRESH_02CQ_NOTE/);

// Default-OFF must be a hard gate before any D1 POST.
const gateIndex = source.indexOf('if (!d1ScreenViewRefresh02CQEnabled_())');
const firstPostIndex = source.indexOf("d1FullPost_('/v1/import/sheet'");
assert.ok(gateIndex >= 0, 'Default-OFF gate missing');
assert.ok(firstPostIndex > gateIndex, 'D1 POST appears before default-OFF gate');

// 02CQ must not broaden into the old all-sheet migration or cutover lanes.
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

// Candidate must not log row payloads / PII.
assert.equal(source.includes('Logger.log'), false, '02CQ candidate must not log source rows or payloads');
assert.equal(source.includes('customerPhone'), false, '02CQ candidate must not inspect/log customer phone fields');
assert.equal(source.includes('debtNotes'), false, '02CQ candidate must not inspect/log notes fields');

// All production replacement is delegated to one atomic promote after staging.
const promoteCount = (source.match(/atomicAction:\s*'promote'/g) || []).length;
assert.equal(promoteCount, 1, '02CQ must contain exactly one atomic promote action');

console.log('PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH_CANDIDATE_SAFETY_PASS');
