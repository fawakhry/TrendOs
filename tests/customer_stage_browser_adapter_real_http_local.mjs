/**
 * Actual Worker HTTP × original customer-only browser adapter, LOCAL TEST ONLY.
 * Import/execute the unchanged adapter in an isolated Node VM. Only the
 * test-only window.fetch maps the exact pinned production URL to loopback.
 * Every request performs and validates a real HTTP CORS preflight first.
 * It is NOT a production-browser test / Cloudflare remote proof.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

if (process.env.CUSTOMER_STAGE_LOCAL_E2E !== '1')
  throw new Error('local-only-test-opt-in-required');
const port=Number(process.env.CUSTOMER_STAGE_LOCAL_PORT);
if (!Number.isSafeInteger(port)||port<1024||port>65535)
  throw new Error('local-only-port-required');
const localhost='http://127.0.0.1:'+port;
const frontend='http://127.0.0.1:8000';
const pinned='https://trendos-d1-api.trendmall-contact.workers.dev';
const code='LOCAL-FIXTURE-PC-C1';
const password='LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL!';
const customerJs=readFileSync(new URL('../customer-native-browser-transport-v0.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../config.js',import.meta.url),'utf8');
assert.match(config,/TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED\s*=\s*false/);
assert.match(customerJs,/var API_ORIGIN = 'https:\/\/trendos-d1-api\.trendmall-contact\.workers\.dev'/);
assert.doesNotMatch(customerJs,/script\.google\.com|APPS_SCRIPT_API_URL/);

let requests=0,preflights=0,legacy=0;
async function localFetchWithBrowserPreflight(url,init={}){
  // In this VM only, a single hard-pinned production-looking URL is diverted
  // to the local Worker test port. ANY non-pinned URL is rejected before I/O.
  const intended=new URL(url);
  assert.equal(intended.origin,pinned);
  assert.match(intended.pathname,/^\/v1\/customer\/native\/(?:login|orders|logout)$/);
  assert.equal(init.credentials,'omit');
  assert.equal(init.redirect,'error');
  assert.equal(init.cache,'no-store');
  const headers=new Headers(init.headers||{});
  const method=String(init.method||'GET').toUpperCase();
  const path=intended.pathname+intended.search;
  const requestingHeaders=Object.keys(init.headers||{}).map(x=>x.toLowerCase())
    .filter(h=>!['accept'].includes(h));
  const preflight=await fetch(localhost+path,{method:'OPTIONS',
    headers:{
      'Origin':frontend,
      'Access-Control-Request-Method':method,
      'Access-Control-Request-Headers':requestingHeaders.join(','),
      'CF-Connecting-IP':'192.0.2.17'
    },redirect:'error'});
  preflights++;
  assert.equal(preflight.status,204,'real local Worker preflight must be 204');
  assert.equal(preflight.headers.get('access-control-allow-origin'),frontend);
  assert.equal(preflight.headers.get('vary'),'Origin');
  const methods=(preflight.headers.get('access-control-allow-methods')||'').toLowerCase();
  const allowedHeaders=(preflight.headers.get('access-control-allow-headers')||'').toLowerCase();
  assert.ok(methods.includes(method.toLowerCase()),'preflight method not allowed');
  for(const name of requestingHeaders)
    assert.ok(allowedHeaders.split(',').map(x=>x.trim()).includes(name),
      'preflight header blocked: '+name);
  const forwarded=new Headers(init.headers||{});
  forwarded.set('Origin',frontend);
  // Only the trusted local test transport sets edge connecting-IP. Browsers
  // cannot set this header, and the test is NOT attestation of real ingress.
  forwarded.set('CF-Connecting-IP','192.0.2.17');
  const outcome=await fetch(localhost+path,{
    method,headers:forwarded,body:init.body,
    redirect:'error',signal:init.signal,cache:'no-store'});
  requests++;
  assert.equal(outcome.headers.get('access-control-allow-origin'),frontend,
    'real HTTP response must pass CORS validation');
  assert.equal(outcome.headers.get('cache-control'),'no-store');
  if(method==='POST'&&intended.pathname.endsWith('/login')){
    assert.deepEqual(JSON.parse(init.body),{portalCode:code,password});
    assert.ok(!forwarded.has('Authorization'),'login must not forward Google token');
  }
  return outcome;
}
const window={
  TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED:true, // TEST-VM ONLY
  MATBAGY_EDGE_ORDERS_API_URL:pinned,
  fetch:localFetchWithBrowserPreflight
};
vm.runInNewContext(customerJs,{window,AbortController,setTimeout,clearTimeout},{
  filename:'customer-native-browser-transport-v0.js'
});
const legacyDownstream=async()=>{legacy++;throw Error('Legacy Google must not be used');};
const call=(action,params)=>window.trendosCustomerNativeBrowserDispatchV0(
  action,params,legacyDownstream
);
const login=await call('customerLogin',{
  customerCode:code,password,legacyToken:'FAKE-LEGACY-CREDENTIAL'
});
assert.equal(login.success,true);
assert.equal(login.customer.nativeSession,true);
assert.equal(login.customer.token,'NATIVE_SESSION_IN_MEMORY');
assert.ok(!JSON.stringify(login).includes('a'.repeat(64)));
const orders=await call('getCustomerOrders',{
  token:'FAKE_OLD_GOOGLE_TOKEN',customerId:'LOCAL-C2',customerCode:'LOCAL-FORGED'
});
assert.equal(orders.success,true);
assert.equal(orders.source,'customer-d1-native-read-v0');
assert.deepEqual(orders.orders.map(x=>x.orderId),['LOCAL-ORDER-LOCAL-C1']);
assert.equal(orders.orders[0].itemName,'FAKE PRINT REQUEST');
assert.ok(!JSON.stringify(orders).includes('LOCAL_FAKE_PHONE'));
await assert.rejects(()=>call('submitCustomerDraft',{
  token:'FAKE_OLD_GOOGLE_TOKEN',customerId:'LOCAL-C2'
}),{code:'CUSTOMER_NATIVE_ACTION_NOT_WIRED'});
const logout=await call('customerLogout',{token:'FAKE_OLD_GOOGLE_TOKEN'});
assert.equal(logout.serverSessionRevoked,true);
assert.equal(logout.sessionRevoked,true);
await assert.rejects(()=>call('getCustomerOrders',{}),{
  code:'CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE'
});
window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED=false;
await assert.rejects(()=>call('getCustomerOrders',{
  token:'NATIVE_SESSION_IN_MEMORY',customerCode:code
}),{code:'CUSTOMER_NATIVE_MODE_MISMATCH'});
assert.equal(legacy,0);
assert.equal(preflights,3);
assert.equal(requests,3);

// Negative Origin preflight must NOT claim access-control for foreign site.
const blocked=await fetch(localhost+'/v1/customer/native/orders',{
  method:'OPTIONS',
  headers:{Origin:'https://fake-foreign-origin.invalid',
    'Access-Control-Request-Method':'GET',
    'Access-Control-Request-Headers':'authorization'}
});
assert.equal(blocked.status,403);
assert.equal(blocked.headers.get('access-control-allow-origin'),null);
console.log('PASS: source customer browser adapter → actual LOCAL Cloudflare Worker HTTP with CORS preflight x3, Native in-memory token, scoped D1 orders, verified CAS logout, zero Google calls');
console.log('NO_REMOTE_CLOUDFLARE_CALLS=YES; STAGE_LOCAL_ONLY=YES; LIVE_GOOGLE_RETIRED=0/9');
