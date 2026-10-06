import assert from 'node:assert/strict';
import fs from 'node:fs';

const s=fs.readFileSync('.github/workflows/autonomous-printshop-design-evidence-manual.yml','utf8');

assert.match(s,/workflow_dispatch:/);
assert.doesNotMatch(s,/\n\s*push:/);
assert.match(s,/DESIGN_EVIDENCE_PREFLIGHT=PASS/);
assert.match(s,/design-evidence-command-v1\.mjs/);
assert.match(s,/operatorTaskMode/);
assert.match(s,/operatorTasks/);
assert.match(s,/ONLY_DESIGN_EVIDENCE_TABLES_MUTATED=YES/);
assert.match(s,/ORDER_WRITE=NO/);
assert.match(s,/ACCOUNTING_WRITE=NO/);
assert.match(s,/EMPLOYEE_ASSIGNMENT=NO/);
assert.match(s,/SAVED_EQUALS_APPROVED=NO/);
assert.match(s,/MISSING_ORDER_OR_LINE_FAILS_CLOSED=YES/);
assert.match(s,/MANUAL_PREFLIGHT_RESULT=UNKNOWN/);
assert.match(s,/MANUAL_PREFLIGHT_PASS_SYNTHESIS=NO/);
assert.match(s,/preflightQualified:false/);

console.log('DESIGN_EVIDENCE_MANUAL_WORKFLOW_V1=PASS');
console.log('AUTO_TRIGGER=NO');
console.log('OPERATOR_TASK_MUST_REMAIN_OFF=YES');
