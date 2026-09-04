# TrendOS Execution Ledger — Append-Only Supplement

Date: 2026-09-04
Scope: `PERF-CF-02A` through `PERF-CF-02E`
Branch: `agent/go-live-2026-09-01-integrity`

> This is an append-only supplement. The large canonical `TRENDOS_EXECUTION_LEDGER.md` is intentionally not replaced from a truncated connector response. Preserve the canonical audit history and merge this supplement only through a full-content-safe process.

## PERF-CF-02A — Cloudflare Preview Safety

Status: PASS.

Key outcome:
- Preview D1 migrations against shared `trendos-main` were removed.
- Cloud Write fail-closed gate added.
- Preview write health reports disabled / mutation-free.
- mutation route returns 423 while OFF.

Primary checkpoint:
- `docs/trendos/checkpoints/PERF_CF_02A_CLOUDFLARE_PREVIEW_SAFETY_2026-09-04.md`

Verified run:
- `33817812642`
- job `100853724981`

## PERF-CF-02B — Freshness + Polling

Status: historical PASS for temporary Orders/Lines mirror recovery; later freshness regressed.

Key outcome:
- Orders/Lines raw-mirror read-cutover path identified as `/v1/mirror/sheet`.
- atomic Orders/Lines sender prepared but not blindly installed in production Apps Script.
- frontend polling fan-out reductions implemented across several modules.

Primary checkpoint:
- `docs/trendos/checkpoints/PERF_CF_02B_FRESHNESS_POLLING_2026-09-04.md`

Stability run:
- `33820325930` SUCCESS at that historical point.

## PERF-CF-02C — Edge Auth + Frontend Loading

Status: PASS for Edge authentication and prepared frontend loading.

Key outcome:
- signed Preview auth qualified.
- protected reads require Edge session.
- frontend Edge read helper remained default OFF.
- Apps Script fallback retained.

Primary checkpoint:
- `docs/trendos/checkpoints/PERF_CF_02C_EDGE_AUTH_FRONTEND_LOADING_2026-09-04.md`

Representative Preview run:
- `33821432424`
- job `100864759090`
- SUCCESS.

## PERF-CF-02D — Transaction Safety + Freshness Blocker

Status: transactional models PASS in isolated tests; read cutover BLOCKED by stale production D1 data.

Key outcome:
- Cloud Write isolated SQL transaction success/idempotency/rollback PASS.
- async error-capture bug in Cloud Write fixed.
- normalized import protocol hardened.
- normalized live-sync sender prepared but not installed in production Apps Script.
- Edge normalized stale-data guard returns 503 before business query.
- raw Orders/Lines freshness regressed after temporary recovery.

Primary checkpoint:
- `docs/trendos/checkpoints/PERF_CF_02D_SYNC_FRESHNESS_BLOCKER_2026-09-04.md`

Production activation runbook:
- `docs/trendos/PERF_CF_02D_APPS_SCRIPT_SYNC_ACTIVATION_RUNBOOK.md`

Important stopping rule inherited into 02E:
- no frontend read cutover while source-to-D1 sync is not sustained;
- no Cloud Write cutover;
- no blind Apps Script overwrite.

## PERF-CF-02E — Orders Edge Production Guard

Status: **PRODUCTION GUARD PASS / FRONTEND CUTOVER OFF**.

Primary checkpoint:
- `docs/trendos/checkpoints/PERF_CF_02E_ORDERS_EDGE_PRODUCTION_GUARD_2026-09-04.md`

### Frontend preparation

`config.js` points the prepared Orders Edge helper to:
- `https://trendos-d1-api.trendmall-contact.workers.dev`

