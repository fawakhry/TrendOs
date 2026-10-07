import assert from 'node:assert/strict';
import fs from 'node:fs';

const wf=fs.readFileSync('.github/workflows/autonomous-printshop-employee-supervisor-shadow-activate.yml','utf8');

assert.match(wf,/autonomous_employee_supervisor_control/);
assert.match(wf,/mode='SHADOW'/);
assert.match(wf,/epoch=2/);
assert.match(wf,/AND mode='OFF'/);
assert.match(wf,/AND epoch=1/);
assert.match(wf,/STRUCTURED_ANDON_SHADOW_ACTIVATION/);
assert.match(wf,/EMPLOYEE_SUPERVISOR_SHADOW_ACTIVATION=PASS/);
assert.match(wf,/EMPLOYEE_FRONTEND_WIRED=NO/);
assert.match(wf,/AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_ONLY/);
assert.match(wf,/operatorTaskMode/);
assert.match(wf,/BLOCKER_EVENTS=0/);

const updateStatements=(wf.match(/UPDATE\s+autonomous_employee_supervisor_control/gi)||[]).length;
assert.equal(updateStatements,1);
assert.doesNotMatch(wf,/UPDATE\s+(?:t12_prod_|employee_accounting_|operator_tasks|autonomy_control|autonomous_readiness_control)/i);
assert.doesNotMatch(wf,/INSERT\s+INTO\s+(?:t12_prod_|employee_accounting_|operator_tasks|autonomy_events|autonomous_readiness_evidence)/i);
assert.doesNotMatch(wf,/DELETE\s+FROM/i);
assert.doesNotMatch(wf,/DROP\s+TABLE/i);
assert.doesNotMatch(wf,/ALTER\s+TABLE/i);

console.log('EMPLOYEE_SUPERVISOR_SHADOW_ACTIVATION_V1=PASS');
console.log('CONTROL_TRANSITION=OFF_1_TO_SHADOW_2_ONLY');
console.log('BLOCKER_DATA_CREATED=NO');
console.log('BUSINESS_WRITE=NO');
