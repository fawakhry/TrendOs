// Entry657: source-only customer phone OTP -> new native password primitives.
// NOT wired into Cloudflare Worker; NO fetch, DB mutation, SMS sender, password
// reset, browser route, or automatic customer account enrollment.
const OTP_TTL_MS = 5 * 60 * 1000;
const GRANT_MAX_MS = 30 * 24 * 60 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const HOURLY_LIMIT = 3;
const MAX_ATTEMPTS = 5;
const PBKDF2_ITERATIONS = 100000;

const text = (v) => String(v == null ? '' : v).trim();
const validHex = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const byteHex = (bytes) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
function hexBytes(v) {
  const val = text(v);
  if (!/^[0-9a-f]{32}$/i.test(val)) throw new TypeError('invalid salt');
  return Uint8Array.from({length:16}, (_,i) => Number.parseInt(val.slice(i*2,i*2+2), 16));
}
function sameHex(a,b) {
  const x = text(a), y = text(b);
  if (x.length !== 64 || y.length !== 64) return false;
  let diff = 0;
  for (let i=0;i<64;i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
function validSecret(s) {
  // Only synthetic secrets are used by this offline-only module.
  if (typeof s !== 'string' || s.length < 32) throw new TypeError('secret not configured');
  return s;
}
async function hmacHex(secret, parts) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(validSecret(secret)),
    {name:'HMAC',hash:'SHA-256'}, false, ['sign']
  );
  const bytes = new TextEncoder().encode(JSON.stringify(parts));
  return byteHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes)));
}

export function normalizeEgyptianMobileV0(input) {
  let v=text(input).replace(/[٠-٩۰-۹]/g, c => {
    const n='٠١٢٣٤٥٦٧٨٩'.indexOf(c);
    return n>=0 ? String(n) : String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c));
  }).replace(/[\s\-()]/g, '');
  if (v.startsWith('+20')) v='0'+v.slice(3);
  else if (v.startsWith('0020')) v='0'+v.slice(4);
  else if (v.startsWith('20') && v.length===12) v='0'+v.slice(2);
  return /^01[0125][0-9]{8}$/.test(v) ? v : null;
}

export async function fingerprintEgyptianMobileV0(phone, secret) {
  const normalized=normalizeEgyptianMobileV0(phone);
  if (!normalized) throw new TypeError('invalid phone');
  return hmacHex(secret,['trendos-customer-phone-hmac-v1',normalized]);
}

export async function otpMacV0({challengeId,customerId,phoneFingerprint,otp,secret}) {
  if (!/^[0-9]{6}$/.test(String(otp)) ||
      !/^[A-Za-z0-9_-]{24,100}$/.test(text(challengeId)) ||
      !text(customerId) || !validHex(phoneFingerprint)) throw new TypeError('invalid OTP context');
  return hmacHex(secret,['trendos-customer-phone-otp-v1',
    String(challengeId),String(customerId),phoneFingerprint,String(otp)]);
}

export function newOtpV0(random=crypto) {
  // Uniform rejection sampling: avoid modulo bias for 6-digit code.
  const max=Math.floor(0x100000000/1000000)*1000000;
  for(let n=0;n<10;n++) {
    const a=new Uint32Array(1);random.getRandomValues(a);
    if (a[0] < max) return String(a[0]%1000000).padStart(6,'0');
  }
  throw new Error('random sampling failed');
}
export function newChallengeIdV0(random=crypto) {
  const a=new Uint8Array(24);random.getRandomValues(a);
  return byteHex(a);
}

const denied=Object.freeze({eligible:false,code:'enrollment-unavailable'});
// All input objects must come from a future trusted, authenticated D1 policy
// service, NOT browser-supplied grant/customer/rate objects.
export async function assessPhoneEnrollmentV0(input) {
  if (!input || !['CANARY','GENERAL'].includes(text(input.mode))) return denied;
  const now=Number(input.nowMs);
  const c=input.customer||{}, a=input.account||{}, g=input.grant||{}, r=input.rate||{};
  const portalCode=text(input.portalCode);
  const phone=normalizeEgyptianMobileV0(input.selectedPhone);
  if (!Number.isSafeInteger(now)||now<=0 || !phone || !portalCode ||
      input.consentForSms!==true || input.independentOwnerReview===undefined ||
      input.independentOwnerReview!==true) return denied;
  if (text(c.customerId)==='' || c.active!=='نعم' ||
      text(a.customerId)!==text(c.customerId) ||
      a.state!=='PENDING' || text(a.portalCode)!==portalCode ||
      text(c.legacyChatCode)!==portalCode) return denied;
  const ownPhones=[c.phone,c.extraPhone].map(normalizeEgyptianMobileV0).filter(Boolean);
  if (!ownPhones.includes(phone) || input.activeCustomerPhoneMatchCount!==1) return denied;
  if (text(g.customerId)!==text(c.customerId) || g.state!=='APPROVED' ||
      !text(g.evidenceRef) || !text(g.reviewedBy)) return denied;
  const reviewed=Number(g.reviewedAtMs),until=Number(g.expiresAtMs);
  if (!Number.isSafeInteger(reviewed)||reviewed<=0||
      reviewed>now||now-reviewed>GRANT_MAX_MS ||
      !Number.isSafeInteger(until)||until<=now || until-reviewed>GRANT_MAX_MS) return denied;
  let hash;
  try {hash=await fingerprintEgyptianMobileV0(phone,input.phoneHmacSecret);}
  catch{return denied;}
  if (!sameHex(g.phoneFingerprintHex,hash)) return denied;
  const count=Number(r.sentInWindow), last=Number(r.lastSentAtMs), start=Number(r.windowStartedAtMs);
  // Rate evidence must exist from a transactionally consistent read.
  if (![count,last,start].every(Number.isSafeInteger) || count<0 || last<0 || start<0 ||
      start>now || last>now) return denied;
  if (last>0 && now-last<RESEND_MS) return denied;
  if (now-start<3600000 && count>=HOURLY_LIMIT) return denied;
  // This is ONLY an eligibility assessment; it does not send an SMS, reserve
  // rate budget, create a challenge or prove phone possession.
  return Object.freeze({eligible:true,code:'OFFLINE_POLICY_ONLY',
    sendAuthorized:false,accountEnrollmentAuthorized:false});
}

