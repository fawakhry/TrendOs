import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const config = fs.readFileSync('config.js','utf8');

assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS = \[\]/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES = 69/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);

const fetchCalls = [];
const legacyCalls = [];
let healthReady = false;

const baseLegacy = async function(action, params) {
  legacyCalls.push({ action, params: { ...(params || {}) } });
  return { success: true, source: 'legacy', action };
};

const windowObject = {
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS: [],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES: 2,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES: [],
  MATBAGY_EMPLOYEE_API_URL: 'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL: 'https://trendos-d1-api.example.test',
  trendosSecureApiV1922: baseLegacy
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const sandbox = {
  window: windowObject,
  console,
  URL,
  Set,
  Map,
  JSON,
  Error,
  Number,
  Date,
  Promise,
  AbortController,
  TextEncoder,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Response,
  fetch: async function(url, options = {}) {
    const call = { url: String(url), options };
    fetchCalls.push(call);

    if (call.url.endsWith('/v1/employee/auth/health')) {
      return jsonResponse(healthReady ? {
        success: true,
        schemaReady: true,
        mode: 'TRANSITIONAL',
        envEnabled: true,
        legacyBootstrapEnabled: true,
        legacySessionEnrollEnabled: false,
        nativeOnly: false,
        nativeReadyCount: 0,
        plaintextStored: false
      } : {
        success: true,
        schemaReady: true,
        mode: 'OFF',
        envEnabled: false,
        legacyBootstrapEnabled: false,
        nativeOnly: false,
        nativeReadyCount: 0,
        plaintextStored: false
      });
    }

    if (call.url.endsWith('/v1/employee/legacy-action/health')) {
      return jsonResponse(healthReady ? {
        success: true,
        enabled: true,
        upstreamConfigured: true,
        secretConfigured: true,
        allowedPolicyCount: 2,
        rawNativeTokenForwarded: false,
        plaintextPasswordForwarded: false,
        assertionBoundToAction: true,
        assertionBoundToPayload: true,
        replayNonceIssued: true,
        authAuthority: 'd1-native-employee-v1'
      } : {
        success: true,
        enabled: false,
        upstreamConfigured: true,
        secretConfigured: false,
        allowedPolicyCount: 0,
        rawNativeTokenForwarded: false,
        plaintextPasswordForwarded: false,
        assertionBoundToAction: true,
        assertionBoundToPayload: true,
        replayNonceIssued: true
      });
    }

    if (call.url.endsWith('/v1/employee/auth/login')) {
      const body = JSON.parse(options.body || '{}');
      return jsonResponse({
        success: true,
        user: {
          username: body.username,
          name: body.username,
          role: 'service',
          department: 'service',
          token: 'native-token'
        },
        authSource: 'd1-native-bootstrap-v1'
      });
    }

    if (call.url.endsWith('/v1/employee/auth/session')) {
      return jsonResponse({
        success: true,
        user: { username: 'pilot', name: 'pilot', role: 'service', token: 'native-token' },
        authSource: 'd1-native-employee-v1'
      });
    }

    if (call.url.endsWith('/v1/employee/auth/logout')) {
      return jsonResponse({ success: true });
    }

    if (call.url.endsWith('/v1/employee/auth/password/change')) {
      return jsonResponse({ success: true, forceRelogin: true });
    }

    if (call.url.endsWith('/v1/employee/legacy-action')) {
      return jsonResponse({ success: true, source: 'bridge' });
    }

    return jsonResponse({ success: false, code: 'unexpected-test-route' }, 500);
  }
};

vm.runInNewContext(source, sandbox, { filename: 'employee-api-dispatcher-v1.js' });

assert.ok(windowObject.TrendOSEmployeeApiDispatcherV1);
assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.canaryConfigEnabled(), false);

// Default-OFF means exact legacy behavior and zero Cloud canary probes.
let result = await windowObject.trendosEmployeeApiV1('login', {
  username: 'pilot',
  password: 'legacy-pass'
});
assert.equal(result.source, 'legacy');
assert.equal(legacyCalls.length, 1);
assert.equal(fetchCalls.length, 0);

