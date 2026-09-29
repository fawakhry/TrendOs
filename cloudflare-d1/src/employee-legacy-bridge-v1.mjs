import { verifyNativeEmployeeSession } from './employee-auth-native-v1.mjs';

const PATH = '/v1/employee/legacy-action';
const HEALTH_PATH = '/v1/employee/legacy-action/health';
const ASSERTION_DOMAIN = 'trendos-employee-legacy-bridge-v1';
const ASSERTION_PREFIX = 'cfv1';
const UPSTREAM_WRAPPER_ACTION = 'cloudEmployeeLegacyBridgeExecuteV1';
const DEFAULT_TTL_SECONDS = 45;
const MAX_TTL_SECONDS = 90;
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'https://trendos-ui.pages.dev',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const FORBIDDEN_ACTIONS = new Set([
  'login',
  'logout',
  'verifyEmployeeSession',
  'changePassword',
  'customerLogin',
  'customerLogout',
  'changeCustomerPassword',
  UPSTREAM_WRAPPER_ACTION
]);

const OP_SCOPED_ACTIONS = new Set([
  'attendanceV1',
  'attendanceClockinV1',
  'cleaningV1',
  'customerFeedbackV1',
  'customerManagerV1',
  'goLiveAutopilotV1',
  'hrV1',
  'pressControlV1'
]);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function enabledValue(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}

