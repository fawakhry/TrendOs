import { isAllowedOrigin, verifyEdgeSessionToken } from './edge-gateway.mjs';

const PROTOCOL = 'TRENDOS_OT_EDGE_V1';
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
const ROUTES = Object.freeze({
  '/v1/operator/tasks/status': { method: 'GET', op: 'status', roles: ['WAEL', 'GABER', 'MANAGER'], mutation: false },
  '/v1/operator/tasks/claim-next': { method: 'POST', op: 'claimNext', roles: ['WAEL', 'GABER'], mutation: true },
  '/v1/operator/tasks/complete': { method: 'POST', op: 'completeTask', roles: ['WAEL', 'GABER'], mutation: true },
  '/v1/operator/fly-print': { method: 'GET', op: 'flyPrint', roles: ['WAEL'], mutation: false },
  '/v1/operator/press-candidates': { method: 'GET', op: 'pressCandidates', roles: ['WAEL'], mutation: false },
  '/v1/operator/tasks/metrics': { method: 'GET', op: 'metrics', roles: ['MANAGER'], mutation: false }
});

function text(value) { return String(value == null ? '' : value).trim(); }
function bool(value) { return ['1', 'true', 'yes', 'on', 'enabled'].includes(text(value).toLowerCase()); }
function norm(value) {
  return text(value).toLowerCase().replace(/[إأآا]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}
function configuredOrigins(env) {
  const configured = text(env.CORS_ORIGINS).split(',').map((v) => v.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}
function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,idempotency-key',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}
function bearerToken(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}
function edgeEnabled(env) { return bool(env.TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED); }
function proxySecret(env) { return text(env.TRENDOS_OPERATOR_TASK_PROXY_SECRET); }
function appsScriptUrl(env) { return text(env.APPS_SCRIPT_API_URL); }
function roleFromSession(session) {
  const explicit = text(session && session.role).toUpperCase();
  if (['WAEL', 'GABER', 'MANAGER'].includes(explicit)) return explicit;
  const subject = norm(session && session.sub);
  if (subject.includes('وائل') || subject.includes('wael')) return 'WAEL';
  if (subject.includes('جابر') || subject.includes('gaber') || subject.includes('jaber')) return 'GABER';
  if (subject.includes('ضياء') || subject.includes('diaa')) return 'MANAGER';
  return 'OTHER';
}
function methodFor(request) { return text(request.method || 'GET').toUpperCase(); }
function mutationIdempotencyKey(request) { return text(request.headers.get('Idempotency-Key')); }
function toHex(bytes) { return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return toHex(new Uint8Array(digest));
}
async function hmacHex(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const out = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toHex(new Uint8Array(out));
}
export async function operatorTaskCanonicalAssertion({ method, op, operator, sessionJti, assertedAt, idempotencyKey, payloadJson }) {
  const payloadHash = await sha256Hex(payloadJson || '{}');
  return [PROTOCOL, text(method).toUpperCase(), text(op), text(operator), text(sessionJti), String(assertedAt), text(idempotencyKey), payloadHash].join('\n');
}
export async function signOperatorTaskAssertion(input, secret) {
  return hmacHex(await operatorTaskCanonicalAssertion(input), secret);
}
export function isOperatorTaskEdgePath(path) { return Object.prototype.hasOwnProperty.call(ROUTES, String(path || '').replace(/\/+$/, '') || '/'); }
export function operatorTaskRouteContract(path) { return ROUTES[String(path || '').replace(/\/+$/, '') || '/'] || null; }

async function requestPayload(request, route) {
  if (!route.mutation) return {};
  let body;
  try { body = await request.json(); } catch (err) { throw new Error('INVALID_JSON_BODY'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_JSON_BODY');
  const safe = {};
  if (route.op === 'completeTask') {
    safe.taskId = text(body.taskId);
    safe.finalStatus = text(body.finalStatus);
    safe.notes = text(body.notes);
  }
  return safe;
}

async function callAppsScript(route, request, env, session, payload, idempotencyKey) {
  const apiUrl = appsScriptUrl(env);
  const secret = proxySecret(env);
  if (!apiUrl) throw new Error('APPS_SCRIPT_API_URL_NOT_CONFIGURED');
  if (!secret) throw new Error('OPERATOR_TASK_PROXY_SECRET_NOT_CONFIGURED');
  const operator = text(session.sub);
  const sessionJti = text(session.jti);
  if (!operator || !sessionJti) throw new Error('EDGE_SESSION_IDENTITY_INCOMPLETE');
  const assertedAt = Math.floor(Date.now() / 1000);
  const payloadJson = JSON.stringify(payload || {});
  const canonical = { method: route.method, op: route.op, operator, sessionJti, assertedAt, idempotencyKey, payloadJson };
  const signature = await signOperatorTaskAssertion(canonical, secret);
  const upstreamPayload = {
    action: 'operatorTaskEdgeProxyV2',
    protocol: PROTOCOL,
    method: route.method,
    op: route.op,
    operator,
    sessionJti,
    assertedAt: String(assertedAt),
    idempotencyKey: text(idempotencyKey),
    payloadJson,
    signature
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(upstreamPayload),
      redirect: 'follow',
      signal: controller.signal
    });
    const raw = await response.text();
    let body;
    try { body = JSON.parse(raw || '{}'); } catch (err) { throw new Error(`APPS_SCRIPT_INVALID_JSON_HTTP_${response.status}`); }
    if (!response.ok) return { status: 502, body: { success: false, code: 'APPS_SCRIPT_HTTP_ERROR', upstreamStatus: response.status } };
    return { status: body && body.success === false ? 400 : 200, body };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleOperatorTaskEdgeRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const route = operatorTaskRouteContract(path);
  const cors = corsHeaders(request, env);
  if (!route) return json({ success: false, code: 'OPERATOR_TASK_ROUTE_NOT_FOUND' }, 404, cors);
  if (request.method === 'OPTIONS') {
    if (!isAllowedOrigin(request, env)) return json({ success: false, code: 'ORIGIN_FORBIDDEN' }, 403, cors);
    return new Response(null, { status: 204, headers: cors });
  }
  if (!isAllowedOrigin(request, env)) return json({ success: false, code: 'ORIGIN_FORBIDDEN' }, 403, cors);
  if (!edgeEnabled(env)) return json({ success: false, code: 'OPERATOR_TASK_EDGE_DISABLED' }, 503, cors);
  if (methodFor(request) !== route.method) return json({ success: false, code: 'METHOD_NOT_ALLOWED' }, 405, cors);
  if (!proxySecret(env) || !appsScriptUrl(env)) return json({ success: false, code: 'OPERATOR_TASK_EDGE_NOT_CONFIGURED' }, 503, cors);

  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) return json({ success: false, code: verified.reason || 'UNAUTHORIZED_EDGE_SESSION' }, 401, cors);
  const session = verified.payload || {};
  const role = roleFromSession(session);
  if (!route.roles.includes(role)) return json({ success: false, code: 'OPERATOR_TASK_CAPABILITY_FORBIDDEN' }, 403, cors);

  const idempotencyKey = route.mutation ? mutationIdempotencyKey(request) : '';
  if (route.mutation && !idempotencyKey) return json({ success: false, code: 'IDEMPOTENCY_KEY_REQUIRED' }, 400, cors);

  let payload;
  try { payload = await requestPayload(request, route); }
  catch (err) { return json({ success: false, code: err.message || 'INVALID_REQUEST' }, 400, cors); }
  if (route.op === 'completeTask' && (!payload.taskId || !['جاهز للاستلام', 'تم التسليم'].includes(payload.finalStatus))) {
    return json({ success: false, code: 'COMPLETE_PAYLOAD_INVALID' }, 400, cors);
  }

  try {
    const upstream = await callAppsScript(route, request, env, session, payload, idempotencyKey);
    return json(upstream.body, upstream.status, cors);
  } catch (err) {
    return json({ success: false, code: 'OPERATOR_TASK_UPSTREAM_ERROR', message: text(err && err.message) }, 502, cors);
  }
}
