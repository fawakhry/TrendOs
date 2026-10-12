/**
 * Offline Ed25519 proof-of-concept for FICTIONAL Ubuntu diagnostic envelopes.
 * This intentionally cannot accept any real host/production evidence.
 * No credentials, signing key, filesystem/network/SSH/shell/CUPS or printer I/O.
 * Public verifying keys and monotonic counters must come from an independent
 * trusted source in a FUTURE design; the current caller is a synthetic test.
 */
import { reviewUbuntuOfflineDiagnosticFixture } from './ubuntu-offline-diagnostic-envelope-v0.mjs';

const SIGNED_SCHEMA='PRINTSHOP_UBUNTU_SIGNED_MOCK_V1';
const PREFIX='TREND_MALL_PRINTSHOP_UBUNTU_SIGNED_MOCK_V1\n';
const MOCK_MODES=Object.freeze({ source:'SYNTHETIC_SIGNED_TEST_FIXTURE',mode:'OFFLINE_NO_HOST' });
const REPORT_KEYS=['schema','source','mode','reportId','observedAt','deviceReady','services'];
const ENVELOPE_KEYS=['schema','source','mode','deviceId','keyId','sequence','issuedAt','expiresAt','report','signature'];
const SERVICE_KEYS=['module','state','sourceEvidenceRef'];
const FAKE_REF=/^FAKE-[A-Z0-9][A-Z0-9_.-]{3,50}$/;
const SIGNATURE=/^[A-Za-z0-9_-]{85}[AQgw]$/;
const FRESHNESS_MS=300000,MAX_FUTURE_MS=30000,MAX_SERIALIZED_BYTES=6144;

export const UBUNTU_SIGNED_MOCK_V1=Object.freeze({
 schema:SIGNED_SCHEMA,mode:MOCK_MODES.mode,source:MOCK_MODES.source,
 productionIdentityAndTrustStore:'NOT_IMPLEMENTED',
 persistedReplayStore:'NOT_IMPLEMENTED',
 keyProvisioning:'NOT_IMPLEMENTED',
 verifiedRealHost:'NO',
 connectedToUbuntu:false,executeOSCommands:false,accessPrintServer:false,
 performRealPrinting:false,writeAccounts:false,writeStock:false,
 permittedPurpose:'OFFLINE_FICTIONAL_REPLAY_EXPIRY_TAMPER_TEST',
 ownerGates:'G1_G2_G3_G4_G5_OPEN',releaseDecision:'NO_GO'
});

function stop(status,extra={}) {
 return Object.freeze({
  status,syntheticOnly:true,cryptographicallyVerifiedFakeReport:false,
  realUbuntuConnected:false,realPrinterConnected:false,
  printServerProductionAcceptance:false,
  executeUbuntuAllowed:false,sendPrintJobAllowed:false,
  canUpdateAccountingOrStock:false,canDeployOrGrantAccess:false,
  independentRealKeyStore:false,persistentReplayDefense:false,
  ownerGates:'G1_G2_G3_G4_G5_OPEN',releaseDecision:'NO_GO',
  ...extra
 });
}
function plain(x) {
 return !!x && typeof x==='object'&&!Array.isArray(x) &&
  (Object.getPrototypeOf(x)===Object.prototype || Object.getPrototypeOf(x)===null);
}
function exactData(x,keys) {
 if(!plain(x) || Reflect.ownKeys(x).length!==keys.length) return false;
 return keys.every(k=>{
  const p=Object.getOwnPropertyDescriptor(x,k);
  return !!p && Object.hasOwn(p,'value');
 });
}
function safeIso(x){
 if(typeof x!=='string'|| !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x))
  return false;
 const ms=Date.parse(x);
 return Number.isFinite(ms)&&new Date(ms).toISOString()===x;
}
function validMockPayload(x) {
 if(!exactData(x,ENVELOPE_KEYS) || x.schema!==SIGNED_SCHEMA ||
  x.source!==MOCK_MODES.source || x.mode!==MOCK_MODES.mode ||
  !FAKE_REF.test(x.deviceId)||!FAKE_REF.test(x.keyId)||
  !Number.isSafeInteger(x.sequence)||x.sequence<1||
  !safeIso(x.issuedAt)||!safeIso(x.expiresAt)||
  typeof x.signature!=='string'||!SIGNATURE.test(x.signature)||
  !exactData(x.report,REPORT_KEYS)||
  !Array.isArray(x.report.services)||x.report.services.length!==6||
  !x.report.services.every(x=>exactData(x,SERVICE_KEYS))) return false;
 return true;
}
function orderedReport(x){
 return {
  schema:x.schema,source:x.source,mode:x.mode,
  reportId:x.reportId,observedAt:x.observedAt,
  deviceReady:x.deviceReady,
  services:x.services.map(s=>({
   module:s.module,state:s.state,sourceEvidenceRef:s.sourceEvidenceRef,
  })),
 };
}
function signingMessage(x) {
 const report=orderedReport(x.report);
 return PREFIX+JSON.stringify({
  schema:x.schema,source:x.source,mode:x.mode,deviceId:x.deviceId,
  keyId:x.keyId,sequence:x.sequence,issuedAt:x.issuedAt,
  expiresAt:x.expiresAt,report,
 });
}
/** Used ONLY by negative fixtures; exposes unsigned canonical bytes, not signing. */
export function mockDiagnosticSigningBytesV1(x) {
 if(!validMockPayload(x)) throw new TypeError('INVALID_SYNTHETIC_SIGNED_ENVELOPE');
 return new TextEncoder().encode(signingMessage(x));
}
function decoded64(x) {
 try {
  const bin=atob(x.replace(/-/g,'+').replace(/_/g,'/')+'==');
  if(bin.length!==64)return null;
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
 }catch{return null;}
}
/**
 * trust is an independently supplied *fictional* scope, not read from
 * envelope. trustedPublicKey must be an Ed25519 verify-only CryptoKey;
 * lastSequence is supplied, never persisted. nowMs is injected fake clock.
 */
