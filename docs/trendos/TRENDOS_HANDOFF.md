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

## Authentication baseline — now mapped deeper

### `authorize_()`

Verified sequence:

```text
normalize username
 -> findUser_(...)
 -> reject missing user
 -> reject populated active state unless exactly نعم
 -> require token
 -> constant-time token compare
 -> require non-expired session
 -> failed token/session may clear stored token cell
 -> success {ok:true,user}
```

`authorize_()` itself contains no auth cache.

### `findUser_()`

Current function is now inspected and performs:

```text
ensureUsersSetup_()
 -> open Users sheet
 -> sheet.getDataRange().getValues()
 -> resolve columns from headers
 -> sequentially scan normalized usernames
 -> return matching row metadata/token/session fields
```

Critical performance fact:
- **every current auth attempt reads the full used range of the Users sheet** before matching one username.
- there is no cache/index/targeted lookup inside `findUser_()`.
- because Orders Fast V2 calls `authorize_()` before V2.3 stable-page cache, this Google Sheets I/O occurs before a cached D1 page can return.

This is strong source evidence for the legacy auth bottleneck and is consistent with historical runtime where auth dominated the request while stable-page cache lookup was ~20ms.

Do not claim the full historical ~7.45s is caused solely by `getDataRange().getValues()` yet. `ensureUsersSetup_()`, header reads, spreadsheet access/cold-start and session helpers have not been independently timed.

Additional auth observations:
- bad/missing/expired token may clear the stored token through `safeSet_()`.
- blank/falsy Active state is not rejected by current `authorize_()` condition.
- blank password cell can fall back to `employeeDefaultPassword_()` inside `findUser_()`.
- session TTL is still pending inside `sessionExpiredV1922_()`.

Tests:
- `INV-09G = PASS — SOURCE` (`authorize_()`)
- `INV-09H = PASS — SOURCE` (`findUser_()`)
- `INV-09I = PENDING` session-expiry policy
- `INV-09J = PENDING` `ensureUsersSetup_()` hot-path work/side effects
- `D1-05 = PENDING` Fast Auth invalidation

Detailed document:
`docs/trendos/inventory/AUTH_PATH_INVENTORY.md`

## D1 Atomic Orders + Lines sync

Apps Script side verified:
- `d1OrdersLiveSyncTick()`
- ScriptLock `tryLock(5000)`
- stage Orders + Lines in 80-row batches
- one runId
- one combined promote request
- mirror stats readback

Installed trigger verified:
- exactly one visible `d1OrdersLiveSyncTick`
- `Head`
- `Time-driven`
- `Minutes timer`
- **Every minute**
- displayed error rate 0% at evidence time

Worker promote verified:
- validates all staged sheets before mutation
- builds one statement list for all requested sheets
- executes one `env.DB.batch(statements)`
- Cloudflare D1 batch transaction semantics give rollback-on-failure

Tests:
- `INV-02 = PASS`
- `INV-09E = PASS`
- `INV-09F = PASS — SOURCE + PLATFORM CONTRACT`
- `D1-07 = PASS`

## Remaining D1/Core risks

### Source snapshot consistency gap

Worker atomicity does not fix source inconsistency if Google Sheets changes between staging Orders and Lines.

Known current gaps:
- `updateLine_()` does not honor the sync ScriptLock.
- `submitCustomerDraft_()` lacks one outer lock around full draft conversion.

`REG-31` remains PENDING. Shared lock contract in `trendos-integrity-v1.gs` must close this later.

### Promote outcome observability gap

Apps Script does promote -> mirror stats -> record success. If promote succeeds but stats read fails, Apps Script can report failure although D1 may already be committed. `D1-08` remains PENDING.

### Authentication performance/invalidation

Still need:
- `ensureUsersSetup_()` implementation/cost/possible writes.
- `sessionExpiredV1922_()` TTL/timezone policy.
- login/logout/token update/deactivation entry points.
- V2.4 invalidation rules.

## Phase 0 status

PASS:
- `INV-01` Orders/Lines inventory
- `INV-02` installed trigger + every-minute cadence
- `INV-09A` Primary V1 D1 helper
- `INV-09B` Orders Fast V2/V2.3
- `INV-09C` Fast Auth V2.4 absent from Version 143 Orders path
- `INV-09D` Dashboard D1 path
- `INV-09E` Apps Script atomic sync
- `INV-09F` Worker atomic promote
- `INV-09G` `authorize_()` baseline
- `INV-09H` `findUser_()` authoritative lookup
- `INV-10A` active Version 143
- `INV-10B` deployment/config match
- `INV-10C` live runtime identity
- `INV-10D` Version 143 top-level routes

Still pending/partial:
- `INV-09I` session expiry policy
- `INV-09J` ensure-users hot-path work
- full auth invalidation/runtime parity inventory
- full Version 143 project composition (`INV-10`)
- Invoice / Attendance / Cleaning / Press / WhatsApp / Handover-OPS inventories
- baseline duplicate IDs and actual ID number formats

## Exact current stopping point

**Next single action: inspect the complete current `ensureUsersSetup_()` function, read-only.**

Goal:
1. determine whether it only validates schema or performs writes/migrations,
2. count additional Spreadsheet service calls before every `findUser_()` lookup,
3. determine whether it is a meaningful auth-latency contributor,
4. identify setup work that should not stay in the hot auth path.

Do not save, edit or deploy Apps Script.

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
