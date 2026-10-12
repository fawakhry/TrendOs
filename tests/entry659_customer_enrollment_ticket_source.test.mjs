import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  generateEnrollmentTicketV0,fingerprintEnrollmentTicketV0,
  OTP_ISSUE_TICKET_CAS_SQL_V0,OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0,
  OTP_ENROLLMENT_TICKET_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs';

const token=generateEnrollmentTicketV0({getRandomValues(a){a.fill(7);return a;}});
assert.match(token,/^[0-9a-f]{64}$/);
const secret='FAKE-TEST-HMAC-SECRET-NOT-FOR-REAL-CUSTOMERS-2026!';
const customerId='FAKE-CUSTOMER-001', challengeId='FAKE_CHALLENGE_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mac=await fingerprintEnrollmentTicketV0({token,customerId,challengeId,secret});
assert.match(mac,/^[0-9a-f]{64}$/);
assert.notEqual(mac,token);
assert.notEqual(mac,await fingerprintEnrollmentTicketV0({
  token,customerId:'FAKE-OTHER',challengeId,secret
}));
assert.notEqual(mac,await fingerprintEnrollmentTicketV0({
  token,customerId,challengeId:'OTHER_CHALLENGE_ABCDEFGHIJKLMNOPQRSTUVWXYZ',secret
}));
await assert.rejects(fingerprintEnrollmentTicketV0({token,customerId,challengeId,secret:'tiny'}));
assert.doesNotMatch(OTP_ISSUE_TICKET_CAS_SQL_V0,/;|fetch\s*\(|script\.google\.com/);
assert.doesNotMatch(OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0,/;|fetch\s*\(|script\.google\.com/);
assert.match(OTP_ISSUE_TICKET_CAS_SQL_V0,/ch\.status='VERIFIED'/);
assert.match(OTP_ISSUE_TICKET_CAS_SQL_V0,/enrollment_ticket_mac_hex=''/);
assert.match(OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0,/enrollment_ticket_mac_hex=\?/);
assert.match(OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0,/session_version=session_version\+1/);
assert.match(OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0,/enrollment_ticket_mac_hex=''/);
const source=fs.readFileSync('cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs','utf8');
const worker=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');
assert.doesNotMatch(worker,/customer-portal-password-enrollment-ticket-v0/);
assert.doesNotMatch(source,/\bfetch\s*\(|\.run\s*\(|\.send\s*\(/);
assert.equal(OTP_ENROLLMENT_TICKET_POLICY_V0.customerPasswordEndpoint,false);
assert.equal(OTP_ENROLLMENT_TICKET_POLICY_V0.customerSmsSender,false);
assert.equal(OTP_ENROLLMENT_TICKET_POLICY_V0.customerSessionIssued,false);
assert.equal(OTP_ENROLLMENT_TICKET_POLICY_V0.productionRelease,'NO_GO');
console.log('ENTRY659_SECRET_TICKET_HMAC_BOUND_AND_ONE_TIME_DB_GATE=PASS');
console.log('ENTRY659_LIVE_ACCOUNT_PASSWORD_CHANGE=NO');
console.log('ENTRY659_ZERO_GOOGLE_COMPLETE=NO');
