# PERF-CF-02E — Orders Edge Production Guard

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`
Status: **PRODUCTION GUARD PASS / FRONTEND CUTOVER OFF / LIVE SYNC INSTALLATION BLOCKED BY APPS SCRIPT SOURCE-EDIT CHANNEL**

## Objective

Start the practical Orders read migration toward Cloudflare/D1 without exposing stale business data and without changing write authority.

Safety invariants preserved:
- Google Sheets / Apps Script remains authoritative for writes.
- Cloud Write remains OFF.
- Frontend Orders Edge flag remains OFF.
- Debt-filtered Orders remain on Apps Script.
- Anonymous Orders Edge requests remain closed.
- CORE-P0 remains paused.
- No production Apps Script source file was replaced or edited from GitHub.

## Frontend target

`config.js` now points the prepared Orders Edge wrapper to the qualified production Worker:

`https://trendos-d1-api.trendmall-contact.workers.dev`

The activation flag is still:

`MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`

Therefore users are **not** cut over to D1 Orders reads yet.

## Low-usage live sync preparation

Prepared but NOT installed in the production Apps Script source project:
- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
- `cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs`

Qualified contract:
- check every 5 minutes;
- unchanged source => zero D1 write requests and zero D1 writes;
- changed source => row-level delta only;
- periodic full rebase remains a repair safety mechanism;
- Sheets remains authoritative.

CI evidence:
- Workflow: `TrendOS D1 Orders Low Usage V1`
- Run: `33882963526`
- Job: `101055808150`
- Result: SUCCESS.

## Orders stale-data fail-closed guard

Added:
- `cloudflare-d1/src/edge-orders-freshness-gate.mjs`
- `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs`

Wired before the existing `/v1/edge/orders/page` business-row handler.

Orders raw-mirror freshness budget:
- `EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS = 600`

Normalized Customer Manager freshness remains independently protected at 180 seconds.

Guard behavior:
- validates Orders Edge token and screen context;
- checks `sheet_catalog` metadata only;
- requires status ready, row parity, recognized live-sync note, and age <= 600 seconds;
- stale/unready mirror returns HTTP 503 with `fallback=apps-script`;
- stale code is `stale-orders-mirror`;
- business `sheet_rows` are not queried on stale/unready rejection;
- debt view remains Apps Script-only;
- invalid/anonymous auth remains fail-closed through the existing Orders handler.

## Isolated qualification

Workflow:
- `.github/workflows/trendos-edge-orders-read-v1.yml`

Run:
- `33884187556`
- Job `101059843563`
- Result: SUCCESS.

PASS coverage:
- Orders Edge read contract;
- 600-second raw-mirror freshness gate;
- stale fail-closed before business-row reads;
- existing Edge regression;
- existing mirror safety regression.

## Preview runtime qualification

Workflow:
- `TrendOS Edge Orders Preview Runtime V2`
- Run `33884667390`
- Job `101061409227`
- Result: SUCCESS.

Observed mirror at runtime:
- sheet: `بنود الأوردرات`
- syncedAt: `2026-09-04 13:46:50`
- ageSeconds: `2957`
- rowCount: `315`
- sourceLastRow: `315`
- status: `ready`
- note: `TrendOS orders live sync V1`

Expected/Actual:
- Expected stale Orders request: HTTP 503 + Apps Script fallback.
- Actual: HTTP 503, `code=stale-orders-mirror`, `fallback=apps-script`, `dataSource=d1-orders-stale`.
- PASS.

Debt view:
- Expected: HTTP 409 + Apps Script required.
- Actual: HTTP 409, `code=apps-script-required`, `fallback=apps-script`.
- PASS.

Cloud Write:
- remains OFF.
- PASS.

## Production deployment history

### Attempt 1 — automatic rollback worked

Workflow run:
- `33884819968`
- Job `101061911931`

Qualified and deployed Worker code successfully as temporary version:
- `2a1a70f8-3c42-4d20-ac79-bc5ffc2c496f`

The first signed runtime request arrived before the new Worker version had propagated and returned the old 200 D1 response while the mirror was stale.

Gate result:
- FAIL.

Automatic rollback result:
- SUCCESS.
- Restored Worker version `58dda26b-b9b6-41a6-9d3f-5d0e76ae81d8` to 100% traffic.

