/*
 * Customer Native Login HTTP V0 — isolated source contract. DEFAULT OFF.
 * NOT imported into Worker. NO public route, no SMS, no real enrollment.
 * Uses original Entry662 password verification/D1 CAS session issuer.
 *
 * SECURITY PRECONDITION BEFORE ANY REAL STAGE:
 * The configured gate must atomically persist/enforce a global two-key
 * per-identifier and per-IP quota independent of D1 password CAS. There is
 * deliberately NO in-memory, stub or allow-all rate limiter here.
 */
import { issueNativeCustomerSessionFromPasswordV0 }
  from './customer-portal-native-login-v0.mjs';

export const CUSTOMER_NATIVE_LOGIN_HTTP_PATH_V0='/v1/customer/native/login';
export const CUSTOMER_NATIVE_LOGIN_HTTP_VERSION_V0='ENTRY691_CUSTOMER_LOGIN_HTTP_OFF_V0';
const MAX_BODY_BYTES=2048;
const text=x=>typeof x==='string'?x.trim():'';
const asciiIp=x=>typeof x==='string'&&x.length>=3&&x.length<=45&&
  /^[0-9A-Fa-f:.]+$/.test(x)&&!/\.{2,}/.test(x);
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
function response(body,status,origin){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'POST,OPTIONS',
      'access-control-allow-headers':'content-type'}:{})
  }});
}
function denied(code,status=503,origin=''){
  return response({
    success:false,code,customerSessionIssued:false,
    source:'d1-native-customer-login-v0'
  },status,origin);
}
async function throttleFingerprint(secret,scope,value){
  const raw=new TextEncoder().encode(secret);
  const key=await crypto.subtle.importKey('raw',raw,
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const data=new TextEncoder().encode(
    JSON.stringify(['trendos-customer-login-attempt-v0',scope,value]));
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,data)));
}
/**
 * Handler is NOT imported or registered by live Worker.
 * gate.reserveMany() is a future trusted durable gateway contract (not
 * implemented here): it must atomically enforce limits for both HMAC keys
 * across all Worker instances and return {allowed:true,persisted:true}.
 */
