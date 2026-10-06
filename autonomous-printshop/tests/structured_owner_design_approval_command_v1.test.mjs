import assert from 'node:assert/strict';
import { buildStructuredOwnerDesignApprovalSqlV1 } from '../core/structured-owner-design-approval-command-v1.mjs';

const h='a'.repeat(64), r='b'.repeat(64);
const sql=buildStructuredOwnerDesignApprovalSqlV1({
  receiptId:'approval-receipt-123',
  approvalEventId:'approval-event-123',
  artifactId:'artifact-123',
  lineId:'TM2606000001-01',
  decision:'APPROVE',
  sourceRef:'github:fawakhry/TrendOs:123:1',
  sourceVersion:'run-123',
  subjectSha256:h,
  receiptSha256:r,
  observedAtMs:1234567890,
  evidence:{structuredOwnerAction:true}
});
assert.match(sql,/INSERT OR IGNORE INTO autonomous_design_approval_receipts/);
assert.match(sql,/OWNER_CONSOLE_STRUCTURED/);
assert.match(sql,/autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW'/);
assert.match(sql,/autonomous_design_artifacts/);
assert.match(sql,/lower\(content_sha256\)/);
assert.match(sql,/INSERT OR IGNORE INTO autonomous_design_approval_events/);
assert.match(sql,/OWNER_APPROVED/);
assert.match(sql,/STRUCTURED_DESIGN_APPROVAL_RECEIPT_V1/);
assert.doesNotMatch(sql,/autonomous_design_preflight_runs/);
assert.doesNotMatch(sql,/autonomous_readiness_evidence/);
assert.doesNotMatch(sql,/operator_tasks/);
assert.doesNotMatch(sql,/employee_accounting_/);
assert.doesNotMatch(sql,/t12_prod_(?:orders|lines)/);

const reject=buildStructuredOwnerDesignApprovalSqlV1({
  receiptId:'approval-receipt-124',
  approvalEventId:'approval-event-124',
  artifactId:'artifact-124',
  lineId:'TM2606000002-01',
  decision:'REJECT',
  sourceRef:'github:fawakhry/TrendOs:124:1',
  sourceVersion:'run-124',
  subjectSha256:h,
  receiptSha256:r,
  observedAtMs:1234567891
});
assert.match(reject,/REJECTED/);

assert.throws(()=>buildStructuredOwnerDesignApprovalSqlV1({
  receiptId:'x',approvalEventId:'y',artifactId:'z',lineId:'l',
  decision:'APPROVE',sourceRef:'s',subjectSha256:'bad',receiptSha256:r,observedAtMs:1
}),/SUBJECT_SHA256_INVALID/);

console.log('STRUCTURED_OWNER_DESIGN_APPROVAL_COMMAND_V1=PASS');
console.log('ARTIFACT_LINE_HASH_MATCH_REQUIRED=YES');
console.log('PREFLIGHT_WRITE=NO');
console.log('READINESS_WRITE=NO');
console.log('ACCOUNTING_WRITE=NO');
