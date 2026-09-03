const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const TOKEN_VERSION = 'v1';
const TOKEN_AUDIENCE = 'trendos-edge';
const DEFAULT_TTL_SECONDS = 600;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 900;

function text(value) {
  return String(value == null ? '' : value).trim();
}

function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
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
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

export function isAllowedOrigin(request, env) {
  const origin = text(request.headers.get('Origin'));
  if (!origin) return true;
  return configuredOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8(value) {
  return new TextEncoder().encode(String(value));
}

function decodeUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    utf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  );
}

async function signHmac(value, secret) {
  const key = await hmacKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, utf8(value));
  return new Uint8Array(signature);
}

async function verifyHmac(value, signature, secret) {
  const key = await hmacKey(secret, ['verify']);
  return crypto.subtle.verify('HMAC', key, signature, utf8(value));
}

function tokenSecret(env) {
  return text(env.EDGE_SESSION_SECRET);
}

function tokenTtlSeconds(env) {
  return clampInt(
    env.EDGE_SESSION_TTL_SECONDS,
    DEFAULT_TTL_SECONDS,
    MIN_TTL_SECONDS,
    MAX_TTL_SECONDS
  );
}

export async function issueEdgeSessionToken(claims, secret, nowSeconds = Math.floor(Date.now() / 1000), ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!text(secret)) throw new Error('EDGE_SESSION_SECRET is not configured');
  const ttl = clampInt(ttlSeconds, DEFAULT_TTL_SECONDS, MIN_TTL_SECONDS, MAX_TTL_SECONDS);
  const payload = {
    aud: TOKEN_AUDIENCE,
    sub: text(claims && claims.sub),
    iat: nowSeconds,
    exp: nowSeconds + ttl,
    jti: text(claims && claims.jti) || crypto.randomUUID()
  };
  if (!payload.sub) throw new Error('Edge session subject is required');

  const payloadPart = toBase64Url(utf8(JSON.stringify(payload)));
  const signingInput = `${TOKEN_VERSION}.${payloadPart}`;
  const signaturePart = toBase64Url(await signHmac(signingInput, secret));
  return `${signingInput}.${signaturePart}`;
}

export async function verifyEdgeSessionToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!text(secret)) return { ok: false, reason: 'edge-auth-not-configured' };
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return { ok: false, reason: 'invalid-token-format' };

  try {
    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = fromBase64Url(parts[2]);
    const valid = await verifyHmac(signingInput, signature, secret);
    if (!valid) return { ok: false, reason: 'invalid-signature' };

    const payload = JSON.parse(decodeUtf8(fromBase64Url(parts[1])));
    if (payload.aud !== TOKEN_AUDIENCE) return { ok: false, reason: 'invalid-audience' };
    if (!text(payload.sub)) return { ok: false, reason: 'invalid-subject' };
    if (!Number.isFinite(Number(payload.iat)) || !Number.isFinite(Number(payload.exp))) {
      return { ok: false, reason: 'invalid-time-claims' };
    }
    if (Number(payload.iat) > nowSeconds + 60) return { ok: false, reason: 'issued-in-future' };
    if (Number(payload.exp) <= nowSeconds) return { ok: false, reason: 'expired' };
    if (Number(payload.exp) - Number(payload.iat) > MAX_TTL_SECONDS) return { ok: false, reason: 'ttl-too-large' };
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, reason: 'invalid-token' };
  }
}

