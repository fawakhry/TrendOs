import { cloudAuthTokenFingerprint } from './cloud-auth-shadow-v1.mjs';

const LOGIN_PATH = '/v1/employee/auth/login';
const VERIFY_PATH = '/v1/employee/auth/session';
const LOGOUT_PATH = '/v1/employee/auth/logout';
const PASSWORD_PATH = '/v1/employee/auth/password/change';
const HEALTH_PATH = '/v1/employee/auth/health';
const ENROLL_PATH = '/v1/employee/auth/enroll-legacy-session';

// Cloudflare workerd production caps WebCrypto PBKDF2 at 100,000 iterations.
// Keep v1 deterministic at that ceiling; a stronger KDF must use a new scheme version.
const DEFAULT_ITERATIONS = 100000;
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 100000;
const DEFAULT_SESSION_TTL_SECONDS = 28800;
const MAX_SESSION_TTL_SECONDS = 86400;
const LOGIN_LIMIT = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const LEGACY_BOOTSTRAP_TIMEOUT_MS = 90000;
const LEGACY_BOOTSTRAP_TRANSIENT_RETRY_MS = 1500;
const LEGACY_SESSION_VERIFY_TIMEOUT_MS = 90000;
const PASSWORD_SCHEME = 'pbkdf2-sha256-v1';
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'https://trendos-ui.pages.dev',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function text(value) {
  return String(value == null ? '' : value).trim();
}

