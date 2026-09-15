import assert from 'node:assert/strict';
import fs from 'node:fs';

const moduleUrl = new URL('../dashboard/tasks-v3-t15-preview-worker-v4-service-binding.single.mjs', import.meta.url);
const worker = (await import(moduleUrl)).default;

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
  prepare(sql) { return new FakeStatement(this, sql); }
}

let serviceCalls = 0;
const service = {
  async fetch(request) {
    serviceCalls += 1;
    assert.equal(request.method, 'POST');
    assert.equal(new URL(request.url).hostname, 'tasks-v3-t1.internal');
    assert.match(request.headers.get('user-agent') || '', /TrendOS-T15-Preview-Refresh/);
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
assert.equal(serviceCalls, 1, 'successful refresh should use one service-binding status call');
assert.ok(db.row, 'scheduled refresh must persist a D1 snapshot');
assert.equal(db.row.snapshot_key, 'wael-preview');
assert.equal(db.row.snapshot_version, 'TASKS_V3_T15_D1_PREVIEW_4_SERVICE_BINDING');

const readResponse = await worker.fetch(
  new Request('https://preview.invalid/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ op: 'status', operator: 'wael-preview', role: 'WAEL' })
  }),
  env
);
assert.equal(readResponse.status, 200);
const readBody = await readResponse.json();
assert.equal(readBody.success, true);
assert.equal(readBody.replica.source, 'D1_READ_REPLICA');

const sourceText = fs.readFileSync(moduleUrl, 'utf8');
assert.equal(sourceText.includes('TASKS_V3_T1_SOURCE_URL'), false, 'v4 must not depend on public source URL');
assert.equal(sourceText.includes('TASKS_V3_T1_SERVICE'), true, 'v4 must require service binding');

console.log('TASKS_V3_T15_V4_SERVICE_BINDING_PASS');
