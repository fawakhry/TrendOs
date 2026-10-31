/*
 * TrendOS customer PRIVATE draft-file status, source-only / default OFF.
 * Reuses Entry660 D1 HMAC sessions and Entry666 file+draft ownership;
 * migration 0040 requires immutable QUARANTINED status.
 * No R2 read, no file bytes, URL, object key, SHA, name, scanner clearance.
 * Not routed from Worker, no new public services or write permission.
 */
import {fingerprintCustomerSessionV0,CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0}
  from '../src/customer-portal-native-orders-v0.mjs';

export const CUSTOMER_PRIVATE_FILE_STATUS_VERSION_V0='ENTRY_CUSTOMER_PRIVATE_FILE_STATUS_OFF_V0';
export const CUSTOMER_PRIVATE_FILE_STATUS_PATH_V0=
  /^\/v1\/customer\/native\/drafts\/(CDR-[a-f0-9]{32})\/items\/(CDI-[a-f0-9]{32})\/files\/(CDF-[a-f0-9]{32})\/status$/;
const safeHex=(s,n)=>typeof s==='string'&&new RegExp('^[0-9a-f]{'+n+'}$').test(s);
const fail=(status,code)=>({status,body:{
  success:false,code,source:'customer-private-file-status-ro-v0',
  previewAvailable:false,scanCompleted:false,printReleaseAuthorized:false,
  publicUrlIssued:false,downloadUrlIssued:false
}});
const types=new Set(['image/png','image/jpeg','application/pdf']);

// Bind file, draft, item AND verified customer id to EVERY read.
// No matching by name/phone, no caller-selected R2 object key.
export const CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0=[
  'SELECT f.file_id AS fileId,f.state AS fileState,',
  'f.content_type AS contentType,f.byte_size AS byteSize,',
  'f.sha256_hex AS sha256Hex,',
  'q.disposition AS quarantineDisposition,',
  'q.scan_completed AS scanCompleted,',
  'q.print_release_authorized AS printReleaseAuthorized',
  'FROM customer_portal_native_draft_files_v1 f',
  'JOIN customer_portal_native_drafts_v1 d',
  ' ON d.draft_id=f.draft_id AND d.customer_id=f.customer_id',
  'JOIN customer_portal_native_draft_items_v1 i',
  ' ON i.item_id=f.item_id AND i.draft_id=d.draft_id',
  'JOIN customer_portal_native_file_quarantine_v1 q',
  ' ON q.file_id=f.file_id AND q.customer_id=f.customer_id',
  ' AND q.draft_id=f.draft_id AND q.item_id=f.item_id',
  ' AND q.sha256_hex=f.sha256_hex AND q.byte_size=f.byte_size',
  ' AND q.content_type=f.content_type',
  'WHERE f.file_id=? AND f.draft_id=? AND f.item_id=?',
  ' AND f.customer_id=? AND d.customer_id=?',
  " AND d.state='DRAFT'",
  'LIMIT 1'
].join('\n');