function configuredOrigins(env) {
  const configured = String(env && env.CORS_ORIGINS || '')
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
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function allowedOrigin(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || configuredOrigins(env).includes(origin);
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

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmacBase64Url(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64Url(new Uint8Array(signature));
}

async function sha256Base64Url(value) {
  const bytes = new TextEncoder().encode(String(value == null ? '' : value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return base64Url(new Uint8Array(digest));
}

function assertionTtlSeconds(env) {
  return clampInt(
    env && env.EMPLOYEE_LEGACY_BRIDGE_ASSERTION_TTL_SECONDS,
    DEFAULT_TTL_SECONDS,
    15,
    MAX_TTL_SECONDS
  );
}

function configuredActions(env) {
  return new Set(
    String(env && env.EMPLOYEE_LEGACY_BRIDGE_ACTIONS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key]);
    return out;
  }
  return value;
}

export function canonicalLegacyPayloadV1(value) {
  return JSON.stringify(stableValue(value && typeof value === 'object' ? value : {}));
}

export async function legacyPayloadDigestV1(value) {
  return sha256Base64Url(canonicalLegacyPayloadV1(value));
}

function sanitizedTargetPayload(body, nativeUser, action) {
  const target = { ...(body || {}) };
  delete target.token;
  delete target.password;
  delete target.oldPassword;
  delete target.newPassword;
  delete target.confirmPassword;
  delete target.employeePassword;
  delete target.cloudEmployeeAssertionV1;
  delete target.targetAction;
  delete target.targetPayload;
  delete target._cloudEmployeeAuthBridgeV1;
  delete target._ts;
  target.action = text(action);
  target.username = text(nativeUser && (nativeUser.username || nativeUser.name));
  return target;
}

export function employeeLegacyBridgeEnabled(env) {
  return enabledValue(env && env.TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED);
}

export function isEmployeeLegacyBridgePath(path) {
  return path === PATH || path === HEALTH_PATH;
}

export function employeeLegacyBridgeActionAllowed(action, env, body = {}) {
  const value = text(action);
  if (!value || FORBIDDEN_ACTIONS.has(value)) return false;
  const policies = configuredActions(env);
  if (OP_SCOPED_ACTIONS.has(value)) {
    const op = text(body && body.op);
    if (!op) return false;
    return policies.has(value + ':' + op);
  }
  return policies.has(value);
}

export async function createEmployeeLegacyBridgeAssertionV1(
  user,
  action,
  targetPayload,
  env,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const secret = text(env && env.EMPLOYEE_LEGACY_BRIDGE_SECRET_V1);
  if (secret.length < 32) throw new Error('EMPLOYEE_LEGACY_BRIDGE_SECRET_V1 is not configured');
  const username = text(user && (user.username || user.name));
  if (!username) throw new Error('canonical username is required');

  const now = Number(nowSeconds);
  const claims = {
    v: 1,
    sub: username,
    role: text(user && user.role).toLowerCase(),
    department: text(user && user.department),
    screens: Array.isArray(user && user.screens) ? user.screens.map(text) : [],
    mustChange: !!(user && user.mustChange),
    active: user && user.active !== false,
    action: text(action),
    bodyDigest: await legacyPayloadDigestV1(targetPayload),
    iat: now,
    exp: now + assertionTtlSeconds(env),
    nonce: crypto.randomUUID()
  };
  const payload = base64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await hmacBase64Url(ASSERTION_DOMAIN + '\n' + payload, secret);
  return {
    token: ASSERTION_PREFIX + '.' + payload + '.' + signature,
    claims
  };
}

async function parseBody(request) {
  try {
    return { ok: true, body: await request.json() };
  } catch (err) {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }
}

function nativeCredentials(request, body) {
  const auth = text(request.headers.get('Authorization'));
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  return {
    username: text(body && (body.username || body.name)),
    token: text(bearer ? bearer[1] : body && body.token)
  };
}

async function health(env) {
  const actions = configuredActions(env);
  return {
    success: true,
    enabled: employeeLegacyBridgeEnabled(env),
    upstreamConfigured: !!text(env && env.APPS_SCRIPT_API_URL),
    secretConfigured: text(env && env.EMPLOYEE_LEGACY_BRIDGE_SECRET_V1).length >= 32,
    allowedPolicyCount: actions.size,
    opScopedActions: Array.from(OP_SCOPED_ACTIONS).sort(),
    assertionTtlSeconds: assertionTtlSeconds(env),
    rawNativeTokenForwarded: false,
    plaintextPasswordForwarded: false,
    assertionBoundToAction: true,
    assertionBoundToPayload: true,
    replayNonceIssued: true,
    authAuthority: 'd1-native-employee-v1'
  };
}

export async function handleEmployeeLegacyBridgeRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!allowedOrigin(request, env)) return json({ success: false, message: 'Origin not allowed' }, 403, cors);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!isEmployeeLegacyBridgePath(path)) return json({ success: false, message: 'Legacy employee bridge route not found' }, 404, cors);

  if (path === HEALTH_PATH) {
    if (request.method !== 'GET') return json({ success: false, message: 'Method not allowed' }, 405, cors);
    return json(await health(env), 200, cors);
  }

  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405, cors);
  if (!employeeLegacyBridgeEnabled(env)) {
    return json({ success: false, code: 'employee-legacy-bridge-disabled' }, 503, cors);
  }

  const upstream = text(env && env.APPS_SCRIPT_API_URL);
  const secret = text(env && env.EMPLOYEE_LEGACY_BRIDGE_SECRET_V1);
  if (!upstream || secret.length < 32) {
    return json({ success: false, code: 'employee-legacy-bridge-not-configured' }, 503, cors);
  }

  const parsed = await parseBody(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);
  const body = parsed.body || {};
  const action = text(body.action);
  if (!employeeLegacyBridgeActionAllowed(action, env, body)) {
    return json({
      success: false,
      code: 'legacy-action-not-allowed',
      action,
      op: text(body && body.op)
    }, 403, cors);
  }

  const credentials = nativeCredentials(request, body);
  if (!credentials.username || !credentials.token) {
    return json({ success: false, message: 'username and native session token are required' }, 400, cors);
  }

  const verified = await verifyNativeEmployeeSession(credentials.username, credentials.token, env);
  if (!verified || !verified.hit) {
    return json({ success: false, code: 'native-employee-session-rejected' }, 401, cors);
  }

  const nativeUser = verified.body && verified.body.user || {};
  if (nativeUser.active === false) {
    return json({ success: false, code: 'employee-inactive' }, 403, cors);
  }
  if (nativeUser.mustChange === true) {
    return json({ success: false, code: 'employee-password-change-required' }, 428, cors);
  }

  const targetPayload = sanitizedTargetPayload(body, nativeUser, action);
  const assertion = await createEmployeeLegacyBridgeAssertionV1(nativeUser, action, targetPayload, env);

  const forwarded = {
    action: UPSTREAM_WRAPPER_ACTION,
    username: text(nativeUser.username || credentials.username),
    targetAction: action,
    targetPayload,
    cloudEmployeeAssertionV1: assertion.token,
    _cloudEmployeeAuthBridgeV1: 1,
    _ts: Date.now()
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(forwarded),
      redirect: 'follow',
      signal: controller.signal
    });
    const raw = await response.text();
    let result = {};
    try {
      result = JSON.parse(raw || '{}');
    } catch (err) {
      return json({ success: false, code: 'legacy-upstream-invalid-json' }, 502, cors);
    }
    if (!response.ok) {
      return json({
        success: false,
        code: 'legacy-upstream-http-error',
        status: response.status,
        message: text(result && result.message) || 'Legacy action upstream failed'
      }, 502, cors);
    }
    return json(result, 200, cors);
  } catch (err) {
    const code = err && err.name === 'AbortError' ? 'legacy-upstream-timeout' : 'legacy-upstream-failed';
    return json({ success: false, code }, 502, cors);
  } finally {
    clearTimeout(timer);
  }
}
