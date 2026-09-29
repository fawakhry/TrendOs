import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  hashEmployeePasswordV1,
  verifyEmployeePasswordV1,
  isEmployeeNativeAuthPath,
  employeeAuthEnabled,
  employeeAuthLegacyBootstrapEnabled,
  employeeAuthNativeOnlyEnabled
} from '../cloudflare-d1/src/employee-auth-native-v1.mjs';

const password = 'A61-test-password-123';
const first = await hashEmployeePasswordV1(password, { iterations: 100000 });
const second = await hashEmployeePasswordV1(password, { iterations: 100000 });

assert.equal(first.scheme, 'pbkdf2-sha256-v1');
assert.equal(first.iterations, 100000);
assert.equal(first.saltHex.length, 32);
assert.equal(first.hashHex.length, 64);
assert.notEqual(first.saltHex, second.saltHex);
assert.notEqual(first.hashHex, second.hashHex);
assert.equal(await verifyEmployeePasswordV1(password, {
  passwordScheme: first.scheme,
  passwordIterations: first.iterations,
  passwordSaltHex: first.saltHex,
  passwordHashHex: first.hashHex
}), true);
assert.equal(await verifyEmployeePasswordV1('wrong-password', {
  passwordScheme: first.scheme,
  passwordIterations: first.iterations,
  passwordSaltHex: first.saltHex,
  passwordHashHex: first.hashHex
}), false);

for (const path of [
  '/v1/employee/auth/login',
  '/v1/employee/auth/session',
  '/v1/employee/auth/logout',
  '/v1/employee/auth/password/change',
  '/v1/employee/auth/health'
]) assert.equal(isEmployeeNativeAuthPath(path), true);
assert.equal(isEmployeeNativeAuthPath('/v1/t12/orders/create'), false);

const disabledEnv = {
  TRENDOS_EMPLOYEE_AUTH_V1_ENABLED: 'false',
  TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED: 'false',
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'false'
};
assert.equal(employeeAuthEnabled(disabledEnv), false);
assert.equal(employeeAuthLegacyBootstrapEnabled(disabledEnv), false);
assert.equal(employeeAuthNativeOnlyEnabled(disabledEnv), false);

const migration = fs.readFileSync('cloudflare-d1/migrations/0009_employee_auth_native_v1.sql', 'utf8');
assert.match(migration, /T12_EMPLOYEE_AUTH_V1/);
assert.match(migration, /mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration, /employee_auth_users_v1/);
assert.match(migration, /employee_auth_sessions_v1/);
assert.doesNotMatch(migration, /plaintext_password|raw_password|AUTH_PASSWORD_PEPPER/i);

const moduleSource = fs.readFileSync('cloudflare-d1/src/employee-auth-native-v1.mjs', 'utf8');
assert.match(moduleSource, /pbkdf2-sha256-v1/);
assert.match(moduleSource, /TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED/);
assert.doesNotMatch(moduleSource, /AUTH_PASSWORD_PEPPER/);
assert.doesNotMatch(moduleSource, /console\.log\([^\n]*password/i);

const bridge = fs.readFileSync('cloudflare-d1/src/cloud-session-bridge-v3.mjs', 'utf8');
const nativeAt = bridge.indexOf('verifyNativeEmployeeSession');
const upstreamAt = bridge.indexOf('verifyEmployeeSessionViaPost(username, employeeToken, env, lane)');
assert.ok(nativeAt >= 0);
assert.ok(upstreamAt >= 0);
assert.ok(nativeAt < upstreamAt);
assert.match(bridge, /employeeAuthNativeOnlyEnabled\(env\)/);

const router = fs.readFileSync('cloudflare-d1/src/index_v2.js', 'utf8');
assert.match(router, /handleEmployeeNativeAuthRequest/);
assert.match(router, /isEmployeeNativeAuthPath/);

const wrangler = fs.readFileSync('cloudflare-d1/wrangler.toml', 'utf8');
assert.match(wrangler, /TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"/);
assert.match(wrangler, /TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED = "false"/);
assert.match(wrangler, /TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"/);

console.log('A61_NATIVE_AUTH_FOUNDATION=PASS');
console.log('PLAINTEXT_PASSWORD_STORED=NO');
console.log('LEGACY_AUTH_FALLBACK_DEFAULT=OFF');
console.log('PRODUCTION_CUTOVER=NO');