function rowValid(row,fileId) {
  return row&&row.fileId===fileId &&
    ['PENDING','READY'].includes(row.fileState) &&
    types.has(row.contentType) &&
    Number.isSafeInteger(row.byteSize)&&row.byteSize>=8&&row.byteSize<=5*1024*1024 &&
    safeHex(row.sha256Hex,64) &&
    row.quarantineDisposition==='QUARANTINED' &&
    Number(row.scanCompleted)===0 &&
    Number(row.printReleaseAuthorized)===0;
}
export async function inspectCustomerPrivateFileStatusV0({
  db,secret,token,draftId,itemId,fileId,nowMs,clock=()=>Date.now()
}={}) {
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32)
    return fail(503,'CUSTOMER_PRIVATE_STATUS_DB_UNAVAILABLE');
  if(!Number.isSafeInteger(nowMs)||nowMs<1500000000000)
    return fail(503,'CUSTOMER_PRIVATE_STATUS_CLOCK_INVALID');
  if(!safeHex(token,64))return fail(401,'CUSTOMER_SESSION_REJECTED');
  if(!/^CDR-[a-f0-9]{32}$/.test(String(draftId))||
     !/^CDI-[a-f0-9]{32}$/.test(String(itemId))||
     !/^CDF-[a-f0-9]{32}$/.test(String(fileId)))
    return fail(400,'CUSTOMER_PRIVATE_FILE_REFERENCE_INVALID');
  try {
    const fingerprint=await fingerprintCustomerSessionV0(token,secret);
    const current=await db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(fingerprint,nowMs,nowMs).first();
    if(!current||typeof current.customerId!=='string'||!current.customerId)
      return fail(401,'CUSTOMER_SESSION_REJECTED');
    const customerId=current.customerId;
    const row=await db.prepare(CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0)
      .bind(fileId,draftId,itemId,customerId,customerId).first();
    if(!row)return fail(404,'CUSTOMER_PRIVATE_FILE_NOT_FOUND_OR_FORBIDDEN');
    if(!rowValid(row,fileId))
      return fail(409,'CUSTOMER_PRIVATE_FILE_QUARANTINE_INVALID');
    const observed=clock();
    if(!Number.isSafeInteger(observed)||observed<nowMs||observed>nowMs+120000)
      return fail(503,'CUSTOMER_PRIVATE_STATUS_CLOCK_CHANGED');
    // Recheck revocation/account version after status read.
    const final=await db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(fingerprint,observed,observed).first();
    if(!final||final.customerId!==customerId)
      return fail(401,'CUSTOMER_SESSION_REJECTED');
    // READY is only a D1 metadata state; NOT a malware/print clearance.
    return {status:200,body:{
      success:true,source:'customer-private-file-status-ro-v0',
      version:CUSTOMER_PRIVATE_FILE_STATUS_VERSION_V0,
      status:row.fileState==='READY'?'STORED_QUARANTINED':'UPLOAD_PENDING_QUARANTINED',
      previewAvailable:false,scanCompleted:false,printReleaseAuthorized:false,
      publicUrlIssued:false,downloadUrlIssued:false,
      customerMessage:row.fileState==='READY'?'تم تسجيل الملف وهو قيد الفحص':'جارٍ التحقق من رفع الملف'
    }};
  }catch{
    return fail(503,'CUSTOMER_PRIVATE_STATUS_UNAVAILABLE');
  }
}
function respond(result,origin=''){
  return new Response(JSON.stringify(result.body),{status:result.status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','pragma':'no-cache','referrer-policy':'no-referrer',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'GET,OPTIONS',
      'access-control-allow-headers':'authorization,accept'}:{})
  }});
}
export async function handleCustomerPrivateFileStatusStageV0(request,env={}){
  let url;try{url=new URL(request.url);}catch{
    return respond(fail(400,'CUSTOMER_PRIVATE_STATUS_BAD_URL'));
  }
  const m=CUSTOMER_PRIVATE_FILE_STATUS_PATH_V0.exec(url.pathname);
  if(!m||url.search||url.hash)
    return respond(fail(404,'CUSTOMER_PRIVATE_STATUS_ROUTE_DENIED'));
  const origin=request.headers.get('Origin')||'';
  const allowed=String(env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!origin||origin==='null'||!allowed.includes(origin))
    return respond(fail(403,'CUSTOMER_PRIVATE_STATUS_ORIGIN_FORBIDDEN'));
  const cors={'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,accept',
    'cache-control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')
    return respond(fail(405,'CUSTOMER_PRIVATE_STATUS_METHOD_DENIED'),origin);
  if(env.TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED!=='true')
    return respond(fail(503,'CUSTOMER_PRIVATE_STATUS_ROUTE_OFF'),origin);
  const bearer=/^Bearer ([0-9a-f]{64})$/i.exec((request.headers.get('Authorization')||'').trim());
  if(!bearer)return respond(fail(401,'CUSTOMER_SESSION_REJECTED'),origin);
  return respond(await inspectCustomerPrivateFileStatusV0({
    db:env.DB,secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    token:bearer[1].toLowerCase(),draftId:m[1],itemId:m[2],fileId:m[3],
    nowMs:Date.now()
  }),origin);
}
export const CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0=Object.freeze({
  sourceOnly:true,defaultEnabled:false,workerEntryWired:false,
  returnsFileBytes:false,returnsFileUrls:false,readsR2:false,
  scanCompleted:false,printReleaseAuthorized:false,
  availableForCustomerProduction:false,
  zeroGoogleComplete:false,liveDeployment:'NO_GO'
});
