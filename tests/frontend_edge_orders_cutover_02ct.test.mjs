import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js', import.meta.url), 'utf8');
assert.match(source, /\/v1\/edge\/orders\/02cr\/page/);
assert.doesNotMatch(source, /requestKey\s*=\s*['"]\/v1\/edge\/orders\/page\?/);
assert.match(source, /EDGE_MIRROR_STALE/);
assert.match(source, /verified-idle-source-unchanged/);

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() { return typeof body === 'string' ? body : JSON.stringify(body); }
  };
}

function mirrors(ages = {}) {
  const lineAge = Number.isFinite(Number(ages.lines)) ? Number(ages.lines) : 1000;
  const customerAge = Number.isFinite(Number(ages.customers)) ? Number(ages.customers) : 1000;
  const restrictionAge = Number.isFinite(Number(ages.restrictions)) ? Number(ages.restrictions) : 1000;
  return [
    { sheetName: 'بنود الأوردرات', status: 'ready', rowCount: 355, sourceLastRow: 355, sourceLastCol: 28, syncedAt: new Date(Date.now() - lineAge).toISOString() },
    { sheetName: 'العملاء', status: 'ready', rowCount: 200, sourceLastRow: 200, sourceLastCol: 15, syncedAt: new Date(Date.now() - customerAge).toISOString() },
    { sheetName: 'عملاء منع التسليم بالمديونية', status: 'ready', rowCount: 20, sourceLastRow: 20, sourceLastCol: 8, syncedAt: new Date(Date.now() - restrictionAge).toISOString() }
  ];
}

function logicalProof(options = {}) {
  const checkedAgeMs = Number.isFinite(Number(options.checkedAgeMs)) ? Number(options.checkedAgeMs) : 1000;
  return {
    ok: options.ok == null ? true : options.ok,
    mode: options.mode || 'verified-idle-source-unchanged',
    checkedAt: new Date(Date.now() - checkedAgeMs).toISOString(),
    ageSeconds: Math.round(checkedAgeMs / 1000),
    maxAgeSeconds: options.maxAgeSeconds || 720,
    failedChecks: options.failedChecks || [],
    source: {
      orders: { sourceLastRow: 100, sourceLastCol: 30, displayHashPresent: true },
      lines: {
        sourceLastRow: options.linesRows == null ? 355 : options.linesRows,
        sourceLastCol: options.linesCols == null ? 28 : options.linesCols,
        displayHashPresent: options.displayHashPresent == null ? true : options.displayHashPresent
      }
    }
  };
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
      if (pageMode === 'ok') return response(200, { success: true, version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY', rows: [{ orderId: '1' }], mirrors: mirrors() });
      if (pageMode === 'stale-lines-no-proof') return response(200, { success: true, rows: [{ orderId: 'stale' }], mirrors: mirrors({ lines: 6 * 60 * 1000 }) });
      if (pageMode === 'stale-lines-proof') return response(200, { success: true, rows: [{ orderId: 'logical' }], mirrors: mirrors({ lines: 6 * 60 * 1000 }), logicalFreshness: logicalProof() });
      if (pageMode === 'stale-lines-bad-shape') return response(200, { success: true, rows: [{ orderId: 'bad-shape' }], mirrors: mirrors({ lines: 6 * 60 * 1000 }), logicalFreshness: logicalProof({ linesRows: 354 }) });
      if (pageMode === 'stale-lines-old-proof') return response(200, { success: true, rows: [{ orderId: 'old-proof' }], mirrors: mirrors({ lines: 6 * 60 * 1000 }), logicalFreshness: logicalProof({ checkedAgeMs: 16 * 60 * 1000 }) });
      if (pageMode === 'stale-customer-proof') return response(200, { success: true, rows: [{ orderId: 'stale-customer' }], mirrors: mirrors({ lines: 6 * 60 * 1000, customers: 6 * 60 * 1000 }), logicalFreshness: logicalProof() });
      if (pageMode === 'missing-mirror') return response(200, { success: true, version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY', rows: [{ orderId: 'missing' }], mirrors: mirrors().slice(1) });
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
assert.equal(window.TrendOSEdgeOrdersReadV1.maxMirrorAgeMs, 5 * 60 * 1000);

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

pageMode = 'stale-lines-no-proof';
const staleFallback = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(staleFallback.source, 'apps-script');
assert.equal(originalCalls, 3);
let stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.staleFallbacks, 1);
assert.equal(stats.fallbacks, 1);
assert.equal(stats.lastFallbackReason, 'EDGE_MIRROR_STALE');
assert.equal(stats.logicalFreshnessAccepted, 0);

pageMode = 'stale-lines-proof';
const logical = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(logical.rows[0].orderId, 'logical');
assert.equal(originalCalls, 3, 'valid logical freshness must retain the D1-first read');
stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.logicalFreshnessAccepted, 1);
assert.equal(stats.edgeSuccess, 2);

pageMode = 'stale-lines-bad-shape';
assert.equal((await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print' })).source, 'apps-script');
assert.equal(originalCalls, 4);

pageMode = 'stale-lines-old-proof';
assert.equal((await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print' })).source, 'apps-script');
assert.equal(originalCalls, 5);

pageMode = 'stale-customer-proof';
assert.equal((await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print' })).source, 'apps-script', 'heartbeat proof must never cover customer enrichment staleness');
assert.equal(originalCalls, 6);

pageMode = 'missing-mirror';
const missingFallback = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'laser', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(missingFallback.source, 'apps-script');
assert.equal(originalCalls, 7);
stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.lastFallbackReason, 'EDGE_MIRROR_MISSING');

pageMode = 'http500';
const fallback500 = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'laser', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(fallback500.source, 'apps-script');
assert.equal(originalCalls, 8);

pageMode = 'invalid-json';
const fallbackJson = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5, statusFilter: '__ACTIVE__' });
assert.equal(fallbackJson.source, 'apps-script');
assert.equal(originalCalls, 9);

stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.edgeSuccess, 2);
assert.equal(stats.fallbacks, 7);
assert.equal(stats.staleFallbacks, 4);
assert.equal(stats.logicalFreshnessAccepted, 1);

console.log('PERF_CF_02CU_FRONTEND_DUAL_SIGNAL_FRESHNESS_FALLBACK_PASS');
