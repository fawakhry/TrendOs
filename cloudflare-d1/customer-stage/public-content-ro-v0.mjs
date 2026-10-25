/* TrendOS: existing D1 employee-content collection → narrowly PUBLIC customer read.
 * Isolated Cloudflare Stage source only, default OFF, no production import/deploy.
 * This does not reuse employee authentication, change the source schema, or
 * expose full JSON records (which may include internal notes and finances).
 */
import {
  fingerprintCustomerSessionV0, CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0
} from '../src/customer-portal-native-orders-v0.mjs';

export const CUSTOMER_NATIVE_PUBLIC_CONTENT_PATH_V0='/v1/customer/native/public-content';
const VIEWS=Object.freeze({sections:'platform_sections',branches:'franchise_branches'});
const text=x=>typeof x==='string'?x.trim():'';
const validText=(x,max=220)=>typeof x==='string'&&x.length<=max?x:'';
function json(body,status,origin=''){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'GET,OPTIONS',
      'access-control-allow-headers':'authorization,accept'}:{})
  }});
}
function denied(code,status=503,origin=''){
  return json({success:false,code,source:'customer-native-public-content-stage-v0'},status,origin);
}
function safePublic(row,view){
  if(!row||typeof row.record_json!=='string'||row.record_json.length>8192)
    throw new Error('invalid-private-record');
  let record;
  try{record=JSON.parse(row.record_json);}catch{throw new Error('bad-json');}
  if(!record||Array.isArray(record)||typeof record!=='object')
    throw new Error('bad-shape');
  if(view==='sections'){
    const sectionCode=validText(record.code||row.record_id,48);
    const name=validText(record.name,120);
    if(!sectionCode||!name)return null;
    return {sectionCode,name,description:validText(record.description,360),
      sectionType:validText(record.sectionType,100),
      executionType:validText(record.executionType,100),
      active:'نعم'};
  }
  if(record.customerVisibility==='مخفي'||record.branchRole==='شريك تنفيذ مخفي')
    return null;
  const branchCode=validText(record.code||row.record_id,48);
  const brandName=validText(record.displayName||record.brandName,120);
  if(!branchCode||!brandName)return null;
  return {branchCode,brandName,
    governorate:validText(record.governorate,80),
    city:validText(record.city,80),
    publicArea:validText(record.visibleArea||record.publicArea,80),
    publicDescription:validText(record.customerDescription||record.publicDescription,360),
    active:'نعم',customerVisibility:'ظاهر كفرع مطبعجي'};
}
export async function handleCustomerNativePublicContentStageV0(request,env={}){
  let url;
  try{url=new URL(request.url);}catch{return denied('CUSTOMER_PUBLIC_BAD_URL',400);}
  if(url.pathname!==CUSTOMER_NATIVE_PUBLIC_CONTENT_PATH_V0||url.hash)
    return denied('CUSTOMER_PUBLIC_ROUTE_NOT_FOUND',404);
  const origin=text(request.headers.get('Origin'));
  const origins=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||origin==='null'||!origins.includes(origin))
    return denied('CUSTOMER_PUBLIC_ORIGIN_FORBIDDEN',403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,accept',
    'cache-control':'no-store'
  }});
  if(request.method!=='GET')return denied('CUSTOMER_PUBLIC_METHOD_DENIED',405,origin);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED!=='true')
    return denied('CUSTOMER_PUBLIC_ROUTE_OFF',503,origin);
  if(Array.from(url.searchParams.keys()).length!==1||
     !url.searchParams.has('view')||url.searchParams.getAll('view').length!==1)
    return denied('CUSTOMER_PUBLIC_QUERY_DENIED',400,origin);
  const view=url.searchParams.get('view');
  if(!Object.prototype.hasOwnProperty.call(VIEWS,view))
    return denied('CUSTOMER_PUBLIC_VIEW_DENIED',400,origin);
  const bearer=/^Bearer ([a-f0-9]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!bearer)return denied('CUSTOMER_SESSION_REJECTED',401,origin);
  if(!env.DB||typeof env.DB.prepare!=='function'||
     typeof env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET!=='string'||
     env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET.length<32)
    return denied('CUSTOMER_PUBLIC_STORAGE_UNAVAILABLE',503,origin);
  try{
    const token=bearer[1].toLowerCase();
    const digest=await fingerprintCustomerSessionV0(
      token,env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET);
    const now=Date.now();
    const customer=await env.DB.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(digest,now,now).first();
    if(!customer||!text(customer.customerId))
      return denied('CUSTOMER_SESSION_REJECTED',401,origin);
    // Refuse to publish content while the canonical D1 employee-content
    // collection's control marker is OFF or missing. Never bypass it.
    const control=await env.DB.prepare(
      "SELECT mode,policy_epoch AS epoch FROM employee_content_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_CONTENT_V1'"
    ).first();
    if(!control||!['READONLY','GENERAL'].includes(control.mode)||
       !Number.isSafeInteger(control.epoch)||control.epoch<1)
      return denied('CUSTOMER_PUBLIC_SOURCE_NOT_QUALIFIED',503,origin);
    const fetched=await env.DB.prepare(
      "SELECT record_id,record_json FROM employee_content_records_v1 WHERE collection=? AND active=1 ORDER BY sort_order,record_id LIMIT 41"
    ).bind(VIEWS[view]).all();
    if(!fetched||!Array.isArray(fetched.results)||fetched.results.length>40)
      return denied('CUSTOMER_PUBLIC_COLLECTION_UNQUALIFIED',503,origin);
    // Explicit projection: never return the original JSON, internalNotes,
    // partner/commission/share/phone, finance, private file IDs, or editor.
    const rows=fetched.results.map(row=>safePublic(row,view)).filter(Boolean);
    return json({success:true,readOnly:true,
      source:'customer-native-public-content-stage-v0',
      view,...(view==='sections'?{sections:rows}:{branches:rows})},200,origin);
  }catch{
    return denied('CUSTOMER_PUBLIC_READ_UNAVAILABLE',503,origin);
  }
}
