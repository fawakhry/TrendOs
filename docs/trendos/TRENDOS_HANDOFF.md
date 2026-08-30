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

Current branch head before canonical memory work was:
`9258119d10e03368eea767cb3d90a49f54b0e3e7`

Canonical Core master plan:
`TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Canonical memory files

Read in this order:

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_HANDOFF.md`
3. `docs/trendos/TRENDOS_ARCHITECTURE.md`
4. `docs/trendos/TRENDOS_DECISIONS.md`
5. `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`
6. `docs/trendos/TRENDOS_BACKLOG.md`
7. `docs/trendos/TRENDOS_TEST_MATRIX.md`
8. `docs/trendos/TRENDOS_WORKLOG.md`
9. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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

## Exact current stopping point

Canonical memory and 01/03/2027 roadmap are being established in GitHub.

**Next execution action after canonical-memory creation:**

### Phase 0 — Inventory + Baseline + Trigger Map

Start read-only except for documentation/snapshots.

Inventory all current production entry points for:
- Order creation/update.
- Order Line creation/update.
- Invoice prepare/sweep/finalize.
- Attendance/Clock-in.
- Cleaning.
- Press queue/start/stop.
- WhatsApp webhook/send.
- Handover.
- OPS_REPLY / OPS_COACH.
- D1 sync/read/auth.

For every event build:

`Event -> Entry Point -> Lock -> Idempotency Key -> Sheet(s) Written -> Retry Behavior`

Also capture:
- active trigger list + cadence.
- current integrity baseline counts.
- exact Apps Script production-source/version relationship.

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

> Continue TrendOS from the canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Read `TRENDOS_PROJECT_MEMORY.md` and `TRENDOS_HANDOFF.md` first, then `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`. Do not restart project analysis from scratch. The active lane is PHASE 1 — CORE + CLOUD. Google Sheets remains authoritative for writes; D1 is the fast read/mirror layer with atomic Orders+Lines direction and V2.3 stable cache verified. Fast Auth V2.4 is prepared but not verified and is not the next step. Start with Phase 0 read-only Inventory + Baseline + Trigger Map, building Event -> Entry Point -> Lock -> Idempotency Key -> Sheets Written -> Retry Behavior. Then create the shared integrity foundation before module-specific P0 fixes. Work one step at a time and report what was inspected, what changed, the test, PASS/FAIL, and one next action only.
