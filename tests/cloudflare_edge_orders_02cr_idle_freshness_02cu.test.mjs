import assert from 'node:assert/strict';
import fs from 'node:fs';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { guardEdgeOrders02CRFreshness } from '../cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs';

const NOW = Date.parse('2026-09-06T12:00:00Z');
const LINES_NOTE = 'TrendOS orders live sync V2 quota-aware';
const ENRICHMENT_NOTE = 'PERF-CF-02CR enrichment live sync V1';

function sqliteTime(ageSeconds) {
  return new Date(NOW - ageSeconds * 1000).toISOString().replace('T', ' ').replace('.000Z', '');
}

function catalog({ rows, cols, note, ageSeconds = 30, status = 'ready', rowCount = rows }) {
  return {
    sourceLastRow: rows,
    sourceLastCol: cols,
    rowCount,
    status,
    syncedAt: sqliteTime(ageSeconds),
    note
  };
}

function env(overrides = {}) {
  const catalogs = {
    'الأوردرات': catalog({ rows: 1200, cols: 30, note: LINES_NOTE, ageSeconds: 40000 }),
    'بنود الأوردرات': catalog({ rows: 2636, cols: 28, note: LINES_NOTE, ageSeconds: 40000 }),
    'العملاء': catalog({ rows: 500, cols: 15, note: ENRICHMENT_NOTE }),
    'عملاء منع التسليم بالمديونية': catalog({ rows: 20, cols: 8, note: ENRICHMENT_NOTE }),
    ...(overrides.catalogs || {})
  };
  return {
    EDGE_SESSION_SECRET: '02cu-test-secret',
    EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: overrides.heartbeatEnabled == null ? 'true' : String(overrides.heartbeatEnabled),
    EDGE_ORDERS_IDLE_HEARTBEAT_MAX_AGE_SECONDS: '720',
    DB: {
      prepare(sql) {
        assert.match(sql, /FROM\s+sheet_catalog/i, '02CR freshness guard must read metadata only');
        assert.doesNotMatch(sql, /sheet_rows/i, '02CR freshness guard must not read business rows');
        return {
          bind(sheetName) {
            return {
              async first() { return catalogs[sheetName] ? { ...catalogs[sheetName] } : null; }
            };
          }
        };
      }
    }
  };
}

function heartbeat(overrides = {}) {
  const linesRows = overrides.linesRows == null ? 2636 : overrides.linesRows;
  const sourceChanged = overrides.sourceChanged == null ? false : overrides.sourceChanged;
  return {
    success: true,
    lowUsage: true,
    lightweightIdleDetection: true,
    enabled: true,
    intervalMinutes: 5,
    lowUsageTriggerCount: 1,
    legacyV1TriggerCount: 0,
    directV2TriggerCount: 0,
    lightFingerprintPresent: true,
    lastError: null,
    consecutiveErrors: 0,
    unchangedD1Writes: 0,
    unchangedCloudflareRequests: 0,
    lastIdleCheck: {
      at: new Date(NOW - 30 * 1000).toISOString(),
      success: true,
      lowUsage: true,
      mode: 'unchanged-light-fingerprint-no-d1-request',
      sourceChanged,
      d1RequestMade: false,
      d1WriteMade: false,
      intervalMinutes: 5,
      source: [
        { sheetName: 'الأوردرات', sourceLastRow: 1200, sourceLastCol: 30, displayHash: 'orders-hash' },
        { sheetName: 'بنود الأوردرات', sourceLastRow: linesRows, sourceLastCol: 28, displayHash: 'lines-hash' }
      ]
    }
  };
}

const token = await issueOrdersEdgeToken(
  { sub: 'tester', role: 'print', department: 'طباعة', screens: ['print'] },
  '02cu-test-secret',
  Math.floor(NOW / 1000),
  600
);

function request(extra = '') {
  return new Request('https://edge.test/v1/edge/orders/02cr/page?screen=print&page=1&pageSize=20' + extra, {
    method: 'GET',
    headers: { authorization: 'Bearer ' + token, origin: 'https://fawakhry.github.io' }
  });
}

// Fresh Lines never need the Apps Script heartbeat.
{
  let heartbeatCalls = 0;
  const result = await guardEdgeOrders02CRFreshness(
    request(),
    env({ catalogs: { 'بنود الأوردرات': catalog({ rows: 2636, cols: 28, note: LINES_NOTE, ageSeconds: 30 }) } }),
    NOW,
    { fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); } }
  );
  assert.equal(result.pass, true);
  assert.equal(result.logicalFreshness, null);
  assert.equal(heartbeatCalls, 0);
}

