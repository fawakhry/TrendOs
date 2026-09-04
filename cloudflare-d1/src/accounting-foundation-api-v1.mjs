import {
  accountingFoundationContract,
  authorizeAccountingPermission,
  buildAuditEvent,
  validateIdempotencyEnvelope,
  validateLineEconomics,
  validateOrderLineIdentity,
  validatePartyLedgerTransaction,
  validateStableId
} from './accounting-foundation-v1.mjs';
import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import { readAccountingOrderLineFacts } from './accounting-operations-read-v1.mjs';

const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function text(value) { return String(value == null ? '' : value).trim(); }
function origins(env) {
  const configured = String((env && env.CORS_ORIGINS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
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
function originAllowed(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || origins(env).includes(origin);
}
function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-trendos-module': 'accounting',
      ...corsHeaders(request, env)
    }
  });
}
function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

export function isAccountingFoundationApiPath(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return normalized === '/v1/accounting/foundation' ||
    normalized === '/v1/accounting/foundation/validate' ||
    normalized === '/v1/accounting/operations/line';
}

function validatePayload(kind, payload) {
  switch (text(kind).toLowerCase()) {
    case 'stable-id': return validateStableId(payload && payload.value, payload && payload.field || 'id');
    case 'order-line': return validateOrderLineIdentity(payload || {});
    case 'idempotency': return validateIdempotencyEnvelope(payload || {});
    case 'party-ledger': return validatePartyLedgerTransaction(payload || {});
    case 'line-economics': return validateLineEconomics(payload || {});
    case 'audit-event': return buildAuditEvent(payload || {});
    default: return { ok: false, errors: ['unsupported validation kind'] };
  }
}

async function requireAccountingRead(request, env) {
  const token = bearer(request);
  const secret = text(env && env.EDGE_SESSION_SECRET);
  const verified = await verifyOrdersEdgeToken(token, secret);
  if (!verified.ok) return { ok: false, status: 401, code: verified.reason, message: 'Unauthorized TrendOS Accounting session' };
  const permission = authorizeAccountingPermission(verified.payload || {}, 'accounting.read');
  if (!permission.ok) return { ok: false, status: 403, code: permission.reason, message: 'Accounting read permission denied' };
  return { ok: true, principal: verified.payload, permission };
}

export async function handleAccountingFoundationApiRequest(request, env = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (!originAllowed(request, env)) return json({ success: false, code: 'origin-not-allowed' }, 403, request, env);

  if (path === '/v1/accounting/foundation') {
    if (request.method !== 'GET') return json({ success: false, code: 'method-not-allowed', authoritativeWrites: false }, 405, request, env);
    return json(accountingFoundationContract(), 200, request, env);
  }

  if (path === '/v1/accounting/foundation/validate') {
    if (request.method !== 'POST') return json({ success: false, code: 'method-not-allowed', authoritativeWrites: false }, 405, request, env);
    let body;
    try { body = await request.json(); }
    catch (err) { return json({ success: false, code: 'invalid-json', authoritativeWrites: false }, 400, request, env); }
    const result = validatePayload(body && body.kind, body && body.payload);
    return json({
      success: !!result.ok,
      validationOnly: true,
      authoritativeWrites: false,
      persisted: false,
      kind: text(body && body.kind),
      result
    }, result.ok ? 200 : 422, request, env);
  }

  if (path === '/v1/accounting/operations/line') {
    if (request.method !== 'GET') return json({ success: false, code: 'method-not-allowed', authoritativeWrites: false }, 405, request, env);
    const auth = await requireAccountingRead(request, env);
    if (!auth.ok) return json({ success: false, code: auth.code, message: auth.message, authoritativeWrites: false }, auth.status, request, env);
    const orderId = text(url.searchParams.get('orderId'));
    const lineId = text(url.searchParams.get('lineId'));
    const facts = await readAccountingOrderLineFacts(env, { orderId, lineId });
    return json({ ...facts, principal: { sub: text(auth.principal.sub), role: text(auth.principal.role) } }, facts.success ? 200 : (facts.code === 'invalid-identity' ? 400 : facts.code === 'order-line-not-found' ? 404 : 503), request, env);
  }

  return json({ success: false, code: 'not-found' }, 404, request, env);
}
