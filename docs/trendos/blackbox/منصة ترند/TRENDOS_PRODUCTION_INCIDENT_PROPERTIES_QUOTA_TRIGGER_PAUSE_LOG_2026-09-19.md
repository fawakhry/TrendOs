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

## GitHub recording continuation — 2026-09-19

| Step | Actor / performed operation | Result / verification |
|---|---|---|
| 11 | Assistant created this incident log on isolated T12 branch; incident-log creation commit `1a3748e1e1e45960677c0f3da69f9bc2ad01797d`. | **GITHUB DOC WRITE COMPLETE**; does not mutate production. |
| 12 | Assistant updated platform `00_INDEX.md` to prominently link incident and distinguish user-reported trigger pause from independently verified removal; index commit `9507ff3f0dafa753b7935596541378ea5cd2849b`. | **GITHUB DOC WRITE COMPLETE**; no production change. |
| 13 | Assistant updated the isolated T12 Git diff scope guard to permit only this specifically named production-incident ledger as extra documentation; guard commit `bd7275d7d627831f67bfd5f11eb0ff5630f6c10e`. | **GITHUB CODE CHANGE COMPLETE**, strictly CI diff-whitelist only; production files untouched. |
| 14 | GitHub Actions isolated CI run `35455969908`, head `bd7275d7d627831f67bfd5f11eb0ff5630f6c10e`. | **SUCCESS**; the isolated test/scope guard continues to pass. This run does NOT confirm production trigger count, Script Property cleanup, or D1 parity. |

**Next incident checkpoint:** R0, confirming the final same-project trigger count and capturing the exact observed current state. Do not record a zero count, any Script Property deletion, or recovery of Print as performed until independent verification arrives.

## R0 verified continuation — owner screenshot available in conversation

| Step | Actor / evidence | Outcome |
|---|---|---|
| 15 | Owner-provided Apps Script **Triggers** screenshot from the same project shows **Showing 0 triggers** / **No results** and a UI toast **Trigger permanently deleted** following the two earlier photographed 1-minute and 5-minute time-driven triggers. The screenshot is available in the conversation; no customer data or secrets transcribed. | **R0 PASS — verified by owner screenshot** that the displayed user's installable trigger list is empty after deletion. The assistant did not perform the deletion. This does not rule out triggers owned by other accounts and is not proof that running executions were terminated. |

**Corrected current state:** The historical R0/“pending” and “next screenshot needed” entries above describe what was known at the time of their writing. They are now superseded by this verified owner screenshot. Do **not** ask the owner to delete either trigger again. Do **not** recreate them until Script Property quota, D1 freshness and recovery gates R1–R4 are completed.

**R1 NOW ACTIVE — READ-ONLY PROPERTY INVENTORY.** No production Script Property, Sheet, Cloudflare Worker, D1 schema/data, deployed Apps Script version, or `main` change has been made by the assistant. Storage quota is still not measured; the snapshot does not establish that Print has recovered. The two scheduled synchronization streams are stopped for this user's visible triggers, so D1 may grow stale while Apps Script/Sheets remain authoritative for business writes.

## R1 diagnostic preparation — GitHub-only / NOT RUN ON PRODUCTION

| Step | Actor / performed action | Verified result |
|---|---|---|
| 16 | Assistant added isolated read-only Apps Script diagnostic source at `cloudflare-d1/t12-preview/t12-script-properties-quota-audit-readonly.gs`. Commit `64283bdab1784b722d2aefe2d5793eb6e9f08872`. | **GITHUB-ONLY PREPARED**. Not copied, saved or executed in production Apps Script. |
| 17 | Assistant added a static safety test at `tests/t12_script_properties_quota_audit_readonly.test.mjs`; added the file and test to isolated CI. | **GITHUB-ONLY PREPARED**. Test asserts no property writes/deletes, Apps Script trigger or sheet operations, network calls or unredacted secret logging. |
| 18 | Isolated GitHub Actions run `35456228399` at head `8acc550cfd587b5d37615ceafac18d4bc60fa739`. | **SUCCESS**. This proves static test and T12 CI pass, not that the live property storage has been measured or repaired. |

The read-only diagnostic uses the local bound project's `getKeys()` and `getProperty()` solely to aggregate approximate key/value UTF-8 byte counts in fixed buckets: V1908 replay, D1 V2 baseline chunks, other D1 synchronization properties, and remainder. It logs **bucket counts and sizes only**. It does not log raw keys or values, does not mutate anything, and does not infer that particular old replays may safely be removed.

