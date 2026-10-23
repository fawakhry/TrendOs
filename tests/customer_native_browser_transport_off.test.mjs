import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const source = readFileSync(new URL('customer-native-browser-transport-v0.js', ROOT), 'utf8');
const appSource = readFileSync(new URL('app.js', ROOT), 'utf8');
const pageSource = readFileSync(new URL('index.html', ROOT), 'utf8');
const configSource = readFileSync(new URL('config.js', ROOT), 'utf8');
const HOST = 'https://trendos-d1-api.trendmall-contact.workers.dev';
const NATIVE = 'f'.repeat(64);
const GOOGLE_LEGACY = { customerCode: 'LEGACY_PRIVATE_CODE', token: 'GOOGLE_LEGACY_SESSION_SECRET' };
const ACTIONS = [
  'customerLogin', 'customerLogout', 'changeCustomerPassword', 'getCustomerOrders',
  'getCustomerPortalAccountsV1859', 'createCustomerDraft', 'addCustomerDraftItem',
  'submitCustomerDraft', 'uploadCustomerDraftFile'
];
const goodLine = {
  orderId: 'T12-abc', lineId: 'T12-abc-01', department: 'طباعة',
  itemName: 'طلب تجريبي', status: 'طلب جديد', qty: 2, ordinal: 1,
  note: 'SENSITIVE_SHOULD_NOT_SHOW', phone: 'PRIVATE_PHONE'
};
const goodBody = {
  success: true, readOnly: true, source: 'customer-d1-native-read-v0',
  lines: [goodLine], hasMore: false
};
const goodLogout = {success:true,sessionRevoked:true,source:'customer-d1-native-logout-v0'};
const goodLogin = {
  success:true,customerSessionIssued:true,source:'d1-native-customer-login-v0',
  token:'e'.repeat(64),expiresAtMs:Date.now()+600000
};
function harness(opts = {}) {
  const downstreamCalls = [], nativeCalls = [];
  let response = opts.response ?? goodBody;
  const window = {
    TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED: opts.enabled === true,
    MATBAGY_EDGE_ORDERS_API_URL: opts.origin ?? HOST,
    trendosCustomerNativeBearerV0: opts.issuer ??
      (() => NATIVE),
    fetch: async (url, init) => {
      nativeCalls.push({ url, init });
      if (opts.rejectFetch) throw new Error('network');
      if (opts.responseStatus) {
        return { ok: false, status: opts.responseStatus, text: async () => '{}' };
      }
      return {
        ok: true, status: 200, text: async () =>
          opts.rawResponse ?? JSON.stringify(url.endsWith('/login') ? (opts.loginResponse ?? goodLogin) : url.endsWith('/logout') ? (opts.logoutResponse ?? goodLogout) : response)
      };
    }
  };
  vm.runInNewContext(source, { window, AbortController, setTimeout, clearTimeout }, { filename: 'customer-native-browser-transport-v0.js' });
  const downstream = (...args) => {
    downstreamCalls.push(args);
    return opts.legacyResult ?? { success: true, from: 'legacy' };
  };
  function call(action, params = GOOGLE_LEGACY) {
    return window.trendosCustomerNativeBrowserDispatchV0(action, params, downstream);
  }
  return { window, downstream, downstreamCalls, nativeCalls, call };
}

test('source-only: loaded in correct order and default OFF with existing app hook', () => {
  assert.match(configSource, /TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED\s*=\s*false/);
  const paths = ['browser-api-transport-v1.js', 'customer-native-browser-transport-v0.js',
    'app.js', 'employee-api-dispatcher-v1.js'];
  let prev = -1;
  for (const path of paths) {
    const index = pageSource.indexOf('<script src="' + path + '?');
    assert.ok(index > prev, path + ' must load after predecessor');
    prev = index;
  }
  assert.match(appSource, /window\.trendosCustomerNativeBrowserDispatchV0\(action, params, legacy\)/);
  assert.match(appSource, /return legacy\(action, params\);/);
  assert.match(source, /customerLogin: 1/);
  assert.match(source, /uploadCustomerDraftFile: 1/);
  assert.doesNotMatch(source, /script\.google\.com|APPS_SCRIPT_API_URL|createT12GeneralOrder/);
});

