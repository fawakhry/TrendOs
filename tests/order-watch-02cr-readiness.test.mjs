/* SOURCE-ONLY qualification: real source helpers under synthetic inputs only.
 * Does NOT authenticate an actual employee or call Cloudflare / D1.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mapT12CloudNativeRows } from '../cloudflare-d1/src/t12-read-overlay.mjs';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { handleEdgeOrders02CRCanaryRequest } from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';
import { analyzeOrderWatchSnapshot } from '../cloudflare-d1/src/order-watch-agent-v0.mjs';

test('real Cloud-native mapping yields MISSING date rather than fabricated overdue', () => {
  const [native] = mapT12CloudNativeRows([{
    orderId: 'FAKE100', lineId: 'FAKE100-01', department: 'طباعة',
    itemName: 'Synthetic board', assignedTo: 'test-operator', status: 'طلب جديد',
    priority: 'عادي', orderCreatedAt: '2026-10-10 08:00:00',
    customerName: 'PRIVATE SYNTHETIC', customerPhone: '01222222222',
    notes: 'PRIVATE SYNTHETIC NOTES'
  }], 'service');
  assert.ok(native?.cloudNative);
  assert.equal(native.expectedDeliveryAt, '');
  assert.equal(native.expectedDeliveryText, '');
  const report = analyzeOrderWatchSnapshot({
    asOf: '2026-10-14T14:00:00+03:00',
    pages: [{
      success: true,
      serverPaged: true,
      version: 'D1_ORDERS_READ_02CR_T12_LEGACY_RUNTIME_V1',
      dataSource: 'd1-edge-orders-02cr+legacy-runtime+t12-native',
      dataVersion: '2026-10-14 00:00:00',
      pagination: { page: 1, pageSize: 20, totalRows: 1, totalPages: 1 },
      rows: [native]
    }]
  });
  assert.equal(report.summary.missingDeliveryDate, 1);
  assert.equal(report.summary.overdue, 0);
  assert.equal(report.snapshotAtomicityVerified, false);
  assert.deepEqual(report.alerts[0].codes, ['DELIVERY_DATE_MISSING']);
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes('PRIVATE SYNTHETIC'));
  assert.ok(!serialized.includes('01222222222'));
});

test('real 02CR read handler rejects anonymous calls before touching database', async () => {
  const request = new Request('https://offline.test/v1/edge/orders/02cr/page?screen=service');
  const response = await handleEdgeOrders02CRCanaryRequest(request, {
    EDGE_SESSION_SECRET: 'synthetic-test-secret',
    DB: { prepare() { throw new Error('DB must not be read'); } }
  });
  assert.equal(response.status, 401);
});

test('signed employee token with print-only scope cannot inspect laser screen', async () => {
  const secret = 'synthetic-test-secret';
  const token = await issueOrdersEdgeToken({
    sub: 'FAKE_EMPLOYEE', role: 'print', department: 'طباعة', screens: ['print']
  }, secret, Math.floor(Date.now() / 1000), 60);
  const request = new Request('https://offline.test/v1/edge/orders/02cr/page?screen=laser', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const response = await handleEdgeOrders02CRCanaryRequest(request, {
    EDGE_SESSION_SECRET: secret,
    DB: { prepare() { throw new Error('Forbidden token must not read DB'); } }
  });
  assert.equal(response.status, 403);
});

test('expired synthetic token is rejected, no DB access', async () => {
  const secret = 'synthetic-test-secret';
  const token = await issueOrdersEdgeToken({
    sub: 'FAKE_EMPLOYEE', role: 'service', screens: ['service']
  }, secret, Math.floor(Date.now() / 1000) - 3600, 60);
  const request = new Request('https://offline.test/v1/edge/orders/02cr/page?screen=service', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const response = await handleEdgeOrders02CRCanaryRequest(request, {
    EDGE_SESSION_SECRET: secret,
    DB: { prepare() { throw new Error('Expired token must not read DB'); } }
  });
  assert.equal(response.status, 401);
});
