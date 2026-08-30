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
14. `docs/trendos/TRENDOS_TEST_MATRIX.md`
15. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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

### Writes
Google Apps Script + Google Sheets remain authoritative for operational/financial writes.

### Reads
- Orders: D1 Fast V2/V2.3 + Sheets fallback.
- Dashboard: D1 Primary + Sheets fallback.
- Fast Auth V2.4: prepared only, not deployed.

### D1 sync
Verified:
- one installed `d1OrdersLiveSyncTick` trigger.
- Time-driven / Minutes timer / Every minute.
- Apps Script stages Orders + Lines then sends one promote.
- Worker validates all staging and executes one D1 `batch()` transaction.

Still open:
- source snapshot consistency because not every operational writer uses the same ScriptLock.
- promote-success/stats-failure observability ambiguity.

## Authentication baseline — inventory complete

Current legacy auth is uncached and reads the Users sheet authoritatively on each request.

Verified:
- `authorize_()` -> `findUser_()` -> Users full used-range read + sequential username scan.
- `ensureUsersSetup_()` checks Token/Last Login headers on the hot path and can append them if missing.
- session default 12h, configurable and clamped 1–72h.
- login rotates token + Last Login.
- logout/password change clear token.
- failed/bad/expired auth can clear stored token.
- current monolith has no dedicated employee `createUser/saveUser/updateUser` backend path found; Users-sheet Active is authoritative on each legacy lookup.

`INV-09G/H/I/J = PASS`.

`D1-05` remains PENDING because V2.4 cache invalidation is not deployed/verified.

## Live Line-ID baseline

Current `بنود الأوردرات` inspected live range:
- 194 rows including header.
- 35 `مكرر` rows.
- no Line ID has more than one non-`مكرر` live row.

Zero-active-duplicate current baseline = PASS; concurrency regression still pending.

Data-quality notes only: `3216-02`, `3536-01` appear only as duplicate/history in the inspected live state; do not repair blindly.

`3637-02`, `3647-01`, `3651-02` render literally on live read; write/read format regression pending.

## Invoice / Ready Sweep — inventory complete, correctness NOT green

Detailed report: `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`

Current live `حسابات - مسودات الفواتير`:
- 50 Ready Sweep rows.
- 47 unique Order IDs.
- duplicates: `3577`, `3572`, `3569` each have two different Draft IDs.

`glaPrepare_()` find -> append/update has no ScriptLock.

`REG-20 = FAIL — LIVE + SOURCE`.

Ready Sweep does not check final-invoice state. A finalized order whose operational line remains ready can be swept again and its draft can regress from `تم التقفيل` to `يحتاج تسعير/اعتماد` with zero subtotal.

`REG-22 = FAIL — SOURCE CONTRACT`.

All 50 current Ready Sweep drafts remain safely blocked at zero when no approved price exists.

`REG-24 = PASS — LIVE + SOURCE`.

Final invoice writer has a lock + persisted request-key replay protection, but its multi-sheet sequence lacks a repairable completion state after partial failure.

`glaSendReady_()` has no durable logical notification key; invoice retry can still resend WhatsApp.

## Attendance / Clock-in — inventory complete, correctness NOT green

Detailed report: `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`

Business date uses `Africa/Cairo`.

Current live settings require Clock-in and one Clock-in/day, but broader attendance events do not enforce prior Clock-in.

`attStart_()` has no lock/idempotency around find -> append -> re-find -> start pulse.

Live duplicate employee/date session groups:
- Revan 2026-08-27 x3.
- Wael 2026-08-29 x2.
- Revan 2026-08-29 x2.
- Revan 2026-08-30 x2.

`REG-07 = FAIL — LIVE + SOURCE RACE`.

Pulse log has no event key/debounce. Wael session `AT-20260829-وائل-5167c552` contains four Resume pulses within ~20 seconds.

`REG-09 = FAIL — LIVE + SOURCE`.

Required Clock-in is not checked before activity events.

`REG-10 = FAIL — SOURCE CONTRACT`.

Day rollover is isolated by Cairo business date.

`REG-11 = PASS — SOURCE + LIVE BEHAVIOR`.

Friday/business calendar remains not centralized; absent exact special date, schedule defaults to normal 12:00.

