# TrendOS Phase 0 — D1 Atomic Sync Inventory

> Scope: read-only source inventory of the Apps Script atomic/live sync path for Orders + Order Lines. No sync was run and no production mutation was performed.

## Status

`INV-09E — inspect D1 atomic/live sync path`: **PASS — SOURCE MAPPED**.

This document describes the Apps Script side of the atomic mirror workflow. It does **not** yet prove the Cloudflare Worker/D1 transaction implementation; Worker source/runtime must still be reconciled.

## 1. High-level architecture

Google Sheets remains the write source.

The sync path mirrors exactly two operational sheets:

- Orders (`SHEET_NAME_ORDERS`, fallback `الأوردرات`)
- Order Lines (`SHEET_NAME_LINES`, fallback `بنود الأوردرات`)

The intended flow is:

```text
Google Sheets Orders + Lines
  -> acquire Apps Script ScriptLock
  -> stage Orders in D1 staging
  -> stage Lines in D1 staging
  -> one promote request for both sheet names
  -> read mirror stats
  -> record last-run state
```

The live D1 mirror is intentionally not reset while staging.

## 2. Entry points and cadence design

Primary periodic entry point:

`d1OrdersLiveSyncTick()`

Trigger handler constant:

`D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1 = 'd1OrdersLiveSyncTick'`

`startD1OrdersLiveSync()`:

1. verifies Worker reachability with `GET /v1/mirror/stats`.
2. removes existing project triggers for the same handler.
3. sets `D1_ORDERS_LIVE_SYNC_ENABLED_V1 = '1'`.
4. performs one immediate `d1OrdersLiveSyncTick()`.
5. only after a successful first run creates a time-based trigger with `.everyMinutes(1)`.

`stopD1OrdersLiveSync()`:

- sets enabled flag to `0`.
- removes triggers for the live-sync handler.

Important evidence distinction:
- source defines a **1-minute intended cadence**.
- this does **not** prove that the trigger is currently installed/active in Version 143. Active trigger inventory remains `INV-02`.

## 3. Enable/disable guard

`d1OrdersLiveSyncTick()` first checks Script Property:

`D1_ORDERS_LIVE_SYNC_ENABLED_V1`

If value is not `1`, the run returns skipped without touching D1.

## 4. Concurrency lock

The tick obtains:

`LockService.getScriptLock()`

and uses:

`lock.tryLock(5000)`

If lock acquisition fails, the run is skipped with:

`Another TrendOS write/sync is running.`

The lock is released in `finally`.

### Critical limitation

A ScriptLock protects the snapshot only from code paths that acquire the same lock.

Earlier Orders/Lines inventory proved:

- `createManualOrder_()` does acquire a ScriptLock.
- `updateLine_()` does **not** have a shared lock around its write + summary + side effects.
- `submitCustomerDraft_()` does **not** have one outer lock around its full draft -> Order/Lines conversion.

Therefore the D1 sync is atomic at the **promote request level**, but the Sheets source snapshot is not yet guaranteed to be transaction-consistent against all current write paths.

Example risk:

```text
sync lock acquired
 -> stage Orders
 -> unlocked updateLine_() changes Lines and syncs Order summary
 -> stage Lines
 -> promote both staged tables together
```

The two promoted tables may then represent different logical moments even though D1 promotion itself is one operation.

This is a real Core-integrity gap and must be addressed by the shared lock/integrity foundation rather than by changing the D1 promote algorithm blindly.

## 5. Staging algorithm

`d1OrdersLiveSyncStageOneSheet_(sheet, runId)`:

- reads sheet name/id/last row/last column.
- builds headers with `d1FullHeaders_()`.
- uploads rows in batches of `80` (`D1_ORDERS_LIVE_SYNC_BATCH_ROWS_V1`).
- sends each batch to:

`POST /v1/import/sheet`

with:

- `atomicAction: 'stage'`
- `runId`
- sheet identity
- source dimensions
- `reset: true` only on first batch
- `final: true` only on final batch
- `note: 'TrendOS orders live sync V1'`

For an empty sheet it sends one empty final/reset stage request.

After staging, it checks:

`copiedRows === source lastRow`

and throws on mismatch.

Important:
- staging source explicitly states that live production D1 remains unchanged during this phase.

## 6. Promote algorithm

After both sheets stage successfully, `d1OrdersLiveSyncTick()` sends one request:

`POST /v1/import/sheet`

with:

```json
{
  "atomicAction": "promote",
  "runId": "<runId>",
  "sheetNames": ["Orders", "Order Lines"]
}
```

(the actual names are resolved from the Apps Script sheet constants).

Apps Script therefore requests one combined promote for the two sheets.

