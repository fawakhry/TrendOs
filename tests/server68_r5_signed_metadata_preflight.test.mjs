/** SERVER-68 R5 migration candidate regression; 100% fake D1, no network/deploy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {
  makeR5SignedMetadataRequest, qualifyR5SignedMirrorMetadata
} from '../cloudflare-d1/r5-server68-signed-metadata-preflight.mjs';
import {handleMirrorServiceRead} from '../cloudflare-d1/src/mirror-service-read-v1.mjs';
import {handleMirrorRequest} from '../cloudflare-d1/src/mirror-gate.mjs';
import {MirrorServiceNonceGuardV1} from '../cloudflare-d1/src/mirror-service-replay-guard-v1.mjs';

const HOST='r5-server68-fixture.invalid';
const BASE='https://'+HOST+'/';
const KEY='SYNTHETIC_R5_32PLUS_CHAR_METADATA_HMAC_SECRET_KEY';
const NONCE='S'.repeat(24);
const timestamp=()=>String(Math.floor(Date.now()/1000));
const pinned=(overrides={})=>({
  baseUrl:BASE, expectedHostname:HOST, secret:KEY, timestamp:timestamp(),
  nonce:NONCE, ...overrides
});
function fakeServer(){
  const audit={read:0,write:0,call:0};
  const records=new Map();
  const store={
    transaction: async action=>action({
      get:async name=>records.get(name),
      put:async(name,value)=>{records.set(name,value)}
    }),
    getAlarm:async()=>null, setAlarm:async()=>{},
    list:async()=>new Map(records),delete:async name=>records.delete(name)
  };
  const guard=new MirrorServiceNonceGuardV1({storage:store});
  const DB={
    prepare(sql){
      audit.read++;
      if (/\b(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i.test(sql)) {
        audit.write++;throw Error('NO_WRITE_PERMITTED');
      }
      return{
        bind(){return this},
        async all(){return {results:[{sheetName:'SYNTHETIC_ONLY',rowCount:1}]}},
        async first(){return {sheetCount:1,rowCount:1,readySheets:1,pendingSheets:0,lastSyncedAt:'SYNTHETIC'}}
      };
    }
  };
  const env={
    MIRROR_SERVICE_READ_ENABLED:'true',
    MIRROR_METADATA_READ_ENABLED:'true',
    MIRROR_PARITY_READ_ENABLED:'false',
    MIRROR_METADATA_READ_HMAC_SECRET:KEY,
    DB,
    MIRROR_SERVICE_READ_REPLAY_DO:{
      idFromName: name=>name,
      get:()=>({fetch:request=>guard.fetch(request)})
    }
  };
  const fetchImpl=async(url,init)=>{
    audit.call++;
    assert.equal(new URL(url).hostname,HOST,'only .invalid synthetic destination');
    return handleMirrorServiceRead(new Request(url,init),env);
  };
  return {env,audit,fetchImpl};
}
test('R5 candidate signs exact new metadata URL using SERVER-67 HMAC contract',()=>{
  const p=makeR5SignedMetadataRequest(pinned());
  assert.equal(p.url,BASE+'v1/service/mirror/sheets');
  assert.equal(p.init.method,'GET');
  assert.equal(p.init.redirect,'error');
  const h=p.init.headers;
  assert.equal(h['x-trendos-read-principal'],'trendos_mirror_metadata');
  assert.equal(h['x-trendos-read-nonce'],NONCE);
  const msg=['GET','/v1/service/mirror/sheets','',h['x-trendos-read-timestamp'],NONCE,'trendos_mirror_metadata'].join('\n');
  assert.equal(h['x-trendos-read-signature'],createHmac('sha256',KEY).update(msg).digest('hex'));
  assert.equal(h.Origin,undefined);
  assert.equal(h.authorization,undefined);
  assert.equal(JSON.stringify(p).includes(KEY),false,'key must not be serialized into probe');
});
test('real SERVER-67 handler accepts R5 candidate metadata-only signature on fake DB',async()=>{
  const x=fakeServer(), result=await qualifyR5SignedMirrorMetadata({...pinned(),fetchImpl:x.fetchImpl});
  assert.deepEqual(result,{passed:true,kind:'metadata-only',sheetCount:1});
  assert.equal(x.audit.read,1);assert.equal(x.audit.write,0);
});
test('one-time nonce cannot be reused, without more D1 reads',async()=>{
  const x=fakeServer(),options={...pinned(),fetchImpl:x.fetchImpl};
  await qualifyR5SignedMirrorMetadata(options);
  await assert.rejects(qualifyR5SignedMirrorMetadata(options),/SERVER68_R5_SIGNED_READ_UNAVAILABLE/);
  assert.equal(x.audit.read,1);assert.equal(x.audit.write,0);
});
test('wrong R5 key fails closed without any D1 reads',async()=>{
  const x=fakeServer();
  await assert.rejects(qualifyR5SignedMirrorMetadata({...pinned({secret:'A'.repeat(40)}),fetchImpl:x.fetchImpl}),/SIGNED_READ_UNAVAILABLE/);
  assert.equal(x.audit.read,0);
});
test('SERVER-67 flags default OFF, no authenticated metadata can read D1',async()=>{
  const x=fakeServer();delete x.env.MIRROR_SERVICE_READ_ENABLED;
  await assert.rejects(qualifyR5SignedMirrorMetadata({...pinned(),fetchImpl:x.fetchImpl}),/SIGNED_READ_UNAVAILABLE/);
  assert.equal(x.audit.read,0);
});
test('no fetch adapter = no HTTP access by construction',async()=>{
  await assert.rejects(qualifyR5SignedMirrorMetadata(pinned()),/FETCH_ADAPTER_REQUIRED/);
});
for(const [name,patch] of [
  ['HTTP', {baseUrl:'http://'+HOST+'/'}],
  ['foreign domain', {baseUrl:'https://untrusted.invalid/'}],
  ['wrong expected host', {expectedHostname:'other.invalid'}],
  ['user info in URL',{baseUrl:'https://user:pass@'+HOST+'/'}],
  ['URL query',{baseUrl:BASE+'?override=1'}],
  ['URL path',{baseUrl:BASE+'v1/orders'}],
  ['URL fragment',{baseUrl:BASE+'#x'}],
  ['URL port',{baseUrl:'https://'+HOST+':444/'}],
  // SERVER-72 raw authority: URL() alone hides :443, %2e and empty delimiters.
  ['explicit default HTTPS port',{baseUrl:'https://'+HOST+':443/'}],
  ['percent-encoded hostname dot',{baseUrl:'https://r5-server68-fixture%2einvalid/'}],
  ['empty query delimiter',{baseUrl:BASE+'?'}],
  ['empty fragment delimiter',{baseUrl:BASE+'#'}],
  ['leading whitespace',{baseUrl:' '+BASE}],
  ['noncanonical dot-segment',{baseUrl:BASE+'./'}]
]){
  test('rejects unsafe target before fetch: '+name,async()=>{
    const x=fakeServer();
    await assert.rejects(qualifyR5SignedMirrorMetadata({...pinned(patch),fetchImpl:x.fetchImpl}),/TARGET_NOT_APPROVED/);
    assert.equal(x.audit.call,0);assert.equal(x.audit.read,0);
  });
}
test('missing expected hostname is never trusted implicitly',()=>{
  assert.throws(()=>makeR5SignedMetadataRequest(pinned({expectedHostname:''})),/TARGET_NOT_PINNED/);
});
for(const secret of ['', 'SHORT','X'.repeat(257),null]){
  test('missing or invalid key refuses to sign ('+String(secret).length+')',()=>{
    assert.throws(()=>makeR5SignedMetadataRequest(pinned({secret})),/CREDENTIAL_MISSING/);
  });
}
test('malformed timestamp and short nonce refuse to sign',()=>{
  assert.throws(()=>makeR5SignedMetadataRequest(pinned({timestamp:'now'})),/TIMESTAMP_INVALID/);
  assert.throws(()=>makeR5SignedMetadataRequest(pinned({nonce:'tiny'})),/NONCE_INVALID/);
});
test('never follows redirects or silently downgrades to legacy HTTP GET',async()=>{
  const seen=[];
  const failFetch=async(url,init)=>{
    seen.push({url,init});
    return new Response('',{status:302,headers:{location:'https://other.invalid/v1/mirror/sheets'}});
  };
  await assert.rejects(qualifyR5SignedMirrorMetadata({...pinned(),fetchImpl:failFetch}),/SIGNED_READ_UNAVAILABLE/);
  assert.equal(seen.length,1);assert.equal(seen[0].init.redirect,'error');
  assert.equal(seen[0].url.endsWith('/v1/service/mirror/sheets'),true);
});
test('HTTP 200 alone cannot qualify a wrong JSON contract',async()=>{
  const fake=async()=>new Response('{"success":true,"orders":[]}',{status:200});
  await assert.rejects(qualifyR5SignedMirrorMetadata({...pinned(),fetchImpl:fake}),/RESPONSE_CONTRACT_INVALID/);
});
test('the old legacy Mirror GET remains intentionally blocked in the review branch',async()=>{
  const x=fakeServer();
  const response=await handleMirrorRequest(new Request(BASE+'v1/mirror/sheets'),x.env,{});
  assert.equal(response.status,403);assert.equal(x.audit.read,0);
});
test('existing R5 Production deploy workflow is untouched and remains a release BLOCKER',()=>{
  const source=readFileSync('.github/workflows/trendos-r5-periodic-controlled.yml','utf8');
  assert.ok(source.includes('ref: b7e85647ac205b93f22e9f9ea1da58b21d54e4c0'));
  assert.ok(source.includes('"$PROD_URL/v1/mirror/sheets"'));
  assert.ok(source.includes('test "$catalog_code" = 200'));
  // This candidate never rewires, checks out, or calls that production workflow.
});
test('fixture hostnames are not remotely routable',()=>{assert.equal(HOST.endsWith('.invalid'),true);});
