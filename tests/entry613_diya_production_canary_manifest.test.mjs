import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY613_DIYA_PRODUCTION_CANARY_MANIFEST.json','utf8'));
const config = fs.readFileSync('config.js','utf8');
const inventory = fs.readFileSync('tests/entry609_native_auth_cutover_inventory.test.mjs','utf8');

assert.equal(manifest.entry, 613);
assert.equal(manifest.canaryUsername, 'ضياء');
assert.equal(manifest.globalNativeAuth, false);
assert.equal(manifest.nativeOnly, false);
assert.equal(manifest.authModeTarget, 'TRANSITIONAL');
assert.equal(manifest.legacyBootstrapTarget, true);
assert.equal(manifest.bridgeTarget, true);
assert.equal(manifest.bridgePolicyCount, 69);
assert.equal(manifest.policies.length, 69);
assert.equal(new Set(manifest.policies).size, 69);

const forbidden = new Set([
  'login','logout','verifyEmployeeSession','changePassword',
  'customerLogin','customerLogout','changeCustomerPassword',
  'cloudEmployeeLegacyBridgeExecuteV1',
  'ensureDemoCustomer','initAccounting','recalculateAccountingMaterials',
  'getRowsPageV1931'
]);
for (const p of manifest.policies) {
  const top = String(p).split(':')[0];
  assert.equal(forbidden.has(top), false, 'forbidden policy in Entry613 manifest: '+p);
}

for (const required of [
  'getDashboard',
  'getRows',
  'attendanceV1:state',
  'attendanceClockinV1:clockin',
  'cleaningV1:complete',
  'customerManagerV1:inbox',
  'goLiveAutopilotV1:listDrafts',
  'hrV1:myRequests',
  'pressControlV1:status',
  'updateLine',
  'markCustomerNotified'
]) assert.ok(manifest.policies.includes(required), 'required policy missing: '+required);

assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS = \[\]/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = \[\]/);

assert.match(inventory,/ENTRY609_FULL_ACTIVE_PARITY_POLICY_COUNT=69/);
assert.match(inventory,/ENTRY609_READONLY_PILOT_POLICY_COUNT=27/);

console.log('ENTRY613_CANARY_MANIFEST=PASS');
console.log('ENTRY613_CANARY_USERNAME=ضياء');
console.log('ENTRY613_POLICY_COUNT=69');
console.log('ENTRY613_GLOBAL_NATIVE_AUTH=NO');
console.log('ENTRY613_REPO_DEFAULT_OFF=YES');