test('OFF preserves exact downstream reference and result for all nine customer actions', async () => {
  const h = harness({ enabled: false });
  for (const action of ACTIONS) {
    assert.deepEqual(await h.call(action, GOOGLE_LEGACY), { success: true, from: 'legacy' });
  }
  assert.equal(h.downstreamCalls.length, 9);
  assert.equal(h.nativeCalls.length, 0);
  for (let i = 0; i < ACTIONS.length; i++) {
    assert.equal(h.downstreamCalls[i][0], ACTIONS[i]);
    assert.equal(h.downstreamCalls[i][1], GOOGLE_LEGACY);
  }
});

test('employee and noncustomer paths always bypass adapter, even if customer flag ON', async () => {
  const h = harness({ enabled: true });
  for (const action of ['login', 'getRows', 'createT12GeneralOrder', 'getAccounting',
    'verifyEmployeeSession', 'operatorTaskV2']) {
    await h.call(action);
  }
  assert.equal(h.downstreamCalls.length, 6);
  assert.equal(h.nativeCalls.length, 0);
});

test('enabled customer route blocks seven unwired customer actions with no Google fallback', async () => {
  const h = harness({ enabled: true });
  for (const action of ACTIONS.filter(x => !['getCustomerOrders','customerLogin','customerLogout'].includes(x))) {
    await assert.rejects(() => h.call(action, {password:'PRIVATE',...GOOGLE_LEGACY}),
      { code: 'CUSTOMER_NATIVE_ACTION_NOT_WIRED' });
  }
  assert.equal(h.downstreamCalls.length, 0);
  assert.equal(h.nativeCalls.length, 0);
});

test('enabled orders reject missing native issuer, short token, and Google legacy session', async () => {
  for (const issuer of [null, () => 'LEGACY_GOOGLE', () => '0'.repeat(63), () => 'z'.repeat(64)]) {
    const h = harness({ enabled: true, issuer });
    if (issuer === null) delete h.window.trendosCustomerNativeBearerV0;
    await assert.rejects(() => h.call('getCustomerOrders'),
      { code: 'CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE' });
    assert.equal(h.nativeCalls.length, 0);
    assert.equal(h.downstreamCalls.length, 0);
  }
});

test('enabled orders reject untrusted endpoint before any network or legacy call', async () => {
  for (const origin of ['https://script.google.com', HOST + '/v1/legacy-api',
    HOST + '?next=google', 'http://trendos-d1-api.trendmall-contact.workers.dev',
    'https://evil.test', 'https://trendos-d1-api.trendmall-contact.workers.dev.evil.test']) {
    const h = harness({enabled: true, origin});
    await assert.rejects(() => h.call('getCustomerOrders'),
      {code:'CUSTOMER_NATIVE_API_ORIGIN_UNTRUSTED'});
    assert.equal(h.nativeCalls.length, 0);
    assert.equal(h.downstreamCalls.length, 0);
  }
});

test('native orders HTTPS GET sends only independent bearer and maps safe old UI order shape', async () => {
  const h = harness({enabled:true});
  const value = await h.call('getCustomerOrders', GOOGLE_LEGACY);
  assert.equal(value.success, true);
  assert.equal(value.orders.length, 1);
  assert.deepEqual(Object.keys(value.orders[0]).sort(), [
    'department','itemName','lineId','orderId','qty','status'
  ]);
  assert.equal(value.orders[0].orderId,'T12-abc');
  assert.equal(h.nativeCalls.length, 1);
  assert.equal(h.downstreamCalls.length, 0);
  const req = h.nativeCalls[0];
  assert.equal(req.url, HOST + '/v1/customer/native/orders?limit=40&offset=0');
  assert.equal(req.init.method, 'GET');
  assert.equal(req.init.headers.authorization, 'Bearer '+NATIVE);
  assert.equal(req.init.redirect,'error');
  assert.equal(req.init.credentials,'omit');
  assert.equal(req.init.cache,'no-store');
  assert.doesNotMatch(JSON.stringify(req), /LEGACY_PRIVATE_CODE|GOOGLE_LEGACY_SESSION_SECRET|PRIVATE_PHONE|SENSITIVE_SHOULD_NOT_SHOW/);
  assert.doesNotMatch(JSON.stringify(value), /phone|note|amount|debt|invoice|SENSITIVE_SHOULD_NOT_SHOW/);
});

