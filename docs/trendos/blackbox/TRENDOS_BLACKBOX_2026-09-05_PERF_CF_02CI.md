# TrendOS Blackbox — PERF-CF-02CI

Date: 2026-09-05
Scope: TrendOS main platform Cloudflare migration only. Accounting is excluded.

## Objective

Enable the Production Cloud Write lane on `trendos-d1-api` behind the existing authenticated fail-closed boundary, without enabling Production cutover, frontend cutover, normalized-data cutover, or changing Sheets authority.

## Authorization

The user explicitly instructed: `افتح كلاود رايت` then `نفذ`.

Temporary push authorization message used because connected GitHub did not expose workflow dispatch invocation:

`AUTHORIZED PROD CLOUD WRITE ENABLE 2026-09-05`

Effective authorization commit after branch synchronization:

`ef7cd11320800dcfe20bd9db754a9519cb0b3ccb`

## Preconditions

- Previous platform checkpoint `PERF-CF-02CH`: CLOSED PASS.
- Production Worker: `trendos-d1-api`.
- D1: `trendos-main`.
- Production Shadow already ON under fixed-synthetic read-only mutation-free observer contract.
- Cloud Write schema had already been qualified ready before enablement.
- Sheets / Apps Script remained authoritative.
- Production cutover remained OFF.
- Frontend cutover remained OFF.

## Safety-gate preparation

The old Production Shadow safety contract intentionally rejected every `TRENDOS_CLOUD_WRITE_V1_ENABLED=true` state. Before changing the Production flag, it was updated to accept Cloud Write ON only as an explicit guarded state.

Updated:

- `tests/cloudflare_production_shadow_observer_candidate_v1.test.mjs`
- `.github/workflows/trendos-cloud-write-v2-production-shadow.yml`

Required ON-state protections include:

- `verifyEdgeSessionToken` present.
- `requireEnabledWriteSession` present.
- auth failure returned before delegation to the write handler.
- Production Shadow remains bounded and mutation-free.
- Wrangler dry-run remains required in the safety gate.

The new Shadow gate passed before Production enablement.

## Controlled Production enable workflow

Created:

`.github/workflows/trendos-production-cloud-write-controlled-enable.yml`

Workflow:

`TrendOS Production Cloud Write Controlled Enable`

Controlled enable run:

- Run ID: `33967591256`
- Job ID: `101310331827`
- Head SHA: `ef7cd11320800dcfe20bd9db754a9519cb0b3ccb`
- Event: push with the exact one-time authorization message.
- Result: **SUCCESS**.

All guarded workflow stages passed:

1. Hard safety gate — guarded Cloud Write ON, no cutover: PASS.
2. Production safety contracts: PASS.
3. Exact Production Wrangler dry-run: PASS.
4. Live Production preflight while the currently deployed lane was still OFF: PASS.
5. Deploy guarded Production Cloud Write ON: PASS.
6. Post-deploy Cloud Write ON / cutover OFF verification: PASS.
7. Anonymous Cloud Write POST rejection: PASS (`401` required by workflow).
8. Pending outbox unchanged by anonymous negative probe: PASS.
9. Anonymous Edge Orders boundary remains protected: PASS (`401` required by workflow).
10. Production Staging bridge remains unavailable: PASS (`404` required by workflow).
11. Production Shadow deterministic mutation-free verification: PASS.
12. Orders and Lines mirror parity read-only verification: PASS.
13. Automatic rollback step: **SKIPPED**, because post-deploy verification passed.
14. Safety conclusion: PASS.

## Production state after enablement

Repository Production configuration now has:

- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "true"`
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`
- Worker remains `trendos-d1-api`.
- D1 remains `trendos-main`.

The successful live post-deploy gate required and proved:

- Cloud Write `enabled = true`.
- Cloud Write `writesAccepted = true`.
- Cloud Write `authConfigured = true`.
- Cloud Write `schemaReady = true`.
- Cloud Write `database = true`.
- Production `cutover = false`.
- `sheetsAuthoritative = true`.

## Explicitly NOT changed

- No frontend cutover.
- No Production cutover.
- No normalized-data cutover.
- No D1 migration executed by the enable workflow.
- No Worker secret rotation.
- No authorized Production business write was executed as part of qualification.
- No canonical Production business Order ID was created by this checkpoint.
- Sheets / Apps Script remain authoritative.
- Production Shadow remains fixed-synthetic, read-only, deterministic, and mutation-free.

## Temporary trigger cleanup

After the successful controlled enable, the temporary exact-message push trigger was removed.

Cleanup commit:

`c97c4c2a1ebe5a6f41972175c268fc2adae01a2d`

The Production Cloud Write enable workflow is restored to **workflow_dispatch manual-only**.

Cleanup Integrity run:

- Run ID: `33967714963`
- Job ID: `101310652789`
- `integrity-foundation`: **SUCCESS**.

A separate Cloudflare GitHub App check named `Workers Builds: trendos` is not the controlled `trendos-d1-api` deploy workflow and is not used as evidence for this checkpoint. The controlled `trendos-d1-api` deploy and all live post-deploy checks were completed by run `33967591256`.

## Blackbox verification

Initial blackbox commit:

`4306b7641adcaa623278bb219e4e44927bb4dc5d`

Integrity verification of that blackbox commit:

- Run ID: `33967756731`
- Job ID: `101310764457`
- `integrity-foundation`: **SUCCESS**.

## Current exact checkpoint

**PERF-CF-02CI — VERIFIED PASS — CLOSED**

Cloud Write is live and guarded. Production cutover is still OFF, frontend cutover is still OFF, and Sheets / Apps Script remain authoritative.

## Safe resume point after closure

Cloud Write is ON but the frontend is not cut over and Sheets remain authoritative. The next Cloudflare migration stage must not silently change either authority or frontend routing. Any subsequent Production write qualification or cutover requires its own bounded gate and checkpoint.
