import assert from 'node:assert/strict';
import {
  qualifyCustomerPortalDesignProvenanceV1,
  portalProvenanceToArtifactCandidateV1
} from '../core/customer-portal-design-provenance-v1.mjs';

const hash='a'.repeat(64);

let q=qualifyCustomerPortalDesignProvenanceV1({
  recordType:'ملف',
  orderId:'TM2606000001',
  lineId:'TM2606000001-01',
  draftId:'DRAFT-1001-20260620-000000-001',
  draftItemId:'DRAFT-1001-20260620-000000-001-I01',
  mimeType:'image/png',
  storageProvider:'GOOGLE_DRIVE',
  storageRef:'drive-file-ref',
  sourceAssetId:'drive-file-id',
  lineExists:true,
  lineOrderMatches:true,
  folderMatches:true,
  sourceVersion:'portal-row-7'
});
assert.equal(q.provenanceQualified,true);
assert.equal(q.artifactEligible,false);
assert.equal(q.reason,'PORTAL_LINE_PROVENANCE_QUALIFIED_HASH_REQUIRED');
assert.equal(q.approvalState,'NOT_CONFIRMED');
assert.equal(q.preflightState,'UNKNOWN');
assert.equal(q.readyAllowed,false);
assert.equal(q.piiExposed,false);

q=qualifyCustomerPortalDesignProvenanceV1({
  recordType:'ملف',
  orderId:'TM2606000001',
  lineId:'',
  mimeType:'image/png',
  storageProvider:'GOOGLE_DRIVE',
  storageRef:'drive-file-ref',
  sourceAssetId:'drive-file-id',
  lineExists:false,
  lineOrderMatches:false
});
assert.equal(q.provenanceQualified,false);
assert.ok(q.reasons.includes('LINE_ID_REQUIRED'));
assert.ok(q.reasons.includes('TRENDOS_LINE_NOT_FOUND'));
assert.equal(q.readyAllowed,false);

q=qualifyCustomerPortalDesignProvenanceV1({
  recordType:'ملف',
  orderId:'TM2606000001',
  lineId:'TM2606000001-01',
  mimeType:'image/png',
  storageProvider:'GOOGLE_DRIVE',
  storageRef:'drive-file-ref',
  sourceAssetId:'drive-file-id',
  lineExists:true,
  lineOrderMatches:true,
  folderMatches:false
});
assert.equal(q.provenanceQualified,false);
assert.ok(q.reasons.includes('LINE_FOLDER_MISMATCH'));

const a=portalProvenanceToArtifactCandidateV1({
  recordType:'ملف',
  orderId:'TM2606000001',
  lineId:'TM2606000001-01',
  draftId:'DRAFT-1001-20260620-000000-001',
  mimeType:'application/pdf',
  storageProvider:'S3_COMPATIBLE',
  storageRef:'bucket/key',
  sourceAssetId:'portal-asset-1',
  contentSha256:hash,
  lineExists:true,
  lineOrderMatches:true,
  folderMatches:true,
  sourceVersion:'portal-v1'
});
assert.equal(a.qualified,true);
assert.equal(a.candidate.sourceKind,'CUSTOMER_UPLOAD');
assert.equal(a.candidate.approvalState,'NOT_CONFIRMED');
assert.equal(a.candidate.preflightState,'UNKNOWN');
assert.equal(a.candidate.readyAllowed,false);

console.log('CUSTOMER_PORTAL_DESIGN_PROVENANCE_V1=PASS');
console.log('LINE_ID_REQUIRED=YES');
console.log('CONTENT_HASH_REQUIRED_FOR_ARTIFACT=YES');
console.log('UPLOAD_IS_APPROVAL=NO');
console.log('UPLOAD_IS_PREFLIGHT_PASS=NO');
console.log('UPLOAD_IS_READY=NO');