No frontend cutover occurred.

### Attempt 2 — no deployment performed

Workflow run:
- `33885093716`
- Job `101062807769`

After rollback, Cloudflare reported latest-version/active-version divergence and refused a secret edit before code deployment.

Result:
- secret setup failed before deployment;
- Worker deployment skipped;
- no rollback needed because no new code was deployed.

This established the correct operational order after a rollback:
1. deploy code;
2. make latest version active;
3. install/rotate signing secret;
4. wait for propagation;
5. run signed contract checks.

### Attempt 3 — PRODUCTION PASS

Workflow:
- `TrendOS Edge Orders Production Freshness Guard`
- Run `33885237497`
- Job `101063281621`
- Result: SUCCESS.

Production Worker code deployment:
- Worker: `trendos-d1-api`
- URL: `https://trendos-d1-api.trendmall-contact.workers.dev`
- deployed Worker Version ID reported by code deploy: `f5d4232e-acb1-4bdc-8bc9-a07caa2915e6`

The signing secret was then installed after the code version became active; secret value was never logged.

Runtime mirror evidence:
- syncedAt: `2026-09-04 13:46:50`
- ageSeconds: `3336`
- rowCount: `315`
- sourceLastRow: `315`
- status: `ready`
- note: `TrendOS orders live sync V1`
- expectedFresh: false

Expected/Actual:
- stale active Orders request expected HTTP 503.
- actual HTTP 503.
- actual code `stale-orders-mirror`.
- actual fallback `apps-script`.
- PASS.

Additional production gates:
- anonymous Orders request = 401 PASS;
- debt Orders route = Apps Script required PASS;
- Cloud Write health = enabled false / writesAccepted false / cutover false / sheetsAuthoritative true / schemaMutationFree true PASS;
- rollback step was skipped because all post-deploy gates passed.

## Preview overall workflow note

`TrendOS Cloudflare Auto Preview` run `33884489895` finished FAILURE because its final Orders/Lines freshness gate correctly rejects the currently stale raw mirror even with the new 600-second budget.

This is an expected blocker, not permission to weaken the gate.

## Apps Script tooling boundary — current blocker

Connected tooling was rechecked in this execution lane:
- no Apps Script source-project edit connector is available;
- Google Drive search did not expose a writable `application/vnd.google-apps.script` project;
- repository search found no `.clasp.json`, Script ID, Apps Script project ID, or Google/Apps-Script deployment workflow/credential reference that can safely reconstruct the live source project;
- GitHub sensitive secret APIs are unavailable through the connector and no Google Apps Script credential references were found in repository workflows.

Therefore the assistant did **not** claim or attempt to install the two `.gs` files into production Apps Script.

## Exact stopping point

**PERF-CF-02E — Production Orders stale-data guard is deployed and runtime-PASS on `trendos-d1-api`; frontend Orders D1 read flag remains OFF; raw Orders/Lines mirror remains stale at the last verified sync point `2026-09-04 13:46:50`; low-usage 5-minute sync is prepared and CI-PASS but is NOT installed in production Apps Script because no source-edit channel is available.**

## Next authorized production gate

Only after a genuine Apps Script source-edit channel is available:
1. capture production Apps Script version/deployment/triggers;
2. add ONLY `D1_Orders_Live_Sync_V2.gs` and `D1_Orders_Low_Usage_Control_V1.gs` as separate files; never replace `Code.gs`;
3. run the low-usage start function and require first sync PASS;
4. verify exactly one intended low-usage trigger and no competing legacy Orders trigger;
5. verify Orders + Lines mirror parity and age <= 600 seconds;
6. verify at least two subsequent 5-minute cycles, including zero-write behavior when unchanged;
7. run signed Production Orders Edge read and require 200 from fresh D1;
8. only then consider setting `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true` as a separate cutover decision;
9. keep writes on Apps Script/Sheets until a separate Cloud Write authority gate.

## Rollback

Worker rollback baseline before this lane:
- `58dda26b-b9b6-41a6-9d3f-5d0e76ae81d8`

Frontend read rollback:
- keep/set `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`.

Live-sync rollback after future installation:
- stop the low-usage/V2 Orders sync and remove its trigger;
- return to Apps Script reads/writes while investigating.
