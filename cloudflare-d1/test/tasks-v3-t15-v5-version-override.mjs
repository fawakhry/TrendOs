import assert from 'node:assert/strict';

const moduleUrl = new URL('../dashboard/tasks-v3-t15-preview-worker-v5-version-override.single.mjs', import.meta.url);
const worker = (await import(moduleUrl)).default;

class FakeStatement {
  constructor(db) {
    this.db = db;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async first() {
    return this.db.row ? { ...this.db.row } : null;
  }
  async run() {
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
}

class FakeDb {
  constructor() { this.row = null; }
  prepare() { return new FakeStatement(this); }
}

let serviceCalls = 0;
const service = {
  async fetch(request) {
    serviceCalls += 1;
    assert.equal(request.method, 'POST');
    assert.equal(new URL(request.url).hostname, 'tasks-v3-t1.internal');
    assert.equal(
      request.headers.get('Cloudflare-Workers-Version-Overrides'),
      'trendos-tasks-v3-t1-preview-20260914="daf384a9-27ae-4260-bf53-1757555caca0"'
    );
    const payload = await request.json();
    assert.equal(payload.op, 'status');
    return Response.json({
      success: true,
      code: 'OK',
      status: 200,
      body: {
        success: true,
        version: 'TASKS_V3_READONLY_T0',
        operator: 'wael-preview',
        role: 'WAEL',
        activeTask: null,
        flyPrint: { success: true, lane: 'flyPrint', rows: [], count: 0 },
        pressCandidates: { success: true, lane: 'press', rows: [], count: 0 }
      }
    });
  }
};

const db = new FakeDb();
const env = {
  TASKS_V3_PREVIEW_DB: db,
  TASKS_V3_T1_SERVICE: service,
  TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS: '180'
};

let waited;
const ctx = { waitUntil(promise) { waited = promise; } };
await worker.scheduled({}, env, ctx);
assert.ok(waited, 'scheduled must register waitUntil');
await waited;
assert.equal(serviceCalls, 1, 'successful refresh should use one pinned service-binding status call');
assert.ok(db.row, 'scheduled refresh must persist a D1 snapshot');
assert.equal(db.row.snapshot_key, 'wael-preview');
assert.equal(db.row.snapshot_version, 'TASKS_V3_T15_D1_PREVIEW_5_VERSION_OVERRIDE');

const response = await worker.fetch(
  new Request('https://preview.invalid/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ op: 'status', operator: 'wael-preview', role: 'WAEL' })
  }),
  env
);
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.success, true);
assert.equal(body.replica.snapshotVersion, 'TASKS_V3_T15_D1_PREVIEW_5_VERSION_OVERRIDE');

console.log('TASKS_V3_T15_V5_VERSION_OVERRIDE_PASS');