**R1 live execution is PENDING:** Using this helper in the bound project would require an explicit, limited addition to Apps Script `Head` and a manual read-only function run by the owner (NOT a Version 155 web-app deployment). Owner approval to modify `Head` for this diagnostic has not yet been captured. Do not claim the assistant directly accessed the live project; TinyFish authenticated browser run was not started because of insufficient credits. If an existing authorized read-only diagnostic is available without code modification, prefer it.

**Operational warning:** Trigger-count screenshot R0 PASS does not release the storage quota. Keep both previously removed scheduled synchronization triggers off while measuring R1; D1 data may be stale. Any cleanup of saved-response keys or baseline chunks is still blocked by backup/idempotency/mirror qualification gates.

## R1 live execution request — access boundary, 2026-09-19

The owner explicitly approved adding the read-only diagnostic to the original bound Apps Script project's Head and running it without a deployment.

**Execution result: NOT PERFORMED.** The currently connected Google Drive actions cover Docs/Sheets/Slides/Drive but have no Apps Script project source-edit or scripts.run operation. The only connected authenticated browser-automation provider already rejected the prior run at start due to an insufficient wallet balance; no authenticated browser session could be started. Therefore the assistant has not edited the live Apps Script Head, executed the helper, read live Script Properties, or made any Production change.

The diagnostic source remains available on the isolated GitHub branch at `cloudflare-d1/t12-preview/t12-script-properties-quota-audit-readonly.gs` with successful static CI `35456228399`. Approved manual handoff for the owner: add a **new, temporary .gs file** in the confirmed bound Apps Script project, copy only the diagnostic function from this source, save **Head only** without deployment, run `trendosPropertyQuotaAuditReadOnly20260919` manually, and share **only the aggregated JSON log** after verifying no sensitive property values were copied. Do not run order-create, sync, cleanup, or deployment functions as a diagnostic substitute.

**R1 remains PENDING. R2 cleanup NOT STARTED; R0 user-owned visible trigger pause remains verified (Showing 0 triggers).**

## R1 live measurement — OWNER EXECUTED / PASS — 2026-09-19

Owner provided the sanitized aggregated JSON output from manual live execution of `trendosPropertyQuotaAuditReadOnly20260919` in the original Apps Script project. No secret values or individual order identifiers were provided.

| Bucket | Count | Approximate key+UTF-8-value bytes |
|---|---:|---:|
| `CREATE_ORDER_V1908_REPLAYS` | 679 | 442413 |
| `D1_ORDERS_V2_BASELINE_CHUNKS` | 13 | 88905 |
| `D1_SYNC_OTHER` | 23 | 5496 |
| `ALL_REMAINING_PROPERTIES` | 24 | 22410 |
| **TOTAL** | **739** | **559224** |

Additional counters: `replayOlderThan48Hours=679`, `replayOlderThan7Days=576`, `replayAgeUndetermined=0`, `baselineHighestIndexObserved=12`, `baselineChunkCountObserved=13`.

**R1 PASS** for the live inventory: approximately 442k bytes are accumulated V1908 successful-create replay records (~79% of measured footprint); ~89k bytes are D1 V2 baseline chunks (~16%). These are measurements, not a verified safe-delete candidate list. All 679 key-encoded request timestamps are more than 48h old according to the audit clock; 576 are more than 7d. No customer's individual response value or request key is in this record.

**Engineering implication:** The immediate largest quota pressure is accumulated per-order replay records, not necessarily a D1 baseline leak. Do **not** delete the 13 D1 baseline chunks or their count: they represent a coherent delta-sync baseline. No property has been deleted as part of R1. Temporary trigger pause R0 remains in effect; D1 may be stale. A measured total above the store quota can be explained by the helper's approximate UTF-8 sizing versus service accounting and/or the service storage state; do not claim an exact billable quota delta.

**R2 NEXT — PREVIEW / owner approval needed for deletion:** Design a bounded, oldest-first cleanup candidate restricted to `TRENDOS_CREATE_ORDER_V1908_co_<13 digit epoch>_<suffix>`; require >7-day age and JSON `success===true` with a saved timestamp older than retention, preserve the newest 48h in any case, cap each batch, and verify backup/archive and order-idempotency safeguards before any deletion. Old request retries after replay-key deletion can create duplicates: retain audited backup and verify that those requests cannot be reissued through current frontend; never silently declare old replay deletion risk-free. Request separate explicit authorization of the exact deletion protocol. Any pass/fail result of actual R2 must be logged subsequently.

**Current stop point:** R0 verified PAUSED / R1 live inventory PASS / R2 cleanup NOT PERFORMED / production quotas still failing or recovery not yet independently verified / R3-R6 PENDING.