But activation remains:
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`

Thus there is no user cutover yet.

### Low-usage sync preparation

Prepared / CI-qualified, NOT production-installed:
- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
- `cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs`

Contract:
- 5-minute detection cycle;
- unchanged source => zero D1 requests/writes;
- changed source => row-level delta;
- Sheets remains authoritative.

CI:
- run `33882963526`
- job `101055808150`
- SUCCESS.

### Orders-specific stale guard

Added a metadata-only freshness gate before `/v1/edge/orders/page` business-row reads.

Budget:
- Orders raw mirror: 600 seconds.
- normalized Customer Manager lane remains 180 seconds.

Stale/unready behavior:
- HTTP 503;
- `fallback=apps-script`;
- stale code `stale-orders-mirror`;
- no `sheet_rows` business query before rejection.

Isolated CI:
- run `33884187556`
- job `101059843563`
- SUCCESS.

### Preview runtime PASS

Run:
- `33884667390`
- job `101061409227`
- SUCCESS.

Observed Lines mirror:
- syncedAt `2026-09-04 13:46:50`
- age `2957s`
- parity `315/315`

Signed active Orders read:
- expected stale fail-closed;
- actual HTTP 503 `stale-orders-mirror` + Apps Script fallback;
- PASS.

Debt:
- 409 Apps Script required;
- PASS.

Cloud Write:
- OFF;
- PASS.

### Production guard deployment history

Attempt 1:
- run `33884819968`
- job `101061911931`
- temporary Worker version `2a1a70f8-3c42-4d20-ac79-bc5ffc2c496f`
- first request hit old behavior during propagation;
- post-deploy gate FAIL;
- automatic rollback SUCCESS to `58dda26b-b9b6-41a6-9d3f-5d0e76ae81d8` at 100% traffic.

Attempt 2:
- run `33885093716`
- job `101062807769`
- no code deployment;
- Cloudflare rejected secret edit because latest version was not the active version after rollback.
- operational order corrected to deploy code first, then secret.

Attempt 3 — final production PASS:
- run `33885237497`
- job `101063281621`
- SUCCESS.
- code-deploy Worker Version ID `f5d4232e-acb1-4bdc-8bc9-a07caa2915e6`.
- signing secret installed only after code became active; value not logged.
- health PASS.
- signed stale Orders PASS.
- anonymous 401 PASS.
- debt fallback PASS.
- Cloud Write OFF PASS.
- rollback skipped because all gates passed.

Latest production stale evidence in this lane:
- Lines mirror syncedAt `2026-09-04 13:46:50`
- age `3336s`
- row parity `315/315`
- status ready
- note `TrendOS orders live sync V1`
- signed active Orders => HTTP 503 `stale-orders-mirror`, fallback Apps Script.

### Current blocker

No genuine Apps Script source-project edit channel is currently available through connected tools.

Rechecked:
- no writable Apps Script project surfaced via Google Drive;
- no `.clasp.json` / Script ID / Apps Script project ID found in repository search;
- no Google/Apps-Script credential references found in repo workflows;
- GitHub sensitive secret API endpoints are not exposed by the connector.

Therefore production Apps Script remains unchanged and the low-usage `.gs` files are not installed.

### Exact stop

`PERF-CF-02E`: Production stale-safe Orders Edge guard is active and PASS; raw mirror is stale; frontend Orders Edge flag is OFF; low-usage sync is prepared/CI-PASS but not installed in production Apps Script.

### Next gate

When a real Apps Script source-edit channel becomes available:
1. capture Apps Script production version/deployment/triggers;
2. add only the two low-usage Orders sync files as separate source files;
3. run first sync and require PASS;
4. verify one intended 5-minute trigger and no competing legacy trigger;
5. verify Orders/Lines parity and age <=600s across sustained cycles;
6. verify unchanged cycle produces zero D1 write requests;
7. verify signed Production Orders read serves fresh D1 with HTTP 200;
8. only then make a separate decision to set the frontend Orders Edge flag ON;
9. keep Cloud Write OFF until its own authority-cutover gate.

## Global safety state after this supplement

- Production Apps Script: unchanged Version 146.
- Google Sheets: authoritative writes.
- Cloud Write: OFF.
- Frontend Orders D1 read: OFF.
- Production Worker stale guard: ON/PASS.
- CORE-P0: paused.
- No registry write or business-family activation was performed in this performance lane.
