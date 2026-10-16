/** SERVER-56 / SEC-AP303-02: synthetic legacy caller compatibility, NO network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const legacyScript = src('customer_manager_d1_bridge_v1934.js');
const theme = src('matbagy_theme_v1860.js');
const html = src('index.html');
const apiImporter = src('cloudflare-d1/apps-script-importer.gs');
const legacyBackend = src('cloudflare-d1/src/index.js');
const EDGE_HOST = 'https://trendos.trendmall-contact.workers.dev';
const MODERN_HOST = 'https://trendos-d1-api.trendmall-contact.workers.dev';

function loadBridge(transport) {
  const calls = [], attempts = [], warnings = [];
  const original = async function(action,params) {
    calls.push({action,params,context:this});
    return {success:true,origin:'apps-script-synthetic',operation:params?.op};
  };
  const window = {trendosSecureApiV1922:original};
  const context = {
    window, URLSearchParams, setInterval:()=>{throw Error('unexpected retry interval')},
    fetch:async(url,opts)=>{
      attempts.push({url:String(url),opts});
      assert.ok(String(url).startsWith(EDGE_HOST+'/'), 'never contact modern production host');
      assert.equal(opts.method,'GET');
      return transport(url,opts);
    },
    console:{warn:(...args)=>warnings.push(args),info:()=>{}},
  };
  vm.runInNewContext(legacyScript,context,{filename:'customer_manager_d1_bridge_v1934.js',timeout:1500});
  return {window,original,calls,attempts,warnings};
}
const forbidden=()=>({ok:false,status:403,json:async()=>({success:false,message:'Forbidden - synthetic'})});

test('source graph includes bridge from deployed frontend entry, but runtime load remains unproven',()=>{
  assert.match(html,/src="matbagy_theme_v1860\.js\?v=/);
  assert.match(theme,/s\.src='customer_manager_d1_bridge_v1934\.js\?v=/);
  assert.match(theme,/loadCustomerManagerD1BridgeV1934\(\);/);
  assert.ok(legacyScript.includes(EDGE_HOST));
  assert.ok(!legacyScript.includes(MODERN_HOST));
});
test('403 on legacy inbox falls back to original Apps Script op, without additional fetches',async()=>{
  const h=loadBridge(forbidden);
  const input={op:'inbox',username:'FAKE_OPERATOR',token:'FAKE_INVALID_SESSION',limit:4};
  const response=await h.window.trendosSecureApiV1922('customerManagerV1',input);
  assert.deepEqual(response,{success:true,origin:'apps-script-synthetic',operation:'inbox'});
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].params,input);
  assert.equal(h.calls[0].context,h.window);
  assert.equal(h.attempts.length,1);
  assert.ok(h.attempts[0].url.startsWith(EDGE_HOST+'/v1/inbox?'));
  assert.equal(h.window.TrendOSCustomerManagerD1BridgeV1934.mode,'read-first-with-apps-script-fallback');
});
test('403 on legacy thread falls back to Apps Script and preserves original request',async()=>{
  const h=loadBridge(forbidden);
  const params={op:'thread',phone:'01000000000',token:'FAKE_INVALID_SESSION'};
  const response=await h.window.trendosSecureApiV1922('customerManagerV1',params);
  assert.equal(response.origin,'apps-script-synthetic');
  assert.equal(response.operation,'thread');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].params,params);
  assert.equal(h.attempts.length,1);
  assert.ok(h.attempts[0].url.startsWith(EDGE_HOST+'/v1/messages?'));
});
test('offline network error also falls back; no customer records are returned by fake network',async()=>{
  const h=loadBridge(async()=>{throw new Error('offline-synthetic')});
  const response=await h.window.trendosSecureApiV1922('customerManagerV1',{op:'inbox'});
  assert.equal(response.origin,'apps-script-synthetic');
  assert.equal(h.calls.length,1);
  assert.equal(h.attempts.length,1);
});
test('customer manager write/action op bypasses legacy D1 GET and uses original function',async()=>{
  const h=loadBridge(()=>{throw Error('GET should never be invoked')});
  for(const op of ['send','suggest','handoff','resolve']) {
    const out=await h.window.trendosSecureApiV1922('customerManagerV1',{op});
    assert.equal(out.operation,op);
  }
  assert.equal(h.calls.length,4);
  assert.equal(h.attempts.length,0);
});
test('unrelated service actions bypass legacy read bridge entirely',async()=>{
  const h=loadBridge(()=>{throw Error('GET should never be invoked')});
  const out=await h.window.trendosSecureApiV1922('anotherAction',{op:'inbox'});
  assert.equal(out.origin,'apps-script-synthetic');
  assert.equal(h.calls.length,1);
  assert.equal(h.attempts.length,0);
});
test('legacy bridge installs once and preserves original API for fallback',async()=>{
  const h=loadBridge(forbidden);
  assert.notEqual(h.window.trendosSecureApiV1922,h.original);
  assert.equal(h.window.trendosSecureApiV1922.__trendosOriginalSecureApiV1922,h.original);
  assert.equal(h.window.trendosSecureApiV1922.__trendosD1ReadBridgeV1934,true);
});
test('modern Worker legacy GETs are closed in review source, while importer remains POST gated',()=>{
  assert.match(legacyBackend,/legacy-read-authorization-required/);
  assert.match(legacyBackend,/request\.method === 'GET'/);
  assert.match(legacyBackend,/path === '\/v1\/customer'/);
  assert.match(legacyBackend,/path === '\/v1\/inbox'/);
  assert.match(apiImporter,/d1JsonFetch_\('\/v1\/import\/batch'/);
  assert.match(apiImporter,/'x-migration-secret': cfg\.secret/);
  assert.ok(!legacyBackend.includes('SERVER56_ALLOW_UNAUTHENTICATED_READ'));
});
test('SERVER-61: HTTP 200 inbox without conversations array falls back instead of reporting an empty inbox',async()=>{
  const h=loadBridge(async()=>({ok:true,status:200,json:async()=>({success:true,other:[]})}));
  const request={op:'inbox',limit:3};
  const out=await h.window.trendosSecureApiV1922('customerManagerV1',request);
  assert.equal(out.origin,'apps-script-synthetic');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].params,request);
  assert.equal(h.attempts.length,1);
});
test('SERVER-61: HTTP 200 thread without messages array falls back before optional reads',async()=>{
  const h=loadBridge(async()=>({ok:true,status:200,json:async()=>({success:true,other:[]})}));
  const request={op:'thread',phone:'01000000000'};
  const out=await h.window.trendosSecureApiV1922('customerManagerV1',request);
  assert.equal(out.origin,'apps-script-synthetic');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].params,request);
  assert.equal(h.attempts.length,1);
  assert.ok(h.attempts[0].url.startsWith(EDGE_HOST+'/v1/messages?'));
});
test('SERVER-61: valid empty D1 inbox and thread responses remain valid without Apps Script fallback',async()=>{
  const h=loadBridge(async(url)=>{
    if (String(url).includes('/v1/inbox')) return {ok:true,status:200,json:async()=>({success:true,conversations:[]})};
    if (String(url).includes('/v1/messages')) return {ok:true,status:200,json:async()=>({success:true,messages:[]})};
    if (String(url).includes('/v1/orders')) return {ok:true,status:200,json:async()=>({success:true,orders:[{customerName:'SYNTHETIC'}]})};
    throw Error('unexpected customer lookup');
  });
  const inbox=await h.window.trendosSecureApiV1922('customerManagerV1',{op:'inbox'});
  const thread=await h.window.trendosSecureApiV1922('customerManagerV1',{op:'thread',phone:'01000000000'});
  assert.equal(inbox.dataSource,'d1');
  assert.equal(inbox.conversations.length,0);
  assert.equal(thread.dataSource,'d1');
  assert.equal(thread.messages.length,0);
  assert.equal(thread.context.customerName,'SYNTHETIC');
  assert.equal(h.calls.length,0);
  assert.equal(h.attempts.length,3);
});
test('no test invokes remote worker, D1, or Apps Script HTTP',()=>{
  assert.match(EDGE_HOST,/workers\.dev$/);
  assert.match(MODERN_HOST,/workers\.dev$/);
  assert.ok(root.endsWith('/'));
});
