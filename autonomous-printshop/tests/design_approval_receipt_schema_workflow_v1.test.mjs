import assert from 'node:assert/strict';
import fs from 'node:fs';

const path='.github/workflows/autonomous-printshop-design-approval-receipt-schema-production-apply.yml';
const yml=fs.readFileSync(path,'utf8');
assert.match(yml,/0029_design_approval_receipt_v1\.sql/);
assert.match(yml,/DESIGN_APPROVAL_RECEIPT_SCHEMA_PREFLIGHT=PASS/);
assert.match(yml,/ACCOUNTING_NOT_CLOSED/);
assert.match(yml,/DESIGN_NOT_SHADOW/);
assert.match(yml,/OPERATOR_TASK_NOT_OFF/);
assert.match(yml,/RECEIPT_SCHEMA_ALREADY_PRESENT_UNEXPECTEDLY/);
assert.match(yml,/DESIGN_APPROVAL_RECEIPT_SCHEMA_PRODUCTION=PASS/);
assert.match(yml,/PRODUCTION_BUSINESS_DATA_MUTATION=NO/);
assert.match(yml,/DESIGN_APPROVAL_RECEIPT_CAPTURE=NO/);
assert.match(yml,/DESIGN_READY_EVIDENCE=NO/);
assert.doesNotMatch(yml,/\\\$\{\{/,'ESCAPED_GITHUB_EXPRESSION_FORBIDDEN');
assert.doesNotMatch(yml,/wrangler@\\\$\{WRANGLER_VERSION\}/,'ESCAPED_WRANGLER_VERSION_FORBIDDEN');
console.log('DESIGN_APPROVAL_RECEIPT_SCHEMA_WORKFLOW_V1=PASS');
