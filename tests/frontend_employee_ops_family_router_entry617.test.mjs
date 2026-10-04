import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const config = fs.readFileSync('config.js','utf8');
const fetchCalls = [];
const legacyCalls = [];

const baseLegacy = async function(action, params) {
  legacyCalls.push({ action, params: { ...(params || {}) } });
  return { success: true, source: 'legacy', action, op: params && params.op };
};

const windowObject = {
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1: false,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS: [],
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES: [],
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE: 'OFF',
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
      authority: 'd1-employee-ops-v1',
      route: String(url)
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  },
  Response
};

vm.runInNewContext(source, sandbox, { filename: 'employee-api-dispatcher-v1.js' });

assert.equal(windowObject.TrendOSEmployeeApiDispatcherV1.employeeOpsMode(), 'OFF');
assert.equal(windowObject.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1, false);
assert.equal(windowObject.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1, false);

// OFF preserves exact legacy behavior and performs no Cloud family call.
const off = await windowObject.trendosEmployeeApiV1(
  'attendanceV1',
  { username:'u', token:'legacy-token', op:'state' }
);
assert.equal(off.source, 'legacy');
assert.equal(fetchCalls.length, 0);

// READONLY routes qualified reads to the D1 Ops family without enabling Native Auth or Bridge.
windowObject.MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE = 'READONLY';
const read = await windowObject.trendosEmployeeApiV1(
  'attendanceV1',
  { username:'u', token:'legacy-token', op:'state' }
);
assert.equal(read.authority, 'd1-employee-ops-v1');
assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/ops');
assert.equal(fetchCalls.at(-1).options.headers.authorization, 'Bearer legacy-token');
const readBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.equal(readBody.action, 'attendanceV1');
assert.equal(readBody.op, 'state');
assert.equal(readBody.username, 'u');
assert.equal(Object.prototype.hasOwnProperty.call(readBody,'token'), false);

// Direct callers through the wrapped secure API also get the qualified read route.
const directRead = await windowObject.trendosSecureApiV1922(
  'cleaningV1',
  { username:'u', token:'legacy-token', op:'status' }
);
assert.equal(directRead.authority, 'd1-employee-ops-v1');
assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/ops');

// READONLY writes must remain on exact legacy transport, never Bridge and never Ops D1.
const beforeWriteFetches = fetchCalls.length;
const writeReadonly = await windowObject.trendosEmployeeApiV1(
  'hrV1',
  { username:'u', token:'legacy-token', op:'submitRequest', requestType:'إجازة' }
);
assert.equal(writeReadonly.source, 'legacy');
assert.equal(fetchCalls.length, beforeWriteFetches);
assert.equal(legacyCalls.at(-1).action, 'hrV1');
assert.equal(legacyCalls.at(-1).params.op, 'submitRequest');

const clockinReadonly = await windowObject.trendosEmployeeApiV1(
  'attendanceClockinV1',
  { username:'u', token:'legacy-token', op:'clockin' }
);
assert.equal(clockinReadonly.source, 'legacy');
assert.equal(fetchCalls.length, beforeWriteFetches);

// GENERAL is source-capable for later promotion, but is not enabled by config in this entry.
windowObject.MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE = 'GENERAL';
const generalWrite = await windowObject.trendosEmployeeApiV1(
  'pressControlV1',
  { username:'u', token:'legacy-token', op:'start' }
);
assert.equal(generalWrite.authority, 'd1-employee-ops-v1');
assert.equal(fetchCalls.at(-1).url, 'https://trendos-d1-api.example.test/v1/employee/ops');
const generalBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.equal(generalBody.action, 'pressControlV1');
assert.equal(generalBody.op, 'start');

// Config remains fail-closed until the controlled READONLY frontend cutover.
assert.match(config, /MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE = 'OFF'/);
assert.match(config, /MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false/);
assert.match(config, /MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);

console.log('ENTRY617_OPS_FRONTEND_ROUTER_SOURCE=PASS');
console.log('ENTRY617_OPS_OFF_EXACT_LEGACY=PASS');
console.log('ENTRY617_OPS_READONLY_READS_TO_D1=PASS');
console.log('ENTRY617_OPS_READONLY_WRITES_STAY_LEGACY=PASS');
console.log('ENTRY617_NATIVE_AUTH_REMAINS_OFF=YES');
console.log('ENTRY617_BRIDGE_REMAINS_OFF=YES');
