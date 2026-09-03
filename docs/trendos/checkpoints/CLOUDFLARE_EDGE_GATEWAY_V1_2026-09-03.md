# TrendOS Cloudflare Edge Gateway V1 Checkpoint — 2026-09-03

## Scope

This checkpoint continues from the read-only performance diagnosis recorded at working-branch commit `a8f2a042ddf97c458c29ef4ad3f6b3a6e8300f69`.

No production traffic cutover is included in this checkpoint.

## Why this lane exists

The 2026-09-02 live performance diagnosis confirmed severe Apps Script request latency/accumulation while the frontend still routed `WEB_APP_URL`, `TREND_API_URL`, and `API_URL` directly to the Apps Script deployment.

The same diagnosis confirmed that Cloudflare/D1 already existed as a fast read/mirror layer, but the available browser-facing D1 prototype was not safe for authenticated employee cutover because the D1 read routes were directly callable and CORS is not an authorization boundary.

The exact next step was therefore a smallest secure Cloudflare edge-gateway increment with:

1. explicit employee authentication,
2. Apps Script preserved as fallback and write authority,
3. request coalescing / hidden-tab controls,
4. no production traffic cutover.

## Implemented on working branch

Repository: `fawakhry/TrendOs`

Working branch: `agent/go-live-2026-09-01-integrity`

### 1. Secure Cloudflare edge lane

Added:

- `cloudflare-d1/src/edge-gateway.mjs`

New parallel routes:

- `GET /v1/edge/health`
- `POST /v1/edge/session`
- `GET /v1/edge/whoami`
- `GET /v1/edge/customer-manager/inbox`
- `GET /v1/edge/customer-manager/thread`

Authentication contract:

- Browser sends its existing TrendOS employee `username + session token` only to `/v1/edge/session`.
- Worker validates that session once against the existing Apps Script `verifyEmployeeSession` GET route.
- Worker then returns a short-lived HMAC-SHA256 signed Edge session token.
- Edge token default TTL is 600 seconds and is hard-capped at 900 seconds.
- Subsequent D1 reads require `Authorization: Bearer <edge token>`.
- Raw employee session token is not written to D1 and is not returned in the Edge response.
- `EDGE_SESSION_SECRET` is required and fail-closed; it must be stored as a Cloudflare secret, never in GitHub.
- Browser origins are checked explicitly; CORS is retained but is not treated as authentication.

### 2. Exact Customer Manager read contract

The first secure lane is deliberately narrow:

- Customer Manager inbox
- Customer Manager thread

The thread route performs D1 message/order/customer reads inside the Worker and returns one Customer Manager-compatible response.

Writes such as suggest/send/handoff/resolve are NOT moved to Cloudflare in this increment.

### 3. Default-off frontend bridge

Added:

- `trendos-edge-read-v1.js`

Properties:

- `MATBAGY_EDGE_READ_V1_ENABLED` must be exactly `true` before installation.
- `config.js` does not load the file and does not enable the flag.
- Eligible reads: `customerManagerV1` `inbox` and `thread` only.
- Any Edge/auth/network error falls back to the existing `trendosSecureApiV1922` Apps Script path.
- All non-eligible actions always stay on Apps Script.
- Duplicate in-flight Edge reads are coalesced.
- Short read cache is used.
- When the browser tab is hidden, a recent cached result can satisfy background polling without a network call.
- No raw session token is persisted by this module.

### 4. Worker entry wiring

Updated:

- `cloudflare-d1/src/index_v2.js`

The new `/v1/edge/*` lane is intercepted in parallel.

Existing `/v1/*`, mirror/import routes, and the base Worker remain unchanged.

Therefore this source change by itself is NOT a traffic cutover.

### 5. Public Worker variables prepared

Updated:

- `cloudflare-d1/wrangler.toml`

Prepared public/non-secret vars:

- existing Apps Script API URL as `APPS_SCRIPT_API_URL`
- `EDGE_SESSION_TTL_SECONDS = 600`

No `EDGE_SESSION_SECRET` is committed.

