import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync('cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs', 'utf8');

assert.match(code, /D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1\s*=\s*5/);
assert.match(code, /everyMinutes\(D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1\)/);
assert.match(code, /mode:\s*'unchanged-no-d1-request'/);
assert.match(code, /d1RequestMade:\s*false/);
assert.match(code, /d1WriteMade:\s*false/);
assert.match(code, /baseline\.fingerprint\s*===\s*capture\.fingerprint/);
assert.match(code, /const result = d1OrdersLiveSyncTickV2\(\)/);
assert.match(code, /d1OrdersLiveSyncV2ClearBaseline_\(props\)/);
assert.match(code, /d1OrdersLowUsageRemoveTriggersV1_\(\)/);
assert.match(code, /'D1_ORDERS_LIVE_SYNC_ENABLED_V1',\s*'0'/);
assert.doesNotMatch(code, /d1FullPost_\s*\(/);
assert.doesNotMatch(code, /UrlFetchApp\.fetch/);
assert.doesNotMatch(code, /everyMinutes\(1\)/);

const unchangedBlock = code.slice(code.indexOf('if (unchanged) {'), code.indexOf('// Only a real source change'));
assert.ok(unchangedBlock.length > 0);
assert.doesNotMatch(unchangedBlock, /d1OrdersLiveSyncTickV2\s*\(/);
assert.doesNotMatch(unchangedBlock, /d1Full(Get|Post)_\s*\(/);
assert.doesNotMatch(unchangedBlock, /UrlFetchApp\.fetch/);

console.log('D1 Orders Low-Usage Control V1: 5-MIN CHECK + UNCHANGED ZERO D1 REQUESTS/WRITES + CHANGED V2 DELTA PASS');