// Old D1 write-time metadata is accepted only with a recent source-unchanged proof.
{
  let heartbeatCalls = 0;
  const result = await guardEdgeOrders02CRFreshness(request(), env(), NOW, {
    fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); }
  });
  assert.equal(result.pass, true);
  assert.equal(heartbeatCalls, 1);
  assert.equal(result.logicalFreshness.ok, true);
  assert.equal(result.logicalFreshness.mode, 'verified-idle-source-unchanged');
  assert.equal(result.logicalFreshness.source.lines.sourceLastRow, 2636);
  assert.equal(result.logicalFreshness.source.lines.sourceLastCol, 28);
}

// Source-shape mismatch fails closed.
{
  const result = await guardEdgeOrders02CRFreshness(request(), env(), NOW, {
    fetchIdleHeartbeat: async () => heartbeat({ linesRows: 2635 })
  });
  assert.equal(result.pass, false);
  assert.equal(result.response.status, 503);
  const body = await result.response.json();
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.code, '02cr-mirror-stale');
  assert.ok(body.idleHeartbeat.failedChecks.includes('linesSourceShapeMatches'));
}

// A heartbeat reporting source change can never extend logical freshness.
{
  const result = await guardEdgeOrders02CRFreshness(request(), env(), NOW, {
    fetchIdleHeartbeat: async () => heartbeat({ sourceChanged: true })
  });
  assert.equal(result.pass, false);
  const body = await result.response.json();
  assert.ok(body.idleHeartbeat.failedChecks.includes('sourceUnchanged'));
}

// Customer/restriction enrichment has no heartbeat proof and must remain physically fresh.
{
  let heartbeatCalls = 0;
  const staleCustomer = catalog({ rows: 500, cols: 15, note: ENRICHMENT_NOTE, ageSeconds: 400 });
  const result = await guardEdgeOrders02CRFreshness(
    request(),
    env({ catalogs: { 'العملاء': staleCustomer } }),
    NOW,
    { fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); } }
  );
  assert.equal(result.pass, false);
  assert.equal(heartbeatCalls, 0, 'stale enrichment must fail before heartbeat fetch');
  assert.equal((await result.response.json()).fallback, 'apps-script');
}

// Structural qualification is never bypassed by heartbeat.
{
  let heartbeatCalls = 0;
  const wrongLines = catalog({ rows: 2636, cols: 28, note: ENRICHMENT_NOTE, ageSeconds: 40000 });
  const result = await guardEdgeOrders02CRFreshness(
    request(),
    env({ catalogs: { 'بنود الأوردرات': wrongLines } }),
    NOW,
    { fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); } }
  );
  assert.equal(result.pass, false);
  assert.equal(heartbeatCalls, 0);
  assert.equal((await result.response.json()).code, '02cr-mirror-not-ready');
}

// If the verifier is OFF, stale Lines keep failing open to Apps Script.
{
  const result = await guardEdgeOrders02CRFreshness(request(), env({ heartbeatEnabled: 'false' }), NOW, {
    fetchIdleHeartbeat: async () => heartbeat()
  });
  assert.equal(result.pass, false);
  assert.equal((await result.response.json()).fallback, 'apps-script');
}

// Sensitive debt lane remains owned by Apps Script/original 02CR handler.
{
  let heartbeatCalls = 0;
  const result = await guardEdgeOrders02CRFreshness(request('&statusFilter=__DEBT__'), env(), NOW, {
    fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); }
  });
  assert.equal(result.pass, true);
  assert.equal(heartbeatCalls, 0);
}

// Unauthorized traffic must not trigger the server-to-server heartbeat read.
{
  const unauthorized = new Request('https://edge.test/v1/edge/orders/02cr/page?screen=print', { method: 'GET' });
  let heartbeatCalls = 0;
  const result = await guardEdgeOrders02CRFreshness(unauthorized, env(), NOW, {
    fetchIdleHeartbeat: async () => { heartbeatCalls += 1; return heartbeat(); }
  });
  assert.equal(result.pass, true);
  assert.equal(heartbeatCalls, 0);
}

const wrapperSource = fs.readFileSync(new URL('../cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs', import.meta.url), 'utf8');
assert.match(wrapperSource, /body\.logicalFreshness\s*=\s*logicalFreshness/);
assert.doesNotMatch(wrapperSource, /INSERT\s+INTO|UPDATE\s+sheet_|DELETE\s+FROM|wrangler\s+deploy/i);

console.log('PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_PASS');
