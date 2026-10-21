/*
 * Entry664, source-only future native customer createCustomerDraft (default OFF).
 * Not imported into production Worker. No Google fallback, no order
 * creation, customer-finance, file writes, Printshop or EasyStore changes.
 * Uses existing Entry660 HMAC bearer and Entry654 independent account proof.
 */
import {fingerprintCustomerSessionV0} from './customer-portal-native-orders-v0.mjs';
export const CUSTOMER_NATIVE_DRAFT_CREATE_VERSION_V0='ENTRY664_NATIVE_CUSTOMER_DRAFT_CREATE_OFF_V0';
export const CUSTOMER_NATIVE_DRAFT_CREATE_PATH_V0='/v1/customer/native/drafts';
const text=v=>String(v==null?'':v).trim();
const hex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const key32=v=>typeof v==='string'&&/^[0-9a-f]{32}$/.test(v);
const fail=(status,code)=>({status,body:{success:false,code,source:'customer-native-drafts-v0'}});
const bytesHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export function newNativeCustomerDraftIdV0(random=crypto){
  const b=new Uint8Array(16);
  random.getRandomValues(b);
  return 'CDR-'+bytesHex(b);
}
// POST's caller chooses a 128-bit opaque idempotency key; D1 globally reserves
// it to one customer. No customerId, line/item or shipping data from browser.
export const CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0=`
INSERT OR IGNORE INTO customer_portal_native_drafts_v1
  (draft_id,customer_id,request_key,state,created_at_ms,updated_at_ms)
SELECT ?,a.customer_id,?,'DRAFT',?,?
  FROM customer_portal_native_sessions_v1 s
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=s.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE s.token_fingerprint_hex=?
   AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND a.session_version=s.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND c.active='نعم' AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS (
     SELECT 1 FROM t12_customers other
      WHERE other.customer_id<>a.customer_id AND other.active='نعم'
        AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code
   )
   AND (SELECT COUNT(*) FROM customer_portal_native_drafts_v1 d
         WHERE d.customer_id=a.customer_id
           AND d.created_at_ms>=?)<20
`;
// Replay must validate the CURRENT session and exact customer ownership again.
// A stolen/reused key from another customer never reveals their draft ID.
// Duplicate key from the same owner only returns the same draft. No new order.
export const CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0=`
SELECT d.draft_id AS draftId,d.state AS state
  FROM customer_portal_native_drafts_v1 d
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE d.request_key=? AND s.token_fingerprint_hex=?
   AND s.source='d1-customer-native'
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
 LIMIT 1
`;

export async function createNativeCustomerDraftV0({db,token,secret,requestKey,nowMs,random=crypto}={}){
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
      !Number.isSafeInteger(nowMs)||nowMs<=86400000)return fail(503,'CUSTOMER_DRAFT_BACKEND_UNAVAILABLE');
  if(!hex64(token))return fail(401,'CUSTOMER_SESSION_REJECTED');
  if(!key32(requestKey))return fail(400,'INVALID_DRAFT_REQUEST_KEY');
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    const draftId=newNativeCustomerDraftIdV0(random);
    const result=await db.prepare(CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0)
      .bind(draftId,requestKey,nowMs,nowMs,mac,nowMs,nowMs,nowMs-86400000).run();
    if(result?.meta?.changes!==0&&result?.meta?.changes!==1)
      return fail(503,'CUSTOMER_DRAFT_WRITE_UNVERIFIED');
    const existing=await db.prepare(CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0)
      .bind(requestKey,mac,nowMs,nowMs).first();
    if(!existing||typeof existing.draftId!=='string'||
       !/^CDR-[0-9a-f]{32}$/.test(existing.draftId))
      return fail(409,'CUSTOMER_DRAFT_NOT_AUTHORIZED_OR_DUPLICATE_KEY');
    return {
      status:result.meta.changes===1?201:200,
      body:{
        success:true,source:'customer-native-drafts-v0',
        version:CUSTOMER_NATIVE_DRAFT_CREATE_VERSION_V0,
        draftId:existing.draftId,state:existing.state,
        alreadyCreated:result.meta.changes===0,
        officialOrderCreated:false
      }
    };
  }catch{return fail(503,'CUSTOMER_DRAFT_SCHEMA_OR_WRITE_UNAVAILABLE');}
}

async function tinyJsonBody(request){
  const type=text(request.headers.get('content-type')).toLowerCase();
  if(!/^application\/json(?:\s*;|$)/.test(type))return null;
  // Stream to enforce a true input cap (Content-Length may lie or be absent).
  if(!request.body)return null;
  const reader=request.body.getReader(),chunks=[];
  let length=0;
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>256){await reader.cancel();return null;}
      chunks.push(value);
    }
    const all=new Uint8Array(length);let pos=0;
    for(const ch of chunks){all.set(ch,pos);pos+=ch.byteLength;}
    const obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
    if(!obj||typeof obj!=='object'||Array.isArray(obj)||
       Object.keys(obj).length!==1||!key32(obj.requestKey))return null;
    return obj;
  }catch{return null;}finally{reader.releaseLock();}
}
function json(status,body,h={}){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',...h
  }});
}
export async function handleCustomerNativeDraftCreateV0(request,env={}){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!==CUSTOMER_NATIVE_DRAFT_CREATE_PATH_V0)
    return json(404,fail(404,'NATIVE_DRAFT_ROUTE_NOT_FOUND').body);
  const origin=text(request.headers.get('Origin'));
  const allowed=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||!allowed.includes(origin))
    return json(403,fail(403,'ORIGIN_FORBIDDEN').body);
  const cors={
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'POST,OPTIONS',
    'access-control-allow-headers':'authorization,content-type'
  };
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return json(405,fail(405,'METHOD_NOT_ALLOWED').body,cors);
  if(env.TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED!=='true')
    return json(503,fail(503,'NATIVE_CUSTOMER_DRAFT_CREATE_OFF').body,cors);
  const m=/^Bearer\s+([a-f0-9]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!m)return json(401,fail(401,'CUSTOMER_SESSION_REJECTED').body,cors);
  const body=await tinyJsonBody(request);
  if(!body)return json(400,fail(400,'INVALID_OR_OVERSIZED_DRAFT_BODY').body,cors);
  const result=await createNativeCustomerDraftV0({
    db:env.DB,token:m[1].toLowerCase(),
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    requestKey:body.requestKey,nowMs:Date.now()
  });
  return json(result.status,result.body,cors);
}
export const CUSTOMER_NATIVE_DRAFT_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,defaultEnabled:false,
  googleFallback:false,officialOrderCreation:false,
  financeMutation:false,printshopMutation:false,
  maxDraftsPerDay:20,productionRelease:'NO_GO',zeroGoogleComplete:false
});
