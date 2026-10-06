export const STRUCTURED_OWNER_DESIGN_APPROVAL_COMMAND_VERSION='STRUCTURED_OWNER_DESIGN_APPROVAL_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function safeId(v,label,max=180){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:\/-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function hash(v,label){
  const s=text(v).toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function q(v){return "'"+text(v).replace(/'/g,"''")+"'";}
function json(v){return q(JSON.stringify(v&&typeof v==='object'?v:{}));}

export function buildStructuredOwnerDesignApprovalSqlV1(input={}){
  const receiptId=safeId(input.receiptId,'RECEIPT_ID');
  const approvalEventId=safeId(input.approvalEventId,'APPROVAL_EVENT_ID');
  const artifactId=safeId(input.artifactId,'ARTIFACT_ID');
  const lineId=safeId(input.lineId,'LINE_ID');
  const decision=upper(input.decision);
  const sourceRef=text(input.sourceRef);
  const sourceVersion=text(input.sourceVersion);
  const subjectSha256=hash(input.subjectSha256,'SUBJECT_SHA256');
  const receiptSha256=hash(input.receiptSha256,'RECEIPT_SHA256');
  const observedAtMs=Math.trunc(Number(input.observedAtMs||0));
  const evidence=input.evidence&&typeof input.evidence==='object'?input.evidence:{};

  if(!['APPROVE','REJECT'].includes(decision)) throw new Error('DECISION_INVALID');
  if(!sourceRef) throw new Error('SOURCE_REF_REQUIRED');
  if(!Number.isFinite(observedAtMs)||observedAtMs<=0) throw new Error('OBSERVED_AT_INVALID');

  const approvalState=decision==='APPROVE'?'OWNER_APPROVED':'REJECTED';
  const evidenceRef='approval-receipt:'+receiptId+':'+receiptSha256;

  return [
    "INSERT OR IGNORE INTO autonomous_design_approval_receipts(",
    " receipt_id,artifact_id,line_id,decision,actor_kind,source_kind,source_ref,source_version,subject_sha256,receipt_sha256,observed_at_ms,evidence_json",
    ") SELECT ",
    [
      q(receiptId),q(artifactId),q(lineId),q(decision),"'OWNER'","'OWNER_CONSOLE_STRUCTURED'",
      q(sourceRef),q(sourceVersion),q(subjectSha256),q(receiptSha256),String(observedAtMs),json(evidence)
    ].join(','),
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW')",
    " AND EXISTS(",
    "   SELECT 1 FROM autonomous_design_artifacts",
    "   WHERE artifact_id="+q(artifactId),
    "     AND line_id="+q(lineId),
    "     AND lower(content_sha256)="+q(subjectSha256),
    " );",
    "",
    "INSERT OR IGNORE INTO autonomous_design_approval_events(",
    " approval_event_id,artifact_id,line_id,approval_gate,approval_state,evidence_ref,policy_ref,actor_kind,observed_at_ms",
    ") SELECT ",
    q(approvalEventId)+",r.artifact_id,r.line_id,'REQUIRED',"+q(approvalState)+","+q(evidenceRef)+",'STRUCTURED_DESIGN_APPROVAL_RECEIPT_V1','OWNER',r.observed_at_ms",
    " FROM autonomous_design_approval_receipts r",
    " WHERE r.receipt_id="+q(receiptId),
    "   AND r.artifact_id="+q(artifactId),
    "   AND r.line_id="+q(lineId),
    "   AND r.subject_sha256="+q(subjectSha256),
    "   AND r.receipt_sha256="+q(receiptSha256),
    "   AND r.decision="+q(decision),
    ";"
  ].join('\n');
}
