import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-direct-cas-bounded-catchup-20260920.gs',import.meta.url),'utf8');
assert.match(source,/function trendosD1DirectCasBoundedCatchup20260920\s*\(/);
assert.match(source,/getScriptLock\(\)/);
assert.match(source,/R4_CAS_ABORT_SYNC_TRIGGER_ACTIVE/);
assert.match(source,/maxCandidates\s*=\s*64/);
assert.match(source,/R4_CAS_ABORT_SOURCE_CHANGED/);
assert.match(source,/R4_CAS_ABORT_CATALOG_CHANGED/);
assert.match(source,/\/v1\/admin\/r4\/orders-recovery\/apply/);
assert.match(source,/automaticRetryAllowed:false/);
for(const forbidden of [
  /\/v1\/mirror\/delta/,
  /startD1OrdersLowUsageSyncV1\s*\(/,
  /d1OrdersLiveSyncTickV2\s*\(/,
  /newTrigger\s*\(/,
  /deleteTrigger\s*\(/,
  /setProperty\s*\(/,
  /deleteProperty\s*\(/,
  /clearBaseline/
]) assert.equal(forbidden.test(source),false,'forbidden recovery action: '+forbidden);
console.log('R4 Apps Script CAS caller PASS: bounded, stable, new guarded route only, no property/trigger/Sheet mutation.');
