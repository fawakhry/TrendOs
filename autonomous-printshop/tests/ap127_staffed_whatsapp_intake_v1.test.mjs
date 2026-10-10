import assert from 'node:assert/strict';
import {classifyStaffedWhatsappIntakeV1 as route}
  from '../core/staffed-whatsapp-intake-v1.mjs';

// All fixtures synthetic. No WhatsApp chat, user photos, Windows folders,
// staff or real order IDs are accessed; no Production state is modified.
const SHA='a'.repeat(64);
const OTHER='b'.repeat(64);
const REVISION='c'.repeat(64);
const NEXT_REVISION='d'.repeat(64);
const SECRET='FAKE_CUSTOMER_NAME_PHONE_DO_NOT_LEAK';
const LINE='SYNTHETIC_PRIVATE_ORDER_LINE';
const base={
  workType:'PHOTO_ASSEMBLY',workArea:'فوتو',workDay:'2026-10-10',
  staffClassified:true,whatsappMediaSavedLocally:true,
  orderInstructionsReviewed:true,finalFileSavedLocally:true,
  finalFileSha256:SHA,printPreflightResult:'PASS',
  staffFinalFileReviewed:true,privateLineId:LINE,
  localAbsolutePath:'C:\\CUSTOMERS\\'+SECRET,
  customerName:SECRET,whatsappMessage:SECRET
};
const receipt={
  receiptId:'FAKE_RECEIPT',artifactId:'FAKE_ARTIFACT',
  lineId:LINE,decision:'APPROVE',actorKind:'CUSTOMER',
  sourceKind:'VERIFIED_IMPORT',sourceRef:'VERIFIED_PROTECTED_WA_IMPORT',
  sourceVersion:'TEST',subjectSha256:SHA,receiptSha256:OTHER,
  observedAtMs:1800000000000,
  artifactExists:true,artifactLineMatches:true,artifactHashMatches:true
};
const expect=(overrides,status)=>{
 const got=route({...base,...overrides});
 assert.equal(got.status,status);
 assert.equal(got.assignmentAllowed,false);
 assert.equal(got.productionReady,false);
 assert.equal(got.productionWriteAllowed,false);
 assert.equal(got.readinessWriteAllowed,false);
 assert.equal(got.operatorTaskActivationAllowed,false);
 assert.equal(got.localFilesWritten,false);
 assert.equal(got.whatsappSendAllowed,false);
 assert.equal(got.automaticWhatsappDownloadAllowed,false);
 assert.equal(got.customerApprovalGrantedByThisModule,false);
 assert.equal(got.approvalSourceIndependentlyVerified,false);
 const serialized=JSON.stringify(got);
 assert.ok(!serialized.includes(SECRET));
 assert.ok(!serialized.includes(LINE));
 assert.ok(!serialized.includes('FAKE_RECEIPT'));
 assert.ok(!serialized.includes(SHA));
 assert.ok(!serialized.includes('FAKE_ARTIFACT'));
 return got;
};
let a=expect({},'MANUAL_PRINT_REVIEW_CANDIDATE');
assert.equal(a.approvalGate,'NO_CUSTOMER_APPROVAL_BY_STAFF_POLICY');
assert.equal(a.humanPrintHandoffCandidate,true);
assert.equal(a.dayFolder,'10-10-2026');
assert.equal(a.areaFolder,'فوتو');
a=expect({workType:'PRINT_READY',workArea:'ديجتال'},'MANUAL_PRINT_REVIEW_CANDIDATE');
assert.equal(a.approvalGate,'NO_CUSTOMER_APPROVAL_BY_STAFF_POLICY');
assert.equal(a.areaFolder,'ديجتال');
expect({staffClassified:false},'STAFF_WORK_TYPE_CLASSIFICATION_REQUIRED');
expect({workType:'كولاج'},'STAFF_WORK_TYPE_CLASSIFICATION_REQUIRED');
expect({workType:'',customerProofRequested:false},'STAFF_WORK_TYPE_CLASSIFICATION_REQUIRED');
expect({workDay:'2026-02-30'},'WORKDAY_DATE_UNVERIFIED');
expect({workDay:'1-1-20226'},'WORKDAY_DATE_UNVERIFIED');
expect({workArea:'ديجيتال'},'WORK_AREA_FOLDER_UNVERIFIED');
expect({whatsappMediaSavedLocally:false},'WHATSAPP_MEDIA_LOCAL_DOWNLOAD_REQUIRED');
expect({orderInstructionsReviewed:false},'STAFF_ORDER_INSTRUCTIONS_REVIEW_REQUIRED');
expect({finalFileSavedLocally:false},'FINAL_PRINT_FILE_VERSION_REQUIRED');
expect({finalFileSha256:'NO_SHA'},'FINAL_PRINT_FILE_VERSION_REQUIRED');
expect({printPreflightResult:'FAIL'},'PRINT_PREFLIGHT_NOT_PASS');
expect({staffFinalFileReviewed:false},'STAFF_FINAL_FILE_REVIEW_REQUIRED');
const design={...base,workType:'CUSTOM_DESIGN',workArea:'ديجتال',
  designOrProofPrepared:true,proofSentToCustomer:true,proofSha256:OTHER,
  designRevisionSha256:REVISION,proofRevisionSha256:REVISION,
  proofFinalArtworkMatchConfirmed:true,
  customerApprovalReceipt:receipt,staffFinalFileReviewed:false};
