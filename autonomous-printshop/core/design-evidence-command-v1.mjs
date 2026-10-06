export const DESIGN_EVIDENCE_COMMAND_VERSION='DESIGN_EVIDENCE_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function safeId(v,label,max=120){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:\/-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function q(v){return "'"+text(v).replace(/'/g,"''")+"'";}
function json(v){return q(JSON.stringify(v&&typeof v==='object'?v:{}));}

export function buildMatbagyDesignEvidenceBundleSqlV1(input={}){
  const artifactId=safeId(input.artifactId,'ARTIFACT_ID');
  const bindingEventId=safeId(input.bindingEventId,'BINDING_EVENT_ID');
  const approvalEventId=safeId(input.approvalEventId,'APPROVAL_EVENT_ID');
  const preflightRunId=safeId(input.preflightRunId,'PREFLIGHT_RUN_ID');
  const tenantId=safeId(input.tenantId||'TENANT_001','TENANT_ID');
  const caseId=safeId(input.caseId,'CASE_ID');
  const versionId=text(input.versionId);
  const orderId=safeId(input.orderId,'ORDER_ID');
  const lineId=safeId(input.lineId,'LINE_ID');
  const contentSha256=text(input.contentSha256).toLowerCase();
  const storageProvider=upper(input.storageProvider);
  const storageRef=text(input.storageRef);
  const sourceAssetId=safeId(input.sourceAssetId,'SOURCE_ASSET_ID');
  const privacyClass=upper(input.privacyClass||'UNKNOWN');
  const approvalStatus=upper(input.approvalStatus);
  const approvalActorKind=upper(input.approvalActorKind);
  const approvalEvidenceRef=text(input.approvalEvidenceRef);
  const recipeId=safeId(input.recipeId,'RECIPE_ID');
  const productType=text(input.productType);
  const mimeType=text(input.mimeType);
  const checks=input.checks&&typeof input.checks==='object'?input.checks:{};

  if(!/^[a-f0-9]{64}$/.test(contentSha256)) throw new Error('CONTENT_SHA256_INVALID');
  if(!storageProvider||!storageRef) throw new Error('LINKED_STORAGE_REQUIRED');
  if(!['PUBLIC_SAFE','CUSTOMER_PRIVATE','UNKNOWN'].includes(privacyClass)) throw new Error('PRIVACY_CLASS_INVALID');
  if(privacyClass==='CUSTOMER_PRIVATE'&&['GITHUB_PUBLIC','PUBLIC_GIT','PUBLIC_URL'].includes(storageProvider)){
    throw new Error('PRIVATE_PUBLIC_STORAGE_FORBIDDEN');
  }
  if(!['FINAL_APPROVED','EXPLICITLY_LIKED'].includes(approvalStatus)) throw new Error('APPROVAL_STATUS_NOT_QUALIFIED');
  if(!['CUSTOMER','OWNER'].includes(approvalActorKind)) throw new Error('APPROVAL_ACTOR_KIND_INVALID');
  if(!approvalEvidenceRef) throw new Error('APPROVAL_EVIDENCE_REF_REQUIRED');

  const internalApproval=approvalActorKind==='CUSTOMER'?'CUSTOMER_APPROVED':'OWNER_APPROVED';

  return [
    "INSERT OR IGNORE INTO autonomous_design_artifacts(",
    " artifact_id,line_id,case_id,version_id,product_type,content_sha256,storage_provider,storage_ref,mime_type,source_kind,source_ref,created_at_ms",
    ") SELECT ",
    q(artifactId)+","+q(lineId)+","+q(caseId)+","+q(versionId)+","+q(productType)+","+q(contentSha256)+","+q(storageProvider)+","+q(storageRef)+","+q(mimeType)+",'MATBAGY_CASE',"+q(caseId+':'+sourceAssetId)+",CAST(strftime('%s','now') AS INTEGER)*1000",
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW')",
    " AND EXISTS(",
    "   SELECT 1 FROM (",
    "     SELECT order_id,line_id FROM employee_core_lines_v1",
    "     UNION ALL",
    "     SELECT order_id,line_id FROM t12_prod_lines",
    "   ) q WHERE q.order_id="+q(orderId)+" AND q.line_id="+q(lineId),
    " );",
    "",
    "INSERT OR IGNORE INTO autonomous_design_asset_binding_events(",
    " binding_event_id,artifact_id,tenant_id,binding_status,privacy_class,storage_provider,storage_ref,source_asset_id,source_ref,observed_at_ms",
    ") SELECT ",
    q(bindingEventId)+","+q(artifactId)+","+q(tenantId)+",'LINKED',"+q(privacyClass)+","+q(storageProvider)+","+q(storageRef)+","+q(sourceAssetId)+","+q(caseId)+",CAST(strftime('%s','now') AS INTEGER)*1000",
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_artifacts WHERE artifact_id="+q(artifactId)+");",
    "",
    "INSERT OR IGNORE INTO autonomous_design_approval_events(",
    " approval_event_id,artifact_id,line_id,approval_gate,approval_state,evidence_ref,policy_ref,actor_kind,observed_at_ms",
    ") SELECT ",
    q(approvalEventId)+","+q(artifactId)+","+q(lineId)+",'REQUIRED',"+q(internalApproval)+","+q(approvalEvidenceRef)+",'',"+q(approvalActorKind)+",CAST(strftime('%s','now') AS INTEGER)*1000",
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_artifacts WHERE artifact_id="+q(artifactId)+");",
    "",
    "INSERT OR IGNORE INTO autonomous_design_preflight_runs(",
    " preflight_run_id,artifact_id,line_id,result,recipe_id,policy_version,checks_json,observed_at_ms",
    ") SELECT ",
    q(preflightRunId)+","+q(artifactId)+","+q(lineId)+",'UNKNOWN',"+q(recipeId)+",'manual-import-v1',"+json({...checks,preflightQualified:false})+",CAST(strftime('%s','now') AS INTEGER)*1000",
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_artifacts WHERE artifact_id="+q(artifactId)+");"
  ].join('\n');
}
