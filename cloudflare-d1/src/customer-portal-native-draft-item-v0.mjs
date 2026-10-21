/*
 * Entry665 — OFF / source-only native customer addCustomerDraftItem.
 * No official order, billing, R2 attachment, Google fallback or Printshop call.
 * Customer/draft authority is derived from a live server-verified D1 session.
 */
import {fingerprintCustomerSessionV0} from './customer-portal-native-orders-v0.mjs';
export const NATIVE_DRAFT_ITEM_VERSION_V0='ENTRY665_CUSTOMER_DRAFT_ITEM_OFF_V0';
const text=v=>String(v==null?'':v).trim();
const hex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const hex32=v=>typeof v==='string'&&/^[0-9a-f]{32}$/.test(v);
const draftIdOk=v=>typeof v==='string'&&/^CDR-[0-9a-f]{32}$/.test(v);
const hex=b=>Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
const deny=(code,status=400)=>({status,body:{success:false,code,source:'customer-native-draft-items-v0'}});
export function newNativeDraftItemIdV0(random=crypto){
  const bytes=new Uint8Array(16);random.getRandomValues(bytes);
  return 'CDI-'+hex(bytes);
}
export async function nativeDraftItemPayloadMacV0(fields,secret){
  if(typeof secret!=='string'||secret.length<32)throw TypeError('not configured');
  const h=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const raw=new TextEncoder().encode(JSON.stringify([
    'trendos-native-draft-item-v0',fields.draftId,fields.requestKey,
    fields.department,fields.itemName,fields.qty,fields.notes,
    fields.heatPress,fields.flyPrint
  ]));
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC',h,raw)));
}
export const NATIVE_DRAFT_ITEM_INSERT_SQL_V0=`
INSERT OR IGNORE INTO customer_portal_native_draft_items_v1
 (item_id,draft_id,request_key,payload_mac_hex,ordinal,department,
  item_name,qty,notes,heat_press,fly_print,created_at_ms)
SELECT ?,d.draft_id,?,?,
       (SELECT COUNT(*)+1 FROM customer_portal_native_draft_items_v1 i
         WHERE i.draft_id=d.draft_id),
       ?,?,?,?,?,?,?
  FROM customer_portal_native_drafts_v1 d
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE d.draft_id=? AND d.state='DRAFT'
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
   AND (SELECT COUNT(*) FROM customer_portal_native_draft_items_v1 i
        WHERE i.draft_id=d.draft_id)<50
`;
export const NATIVE_DRAFT_ITEM_READBACK_SQL_V0=`
SELECT i.item_id AS itemId,i.ordinal AS ordinal
 FROM customer_portal_native_draft_items_v1 i
 JOIN customer_portal_native_drafts_v1 d ON d.draft_id=i.draft_id
 JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
 JOIN t12_customers c ON c.customer_id=a.customer_id
 JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
 JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE i.request_key=? AND i.draft_id=? AND i.payload_mac_hex=?
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
 LIMIT 1
`;

