import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  canonicalLegacyPayloadV1,
  legacyPayloadDigestV1,
  employeeLegacyBridgeEnabled,
  employeeLegacyBridgeActionAllowed,
  createEmployeeLegacyBridgeAssertionV1,
  isEmployeeLegacyBridgePath
} from '../cloudflare-d1/src/employee-legacy-bridge-v1.mjs';

const env = {
  TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED: 'true',
  EMPLOYEE_LEGACY_BRIDGE_ACTIONS: 'getRows,getDashboard,updateLine,pressControlV1:status,attendanceV1:state',
  EMPLOYEE_LEGACY_BRIDGE_ASSERTION_TTL_SECONDS: '45',
  EMPLOYEE_LEGACY_BRIDGE_SECRET_V1: '0123456789abcdef0123456789abcdef0123456789abcdef'
};

assert.equal(employeeLegacyBridgeEnabled(env), true);
assert.equal(employeeLegacyBridgeEnabled({ TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED: 'false' }), false);
assert.equal(isEmployeeLegacyBridgePath('/v1/employee/legacy-action'), true);
assert.equal(isEmployeeLegacyBridgePath('/v1/employee/legacy-action/health'), true);
assert.equal(isEmployeeLegacyBridgePath('/v1/employee/auth/login'), false);

assert.equal(employeeLegacyBridgeActionAllowed('getRows', env), true);
assert.equal(employeeLegacyBridgeActionAllowed('updateLine', env), true);
assert.equal(employeeLegacyBridgeActionAllowed('pressControlV1', env, { op: 'status' }), true);
assert.equal(employeeLegacyBridgeActionAllowed('pressControlV1', env, { op: 'start' }), false);
assert.equal(employeeLegacyBridgeActionAllowed('pressControlV1', { ...env, EMPLOYEE_LEGACY_BRIDGE_ACTIONS: 'pressControlV1' }, { op: 'status' }), false);
assert.equal(employeeLegacyBridgeActionAllowed('attendanceV1', env, { op: 'state' }), true);
assert.equal(employeeLegacyBridgeActionAllowed('attendanceV1', env, { op: 'start' }), false);
assert.equal(employeeLegacyBridgeActionAllowed('login', env), false);
assert.equal(employeeLegacyBridgeActionAllowed('changePassword', env), false);
assert.equal(employeeLegacyBridgeActionAllowed('cloudEmployeeLegacyBridgeExecuteV1', env), false);
assert.equal(employeeLegacyBridgeActionAllowed('unknownAction', env), false);

const a = { z: 1, a: { y: 2, x: ['b', 'a'] } };
const b = { a: { x: ['b', 'a'], y: 2 }, z: 1 };
assert.equal(canonicalLegacyPayloadV1(a), canonicalLegacyPayloadV1(b));
assert.equal(await legacyPayloadDigestV1(a), await legacyPayloadDigestV1(b));

const target = {
  action: 'getRows',
  username: 'tester',
  screen: 'print',
  page: 1
};
const changed = { ...target, page: 2 };
assert.notEqual(await legacyPayloadDigestV1(target), await legacyPayloadDigestV1(changed));

const assertion = await createEmployeeLegacyBridgeAssertionV1(
  {
    username: 'tester',
    role: 'print',
    department: 'طباعة',
    screens: ['print'],
    mustChange: false,
    active: true
  },
  'getRows',
  target,
  env,
  1700000000
);
assert.match(assertion.token, /^cfv1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
assert.equal(assertion.claims.sub, 'tester');
assert.equal(assertion.claims.action, 'getRows');
assert.equal(assertion.claims.bodyDigest, await legacyPayloadDigestV1(target));
assert.equal(assertion.claims.iat, 1700000000);
assert.equal(assertion.claims.exp, 1700000045);
assert.ok(assertion.claims.nonce);
assert.equal(assertion.claims.mustChange, false);

const bridgeSource = fs.readFileSync('cloudflare-d1/src/employee-legacy-bridge-v1.mjs', 'utf8');
assert.match(bridgeSource, /UPSTREAM_WRAPPER_ACTION = 'cloudEmployeeLegacyBridgeExecuteV1'/);
assert.match(bridgeSource, /assertionBoundToAction: true/);
assert.match(bridgeSource, /assertionBoundToPayload: true/);
assert.match(bridgeSource, /replayNonceIssued: true/);
assert.match(bridgeSource, /targetPayload/);
assert.doesNotMatch(bridgeSource, /forwarded\.token\s*=\s*credentials\.token/);
assert.doesNotMatch(bridgeSource, /forwarded\.password\s*=/);

const code = fs.readFileSync('Code.gs', 'utf8');
assert.match(code, /trendosVerifyEmployeeLegacyBridgeAssertionV1_/);
assert.match(code, /trendosConsumeEmployeeLegacyBridgeNonceV1_/);
assert.match(code, /trendosEmployeeLegacyPayloadDigestV1_/);
assert.match(code, /earlyAction === "cloudEmployeeLegacyBridgeExecuteV1"/);
assert.match(code, /TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_/);
assert.match(code, /delete forwarded\.token/);
assert.match(code, /claims\.bodyDigest/);
assert.match(code, /normalize_\(claims\.action\) !== targetAction/);
assert.match(code, /CacheService\.getScriptCache\(\)/);
assert.match(code, /LockService\.getScriptLock\(\)/);

const directAuthStart = code.indexOf('function authorize_(username, token)');
const directAuthEnd = code.indexOf('function logoutEmployee_(e)', directAuthStart);
const directAuth = code.slice(directAuthStart, directAuthEnd);
assert.doesNotMatch(directAuth, /cfv1\./);
assert.match(directAuth, /TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_/);
assert.match(directAuth, /findUser_/);

const wrangler = fs.readFileSync('cloudflare-d1/wrangler.toml', 'utf8');
assert.match(wrangler, /TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"/);
assert.match(wrangler, /EMPLOYEE_LEGACY_BRIDGE_ACTIONS = ""/);
assert.match(wrangler, /EMPLOYEE_LEGACY_BRIDGE_ASSERTION_TTL_SECONDS = "45"/);
assert.doesNotMatch(wrangler, /EMPLOYEE_LEGACY_BRIDGE_SECRET_V1\s*=/);

console.log('A61_LEGACY_AUTH_BRIDGE_CONTRACT=PASS');
console.log('ASSERTION_ACTION_BOUND=YES');
console.log('ASSERTION_PAYLOAD_BOUND=YES');
console.log('ASSERTION_REPLAY_GUARD=YES');
console.log('MULTIPLEXED_ACTION_POLICY=ACTION_PLUS_OP');
console.log('RAW_NATIVE_TOKEN_FORWARDED=NO');
console.log('PLAINTEXT_PASSWORD_FORWARDED=NO');
console.log('PRODUCTION_ENABLE=NO');
