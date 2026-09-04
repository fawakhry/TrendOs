import assert from 'node:assert/strict';
import {
  issueEdgeSessionToken,
  getEdgeDataFreshness,
  handleEdgeGatewayRequest
} from '../cloudflare-d1/src/edge-gateway.mjs';

const SECRET = 'test-edge-freshness-secret';
const ENTITIES = ['customers', 'orders', 'messages', 'conversations'];

function sqliteUtc(ms) {
  return new Date(ms).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

class FreshnessDB {
  constructor(rows) {
    this.rows = rows;
    this.businessReadCount = 0;
  }
  prepare(sql) {
    const owner = this;
    return {
      bind() { return this; },
      async all() {
        if (sql.includes('FROM migration_runs')) return { results: owner.rows };
        owner.businessReadCount += 1;
        return { results: [] };
      },
      async first() {
        if (sql.includes('SELECT 1 AS ok')) return { ok: 1 };
        owner.businessReadCount += 1;
        return null;
      }
    };
  }
}

function rowsAt(map) {
  return ENTITIES.map((entity) => ({ entity, lastImportedAt: map[entity] || '' }));
}

async function testFreshAndStaleClassification() {
  const now = Date.UTC(2026, 8, 4, 0, 30, 0);
  const freshAt = sqliteUtc(now - 30_000);
  const staleAt = sqliteUtc(now - 600_000);

  const fresh = await getEdgeDataFreshness({
    DB: new FreshnessDB(rowsAt(Object.fromEntries(ENTITIES.map((e) => [e, freshAt])))),
    EDGE_DATA_MAX_AGE_SECONDS: '180'
  }, now);
  assert.equal(fresh.fresh, true);
  assert.deepEqual(fresh.missingEntities, []);
  assert.deepEqual(fresh.staleEntities, []);
  assert.equal(fresh.entities.every((entry) => entry.ageSeconds === 30), true);

  const stale = await getEdgeDataFreshness({
    DB: new FreshnessDB(rowsAt({
      customers: freshAt,
      orders: staleAt,
      messages: freshAt,
      conversations: freshAt
    })),
    EDGE_DATA_MAX_AGE_SECONDS: '180'
  }, now);
  assert.equal(stale.fresh, false);
  assert.deepEqual(stale.staleEntities, ['orders']);
}

async function testStaleInboxFailsBeforeBusinessRead() {
  const staleAt = sqliteUtc(Date.now() - 600_000);
  const db = new FreshnessDB(rowsAt(Object.fromEntries(ENTITIES.map((e) => [e, staleAt]))));
  const token = await issueEdgeSessionToken({ sub: 'ci-stale-test' }, SECRET);
  const response = await handleEdgeGatewayRequest(
    new Request('https://edge.test/v1/edge/customer-manager/inbox?limit=1', {
      headers: {
        Origin: 'https://fawakhry.github.io',
        Authorization: `Bearer ${token}`
      }
    }),
    {
      DB: db,
      CORS_ORIGINS: 'https://fawakhry.github.io',
      EDGE_SESSION_SECRET: SECRET,
      EDGE_DATA_MAX_AGE_SECONDS: '180'
    }
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'stale-edge-data');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.freshness.fresh, false);
  assert.equal(db.businessReadCount, 0);
}

await testFreshAndStaleClassification();
await testStaleInboxFailsBeforeBusinessRead();
console.log('Cloudflare Edge Freshness V1 tests: PASS');
