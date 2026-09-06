import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js', import.meta.url), 'utf8');
assert.match(source, /EDGE_ORDERS_READ_02CV_WRITE_CONSISTENCY_20260906/);
assert.match(source, /EDGE_POST_WRITE_READ_BARRIER/);
assert.match(source, /delete safe\.rowNumber/);
assert.match(source, /DEFAULT_POST_WRITE_BARRIER_MS\s*=\s*6\s*\*\s*60\s*\*\s*1000/);

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() { return JSON.stringify(body); }
  };
}

function mirrors() {
  const syncedAt = new Date(Date.now() - 1000).toISOString();
  return [
    { sheetName: 'بنود الأوردرات', status: 'ready', rowCount: 20, sourceLastRow: 20, sourceLastCol: 28, syncedAt },
    { sheetName: 'العملاء', status: 'ready', rowCount: 10, sourceLastRow: 10, sourceLastCol: 15, syncedAt },
    { sheetName: 'عملاء منع التسليم بالمديونية', status: 'ready', rowCount: 3, sourceLastRow: 3, sourceLastCol: 8, syncedAt }
  ];
}

const originalCalls = [];
const fetchCalls = [];
const window = {
  MATBAGY_EDGE_ORDERS_READ_V1_ENABLED: true,
  MATBAGY_EDGE_ORDERS_API_URL: 'https://edge.test',
  MATBAGY_EDGE_ORDERS_POST_WRITE_BARRIER_MS: 6 * 60 * 1000,
  state: { user: { username: 'employee', token: 'employee-token' } },
  trendosSecureApiV1922: async function (action, params) {
    originalCalls.push({ action, params: Object.assign({}, params || {}) });
    if (action === 'updateLine' && params && params.status === 'FAIL') return { success: false, message: 'write rejected' };
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
    fetchCalls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).endsWith('/v1/edge/orders/session')) {
      return response(200, { success: true, edgeToken: 'edge-token', expiresIn: 600 });
    }
    if (String(url).includes('/v1/edge/orders/02cr/page?')) {
      return response(200, {
        success: true,
        version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY',
        rows: [{ rowNumber: 77, orderId: '1001', lineId: '1001-1', status: 'طلب جديد' }],
        mirrors: mirrors()
      });
    }
    throw new Error('Unexpected fetch URL: ' + url);
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'trendos-edge-orders-read-v1.js' });

// Baseline remains D1-first before any write.
let result = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(result.rows[0].lineId, '1001-1');
assert.equal(originalCalls.length, 0);
const fetchCountBeforeWrite = fetchCalls.length;

// A stable lineId must win over the mirror row coordinate. The wrapper removes
// rowNumber before forwarding updateLine to authoritative Apps Script.
result = await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 77,
  orderId: '1001', lineId: '1001-1', status: 'تحت التنفيذ', notes: 'x'
});
assert.equal(result.success, true);
assert.equal(originalCalls.length, 1);
assert.equal(originalCalls[0].action, 'updateLine');
assert.equal(originalCalls[0].params.orderId, '1001');
assert.equal(originalCalls[0].params.lineId, '1001-1');
assert.equal(originalCalls[0].params.status, 'تحت التنفيذ');
assert.equal(Object.prototype.hasOwnProperty.call(originalCalls[0].params, 'rowNumber'), false, 'stale D1 rowNumber must not be forwarded when lineId exists');
assert.equal(fetchCalls.length, fetchCountBeforeWrite, 'write itself must stay off the Edge read API');

let stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.rowNumberStrippedWrites, 1);
assert.equal(stats.postWriteBarriersOpened, 1);
assert.equal(stats.postWriteBarrierActive, true);
assert.equal(stats.postWriteLineId, '1001-1');

// The immediate reload after save must read authoritative Apps Script, not an
// older but physically-fresh D1 mirror.
const fetchCountBeforeBarrierRead = fetchCalls.length;
result = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(result.source, 'apps-script');
assert.equal(fetchCalls.length, fetchCountBeforeBarrierRead, 'barrier read must not even query the stale Edge page');
assert.equal(originalCalls.length, 2);
stats = window.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.postWriteFallbacks, 1);
assert.equal(stats.lastFallbackReason, 'EDGE_POST_WRITE_READ_BARRIER');

// Once the barrier is cleared/expired, normal D1-first behavior resumes.
window.TrendOSEdgeOrdersReadV1.clearPostWriteBarrier();
result = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(result.rows[0].lineId, '1001-1');
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive, false);

// Legacy rows without lineId retain rowNumber as a compatibility fallback.
await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 88,
  orderId: 'LEGACY-1', lineId: '', status: 'بدأ التنفيذ', notes: ''
});
const legacyWrite = originalCalls[originalCalls.length - 1];
assert.equal(legacyWrite.params.rowNumber, 88);
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().rowNumberStrippedWrites, 1);

// A rejected Apps Script write must not open a read barrier.
window.TrendOSEdgeOrdersReadV1.clearPostWriteBarrier();
result = await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 99,
  orderId: '1002', lineId: '1002-1', status: 'FAIL', notes: ''
});
assert.equal(result.success, false);
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive, false);

console.log('PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY_PASS');
