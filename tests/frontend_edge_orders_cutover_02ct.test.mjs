import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js', import.meta.url), 'utf8');
assert.match(source, /\/v1\/edge\/orders\/02cr\/page/);
assert.doesNotMatch(source, /requestKey\s*=\s*['"]\/v1\/edge\/orders\/page\?/);

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() { return typeof body === 'string' ? body : JSON.stringify(body); }
  };
}

function freshMirrors(ageMs = 1000) {
  const syncedAt = new Date(Date.now() - ageMs).toISOString();
  return [
    { sheetName: 'بنود الأوردرات', status: 'ready', rowCount: 355, sourceLastRow: 355, syncedAt },
    { sheetName: 'العملاء', status: 'ready', rowCount: 200, sourceLastRow: 200, syncedAt },
    { sheetName: 'عملاء منع التسليم بالمديونية', status: 'ready', rowCount: 20, sourceLastRow: 20, syncedAt }
  ];
}

const calls = [];
let pageMode = 'ok';
let originalCalls = 0;

const window = {
  MATBAGY_EDGE_ORDERS_READ_V1_ENABLED: true,
  MATBAGY_EDGE_ORDERS_API_URL: 'https://edge.test',
  MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS: 5 * 60 * 1000,
  state: { user: { username: 'employee', token: 'employee-token' } },
  trendosSecureApiV1922: async function (action, params) {
    originalCalls += 1;
    return { success: true, source: 'apps-script', action, params };
  }
};

const context = {
  window,
  console: { warn() {}, log() {}, error() {} },
  Map,
  Date,
  Math,
  JSON,
  String,
  Object,
  URLSearchParams,
  setInterval,
  clearInterval,
  sessionStorage: { getItem() { return ''; } },
  fetch: async function (url, options = {}) {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).endsWith('/v1/edge/orders/session')) {
      return response(200, { success: true, edgeToken: 'edge-token', expiresIn: 600 });
    }
    if (String(url).includes('/v1/edge/orders/02cr/page?')) {
      if (pageMode === 'ok') return response(200, { success: true, version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY', rows: [{ orderId: '1' }], mirrors: freshMirrors() });
      if (pageMode === 'invalid-json') return response(200, 'not-json');
      return response(500, { success: false, message: 'edge failed' });
    }
    throw new Error('Unexpected fetch URL: ' + url);
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'trendos-edge-orders-read-v1.js' });

assert.equal(typeof window.trendosSecureApiV1922, 'function');
assert.equal(window.TrendOSEdgeOrdersReadV1.pagePath, '/v1/edge/orders/02cr/page');

const d1 = await window.trendosSecureApiV1922('getRowsPageV1931', {
  screen: 'print', page: 1, pageSize: 5, statusFilter: '__ACTIVE__', username: 'employee', token: 'secret-should-not-enter-query'
});
assert.equal(d1.success, true);
assert.equal(d1.rows[0].orderId, '1');
assert.ok(calls.some((c) => c.url.includes('/v1/edge/orders/02cr/page?')));
const pageCall = calls.find((c) => c.url.includes('/v1/edge/orders/02cr/page?'));
assert.ok(pageCall.url.includes('screen=print'));
assert.ok(!pageCall.url.includes('username='));
assert.ok(!pageCall.url.includes('token='));
assert.equal(originalCalls, 0);

const beforeDebtFetches = calls.length;
const debt = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', statusFilter: '__DEBT__' });
assert.equal(debt.source, 'apps-script');
assert.equal(calls.length, beforeDebtFetches);
assert.equal(originalCalls, 1);

const beforeWriteFetches = calls.length;
const write = await window.trendosSecureApiV1922('updateRowV1931', { screen: 'print', orderId: '1' });
assert.equal(write.source, 'apps-script');
assert.equal(calls.length, beforeWriteFetches);
assert.equal(originalCalls, 2);

pageMode = 'http500';
const fallback500 = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'laser', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(fallback500.source, 'apps-script');
assert.equal(originalCalls, 3);

pageMode = 'invalid-json';
const fallbackJson = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(fallbackJson.source, 'apps-script');
assert.equal(originalCalls, 4);

console.log('PERF_CF_02CT_FRONTEND_CUTOVER_WRAPPER_PASS');
