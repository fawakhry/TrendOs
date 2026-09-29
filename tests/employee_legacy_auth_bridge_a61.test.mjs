import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createEmployeeLegacyBridgeAssertionV1,
  employeeLegacyBridgeEnabled,
  employeeLegacyBridgeActionAllowed,
  isEmployeeLegacyBridgePath
} from '../cloudflare-d1/src/employee-legacy-bridge-v1.mjs';

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64');
}

const env = {
  TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED: 'true',
  EMPLOYEE_LEGACY_BRIDGE_SECRET_V1: 'A'.repeat(48),
  EMPLOYEE_LEGACY_BRIDGE_ACTIONS: 'getRows,getDashboard,updateLine',
  EMPLOYEE_LEGACY_BRIDGE_ASSERTION_TTL_SECONDS: '45'
};

assert.equal(isEmployeeLegacyBridgePath('/v1/employee/legacy-action'), true);
assert.equal(isEmployeeLegacyBridgePath('/v1/employee/legacy-action/health'), true);
assert.equal(isEmployeeLegacyBridgePath('/v1/employee/auth/login'), false);

assert.equal(employeeLegacyBridgeEnabled(env), true);
assert.equal(employeeLegacyBridgeEnabled({}), false);
assert.equal(employeeLegacyBridgeActionAllowed('getRows', env), true);
assert.equal(employeeLegacyBridgeActionAllowed('getDashboard', env), true);
assert.equal(employeeLegacyBridgeActionAllowed('login', env), false);
assert.equal(employeeLegacyBridgeActionAllowed('changePassword', env), false);
assert.equal(employeeLegacyBridgeActionAllowed('unknownAction', env), false);

const issued = await createEmployeeLegacyBridgeAssertionV1({
  username: 'wael',
  role: 'print',
  department: 'طباعة',
  screens: ['print'],
  mustChange: false,
  active: true
}, 'getRows', env, 1000);

assert.match(issued.token, /^cfv1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
const parts = issued.token.split('.');
assert.equal(parts.length, 3);
const claims = JSON.parse(decodeBase64Url(parts[1]).toString('utf8'));
assert.equal(claims.v, 1);
assert.equal(claims.sub, 'wael');
assert.equal(claims.role, 'print');
assert.equal(claims.department, 'طباعة');
assert.deepEqual(claims.screens, ['print']);
assert.equal(claims.action, 'getRows');
assert.equal(claims.iat, 1000);
assert.equal(claims.exp, 1045);
assert.equal(claims.active, true);
assert.equal(claims.mustChange, false);
assert.ok(claims.nonce);

const bridgeSource = fs.readFileSync('cloudflare-d1/src/employee-legacy-bridge-v1.mjs', 'utf8');
assert.match(bridgeSource, /verifyNativeEmployeeSession/);
assert.match(bridgeSource, /delete forwarded\.password/);
assert.match(bridgeSource, /delete forwarded\.oldPassword/);
assert.match(bridgeSource, /delete forwarded\.newPassword/);
assert.match(bridgeSource, /forwarded\.token = assertion\.token/);
assert.doesNotMatch(bridgeSource, /console\.log\(/);

const code = fs.readFileSync('Code.gs', 'utf8');
assert.match(code, /trendosVerifyEmployeeLegacyBridgeTokenV1_/);
assert.match(code, /cloudflare-d1-native-v1/);
assert.match(code, /PropertiesService\.getScriptProperties\(\)\.getProperty\("EMPLOYEE_LEGACY_BRIDGE_SECRET_V1"\)/);
assert.match(code, /PropertiesService\.getScriptProperties\(\)\.getProperty\("TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED"\)/);

const authorizeAt = code.indexOf('function authorize_(username, token)');
const bridgeAt = code.indexOf('trendosVerifyEmployeeLegacyBridgeTokenV1_(username, token)', authorizeAt);
const sheetAt = code.indexOf('const user = findUser_(normalize_(username));', authorizeAt);
assert.ok(authorizeAt >= 0);
assert.ok(bridgeAt > authorizeAt);
assert.ok(sheetAt > bridgeAt);

const router = fs.readFileSync('cloudflare-d1/src/index_v2.js', 'utf8');
assert.match(router, /handleEmployeeLegacyBridgeRequest/);
assert.match(router, /isEmployeeLegacyBridgePath/);

const wrangler = fs.readFileSync('cloudflare-d1/wrangler.toml', 'utf8');
assert.doesNotMatch(wrangler, /^TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED\s*=\s*"true"/m);
assert.doesNotMatch(wrangler, /^EMPLOYEE_LEGACY_BRIDGE_SECRET_V1\s*=/m);

console.log('A61_LEGACY_AUTH_BRIDGE_FOUNDATION=PASS');
console.log('AUTH_AUTHORITY=D1_NATIVE');
console.log('RAW_NATIVE_TOKEN_FORWARDED=NO');
console.log('PLAINTEXT_PASSWORD_FORWARDED=NO');
console.log('BRIDGE_PRODUCTION_ENABLED=NO');

// CI boundary check uses repository config only.
