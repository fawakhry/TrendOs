import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_LIVE_RUNNER_V1.gs'),
  'utf8'
);

assert.match(source, /function\s+runTrendOSCloudWriteRehearsalReplayNoop\s*\(/);
assert.match(source, /CW-STAGE-33912472435/);
assert.match(source, /__TRENDOS_CLOUD_WRITE_REHEARSAL/);
assert.match(source, /decision:\s*["']replay_noop["']/);
assert.match(source, /sheetsWritten:\s*false/);
assert.match(source, /mutationCount:\s*0/);
assert.match(source, /REHEARSAL_LIVE_RUNNER_PRODUCTION_ID_COLLISION/);
assert.match(source, /REHEARSAL_LIVE_RUNNER_ROWCOUNT_CHANGED/);
assert.match(source, /REHEARSAL_LIVE_RUNNER_CLEANUP_FAILED/);
assert.match(source, /props\.setProperty\(secretKey,\s*ephemeralSecret\)/);
assert.match(source, /props\.setProperty\(enabledKey,\s*["']1["']\)/);
assert.match(source, /props\.deleteProperty\(enabledKey\)/);
assert.match(source, /props\.deleteProperty\(secretKey\)/);
assert.match(source, /finally\s*\{/);
assert.match(source, /rehearsalEnabledAfter\s*=\s*false/);
assert.match(source, /rehearsalSecretPresentAfter\s*=\s*false/);

for (const forbidden of [
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.insertRow(?:After|Before)?\s*\(/,
  /\.insertRows(?:After|Before)?\s*\(/,
  /\.clear(?:Content|Format|DataValidations)?\s*\(/,
  /\.createSheet\s*\(/,
  /SpreadsheetApp\.insertSheet\s*\(/,
  /DriveApp\./,
  /UrlFetchApp\./
]) {
  assert.equal(forbidden.test(source), false, `live replay runner contains forbidden Sheet/network mutation: ${forbidden}`);
}

assert.equal(/Logger\.log\([^\n]*ephemeralSecret/.test(source), false, 'ephemeral secret must never be logged');
assert.equal(/return\s+ephemeralSecret/.test(source), false, 'ephemeral secret must never be returned');

console.log('Apps Script Cloud Write Rehearsal LIVE Runner V1: REPLAY-NOOP-ONLY + EPHEMERAL SECRET + FINALLY CLEANUP + ZERO SHEET MUTATION PASS');
