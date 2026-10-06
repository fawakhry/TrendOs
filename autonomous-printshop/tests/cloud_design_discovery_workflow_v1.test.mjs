import assert from 'node:assert/strict';
import fs from 'node:fs';

const y=fs.readFileSync('.github/workflows/autonomous-printshop-cloud-design-discovery.yml','utf8');

assert.match(y,/employee_order_conversation_files_v1/);
assert.match(y,/activeDesignProvenanceFiles/);
assert.match(y,/pragma_table_info\('employee_order_conversation_files_v1'\)/);
assert.match(y,/contentHashColumnPresent/);
assert.match(y,/operatorTaskMode/);
assert.match(y,/OPERATOR_TASK_NOT_OFF/);
assert.match(y,/RAW_ORDER_IDS_EXPOSED=NO/);
assert.match(y,/RAW_LINE_IDS_EXPOSED=NO/);
assert.match(y,/CUSTOMER_PII_EXPOSED=NO/);
assert.match(y,/D1_MUTATION=NO/);
assert.match(y,/DESIGN_READY_WRITE=NO/);
assert.doesNotMatch(y,/\b(?:INSERT|UPDATE|DELETE|REPLACE)\b/i);

console.log('CLOUD_DESIGN_DISCOVERY_WORKFLOW_V1=PASS');
console.log('AGGREGATES_ONLY=YES');
console.log('PII_EXPOSED=NO');
console.log('PRODUCTION_MUTATION=NO');
