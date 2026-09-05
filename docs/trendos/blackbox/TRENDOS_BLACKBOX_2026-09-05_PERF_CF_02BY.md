# TrendOS Black Box — PERF-CF-02BY

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Checkpoint: `PERF-CF-02BY`
State: **PASS — controlled Production deployment prepared, not executed**

## Resume point used

Resumed from `PERF-CF-02BX` without restarting inventory or redesigning the plan.

Recorded 02BX next path was:

1. requalify Preview Orders / Lines freshness,
2. rerun isolated Production Shadow Preview,
3. prepare a controlled Production Shadow deployment with Shadow OFF,
4. keep Cloud Write OFF.

## What was found

The previous Preview failure was not stale/missing Orders data.

The low-usage V2 design intentionally avoids Cloudflare requests and D1 writes while Google Sheets is unchanged, so raw D1 `syncedAt` can remain old during idle periods.

A fresh read-only heartbeat proved the deployed low-usage controller was healthy:

- 5-minute trigger active,
- Orders source = 274 rows / 67 columns,
- Lines source = 315 rows / 82 columns,
- no source change,
- no error,
- no idle Cloudflare request,
- no idle D1 write,
- no legacy/direct V2 duplicate triggers.

Root cause: the Auto Preview CI gate still used single-signal raw timestamp semantics while the runtime already used dual-signal freshness semantics.

## What was changed

### Read-only diagnostics

Commits:

- `f2568c5f558157a5e106b658722a42e0400af428`
- `63fcbab403dcb09e32b3708dc3b576eefa9dd58e`

Run `33956516993`: PASS.

### Auto Preview freshness gate

Commit:

- `a5cc108c09f74b5789a22e85df348aafa488de76`

Changed final Orders qualification to use the protected real dual-signal runtime route instead of accepting/rejecting by raw `syncedAt` alone.

Run `33956629954`: PASS.
Integrity `33956629957`: PASS.

No freshness budget was weakened and no synthetic D1 heartbeat write was introduced.

### Isolated Production Shadow Preview requalification

Commit:

- `2691f24e5dd222ba323185e316937838f6c8104d`

Run `33956710173`: PASS.
Integrity `33956710169`: PASS.

Verified:

- deterministic read-only shadow plan,
- no D1 write,
- no Sheets write,
- no Apps Script call,
- no Production cutover,
- Production Shadow route still absent from Production,
- Production Cloud Write still OFF.

### Live Production read-only preflight

Commit:

- `3942e3eb24eaccf4bcc278629c4ba72b200d503f`

Run `33956764104`: PASS.
Integrity `33956764098`: PASS.

Verified:

- Production Cloud Write OFF,
- Production Shadow route 404,
- Staging V2 bridge route 404,
- no mutation.

### Controlled Production deployment gate preparation

Workflow added:

`.github/workflows/trendos-cloud-write-v2-production-shadow-controlled-deploy.yml`

Commits:

- `52a89ea665fa119731127888c35ad2668fcc7bfe`
- `7d7d449be690ae52494802e3e39e3ecc7fed3865`

Integrity run `33956881969`: PASS.

Safety contract:

- workflow_dispatch only,
- no push trigger,
- requires exact confirmation `DEPLOY_PRODUCTION_SHADOW_OFF`,
- Shadow flag must be false,
- Cloud Write flag must be false,
- low-usage heartbeat must remain enabled,
- pre-deploy tests + Wrangler dry-run,
- live Production GET-only preflight,
- no D1 migration apply,
- no Worker secret rotation,
- post-deploy OFF-state checks,
- automatic Worker rollback on verification failure.

## Production boundary at stop

**No Production deployment was executed in PERF-CF-02BY.**

Current safety state:

- Production Shadow deployment: NOT EXECUTED.
- Production Shadow enablement: OFF.
- Production Cloud Write: OFF.
- D1 migrations: NOT APPLIED.
- D1 writes from this checkpoint: NONE.
- Apps Script writes from this checkpoint: NONE.
- Google Sheet writes from this checkpoint: NONE.
- Worker secret rotation: NONE.
- frontend cutover: NONE.

Working branch remains configured for the future wrapper deployment with:

- `main = "production-shadow/index.js"`
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`

## Exact next step

Do not enable Shadow or Cloud Write.

The next safe action, only after explicit Production deployment authorization, is to manually dispatch:

`TrendOS Production Shadow Controlled Deploy`

with:

`DEPLOY_PRODUCTION_SHADOW_OFF`

This first deployment must install only the wrapper while Shadow stays OFF and Cloud Write stays OFF, then record a fresh post-deploy OFF-state checkpoint before considering any Shadow observation enablement.

Canonical detailed checkpoint:

`docs/trendos/checkpoints/PERF_CF_02BY_DUAL_SIGNAL_FRESHNESS_SHADOW_REQUAL_CONTROLLED_DEPLOY_PREP_2026-09-05.md`