test('no Google retry on network error, 401/500, bad JSON, unexpected or incomplete native data', async () => {
  const options = [
    [{ rejectFetch: true }, 'CUSTOMER_NATIVE_ORDER_NETWORK_UNAVAILABLE'],
    [{ responseStatus: 401 }, 'CUSTOMER_NATIVE_ORDER_HTTP_DENIED'],
    [{ responseStatus: 503 }, 'CUSTOMER_NATIVE_ORDER_HTTP_DENIED'],
    [{ rawResponse: 'not json' }, 'CUSTOMER_NATIVE_ORDER_RESPONSE_INVALID'],
    [{ response: {...goodBody, hasMore: true} }, 'CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED'],
    [{ response: {...goodBody, source: 'legacy-google'} }, 'CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED'],
    [{ response: {...goodBody, readOnly: false} }, 'CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED'],
    [{ response: {...goodBody, lines: null} }, 'CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED'],
    [{ response: {...goodBody, lines: Array(41).fill(goodLine)} }, 'CUSTOMER_NATIVE_ORDER_CONTRACT_UNQUALIFIED'],
    [{ response: {...goodBody, lines:[{...goodLine, qty:-1}]} }, 'CUSTOMER_NATIVE_ORDER_ROW_INVALID'],
    [{ response: {...goodBody, lines:[{...goodLine, itemName: ''}]} }, 'CUSTOMER_NATIVE_ORDER_ROW_INVALID']
  ];
  for (const [variant, code] of options) {
    const h = harness({enabled:true, ...variant});
    await assert.rejects(() => h.call('getCustomerOrders'), {code});
    assert.equal(h.downstreamCalls.length, 0);
  }
});

test('actual app.js secure API assignment invokes adapter while keeping employee downstream exact', async () => {
  const h = harness({enabled:false});
  const start = appSource.indexOf('window.trendosSecureApiV1922 = async function(action, params)');
  const end = appSource.indexOf('\n  function api(action, params)', start);
  assert.ok(start > 0 && end > start, 'exact integration assignment present');
  h.window.trendosLegacyApiTransportV1 = h.downstream;
  vm.runInNewContext(appSource.slice(start, end), {window:h.window});
  const a = await h.window.trendosSecureApiV1922('getCustomerOrders',GOOGLE_LEGACY);
  assert.deepEqual(a,{success:true,from:'legacy'});
  assert.equal(h.downstreamCalls.length,1);
  h.window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED = true;
  await assert.rejects(
    () => h.window.trendosSecureApiV1922('customerLogin',{password:'PRIVATE'}),
    {code:'CUSTOMER_NATIVE_LOGIN_INPUT_INVALID'}
  );
  const b = await h.window.trendosSecureApiV1922('getCustomerOrders',GOOGLE_LEGACY);
  assert.equal(b.success,true);
  assert.equal(b.orders.length,1);
  assert.equal(h.downstreamCalls.length,1,'ON never passed customer credentials to legacy');
  const c = await h.window.trendosSecureApiV1922('getRows',{employeeToken:'EMPLOYEE'});
  assert.deepEqual(c,{success:true,from:'legacy'});
  assert.equal(h.downstreamCalls.length,2,'employee route unchanged');
  assert.equal(h.downstreamCalls[1][1].employeeToken,'EMPLOYEE');
});

test('native mode is strict boolean true; truthy strings cannot flip OFF', async () => {
  const h = harness({enabled:false});
  for (const value of ['true',1,'yes',{},null,undefined]) {
    h.window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED = value;
    assert.deepEqual(await h.call('getCustomerOrders'), {success:true,from:'legacy'});
  }
  assert.equal(h.nativeCalls.length, 0);
  assert.equal(h.downstreamCalls.length, 6);
});

