# TrendOS Phase 0 — D1 Worker Atomic Routing Inventory

> Scope: read-only inspection of the currently supplied Cloudflare Worker code around `/v1/import/sheet` routing and mirror read endpoints. No Worker edit or deploy was performed.

## Status

`INV-09F — verify Worker-side atomic promote`: **PARTIAL — ROUTING CONFIRMED; TRANSACTION SEMANTICS NOT YET PROVEN**.

The supplied Worker source confirms that `POST /v1/import/sheet` parses:

`const atomicAction = String(body.atomicAction || "").trim().toLowerCase();`

and dispatches:

- `atomicAction === "stage"` -> `importSheetStage(body, env)`
- `atomicAction === "promote"` -> `promoteStagedSheets(body, env)`
- otherwise -> `importSheetLegacy(body, env)`

Therefore the Apps Script client contract previously inventoried is recognized explicitly by the Worker.

## Mirror read endpoints confirmed

The supplied `handleMirrorRequest()` routes:

- `POST /v1/import/sheet` -> `importSheet(request, env)`
- `GET /v1/mirror/sheets` -> `listSheets(env)`
- `GET /v1/mirror/stats` -> `mirrorStats(env)`
- `GET /v1/mirror/sheet` -> `getSheetRows(env, url)`

`ensureMirrorSchema(env)` is called before route dispatch.

`mirrorStats(env)` reads aggregate state from `sheet_catalog`, including:

- sheetCount
- rowCount
- readySheets
- pendingSheets
- lastSyncedAt

`getSheetRows(env, url)` reads catalog metadata from `sheet_catalog` and row payloads from `sheet_rows`.

## What is now proven

1. Worker explicitly supports separate `stage` and `promote` actions.
2. Apps Script's atomic-action request names match Worker routing.
3. `promote` is handled by a dedicated function named `promoteStagedSheets(body, env)` rather than falling through to the legacy importer.
4. mirror status/read endpoints are backed by the D1 catalog/row tables.

## What is NOT yet proven

This snippet does **not** include the body of:

`promoteStagedSheets(body, env)`

Therefore it does not yet prove that Orders + Order Lines are promoted inside one D1 transactional/batch operation.

It also does not yet prove:

- runId validation semantics.
- whether all requested staged sheets must exist and be complete before mutation.
- exact SQL sequence used during promotion.
- whether live rows/catalog are replaced in a single `env.DB.batch(...)`, transaction helper, or multiple independent statements.
- cleanup of staging tables after success/failure.
- idempotency behavior if the same promote runId is retried.
- rollback/partial-failure behavior inside the promote function.

## Evidence boundary

Do **not** mark Worker atomicity PASS from the routing snippet alone.

Current conclusion:

`Apps Script combined promote request -> Worker dedicated promote handler` is verified.

`Worker dedicated promote handler -> one atomic D1 transaction for both sheets` remains pending.

## Next exact action

Read-only inspect the complete Worker function:

`async function promoteStagedSheets(body, env)`

Need the full function body from declaration to closing brace.

Do not edit or deploy the Worker during this step.
