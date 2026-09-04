import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'cloudflare-d1/D1_Orders_Live_Sync.gs'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'cloudflare-d1/src/mirror.js'), 'utf8');

function indexOrFail(haystack, needle) {
  const index = haystack.indexOf(needle);
  assert.notEqual(index, -1, `Missing required contract: ${needle}`);
  return index;
}

// Apps Script sender must use atomic staging + one final promote under one runId.
assert.match(source, /function d1OrdersLiveSyncRunId_\(\)/);
assert.match(source, /atomicAction:\s*'stage'/);
assert.match(source, /atomicAction:\s*'promote'/);
assert.match(source, /runId:\s*runId/);
assert.match(source, /sheetNames:\s*names/);
assert.match(source, /D1_ORDERS_LIVE_SYNC_NOTE_V1\s*=\s*'TrendOS orders live sync V1'/);
assert.match(source, /d1OrdersLiveSyncCapabilities_\(\)/);
assert.match(source, /\/v1\/mirror\/capabilities/);
assert.match(source, /caps\.atomicSupported\s*!==\s*true/);

const stageIndex = indexOrFail(source, 'staged.push(d1OrdersLiveSyncStageOneSheet_');
const promoteIndex = indexOrFail(source, "atomicAction: 'promote'");
assert.ok(stageIndex < promoteIndex, 'Both staging loop and its collected results must occur before promote');

// Sender must fail closed on worker parity/stage/promote contract violations.
assert.match(source, /copiedRows !== lastRow/);
assert.match(source, /finalResult\.final !== true/);
assert.match(source, /Number\(finalResult\.copiedRows \|\| 0\) !== lastRow/);
assert.match(source, /promote\.success !== true/);
assert.match(source, /promote\.atomic !== true/);
assert.match(source, /promote\.action !== 'promote'/);
assert.match(source, /D1 atomic promote omitted sheet/);

// Completed Apps Script executions must be observable as success/skip/error.
for (const key of [
  'D1_ORDERS_LIVE_SYNC_LAST_ATTEMPT_V1',
  'D1_ORDERS_LIVE_SYNC_LAST_SKIP_V1',
  'D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_V1',
  'D1_ORDERS_LIVE_SYNC_LAST_ERROR_V1',
  'D1_ORDERS_LIVE_SYNC_LAST_RUN_V1'
]) {
  assert.ok(source.includes(key), `Missing observability key ${key}`);
}
assert.match(source, /reason:\s*'disabled'|d1OrdersLiveSyncRecordSkip_\(props, 'disabled'/);
assert.match(source, /d1OrdersLiveSyncRecordSkip_\(props, 'script-lock-unavailable'/);
assert.match(source, /phase:\s*'success'/);
assert.match(source, /phase:\s*'error'/);
assert.match(source, /starved:/);

// Recovery start must remove old triggers, run one atomic sync first, reset the flag
// on failure, and install the one-minute trigger only after that success gate.
const startIndex = indexOrFail(source, 'function startD1OrdersLiveSync()');
const startBody = source.slice(startIndex, indexOrFail(source, 'function stopD1OrdersLiveSync()'));
const firstRunIndex = indexOrFail(startBody, 'const firstRun = d1OrdersLiveSyncTick();');
const failureIndex = indexOrFail(startBody, 'if (!firstRun.success)');
const newTriggerIndex = indexOrFail(startBody, 'ScriptApp.newTrigger');
assert.ok(firstRunIndex < failureIndex && failureIndex < newTriggerIndex, 'Trigger must only be installed after a passing first run');
assert.match(startBody, /props\.setProperty\(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '0'\)/);
assert.match(startBody, /d1OrdersLiveSyncRemoveTriggers_\(\);[\s\S]*throw new Error/);
assert.match(startBody, /everyMinutes\(1\)/);

// Status output must expose presence booleans, never secret values.
assert.match(source, /hasD1ApiUrl:/);
assert.match(source, /hasD1MigrationSecret:/);
assert.doesNotMatch(source, /D1_MIGRATION_SECRET['"]?\s*:\s*props\.getProperty/);

// Worker atomic contract: staging is separate, promote validates every staged sheet,
// then uses one D1 batch to replace both live snapshots.
assert.match(worker, /async function importSheetStage\(body, env\)/);
assert.match(worker, /async function promoteStagedSheets\(body, env\)/);
assert.match(worker, /Atomic stage incomplete/);
assert.match(worker, /Atomic staging sheet is not complete/);
assert.match(worker, /await env\.DB\.batch\(statements\)/);
assert.match(worker, /atomicAction === 'stage'/);
assert.match(worker, /atomicAction === 'promote'/);

console.log('D1 Orders Atomic Live Sync V1 contract tests: PASS');
