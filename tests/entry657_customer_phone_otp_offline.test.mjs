import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeEgyptianMobileV0, fingerprintEgyptianMobileV0, otpMacV0,
  newOtpV0, newChallengeIdV0, assessPhoneEnrollmentV0,
  evaluateOtpAttemptV0, hashNewCustomerPasswordV0,
  verifyNewCustomerPasswordV0, CUSTOMER_ENROLLMENT_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs';

const phoneSecret='FAKE-PHONE-HMAC-SECRET-DO-NOT-USE-2026!';
const otpSecret='FAKE-OTP-HMAC-SECRET-DO-NOT-USE-2026!!';
const now=1800000000000;
const phone='01012345678';
assert.equal(normalizeEgyptianMobileV0(phone),phone);
for(const input of ['+201012345678','00201012345678','201012345678',
                    '٠١٠١٢٣٤٥٦٧٨','۰۱۰۱۲۳۴۵۶۷۸','010-1234-5678']) {
  assert.equal(normalizeEgyptianMobileV0(input),phone,input);
}
for(const input of ['01012345','010123456789','+331012345678','01312345678',
                    '0111234567x','01012345679;other']) {
  assert.equal(normalizeEgyptianMobileV0(input),null,input);
}
const phoneFingerprint=await fingerprintEgyptianMobileV0(phone,phoneSecret);
assert.match(phoneFingerprint,/^[0-9a-f]{64}$/);
assert.notEqual(phoneFingerprint,await fingerprintEgyptianMobileV0('01112345678',phoneSecret));
console.log('ENTRY657_EGYPT_MOBILE_NORMALIZATION_AND_PHONE_MAC=PASS');

const fixture={
  mode:'CANARY',nowMs:now,portalCode:'FAKE-CODE-001',
  selectedPhone:phone,phoneHmacSecret:phoneSecret,
  consentForSms:true,independentOwnerReview:true,
  activeCustomerPhoneMatchCount:1,
  customer:{customerId:'FAKE-CUSTOMER-001',active:'نعم',
            legacyChatCode:'FAKE-CODE-001',phone,extraPhone:''},
  account:{customerId:'FAKE-CUSTOMER-001',state:'PENDING',portalCode:'FAKE-CODE-001'},
  grant:{customerId:'FAKE-CUSTOMER-001',state:'APPROVED',
         phoneFingerprintHex:phoneFingerprint,
         evidenceRef:'FAKE-OWNER-REVIEW',reviewedBy:'FAKE-STAFF',
         reviewedAtMs:now-3600000,expiresAtMs:now+3600000},
  rate:{windowStartedAtMs:now-7200000,sentInWindow:0,lastSentAtMs:0}
};
const allow=await assessPhoneEnrollmentV0(fixture);
assert.equal(allow.eligible,true);
assert.equal(allow.sendAuthorized,false);
assert.equal(allow.accountEnrollmentAuthorized,false);
assert.deepEqual(Object.keys(allow),['eligible','code','sendAuthorized','accountEnrollmentAuthorized']);

const denyCases=[
  {mode:'OFF'},
  {mode:'READONLY'},
  {consentForSms:false},
  {independentOwnerReview:false},
  {activeCustomerPhoneMatchCount:2},
  {activeCustomerPhoneMatchCount:0},
  {selectedPhone:'01112345678'},
  {portalCode:'FAKE-CODE-002'},
  {account:{...fixture.account,state:'ACTIVE'}},
  {account:{...fixture.account,customerId:'FAKE-OTHER'}},
  {customer:{...fixture.customer,active:'لا'}},
  {customer:{...fixture.customer,legacyChatCode:'FAKE-OTHER'}},
  {grant:{...fixture.grant,state:'PENDING'}},
  {grant:{...fixture.grant,reviewedBy:''}},
  {grant:{...fixture.grant,phoneFingerprintHex:'f'.repeat(64)}},
  {grant:{...fixture.grant,expiresAtMs:now}},
  {grant:{...fixture.grant,reviewedAtMs:now-31*86400000}},
  {rate:{...fixture.rate,lastSentAtMs:now-30000}},
  {rate:{...fixture.rate,windowStartedAtMs:now-3600000+1,sentInWindow:3}},
  {rate:{...fixture.rate,sentInWindow:NaN}},
  {phoneHmacSecret:'too-short'}
];
for(const patch of denyCases){
  const r=await assessPhoneEnrollmentV0({...fixture,...patch});
  assert.deepEqual(r,{eligible:false,code:'enrollment-unavailable'});
}
console.log('ENTRY657_EXCLUSIVE_REVIEWED_PHONE_BOUND_ACCOUNT_GATE=PASS');

const challengeId='FAKE_CHALLENGE_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mac=await otpMacV0({challengeId,customerId:fixture.customer.customerId,
  phoneFingerprint,otp:'012345',secret:otpSecret});
