/*
 * Entry662: customer native password login + D1 one-use session issue.
 * SOURCE ONLY. NOT imported by deployed Worker, no HTTP route, no Google.
 * Reuses Entry657 PBKDF2 verifier + Entry660 HMAC session token fingerprint.
 * A genuine independently reviewed Entry659 enrollment is prerequisite.
 * Never accept customer_id/session version/OTP claims from the browser.
 */
import { verifyNewCustomerPasswordV0 } from './customer-portal-phone-enrollment-v0.mjs';
import { fingerprintCustomerSessionV0 } from './customer-portal-native-orders-v0.mjs';

export const CUSTOMER_NATIVE_LOGIN_VERSION_V0='ENTRY662_CUSTOMER_NATIVE_LOGIN_OFF_V0';
export const CUSTOMER_NATIVE_SESSION_TTL_MS_V0=8*60*60*1000;
export const CUSTOMER_NATIVE_LOGIN_MAX_FAILURES_V0=5;
export const CUSTOMER_NATIVE_LOGIN_LOCK_MS_V0=15*60*1000;
const hex=bytes=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
const hex64=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const text=x=>String(x==null?'':x).trim();
const count=x=>Number.isSafeInteger(x)&&x>=0;

export function newNativeCustomerSessionTokenV0(random=crypto){
  const bytes=new Uint8Array(32);
  random.getRandomValues(bytes);
  return hex(bytes);
}

// Status is intentionally generic: never disclose if a portal code, password,
// customer ID or verified grant exists. No Google login fallback.
const reject=(status=401)=>({
  status,body:{
    success:false,code:status===401?'CUSTOMER_LOGIN_REJECTED':'CUSTOMER_LOGIN_UNAVAILABLE',
    customerSessionIssued:false,source:'d1-native-customer-login-v0'
  }
});

// Code equality to the existing cloud-native customer is an additional check,
// NOT an independent identity grant. The ACTIVE PBKDF2 account must already
// contain server-issued enrollment evidence. Duplicate active codes fail shut.
export const CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0=`
SELECT a.customer_id AS customerId,a.portal_code AS portalCode,
       a.password_salt_hex AS passwordSaltHex,
       a.password_hash_hex AS passwordHashHex,
       a.password_scheme AS passwordScheme,
       a.password_iterations AS passwordIterations,
       a.session_version AS sessionVersion,
       a.failed_attempts AS failedAttempts,
       a.locked_until_ms AS lockedUntilMs
  FROM customer_portal_native_accounts_v1 a
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE a.portal_code=?
   AND a.state='ACTIVE' AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(a.password_salt_hex)=32 AND length(a.password_hash_hex)=64
   AND a.must_change=0 AND length(TRIM(a.verified_enrollment_ref))>0
   AND a.session_version>=1
   AND c.active='نعم'
   AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS (
      SELECT 1 FROM t12_customers other
       WHERE other.customer_id<>a.customer_id
         AND other.active='نعم'
         AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code
   )
 LIMIT 1
`;

// Failed password CAS is scoped to the snapshot's verifier/version and the
// existing independently approved account, so password rotations cannot be
// overwritten by a stale password attempt. After five wrong attempts, a
// 15-minute cooldown applies. Expired lock counts restart from one.
export const CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0=`
UPDATE customer_portal_native_accounts_v1
   SET failed_attempts=CASE WHEN failed_attempts>=5 THEN 1 ELSE failed_attempts+1 END,
       locked_until_ms=CASE WHEN failed_attempts<5
                                 AND failed_attempts+1>=5
                            THEN ? ELSE 0 END,
       updated_at=CURRENT_TIMESTAMP
 WHERE customer_id=? AND portal_code=? AND state='ACTIVE'
   AND password_scheme='pbkdf2-sha256-v1'
   AND password_salt_hex=? AND password_hash_hex=?
   AND session_version=? AND failed_attempts=?
   AND locked_until_ms<=?
   AND EXISTS (
     SELECT 1 FROM t12_customers c
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE c.customer_id=customer_portal_native_accounts_v1.customer_id
       AND c.active='نعم'
       AND TRIM(c.legacy_chat_code)=customer_portal_native_accounts_v1.portal_code
       AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
       AND ctl.mode='GENERAL'
   )
`;

