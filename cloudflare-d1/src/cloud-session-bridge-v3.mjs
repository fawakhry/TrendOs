import { issueEdgeSessionToken } from './edge-gateway.mjs';
import { issueOrdersEdgeToken } from './edge-orders-read-v1.mjs';

const EDGE_SESSION_PATH = '/v1/edge/session';
const ORDERS_SESSION_PATH = '/v1/edge/orders/session';
const DEFAULT_TTL_SECONDS = 600;
const MAX_TTL_SECONDS = 900;
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

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
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
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function allowedOrigin(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || configuredOrigins(env).includes(origin);
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(headers || {})
    }
  });
}

function screensForRole(roleValue) {
  const role = text(roleValue).toLowerCase();
  if (role === 'admin') return ['service', 'print', 'laser', 'press', ''];
  if (role === 'print' || role === 'press') return ['print', 'press', ''];
  if (role === 'laser') return ['laser', ''];
  return ['service', ''];
}

function sessionTtlSeconds(env) {
  return clampInt(env.EDGE_SESSION_TTL_SECONDS, DEFAULT_TTL_SECONDS, 60, MAX_TTL_SECONDS);
}

export function isCloudSessionBridgeV3Path(path) {
  return path === EDGE_SESSION_PATH || path === ORDERS_SESSION_PATH;
}

export async function verifyEmployeeSessionViaPost(username, employeeToken, env, lane = 'edge') {
  const upstream = text(env.APPS_SCRIPT_API_URL);
  if (!upstream) throw new Error('APPS_SCRIPT_API_URL is not configured');
  if (!username || !employeeToken) return { ok: false, kind: 'input', message: 'username and token are required' };

  const payload = {
    action: 'verifyEmployeeSession',
    username: text(username),
    token: text(employeeToken),
    _ts: Date.now()
  };
  if (lane === 'orders') payload._edgeOrders = 1;
  else payload._edge = 1;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    const raw = await response.text();
    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch (err) {
      return { ok: false, kind: 'upstream', status: response.status, message: 'Apps Script verification returned invalid JSON' };
    }

    if (!response.ok) {
      return {
        ok: false,
        kind: 'upstream',
        status: response.status,
        message: text(body && body.message) || `Apps Script verification failed (HTTP ${response.status})`
      };
    }
    if (!body || body.success !== true) {
      return { ok: false, kind: 'auth', status: response.status, message: text(body && body.message) || 'Employee session rejected' };
    }
    return { ok: true, body };
  } finally {
    clearTimeout(timer);
  }
}

async function parseCredentials(request) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }
  const username = text(body.username || body.name);
  const token = text(body.token);
  if (!username || !token) return { ok: false, status: 400, message: 'username and token are required' };
  return { ok: true, username, token };
}

async function exchangeGeneralSession(request, env, cors) {
  const credentials = await parseCredentials(request);
  if (!credentials.ok) return json({ success: false, message: credentials.message }, credentials.status, cors);
  if (!text(env.EDGE_SESSION_SECRET)) return json({ success: false, message: 'Edge authentication is not configured' }, 503, cors);

  const verified = await verifyEmployeeSessionViaPost(credentials.username, credentials.token, env, 'edge');
  if (!verified.ok) {
    const status = verified.kind === 'upstream' ? 502 : (verified.kind === 'input' ? 400 : 401);
    return json({ success: false, message: verified.message, code: verified.kind === 'upstream' ? 'apps-script-verification-upstream' : 'employee-session-rejected' }, status, cors);
  }

  const upstream = verified.body || {};
  const canonicalUsername = text(
    upstream.username ||
    (upstream.user && (upstream.user.username || upstream.user.name)) ||
    credentials.username
  );
  const ttl = sessionTtlSeconds(env);
  const now = Math.floor(Date.now() / 1000);
  const edgeToken = await issueEdgeSessionToken({ sub: canonicalUsername }, text(env.EDGE_SESSION_SECRET), now, ttl);
  return json({
    success: true,
    edgeToken,
    expiresAt: new Date((now + ttl) * 1000).toISOString(),
    expiresIn: ttl,
    user: { username: canonicalUsername },
    sessionBridge: 'cloud-session-bridge-v3-post'
  }, 200, cors);
}

async function exchangeOrdersSession(request, env, cors) {
  const credentials = await parseCredentials(request);
  if (!credentials.ok) return json({ success: false, message: credentials.message }, credentials.status, cors);
  if (!text(env.EDGE_SESSION_SECRET)) return json({ success: false, message: 'Edge authentication is not configured' }, 503, cors);

  const verified = await verifyEmployeeSessionViaPost(credentials.username, credentials.token, env, 'orders');
  if (!verified.ok) {
    const status = verified.kind === 'upstream' ? 502 : (verified.kind === 'input' ? 400 : 401);
    return json({ success: false, message: verified.message, code: verified.kind === 'upstream' ? 'apps-script-verification-upstream' : 'employee-session-rejected' }, status, cors);
  }

  const upstream = verified.body || {};
  const user = upstream.user || {};
  const canonicalUsername = text(user.username || upstream.username || credentials.username);
  const role = text(user.role || upstream.role || 'service').toLowerCase();
  const department = text(user.department || upstream.department);
  const screens = screensForRole(role);
  const ttl = sessionTtlSeconds(env);
  const now = Math.floor(Date.now() / 1000);
  const edgeToken = await issueOrdersEdgeToken({ sub: canonicalUsername, role, department, screens }, text(env.EDGE_SESSION_SECRET), now, ttl);
  return json({
    success: true,
    edgeToken,
    expiresIn: ttl,
    expiresAt: new Date((now + ttl) * 1000).toISOString(),
    user: { username: canonicalUsername, role, department, screens },
    sessionBridge: 'cloud-session-bridge-v3-post'
  }, 200, cors);
}

export async function handleCloudSessionBridgeV3(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!allowedOrigin(request, env)) return json({ success: false, message: 'Origin not allowed' }, 403, cors);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!isCloudSessionBridgeV3Path(path)) return json({ success: false, message: 'Session bridge route not found' }, 404, cors);
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405, cors);

  try {
    if (path === ORDERS_SESSION_PATH) return await exchangeOrdersSession(request, env, cors);
    return await exchangeGeneralSession(request, env, cors);
  } catch (err) {
    const message = err && err.name === 'AbortError' ? 'Apps Script verification timeout' : text(err && err.message) || 'Session bridge failed';
    return json({ success: false, message, code: 'session-bridge-failed' }, 502, cors);
  }
}
