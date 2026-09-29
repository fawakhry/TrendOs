import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync('Code.gs','utf8');

const required = [
  'var TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_ = null;',
  'function trendosEmployeeLegacyBridgeEnabledV1_()',
  'function trendosEmployeeLegacyBridgeSecretV1_()',
  'function trendosEmployeeLegacyBridgeHmacV1_(',
  'function trendosEmployeeLegacyPayloadDigestV1_(',
  'function trendosEmployeeLegacyBridgeForbiddenActionV1_(',
  'function trendosConsumeEmployeeLegacyBridgeNonceV1_(',
  'function trendosVerifyEmployeeLegacyBridgeAssertionV1_(',
  'function trendosCloudEmployeeLegacyBridgeExecuteV1_(',
  'earlyAction === "cloudEmployeeLegacyBridgeExecuteV1"',
  'CacheService.getScriptCache()',
  'LockService.getScriptLock()',
  'claims.bodyDigest',
  'normalize_(claims.action) !== targetAction',
  'delete forwarded.token'
];
for (const needle of required) assert.ok(code.includes(needle), 'missing: '+needle);

for (const needle of [
  'action === "login"',
  'action === "logout"',
  'action === "verifyEmployeeSession"',
  'action === "changePassword"',
  'action === "customerLogin"',
  'action === "customerLogout"',
  'action === "changeCustomerPassword"',
  'action === "cloudEmployeeLegacyBridgeExecuteV1"'
]) assert.ok(code.includes(needle), 'missing forbidden action: '+needle);

const a0 = code.indexOf('function authorize_(username, token)');
const a1 = code.indexOf('function logoutEmployee_(e)', a0);
assert.ok(a0 >= 0 && a1 > a0);
const authorizeBody = code.slice(a0,a1);
assert.doesNotMatch(authorizeBody,/cfv1\./);
assert.match(authorizeBody,/TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_/);
assert.match(authorizeBody,/findUser_/);
assert.match(authorizeBody,/constantTimeEqualsV1922_/);

assert.match(code,/getProperty\("EMPLOYEE_LEGACY_BRIDGE_SECRET_V1"\)/);
assert.match(code,/getProperty\("TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED"\)/);
assert.match(code,/iat < now - 120/);
assert.match(code,/exp > now \+ 120/);
assert.match(code,/trendosConsumeEmployeeLegacyBridgeNonceV1_\(claims\.nonce, exp\)/);
assert.match(code,/delete forwarded\.token;/);
assert.match(code,/__returnRawV1922: true/);

console.log('A61_APPS_SCRIPT_BRIDGE_MAIN_CONTRACT=PASS');
console.log('ASSERTION_NORMAL_TOKEN_ACCEPTANCE=NO');
console.log('ASSERTION_ACTION_BOUND=YES');
console.log('ASSERTION_PAYLOAD_BOUND=YES');
console.log('ASSERTION_REPLAY_GUARD=YES');
console.log('PRODUCTION_ENABLEMENT=NO');