test('ON Native login POST maps only verified synthetic response and keeps bearer in-memory',async()=>{
  const h=harness({enabled:true,issuer:null});
  delete h.window.trendosCustomerNativeBearerV0;
  const result=await h.call('customerLogin',{
    customerCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!',
    legacyGoogleToken:'LEGACY_PRIVATE'
  });
  assert.equal(result.success,true);
  assert.equal(result.customer.customerCode,'PC-FAKE-1');
  assert.equal(result.customer.token,'NATIVE_SESSION_IN_MEMORY');
  assert.equal(result.customer.nativeSession,true);
  assert.doesNotMatch(JSON.stringify(result),/'e'{64}|LEGACY_PRIVATE/);
  assert.equal(h.nativeCalls.length,1);
  const request=h.nativeCalls[0];
  assert.equal(request.url,HOST+'/v1/customer/native/login');
  assert.equal(request.init.method,'POST');
  assert.equal(request.init.redirect,'error');
  assert.equal(request.init.credentials,'omit');
  const sent=JSON.parse(request.init.body);
  assert.deepEqual(sent,{portalCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!'});
  assert.ok(!request.init.headers.authorization,'login does not use Google session');
  assert.doesNotMatch(JSON.stringify(request),/LEGACY_PRIVATE/);
  const orders=await h.call('getCustomerOrders',GOOGLE_LEGACY);
  assert.equal(orders.success,true);
  assert.equal(h.nativeCalls[1].init.headers.authorization,'Bearer '+'e'.repeat(64));
  assert.equal(h.downstreamCalls.length,0);
});
test('after Native login, flag OFF fails closed for customer while employee stays unchanged',async()=>{
  const h=harness({enabled:true});
  await h.call('customerLogin',{customerCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!'});
  h.window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED=false;
  await assert.rejects(()=>h.call('getCustomerOrders'),{code:'CUSTOMER_NATIVE_MODE_MISMATCH'});
  const logout=await h.call('customerLogout');
  assert.equal(logout.serverSessionRevoked,true,'existing D1 CAS route still used even after flag flip');
  assert.equal(h.nativeCalls[1].url,HOST+'/v1/customer/native/logout');
  assert.equal(h.downstreamCalls.length,0);
  assert.deepEqual(await h.call('getRows',{username:'EMPLOYEE'}),{success:true,from:'legacy'});
  assert.equal(h.downstreamCalls.length,1);
});
test('Native logout POST requires original verified D1 CAS acknowledgement, no Google fallback',async()=>{
  const h=harness({enabled:true});
  await h.call('customerLogin',{customerCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!'});
  const result=await h.call('customerLogout',GOOGLE_LEGACY);
  assert.equal(result.success,true);
  assert.equal(result.serverSessionRevoked,true);
  assert.equal(result.sessionRevoked,true);
  assert.equal(result.source,'customer-d1-native-logout-v0');
  assert.equal(h.nativeCalls.length,2);
  assert.equal(h.nativeCalls[1].url,HOST+'/v1/customer/native/logout');
  assert.equal(h.nativeCalls[1].init.method,'POST');
  assert.equal(h.nativeCalls[1].init.headers.authorization,'Bearer '+'e'.repeat(64));
  assert.equal(h.nativeCalls[1].init.credentials,'omit');
  assert.equal(h.nativeCalls[1].init.redirect,'error');
  assert.doesNotMatch(JSON.stringify(h.nativeCalls[1]),/LEGACY_PRIVATE|GOOGLE_LEGACY/);
  assert.equal(h.downstreamCalls.length,0);
  await assert.rejects(()=>h.call('getCustomerOrders'),{code:'CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE'});
});
test('Native login fails closed for unqualified response and never sends password to Google',async()=>{
  const variants=[
    [{responseStatus:401},'CUSTOMER_NATIVE_LOGIN_REJECTED'],
    [{responseStatus:503},'CUSTOMER_NATIVE_LOGIN_REJECTED'],
    [{rejectFetch:true},'CUSTOMER_NATIVE_LOGIN_NETWORK_UNAVAILABLE'],
    [{rawResponse:'not json'},'CUSTOMER_NATIVE_LOGIN_RESPONSE_INVALID'],
    [{loginResponse:{...goodLogin,source:'legacy-google'}},'CUSTOMER_NATIVE_LOGIN_RESPONSE_UNQUALIFIED'],
    [{loginResponse:{...goodLogin,token:'BAD'}},'CUSTOMER_NATIVE_LOGIN_RESPONSE_UNQUALIFIED'],
    [{loginResponse:{...goodLogin,expiresAtMs:Date.now()-10000}},'CUSTOMER_NATIVE_LOGIN_RESPONSE_UNQUALIFIED']
  ];
  for(const [opts,code] of variants){
    const h=harness({enabled:true,...opts});
    await assert.rejects(()=>h.call('customerLogin',{customerCode:'PC-FAKE-1',
      password:'FAKE-Password-NotReal-2026!'}),{code});
    assert.equal(h.downstreamCalls.length,0);
  }
});
test('native source-only app.js save/load functions do not persist or restore native bearer',()=>{
  const anchor='  function saveCustomerSession() {';
  const start=appSource.indexOf(anchor),end=appSource.indexOf('  function clearCustomerSession() {',start);
  assert.ok(start>=0&&end>start);
  const sessionMap=new Map(),localMap=new Map();
  const storage=(map)=>({
    setItem(k,v){map.set(k,v);},
    removeItem(k){map.delete(k);},
    getItem(k){return map.get(k)??null;}
  });
  const window={TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED:true};
  const state={customer:{customerCode:'PC-FAKE-1',token:'NATIVE_SESSION_IN_MEMORY',
    nativeSession:true}};
  const context=vm.createContext({state,sessionStorage:storage(sessionMap),
    localStorage:storage(localMap),window});
  vm.runInContext(appSource.slice(start,end),context);
  vm.runInContext('saveCustomerSession()',context);
  assert.equal(sessionMap.size,0,'native sessions never persisted to sessionStorage');
  assert.equal(localMap.size,0,'native sessions never persisted to localStorage');
  assert.equal(vm.runInContext('loadCustomerSession()',context),false,'native mode never reloads legacy session');
  state.customer={customerCode:'PC-LEGACY',token:'OLD_GOOGLE_TOKEN'};
  window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED=false;
  vm.runInContext('saveCustomerSession()',context);
  assert.equal(sessionMap.has('matbagy_platform_customer_session'),true,'OFF legacy behavior preserved');
  assert.equal(vm.runInContext('loadCustomerSession()',context),true,'legacy restore unchanged OFF');
});

test('Native logout fails CLOSED on network/401/503/fake-success response, clears local bearer immediately',async()=>{
  const variants=[
    [{rejectFetch:true},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{responseStatus:401},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{responseStatus:503},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{rawResponse:'not JSON'},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{logoutResponse:{...goodLogout,sessionRevoked:false}},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{logoutResponse:{...goodLogout,source:'google-bridge'}},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED'],
    [{logoutResponse:{success:true,sessionRevoked:true}},'CUSTOMER_NATIVE_LOGOUT_SERVER_UNVERIFIED']
  ];
  for(const [o,code] of variants){
    const h=harness({enabled:true,...o});
    await h.call('customerLogin',{customerCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!'});
    await assert.rejects(()=>h.call('customerLogout',GOOGLE_LEGACY),{code});
    assert.equal(h.downstreamCalls.length,0);
    await assert.rejects(()=>h.call('getCustomerOrders'),{code:'CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE'});
    await assert.rejects(()=>h.call('customerLogout'),{code:'CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE'});
  }
});
test('Native in-memory marker is NEVER forwarded to legacy after local logout or flag OFF',async()=>{
  const h=harness({enabled:true});
  await h.call('customerLogin',{customerCode:'PC-FAKE-1',password:'FAKE-Password-NotReal-2026!'});
  await h.call('customerLogout');
  h.window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED=false;
  for (const action of ['getCustomerOrders','customerLogout','getCustomerPortalAccountsV1859']) {
    await assert.rejects(()=>h.call(action,{
      customerCode:'PC-FAKE-1',token:'NATIVE_SESSION_IN_MEMORY'
    }),{code:'CUSTOMER_NATIVE_MODE_MISMATCH'});
  }
  assert.equal(h.downstreamCalls.length,0);
  assert.deepEqual(await h.call('getRows',{username:'EMPLOYEE'}),{success:true,from:'legacy'});
  assert.equal(h.downstreamCalls.length,1);
});
test('customer logout UI reports server revocation failure for Native only, keeps legacy logout behavior',()=>{
  const start=appSource.indexOf('  function customerLogout() {');
  const end=appSource.indexOf('\n  function canOpenVisitorPreview()',start);
  assert.ok(start>0&&end>start);
  const body=appSource.slice(start,end);
  assert.match(body,/result\.serverSessionRevoked !== true/);
  assert.match(body,/c\.nativeSession === true/);
  assert.match(body,/clearCustomerSession\(\)/);
  assert.match(body,/showEntryChoice\(\)/);
});
