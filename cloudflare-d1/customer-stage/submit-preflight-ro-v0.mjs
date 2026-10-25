/* TrendOS: isolated Stage ONLY, READONLY, default OFF.
 * Exposes Entry667 preflight as a bounded private customer GET.
 * This is NEVER an official order create, seal, T12 mutation, or employee
 * permission delegation. Existing one-item/no-attachment gates remain.
 */
import {preflightNativeCustomerDraftSubmitV0}
  from '../src/customer-portal-native-submit-preflight-v0.mjs';

export const CUSTOMER_DRAFT_PREFLIGHT_STAGE_PATH_V0=
  /^\/v1\/customer\/native\/drafts\/(CDR-[0-9a-f]{32})\/submit-preflight$/;
function answer(status,body,origin=''){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'GET,OPTIONS',
      'access-control-allow-headers':'authorization,accept'}:{})
  }});
}
const deny=(code,status=503)=>({status,body:{
  success:false,code,readOnly:true,officialOrderCreated:false,
  productionWriteAuthorized:false,preflightEligible:false
}});
export async function handleCustomerDraftPreflightStageV0(request,env={}){
  let url;
  try{url=new URL(request.url);}catch{return answer(400,deny('DRAFT_PREFLIGHT_BAD_URL',400).body);}
  const found=CUSTOMER_DRAFT_PREFLIGHT_STAGE_PATH_V0.exec(url.pathname);
  if(!found||url.search||url.hash)
    return answer(404,deny('DRAFT_PREFLIGHT_ROUTE_NOT_FOUND',404).body);
  const origin=request.headers.get('Origin')||'';
  const allowed=(env.CORS_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
  if(!origin||origin==='null'||!allowed.includes(origin))
    return answer(403,deny('DRAFT_PREFLIGHT_ORIGIN_FORBIDDEN',403).body);
  const cors={'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,accept','cache-control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')
    return answer(405,deny('DRAFT_PREFLIGHT_METHOD_DENIED',405).body,origin);
  if(env.TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED!=='true')
    return answer(503,deny('DRAFT_PREFLIGHT_ROUTE_OFF').body,origin);
  const bearer=/^Bearer ([0-9a-f]{64})$/i.exec((request.headers.get('Authorization')||'').trim());
  if(!bearer)return answer(401,deny('CUSTOMER_SESSION_REJECTED',401).body,origin);
  const result=await preflightNativeCustomerDraftSubmitV0({
    db:env.DB,token:bearer[1].toLowerCase(),
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    draftId:found[1],nowMs:Date.now()
  });
  // Never expose D1 customer data, T12 request key, canonical shadow intent,
  // phone, customer code or file object keys. The source preflight returns
  // compact flags and failure codes only, no actual customer/order writes.
  return answer(result.status,result.body,origin);
}