function bearerToken(request) {
  const header = text(request.headers.get('Authorization'));
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

async function requireEdgeSession(request, env) {
  const verified = await verifyEdgeSessionToken(bearerToken(request), tokenSecret(env));
  if (!verified.ok) {
    return {
      ok: false,
      response: json({ success: false, message: 'Unauthorized edge session', code: verified.reason }, 401, corsHeaders(request, env))
    };
  }
  return { ok: true, session: verified.payload };
}

async function verifyEmployeeWithAppsScript(username, employeeToken, env) {
  const apiUrl = text(env.APPS_SCRIPT_API_URL);
  if (!apiUrl) throw new Error('APPS_SCRIPT_API_URL is not configured');
  if (!username || !employeeToken) return { success: false, message: 'username and token are required' };

  const url = new URL(apiUrl);
  url.searchParams.set('action', 'verifyEmployeeSession');
  url.searchParams.set('username', username);
  url.searchParams.set('token', employeeToken);
  url.searchParams.set('_edge', '1');
  url.searchParams.set('_ts', String(Date.now()));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    const raw = await response.text();
    let body;
    try {
      body = JSON.parse(raw || '{}');
    } catch (err) {
      throw new Error(`Apps Script verification returned invalid JSON (HTTP ${response.status})`);
    }
    if (!response.ok || !body || body.success !== true) {
      return { success: false, message: text(body && body.message) || `Apps Script verification failed (HTTP ${response.status})` };
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function exchangeSession(request, env) {
  if (!tokenSecret(env)) {
    return json({ success: false, message: 'Edge authentication is not configured' }, 503, corsHeaders(request, env));
  }

  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    return json({ success: false, message: 'Invalid JSON body' }, 400, corsHeaders(request, env));
  }

  const username = text(body.username || body.name);
  const employeeToken = text(body.token);
  if (!username || !employeeToken) {
    return json({ success: false, message: 'username and token are required' }, 400, corsHeaders(request, env));
  }

  const upstream = await verifyEmployeeWithAppsScript(username, employeeToken, env);
  if (!upstream.success) {
    return json({ success: false, message: upstream.message || 'Employee session rejected' }, 401, corsHeaders(request, env));
  }

  const canonicalUsername = text(
    upstream.username ||
    (upstream.user && (upstream.user.username || upstream.user.name)) ||
    username
  );
  const now = Math.floor(Date.now() / 1000);
  const ttl = tokenTtlSeconds(env);
  const edgeToken = await issueEdgeSessionToken({ sub: canonicalUsername }, tokenSecret(env), now, ttl);

  return json({
    success: true,
    edgeToken,
    expiresAt: new Date((now + ttl) * 1000).toISOString(),
    expiresIn: ttl,
    user: { username: canonicalUsername }
  }, 200, corsHeaders(request, env));
}

async function listInbox(env, limit) {
  const safeLimit = clampInt(limit, 120, 1, 200);
  const result = await env.DB.prepare(`
    SELECT phone,
           customer_name AS customerName,
           order_id AS orderId,
           status,
           last_message AS lastMessage,
           last_at AS lastAt,
           direction,
           needs_manager AS needsManager,
           reason,
           owner
      FROM conversations
     ORDER BY last_at DESC
     LIMIT ?
  `).bind(safeLimit).all();
  return result.results || [];
}

async function listMessages(env, phone, limit) {
  const clean = cleanPhone(phone);
  if (!clean) throw new Error('phone is required');
  const safeLimit = clampInt(limit, 200, 1, 300);
  const result = await env.DB.prepare(`
    SELECT id,
           phone,
           customer_name AS customerName,
           order_id AS orderId,
           direction,
           text,
           at,
           source,
           send_status AS sendStatus,
           meta_id AS metaId,
           needs_manager AS needsManager,
           reason,
           by_user AS byUser
      FROM messages
     WHERE phone = ?
     ORDER BY at DESC
     LIMIT ?
  `).bind(clean, safeLimit).all();
  return (result.results || []).reverse();
}

async function latestOrderForPhone(env, phone) {
  const clean = cleanPhone(phone);
  if (!clean) return null;
  return env.DB.prepare(`
    SELECT order_id AS orderId,
           customer_phone AS customerPhone,
           customer_name AS customerName,
           status,
           department,
           priority,
           expected_delivery AS expectedDelivery,
           total,
           remaining,
           created_at AS createdAt,
           updated_at AS updatedAt
      FROM orders
     WHERE customer_phone = ?
     ORDER BY updated_at DESC
     LIMIT 1
  `).bind(clean).first();
}

async function customerForPhone(env, phone) {
  const clean = cleanPhone(phone);
  if (!clean) return null;
  return env.DB.prepare(`
    SELECT phone,
           customer_name AS customerName,
           customer_code AS customerCode,
           updated_at AS updatedAt
      FROM customers
     WHERE phone = ?
     LIMIT 1
  `).bind(clean).first();
}

function threadContext(phone, order, customer) {
  return {
    phone: cleanPhone(phone),
    customerName: text((order && order.customerName) || (customer && customer.customerName)),
    orderId: text(order && order.orderId),
    orderStatus: text(order && order.status),
    expectedDelivery: text(order && order.expectedDelivery),
    total: order && order.total != null ? order.total : '',
    remaining: order && order.remaining != null ? order.remaining : ''
  };
}

async function customerManagerInbox(request, env, url, session) {
  return json({
    success: true,
    conversations: await listInbox(env, url.searchParams.get('limit')),
    dataSource: 'd1-edge',
    edgeSession: session.sub
  }, 200, corsHeaders(request, env));
}

async function customerManagerThread(request, env, url, session) {
  const phone = cleanPhone(url.searchParams.get('phone'));
  if (!phone) return json({ success: false, message: 'phone is required' }, 400, corsHeaders(request, env));
  const [messages, order, customer] = await Promise.all([
    listMessages(env, phone, url.searchParams.get('limit')),
    latestOrderForPhone(env, phone),
    customerForPhone(env, phone)
  ]);
  return json({
    success: true,
    messages,
    context: threadContext(phone, order, customer),
    dataSource: 'd1-edge',
    edgeSession: session.sub
  }, 200, corsHeaders(request, env));
}

async function edgeHealth(request, env) {
  let database = false;
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first();
    database = !!(row && Number(row.ok) === 1);
  } catch (err) {}
  return json({
    success: database,
    service: 'trendos-edge-gateway-v1',
    database,
    authConfigured: !!tokenSecret(env),
    upstreamConfigured: !!text(env.APPS_SCRIPT_API_URL),
    cutover: false,
    time: new Date().toISOString()
  }, database ? 200 : 503, corsHeaders(request, env));
}

export function isEdgeGatewayPath(path) {
  return path === '/v1/edge/health' ||
    path === '/v1/edge/session' ||
    path === '/v1/edge/whoami' ||
    path === '/v1/edge/customer-manager/inbox' ||
    path === '/v1/edge/customer-manager/thread';
}

export async function handleEdgeGatewayRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!isAllowedOrigin(request, env)) {
    return json({ success: false, message: 'Origin not allowed' }, 403, cors);
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && path === '/v1/edge/health') {
      return edgeHealth(request, env);
    }

    if (request.method === 'POST' && path === '/v1/edge/session') {
      return exchangeSession(request, env);
    }

    if (!isEdgeGatewayPath(path)) {
      return json({ success: false, message: 'Edge route not found' }, 404, cors);
    }

    const auth = await requireEdgeSession(request, env);
    if (!auth.ok) return auth.response;

    if (request.method === 'GET' && path === '/v1/edge/whoami') {
      return json({ success: true, user: { username: auth.session.sub }, expiresAt: new Date(Number(auth.session.exp) * 1000).toISOString() }, 200, cors);
    }

    if (request.method === 'GET' && path === '/v1/edge/customer-manager/inbox') {
      return customerManagerInbox(request, env, url, auth.session);
    }

    if (request.method === 'GET' && path === '/v1/edge/customer-manager/thread') {
      return customerManagerThread(request, env, url, auth.session);
    }

    return json({ success: false, message: 'Method not allowed' }, 405, cors);
  } catch (err) {
    const message = err && err.name === 'AbortError'
      ? 'Apps Script verification timed out'
      : (err && err.message ? err.message : String(err));
    return json({ success: false, message }, 502, cors);
  }
}
