import assert from 'node:assert/strict';
import fs from 'node:fs';

const path='.github/workflows/autonomous-printshop-material-post-cutover-diagnostic.yml';
const yml=fs.readFileSync(path,'utf8');

assert.match(yml,/workflow_dispatch:/);
assert.doesNotMatch(yml,/\bpush:/);
assert.doesNotMatch(yml,/\bschedule:/);
assert.match(yml,/accounting_checkpoint_ref:/);
assert.match(yml,/stock_authority_confirmed:/);
assert.match(yml,/qualifyMaterialPostCutoverV1/);
assert.match(yml,/employee_accounting_materials_v1/);
assert.match(yml,/employee_accounting_stock_moves_v1/);
assert.match(yml,/employee_accounting_dept_lines_v1/);
assert.match(yml,/operatorTaskMode/);
assert.match(yml,/OPERATOR_TASK_MUST_REMAIN_OFF/);
assert.match(yml,/MATERIAL_READY_ACTIVATION=NO/);
assert.match(yml,/ACCOUNTING_MUTATION=NO/);
assert.match(yml,/D1_MUTATION=NO/);
assert.doesNotMatch(yml,/\b(?:INSERT|UPDATE|DELETE|REPLACE)\b/i);
assert.doesNotMatch(yml,/wrangler@[^\\n]+d1 execute[^\\n]+--command/i);
assert.doesNotMatch(yml,/operator_tasks\s+SET/i);
assert.doesNotMatch(yml,/autonomous_readiness_evidence\s*\(/i);

console.log('MATERIAL_POST_CUTOVER_DIAGNOSTIC_WORKFLOW_V1=PASS');
console.log('WORKFLOW_DISPATCH_ONLY=YES');
console.log('PRODUCTION_MUTATION=NO');
console.log('MATERIAL_READY_ACTIVATION=NO');
console.log('OPERATOR_TASK_ACTIVATION=NO');
