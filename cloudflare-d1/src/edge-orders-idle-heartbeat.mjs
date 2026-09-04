const ORDERS_SHEET = 'الأوردرات';
const LINES_SHEET = 'بنود الأوردرات';
const EXPECTED_IDLE_MODE = 'unchanged-light-fingerprint-no-d1-request';
const DEFAULT_MAX_AGE_SECONDS = 720;

function text(value) {
  return String(value == null ? '' : value).trim();
}

function integer(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clampMaxAge(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(300, Math.min(1800, Math.trunc(n)))
    : DEFAULT_MAX_AGE_SECONDS;
}

function parseUtc(value) {
  const raw = text(value);
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function sourceEntry(source, sheetName) {
  if (!Array.isArray(source)) return null;
  return source.find((item) => text(item && item.sheetName) === sheetName) || null;
}

function sourceEntryHealthy(entry) {
  return !!(
    entry &&
    integer(entry.sourceLastRow, -1) >= 0 &&
    integer(entry.sourceLastCol, -1) >= 0 &&
    text(entry.displayHash)
  );
}

function sourceShapeMatches(entry, expectedRowValue, expectedColValue) {
  const expectedRow = Number(expectedRowValue);
  const expectedCol = Number(expectedColValue);
  return sourceEntryHealthy(entry) &&
    (!Number.isFinite(expectedRow) || integer(entry.sourceLastRow, -1) === Math.trunc(expectedRow)) &&
    (!Number.isFinite(expectedCol) || integer(entry.sourceLastCol, -1) === Math.trunc(expectedCol));
}

export function inspectOrdersIdleHeartbeat(status, options = {}) {
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const maxAgeSeconds = clampMaxAge(options.maxAgeSeconds);
  const payload = status && typeof status === 'object' ? status : {};
  const idle = payload.lastIdleCheck && typeof payload.lastIdleCheck === 'object'
    ? payload.lastIdleCheck
    : null;
  const atMs = parseUtc(idle && idle.at);
  const ageSeconds = atMs
    ? Math.max(0, Math.round((nowMs - atMs) / 1000))
    : Number.MAX_SAFE_INTEGER;

  const intervalMinutes = integer(payload.intervalMinutes, 0);
  const ordersSource = sourceEntry(idle && idle.source, ORDERS_SHEET);
  const linesSource = sourceEntry(idle && idle.source, LINES_SHEET);
  const ordersShapeMatches = sourceShapeMatches(
    ordersSource,
    options.expectedOrdersSourceLastRow,
    options.expectedOrdersSourceLastCol
  );
  const linesShapeMatches = sourceShapeMatches(
    linesSource,
    options.expectedLinesSourceLastRow,
    options.expectedLinesSourceLastCol
  );

  const checks = {
    statusSuccess: payload.success === true,
    lowUsage: payload.lowUsage === true,
    lightweightIdleDetection: payload.lightweightIdleDetection === true,
    enabled: payload.enabled === true,
    intervalFiveMinutes: intervalMinutes === 5,
    oneLowUsageTrigger: integer(payload.lowUsageTriggerCount, -1) === 1,
    noLegacyV1Trigger: integer(payload.legacyV1TriggerCount, -1) === 0,
    noDirectV2Trigger: integer(payload.directV2TriggerCount, -1) === 0,
    fingerprintPresent: payload.lightFingerprintPresent === true,
    noLastError: payload.lastError == null,
    zeroConsecutiveErrors: integer(payload.consecutiveErrors, -1) === 0,
    zeroIdleD1Writes: integer(payload.unchangedD1Writes, -1) === 0,
    zeroIdleCloudflareRequests: integer(payload.unchangedCloudflareRequests, -1) === 0,
    idlePresent: !!idle,
    idleSuccess: !!idle && idle.success === true,
    idleLowUsage: !!idle && idle.lowUsage === true,
    idleMode: !!idle && text(idle.mode) === EXPECTED_IDLE_MODE,
    sourceUnchanged: !!idle && idle.sourceChanged === false,
    idleNoD1Request: !!idle && idle.d1RequestMade === false,
    idleNoD1Write: !!idle && idle.d1WriteMade === false,
    idleIntervalMatches: !!idle && integer(idle.intervalMinutes, -1) === intervalMinutes,
    ordersSourceHealthy: sourceEntryHealthy(ordersSource),
    linesSourceHealthy: sourceEntryHealthy(linesSource),
    ordersSourceShapeMatches: ordersShapeMatches,
    linesSourceShapeMatches: linesShapeMatches,
    recent: ageSeconds <= maxAgeSeconds
  };

  const failedChecks = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return {
    ok: failedChecks.length === 0,
    mode: failedChecks.length === 0 ? 'verified-idle-source-unchanged' : 'idle-heartbeat-invalid',
    ageSeconds,
    maxAgeSeconds,
    checkedAt: text(idle && idle.at),
    intervalMinutes,
    failedChecks,
    source: {
      orders: ordersSource ? {
        sourceLastRow: integer(ordersSource.sourceLastRow, 0),
        sourceLastCol: integer(ordersSource.sourceLastCol, 0),
        displayHashPresent: !!text(ordersSource.displayHash)
      } : null,
      lines: linesSource ? {
        sourceLastRow: integer(linesSource.sourceLastRow, 0),
        sourceLastCol: integer(linesSource.sourceLastCol, 0),
        displayHashPresent: !!text(linesSource.displayHash)
      } : null
    }
  };
}

export const ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS = DEFAULT_MAX_AGE_SECONDS;
