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
3. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
4. `docs/trendos/TRENDOS_ARCHITECTURE.md`
5. `docs/trendos/TRENDOS_DECISIONS.md`
6. `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`
7. `docs/trendos/TRENDOS_BACKLOG.md`
8. `docs/trendos/TRENDOS_TEST_MATRIX.md`
9. `docs/trendos/TRENDOS_WORKLOG.md`
10. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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
**Status: PASS — current working-branch repo source only.**

Detailed document:
`docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`

Important discoveries in current GitHub source:
- `createManualOrder_()` already uses ScriptLock + V1908 request replay when a stable request ID is present.
- `app.js` currently generates `clientRequestId` for manual Add Order.
- `appendLine_()` already checks existing Line ID and blocks a second row sequentially.
- `syncOrderFromLines_()` already excludes `مكرر` rows from active/current totals.
- `upsertOrderSummary_()` already performs sequential Order-ID upsert.
- Customer Portal's current UI uses draft submission; the old direct portal-create backend remains reachable source but is not the primary UI path.
- `submitCustomerDraft_()` has a sequential replay guard after draft completion but no outer lock around the full conversion transaction; concurrent submits remain a CORE-P0 candidate.
- `updateLine_()` lacks a shared lock/event-idempotency contract around state write + summary + activity + notification side effects.
- existing idempotency mechanisms are inconsistent across paths: Script Properties, ScriptCache, draft state, Line-ID scans, or none.

Critical interpretation:
- older planning must **not** cause a blind duplicate-guard patch. The repo already contains some protections.
- repository source does **not** prove what is deployed behind Apps Script Version 138.

## Exact current stopping point

**Next single action: production-source reconciliation for Orders/Lines.**

Before creating `trendos-integrity-v1.gs` or changing any Core write path, determine the exact live Apps Script source/deployment composition relevant to:
- `doGet` / `doPost`,
- `createManualOrder_`,
- `appendLine_`,
- `upsertOrderSummary_`,
- `submitCustomerDraft_`,
- `updateLine_`,
- `syncOrderFromLines_`,
- `bulkUpdateDepartmentStatusV1926_`,
- archive/restore order-line paths.

Need to establish whether live production contains the protections observed in the GitHub working-branch `Code.gs`.

Do not mutate production during this verification.

## Remaining Phase 0 inventory

Still required:
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

> Continue TrendOS from the canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Read `TRENDOS_PROJECT_MEMORY.md`, `TRENDOS_HANDOFF.md`, and `inventory/ORDERS_LINES_INVENTORY.md` first. Active lane is PHASE 1 — CORE + CLOUD. INV-01 repository inventory is complete and discovered that current GitHub source already contains a V1932 Line-ID duplicate guard, duplicate-aware order summary, and V1908 idempotent manual create path. Do not blindly reimplement those. The exact Apps Script production source behind Version 138 is still unknown, so the next action is read-only production-source reconciliation for Orders/Lines. Google Sheets remains authoritative for writes; D1 remains fast read/mirror; V2.4 Fast Auth is prepared but not the next step. Work one step at a time and report inspected evidence, changes, test result, and one next action only.
