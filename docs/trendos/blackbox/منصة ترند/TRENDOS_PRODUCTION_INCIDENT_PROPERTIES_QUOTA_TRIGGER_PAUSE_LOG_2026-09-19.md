# TrendOS Production Incident — Apps Script property quota / temporary sync-trigger pause — 2026-09-19

## Purpose and precedence

This is an **append-only operational incident log** for the production platform, recorded in the isolated T12 GitHub branch. It does **not** authorize deployment, Script Property deletion, business-data mutation, Cloudflare/D1 changes, or a production Order-create cutover.

Repository: `fawakhry/TrendOs`
Documentation branch: `cloud-migration-v3-t12-order-create-ci-20260919`.
Earlier platform migration checkpoint: `CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md`.
T12 engineering handoff: `CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md`.

**Distinguish throughout: OBSERVED = visible in owner-provided screenshots/logs; USER-REPORTED = described by owner but not independently checked; REVIEWED CODE = repository source, NOT byte-exact live deployment source; PENDING = requires a fresh production observation.**

All timestamps below refer to 2026-09-19 and are as displayed in owner screenshots, not independent live API readings. No sensitive property values, credentials, per-order request keys, or customer data are reproduced here.

## Chronological activity / evidence ledger

| Step | Evidence / action | Status / implication |
|---|---|---|
| 01 | Owner reported Print section server message: `You have exceeded the property storage quota. Please remove some properties and try again.` | **OBSERVED** recurring production symptom; Print orders not reliably loaded. |
| 02 | Production Apps Script **Executions** screenshot showed Web App deployment **Version 155** serving `doGet` / `doPost`. | **OBSERVED** deployment version only; exact Version 155 source not exported or matched to GitHub. |
| 03 | Owner opened Script Properties; several `TRENDOS_CREATE_ORDER_V1908_co_...` saved-create response keys were visible, alongside authentication, D1, and Cloud Write keys. | **OBSERVED** multiple categories share the same property storage; individual order keys/values deliberately omitted. No count/size measurement completed. |
| 04 | Additional images showed `D1_ORDERS_LIVE_SYNC_V2_BASELINE_0` through at least `_11`, plus `D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNKS`. Other visible properties included `D1_ORDERS_LIVE_SYNC_V2_ENABLED=1`, D1 status/last-run keys and `D1_ORDERS_LOW_USAGE_CONSECUTIVE_ERRORS_V1=858` in one screenshot. | **OBSERVED** baseline chunks and counter; do **not** infer exact total storage or exact count at time of incident from screenshots alone. |
| 05 | Owner attempted to edit `D1_ORDERS_LIVE_SYNC_V2_ENABLED` from `1` to `0`; reported that the input was not editable / would not accept typing. | **USER-REPORTED** failed editing attempt. No successful property change confirmed; keep enabled state **UNKNOWN after attempt** until a fresh saved-value observation. |
| 06 | Owner shared Apps Script execution log: `d1OrdersLowUsageTickV1` **Failed** with property-storage quota exception inside `d1OrdersLowUsageRecordErrorV1_`, file `D1_Orders_Low_Usage_Control_V1`, line **86** (caller `d1OrdersLowUsageTickV1` line **155**). Another `d1OperationalEnrichmentLiveSyncTick02CR` execution also failed with quota exception. | **OBSERVED** that both scheduled synchronization paths were affected by quota exhaustion; the failing logging write is not proof it originally caused the quota fill. |
| 07 | Owner opened **Triggers** screenshot: **Showing 2 triggers**, both owned by the user and time-driven / Head. `d1OperationalEnrichmentLiveSyncTick02CR` showed error rate **23.54%**; `d1OrdersLowUsageTickV1` showed **42.74%**. | **OBSERVED** pre-pause trigger count and rates; percentages cover Apps Script trigger history, not isolated quota failure rate. |
| 08 | Owner opened trigger edit dialogs and supplied exact schedules: `d1OperationalEnrichmentLiveSyncTick02CR` = **every minute**; `d1OrdersLowUsageTickV1` = **every 5 minutes**; both **Head / Time-driven / Minutes timer**, failure notifications **daily**. | **OBSERVED** restoration settings; the dialogs themselves did not show a saved modification. |
| 09 | Emergency temporary pause was recommended: cancel edit dialogs, delete **only** those two scheduled triggers via the Apps Script Triggers UI, do not delete functions or property keys, and do not Deploy. | **RECOMMENDED**; the owner subsequently referred to “the deletion we did,” so **USER-REPORTED trigger deletion**. The latest independently verified screenshot in the incident record is still the earlier **Showing 2 triggers** image. Until a fresh **Showing 0 triggers** image or trusted trigger read is received, actual final trigger count = **PENDING VERIFICATION**, not confirmed zero. |
| 10 | Owner requested every step and the deletion be recorded in the project's GitHub branch. | **ACTION: this checkpoint is a GitHub documentation commit only**. Recording a user-reported UI operation is not performing/repeating that production operation. |

