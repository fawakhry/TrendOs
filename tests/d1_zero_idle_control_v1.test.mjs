import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'cloudflare-d1/D1_Zero_Idle_Control.gs'), 'utf8');

// Standard V8 parse check. Apps Script globals resolve only at runtime.
new Function(source);

for (const handler of [
  'd1OrdersLiveSyncTick',
  'd1OrdersLiveSyncTickV2',
  'd1NormalizedLiveSyncTick',
  'd1NormalizedLiveSyncTickV2',
  'd1FullMigrationTick'
]) {
  assert.ok(source.includes(`'${handler}'`), `Missing recurring D1 handler ${handler}`);
}

for (const key of [
  'D1_ORDERS_LIVE_SYNC_ENABLED_V1',
  'D1_ORDERS_LIVE_SYNC_V2_ENABLED',
  'D1_NORMALIZED_SYNC_ENABLED_V1',
  'D1_NORMALIZED_SYNC_V2_ENABLED'
]) {
  assert.ok(source.includes(`'${key}'`), `Missing disable flag ${key}`);
}

// Zero-idle control itself is never allowed to install a recurring trigger.
assert.doesNotMatch(source, /ScriptApp\.newTrigger/);
assert.doesNotMatch(source, /everyMinutes\s*\(/);
assert.doesNotMatch(source, /everyHours\s*\(/);

// Activation/status paths must be Cloudflare/D1 network-mutation free.
const activateStart = source.indexOf('function activateD1ZeroIdleMode()');
const statusStart = source.indexOf('function getD1ZeroIdleStatus()');
const oneShotStart = source.indexOf('function d1ZeroIdleRunOrdersV2Once()');
assert.ok(activateStart >= 0 && statusStart > activateStart && oneShotStart > statusStart);
const passiveSection = source.slice(activateStart, oneShotStart);
assert.doesNotMatch(passiveSection, /d1Full(Post|Get)_\s*\(/);
assert.doesNotMatch(passiveSection, /d1JsonFetch_\s*\(/);
assert.doesNotMatch(passiveSection, /UrlFetchApp\./);

assert.match(source, /recurringD1WritesEnabled:\s*false/);
assert.match(source, /cloudflareRequestMade:\s*false/);
assert.match(source, /d1WriteMade:\s*false/);

// Explicit one-shot wrappers must restore V2 enable flags to OFF in finally blocks.
assert.match(source, /finally\s*\{[\s\S]*D1_ORDERS_LIVE_SYNC_V2_ENABLED', '0'/);
assert.match(source, /finally\s*\{[\s\S]*D1_NORMALIZED_SYNC_V2_ENABLED', '0'/);

console.log('D1 Zero-Idle Control V1: NO RECURRING TRIGGER + DISABLE FLAGS + PASSIVE ACTIVATION + ONE-SHOT RESTORE PASS');
