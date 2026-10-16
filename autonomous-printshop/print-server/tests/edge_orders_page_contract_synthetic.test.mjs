// Issue #10B: exercise real Edge handler with fake tokens/DB only.
// All requests are in-process; no fetch, external host, credentials or customer data.
import assert from 'node:assert/strict';
import test from 'node:test';
import { issueOrdersEdgeToken, handleEdgeOrdersReadRequest } from '../../../cloudflare-d1/src/edge-orders-read-v1.mjs';

const SECRET = 'fake-only-github-ci-hmac-key-no-real-auth';
const LIVE = 'TrendOS orders live sync V1';

function fakeEnv(catalog = {}, rows = []) {
  let sqlCalls = 0;
  return {
    EDGE_SESSION_SECRET: SECRET,
    DB: {
      prepare() {
        sqlCalls += 1;
        return {
          bind() { return this; },
          async first() { return catalog; },
          async all() { return { results: rows }; }
        };
      }
    },
    getSqlCallCount() { return sqlCalls; }
  };
}

async function callPage({ screen = 'print', token = '', env = fakeEnv(), extra = '' } = {}) {
  const u = new URL('https://unit.invalid/v1/edge/orders/page');
  u.searchParams.set('screen', screen);
  if (extra) for (const [k, v] of new URLSearchParams(extra)) u.searchParams.set(k, v);
  const req = new Request(u, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  const response = await handleEdgeOrdersReadRequest(req, env);
  return { status: response.status, body: await response.json(), env };
}

async function scopedToken(screens = ['print', 'press', '']) {
  return issueOrdersEdgeToken({ sub: 'synthetic-ci-employee', role: 'print', screens }, SECRET);
}

test('no signed session means 401 and no DB access', async () => {
  const env = fakeEnv();
  const { status, body } = await callPage({ env });
  assert.equal(status, 401);
  assert.equal(body.success, false);
  assert.equal(env.getSqlCallCount(), 0);
});

test('print-only role cannot read laser or service before DB access', async () => {
  const token = await scopedToken();
  for (const screen of ['laser', 'service']) {
    const env = fakeEnv();
    const { status, body } = await callPage({ screen, token, env });
    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.equal(env.getSqlCallCount(), 0);
  }
});

test('bad mirror status, parity, or freshness note fails closed with fallback', async () => {
  const token = await scopedToken();
  const cases = [
    { status: 'stale', rowCount: 0, sourceLastRow: 0, note: LIVE },
    { status: 'ready', rowCount: 2, sourceLastRow: 3, note: LIVE },
    { status: 'ready', rowCount: 0, sourceLastRow: 0, note: 'old sync' },
  ];
  for (const catalog of cases) {
    const env = fakeEnv({ headersJson: '[]', syncedAt: 'fake-sync', ...catalog });
    const { status, body } = await callPage({ token, env });
    assert.equal(status, 503);
    assert.equal(body.success, false);
    assert.equal(body.code, 'mirror-not-ready');
    assert.equal(body.fallback, 'apps-script');
  }
});

test('debt filter does not pretend mirror is an authoritative source', async () => {
  const { status, body } = await callPage({ token: await scopedToken(), extra: 'statusFilter=__DEBT__' });
  assert.equal(status, 409);
  assert.equal(body.fallback, 'apps-script');
});

test('valid empty mirror returns an explicitly PAGINATED response, not full snapshot', async () => {
  const env = fakeEnv({
    headersJson: '[]', status: 'ready', rowCount: 0, sourceLastRow: 0,
    syncedAt: '2026-10-16T00:00:00Z', note: LIVE
  });
  const { status, body } = await callPage({ token: await scopedToken(), env });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.rows, []);
  assert.equal(body.serverPaged, true);
  assert.deepEqual(body.pagination, { page: 1, pageSize: 20, totalRows: 0, totalPages: 1, hasOlder: false });
});

test('page parameters are bounded even for very large requested page numbers', async () => {
  const env = fakeEnv({
    headersJson: '[]', status: 'ready', rowCount: 0, sourceLastRow: 0,
    syncedAt: '2026-10-16T00:00:00Z', note: LIVE
  });
  const { status, body } = await callPage({ token: await scopedToken(), env, extra: 'page=99999999&pageSize=9999999' });
  assert.equal(status, 200);
  assert.equal(body.pagination.page, 1);
  assert.equal(body.pagination.pageSize, 100);
});