// Canary selected but frontend bridge gate is still OFF: fail before any Cloud POST,
// and never fall back to legacy.
windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 = true;
windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS = ['PiLoT'];
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('login', { username: 'pilot', password: 'secret-pass' }),
  err => err && err.code === 'EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED' && err.detail === 'frontend-bridge-disabled'
);
assert.equal(fetchCalls.length, 0);
assert.equal(legacyCalls.length, 1);

// Frontend config is armed but runtime health is not ready: read-only probes happen,
// native login POST does not, and there is still no legacy fallback.
windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = true;
windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = ['getDashboard','pressControlV1:status'];
healthReady = false;
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('login', { username: 'PILOT', password: 'secret-pass' }),
  err => err && err.code === 'EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED'
);
assert.equal(fetchCalls.filter(x => x.options.method === 'GET').length, 2);
assert.equal(fetchCalls.some(x => x.url.endsWith('/v1/employee/auth/login')), false);
assert.equal(legacyCalls.length, 1);

// Once both read-only health gates are ready, the same case-insensitive canary
// uses D1 Native Auth. Password is sent only to the native login endpoint.
healthReady = true;
result = await windowObject.trendosEmployeeApiV1('login', {
  username: 'PILOT',
  password: 'secret-pass'
});
assert.equal(result.success, true);
assert.equal(result.authSource, 'd1-native-bootstrap-v1');
const loginCall = fetchCalls.filter(x => x.url.endsWith('/v1/employee/auth/login')).at(-1);
assert.ok(loginCall);
assert.equal(loginCall.options.method, 'POST');
assert.match(loginCall.options.body, /"password":"secret-pass"/);

// After the successful canary login, bridged employee business actions use the
// remembered canary identity if a module omits username. Native token is bearer-only
// to Cloudflare; token/password are stripped from the bridge body.
result = await windowObject.trendosEmployeeApiV1('getDashboard', {
  token: 'native-token',
  password: 'must-not-forward'
});
assert.equal(result.source, 'bridge');
const bridgeCall = fetchCalls.filter(x => x.url.endsWith('/v1/employee/legacy-action')).at(-1);
assert.ok(bridgeCall);
assert.equal(bridgeCall.options.headers.authorization, 'Bearer native-token');
const bridgeBody = JSON.parse(bridgeCall.options.body);
assert.equal(bridgeBody.username, 'pilot');
assert.equal(bridgeBody.action, 'getDashboard');
assert.equal(Object.prototype.hasOwnProperty.call(bridgeBody,'token'), false);
assert.equal(Object.prototype.hasOwnProperty.call(bridgeBody,'password'), false);

// A different employee stays on the exact legacy path even while canary mode is on.
result = await windowObject.trendosEmployeeApiV1('login', {
  username: 'other-user',
  password: 'legacy-pass-2'
});
assert.equal(result.source, 'legacy');
assert.equal(legacyCalls.at(-1).action, 'login');
assert.equal(legacyCalls.at(-1).params.username, 'other-user');

// Policy remains exact and fail-closed for a selected canary.
await assert.rejects(
  () => windowObject.trendosEmployeeApiV1('pressControlV1', {
    username: 'pilot',
    token: 'native-token',
    op: 'start'
  }),
  err => err && err.code === 'EMPLOYEE_LEGACY_POLICY_DENIED'
);

// Logout remains available even if the bridge health degrades after login and
// clears the remembered canary identity.
healthReady = false;
result = await windowObject.trendosEmployeeApiV1('logout', {
  username: 'pilot',
  token: 'native-token'
});
assert.equal(result.success, true);
assert.ok(fetchCalls.some(x => x.url.endsWith('/v1/employee/auth/logout')));

console.log('ENTRY611_NATIVE_AUTH_CANARY=PASS');
console.log('ENTRY611_DEFAULT_OFF_PRESERVES_LEGACY=YES');
console.log('ENTRY611_NON_CANARY_PRESERVES_LEGACY=YES');
console.log('ENTRY611_CANARY_PREFLIGHT_FAIL_CLOSED=YES');
console.log('ENTRY611_CANARY_LOGIN_TO_D1=YES');
console.log('ENTRY611_CANARY_BRIDGE_BEARER_ONLY=YES');
console.log('ENTRY611_PLAINTEXT_TO_BRIDGE=NO');
console.log('ENTRY611_PRODUCTION_ENABLEMENT=NO');
