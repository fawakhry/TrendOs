import assert from 'node:assert/strict';
import { handleCloudSessionBridgeV3 } from '../src/cloud-session-bridge-v3.mjs';

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
    this.db.firstCount += 1;
    return this.db.firstRow;
  }
  async run() {
    this.db.runCount += 1;
    return { success: true };
  }
}

class FakeDb {
  constructor(firstRow = null) {
    this.firstRow = firstRow;
    this.calls = [];
    this.firstCount = 0;
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

function request(path) {
  return new Request(`https://edge.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://fawakhry.github.io' },
    body: JSON.stringify({ username: 'wael', token: 'employee-secret-token' })
  });
}

async function testShadowHitSkipsAppsScript() {
  const db = new FakeDb({
    canonicalUsername: 'wael',
    role: 'print',
    department: 'طباعة',
    screensJson: '["print","press",""]',
    verifiedAtMs: Date.now() - 10_000,
    expiresAtMs: Date.now() + 120_000,
    source: 'apps-script-post'
  });
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Apps Script must not be called on auth shadow hit');
  };

  const response = await handleCloudSessionBridgeV3(request('/v1/edge/orders/session'), env(db));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.authSource, 'd1-auth-shadow-v1');
  assert.equal(body.user.username, 'wael');
  assert.equal(body.user.role, 'print');
  assert.deepEqual(body.user.screens, ['print', 'press', '']);
  assert.equal(fetchCalls, 0);
  assert.equal(db.firstCount, 1);
  assert.equal(db.runCount, 0);
}

async function testShadowMissFallsBackToPostAndStoresFingerprint() {
  const db = new FakeDb(null);
  const fetchCalls = [];
  globalThis.fetch = async (input, init = {}) => {
    fetchCalls.push({ input: String(input), init });
    return new Response(JSON.stringify({
      success: true,
      user: { username: 'wael', role: 'print', department: 'طباعة' }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const response = await handleCloudSessionBridgeV3(request('/v1/edge/orders/session'), env(db));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.authSource, 'apps-script-post');
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].input, env(db).APPS_SCRIPT_API_URL);
  assert.equal(fetchCalls[0].init.method, 'POST');
  assert.equal(fetchCalls[0].input.includes('employee-secret-token'), false);
  assert.equal(db.firstCount, 1);
  assert.equal(db.runCount, 1);
  const writeCall = db.calls.find((call) => /INSERT INTO cloud_auth_sessions_v1/.test(call.sql));
  assert.ok(writeCall);
  assert.equal(writeCall.args.includes('employee-secret-token'), false);
  assert.match(writeCall.args[1], /^[0-9a-f]{64}$/);
}

try {
  await testShadowHitSkipsAppsScript();
  await testShadowMissFallsBackToPostAndStoresFingerprint();
  console.log('CLOUD_SESSION_BRIDGE_V3_AUTH_SHADOW_INTEGRATION=PASS');
  console.log('SHADOW_HIT_APPS_SCRIPT_CALLS=0');
  console.log('SHADOW_MISS_FALLBACK_METHOD=POST');
  console.log('RAW_EMPLOYEE_TOKEN_D1_WRITE=NO');
} finally {
  globalThis.fetch = originalFetch;
}
