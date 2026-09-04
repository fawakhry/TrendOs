import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync('cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs', 'utf8');

assert.match(code, /function\s+getD1OrdersLowUsageHeartbeatV1\s*\(/);
assert.match(code, /getD1OrdersLowUsageStatusV1\s*\(\s*\)/);
assert.match(code, /displayHash:\s*String\(entry\.displayHash\s*\|\|\s*''\)\s*\?\s*'present'\s*:\s*''/);
assert.match(code, /lowUsageTriggerCount/);
assert.match(code, /legacyV1TriggerCount/);
assert.match(code, /directV2TriggerCount/);
assert.match(code, /lightFingerprintPresent/);
assert.match(code, /lastIdleCheck/);
assert.match(code, /consecutiveErrors/);

assert.doesNotMatch(code, /setProperty\s*\(/);
assert.doesNotMatch(code, /deleteProperty\s*\(/);
assert.doesNotMatch(code, /SpreadsheetApp\./);
assert.doesNotMatch(code, /UrlFetchApp\./);
assert.doesNotMatch(code, /ScriptApp\.newTrigger/);
assert.doesNotMatch(code, /\.setValue\s*\(/);
assert.doesNotMatch(code, /\.setValues\s*\(/);
assert.doesNotMatch(code, /displayHash:\s*String\(entry\.displayHash\s*\|\|\s*''\)\s*[,}]/);

console.log('D1 Orders Low-Usage Heartbeat V1: READ-ONLY SANITIZED HELPER + NO MUTATION/CLOUDFLARE/SHEET ACCESS PASS');
