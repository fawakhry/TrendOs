import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { inspectOrdersMirrorCatalog, guardEdgeOrdersPageRequest } from '../cloudflare-d1/src/edge-orders-freshness-gate.mjs';

const nowMs = Date.parse('2026-09-04T14:30:00Z');
const secret = 'orders-freshness-gate-test-secret';
const token = await issueOrdersEdgeToken({
  sub: 'admin', role: 'admin', department: 'إدارة', screens: ['service','print','laser','press','']
}, secret, Math.floor(nowMs / 1000) - 60, 600);

const freshOrdersCatalog = {
  sourceLastRow: 274,
  sourceLastCol: 67,
  rowCount: 274,
  status: 'ready',
  syncedAt: '2026-09-04 14:23:00',
  note: 'TrendOS orders live sync V2 quota-aware'
};
const freshLinesCatalog = {
  sourceLastRow: 315,
  sourceLastCol: 82,
  rowCount: 315,
  status: 'ready',
  syncedAt: '2026-09-04 14:23:00',
  note: 'TrendOS orders live sync V2 quota-aware'
};
const staleOrdersCatalog = { ...freshOrdersCatalog, syncedAt: '2026-09-04 14:19:00' };
const staleLinesCatalog = { ...freshLinesCatalog, syncedAt: '2026-09-04 14:19:00' };
const badLinesParityCatalog = { ...freshLinesCatalog, rowCount: 314 };
const badOrdersParityCatalog = { ...freshOrdersCatalog, rowCount: 273 };

assert.equal(inspectOrdersMirrorCatalog(freshLinesCatalog, nowMs, 600).ready, true);
const staleInspection = inspectOrdersMirrorCatalog(staleLinesCatalog, nowMs, 600);
assert.equal(staleInspection.ready, false);
assert.equal(staleInspection.fresh, false);
assert.equal(staleInspection.ageSeconds, 660);
assert.equal(inspectOrdersMirrorCatalog(badLinesParityCatalog, nowMs, 600).ready, false);

function makeEnv({ orders = freshOrdersCatalog, lines = freshLinesCatalog } = {}) {
  const state = { prepareCount: 0, firstCount: 0, allCount: 0, sql: [] };
  return {
    state,
    env: {
      EDGE_SESSION_SECRET: secret,
      EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS: '600',
      CORS_ORIGINS: 'https://fawakhry.github.io',
      DB: {
        prepare(sql) {
          state.prepareCount += 1;
          state.sql.push(String(sql));
          return {
            bind(sheetName) {
              return {
                async first() {
                  state.firstCount += 1;
                  if (sheetName === 'الأوردرات') return orders;
                  if (sheetName === 'بنود الأوردرات') return lines;
                  return null;
                },
                async all() {
                  state.allCount += 1;
                  throw new Error('Business-row query must not run in freshness gate');
                }
              };
            }
          };
        }
      }
    }
  };
}

function request(statusFilter = '__ACTIVE__', authToken = token) {
  return new Request(`https://edge.test/v1/edge/orders/page?screen=service&page=1&pageSize=5&statusFilter=${encodeURIComponent(statusFilter)}`, {
    method: 'GET',
    headers: {
      origin: 'https://fawakhry.github.io',
      authorization: `Bearer ${authToken}`
    }
  });
}

{
  const { env, state } = makeEnv();
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 2);
  assert.equal(state.firstCount, 2);
  assert.equal(state.allCount, 0);
  for (const sql of state.sql) {
    assert.match(sql, /sheet_catalog/);
    assert.doesNotMatch(sql, /sheet_rows/);
  }
}

{
  const { env, state } = makeEnv({ orders: staleOrdersCatalog, lines: staleLinesCatalog });
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.ok(blocked instanceof Response);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'stale-orders-mirror');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.dataSource, 'd1-orders-stale');
  assert.equal(body.mirror.ageSeconds, 660);
  assert.equal(body.ordersMirror.ageSeconds, 660);
  assert.equal(body.mirror.maxAgeSeconds, 600);
  assert.equal(state.prepareCount, 2);
  assert.equal(state.firstCount, 2);
  assert.equal(state.allCount, 0);
}

{
  const { env, state } = makeEnv({ lines: badLinesParityCatalog });
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.code, 'mirror-not-ready');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.mirror.parity, false);
  assert.equal(state.allCount, 0);
}

{
  const { env, state } = makeEnv({ orders: badOrdersParityCatalog });
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.code, 'mirror-not-ready');
  assert.equal(body.ordersMirror.parity, false);
  assert.equal(state.allCount, 0);
}

{
  const { env, state } = makeEnv({ orders: staleOrdersCatalog, lines: staleLinesCatalog });
  const blocked = await guardEdgeOrdersPageRequest(request('__DEBT__'), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 0);
}

{
  const { env, state } = makeEnv({ orders: staleOrdersCatalog, lines: staleLinesCatalog });
  const blocked = await guardEdgeOrdersPageRequest(request('__ACTIVE__', 'bad-token'), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 0);
}

console.log('Cloudflare Edge Orders Freshness Gate V1: ORDERS+LINES METADATA + 600S BUDGET + STALE/PARITY FAIL-CLOSED + NO BUSINESS-ROW QUERY PASS');
