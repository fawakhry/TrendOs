/** SERVER-67: sandbox only, Apps Script signer contract and existing callers. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const sourcePaths = [
  'cloudflare-d1/D1_Mirror_Service_Read_V1.gs',
  'cloudflare-d1/D1_Full_Migration.gs',
  'cloudflare-d1/D1_Orders_Read_Cutover.gs',
];
const META_KEY='SYNTHETIC_META_1234567890_abcdefghijklmnopqrst';
const PARITY_KEY='SYNTHETIC_PARITY_1234567890_abcdefghijklmnopqr';
function sandbox({enabled=false,omitSigner=false,omitSecret=false,returnStatus=200}={}) {
  const sent=[];
  const values={
    D1_API_URL:'https://service-fixture.invalid',
    D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME:'service-fixture.invalid',
    D1_MIGRATION_SECRET:'SYNTHETIC_IMPORT_SECRET_NOT_FOR_READS',
    D1_MIRROR_SERVICE_READ_V1_ENABLED:enabled?'true':'false',
    D1_MIRROR_METADATA_HMAC_SECRET:omitSecret?'':META_KEY,
    D1_MIRROR_PARITY_HMAC_SECRET:PARITY_KEY,
  };
  const context=createContext({
    PropertiesService:{
      getScriptProperties:()=>({getProperty:key=>values[key]||''})
    },
    Utilities:{
      getUuid:()=> '12345678-1234-1234-1234-123456789012',
      computeHmacSha256Signature:(msg,secret)=>
        Array.from(createHmac('sha256',secret).update(msg).digest())
          .map(value=>value>127?value-256:value)
    },
    UrlFetchApp:{
      fetch:(url,options)=>{
        sent.push({url,options});
        return {getResponseCode:()=>returnStatus,getContentText:()=>JSON.stringify({
          success:returnStatus===200,
          sheets:[{sheetName:'SYNTHETIC_ONLY'}],
          stats:{rowCount:0},
          sheet:{sheetName:'SYNTHETIC_ONLY',rows:[]},
        })};
      }
    },
  });
  for(const p of sourcePaths) {
    if(omitSigner && p.includes('D1_Mirror_Service_Read'))continue;
    runInContext(readFileSync(p,'utf8'),context,{filename:p});
  }
  return {context,sent,values};
}
function checkSignature(sent,secret,principal) {
  const {url,options}=sent;
  const u=new URL(url);
  const h=options.headers;
  assert.equal(h['x-trendos-read-principal'],principal);
  assert.equal(h['x-trendos-read-nonce'],'12345678123412341234123456789012');
  const expected=[
    'GET',u.pathname,u.search,h['x-trendos-read-timestamp'],h['x-trendos-read-nonce'],principal
  ].join('\n');
  const digest=createHmac('sha256',secret).update(expected).digest('hex');
  assert.equal(h['x-trendos-read-signature'],digest);
  assert.equal(options.method,'get');
}
test('default-OFF Apps Script full migration uses existing GET behavior without new headers',()=>{
  const x=sandbox();
  const data=x.context.d1FullGet_('/v1/mirror/stats');
  assert.equal(data.success,true);
  assert.equal(x.sent.length,1);
  assert.equal(x.sent[0].url,'https://service-fixture.invalid/v1/mirror/stats');
  assert.equal(x.sent[0].options.headers,undefined);
});
test('explicit opt-in signs metadata and uses separate service path',()=>{
  const x=sandbox({enabled:true});
  const d=x.context.d1FullGet_('/v1/mirror/capabilities');
  assert.equal(d.success,true);
  assert.equal(x.sent.length,1);
  assert.ok(x.sent[0].url.endsWith('/v1/service/mirror/capabilities'));
  checkSignature(x.sent[0],META_KEY,'trendos_mirror_metadata');
});
test('explicit opt-in signs bounded order parity GET, without migration secret',()=>{
  const x=sandbox({enabled:true});
  const path='/v1/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=25&offset=0';
  const d=x.context.d1OrdersReadGetJson_(path);
  assert.equal(d.success,true);
  assert.equal(x.sent.length,1);
  checkSignature(x.sent[0],PARITY_KEY,'trendos_mirror_parity');
  assert.equal(x.sent[0].options.headers['x-migration-secret'],undefined);
});
test('opt-in without signer fails closed rather than silently using legacy GET',()=>{
  const x=sandbox({enabled:true,omitSigner:true});
  assert.throws(()=>x.context.d1FullGet_('/v1/mirror/stats'),/SERVER67_SIGNER_NOT_INSTALLED/);
  assert.equal(x.sent.length,0);
});
test('opt-in without principal key fails closed without HTTP request',()=>{
  const x=sandbox({enabled:true,omitSecret:true});
  assert.throws(()=>x.context.d1FullGet_('/v1/mirror/stats'),/SERVER67_SERVICE_SECRET_MISSING/);
  assert.equal(x.sent.length,0);
});
test('signed read refuses HTTP 403 with no legacy fallback',()=>{
  const x=sandbox({enabled:true,returnStatus:403});
  assert.throws(()=>x.context.d1FullGet_('/v1/mirror/stats'),/SERVER67_MIRROR_SERVICE_HTTP_403/);
  assert.equal(x.sent.length,1);
});
test('signer rejects arbitrary route, not a generic API credential',()=>{
  const x=sandbox({enabled:true});
  assert.throws(()=>x.context.d1MirrorServiceReadV1_('/v1/orders'),/SERVER67_ROUTE_NOT_ALLOWED/);
  assert.equal(x.sent.length,0);
});
test('signed GET is never sent to a non-HTTPS API destination',()=>{
  const x=sandbox({enabled:true});x.values.D1_API_URL='http://unsafe.invalid';
  assert.throws(()=>x.context.d1FullGet_('/v1/mirror/stats'),/SERVER71_SIGNED_TARGET_NOT_APPROVED/);
  assert.equal(x.sent.length,0);
});
