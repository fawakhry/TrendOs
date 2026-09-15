import assert from 'node:assert/strict';
import worker from '../dashboard/tasks-v3-t15-preview-worker-v3.single.mjs';

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async run() {
    assert.match(this.sql, /INSERT\s+INTO\s+tasks_v3_t15_read_snapshot/i);
    const [snapshotKey, refreshedAt, healthJson, statusJson, snapshotVersion] = this.args;
    this.db.row = {
      snapshot_key: snapshotKey,
      refreshed_at: refreshedAt,
      source_health_json: healthJson,
      source_status_json: statusJson,
      snapshot_version: snapshotVersion
    };
    return { success: true };
  }
  async first() {
    return this.db.row ? { ...this.db.row } : null;
  }
}

class FakeDb {
  constructor() {
    this.row = null;
  }
  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

const db = new FakeDb();
const env = {
  TASKS_V3_PREVIEW_DB: db,
  TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS: '180',
  TASKS_V3_T1_SOURCE_URL: 'https://example.invalid/t1-preview'
};

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, init) => {
  fetchCalls += 1;
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['content-type'], 'application/json');
  assert.equal(init.headers.accept, 'application/json');
  assert.match(init.headers['user-agent'], /Mozilla\/5\.0/);

  const payload = JSON.parse(init.body);
  assert.equal(payload.op, 'status');
  assert.equal(payload.operator, 'wael-preview');
  assert.equal(payload.role, 'WAEL');

  return new Response(JSON.stringify({
    success: true,
    code: 'OK',
    status: 200,
    body: {
      success: true,
      version: 'TASKS_V3_READONLY_T0',
      operator: 'wael-preview',
      role: 'WAEL',
      activeTask: { taskId: 'PREVIEW-TASK-001', state: 'STARTED' },
      flyPrint: {
        success: true,
        lane: 'flyPrint',
        rows: [{ lineId: 'PREVIEW-LINE-001' }],
        count: 1
      },
      pressCandidates: {
        success: true,
        lane: 'press',
        rows: [{ lineId: 'PREVIEW-LINE-002' }],
        count: 1
      }
    }
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

const pending = [];
const ctx = {
  waitUntil(promise) {
    pending.push(Promise.resolve(promise));
  }
};

try {
  await worker.scheduled({}, env, ctx);
  assert.equal(pending.length, 1, 'scheduled() must register exactly one waitUntil promise');
  await Promise.all(pending);

  assert.equal(fetchCalls, 1, 'healthy refresh should use one status source call');
  assert.ok(db.row, 'scheduled refresh must persist a D1 snapshot');
  assert.equal(db.row.snapshot_key, 'wael-preview');
  assert.equal(db.row.snapshot_version, 'TASKS_V3_T15_D1_PREVIEW_3');

  const health = JSON.parse(db.row.source_health_json);
  const status = JSON.parse(db.row.source_status_json);
  assert.equal(health.success, true);
  assert.equal(status.success, true);
  assert.equal(status.flyPrint.success, true);
  assert.equal(status.pressCandidates.success, true);

  console.log('TASKS_V3_T15_SCHEDULED_HANDLER_DIRECT_PASS');
} finally {
  globalThis.fetch = originalFetch;
}
