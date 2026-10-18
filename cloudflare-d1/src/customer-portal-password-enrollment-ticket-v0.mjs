// Entry659 SOURCE_ONLY: trusted-server password-enrollment ticket primitives.
// Not imported by the live Worker. No SMS, D1 call, fetch or HTTP endpoint.
// NEVER issue a ticket merely because browser sends a challenge ID or claims
// otpVerified=true. Issuance belongs to an already verified *server* OTP flow.
const TOKEN_TTL_MS=10*60*1000;
const bytesToHex=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
const good64=s=>typeof s==='string' && /^[0-9a-f]{64}$/.test(s);
export function generateEnrollmentTicketV0(random=crypto){
  const v=new Uint8Array(32);random.getRandomValues(v);
  return bytesToHex(v); // secret shown once to the verified browser, never D1
}
export async function fingerprintEnrollmentTicketV0({token,customerId,challengeId,secret}){
  if(!good64(token)||!String(customerId||'').trim()||
     !/^[A-Za-z0-9_-]{24,100}$/.test(String(challengeId||''))||
     typeof secret!=='string'||secret.length<32)throw new TypeError('invalid-ticket-context');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const payload=JSON.stringify(['trendos-customer-enroll-ticket-v1',
    token,customerId,challengeId]);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign(
    'HMAC',key,new TextEncoder().encode(payload))));
}

// This UPDATE runs ONLY after the server, not a browser, proved the OTP MAC
// and won Entry658's single-use VERIFIED CAS for the SAME challenge/customer.
// Reserves a single ticket; no replacement from old VERIFIED challenges.
// Explicit SQL TTL: expiresMs - issuedMs is positive and at most 600000.
// Original Entry659's positional binds ALREADY had the correct order and
// bounded the upper lifetime. BETWEEN adds the redundant positive bound
// for auditability; tests now cover overlong and exact-boundary ticket TTL.
// Positional binds:
// mac, challengeId, issuedMs, expiresMs, customerId, portalCode,
// issuedMs, expiresMs, issuedMs, expiresMs, issuedMs, challengeId, issuedMs, issuedMs, issuedMs.
export const OTP_ISSUE_TICKET_CAS_SQL_V0=`
UPDATE customer_portal_native_accounts_v1
   SET enrollment_ticket_mac_hex=?,
       enrollment_ticket_challenge_id=?,
       enrollment_ticket_issued_at_ms=?,
       enrollment_ticket_expires_at_ms=?
 WHERE customer_id=? AND portal_code=? AND state='PENDING'
   AND enrollment_ticket_mac_hex=''
   AND ?>0 AND ?>? AND ?-? BETWEEN 1 AND 600000
   AND EXISTS(
     SELECT 1 FROM customer_portal_phone_challenges_v1 ch
     JOIN customer_portal_phone_grants_v1 g
       ON g.customer_id=ch.customer_id
      AND g.phone_fingerprint_hex=ch.phone_fingerprint_hex
     JOIN t12_customers c ON c.customer_id=ch.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE ch.challenge_id=?
       AND ch.customer_id=customer_portal_native_accounts_v1.customer_id
       AND ch.status='VERIFIED' AND ch.consumed_at_ms>0
       AND ch.consumed_at_ms<=? AND ch.consumed_at_ms>=?-120000
       AND g.state='APPROVED' AND g.expires_at_ms>?
       AND c.active='نعم'
       AND TRIM(c.legacy_chat_code)=customer_portal_native_accounts_v1.portal_code
       AND ctl.mode IN ('CANARY','GENERAL')
   )
`;

// Future caller must require the bearer enrollment-ticket secret, generate its
// server-HMAC fingerprint and a fresh PBKDF2 hash, and check rowcount===1.
// This ONE atomic conditional UPDATE sets password, activates the account,
// increments session_version and removes proof; it cannot be replayed.
// Positional binds: saltHex, hashHex, ticketMacHex, nowMs, nowMs, customerId,
// portalCode, nowMs (grant expiry). Additional state and grant checks in SQL.
export const OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0=`
UPDATE customer_portal_native_accounts_v1
   SET state='ACTIVE',
       password_scheme='pbkdf2-sha256-v1',
       password_salt_hex=?,
       password_hash_hex=?,
       password_iterations=100000,
       must_change=0,
       failed_attempts=0,
       locked_until_ms=0,
       session_version=session_version+1,
       verified_enrollment_ref='ENTRY659-OTP:'||enrollment_ticket_challenge_id,
       enrollment_ticket_mac_hex='',
       enrollment_ticket_challenge_id='',
       enrollment_ticket_issued_at_ms=0,
       enrollment_ticket_expires_at_ms=0,
       updated_at=CURRENT_TIMESTAMP
 WHERE enrollment_ticket_mac_hex=?
   AND enrollment_ticket_mac_hex<>''
   AND enrollment_ticket_issued_at_ms>0
   AND enrollment_ticket_issued_at_ms<=?
   AND enrollment_ticket_expires_at_ms>?
   AND customer_id=? AND portal_code=? AND state='PENDING'
   AND EXISTS (
     SELECT 1 FROM customer_portal_phone_challenges_v1 ch
     JOIN customer_portal_phone_grants_v1 g
       ON g.customer_id=ch.customer_id
      AND g.phone_fingerprint_hex=ch.phone_fingerprint_hex
     JOIN t12_customers c ON c.customer_id=ch.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE ch.challenge_id=customer_portal_native_accounts_v1.enrollment_ticket_challenge_id
       AND ch.customer_id=customer_portal_native_accounts_v1.customer_id
       AND ch.status='VERIFIED' AND ch.consumed_at_ms>0
       AND g.state='APPROVED' AND g.expires_at_ms>?
       AND c.active='نعم'
       AND TRIM(c.legacy_chat_code)=customer_portal_native_accounts_v1.portal_code
       AND ctl.mode IN ('CANARY','GENERAL')
   )
`;

export const OTP_ENROLLMENT_TICKET_POLICY_V0=Object.freeze({
  sourceOnly:true,customerPasswordEndpoint:false,
  customerSmsSender:false,customerSessionIssued:false,
  ticketLengthBytes:32,ticketMaxAgeMs:TOKEN_TTL_MS,
  ticketOneTimeConsumption:true,customerSecretImport:false,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
