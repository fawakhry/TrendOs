import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { issueEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';
import { handleCloudWriteRequest } from '../cloudflare-d1/src/cloud-write-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'sqlite-integration-secret-20260904';

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
    this.failBatchAt = 0;
  }
  prepare(sql) {
    return new SQLiteStatementAdapter(this, sql);
  }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const results = [];
      for (let i = 0; i < statements.length; i += 1) {
        if (this.failBatchAt && i + 1 === this.failBatchAt) {
          throw new Error(`Injected D1 batch failure at statement ${i + 1}`);
        }
        results.push(await statements[i].run());
      }
      this.db.exec('COMMIT;');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
  scalar(sql, ...params) {
    const row = this.db.prepare(sql).get(...params);
    if (!row) return 0;
    return Number(Object.values(row)[0] || 0);
  }
}

function makeEnv() {
  const DB = new SQLiteD1Adapter();
  const migration = fs.readFileSync(path.join(root, 'cloudflare-d1/migrations/0001_init.sql'), 'utf8');
  DB.db.exec(migration);
  return {
    DB,
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: SECRET,
    TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true'
  };
}

async function headers() {
  const token = await issueEdgeSessionToken({ sub: 'ci-sqlite-write' }, SECRET, Math.floor(Date.now() / 1000), 300);
  return {
    Origin: 'https://fawakhry.github.io',
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

async function create(env, payload) {
  return handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(payload)
  }), env);
}

async function testRealSqlSuccessIdempotencyAndRollback() {
  const env = makeEnv();

  // Success path exercises the real SQL against an isolated SQLite/D1-compatible DB.
  const successPayload = {
    clientRequestId: 'sqlite-success-1',
    orderId: 'CW-SQLITE-1001',
    customerPhone: '0100 111 2233',
    customerName: 'عميل اختبار تكاملي',
    status: 'cloud-draft',
    total: '250.75',
    remaining: '100.25'
  };
  const created = await create(env, successPayload);
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.success, true);
  assert.equal(body.order.orderId, 'CW-SQLITE-1001');
  assert.equal(body.event.sheetsStatus, 'pending');
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM orders WHERE order_id = ?', 'CW-SQLITE-1001'), 1);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_events WHERE entity_id = ?', 'CW-SQLITE-1001'), 1);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_outbox WHERE entity_id = ?', 'CW-SQLITE-1001'), 1);

  // Same idempotency key must never duplicate order/event/outbox rows.
  const duplicate = await create(env, successPayload);
  assert.equal(duplicate.status, 200);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.success, true);
  assert.equal(duplicateBody.idempotent, true);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM orders WHERE order_id = ?', 'CW-SQLITE-1001'), 1);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_events WHERE entity_id = ?', 'CW-SQLITE-1001'), 1);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_outbox WHERE entity_id = ?', 'CW-SQLITE-1001'), 1);

  // Inject a failure inside the authoritative batch. Transaction rollback must leave
  // no partial customer/order/event/outbox state for the failed request.
  env.DB.failBatchAt = 3;
  const failedPayload = {
    clientRequestId: 'sqlite-rollback-1',
    orderId: 'CW-SQLITE-ROLLBACK',
    customerPhone: '0109 999 8877',
    customerName: 'عميل يجب أن يرجع Rollback',
    status: 'cloud-draft',
    total: '999.00'
  };
  const failed = await create(env, failedPayload);
  assert.equal(failed.status, 500);
  const failedBody = await failed.json();
  assert.equal(failedBody.success, false);
  assert.match(String(failedBody.message || ''), /Injected D1 batch failure/);

  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM customers WHERE phone = ?', '01099998877'), 0);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM orders WHERE order_id = ?', 'CW-SQLITE-ROLLBACK'), 0);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_events WHERE entity_id = ?', 'CW-SQLITE-ROLLBACK'), 0);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_outbox WHERE entity_id = ?', 'CW-SQLITE-ROLLBACK'), 0);

  // Previously committed data must survive an unrelated failed transaction.
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM orders WHERE order_id = ?', 'CW-SQLITE-1001'), 1);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM cloud_write_outbox WHERE entity_id = ?', 'CW-SQLITE-1001'), 1);

  console.log('Cloud Write SQLite integration: SUCCESS + IDEMPOTENCY + ROLLBACK PASS');
}

await testRealSqlSuccessIdempotencyAndRollback();
