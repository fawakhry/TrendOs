const DEFAULT_TTL_SECONDS = 43200;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 43200;
const FINGERPRINT_DOMAIN = 'trendos-cloud-auth-shadow-v1';

function text(value) {
  return String(value == null ? '' : value).trim();
}

function usernameKey(value) {
  return text(value).toLowerCase();
}

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}

function ttlSeconds(env) {
  return clampInt(env.CLOUD_AUTH_SHADOW_TTL_SECONDS, DEFAULT_TTL_SECONDS, MIN_TTL_SECONDS, MAX_TTL_SECONDS);
}

function enabledValue(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

export function cloudAuthShadowEnabled(env) {
  return enabledValue(env && env.TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToHex(new Uint8Array(signature));
}

export async function cloudAuthTokenFingerprint(username, employeeToken, env) {
  const secret = text(env && env.EDGE_SESSION_SECRET);
  const key = usernameKey(username);
  const token = text(employeeToken);
  if (!secret) throw new Error('EDGE_SESSION_SECRET is not configured');
  if (!key || !token) throw new Error('username and token are required');
  return hmacSha256(`${FINGERPRINT_DOMAIN}\n${key}\n${token}`, secret);
}

function safeScreens(value) {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((entry, index, all) => entry || index === all.length - 1);
}

function verifiedClaims(username, body) {
  const upstream = body || {};
  const user = upstream.user || {};
  const canonicalUsername = text(user.username || user.name || upstream.username || username);
  return {
    usernameKey: usernameKey(username),
    canonicalUsername,
    role: text(user.role || upstream.role),
    department: text(user.department || upstream.department),
    screens: safeScreens(user.screens || upstream.screens)
  };
}

export async function lookupCloudAuthShadow(username, employeeToken, env, nowMs = Date.now()) {
  if (!cloudAuthShadowEnabled(env)) return { hit: false, reason: 'disabled' };
  if (!env || !env.DB) return { hit: false, reason: 'db-missing' };

  const key = usernameKey(username);
  if (!key || !text(employeeToken)) return { hit: false, reason: 'credentials-missing' };

  let fingerprint = '';
  try {
    fingerprint = await cloudAuthTokenFingerprint(username, employeeToken, env);
  } catch (err) {
    return { hit: false, reason: 'fingerprint-error' };
  }

  let row = null;
  try {
    row = await env.DB.prepare(`
      SELECT canonical_username AS canonicalUsername,
             role,
             department,
             screens_json AS screensJson,
             verified_at_ms AS verifiedAtMs,
             expires_at_ms AS expiresAtMs,
             source
        FROM cloud_auth_sessions_v1
       WHERE username_key = ?
         AND token_fingerprint = ?
         AND revoked_at_ms IS NULL
         AND expires_at_ms > ?
       LIMIT 1
    `).bind(key, fingerprint, Number(nowMs)).first();
  } catch (err) {
    return { hit: false, reason: 'db-read-error' };
  }

  if (!row) return { hit: false, reason: 'miss' };

  // Sliding expiry keeps an already-verified active browser session Cloud-native
  // while it is being used. The token fingerprint remains exact; no plaintext
  // token is stored. Logout/change-password explicitly revoke the fingerprint.
  const extendedExpiresAtMs = Number(nowMs) + ttlSeconds(env) * 1000;
  try {
    await env.DB.prepare(`
      UPDATE cloud_auth_sessions_v1
         SET last_seen_at_ms = ?,
             expires_at_ms = ?
       WHERE username_key = ?
         AND token_fingerprint = ?
         AND revoked_at_ms IS NULL
         AND expires_at_ms > ?
    `).bind(Number(nowMs), extendedExpiresAtMs, key, fingerprint, Number(nowMs)).run();
  } catch (err) {
    // Read success remains authoritative for this request; extension is best-effort.
  }

  let screens = [];
  try { screens = JSON.parse(text(row.screensJson) || '[]'); } catch (err) { screens = []; }
  if (!Array.isArray(screens)) screens = [];

  return {
    hit: true,
    reason: 'hit',
    fingerprint,
    body: {
      success: true,
      username: text(row.canonicalUsername) || text(username),
      user: {
        username: text(row.canonicalUsername) || text(username),
        role: text(row.role),
        department: text(row.department),
        screens: safeScreens(screens)
      },
      authSource: 'd1-auth-shadow-v1'
    },
    verifiedAtMs: Number(row.verifiedAtMs || 0),
    expiresAtMs: Number(row.expiresAtMs || 0)
  };
}

export async function rememberCloudAuthShadow(username, employeeToken, verifiedBody, env, nowMs = Date.now()) {
  if (!cloudAuthShadowEnabled(env)) return { stored: false, reason: 'disabled' };
  if (!env || !env.DB) return { stored: false, reason: 'db-missing' };
  if (!verifiedBody || verifiedBody.success !== true) return { stored: false, reason: 'not-verified' };

  const claims = verifiedClaims(username, verifiedBody);
  if (!claims.usernameKey || !claims.canonicalUsername) return { stored: false, reason: 'claims-missing' };

  let fingerprint = '';
  try {
    fingerprint = await cloudAuthTokenFingerprint(username, employeeToken, env);
  } catch (err) {
    return { stored: false, reason: 'fingerprint-error' };
  }

  const expiresAtMs = Number(nowMs) + ttlSeconds(env) * 1000;

  // A new successful login is authoritative for this username. Revoke every
  // older fingerprint before storing the new one so a stale browser/module
  // cannot pass Cloud validation and reach Apps Script with an obsolete token.
  // Apps Script currently clears the stored employee token on any auth mismatch,
  // so allowing an older shadow through could destroy the brand-new session.
  try {
    const revokeOthers = await env.DB.prepare(`
      UPDATE cloud_auth_sessions_v1
         SET revoked_at_ms = ?,
             last_seen_at_ms = ?
       WHERE username_key = ?
         AND token_fingerprint <> ?
         AND revoked_at_ms IS NULL
    `).bind(Number(nowMs), Number(nowMs), claims.usernameKey, fingerprint).run();
    if (revokeOthers && revokeOthers.success === false) {
      return { stored: false, reason: 'prior-shadow-revoke-unsuccessful' };
    }
  } catch (err) {
    return { stored: false, reason: 'prior-shadow-revoke-error' };
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO cloud_auth_sessions_v1 (
        username_key,
        token_fingerprint,
        canonical_username,
        role,
        department,
        screens_json,
        verified_at_ms,
        expires_at_ms,
        last_seen_at_ms,
        revoked_at_ms,
        source,
        schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'apps-script-post', 1)
      ON CONFLICT(username_key, token_fingerprint) DO UPDATE SET
        canonical_username = excluded.canonical_username,
        role = excluded.role,
        department = excluded.department,
        screens_json = excluded.screens_json,
        verified_at_ms = excluded.verified_at_ms,
        expires_at_ms = excluded.expires_at_ms,
        last_seen_at_ms = excluded.last_seen_at_ms,
        revoked_at_ms = NULL,
        source = excluded.source,
        schema_version = excluded.schema_version
    `).bind(
      claims.usernameKey,
      fingerprint,
      claims.canonicalUsername,
      claims.role,
      claims.department,
      JSON.stringify(claims.screens),
      Number(nowMs),
      expiresAtMs,
      Number(nowMs)
    ).run();
    if (result && result.success === false) return { stored: false, reason: 'db-write-unsuccessful' };
  } catch (err) {
    return { stored: false, reason: 'db-write-error' };
  }

  return { stored: true, reason: 'stored', fingerprint, expiresAtMs };
}

export async function revokeCloudAuthShadow(username, employeeToken, env, nowMs = Date.now()) {
  if (!cloudAuthShadowEnabled(env) || !env || !env.DB) return { revoked: false, reason: 'disabled-or-db-missing' };
  const key = usernameKey(username);
  if (!key || !text(employeeToken)) return { revoked: false, reason: 'credentials-missing' };
  let fingerprint = '';
  try {
    fingerprint = await cloudAuthTokenFingerprint(username, employeeToken, env);
  } catch (err) {
    return { revoked: false, reason: 'fingerprint-error' };
  }
  try {
    const result = await env.DB.prepare(`
      UPDATE cloud_auth_sessions_v1
         SET revoked_at_ms = ?,
             last_seen_at_ms = ?
       WHERE username_key = ?
         AND token_fingerprint = ?
         AND revoked_at_ms IS NULL
    `).bind(Number(nowMs), Number(nowMs), key, fingerprint).run();
    if (result && result.success === false) return { revoked: false, reason: 'db-write-unsuccessful' };
    return { revoked: true, reason: 'revoked', fingerprint };
  } catch (err) {
    return { revoked: false, reason: 'db-write-error' };
  }
}

export async function touchCloudAuthShadow(username, employeeToken, env, nowMs = Date.now()) {
  if (!cloudAuthShadowEnabled(env) || !env || !env.DB) return { touched: false };
  const key = usernameKey(username);
  const fingerprint = await cloudAuthTokenFingerprint(username, employeeToken, env);
  await env.DB.prepare(`
    UPDATE cloud_auth_sessions_v1
       SET last_seen_at_ms = ?
     WHERE username_key = ?
       AND token_fingerprint = ?
       AND revoked_at_ms IS NULL
       AND expires_at_ms > ?
  `).bind(Number(nowMs), key, fingerprint, Number(nowMs)).run();
  return { touched: true };
}
