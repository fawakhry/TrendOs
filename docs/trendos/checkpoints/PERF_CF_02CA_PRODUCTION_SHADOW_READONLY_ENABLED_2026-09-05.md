# PERF-CF-02CA — Production Shadow Read-Only Observation Enabled

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED PASS — PRODUCTION SHADOW READ-ONLY ON, CLOUD WRITE OFF**

## Starting boundary

This checkpoint continues directly from `PERF-CF-02BZ`, where the Production Shadow wrapper was already safely deployed with Shadow OFF and Cloud Write OFF.

The authorized next boundary was read-only Production Shadow observation only. This checkpoint does **not** authorize Cloud Write, Production business-data writes, D1 migrations, normalized-data cutover, or frontend cutover.

## Safety-contract preparation

The Production Shadow observer contract was updated to accept an explicit Production Shadow ON state only when the wrapper remains the fixed-synthetic, mutation-free observer and Production Cloud Write remains explicitly OFF.

Contract commit:

- `31ef6f7ce766ad07fbcaa4707914518b192f6b7c`
- `PERF-CF-02CA allow bounded read-only Production Shadow state in observer contract`

The Production Shadow CI gate was hardened to accept only an explicit bounded OFF/ON state, with ON requiring the fixed synthetic observer markers and Cloud Write OFF.

Gate commit:

- `2629a14ee93b0705705ff80a2f2b03b523aadf95`
- `PERF-CF-02CA harden Production Shadow gate for bounded read-only observation`

Qualification results for that gate commit:

- Integrity run `33961957123` — SUCCESS.
- Production Shadow Gate run `33961957126` — SUCCESS.

## Controlled enable workflow

Created:

`.github/workflows/trendos-cloud-write-v2-production-shadow-readonly-enable.yml`

Preparation commit:

- `90a56648e720e63d60bf394272b1d5c3c5369270`
- `PERF-CF-02CA prepare manual Production Shadow read-only enable gate`

The workflow enforces:

- Worker `trendos-d1-api` only.
- entrypoint `production-shadow/index.js`.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- Orders idle heartbeat enabled.
- observer capability deny-list for D1 query APIs, Apps Script, SpreadsheetApp, PropertiesService and authoritative writer hooks.
- no `wrangler d1 migrations apply`.
- no Worker secret rotation.
- Shadow and Orders safety-contract tests before deployment.
- Wrangler dry-run before deployment.
- GET-only live Production preflight.
- automatic rollback if post-deployment verification fails.

## Desired configuration staged without auto-deploy

The working-branch desired Production configuration was changed to:

- Production Shadow: ON.
- Cloud Write: OFF.
- Sheets authoritative.

Commit:

- `d7a07c325351114ec931a53d016a4e3960e8e80b`
- `PERF-CF-02CA stage Production Shadow read-only ON with Cloud Write OFF`

Important: this commit itself did not auto-deploy the Worker. Production deployment workflows are not triggered by this `wrangler.toml` change.

Qualification on this state:

- Integrity run `33962005963` — SUCCESS.
- Production Shadow Gate run `33962005977` — SUCCESS.

## One-time deployment authorization

The connected GitHub interface does not expose workflow-dispatch invocation, so the established one-commit authorization pattern was used again.

Temporary authorization commit:

- `1a3316cd377e7efcba596a2e19a12e164204249c`
- exact message: `AUTHORIZED PROD SHADOW READONLY ENABLE 2026-09-05`

The workflow job condition accepted only that exact push message or the normal explicit manual-dispatch confirmation.

## Production enablement run

Workflow:

`TrendOS Production Shadow Read-Only Enable`

Run:

- `33962046813`

Job:

- `101295501420`

Final result:

- **SUCCESS**

All deployment and post-deployment checks completed successfully.
Automatic rollback was available but was **not invoked**.

## Deployed Production version

Wrangler:

- `4.33.2`

Worker:

- `trendos-d1-api`

Production URL:

- `https://trendos-d1-api.trendmall-contact.workers.dev`

New Production Worker version:

- **`2796b73b-5a30-4b4a-af83-eabd15d0062c`**

Worker startup time observed during deploy:

- `4 ms`

Deployed bindings confirmed:

