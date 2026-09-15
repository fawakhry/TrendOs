import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  readTasksV3T15Preview,
  refreshTasksV3T15Snapshot
} from '../src/tasks-v3-t15-d1-preview.mjs';

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
    if (!/SELECT\s+snapshot_key/i.test(this.sql)) throw new Error('unexpected first SQL');
    return this.db.row ? { ...this.db.row } : null;
  }
  async run() {
    if (!/INSERT\s+INTO\s+tasks_v3_t15_read_snapshot/i.test(this.sql)) {
      throw new Error('unexpected run SQL');
    }
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
  TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS: '180'
};

let proxyCalls = 0;
const fakeProxy = async ({ op }) => {
  proxyCalls += 1;
  if (op === 'health') {
    return {
      success: true,
      code: 'OK',
      status: 200,
      body: {
        success: true,
        version: 'TASKS_V3_READONLY_T0',
        spreadsheetConfigured: true,
        indexReady: true,
        ledgerReady: true,
        readOnly: true,
        diagnostic: { totalBridgeMs: 999 }
      }
    };
  }
  if (op === 'status') {
    return {
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
    };
  }
  throw new Error('unexpected proxy op');
};

const refreshed = await refreshTasksV3T15Snapshot({
  env,
  nowSeconds: 1000,
  proxyImpl: fakeProxy
});
assert.equal(refreshed.success, true);
assert.equal(proxyCalls, 2, 'refresh should use exactly health + status upstream calls');
assert.ok(db.row, 'snapshot row must be persisted');
assert.equal(JSON.parse(db.row.source_health_json).diagnostic, undefined, 'diagnostic must not be persisted');

for (const op of ['health', 'status', 'flyPrint', 'pressCandidates']) {
  const result = await readTasksV3T15Preview({
    env,
    op,
    operator: 'wael-preview',
    role: 'WAEL',
    nowSeconds: 1050
  });
  assert.equal(result.success, true, `${op} should succeed from D1 snapshot`);
  assert.equal(result.code, 'OK');
  assert.equal(result.replica.source, 'D1_READ_REPLICA');
  assert.equal(result.replica.authoritativeSource, 'SHEETS');
  assert.equal(result.replica.ageSeconds, 50);
}
assert.equal(proxyCalls, 2, 'read path must not call Apps Script proxy');

const stale = await readTasksV3T15Preview({
  env,
  op: 'status',
  operator: 'wael-preview',
  role: 'WAEL',
  nowSeconds: 1181
});
assert.equal(stale.success, false);
assert.equal(stale.code, 'TASKS_V3_T15_REPLICA_STALE');
assert.equal(stale.httpStatus, 503);

const forbiddenRole = await readTasksV3T15Preview({
  env,
  op: 'status',
  operator: 'wael-preview',
  role: 'GABER',
  nowSeconds: 1050
});
assert.equal(forbiddenRole.success, false);
assert.equal(forbiddenRole.code, 'TASKS_V3_T15_ROLE_FORBIDDEN');

const forbiddenOp = await readTasksV3T15Preview({
  env,
  op: 'claimNext',
  operator: 'wael-preview',
  role: 'WAEL',
  nowSeconds: 1050
});
assert.equal(forbiddenOp.success, false);
assert.equal(forbiddenOp.code, 'TASKS_V3_T15_OPERATION_FORBIDDEN');

const workerSource = fs.readFileSync(
  new URL('../src/tasks-v3-t15-preview-worker.mjs', import.meta.url),
  'utf8'
);
assert.equal(workerSource.includes('TASKS_V3_APPS_SCRIPT_URL'), false, 'fetch worker must not reference Apps Script URL');
assert.equal(workerSource.includes('proxyTasksV3ReadonlyPreview'), false, 'fetch worker must not call upstream proxy');
assert.equal(workerSource.includes("upstream;dur=0.00"), true, 'server timing must prove zero synchronous upstream');

console.log('TASKS_V3_T15_PREVIEW_CONTRACT_PASS');
