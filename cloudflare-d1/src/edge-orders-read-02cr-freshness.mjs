import {
  handleEdgeOrders02CRCanaryRequest as handleQualified02CR,
  isEdgeOrders02CRPath
} from './edge-orders-read-02cr-canary.mjs';
import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import {
  inspectOrdersIdleHeartbeat,
  ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS
} from './edge-orders-idle-heartbeat.mjs';
import {
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatVerifierEnabled
} from './edge-orders-idle-verifier.mjs';

const ORDERS_SHEET = 'الأوردرات';
const LINES_SHEET = 'بنود الأوردرات';
const CUSTOMERS_SHEET = 'العملاء';
const RESTRICTIONS_SHEET = 'عملاء منع التسليم بالمديونية';
const LINES_NOTE = 'TrendOS orders live sync V2 quota-aware';
const ENRICHMENT_NOTE = 'PERF-CF-02CR enrichment live sync V1';
const ORDERS_LIVE_NOTES = new Set(['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware']);
const DEFAULT_MAX_AGE_SECONDS = 300;
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function text(value) {
  return String(value == null ? '' : value).trim();
}

function bearer(request) {
  const match = text(request && request.headers && request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function parseSqliteUtc(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

function maxAgeSeconds(env) {
  const configured = Number(env && env.EDGE_ORDERS_02CR_MAX_AGE_SECONDS);
  if (Number.isFinite(configured)) return Math.max(300, Math.min(900, Math.trunc(configured)));
  return DEFAULT_MAX_AGE_SECONDS;
}

function idleHeartbeatMaxAgeSeconds(env) {
  const configured = Number(env && env.EDGE_ORDERS_IDLE_HEARTBEAT_MAX_AGE_SECONDS);
  return Number.isFinite(configured)
    ? Math.max(300, Math.min(1800, Math.trunc(configured)))
    : ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS;
}

function configuredOrigins(env) {
  const list = String((env && env.CORS_ORIGINS) || '').split(',').map((item) => item.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = text(request && request.headers && request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function json(payload, status, request, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(request, env)
    }
  });
}

async function readCatalog(env, sheetName) {
  return env.DB.prepare(`
    SELECT source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     WHERE sheet_name = ?
     LIMIT 1
  `).bind(sheetName).first();
}

function inspectCatalog(catalog, expectedNote, nowMs, budgetSeconds, options = {}) {
  const c = catalog || {};
  const syncedMs = parseSqliteUtc(c.syncedAt);
  const ageSeconds = syncedMs ? Math.max(0, Math.round((Number(nowMs) - syncedMs) / 1000)) : Number.MAX_SAFE_INTEGER;
  const statusReady = text(c.status) === 'ready';
  const parity = Number(c.rowCount || 0) === Number(c.sourceLastRow || 0);
  const note = text(c.note);
  const noteReady = options.ordersNote === true ? ORDERS_LIVE_NOTES.has(note) : note === text(expectedNote);
  const fresh = ageSeconds <= budgetSeconds;
  return {
    ready: statusReady && parity && noteReady && fresh,
    structurallyReady: statusReady && parity && noteReady,
    statusReady,
    parity,
    noteReady,
    fresh,
    ageSeconds,
    maxAgeSeconds: budgetSeconds,
    sourceLastRow: Number(c.sourceLastRow || 0),
    sourceLastCol: Number(c.sourceLastCol || 0),
    rowCount: Number(c.rowCount || 0),
    status: text(c.status),
    syncedAt: text(c.syncedAt),
    note
  };
}

function safeInspection(sheetName, inspection) {
  return { sheetName, ...(inspection || {}) };
}

function blockedResponse(request, env, code, message, mirrors, heartbeat) {
  return json({
    success: false,
    code,
    fallback: 'apps-script',
    dataSource: code === '02cr-mirror-stale' ? 'd1-orders-02cr-stale' : 'd1-orders-02cr-unready',
    message,
    mirrors,
    ...(heartbeat ? { idleHeartbeat: heartbeat } : {})
  }, 503, request, env);
}

export async function guardEdgeOrders02CRFreshness(request, env, nowMs = Date.now(), options = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method !== 'GET' || !isEdgeOrders02CRPath(path)) return { pass: true, logicalFreshness: null };
  if (text(url.searchParams.get('statusFilter')) === '__DEBT__') return { pass: true, logicalFreshness: null };

  const verified = await verifyOrdersEdgeToken(bearer(request), text(env && env.EDGE_SESSION_SECRET), Math.floor(Number(nowMs) / 1000));
  if (!verified.ok) return { pass: true, logicalFreshness: null };
  const screen = text(url.searchParams.get('screen') || 'service');
  const allowedScreens = Array.isArray(verified.payload && verified.payload.screens)
    ? verified.payload.screens.map(text)
    : [];
  if (allowedScreens.length && !allowedScreens.includes(screen)) return { pass: true, logicalFreshness: null };

  if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
    return {
      pass: false,
      response: blockedResponse(request, env || {}, '02cr-mirror-check-error', '02CR mirror metadata is unavailable.', [])
    };
  }

  let linesCatalog;
  let customersCatalog;
  let restrictionsCatalog;
  try {
    [linesCatalog, customersCatalog, restrictionsCatalog] = await Promise.all([
      readCatalog(env, LINES_SHEET),
      readCatalog(env, CUSTOMERS_SHEET),
      readCatalog(env, RESTRICTIONS_SHEET)
    ]);
  } catch (err) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-check-error', '02CR mirror metadata check failed.', [])
    };
  }

  if (!linesCatalog || !customersCatalog || !restrictionsCatalog) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-not-ready', 'Required 02CR mirror metadata is missing.', [])
    };
  }

  const budget = maxAgeSeconds(env);
  const lines = inspectCatalog(linesCatalog, LINES_NOTE, nowMs, budget);
  const customers = inspectCatalog(customersCatalog, ENRICHMENT_NOTE, nowMs, budget);
  const restrictions = inspectCatalog(restrictionsCatalog, ENRICHMENT_NOTE, nowMs, budget);
  const mirrors = [
    safeInspection(LINES_SHEET, lines),
    safeInspection(CUSTOMERS_SHEET, customers),
    safeInspection(RESTRICTIONS_SHEET, restrictions)
  ];

  const structuralFailure = [lines, customers, restrictions].some((item) => !item.structurallyReady);
  if (structuralFailure) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-not-ready', 'Required 02CR mirror structure is not qualified.', mirrors)
    };
  }

  // The sanitized low-usage heartbeat proves Orders + Lines only. Enrichment
  // mirrors have no independent source proof, so they must remain write-age fresh.
  if (!customers.fresh || !restrictions.fresh) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-stale', '02CR enrichment mirror is older than the freshness budget.', mirrors)
    };
  }

  if (lines.fresh) return { pass: true, logicalFreshness: null, mirrors };

  if (!ordersIdleHeartbeatVerifierEnabled(env)) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-stale', 'Orders lines mirror is stale and idle-source verification is disabled.', mirrors)
    };
  }

  let ordersCatalog;
  try {
    ordersCatalog = await readCatalog(env, ORDERS_SHEET);
  } catch (err) {
    ordersCatalog = null;
  }
  if (!ordersCatalog) {
    return {
      pass: false,
      response: blockedResponse(request, env, '02cr-mirror-stale', 'Orders source-shape metadata is unavailable for idle verification.', mirrors)
    };
  }

  const orders = inspectCatalog(ordersCatalog, '', nowMs, budget, { ordersNote: true });
  if (!orders.structurallyReady) {
    return {
      pass: false,
      response: blockedResponse(
        request,
        env,
        '02cr-mirror-stale',
        'Orders source-shape metadata is not structurally qualified for idle verification.',
        [...mirrors, safeInspection(ORDERS_SHEET, orders)]
      )
    };
  }

  let heartbeat;
  try {
    const fetchHeartbeat = typeof options.fetchIdleHeartbeat === 'function'
      ? options.fetchIdleHeartbeat
      : () => fetchOrdersIdleHeartbeat(env);
    const status = await fetchHeartbeat({ request, env, nowMs });
    heartbeat = inspectOrdersIdleHeartbeat(status, {
      nowMs: Number(nowMs),
      maxAgeSeconds: idleHeartbeatMaxAgeSeconds(env),
      expectedOrdersSourceLastRow: orders.sourceLastRow,
      expectedOrdersSourceLastCol: orders.sourceLastCol,
      expectedLinesSourceLastRow: lines.sourceLastRow,
      expectedLinesSourceLastCol: lines.sourceLastCol
    });
  } catch (err) {
    heartbeat = {
      ok: false,
      mode: 'idle-heartbeat-verification-error',
      failedChecks: ['verifierError']
    };
  }

  if (!heartbeat.ok) {
    return {
      pass: false,
      response: blockedResponse(
        request,
        env,
        '02cr-mirror-stale',
        'Orders lines mirror is stale and the source-unchanged proof failed closed.',
        [...mirrors, safeInspection(ORDERS_SHEET, orders)],
        heartbeat
      )
    };
  }

  return {
    pass: true,
    logicalFreshness: heartbeat,
    mirrors: [...mirrors, safeInspection(ORDERS_SHEET, orders)]
  };
}

async function decorateLogicalFreshness(response, logicalFreshness) {
  if (!logicalFreshness || !response || !response.ok) return response;
  let body;
  try {
    body = await response.json();
  } catch (err) {
    return response;
  }
  if (!body || body.success !== true) return response;
  body.logicalFreshness = logicalFreshness;
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(body), { status: response.status, headers });
}

export async function handleEdgeOrders02CRCanaryRequest(request, env, ctx) {
  if (request.method === 'OPTIONS') return handleQualified02CR(request, env, ctx);
  const guarded = await guardEdgeOrders02CRFreshness(request, env, Date.now());
  if (!guarded.pass) return guarded.response;
  const response = await handleQualified02CR(request, env, ctx);
  return decorateLogicalFreshness(response, guarded.logicalFreshness);
}

export { isEdgeOrders02CRPath };
