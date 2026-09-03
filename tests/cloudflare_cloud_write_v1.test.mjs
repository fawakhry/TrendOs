import assert from 'node:assert/strict';
import { issueEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';
import { handleCloudWriteRequest, isCloudWritePath } from '../cloudflare-d1/src/cloud-write.mjs';

const SECRET = 'test-cloud-write-secret-20260903';

class MockStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('SELECT 1 AS ok')) return { ok: 1 };
    if (compact.includes('COUNT(*) AS count FROM cloud_write_outbox')) {
      return { count: Array.from(this.db.outbox.values()).filter((row) => row.status === 'pending').length };
    }
    if (compact.includes('FROM cloud_write_events') && compact.includes('WHERE idempotency_key')) {
      const row = this.db.events.get(this.params[0]);
      return row || null;
    }
    if (compact.includes('FROM orders') && compact.includes('WHERE order_id')) {
      const row = this.db.orders.get(this.params[0]);
      return row ? { orderId: row.orderId } : null;
    }
    return null;
  }

  async all() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('FROM cloud_write_outbox')) {
      const [status, limit] = this.params;
      return { results: Array.from(this.db.outbox.values()).filter((row) => row.status === status).slice(0, limit) };
    }
    return { results: [] };
  }

  async run() {
    return { success: true };
  }
}

class MockDB {
  constructor() {
    this.orders = new Map();
    this.events = new Map();
    this.outbox = new Map();
    this.nextOutboxId = 1;
  }

  prepare(sql) {
    return new MockStatement(this, sql);
  }

  async batch(statements) {
    for (const stmt of statements) {
      const compact = stmt.sql.replace(/\s+/g, ' ');
      if (compact.includes('INSERT INTO orders')) {
        this.orders.set(stmt.params[0], {
          orderId: stmt.params[0],
          customerPhone: stmt.params[1],
          customerName: stmt.params[2],
          status: stmt.params[3]
        });
      } else if (compact.includes('INSERT INTO cloud_write_events')) {
        this.events.set(stmt.params[0], {
          idempotencyKey: stmt.params[0],
          entityType: 'order',
          entityId: stmt.params[1],
          operation: 'create',
          status: 'd1_committed',
          actor: stmt.params[2],
          resultJson: stmt.params[4],
          sheetsStatus: 'pending',
          createdAt: 'mock-created',
          updatedAt: 'mock-updated'
        });
      } else if (compact.includes('INSERT INTO cloud_write_outbox')) {
        const id = this.nextOutboxId++;
        this.outbox.set(id, {
          id,
          eventKey: stmt.params[0],
          entityType: 'order',
          entityId: stmt.params[1],
          operation: 'upsert_order_to_sheets',
          status: 'pending',
          attempts: 0,
          nextAttemptAt: 'mock-next',
          lastError: '',
          createdAt: 'mock-created',
          updatedAt: 'mock-updated'
        });
      }
    }
    return statements.map(() => ({ success: true }));
  }
}

function env(overrides = {}) {
  return {
    DB: new MockDB(),
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: SECRET,
    TRENDOS_CLOUD_WRITE_V1_ENABLED: 'false',
    ...overrides
  };
}

async function authedHeaders() {
  const token = await issueEdgeSessionToken({ sub: 'diaa' }, SECRET);
  return {
    Origin: 'https://fawakhry.github.io',
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

async function testRoutesAndDefaultOff() {
  assert.equal(isCloudWritePath('/v1/cloud/write/health'), true);
  assert.equal(isCloudWritePath('/v1/cloud/orders'), true);
  assert.equal(isCloudWritePath('/v1/orders'), false);

  const offEnv = env();
  const health = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/write/health'), offEnv);
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.equal(body.success, true);
  assert.equal(body.enabled, false);
  assert.equal(body.cutover, false);
  assert.equal(body.sheetsAuthoritative, true);

  const blocked = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: await authedHeaders(),
    body: JSON.stringify({ clientRequestId: 'req-1', orderId: 'CW-1' })
  }), offEnv);
  assert.equal(blocked.status, 423);
}

async function testAuthRequiredWhenEnabled() {
  const enabledEnv = env({ TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true' });
  const response = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers: { Origin: 'https://fawakhry.github.io', 'content-type': 'application/json' },
    body: JSON.stringify({ clientRequestId: 'req-auth', orderId: 'CW-AUTH' })
  }), enabledEnv);
  assert.equal(response.status, 401);
}

async function testCreateOrderAndIdempotency() {
  const enabledEnv = env({ TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true' });
  const headers = await authedHeaders();
  const payload = {
    clientRequestId: 'req-create-1',
    orderId: 'CW-1001',
    customerPhone: '0100 123 4567',
    customerName: 'عميل اختبار',
    status: 'cloud-draft',
    total: '150.50'
  };

  const created = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }), enabledEnv);
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.success, true);
  assert.equal(createdBody.order.orderId, 'CW-1001');
  assert.equal(createdBody.event.sheetsStatus, 'pending');
  assert.equal(enabledEnv.DB.orders.has('CW-1001'), true);
  assert.equal(enabledEnv.DB.events.has('order:create:req-create-1'), true);
  assert.equal(enabledEnv.DB.outbox.size, 1);

  const duplicate = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }), enabledEnv);
  assert.equal(duplicate.status, 200);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.idempotent, true);
  assert.equal(enabledEnv.DB.outbox.size, 1);

  const conflict = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({ clientRequestId: 'req-create-2', orderId: 'CW-1001' })
  }), enabledEnv);
  assert.equal(conflict.status, 409);
}

async function testOutboxReadRequiresAuthAndFlag() {
  const enabledEnv = env({ TRENDOS_CLOUD_WRITE_V1_ENABLED: 'true' });
  const headers = await authedHeaders();
  await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({ clientRequestId: 'req-outbox', orderId: 'CW-OUTBOX' })
  }), enabledEnv);
  const response = await handleCloudWriteRequest(new Request('https://worker.test/v1/cloud/write/outbox?status=pending', {
    headers
  }), enabledEnv);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.outbox.length, 1);
  assert.equal(body.outbox[0].entityId, 'CW-OUTBOX');
}

await testRoutesAndDefaultOff();
await testAuthRequiredWhenEnabled();
await testCreateOrderAndIdempotency();
await testOutboxReadRequiresAuthAndFlag();

console.log('Cloudflare Cloud Write V1 tests: PASS');
