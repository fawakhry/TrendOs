import assert from 'node:assert/strict';
import { handleLegacyBrowserTransport } from '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';
import { lookupCloudAuthShadow } from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';

const rows = [];
function db() {
  return {
    prepare(sql) {
      const q = String(sql);
      return {
        bind(...args) {
          return {
            async first() {
              if (!/FROM\s+cloud_auth_sessions_v1/i.test(q)) return null;
              const [usernameKey, fingerprint, nowMs] = args;
              const row = rows.find(r =>
                r.usernameKey === usernameKey &&
                r.tokenFingerprint === fingerprint &&
                r.revokedAtMs == null &&
                Number(r.expiresAtMs) > Number(nowMs)
              );
              if (!row) return null;
              return {
                canonicalUsername: row.canonicalUsername,
                role: row.role,
                department: row.department,
                screensJson: row.screensJson,
                verifiedAtMs: row.verifiedAtMs,
                expiresAtMs: row.expiresAtMs,
                source: row.source
              };
            },
            async run() {
              if (/UPDATE\s+cloud_auth_sessions_v1[\s\S]*token_fingerprint\s*<>\s*\?/i.test(q)) {
                const [revokedAtMs, lastSeenAtMs, usernameKey, keepFingerprint] = args;
                for (const row of rows) {
                  if (row.usernameKey === usernameKey && row.tokenFingerprint !== keepFingerprint && row.revokedAtMs == null) {
                    row.revokedAtMs = revokedAtMs;
                    row.lastSeenAtMs = lastSeenAtMs;
                  }
                }
                return { success: true };
              }
              if (/INSERT\s+INTO\s+cloud_auth_sessions_v1/i.test(q)) {
                const [usernameKey, tokenFingerprint, canonicalUsername, role, department, screensJson, verifiedAtMs, expiresAtMs, lastSeenAtMs] = args;
                let row = rows.find(r => r.usernameKey === usernameKey && r.tokenFingerprint === tokenFingerprint);
                if (!row) {
                  row = { usernameKey, tokenFingerprint };
                  rows.push(row);
                }
                Object.assign(row, {
                  canonicalUsername, role, department, screensJson,
                  verifiedAtMs, expiresAtMs, lastSeenAtMs,
                  revokedAtMs: null, source: 'apps-script-post'
                });
                return { success: true };
              }
              if (/SET\s+last_seen_at_ms\s*=\s*\?,\s*expires_at_ms\s*=\s*\?/i.test(q)) {
                const [lastSeenAtMs, expiresAtMs, usernameKey, tokenFingerprint, nowMs] = args;
                const row = rows.find(r =>
                  r.usernameKey === usernameKey &&
                  r.tokenFingerprint === tokenFingerprint &&
                  r.revokedAtMs == null &&
                  Number(r.expiresAtMs) > Number(nowMs)
                );
                if (row) {
                  row.lastSeenAtMs = lastSeenAtMs;
                  row.expiresAtMs = expiresAtMs;
                }
                return { success: true };
              }
              if (/SET\s+revoked_at_ms\s*=\s*\?,\s*last_seen_at_ms\s*=\s*\?[\s\S]*token_fingerprint\s*=\s*\?/i.test(q)) {
                const [revokedAtMs, lastSeenAtMs, usernameKey, tokenFingerprint] = args;
                const row = rows.find(r => r.usernameKey === usernameKey && r.tokenFingerprint === tokenFingerprint && r.revokedAtMs == null);
                if (row) {
                  row.revokedAtMs = revokedAtMs;
                  row.lastSeenAtMs = lastSeenAtMs;
                }
                return { success: true };
              }
              return { success: true };
            }
          };
        }
      };
    }
  };
}

const env = {
  CORS_ORIGINS: 'https://ui.example.test',
  APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/fixture/exec',
  EDGE_SESSION_SECRET: 'entry504-test-edge-session-secret-32bytes-minimum',
  TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: 'true',
  CLOUD_AUTH_SHADOW_TTL_SECONDS: '300',
  DB: db()
};

let upstreamCalls = 0;
let loginCount = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), env.APPS_SCRIPT_API_URL);
  upstreamCalls += 1;
  const body = JSON.parse(String(options?.body || '{}'));
  if (body.action === 'login') {
    loginCount += 1;
    const token = 'legacy-token-' + loginCount;
    return new Response(JSON.stringify({
      success: true,
      user: { username: 'ضياء', name: 'ضياء', token, role: 'admin', department: 'الادارة' }
    }));
  }
  if (body.action === 'getServiceProviderRoutes') {
    return new Response(JSON.stringify({ success: true, routes: [] }));
  }
  if (body.action === 'logout') {
    return new Response(JSON.stringify({ success: true }));
  }
  throw new Error('unexpected upstream action: ' + body.action);
};

function request(body) {
  return new Request('https://cloud.example.test/v1/legacy-api', {
    method: 'POST',
    headers: { Origin: 'https://ui.example.test', 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

try {
  let response = await handleLegacyBrowserTransport(request({ action: 'login', username: 'ضياء', password: 'fixture' }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(upstreamCalls, 1);
  assert.equal((await lookupCloudAuthShadow('ضياء', 'legacy-token-1', env)).hit, true);

  response = await handleLegacyBrowserTransport(request({ action: 'login', username: 'ضياء', password: 'fixture' }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(upstreamCalls, 2);

  assert.equal((await lookupCloudAuthShadow('ضياء', 'legacy-token-1', env)).hit, false, 'new login must revoke the old fingerprint');
  assert.equal((await lookupCloudAuthShadow('ضياء', 'legacy-token-2', env)).hit, true, 'new fingerprint must remain active');

  response = await handleLegacyBrowserTransport(request({
    action: 'getServiceProviderRoutes', username: 'ضياء', token: 'legacy-token-1'
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, 'EMPLOYEE_SESSION_SHADOW_REQUIRED');
  assert.equal(upstreamCalls, 2, 'stale token must be blocked before Apps Script');

  response = await handleLegacyBrowserTransport(request({
    action: 'getServiceProviderRoutes', username: 'ضياء', token: ''
  }), env);
  assert.equal(response.status, 401);
  assert.equal(upstreamCalls, 2, 'missing token must be blocked before Apps Script');

  response = await handleLegacyBrowserTransport(request({
    action: 'getServiceProviderRoutes', username: 'ضياء', token: 'legacy-token-2'
  }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(upstreamCalls, 3, 'current token may reach Apps Script');

  response = await handleLegacyBrowserTransport(request({
    action: 'logout', username: 'ضياء', token: 'legacy-token-2'
  }), env);
  assert.equal(response.status, 200);
  assert.equal(upstreamCalls, 4, 'explicit logout remains authoritative');
  assert.equal((await lookupCloudAuthShadow('ضياء', 'legacy-token-2', env)).hit, false, 'logout revokes current shadow');

  console.log('ENTRY504_STALE_EMPLOYEE_TOKEN_RACE_GUARD=PASS');
} finally {
  globalThis.fetch = originalFetch;
}
