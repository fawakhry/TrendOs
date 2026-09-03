import { verifyEdgeSessionToken } from './edge-gateway.mjs';
import {
  handleCloudWriteRequest as handleLegacyCloudWriteRequest,
  isCloudWritePath
} from './cloud-write.mjs';

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

function writeEnabled(env) {
  return String(env.TRENDOS_CLOUD_WRITE_V1_ENABLED || '').toLowerCase() === 'true';
}

function configuredOrigins(env) {
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-idempotency-key',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
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

function bearerToken(request) {
  const header = text(request.headers.get('Authorization'));
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

async function readOnlyCloudWriteHealth(request, env) {
  let database = false;
  let schemaReady = false;
  let pendingOutbox = null;

  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first();
    database = !!(row && Number(row.ok) === 1);

    const tables = await env.DB.prepare(`
      SELECT name
        FROM sqlite_master
       WHERE type = 'table'
         AND name IN ('cloud_write_events', 'cloud_write_outbox')
       ORDER BY name
    `).all();
    const names = new Set((tables.results || []).map((item) => text(item && item.name)));
    schemaReady = names.has('cloud_write_events') && names.has('cloud_write_outbox');

    if (schemaReady) {
      const pending = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM cloud_write_outbox WHERE status = 'pending'"
      ).first();
      pendingOutbox = Number((pending && pending.count) || 0);
    }
  } catch (err) {
    database = false;
    schemaReady = false;
    pendingOutbox = null;
  }

  const enabled = writeEnabled(env);
  const authConfigured = !!text(env.EDGE_SESSION_SECRET);
  return json({
    success: database,
    service: 'trendos-cloud-write-v1',
    database,
    enabled,
    authConfigured,
    writesAccepted: database && enabled && authConfigured,
    schemaReady,
    pendingOutbox,
    schemaMutationFree: true,
    cutover: false,
    sheetsAuthoritative: true,
    time: new Date().toISOString()
  }, database ? 200 : 503, corsHeaders(request, env));
}

async function requireEnabledWriteSession(request, env) {
  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env.EDGE_SESSION_SECRET));
  if (verified.ok) return null;
  return json({
    success: false,
    message: 'Unauthorized cloud write session',
    code: verified.reason,
    cutover: false
  }, 401, corsHeaders(request, env));
}

export { isCloudWritePath };

export async function handleCloudWriteRequest(request, env, ctx) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/v1/cloud/write/health') {
    return readOnlyCloudWriteHealth(request, env);
  }

  // Critical fail-closed boundary: when the lane is OFF, do not delegate to code
  // that can initialize schema or write to D1.
  if (!writeEnabled(env)) {
    return json({
      success: false,
      message: 'Cloud write lane is installed but disabled',
      enabled: false,
      cutover: false,
      sheetsAuthoritative: true
    }, 423, cors);
  }

  // Authenticate before delegating so anonymous traffic cannot trigger schema DDL
  // merely because the future write flag was enabled.
  const authFailure = await requireEnabledWriteSession(request, env);
  if (authFailure) return authFailure;

  return handleLegacyCloudWriteRequest(request, env, ctx);
}
