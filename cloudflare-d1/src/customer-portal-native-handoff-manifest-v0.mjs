/* Entry679 — OFF-source-only bounded D1 customer draft handoff inventory.
 * NOT a T12 delegated writer or an atomic/sealed draft snapshot. No D1/R2
 * mutation. It cannot certify binary bytes or capture a consistent cross-read
 * snapshot while customer draft mutations are still possible.
 */
import { fingerprintCustomerSessionV0 } from './customer-portal-native-orders-v0.mjs';
import {
 CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0,
} from './customer-portal-native-submit-preflight-v0.mjs';

export const CUSTOMER_DRAFT_HANDOFF_MANIFEST_VERSION_V0='ENTRY679_CUSTOMER_HANDOFF_MANIFEST_READONLY_OFF_V0';
export const CUSTOMER_DRAFT_HANDOFF_FILES_SQL_V0=`
SELECT f.file_id AS fileId,f.draft_id AS draftId,f.item_id AS itemId,
       f.customer_id AS customerId,f.state AS fileState,
       f.content_type AS contentType,f.byte_size AS byteSize,
       f.sha256_hex AS sha256Hex,f.r2_object_key AS objectKey,
       f.created_at_ms AS createdAtMs,f.updated_at_ms AS updatedAtMs
  FROM customer_portal_native_draft_files_v1 f
 WHERE f.draft_id=?
 ORDER BY f.item_id,f.file_id
 LIMIT 251
`;
const HEX=/^[0-9a-f]{32}$/;
const HEX64=/^[0-9a-f]{64}$/;
const validId=(v,p)=>typeof v==='string'&&v.startsWith(p)&&HEX.test(v.slice(p.length));
const safeInt=(v,min,max)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const fail=(code,status=409)=>({status,body:{
 success:false,code,readOnly:true,diagnosticOnly:true,
 snapshotSealed:false,atomicConsistencyVerified:false,
 handoffReady:false,officialOrderCreated:false,productionWriteAuthorized:false
}});
function itemSafe(row,index){
 return validId(row.itemId,'CDI-')&&
   safeInt(row.ordinal,index+1,index+1)&&
   ['طباعة','ليزر'].includes(row.department)&&
   typeof row.itemName==='string'&&row.itemName===row.itemName.trim()&&
   row.itemName.length>=1&&row.itemName.length<=120&&
   safeInt(row.qty,1,99)&&typeof row.notes==='string'&&row.notes.length<=1000&&
   safeInt(row.heatPress,0,1)&&safeInt(row.flyPrint,0,1)&&
   (row.department==='طباعة'||(row.heatPress===0&&row.flyPrint===0));
}
function fileSafe(row,draftId,customerId,items,counts){
 if(!validId(row.fileId,'CDF-')||
    row.draftId!==draftId||row.customerId!==customerId||
    !items.has(row.itemId)||row.fileState!=='READY'||
    !['image/png','image/jpeg','application/pdf'].includes(row.contentType)||
    !safeInt(row.byteSize,8,5*1024*1024)||
    typeof row.sha256Hex!=='string'||!HEX64.test(row.sha256Hex)||
    row.objectKey!=='customer-drafts/'+row.fileId||
    !safeInt(row.createdAtMs,1,Number.MAX_SAFE_INTEGER)||
    !safeInt(row.updatedAtMs,row.createdAtMs,Number.MAX_SAFE_INTEGER))
   return false;
 counts.set(row.itemId,(counts.get(row.itemId)||0)+1);
 return counts.get(row.itemId)<=5;
}
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
export async function inspectNativeCustomerDraftHandoffManifestV0({
 db,token,secret,draftId,nowMs
}={}){
 if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
    !safeInt(nowMs,1500000000000,Number.MAX_SAFE_INTEGER))
   return fail('MANIFEST_BACKEND_UNAVAILABLE',503);
 if(typeof token!=='string'||!HEX64.test(token))
   return fail('CUSTOMER_SESSION_REJECTED',401);
 if(!validId(draftId,'CDR-'))return fail('MANIFEST_DRAFT_ID_INVALID',400);
 try{
  const mac=await fingerprintCustomerSessionV0(token,secret);
  const owner=await db.prepare(CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0)
   .bind(draftId,mac,nowMs,nowMs).first();
  if(!owner||owner.draftId!==draftId||
     typeof owner.customerId!=='string'||!owner.customerId||
     !safeInt(owner.createdAtMs,1,nowMs+60000)||
     typeof owner.customerName!=='string'||!owner.customerName.trim()||
     typeof owner.customerPhone!=='string')
    return fail('MANIFEST_DRAFT_OWNER_UNAUTHORIZED',404);
  const itemResult=await db.prepare(CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0)
   .bind(draftId).all();
  if(!itemResult||!Array.isArray(itemResult.results))
    return fail('MANIFEST_ITEM_READ_UNAVAILABLE',503);
  const itemRows=itemResult.results;
  if(itemRows.length<1||itemRows.length>50)
    return fail('MANIFEST_ITEM_COUNT_INVALID');
  if(!itemRows.every(itemSafe))
    return fail('MANIFEST_ITEMS_INVALID_OR_NON_CONTIGUOUS');
  const itemIds=new Set(itemRows.map(r=>r.itemId));
  if(itemIds.size!==itemRows.length)
    return fail('MANIFEST_DUPLICATE_ITEM_ID');
  const fileResult=await db.prepare(CUSTOMER_DRAFT_HANDOFF_FILES_SQL_V0)
   .bind(draftId).all();
  if(!fileResult||!Array.isArray(fileResult.results))
    return fail('MANIFEST_FILE_READ_UNAVAILABLE',503);
  const fileRows=fileResult.results;
  if(fileRows.length>250)return fail('MANIFEST_FILE_CAP_EXCEEDED');
  const counts=new Map(),fileIds=new Set();
  for(const file of fileRows){
   if(!fileSafe(file,draftId,owner.customerId,itemIds,counts)||
      fileIds.has(file.fileId))
     return fail('MANIFEST_FILE_UNREADY_OR_CONTRACT_INVALID');
   fileIds.add(file.fileId);
  }
  // This digest covers exact metadata from the observed reads only. It is
  // never a credential, a signed T12 command, a full-byte R2 hash proof,
  // a transaction-level seal, or a replacement for a persisted manifest.
  const raw=JSON.stringify([
   CUSTOMER_DRAFT_HANDOFF_MANIFEST_VERSION_V0,draftId,owner.customerId,
   owner.createdAtMs,owner.customerName,owner.customerPhone,
   itemRows.map(x=>[x.itemId,x.ordinal,x.department,x.itemName,
     x.qty,x.notes,x.heatPress,x.flyPrint]),
   fileRows.map(x=>[x.fileId,x.itemId,x.sha256Hex,x.byteSize,
     x.contentType,x.objectKey,x.createdAtMs,x.updatedAtMs])
  ]);
  const manifestDigest=hex(new Uint8Array(await crypto.subtle.digest(
    'SHA-256',new TextEncoder().encode(raw))));
  // Internal diagnostic only. NO manifest content, owner PII or R2 keys.
  return {status:200,body:{
   success:true,version:CUSTOMER_DRAFT_HANDOFF_MANIFEST_VERSION_V0,
   readOnly:true,diagnosticOnly:true,manifestDigest,
   itemCount:itemRows.length,fileCount:fileRows.length,
   snapshotSealed:false,atomicConsistencyVerified:false,
   r2FullBytesVerified:false,readyFileMetadataOnly:true,
   handoffReady:false,needsTrustedAtomicHandoff:true,
   needsExistingT12Writer:true,officialOrderCreated:false,
   productionWriteAuthorized:false
  }};
 }catch{return fail('MANIFEST_SCHEMA_OR_READ_UNAVAILABLE',503);}
}
export const CUSTOMER_DRAFT_HANDOFF_MANIFEST_POLICY_V0=Object.freeze({
 sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
 crossReadAtomic:false,immutableSnapshot:false,
 r2FullBytesVerified:false,manifestPersisted:false,
 maxItems:50,maxFilesPerItem:5,productionRelease:'NO_GO'
});