## Repository code reviewed — explanatory, not proof of live Version 155 behavior

`cloudflare-d1/D1_Orders_Live_Sync_V2.gs`:
- `D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNKS` stores baseline chunk count.
- `D1_ORDERS_LIVE_SYNC_V2_BASELINE_<index>` stores JSON baseline chunks of up to 7000 characters each.
- `d1OrdersLiveSyncV2SaveBaseline_` sets chunks and removes previous chunks beyond the new count.
- `d1OrdersLiveSyncV2LoadBaseline_` reads the count and all numbered chunks.
- If missing/invalid or 24-hour full rebase is due, the V2 tick may run a full sync and recreate the baseline.
- `d1OrdersLiveSyncV2ClearBaseline_` removes chunks and count, and the V2 activation function can trigger full sync. **Do not manually remove individual baseline chunks or run sync-start/clear in the current incident.**

`cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs`:
- `d1OrdersLowUsageRecordErrorV1_` increments consecutive errors and writes last-error / last-attempt properties; this was the observed quota-exception site.
- The low-usage scheduled tick checks `D1_ORDERS_LIVE_SYNC_V2_ENABLED` and can invoke V2 sync upon source change.
- This source establishes why stopping the scheduled trigger can reduce repeated writes, but **does not free already allocated storage**.

`Code.gs` repository baseline:
- stores request-specific create response under a `TRENDOS_CREATE_ORDER_V1908_` prefix for idempotency replay.
- Exact live Version 155 source not verified; do not assume every repository detail is deployed.

## Production safety and current impact

- **Production business-write authority remains Sheets / Apps Script.** T12 Cloud shadow-create candidate is not connected to live production.
- Temporary loss of scheduled synchronization means D1 Orders and operational-enrichment data **may become stale** even if browser requests return successfully. Never infer parity from `doGet` or `doPost` Completed alone.
- Do not blindly recreate any order after an error; reconcile its request/customer/order record against the authoritative sheet first.
- Do not delete `AUTH_PASSWORD_PEPPER`, `CUSTOMER_DEFAULT_PASSWORD`, `OPENAI_API_KEY`, `D1_MIGRATION_SECRET`, business Order-ID counters, Cloudflare secrets, all Script Properties, or all V1908 replay records.
- No measured property-size breakdown, verified old-request replay expiry, or live source/trigger read currently exists to justify a broad deletion.
- A browser-automation attempt to perform direct authenticated review did **not** start due to the browser service lacking credits. The assistant made **no direct Apps Script UI change** and no production mutation as a result.

## Recovery runbook — each step is a separate verifiable checkpoint

| Gate | Required activity | Current state | Evidence required to close |
|---|---|---|---|
| R0 | Verify paused trigger state. | **PENDING**; deletion user-reported, final screenshot not independently verified. | Fresh Apps Script Triggers screen showing 0 triggers, or trusted same-project read with zero count. If not zero, isolate exact remaining trigger(s) before change. |
| R1 | Inventory Script Property storage without exposing secret values. | **PENDING**. | Safe local summary by prefix: key count + aggregate key/value size, baseline chunk count, old replay count/age. Secret values remain private. |
| R2 | Define and execute minimal verified cleanup, after owner confirmation of exact key set + safe backup/replay checks. | **NOT STARTED**. | Exact key names or narrow key pattern, backup method, affected order validation, before/after quota use. Do not delete baseline fragments opportunistically. |
| R3 | Verify App Script quota errors stop and Sheets authoritative operations work. | **PENDING**. | Fresh error-free execution evidence plus authoritative sheet comparison; no new business order solely for testing unless separately approved. |
| R4 | Restore and reconcile D1/operational feeds with bounded, quota-safe catchup; no blind full-rebase. | **PENDING**. | D1 freshness/parity and bounded-delta qualification, stale-read gating, trigger schedule review and owner approval. Previously observed schedules: enrichment 1 min; Orders low usage 5 min. |
| R5 | Engineering fix preventing recurrence: move large baseline and create replay state out of Script Properties with atomic/idempotent semantics; track separately from T12 production cutover. | **PENDING**. | Isolated tests, storage bounds/retention design, rollout and rollback plan, explicit production change approval. |
| R6 | Resume T12 Cloudflare Order-create migration after stabilization. | **ENGINEERING ONLY**. | Verified Version 155 source, complete create-contract parity, exclusive business Order-ID authority, rollback and owner-approved separate cutover. |

## Exact handoff

**INCIDENT OPEN / PRODUCTION STORAGE-QUOTA FAILURE VERIFIED / TRIGGER PAUSE USER-REPORTED BUT ZERO-TRIGGER EVIDENCE PENDING / STORAGE CLEANUP NOT PERFORMED / D1 FRESHNESS NOT QUALIFIED / T12 GITHUB-ONLY.**

Next response must first reconcile any newly supplied trigger screenshot with R0 and append its observed result. Record **every subsequent action** in this file or an append-only continuation with time, evidence, scope, actor, result, and rollback, before advancing gates. Never describe planned actions as performed.
