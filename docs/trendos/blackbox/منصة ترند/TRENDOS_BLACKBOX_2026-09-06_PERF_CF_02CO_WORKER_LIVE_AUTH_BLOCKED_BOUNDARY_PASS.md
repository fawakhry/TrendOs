# PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison

Date: 2026-09-06

## Status

**WORKER DASHBOARD BUILDER LIVE — AUTHENTICATED CANARY BLOCKED BY EDGE SESSION 401 — FRONTEND OFF — BOUNDARY PASS**

02CO attempted the controlled Orders D1 read canary after 02CN prepared the D1 dashboard builder.

The Production Worker was deployed with the 02CN dashboard-builder code, but the authenticated D1-vs-Apps-Script canary could not complete because the Edge session exchange returned HTTP `401` using the current GitHub qualification username/token secrets.

The frontend D1 orders read switch remained OFF. No broad frontend cutover occurred. Sheets / Apps Script remained authoritative.

## Starting point

Read before work:

- `docs/trendos/blackbox/منصة ترند/00_INDEX.md`
- `docs/trendos/blackbox/منصة ترند/01_CURRENT_STATE.md`
- `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CN_ORDERS_READ_HOTPATH_CANDIDATE_CI_PASS.md`

Confirmed before execution:

- 02CN status was **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**.
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`.
- Sheets / Apps Script remained authoritative.
- Production Cloud Write remained ON.
- Production Shadow remained read-only/mutation-free.
- No frontend cutover was authorized.

## Temporary 02CO workflow

Workflow:

`.github/workflows/trendos-02co-orders-d1-read-canary-temp.yml`

### Initial creation

- Commit: `35780cc655d48b216bd8ff1df63acb7630e7d257`
- Run: `33998555571`
- Job: `101393226552`
- Result: **FAILED before deploy**
- Failure reason: static guard expected the Worker deploy command without the `npx --yes` prefix, so it counted zero controlled deploy commands.
- Production impact: **none**

### Guard fix

- Commit: `04747c874544fd8a02aec985c7b301e3557ca3d6`
- Run: `33998607884`
- Job: `101393360747`

Static 02CO safety boundary passed:

- Worker name remained `trendos-d1-api`.
- Worker entrypoint remained `production-shadow/index.js`.
- D1 database remained `trendos-main`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "true"` remained unchanged.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"` remained unchanged.
- `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"` remained unchanged.
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false` remained unchanged.
- The workflow had exactly one controlled Worker deploy command.
- Checked 02CO files contained no D1 migration command.
- Checked 02CO files contained no `d1 execute --file` command.
- Checked 02CO files contained no `secret put` command.
- Checked 02CO files contained no 02CL reconciliation execution endpoint.
- Checked 02CO files contained no cutover marker.

Markers:

```text
PERF_CF_02CO_STATIC_SAFETY_BOUNDARY_PASS
PERF_CF_02CO_REQUIRED_SECRETS_PRESENT
```

## Pre-deploy boundary

Marker:

```text
PERF_CF_02CO_PRE_DEPLOY_BOUNDARY={"workerMs":649,"cloudWriteMs":385,"pendingOutbox":0,"reconcileEnabled":false,"cutover":false,"sheetsAuthoritative":true}
```

Pre-deploy confirmed:

- Worker health OK.
- Cloud Write health OK.
- `pendingOutbox=0`.
- `cutover=false`.
- `sheetsAuthoritative=true`.
- 02CL reconciliation gate remained OFF.
- generic outbox drain remained disabled/not exposed.

## Controlled Worker deploy

The workflow deployed the Production Worker only to make the 02CN D1 dashboard builder live for a bounded canary.

Command used:

```text
npx --yes wrangler@4.33.2 deploy --config cloudflare-d1/wrangler.toml
```

Deploy evidence:

- Total upload: `337.01 KiB / gzip 67.14 KiB`
- Worker startup time: `4 ms`
- Worker: `trendos-d1-api`
- D1 binding: `trendos-main`
- Trigger URL: `https://trendos-d1-api.trendmall-contact.workers.dev`
- Current Version ID: `4c02c234-305c-4845-b9eb-f52bf647ff9b`

Bindings/vars shown by Wrangler remained:

