/* Zero Google customer isolated Stage — READONLY PRIVATE R2 integrity check.
 * No malware scanning/printing/approval/T12 order submission. Default OFF.
 * Hash equality proves only bytes match the D1 staged hash at read time.
 */
import {fingerprintCustomerSessionV0,CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0}
  from '../src/customer-portal-native-orders-v0.mjs';
import {classifyNativeCustomerFileV0,CUSTOMER_NATIVE_FILE_MAX_BYTES_V0}
  from '../src/customer-portal-native-draft-file-r2-v0.mjs';
export const CUSTOMER_PRIVATE_R2_INTEGRITY_PATH_V0=
  /^\/v1\/customer\/native\/drafts\/(CDR-[0-9a-f]{32})\/files-integrity$/;
const digestHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const okHex=(s,n)=>typeof s==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(s);
const block=(status,code)=>({status,body:{
  success:false,code,integrityNowVerified:false,malwareScanComplete:false,
  officialOrderCreated:false,productionWriteAuthorized:false,
  source:'customer-private-r2-integrity-stage-v0'
}});
const MAX_FILES=5;
export const CUSTOMER_R2_INTEGRITY_DRAFT_SQL_V0=`
SELECT d.draft_id AS draftId
  FROM customer_portal_native_drafts_v1 d
 WHERE d.draft_id=? AND d.customer_id=? AND d.state='DRAFT'
 LIMIT 1
`;
export const CUSTOMER_R2_INTEGRITY_ROWS_SQL_V0=`
SELECT f.file_id AS fileId,f.item_id AS itemId,
       f.sha256_hex AS sha256Hex,f.byte_size AS byteSize,
       f.content_type AS contentType,f.r2_object_key AS objectKey,
       f.state AS state,f.updated_at_ms AS updatedAtMs
  FROM customer_portal_native_draft_files_v1 f
  JOIN customer_portal_native_drafts_v1 d ON d.draft_id=f.draft_id
  JOIN customer_portal_native_draft_items_v1 i ON i.item_id=f.item_id
 WHERE d.draft_id=? AND d.customer_id=? AND d.state='DRAFT'
   AND f.customer_id=d.customer_id AND i.draft_id=d.draft_id
 ORDER BY f.file_id ASC
 LIMIT 6
`;
// Immutable quarantine is the required default for ALL private R2 staged files.
// D1 READY + matching R2 SHA256 is still NOT a malware/print clearance.
export const CUSTOMER_R2_QUARANTINE_ROWS_SQL_V0=`
SELECT q.file_id AS fileId,q.sha256_hex AS sha256Hex,
       q.byte_size AS byteSize,q.content_type AS contentType,
       q.disposition AS disposition,q.scan_completed AS scanCompleted,
       q.print_release_authorized AS printReleaseAuthorized
 FROM customer_portal_native_file_quarantine_v1 q
 JOIN customer_portal_native_draft_files_v1 f ON f.file_id=q.file_id
 WHERE f.draft_id=? AND f.customer_id=? AND q.draft_id=f.draft_id
   AND q.customer_id=f.customer_id AND q.item_id=f.item_id
 ORDER BY q.file_id ASC LIMIT 6
`;
function quarantineMatches(quarantines,files){
  return quarantines.length===files.length&&files.every((row,i)=>{
    const q=quarantines[i];
    return q&&q.fileId===row.fileId&&q.sha256Hex===row.sha256Hex&&
      Number(q.byteSize)===row.byteSize&&q.contentType===row.contentType&&
      q.disposition==='QUARANTINED'&&Number(q.scanCompleted)===0&&
      Number(q.printReleaseAuthorized)===0;
  });
}
const cleanRow=r=>r&&typeof r==='object'&&
  typeof r.fileId==='string'&&/^CDF-[0-9a-f]{32}$/.test(r.fileId)&&
  typeof r.itemId==='string'&&/^CDI-[0-9a-f]{32}$/.test(r.itemId)&&
  okHex(r.sha256Hex,64)&&Number.isSafeInteger(r.byteSize)&&
  r.byteSize>=8&&r.byteSize<=CUSTOMER_NATIVE_FILE_MAX_BYTES_V0&&
  ['image/png','image/jpeg','application/pdf'].includes(r.contentType)&&
  r.objectKey==='customer-drafts/'+r.fileId&&r.state==='READY'&&
  Number.isSafeInteger(r.updatedAtMs)&&r.updatedAtMs>0;
