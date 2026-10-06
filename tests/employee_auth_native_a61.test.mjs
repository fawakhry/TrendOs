import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  hashEmployeePasswordV1,
  verifyEmployeePasswordV1,
  isEmployeeNativeAuthPath,
  employeeAuthEnabled,
  employeeAuthLegacyBootstrapEnabled,
  employeeAuthNativeOnlyEnabled,
  employeeAuthLegacySessionEnrollEnabled
} from '../cloudflare-d1/src/employee-auth-native-v1.mjs';

const password = 'A61-test-password-123';
const first = await hashEmployeePasswordV1(password, { iterations: 100000 });
const second = await hashEmployeePasswordV1(password, { iterations: 100000 });

assert.equal(first.scheme, 'pbkdf2-sha256-v1');
assert.equal(first.iterations, 100000);
const clamped = await hashEmployeePasswordV1(password, { iterations: 180000 });
assert.equal(clamped.iterations, 100000);
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
  '/v1/employee/auth/health',
  '/v1/employee/auth/enroll-legacy-session'
]) assert.equal(isEmployeeNativeAuthPath(path), true);
assert.equal(isEmployeeNativeAuthPath('/v1/t12/orders/create'), false);

const disabledEnv = {
  TRENDOS_EMPLOYEE_AUTH_V1_ENABLED: 'false',
  TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED: 'false',
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'false',
  TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED: 'false'
};
assert.equal(employeeAuthEnabled(disabledEnv), false);
assert.equal(employeeAuthLegacyBootstrapEnabled(disabledEnv), false);
assert.equal(employeeAuthNativeOnlyEnabled(disabledEnv), false);
assert.equal(employeeAuthLegacySessionEnrollEnabled(disabledEnv), false);

const migration = fs.readFileSync('cloudflare-d1/migrations/0009_employee_auth_native_v1.sql', 'utf8');
assert.match(migration, /T12_EMPLOYEE_AUTH_V1/);
assert.match(migration, /mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration, /employee_auth_users_v1/);
assert.match(migration, /employee_auth_sessions_v1/);
assert.doesNotMatch(migration, /plaintext_password|raw_password|AUTH_PASSWORD_PEPPER/i);

const moduleSource = fs.readFileSync('cloudflare-d1/src/employee-auth-native-v1.mjs', 'utf8');
assert.match(moduleSource, /legacySessionEnrollEnabled: employeeAuthLegacySessionEnrollEnabled\(env\)/);
assert.match(moduleSource, /enrollCanaryUserConfigured/);
assert.match(moduleSource, /pbkdf2-sha256-v1/);
assert.match(moduleSource, /const DEFAULT_ITERATIONS = 100000/);
assert.match(moduleSource, /const MAX_ITERATIONS = 100000/);
assert.match(moduleSource, /TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED/);
assert.match(moduleSource, /LEGACY_BOOTSTRAP_TIMEOUT_MS = 90000/);
assert.match(moduleSource, /LEGACY_BOOTSTRAP_TRANSIENT_RETRY_MS = 1500/);
assert.match(moduleSource, /response\.status === 404/);
assert.match(moduleSource, /response\.status >= 500/);
assert.match(moduleSource, /attempt === 1/);
assert.match(moduleSource, /LEGACY_SESSION_VERIFY_TIMEOUT_MS = 90000/);
assert.match(moduleSource, /raw = await response\.text\(\)/);
assert.match(moduleSource, /Legacy login bootstrap timed out/);
assert.match(moduleSource, /Legacy login bootstrap request failed/);
assert.match(moduleSource, /employee\/auth\/enroll-legacy-session/);
assert.match(moduleSource, /TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED/);
assert.match(moduleSource, /EMPLOYEE_AUTH_ENROLL_CANARY_USER/);
assert.match(moduleSource, /EMPLOYEE_AUTH_ENROLL_NONCE/);
assert.match(moduleSource, /enrollNonce\.length < 32/);
assert.match(moduleSource, /if \(expectedNonce && !constantTimeEqual\(enrollNonce, expectedNonce\)\)/);
assert.match(moduleSource, /verifyEmployeeSession/);
assert.match(moduleSource, /d1-native-legacy-session-enroll-v1/);
assert.match(moduleSource, /employee-auth-enrollment-upsert-failed/);
assert.match(moduleSource, /employee-auth-login-bootstrap-upsert-failed/);
assert.match(moduleSource, /stage: text\(err && err\.employeeAuthStage\) \|\| 'unknown'/);
assert.match(moduleSource, /employeeAuthStage = 'password-hash'/);
assert.match(moduleSource, /employeeAuthStage = 'd1-user-upsert'/);
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
assert.match(wrangler, /TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "false"/);
assert.match(wrangler, /EMPLOYEE_AUTH_ENROLL_CANARY_USER = ""/);
assert.match(wrangler, /EMPLOYEE_AUTH_ENROLL_NONCE = ""/);

console.log('A61_NATIVE_AUTH_FOUNDATION=PASS');
console.log('PLAINTEXT_PASSWORD_STORED=NO');
console.log('LEGACY_AUTH_FALLBACK_DEFAULT=OFF');
console.log('PRODUCTION_CUTOVER=NO');