export async function evaluateOtpAttemptV0({challenge,otp,otpSecret,nowMs}) {
  const fail=(attempts=0,status='VOID')=>Object.freeze({
    accepted:false,code:'verification-failed',attempts,status,consumedAtMs:0
  });
  if (!challenge || !Number.isSafeInteger(nowMs)||nowMs<=0) return fail();
  const current=Number(challenge.attempts);
  if(!Number.isSafeInteger(current)||current<0||current>=MAX_ATTEMPTS ||
      challenge.status!=='DELIVERED' ||
      Number(challenge.consumedAtMs||0)!==0 ||
      !Number.isSafeInteger(challenge.issuedAtMs) ||
      !Number.isSafeInteger(challenge.expiresAtMs) ||
      !Number.isSafeInteger(challenge.deliveredAtMs) ||
      challenge.deliveredAtMs<challenge.issuedAtMs ||
      challenge.expiresAtMs-challenge.issuedAtMs>OTP_TTL_MS ||
      challenge.expiresAtMs<=challenge.issuedAtMs ||
      nowMs>=challenge.expiresAtMs || nowMs<challenge.deliveredAtMs) return fail(current||0);
  if (!/^[0-9]{6}$/.test(String(otp))) return fail(Math.min(MAX_ATTEMPTS,current+1),
    current+1>=MAX_ATTEMPTS?'VOID':'DELIVERED');
  let digest;
  try {
    digest=await otpMacV0({challengeId:challenge.challengeId,
      customerId:challenge.customerId,phoneFingerprint:challenge.phoneFingerprintHex,
      otp,secret:otpSecret});
  } catch{return fail(Math.min(MAX_ATTEMPTS,current+1),
    current+1>=MAX_ATTEMPTS?'VOID':'DELIVERED');}
  const attempts=current+1;
  if(!sameHex(challenge.otpMacHex,digest)) return fail(attempts,
    attempts>=MAX_ATTEMPTS?'VOID':'DELIVERED');
  // Server writer MUST atomically CAS status DELIVERED -> VERIFIED with
  // attempts<5 and consumed_at_ms=0; this pure function is not a redemption API.
  return Object.freeze({accepted:true,code:'OFFLINE_VALIDATED',
    attempts,status:'VERIFIED',consumedAtMs:nowMs});
}

export async function hashNewCustomerPasswordV0(password, salt=crypto.getRandomValues(new Uint8Array(16))) {
  if (typeof password!=='string' ||
      password.length<12 || password.length>128 ||
      !password.trim() || !(salt instanceof Uint8Array) || salt.length!==16) {
    throw new TypeError('new password does not meet policy');
  }
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),
    'PBKDF2',false,['deriveBits']);
  const derived=await crypto.subtle.deriveBits({
    name:'PBKDF2',hash:'SHA-256',salt,iterations:PBKDF2_ITERATIONS
  },key,256);
  return Object.freeze({passwordScheme:'pbkdf2-sha256-v1',
    passwordIterations:PBKDF2_ITERATIONS,
    passwordSaltHex:byteHex(salt),passwordHashHex:byteHex(new Uint8Array(derived))});
}
export async function verifyNewCustomerPasswordV0(password,stored) {
  if (!stored||stored.passwordScheme!=='pbkdf2-sha256-v1'||
      stored.passwordIterations!==PBKDF2_ITERATIONS ||
      !validHex(stored.passwordHashHex)) return false;
  try {
    const computed=await hashNewCustomerPasswordV0(password,hexBytes(stored.passwordSaltHex));
    return sameHex(computed.passwordHashHex,stored.passwordHashHex);
  } catch {return false;}
}

export const CUSTOMER_ENROLLMENT_POLICY_V0=Object.freeze({
  sourceOnly:true,liveRouteAvailable:false,smsSenderConfigured:false,
  maxOtpAgeMs:OTP_TTL_MS,maxOtpAttempts:MAX_ATTEMPTS,
  minResendDelayMs:RESEND_MS,maxSmsPerHour:HOURLY_LIMIT,
  pbkdf2Iterations:PBKDF2_ITERATIONS,passwordMinLength:12,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
