import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync('cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs', 'utf8');

assert.match(code, /D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1\s*=\s*5/);
assert.match(code, /everyMinutes\(D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1\)/);
assert.match(code, /function d1OrdersLowUsageLightFingerprintV1_/);
assert.match(code, /getDisplayValues\(\)/);
assert.doesNotMatch(code, /getFormulas\(\)/);
assert.match(code, /mode:\s*'unchanged-light-fingerprint-no-d1-request'/);
assert.match(code, /d1RequestMade:\s*false/);
assert.match(code, /d1WriteMade:\s*false/);
assert.match(code, /previous\s*&&\s*previous\s*===\s*light\.fingerprint/);
assert.match(code, /const result = d1OrdersLiveSyncTickV2\(\)/);
assert.match(code, /d1OrdersLiveSyncV2ClearBaseline_\(props\)/);
assert.match(code, /D1_ORDERS_LOW_USAGE_LIGHT_FINGERPRINT_KEY_V1/);
assert.match(code, /transient-source-read-error/);
assert.match(code, /retryOnNextTick:\s*true/);
assert.match(code, /d1OrdersLowUsageRecordErrorV1_/);
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

const lightBlock = code.slice(code.indexOf('function d1OrdersLowUsageLightFingerprintV1_'), code.indexOf('function d1OrdersLowUsageRecordErrorV1_'));
assert.ok(lightBlock.length > 0);
assert.match(lightBlock, /getDisplayValues\(\)/);
assert.doesNotMatch(lightBlock, /getValues\(\)/);
assert.doesNotMatch(lightBlock, /getFormulas\(\)/);
assert.doesNotMatch(lightBlock, /d1Full(Get|Post)_\s*\(/);
assert.doesNotMatch(lightBlock, /UrlFetchApp\.fetch/);

console.log('D1 Orders Low-Usage Control V1.1: 5-MIN LIGHT FINGERPRINT + UNCHANGED ZERO D1 + TRANSIENT-SAFE RETRY + CHANGED V2 DELTA PASS');
