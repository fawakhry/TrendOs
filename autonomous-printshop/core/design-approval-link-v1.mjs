export const DESIGN_APPROVAL_LINK_VERSION='AUTONOMOUS_DESIGN_APPROVAL_LINK_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function safeId(v,label,max=160){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:\/-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function hex64(v){return /^[a-f0-9]{64}$/.test(text(v).toLowerCase());}
function q(v){return "'" + text(v).replace(/'/g,"''") + "'";}

export async function sha256HexApprovalTokenV1(token){
  const value=text(token);
  if(value.length<32) throw new Error('APPROVAL_TOKEN_TOO_SHORT');
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function qualifyDesignApprovalOfferV1(input={}){
  const offerId=text(input.offerId);
  const artifactId=text(input.artifactId);
  const lineId=text(input.lineId);
  const tokenSha256=text(input.tokenSha256).toLowerCase();
  const createdAtMs=Number(input.createdAtMs);
  const expiresAtMs=Number(input.expiresAtMs);
  const sourceRef=text(input.sourceRef);
  const createdBy=text(input.createdBy);
  const reasons=[];
  try{safeId(offerId,'OFFER_ID');}catch{reasons.push('OFFER_ID_INVALID');}
  try{safeId(artifactId,'ARTIFACT_ID');}catch{reasons.push('ARTIFACT_ID_INVALID');}
  try{safeId(lineId,'LINE_ID');}catch{reasons.push('LINE_ID_INVALID');}
  if(!hex64(tokenSha256)) reasons.push('TOKEN_SHA256_INVALID');
  if(!Number.isFinite(createdAtMs)||createdAtMs<=0) reasons.push('CREATED_AT_INVALID');
  if(!Number.isFinite(expiresAtMs)||expiresAtMs<=createdAtMs) reasons.push('EXPIRY_INVALID');
  if(Number.isFinite(expiresAtMs)&&Number.isFinite(createdAtMs)&&expiresAtMs-createdAtMs>7*24*60*60*1000) reasons.push('EXPIRY_TOO_LONG');
  if(!sourceRef) reasons.push('SOURCE_REF_REQUIRED');
  if(!createdBy) reasons.push('CREATED_BY_REQUIRED');
  return {
    version:DESIGN_APPROVAL_LINK_VERSION,
    qualified:reasons.length===0,
    reasons,
    offerId,artifactId,lineId,tokenSha256,createdAtMs,expiresAtMs,sourceRef,createdBy,
    approvalGranted:false
  };
}

export function buildDesignApprovalOfferSqlV1(input={}){
  const x=qualifyDesignApprovalOfferV1(input);
  if(!x.qualified) throw new Error(x.reasons[0]||'APPROVAL_OFFER_NOT_QUALIFIED');
  return [
    "INSERT INTO autonomous_design_approval_link_offers(",
    " offer_id,artifact_id,line_id,token_sha256,expires_at_ms,source_ref,created_by,created_at_ms",
    ") SELECT ",
    [x.offerId,x.artifactId,x.lineId,x.tokenSha256,x.expiresAtMs,x.sourceRef,x.createdBy,x.createdAtMs].map(q).join(','),
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW')",
    " AND EXISTS(SELECT 1 FROM autonomous_design_artifacts WHERE artifact_id="+q(x.artifactId)+" AND line_id="+q(x.lineId)+");"
  ].join('\n');
}

export function buildDesignApprovalRedemptionSqlV1(input={}){
  const redemptionId=safeId(input.redemptionId,'REDEMPTION_ID');
  const tokenSha256=text(input.tokenSha256).toLowerCase();
  const decision=upper(input.decision);
  const evidenceRef=text(input.evidenceRef);
  const observedAtMs=Number(input.observedAtMs);
  if(!hex64(tokenSha256)) throw new Error('TOKEN_SHA256_INVALID');
  if(!['APPROVE','REJECT'].includes(decision)) throw new Error('DECISION_INVALID');
  if(!evidenceRef) throw new Error('EVIDENCE_REF_REQUIRED');
  if(!Number.isFinite(observedAtMs)||observedAtMs<=0) throw new Error('OBSERVED_AT_INVALID');
  const state=decision==='APPROVE'?'CUSTOMER_APPROVED':'REJECTED';
  const approvalEventId='approval-'+redemptionId;

  return [
    "BEGIN IMMEDIATE;",
    "INSERT INTO autonomous_design_approval_link_redemptions(",
    " redemption_id,offer_id,artifact_id,line_id,decision,evidence_ref,observed_at_ms",
    ") SELECT ",
    q(redemptionId)+",o.offer_id,o.artifact_id,o.line_id,"+q(decision)+","+q(evidenceRef)+","+String(Math.trunc(observedAtMs)),
    " FROM autonomous_design_approval_link_offers o",
    " JOIN autonomous_design_artifacts a ON a.artifact_id=o.artifact_id AND a.line_id=o.line_id",
    " WHERE o.token_sha256="+q(tokenSha256),
    " AND o.expires_at_ms>="+String(Math.trunc(observedAtMs)),
    " AND NOT EXISTS(SELECT 1 FROM autonomous_design_approval_link_redemptions r WHERE r.offer_id=o.offer_id)",
    " AND NOT EXISTS(SELECT 1 FROM autonomous_design_artifacts newer WHERE newer.line_id=a.line_id AND newer.created_at_ms>a.created_at_ms);",
    "INSERT INTO autonomous_design_approval_events(",
    " approval_event_id,artifact_id,line_id,approval_gate,approval_state,evidence_ref,policy_ref,actor_kind,observed_at_ms",
    ") SELECT ",
    q(approvalEventId)+",r.artifact_id,r.line_id,'REQUIRED',"+q(state)+",r.evidence_ref,'APPROVAL_LINK_V1','CUSTOMER',r.observed_at_ms",
    " FROM autonomous_design_approval_link_redemptions r",
    " WHERE r.redemption_id="+q(redemptionId)+";",
    "COMMIT;"
  ].join('\n');
}
