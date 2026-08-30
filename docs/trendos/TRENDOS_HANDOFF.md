# TrendOS Handoff

> Read this file first in a new execution chat.
> Last consolidated: 2026-08-30.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Do not start Smart Designer, Matbagy AI, Lead Hunter, Marketplace or Logistics implementation in this phase unless a Core dependency explicitly requires it. Record unrelated ideas in `TRENDOS_BACKLOG.md`.

## Final product target

**TrendOS V1 launch: 01/03/2027**.

September 2026 is a Core stabilization milestone, not the final all-module launch.

## Repository / branches

- Repo: `fawakhry/TrendOs`
- Default/production branch: `main`
- Working branch: `agent/go-live-2026-09-01-integrity`
- Safety branch: `backup/go-live-2026-08-30-pre-p0`

Canonical Core master plan:
`TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Canonical memory files

Read in this order:

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_HANDOFF.md`
3. `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md`
4. `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`
5. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
6. `docs/trendos/TRENDOS_ARCHITECTURE.md`
7. `docs/trendos/TRENDOS_DECISIONS.md`
8. `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`
9. `docs/trendos/TRENDOS_BACKLOG.md`
10. `docs/trendos/TRENDOS_TEST_MATRIX.md`
11. `docs/trendos/TRENDOS_WORKLOG.md`
12. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Evidence rule

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

Do not guess. Preserve conflicts as `Needs reconciliation`.

## Current verified technical direction

### Writes
- Google Apps Script + Google Sheets remain authoritative for operational/financial writes.

### D1 reads
- D1 is the fast read/mirror layer.
- Atomic Orders + Order Lines sync is the approved/current working direction.
- Newer project snapshot: 87 sheets / 31,176 rows / 87 ready / 0 pending.
- Version 143 Orders read source includes the V2.3 stable-page cache path.
- historical runtime verified `D1_FAST_STABLE_CACHE_V23` and showed stable-cache lookup around 20ms while Apps Script auth dominated total latency.

### Fast Auth V2.4
- file/checkpoint: `D1_Orders_Fast_V2_4.gs`.
- state: **PREPARED / NOT INSTALLED / NOT DEPLOYED / NOT VERIFIED**.
- stronger source evidence now exists: Version 143 `getRowsPageD1FastV2_()` explicitly calls legacy `authorize_()` before the V2.3 stable-page cache lookup.
- therefore V2.4 is not active in the inspected production Orders read path.

## Current spreadsheet / safety state

Main spreadsheet:
`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Pre-Go-Live backup exists:
`BACKUP_TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY_2026-08-30_PRE_GO_LIVE_P0`

Important risk:
- spreadsheet metadata was observed using `America/Los_Angeles`.
- operational code/rules use `Africa/Cairo`.
- do not change timezone blindly; first inventory formulas/code/time dependencies and centralize Business Calendar.

## Phase 0 progress

### INV-01 — Orders / Order Lines source inventory
**Status: PASS — working-branch source mapped.**

Verified protections in both inspected GitHub source and current Apps Script editor source:
- `createManualOrder_()` uses ScriptLock + V1908 request replay when a stable request ID is present.
- `appendLine_()` blocks a second row with the same Line ID sequentially.
- `syncOrderFromLines_()` collapses duplicate Line IDs and excludes `مكرر` from active totals.

Remaining Core gaps in current editor source:
- `submitCustomerDraft_()` has no outer lock around full draft conversion.
- `updateLine_()` has no unified idempotent mutation/side-effect contract.

### INV-10 — Production source/deployment reconciliation
**Status: PARTIAL — deployment, runtime identity and top-level D1 routes verified; full Version 143 project composition still pending.**

Verified:
- active Apps Script Web App version: **143**.
- deployment timestamp: **Aug 29, 2026 11:37 PM**.
- deployment ID prefix matches TrendOS `config.js`.
- live `action=health` returns `V1932_FULL_GO_LIVE_20260824` against the correct main workbook, with Users/Orders/Lines present, Orders rows 152, Lines rows 180, and 87 sheets.
- Project history Version 143 routes:
  - `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
  - `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

Tests:
- `INV-10A = PASS`
- `INV-10B = PASS — PREFIX`
- `INV-10C = PASS`
- `INV-10D = PASS — SOURCE SNAPSHOT`

Historical Version 138 is superseded as the active deployment reference.

Critical source divergence remains:
- GitHub `Code.gs` still has older top-level read routes.
- do not overwrite Apps Script from GitHub `Code.gs` until the D1 editor/deployed delta is captured intentionally.

### INV-09 — D1 sync/read/auth inventory
**Status: PARTIAL — production Orders page read path mapped.**

Detailed document:
`docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`

#### Primary V1 helper
`getRowsPageD1PrimaryV1_(e)` is a hybrid safe-read helper:
- feature flag off -> legacy Sheets read.
- uses `authorize_()`.
- validates D1 snapshot safety/freshness/parity.
- success uses D1.
- any safety/network/runtime exception -> `GOOGLE_SHEETS_FALLBACK`.

#### Actual Version 143 Orders path
Production router calls:

`getRowsPageD1FastV2_(e)`

This function has now been inspected completely.

Verified exact sequence:

```text
request
  -> D1 feature flag
  -> authorize_()
  -> allowed-screen check
  -> TrendOS dataVersion
  -> V2.3 stable-page cache
       -> HIT: D1_FAST_STABLE_CACHE_V23
  -> D1 probe
       -> syncing + unchanged dataVersion + stable page: D1_FAST_STALE_SAFE_V22
       -> unsafe probe: throw -> Sheets fallback
  -> V2.2 current-snapshot page cache
       -> HIT: D1_FAST_PAGE_CACHE_V22
  -> D1 snapshot fetch
  -> lightweight D1 build/filter
  -> page response
  -> current-page customer/debt enrichment
  -> cache current + stable keys
  -> D1_FAST_V22

