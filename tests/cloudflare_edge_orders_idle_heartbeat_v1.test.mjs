import assert from 'node:assert/strict';
import { inspectOrdersIdleHeartbeat } from '../cloudflare-d1/src/edge-orders-idle-heartbeat.mjs';

const nowMs = Date.parse('2026-09-04T14:30:00Z');

function validStatus() {
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
        {
          sheetName: 'الأوردرات',
          sourceLastRow: 274,
          sourceLastCol: 67,
          displayHash: 'orders-hash'
        },
        {
          sheetName: 'بنود الأوردرات',
          sourceLastRow: 315,
          sourceLastCol: 82,
          displayHash: 'lines-hash'
        }
      ]
    }
  };
}

function inspect(status) {
  return inspectOrdersIdleHeartbeat(status, {
    nowMs,
    maxAgeSeconds: 720,
    expectedLinesSourceLastRow: 315,
    expectedLinesSourceLastCol: 82
  });
}

{
  const result = inspect(validStatus());
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'verified-idle-source-unchanged');
  assert.equal(result.ageSeconds, 120);
  assert.deepEqual(result.failedChecks, []);
}

{
  const status = validStatus();
  status.lastIdleCheck.at = '2026-09-04T14:17:00.000Z';
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('recent'));
}

{
  const status = validStatus();
  status.lowUsageTriggerCount = 2;
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('oneLowUsageTrigger'));
}

{
  const status = validStatus();
  status.legacyV1TriggerCount = 1;
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('noLegacyV1Trigger'));
}

{
  const status = validStatus();
  status.lastError = { at: '2026-09-04T14:29:00.000Z', message: 'source read failed' };
  status.consecutiveErrors = 1;
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('noLastError'));
  assert.ok(result.failedChecks.includes('zeroConsecutiveErrors'));
}

{
  const status = validStatus();
  status.lightFingerprintPresent = false;
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('fingerprintPresent'));
}

{
  const status = validStatus();
  status.lastIdleCheck.mode = 'changed-v2-delta';
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('idleMode'));
}

{
  const status = validStatus();
  status.lastIdleCheck.source[1].sourceLastRow = 314;
  const result = inspect(status);
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('linesSourceShapeMatches'));
}

{
  const result = inspectOrdersIdleHeartbeat(null, { nowMs, maxAgeSeconds: 720 });
  assert.equal(result.ok, false);
  assert.ok(result.failedChecks.includes('statusSuccess'));
  assert.ok(result.failedChecks.includes('idlePresent'));
}

console.log('Cloudflare Edge Orders Idle Heartbeat V1: RECENT UNCHANGED SOURCE + TRIGGER/ERROR/FINGERPRINT/SHAPE FAIL-CLOSED PASS');
