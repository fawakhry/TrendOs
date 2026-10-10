import assert from 'node:assert/strict';
import fs from 'node:fs';

// ACC-146: historical pre-canary evidence must NOT be re-labelled as the
// current six-canary Production baseline. This test has no network or writes.
const read = path => fs.readFileSync(path, 'utf8');
const a211 = read('.github/workflows/easystore-a211-waste-qualification.yml');
const a212 = read('.github/workflows/easystore-a212-dept-line-qualification.yml');
const current = read('.github/workflows/easystore-d1-readonly-resume-20261010.yml');

assert.match(a211, /four-canary baseline/);
assert.match(a211, /requestLedger:4,events:4,waste:0/);
assert.match(a211, /deptLines:0/);
assert.match(a212, /five-canary baseline/);
assert.match(a212, /waste:1,deptLines:0,requestLedger:5,events:5/);
assert.match(current, /requestLedger:6,events:6/);
assert.match(current, /deptLines:1/);
assert.match(current, /waste:1/);
assert.match(current, /custodyCloses:0/);
assert.match(current, /writeCanaryMaxCommands/);
assert.match(current, /ACCOUNTING_RUNTIME_CHECKPOINT=PASS/);
assert.doesNotMatch(current, /\bnpx wrangler (?:deploy|rollback)\b/);
assert.doesNotMatch(current, /\b(?:INSERT INTO|UPDATE|DELETE FROM|DROP TABLE|ALTER TABLE)\s+employee_accounting/i);

console.log('ACC146_HISTORICAL_A211_A212_BASELINES_PRESERVED=PASS');
console.log('ACC146_CURRENT_SIX_CANARY_CLOSED_BASELINE_TEST=PASS');
console.log('ACC146_TEST_PRODUCTION_MUTATION=NO');