Any D1/runtime/safety failure
  -> getRowsPageV1931_()
  -> GOOGLE_SHEETS_FALLBACK
```

Important conclusions:
- Fast V2 is a separate implementation; it does **not** call `getRowsPageD1PrimaryV1_()` directly.
- it reuses `d1OrdersPrimaryPageResponseV1_()` as a shared response builder.
- authorization occurs before stable-cache lookup.
- Version 143 therefore still has the legacy auth bottleneck.
- V2.3 stable cache is present in Version 143 source.
- Google Sheets remains automatic fallback.

Mapped `readSource` values:
- `D1_FAST_STABLE_CACHE_V23`
- `D1_FAST_STALE_SAFE_V22`
- `D1_FAST_PAGE_CACHE_V22`
- `D1_FAST_V22`
- `GOOGLE_SHEETS_FALLBACK`

Existing timing instrumentation includes:
- authMs
- readyStableCacheMs
- probeMs
- pageCacheMs
- fetchMs
- buildMs
- pageBuildMs
- supportMs
- cacheWriteMs
- fallbackMs
- total/runtime

Tests:
- `INV-09A = PASS — SOURCE` Primary V1 behavior mapped.
- `INV-09B = PASS — VERSION 143 SOURCE` Fast V2/V2.3 Orders path mapped.
- `INV-09C = PASS — NOT DEPLOYED IN THIS PATH` Fast Auth V2.4 absent from inspected Version 143 Orders function.

## Exact current stopping point

**Next single action: read-only inspection of the complete `getDashboardD1PrimaryV1_(e)` function from Apps Script Version 143/current project.**

Need to determine:
1. dashboard authentication path.
2. D1 safety/health checks.
3. dashboard cache behavior.
4. D1 helper/API used.
5. Google Sheets fallback behavior.
6. returned source/timing metadata.

Do not save, deploy, or edit Apps Script during this inspection.

After Dashboard read is mapped, continue `INV-09` with D1 atomic/live sync entry points and auth inventory, then continue remaining Phase 0 lanes.

## Remaining Phase 0 inventory

Still required:
- exact complete Apps Script Version 143 file/source composition.
- active Apps Script triggers + cadence.
- invoice prepare/sweep/finalize paths.
- Attendance/Clock-in paths.
- Cleaning paths.
- Press queue/session paths.
- WhatsApp webhook/send paths.
- Handover/OPS paths.
- remaining D1 dashboard/sync/auth helpers.
- integrity baseline counts.
- Order ID / Line ID actual Sheet number formats.

For every write event build:

`Event -> Entry Point -> Lock -> Idempotency Key -> Sheet(s) Written -> Retry Behavior`

## First code after Phase 0

Do not create separate random patches first.

Create shared foundation:
`trendos-integrity-v1.gs`

Target helpers:
- `trendosNormalizeOrderId_`
- `trendosNormalizeLineId_`
- `trendosBusinessDate_`
- `trendosBusinessSchedule_`
- `trendosIsBusinessDay_`
- `trendosEventKey_`
- `trendosIdempotencyClaim_`
- `trendosIdempotencyComplete_`
- `trendosIdempotencyLookup_`
- `trendosWithLock_`
- `trendosAutomationRunStart_`
- `trendosAutomationRunFinish_`
- centralized open/closed-state helpers.

The foundation must preserve existing working protections rather than replacing them blindly.

## Core sequence after foundation

1. Order/Line integrity.
2. Attendance/Cleaning.
3. Press.
4. Invoice/Pricing.
5. WhatsApp.
6. Handover/OPS.
7. Integrity Dashboard/Observability.
8. D1 performance/Fast Auth.
9. Regression/E2E.
10. Core GO/NO-GO.

## Non-negotiable safeguards

- Never delete valid historical data.
- Never invent prices/states/payments/stock/customer approval/press energy.
- `Line ID` is logical unique key for active lines.
- `Order ID` is order key.
- all repeated write events must become idempotent.
- check-then-create/update requires locking.
- duplicate rows marked `مكرر` stay historical but do not count as active work.
- Google Sheets write authority/fallback remains until an approved migration changes it.
- before major mutation, verify the existing snapshot is sufficient or create another checkpoint.
- tests must record Expected / Actual / PASS|FAIL.

## Phase 1 completion rule

Do not move to the Customer/Communication chat until:

`IMPLEMENTED + TESTED + VERIFIED + CHECKPOINT + ROLLBACK + GITHUB MEMORY UPDATED + EXACT NEXT STEP`

and zero open `CORE-P0` blockers remain.

## Prompt for a fresh execution chat

> Continue TrendOS from canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Active lane is PHASE 1 — CORE + CLOUD. Active Apps Script Web App is Version 143. Runtime health and Version 143 top-level D1 routes are verified. Production Orders read uses `getRowsPageD1FastV2_()`: legacy `authorize_()` runs before V2.3 stable cache; stable-cache source is `D1_FAST_STABLE_CACHE_V23`; then D1 probe/current cache/D1 snapshot build; any unsafe/error path falls back to `getRowsPageV1931_()` with `GOOGLE_SHEETS_FALLBACK`. Fast Auth V2.4 is therefore not deployed in this inspected path. Do not overwrite Apps Script from GitHub because Apps Script D1 routing is ahead of GitHub `Code.gs`. Next single action: read-only inspect the complete `getDashboardD1PrimaryV1_(e)` function. Work one step at a time.