function usernameKey(value) {
  return text(value).toLowerCase();
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

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value) {
  const s = text(value);
  if (!s || s.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(s)) throw new Error('invalid hex');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function constantTimeEqual(a, b) {
  const x = text(a).toLowerCase();
  const y = text(b).toLowerCase();
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function screensForRole(roleValue) {
  const role = text(roleValue).toLowerCase();
  if (role === 'admin') return ['service', 'print', 'laser', 'press', ''];
  if (role === 'print' || role === 'press') return ['print', 'press', ''];
  if (role === 'laser') return ['laser', ''];
  return ['service', ''];
}

function safeScreens(value, role) {
  const arr = Array.isArray(value) ? value : screensForRole(role);
  return arr.map(text).filter((entry, index, all) => entry || index === all.length - 1);
}

function sessionTtlSeconds(env) {
  return clampInt(
    env && env.EMPLOYEE_AUTH_SESSION_TTL_SECONDS,
    DEFAULT_SESSION_TTL_SECONDS,
    600,
    MAX_SESSION_TTL_SECONDS
  );
}

function passwordIterations(env) {
  return clampInt(
    env && env.EMPLOYEE_AUTH_PBKDF2_ITERATIONS,
    DEFAULT_ITERATIONS,
    MIN_ITERATIONS,
    MAX_ITERATIONS
  );
}

export function employeeAuthEnabled(env) {
  return enabledValue(env && env.TRENDOS_EMPLOYEE_AUTH_V1_ENABLED);
}

export function employeeAuthLegacyBootstrapEnabled(env) {
  return enabledValue(env && env.TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED);
}

export function employeeAuthNativeOnlyEnabled(env) {
  return enabledValue(env && env.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1);
}

export function employeeAuthLegacySessionEnrollEnabled(env) {
  return enabledValue(env && env.TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED);
}

export function isEmployeeNativeAuthPath(path) {
  return [LOGIN_PATH, VERIFY_PATH, LOGOUT_PATH, PASSWORD_PATH, HEALTH_PATH, ENROLL_PATH].includes(path);
}

export async function hashEmployeePasswordV1(password, options = {}) {
  const secret = String(password == null ? '' : password);
  if (!secret) throw new Error('password required');
  const iterations = clampInt(options.iterations, DEFAULT_ITERATIONS, MIN_ITERATIONS, MAX_ITERATIONS);
  const salt = options.saltHex ? hexToBytes(options.saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
  return {
    scheme: PASSWORD_SCHEME,
    iterations,
    saltHex: bytesToHex(salt),
    hashHex: bytesToHex(new Uint8Array(bits))
  };
}

export async function verifyEmployeePasswordV1(password, record) {
  if (!record || text(record.passwordScheme || record.password_scheme) !== PASSWORD_SCHEME) return false;
  const iterations = Number(record.passwordIterations || record.password_iterations || 0);
  const saltHex = text(record.passwordSaltHex || record.password_salt_hex);
  const expected = text(record.passwordHashHex || record.password_hash_hex);
  if (!iterations || !saltHex || !expected) return false;
  const actual = await hashEmployeePasswordV1(password, { iterations, saltHex });
  return constantTimeEqual(actual.hashHex, expected);
}

async function controlState(env) {
  if (!env || !env.DB) return { schemaReady: false, mode: 'OFF', reason: 'db-missing' };
  try {
    const row = await env.DB.prepare(
      "SELECT marker,mode,policy_epoch AS policyEpoch FROM employee_auth_control_v1 WHERE singleton=1 LIMIT 1"
    ).first();
    if (!row || text(row.marker) !== 'T12_EMPLOYEE_AUTH_V1') {
      return { schemaReady: false, mode: 'OFF', reason: 'control-missing' };
    }
    return {
      schemaReady: true,
      mode: text(row.mode || 'OFF').toUpperCase(),
      policyEpoch: Number(row.policyEpoch || 0),
      reason: 'ready'
    };
  } catch (err) {
    return { schemaReady: false, mode: 'OFF', reason: 'db-read-error' };
  }
}

async function findUser(env, username) {
  const key = usernameKey(username);
  if (!env || !env.DB || !key) return null;
  try {
    return await env.DB.prepare(`
      SELECT employee_id AS employeeId,
             username_key AS usernameKey,
             canonical_username AS canonicalUsername,
             password_scheme AS passwordScheme,
             password_iterations AS passwordIterations,
             password_salt_hex AS passwordSaltHex,
             password_hash_hex AS passwordHashHex,
             must_change AS mustChange,
             active,
             role,
             department,
             screens_json AS screensJson,
             session_version AS sessionVersion,
             failed_attempts AS failedAttempts,
             locked_until_ms AS lockedUntilMs,
             migrated_at_ms AS migratedAtMs,
             last_login_at_ms AS lastLoginAtMs
        FROM employee_auth_users_v1
       WHERE username_key=?
       LIMIT 1
    `).bind(key).first();
  } catch (err) {
    return null;
  }
}

function parseScreensJson(value, role) {
  try {
    const parsed = JSON.parse(text(value) || '[]');
    return safeScreens(parsed, role);
  } catch (err) {
    return screensForRole(role);
  }
}

function publicUser(row) {
  return {
    username: text(row && row.canonicalUsername),
    name: text(row && row.canonicalUsername),
    role: text(row && row.role || 'service').toLowerCase(),
    department: text(row && row.department),
    screens: parseScreensJson(row && row.screensJson, row && row.role),
    mustChange: Number(row && row.mustChange || 0) === 1,
    active: Number(row && row.active == null ? 1 : row.active) === 1
  };
}

async function noteNativeFailure(env, row, nowMs) {
  if (!env || !env.DB || !row) return;
  const attempts = Number(row.failedAttempts || 0) + 1;
  const lockedUntil = attempts >= LOGIN_LIMIT ? Number(nowMs) + LOGIN_LOCK_MS : Number(row.lockedUntilMs || 0);
  try {
    await env.DB.prepare(`
      UPDATE employee_auth_users_v1
         SET failed_attempts=?,
             locked_until_ms=?,
             updated_at=CURRENT_TIMESTAMP
       WHERE username_key=?
    `).bind(attempts, lockedUntil, row.usernameKey).run();
  } catch (err) {}
}

async function clearNativeFailures(env, row) {
  if (!env || !env.DB || !row) return;
  try {
    await env.DB.prepare(`
      UPDATE employee_auth_users_v1
         SET failed_attempts=0,
             locked_until_ms=0,
             updated_at=CURRENT_TIMESTAMP
       WHERE username_key=?
    `).bind(row.usernameKey).run();
  } catch (err) {}
}

async function upsertBootstrappedUser(env, username, password, legacyBody, nowMs) {
  const user = legacyBody && legacyBody.user || {};
  const canonicalUsername = text(user.username || user.name || username);
  const role = text(user.role || 'service').toLowerCase();
  const department = text(user.department);
  const screens = safeScreens(user.screens, role);
  const mustChange = user.mustChange === false ? 0 : 1;
  let verifier;
  try {
    verifier = await hashEmployeePasswordV1(password, { iterations: passwordIterations(env) });
  } catch (err) {
    try { err.employeeAuthStage = 'password-hash'; } catch (_) {}
    throw err;
  }
  const key = usernameKey(canonicalUsername || username);
  const employeeId = 'EMP-' + crypto.randomUUID();

  try {
    await env.DB.prepare(`
    INSERT INTO employee_auth_users_v1 (
      employee_id,username_key,canonical_username,
      password_scheme,password_iterations,password_salt_hex,password_hash_hex,
      must_change,active,role,department,screens_json,session_version,
      failed_attempts,locked_until_ms,migrated_at_ms,last_login_at_ms,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,1,?,?,?,?,0,0,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(username_key) DO UPDATE SET
      canonical_username=excluded.canonical_username,
      password_scheme=excluded.password_scheme,
      password_iterations=excluded.password_iterations,
      password_salt_hex=excluded.password_salt_hex,
      password_hash_hex=excluded.password_hash_hex,
      must_change=excluded.must_change,
      active=1,
      role=excluded.role,
      department=excluded.department,
      screens_json=excluded.screens_json,
      failed_attempts=0,
      locked_until_ms=0,
      migrated_at_ms=excluded.migrated_at_ms,
      last_login_at_ms=excluded.last_login_at_ms,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    employeeId,
    key,
    canonicalUsername || text(username),
    verifier.scheme,
    verifier.iterations,
    verifier.saltHex,
    verifier.hashHex,
    mustChange,
    role,
    department,
    JSON.stringify(screens),
    1,
    Number(nowMs),
    Number(nowMs)
  ).run();
  } catch (err) {
    try { err.employeeAuthStage = 'd1-user-upsert'; } catch (_) {}
    throw err;
  }

  return findUser(env, key);
}

async function legacyLoginBootstrap(username, password, env, nowMs) {
  const upstream = text(env && env.APPS_SCRIPT_API_URL);
  if (!upstream) return { ok: false, kind: 'config', message: 'Legacy bootstrap is not configured' };

  let body = {};
  let success = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LEGACY_BOOTSTRAP_TIMEOUT_MS);
    try {
      let response;
      let raw = '';
      try {
        response = await fetch(upstream, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'login', username: text(username), password: String(password || ''), _ts: Date.now() }),
          redirect: 'follow',
          signal: controller.signal
        });
        raw = await response.text();
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { ok: false, kind: 'upstream', message: 'Legacy login bootstrap timed out' };
        }
        return { ok: false, kind: 'upstream', message: 'Legacy login bootstrap request failed' };
      }

      try {
        body = JSON.parse(raw || '{}');
      } catch (err) {
        const retryable = attempt === 1 && (
          response.status === 404 ||
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500
        );
        if (retryable) {
          await new Promise((resolve) => setTimeout(resolve, LEGACY_BOOTSTRAP_TRANSIENT_RETRY_MS));
          continue;
        }
        return { ok: false, kind: 'upstream', message: 'Legacy login returned invalid JSON' };
      }

      if (response.ok && body && body.success === true) {
        success = true;
        break;
      }

      const retryable = attempt === 1 && (
        response.status === 404 ||
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500
      );
      if (retryable) {
        await new Promise((resolve) => setTimeout(resolve, LEGACY_BOOTSTRAP_TRANSIENT_RETRY_MS));
        continue;
      }

      if (!response.ok) {
        return { ok: false, kind: 'upstream', message: 'Legacy login bootstrap upstream rejected the request' };
      }
      return { ok: false, kind: 'auth', message: text(body && body.message) || 'Employee login rejected' };
    } finally {
      clearTimeout(timer);
    }
  }

  if (!success) {
    return { ok: false, kind: 'upstream', message: 'Legacy login bootstrap upstream unavailable' };
  }

  const row = await upsertBootstrappedUser(env, username, password, body, nowMs);

  // Best-effort cleanup of the temporary Apps Script token created solely to
  // validate the transitional bootstrap. Token value is never persisted in D1.
  const legacyToken = text(body && body.user && body.user.token);
  if (legacyToken) {
    try {
      await fetch(upstream, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'logout', username: text(body.user.username || username), token: legacyToken, _ts: Date.now() }),
        redirect: 'follow'
      });
    } catch (err) {}
  }

  return { ok: !!row, row, kind: row ? 'bootstrapped' : 'db', message: row ? '' : 'Native bootstrap failed' };
}

async function issueNativeSession(env, row, nowMs) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const fingerprint = await cloudAuthTokenFingerprint(row.canonicalUsername, token, env);
  const ttl = sessionTtlSeconds(env);
  const expiresAtMs = Number(nowMs) + ttl * 1000;
  await env.DB.prepare(`
    INSERT INTO employee_auth_sessions_v1 (
      username_key,token_fingerprint,session_version,
      issued_at_ms,expires_at_ms,last_seen_at_ms,revoked_at_ms,source
    ) VALUES (?,?,?,?,?,?,NULL,'d1-native')
    ON CONFLICT(username_key,token_fingerprint) DO UPDATE SET
      session_version=excluded.session_version,
      issued_at_ms=excluded.issued_at_ms,
      expires_at_ms=excluded.expires_at_ms,
      last_seen_at_ms=excluded.last_seen_at_ms,
      revoked_at_ms=NULL,
      source='d1-native'
  `).bind(
    row.usernameKey,
    fingerprint,
    Number(row.sessionVersion || 1),
    Number(nowMs),
    Number(expiresAtMs),
    Number(nowMs)
  ).run();
  return { token, expiresAtMs, expiresIn: ttl };
}

export async function verifyNativeEmployeeSession(username, employeeToken, env, nowMs = Date.now()) {
  const key = usernameKey(username);
  const token = text(employeeToken);
  if (!key || !token) return { hit: false, reason: 'credentials-missing' };
  if (!env || !env.DB) return { hit: false, reason: 'db-missing' };

  let fingerprint = '';
  try {
    fingerprint = await cloudAuthTokenFingerprint(username, token, env);
  } catch (err) {
    return { hit: false, reason: 'fingerprint-error' };
  }

  try {
    const row = await env.DB.prepare(`
      SELECT s.username_key AS usernameKey,
             s.session_version AS sessionVersion,
             s.expires_at_ms AS expiresAtMs,
             u.canonical_username AS canonicalUsername,
             u.role,
             u.department,
             u.screens_json AS screensJson,
             u.must_change AS mustChange,
             u.active,
             u.session_version AS currentSessionVersion
        FROM employee_auth_sessions_v1 s
        JOIN employee_auth_users_v1 u ON u.username_key=s.username_key
       WHERE s.username_key=?
         AND s.token_fingerprint=?
         AND s.revoked_at_ms IS NULL
         AND s.expires_at_ms>?
       LIMIT 1
    `).bind(key, fingerprint, Number(nowMs)).first();

    if (!row) return { hit: false, reason: 'miss' };
    if (Number(row.active) !== 1) return { hit: false, reason: 'inactive' };
    if (Number(row.sessionVersion) !== Number(row.currentSessionVersion)) return { hit: false, reason: 'session-version-mismatch' };

    try {
      await env.DB.prepare(`
        UPDATE employee_auth_sessions_v1
           SET last_seen_at_ms=?
         WHERE username_key=? AND token_fingerprint=?
      `).bind(Number(nowMs), key, fingerprint).run();
    } catch (err) {}

    const user = {
      username: text(row.canonicalUsername) || text(username),
      name: text(row.canonicalUsername) || text(username),
      role: text(row.role || 'service').toLowerCase(),
      department: text(row.department),
      screens: parseScreensJson(row.screensJson, row.role),
      mustChange: Number(row.mustChange || 0) === 1,
      active: true
    };
    return {
      hit: true,
      reason: 'hit',
      authSource: 'd1-native-employee-v1',
      body: { success: true, username: user.username, user },
      expiresAtMs: Number(row.expiresAtMs || 0)
    };
  } catch (err) {
    return { hit: false, reason: 'db-read-error' };
  }
}

async function parseJson(request) {
  try {
    return { ok: true, body: await request.json() };
  } catch (err) {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }
}

async function health(env) {
  const control = await controlState(env);
  let userCount = 0;
  let nativeReadyCount = 0;
  let mustChangeCount = 0;
  if (control.schemaReady && env && env.DB) {
    try {
      const row = await env.DB.prepare(`
        SELECT COUNT(*) AS userCount,
               SUM(CASE WHEN password_scheme=? AND password_hash_hex<>'' THEN 1 ELSE 0 END) AS nativeReadyCount,
               SUM(CASE WHEN must_change=1 THEN 1 ELSE 0 END) AS mustChangeCount
          FROM employee_auth_users_v1
      `).bind(PASSWORD_SCHEME).first();
      userCount = Number(row && row.userCount || 0);
      nativeReadyCount = Number(row && row.nativeReadyCount || 0);
      mustChangeCount = Number(row && row.mustChangeCount || 0);
    } catch (err) {}
  }
  return {
    success: true,
    schemaReady: control.schemaReady,
    mode: control.mode,
    envEnabled: employeeAuthEnabled(env),
    legacyBootstrapEnabled: employeeAuthLegacyBootstrapEnabled(env),
    legacySessionEnrollEnabled: employeeAuthLegacySessionEnrollEnabled(env),
    nativeOnly: employeeAuthNativeOnlyEnabled(env),
    enrollCanaryUserConfigured: !!text(env && env.EMPLOYEE_AUTH_ENROLL_CANARY_USER),
    enrollNonceConfigured: !!text(env && env.EMPLOYEE_AUTH_ENROLL_NONCE),
    userCount,
    nativeReadyCount,
    mustChangeCount,
    passwordScheme: PASSWORD_SCHEME,
    plaintextStored: false
  };
}


async function verifyLegacySessionForEnrollment(username, legacyToken, env) {
  const upstream = text(env && env.APPS_SCRIPT_API_URL);
  if (!upstream) return { ok: false, kind: 'config', message: 'Legacy session verification is not configured' };
  if (!username || !legacyToken) return { ok: false, kind: 'input', message: 'username and legacyToken are required' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEGACY_SESSION_VERIFY_TIMEOUT_MS);
  try {
    let response;
    let raw = '';
    try {
      response = await fetch(upstream, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'verifyEmployeeSession', username: text(username), token: text(legacyToken), _ts: Date.now() }),
        redirect: 'follow',
        signal: controller.signal
      });
      raw = await response.text();
    } catch (err) {
      return {
        ok: false,
        kind: 'upstream',
        message: err && err.name === 'AbortError'
          ? 'Legacy session verification timed out'
          : 'Legacy session verification request failed'
      };
    }
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch (err) {
      return { ok: false, kind: 'upstream', message: 'Legacy session verification returned invalid JSON' };
    }
    if (!response.ok || !body || body.success !== true) {
      return { ok: false, kind: 'auth', message: text(body && body.message) || 'Legacy employee session rejected' };
    }
    return { ok: true, body };
  } finally {
    clearTimeout(timer);
  }
}

async function handleLegacySessionEnroll(request, env, cors) {
  const parsed = await parseJson(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);

  const username = text(parsed.body && parsed.body.username);
  const legacyToken = text(parsed.body && parsed.body.legacyToken);
  const password = String(parsed.body && parsed.body.password || '');
  const enrollNonce = text(parsed.body && parsed.body.enrollNonce);
  const requestedMustChange = parsed.body && parsed.body.mustChange === true;

  if (!username || !legacyToken || !password || !enrollNonce) {
    return json({ success: false, message: 'username, legacyToken, password and enrollNonce are required' }, 400, cors);
  }

  const control = await controlState(env);
  if (!control.schemaReady ||
      control.mode !== 'TRANSITIONAL' ||
      !employeeAuthEnabled(env) ||
      !employeeAuthLegacySessionEnrollEnabled(env) ||
      employeeAuthNativeOnlyEnabled(env)) {
    return json({ success: false, code: 'employee-auth-enrollment-disabled', mode: control.mode }, 503, cors);
  }

  const allowedUser = text(env && env.EMPLOYEE_AUTH_ENROLL_CANARY_USER);
  const expectedNonce = text(env && env.EMPLOYEE_AUTH_ENROLL_NONCE);
  if (!allowedUser || usernameKey(allowedUser) !== usernameKey(username)) {
    return json({ success: false, code: 'employee-auth-enrollment-user-denied' }, 403, cors);
  }
  if (enrollNonce.length < 32) {
    return json({ success: false, code: 'employee-auth-enrollment-nonce-denied' }, 403, cors);
  }
  if (expectedNonce && !constantTimeEqual(enrollNonce, expectedNonce)) {
    return json({ success: false, code: 'employee-auth-enrollment-nonce-denied' }, 403, cors);
  }

  const existing = await findUser(env, username);
  if (existing && existing.passwordScheme === PASSWORD_SCHEME && text(existing.passwordHashHex)) {
    return json({ success: false, code: 'employee-auth-already-enrolled' }, 409, cors);
  }

  const verified = await verifyLegacySessionForEnrollment(username, legacyToken, env);
  if (!verified.ok) {
    const status = verified.kind === 'upstream' || verified.kind === 'config' ? 502 :
      (verified.kind === 'input' ? 400 : 401);
    return json({ success: false, code: 'employee-auth-legacy-session-rejected', message: verified.message }, status, cors);
  }

  const legacyBody = verified.body || {};
  legacyBody.user = { ...(legacyBody.user || {}), mustChange: requestedMustChange };
  let row = null;
  try {
    row = await upsertBootstrappedUser(env, username, password, legacyBody, Date.now());
  } catch (err) {
    return json({
      success: false,
      code: 'employee-auth-enrollment-upsert-failed',
      stage: text(err && err.employeeAuthStage) || 'unknown'
    }, 503, cors);
  }
  if (!row) return json({ success: false, code: 'employee-auth-enrollment-db-failed' }, 503, cors);

  return json({
    success: true,
    user: publicUser(row),
    authSource: 'd1-native-legacy-session-enroll-v1',
    plaintextStored: false
  }, 200, cors);
}

async function handleLogin(request, env, cors) {
  const parsed = await parseJson(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);
  const username = text(parsed.body && parsed.body.username);
  const password = String(parsed.body && parsed.body.password || '');
  if (!username || !password) return json({ success: false, message: 'username and password are required' }, 400, cors);

  const control = await controlState(env);
  if (!control.schemaReady) return json({ success: false, code: 'employee-auth-schema-not-ready' }, 503, cors);
  if (!employeeAuthEnabled(env) || control.mode === 'OFF') {
    return json({ success: false, code: 'employee-auth-disabled', mode: control.mode }, 503, cors);
  }

  const nowMs = Date.now();
  let row = await findUser(env, username);
  if (row && Number(row.active) !== 1) {
    return json({ success: false, message: 'هذا المستخدم غير مفعل.' }, 401, cors);
  }

  if (row && Number(row.lockedUntilMs || 0) > nowMs) {
    return json({ success: false, rateLimited: true, message: 'تم إيقاف محاولات الدخول مؤقتًا لمدة 15 دقيقة لحماية الحساب.' }, 429, cors);
  }

  const nativeReady = !!(row && row.passwordScheme === PASSWORD_SCHEME && text(row.passwordHashHex));
  if (nativeReady) {
    const ok = await verifyEmployeePasswordV1(password, row);
    if (!ok) {
      await noteNativeFailure(env, row, nowMs);
      return json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' }, 401, cors);
    }
    await clearNativeFailures(env, row);
  } else {
    const mayBootstrap = control.mode === 'TRANSITIONAL' && employeeAuthLegacyBootstrapEnabled(env);
    if (!mayBootstrap || employeeAuthNativeOnlyEnabled(env)) {
      return json({ success: false, code: 'employee-native-migration-required', message: 'الحساب لم يكتمل نقله إلى تسجيل الدخول السحابي.' }, 409, cors);
    }
    let boot;
    try {
      boot = await legacyLoginBootstrap(username, password, env, nowMs);
    } catch (err) {
      return json({
        success: false,
        code: 'employee-auth-login-bootstrap-upsert-failed',
        stage: text(err && err.employeeAuthStage) || 'unknown'
      }, 503, cors);
    }
    if (!boot.ok || !boot.row) {
      return json({ success: false, message: boot.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.' }, boot.kind === 'config' || boot.kind === 'upstream' ? 502 : 401, cors);
    }
    row = boot.row;
  }

  if (!row) return json({ success: false, code: 'employee-auth-row-missing' }, 500, cors);

  try {
    await env.DB.prepare(`
      UPDATE employee_auth_users_v1
         SET last_login_at_ms=?, failed_attempts=0, locked_until_ms=0, updated_at=CURRENT_TIMESTAMP
       WHERE username_key=?
    `).bind(Number(nowMs), row.usernameKey).run();
  } catch (err) {}

  row = await findUser(env, row.usernameKey) || row;
  const session = await issueNativeSession(env, row, nowMs);
  const user = publicUser(row);
  user.token = session.token;

  return json({
    success: true,
    user,
    expiresAt: new Date(session.expiresAtMs).toISOString(),
    authSource: nativeReady ? 'd1-native-employee-v1' : 'd1-native-bootstrap-v1'
  }, 200, cors);
}

async function handleVerify(request, env, cors) {
  const parsed = await parseJson(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);
  const username = text(parsed.body && parsed.body.username);
  const token = text(parsed.body && parsed.body.token);
  const verified = await verifyNativeEmployeeSession(username, token, env);
  if (!verified.hit) return json({ success: false, message: 'Employee session rejected', reason: verified.reason }, 401, cors);
  return json({ ...verified.body, authSource: verified.authSource }, 200, cors);
}

async function handleLogout(request, env, cors) {
  const parsed = await parseJson(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);
  const username = text(parsed.body && parsed.body.username);
  const token = text(parsed.body && parsed.body.token);
  if (!username || !token) return json({ success: false, message: 'username and token are required' }, 400, cors);

  let fingerprint = '';
  try {
    fingerprint = await cloudAuthTokenFingerprint(username, token, env);
  } catch (err) {
    return json({ success: false, message: 'Employee session rejected' }, 401, cors);
  }

  try {
    await env.DB.prepare(`
      UPDATE employee_auth_sessions_v1
         SET revoked_at_ms=?
       WHERE username_key=? AND token_fingerprint=? AND revoked_at_ms IS NULL
    `).bind(Date.now(), usernameKey(username), fingerprint).run();
  } catch (err) {
    return json({ success: false, code: 'employee-session-revoke-failed' }, 503, cors);
  }
  return json({ success: true }, 200, cors);
}

async function handlePasswordChange(request, env, cors) {
  const parsed = await parseJson(request);
  if (!parsed.ok) return json({ success: false, message: parsed.message }, parsed.status, cors);
  const username = text(parsed.body && parsed.body.username);
  const token = text(parsed.body && parsed.body.token);
  const oldPassword = String(parsed.body && parsed.body.oldPassword || '');
  const newPassword = String(parsed.body && parsed.body.newPassword || '');
  if (!username || !token || !oldPassword || !newPassword) {
    return json({ success: false, message: 'username, token, oldPassword and newPassword are required' }, 400, cors);
  }
  if (newPassword.length < 6) {
    return json({ success: false, message: 'كلمة المرور الجديدة لا تقل عن 6 أرقام/حروف.' }, 400, cors);
  }

  const verifiedSession = await verifyNativeEmployeeSession(username, token, env);
  if (!verifiedSession.hit) return json({ success: false, message: 'Employee session rejected' }, 401, cors);

  const row = await findUser(env, username);
  if (!row || !(await verifyEmployeePasswordV1(oldPassword, row))) {
    return json({ success: false, message: 'كلمة المرور القديمة غير صحيحة.' }, 401, cors);
  }

  const verifier = await hashEmployeePasswordV1(newPassword, { iterations: passwordIterations(env) });
  const nextVersion = Number(row.sessionVersion || 1) + 1;
  const nowMs = Date.now();
  try {
    await env.DB.prepare(`
      UPDATE employee_auth_users_v1
         SET password_scheme=?,
             password_iterations=?,
             password_salt_hex=?,
             password_hash_hex=?,
             must_change=0,
             session_version=?,
             failed_attempts=0,
             locked_until_ms=0,
             migrated_at_ms=COALESCE(migrated_at_ms,?),
             updated_at=CURRENT_TIMESTAMP
       WHERE username_key=?
    `).bind(
      verifier.scheme,
      verifier.iterations,
      verifier.saltHex,
      verifier.hashHex,
      nextVersion,
      Number(nowMs),
      row.usernameKey
    ).run();

    await env.DB.prepare(`
      UPDATE employee_auth_sessions_v1
         SET revoked_at_ms=?
       WHERE username_key=? AND revoked_at_ms IS NULL
    `).bind(Number(nowMs), row.usernameKey).run();
  } catch (err) {
    return json({ success: false, code: 'employee-password-update-failed' }, 503, cors);
  }

  return json({
    success: true,
    forceRelogin: true,
    message: 'تم تغيير كلمة المرور. سجل الدخول مرة أخرى.',
    authSource: 'd1-native-employee-v1'
  }, 200, cors);
}

export async function handleEmployeeNativeAuthRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!allowedOrigin(request, env)) return json({ success: false, message: 'Origin not allowed' }, 403, cors);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!isEmployeeNativeAuthPath(path)) return json({ success: false, message: 'Employee auth route not found' }, 404, cors);

  if (path === HEALTH_PATH) {
    if (request.method !== 'GET') return json({ success: false, message: 'Method not allowed' }, 405, cors);
    return json(await health(env), 200, cors);
  }

  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405, cors);
  if (path === ENROLL_PATH) return handleLegacySessionEnroll(request, env, cors);
  if (path === LOGIN_PATH) return handleLogin(request, env, cors);
  if (path === VERIFY_PATH) return handleVerify(request, env, cors);
  if (path === LOGOUT_PATH) return handleLogout(request, env, cors);
  return handlePasswordChange(request, env, cors);
}