- D1 binding `trendos-main` remains present for the existing core runtime.
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`.

No D1 migration was executed.
No Worker secret rotation was executed.

## Core Production runtime after enablement — PASS

`/v1/edge/health` remained healthy for the currently required boundary:

- `success=true`.
- `database=true`.
- `authConfigured=true`.
- `upstreamConfigured=true`.
- `cutover=false`.

Anonymous Orders access remained protected with HTTP `401`.

### Separate normalized freshness note

The older normalized entities (`customers`, normalized `orders`, `messages`, `conversations`) still report stale under their separate 180-second normalized freshness policy. This is pre-existing and is separate from the Orders/Lines mirror dual-signal path. Because `cutover=false`, no normalized-data cutover is authorized by this checkpoint.

## Live Production Shadow observation — PASS

GET `/v1/cloud/write/v2/production-shadow` is now enabled and returned the fixed synthetic observer result.

Observed invariants:

- `success=true`.
- `valid=true`.
- `shadowOnly=true`.
- `productionShadow=true`.
- `observerOnly=true`.
- `fixedSyntheticIntent=true`.
- `readOnly=true`.
- `mutationFree=true`.
- `liveProductionDataRead=false`.
- `d1Read=false`.
- `d1Written=false`.
- `appsScriptCalled=false`.
- `sheetsWritten=false`.
- `authoritativeWrites=false`.
- `canonicalWriterInvoked=false`.
- `mutationCount=0`.
- `networkRequests=0`.
- `propertyWrites=0`.
- `productionWriteEnabled=false`.
- `productionCutover=false`.
- `productionRouteIntegrated=false`.
- `orderIdPresent=false`.

Fixed synthetic request id:

- `PROD-SHADOW-OBSERVER-001`

Deterministic fingerprint:

- **`66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`**

Two consecutive GET observations returned the same fingerprint and identical canonical create parameters.

POST to the Shadow route returned HTTP `405` and remained mutation-free.

Result: **Production Shadow is ON only as a deterministic synthetic observer. It does not read live Production business data and does not write anywhere.**

## Cloud Write boundary after Shadow enablement — PASS

`/v1/cloud/write/health` confirmed:

- `success=true`.
- `enabled=false`.
- `writesAccepted=false`.
- `schemaReady=false`.
- `schemaMutationFree=true`.
- `cutover=false`.
- `sheetsAuthoritative=true`.

Important: `schemaReady=false` is another reason Cloud Write must remain OFF. This checkpoint does not perform or authorize any schema migration.

## Orders / Lines mirror parity after enablement — PASS

Orders:

- `rowCount=279`.
- `sourceLastRow=279`.
- `syncedAt=2026-09-05 10:43:48`.
- note=`TrendOS orders live sync V2 quota-aware`.
- parity=PASS.

Order Lines:

- `rowCount=321`.
- `sourceLastRow=321`.
- `syncedAt=2026-09-05 10:43:48`.
- note=`TrendOS orders live sync V2 quota-aware`.
- parity=PASS.

The increased counts versus PERF-CF-02BZ represent normal live-source growth; source/mirror parity remained exact.

## Temporary authorization cleanup

Immediately after successful Production enablement, the one-time push authorization was removed.

Manual-only restoration commit:

- `41b83bf6c03e82b02747ffc675c83d825d959fa5`
- `PERF-CF-02CA restore Production Shadow readonly enable to manual-only`

The enable workflow is again `workflow_dispatch` only and requires the exact manual confirmation value `ENABLE_PRODUCTION_SHADOW_READONLY` for any later deployment.

Integrity run after restoration:

- `33962143058` — final result must be verified before closing this execution checkpoint.

## Safety state

- Production wrapper: **DEPLOYED**.
- Production Worker version: **`2796b73b-5a30-4b4a-af83-eabd15d0062c`**.
- Production Shadow observation: **ON — FIXED SYNTHETIC READ-ONLY ONLY**.
- Live Production business-data read by Shadow: **NONE**.
- Production Cloud Write: **OFF**.
- Cloud writes accepted: **NO**.
- Cloud Write schema ready: **NO**.
- Google Sheets authoritative: **YES**.
- D1 migration in this checkpoint: **NONE**.
- D1 business write in this checkpoint: **NONE**.
- Apps Script call/write from Shadow: **NONE**.
- Google Sheet write from Shadow: **NONE**.
- Worker secret rotation: **NONE**.
- frontend cutover: **NONE**.
- normalized-data cutover: **NONE**.
- rollback: **NOT NEEDED**.

## Decision

**PERF-CF-02CA = PRODUCTION SHADOW READ-ONLY ENABLEMENT VERIFIED PASS, subject only to final repository Integrity verification after temporary-trigger cleanup.**

## Next safe boundary

1. Keep Cloud Write OFF and keep Sheets authoritative.
2. Do not apply D1 schema migrations as part of Shadow observation.
3. Observe the live fixed-synthetic Shadow route repeatedly and verify stable deterministic fingerprint, no writes, no live Production data reads, and healthy core runtime.
4. Record a separate stability checkpoint before considering any broader Shadow contract.
5. Investigate Cloud Write `schemaReady=false` independently; it is not an enablement authorization.
6. Any future Cloud Write change remains a separate explicit gate and must not be inferred from successful Shadow observation.
