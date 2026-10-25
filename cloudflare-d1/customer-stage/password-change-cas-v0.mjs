/* TrendOS isolated CUSTOMER Stage password rotation — SOURCE ONLY, default OFF.
 * No employee, T12 order, existing customer master, Google or frontend writes.
 * POST requires a currently authenticated Native D1 customer session and
 * correct current password. Single D1 CAS atomically installs a newly salted
 * PBKDF2 verifier and increments session_version, invalidating ALL old tokens.
 */
import {fingerprintCustomerSessionV0} from '../src/customer-portal-native-orders-v0.mjs';
import {hashNewCustomerPasswordV0,verifyNewCustomerPasswordV0}
  from '../src/customer-portal-phone-enrollment-v0.mjs';
import {CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0,CUSTOMER_NATIVE_LOGIN_LOCK_MS_V0}
  from '../src/customer-portal-native-login-v0.mjs';

export const CUSTOMER_NATIVE_PASSWORD_CHANGE_PATH_V0='/v1/customer/native/change-password';
const text=x=>typeof x==='string'?x.trim():'';
const denied=(code,status=401)=>({status,body:{
  success:false,code,source:'customer-d1-native-password-rotate-stage-v0',
  passwordChanged:false,forceRelogin:false
}});
function respond(result,origin=''){
  return new Response(JSON.stringify(result.body),{status:result.status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'POST,OPTIONS',
      'access-control-allow-headers':'authorization,content-type,accept'}:{})
  }});
}

// Exactly the existing independently enrolled ACTIVE D1 customer; session
// fingerprint (never raw token) and account version are authoritative.
// No claims of ownership based on phone, display name or supplied customer ID.
export const CUSTOMER_PASSWORD_CHANGE_LOOKUP_SQL_V0=`
SELECT a.customer_id AS customerId,a.portal_code AS portalCode,
       a.password_scheme AS passwordScheme,
       a.password_iterations AS passwordIterations,
       a.password_salt_hex AS passwordSaltHex,
       a.password_hash_hex AS passwordHashHex,
       a.session_version AS sessionVersion,
       a.failed_attempts AS failedAttempts,
       a.locked_until_ms AS lockedUntilMs
  FROM customer_portal_native_sessions_v1 s
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=s.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND a.session_version=s.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(a.password_salt_hex)=32 AND length(a.password_hash_hex)=64
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND a.locked_until_ms<=?
   AND c.active='نعم'
   AND TRIM(COALESCE(c.legacy_chat_code,''))<>'' 
   AND a.portal_code=TRIM(c.legacy_chat_code)
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS(
     SELECT 1 FROM t12_customers other WHERE other.customer_id<>a.customer_id
      AND other.active='نعم'
      AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code
   )
 LIMIT 1
`;

// CAS protects against password races, token logout/revocation, locks,
// enrollment/control changes and a concurrent old-password login. Version
// increment renders ALL existing customer sessions unusable immediately,
// without requiring unbounded delete/update scans of old token rows.
export const CUSTOMER_PASSWORD_CHANGE_CAS_SQL_V0=`
UPDATE customer_portal_native_accounts_v1
   SET password_salt_hex=?,password_hash_hex=?,
       session_version=session_version+1,
       failed_attempts=0,locked_until_ms=0,updated_at=CURRENT_TIMESTAMP
 WHERE customer_id=? AND portal_code=? AND state='ACTIVE'
   AND must_change=0 AND password_scheme='pbkdf2-sha256-v1'
   AND password_iterations=100000
   AND length(TRIM(verified_enrollment_ref))>0
   AND password_salt_hex=? AND password_hash_hex=?
   AND session_version=? AND failed_attempts=? AND locked_until_ms=?
   AND locked_until_ms<=?
   AND EXISTS(
     SELECT 1 FROM customer_portal_native_sessions_v1 s
      WHERE s.customer_id=customer_portal_native_accounts_v1.customer_id
        AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
        AND s.session_version=customer_portal_native_accounts_v1.session_version
        AND s.revoked_at_ms IS NULL
        AND s.issued_at_ms>0 AND s.issued_at_ms<=?
        AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
        AND s.expires_at_ms-s.issued_at_ms<=28800000
   )
   AND EXISTS(
     SELECT 1 FROM t12_customers c
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE c.customer_id=customer_portal_native_accounts_v1.customer_id
       AND c.active='نعم' AND TRIM(COALESCE(c.legacy_chat_code,''))<>''
       AND TRIM(c.legacy_chat_code)=customer_portal_native_accounts_v1.portal_code
       AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
       AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
       AND NOT EXISTS(
         SELECT 1 FROM t12_customers other
         WHERE other.customer_id<>c.customer_id AND other.active='نعم'
           AND TRIM(COALESCE(other.legacy_chat_code,''))=customer_portal_native_accounts_v1.portal_code
       )
   )
`;

