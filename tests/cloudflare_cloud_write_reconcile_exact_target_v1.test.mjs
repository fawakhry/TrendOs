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
const SECRET = 'exact-target-isolated-secret-20260905';

class SQLiteStatementAdapter {
  constructor(owner, sql) { this.owner = owner; this.sql = sql; this.params = []; }
  bind(...params) { this.params = params; return this; }
  async first() { return this.owner.db.prepare(this.sql).get(...this.params) || null; }
  async all() { return { results: this.owner.db.prepare(this.sql).all(...this.params) }; }
  async run() { return this.owner.db.prepare(this.sql).run(...this.params); }
}

class SQLiteD1Adapter {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  prepare(sql) { return new SQLiteStatementAdapter(this, sql); }
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
  row(sql, ...params) { return this.db.prepare(sql).get(...params) || null; }
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
  const token = await issueEdgeSessionToken({ sub: 'ci-exact-target' }, SECRET, Math.floor(Date.now() / 1000), 300);
  return {
    Origin: 'https://fawakhry.github.io',
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

async function createOrder(env, orderId, requestId) {
  const response = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      clientRequestId: requestId,
      orderId,
      customerName: 'Exact target qualification test',
      status: 'cloud-draft',
      total: 0,
      remaining: 0
    })
  }), env);
  assert.equal(response.status, 201);
}

const env = makeEnv();
await createOrder(env, 'CW-DECOY-OLDER', 'decoy-older');
await createOrder(env, 'CW-TARGET-ONLY', 'target-only');

let calls = 0;
const result = await reconcileNextOutboxItem(env, async (job) => {
  calls += 1;
  assert.equal(job.entityType, 'order');
  assert.equal(job.entityId, 'CW-TARGET-ONLY');
  assert.equal(job.operation, 'upsert_order_to_sheets');
  return { success: true, entityId: job.entityId, note: 'exact-target-test-ack' };
}, {
  nowMs: Date.now() + 1000,
  maxAttempts: 3,
  targetEntityType: 'order',
  targetEntityId: 'CW-TARGET-ONLY',
  targetOperation: 'upsert_order_to_sheets'
});

assert.equal(result.success, true);
assert.equal(result.state, 'synced');
assert.equal(result.entityId, 'CW-TARGET-ONLY');
assert.equal(calls, 1);
assert.equal(env.DB.row("SELECT status FROM cloud_write_outbox WHERE entity_id='CW-TARGET-ONLY'").status, 'synced');
assert.equal(env.DB.row("SELECT status FROM cloud_write_outbox WHERE entity_id='CW-DECOY-OLDER'").status, 'pending');
assert.equal(env.DB.row("SELECT sheets_status FROM cloud_write_events WHERE entity_id='CW-DECOY-OLDER'").sheets_status, 'pending');

const missing = await reconcileNextOutboxItem(env, async () => {
  calls += 1;
  return { success: true };
}, {
  nowMs: Date.now() + 2000,
  targetEntityType: 'order',
  targetEntityId: 'CW-DOES-NOT-EXIST',
  targetOperation: 'upsert_order_to_sheets'
});
assert.equal(missing.state, 'idle');
assert.equal(calls, 1);
assert.equal(env.DB.row("SELECT status FROM cloud_write_outbox WHERE entity_id='CW-DECOY-OLDER'").status, 'pending');

console.log('Cloud Write Reconciliation Exact Target V1: TARGET-ONLY SELECT/CLAIM + DECOY UNTOUCHED PASS');
