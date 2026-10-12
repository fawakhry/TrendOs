import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign} from 'node:crypto';
import {
 UBUNTU_SIGNED_MOCK_V1 as POLICY,
 mockDiagnosticSigningBytesV1 as bytes,
 reviewSignedUbuntuMockEvidenceV1 as verify,
} from '../core/ubuntu-signed-mock-evidence-v1.mjs';

const T=Date.parse('2026-10-12T10:11:15.000Z');
const SERVICE_NAMES=['TRENDOS_UI','TRENDOS_API','PRINT_SERVER','CUPS','PRINTER_DEVICE','LOCAL_DIAGNOSTIC_AGENT'];
const fakeReport=()=>({
 schema:'PRINTSHOP_UBUNTU_OFFLINE_DIAGNOSTIC_V0',
 source:'SYNTHETIC_TEST_FIXTURE',mode:'OFFLINE_NO_HOST',
 reportId:'FAKE-REPORT-0001',observedAt:'2026-10-12T10:11:12.000Z',
 deviceReady:true,
 services:SERVICE_NAMES.map((module,i)=>({
  module,state:'MOCK_RUNNING',sourceEvidenceRef:'FAKE-REF-'+(100+i)
 })),
});
function fixture(){
 return {
  schema:'PRINTSHOP_UBUNTU_SIGNED_MOCK_V1',
  source:'SYNTHETIC_SIGNED_TEST_FIXTURE',
  mode:'OFFLINE_NO_HOST',
  deviceId:'FAKE-DEVICE-0001',keyId:'FAKE-PUBLIC-KEY-0001',
  sequence:1,issuedAt:'2026-10-12T10:11:12.000Z',
  expiresAt:'2026-10-12T10:14:12.000Z',
  report:fakeReport(),
  signature:'A'.repeat(86),
 };
}
async function keypair(){
 const {privateKey,publicKey}=generateKeyPairSync('ed25519');
 const verifyKey=await globalThis.crypto.subtle.importKey(
  'spki',publicKey.export({format:'der',type:'spki'}),
  {name:'Ed25519'},false,['verify']);
 return {privateKey,verifyKey};
}
function signMock(f,privateKey){
 return {...f,signature:sign(null,Buffer.from(bytes(f)),privateKey).toString('base64url')};
}
function scope(publicKey,params={}){
 return {
  deviceId:'FAKE-DEVICE-0001',keyId:'FAKE-PUBLIC-KEY-0001',
  lastSequence:0,nowMs:T,trustedPublicKey:publicKey,...params
 };
}
function stopped(x){
 assert.equal(x.syntheticOnly,true);
 assert.equal(x.realUbuntuConnected,false);
 assert.equal(x.realPrinterConnected,false);
 assert.equal(x.printServerProductionAcceptance,false);
 assert.equal(x.executeUbuntuAllowed,false);
 assert.equal(x.sendPrintJobAllowed,false);
 assert.equal(x.canUpdateAccountingOrStock,false);
 assert.equal(x.canDeployOrGrantAccess,false);
 assert.equal(x.independentRealKeyStore,false);
 assert.equal(x.persistentReplayDefense,false);
 assert.equal(x.releaseDecision,'NO_GO');
 assert.equal(x.ownerGates,'G1_G2_G3_G4_G5_OPEN');
 assert.equal(Object.isFrozen(x),true);
}
test('contract has no real host, trusted database, signing key or OS capability',()=>{
 assert.equal(POLICY.productionIdentityAndTrustStore,'NOT_IMPLEMENTED');
 assert.equal(POLICY.persistedReplayStore,'NOT_IMPLEMENTED');
 assert.equal(POLICY.keyProvisioning,'NOT_IMPLEMENTED');
 assert.equal(POLICY.connectedToUbuntu,false);
 assert.equal(POLICY.performRealPrinting,false);
});
test('valid fictional signed report verifies but never authorizes any execution',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 const res=await verify(v,scope(k.verifyKey));
 assert.equal(res.status,'SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY');
 assert.equal(res.cryptographicallyVerifiedFakeReport,true);
 assert.equal(res.hypotheticalAllComponentsRunning,true);
 assert.equal(res.proposedNextMockSequence,1);
 stopped(res);
});
test('signed mock PRINT_SERVER down is still hypothetical, not production fault',async()=>{
 const k=await keypair(),f=fixture();
 f.report.services[2].state='MOCK_STOPPED';
 const res=await verify(signMock(f,k.privateKey),scope(k.verifyKey));
 assert.equal(res.status,'SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY');
 assert.equal(res.hypotheticalAllComponentsRunning,false);
 stopped(res);
});
test('tampering after signing changes signature and gets stopped',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 v.report.services[3].state='MOCK_STOPPED';
 const res=await verify(v,scope(k.verifyKey));
 assert.equal(res.status,'STOP_MOCK_SIGNATURE_MISMATCH');stopped(res);
});
test('signed report with different public key cannot validate',async()=>{
 const a=await keypair(),b=await keypair(),v=signMock(fixture(),a.privateKey);
 const res=await verify(v,scope(b.verifyKey));
 assert.equal(res.status,'STOP_MOCK_SIGNATURE_MISMATCH');stopped(res);
});
test('second evaluation of same signed sequence is denied with independent previous counter',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 assert.equal((await verify(v,scope(k.verifyKey))).status,'SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY');
 const res=await verify(v,scope(k.verifyKey,{lastSequence:1}));
 assert.equal(res.status,'STOP_REPLAY_OR_OLD_MOCK_SEQUENCE');stopped(res);
});
test('unsigned skipped sequence cannot be accepted',async()=>{
 const k=await keypair(),f=fixture();f.sequence=3;
 const signed=signMock(f,k.privateKey);
 const x=await verify(signed,scope(k.verifyKey,{lastSequence:4}));
 assert.equal(x.status,'STOP_REPLAY_OR_OLD_MOCK_SEQUENCE');stopped(x);
});
for(const [name,overrides,status] of [
 ['wrong device',{deviceId:'FAKE-WRONG-DEVICE'},'STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE'],
 ['wrong key ID',{keyId:'FAKE-WRONG-KEY'},'STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE'],
 ['negative previous sequence',{lastSequence:-1},'STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE'],
 ['untrusted clock',{nowMs:NaN},'STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE'],
 ['unknown sequence',{lastSequence:'0'},'STOP_NO_SEPARATE_VERIFIED_MOCK_TRUST_SCOPE'],
]){
 test('unverified external mock trust scope '+name,async()=>{
  const k=await keypair(),v=signMock(fixture(),k.privateKey);
  const res=await verify(v,scope(k.verifyKey,overrides));
  assert.equal(res.status,status);stopped(res);
 });
}
test('attacker cannot supply in-band public key',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 v.publicKey=k.verifyKey;
 const res=await verify(v,scope(k.verifyKey));
 assert.equal(res.status,'STOP_UNTRUSTED_OR_NONMOCK_DIAGNOSTIC_ENVELOPE');
 stopped(res);
});
test('secret signing key is rejected as verifier key',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 const res=await verify(v,scope(k.verifyKey,{trustedPublicKey:k.privateKey}));
 assert.equal(res.status,'STOP_NO_TRUSTED_ED25519_VERIFY_KEY');stopped(res);
});
test('no externally supplied key, no signature trust',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 const res=await verify(v,scope(null));
 assert.equal(res.status,'STOP_NO_TRUSTED_ED25519_VERIFY_KEY');stopped(res);
});
for(const [name,changes] of [
 ['stale',{nowMs:Date.parse('2026-10-12T10:15:00.000Z')}],
 ['too far in future',{nowMs:Date.parse('2026-10-12T10:10:00.000Z')}],
]){
 test(name+' synthetic signed status is not accepted',async()=>{
  const k=await keypair(),v=signMock(fixture(),k.privateKey);
  const res=await verify(v,scope(k.verifyKey,changes));
  assert.equal(res.status,'STOP_EXPIRED_FUTURE_OR_INCONSISTENT_MOCK_TIMESTAMP');stopped(res);
 });
}
for(const [name,mutation] of [
 ['expires before issued',f=>f.expiresAt='2026-10-12T10:10:01.000Z'],
 ['expires after maximum window',f=>f.expiresAt='2026-10-12T10:20:01.000Z'],
 ['observation far before signed issue',f=>f.report.observedAt='2026-10-12T08:11:12.000Z'],
 ['observation future beyond issued',f=>f.report.observedAt='2026-10-12T11:11:12.000Z'],
]){
 test('signed but temporally invalid mock '+name,async()=>{
  const k=await keypair(),f=fixture();mutation(f);
  const signed=signMock(f,k.privateKey);
  const res=await verify(signed,scope(k.verifyKey));
  assert.equal(res.status,'STOP_EXPIRED_FUTURE_OR_INCONSISTENT_MOCK_TIMESTAMP');stopped(res);
 });
}
for(const [name,mutation] of [
 ['unexpected command',f=>f.command='sudo reboot'],
 ['unexpected host URL',f=>f.host='http://localhost:8631'],
 ['password field',f=>f.password='FAKE-TOKEN-ONLY'],
 ['real source',f=>f.source='LIVE_UBUNTU'],
 ['real mode',f=>f.mode='LIVE_COMMANDS'],
 ['wrong device reference',f=>f.deviceId='actual-host'],
 ['missing signature',f=>{delete f.signature;}],
 ['non canonical signature',f=>f.signature='@@@'],
 ['extra inner payload',f=>f.report.customerData='PRIVATE'],
 ['in-band secret in service',f=>f.report.services[0].secret='DO_NOT_READ'],
 ['duplicate service',f=>f.report.services[2].module='TRENDOS_API'],
]){
 test('reject nonmock or altered envelope '+name,async()=>{
  const k=await keypair(),f=fixture();mutation(f);
  let res=await verify(f,scope(k.verifyKey));
  // A duplicate service has canonical structure, but is denied by V0 guard.
  const expected=name==='duplicate service'?'STOP_INVALID_INNER_MOCK_REPORT':
   'STOP_UNTRUSTED_OR_NONMOCK_DIAGNOSTIC_ENVELOPE';
  assert.equal(res.status,expected);stopped(res);
 });
}
test('reordered top-level fields retain canonical signed verification',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 const reordered=Object.fromEntries(Object.entries(v).reverse());
 const res=await verify(reordered,scope(k.verifyKey));
 assert.equal(res.status,'SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY');stopped(res);
});
test('wrong signature bytes cannot be accepted even with valid wrapper',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 v.signature='A'.repeat(86);
 const res=await verify(v,scope(k.verifyKey));
 assert.equal(res.status,'STOP_MOCK_SIGNATURE_MISMATCH');stopped(res);
});
test('top-level getters cannot run inside canonical parsing',async()=>{
 const k=await keypair(),v=signMock(fixture(),k.privateKey);
 Object.defineProperty(v,'report',{enumerable:true,get(){throw Error('malicious getter')}});
 const res=await verify(v,scope(k.verifyKey));
 assert.equal(res.status,'STOP_UNTRUSTED_OR_NONMOCK_DIAGNOSTIC_ENVELOPE');stopped(res);
});
console.log('UBUNTU_ED25519_MOCK_VERIFY=NO_PRODUCTION_IDENTITY');
console.log('UBUNTU_ED25519_FAKE_REPLAY_EXPIRY_TAMPER=DENY');
console.log('UBUNTU_CHATGPT_CONNECTION=NOT_CREATED');
console.log('PRINT_SERVER_PRODUCTION_ACCEPTANCE=NOT_VERIFIED');
console.log('FINANCE_RELEASE=NO_GO');
