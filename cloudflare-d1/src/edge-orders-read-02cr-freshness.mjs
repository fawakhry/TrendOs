import {
  handleEdgeOrders02CRCanaryRequest as handleQualified02CR,
  isEdgeOrders02CRPath
} from './edge-orders-read-02cr-canary.mjs';
import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
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

  // Orders visibility must not be coupled to the short write-age budget of
  // advisory enrichment mirrors. Structural qualification remains mandatory.
  // Debt-filtered reads are excluded from this path above, so stale enrichment
  // is surfaced explicitly instead of hiding the operational Orders list.
  const enrichmentFreshness = {
    degraded: !customers.fresh || !restrictions.fresh,
    mode: (!customers.fresh || !restrictions.fresh) ? 'stale-structurally-qualified' : 'write-age-fresh',
    customers: safeInspection(CUSTOMERS_SHEET, customers),
    restrictions: safeInspection(RESTRICTIONS_SHEET, restrictions)
  };

  const baseSnapshotFreshness = {
    degraded: !lines.fresh,
    mode: lines.fresh ? 'write-age-fresh' : 'stale-structurally-qualified',
    lines: safeInspection(LINES_SHEET, lines),
    authority: 'd1-qualified-snapshot+t12-native-overlay',
    googleHeartbeatRequired: false
  };

  // Zero-Google cutover: once the D1 Lines snapshot is structurally qualified,
  // its wall-clock sync age is advisory. New Cloud-native Orders/Lines and
  // runtime state are merged by the T12 overlay. Do not call Apps Script merely
  // to prove an unchanged Google source before rendering Orders.
  return {
    pass: true,
    logicalFreshness: null,
    mirrors,
    enrichmentFreshness,
    baseSnapshotFreshness
  };
}

async function decorateFreshness(response, logicalFreshness, enrichmentFreshness, baseSnapshotFreshness) {
  if (!response || !response.ok) return response;
  if (!logicalFreshness && !enrichmentFreshness && !baseSnapshotFreshness) return response;
  let body;
  try {
    body = await response.json();
  } catch (err) {
    return response;
  }
  if (!body || body.success !== true) return response;
  if (logicalFreshness) body.logicalFreshness = logicalFreshness;
  if (baseSnapshotFreshness) {
    body.baseSnapshotFreshness = baseSnapshotFreshness;
    if (baseSnapshotFreshness.degraded === true) {
      const warnings = Array.isArray(body.warnings) ? body.warnings.slice() : [];
      warnings.push({
        code: '02CR_LINES_STALE_SNAPSHOT_ADVISORY',
        message: 'Orders are served from the qualified D1 base snapshot plus the T12 Cloud-native overlay; Google heartbeat verification is not required.'
      });
      body.warnings = warnings;
    }
  }
  if (enrichmentFreshness) {
    body.enrichmentFreshness = enrichmentFreshness;
    if (enrichmentFreshness.degraded === true) {
      const warnings = Array.isArray(body.warnings) ? body.warnings.slice() : [];
      warnings.push({
        code: '02CR_ENRICHMENT_STALE_ADVISORY',
        message: 'Orders are available from D1; customer/debt enrichment is structurally valid but older than the short freshness budget.'
      });
      body.warnings = warnings;
    }
  }
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
  return decorateFreshness(
    response,
    guarded.logicalFreshness,
    guarded.enrichmentFreshness,
    guarded.baseSnapshotFreshness
  );
}

export { isEdgeOrders02CRPath };
