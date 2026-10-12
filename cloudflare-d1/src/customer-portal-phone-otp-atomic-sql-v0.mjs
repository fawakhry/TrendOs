// Entry658 — inert, SOURCE-ONLY prepared SQLite/D1 statement contracts.
// Do NOT import into index_v2.js. NO Worker route, DB connector, SMS provider,
// fetch, side effects, account activation or permission to apply migrations.
// Only trusted server-side code may bind random challenge ID/HMAC MAC and times.
// Customer/master phone uniqueness and consent need separate owner approval.
export const OTP_RESERVE_PREPARED_SQL_V0 = `
INSERT INTO customer_portal_phone_challenges_v1
 (challenge_id,customer_id,phone_fingerprint_hex,otp_mac_hex,
  status,issued_at_ms,expires_at_ms,delivered_at_ms,attempts,consumed_at_ms)
SELECT ?, g.customer_id, g.phone_fingerprint_hex, ?,
       'PREPARED', ?, ?, 0, 0, 0
  FROM customer_portal_phone_grants_v1 g
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=g.customer_id
  JOIN t12_customers c ON c.customer_id=g.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE g.customer_id=?
   AND g.phone_fingerprint_hex=?
   AND g.state='APPROVED'
   AND g.reviewed_at_ms>0 AND g.reviewed_at_ms<=?
   AND g.expires_at_ms>?
   AND g.expires_at_ms-g.reviewed_at_ms<=2592000000
   AND length(TRIM(g.evidence_ref))>0 AND length(TRIM(g.reviewed_by))>0
   AND a.state='PENDING' AND c.active='نعم'
   AND a.portal_code=TRIM(c.legacy_chat_code)
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.mode IN ('CANARY','GENERAL')
   AND NOT EXISTS (
     SELECT 1 FROM customer_portal_phone_challenges_v1 live
      WHERE live.phone_fingerprint_hex=g.phone_fingerprint_hex
        AND live.status IN ('PREPARED','DELIVERED')
        AND live.expires_at_ms>?
   )
   AND NOT EXISTS (
     SELECT 1 FROM customer_portal_phone_challenges_v1 recent
      WHERE recent.phone_fingerprint_hex=g.phone_fingerprint_hex
        AND recent.issued_at_ms>?-60000
   )
   AND (
     SELECT COUNT(*) FROM customer_portal_phone_challenges_v1 hourly
      WHERE hourly.phone_fingerprint_hex=g.phone_fingerprint_hex
        AND hourly.issued_at_ms>?-3600000
   )<3
`;

// Only trusted provider delivery acknowledgement may use this statement.
// A PREPARED challenge does not count as a successful SMS delivery.
export const OTP_MARK_DELIVERED_CAS_SQL_V0 = `
UPDATE customer_portal_phone_challenges_v1
   SET status='DELIVERED',delivered_at_ms=?
 WHERE challenge_id=? AND customer_id=? AND phone_fingerprint_hex=?
   AND status='PREPARED' AND attempts=0 AND consumed_at_ms=0
   AND issued_at_ms<=? AND expires_at_ms>?
   AND EXISTS (
     SELECT 1 FROM customer_portal_phone_grants_v1 g
     JOIN customer_portal_native_accounts_v1 a ON a.customer_id=g.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE g.customer_id=customer_portal_phone_challenges_v1.customer_id
       AND g.phone_fingerprint_hex=customer_portal_phone_challenges_v1.phone_fingerprint_hex
       AND g.state='APPROVED' AND g.expires_at_ms>?
       AND a.state='PENDING' AND ctl.mode IN ('CANARY','GENERAL')
   )
`;

// Bind ONLY server-calculated HMAC of the submitted OTP, never client-supplied
// "verified" booleans. Correct OTP is consumed in a single conditional UPDATE.
// Check D1 meta.changes===1: the input MAC alone does NOT authorize a password.
export const OTP_VERIFY_CORRECT_CAS_SQL_V0 = `
UPDATE customer_portal_phone_challenges_v1
   SET attempts=attempts+1,status='VERIFIED',consumed_at_ms=?
 WHERE challenge_id=? AND customer_id=? AND phone_fingerprint_hex=?
   AND otp_mac_hex=?
   AND status='DELIVERED' AND attempts<5 AND consumed_at_ms=0
   AND delivered_at_ms>=issued_at_ms AND delivered_at_ms<=?
   AND expires_at_ms>?
   AND EXISTS (
     SELECT 1 FROM customer_portal_phone_grants_v1 g
     JOIN customer_portal_native_accounts_v1 a ON a.customer_id=g.customer_id
     JOIN t12_customers c ON c.customer_id=g.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE g.customer_id=customer_portal_phone_challenges_v1.customer_id
       AND g.phone_fingerprint_hex=customer_portal_phone_challenges_v1.phone_fingerprint_hex
       AND g.state='APPROVED' AND g.expires_at_ms>?
       AND a.state='PENDING' AND c.active='نعم'
       AND a.portal_code=TRIM(c.legacy_chat_code)
       AND ctl.mode IN ('CANARY','GENERAL')
   )
`;

// Execute only when the correct-OTP CAS returned changes=0. Increment for
// wrong values with the same guard; fifth wrong attempt voids the challenge.
// This is not a public API and does not return customer-specific reasons.
export const OTP_VERIFY_WRONG_CAS_SQL_V0 = `
UPDATE customer_portal_phone_challenges_v1
   SET attempts=attempts+1,
       status=CASE WHEN attempts>=4 THEN 'VOID' ELSE 'DELIVERED' END
 WHERE challenge_id=? AND customer_id=? AND phone_fingerprint_hex=?
   AND otp_mac_hex<>?
   AND status='DELIVERED' AND attempts<5 AND consumed_at_ms=0
   AND delivered_at_ms>=issued_at_ms AND delivered_at_ms<=?
   AND expires_at_ms>?
   AND EXISTS (
     SELECT 1 FROM customer_portal_phone_grants_v1 g
     JOIN customer_portal_native_accounts_v1 a ON a.customer_id=g.customer_id
     JOIN t12_customers c ON c.customer_id=g.customer_id
     JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
     WHERE g.customer_id=customer_portal_phone_challenges_v1.customer_id
       AND g.phone_fingerprint_hex=customer_portal_phone_challenges_v1.phone_fingerprint_hex
       AND g.state='APPROVED' AND g.expires_at_ms>?
       AND a.state='PENDING' AND c.active='نعم'
       AND a.portal_code=TRIM(c.legacy_chat_code)
       AND ctl.mode IN ('CANARY','GENERAL')
   )
`;

// When a server-side provider reports a definitive delivery failure, the
// preparatory reservation may be VOIDED; the hourly limit still counts it.
export const OTP_VOID_UNSENT_CAS_SQL_V0 = `
UPDATE customer_portal_phone_challenges_v1
   SET status='VOID'
 WHERE challenge_id=? AND customer_id=? AND phone_fingerprint_hex=?
   AND status='PREPARED' AND delivered_at_ms=0
   AND attempts=0 AND consumed_at_ms=0
`;

export const OTP_ATOMIC_POLICY_V0 = Object.freeze({
  sourceOnly:true, liveWorkerImported:false, providerSelected:false,
  challengeMaxAgeMs:300000, resendCooldownMs:60000,
  maxPreparedPerHour:3,maxVerificationAttempts:5,
  onlyPreparedCanBeMarkedDelivered:true,
  onlyDeliveredCanBeVerified:true, verifiedChallengeNotPasswordGrant:true,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
