import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const fetchCalls = [];
const legacyCalls = [];

const baseLegacy = async function(action, params) {
  legacyCalls.push({ action, params: { ...(params || {}) } });
  return { success: true, source: 'legacy', action };
};

const windowObject = {
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES: [],
  MATBAGY_EMPLOYEE_API_URL: 'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL: 'https://trendos-d1-api.example.test',
  trendosSecureApiV1922: baseLegacy
};

const sandbox = {
  window: windowObject,
  console,
  URL,
  Set,
  Map,
  JSON,
  Error,
  AbortController,
  TextEncoder,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  fetch: async function(url, options = {}) {
    fetchCalls.push({ url: String(url), options });
    return new Response(JSON.stringify({ success: true, route: String(url) }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  },
  Response
};

vm.runInNewContext(source, sandbox, { filename: 'employee-api-dispatcher-v1.js' });

assert.ok(windowObject.TrendOSEmployeeApiDispatcherV1);
assert.equal(typeof windowObject.trendosEmployeeApiV1, 'function');
assert.equal(typeof windowObject.trendosEmployeeLegacyFallbackV1, 'function');
assert.equal(windowObject.trendosSecureApiV1922.__trendosEmployeeApiDispatcherV1, true);

// OFF means exact legacy behavior is preserved.
let legacyInvokerCalls = 0;
const offResult = await windowObject.trendosEmployeeApiV1(
  'hrV1',
  { username: 'u', token: 'legacy-token', op: 'myRequests' },
  async function(){ legacyInvokerCalls += 1; return { success:true, source:'exact-legacy-invoker' }; }
);
assert.equal(offResult.source, 'legacy');
assert.equal(legacyInvokerCalls, 0);
assert.equal(fetchCalls.length, 0);

// Global wrapper also preserves old secure API behavior while OFF.
const wrappedOff = await windowObject.trendosSecureApiV1922('getDashboard',{ username:'u', token:'legacy-token' });
assert.equal(wrappedOff.source, 'legacy');
assert.equal(legacyCalls.at(-1).action, 'getDashboard');

// Native login goes only to D1 auth.
windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = true;
const loginResult = await windowObject.trendosEmployeeApiV1('login',{ username:'u', password:'temp-pass' });
assert.equal(loginResult.success, true);
assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/auth/login');
assert.match(fetchCalls.at(-1).options.body, /"password":"temp-pass"/);

// Legacy employee bridge is fail-closed while disabled.
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('getDashboard',{ username:'u', token:'native-token' }),
  err => err && err.code === 'EMPLOYEE_LEGACY_BRIDGE_DISABLED'
);

// Enable bridge with one exact policy.
windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = true;
windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = ['getDashboard','pressControlV1:status'];

const bridged = await windowObject.trendosEmployeeApiV1('getDashboard',{
  username:'u',
  token:'native-token',
  password:'must-not-forward',
  screen:'service'
});
assert.equal(bridged.success, true);
const bridgeCall = fetchCalls.at(-1);
assert.equal(bridgeCall.url, 'https://trendos-d1-api.example.test/v1/employee/legacy-action');
assert.equal(bridgeCall.options.headers.authorization, 'Bearer native-token');
const bridgeBody = JSON.parse(bridgeCall.options.body);
assert.equal(bridgeBody.action, 'getDashboard');
assert.equal(bridgeBody.username, 'u');
assert.equal(Object.prototype.hasOwnProperty.call(bridgeBody,'token'), false);
assert.equal(Object.prototype.hasOwnProperty.call(bridgeBody,'password'), false);

// Multiplexed policy requires action + op.
assert.equal(
  windowObject.TrendOSEmployeeApiDispatcherV1.policyAllowed('pressControlV1',{op:'status'}),
  true
);
assert.equal(
  windowObject.TrendOSEmployeeApiDispatcherV1.policyAllowed('pressControlV1',{op:'start'}),
  false
);
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('pressControlV1',{ username:'u', token:'native-token', op:'start' }),
  err => err && err.code === 'EMPLOYEE_LEGACY_POLICY_DENIED'
);

// Hybrid fallback never invokes Apps Script with the native employee token.
let forbiddenLegacyFallback = 0;
const fallbackResult = await windowObject.trendosEmployeeLegacyFallbackV1(
  'getDashboard',
  { username:'u', token:'native-token' },
  async function(){ forbiddenLegacyFallback += 1; return { success:true }; }
);
assert.equal(fallbackResult.success, true);
assert.equal(forbiddenLegacyFallback, 0);

// Cloud/hybrid actions fail closed until Edge router is ready.
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('createManualOrder',{ username:'u', token:'native-token' }),
  err => err && err.code === 'EMPLOYEE_CLOUD_ROUTER_NOT_READY'
);

// Once Edge router is present, Cloud-native action delegates to it.
const edgeCalls=[];
const edgeApi=async function(action,params){edgeCalls.push({action,params});return {success:true,source:'edge'};};
edgeApi.__trendosEdgeOrdersReadV1=true;
windowObject.trendosSecureApiV1922=edgeApi;
const cloudResult=await windowObject.trendosEmployeeApiV1('createManualOrder',{username:'u',token:'native-token'});
assert.equal(cloudResult.source,'edge');
assert.equal(edgeCalls.at(-1).action,'createManualOrder');

// Static frontend contract.
const config=fs.readFileSync('config.js','utf8');
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = true/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = \[\]/);

const index=fs.readFileSync('index.html','utf8');
const appAt=index.indexOf('app.js?v=');
const dispatcherAt=index.indexOf('employee-api-dispatcher-v1.js?v=');
assert.ok(appAt >= 0 && dispatcherAt > appAt);

const edge=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
assert.match(edge,/ORDERS_CLOUD_UNAVAILABLE/);
assert.doesNotMatch(edge,/return hybridAppsScriptFallback/);

for(const file of [
  'attendance-clockin-ui-v1.js',
  'attendance-live-timer-v1.js',
  'employee-cleaning-prep-v1.js',
  'customer-manager-v1.js',
  'customer-feedback-v1.js',
  'go-live-autopilot-v1.js',
  'hr-v1.js',
  'press-control-v1.js'
]){
  const s=fs.readFileSync(file,'utf8');
  assert.match(s,/trendosEmployeeApiV1/);
}

console.log('A61_FRONTEND_EMPLOYEE_DISPATCHER=PASS');
console.log('NATIVE_AUTH_PRODUCTION_DEFAULT=ON');
console.log('NATIVE_TOKEN_TO_APPS_SCRIPT=NO');
console.log('MULTIPLEXED_POLICY=ACTION_PLUS_OP');
console.log('HYBRID_ORDER_FALLBACK_USES_BRIDGE=YES');
console.log('PRODUCTION_ENABLEMENT=YES');

