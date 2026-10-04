import assert from 'node:assert/strict';
import {
  rememberCloudAuthShadow,
  lookupCloudAuthShadow,
  revokeCloudAuthShadow
} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';

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
  EDGE_SESSION_SECRET: 'entry615a-cloud-shadow-ttl-secret-32bytes-minimum',
  TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED: 'true',
  CLOUD_AUTH_SHADOW_TTL_SECONDS: '43200',
  DB: db()
};

const start = 1_800_000_000_000;
const verified = {
  success: true,
  user: {
    username: 'ضياء',
    role: 'admin',
    department: 'الادارة',
    screens: ['service', 'print', 'laser']
  }
};

const stored = await rememberCloudAuthShadow('ضياء', 'legacy-token-current', verified, env, start);
assert.equal(stored.stored, true);
assert.equal(stored.expiresAtMs - start, 43_200_000, 'shadow TTL must be 12 hours');

const sixHoursLater = start + 21_600_000;
const active = await lookupCloudAuthShadow('ضياء', 'legacy-token-current', env, sixHoursLater);
assert.equal(active.hit, true, 'valid employee session must survive more than five minutes of idle time');

const row = rows.find(r => r.tokenFingerprint === stored.fingerprint);
assert.ok(row);
assert.equal(row.expiresAtMs - sixHoursLater, 43_200_000, 'successful use must slide expiry by 12 hours');

const revoked = await revokeCloudAuthShadow('ضياء', 'legacy-token-current', env, sixHoursLater + 1000);
assert.equal(revoked.revoked, true);
assert.equal((await lookupCloudAuthShadow('ضياء', 'legacy-token-current', env, sixHoursLater + 2000)).hit, false, 'logout/revoke protection must remain intact');

console.log('ENTRY615A_CLOUD_AUTH_SHADOW_TTL=43200');
console.log('ENTRY615A_IDLE_OVER_5_MINUTES=PASS');
console.log('ENTRY615A_EXACT_FINGERPRINT_REVOKE=PASS');
console.log('ENTRY615A_PRODUCTION_DEPLOY=NO');
