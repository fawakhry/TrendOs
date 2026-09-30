import assert from 'node:assert/strict';
import { handleLegacyBrowserTransport } from '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';
import { handleCloudSessionBridgeV3 } from '../cloudflare-d1/src/cloud-session-bridge-v3.mjs';
import { lookupCloudAuthShadow } from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';

const shadow = { row: null };
function db() {
  return {
    prepare(sql) {
      const q = String(sql);
      return {
        bind(...args) {
          return {
            async first() {
              if (/FROM\s+employee_auth_sessions_v1/i.test(q)) return null;
              if (/FROM\s+cloud_auth_sessions_v1/i.test(q)) {
                const [usernameKey, fingerprint, nowMs] = args;
                const r = shadow.row;
                if (!r || r.usernameKey !== usernameKey || r.tokenFingerprint !== fingerprint ||
                    r.revokedAtMs != null || Number(r.expiresAtMs) <= Number(nowMs)) return null;
                return {
                  canonicalUsername: r.canonicalUsername,
                  role: r.role,
                  department: r.department,
                  screensJson: r.screensJson,
                  verifiedAtMs: r.verifiedAtMs,
                  expiresAtMs: r.expiresAtMs,
                  source: r.source
                };
              }
              return null;
            },
            async run() {
              if (/INSERT\s+INTO\s+cloud_auth_sessions_v1/i.test(q)) {
                const [usernameKey, tokenFingerprint, canonicalUsername, role, department, screensJson, verifiedAtMs, expiresAtMs, lastSeenAtMs] = args;
                shadow.row = { usernameKey, tokenFingerprint, canonicalUsername, role, department, screensJson,
                  verifiedAtMs, expiresAtMs, lastSeenAtMs, revokedAtMs: null, source: 'apps-script-post' };
                return { success: true };
              }
              if (/SET\s+last_seen_at_ms\s*=\s*\?,\s*expires_at_ms\s*=\s*\?/i.test(q)) {
                const [lastSeenAtMs, expiresAtMs, usernameKey, tokenFingerprint, nowMs] = args;
                if (shadow.row && shadow.row.usernameKey === usernameKey && shadow.row.tokenFingerprint === tokenFingerprint &&
                    shadow.row.revokedAtMs == null && Number(shadow.row.expiresAtMs) > Number(nowMs)) {
                  shadow.row.lastSeenAtMs = lastSeenAtMs;
                  shadow.row.expiresAtMs = expiresAtMs;
                }
                return { success: true };
              }
              if (/SET\s+revoked_at_ms\s*=\s*\?/i.test(q)) {
                const [revokedAtMs, lastSeenAtMs, usernameKey, tokenFingerprint] = args;
                if (shadow.row && shadow.row.usernameKey === usernameKey && shadow.row.tokenFingerprint === tokenFingerprint) {
                  shadow.row.revokedAtMs = revokedAtMs;
                  shadow.row.lastSeenAtMs = lastSeenAtMs;
                }
                return { success: true };
              }
              return { success: true };
            }
          };
        },
        async first() { return null; },
        async all() { return { results: [] }; },
        async run() { return { success: true }; }
      };
    }
  };
}

const env = {
  CORS_ORIGINS: 'https://ui.example.test',
  APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/fixture/exec',
  EDGE_SESSION_SECRET: 'entry497-test-edge-session-secret-32bytes-minimum',
  EDGE_SESSION_TTL_SECONDS: '600',
  TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: 'true',
  CLOUD_AUTH_SHADOW_TTL_SECONDS: '300',
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: 'false',
  DB: db()
};

let upstreamCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url) !== env.APPS_SCRIPT_API_URL) throw new Error('unexpected fetch target');
  upstreamCalls += 1;
  const body = JSON.parse(String(options && options.body || '{}'));
  if (body.action === 'login') {
    return new Response(JSON.stringify({
      success: true,
      user: { username: 'ضياء', name: 'ضياء', token: 'legacy-token-1', role: 'admin', department: 'الادارة' }
    }));
  }
  if (body.action === 'logout') return new Response(JSON.stringify({ success: true }));
  if (body.action === 'verifyEmployeeSession') {
    return new Response(JSON.stringify({
      success: true,
      user: { username: 'ضياء', role: 'admin', department: 'الادارة' }
    }));
  }
  throw new Error('unexpected action');
};

function legacy(body) {
  return new Request('https://cloud.example.test/v1/legacy-api', {
    method: 'POST',
    headers: { Origin: 'https://ui.example.test', 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}
function ordersSession() {
  return new Request('https://cloud.example.test/v1/edge/orders/session', {
    method: 'POST',
    headers: { Origin: 'https://ui.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'ضياء', token: 'legacy-token-1' })
  });
}

try {
  const login = await handleLegacyBrowserTransport(legacy({ action: 'login', username: 'ضياء', password: 'not-stored' }), env);
  assert.equal(login.status, 200);
  assert.equal((await login.clone().json()).success, true);
  assert.equal(upstreamCalls, 1);
  assert.ok(shadow.row, 'successful login must seed D1 auth shadow');
  assert.equal(shadow.row.canonicalUsername, 'ضياء');
  assert.equal(Object.prototype.hasOwnProperty.call(shadow.row, 'password'), false);
  assert.notEqual(shadow.row.tokenFingerprint, 'legacy-token-1', 'raw legacy token must not be stored');

  const firstExpiry = Number(shadow.row.expiresAtMs);
  const sessionRes = await handleCloudSessionBridgeV3(ordersSession(), env);
  const sessionBody = await sessionRes.json();
  assert.equal(sessionRes.status, 200);
  assert.equal(sessionBody.success, true);
  assert.equal(sessionBody.authSource, 'd1-auth-shadow-v1');
  assert.equal(sessionBody.expiresIn, 240);
  assert.ok(sessionBody.edgeToken);
  assert.equal(upstreamCalls, 1, 'Orders session must not perform a second Apps Script verification');
  assert.ok(Number(shadow.row.expiresAtMs) >= firstExpiry, 'shadow lookup should maintain sliding validity');

  const logout = await handleLegacyBrowserTransport(legacy({ action: 'logout', username: 'ضياء', token: 'legacy-token-1' }), env);
  assert.equal(logout.status, 200);
  assert.equal(upstreamCalls, 2, 'logout itself still goes through the current legacy authority');
  const afterLogout = await lookupCloudAuthShadow('ضياء', 'legacy-token-1', env);
  assert.equal(afterLogout.hit, false, 'logout must revoke the D1 shadow fingerprint');

  console.log('ENTRY497_ORDERS_SESSION_D1_SHADOW_HANDOFF=PASS');
} finally {
  globalThis.fetch = originalFetch;
}