export async function handleCustomerNativeLoginHttpV0(request,env={}){
  let url;
  try{url=new URL(request.url);}catch{return denied('CUSTOMER_NATIVE_LOGIN_INVALID_REQUEST',400);}
  if(url.pathname!==CUSTOMER_NATIVE_LOGIN_HTTP_PATH_V0||url.search||url.hash)
    return denied('CUSTOMER_NATIVE_LOGIN_ROUTE_NOT_FOUND',404);
  const origin=text(request.headers.get('Origin'));
  const allowed=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||!allowed.includes(origin)||origin==='null')
    return denied('CUSTOMER_NATIVE_LOGIN_ORIGIN_FORBIDDEN',403);
  if(request.method==='OPTIONS')
    return new Response(null,{status:204,headers:{
      'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'POST,OPTIONS',
      'access-control-allow-headers':'content-type','cache-control':'no-store'
    }});
  if(request.method!=='POST')return denied('CUSTOMER_NATIVE_LOGIN_METHOD_DENIED',405,origin);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED!=='true')
    return denied('CUSTOMER_NATIVE_LOGIN_HTTP_OFF',503,origin);
  // Fail closed unless caller is a Cloudflare edge context with a trustworthy
  // source connecting-IP policy. Not an authorization grant by itself.
  const edge=request.cf;
  const ip=text(request.headers.get('CF-Connecting-IP'));
  if(!edge||typeof edge.colo!=='string'||!/^[A-Z]{3}$/.test(edge.colo)||
      !asciiIp(ip))
    return denied('CUSTOMER_NATIVE_LOGIN_EDGE_CONTEXT_UNVERIFIED',503,origin);
  const contentType=text(request.headers.get('Content-Type'));
  if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(contentType))
    return denied('CUSTOMER_NATIVE_LOGIN_CONTENT_TYPE_DENIED',415,origin);
  const length=text(request.headers.get('Content-Length'));
  if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY_BYTES))
    return denied('CUSTOMER_NATIVE_LOGIN_PAYLOAD_DENIED',413,origin);
  let raw;
  try{raw=await request.text();}
  catch{return denied('CUSTOMER_NATIVE_LOGIN_PAYLOAD_DENIED',400,origin);}
  if(raw.length<2||new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES)
    return denied('CUSTOMER_NATIVE_LOGIN_PAYLOAD_DENIED',413,origin);
  let body;
  try{body=JSON.parse(raw);}
  catch{return denied('CUSTOMER_NATIVE_LOGIN_PAYLOAD_DENIED',400,origin);}
  if(!body||Array.isArray(body)||typeof body!=='object'||
     Object.keys(body).length!==2||
     !Object.prototype.hasOwnProperty.call(body,'portalCode')||
     !Object.prototype.hasOwnProperty.call(body,'password')||
     typeof body.portalCode!=='string'||typeof body.password!=='string'||
     body.portalCode.length<1||body.portalCode.length>80||
     body.portalCode!==body.portalCode.trim()||
     body.password.length<12||body.password.length>128)
    return denied('CUSTOMER_NATIVE_LOGIN_PAYLOAD_DENIED',400,origin);

  const rateGate=env.CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0;
  const rateSecret=env.TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET;
  if(!rateGate||typeof rateGate.reserveMany!=='function'||
     typeof rateSecret!=='string'||rateSecret.length<32)
    return denied('CUSTOMER_NATIVE_LOGIN_DURABLE_THROTTLE_UNAVAILABLE',503,origin);
  let reserved;
  try{
    // No raw IP/portalCode/password sent to the rate gate.
    const keys=[
      await throttleFingerprint(rateSecret,'portal-code',body.portalCode),
      await throttleFingerprint(rateSecret,'edge-ip',ip)
    ];
    if(keys.length!==2||keys[0]===keys[1])throw new Error('rate-key-error');
    reserved=await rateGate.reserveMany({keys,policy:'customer-login-dual-v0'});
  }catch{return denied('CUSTOMER_NATIVE_LOGIN_DURABLE_THROTTLE_UNAVAILABLE',503,origin);}
  if(!reserved||reserved.persisted!==true)
    return denied('CUSTOMER_NATIVE_LOGIN_DURABLE_THROTTLE_UNAVAILABLE',503,origin);
  if(reserved.allowed!==true)
    return denied('CUSTOMER_NATIVE_LOGIN_RATE_LIMITED',429,origin);

  // The original source enforces verified ACTIVE PBKDF2 account, exact
  // portalCode binding, HMAC fingerprint, D1 CAS and no Google fallback.
  const outcome=await issueNativeCustomerSessionFromPasswordV0({
    db:env.DB,portalCode:body.portalCode,password:body.password,
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    nowMs:Date.now()
  });
  if(!outcome||![200,401,503].includes(outcome.status)||!outcome.body)
    return denied('CUSTOMER_NATIVE_LOGIN_UNAVAILABLE',503,origin);
  if(outcome.status===200){
    // Genuine token is only returned in the approved owner login response.
    if(outcome.body.success!==true||
       !/^[a-f0-9]{64}$/.test(outcome.body.token||'')||
       outcome.body.customerSessionIssued!==true)
      return denied('CUSTOMER_NATIVE_LOGIN_UNAVAILABLE',503,origin);
    return response(outcome.body,200,origin);
  }
  return denied(outcome.status===401?'CUSTOMER_LOGIN_REJECTED':
    'CUSTOMER_LOGIN_UNAVAILABLE',outcome.status,origin);
}

export const CUSTOMER_NATIVE_LOGIN_HTTP_POLICY_V0=Object.freeze({
  sourceOnly:true,defaultEnabled:false,workerEntryWired:false,
  durableRateGateImplementedHere:false,edgeIngressAttested:false,
  nativeCustomerEnrollmentReady:false,customerDatabaseRebuilt:false,
  customerDataMutationAuthorized:false,googleFallback:false,
  zeroGoogleComplete:false,productionRelease:'NO_GO'
});
