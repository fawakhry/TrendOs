/* Entry675 — read-only PRIVATE R2 PENDING triage, not a reconciler writer.
 * No Worker route, no R2 mutation, no draft/file READY transition, no delete.
 * Inspect only opaque object keys read from the existing D1 file ledger.
 */
export const CUSTOMER_R2_PENDING_AUDIT_VERSION_V0='ENTRY675_CUSTOMER_R2_PENDING_READONLY_AUDIT_OFF_V0';
export const CUSTOMER_R2_PENDING_MIN_AGE_MS_V0=15*60*1000;
export const CUSTOMER_R2_PENDING_AUDIT_SQL_V0=`
SELECT f.file_id AS fileId,f.state AS fileState,
       f.r2_object_key AS objectKey,f.sha256_hex AS sha256Hex,
       f.byte_size AS byteSize,f.content_type AS contentType,
       f.created_at_ms AS createdAtMs,f.updated_at_ms AS updatedAtMs,
       d.state AS draftState
  FROM customer_portal_native_draft_files_v1 f
  JOIN customer_portal_native_draft_items_v1 i ON i.item_id=f.item_id
  JOIN customer_portal_native_drafts_v1 d ON d.draft_id=f.draft_id
 WHERE f.file_id=? AND f.state='PENDING'
   AND f.customer_id=d.customer_id AND i.draft_id=f.draft_id
 LIMIT 1
`;
const fileIdValid=x=>typeof x==='string'&&/^CDF-[a-f0-9]{32}$/.test(x);
const isInt=x=>Number.isSafeInteger(x)&&x>=0;
const response=(code,inspected=false)=>({
  success:false,source:'customer-r2-pending-audit-v0',
  version:CUSTOMER_R2_PENDING_AUDIT_VERSION_V0,code,
  inspected,fileReady:false,readyTransitionAuthorized:false,
  objectDeletionAuthorized:false,contentHashVerified:false,
  canAutoRetry:false,productionRelease:'NO_GO'
});
export async function auditNativeCustomerPendingR2V0({db,bucket,fileId,nowMs}={}){
 if(!fileIdValid(fileId))return response('PENDING_FILE_ID_INVALID');
 if(!db||typeof db.prepare!=='function'||!bucket||
    typeof bucket.head!=='function'||!Number.isSafeInteger(nowMs)||
    nowMs<1500000000000)return response('PENDING_AUDIT_DEPENDENCY_UNAVAILABLE');
 try{
   const row=await db.prepare(CUSTOMER_R2_PENDING_AUDIT_SQL_V0).bind(fileId).first();
   if(!row||row.fileId!==fileId||row.fileState!=='PENDING')
     return response('PENDING_LEDGER_UNAVAILABLE');
   const validKey=row.objectKey==='customer-drafts/'+fileId;
   const validType=['image/png','image/jpeg','application/pdf'].includes(row.contentType);
   const validDigest=typeof row.sha256Hex==='string'&&/^[a-f0-9]{64}$/.test(row.sha256Hex);
   if(!validKey||!validType||!validDigest||
      !isInt(row.byteSize)||row.byteSize<8||row.byteSize>5*1024*1024||
      !isInt(row.createdAtMs)||!isInt(row.updatedAtMs)||
      row.updatedAtMs<row.createdAtMs||row.updatedAtMs>nowMs||
      row.draftState!=='DRAFT')
     return response('PENDING_LEDGER_SCOPE_OR_METADATA_INVALID');
   if(nowMs-row.updatedAtMs<CUSTOMER_R2_PENDING_MIN_AGE_MS_V0)
     return response('PENDING_UPLOAD_MAY_BE_IN_FLIGHT');
   // R2 HEAD does NOT verify the full SHA256 body or prove user authorization.
   // Even a matching object can NEVER be marked READY by this auditor.
   const object=await bucket.head(row.objectKey);
   if(!object)return response('PENDING_R2_OBJECT_ABSENT_MANUAL_REVIEW',true);
   if(!isInt(object.size)||object.size!==row.byteSize||
      object.httpMetadata?.contentType!==row.contentType||
      object.customMetadata?.source!=='trendos-customer-draft-v0')
     return response('PENDING_R2_METADATA_CONFLICT_MANUAL_REVIEW',true);
   return response('PENDING_R2_PRESENT_HASH_AND_AUTH_REVIEW_REQUIRED',true);
 }catch{
   return response('PENDING_LEDGER_OR_R2_INSPECTION_FAILED');
 }
}
export const CUSTOMER_R2_PENDING_AUDIT_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
  r2HeadOnly:true,r2ReadBody:false,r2Put:false,r2Delete:false,
  fileReadyMutation:false,verifiedFullSha256:false,
  autonomousReconciliation:false,productionRelease:'NO_GO'
});
