import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js', import.meta.url), 'utf8');
assert.match(source, /EDGE_ORDERS_READ_02CX_LINE_ID_GUARD_20260908/);
assert.match(source, /EDGE_POST_WRITE_READ_BARRIER/);
assert.match(source, /delete safe\.rowNumber/);
assert.match(source, /DEFAULT_POST_WRITE_BARRIER_MS\s*=\s*6\s*\*\s*60\s*\*\s*1000/);
assert.match(source, /trendos_edge_orders_post_write_barrier_v1/);
assert.match(source, /repairSerializedLineId/);

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

const storage = new Map();
const sessionStorage = {
  getItem(key) { return storage.has(String(key)) ? storage.get(String(key)) : ''; },
  setItem(key, value) { storage.set(String(key), String(value)); },
  removeItem(key) { storage.delete(String(key)); }
};

function edgeBody() {
  return {
    success: true,
    version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY',
    rows: [
      // Google Sheets parsed 3876-01 / 3961-01 as dates. The D1 mapper had
      // surfaced their raw Sheets serials (721721 / 752767) as line IDs.
      { rowNumber: 307, orderId: '3876', lineId: '721721', status: 'تحت التنفيذ' },
      { rowNumber: 397, orderId: '3961', lineId: '752767', status: 'طلب جديد' },
      { rowNumber: 77, orderId: '1001', lineId: '1001-1', status: 'طلب جديد' }
    ],
    mirrors: mirrors()
  };
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
  sessionStorage,
  fetch: async function (url, options = {}) {
    fetchCalls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).endsWith('/v1/edge/orders/session')) {
      return response(200, { success: true, edgeToken: 'edge-token', expiresIn: 600 });
    }
    if (String(url).includes('/v1/edge/orders/02cr/page?')) return response(200, edgeBody());
    throw new Error('Unexpected fetch URL: ' + url);
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'trendos-edge-orders-read-v1.js' });

// The exact Production failures must be repaired before they reach the UI.
assert.equal(window.TrendOSEdgeOrdersReadV1.repairSerializedLineId('3876', '721721'), '3876-01');
assert.equal(window.TrendOSEdgeOrdersReadV1.repairSerializedLineId('3961', '752767'), '3961-01');
assert.equal(window.TrendOSEdgeOrdersReadV1.repairSerializedLineId('1001', '1001-1'), '1001-1');

// Baseline remains D1-first before any write, but corrupted serial identities are normalized.
let result = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(result.rows[0].lineId, '3876-01');
assert.equal(result.rows[1].lineId, '3961-01');
assert.equal(result.rows[2].lineId, '1001-1');
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().lineIdRepairs, 2);
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

const persisted = JSON.parse(storage.get('trendos_edge_orders_post_write_barrier_v1') || '{}');
assert.equal(persisted.orderId, '1001');
assert.equal(persisted.lineId, '1001-1');
assert.ok(Number(persisted.until) > Date.now());

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

// A full browser refresh creates a new module instance. The persisted session barrier
// must still force Apps Script until the D1 mirror has had time to catch up.
const reloadOriginalCalls = [];
const reloadFetchCalls = [];
const reloadWindow = {
  MATBAGY_EDGE_ORDERS_READ_V1_ENABLED: true,
  MATBAGY_EDGE_ORDERS_API_URL: 'https://edge.test',
  MATBAGY_EDGE_ORDERS_POST_WRITE_BARRIER_MS: 6 * 60 * 1000,
  state: { user: { username: 'employee', token: 'employee-token' } },
  trendosSecureApiV1922: async function (action, params) {
    reloadOriginalCalls.push({ action, params: Object.assign({}, params || {}) });
    return { success: true, source: 'apps-script', action, params };
  }
};
const reloadContext = {
  window: reloadWindow,
  console: { warn() {}, log() {}, error() {} },
  Map, Date, Math, JSON, String, Object, URLSearchParams,
  setInterval, clearInterval, sessionStorage,
  fetch: async function (url) {
    reloadFetchCalls.push(String(url));
    throw new Error('persisted barrier should prevent Edge fetch after refresh');
  }
};
reloadContext.globalThis = reloadContext;
vm.createContext(reloadContext);
vm.runInContext(source, reloadContext, { filename: 'trendos-edge-orders-read-v1.js#reload' });
const reloadResult = await reloadWindow.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(reloadResult.source, 'apps-script');
assert.equal(reloadOriginalCalls.length, 1);
assert.equal(reloadFetchCalls.length, 0);
assert.equal(reloadWindow.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive, true);

// Once the barrier is cleared/expired, normal D1-first behavior resumes.
window.TrendOSEdgeOrdersReadV1.clearPostWriteBarrier();
result = await window.trendosSecureApiV1922('getRowsPageV1931', { screen: 'print', page: 1, pageSize: 5 });
assert.equal(result.rows[0].lineId, '3876-01');
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive, false);
assert.equal(storage.has('trendos_edge_orders_post_write_barrier_v1'), false);

// Even if a stale UI sends the serial identity directly, normalize it before the write.
await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 397,
  orderId: '3961', lineId: '752767', status: 'بدأ التنفيذ', notes: ''
});
const repairedWrite = originalCalls[originalCalls.length - 1];
assert.equal(repairedWrite.params.lineId, '3961-01');
assert.equal(Object.prototype.hasOwnProperty.call(repairedWrite.params, 'rowNumber'), false);
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().writeIdentityRepairs, 1);

// Legacy rows without lineId retain rowNumber as a compatibility fallback.
window.TrendOSEdgeOrdersReadV1.clearPostWriteBarrier();
await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 88,
  orderId: 'LEGACY-1', lineId: '', status: 'بدأ التنفيذ', notes: ''
});
const legacyWrite = originalCalls[originalCalls.length - 1];
assert.equal(legacyWrite.params.rowNumber, 88);
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().rowNumberStrippedWrites, 2);

// A rejected Apps Script write must not open a read barrier.
window.TrendOSEdgeOrdersReadV1.clearPostWriteBarrier();
result = await window.trendosSecureApiV1922('updateLine', {
  username: 'employee', token: 'employee-token', rowNumber: 99,
  orderId: '1002', lineId: '1002-1', status: 'FAIL', notes: ''
});
assert.equal(result.success, false);
assert.equal(window.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive, false);

console.log('PERF_CF_02CX_LINE_ID_AND_REFRESH_WRITE_CONSISTENCY_PASS');