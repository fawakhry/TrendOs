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
7. `docs/trendos/inventory/D1_WORKER_ATOMIC_ROUTING_INVENTORY.md`
8. `docs/trendos/inventory/APPS_SCRIPT_TRIGGER_INVENTORY.md`
9. `docs/trendos/inventory/AUTH_PATH_INVENTORY.md`
10. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
11. `docs/trendos/TRENDOS_TEST_MATRIX.md`
12. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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
Version 143 uses D1 Fast V2/V2.3 with:
- legacy `authorize_()` first
- allowed-screen check
- dataVersion-keyed V2.3 stable cache
- D1 probe
- V2.2 page cache
- D1 snapshot/build
- Google Sheets fallback on unsafe/error

Fast Auth V2.4 remains **PREPARED / NOT DEPLOYED / NOT VERIFIED** in this path.

### Dashboard reads
`getDashboardD1PrimaryV1_(e)` uses:
- D1 feature flag
- `authorize_()`
- screen authorization
- shared D1 safety snapshot
- `d1DashboardResultV1_()`
- automatic `getDashboard_()` Sheets fallback

## Current authentication baseline — mapped

Current `authorize_(username, token)` has now been inspected.

Exact sequence:

```text
normalize username
 -> findUser_(...)
 -> reject missing user
 -> reject populated active state unless exactly نعم
 -> require token
 -> constant-time compare stored token vs normalized supplied token
 -> require non-expired session via sessionExpiredV1922_(user.lastLogin)
 -> on token/session failure: clear stored token cell when colToken exists
 -> success: return {ok:true,user}
```

Important conclusions:
- `authorize_()` itself has **no cache**.
- Version 143 Orders read calls this function before the V2.3 page cache, so authoritative user lookup sits on every request.
- the invalid/expired-session path is not purely read-only: it can clear the token in the Users sheet through `safeSet_()`.
- blank/falsy `user.active` is not rejected by the current condition; only a populated value different from `نعم` is rejected.
- exact latency source is still pending because `findUser_()` body has not yet been inspected.
- exact session TTL/policy remains inside `sessionExpiredV1922_()` and is still pending.

Detailed document:
`docs/trendos/inventory/AUTH_PATH_INVENTORY.md`

Test:
- `INV-09G = PASS — SOURCE` current `authorize_()` baseline mapped.

## D1 Atomic Orders + Lines sync

### Apps Script side — verified

`d1OrdersLiveSyncTick()`:
- checks enable property
- takes ScriptLock with `tryLock(5000)`
- stages Orders and Order Lines in 80-row batches
- uses one runId
- fully stages both sheets before promote
- sends one `atomicAction:'promote'` request with both sheet names
- reads `/v1/mirror/stats` afterward

### Installed trigger — verified

Apps Script UI evidence shows exactly one visible installed trigger:
- function: `d1OrdersLiveSyncTick`
- deployment: `Head`
- event source: `Time-driven`
- time trigger type: `Minutes timer`
- minute interval: **Every minute**
- displayed error rate in trigger list: `0%` at evidence time
- no duplicate D1 live-sync trigger visible
- no other trigger row visible in the supplied trigger list

Tests:
- `INV-02A = PASS — UI EVIDENCE`
- `INV-02B = PASS — UI EVIDENCE`
- overall `INV-02 = PASS`

### Worker side — verified atomic promote

Worker `/v1/import/sheet` routes:
- `stage` -> `importSheetStage(body, env)`
- `promote` -> `promoteStagedSheets(body, env)`

`promoteStagedSheets()`:
- requires runId + sheetNames
- validates every requested staging catalog exists
- requires `status='ready'`
- requires staged `rowCount === sourceLastRow`
- only after all validations creates live mutation statements
- accumulates statements for all requested sheets into one array
- executes exactly one `await env.DB.batch(statements)`

Cloudflare D1 `batch()` is transactional/rollback-on-failure, therefore Worker-side Orders + Lines promote atomicity is verified at source + platform-contract level.

Tests:
- `INV-09F = PASS — SOURCE + PLATFORM CONTRACT`
- `D1-07 = PASS`

## Remaining D1/Core risks

### Source snapshot consistency gap — still open

Worker atomicity does not fix source inconsistency if Google Sheets changes between staging Orders and staging Lines.

Known current gaps:
- `updateLine_()` does not honor the sync ScriptLock.
- `submitCustomerDraft_()` lacks one outer lock around full draft conversion.

Therefore `REG-31` remains PENDING. Shared lock contract in `trendos-integrity-v1.gs` must close this later.

### Promote outcome observability gap — still open

Apps Script does:
1. promote
2. mirror stats
3. record success

If promote succeeds but stats read fails, Apps Script reports failure although D1 may already be committed. Successful promote also deletes staging rows/catalog, so same-run replay does not simply return prior success.

`D1-08` remains PENDING.

### Authentication performance/invalidation — still open

Current baseline confirms:
- no cache inside `authorize_()`.
- `findUser_()` is on the critical path before D1 stable cache.
- invalid/expired auth may clear the stored token.

Still need:
- `findUser_()` implementation and actual sheet read cost.
- `sessionExpiredV1922_()` policy.
- login/logout/token update entry points.
- V2.4 invalidation behavior for token changes, deactivation, logout and session expiry.

## Phase 0 status

PASS:
- `INV-01` Orders/Lines inventory
- `INV-02` installed Apps Script trigger + every-minute cadence
- `INV-09A` Primary V1 D1 helper
- `INV-09B` Orders Fast V2/V2.3
- `INV-09C` Fast Auth V2.4 absent from Version 143 Orders path
- `INV-09D` Dashboard D1 path
- `INV-09E` Apps Script atomic/live sync path
- `INV-09F` Worker-side atomic promote transaction
- `INV-09G` current `authorize_()` baseline
- `INV-10A` active Version 143
- `INV-10B` deployment/config match
- `INV-10C` live runtime identity
- `INV-10D` Version 143 top-level routes

Still pending/partial:
- `INV-09H` current `findUser_()` lookup path/cost
- `INV-09I` session expiry policy
- full auth invalidation/runtime parity inventory
- full Version 143 project composition (`INV-10`)
- Invoice / Attendance / Cleaning / Press / WhatsApp / Handover-OPS inventories
- baseline duplicate IDs and actual ID number formats

## Exact current stopping point

**Next single action: inspect the complete current `findUser_()` function, read-only.**

Need the function from declaration through final closing brace.

Goal:
1. identify the Users sheet read method,
2. determine whether it performs a full sheet/DataRange scan,
3. identify any existing cache/index,
4. identify username normalization/matching,
5. identify returned token/active/lastLogin fields,
6. confirm the actual cause of the legacy auth latency before evaluating V2.4.

Do not save, edit or deploy Apps Script during this inspection.

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
