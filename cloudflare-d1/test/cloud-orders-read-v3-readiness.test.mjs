import assert from 'node:assert/strict';
import { handleCloudSessionBridgeV3 } from '../src/cloud-session-bridge-v3.mjs';
import { handleEdgeOrdersReadCanaryRequest } from '../src/edge-orders-read-v1-canary.mjs';

const originalFetch = globalThis.fetch;

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    this.db.calls.push({ sql: this.sql, args });
    return this;
  }
  async first() {
    if (/cloud_auth_sessions_v1/.test(this.sql)) {
      return {
        canonicalUsername: 'wael',
        role: 'print',
        department: 'طباعة',
        screensJson: '["print","press",""]',
        verifiedAtMs: Date.now() - 10_000,
        expiresAtMs: Date.now() + 120_000,
        source: 'apps-script-post'
      };
    }
    if (/FROM sheet_catalog/.test(this.sql)) {
      return {
        headersJson: '[]',
        sourceLastRow: 1,
        sourceLastCol: 0,
        rowCount: 0,
        status: 'ready',
        syncedAt: new Date().toISOString(),
        note: 'T3 test mirror'
      };
    }
    return null;
  }
  async all() {
    if (/FROM sheet_rows/.test(this.sql)) return { results: [] };
    return { results: [] };
  }
  async run() {
    this.db.runCount += 1;
    return { success: true };
  }
}

class FakeDb {
  constructor() {
    this.calls = [];
    this.runCount = 0;
  }
  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

function env(db) {
  return {
    DB: db,
    APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/test-deployment/exec',
    EDGE_SESSION_SECRET: 'test-only-edge-secret-that-is-not-production',
    EDGE_SESSION_TTL_SECONDS: '600',
    TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: 'true',
    CLOUD_AUTH_SHADOW_TTL_SECONDS: '300',
    CORS_ORIGINS: 'https://fawakhry.github.io'
  };
}

function sessionRequest() {
  return new Request('https://edge.test/v1/edge/orders/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://fawakhry.github.io' },
    body: JSON.stringify({ username: 'wael', token: 'employee-secret-token' })
  });
}

async function getOrdersToken(db) {
  const response = await handleCloudSessionBridgeV3(sessionRequest(), env(db));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.authSource, 'd1-auth-shadow-v1');
  assert.match(body.edgeToken, /^v1\./);
  return body.edgeToken;
}

async function testCloudAuthToD1OrdersReadHasNoAppsScriptRequest() {
  const db = new FakeDb();
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Apps Script must not be called in T3 cloud-native read path');
  };

  const token = await getOrdersToken(db);
  const response = await handleEdgeOrdersReadCanaryRequest(new Request(
    'https://edge.test/v1/edge/orders/page?screen=print&page=1&pageSize=20',
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        origin: 'https://fawakhry.github.io'
      }
    }
  ), env(db));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.dataSource, 'd1-edge-orders');
  assert.equal(body.serverPaged, true);
  assert.deepEqual(body.rows, []);
  assert.equal(fetchCalls, 0);
  assert.equal(db.runCount, 0);
}

async function testDebtFilterRemainsAuthoritativeFallback() {
  const db = new FakeDb();
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('No network request expected in debt fallback contract');
  };

  const token = await getOrdersToken(db);
  const response = await handleEdgeOrdersReadCanaryRequest(new Request(
    'https://edge.test/v1/edge/orders/page?screen=print&statusFilter=__DEBT__&page=1&pageSize=20',
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        origin: 'https://fawakhry.github.io'
      }
    }
  ), env(db));
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(body.code, 'apps-script-required');
  assert.equal(body.fallback, 'apps-script');
  assert.equal(fetchCalls, 0);
}

try {
  await testCloudAuthToD1OrdersReadHasNoAppsScriptRequest();
  await testDebtFilterRemainsAuthoritativeFallback();
  console.log('CLOUD_ORDERS_READ_V3_T3_READINESS=PASS');
  console.log('NORMAL_ORDERS_READ_APPS_SCRIPT_CALLS=0');
  console.log('NORMAL_ORDERS_DATA_SOURCE=d1-edge-orders');
  console.log('DEBT_FILTER_FALLBACK=apps-script');
  console.log('BUSINESS_MUTATION=NO');
} finally {
  globalThis.fetch = originalFetch;
}
