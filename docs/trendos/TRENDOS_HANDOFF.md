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
4. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
5. `docs/trendos/TRENDOS_ARCHITECTURE.md`
6. `docs/trendos/TRENDOS_DECISIONS.md`
7. `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`
8. `docs/trendos/TRENDOS_BACKLOG.md`
9. `docs/trendos/TRENDOS_TEST_MATRIX.md`
10. `docs/trendos/TRENDOS_WORKLOG.md`
11. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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
- V2.3 stable page cache is verified.
- latest verified read source lineage: `D1_FAST_STABLE_CACHE_V23`.
- historical performance showed page-cache lookup around 20ms while Apps Script auth dominated total latency.

### Fast Auth V2.4
- file: `D1_Orders_Fast_V2_4.gs`.
- state: PREPARED.
- do **not** call installed/deployed/verified without evidence.
- do not jump to V2.4 before Core correctness inventory/foundation is complete.

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
**Status: PARTIAL — deployment + base runtime identity verified; exact Version 143 source snapshot still pending.**

Verified:
- active Apps Script Web App version: **143**.
- Apps Script deployment timestamp: **Aug 29, 2026 11:37 PM**.
- visible deployment ID prefix matches the ID configured in TrendOS `config.js`.
- live `action=health` returns:
  - `success:true`
  - `version: V1932_FULL_GO_LIVE_20260824`
  - `spreadsheet: TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
  - `hasUsers:true`
  - `hasOrders:true`
  - `hasLines:true`
  - `ordersRows:152`
  - `linesRows:180`
  - 87 sheet names.

Tests:
- `INV-10A = PASS` — active version identified.
- `INV-10B = PASS — PREFIX` — deployment consistent with frontend config.
- `INV-10C = PASS` — live runtime identity verified.

Historical Version 138 is superseded as the active deployment reference.

### Critical source divergence

Current Apps Script editor source routes:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

Current GitHub `Code.gs` still routes those actions to older direct functions.

Therefore:
- do **not** overwrite Apps Script from GitHub `Code.gs`.
- current editor source is ahead of GitHub in at least D1 route wiring.
- live `health` proves backend identity but does not prove the exact Version 143 implementation of those D1 routes.

Detailed document:
`docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md`

## Exact current stopping point

**Next single action: inspect Apps Script Project history for Version 143, read-only.**

Open:
**Apps Script -> Project history -> Version 143**

Inspect `Code.gs` around `doGet` and determine the two exact route targets:

1. `action === "getDashboard"`
2. `action === "getRowsPageV1931"`

Need to establish whether Version 143 contains:

- D1 routes: `getDashboardD1PrimaryV1_()` and `getRowsPageD1FastV2_()`

or

- older direct routes: `getDashboard_()` and `getRowsPageV1931_()`.

No save and no deploy are required.

After this evidence, continue Phase 0 source/file inventory; do not jump to Fast Auth V2.4.

## Remaining Phase 0 inventory

Still required:
- exact Apps Script Version 143 file/source composition.
- active Apps Script triggers + cadence.
- invoice prepare/sweep/finalize paths.
- Attendance/Clock-in paths.
- Cleaning paths.
- Press queue/session paths.
- WhatsApp webhook/send paths.
- Handover/OPS paths.
- D1 sync/read/auth paths.
- integrity baseline counts.
- Order ID / Line ID actual Sheet number formats.

For every event build:

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

> Continue TrendOS from canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Active lane is PHASE 1 — CORE + CLOUD. INV-01 is complete. Active Apps Script Web App is Version 143, timestamp Aug 29 2026 11:37 PM. Live `health` returns `V1932_FULL_GO_LIVE_20260824`, the correct main spreadsheet, Users/Orders/Lines present, Orders rows 152, Lines rows 180, and 87 sheets; therefore INV-10C is PASS. Current Apps Script editor source is ahead of GitHub `Code.gs` in D1 route wiring, so do not overwrite Apps Script from GitHub. Exact Version 143 route snapshot is still unproven. Next action: read-only Project history inspection of Version 143 for the `getDashboard` and `getRowsPageV1931` route targets. Google Sheets remains authoritative for writes; D1 remains fast read/mirror; V2.4 Fast Auth remains prepared and is not the next step. Work one step at a time.
