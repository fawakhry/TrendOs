import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.TRENDOS_TEST_ROOT || process.cwd();
const file = path.join(root, 'operator-task-readonly-canary-v1.js');
const src = fs.readFileSync(file, 'utf8');

assert.match(src, /MATBAGY_OPERATOR_TASK_READONLY_CANARY_V1/);
assert.match(src, /MATBAGY_OPERATOR_TASK_READONLY_CANARY_USERS/);
assert.match(src, /\/v1\/edge\/session/);
assert.match(src, /\/v1\/operator\/tasks\/status/);
assert.match(src, /method:\s*'GET'/);
assert.match(src, /method:\s*'POST'/);
assert.match(src, /Operator Task V2 — تجربة قراءة فقط/);
assert.match(src, /Material Control: OFF/);

assert.doesNotMatch(src, /\/v1\/operator\/tasks\/claim-next/);
assert.doesNotMatch(src, /\/v1\/operator\/tasks\/complete/);
assert.doesNotMatch(src, /claimNext/);
assert.doesNotMatch(src, /completeTask/);
assert.doesNotMatch(src, /gaberMaterial/);
assert.doesNotMatch(src, /materialApi/);

const postMatches = [...src.matchAll(/method:\s*'POST'/g)];
assert.equal(postMatches.length, 1, 'The only POST allowed is the Edge session exchange.');

console.log('OPERATOR_TASK_READONLY_CANARY_V1_CONTRACT=PASS');
