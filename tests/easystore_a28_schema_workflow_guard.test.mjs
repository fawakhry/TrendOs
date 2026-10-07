import assert from 'node:assert/strict';
import fs from 'node:fs';
const y=fs.readFileSync('.github/workflows/easystore-a2-schema-apply-controlled.yml','utf8');
assert.ok(/on:\s*\n\s*workflow_dispatch:\s*/m.test(y));
assert.ok(!/on:\s*\n\s*push:/m.test(y));
assert.ok(y.includes('A2_SCHEMA_ACCOUNTING_BASELINE=APPROVED_CANARY_EVIDENCE'));
assert.ok(y.includes('A2_SCHEMA_ACCOUNTING_POST=APPROVED_CANARY_EVIDENCE'));
assert.ok(y.includes('requestLedger:6'));
assert.ok(y.includes('materials:1'));
assert.ok(y.includes('templates:1'));
assert.ok(y.includes('parties:1'));
assert.ok(y.includes('partyBalances:1'));
assert.ok(y.includes('deptLines:1'));
assert.ok(y.includes('waste:1'));
assert.ok(y.includes('events:6'));
assert.ok(!y.includes('A2_SCHEMA_ACCOUNTING_BASELINE_ROWS=0'));
assert.ok(!y.includes('A2_SCHEMA_ACCOUNTING_ROWS_POST=0'));
assert.ok(!y.includes('A2_SCHEMA_PRODUCTION_SCHEMA_MUTATION=YES'));
console.log('A28_SCHEMA_WORKFLOW_GUARD=PASS');
console.log('SCHEMA_APPLY_TRIGGER=MANUAL_ONLY');
console.log('SCHEMA_BASELINE=APPROVED_CANARY_EVIDENCE');
console.log('PRODUCTION_MUTATION=NO');

// A2.12 six-canary baseline rerun marker
