# TrendOS Black Box — PERF-CF-02CA

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## What was executed

Continued from `PERF-CF-02BZ` and enabled the already-deployed Production Shadow wrapper only in the bounded fixed-synthetic read-only observer mode.

Production Cloud Write stayed OFF throughout. Google Sheets stayed authoritative. No Production business write, D1 migration, Worker secret rotation, frontend cutover, or normalized-data cutover was performed.

## Contract and CI preparation

1. Updated Production Shadow observer test to permit explicit Shadow ON only under the tested fixed-synthetic mutation-free observer contract while Cloud Write remains OFF.
   - commit `31ef6f7ce766ad07fbcaa4707914518b192f6b7c`

2. Hardened Production Shadow CI gate to accept the explicit bounded read-only ON state and reject Cloud Write ON.
   - commit `2629a14ee93b0705705ff80a2f2b03b523aadf95`
   - Integrity run `33961957123`: SUCCESS
   - Production Shadow Gate run `33961957126`: SUCCESS

3. Created dedicated controlled read-only enable workflow with dry-run, live GET-only preflight, post-deploy invariants, mirror parity and automatic rollback.
   - commit `90a56648e720e63d60bf394272b1d5c3c5369270`

4. Staged working-branch desired config:
   - `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"`
   - `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`
   - commit `d7a07c325351114ec931a53d016a4e3960e8e80b`
   - Integrity run `33962005963`: SUCCESS
   - Production Shadow Gate run `33962005977`: SUCCESS

## Production deployment

Because workflow-dispatch invocation is not exposed through the connected GitHub interface, used a temporary exact-message push authorization limited to the dedicated enable workflow.

Authorization commit:

- `1a3316cd377e7efcba596a2e19a12e164204249c`
- exact message `AUTHORIZED PROD SHADOW READONLY ENABLE 2026-09-05`

Controlled enable run:

- workflow: `TrendOS Production Shadow Read-Only Enable`
- run: `33962046813`
- job: `101295501420`
- result: **SUCCESS**

Production Worker version after deployment:

- **`2796b73b-5a30-4b4a-af83-eabd15d0062c`**

## Live Shadow result

Production Shadow GET returned the fixed synthetic observer plan with all no-write/read-only invariants satisfied.

Fingerprint:

- **`66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`**

Synthetic request id:

- `PROD-SHADOW-OBSERVER-001`

Verified:

- `readOnly=true`
- `mutationFree=true`
- `fixedSyntheticIntent=true`
- `liveProductionDataRead=false`
- `d1Read=false`
- `d1Written=false`
- `appsScriptCalled=false`
- `sheetsWritten=false`
- `authoritativeWrites=false`
- `canonicalWriterInvoked=false`
- `mutationCount=0`
- `networkRequests=0`
- `propertyWrites=0`
- `productionWriteEnabled=false`
- `productionCutover=false`
- `productionRouteIntegrated=false`
- `orderIdPresent=false`

Two consecutive GETs produced the same fingerprint and canonical parameters.
POST was blocked with HTTP 405 and no mutation.

## Core runtime and data boundary

Core Edge health remained operational and `cutover=false`.
Anonymous Orders remained HTTP 401.

Cloud Write health after deployment:

- enabled=false
- writesAccepted=false
- schemaReady=false
- schemaMutationFree=true
- cutover=false
- sheetsAuthoritative=true

Orders mirror parity:

- 279 / 279
- syncedAt `2026-09-05 10:43:48`

Lines mirror parity:

- 321 / 321
- syncedAt `2026-09-05 10:43:48`

Both notes remain `TrendOS orders live sync V2 quota-aware`.

The older normalized entities still report stale under the separate 180-second normalized freshness policy. This is not the Orders/Lines dual-signal path and no normalized cutover is authorized.

## Cleanup

Temporary push authorization removed immediately after successful Production deployment.

Restoration commit:

- `41b83bf6c03e82b02747ffc675c83d825d959fa5`
- workflow returned to `workflow_dispatch` only.

Restoration Integrity run:

- `33962143058` — verify final result before closing the turn.

## Current stop state

- Production Shadow: **ON, fixed-synthetic read-only observation only**
- Production Cloud Write: **OFF**
- Sheets authoritative: **YES**
- Cloud Write schema ready: **NO**
- Shadow live business-data read: **NONE**
- D1 business write: **NONE**
- D1 migration: **NONE**
- Apps Script write: **NONE**
- Sheets write: **NONE**
- Worker secret rotation: **NONE**
- Production cutover: **NO**
- Rollback: **NOT NEEDED**

## Next safe action

Run a separate read-only Production Shadow stability observation across repeated samples while Cloud Write remains OFF. Require the same deterministic fingerprint, no live Production business-data reads, no mutations, healthy core runtime, Cloud Write OFF, and Orders/Lines mirror parity. Do not move to Cloud Write enablement while `schemaReady=false` or without a separate explicit authorization and checkpoint.
