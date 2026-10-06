export const DESIGN_APPROVAL_RECEIPT_VERSION='DESIGN_APPROVAL_RECEIPT_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function hash(v){const s=text(v).toLowerCase();return /^[a-f0-9]{64}$/.test(s)?s:'';}

export function qualifyDesignApprovalReceiptV1(input={}){
  const receiptId=text(input.receiptId||input.receipt_id);
  const artifactId=text(input.artifactId||input.artifact_id);
  const lineId=text(input.lineId||input.line_id);
  const decision=upper(input.decision);
  const actorKind=upper(input.actorKind||input.actor_kind);
  const sourceKind=upper(input.sourceKind||input.source_kind);
  const sourceRef=text(input.sourceRef||input.source_ref);
  const sourceVersion=text(input.sourceVersion||input.source_version);
  const subjectSha256=hash(input.subjectSha256||input.subject_sha256);
  const receiptSha256=hash(input.receiptSha256||input.receipt_sha256);
  const observedAtMs=Number(input.observedAtMs??input.observed_at_ms??0);
  const artifactExists=input.artifactExists===true;
  const artifactLineMatches=input.artifactLineMatches===true;
  const artifactHashMatches=input.artifactHashMatches===true;

  const reasons=[];
  if(!receiptId) reasons.push('RECEIPT_ID_REQUIRED');
  if(!artifactId) reasons.push('ARTIFACT_ID_REQUIRED');
  if(!lineId) reasons.push('LINE_ID_REQUIRED');
  if(!['APPROVE','REJECT'].includes(decision)) reasons.push('DECISION_INVALID');
  if(!['CUSTOMER','OWNER'].includes(actorKind)) reasons.push('ACTOR_KIND_INVALID');
  if(!['CUSTOMER_PORTAL_STRUCTURED','OWNER_CONSOLE_STRUCTURED','VERIFIED_IMPORT'].includes(sourceKind)) reasons.push('SOURCE_KIND_INVALID');
  if(!sourceRef) reasons.push('SOURCE_REF_REQUIRED');
  if(!subjectSha256) reasons.push('SUBJECT_SHA256_REQUIRED');
  if(!receiptSha256) reasons.push('RECEIPT_SHA256_REQUIRED');
  if(!Number.isFinite(observedAtMs)||observedAtMs<=0) reasons.push('OBSERVED_AT_REQUIRED');
  if(!artifactExists) reasons.push('ARTIFACT_NOT_FOUND');
  if(!artifactLineMatches) reasons.push('ARTIFACT_LINE_MISMATCH');
  if(!artifactHashMatches) reasons.push('ARTIFACT_HASH_MISMATCH');

  const qualified=reasons.length===0;
  const approvalState=qualified
    ? (decision==='APPROVE'?(actorKind==='CUSTOMER'?'CUSTOMER_APPROVED':'OWNER_APPROVED'):'REJECTED')
    : 'NOT_CONFIRMED';

  return {
    version:DESIGN_APPROVAL_RECEIPT_VERSION,
    qualified,
    approvalState,
    readyAllowed:false,
    requiresPreflightPass:true,
    requiresLinkedAsset:true,
    receiptId,
    artifactId,
    lineId,
    decision,
    actorKind,
    sourceKind,
    sourceRef,
    sourceVersion,
    subjectSha256,
    receiptSha256,
    observedAtMs,
    reasons,
    piiExposed:false
  };
}

export function approvalReceiptToEventCandidateV1(input={}){
  const q=qualifyDesignApprovalReceiptV1(input);
  if(!q.qualified) return {qualified:false,reason:q.reasons[0]||'RECEIPT_NOT_QUALIFIED',candidate:null};
  return {
    qualified:true,
    reason:'STRUCTURED_APPROVAL_RECEIPT_QUALIFIED',
    candidate:{
      artifactId:q.artifactId,
      lineId:q.lineId,
      approvalGate:'REQUIRED',
      approvalState:q.approvalState,
      actorKind:q.actorKind,
      evidenceRef:q.sourceRef,
      policyRef:'STRUCTURED_DESIGN_APPROVAL_RECEIPT_V1',
      observedAtMs:q.observedAtMs,
      receiptId:q.receiptId,
      receiptSha256:q.receiptSha256,
      subjectSha256:q.subjectSha256,
      readyAllowed:false
    }
  };
}