function fieldsOk(x){
  return draftIdOk(x.draftId)&&hex32(x.requestKey)&&
    (x.department==='طباعة'||x.department==='ليزر')&&
    typeof x.itemName==='string'&&x.itemName===x.itemName.trim()&&
    x.itemName.length>=1&&x.itemName.length<=120&&
    Number.isSafeInteger(x.qty)&&x.qty>=1&&x.qty<=99&&
    typeof x.notes==='string'&&x.notes.length<=1000&&
    typeof x.heatPress==='boolean'&&typeof x.flyPrint==='boolean'&&
    (x.department==='طباعة'||(!x.heatPress&&!x.flyPrint));
}
export async function addNativeCustomerDraftItemV0({
  db,token,secret,nowMs,random=crypto,...fields
}={}){
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
     !Number.isSafeInteger(nowMs)||nowMs<=86400000)
    return deny('NATIVE_DRAFT_ITEM_BACKEND_UNAVAILABLE',503);
  if(!hex64(token))return deny('CUSTOMER_SESSION_REJECTED',401);
  if(!fieldsOk(fields))return deny('NATIVE_DRAFT_ITEM_INVALID');
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    const payloadMac=await nativeDraftItemPayloadMacV0(fields,secret);
    const itemId=newNativeDraftItemIdV0(random);
    const result=await db.prepare(NATIVE_DRAFT_ITEM_INSERT_SQL_V0)
      .bind(itemId,fields.requestKey,payloadMac,
        fields.department,fields.itemName,fields.qty,fields.notes,
        fields.heatPress?1:0,fields.flyPrint?1:0,nowMs,
        fields.draftId,mac,nowMs,nowMs).run();
    if(result?.meta?.changes!==0&&result?.meta?.changes!==1)
      return deny('NATIVE_DRAFT_ITEM_WRITE_UNVERIFIED',503);
    const stored=await db.prepare(NATIVE_DRAFT_ITEM_READBACK_SQL_V0)
      .bind(fields.requestKey,fields.draftId,payloadMac,mac,nowMs,nowMs).first();
    if(!stored||typeof stored.itemId!=='string'||
       !/^CDI-[0-9a-f]{32}$/.test(stored.itemId)||
       !Number.isSafeInteger(Number(stored.ordinal))||
       Number(stored.ordinal)<1||Number(stored.ordinal)>50)
      return deny('NATIVE_DRAFT_ITEM_NOT_AUTHORIZED_OR_CONFLICT',409);
    return {status:result.meta.changes===1?201:200,
      body:{success:true,source:'customer-native-draft-items-v0',
        version:NATIVE_DRAFT_ITEM_VERSION_V0,
        itemId:stored.itemId,ordinal:Number(stored.ordinal),
        alreadyAdded:result.meta.changes===0,officialOrderCreated:false}};
  }catch{return deny('NATIVE_DRAFT_ITEM_SCHEMA_OR_WRITE_UNAVAILABLE',503);}
}

async function tinyBody(req){
  if(!/^application\/json(?:\s*;|$)/.test(text(req.headers.get('content-type')).toLowerCase())||
     !req.body)return null;
  const reader=req.body.getReader(),chunks=[];let size=0;
  try{
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>1800){await reader.cancel();return null;}
      chunks.push(value);
    }
    const data=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
    const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
    if(!v||typeof v!=='object'||Array.isArray(v))return null;
    const expected=['requestKey','department','itemName','qty','notes','heatPress','flyPrint'];
    if(Object.keys(v).length!==expected.length||
       !expected.every(k=>Object.hasOwn(v,k)))return null;
    return v;
  }catch{return null;}finally{reader.releaseLock();}
}
function reply(status,body,h={}){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',...h
  }});
}
export async function handleNativeCustomerDraftItemV0(request,env={}){
  const path=new URL(request.url).pathname;
  const match=/^\/v1\/customer\/native\/drafts\/(CDR-[0-9a-f]{32})\/items\/?$/.exec(path);
  if(!match)return reply(404,deny('NATIVE_DRAFT_ITEM_ROUTE_NOT_FOUND',404).body);
  const origin=text(request.headers.get('Origin'));
  const allow=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||!allow.includes(origin))return reply(403,deny('ORIGIN_FORBIDDEN',403).body);
  const cors={'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'POST,OPTIONS',
    'access-control-allow-headers':'authorization,content-type'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return reply(405,deny('METHOD_NOT_ALLOWED',405).body,cors);
  if(env.TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED!=='true')
    return reply(503,deny('NATIVE_DRAFT_ITEM_OFF',503).body,cors);
  const auth=/^Bearer\s+([a-f0-9]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!auth)return reply(401,deny('CUSTOMER_SESSION_REJECTED',401).body,cors);
  const v=await tinyBody(request);
  if(!v)return reply(400,deny('NATIVE_DRAFT_ITEM_BODY_INVALID').body,cors);
  const result=await addNativeCustomerDraftItemV0({
    db:env.DB,secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    token:auth[1].toLowerCase(),nowMs:Date.now(),draftId:match[1],...v
  });
  return reply(result.status,result.body,cors);
}
export const NATIVE_DRAFT_ITEM_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,defaultEnabled:false,
  officialOrderCreation:false,googleFallback:false,
  financeRead:false,financeMutation:false,printshopMutation:false,
  maxItemsPerDraft:50,productionRelease:'NO_GO',zeroGoogleComplete:false
});
