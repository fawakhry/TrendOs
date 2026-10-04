import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('docs/trendos/staging/ENTRY622_TRENDOS_BRIDGE_READONLY_POLICIES.json','utf8'));
assert.equal(manifest.entry,'Entry622');
assert.equal(manifest.bridgeEnabled,false);
assert.equal(manifest.authEnabled,false);
assert.equal(manifest.accountingProgram,'DEFERRED_EXTERNAL_REPO');
assert.equal(manifest.policyCount,17);
assert.equal(manifest.policies.length,17);
assert.equal(new Set(manifest.policies).size,17);

const forbidden = new Set([
  'getAccounting',
  'getDeptInvoiceDraftV1887',
  'getPartyAccountV1858',
  'attendanceV1:state',
  'attendanceV1:config',
  'hrV1:myRequests',
  'hrV1:requests',
  'hrV1:employees',
  'pressControlV1:status'
]);
for (const p of manifest.policies) assert.equal(forbidden.has(p),false,'forbidden/stale policy '+p);

const dispatcher = fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
assert.match(dispatcher,/MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE/);
assert.match(dispatcher,/shouldRouteOpsNative/);
assert.match(dispatcher,/ACCOUNTING_READ_ACTIONS/);

console.log('ENTRY622_POLICY_MANIFEST=PASS');
console.log('ENTRY622_POLICY_COUNT=17');
console.log('ENTRY622_ACCOUNTING_POLICIES_EXCLUDED=YES');
console.log('ENTRY622_OPS_NATIVE_POLICIES_EXCLUDED=YES');
