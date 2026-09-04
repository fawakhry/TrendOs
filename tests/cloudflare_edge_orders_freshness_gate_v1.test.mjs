import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { inspectOrdersMirrorCatalog, guardEdgeOrdersPageRequest } from '../cloudflare-d1/src/edge-orders-freshness-gate.mjs';

const nowMs = Date.parse('2026-09-04T14:30:00Z');
const secret = 'orders-freshness-gate-test-secret';
const token = await issueOrdersEdgeToken({
  sub: 'admin', role: 'admin', department: 'إدارة', screens: ['service','print','laser','press','']
}, secret, Math.floor(nowMs / 1000) - 60, 600);

const freshCatalog = {
  sourceLastRow: 315,
  sourceLastCol: 82,
  rowCount: 315,
  status: 'ready',
  syncedAt: '2026-09-04 14:23:00',
  note: 'TrendOS orders live sync V2 quota-aware'
};
const staleCatalog = { ...freshCatalog, syncedAt: '2026-09-04 14:19:00' };
const badParityCatalog = { ...freshCatalog, rowCount: 314 };

assert.equal(inspectOrdersMirrorCatalog(freshCatalog, nowMs, 600).ready, true);
const staleInspection = inspectOrdersMirrorCatalog(staleCatalog, nowMs, 600);
assert.equal(staleInspection.ready, false);
assert.equal(staleInspection.fresh, false);
assert.equal(staleInspection.ageSeconds, 660);
assert.equal(inspectOrdersMirrorCatalog(badParityCatalog, nowMs, 600).ready, false);

function makeEnv(catalog) {
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
            bind() {
              return {
                async first() { state.firstCount += 1; return catalog; },
                async all() { state.allCount += 1; throw new Error('Business-row query must not run in freshness gate'); }
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
  const { env, state } = makeEnv(freshCatalog);
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 1);
  assert.equal(state.firstCount, 1);
  assert.equal(state.allCount, 0);
  assert.match(state.sql[0], /sheet_catalog/);
  assert.doesNotMatch(state.sql[0], /sheet_rows/);
}

{
  const { env, state } = makeEnv(staleCatalog);
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.ok(blocked instanceof Response);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'stale-orders-mirror');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.dataSource, 'd1-orders-stale');
  assert.equal(body.mirror.ageSeconds, 660);
  assert.equal(body.mirror.maxAgeSeconds, 600);
  assert.equal(state.prepareCount, 1);
  assert.equal(state.firstCount, 1);
  assert.equal(state.allCount, 0);
}

{
  const { env, state } = makeEnv(badParityCatalog);
  const blocked = await guardEdgeOrdersPageRequest(request(), env, nowMs);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.code, 'mirror-not-ready');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(state.allCount, 0);
}

{
  const { env, state } = makeEnv(staleCatalog);
  const blocked = await guardEdgeOrdersPageRequest(request('__DEBT__'), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 0);
}

{
  const { env, state } = makeEnv(staleCatalog);
  const blocked = await guardEdgeOrdersPageRequest(request('__ACTIVE__', 'bad-token'), env, nowMs);
  assert.equal(blocked, null);
  assert.equal(state.prepareCount, 0);
}

console.log('Cloudflare Edge Orders Freshness Gate V1: 600S BUDGET + STALE FAIL-CLOSED + NO BUSINESS-ROW QUERY PASS');
