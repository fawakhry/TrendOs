import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { guardEdgeOrdersPageRequest } from '../cloudflare-d1/src/edge-orders-freshness-gate.mjs';

const nowMs = Date.parse('2026-09-04T14:30:00Z');
const signingKey = 'unit-test-key-material-for-idle-freshness';
const token = await issueOrdersEdgeToken(
  { sub: 'admin', role: 'admin', department: 'إدارة', screens: ['service'] },
  signingKey,
  Math.floor(nowMs / 1000) - 60,
  600
);

const staleCatalog = {
  sourceLastRow: 315,
  sourceLastCol: 82,
  rowCount: 315,
  status: 'ready',
  syncedAt: '2026-09-04 14:19:00',
  note: 'TrendOS orders live sync V2 quota-aware'
};

const badParityCatalog = { ...staleCatalog, rowCount: 314 };

function idleStatus() {
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
      at: '2026-09-04T14:28:00.000Z',
      success: true,
      lowUsage: true,
      mode: 'unchanged-light-fingerprint-no-d1-request',
      sourceChanged: false,
      d1RequestMade: false,
      d1WriteMade: false,
      intervalMinutes: 5,
      source: [
        { sheetName: 'الأوردرات', sourceLastRow: 274, sourceLastCol: 67, displayHash: 'orders-unit-hash' },
        { sheetName: 'بنود الأوردرات', sourceLastRow: 315, sourceLastCol: 82, displayHash: 'lines-unit-hash' }
      ]
    }
  };
}

function envFor(catalog) {
  return {
    EDGE_SESSION_SECRET: signingKey,
    EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS: '600',
    EDGE_ORDERS_IDLE_HEARTBEAT_MAX_AGE_SECONDS: '720',
    CORS_ORIGINS: 'https://fawakhry.github.io',
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() { return catalog; }
            };
          }
        };
      }
    }
  };
}

function pageRequest() {
  return new Request('https://edge.test/v1/edge/orders/page?screen=service&page=1&pageSize=5&statusFilter=__ACTIVE__', {
    method: 'GET',
    headers: {
      origin: 'https://fawakhry.github.io',
      authorization: `Bearer ${token}`
    }
  });
}

{
  const blocked = await guardEdgeOrdersPageRequest(pageRequest(), envFor(staleCatalog), nowMs);
  assert.ok(blocked instanceof Response);
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.code, 'stale-orders-mirror');
  assert.equal(body.idleHeartbeat, undefined);
}

{
  let calls = 0;
  const blocked = await guardEdgeOrdersPageRequest(pageRequest(), envFor(staleCatalog), nowMs, {
    async verifyIdleSourceFreshness() {
      calls += 1;
      return idleStatus();
    }
  });
  assert.equal(blocked, null);
  assert.equal(calls, 1);
}

{
  const old = idleStatus();
  old.lastIdleCheck.at = '2026-09-04T14:10:00.000Z';
  const blocked = await guardEdgeOrdersPageRequest(pageRequest(), envFor(staleCatalog), nowMs, {
    async verifyIdleSourceFreshness() { return old; }
  });
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.idleHeartbeat.ok, false);
  assert.ok(body.idleHeartbeat.failedChecks.includes('recent'));
}

{
  const failed = idleStatus();
  failed.consecutiveErrors = 1;
  failed.lastError = { at: '2026-09-04T14:29:00.000Z', message: 'source-read-error' };
  const blocked = await guardEdgeOrdersPageRequest(pageRequest(), envFor(staleCatalog), nowMs, {
    async verifyIdleSourceFreshness() { return failed; }
  });
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.idleHeartbeat.ok, false);
  assert.ok(body.idleHeartbeat.failedChecks.includes('noLastError'));
  assert.ok(body.idleHeartbeat.failedChecks.includes('zeroConsecutiveErrors'));
}

{
  let calls = 0;
  const blocked = await guardEdgeOrdersPageRequest(pageRequest(), envFor(badParityCatalog), nowMs, {
    async verifyIdleSourceFreshness() {
      calls += 1;
      return idleStatus();
    }
  });
  assert.equal(blocked.status, 503);
  const body = await blocked.json();
  assert.equal(body.code, 'mirror-not-ready');
  assert.equal(calls, 0);
}

console.log('Cloudflare Edge Orders Idle Freshness Integration V1: DEFAULT STALE FAIL-CLOSED + VERIFIED IDLE PASS + INVALID HEARTBEAT/PARITY FAIL-CLOSED PASS');
