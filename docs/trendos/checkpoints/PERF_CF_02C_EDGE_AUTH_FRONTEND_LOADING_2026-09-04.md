# PERF-CF-02C — Edge Auth + Frontend Loading Qualification

Date: 2026-09-04  
Branch: `agent/go-live-2026-09-01-integrity`  
Status: **IMPLEMENTED + TESTED + PREVIEW RUNTIME VERIFIED / NO PRODUCTION CUTOVER**

## Scope

This checkpoint qualifies the secure read lane and the frontend polling-loader contract. It does not move production traffic, does not enable Edge Read V1, and does not change the authoritative-write boundary.

Current authority remains:
- Google Sheets + Apps Script = authoritative writes.
- Cloudflare/D1 = read/mirror/performance lane.

CORE-P0 remediation remains paused and untouched.

## 1. Signed Edge authentication — Preview runtime PASS

Workflow:
- `TrendOS Cloudflare Auto Preview`
- run: `33821432424`
- job: `100864759090`
- result: **SUCCESS**
- Worker version produced by this qualification run: `dd5407e6-80df-412f-89d6-1a71c032f0e5`

Runtime evidence:
- `/v1/edge/health` = HTTP 200
- `database=true`
- `authConfigured=true`
- `upstreamConfigured=true`
- `cutover=false`
- anonymous `/v1/edge/whoami` = HTTP 401 with an auth failure code

A synthetic short-lived Edge token was generated inside GitHub Actions using the Preview `EDGE_SESSION_SECRET`:
- subject: `ci-preview-auth`
- TTL: 300 seconds
- no employee credential was used
- token value was not printed or persisted outside the runner temp file

Protected runtime checks:
- signed `/v1/edge/whoami` = **PASS**
- returned subject = `ci-preview-auth`
- signed `/v1/edge/customer-manager/inbox?limit=1` = **PASS**
- `dataSource=d1-edge`
- `edgeSession=ci-preview-auth`
- returned read payload was an array

This proves that the deployed Preview Worker and the deployed Preview secret agree on the HMAC contract and that a protected D1 read is actually reachable with a valid Edge session.

## 2. Edge session exchange fail-closed — PASS

Runtime POST to `/v1/edge/session` with an empty body:
- HTTP 400
- message: `username and token are required`

This fails before any Apps Script employee-session verification call.

No real employee username/token was used by CI.

Positive Apps Script employee-session exchange remains covered by local contract tests in `tests/cloudflare_edge_gateway_v1.test.mjs`, where the Apps Script verifier is mocked and asserted to be called exactly once before issuing a short-lived Edge token.

## 3. Fallback contract — CI PASS

`trendos-edge-read-v1.js` remains **default OFF** and is not loaded by `config.js`.

Its existing contract remains:
- only `customerManagerV1` `inbox` / `thread` are eligible for Edge reads when explicitly enabled later;
- non-eligible actions continue to the original Apps Script API;
- Edge read failure falls back to the original Apps Script API;
- 401 clears the Edge token and retries session acquisition once;
- no Edge token is written to `localStorage` or `sessionStorage`;
- writes remain on Apps Script.

No `MATBAGY_EDGE_READ_V1_ENABLED=true` was introduced.

## 4. Preview latency / freshness remains healthy

From run `33821432424`:

### Edge health benchmark — 15 samples
- avg: `154.5 ms`
- median: `150.8 ms`
- p90: `182.7 ms`
- max: `185.1 ms`

### D1 Orders mirror read — 15 samples
- avg: `271.9 ms`
- median: `269.0 ms`
- p90: `299.8 ms`
- max: `307.7 ms`

Freshness at final gate:
- Orders = `274/274`
- Lines = `315/315`
- both `syncedAt=2026-09-04 00:21:04 UTC`
- age = `31s`
- status = `ready`
- note = `TrendOS orders live sync V1`

D1 mirror totals at the same run:
- sheets = `87`
- rows = `31,199`
- ready = `87`
- pending = `0`

## 5. Frontend polling loader contract — working branch PASS

`config.js` now loads:
- `trendos-poll-coordinator-v1.js?v=20260904a`

Updated cache-busters were set for the working-branch modules changed in PERF-CF-02B:
- `press-control-v1.js?v=20260904a`
- `customer-feedback-v1.js?v=20260904a`
- `employee-manager-strips-v2.js?v=20260904a`
- `operations-hub-v1.js?v=20260904a`

Operations Hub fallback loader now checks both:
- `trendPollCoordinatorV1Loader`
- `trendPollCoordinatorV1Script`

so it does not inject a duplicate coordinator if `config.js` has already started loading it.

The modules still retain their local hidden/in-flight/minimum-interval guards, so startup does not depend on coordinator load order.

## 6. CI regression gate — PASS

Updated test:
- `tests/trendos_polling_coalescing_v1.test.mjs`

It now verifies:
- coordinator is actually referenced by `config.js`;
- changed frontend modules use fresh cache tags;
- `TREND_API_URL` and `API_URL` still point to `WEB_APP_URL` (Apps Script);
- Edge Read V1 is still not enabled or loaded;
- Operations Hub cannot duplicate-load the coordinator;
- Employee Manager and Press retain visibility/in-flight throttling;
- Feedback remains locally throttled and intentionally outside the generic read coordinator.

Integrity workflow run:
- `33821589833`
- polling loading/coalescing step = PASS
- existing Integrity suite = PASS with no detected regression.

A follow-up Preview run triggered by the working `config.js` change also passed all Preview safety/auth/freshness gates:
- run `33821566883`
- result: **SUCCESS**

## Safety / non-actions

No action in this checkpoint performed:
- Production traffic cutover;
- GitHub Pages production publication;
- Apps Script production deployment;
- Apps Script flags/triggers change;
- Cloudflare authoritative business writes;
- source Google Sheet business-data edits;
- real employee credential injection into CI;
- Edge Read V1 enablement;
- CORE-P0 reconciliation.

## Exact next step

Continue on the performance lane without cutover:

1. review Attendance polling separately because it mixes state/fallback/presence/prayer semantics;
2. create a no-regression polling contract before modifying Attendance;
3. quantify expected request-rate reduction for the working frontend and add a static fan-out budget gate;
4. only after those checks, prepare a separate read-cutover candidate for a very small eligible surface (Customer Manager inbox/thread), with Apps Script fallback and rollback switch retained;
5. Production read cutover remains a separate gate and must not be inferred from Preview PASS.
