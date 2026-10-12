import assert from 'node:assert/strict';
import {
  handleLegacyBrowserTransport, LEGACY_BROWSER_ACTIONS
} from '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';

const origin = 'https://ui.example.test';
const baseEnv = {
  CORS_ORIGINS: origin,
  APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/FAKE-ONLY/exec'
};
const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push({url: String(url), options});
  return new Response(JSON.stringify({success: true, fixture: 'synthetic-only'}), {
    status: 200,
    headers: {'content-type': 'application/json'}
  });
};
function request(action, sourceOrigin = origin) {
  return new Request('https://cloud.example.test/v1/legacy-api', {
    method: 'POST',
    headers: {'content-type': 'application/json', Origin: sourceOrigin},
    body: JSON.stringify({action, username: 'FAKE-EMPLOYEE', token: 'FAKE-TOKEN'})
  });
}
const employeeActions = [
  'login', 'logout', 'verifyEmployeeSession', 'changePassword',
  'hrV1', 'attendanceV1', 'cleaningV1', 'pressControlV1',
  'getDashboard', 'getRowsPageV1931', 'getAccounting',
  'initAccounting', 'saveAccountingMaterial', 'operatorTaskV2'
];
const customerActions = [
  'customerLogin', 'customerLogout', 'changeCustomerPassword',
  'getCustomerOrders', 'getCustomerPortalAccountsV1859',
  'createCustomerDraft', 'addCustomerDraftItem',
  'submitCustomerDraft', 'uploadCustomerDraftFile'
];

try {
  assert.equal(new Set(customerActions).size, 9, 'customer legacy allowlist must remain exact');
  for (const action of employeeActions) {
    assert.equal(customerActions.includes(action), false, action + ': must never be customer-authorized');
  }
  // The current code guard must cover EVERY allowlisted non-customer action,
  // including future additions, not only the representative cases above.
  const employeeAndOtherLegacy = [...LEGACY_BROWSER_ACTIONS].filter(action => !customerActions.includes(action));
  assert.ok(employeeAndOtherLegacy.length > employeeActions.length);
  assert.equal(employeeAndOtherLegacy.length + customerActions.length, LEGACY_BROWSER_ACTIONS.size);
  for (const action of employeeAndOtherLegacy) {
    assert.equal(LEGACY_BROWSER_ACTIONS.has(action), true, action);
    const count = calls.length;
    for (const nativeOnly of [true, 'true', 'TRUE']) {
      const out = await handleLegacyBrowserTransport(
        request(action), {...baseEnv, TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: nativeOnly}
      );
      assert.equal(out.status, 403, action);
      const body = await out.json();
      assert.equal(body.success, false);
      assert.equal(body.code, 'LEGACY_EMPLOYEE_UPSTREAM_RETIRED');
      assert.equal(JSON.stringify(body).includes('FAKE-TOKEN'), false);
      assert.equal(out.headers.get('cache-control'), 'no-store');
      assert.equal(out.headers.get('access-control-allow-origin'), origin);
      assert.equal(calls.length, count, action + ': no Apps Script fetch');
    }
  }
  console.log('ENTRY653_NATIVE_ONLY_EMPLOYEE_UPSTREAM_DENIAL=PASS');

  // Retire employee authority without accidentally turning off customer login,
  // draft/file actions or claiming those customer flows are already Zero-Google.
  for (const action of customerActions) {
    assert.equal(LEGACY_BROWSER_ACTIONS.has(action), true, action);
    const count = calls.length;
    const response = await handleLegacyBrowserTransport(request(action), {
      ...baseEnv, TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'true'
    });
    assert.equal(response.status, 200, action);
    assert.equal(calls.length, count + 1, action + ': customer authority preserved');
    assert.equal(calls.at(-1).url, baseEnv.APPS_SCRIPT_API_URL);
    assert.equal(JSON.parse(calls.at(-1).options.body).action, action);
  }
  console.log('ENTRY653_CUSTOMER_SESSION_SEPARATE_MIGRATION_PRESERVED=PASS');

  // Absent/false Native-only leaves historical behaviour untouched;
  // invalid origin and forbidden actions still cannot reach upstream.
  for (const nativeOnly of [undefined, false, 'false']) {
    const count = calls.length;
    const response = await handleLegacyBrowserTransport(request('login'), {
      ...baseEnv, TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: nativeOnly
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, count + 1);
  }
  const count = calls.length;
  assert.equal((await handleLegacyBrowserTransport(
    request('login', 'https://bad.example.test'),
    {...baseEnv, TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'true'}
  )).status, 403);
  assert.equal((await handleLegacyBrowserTransport(request('unknown'), {
    ...baseEnv, TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'true'
  })).status, 403);
  assert.equal(calls.length, count);
  console.log('ENTRY653_LEGACY_FALSE_OR_UNSET_COMPATIBILITY=PASS');
  console.log('ENTRY653_ORIGIN_AND_ACTION_DENY_PRESERVED=PASS');
  console.log('ENTRY653_PRODUCTION_MUTATION=NO');
  console.log('ENTRY653_ZERO_GOOGLE_COMPLETE=NO');
} finally {
  globalThis.fetch = originalFetch;
}
