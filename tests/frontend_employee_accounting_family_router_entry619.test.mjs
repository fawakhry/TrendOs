import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dispatcherPath = process.env.ENTRY619_DISPATCHER_PATH || 'employee-api-dispatcher-v1.js';
const configPath = process.env.ENTRY619_CONFIG_PATH || 'config.js';
const source = fs.readFileSync(dispatcherPath,'utf8');
const config = fs.readFileSync(configPath,'utf8');
const fetchCalls = [];
const legacyCalls = [];

const baseLegacy = async function(action, params) {
  legacyCalls.push({ action, params: { ...(params || {}) } });
  return { success: true, source: 'legacy', action };
};

const windowObject = {
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS: [],
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES: 69,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES: [],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE: 'OFF',
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE: 'OFF',
  MATBAGY_EMPLOYEE_API_URL: 'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL: 'https://trendos-d1-api.example.test',
  trendosSecureApiV1922: baseLegacy
};

const sandbox = {
  window: windowObject,
  console,
  URL,
  Set,
  Map,
  JSON,
  Error,
  AbortController,
  TextEncoder,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  fetch: async function(url, options = {}) {
    fetchCalls.push({ url: String(url), options });
    return new Response(JSON.stringify({
      success: true,
      authority: String(url).includes('/employee/accounting')
        ? 'd1-employee-accounting-v1'
        : 'd1-employee-ops-v1'
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  },
  Response
};

vm.runInNewContext(source, sandbox, { filename: 'employee-api-dispatcher-v1.js' });

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeAccountingMode(), 'OFF');
assert.equal(windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1, false);
assert.equal(windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1, false);

// OFF keeps exact legacy behavior.
const off = await windowObject.trendosEmployeeApiV1(
  'getAccounting',
  { username:'u', token:'legacy-token' }
);
assert.equal(off.source, 'legacy');
assert.equal(fetchCalls.length, 0);

// READONLY sends only the three qualified Accounting reads to D1.
windowObject.MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE = 'READONLY';
for (const [action, extra] of [
  ['getAccounting', {}],
  ['getDeptInvoiceDraftV1887', { orderId:'T-1', department:'طباعة' }],
  ['getPartyAccountV1858', { partyType:'customer', partyName:'Test' }]
]) {
  const out = await windowObject.trendosEmployeeApiV1(
    action,
    { username:'u', token:'legacy-token', ...extra }
  );
  assert.equal(out.authority, 'd1-employee-accounting-v1');
  assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/accounting');
  assert.equal(fetchCalls.at(-1).options.headers.authorization, 'Bearer legacy-token');
  const body = JSON.parse(fetchCalls.at(-1).options.body);
  assert.equal(body.action, action);
  assert.equal(body.username, 'u');
  assert.equal(Object.prototype.hasOwnProperty.call(body,'token'), false);
}

// Writes and known parity gaps remain on legacy in READONLY.
const beforeWrites = fetchCalls.length;
for (const action of [
  'saveAccountingMaterial',
  'saveAccountingTemplate',
  'saveAccountingDeptLine',
  'approveAccountingDeptInvoice',
  'saveAccountingFinalInvoice',
  'savePartyLedgerTransaction',
  'initAccounting',
  'recalculateAccountingMaterials'
]) {
  const out = await windowObject.trendosEmployeeApiV1(
    action,
    { username:'u', token:'legacy-token' }
  );
  assert.equal(out.source, 'legacy');
}
assert.equal(fetchCalls.length, beforeWrites);

// Ops routing remains independent and unchanged.
windowObject.MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE = 'GENERAL';
const ops = await windowObject.trendosEmployeeApiV1(
  'cleaningV1',
  { username:'u', token:'legacy-token', op:'complete' }
);
assert.equal(ops.authority, 'd1-employee-ops-v1');
assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/ops');

// Config is fail-closed for new Accounting cutover.
assert.match(config, /MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE = '(OFF|READONLY)'/);
assert.match(config, /MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false/);
assert.match(config, /MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);

console.log('ENTRY619_ACCOUNTING_ROUTER_SOURCE=PASS');
console.log('ENTRY619_ACCOUNTING_OFF_EXACT_LEGACY=PASS');
console.log('ENTRY619_ACCOUNTING_READONLY_READS_TO_D1=PASS');
console.log('ENTRY619_ACCOUNTING_READONLY_WRITES_STAY_LEGACY=PASS');
console.log('ENTRY619_ACCOUNTING_GENERAL_NOT_QUALIFIED=YES');
console.log('ENTRY619_OPS_ROUTING_PRESERVED=YES');
console.log('ENTRY619_NATIVE_AUTH_REMAINS_OFF=YES');
console.log('ENTRY619_BRIDGE_REMAINS_OFF=YES');