export async function rotateNativeCustomerPasswordV0({
  db,token,secret,currentPassword,newPassword,nowMs
}={}){
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32)
    return denied('CUSTOMER_PASSWORD_STORAGE_UNAVAILABLE',503);
  if(!Number.isSafeInteger(nowMs)||nowMs<=0)
    return denied('CUSTOMER_PASSWORD_CLOCK_INVALID',503);
  if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))
    return denied('CUSTOMER_SESSION_REJECTED');
  if(typeof currentPassword!=='string'||currentPassword.length<12||
     currentPassword.length>128||typeof newPassword!=='string'||
     newPassword.length<12||newPassword.length>128||
     newPassword!==newPassword.trim()||!newPassword||
     currentPassword===newPassword)
    return denied('CUSTOMER_PASSWORD_CHANGE_INPUT_REJECTED',400);
  try{
    const fingerprint=await fingerprintCustomerSessionV0(token,secret);
    const a=await db.prepare(CUSTOMER_PASSWORD_CHANGE_LOOKUP_SQL_V0)
      .bind(fingerprint,nowMs,nowMs,nowMs).first();
    if(!a||!a.customerId)return denied('CUSTOMER_PASSWORD_CHANGE_REJECTED');
    const okay=await verifyNewCustomerPasswordV0(currentPassword,a);
    if(!okay){
      // Password-change is a credential authentication event: account-level
      // D1 CAS counts wrong OLD passwords and locks after five attempts for
      // 15 minutes. Without this, a stolen active session could guess the
      // old password indefinitely and bypass the login Durable Object gate.
      const failure=await db.prepare(CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0)
        .bind(nowMs+CUSTOMER_NATIVE_LOGIN_LOCK_MS_V0,a.customerId,a.portalCode,
          a.passwordSaltHex,a.passwordHashHex,a.sessionVersion,
          a.failedAttempts,nowMs).run();
      if(!failure||!failure.meta||failure.meta.changes!==1)
        return denied('CUSTOMER_PASSWORD_CHANGE_UNAVAILABLE',503);
      return denied('CUSTOMER_PASSWORD_CHANGE_REJECTED');
    }
    const fresh=await hashNewCustomerPasswordV0(newPassword);
    if(fresh.passwordSaltHex===a.passwordSaltHex)
      return denied('CUSTOMER_PASSWORD_CHANGE_UNAVAILABLE',503);
    const run=await db.prepare(CUSTOMER_PASSWORD_CHANGE_CAS_SQL_V0)
      .bind(fresh.passwordSaltHex,fresh.passwordHashHex,
        a.customerId,a.portalCode,a.passwordSaltHex,a.passwordHashHex,
        a.sessionVersion,a.failedAttempts,a.lockedUntilMs,nowMs,
        fingerprint,nowMs,nowMs).run();
    if(run&&run.meta&&run.meta.changes===1)
      return {status:200,body:{success:true,passwordChanged:true,
        forceRelogin:true,allPreviousSessionsInvalidated:true,
        source:'customer-d1-native-password-rotate-stage-v0'}};
    if(run&&run.meta&&run.meta.changes===0)
      return denied('CUSTOMER_PASSWORD_CHANGE_REJECTED');
    return denied('CUSTOMER_PASSWORD_CHANGE_ACK_UNVERIFIED',503);
  }catch{
    // No database, secret, password or other-customer details in responses.
    return denied('CUSTOMER_PASSWORD_CHANGE_UNAVAILABLE',503);
  }
}

async function boundedBody(request){
  const reader=request.body&&request.body.getReader();
  if(!reader)return null;
  const chunks=[];let count=0;
  try{
    while(true){
      const next=await reader.read();
      if(next.done)break;
      count+=next.value.byteLength;
      if(count>2048){await reader.cancel();return null;}
      chunks.push(next.value);
    }
    const buffer=new Uint8Array(count);let at=0;
    for(const chunk of chunks){buffer.set(chunk,at);at+=chunk.byteLength;}
    return new TextDecoder('utf-8',{fatal:true}).decode(buffer);
  }catch{return null;}
}
export async function handleCustomerNativePasswordChangeStageV0(request,env={}){
  let url;
  try{url=new URL(request.url);}catch{return respond(denied('CUSTOMER_PASSWORD_ROUTE_BAD_URL',400));}
  if(url.pathname!==CUSTOMER_NATIVE_PASSWORD_CHANGE_PATH_V0||url.search||url.hash)
    return respond(denied('CUSTOMER_PASSWORD_ROUTE_DENIED',404));
  const origin=text(request.headers.get('Origin'));
  const allow=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||origin==='null'||!allow.includes(origin))
    return respond(denied('CUSTOMER_PASSWORD_ORIGIN_FORBIDDEN',403));
  if(request.method==='OPTIONS')
    return new Response(null,{status:204,headers:{
      'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'POST,OPTIONS',
      'access-control-allow-headers':'authorization,content-type,accept',
      'cache-control':'no-store'
    }});
  if(request.method!=='POST')
    return respond(denied('CUSTOMER_PASSWORD_METHOD_DENIED',405),origin);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_PASSWORD_CHANGE_V0_ENABLED!=='true')
    return respond(denied('CUSTOMER_PASSWORD_ROUTE_OFF',503),origin);
  const bearer=/^Bearer ([a-f0-9]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!bearer)return respond(denied('CUSTOMER_SESSION_REJECTED'),origin);
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(text(request.headers.get('Content-Type'))))
    return respond(denied('CUSTOMER_PASSWORD_CONTENT_TYPE_DENIED',415),origin);
  let body;
  try{const raw=await boundedBody(request);body=raw==null?null:JSON.parse(raw);}
  catch{return respond(denied('CUSTOMER_PASSWORD_BODY_INVALID',400),origin);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).length!==2||
    !Object.prototype.hasOwnProperty.call(body,'currentPassword')||
    !Object.prototype.hasOwnProperty.call(body,'newPassword'))
    return respond(denied('CUSTOMER_PASSWORD_BODY_INVALID',400),origin);
  const result=await rotateNativeCustomerPasswordV0({
    db:env.DB,secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    token:bearer[1].toLowerCase(),currentPassword:body.currentPassword,
    newPassword:body.newPassword,nowMs:Date.now()
  });
  return respond(result,origin);
}
