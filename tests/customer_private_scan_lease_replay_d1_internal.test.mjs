/* Zero Google internal replay D1 CAS tests. Mock D1 only, never live. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
globalThis.crypto ??= webcrypto;
import {consumePrivateScanLeaseNonceD1InternalV0 as consume}
  from '../cloudflare-d1/customer-stage/private-scan-lease-replay-d1-internal-v0.mjs';
const NOW=1793393000000;
const SECRET='TEST_ONLY_PRIVATE_SCAN_REPLAY_SECRET_NO_PROD_20261030_1234567';
const enc=x=>Buffer.from(x).toString('base64url');
const payload=(nonce='a'.repeat(32))=>({
  v:1,iss:'trendos-private-customer-stage-isolated-v0',
  aud:'trendos-private-ubuntu-offline-scanner-isolated-v0',
  purpose:'quarantined-private-byte-observation-only',
  fileId:'CDF-'+'a'.repeat(32),draftId:'CDR-'+'b'.repeat(32),
  itemId:'CDI-'+'c'.repeat(32),sha256Hex:'f'.repeat(64),
  byteSize:32,contentType:'image/png',updatedAtMs:NOW,
  iatMs:NOW,expMs:NOW+60000,nonce
});
async function tokenFor(claims, secret=SECRET){
  const raw=Buffer.from(JSON.stringify(Object.fromEntries(
    Object.entries(claims).sort(([a],[b])=>a.localeCompare(b,'en')))));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=Buffer.from(await crypto.subtle.sign('HMAC',key,raw));
  return enc(raw)+'.'+enc(sig);
}
function fixture(overrides={}){
  const rows=new Map(),state={writes:0,reads:0};
  const db={prepare(sql){
    if(sql.startsWith('INSERT INTO')){
      return {bind(...args){return {async run(){
        state.writes++;
        if(overrides.failWrite)throw new Error('PRIVATE D1 ERROR');
        if(!rows.has(args[0]))rows.set(args[0],args);
        else return {meta:{changes:0}};
        if(overrides.metaMissing)return {};
        if(overrides.metaBad)return {meta:{changes:2}};
        return {meta:{changes:1}};
      }};}};
    }
    if(sql.startsWith('SELECT nonce_digest_hex')){
      return {bind(nonce){return {async first(){
        state.reads++;
        if(overrides.failRead)throw new Error('PRIVATE D1 READ');
        if(overrides.missingRead)return null;
        const x=rows.get(nonce);
        return x?{
          nonceDigest:x[0],
          signedLeaseDigest:overrides.mismatch?'0'.repeat(64):x[1],
          issuedAtMs:x[2],expiresAtMs:x[3],consumedAtMs:x[4]
        }:null;
      }};}};
    }
    throw new Error('INVALID_SQL');
  }};
  return {env:{
    TRENDOS_CUSTOMER_PRIVATE_SCAN_REPLAY_D1_INTERNAL_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_STAGE_MODE:'isolated-customer-stage-v0',
    TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET:SECRET,DB:db
  },rows,state};
}
function noRelease(r){
  for(const field of ['scanAttestationVerified','signatureDatabaseAuthenticityVerified',
    'malwareScanComplete','printReleaseAuthorized','eligibleForT12FileHandoff',
    'officialOrderCreated','productionWriteAuthorized'])
      assert.equal(r[field],false,field);
  assert.equal(r.fileQuarantineRemainsRequired,true);
  assert.equal(r.sourceOnly,true);
  assert.equal(r.token,undefined);
  assert.equal(r.nonce,undefined);
  assert.equal(r.customerId,undefined);
  assert.equal(JSON.stringify(r).includes(SECRET),false);
}
test('default OFF with no D1 writes',async()=>{
  const f=fixture();f.env.TRENDOS_CUSTOMER_PRIVATE_SCAN_REPLAY_D1_INTERNAL_V0_ENABLED='false';
  const r=await consume({env:f.env,token:await tokenFor(payload()),nowMs:NOW+1000});
  assert.equal(r.code,'SCAN_REPLAY_INTERNAL_OFF');assert.equal(f.state.writes,0);noRelease(r);
});
test('valid HMAC consumes exactly once, opaque digest storage and no file release',async()=>{
  const f=fixture(),token=await tokenFor(payload());
  const a=await consume({env:f.env,token,nowMs:NOW+1000});
  assert.equal(a.code,'SCAN_REPLAY_LOCAL_CLAIM_OBSERVED_ONLY');
  assert.equal(a.replayClaimConsumed,true);assert.equal(f.rows.size,1);
  const [k,x]=Array.from(f.rows)[0];
  assert.match(k,/^[0-9a-f]{64}$/);
  assert.match(x[1],/^[0-9a-f]{64}$/);
  assert.notEqual(k,payload().nonce);
  assert.notEqual(x[1],token);
  assert.equal(x[1],createHash('sha256').update(token).digest('hex'));
  noRelease(a);
  const b=await consume({env:f.env,token,nowMs:NOW+1001});
  assert.equal(b.code,'SCAN_REPLAY_USED_OR_UNVERIFIED');
  assert.equal(b.replayClaimConsumed,false);assert.equal(f.rows.size,1);noRelease(b);
});
test('two concurrent calls for same nonce can only have one winner',async()=>{
  const f=fixture(),token=await tokenFor(payload());
  const out=await Promise.all(Array.from({length:10},()=>consume({
    env:f.env,token,nowMs:NOW+1000
  })));
  assert.equal(out.filter(x=>x.replayClaimConsumed).length,1);
  assert.equal(f.rows.size,1);out.forEach(noRelease);
});
test('different signed file leases with reused nonce are denied',async()=>{
  const f=fixture(),a=await tokenFor(payload());
  const b=await tokenFor({...payload(),fileId:'CDF-'+'d'.repeat(32)});
  assert.equal((await consume({env:f.env,token:a,nowMs:NOW+1000})).replayClaimConsumed,true);
  const r=await consume({env:f.env,token:b,nowMs:NOW+1000});
  assert.equal(r.code,'SCAN_REPLAY_USED_OR_UNVERIFIED');noRelease(r);
});
test('signature tamper and wrong key reject before touching D1',async()=>{
  const good=await tokenFor(payload());
  const corrupt=good.slice(0,-1)+(good.endsWith('A')?'B':'A');
  const f=fixture();
  for(const token of [corrupt,'bad.token','',good.replace('.','..')]){
    const r=await consume({env:f.env,token,nowMs:NOW+1000});
    assert.equal(r.replayClaimConsumed,false);noRelease(r);
  }
  const other=fixture();other.env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET='OTHER_TEST_KEY_NOT_PROD_1234567890000';
  const r=await consume({env:other.env,token:good,nowMs:NOW+1000});
  assert.equal(r.code,'SCAN_REPLAY_SIGNATURE_DENIED');
  assert.equal(other.state.writes,0);noRelease(r);
});
test('expired, future, wrong audience, purpose and bad type rejected pre-D1',async()=>{
  const f=fixture();
  const variants=[
    [{...payload(),expMs:NOW+500},NOW+1000],
    [{...payload(),iatMs:NOW+7000,expMs:NOW+8000},NOW+1000],
    [{...payload(),aud:'unauthorized-ubuntu'},NOW+1000],
    [{...payload(),purpose:'print-release'},NOW+1000],
    [{...payload(),byteSize:true},NOW+1000],
    [{...payload(),expMs:NOW+121000},NOW+1000],
  ];
  for(const [claims,now] of variants){
    const r=await consume({env:f.env,token:await tokenFor(claims),nowMs:now});
    assert.equal(r.code,'SCAN_REPLAY_CLAIMS_OR_EXPIRY_DENIED');noRelease(r);
  }
  assert.equal(f.state.writes,0);
});
test('D1 missing, failed, changed or ambiguous proof is ALWAYS denied',async()=>{
  const token=await tokenFor(payload());
  for(const opts of [{failWrite:true},{failRead:true},{metaMissing:true},
    {metaBad:true},{mismatch:true},{missingRead:true}]){
    const f=fixture(opts);
    const r=await consume({env:f.env,token,nowMs:NOW+1000});
    assert.equal(r.replayClaimConsumed,false);noRelease(r);
    assert.notEqual(r.code,'SCAN_REPLAY_LOCAL_CLAIM_OBSERVED_ONLY');
  }
});
test('schema and proper Stage bindings required',async()=>{
  const f=fixture(),token=await tokenFor(payload());
  f.env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED='false';
  let r=await consume({env:f.env,token,nowMs:NOW+1000});
  assert.equal(r.code,'SCAN_REPLAY_INTERNAL_OFF');noRelease(r);
  f.env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED='true';
  delete f.env.DB;
  r=await consume({env:f.env,token,nowMs:NOW+1000});
  assert.equal(r.code,'SCAN_REPLAY_INTERNAL_BINDING_UNAVAILABLE');noRelease(r);
});
