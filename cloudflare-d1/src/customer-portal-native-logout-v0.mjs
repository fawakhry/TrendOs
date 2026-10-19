/*
 * Entry661: SOURCE ONLY / DEFAULT OFF. Future customer native session logout.
 * Uses same HMAC session fingerprint as Entry660. A single SQLite UPDATE
 * revokes only a qualifying, active, version-matched customer's own token.
 * There is no Google fallback, session issuance, or live Worker import.
 */
import { fingerprintCustomerSessionV0 } from './customer-portal-native-orders-v0.mjs';
const PATH='/v1/customer/native/logout';
const text=x=>String(x==null?'':x).trim();
const hex64=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
function denied(code,status=401){return {status,body:{
  success:false,code,source:'customer-d1-native-logout-v0',sessionRevoked:false
}};}

export const CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0=`
UPDATE customer_portal_native_sessions_v1
   SET revoked_at_ms=?
 WHERE token_fingerprint_hex=?
   AND source='d1-customer-native'
   AND revoked_at_ms IS NULL
   AND issued_at_ms>0 AND issued_at_ms<=?
   AND expires_at_ms>? AND expires_at_ms>issued_at_ms
   AND expires_at_ms-issued_at_ms<=28800000
   AND EXISTS(
     SELECT 1 FROM customer_portal_native_accounts_v1 a
     JOIN t12_customers c ON c.customer_id=a.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE a.customer_id=customer_portal_native_sessions_v1.customer_id
       AND a.state='ACTIVE' AND a.password_scheme='pbkdf2-sha256-v1'
       AND a.password_iterations=100000
       AND length(a.verified_enrollment_ref)>0
       AND a.session_version=customer_portal_native_sessions_v1.session_version
       AND c.active='نعم'
       AND TRIM(COALESCE(c.legacy_chat_code,''))<>''
       AND a.portal_code=TRIM(c.legacy_chat_code)
       AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
       AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   )
`;
export async function revokeCustomerNativeSessionV0({db,token,secret,nowMs}={}){
  if(!db||typeof db.prepare!=='function')
    return denied('CUSTOMER_NATIVE_DB_UNAVAILABLE',503);
  if(!Number.isSafeInteger(nowMs)||nowMs<=0)
    return denied('CUSTOMER_NATIVE_CLOCK_INVALID',503);
  if(!hex64(token))
    return denied('CUSTOMER_SESSION_REJECTED');
  if(typeof secret!=='string'||secret.length<32)
    return denied('CUSTOMER_SESSION_SECRET_UNAVAILABLE',503);
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    const result=await db.prepare(CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0)
      .bind(nowMs,mac,nowMs,nowMs).run();
    const changed=result&&result.meta&&result.meta.changes;
    // An ambiguous D1 acknowledgment cannot be reported as success.
    if(changed===1)return {status:200,body:{
      success:true,sessionRevoked:true,source:'customer-d1-native-logout-v0'
    }};
    if(changed===0)return denied('CUSTOMER_SESSION_REJECTED');
    return denied('CUSTOMER_SESSION_REVOKE_UNVERIFIED',503);
  }catch{
    return denied('CUSTOMER_NATIVE_SCHEMA_OR_REVOKE_UNAVAILABLE',503);
  }
}
function json(status,body,headers={}){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',...headers
  }});
}
export function isCustomerNativeLogoutPathV0(value){
  return (text(value).replace(/\/+$/,'')||'/')===PATH;
}
export async function handleCustomerNativeLogoutV0(request,env={}){
  const url=new URL(request.url);
  if(!isCustomerNativeLogoutPathV0(url.pathname))
    return json(404,denied('CUSTOMER_ROUTE_NOT_FOUND',404).body);
  const origin=text(request.headers.get('Origin'));
  const allowed=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(origin&&!allowed.includes(origin))
    return json(403,denied('ORIGIN_FORBIDDEN',403).body);
  const cors=origin?{
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'POST,OPTIONS',
    'access-control-allow-headers':'authorization,content-type'
  }:{};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return json(405,denied('METHOD_NOT_ALLOWED',405).body,cors);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED!=='true')
    return json(503,denied('CUSTOMER_NATIVE_LOGOUT_OFF',503).body,cors);
  const match=/^Bearer\s+([a-f0-9]{64})$/i.exec(
    text(request.headers.get('Authorization')));
  const r=await revokeCustomerNativeSessionV0({
    db:env.DB,token:match?match[1].toLowerCase():'',
    secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    nowMs:Date.now()
  });
  return json(r.status,r.body,cors);
}

export const CUSTOMER_NATIVE_LOGOUT_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,defaultEnabled:false,
  employeeSessionChanged:false,customerSessionIssuerAvailable:false,
  googleFallback:false,financeMutation:false,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
