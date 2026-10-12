import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sql from '../cloudflare-d1/src/customer-portal-phone-otp-atomic-sql-v0.mjs';
const expected=[
  'OTP_RESERVE_PREPARED_SQL_V0','OTP_MARK_DELIVERED_CAS_SQL_V0',
  'OTP_VERIFY_CORRECT_CAS_SQL_V0','OTP_VERIFY_WRONG_CAS_SQL_V0',
  'OTP_VOID_UNSENT_CAS_SQL_V0'
];
for(const name of expected) {
  const statement=sql[name];
  assert.equal(typeof statement,'string',name);
  assert.match(statement,/^\s*(INSERT|UPDATE)\s+/i,name);
  assert.doesNotMatch(statement,/;|DROP\s|ALTER\s|script\.google\.com|fetch\s*\(/i,name);
}
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/ctl\.mode IN \('CANARY','GENERAL'\)/);
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/g\.state='APPROVED'/);
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/status IN \('PREPARED','DELIVERED'\)/);
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/issued_at_ms>\?-60000/);
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/issued_at_ms>\?-3600000/);
assert.match(sql.OTP_RESERVE_PREPARED_SQL_V0,/\)<3/);
assert.match(sql.OTP_MARK_DELIVERED_CAS_SQL_V0,/status='PREPARED'/);
assert.match(sql.OTP_VERIFY_CORRECT_CAS_SQL_V0,/otp_mac_hex=\?/);
assert.match(sql.OTP_VERIFY_CORRECT_CAS_SQL_V0,/status='DELIVERED' AND attempts<5 AND consumed_at_ms=0/);
assert.match(sql.OTP_VERIFY_WRONG_CAS_SQL_V0,/otp_mac_hex<>\?/);
assert.match(sql.OTP_VERIFY_WRONG_CAS_SQL_V0,/CASE WHEN attempts>=4 THEN 'VOID'/);
assert.match(sql.OTP_VOID_UNSENT_CAS_SQL_V0,/status='PREPARED'/);
const source=fs.readFileSync('cloudflare-d1/src/customer-portal-phone-otp-atomic-sql-v0.mjs','utf8');
const worker=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');
assert.doesNotMatch(worker,/customer-portal-phone-otp-atomic-sql-v0/);
assert.doesNotMatch(source,/\bfetch\s*\(|\.send\s*\(|\.run\s*\(|\.batch\s*\(/i);
assert.equal(sql.OTP_ATOMIC_POLICY_V0.sourceOnly,true);
assert.equal(sql.OTP_ATOMIC_POLICY_V0.providerSelected,false);
assert.equal(sql.OTP_ATOMIC_POLICY_V0.verifiedChallengeNotPasswordGrant,true);
assert.equal(sql.OTP_ATOMIC_POLICY_V0.productionRelease,'NO_GO');
assert.equal(sql.OTP_ATOMIC_POLICY_V0.zeroGoogleComplete,false);
console.log('ENTRY658_ATOMIC_SQL_OFFLINE_CONTRACT_PASS=YES');
console.log('ENTRY658_RUNTIME_ROUTES_AND_SMS_SENDS=0');
console.log('ENTRY658_ZERO_GOOGLE_COMPLETE=NO');
