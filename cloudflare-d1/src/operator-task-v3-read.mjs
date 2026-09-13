import { isAllowedOrigin, verifyEdgeSessionToken } from './edge-gateway.mjs';

const STATUS_PATH = '/v1/operator/tasks/v3/status';
const DEFAULT_MAX_AGE_SECONDS = 300;
const DEFAULT_LANE_LIMIT = 25;
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function text(value) { return String(value == null ? '' : value).trim(); }
function bool(value) { return ['1', 'true', 'yes', 'on', 'enabled'].includes(text(value).toLowerCase()); }
function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}
function norm(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[ةه]/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}
function configuredOrigins(env) {
  const configured = text(env && env.CORS_ORIGINS).split(',').map((x) => x.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}
function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}
function bearerToken(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}
function roleFromSession(session) {
  const explicit = text(session && session.role).toUpperCase();
  if (['WAEL', 'GABER', 'MANAGER'].includes(explicit)) return explicit;
  const department = norm(session && session.department);
  if (department.includes('طباع')) return 'WAEL';
  if (department.includes('ليزر')) return 'GABER';
  const subject = norm(session && session.sub);
  if (subject.includes('وائل') || subject.includes('wael')) return 'WAEL';
  if (subject.includes('جابر') || subject.includes('gaber') || subject.includes('jaber')) return 'GABER';
  if (subject.includes('ضياء') || subject.includes('diaa')) return 'MANAGER';
  return 'OTHER';
}
function laneForRole(role) {
  if (role === 'WAEL') return 'PRINT';
  if (role === 'GABER') return 'LASER';
  return '';
}
function publicRow(row) {
  if (!row) return null;
  return {
    lineId: text(row.lineId),
    orderId: text(row.orderId),
    sourceRowNumber: Number(row.sourceRowNumber || 0),
    sourceFingerprint: text(row.sourceFingerprint),
    lane: text(row.lane),
    department: text(row.department),
    priority: text(row.priority),
    expectedDelivery: text(row.expectedDelivery),
    sourceStatus: text(row.sourceStatus),
    eligibility: text(row.eligibility),
    flyPrint: Number(row.flyPrint || 0) === 1,
    pressCandidate: Number(row.pressCandidate || 0) === 1,
    customerName: text(row.customerName),
    itemName: text(row.itemName),
    quantity: row.quantity == null ? null : Number(row.quantity),
    updatedAtMs: Number(row.updatedAtMs || 0)
  };
}
function enabled(env) { return bool(env && env.TRENDOS_OPERATOR_TASK_V3_READ_ENABLED); }
function maxAgeMs(env) {
  return clampInt(env && env.TRENDOS_OPERATOR_TASK_V3_MAX_AGE_SECONDS, DEFAULT_MAX_AGE_SECONDS, 30, 3600) * 1000;
}
function laneLimit(env) {
  return clampInt(env && env.TRENDOS_OPERATOR_TASK_V3_LANE_LIMIT, DEFAULT_LANE_LIMIT, 1, 100);
}

export function isOperatorTaskV3ReadPath(path) {
  return (String(path || '').replace(/\/+$/, '') || '/') === STATUS_PATH;
}

async function projectionFreshness(env, nowMs) {
  const row = await env.DB.prepare(`
    SELECT status,
           synced_at_ms AS syncedAtMs,
           source_last_row AS sourceLastRow,
           row_count AS rowCount,
           source_version AS sourceVersion,
           note
      FROM operator_task_v3_projection_meta
     WHERE projection_key = 'dispatch'
     LIMIT 1
  `).first();
  if (!row) {
    return { ready: false, reason: 'missing', syncedAtMs: 0, ageMs: null, rowCount: 0 };
  }
  const syncedAtMs = Number(row.syncedAtMs || 0);
  const ageMs = syncedAtMs > 0 ? Math.max(0, Number(nowMs) - syncedAtMs) : null;
  const ready = text(row.status).toLowerCase() === 'ready' && ageMs !== null && ageMs <= maxAgeMs(env);
  return {
    ready,
    reason: text(row.status).toLowerCase() !== 'ready' ? 'not-ready' : (ageMs === null ? 'missing-time' : (ready ? 'fresh' : 'stale')),
    status: text(row.status),
    syncedAtMs,
    ageMs,
    sourceLastRow: Number(row.sourceLastRow || 0),
    rowCount: Number(row.rowCount || 0),
    sourceVersion: text(row.sourceVersion),
    note: text(row.note)
  };
}

async function nextCandidate(env, lane) {
  if (!lane) return null;
  const row = await env.DB.prepare(`
    SELECT line_id AS lineId,
           order_id AS orderId,
           source_row_number AS sourceRowNumber,
           source_fingerprint AS sourceFingerprint,
           lane,
           department,
           priority,
           expected_delivery AS expectedDelivery,
           source_status AS sourceStatus,
           eligibility,
           fly_print AS flyPrint,
           press_candidate AS pressCandidate,
           customer_name AS customerName,
           item_name AS itemName,
           quantity,
           updated_at_ms AS updatedAtMs
      FROM operator_task_v3_projection
     WHERE lane = ?
       AND eligibility IN ('ELIGIBLE','READY')
     ORDER BY priority_rank ASC,
              CASE WHEN expected_delivery_sort = 0 THEN 99999999 ELSE expected_delivery_sort END ASC,
              updated_at_ms ASC,
              source_row_number ASC
     LIMIT 1
  `).bind(lane).first();
  return publicRow(row);
}