// Atomic INSERT ... SELECT rechecks exactly the password verifier, account
// session version, failure counter, bound D1 identity and GENERAL control
// after PBKDF2 verification; no TOCTOU session creation after password change
// or concurrent failed password increments.
export const CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0=`
INSERT INTO customer_portal_native_sessions_v1
  (token_fingerprint_hex,customer_id,session_version,issued_at_ms,
   expires_at_ms,revoked_at_ms,source)
SELECT ?,a.customer_id,a.session_version,?,?,NULL,'d1-customer-native'
  FROM customer_portal_native_accounts_v1 a
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE a.customer_id=? AND a.portal_code=? AND a.state='ACTIVE'
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000 AND a.must_change=0
   AND length(TRIM(a.verified_enrollment_ref))>0
   AND a.password_salt_hex=? AND a.password_hash_hex=?
   AND a.session_version=? AND a.failed_attempts=?
   AND a.locked_until_ms<=?
   AND c.active='نعم'
   AND TRIM(COALESCE(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS (
      SELECT 1 FROM t12_customers other
       WHERE other.customer_id<>a.customer_id
         AND other.active='نعم'
         AND TRIM(COALESCE(other.legacy_chat_code,''))=a.portal_code
   )
 LIMIT 1
`;

// This is NOT a public HTTP handler. Future authenticated endpoint must add
// an independent global source-IP/identifier throttle, origin/CSRF policy,
// shield against credential stuffing, secret management and runtime audit.
// Until then there is no live path that accepts customer passwords.
export async function issueNativeCustomerSessionFromPasswordV0({
  db,portalCode,password,secret,nowMs,random=crypto
}={}){
  const code=text(portalCode);
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
     !Number.isSafeInteger(nowMs)||nowMs<=0||
     typeof password!=='string'||password.length<12||password.length>128)
    return reject(503);
  if(!code||code.length>80||code!==portalCode)return reject();
  let account;
  try{account=await db.prepare(CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0).bind(code).first();}
  catch{return reject(503);}
  // Do not distinguish unknown account from wrong password in the response.
  // No password hashing for unknown accounts is exposed via a route yet.
  if(!account||!text(account.customerId)||!hex64(account.passwordHashHex)||
     !/^[a-f0-9]{32}$/.test(account.passwordSaltHex)||
     !count(Number(account.failedAttempts))||
     !Number.isSafeInteger(Number(account.sessionVersion))||
     !count(Number(account.lockedUntilMs)))return reject();
  const attempts=Number(account.failedAttempts),version=Number(account.sessionVersion);
  if(version<1||Number(account.lockedUntilMs)>nowMs)return reject();
  let valid=false;
  try{valid=await verifyNewCustomerPasswordV0(password,{
    passwordScheme:account.passwordScheme,
    passwordIterations:Number(account.passwordIterations),
    passwordSaltHex:account.passwordSaltHex,
    passwordHashHex:account.passwordHashHex
  });}
  catch{return reject(503);}
  if(!valid){
    try{
      const lockedUntil=nowMs+CUSTOMER_NATIVE_LOGIN_LOCK_MS_V0;
      const q=await db.prepare(CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0)
        .bind(lockedUntil,text(account.customerId),code,account.passwordSaltHex,
          account.passwordHashHex,version,attempts,nowMs).run();
      if(q?.meta?.changes!==1)return reject(503);
      return reject();
    }catch{return reject(503);}
  }
  if(!Number.isSafeInteger(nowMs+CUSTOMER_NATIVE_SESSION_TTL_MS_V0))return reject(503);
  try{
    const token=newNativeCustomerSessionTokenV0(random);
    const fingerprint=await fingerprintCustomerSessionV0(token,secret);
    const q=await db.prepare(CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0)
      .bind(fingerprint,nowMs,nowMs+CUSTOMER_NATIVE_SESSION_TTL_MS_V0,
        text(account.customerId),code,account.passwordSaltHex,
        account.passwordHashHex,version,attempts,nowMs).run();
    if(q?.meta?.changes!==1)return reject(503);
    // The opaque bearer is shown ONLY in this verified success response, and
    // never persisted raw to D1. No customer ID or password in response.
    return {status:200,body:{
      success:true,source:'d1-native-customer-login-v0',
      version:CUSTOMER_NATIVE_LOGIN_VERSION_V0,
      token,expiresAtMs:nowMs+CUSTOMER_NATIVE_SESSION_TTL_MS_V0,
      customerSessionIssued:true
    }};
  }catch{return reject(503);}
}
export const CUSTOMER_NATIVE_LOGIN_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,loginHttpRouteAvailable:false,
  defaultEnabled:false,googleFallback:false,liveOtpSender:false,
  globalRateThrottleAdded:false,customerPasswordImport:false,
  sessionTtlMs:CUSTOMER_NATIVE_SESSION_TTL_MS_V0,
  maxConsecutiveFailures:CUSTOMER_NATIVE_LOGIN_MAX_FAILURES_V0,
  lockDurationMs:CUSTOMER_NATIVE_LOGIN_LOCK_MS_V0,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
