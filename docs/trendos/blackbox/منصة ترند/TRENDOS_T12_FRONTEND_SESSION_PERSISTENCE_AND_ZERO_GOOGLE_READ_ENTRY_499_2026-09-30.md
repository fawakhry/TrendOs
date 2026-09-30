# TrendOS T12 — Entry499 — Frontend session persistence + Zero-Google read acceptance — 2026-09-30

## Scope
Repo-only frontend repair. No Cloudflare deploy by ChatGPT, no Wrangler, no D1/Google mutation, no Secrets/Variables/Bindings change.

## Production symptom after Entry498 API install
The API-side Google heartbeat blocker was removed, but the deployed frontend still:
1. rejected stale-but-qualified D1 mirrors locally with `Required D1 mirror is stale`;
2. could infer session expiry from a data-service message and call `logout()`;
3. left the press widget polling legacy actions after the employee session disappeared, producing repeated 502 noise.

## Fixes

### 1. Zero-Google mirror advisory proof accepted by frontend
`trendos-edge-orders-read-v1.js` now accepts server-qualified stale advisories only when exact structural proof matches:
- Lines: `baseSnapshotFreshness`
  - `authority=d1-qualified-snapshot+t12-native-overlay`
  - `googleHeartbeatRequired=false`
  - matching source row/column/count metadata
- Customer/restriction enrichment: `enrichmentFreshness`
  - structurally qualified
  - matching metadata

Missing/broken/parity-invalid mirrors still fail closed.

Commit:
`ef1dc897aa793f41420145813dbf30157bf90b50`

### 2. Orders failure can no longer auto-destroy employee session
`app.js` no longer calls `logout()` from `loadRows()` based on matching Arabic error text. Data/read outages keep the employee browser session intact. Explicit user logout/password flows remain authoritative.

Commit:
`3ae81319d08f990410af9b02bd1364176be66398`

### 3. Press widget stops polling when employee token is absent
`press-control-v1.js` now unmounts and skips network requests when no active employee token exists.

Commit:
`d65c3db4198f544db7075ea4e8107a15c486cdf4`

### Regression lock
Test:
`tests/frontend_session_and_zero_google_read_entry499.test.mjs`

Permanent CI inclusion commit:
`eedf24c7857bd20a3d7b82c5bdc4c75dcfcd4da2`

Qualification:
`36749869635` = SUCCESS

## State
```ini
ENTRY499_SOURCE_QUALIFIED=YES
ENTRY499_PRODUCTION_DEPLOYED=NO
FRONTEND_STALE_D1_ADVISORY_ACCEPTED=YES_WITH_EXACT_PROOF
DATA_READ_FAILURE_AUTO_LOGOUT=NO
PRESS_POLL_WITHOUT_EMPLOYEE_SESSION=NO
EXPLICIT_LOGOUT_PRESERVED=YES
BROWSER_DIRECT_GOOGLE=NO
```

## Manual production sequence
Deploy frontend `trendos-ui` only from the Entry499 bundle, preserving the existing ASSETS binding. API Worker does not need another Entry499 deploy.

After deploy:
1. confirm new frontend version is 100%;
2. hard refresh;
3. sign in once;
4. open Customer Service;
5. session must remain open even if a non-auth service fails;
6. Orders should accept the Entry498 qualified D1 stale advisory instead of producing `Required D1 mirror is stale`;
7. no press legacy calls should continue after logout.
