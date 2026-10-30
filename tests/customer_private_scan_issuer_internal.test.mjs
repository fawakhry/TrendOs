/* Synthetic D1/R2 verified owner signer + Python signed-lease interoperability.
 * No live Cloudflare, no customer data, no deployment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash,createHmac} from 'node:crypto';
import {spawnSync} from 'node:child_process';
globalThis.crypto ??= webcrypto;
import {issuePrivateCustomerScanLeaseInternalV0 as issue}
  from '../cloudflare-d1/customer-stage/private-scan-lease-issuer-internal-v0.mjs';

const NOW=1793393000000;
const TOKEN='a'.repeat(64);
const FILE='CDF-'+'a'.repeat(32);
const DRAFT='CDR-'+'b'.repeat(32);
const ITEM='CDI-'+'c'.repeat(32);
const CUST='SYNTHETIC_C1';
const BYTES=new Uint8Array([137,80,78,71,13,10,26,10,...new TextEncoder().encode('SYNTHETIC_DATA_ONLY')]);
const SHA=createHash('sha256').update(BYTES).digest('hex');
const SIGN='Test-only-source-scan-lease-HMAC-key-64-bytes-non-production-2026!';
const SECRET='Test-only-source-native-session-key-do-not-deploy-2026';

function fake(overrides={}){
  const state={allowed:true,sessionRevoked:false,alterHash:false,
    badQuarantine:false,mutateAfterRead:false,r2Contents:BYTES,
    qReads:0,fileReads:0,sessions:0,r2Reads:0,seenKeys:[],...overrides};
  const row=()=>({
    fileId:FILE,itemId:ITEM,sha256Hex:state.alterHash?'0'.repeat(64):SHA,
    byteSize:BYTES.length,contentType:'image/png',
    objectKey:'customer-drafts/'+FILE,state:'READY',
    updatedAtMs:NOW
  });
  const quarantine=()=>({
    fileId:FILE,sha256Hex:SHA,byteSize:BYTES.length,
    contentType:'image/png',disposition:state.badQuarantine?'CLEAN':'QUARANTINED',
    scanCompleted:0,printReleaseAuthorized:0
  });
  const db={prepare(sql){
    const kind=sql.includes('FROM customer_portal_native_sessions_v1 s')?'session':
      sql.includes('FROM customer_portal_native_drafts_v1 d')?'draft':
      sql.includes('FROM customer_portal_native_draft_files_v1 f')?'files':
      sql.includes('FROM customer_portal_native_file_quarantine_v1 q')?'quarantine':'bad';
    if(kind==='bad')throw new Error('Unexpected SQL fixture');
    return {bind(...args){
      return {
        async first(){
          if(kind==='session'){
            state.sessions++;
            return state.allowed&&!state.sessionRevoked?{customerId:CUST}:null;
          }
          if(kind==='draft')return args[0]===DRAFT&&args[1]===CUST?
            {draftId:DRAFT}:null;
          throw new Error('Unexpected first()');
        },
        async all(){
          assert.equal(args[0],DRAFT);
          assert.equal(args[1],CUST);
          if(kind==='files'){
            state.fileReads++;
            if(state.mutateAfterRead&&state.fileReads===2)
              return {results:[{...row(),updatedAtMs:NOW+1}]};
            return {results:[row()]};
          }
          if(kind==='quarantine'){
            state.qReads++;
            return {results:[quarantine()]};
          }
          throw new Error('Unexpected all()');
        }
      };
    }};
  }};
  const bucket={async get(key){
    state.r2Reads++;state.seenKeys.push(key);
    const bytes=state.r2Contents;
    return {size:bytes.length,httpMetadata:{contentType:'image/png'},
      async arrayBuffer(){return bytes.slice().buffer;}};
  }};
  const env={
    TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_INTERNAL_V0_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_STAGE_MODE:'isolated-customer-stage-v0',
    TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED:'true',
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET:SIGN,
    DB:db,CUSTOMER_DRAFT_FILES_BUCKET:bucket
  };
  return {env,state};
}
const call=(env,rest={})=>issue({env,token:TOKEN,draftId:DRAFT,
  fileId:FILE,nowMs:NOW,clock:()=>NOW+1000,...rest});
const flags=(r)=>{for(const field of ['scanAttestationVerified','malwareScanComplete',
  'printReleaseAuthorized','eligibleForT12FileHandoff','officialOrderCreated',
  'productionWriteAuthorized'])assert.equal(r[field],false,field);
  assert.equal(r.fileQuarantineRemainsRequired,true);
};
function unpack(token){
  const [b64,sig]=token.split('.');
  const body=Buffer.from(b64,'base64url');
  const signature=Buffer.from(sig,'base64url');
  assert.deepEqual(signature,createHmac('sha256',SIGN).update(body).digest());
  return {claims:JSON.parse(body.toString('utf8')),body};
}

test('default OFF denies before any D1, R2 or signed lease',async()=>{
  const {env,state}=fake();
  env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_INTERNAL_V0_ENABLED='false';
  const r=await call(env);
  assert.equal(r.code,'SCAN_LEASE_INTERNAL_OFF');
  assert.equal(state.sessions,0);assert.equal(state.r2Reads,0);
  assert.equal(r.lease,undefined);flags(r);
});

test('verified native D1 session, owner draft, quarantine and R2 hash sign one provisional lease',async()=>{
  const {env,state}=fake();
  const r=await call(env);
  assert.equal(r.code,'SCAN_LEASE_INTERNAL_PROVISIONAL_ONLY');
  assert.equal(r.ok,true);flags(r);
  assert.equal(state.sessions,2);assert.equal(state.fileReads,2);
  assert.equal(state.qReads,2);assert.equal(state.r2Reads,1);
  assert.deepEqual(state.seenKeys,['customer-drafts/'+FILE]);
  const {claims,body}=unpack(r.lease);
  assert.equal(claims.fileId,FILE);assert.equal(claims.draftId,DRAFT);
  assert.equal(claims.itemId,ITEM);assert.equal(claims.sha256Hex,SHA);
  assert.equal(claims.iatMs,NOW+1000);assert.equal(claims.expMs,NOW+61000);
  assert.equal(claims.aud,'trendos-private-ubuntu-offline-scanner-isolated-v0');
  assert.equal(claims.purpose,'quarantined-private-byte-observation-only');
  assert.match(claims.nonce,/^[0-9a-f]{32}$/);
  assert.deepEqual(Object.keys(claims),Object.keys(claims).sort());
  assert.ok(body.length<3072);
  assert.equal(JSON.stringify(r).includes(SIGN),false);
  assert.equal(JSON.stringify(r).includes(SECRET),false);
  assert.equal(JSON.stringify(r).includes('customer-drafts/'),false);
});

test('cross-runtime Python offline consumer recognizes actual JS-generated signed token',async()=>{
  const {env}=fake();const {lease}=await call(env);
  const code=[
    'import sys,json,hmac',
    "sys.path.insert(0,'tools')",
    'import customer_private_scan_signed_lease_offline_v0 as mod',
    's=sys.stdin.read().strip()',
    'a,b=s.split(".")',
    'raw=mod._decoded(a)',
    'claims=json.loads(raw)',
    'key='+JSON.stringify(SIGN)+'.encode("utf-8")',
    'assert hmac.compare_digest(mod._decoded(b),hmac.digest(key,raw,"sha256"))',
    'assert mod._json_bytes(claims)==raw',
    'assert mod._claims_valid(claims,1793393001000)',
    'assert claims["fileId"]=="CDF-"+"a"*32',
    'print("PYTHON_JS_LEASE_INTEROPERABILITY=PASS")'
  ].join('\n');
  const p=spawnSync('python3',['-c',code],{input:lease,encoding:'utf8',
    timeout:5000,cwd:process.cwd()});
  assert.equal(p.status,0,p.stderr);
  assert.match(p.stdout,/PYTHON_JS_LEASE_INTEROPERABILITY=PASS/);
});

test('revoked or missing owner session fails before any R2 access',async()=>{
  for(const change of [{sessionRevoked:true},{allowed:false}]){
    const {env,state}=fake(change);
    const r=await call(env);
    assert.equal(r.code,'SCAN_LEASE_INTERNAL_SESSION_DENIED');
    assert.equal(state.r2Reads,0);flags(r);
  }
});

test('file quarantine must be immutable QUARANTINED and exact hash',async()=>{
  for(const change of [{badQuarantine:true},{alterHash:true}]){
    const {env,state}=fake(change);
    const r=await call(env);
    assert.equal(r.code,'SCAN_LEASE_INTERNAL_OWNER_QUARANTINE_DENIED');
    assert.equal(state.r2Reads,0);flags(r);
  }
});

test('R2 content tampering rejected before HMAC issuance',async()=>{
  const different=new Uint8Array(BYTES);different[different.length-1]^=1;
  const {env,state}=fake({r2Contents:different});
  const r=await call(env);
  assert.equal(r.code,'SCAN_LEASE_INTERNAL_R2_SHA_DENIED');
  assert.equal(r.lease,undefined);assert.equal(state.r2Reads,1);flags(r);
});

test('D1 file snapshot drift after R2 read fails closed before signing',async()=>{
  const {env,state}=fake({mutateAfterRead:true});
  const r=await call(env);
  assert.equal(r.code,'SCAN_LEASE_INTERNAL_OWNER_QUARANTINE_CHANGED');
  assert.equal(state.r2Reads,1);assert.equal(r.lease,undefined);flags(r);
});

test('revoked D1 session after R2 read rejects issuance',async()=>{
  const {env,state}=fake();
  const orig=env.DB.prepare.bind(env.DB);
  env.DB.prepare=(sql)=>{
    const p=orig(sql);
    if(!sql.includes('FROM customer_portal_native_sessions_v1 s'))return p;
    return {bind(...args){const x=p.bind(...args);return {async first(){
      if(state.sessions>0)return null;
      return x.first();
    }};}};
  };
  const r=await call(env);
  assert.equal(r.code,'SCAN_LEASE_INTERNAL_SESSION_CHANGED');
  assert.equal(state.r2Reads,1);flags(r);
});

test('incomplete bindings, shared signer/session key and malformed IDs rejected',async()=>{
  const x=fake();x.env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET=SECRET;
  assert.equal((await call(x.env)).code,'SCAN_LEASE_INTERNAL_BINDING_UNAVAILABLE');
  for(const rest of [{fileId:'bad'},{token:'c'},{draftId:'no'}]){
    const y=fake();
    const r=await call(y.env,rest);
    assert.equal(r.code,'SCAN_LEASE_INTERNAL_REFERENCE_DENIED');
    assert.equal(y.state.r2Reads,0);flags(r);
  }
});

test('clock drift, unexpected D1 fault and stage switch fail closed',async()=>{
  const {env}=fake();
  assert.equal((await call(env,{clock:()=>NOW+61000})).code,
    'SCAN_LEASE_INTERNAL_CLOCK_DRIFT_DENIED');
  env.DB={prepare(){throw new Error('private SQL info')}};
  const r=await call(env);assert.equal(r.code,'SCAN_LEASE_INTERNAL_SOURCE_UNAVAILABLE');
  assert.equal(JSON.stringify(r).includes('private SQL info'),false);flags(r);
  env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED='false';
  assert.equal((await call(env)).code,'SCAN_LEASE_INTERNAL_OFF');
});
