import assert from 'node:assert/strict';
import fs from 'node:fs';

const yml=fs.readFileSync('.github/workflows/autonomous-printshop-cloud-design-artifact-diagnostic.yml','utf8');

assert.match(yml,/workflow_dispatch:/);
assert.doesNotMatch(yml,/\n\s*push:/);
assert.doesNotMatch(yml,/\n\s*schedule:/);
assert.match(yml,/FILE_ID_INVALID/);
assert.match(yml,/employee_order_conversation_files_v1/);
assert.match(yml,/READ_ONLY_DIAGNOSTIC=YES/);
assert.match(yml,/ARTIFACT_WRITE=NO/);
assert.match(yml,/APPROVAL_WRITE=NO/);
assert.match(yml,/PREFLIGHT_WRITE=NO/);
assert.match(yml,/READINESS_WRITE=NO/);
assert.match(yml,/OPERATOR_TASK_WRITE=NO/);
assert.doesNotMatch(yml,/\bsed\b/);
assert.doesNotMatch(yml,/INSERT\s+/i);
assert.doesNotMatch(yml,/UPDATE\s+/i);
assert.doesNotMatch(yml,/DELETE\s+/i);

console.log('CLOUD_DESIGN_ARTIFACT_DIAGNOSTIC_WORKFLOW_V1=PASS');
console.log('AUTO_TRIGGER=NO');
console.log('D1_MUTATION=NO');
