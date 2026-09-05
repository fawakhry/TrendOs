# PERF-CF-02BY — Dual-Signal Freshness Requalification + Shadow Requalification + Controlled Production Deploy Preparation

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED PASS — PRODUCTION DEPLOYMENT PREPARED, NOT EXECUTED**

## Starting checkpoint

Work resumed from `PERF-CF-02BX`.

The recorded next safe boundary was:

1. Resolve / re-qualify Preview Orders + Lines freshness debt.
2. Re-run isolated Preview Production Shadow observation.
3. Only then prepare a controlled Production Shadow deployment with the Shadow flag still OFF.
4. Keep Production Cloud Write OFF throughout.

## Root-cause finding — freshness debt was semantic, not missing data

The earlier Auto Preview freshness failure was initially visible as an old `syncedAt` timestamp on the D1 Orders mirror.

Fresh read-only diagnostics proved that the mirror data itself remained structurally aligned with the Google Sheets source:

- Orders: `274` rows, `67` columns.
- Order Lines: `315` rows, `82` columns.
- Orders mirror row parity: PASS.
- Lines mirror row parity: PASS.
- Note: `TrendOS orders live sync V2 quota-aware`.

The deployed low-usage heartbeat route `getD1OrdersLowUsageHeartbeatV1` was healthy and proved:

- low-usage controller enabled.
- one low-usage trigger installed.
- interval = 5 minutes.
- legacy V1 trigger count = 0.
- direct V2 trigger count = 0.
- source fingerprint present.
- last error = none.
- consecutive errors = 0.
- source unchanged.
- D1 request made while idle = false.
- D1 write made while idle = false.
- unchanged Cloudflare requests = 0.
- unchanged D1 writes = 0.

Therefore the old raw D1 `syncedAt` value was expected during an idle / unchanged source window. The CI gate was using old single-signal timestamp semantics while the runtime had already moved to dual-signal freshness semantics.

Decision: **do not fake freshness, do not force heartbeat writes, do not increase the stale budget to hide the symptom. Fix the CI gate to exercise the real fail-closed runtime path.**

## Diagnostic commits

- `f2568c5f558157a5e106b658722a42e0400af428` — refresh read-only freshness diagnostics.
- `63fcbab403dcb09e32b3708dc3b576eefa9dd58e` — probe the deployed low-usage heartbeat route.

Diagnostic workflow run:

- `33956516993` — SUCCESS.

## Auto Preview dual-signal fix

Commit:

- `a5cc108c09f74b5789a22e85df348aafa488de76`

Change:

- Replaced the final raw `syncedAt <= 600s` acceptance gate in `.github/workflows/trendos-cloudflare-edge-preview.yml`.
- The gate now calls the protected real Orders runtime path: `/v1/edge/orders/page`.
- It requires a valid short-lived Orders Edge token.
- It requires `success=true` and `dataSource=d1-edge-orders`.
- It rejects fallback during qualification.
- The runtime itself remains fail-closed when parity, live-sync note, heartbeat, source shape, or source-change validation fails.

No safety boundary was weakened.

Verification:

- Auto Preview run `33956629954` — SUCCESS.
- Integrity run `33956629957` — SUCCESS.
- Runtime qualification: `ORDERS_DUAL_SIGNAL_AUTO_PREVIEW=PASS dataSource=d1-edge-orders`.
- Cloud Write remained OFF.
- Mutation routes remained fail-closed.
- No D1 migration was applied.
- No Production cutover occurred.

Observed Preview latency during that run:

- Edge health median ≈ `368 ms`.
- Orders mirror read median ≈ `377 ms`.

## Isolated Production Shadow Preview requalification

Commit:

- `2691f24e5dd222ba323185e316937838f6c8104d`

Verification run:

- Preview Shadow run `33956710173` — SUCCESS.
- Integrity run `33956710169` — SUCCESS.

Verified live isolated Preview behavior:

