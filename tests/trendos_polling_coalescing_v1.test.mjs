import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const coordinator = read('trendos-poll-coordinator-v1.js');
const hub = read('operations-hub-v1.js');
const employee = read('employee-manager-strips-v2.js');
const press = read('press-control-v1.js');
const feedback = read('customer-feedback-v1.js');

// Generic coordinator contract.
assert.match(coordinator, /TrendPollCoordinatorV1/);
assert.match(coordinator, /isHidden\(\)/);
assert.match(coordinator, /e\.inFlight/);
assert.match(coordinator, /minIntervalMs/);
assert.match(coordinator, /reason:'hidden'/);
assert.match(coordinator, /reason:'min-interval'/);
assert.match(coordinator, /coalesced/);

// Operations Hub must not fan a manual refresh out through a synthetic focus event.
assert.doesNotMatch(hub, /dispatchEvent\(new Event\(['"]focus['"]\)\)/);
assert.match(hub, /trendos-poll-coordinator-v1\.js/);
assert.match(hub, /source:'operations-hub',force:true/);

// Employee Manager remains one logical refresh even though it reads rows + notes in parallel.
assert.match(employee, /MIN_REFRESH_MS/);
assert.match(employee, /document\.hidden/);
assert.match(employee, /reason:'in-flight'/);
assert.match(employee, /Promise\.all\(\[api\('getRows'/);
assert.match(employee, /TrendPollCoordinatorV1\.run\('employee-manager'/);
assert.match(employee, /refresh\(\{force:true,source:'post-write'\}\)/);
assert.match(employee, /window\.addEventListener\('focus',function\(\)\{refresh\(\{source:'focus'\}\);\}\)/);

// Press status polling is read-only and must be visibility-aware + coalesced.
assert.match(press, /MIN_REFRESH_MS/);
assert.match(press, /document\.hidden/);
assert.match(press, /refreshBusy/);
assert.match(press, /TrendPollCoordinatorV1\.run\('press-status'/);
assert.match(press, /window\.TrendPressControlV1=\{refresh:refresh/);

// Feedback scan may mutate backend state, so it is throttled locally but is deliberately
// not routed through the generic READ poll coordinator.
assert.match(feedback, /MIN_SCAN_MS/);
assert.match(feedback, /document\.hidden/);
assert.match(feedback, /lastScanAt/);
assert.doesNotMatch(feedback, /TrendPollCoordinatorV1\.run/);

console.log('TrendOS Polling Coalescing V1 tests: PASS');
