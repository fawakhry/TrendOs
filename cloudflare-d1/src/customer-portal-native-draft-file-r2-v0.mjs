/*
 * Entry666 — source-only, OFF-by-default, PRIVATE R2 draft file staging.
 * NOT imported by Worker and NO R2 binding in wrangler. File is untrusted.
 * No google fallback, public download URL, printing, orders or finance writes.
 * Same native D1 session/ownership authority as Entry660/664/665.
 */
import {fingerprintCustomerSessionV0} from './customer-portal-native-orders-v0.mjs';

export const CUSTOMER_NATIVE_R2_DRAFT_FILE_VERSION_V0='ENTRY666_CUSTOMER_R2_FILE_OFF_V0';
export const CUSTOMER_NATIVE_FILE_MAX_BYTES_V0=5*1024*1024;
const hex=x=>Array.from(x,n=>n.toString(16).padStart(2,'0')).join('');
const validHex=(v,n)=>typeof v==='string'&&new RegExp('^[0-9a-f]{'+n+'}$').test(v);
const id=(v,p)=>typeof v==='string'&&v.startsWith(p)&&validHex(v.slice(p.length),32);
const text=x=>String(x==null?'':x).trim();
function denied(status=503,code='CUSTOMER_FILE_UNAVAILABLE'){
  return {status,body:{success:false,code,source:'customer-draft-r2-v0',fileReady:false}};
}
export function newNativeCustomerFileIdV0(random=crypto){
  const bytes=new Uint8Array(16);random.getRandomValues(bytes);
  return 'CDF-'+hex(bytes);
}
export function classifyNativeCustomerFileV0(bytes,contentType){
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<8||
     bytes.byteLength>CUSTOMER_NATIVE_FILE_MAX_BYTES_V0)return false;
  const b=bytes;
  if(contentType==='image/png')
    return [137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
  if(contentType==='image/jpeg')
    return b[0]===255&&b[1]===216&&b[2]===255;
  if(contentType==='application/pdf')
    return [37,80,68,70,45].every((x,i)=>b[i]===x);
  return false;
}

export const CUSTOMER_NATIVE_FILE_RESERVE_SQL_V0=`
INSERT OR IGNORE INTO customer_portal_native_draft_files_v1
  (file_id,draft_id,item_id,customer_id,request_key,sha256_hex,
   content_type,byte_size,r2_object_key,state,created_at_ms,updated_at_ms)
SELECT ?,d.draft_id,i.item_id,a.customer_id,?,?,?,?,?,'PENDING',?,?
  FROM customer_portal_native_draft_items_v1 i
  JOIN customer_portal_native_drafts_v1 d ON d.draft_id=i.draft_id
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE i.item_id=? AND d.draft_id=? AND d.state='DRAFT'
   AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND s.session_version=a.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND c.active='نعم' AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS(SELECT 1 FROM t12_customers other
     WHERE other.customer_id<>a.customer_id AND other.active='نعم'
       AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code)
   AND (SELECT COUNT(*) FROM customer_portal_native_draft_files_v1 f
        WHERE f.item_id=i.item_id)<5
`;
export const CUSTOMER_NATIVE_FILE_READBACK_SQL_V0=`
SELECT f.file_id AS fileId,f.state AS state
  FROM customer_portal_native_draft_files_v1 f
  JOIN customer_portal_native_draft_items_v1 i ON i.item_id=f.item_id
  JOIN customer_portal_native_drafts_v1 d ON d.draft_id=f.draft_id
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE f.request_key=? AND f.draft_id=? AND f.item_id=?
   AND f.sha256_hex=? AND f.content_type=? AND f.byte_size=?
   AND i.draft_id=d.draft_id AND f.customer_id=a.customer_id
   AND d.state='DRAFT'
   AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND s.session_version=a.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND c.active='نعم' AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS(SELECT 1 FROM t12_customers other
     WHERE other.customer_id<>a.customer_id AND other.active='نعم'
       AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code)
 LIMIT 1
`;
export const CUSTOMER_NATIVE_FILE_FINALIZE_CAS_SQL_V0=`
UPDATE customer_portal_native_draft_files_v1
   SET state='READY',updated_at_ms=?
 WHERE file_id=? AND request_key=? AND draft_id=? AND item_id=?
   AND state='PENDING'
   AND EXISTS(
     SELECT 1 FROM customer_portal_native_draft_items_v1 i
     JOIN customer_portal_native_drafts_v1 d ON d.draft_id=i.draft_id
     JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
     JOIN t12_customers c ON c.customer_id=a.customer_id
     JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
      WHERE i.item_id=customer_portal_native_draft_files_v1.item_id
        AND d.draft_id=customer_portal_native_draft_files_v1.draft_id
        AND a.customer_id=customer_portal_native_draft_files_v1.customer_id
        AND d.state='DRAFT'
        AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
        AND s.revoked_at_ms IS NULL
        AND s.issued_at_ms>0 AND s.issued_at_ms<=?
        AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
        AND s.expires_at_ms-s.issued_at_ms<=28800000
        AND s.session_version=a.session_version
        AND a.state='ACTIVE' AND a.must_change=0
        AND a.password_scheme='pbkdf2-sha256-v1'
        AND a.password_iterations=100000
        AND length(TRIM(a.verified_enrollment_ref))>0
        AND c.active='نعم'
        AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
        AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
        AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
       AND NOT EXISTS(SELECT 1 FROM t12_customers other
         WHERE other.customer_id<>a.customer_id AND other.active='نعم'
           AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code)
   )
`;