- `CORS_ORIGINS`
- `APPS_SCRIPT_API_URL`
- `EDGE_SESSION_TTL_SECONDS = "600"`
- `EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS = "600"`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "true"`
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`
- `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"`

No Worker secret was created/rotated/replaced.
No D1 migration was applied.
No `d1 execute --file` was run.
No frontend flag was enabled.

## Authenticated canary result

After deploy, the canary tried to exchange the current GitHub qualification username/token secrets through:

```text
POST /v1/edge/orders/session
```

Result:

- HTTP `401`
- Step failed at Edge session exchange.
- No Edge Orders page comparison was executed.
- No Apps Script `getRowsPageV1931` comparison call was executed after session failure.
- Treat the current GitHub `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` as stale/invalid until refreshed by a normal employee login and secret update.
- Do **not** retry the same token repeatedly. A bad Apps Script employee-token verification can invalidate/clear the stored employee token depending on the auth path.
- Do **not** paste employee token values in chat or repository files.

Run status:

- Run `33998607884`
- Job `101393360747`
- Conclusion: **FAILURE** due only to authenticated session 401 after the controlled Worker deploy.

## Post-auth-failure boundary verification

Because the canary workflow failed before its own final boundary step, a separate read-only boundary workflow was created.

Temporary workflow:

`.github/workflows/trendos-02co-post-failed-auth-boundary-temp.yml`

- Create commit: `94b3c933f53950258a59fa42053d76293840ccf7`
- Run: `33998657431`
- Job: `101393488074`
- Conclusion: **SUCCESS**
- Cleanup commit: `f58ec9acc6f2502469cff931e30917e1c132072e`

Markers:

```text
PERF_CF_02CO_POST_FAILURE_STATIC_NO_WRITE_PASS
PERF_CF_02CO_POST_FAILURE_BOUNDARY={"workerMs":381,"cloudWriteMs":486,"pendingOutbox":0,"cutover":false,"sheetsAuthoritative":true,"reconcileEnabled":false,"genericDrainEnabled":false,"ordersUnauthStatus":401}
PERF_CF_02CO_POST_AUTH_FAILURE_BOUNDARY_PASS
```

Post-failure boundary confirmed:

- Worker health OK.
- Cloud Write health OK.
- `pendingOutbox=0`.
- `cutover=false`.
- `sheetsAuthoritative=true`.
- 02CL reconciliation gate remained OFF.
- generic outbox drain remained disabled/not exposed.
- `/v1/edge/orders/page` without token returned HTTP `401`, so the Orders read endpoint remained protected.

## Current production boundary after 02CO attempt

- Production Worker: `trendos-d1-api`
- Production Worker Version ID: `4c02c234-305c-4845-b9eb-f52bf647ff9b`
- 02CN D1 dashboard builder: **LIVE IN WORKER**
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write `pendingOutbox`: `0`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- frontend D1 orders read flag: **OFF** (`MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`)
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- generic outbox drain: **not exposed / not used**
- `EDGE_SESSION_SECRET` rotation/replacement: **NONE**

## Required next action to resume 02CO

A fresh authorized employee session is required before rerunning the 02CO authenticated canary.

Recommended manual refresh sequence:

1. Perform a normal TrendOS employee login with an allowed canary user.
2. Copy only the fresh employee token into GitHub Actions repository secret:
   `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`
3. Ensure the matching username is in:
   `TRENDOS_PROD_QUALIFY_USERNAME`
4. Do not paste the token in chat or docs.
5. Rerun the failed job or rerun the 02CO temp workflow.

The 02CO temp workflow remains present intentionally for rerun after secret refresh:

`.github/workflows/trendos-02co-orders-d1-read-canary-temp.yml`

## Safe next checkpoint

`PERF-CF-02CO-RESUME — Fresh Auth Secret Refresh / Authenticated Orders D1 Read Canary Rerun`

Rules:

- Do not redeploy unless the existing workflow rerun does it as part of the controlled 02CO path.
- Do not enable `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` globally.
- Do not change D1 schema.
- Do not run D1 writes.
- Do not rotate `EDGE_SESSION_SECRET`.
- Do not use generic outbox drain.
- Keep Sheets / Apps Script authoritative.
- Complete D1 vs Apps Script comparison only after Edge session exchange returns success.
