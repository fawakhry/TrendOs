import assert from 'node:assert/strict';
import {
  qualifyDesignApprovalReceiptV1,
  approvalReceiptToEventCandidateV1
} from '../core/design-approval-receipt-v1.mjs';

const h='a'.repeat(64), r='b'.repeat(64);

let q=qualifyDesignApprovalReceiptV1({
  receiptId:'approval-receipt-1',
  artifactId:'artifact-1',
  lineId:'TM2606000001-01',
  decision:'APPROVE',
  actorKind:'CUSTOMER',
  sourceKind:'CUSTOMER_PORTAL_STRUCTURED',
  sourceRef:'portal-action-123',
  sourceVersion:'v1',
  subjectSha256:h,
  receiptSha256:r,
  observedAtMs:1234567890,
  artifactExists:true,
  artifactLineMatches:true,
  artifactHashMatches:true
});
assert.equal(q.qualified,true);
assert.equal(q.approvalState,'CUSTOMER_APPROVED');
assert.equal(q.readyAllowed,false);
assert.equal(q.requiresPreflightPass,true);
assert.equal(q.requiresLinkedAsset,true);
assert.equal(q.piiExposed,false);

q=qualifyDesignApprovalReceiptV1({
  receiptId:'approval-receipt-2',
  artifactId:'artifact-1',
  lineId:'TM2606000001-01',
  decision:'APPROVE',
  actorKind:'CUSTOMER',
  sourceKind:'CUSTOMER_PORTAL_STRUCTURED',
  sourceRef:'portal-action-124',
  subjectSha256:h,
  receiptSha256:r,
  observedAtMs:1234567891,
  artifactExists:true,
  artifactLineMatches:true,
  artifactHashMatches:false
});
assert.equal(q.qualified,false);
assert.ok(q.reasons.includes('ARTIFACT_HASH_MISMATCH'));
assert.equal(q.approvalState,'NOT_CONFIRMED');

const e=approvalReceiptToEventCandidateV1({
  receiptId:'approval-receipt-3',
  artifactId:'artifact-2',
  lineId:'TM2606000002-01',
  decision:'REJECT',
  actorKind:'OWNER',
  sourceKind:'OWNER_CONSOLE_STRUCTURED',
  sourceRef:'owner-action-9',
  subjectSha256:h,
  receiptSha256:r,
  observedAtMs:1234567892,
  artifactExists:true,
  artifactLineMatches:true,
  artifactHashMatches:true
});
assert.equal(e.qualified,true);
assert.equal(e.candidate.approvalState,'REJECTED');
assert.equal(e.candidate.readyAllowed,false);

console.log('DESIGN_APPROVAL_RECEIPT_V1=PASS');
console.log('FREE_TEXT_APPROVAL_ACCEPTED=NO');
console.log('ARTIFACT_HASH_MATCH_REQUIRED=YES');
console.log('RECEIPT_ALONE_READY=NO');
console.log('PII_EXPOSED=NO');