### 6. CI safety gate

Added:

- `tests/cloudflare_edge_gateway_v1.test.mjs`

CI tests cover:

- signed token issue/verify,
- tamper rejection,
- expiry rejection,
- allowed/disallowed browser origin,
- fail-closed behavior without Edge secret,
- one Apps Script verification exchange followed by an Edge token,
- employee raw token not returned in response,
- protected route anonymous rejection,
- frontend default-OFF contract,
- Apps Script fallback contract,
- hidden-tab cache contract,
- request coalescing contract,
- confirmation that `config.js` does not load or enable the Edge bridge.

Updated:

- `.github/workflows/trendos-integrity-v1.yml`

GitHub Actions evidence:

- Run `33753056721` on `71ddfa40e836f986c6db6fab3036f0ca1e27a465` — SUCCESS.
- Run `33753163182` on `32ccda765c78db84627b188b46578c54a0dd8a31` — SUCCESS.
- Run `33753202216` on `929df8731e5811ef7508f025b8de4aed196c5bda` — SUCCESS.

### 7. Manual preview deploy gate prepared

Added:

- `.github/workflows/trendos-cloudflare-edge-preview.yml`

Safety properties:

- `workflow_dispatch` only; never runs on push.
- requires exact confirmation text `DEPLOY_EDGE_PREVIEW`.
- deploy target is isolated Worker name `trendos-edge-gateway-preview`.
- runs Edge tests before deployment.
- requires GitHub secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `TRENDOS_EDGE_SESSION_SECRET_PREVIEW`
- installs Edge secret into the preview Worker only.
- verifies `/v1/edge/health` after deployment.
- verifies anonymous `/v1/edge/whoami` returns HTTP 401.
- explicitly reports that frontend cutover, GitHub Pages, `config.js`, and Apps Script writes are unchanged.

Important: the preview workflow is currently only on the working branch. GitHub `workflow_dispatch` normally requires the workflow definition to exist on the repository default branch before it can be launched from the normal Actions UI. Do not move it to `main` silently.

## Production impact

**NONE.**

As of this checkpoint:

- Apps Script production Version 146 remains unchanged.
- Apps Script deployment ID remains unchanged.
- `config.js` remains Apps-Script-first.
- GitHub Pages traffic remains unchanged.
- `MATBAGY_SECURE_API_PROXY_URL` remains unchanged.
- `trendos-edge-read-v1.js` is not loaded.
- no Edge read flag is enabled.
- no Cloudflare Worker was deployed by this work.
- no D1 data was modified by this work.
- Google Sheets remains the authoritative write source.
- no Integrity business family was activated.

## Exact stopping point

**SECURE EDGE SOURCE + FRONTEND DEFAULT-OFF BRIDGE + CI + MANUAL PREVIEW DEPLOY GATE PREPARED AND PASSING. PREVIEW WORKER NOT DEPLOYED. NO TRAFFIC CUTOVER.**

## Exact next step

1. Do not touch production Worker or `config.js` yet.
2. Confirm the Cloudflare deploy credentials/secrets exist for the preview gate.
3. Make the manual preview workflow runnable without silently modifying production source/traffic (either explicit default-branch gate approval or equivalent manual Wrangler execution).
4. Deploy only `trendos-edge-gateway-preview`.
5. Verify preview `/v1/edge/health` reports:
   - `success=true`
   - `database=true`
   - `authConfigured=true`
   - `upstreamConfigured=true`
   - `cutover=false`
6. Verify anonymous protected read returns 401.
7. From an authenticated TrendOS employee session, exchange once and verify `/v1/edge/whoami`, inbox, and thread.
8. Measure Edge latency versus current Apps Script Customer Manager reads.
9. Verify D1 freshness/parity for the data used by the secure lane.
10. Verify forced Edge failure falls back to Apps Script with no functional regression.
11. Record evidence and only then create a separate frontend canary/cutover gate.

Do not enable full frontend Edge reads, do not redirect `API_URL`, and do not move business writes to Cloudflare as part of the preview step.