export async function storeNativeCustomerDraftFileV0({
  db,bucket,token,secret,draftId,itemId,requestKey,bytes,contentType,
  nowMs,random=crypto
}={}){
  if(!db||typeof db.prepare!=='function'||!bucket||
     typeof bucket.put!=='function'||typeof secret!=='string'||secret.length<32||
     !Number.isSafeInteger(nowMs)||nowMs<=86400000)
    return denied();
  if(!validHex(token,64))return denied(401,'CUSTOMER_SESSION_REJECTED');
  if(!id(draftId,'CDR-')||!id(itemId,'CDI-')||!validHex(requestKey,32))
    return denied(400,'CUSTOMER_FILE_SCOPE_INVALID');
  if(!classifyNativeCustomerFileV0(bytes,contentType))
    return denied(415,'CUSTOMER_FILE_FORMAT_OR_SIZE_REJECTED');
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    const sum=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
    const fileId=newNativeCustomerFileIdV0(random);
    const objectKey='customer-drafts/'+fileId;
    const reserved=await db.prepare(CUSTOMER_NATIVE_FILE_RESERVE_SQL_V0)
      .bind(fileId,requestKey,sum,contentType,bytes.byteLength,objectKey,
        nowMs,nowMs,itemId,draftId,mac,nowMs,nowMs).run();
    const count=reserved?.meta?.changes;
    if(count!==0&&count!==1)return denied(503,'CUSTOMER_FILE_RESERVE_UNVERIFIED');
    // Duplicate is intentionally NOT written again. Only an owner-authorized,
    // identical READY record is considered successful idempotent replay.
    if(count===0){
      const row=await db.prepare(CUSTOMER_NATIVE_FILE_READBACK_SQL_V0)
        .bind(requestKey,draftId,itemId,sum,contentType,bytes.byteLength,
          mac,nowMs,nowMs).first();
      if(!row||!id(row.fileId,'CDF-'))
        return denied(409,'CUSTOMER_FILE_SCOPE_OR_REPLAY_CONFLICT');
      if(row.state!=='READY')return denied(409,'CUSTOMER_FILE_PENDING_RECONCILIATION');
      return {status:200,body:{success:true,fileReady:true,
        source:'customer-draft-r2-v0',version:CUSTOMER_NATIVE_R2_DRAFT_FILE_VERSION_V0,
        fileId:row.fileId,alreadyUploaded:true,privateObject:true}};
    }
    // A new private object always receives a random opaque key. No browser
    // filename, ID, URL or caller-provided R2 key can select the object.
    const put=await bucket.put(objectKey,bytes,{
      httpMetadata:{contentType},
      customMetadata:{source:'trendos-customer-draft-v0'}
    });
    if(!put)return denied(503,'CUSTOMER_FILE_R2_WRITE_UNVERIFIED');
    const finalized=await db.prepare(CUSTOMER_NATIVE_FILE_FINALIZE_CAS_SQL_V0)
      .bind(nowMs,fileId,requestKey,draftId,itemId,mac,nowMs,nowMs).run();
    if(finalized?.meta?.changes!==1)
      return denied(503,'CUSTOMER_FILE_STAGED_RECONCILIATION_REQUIRED');
    return {status:201,body:{success:true,fileReady:true,
      source:'customer-draft-r2-v0',version:CUSTOMER_NATIVE_R2_DRAFT_FILE_VERSION_V0,
      fileId,alreadyUploaded:false,privateObject:true}};
  }catch{
    // R2 may have accepted bytes before an ambiguous failure. KEEP the
    // PENDING ledger for isolated operator reconciliation; never blindly
    // auto-retry or expose object storage to the customer.
    return denied(503,'CUSTOMER_FILE_STAGE_OR_R2_UNAVAILABLE');
  }
}
async function boundedBytes(request){
  const expected=Number(request.headers.get('content-length'));
  if(request.headers.has('content-length')&&
      (!Number.isSafeInteger(expected)||expected<8||expected>CUSTOMER_NATIVE_FILE_MAX_BYTES_V0))
    return null;
  if(!request.body)return null;
  const chunks=[];let total=0;
  const reader=request.body.getReader();
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      total+=value.byteLength;
      if(total>CUSTOMER_NATIVE_FILE_MAX_BYTES_V0){await reader.cancel();return null;}
      chunks.push(value);
    }
    if(total<8)return null;
    const result=new Uint8Array(total);let offset=0;
    for(const piece of chunks){result.set(piece,offset);offset+=piece.byteLength;}
    return result;
  }catch{return null;}finally{reader.releaseLock();}
}
const reply=(status,body,headers={})=>new Response(JSON.stringify(body),{
  status,headers:{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',...headers}
});
export async function handleNativeCustomerDraftFileR2V0(request,env={}){
  const path=new URL(request.url).pathname;
  const m=/^\/v1\/customer\/native\/drafts\/(CDR-[0-9a-f]{32})\/items\/(CDI-[0-9a-f]{32})\/files\/?$/.exec(path);
  if(!m)return reply(404,denied(404,'CUSTOMER_FILE_ROUTE_NOT_FOUND').body);
  const origin=text(request.headers.get('Origin'));
  const allow=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||!allow.includes(origin))
    return reply(403,denied(403,'ORIGIN_FORBIDDEN').body);
  const cors={'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'POST,OPTIONS',
    'access-control-allow-headers':'authorization,content-type,x-idempotency-key'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return reply(405,denied(405,'METHOD_NOT_ALLOWED').body,cors);
  if(env.TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED!=='true')
    return reply(503,denied(503,'CUSTOMER_NATIVE_FILE_UPLOAD_OFF').body,cors);
  if(!env.CUSTOMER_DRAFT_FILES_BUCKET||typeof env.CUSTOMER_DRAFT_FILES_BUCKET.put!=='function')
    return reply(503,denied(503,'CUSTOMER_R2_BINDING_NOT_CONFIGURED').body,cors);
  const token=/^Bearer\s+([0-9a-f]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!token)return reply(401,denied(401,'CUSTOMER_SESSION_REJECTED').body,cors);
  const requestKey=text(request.headers.get('x-idempotency-key'));
  if(!validHex(requestKey,32))
    return reply(400,denied(400,'CUSTOMER_FILE_REQUEST_KEY_REQUIRED').body,cors);
  const contentType=text(request.headers.get('content-type')).toLowerCase();
  if(!['image/png','image/jpeg','application/pdf'].includes(contentType))
    return reply(415,denied(415,'CUSTOMER_FILE_TYPE_NOT_SUPPORTED').body,cors);
  const bytes=await boundedBytes(request);
  if(!bytes)return reply(413,denied(413,'CUSTOMER_FILE_TOO_LARGE_OR_EMPTY').body,cors);
  const result=await storeNativeCustomerDraftFileV0({
    db:env.DB,bucket:env.CUSTOMER_DRAFT_FILES_BUCKET,
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    token:token[1].toLowerCase(),draftId:m[1],itemId:m[2],
    requestKey,bytes,contentType,nowMs:Date.now()
  });
  return reply(result.status,result.body,cors);
}

export const NATIVE_CUSTOMER_FILE_R2_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,defaultEnabled:false,
  customerR2BindingCurrentlyConfigured:false,publicFileUrl:false,
  fileDownloadRoute:false,malwareScanComplete:false,
  maxBytes:CUSTOMER_NATIVE_FILE_MAX_BYTES_V0,maxFilesPerItem:5,
  googleFallback:false,financeMutation:false,orderMutation:false,
  printshopMutation:false,productionRelease:'NO_GO',zeroGoogleComplete:false
});