assert.match(mac,/^[0-9a-f]{64}$/);
assert.notEqual(mac,await otpMacV0({challengeId,customerId:fixture.customer.customerId,
  phoneFingerprint,otp:'012346',secret:otpSecret}));
assert.notEqual(mac,await otpMacV0({challengeId:'OTHER_CHALLENGE_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  customerId:fixture.customer.customerId,phoneFingerprint,otp:'012345',secret:otpSecret}));
const challenge={challengeId,customerId:fixture.customer.customerId,
  phoneFingerprintHex:phoneFingerprint,otpMacHex:mac,
  status:'DELIVERED',issuedAtMs:now-1000,deliveredAtMs:now-990,
  expiresAtMs:now+299000,attempts:0,consumedAtMs:0};
const verified=await evaluateOtpAttemptV0({challenge,otp:'012345',otpSecret,nowMs:now});
assert.equal(verified.accepted,true);
assert.equal(verified.status,'VERIFIED');
assert.equal(verified.consumedAtMs,now);
const wrong=await evaluateOtpAttemptV0({challenge,otp:'012346',otpSecret,nowMs:now});
assert.equal(wrong.accepted,false);
assert.equal(wrong.attempts,1);
assert.equal(wrong.status,'DELIVERED');
const fifth=await evaluateOtpAttemptV0({challenge:{...challenge,attempts:4},
  otp:'012346',otpSecret,nowMs:now});
assert.equal(fifth.accepted,false);
assert.equal(fifth.status,'VOID');
for(const ch of [
  {...challenge,status:'PREPARED'},
  {...challenge,status:'VERIFIED',consumedAtMs:now-10},
  {...challenge,status:'VOID'},
  {...challenge,attempts:5},
  {...challenge,expiresAtMs:now},
  {...challenge,deliveredAtMs:0},
  {...challenge,otpMacHex:'bad'}
]) {
  const r=await evaluateOtpAttemptV0({challenge:ch,otp:'012345',otpSecret,nowMs:now});
  assert.equal(r.accepted,false);
  assert.equal(r.code,'verification-failed');
}
const noSecret=await evaluateOtpAttemptV0({challenge,otp:'012345',otpSecret:'bad',nowMs:now});
assert.equal(noSecret.accepted,false);
assert.deepEqual(Object.keys(verified),['accepted','code','attempts','status','consumedAtMs']);
console.log('ENTRY657_OTP_HMAC_EXPIRY_ATTEMPT_REPLAY_AND_NODATA=PASS');

const pseudorandom={getRandomValues(a){a.fill(1000000);return a;}};
assert.equal(newOtpV0(pseudorandom),'000000');
const challengeValue=newChallengeIdV0({getRandomValues(a){a.fill(3);return a;}});
assert.match(challengeValue,/^[0-9a-f]{48}$/);

await assert.rejects(hashNewCustomerPasswordV0('short'));
const hash=await hashNewCustomerPasswordV0('FAKE-new password 2026!',new Uint8Array(16).fill(7));
assert.equal(hash.passwordScheme,'pbkdf2-sha256-v1');
assert.equal(hash.passwordIterations,100000);
assert.match(hash.passwordHashHex,/^[0-9a-f]{64}$/);
assert.match(hash.passwordSaltHex,/^[0-9a-f]{32}$/);
assert.equal(await verifyNewCustomerPasswordV0('FAKE-new password 2026!',hash),true);
assert.equal(await verifyNewCustomerPasswordV0('wrong-customer-password!',hash),false);
assert.equal(await verifyNewCustomerPasswordV0('FAKE-new password 2026!',{
  ...hash,passwordIterations:999
}),false);
console.log('ENTRY657_NEW_PASSWORD_PBKDF2_ONLY_NO_GOOGLE_IMPORT=PASS');

const source=fs.readFileSync('cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs','utf8');
const worker=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');
assert.doesNotMatch(source,/\bfetch\s*\(|\.sendSms\s*\(|\.sendSMS\s*\(|\.run\s*\(|\.batch\s*\(/i);
assert.doesNotMatch(worker,/customer-portal-phone-enrollment-v0/);
assert.equal(CUSTOMER_ENROLLMENT_POLICY_V0.sourceOnly,true);
assert.equal(CUSTOMER_ENROLLMENT_POLICY_V0.liveRouteAvailable,false);
assert.equal(CUSTOMER_ENROLLMENT_POLICY_V0.smsSenderConfigured,false);
assert.equal(CUSTOMER_ENROLLMENT_POLICY_V0.productionRelease,'NO_GO');
assert.equal(CUSTOMER_ENROLLMENT_POLICY_V0.zeroGoogleComplete,false);
console.log('ENTRY657_SMS_SENT=NO');
console.log('ENTRY657_NATIVE_CUSTOMER_LOGIN_ENABLED=NO');
console.log('ENTRY657_PRODUCTION_MUTATION=NO');
console.log('ENTRY657_ZERO_GOOGLE_COMPLETE=NO');
