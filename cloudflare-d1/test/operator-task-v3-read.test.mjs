import assert from 'node:assert/strict';
import { issueEdgeSessionToken } from '../src/edge-gateway.mjs';
import { handleOperatorTaskV3ReadRequest } from '../src/operator-task-v3-read.mjs';

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
    this.db.reads += 1;
    if (/operator_task_v3_projection_meta/.test(this.sql)) return this.db.meta;
    if (/FROM operator_task_v3_projection/.test(this.sql) && /LIMIT 1/.test(this.sql)) {
      const lane = this.args[0];
      return this.db.rows.find((row) => row.lane === lane && ['ELIGIBLE', 'READY'].includes(row.eligibility)) || null;
    }
    return null;
  }
  async all() {
    this.db.reads += 1;
    if (/GROUP BY lane/.test(this.sql)) {
      return {
        results: [
          { lane: 'PRINT', eligibleCount: 2, flyPrintCount: 1, pressCount: 1 },
          { lane: 'LASER', eligibleCount: 1, flyPrintCount: 0, pressCount: 0 }
        ]
      };
    }
    if (/fly_print = 1/.test(this.sql)) {
      return { results: this.db.rows.filter((row) => row.flyPrint === 1 && ['ELIGIBLE', 'READY'].includes(row.eligibility)) };
    }
    if (/press_candidate = 1/.test(this.sql)) {
      return { results: this.db.rows.filter((row) => row.pressCandidate === 1 && ['ELIGIBLE', 'READY'].includes(row.eligibility)) };
    }
    return { results: [] };
  }
  async run() {
    this.db.writes += 1;
    throw new Error('T4 read endpoint must never write D1');
  }
}

class FakeDb {
  constructor({ stale = false } = {}) {
    this.calls = [];
    this.reads = 0;
    this.writes = 0;
    this.meta = {
      status: 'ready',
      syncedAtMs: Date.now() - (stale ? 900_000 : 10_000),
      sourceLastRow: 5000,
      rowCount: 3,
      sourceVersion: 'test-v1',
      note: 'test projection'
    };
    this.rows = [
      {
        lineId: '4001-01', orderId: '4001', sourceRowNumber: 100,
        sourceFingerprint: 'fp-print-1', lane: 'PRINT', department: 'طباعة',
        priority: 'عاجل', expectedDelivery: '2026-09-13', sourceStatus: 'طلب جديد',
        eligibility: 'ELIGIBLE', flyPrint: 1, pressCandidate: 0,
        customerName: 'Customer A', itemName: 'Print Item', quantity: 2, updatedAtMs: Date.now() - 20000
      },
      {
        lineId: '4002-01', orderId: '4002', sourceRowNumber: 101,
        sourceFingerprint: 'fp-print-2', lane: 'PRINT', department: 'طباعة',
        priority: 'عادي', expectedDelivery: '2026-09-14', sourceStatus: 'بدأ التنفيذ',
        eligibility: 'READY', flyPrint: 0, pressCandidate: 1,
        customerName: 'Customer B', itemName: 'Press Item', quantity: 1, updatedAtMs: Date.now() - 10000
      },
      {
        lineId: '4003-01', orderId: '4003', sourceRowNumber: 102,
        sourceFingerprint: 'fp-laser-1', lane: 'LASER', department: 'ليزر',
        priority: 'عادي', expectedDelivery: '2026-09-15', sourceStatus: 'طلب جديد',
        eligibility: 'ELIGIBLE', flyPrint: 0, pressCandidate: 0,
        customerName: 'Customer C', itemName: 'Laser Item', quantity: 3, updatedAtMs: Date.now() - 5000
      }
    ];
  }
  prepare(sql) { return new FakeStatement(this, sql); }
}

function env(db, enabled = true) {
  return {
    DB: db,
    EDGE_SESSION_SECRET: 'test-only-edge-secret-that-is-not-production',
    TRENDOS_OPERATOR_TASK_V3_READ_ENABLED: enabled ? 'true' : 'false',
    TRENDOS_OPERATOR_TASK_V3_MAX_AGE_SECONDS: '300',
    TRENDOS_OPERATOR_TASK_V3_LANE_LIMIT: '25',
    CORS_ORIGINS: 'https://fawakhry.github.io'
  };
}

