/** SERVER-67 offline tests. Only synthetic .invalid requests; all DB handles are fake. */
import test from 'node:test';
import assert from 'node:assert/strict';
import routed from '../cloudflare-d1/src/index_v2.js';
import {handleMirrorServiceRead, mirrorReadSignaturePayload} from '../cloudflare-d1/src/mirror-service-read-v1.mjs';
import { MirrorServiceNonceGuardV1 } from '../cloudflare-d1/src/mirror-service-replay-guard-v1.mjs';

const HOST = 'https://server67-only.invalid';
const META = 'trendos_mirror_metadata';
const PARITY = 'trendos_mirror_parity';
const META_SECRET = 'SYNTHETIC_META_1234567890_abcdefghijklmnopqrst';
const ROW_SECRET = 'SYNTHETIC_PARITY_1234567890_abcdefghijklmnopqr';
function fixture() {
  const audit = [];
  const DB = { prepare(sql) {
    audit.push(sql.trim());
    if (/\b(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i.test(sql)) {
      throw Error('READ-ONLY-PROJECTION-INVARIANT');
    }
    return {
      bind() { return this; },
      async all() {
        if (sql.includes('sqlite_master')) return { results:[
          {name:'sheet_catalog'}, {name:'sheet_rows'},
          {name:'sheet_staging_catalog'}, {name:'sheet_staging_rows'}
        ]};
        if (sql.includes('FROM sheet_rows')) return {results:[
          {rowNumber:1,valuesJson:'["SYNTHETIC"]',displayJson:'["SYNTHETIC"]',formulasJson:'[]',syncedAt:'2026-10-16 00:00:00'}
        ]};
        return {results:[{sheetName:'الأوردرات',sheetId:'FAKE',sourceLastRow:1,sourceLastCol:1,rowCount:1,status:'ready',syncedAt:'2026-10-16 00:00:00'}]};
      },
      async first() {
        if (sql.includes('SUM(row_count)')) return {sheetCount:1,rowCount:1,readySheets:1,pendingSheets:0,oldestSyncedAt:'now',lastSyncedAt:'now'};
        return {sheetName:'الأوردرات',sheetId:'FAKE',headersJson:'["SYNTHETIC"]',sourceLastRow:1,sourceLastCol:1,rowCount:1,status:'ready',syncedAt:'now',note:'SYNTHETIC'};
      }
    };
  }};
  const replayRows=new Map();
  const storage={
    async transaction(action) {
      return action({
        get:async key=>replayRows.get(key),
        put:async (key,value)=>{replayRows.set(key,value);}
      });
    },
    async getAlarm(){return null;},
    async setAlarm(){},
    async list(){return new Map(replayRows);},
    async delete(key){replayRows.delete(key);}
  };
  const replayGuard=new MirrorServiceNonceGuardV1({storage});
  const replayNamespace={
    idFromName:name=>name,
    get:() => ({fetch:request=>replayGuard.fetch(request)})
  };
  return {audit, replayRows, env:{
    MIRROR_SERVICE_READ_REPLAY_DO:replayNamespace,
    DB,
    MIRROR_SERVICE_READ_ENABLED:'true',
    MIRROR_METADATA_READ_ENABLED:'true',
    MIRROR_PARITY_READ_ENABLED:'true',
    MIRROR_METADATA_READ_HMAC_SECRET:META_SECRET,
    MIRROR_PARITY_READ_HMAC_SECRET:ROW_SECRET,
  }};
}
function route(path) { return HOST+path; }
async function signed(url, {principal=META,secret=META_SECRET,timestamp=Math.floor(Date.now()/1000),origin='',nonce='a'.repeat(24)}={}) {
  const payload=mirrorReadSignaturePayload('GET',new URL(url),timestamp,nonce,principal);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload)));
  const signature=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const headers=new Headers({
    'x-trendos-read-principal':principal,
    'x-trendos-read-timestamp':String(timestamp),
    'x-trendos-read-nonce':nonce,
    'x-trendos-read-signature':signature
  });
  if(origin)headers.set('Origin',origin);
  return new Request(url,{method:'GET',headers});
}
for(const path of ['/v1/service/mirror/sheets','/v1/service/mirror/stats','/v1/service/mirror/capabilities']) {
  test('valid metadata HMAC reads existing projection '+path,async()=>{
    const x=fixture(),r=await routed.fetch(await signed(route(path)),x.env,{});
    assert.equal(r.status,200);
    assert.equal((await r.json()).success,true);
    assert.ok(x.audit.length>0);
  });
}
test('valid separate PARITY principal reads only approved sheet in bounded page',async()=>{
  const x=fixture();
  const url=route('/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=25&offset=0');
  const r=await routed.fetch(await signed(url,{principal:PARITY,secret:ROW_SECRET}),x.env,{});
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.sheet.rows[0].display[0],'SYNTHETIC');
  assert.ok(x.audit.length>=2);
});
test('metadata principal cannot read rows, regardless of signature validity',async()=>{
  const x=fixture(),url=route('/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات'));
  const r=await routed.fetch(await signed(url),x.env,{});
  assert.equal(r.status,401);
  assert.equal(x.audit.length,0);
});
for(const path of [
  '/v1/service/mirror/sheet?name='+encodeURIComponent('customers'),
  '/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=101',
  '/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=25&limit=25',
  '/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&offset=-1',
  '/v1/service/mirror/stats?unused=1',
  '/v1/service/mirror/sheets?name='+encodeURIComponent('الأوردرات')
]) {
  test('invalid service scope cannot query D1: '+path,async()=>{
    const x=fixture();
    const response=await routed.fetch(await signed(route(path)),x.env,{});
    assert.equal(response.status,403);
    assert.equal(x.audit.length,0);
  });
}
test('disabled default service fails before any D1',async()=>{
  const x=fixture();delete x.env.MIRROR_SERVICE_READ_ENABLED;
  const r=await routed.fetch(await signed(route('/v1/service/mirror/stats')),x.env,{});
  assert.equal(r.status,404);assert.equal(x.audit.length,0);
});
test('disabled PARITY scope fails without reading D1',async()=>{
  const x=fixture();delete x.env.MIRROR_PARITY_READ_ENABLED;
  const url=route('/v1/service/mirror/sheet?name='+encodeURIComponent('بنود الأوردرات'));
  const r=await routed.fetch(await signed(url,{principal:PARITY,secret:ROW_SECRET}),x.env,{});
  assert.equal(r.status,404);assert.equal(x.audit.length,0);
});
for(const variant of ['missing','wrong-key','expired','future','tampered','browser','bad-nonce','no-secret']) {
  test('invalid signed metadata requests rejected before D1: '+variant,async()=>{
    const x=fixture(),url=route('/v1/service/mirror/stats');
    let req;
    if(variant==='missing')req=new Request(url);
    else if(variant==='wrong-key')req=await signed(url,{secret:ROW_SECRET});
    else if(variant==='expired')req=await signed(url,{timestamp:Math.floor(Date.now()/1000)-100});
    else if(variant==='future')req=await signed(url,{timestamp:Math.floor(Date.now()/1000)+100});
    else if(variant==='browser')req=await signed(url,{origin:'https://fawakhry.github.io'});
    else if(variant==='bad-nonce')req=await signed(url,{nonce:'short'});
    else if(variant==='tampered') { const signedOriginal=await signed(url); req=new Request(url+'?injected=1',{headers:signedOriginal.headers}); }
    else {req=await signed(url);delete x.env.MIRROR_METADATA_READ_HMAC_SECRET;}
    // Tampered query is denied by scope before signature. All variants fail closed.
    const r=await routed.fetch(req,x.env,{});
    assert.ok([401,403].includes(r.status));
    assert.equal(x.audit.length,0);
  });
}
test('legacy routes stay denied; signing does not provide an accidental bypass',async()=>{
  const x=fixture();
  for(const path of ['/v1/mirror/sheets','/v1/mirror/stats','/v1/mirror/capabilities','/v1/mirror/sheet?name=الأوردرات']){
    const r=await routed.fetch(await signed(route(path)),x.env,{});
    assert.equal(r.status,403);
  }
  assert.equal(x.audit.length,0);
});
test('method cannot be changed from a signed GET',async()=>{
  const x=fixture(),req=new Request(route('/v1/service/mirror/stats'),{method:'POST'});
  const r=await routed.fetch(req,x.env,{});assert.equal(r.status,405);assert.equal(x.audit.length,0);
});
test('wrong service path never reaches dedicated handler',async()=>{
  const x=fixture(),r=await handleMirrorServiceRead(new Request(route('/v1/service/mirror/not-a-route')),x.env);
  assert.equal(r,null);assert.equal(x.audit.length,0);
});
test('identical signed request cannot be used twice (durable replay lock)',async()=>{
  const x=fixture();
  const req=await signed(route('/v1/service/mirror/stats'));
  const first=await routed.fetch(req,x.env,{});
  assert.equal(first.status,200);
  const dbCount=x.audit.length;
  const second=await routed.fetch(req,x.env,{});
  assert.equal(second.status,409);
  assert.equal((await second.json()).code,'request-replay-denied');
  assert.equal(x.audit.length,dbCount);
});
test('missing replay Durable Object binding always denies before DB',async()=>{
  const x=fixture();delete x.env.MIRROR_SERVICE_READ_REPLAY_DO;
  const r=await routed.fetch(await signed(route('/v1/service/mirror/stats')),x.env,{});
  assert.equal(r.status,503);assert.equal((await r.json()).code,'replay-guard-unavailable');
  assert.equal(x.audit.length,0);
});
test('replay guard transaction rejects reused nonce and malformed receipt',async()=>{
  const store=new Map();
  const storage={
    transaction:async callback=>callback({
      get:async key=>store.get(key),put:async(key,v)=>{store.set(key,v);}
    }),
    getAlarm:async()=>null,setAlarm:async()=>{},
  };
  const guard=new MirrorServiceNonceGuardV1({storage});
  const url='https://mirror-replay.internal/consume';
  const payload={scope:META,nonce:'R'.repeat(24),validUntil:Date.now()+20000};
  const request=()=>new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  assert.equal((await guard.fetch(request())).status,200);
  assert.equal((await guard.fetch(request())).status,409);
  assert.equal((await guard.fetch(new Request(url,{method:'GET'}))).status,404);
  assert.equal((await guard.fetch(new Request(url,{method:'POST',body:'{}'}))).status,400);
});

test('all generated URLs remain reserved .invalid',()=>{
  assert.equal(new URL(HOST).hostname.endsWith('.invalid'),true);
});
