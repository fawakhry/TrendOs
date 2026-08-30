# TrendOS Handoff

> Read this file first in a new execution chat. Last consolidated: 2026-08-30.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Final TrendOS V1 launch target: **01/03/2027**.

Repository:
- `fawakhry/TrendOs`
- production/default: `main`
- working: `agent/go-live-2026-09-01-integrity`
- safety: `backup/go-live-2026-08-30-pre-p0`

Canonical plan:
`TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Read order

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_HANDOFF.md`
3. `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md`
4. `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`
5. `docs/trendos/inventory/D1_DASHBOARD_PATH_INVENTORY.md`
6. `docs/trendos/inventory/D1_ATOMIC_SYNC_INVENTORY.md`
7. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
8. `docs/trendos/TRENDOS_TEST_MATRIX.md`
9. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

Evidence precedence:
`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`.

## Production identity

Active Apps Script Web App:
- Version **143**
- timestamp: **Aug 29, 2026 11:37 PM**
- deployment ID prefix matches TrendOS `config.js`

Live health verified:
- backend `V1932_FULL_GO_LIVE_20260824`
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Users/Orders/Lines present
- Orders rows 152
- Lines rows 180
- 87 sheets

Version 143 routes:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

GitHub `Code.gs` is behind deployed/editor D1 route wiring. **Do not overwrite Apps Script from GitHub `Code.gs` yet.**

## Current architecture

### Writes
Google Apps Script + Google Sheets remain authoritative for operational/financial writes.

### Orders reads
Version 143 uses `getRowsPageD1FastV2_()`:

```text
request
 -> feature flag
 -> authorize_()
 -> allowed screen
 -> dataVersion
 -> V2.3 stable cache
 -> D1 probe
 -> V2.2 snapshot cache
 -> D1 snapshot/build
 -> page enrichment
 -> cache write
 -> D1 result

failure/unsafe
 -> getRowsPageV1931_()
 -> GOOGLE_SHEETS_FALLBACK
```

Fast Auth V2.4 is **not deployed** in this path; legacy `authorize_()` runs before the stable cache.

### Dashboard reads
`getDashboardD1PrimaryV1_()` uses:
- D1 feature flag
- `authorize_()`
- screen authorization
- shared D1 safety snapshot
- `d1DashboardResultV1_()`
- automatic `getDashboard_()` Sheets fallback

### D1 Atomic Orders + Lines sync — Apps Script side
Mapped source:
- entry point: `d1OrdersLiveSyncTick()`
- enable property: `D1_ORDERS_LIVE_SYNC_ENABLED_V1`
- lock: `LockService.getScriptLock()` with `tryLock(5000)`
- sheets: Orders + Order Lines
- stage batches: 80 rows
- stage endpoint: `POST /v1/import/sheet` with `atomicAction:'stage'`
- both sheets fully staged before promote
- promote: one `POST /v1/import/sheet` with `atomicAction:'promote'`, one runId and both sheet names
- health readback: `GET /v1/mirror/stats`
- source startup design: immediate first successful tick, then `.everyMinutes(1)` trigger
- `startD1OrdersLiveSync()` removes duplicate triggers for the same handler before creating one

Important evidence boundary:
- source proves the Apps Script **request design** is atomic.
- Worker/D1 transaction semantics are not yet inspected in this Phase 0 pass.
- source-defined 1-minute cadence does not prove the trigger is currently installed; active trigger inventory remains pending.

## Critical newly discovered concurrency gap

The sync tick holds a ScriptLock while staging both sheets, but that only blocks write paths that acquire the same ScriptLock.

Known source facts:
- `createManualOrder_()` uses ScriptLock.
- `updateLine_()` does not use a shared lock around the mutation/summary/side effects.
- `submitCustomerDraft_()` does not use one outer lock around full draft -> Order/Lines conversion.

Therefore a current unlocked write can occur between staging Orders and staging Lines. The D1 promote can still switch both staged tables together, but the pair may represent **different logical moments from Google Sheets**.

This is a Core-integrity gap to solve with the shared integrity lock foundation. Do not patch the D1 promote blindly.

Secondary observability gap:
- tick calls promote first, then `/v1/mirror/stats`.
- if promote succeeds but stats read fails, catch reports the run as failed even though D1 may already have changed.

Detailed document:
`docs/trendos/inventory/D1_ATOMIC_SYNC_INVENTORY.md`

## Phase 0 status

PASS:
- `INV-01` Orders/Lines source inventory
- `INV-09A` Primary V1 D1 helper
- `INV-09B` Orders Fast V2/V2.3
- `INV-09C` V2.4 absent from Version 143 Orders path
- `INV-09D` Dashboard D1 path
- `INV-09E` Apps Script atomic/live sync path
- `INV-10A` active Version 143
- `INV-10B` deployment/config match
- `INV-10C` live runtime identity
- `INV-10D` Version 143 top-level routes

Pending/partial:
- `INV-09F` Worker-side atomic promote transaction
- `INV-02` actual installed Apps Script triggers/cadence
- full D1 Worker/API contract
- legacy auth + V2.4 invalidation design
- runtime D1 parity reconfirmation
- remaining Invoice / Attendance / Cleaning / Press / WhatsApp / Handover-OPS inventories
- baseline duplicate IDs and actual ID number formats

## Exact current stopping point

**Next single action: inspect the Cloudflare Worker/API code that handles the D1 atomic import contract, read-only.**

Need to map:

1. `POST /v1/import/sheet` + `atomicAction:'stage'`
2. `POST /v1/import/sheet` + `atomicAction:'promote'`
3. `GET /v1/mirror/stats`
4. whether promote uses one D1 transaction/batch for Orders + Lines
5. staging cleanup/runId behavior
6. failure behavior before/during/after promote

Do not run sync, edit, save or deploy during this inspection.

## First code after Phase 0

Create shared:
`trendos-integrity-v1.gs`

It must centralize:
- ID normalization
- shared locks
- durable idempotency
- Business Calendar
- automation run logging
- open/closed-state helpers

This shared lock contract must close the newly identified source-snapshot consistency gap between D1 staging and current unlocked write paths.

## Non-negotiable safeguards

- Never delete valid historical data.
- Never invent prices/states/payments/stock/approval facts.
- `Order ID` is the order key.
- `Line ID` is the logical active-line key.
- repeated writes must become idempotent.
- check-then-write requires locking.
- duplicate rows marked `مكرر` remain history but do not count as active work.
- Google Sheets remains write authority/fallback until an approved migration changes it.
- tests record Expected / Actual / PASS|FAIL.