Workbook display timezone remains America/Los_Angeles while operational date keys use Cairo; do not change blindly.

## Cleaning — inventory complete, correctness NOT green

Detailed report: `docs/trendos/inventory/CLEANING_INVENTORY.md`

`cleaningV1_()`:
- status/complete is keyed conceptually by employee + Cairo business date.
- sequential repeat finds existing row and returns `duplicatePrevented:true`.
- but check -> append has no ScriptLock and no durable event/request key.

### Live duplicate Cleaning state
Current `تشغيل - النظافة اليومية`:
- 31 data rows.
- 17 unique employee/date pairs.
- **14 excess duplicate rows**.
- 10 employee/date groups have duplicates.

Examples:
- Jaber 2026-08-24 x3.
- Revan 2026-08-26 x4.
- Revan 2026-08-30 x3.
- Wael 2026-08-30 x2.

`REG-14 = FAIL — LIVE + SOURCE RACE`.

### Cleaning schema drift
Live sheet contains legacy/new semantic duplicates, e.g.:
- `تنظيف سطح العمل` vs `سطح العمل`
- `إزالة مخلفات أمس` vs `مخلفات أمس`
- `فحص بصري سريع` vs `فحص بصري`
- `نظافة المكان العام` vs `نظافة المكان`
- `مشكلة مكتشفة` vs `مشكلة ظهرت؟`

V1932 appends exact missing headers rather than migrating synonyms, so old/new consumers can disagree.

### Checklist audit gap
Backend parses payload but successful completion hardcodes:
- all checklist values = `نعم`.
- status = `مكتمل`.
- problem = `لا`.
- problem details blank.

It does not persist actual checklist/problem payload. Stored data therefore cannot independently prove the submitted physical checklist state.

### Cleaning config gap
Live settings include:
- `CLEANING_PREP_MINUTES = 30`
- `CLEANING_REQUIRED = نعم`
- `CLEANING_ESCALATE_IF_NOT_DONE = مراجعة تشغيلية`

Exact supplied-monolith source search found no use of those key literals. `cleaningV1_()` simply stores `attScheduledStart_(date)` as expected start; it does not subtract the 30-minute prep window and has no visible backend escalation logic.

Cleaning inherits the same non-central Friday/business-calendar gap as Attendance.

## Current GO/NO-GO

**NO-GO**.

Confirmed blockers now include:
1. invoice Ready Sweep duplicate drafts — live.
2. finalized invoice -> pricing queue regression — source.
3. Attendance duplicate daily sessions/clock-ins — live.
4. Attendance duplicate pulse events — live.
5. required Clock-in not enforced before activity — source.
6. Cleaning duplicate daily records — live.
7. Cleaning checklist/config integrity gaps — source.
8. D1 Orders/Lines source snapshot consistency gap.
9. Press/WhatsApp/Handover inventories still pending.

Positive evidence:
- zero active duplicate Line IDs current baseline.
- D1 Worker atomic promote verified.
- one-minute D1 sync trigger verified.
- unpriced invoice orders do not invent totals.
- attendance day rollover uses Cairo business-date isolation.

## Phase 0 inventory status

PASS inventories:
- INV-01 Orders/Lines
- INV-02 triggers/cadence
- INV-03 Invoice / Ready Sweep
- INV-04 Attendance / Clock-in
- INV-05 Cleaning
- INV-09A through INV-09J except V2.4 invalidation runtime
- INV-10A/B/C/D deployment identity/routes

Still pending/partial:
- INV-06 Press
- INV-07 WhatsApp
- INV-08 Handover/OPS
- INV-09 overall because V2.4 invalidation/runtime parity pending
- INV-10 full Version 143 project composition

## Exact current stopping point

**Next single action: `INV-06` — inventory Press queue/session source and live sheets.**

Inspect read-only:
- `pressQueue_()` source eligibility vs live source queue.
- `pressOpen_()` and session start check-then-append locking.
- stop/close idempotency and repeated-close behavior.
- whether session rows identify specific Line IDs or only counts/order totals.
- current `تشغيل - جلسات المكبس` and `تشغيل - إعدادات المكبس` live baseline.
- compare source queue with current operational press-related lines.

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