export async function reviewSignedUbuntuMockEvidenceV1(envelope,trust) {
 if(!validMockPayload(envelope))
  return stop('STOP_UNTRUSTED_OR_NONMOCK_DIAGNOSTIC_ENVELOPE');
 if(!exactData(trust,['deviceId','keyId','lastSequence','nowMs','trustedPublicKey']) ||
  trust.deviceId!==envelope.deviceId||trust.keyId!==envelope.keyId||
  !FAKE_REF.test(trust.deviceId)||!FAKE_REF.test(trust.keyId)||
  !Number.isSafeInteger(trust.lastSequence)||trust.lastSequence<0||
  !Number.isSafeInteger(trust.nowMs)||trust.nowMs<0)
  return stop('STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE');
 const key=trust.trustedPublicKey;
 if(!key || key.type!=='public'||key.algorithm?.name!=='Ed25519' ||
  !Array.isArray(key.usages)||!key.usages.includes('verify'))
  return stop('STOP_NO_TRUSTED_ED25519_VERIFY_KEY');
 const issued=Date.parse(envelope.issuedAt),expires=Date.parse(envelope.expiresAt);
 if(issued>expires||expires-issued>FRESHNESS_MS||expires-issued<=0 ||
  issued>trust.nowMs+MAX_FUTURE_MS || expires<=trust.nowMs ||
  Math.abs(Date.parse(envelope.report.observedAt)-issued)>MAX_FUTURE_MS)
  return stop('STOP_EXPIRED_FUTURE_OR_INCONSISTENT_MOCK_TIMESTAMP');
 if(envelope.sequence<=trust.lastSequence)
  return stop('STOP_REPLAY_OR_OLD_MOCK_SEQUENCE');
 const report=reviewUbuntuOfflineDiagnosticFixture(envelope.report);
 if(!report.status.startsWith('SYNTHETIC_DIAGNOSTICS_'))
  return stop('STOP_INVALID_INNER_MOCK_REPORT',{mockReviewStatus:report.status});
 let message;
 try{message=mockDiagnosticSigningBytesV1(envelope)}
 catch{return stop('STOP_UNCANONICAL_MOCK_ENVELOPE');}
 if(message.byteLength>MAX_SERIALIZED_BYTES)
  return stop('STOP_OVERSIZED_MOCK_DIAGNOSTIC');
 const sig=decoded64(envelope.signature);
 if(!sig)return stop('STOP_BAD_MOCK_SIGNATURE_ENCODING');
 if(!globalThis.crypto?.subtle)
  return stop('STOP_CRYPTO_VERIFIER_UNAVAILABLE');
 let verified=false;
 try{
  verified=await globalThis.crypto.subtle.verify(
   {name:'Ed25519'},key,sig,message);
 }catch{
  return stop('STOP_MOCK_CRYPTO_VERIFICATION_ERROR');
 }
 if(!verified)return stop('STOP_MOCK_SIGNATURE_MISMATCH');
 return stop('SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY',{
  cryptographicallyVerifiedFakeReport:true,
  hypotheticalReportStatus:report.status,
  hypotheticalAllComponentsRunning:report.hypotheticalAllComponentsReportedRunning,
  // For a future trusted state machine ONLY. Here no counter is persisted.
  proposedNextMockSequence:envelope.sequence,
 });
}
