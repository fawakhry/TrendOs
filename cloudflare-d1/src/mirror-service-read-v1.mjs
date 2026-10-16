/**
 * SERVER-67: backend-only, purpose-scoped mirror reads; default-OFF.
 * REVIEW ONLY. Nothing here provisions a credential or deploys a Worker.
 * This is a separate route, never an authorization bypass for legacy GET.
 */
import { readMirrorServicePayload } from './mirror-gate.mjs';

const PREFIX = '/v1/service/mirror/';
const ROUTES = new Set(['stats', 'sheets', 'capabilities', 'sheet']);
const ALLOWED_ROW_SHEETS = new Set(['الأوردرات', 'بنود الأوردرات']);
const META = 'trendos_mirror_metadata';
const PARITY = 'trendos_mirror_parity';
const WINDOW_MS = 30 * 1000;
const MAX_BODY_BYTES = 128 * 1024;

function answer(status, code, body = {}) {
  return new Response(JSON.stringify({ success: status === 200, ...body, ...(status === 200 ? {} : {code}) }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}
export function isMirrorServiceReadPath(path) {
  return ROUTES.has(String(path || '').replace(/\/+$/, '').slice(PREFIX.length)) &&
    String(path || '').replace(/\/+$/, '').startsWith(PREFIX);
}

function validQuery(url, kind) {
  if (kind !== 'sheet') {
    return url.search === '' ? {ok:true} : {ok:false};
  }
  const names = new Set(['name', 'limit', 'offset']);
  for (const k of url.searchParams.keys()) {
    if (!names.has(k) || url.searchParams.getAll(k).length !== 1) return {ok:false};
  }
  const sheetName = url.searchParams.get('name');
  if (!ALLOWED_ROW_SHEETS.has(sheetName)) return {ok:false};
  const limit = url.searchParams.get('limit') ?? '50';
  const offset = url.searchParams.get('offset') ?? '0';
  if (!/^(?:[1-9]|[1-9]\d|100)$/.test(limit)) return {ok:false};
  if (!/^(?:0|[1-9]\d{0,4})$/.test(offset) || Number(offset) > 50000) return {ok:false};
  return {ok:true, sheetName, limit:Number(limit), offset:Number(offset)};
}

const AUTH_HEADER_NAMES = Object.freeze({
  principal: 'x-trendos-read-principal',
  timestamp: 'x-trendos-read-timestamp',
  nonce: 'x-trendos-read-nonce',
  signature: 'x-trendos-read-signature'
});
export function mirrorReadSignaturePayload(method, url, timestamp, nonce, principal) {
  const u = url instanceof URL ? url : new URL(url);
  return [method, u.pathname, u.search, String(timestamp), nonce, principal].join('\n');
}

async function checkAuth(request, env, url, kind) {
  const principal = request.headers.get(AUTH_HEADER_NAMES.principal) || '';
  const needed = kind === 'sheet' ? PARITY : META;
  if (principal !== needed) return false;
  const rawSecret = kind === 'sheet' ? env.MIRROR_PARITY_READ_HMAC_SECRET : env.MIRROR_METADATA_READ_HMAC_SECRET;
  if (typeof rawSecret !== 'string' || rawSecret.length < 32 || rawSecret.length > 256) return false;
  const stamp = request.headers.get(AUTH_HEADER_NAMES.timestamp) || '';
  if (!/^[1-9]\d{9,11}$/.test(stamp)) return false;
  const requestTime = Number(stamp) * 1000;
  if (!Number.isSafeInteger(requestTime) || Math.abs(Date.now() - requestTime) > WINDOW_MS) return false;
  const nonce = request.headers.get(AUTH_HEADER_NAMES.nonce) || '';
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(nonce)) return false;
  const sig = request.headers.get(AUTH_HEADER_NAMES.signature) || '';
  if (!/^[a-f0-9]{64}$/.test(sig)) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(rawSecret), {name:'HMAC', hash:'SHA-256'}, false, ['verify']
  );
  const bytes = Uint8Array.from(sig.match(/../g), x => parseInt(x, 16));
  const payload = mirrorReadSignaturePayload(request.method, url, stamp, nonce, principal);
  const verified = await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(payload));
  return verified ? {scope:principal, nonce, validUntil:requestTime + WINDOW_MS} : null;
}
export async function handleMirrorServiceRead(request, env = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!isMirrorServiceReadPath(path)) return null;
  if (request.method !== 'GET') return answer(405, 'method-not-allowed');
  if (env.MIRROR_SERVICE_READ_ENABLED !== 'true') return answer(404, 'mirror-service-disabled');
  // Never put machine credentials in a browser, even for an allowed CORS origin.
  if (request.headers.has('Origin')) return answer(403, 'browser-origin-not-allowed');
  const kind = path.slice(PREFIX.length);
  const checked = validQuery(url, kind);
  if (!checked.ok) return answer(403, 'mirror-read-scope-not-allowed');
  if (kind === 'sheet') {
    if (env.MIRROR_PARITY_READ_ENABLED !== 'true') return answer(404, 'mirror-row-read-disabled');
  } else if (env.MIRROR_METADATA_READ_ENABLED !== 'true') {
    return answer(404, 'mirror-metadata-read-disabled');
  }
  let authenticated;
  try {
    authenticated = await checkAuth(request, env, url, kind);
    if (!authenticated) return answer(401, 'service-not-authorized');
  } catch (_e) {
    return answer(401, 'service-not-authorized');
  }
  // Authentication is not replay protection. A Cloudflare Durable Object must
  // atomically consume this signed nonce. No DO binding => NO DATA READ.
  try {
    const namespace = env.MIRROR_SERVICE_READ_REPLAY_DO;
    if (!namespace || typeof namespace.idFromName !== 'function' ||
        typeof namespace.get !== 'function') return answer(503, 'replay-guard-unavailable');
    const id = namespace.idFromName(authenticated.principal);
    const stub = namespace.get(id);
    if (!stub || typeof stub.fetch !== 'function') return answer(503, 'replay-guard-unavailable');
    const receipt = await stub.fetch(new Request('https://mirror-replay.internal/consume', {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify(authenticated)
    }));
    if (receipt.status === 409) return answer(409, 'request-replay-denied');
    if (receipt.status !== 200) return answer(503, 'replay-guard-unavailable');
  } catch (_e) {
    return answer(503, 'replay-guard-unavailable');
  }
  try {
    if (!env.DB || typeof env.DB.prepare !== 'function') throw Error('DB_UNAVAILABLE');
    const payload = await readMirrorServicePayload(kind, env, url);
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (bytes.length > MAX_BODY_BYTES) throw Error('RESPONSE_TOO_LARGE');
    return answer(payload.success ? 200 : 404, payload.success ? 'ok' : 'not-found', payload);
  } catch (_e) {
    // No SQL or customer identifiers in externally visible error responses.
    return answer(503, 'mirror-service-unavailable');
  }
}
