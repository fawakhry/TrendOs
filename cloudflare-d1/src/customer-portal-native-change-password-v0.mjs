/*
 * Entry663: existing-customer password rotation, SOURCE ONLY / OFF.
 * Never imported by production Worker. Reuses Entry657 PBKDF2 verification
 * and Entry660 HMAC native session. DOES NOT trust browser customer IDs,
 * employee sessions, legacy Google tokens, or customer name/phone.
 * On success a single D1 CAS increments session_version, invalidating ALL
 * old customer sessions (including the one used to rotate the password).
 */
import {hashNewCustomerPasswordV0,verifyNewCustomerPasswordV0}
  from './customer-portal-phone-enrollment-v0.mjs';
import {fingerprintCustomerSessionV0}
  from './customer-portal-native-orders-v0.mjs';
export const CUSTOMER_NATIVE_CHANGE_PASSWORD_VERSION_V0='ENTRY663_NATIVE_CUSTOMER_CHANGE_PASSWORD_OFF_V0';
const hex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const text=v=>String(v==null?'':v).trim();
const safeNow=v=>Number.isSafeInteger(v)&&v>0;
function denied(status=401){
  return {status,body:{
    success:false,
    code:status===401?'CUSTOMER_CREDENTIAL_REJECTED':'CUSTOMER_PASSWORD_ROTATION_UNAVAILABLE',
    customerSessionsInvalidated:false,source:'d1-native-customer-password-v0'
  }};
}

export const CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0=`
SELECT a.customer_id AS customerId,
       a.portal_code AS portalCode,
       a.password_salt_hex AS passwordSaltHex,
       a.password_hash_hex AS passwordHashHex,
       a.password_scheme AS passwordScheme,
       a.password_iterations AS passwordIterations,
       a.session_version AS sessionVersion
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
   AND length(a.password_salt_hex)=32
   AND length(a.password_hash_hex)=64
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND c.active='نعم'
   AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
 LIMIT 1
`;

// Binding order:
// newSalt, newHash, customerId, portalCode, oldSalt, oldHash, version,
// mac, now, now. CAS requires the SAME unrevoked current session at commit;
// password/session version races fail to update. This also revokes every other
// session via session_version increment WITHOUT a second D1 statement.
export const CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0=`
UPDATE customer_portal_native_accounts_v1
   SET password_salt_hex=?,password_hash_hex=?,
       session_version=session_version+1,
       failed_attempts=0,locked_until_ms=0,
       updated_at=CURRENT_TIMESTAMP
 WHERE customer_id=? AND portal_code=? AND state='ACTIVE'
   AND password_scheme='pbkdf2-sha256-v1'
   AND password_iterations=100000 AND must_change=0
   AND length(TRIM(verified_enrollment_ref))>0
   AND password_salt_hex=? AND password_hash_hex=?
   AND session_version=?
   AND EXISTS (
     SELECT 1 FROM customer_portal_native_sessions_v1 s
     JOIN t12_customers c ON c.customer_id=customer_portal_native_accounts_v1.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE s.token_fingerprint_hex=?
       AND s.customer_id=customer_portal_native_accounts_v1.customer_id
       AND s.source='d1-customer-native'
       AND s.revoked_at_ms IS NULL
       AND s.session_version=customer_portal_native_accounts_v1.session_version
       AND s.issued_at_ms>0 AND s.issued_at_ms<=?
       AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
       AND s.expires_at_ms-s.issued_at_ms<=28800000
       AND c.active='نعم'
       AND TRIM(COALESCE(c.legacy_chat_code,''))=customer_portal_native_accounts_v1.portal_code
       AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
       AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   )
`;

export async function rotateNativeCustomerPasswordV0({
  db,token,secret,currentPassword,newPassword,nowMs,random=crypto
}={}){
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
     !safeNow(nowMs))return denied(503);
  if(!hex64(token)||typeof currentPassword!=='string'||
     currentPassword.length<12||currentPassword.length>128 ||
     typeof newPassword!=='string'||newPassword.length<12||
     newPassword.length>128||currentPassword===newPassword)
    return denied();
  let mac,record;
  try{
    mac=await fingerprintCustomerSessionV0(token,secret);
    record=await db.prepare(CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0)
      .bind(mac,nowMs,nowMs).first();
  }catch{return denied(503);}
  if(!record||!text(record.customerId)||!text(record.portalCode)||
     !/^[a-f0-9]{32}$/.test(record.passwordSaltHex)||
     !hex64(record.passwordHashHex)||
     !Number.isSafeInteger(Number(record.sessionVersion))||
     Number(record.sessionVersion)<1)return denied();
  let verified=false,hash;
  try{
    verified=await verifyNewCustomerPasswordV0(currentPassword,{
      passwordScheme:record.passwordScheme,
      passwordIterations:Number(record.passwordIterations),
      passwordSaltHex:record.passwordSaltHex,
      passwordHashHex:record.passwordHashHex
    });
    if(!verified)return denied();
    const bytes=new Uint8Array(16);random.getRandomValues(bytes);
    hash=await hashNewCustomerPasswordV0(newPassword,bytes);
  }catch{return denied();}
  try{
    const result=await db.prepare(CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0)
      .bind(hash.passwordSaltHex,hash.passwordHashHex,
        text(record.customerId),text(record.portalCode),
        record.passwordSaltHex,record.passwordHashHex,
        Number(record.sessionVersion),mac,nowMs,nowMs).run();
    if(result?.meta?.changes!==1)return denied(503);
    return {status:200,body:{
      success:true,source:'d1-native-customer-password-v0',
      version:CUSTOMER_NATIVE_CHANGE_PASSWORD_VERSION_V0,
      customerSessionsInvalidated:true,reloginRequired:true
    }};
  }catch{return denied(503);}
}

export const CUSTOMER_NATIVE_PASSWORD_ROTATION_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
  googleFallback:false,existingSessionRequired:true,
  allSessionsRevokedViaVersion:true,
  globalRateLimitAndCsrfIngressAvailable:false,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
