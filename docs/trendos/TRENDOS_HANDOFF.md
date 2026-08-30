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
- V2.3 stable page cache is historically verified.
- latest historical verified source lineage: `D1_FAST_STABLE_CACHE_V23`.
- historical performance showed page-cache lookup around 20ms while Apps Script auth dominated total latency.

### Fast Auth V2.4
- file/checkpoint: `D1_Orders_Fast_V2_4.gs`.
- canonical state remains PREPARED / NOT VERIFIED.
- do not call installed/deployed/verified until the actual Version 143 Fast V2/auth source proves it.

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
**Status: PARTIAL.**

New document:
`docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`

Source supplied for:
`getRowsPageD1PrimaryV1_(e)`

Verified behavior of this helper:
- feature flag off -> immediate legacy `getRowsPageV1931_(e)`.
- authenticates through existing `authorize_()`.
- obtains D1 safety snapshot through `d1OrdersPrimarySnapshotV1_()`.
- source comments require live sync, ready, not syncing, freshness, row parity, column parity and data-version freshness before D1 use.
- cache key includes user/filter/page/data-version/sync timestamps.
- success reads from D1 snapshot and records `source:'D1'`.
- any D1/network/runtime/safety exception falls back automatically to `getRowsPageV1931_(e)` and marks `readSource:'GOOGLE_SHEETS_FALLBACK'` plus failure reason.

Architectural conclusion:
`getRowsPageD1PrimaryV1_()` is **D1-primary + Google Sheets fallback**, not D1-only.

Critical unresolved relationship:
- Version 143 router calls `getRowsPageD1FastV2_(e)`, not `getRowsPageD1PrimaryV1_(e)`.
- therefore the exact live page-read wrapper/cache/auth path is still unknown.
- do not infer that Fast Auth V2.4 is live from the Primary V1 helper; that helper uses `authorize_()` directly.

## Exact current stopping point

**Next single action: read-only inspection of the complete `getRowsPageD1FastV2_(e)` function from Apps Script Version 143/current project.**

Need to determine:
1. which auth function it uses.
2. whether it delegates to `getRowsPageD1PrimaryV1_()`.
3. stable-cache behavior/version lineage.
4. D1 fetch/read helper.
5. fallback behavior.
6. returned `source` and timing metadata.

Do not save, deploy, or edit Apps Script during this inspection.

After `getRowsPageD1FastV2_()` is mapped, continue `INV-09` with its called helper(s), then dashboard D1 path, sync, and auth.

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
- remaining D1 sync/read/auth helpers.
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

> Continue TrendOS from canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Active lane is PHASE 1 — CORE + CLOUD. Active Apps Script Web App is Version 143. Runtime health is verified and Project history Version 143 routes `getDashboard` to `getDashboardD1PrimaryV1_()` and `getRowsPageV1931` to `getRowsPageD1FastV2_()`. `getRowsPageD1PrimaryV1_()` has now been inspected: it is D1-primary with strict safety snapshot/cache and automatic Google Sheets fallback, and it uses the existing `authorize_()` path. However, the production router calls `getRowsPageD1FastV2_()`, whose body is not yet mapped. Do not infer Fast Auth V2.4 is deployed. Do not overwrite Apps Script from GitHub because Apps Script D1 routing is ahead of GitHub `Code.gs`. Next single action: read-only inspect the complete `getRowsPageD1FastV2_(e)` function. Work one step at a time.
