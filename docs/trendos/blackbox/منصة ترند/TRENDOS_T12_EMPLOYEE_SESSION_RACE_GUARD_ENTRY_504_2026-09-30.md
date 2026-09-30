# TrendOS T12 — Entry504 — Immediate employee-session invalidation race guard — 2026-09-30

## Production symptom after Entry498 + Entry499
Owner verified:
- Entry498 API was manually promoted.
- Entry499 frontend version `71364637-50f4-4ef3-b348-0e1432cdc090` became the active `trendos-ui` deployment.
- The old frontend stale-D1 warning disappeared from Console.
- Login still succeeded visually, then legacy employee widgets/actions immediately reported:
  `انتهت الجلسة. سجل الدخول مرة أخرى.`

## Root cause
Production Apps Script `authorize_()` clears the stored employee token whenever an authenticated legacy request arrives with:
- missing token;
- mismatched/old token; or
- expired session.

Meanwhile D1 `cloud_auth_sessions_v1` could temporarily retain multiple non-revoked fingerprints for the same employee across repeated logins.

This creates a destructive race:
1. New login writes a new Apps Script token and seeds a new D1 shadow.
2. A stale background module can still hold an older employee token/fingerprint.
3. If that stale fingerprint is still accepted by Cloud, the request reaches Apps Script.
4. Apps Script sees token mismatch and clears the currently stored token — which is the new valid session.
5. Every subsequent module then reports immediate session expiry.

## Repo-only fix
### D1 shadow
`cloudflare-d1/src/cloud-auth-shadow-v1.mjs`
- on every successful employee login, revoke all older fingerprints for the same username before storing the new fingerprint;
- fail closed if old-shadow revocation cannot be committed.

### Legacy browser transport
`cloudflare-d1/src/legacy-browser-transport-v1.mjs`
- when Cloud auth-shadow is enabled, employee-authenticated legacy actions require an exact current D1 shadow hit before Apps Script forwarding;
- missing/stale employee tokens fail locally with `EMPLOYEE_SESSION_SHADOW_REQUIRED`;
- such requests never reach Apps Script and therefore cannot clear the valid employee token;
- customer-session actions preserve their existing authority;
- explicit logout remains authoritative and safe to forward;
- successful login must commit its D1 shadow before the browser is allowed to boot authenticated modules.

No plaintext employee token/password is stored in D1.

## Regression
New test:
`tests/cloudflare_legacy_session_race_guard_entry504.test.mjs`

Proof covers:
- first login shadow;
- second login revokes first fingerprint;
- stale old token returns 401 locally and causes zero upstream call;
- missing token returns 401 locally and causes zero upstream call;
- current token reaches Apps Script;
- explicit logout reaches Apps Script and revokes current shadow.

Permanent CI:
`36760287110` = SUCCESS

## Manual API artifact
Workflow:
`.github/workflows/trendos-entry504-session-race-manual-bundle.yml`

Run:
`36760373871` = SUCCESS

Artifact:
`trendos-entry504-api-session-race-manual`

Artifact ID:
`11118780591`

Artifact digest:
`sha256:71aea52240f3d1ac175f32a7eeb3b4e4e1510baef4dbeecb9ad3d2f9ba3d93b1`

Bundled Worker SHA256:
`95eb969e1aaea5ee21ac5a8b7b859c40d5874dbf14ef56644d4dbb44bcf6ca53`

## Production state
```ini
ENTRY498_PRODUCTION_DEPLOYED=YES
ENTRY499_PRODUCTION_DEPLOYED=YES
ENTRY504_SOURCE_QUALIFIED=YES
ENTRY504_PRODUCTION_DEPLOYED=NO
ENTRY504_CI=36760287110_SUCCESS
ENTRY504_ARTIFACT_RUN=36760373871_SUCCESS

CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
```

## Next owner-manual action
Deploy only `trendos-entry504-worker.js` to `trendos-d1-api`, preserving all existing Bindings, Variables and Secrets, then promote the new API version to 100%.

Do not:
- change `trendos-ui`;
- rerun migration 0009;
- change Secrets/Variables/Bindings;
- alter Order IDs or Statuses.

After deployment:
1. hard refresh TrendOS;
2. login once;
3. verify session remains active;
4. verify Orders render;
5. verify stale/missing background employee requests no longer destroy the active session;
6. verify no `script.google.com` appears in Browser Console.

Only after stable login/Orders:
`NEXT_ENGINEERING_TASK=CLOUD_NATIVE_DUPLICATE_ORDER_GUARD`