async function flaggedLane(env, columnName, limit) {
  const allowed = columnName === 'fly_print' ? 'fly_print' : 'press_candidate';
  const query = await env.DB.prepare(`
    SELECT line_id AS lineId,
           order_id AS orderId,
           source_row_number AS sourceRowNumber,
           source_fingerprint AS sourceFingerprint,
           lane,
           department,
           priority,
           expected_delivery AS expectedDelivery,
           source_status AS sourceStatus,
           eligibility,
           fly_print AS flyPrint,
           press_candidate AS pressCandidate,
           customer_name AS customerName,
           item_name AS itemName,
           quantity,
           updated_at_ms AS updatedAtMs
      FROM operator_task_v3_projection
     WHERE ${allowed} = 1
       AND eligibility IN ('ELIGIBLE','READY')
     ORDER BY priority_rank ASC,
              CASE WHEN expected_delivery_sort = 0 THEN 99999999 ELSE expected_delivery_sort END ASC,
              updated_at_ms ASC,
              source_row_number ASC
     LIMIT ?
  `).bind(limit).all();
  return (query.results || []).map(publicRow);
}

async function metrics(env) {
  const result = await env.DB.prepare(`
    SELECT lane,
           COUNT(*) AS eligibleCount,
           SUM(CASE WHEN fly_print = 1 THEN 1 ELSE 0 END) AS flyPrintCount,
           SUM(CASE WHEN press_candidate = 1 THEN 1 ELSE 0 END) AS pressCount
      FROM operator_task_v3_projection
     WHERE eligibility IN ('ELIGIBLE','READY')
     GROUP BY lane
     ORDER BY lane
  `).all();
  const byLane = {};
  for (const row of result.results || []) {
    byLane[text(row.lane) || 'UNKNOWN'] = {
      eligible: Number(row.eligibleCount || 0),
      flyPrint: Number(row.flyPrintCount || 0),
      press: Number(row.pressCount || 0)
    };
  }
  return byLane;
}

export async function handleOperatorTaskV3ReadRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') {
    if (!isAllowedOrigin(request, env)) return json({ success: false, code: 'ORIGIN_FORBIDDEN' }, 403, cors);
    return new Response(null, { status: 204, headers: cors });
  }
  if (!isAllowedOrigin(request, env)) return json({ success: false, code: 'ORIGIN_FORBIDDEN' }, 403, cors);
  if (!enabled(env)) return json({ success: false, code: 'OPERATOR_TASK_V3_READ_DISABLED', readOnly: true }, 503, cors);
  if (request.method !== 'GET') return json({ success: false, code: 'METHOD_NOT_ALLOWED', readOnly: true }, 405, cors);
  if (!env || !env.DB) return json({ success: false, code: 'D1_NOT_CONFIGURED', readOnly: true }, 503, cors);

  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) return json({ success: false, code: verified.reason || 'UNAUTHORIZED_EDGE_SESSION', readOnly: true }, 401, cors);
  const session = verified.payload || {};
  const role = roleFromSession(session);
  if (!['WAEL', 'GABER', 'MANAGER'].includes(role)) {
    return json({ success: false, code: 'OPERATOR_TASK_V3_CAPABILITY_FORBIDDEN', readOnly: true }, 403, cors);
  }

  try {
    const nowMs = Date.now();
    const freshness = await projectionFreshness(env, nowMs);
    if (!freshness.ready) {
      return json({
        success: false,
        code: freshness.reason === 'stale' ? 'OPERATOR_TASK_V3_PROJECTION_STALE' : 'OPERATOR_TASK_V3_PROJECTION_NOT_READY',
        readOnly: true,
        dataSource: 'd1-task-v3-projection',
        freshness
      }, 503, cors);
    }

    const lane = laneForRole(role);
    const response = {
      success: true,
      version: 'OPERATOR_TASK_V3_READ_T4',
      readOnly: true,
      mutationsEnabled: false,
      dataSource: 'd1-task-v3-projection',
      operator: text(session.sub),
      role,
      activeTask: null,
      nextCandidate: await nextCandidate(env, lane),
      freshness
    };

    if (role === 'WAEL' || role === 'MANAGER') {
      const limit = laneLimit(env);
      const flyRows = await flaggedLane(env, 'fly_print', limit);
      const pressRows = await flaggedLane(env, 'press_candidate', limit);
      response.flyPrint = { rows: flyRows, count: flyRows.length };
      response.pressCandidates = { rows: pressRows, count: pressRows.length };
    }
    if (role === 'MANAGER') response.metrics = await metrics(env);

    return json(response, 200, cors);
  } catch (err) {
    return json({
      success: false,
      code: 'OPERATOR_TASK_V3_READ_ERROR',
      message: text(err && err.message),
      readOnly: true
    }, 502, cors);
  }
}