function snap(rows){
  return JSON.stringify(rows.map(r=>[
    r.fileId,r.itemId,r.sha256Hex,r.byteSize,r.contentType,
    r.objectKey,r.state,r.updatedAtMs
  ]));
}
export async function inspectCustomerPrivateR2IntegrityV0({
  db,bucket,token,secret,draftId,nowMs,clock=()=>Date.now()
}={}){
  if(!db||typeof db.prepare!=='function'||!bucket||
     typeof bucket.get!=='function'||typeof secret!=='string'||secret.length<32)
    return block(503,'CUSTOMER_R2_INTEGRITY_STORAGE_UNAVAILABLE');
  if(!Number.isSafeInteger(nowMs)||nowMs<1500000000000)
    return block(503,'CUSTOMER_R2_INTEGRITY_CLOCK_INVALID');
  if(!okHex(token,64))
    return block(401,'CUSTOMER_SESSION_REJECTED');
  if(typeof draftId!=='string'||!/^CDR-[a-f0-9]{32}$/.test(draftId))
    return block(400,'CUSTOMER_DRAFT_REFERENCE_INVALID');
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    const auth=await db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(mac,nowMs,nowMs).first();
    if(!auth||typeof auth.customerId!=='string'||!auth.customerId)
      return block(401,'CUSTOMER_SESSION_REJECTED');
    const customerId=auth.customerId;
    const draft=await db.prepare(CUSTOMER_R2_INTEGRITY_DRAFT_SQL_V0)
      .bind(draftId,customerId).first();
    if(!draft||draft.draftId!==draftId)
      return block(404,'CUSTOMER_DRAFT_NOT_AUTHORIZED_OR_NOT_OPEN');
    const start=await db.prepare(CUSTOMER_R2_INTEGRITY_ROWS_SQL_V0)
      .bind(draftId,customerId).all();
    if(!start||!Array.isArray(start.results))
      return block(503,'CUSTOMER_R2_INTEGRITY_SNAPSHOT_UNAVAILABLE');
    const rows=start.results;
    if(rows.length===0)return block(409,'CUSTOMER_R2_INTEGRITY_NO_FILES');
    if(rows.length>MAX_FILES)return block(409,'CUSTOMER_R2_INTEGRITY_MORE_THAN_FIVE_FILES');
    if(rows.some(r=>!cleanRow(r)))
      return block(409,'CUSTOMER_R2_INTEGRITY_FILE_NOT_READY_OR_INVALID');
    const quarantineStart=await db.prepare(CUSTOMER_R2_QUARANTINE_ROWS_SQL_V0)
      .bind(draftId,customerId).all();
    if(!quarantineStart||!Array.isArray(quarantineStart.results)||
       !quarantineMatches(quarantineStart.results,rows))
      return block(409,'CUSTOMER_R2_QUARANTINE_LEDGER_MISSING_OR_INVALID');
    // No arbitrary key supplied from client. Read ONLY exact D1-attested
    // private keys; never issue public URLs or return bytes/object names.
    for(const row of rows){
      const item=await bucket.get(row.objectKey);
      if(!item||!Number.isSafeInteger(item.size)||item.size!==row.byteSize||
         !item.httpMetadata||item.httpMetadata.contentType!==row.contentType||
         typeof item.arrayBuffer!=='function')
        return block(409,'CUSTOMER_R2_INTEGRITY_OBJECT_MISMATCH');
      const bytes=new Uint8Array(await item.arrayBuffer());
      if(bytes.byteLength!==row.byteSize||
         !classifyNativeCustomerFileV0(bytes,row.contentType))
        return block(409,'CUSTOMER_R2_INTEGRITY_BYTES_INVALID');
      const hash=digestHex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
      if(hash!==row.sha256Hex)
        return block(409,'CUSTOMER_R2_INTEGRITY_HASH_MISMATCH');
    }
    // Verify same account token is still active and every D1 file metadata
    // row still matches after remote R2 reads. Otherwise NO positive result.
    const observed=clock();
    if(!Number.isSafeInteger(observed)||observed<0)
      return block(503,'CUSTOMER_R2_INTEGRITY_CLOCK_INVALID');
    const finalNow=Math.max(nowMs,observed);
    const endAuth=await db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(mac,finalNow,finalNow).first();
    if(!endAuth||endAuth.customerId!==customerId)
      return block(401,'CUSTOMER_SESSION_REJECTED');
    const endDraft=await db.prepare(CUSTOMER_R2_INTEGRITY_DRAFT_SQL_V0)
      .bind(draftId,customerId).first();
    if(!endDraft||endDraft.draftId!==draftId)
      return block(409,'CUSTOMER_R2_INTEGRITY_DRAFT_CHANGED');
    const finish=await db.prepare(CUSTOMER_R2_INTEGRITY_ROWS_SQL_V0)
      .bind(draftId,customerId).all();
    if(!finish||!Array.isArray(finish.results)||
       snap(finish.results)!==snap(rows))
      return block(409,'CUSTOMER_R2_INTEGRITY_SNAPSHOT_CHANGED');
    const quarantineEnd=await db.prepare(CUSTOMER_R2_QUARANTINE_ROWS_SQL_V0)
      .bind(draftId,customerId).all();
    if(!quarantineEnd||!Array.isArray(quarantineEnd.results)||
       !quarantineMatches(quarantineEnd.results,finish.results)||
       JSON.stringify(quarantineEnd.results)!==JSON.stringify(quarantineStart.results))
      return block(409,'CUSTOMER_R2_QUARANTINE_CHANGED_DURING_READ');
    return {status:200,body:{success:true,
      integrityNowVerified:true,allFilesQuarantined:true,verifiedFileCount:rows.length,
      provisionalReadOnlyObservation:true,malwareScanComplete:false,
      officialOrderCreated:false,productionWriteAuthorized:false,
      eligibleForT12FileHandoff:false,source:'customer-private-r2-integrity-stage-v0'}};
  }catch{
    return block(503,'CUSTOMER_R2_INTEGRITY_READ_UNAVAILABLE');
  }
}
function reply(result,origin=''){
  return new Response(JSON.stringify(result.body),{status:result.status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'GET,OPTIONS',
      'access-control-allow-headers':'authorization,accept'}:{})
  }});
}
export async function handleCustomerPrivateR2IntegrityStageV0(request,env={}){
  let url;try{url=new URL(request.url);}catch{return reply(block(400,'CUSTOMER_R2_INTEGRITY_BAD_URL'));}
  const m=CUSTOMER_PRIVATE_R2_INTEGRITY_PATH_V0.exec(url.pathname);
  if(!m||url.search||url.hash)
    return reply(block(404,'CUSTOMER_R2_INTEGRITY_ROUTE_DENIED'));
  const origin=request.headers.get('Origin')||'';
  const allow=String(env.CORS_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!origin||origin==='null'||!allow.includes(origin))
    return reply(block(403,'CUSTOMER_R2_INTEGRITY_ORIGIN_FORBIDDEN'));
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,accept',
    'cache-control':'no-store'
  }});
  if(request.method!=='GET')
    return reply(block(405,'CUSTOMER_R2_INTEGRITY_METHOD_DENIED'),origin);
  if(env.TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED!=='true')
    return reply(block(503,'CUSTOMER_R2_INTEGRITY_ROUTE_OFF'),origin);
  const bearer=/^Bearer ([0-9a-f]{64})$/i.exec((request.headers.get('Authorization')||'').trim());
  if(!bearer)return reply(block(401,'CUSTOMER_SESSION_REJECTED'),origin);
  return reply(await inspectCustomerPrivateR2IntegrityV0({
    db:env.DB,bucket:env.CUSTOMER_DRAFT_FILES_BUCKET,
    token:bearer[1].toLowerCase(),
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    draftId:m[1],nowMs:Date.now()
  }),origin);
}
