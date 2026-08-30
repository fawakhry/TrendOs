# TrendOS Phase 0 — D1 Worker Atomic Routing Inventory

> Scope: read-only inspection of the supplied Cloudflare Worker source for `/v1/import/sheet` atomic routing and `promoteStagedSheets(body, env)`. No Worker edit or deploy was performed.

## Status

`INV-09F — verify Worker-side atomic promote`: **PASS — SOURCE + PLATFORM CONTRACT**.

## 1. Import routing

`POST /v1/import/sheet` parses:

`atomicAction = String(body.atomicAction || "").trim().toLowerCase()`

and dispatches:

- `stage` -> `importSheetStage(body, env)`
- `promote` -> `promoteStagedSheets(body, env)`
- otherwise -> `importSheetLegacy(body, env)`

The import route is protected by `requireMigrationSecret2(request, env)` before parsing the body.

## 2. Promote preconditions

`promoteStagedSheets(body, env)` requires:

- non-empty `runId`
- at least one requested `sheetName`

For every requested sheet it reads `sheet_staging_catalog` by the exact pair:

`run_id + sheet_name`

Before creating any live-mirror mutation statements it requires:

- staging catalog exists
- `status === 'ready'`
- `row_count === source_last_row`

If any requested sheet is missing/incomplete, the function returns before `env.DB.batch(...)` is called.

Therefore Orders + Lines must both be staged and complete before live promotion starts.

## 3. Exact promote SQL sequence per staged sheet

For each requested staged sheet the function appends prepared statements to one common `statements` array:

1. delete existing live rows from `sheet_rows` for that sheet.
2. upsert `sheet_catalog` with staged metadata and `status='ready'`.
3. copy all staged rows from `sheet_staging_rows` for the exact `runId + sheetName` into live `sheet_rows`.
4. append a completed row to `sheet_migration_runs`.
5. delete staging rows for that `runId + sheetName`.
6. delete staging catalog for that `runId + sheetName`.

The statements for **all requested sheets** are accumulated first.

## 4. Atomic transaction proof

After building the full statement list for all staged sheets, the Worker executes exactly one call:

`await env.DB.batch(statements);`

Cloudflare D1's current Worker Binding documentation states that batched statements are SQL transactions; statements execute sequentially and if one statement fails, the entire sequence is aborted/rolled back.

Therefore the supplied Worker implementation does provide one transaction boundary across the Orders + Order Lines promote statement set, provided both sheet names are included in the same promote request (which the Apps Script caller does).

Result:

**Worker-side live promote is transactionally atomic across the requested Orders + Lines statements.**

This closes the earlier uncertainty that the Worker might be performing independent live-table swaps.

## 5. Staging cleanup behavior

Successful promotion deletes staging rows and staging catalog entries inside the same `env.DB.batch(statements)` transaction.

Consequence:
- cleanup is part of the same transaction as live replacement.
- a failed batch should not leave a committed half-promote with only one sheet switched.

## 6. Retry/idempotency nuance

After a successful promote, the staging catalog/rows for the `runId` are deleted.

A repeated `promote` request with the same `runId` therefore normally fails the initial staging-catalog lookup with `Atomic staging catalog not found` rather than returning the original success result.

So the Worker mutation is atomic, but the promote endpoint is **not replay-idempotent by response contract**.

This matters for the Apps Script observability gap:
- promote can succeed,
- the later `/v1/mirror/stats` call can fail,
- Apps Script can report the overall tick as failed,
- retrying the same promote runId would not simply return the prior success because staging has already been removed.

A later integrity/observability patch should add durable run-result lookup or another unambiguous post-promote reconciliation mechanism; do not change the proven atomic batch behavior blindly.

## 7. Mirror endpoints

The Worker confirms:

- `GET /v1/mirror/sheets` -> `listSheets(env)`
- `GET /v1/mirror/stats` -> `mirrorStats(env)`
- `GET /v1/mirror/sheet` -> `getSheetRows(env, url)`

`mirrorStats` aggregates `sheet_catalog`:
- sheetCount
- rowCount
- readySheets
- pendingSheets
- lastSyncedAt

`getSheetRows` reads live metadata from `sheet_catalog` and live rows from `sheet_rows`.

## 8. What is now proven

1. Apps Script sends one promote request with one `runId` and both Orders + Lines sheet names.
2. Worker validates every requested staged sheet before live mutation.
3. all live replacement + migration-log + staging-cleanup statements are placed into one common statement list.
4. exactly one `env.DB.batch(statements)` executes that list.
5. Cloudflare D1 documents `batch()` as a transaction with rollback of the sequence on statement failure.
6. Worker-side promote atomicity is therefore verified at source/platform-contract level.

## 9. Important remaining Core gap — source snapshot consistency

This PASS only proves the D1-side promote transaction.

It does **not** remove the already-discovered Google Sheets source-snapshot gap:
- D1 sync tick holds a ScriptLock while staging.
- some current write paths such as `updateLine_()` do not honor the same lock.
- `submitCustomerDraft_()` lacks one outer lock around the full conversion.

An unlocked Sheets write can still occur between staging Orders and staging Lines. D1 will atomically promote the pair, but that pair can represent different source moments.

That is a separate Core-integrity problem to close with the shared lock contract in `trendos-integrity-v1.gs`.

## 10. Test/evidence state

- `INV-09F = PASS — SOURCE + PLATFORM CONTRACT`
- `D1-07 = PASS — Worker promote transaction`
- `REG-31` remains PENDING because source-snapshot consistency is not yet fixed/tested.
- `D1-08` remains PENDING because promote-success + stats-read-failure outcome is still ambiguous at Apps Script level.

## Next exact action

Inventory the **actual installed Apps Script triggers** to establish `INV-02`:

- handler function
- event source/type
- cadence
- duplicates

Specifically verify whether exactly one active time-driven trigger exists for `d1OrdersLiveSyncTick` and whether its cadence matches the source-intended one minute.

Do not create/delete triggers during this inventory.