## R2 dry-run preview preparation — GitHub-only / 2026-09-19

| Step | Performed action | Evidence |
|---|---|---|
| 19 | Added `cloudflare-d1/t12-preview/t12-script-properties-replay-cleanup-preview.gs` on isolated T12 branch. | Commit `e6b449a351ee8b7c78793f060059bd5360063bc4`. **READ-ONLY**; only scans matching replay records and returns aggregate 7-day/48-hour eligibility counts and oldest 150 approximate bytes. No individual keys, order IDs or values logged. |
| 20 | Added isolated static safety test `tests/t12_script_properties_replay_cleanup_preview.test.mjs` and included it in T12 CI. | CI run `35456836923` at `c9faa8991bb42684134ae76a0d3805f312dbc854` = **SUCCESS**. |
| 21 | Prepared proposed R2 policy: only >7-day V1908 replay records whose JSON `success===true`, nonblank `orderId` and `savedAt` >7 days; first batch max **150** oldest; retain all recent entries and all D1 baseline/secret/counter keys. | **PROPOSED ONLY; NO LIVE CLEANUP PERFORMED**. Deleting even an aged replay entry removes one layer of duplicate-request protection if an ancient request is retransmitted; require verified recoverable secure backup and explicit owner approval of a bounded production cleanup before any deletion. |

**Next operational action:** owner may run only the read-only `trendosReplayCleanupPreviewReadOnly20260919` helper from the isolated branch in original bound Apps Script Head (without Deploy), then provide its aggregated output. Do not copy raw Script Properties values to chat or GitHub. R2 remains PENDING until a separately authorized, verified backup-and-delete action is completed.

## R2 owner-run live preview — PASS / deletion still pending — 2026-09-19

The owner manually ran the READ-ONLY `trendosReplayCleanupPreviewReadOnly20260919` helper and supplied the aggregate report, confirming:

| Observation | Owner's live report |
|---|---:|
| `mutationPerformed` | `false` |
| `pendingOwnerApprovalForDeletion` | `true` |
| `totalReplayCount` | 679 |
| `totalReplayBytesApprox` | 442413 |
| `eligibleOver7DaysWithSuccessSavedAtAndOrderId` | 576 |
| `oldestFirstProposedBatchCount` | 150 |
| `proposedBatchBytesApprox` | 96208 |
| `skipped.tooRecent` | 103 |
| Other skip categories combined | 0 |

**Interpretation:** Under the helper's strict seven-day key/savedAt and successful-response filters, 576 old records are *candidates for further verification*, not automatically safe-to-delete records. The first 150 oldest would free approximately 96,208 measured key+value bytes if removed. This does not prove that those 150 business orders still exist in the authoritative Sheet, that retries cannot recur, that all candidates are recoverably backed up, or that the quota will stay below the limit once writes resume. Current frontend and deployed Apps Script version 155 must not be presumed to guarantee that a seven-day-old request key can never be retransmitted.

**R2 deletion gate stays CLOSED.** Before any production deletion: separately approve an exact bounded batch; create a restricted-access backup of the complete selected key-value replay records **outside Script Properties** and verify integrity/retrievability; validate the referenced business order IDs against the authoritative Sheet or an equally reliable source; preserve recent records and every D1 baseline/secret/counter key; ensure safe retry behavior for old requests; then perform a bounded deletion with before/after aggregate audit and production read-only test. Do not publish replay backups in GitHub, a chat message, or a widely shared Drive folder. No deletion was performed by this preview.

**Latest status:** R0 verified 0 owner-visible triggers / R1 live inventory PASS / R2 live dry-run PASS (150 candidate records, approx 96,208 bytes) / **R2 backup, validation and deletion NOT YET DONE** / R3-R6 pending.

## R2 owner authorization — 2026-09-19

Owner explicitly approved secure private backup, authoritative-order verification, and a bounded cleanup of **verified eligible** older V1908 replay records (maximum 150), with before/after measurement, retention of D1 baseline/auth/order numbering properties and revalidation after cleanup.

**Approval is not evidence of execution.** No backup has yet been verified and no property deletion has occurred. The assistant has no Apps Script project edit/execute capability in this connection; the owner must run any reviewed helper manually inside the correct bound Apps Script project. Next checkpoint: implement and separately test a safe private Drive backup + exact content verification helper (no Script Property writes/deletes), and obtain a sanitized backup verification result; only then review Sheet order parity and deletion gate. Never print or put unredacted backup data or Drive file identifiers in chat/GitHub.
