import assert from 'node:assert/strict';
import fs from 'node:fs';

const s=fs.readFileSync('.github/workflows/autonomous-printshop-machine-evidence-manual.yml','utf8');

assert.match(s,/workflow_dispatch:/);
assert.doesNotMatch(s,/\n\s*push:/);
assert.match(s,/MACHINE_EVIDENCE_PREFLIGHT=PASS/);
assert.match(s,/operatorTaskMode/);
assert.match(s,/operatorTasks/);
assert.match(s,/machine-evidence-command-v1\.mjs/);
assert.match(s,/--file \/tmp\/machine-command\.sql/);
assert.match(s,/ONLY_MACHINE_EVIDENCE_TABLES_MUTATED=YES/);
assert.match(s,/ORDER_WRITE=NO/);
assert.match(s,/ACCOUNTING_WRITE=NO/);
assert.match(s,/EMPLOYEE_ASSIGNMENT=NO/);
assert.match(s,/READY_REQUIRES_EXPLICIT_DIRECT_CHECK=YES/);

console.log('MACHINE_EVIDENCE_MANUAL_WORKFLOW_V1=PASS');
console.log('AUTO_TRIGGER=NO');
console.log('OPERATOR_TASK_MUST_REMAIN_OFF=YES');
