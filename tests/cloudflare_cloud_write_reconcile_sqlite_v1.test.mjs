import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { issueEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';
import { handleCloudWriteRequest } from '../cloudflare-d1/src/cloud-write-gate.mjs';
import { reconcileNextOutboxItem } from '../cloudflare-d1/src/cloud-write-reconcile-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'reconcile-isolated-secret-20260904';

class SQLiteStatementAdapter {
  constructor(owner, sql) {
    this.owner = owner;
    this.sql = sql;
    this.params = [];
  }
  bind(...params) {
    this.params = params;
    return this;
  }
  async first() {
    const row = this.owner.db.prepare(this.sql).get(...this.params);
    return row || null;
  }
  async all() {
    return { results: this.owner.db.prepare(this.sql).all(...this.params) };
  }
  async run() {
    return this.owner.db.prepare(this.sql).run(...this.params);
  }
}

class SQLiteD1Adapter {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  prepare(sql) {
    return new SQLiteStatementAdapter(this, sql);
  }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.db.exec('COMMIT;');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
  row(sql, ...params) {
    return this.db.prepare(sql).get(...params) || null;
  }
  scalar(sql, ...params) {
    const row = this.row(sql, ...params);
    return row ? Number(Object.values(row)[0] || 0) : 0;
  }
}

function makeEnv() {
  const DB = new SQLiteD1Adapter();
  DB.db.exec(fs.readFileSync(path.join(root, 'cloudflare-d1/migrations/0001_init.sql'), 'utf8'));
  return {
    DB,
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: SECRET,
    TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true'
  };
}

async function authHeaders() {
  const token = await issueEdgeSessionToken({ sub: 'ci-reconcile-admin', role: 'admin' }, SECRET, Math.floor(Date.now() / 1000), 300);
  return {
    Origin: 'https://fawakhry.github.io',
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

async function createOrder(env, suffix) {
  const response = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      clientRequestId: `reconcile-${suffix}`,
      orderId: `CW-RECON-${suffix}`,
      customerPhone: '01001112233',
      customerName: 'عميل اختبار Reconciliation',
      status: 'cloud-draft',
      total: 100
    })
  }), env);
  assert.equal(response.status, 201);
  return response.json();
}

async function testSuccessRetryAndTerminalFailure() {
  const env = makeEnv();

  // SUCCESS: transport is called exactly once and a second reconciliation pass is idle.
  await createOrder(env, 'SUCCESS');
  let successCalls = 0;
  const successNow = Date.now() + 1000;
  const synced = await reconcileNextOutboxItem(env, async (job) => {
    successCalls += 1;
    assert.equal(job.entityId, 'CW-RECON-SUCCESS');
    assert.equal(job.operation, 'upsert_order_to_sheets');
    return { success: true, orderId: job.entityId, note: 'isolated Sheets ACK' };
  }, { nowMs: successNow, maxAttempts: 3 });

  assert.equal(synced.state, 'synced');
  assert.equal(successCalls, 1);
  assert.equal(env.DB.row("SELECT status FROM cloud_write_outbox WHERE entity_id='CW-RECON-SUCCESS'").status, 'synced');
  assert.equal(env.DB.row("SELECT sheets_status FROM cloud_write_events WHERE entity_id='CW-RECON-SUCCESS'").sheets_status, 'synced');

  const idle = await reconcileNextOutboxItem(env, async () => {
    successCalls += 1;
    return { success: true };
  }, { nowMs: successNow + 1000, maxAttempts: 3 });
  assert.equal(idle.state, 'idle');
  assert.equal(successCalls, 1, 'synced event must never be transported twice');

  // RETRY: first transport failure schedules backoff; no early retry; next due pass succeeds.
  await createOrder(env, 'RETRY');
  const retryNow = Date.now() + 2000;
  let retryCalls = 0;
  const retry = await reconcileNextOutboxItem(env, async () => {
    retryCalls += 1;
    throw new Error('simulated Sheets timeout');
  }, { nowMs: retryNow, maxAttempts: 3 });

  assert.equal(retry.state, 'retry');
  assert.equal(retry.attempts, 1);
  assert.equal(retryCalls, 1);
  let retryRow = env.DB.row("SELECT status,attempts,next_attempt_at AS nextAttemptAt FROM cloud_write_outbox WHERE entity_id='CW-RECON-RETRY'");
  assert.equal(retryRow.status, 'retry');
  assert.equal(Number(retryRow.attempts), 1);
  assert.equal(env.DB.row("SELECT sheets_status FROM cloud_write_events WHERE entity_id='CW-RECON-RETRY'").sheets_status, 'retrying');

  const tooEarly = await reconcileNextOutboxItem(env, async () => {
    retryCalls += 1;
    return { success: true, orderId: 'CW-RECON-RETRY' };
  }, { nowMs: Date.parse(retry.nextAttemptAt) - 1, maxAttempts: 3 });
  assert.equal(tooEarly.state, 'idle');
  assert.equal(retryCalls, 1);

  const retriedSuccess = await reconcileNextOutboxItem(env, async (job) => {
    retryCalls += 1;
    return { success: true, orderId: job.entityId };
  }, { nowMs: Date.parse(retry.nextAttemptAt) + 1, maxAttempts: 3 });
  assert.equal(retriedSuccess.state, 'synced');
  assert.equal(retriedSuccess.attempts, 2);
  assert.equal(retryCalls, 2);
  retryRow = env.DB.row("SELECT status,attempts FROM cloud_write_outbox WHERE entity_id='CW-RECON-RETRY'");
  assert.equal(retryRow.status, 'synced');
  assert.equal(Number(retryRow.attempts), 2);

  // TERMINAL FAILURE: with maxAttempts=1 a bad/mismatched ACK becomes failed, never synced.
  await createOrder(env, 'FAIL');
  const failed = await reconcileNextOutboxItem(env, async () => ({
    success: true,
    orderId: 'WRONG-ORDER-ID'
  }), { nowMs: Date.now() + 3000, maxAttempts: 1 });

  assert.equal(failed.state, 'failed');
  assert.match(failed.error, /entity mismatch/);
  assert.equal(env.DB.row("SELECT status FROM cloud_write_outbox WHERE entity_id='CW-RECON-FAIL'").status, 'failed');
  assert.equal(env.DB.row("SELECT sheets_status FROM cloud_write_events WHERE entity_id='CW-RECON-FAIL'").sheets_status, 'failed');

  assert.equal(env.DB.scalar("SELECT COUNT(*) FROM cloud_write_outbox WHERE status='processing'"), 0);
  console.log('Cloud Write Reconciliation SQLite V1: SINGLE-ACK + RETRY/BACKOFF + TERMINAL-FAIL PASS');
}

await testSuccessRetryAndTerminalFailure();
