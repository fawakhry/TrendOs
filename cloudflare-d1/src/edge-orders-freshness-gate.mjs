import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';

const LINES_SHEET = 'بنود الأوردرات';
const LIVE_NOTES = ['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware'];
const DEFAULT_MAX_AGE_SECONDS = 600;
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

function maxAgeSeconds(env) {
  const n = Number(env && env.EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS);
  return Number.isFinite(n) ? Math.max(300, Math.min(3600, Math.trunc(n))) : DEFAULT_MAX_AGE_SECONDS;
}

function parseSqliteUtc(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

function origins(env) {
  const configured = String((env && env.CORS_ORIGINS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

function originAllowed(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || origins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = origins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function responseJson(payload, status, request, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(request, env)
    }
  });
}

export function inspectOrdersMirrorCatalog(catalog, nowMs = Date.now(), configuredMaxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const maxAge = Number.isFinite(Number(configuredMaxAgeSeconds))
    ? Math.max(300, Math.min(3600, Math.trunc(Number(configuredMaxAgeSeconds))))
    : DEFAULT_MAX_AGE_SECONDS;
  const c = catalog || {};
  const syncedMs = parseSqliteUtc(c.syncedAt);
  const ageSeconds = syncedMs ? Math.max(0, Math.round((Number(nowMs) - syncedMs) / 1000)) : Number.MAX_SAFE_INTEGER;
  const parity = Number(c.rowCount || 0) === Number(c.sourceLastRow || 0);
  const live = LIVE_NOTES.includes(text(c.note));
  const ready = text(c.status) === 'ready';
  const fresh = ageSeconds <= maxAge;
  return {
    ready: ready && parity && live && fresh,
    statusReady: ready,
    parity,
    live,
    fresh,
    ageSeconds,
    maxAgeSeconds: maxAge,
    syncedAt: text(c.syncedAt),
    status: text(c.status),
    rowCount: Number(c.rowCount || 0),
    sourceLastRow: Number(c.sourceLastRow || 0),
    sourceLastCol: Number(c.sourceLastCol || 0),
    note: text(c.note)
  };
}

export async function guardEdgeOrdersPageRequest(request, env, nowMs = Date.now()) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method !== 'GET' || path !== '/v1/edge/orders/page') return null;
  if (!originAllowed(request, env)) return null;

  const token = bearer(request);
  const secret = text(env && env.EDGE_SESSION_SECRET);
  const verified = await verifyOrdersEdgeToken(token, secret, Math.floor(Number(nowMs) / 1000));
  if (!verified.ok) return null;

  const screen = text(url.searchParams.get('screen') || 'service');
  const allowedScreens = Array.isArray(verified.payload && verified.payload.screens)
    ? verified.payload.screens.map(text)
    : [];
  if (!allowedScreens.includes(screen)) return null;
  if (text(url.searchParams.get('statusFilter')) === '__DEBT__') return null;

  if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
    return responseJson({
      success: false,
      code: 'orders-mirror-check-error',
      fallback: 'apps-script',
      dataSource: 'd1-orders-unavailable',
      message: 'Orders mirror metadata is unavailable.'
    }, 503, request, env || {});
  }

  let catalog;
  try {
    catalog = await env.DB.prepare(
      `SELECT source_last_row AS sourceLastRow, source_last_col AS sourceLastCol, row_count AS rowCount, status, synced_at AS syncedAt, note FROM sheet_catalog WHERE sheet_name = ? LIMIT 1`
    ).bind(LINES_SHEET).first();
  } catch (err) {
    return responseJson({
      success: false,
      code: 'orders-mirror-check-error',
      fallback: 'apps-script',
      dataSource: 'd1-orders-unavailable',
      message: 'Orders mirror metadata check failed.'
    }, 503, request, env);
  }

  if (!catalog) {
    return responseJson({
      success: false,
      code: 'mirror-not-ready',
      fallback: 'apps-script',
      dataSource: 'd1-orders-unready',
      message: 'Orders mirror metadata is missing.'
    }, 503, request, env);
  }

  const inspection = inspectOrdersMirrorCatalog(catalog, nowMs, maxAgeSeconds(env));
  if (inspection.ready) return null;

  const staleOnly = inspection.statusReady && inspection.parity && inspection.live && !inspection.fresh;
  return responseJson({
    success: false,
    code: staleOnly ? 'stale-orders-mirror' : 'mirror-not-ready',
    fallback: 'apps-script',
    dataSource: staleOnly ? 'd1-orders-stale' : 'd1-orders-unready',
    message: staleOnly
      ? 'Orders mirror is older than the low-usage freshness budget.'
      : 'Orders mirror is not ready for Edge reads.',
    mirror: inspection
  }, 503, request, env);
}
