/** SERVER-71: Secure Apps Script HMAC destination must be independently pinned.
 * In-memory VM; never fetches Cloudflare, Google, or a real customer endpoint.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createContext,runInContext} from 'node:vm';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';

const FILE='cloudflare-d1/D1_Mirror_Service_Read_V1.gs';
const KEY='SYNTHETIC_SERVER71_OFFLINE_HMAC_abcdefghij0123456789';
const HOST='approved-server71.invalid';
const PATH='/v1/mirror/stats';
function setup({base='https://'+HOST,pinned=HOST,secret=KEY,enabled='true'}={}){
  const calls=[];
  const props={
    D1_API_URL:base,
    D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME:pinned,
    D1_MIRROR_SERVICE_READ_V1_ENABLED:enabled,
    D1_MIRROR_METADATA_HMAC_SECRET:secret
  };
  const context=createContext({
    PropertiesService:{getScriptProperties:()=>({getProperty:name=>props[name]||''})},
    Utilities:{
      getUuid:()=> '12345678-1234-1234-1234-123456789012',
      computeHmacSha256Signature:(msg,secret)=>
        [...createHmac('sha256',secret).update(msg).digest()].map(x=>x>127?x-256:x)
    },
    UrlFetchApp:{fetch:(url,options)=>{
      calls.push({url,options});
      assert.equal(new URL(url).hostname,HOST,
        'only the pinned synthetic .invalid host can be requested');
      return{
        getResponseCode:()=>200,
        getContentText:()=>JSON.stringify({success:true,stats:{rowCount:0}})
      };
    }},
    Date,Math,JSON,String
  });
  runInContext(readFileSync(FILE,'utf8'),context,{filename:FILE});
  return{calls,props,run:()=>context.d1MirrorServiceReadV1_(PATH)};
}
test('explicit matching HTTPS hostname signs metadata and never sends a token to URL parameters',()=>{
  const x=setup();
  assert.equal(x.run().success,true);
  assert.equal(x.calls.length,1);
  assert.equal(x.calls[0].url,'https://'+HOST+'/v1/service/mirror/stats');
  const h=x.calls[0].options.headers;
  assert.equal(h['x-trendos-read-principal'],'trendos_mirror_metadata');
  assert.equal(x.calls[0].options.followRedirects,false);
  assert.equal(x.calls[0].options.method,'get');
  assert.ok(!x.calls[0].url.includes(KEY));
  const payload=['GET','/v1/service/mirror/stats','',
    h['x-trendos-read-timestamp'],h['x-trendos-read-nonce'],
    'trendos_mirror_metadata'].join('\n');
  assert.equal(h['x-trendos-read-signature'],createHmac('sha256',KEY).update(payload).digest('hex'));
});
test('trailing slash/whitespace and case-normalized authority permitted without changing hostname',()=>{
  const x=setup({base:'  https://APPROVED-SERVER71.invalid/  ',pinned:'APPROVED-SERVER71.INVALID'});
  assert.equal(x.run().success,true);
  assert.equal(x.calls.length,1);
  assert.equal(new URL(x.calls[0].url).hostname,HOST);
});
test('default secure flag OFF sends absolutely no signed request',()=>{
  const x=setup({enabled:'false'});
  assert.throws(x.run,/SERVER67_SECURE_MIRROR_CLIENT_OFF/);
  assert.equal(x.calls.length,0);
});
for(const [label,options,error] of [
  ['missing pin',{pinned:''},'SERVER71_SIGNED_TARGET_NOT_PINNED'],
  ['mismatched pin',{pinned:'other-server71.invalid'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['subdomain lookalike',{base:'https://'+HOST+'.malicious.invalid'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['URL userinfo',{base:'https://'+HOST+'@malicious.invalid'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['wrong scheme',{base:'http://'+HOST},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['URL port',{base:'https://'+HOST+':444'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['URL query',{base:'https://'+HOST+'?redirect=malicious.invalid'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['URL fragment',{base:'https://'+HOST+'#x'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['URL path',{base:'https://'+HOST+'/v1/orders'},'SERVER71_SIGNED_TARGET_NOT_APPROVED'],
  ['invalid pinned host',{pinned:'bad..invalid'},'SERVER71_SIGNED_TARGET_NOT_PINNED'],
  ['secret too long',{secret:'X'.repeat(257)},'SERVER67_SERVICE_SECRET_MISSING']
]){
  test(label+' rejected before HMAC signed fetch',()=>{
    const x=setup(options);
    assert.throws(x.run,new RegExp(error));
    assert.equal(x.calls.length,0);
  });
}
test('new strict host pin cannot modify caller source for existing legacy OFF behavior',()=>{
  const source=readFileSync('cloudflare-d1/D1_Full_Migration.gs','utf8');
  assert.ok(source.includes("getProperty('D1_MIRROR_SERVICE_READ_V1_ENABLED')"));
  assert.ok(source.includes('return d1MirrorServiceReadV1_(path)'));
  assert.ok(source.includes('UrlFetchApp.fetch(cfg.apiUrl + path'));
  assert.ok(!source.includes('D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME'));
});