async function tokenFor(subject, secret) {
  const now = Math.floor(Date.now() / 1000);
  return issueEdgeSessionToken({ sub: subject }, secret, now, 600);
}

async function requestFor(token, method = 'GET') {
  return new Request('https://edge.test/v1/operator/tasks/v3/status', {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      origin: 'https://fawakhry.github.io'
    }
  });
}

async function testDefaultOffTouchesNoDb() {
  const db = new FakeDb();
  const e = env(db, false);
  const token = await tokenFor('wael', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token), e);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, 'OPERATOR_TASK_V3_READ_DISABLED');
  assert.equal(db.reads, 0);
  assert.equal(db.writes, 0);
}

async function testWaelReadIsD1OnlyAndReadOnly() {
  const db = new FakeDb();
  const e = env(db);
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Apps Script/network must not be called by T4 status');
  };
  const token = await tokenFor('wael', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token), e);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.readOnly, true);
  assert.equal(body.mutationsEnabled, false);
  assert.equal(body.dataSource, 'd1-task-v3-projection');
  assert.equal(body.role, 'WAEL');
  assert.equal(body.nextCandidate.lineId, '4001-01');
  assert.equal(body.nextCandidate.lane, 'PRINT');
  assert.equal(body.flyPrint.count, 1);
  assert.equal(body.flyPrint.rows[0].lineId, '4001-01');
  assert.equal(body.pressCandidates.count, 1);
  assert.equal(body.pressCandidates.rows[0].lineId, '4002-01');
  assert.equal(fetchCalls, 0);
  assert.equal(db.writes, 0);
  assert.ok(db.reads >= 4);
}

async function testGaberSeesLaserWithoutPrintLanes() {
  const db = new FakeDb();
  const e = env(db);
  const token = await tokenFor('gaber', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token), e);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.role, 'GABER');
  assert.equal(body.nextCandidate.lineId, '4003-01');
  assert.equal(body.nextCandidate.lane, 'LASER');
  assert.equal('flyPrint' in body, false);
  assert.equal('pressCandidates' in body, false);
  assert.equal(db.writes, 0);
}

async function testManagerGetsMetricsOnlyNoDispatchCandidate() {
  const db = new FakeDb();
  const e = env(db);
  const token = await tokenFor('diaa', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token), e);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.role, 'MANAGER');
  assert.equal(body.nextCandidate, null);
  assert.equal(body.metrics.PRINT.eligible, 2);
  assert.equal(body.metrics.LASER.eligible, 1);
  assert.equal(db.writes, 0);
}

async function testPostIsRejectedBeforeBusinessRead() {
  const db = new FakeDb();
  const e = env(db);
  const token = await tokenFor('wael', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token, 'POST'), e);
  const body = await response.json();
  assert.equal(response.status, 405);
  assert.equal(body.code, 'METHOD_NOT_ALLOWED');
  assert.equal(db.reads, 0);
  assert.equal(db.writes, 0);
}

async function testStaleProjectionFailsClosed() {
  const db = new FakeDb({ stale: true });
  const e = env(db);
  const token = await tokenFor('wael', e.EDGE_SESSION_SECRET);
  const response = await handleOperatorTaskV3ReadRequest(await requestFor(token), e);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, 'OPERATOR_TASK_V3_PROJECTION_STALE');
  assert.equal(body.success, false);
  assert.equal(db.writes, 0);
}

try {
  await testDefaultOffTouchesNoDb();
  await testWaelReadIsD1OnlyAndReadOnly();
  await testGaberSeesLaserWithoutPrintLanes();
  await testManagerGetsMetricsOnlyNoDispatchCandidate();
  await testPostIsRejectedBeforeBusinessRead();
  await testStaleProjectionFailsClosed();
  console.log('OPERATOR_TASK_V3_T4_READ_PROJECTION=PASS');
  console.log('TASK_STATUS_APPS_SCRIPT_CALLS=0');
  console.log('TASK_STATUS_D1_WRITES=0');
  console.log('TASK_MUTATION_ROUTES=0');
  console.log('TASK_V3_READ_DEFAULT_ENABLED=NO');
  console.log('STALE_PROJECTION_FAIL_CLOSED=YES');
} finally {
  globalThis.fetch = originalFetch;
}
