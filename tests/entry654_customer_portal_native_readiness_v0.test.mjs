import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  inspectCustomerPortalNativeReadinessV0,
  LEGACY_CUSTOMER_PORTAL_ACTIONS_V0
} from '../cloudflare-d1/src/customer-portal-native-readiness-v0.mjs';

const exactlyNine = [
  'customerLogin', 'customerLogout', 'changeCustomerPassword',
  'getCustomerOrders', 'getCustomerPortalAccountsV1859',
  'createCustomerDraft', 'addCustomerDraftItem', 'submitCustomerDraft',
  'uploadCustomerDraftFile'
];
assert.deepEqual([...LEGACY_CUSTOMER_PORTAL_ACTIONS_V0], exactlyNine);
const original = fs.readFileSync('cloudflare-d1/src/legacy-browser-transport-v1.mjs', 'utf8');
const listBlock = original.match(/const LEGACY_CUSTOMER_SESSION_ACTIONS = new Set\(\[([\s\S]*?)\]\)/);
assert.ok(listBlock, 'must inventory original exact customer allowlist');
for (const action of exactlyNine) assert.match(listBlock[1], new RegExp("'"+action+"'"));
const source = fs.readFileSync('cloudflare-d1/src/customer-portal-native-readiness-v0.mjs','utf8');
assert.doesNotMatch(source, /\bfetch\s*\(|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+/i);
console.log('ENTRY654_EXACT_NINE_CUSTOMER_ACTIONS_INVENTORIED=PASS');

const calls = [];
const mock = (rows, errorAt = '') => ({
  prepare(sql) {
    const q=String(sql).trim();
    assert.match(q, /^SELECT\s+/i, 'forbid any SQL mutation');
    calls.push(q);
    if (errorAt && q.includes(errorAt)) throw new Error('private-db-details-MUST-NOT-LEAK');
    const key =
      q.includes('FROM customer_portal_native_control_v1') ? 'control' :
      q.includes('FROM t12_customers WHERE') ? 'customers' :
      q.includes('HAVING COUNT(*) > 1') ? 'duplicates' :
      q.includes('LEFT JOIN t12_customers') ? 'bindings' :
      q.includes('FROM customer_portal_native_accounts_v1') ? 'accounts' :
      q.includes('FROM customer_portal_native_sessions_v1') ? 'sessions' : '';
    assert.ok(key, 'unexpected SELECT');
    return { first: async () => rows[key] };
  }
});
const rows = {
  control: {marker:'ENTRY654_CUSTOMER_PORTAL_NATIVE_V1',mode:'OFF'},
  customers: {activeCustomerCount:3,missingPortalCodeCount:1},
  duplicates: {duplicatePortalCodeGroupCount:1},
  bindings: {mismatchedAccountBindingCount:2},
  accounts: {provisionedAccountCount:0,activeCredentialCount:0},
  sessions: {customerSessionCount:0}
};
const empty = await inspectCustomerPortalNativeReadinessV0(null);
assert.equal(empty.success,false);
assert.equal(empty.reason,'DB_UNAVAILABLE');
assert.equal(empty.activeCustomerCount,null);
assert.equal(empty.productionRelease,'NO_GO');

const report=await inspectCustomerPortalNativeReadinessV0(mock(rows));
assert.equal(report.success,true);
assert.equal(report.reason,'SOURCE_ONLY_NOT_RUNTIME_QUALIFIED');
assert.equal(report.controlMode,'OFF');
assert.equal(report.legacyCustomerActionCount,9);
assert.equal(report.activeCustomerCount,3);
assert.equal(report.missingPortalCodeCount,1);
assert.equal(report.duplicatePortalCodeGroupCount,1);
assert.equal(report.mismatchedAccountBindingCount,2);
assert.equal(report.provisionedAccountCount,0);
assert.equal(report.customerSessionCount,0);
assert.equal(report.productionRelease,'NO_GO');
assert.equal(report.customerFinanceRuntimeReady,false);
assert.equal(report.zeroGoogleComplete,false);
assert.equal(calls.length,6);
assert.doesNotMatch(JSON.stringify(report), /FAKE-CUSTOMER-001|FAKE-TOKEN|private-db-details/);
console.log('ENTRY654_SOURCE_ONLY_NUMERIC_COUNTS_NO_PII=PASS');

for (const mode of ['SHADOW','CANARY','GENERAL']) {
  const r=await inspectCustomerPortalNativeReadinessV0(mock({
    ...rows,control:{...rows.control,mode},
    customers:{activeCustomerCount:3,missingPortalCodeCount:0},
    duplicates:{duplicatePortalCodeGroupCount:0},
    bindings:{mismatchedAccountBindingCount:0},
    accounts:{provisionedAccountCount:3,activeCredentialCount:3},
    sessions:{customerSessionCount:3}
  }));
  assert.equal(r.success,true);
  assert.equal(r.productionRelease,'NO_GO',mode+' does not equal qualified production');
  assert.equal(r.zeroGoogleComplete,false);
}
assert.equal((await inspectCustomerPortalNativeReadinessV0(mock({...rows,control:null}))).reason,
  'CONTROL_MISSING');
assert.equal((await inspectCustomerPortalNativeReadinessV0(mock({...rows,control:{marker:rows.control.marker,mode:'UNSAFE'}}))).reason,
  'INVALID_CONTROL');
assert.equal((await inspectCustomerPortalNativeReadinessV0(mock({
  ...rows,accounts:{activeCredentialCount:0}
}))).reason,'INCOMPLETE_READ_EVIDENCE');
assert.equal((await inspectCustomerPortalNativeReadinessV0(mock({
  ...rows,bindings:null
}))).reason,'INCOMPLETE_READ_EVIDENCE');
const unavailable=await inspectCustomerPortalNativeReadinessV0(mock(rows,'FROM t12_customers'));
assert.equal(unavailable.reason,'SCHEMA_OR_READ_UNAVAILABLE');
assert.doesNotMatch(JSON.stringify(unavailable),/private-db-details/);
console.log('ENTRY654_FAIL_CLOSED_AMBIGUITY_AND_NO_PRODUCTION_GO=PASS');
console.log('ENTRY654_GOOGLE_OR_PRODUCTION_CALLS=0');