### Evidence boundary

This source proves the **client/request design** is atomic.

It does not by itself prove that the Worker performs the promote in a single D1 transaction. That must be verified from Worker source or runtime contract before treating Worker-level atomicity as fully reconciled.

## 7. Mirror health/readback

After promote, the tick calls:

`GET /v1/mirror/stats`

and includes that result in the returned success object.

On success it records Script Property:

`D1_ORDERS_LIVE_SYNC_LAST_RUN_V1`

including:

- timestamp
- runId
- `atomic: true`
- duration
- staged details
- promote result

It deletes the previous last-error property.

## 8. Error behavior

On any exception the tick records:

`D1_ORDERS_LIVE_SYNC_LAST_ERROR_V1`

with timestamp, runId and message, logs the error, and returns `success:false`.

If failure occurs during staging, no promote request has happened and the previous live D1 mirror is expected to remain available.

### Observability ambiguity after promote

The current order is:

1. promote
2. `GET /v1/mirror/stats`
3. record success

Therefore if promote succeeds but the subsequent stats read fails, the catch path reports the sync as failed even though the live D1 mirror may already have been promoted.

This is not necessarily data corruption, but it creates an **outcome ambiguity** between mutation success and observability success. Worker/run-id reconciliation should be able to distinguish these states.

## 9. Start safety behavior

`startD1OrdersLiveSync()` verifies Worker stats before enabling the trigger and performs a first sync immediately.

If the first sync returns unsuccessful:

- enabled flag is reset to `0`.
- no minute trigger is created.
- the function throws.

This is a useful fail-closed startup behavior.

## 10. Status / manual helpers

`getD1OrdersLiveSyncStatus()` returns:

- enabled flag
- `atomic:true`
- lastRun
- lastError
- current mirror stats

Manual helpers exist:

- `testD1OrdersAtomicLiveSync()`
- `logD1OrdersLiveSyncStatusAtomic()`

These helpers were **not executed** during this inventory.

## 11. Current event map

| Event | Entry point | Lock | Idempotency / Run identity | External writes | Retry / failure behavior |
|---|---|---|---|---|---|
| periodic Orders+Lines mirror | `d1OrdersLiveSyncTick()` | ScriptLock, 5s try | unique `runId = orders-<time>-<uuid>` | D1 stage + combined promote | skip on lock; catch records error; old live mirror intended to stay if pre-promote failure |
| start live sync | `startD1OrdersLiveSync()` | tick acquires lock | removes duplicate handler triggers; first-run gate | Worker stats + first sync + trigger create | disables flag and throws if first run fails |
| stop live sync | `stopD1OrdersLiveSync()` | none | handler trigger removal | Script Properties + trigger deletion | deterministic stop |
| status | `getD1OrdersLiveSyncStatus()` | none | none | read only | returns properties + mirror stats |

## 12. Key findings

### Good protections already present

- feature enable/disable switch.
- one ScriptLock around each tick.
- staging leaves live mirror untouched.
- both sheets are staged before promote.
- one combined promote request.
- batch copy count validation.
- duplicate trigger cleanup when starting.
- first-run success required before trigger creation.
- last-run / last-error state recorded.

### Remaining risks / reconciliation items

1. **Source snapshot consistency gap (Core-critical):** not all Orders/Lines write paths currently honor the same ScriptLock, so stage Orders and stage Lines can observe different logical moments.
2. **Worker atomicity still needs proof:** Apps Script requests atomic promote, but Worker transaction source has not yet been inspected in this Phase 0 pass.
3. **Post-promote status ambiguity:** mirror-stats failure after successful promote is reported as overall failure.
4. **Active trigger not yet proven:** source intends every minute; actual installed trigger/cadence remains `INV-02`.
5. **Runtime parity recheck pending:** current D1 atomic health should be reconfirmed after inventory and before Core exit.

## 13. Required tests later

- concurrent unlocked Line update during staging must not produce an inconsistent Orders/Lines promoted snapshot after the shared integrity lock is installed.
- Worker promote must prove both sheets switch together in one transaction/batch contract.
- promote success + stats-read failure must be distinguishable from true promote failure.
- active trigger count must be exactly one for `d1OrdersLiveSyncTick` when enabled.
- live mirror parity must match Sheets source after a completed sync.

## Next exact action

Read-only inspect the Worker/API implementation that handles:

- `POST /v1/import/sheet` with `atomicAction:'stage'`
- `POST /v1/import/sheet` with `atomicAction:'promote'`
- `GET /v1/mirror/stats`

Goal: prove the D1-side transaction/promote semantics and run-id/staging behavior.

Do not run a sync, edit, save or deploy during that step.