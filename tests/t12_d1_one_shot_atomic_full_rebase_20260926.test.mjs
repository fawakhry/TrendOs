import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/t12-d1-one-shot-atomic-full-rebase-20260926.gs',
  import.meta.url), 'utf8');

assert.match(src, /function\s+trendosT12OneShotAtomicFullRebase20260926\s*\(/);
assert.match(src, /1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/);
assert.match(src, /d1OrdersLiveSyncV2CaptureAll_\s*\(/);
assert.match(src, /d1OrdersLiveSyncV2StageSnapshot_\s*\(/);
assert.match(src, /SOURCE_CHANGED_BEFORE_PROMOTE/);
assert.match(src, /CATALOG_CHANGED_BEFORE_PROMOTE/);
assert.match(src, /atomicAction:\s*'promote'/);
assert.match(src, /GET_RECONCILIATION_AFTER_AMBIGUOUS_POST/);
assert.match(src, /if\s*\(exactParity\s*&&\s*sourceStillSame\)/);
assert.match(src, /T12_REBASE_POSTFLIGHT_SOURCE_CHANGED_NO_RETRY/);
assert.match(src, /parityReachedButSourceAdvanced:\s*exactParity\s*&&\s*!sourceStillSame/);
assert.equal(/if\s*\(exactParity\s*\)\s*\{/.test(src), false,
  'success must not depend on staged parity alone');
assert.match(src, /automaticRetryAllowed:\s*false/);
assert.match(src, /d1OrdersLowUsageTickV1/);
assert.match(src, /d1OrdersLiveSyncTickV2/);
assert.match(src, /d1OperationalEnrichmentLiveSyncTick02CR/);

for (const forbidden of [
  /setProperty\s*\(/,
  /deleteProperty\s*\(/,
  /newTrigger\s*\(/,
  /deleteTrigger\s*\(/,
  /startD1OrdersLiveSync/,
  /d1OrdersLiveSyncTickV2\s*\(/,
  /d1OrdersLiveSyncV2ClearBaseline_\s*\(/,
  /SpreadsheetApp\.[A-Za-z]*set/,
  /setValue\s*\(/,
  /setValues\s*\(/
]) {
  assert.equal(forbidden.test(src), false, 'forbidden one-shot side effect: ' + forbidden);
}

console.log('T12 one-shot atomic full rebase static safety PASS');
