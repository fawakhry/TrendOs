// TrendOS Tasks V3 T1.5 — isolated D1 read-replica preview.
// Fetch/read path MUST NOT call Google. Sheets remain authoritative via async refresh through the qualified T1 preview source.

export const TASKS_V3_T15_SNAPSHOT_KEY = 'wael-preview';
export const TASKS_V3_T15_ALLOWED_OPS = Object.freeze([
  'health',
  'status',
  'flyPrint',
  'pressCandidates'
]);
export const TASKS_V3_T15_ALLOWED_ROLE = 'WAEL';
export const TASKS_V3_T15_DEFAULT_MAX_AGE_SECONDS = 180;
export const TASKS_V3_T15_SOURCE_TIMEOUT_MS = 10000;

function text(value) {
  return String(value == null ? '' : value).trim();
}

function failure(code, detail = '', httpStatus = 400) {
  return { success: false, code, detail: text(detail), httpStatus };
}

function maxAgeSeconds(env) {
  const configured = Number(env && env.TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : TASKS_V3_T15_DEFAULT_MAX_AGE_SECONDS;
}

function previewDb(env) {
  return env && env.TASKS_V3_PREVIEW_DB;
}

function parseStoredJson(raw, code) {
  try {
    const value = JSON.parse(text(raw) || '{}');
    if (!value || typeof value !== 'object') throw new Error('not-object');
    return { ok: true, value };
  } catch (_) {
    return { ok: false, error: failure(code, '', 503) };
  }
}

function stripHealthDiagnostic(body) {
  const clean = { ...(body || {}) };
  delete clean.diagnostic;
  return clean;
}

export async function callTasksV3T1Source({
  env,
  op,
  operator,
  role = TASKS_V3_T15_ALLOWED_ROLE,
  fetchImpl = globalThis.fetch,
  timeoutMs = TASKS_V3_T15_SOURCE_TIMEOUT_MS
}) {
  const url = text(env && env.TASKS_V3_T1_SOURCE_URL);
  if (!url) return failure('TASKS_V3_T15_SOURCE_URL_MISSING', '', 503);
  if (typeof fetchImpl !== 'function') return failure('TASKS_V3_T15_SOURCE_FETCH_UNAVAILABLE', '', 503);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || TASKS_V3_T15_SOURCE_TIMEOUT_MS));
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        op: text(op),
        operator: text(operator),
        role: text(role).toUpperCase(),
        payloadJson: '{}'
      }),
      signal: controller.signal
    });

    const raw = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(raw || '{}');
    } catch (_) {
      return failure('TASKS_V3_T15_SOURCE_INVALID_JSON', '', 503);
    }

    if (!response.ok || !parsed || parsed.success !== true || !parsed.body) {
      return failure(
        'TASKS_V3_T15_SOURCE_REJECTED',
        parsed && parsed.code ? parsed.code : String(response.status),
        503
      );
    }

    return parsed;
  } catch (err) {
    if (controller.signal.aborted || (err && err.name === 'AbortError')) {
      return failure('TASKS_V3_T15_SOURCE_TIMEOUT', '', 503);
    }
    return failure('TASKS_V3_T15_SOURCE_ERROR', err && err.name, 503);
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshTasksV3T15Snapshot({
  env,
  operator = TASKS_V3_T15_SNAPSHOT_KEY,
  role = TASKS_V3_T15_ALLOWED_ROLE,
  nowSeconds = Math.floor(Date.now() / 1000),
  sourceImpl = callTasksV3T1Source
}) {
  const db = previewDb(env);
  if (!db) return failure('TASKS_V3_T15_DB_NOT_CONFIGURED', '', 503);
  if (typeof sourceImpl !== 'function') return failure('TASKS_V3_T15_SOURCE_UNAVAILABLE', '', 503);

  const sourceHealth = await sourceImpl({ env, op: 'health', operator, role });
  if (!sourceHealth || sourceHealth.success !== true || !sourceHealth.body) {
    return failure('TASKS_V3_T15_SOURCE_HEALTH_FAILED', sourceHealth && sourceHealth.code, 503);
  }

  const sourceStatus = await sourceImpl({ env, op: 'status', operator, role });
  if (!sourceStatus || sourceStatus.success !== true || !sourceStatus.body) {
    return failure('TASKS_V3_T15_SOURCE_STATUS_FAILED', sourceStatus && sourceStatus.code, 503);
  }

  const healthJson = JSON.stringify(stripHealthDiagnostic(sourceHealth.body));
  const statusJson = JSON.stringify(sourceStatus.body);

  await db.prepare(`
    INSERT INTO tasks_v3_t15_read_snapshot (
      snapshot_key,
      refreshed_at,
      source_health_json,
      source_status_json,
      snapshot_version
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(snapshot_key) DO UPDATE SET
      refreshed_at = excluded.refreshed_at,
      source_health_json = excluded.source_health_json,
      source_status_json = excluded.source_status_json,
      snapshot_version = excluded.snapshot_version
  `).bind(
    TASKS_V3_T15_SNAPSHOT_KEY,
    Number(nowSeconds),
    healthJson,
    statusJson,
    'TASKS_V3_T15_D1_PREVIEW_2'
  ).run();

  return {
    success: true,
    code: 'OK',
    refreshedAt: Number(nowSeconds),
    snapshotKey: TASKS_V3_T15_SNAPSHOT_KEY
  };
}

export async function readTasksV3T15Preview({
  env,
  op,
  operator,
  role = TASKS_V3_T15_ALLOWED_ROLE,
  nowSeconds = Math.floor(Date.now() / 1000)
}) {
  const normalizedOp = text(op);
  const normalizedOperator = text(operator);
  const normalizedRole = text(role).toUpperCase();

  if (!TASKS_V3_T15_ALLOWED_OPS.includes(normalizedOp)) {
    return failure('TASKS_V3_T15_OPERATION_FORBIDDEN');
  }
  if (normalizedRole !== TASKS_V3_T15_ALLOWED_ROLE) {
    return failure('TASKS_V3_T15_ROLE_FORBIDDEN');
  }
  if (!normalizedOperator) {
    return failure('TASKS_V3_T15_OPERATOR_REQUIRED');
  }

  const db = previewDb(env);
  if (!db) return failure('TASKS_V3_T15_DB_NOT_CONFIGURED', '', 503);

  const row = await db.prepare(`
    SELECT snapshot_key, refreshed_at, source_health_json, source_status_json, snapshot_version
    FROM tasks_v3_t15_read_snapshot
    WHERE snapshot_key = ?
    LIMIT 1
  `).bind(TASKS_V3_T15_SNAPSHOT_KEY).first();

  if (!row) return failure('TASKS_V3_T15_REPLICA_EMPTY', '', 503);

  const refreshedAt = Number(row.refreshed_at || 0);
  const ageSeconds = Math.max(0, Number(nowSeconds) - refreshedAt);
  const maxAge = maxAgeSeconds(env);
  if (!refreshedAt || ageSeconds > maxAge) {
    return failure('TASKS_V3_T15_REPLICA_STALE', String(ageSeconds), 503);
  }

  const parsedHealth = parseStoredJson(row.source_health_json, 'TASKS_V3_T15_HEALTH_SNAPSHOT_INVALID');
  if (!parsedHealth.ok) return parsedHealth.error;

  const parsedStatus = parseStoredJson(row.source_status_json, 'TASKS_V3_T15_STATUS_SNAPSHOT_INVALID');
  if (!parsedStatus.ok) return parsedStatus.error;

  let body;
  if (normalizedOp === 'health') body = parsedHealth.value;
  else if (normalizedOp === 'status') body = parsedStatus.value;
  else if (normalizedOp === 'flyPrint') body = parsedStatus.value.flyPrint;
  else body = parsedStatus.value.pressCandidates;

  if (!body || typeof body !== 'object' || body.success !== true) {
    return failure('TASKS_V3_T15_REPLICA_PAYLOAD_INVALID', normalizedOp, 503);
  }

  return {
    success: true,
    code: 'OK',
    status: 200,
    body,
    replica: {
      source: 'D1_READ_REPLICA',
      authoritativeSource: 'SHEETS',
      refreshedAt,
      ageSeconds,
      maxAgeSeconds: maxAge,
      snapshotVersion: text(row.snapshot_version)
    }
  };
}