a=route(design);
assert.equal(a.status,'MANUAL_PRINT_REVIEW_CANDIDATE');
assert.equal(a.approvalGate,'CUSTOMER_APPROVAL_REQUIRED');
assert.equal(a.humanPrintHandoffCandidate,true);
assert.equal(a.productionReady,false);
expect({workType:'CUSTOM_DESIGN'},'CUSTOM_PROOF_NOT_PREPARED');
expect({workType:'CUSTOM_DESIGN',designOrProofPrepared:true},
  'CUSTOMER_PROOF_NOT_SENT');
expect({...design,proofSha256:'NO_HASH'},'PROOF_FILE_HASH_REQUIRED');
expect({...design,proofRevisionSha256:NEXT_REVISION},
  'PROOF_FINAL_ARTWORK_REVISION_UNVERIFIED');
expect({...design,designRevisionSha256:NEXT_REVISION},
  'PROOF_FINAL_ARTWORK_REVISION_UNVERIFIED');
expect({...design,proofFinalArtworkMatchConfirmed:false},
  'PROOF_FINAL_ARTWORK_REVISION_UNVERIFIED');
expect({...design,customerApprovalReceipt:null},
  'AWAITING_CUSTOMER_APPROVAL_RECEIPT');
expect({...design,customerApprovalReceipt:
 {...receipt,lineId:'DIFFERENT_FAKE_LINE'}},
 'CUSTOMER_APPROVAL_SAME_LINE_UNVERIFIED');
expect({...design,customerApprovalReceipt:
 {...receipt,subjectSha256:OTHER}},
 'CUSTOMER_APPROVAL_REVISION_MISMATCH');
expect({...design,customerApprovalReceipt:
 {...receipt,decision:'REJECT'}},
 'CUSTOMER_APPROVAL_RECEIPT_NOT_QUALIFIED');
expect({...design,customerApprovalReceipt:
 {...receipt,artifactHashMatches:false}},
 'CUSTOMER_APPROVAL_RECEIPT_NOT_QUALIFIED');
// Distinct WhatsApp preview-file hash and final print file SHA CAN be valid
// when proof and print output are tied to one immutable artwork revision.
assert.notEqual(design.proofSha256,design.finalFileSha256);
assert.equal(route(design).status,'MANUAL_PRINT_REVIEW_CANDIDATE');
// If customer asks to see a proof for an ordinary collage, the bypass is
// forbidden. The resulting approval receipt still must match exact file.
a=expect({customerProofRequested:true},'CUSTOM_PROOF_NOT_PREPARED');
assert.equal(a.approvalGate,'CUSTOMER_APPROVAL_REQUIRED');
a=expect({workType:'PRINT_READY',customerProofRequested:true},
 'CUSTOM_PROOF_NOT_PREPARED');
assert.equal(a.approvalGate,'CUSTOMER_APPROVAL_REQUIRED');
// Case: Whatsapp "OK" text is NOT a structured version-specific receipt.
expect({...design,customerApprovalReceipt:null,whatsappMessage:'موافق'},
 'AWAITING_CUSTOMER_APPROVAL_RECEIPT');
const versionChanged={...design,finalFileSha256:OTHER};
assert.equal(route(versionChanged).status,'CUSTOMER_APPROVAL_REVISION_MISMATCH');
assert.equal(route({...design,finalFileSha256:OTHER,
  customerApprovalReceipt:{...receipt,subjectSha256:OTHER},
  designRevisionSha256:NEXT_REVISION}).status,
  'PROOF_FINAL_ARTWORK_REVISION_UNVERIFIED');
console.log('AP127_CUSTOM_DESIGN_PROOF_CUSTOMER_REVISION_GATE=PASS');
console.log('AP127_ASSEMBLY_READYPRINT_NO_CUSTOMER_APPROVAL=PASS');
console.log('AP127_MANUAL_DAILY_DIGITAL_PHOTO_FOLDER_LAYOUT=PASS');
console.log('AP127_WHATSAPP_NO_AUTODOWNLOAD_NO_PII=PASS');
console.log('AP127_NO_PRODUCTION_DISPATCH=PASS; D1_WRITES=0; LIVE_ORDER=NOT_TOUCHED');