- deterministic fingerprint: `d0056c99e27840d42bf79d92a546b5483241a81e9fb9219c681b2fdd10d667f8`.
- fixed synthetic request id: `PROD-SHADOW-PREVIEW-001`.
- `readOnly=true`.
- `d1Written=false`.
- `sheetsWritten=false`.
- `productionCutover=false`.
- POST remained fail-closed.
- Production Shadow Preview route remained absent from Production.
- Production Cloud Write remained OFF.

Result: **Preview Shadow requalification PASS.**

## Fresh Production live preflight — read-only

Commit:

- `3942e3eb24eaccf4bcc278629c4ba72b200d503f`

Workflow run:

- `33956764104` — SUCCESS.
- Integrity run `33956764098` — SUCCESS.

Verified directly against live Production using GET-only probes:

- Production Cloud Write = OFF.
- `writesAccepted=false`.
- `cutover=false`.
- Sheets remain authoritative.
- Production Shadow route still absent (`404`).
- Staging V2 bridge route still absent (`404`).

No Production mutation was performed by this preflight.

## Controlled Production Shadow deployment gate prepared

New workflow:

`.github/workflows/trendos-cloud-write-v2-production-shadow-controlled-deploy.yml`

Preparation commits:

- `52a89ea665fa119731127888c35ad2668fcc7bfe` — initial manual controlled deploy gate.
- `7d7d449be690ae52494802e3e39e3ecc7fed3865` — hardened self-checks.

Final Integrity run for the prepared gate:

- `33956881969` — SUCCESS.

### Critical characteristics

The controlled Production deployment workflow:

- has **no push trigger**.
- is `workflow_dispatch` only.
- requires exact manual confirmation: `DEPLOY_PRODUCTION_SHADOW_OFF`.
- requires `main = "production-shadow/index.js"`.
- requires `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"`.
- requires `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- requires `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`.
- reruns Shadow and Orders safety contracts before any deployment.
- performs a Wrangler dry-run before any deployment.
- performs a live GET-only Production preflight before deployment.
- contains no D1 migration apply command.
- contains no Worker secret rotation command.
- performs post-deploy health, Shadow-OFF, Cloud-Write-OFF, bridge-isolation and mirror-parity verification.
- includes automatic Worker rollback if post-deploy verification fails.

### IMPORTANT

The workflow was **prepared only**.

It was **NOT dispatched**.

Therefore this checkpoint performed:

- no Production Worker deployment.
- no Production Shadow enablement.
- no Cloud Write enablement.
- no D1 migration.
- no D1 write.
- no Apps Script write.
- no Google Sheet write.
- no Worker secret rotation.
- no frontend cutover.

## Current Production / working-branch safety state

Working-branch `cloudflare-d1/wrangler.toml` remains:

- Production Worker: `trendos-d1-api`.
- entrypoint: `production-shadow/index.js`.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`.

Production itself still exposes the existing runtime without the Production Shadow route because the wrapper has not been deployed from this checkpoint.

## Decision

**PERF-CF-02BY = VERIFIED PASS.**

Freshness debt is resolved by aligning CI with the already-designed dual-signal low-usage runtime semantics.

Preview Shadow is requalified.

Production live preflight is clean.

The next Production deployment mechanism is prepared and manually gated, but no deployment has been executed.

## Next safe boundary

1. Review this checkpoint and the controlled deploy workflow.
2. If a Production wrapper deployment is explicitly authorized, manually dispatch `TrendOS Production Shadow Controlled Deploy` with confirmation `DEPLOY_PRODUCTION_SHADOW_OFF`.
3. The first Production wrapper deployment must keep both Shadow and Cloud Write OFF.
4. Record and verify the post-deploy OFF-state checkpoint.
5. Only after a separate explicit checkpoint may Production Shadow observation be considered for enablement.
6. Production Cloud Write remains a separate later gate and must stay OFF until independently authorized.
