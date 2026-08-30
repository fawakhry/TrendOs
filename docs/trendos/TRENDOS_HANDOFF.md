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

Canonical plan: `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Canonical read order

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
11. `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`
12. `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`
13. `docs/trendos/inventory/CLEANING_INVENTORY.md`
14. `docs/trendos/inventory/PRESS_INVENTORY.md`
15. `docs/trendos/TRENDOS_TEST_MATRIX.md`
16. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

Evidence precedence:
`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`.

## Production identity

Active Apps Script Web App:
- Version **143**
- timestamp: **Aug 29 2026 11:37 PM**
- deployment ID prefix matches production `config.js`

Live health previously verified:
- backend `V1932_FULL_GO_LIVE_20260824`
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- 87 sheets

Version 143 routes:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

**Do not overwrite Apps Script from GitHub `Code.gs`; GitHub is behind deployed/editor D1 wiring.**

## Architecture checkpoint

Writes remain Google Apps Script + Google Sheets authoritative. Orders/Dashboard reads use D1 fast/primary paths with Sheets fallback. Fast Auth V2.4 remains prepared only.

D1 sync verified:
- one installed every-minute `d1OrdersLiveSyncTick`.
- Apps Script stages Orders + Lines and requests one combined promote.
- Worker executes one transactional D1 `batch()`.

Still open:
- source snapshot consistency because all operational writers do not share the sync lock.
- promote-success/stats-failure observability ambiguity.

## Authentication baseline — inventory complete

Current legacy auth is uncached and reads the Users sheet authoritatively on each request.

Verified:
- full Users used-range read + sequential username scan.
- hot-path Token/Last Login schema check.
- session default 12h, configurable 1–72h.
- login rotates token; logout/password change clear token.
- failed/bad/expired auth can clear stored token.

`INV-09G/H/I/J = PASS`. `D1-05` remains PENDING because V2.4 invalidation is not deployed/verified.

## Live Line-ID baseline

Current `بنود الأوردرات` baseline:
- 194 rows including header at original audit snapshot.
- 35 `مكرر` rows.
- no Line ID has more than one non-`مكرر` live row.

Current zero-active-duplicate baseline = PASS; concurrency regression remains pending.

Data-quality-only cases: `3216-02`, `3536-01` appear only as duplicate/history in inspected live state; do not repair blindly.

## Invoice / Ready Sweep — inventory complete, NOT green

Report: `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`

Live current draft baseline:
- 50 Ready Sweep rows.
- 47 unique Order IDs.
- duplicates: `3577`, `3572`, `3569` each have two Draft IDs.

`glaPrepare_()` has no lock around find -> append/update.

`REG-20 = FAIL — LIVE + SOURCE`.

Ready Sweep does not check final-invoice state, so a finalized order can be swept again while operationally ready and its draft can regress from `تم التقفيل` to `يحتاج تسعير/اعتماد`.

`REG-22 = FAIL — SOURCE`.

Unpriced safety is positive: all inspected unpriced Ready Sweep drafts remain total 0 with explicit blocker.

`REG-24 = PASS — LIVE + SOURCE`.

Final writer has lock + request-key replay protection but lacks repairable multi-sheet completion after partial failure. Notification send remains separately non-idempotent.

## Attendance / Clock-in — inventory complete, NOT green

Report: `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`

Live duplicate session groups:
- Revan 2026-08-27 x3.
- Wael 2026-08-29 x2.
- Revan 2026-08-29 x2.
- Revan 2026-08-30 x2.

`REG-07 = FAIL — LIVE + SOURCE RACE`.

Pulse log has no event key/debounce. One Wael session contains four Resume events within ~20 seconds.

`REG-09 = FAIL — LIVE + SOURCE`.

Clock-in is configured required but broader activity events do not enforce prior clock-in.

`REG-10 = FAIL — SOURCE`.

Day rollover uses Cairo business date and does not inherit prior-day sessions.

`REG-11 = PASS`.

Friday/business calendar remains not centralized.

## Cleaning — inventory complete, NOT green

Report: `docs/trendos/inventory/CLEANING_INVENTORY.md`

Live cleaning baseline:
- 31 data rows.
- 17 unique employee/date pairs.
- 14 excess duplicate rows across 10 duplicate groups.

`cleaningV1_()` has no lock/event key around check -> append.

`REG-14 = FAIL — LIVE + SOURCE RACE`.

Cleaning schema contains legacy/new semantic duplicate headers. Backend hardcodes all checklist answers to yes/problem no rather than persisting actual payload. Live config keys `CLEANING_PREP_MINUTES`, `CLEANING_REQUIRED`, `CLEANING_ESCALATE_IF_NOT_DONE` are not referenced by the supplied monolith path; expected start uses workday start directly.

## Press — inventory complete, NOT green

Report: `docs/trendos/inventory/PRESS_INVENTORY.md`

### Current source queue
Using the exact `pressQueue_()` criteria against live `بنود الأوردرات` gives:
- **8 unique press orders**.
- **0 urgent**.

Current IDs:
`TM2606150097`, `TM2606150098`, `TM2606150105`, `TM2606160146`, `3758`, `3764`, `3770`, `3774`.

### View mismatch
Legacy `واجهة المكبس` contains header only and 0 data rows. Current V1932 backend does not use that sheet; it computes queue directly from Lines.

Therefore legacy sheet parity is 0 vs source 8. Actual API-driven frontend view still needs runtime verification before `REG-16` can be green.

### Start/Stop integrity
`pressControlV1 start` does open-check -> append with no ScriptLock/request key.

`REG-17 = FAIL — SOURCE CONCURRENCY CONTRACT`.

Stop has no lock/idempotent close replay; concurrent stops can overwrite metrics and sequential second close returns no-open-session.

`REG-18 = FAIL — SOURCE CONTRACT`.

### Missing line-level traceability
Sessions store queue counts and number pressed but **no specific Order IDs or Line IDs**.

The backend cannot prove which line was pressed in which session or emit a reliable completed-press-line-without-session alert.

`REG-19 = FAIL — SOURCE CONTRACT`.

### Live session baseline
One historical V1932-compatible session exists for 2026-08-24:
- `PRESS-20260824-800c0607`
- queue at start 9
- urgent 1
- close time present
- duration about 0.5 minute
- queue at close 9
- orders pressed 0

No currently open historical session was observed.

Press settings/session sheets contain legacy + V1932 exact-name schema/key drift; power/rate remain disabled/blank so source resolves zero rather than inventing electricity cost.

## Current GO/NO-GO

**NO-GO**.

Confirmed blockers:
1. Ready Sweep duplicate invoice drafts — live.
2. finalized invoice -> pricing queue regression — source.
3. Attendance duplicate sessions/clock-ins — live.
4. Attendance pulse idempotency — live.
5. required Clock-in not enforced before activity — source.
6. Cleaning duplicate daily records — live.
7. Cleaning checklist/config integrity gaps — source.
8. Press Start/Stop idempotency/concurrency — source.
9. Press lacks Order/Line session linkage — source.
10. Press legacy view/source mismatch pending frontend verification.
11. D1 Orders/Lines source snapshot consistency gap.
12. WhatsApp/Handover inventories still pending.

Positive evidence:
- zero active duplicate Line IDs current baseline.
- D1 Worker atomic promote verified.
- one-minute D1 sync trigger verified.
- unpriced invoice orders do not invent totals.
- attendance day rollover uses Cairo business date isolation.
- press electricity cost is not invented when configuration is blank.

## Phase 0 inventory status

PASS inventories:
- INV-01 Orders/Lines
- INV-02 triggers/cadence
- INV-03 Invoice / Ready Sweep
- INV-04 Attendance / Clock-in
- INV-05 Cleaning
- INV-06 Press
- INV-09A through INV-09J except V2.4 invalidation runtime
- INV-10A/B/C/D deployment identity/routes

Still pending/partial:
- INV-07 WhatsApp
- INV-08 Handover/OPS
- INV-09 overall because V2.4 invalidation/runtime parity pending
- INV-10 full Version 143 project composition

## Exact current stopping point

**Next single action: `INV-07` — inventory WhatsApp webhook/send source and live logs.**

Inspect read-only:
- inbound webhook route and Meta message-ID handling.
- duplicate inbound retry behavior.
- outbound send helpers and request/event idempotency.
- current `سجل واتس AI`, Customer Manager messages/conversations and relevant WhatsApp state columns.
- whether logical sends can be duplicated across retry/finalize flows.

No production edit/save/deploy until inventory is complete and a checkpoint exists.

## First implementation after Phase 0

Create shared `trendos-integrity-v1.gs` for:
- ID normalization
- shared locks
- durable idempotency
- Business Calendar
- automation run logging
- open/closed-state helpers

## Non-negotiable safeguards

- Never delete valid historical data.
- Never invent prices/states/payments/stock/approval facts.
- Order ID is the order key.
- Line ID is the logical active-line key.
- repeated writes must become idempotent.
- check-then-write requires locking.
- `مكرر` rows remain history but do not count as active work.
- Google Sheets remains write authority/fallback until approved migration.
- tests record Expected / Actual / PASS|FAIL.
