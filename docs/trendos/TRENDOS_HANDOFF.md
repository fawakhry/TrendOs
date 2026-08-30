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
13. `docs/trendos/TRENDOS_TEST_MATRIX.md`
14. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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

Mapped current legacy auth:

```text
authorize_
 -> findUser_
    -> ensureUsersSetup_
       -> Users sheet lookup
       -> Token / آخر دخول header check
          -> can append missing headers
    -> Users sheet lookup again
    -> full Users getDataRange().getValues()
    -> header read
    -> sequential username scan
 -> Active check
 -> constant-time token compare
 -> session expiry
```

Verified:
- no auth cache in current `authorize_()` / `findUser_()`.
- session default 12h, Script Property configurable, clamped 1–72h.
- logout clears Token on matching token.
- password change clears Token and forces relogin.
- login writes fresh Token + Last Login.
- failed/bad/expired auth can clear stored Token.
- current monolith has no dedicated employee `createUser/saveUser/updateUser` backend path found; Users-sheet Active is authoritative on each legacy lookup.

`INV-09G/H/I/J = PASS`.

`D1-05` remains PENDING because V2.4 cache invalidation is not deployed/verified.

## Live Line-ID baseline

Direct Google Sheets inspection of current `بنود الأوردرات`:
- 194 rows including header in inspected live range.
- 35 rows have status `مكرر`.
- **no Line ID has more than one non-`مكرر` live row** in the inspected baseline.

Current zero-active-duplicate baseline = PASS; concurrency regression still pending.

Data-quality notes only:
- `3216-02`
- `3536-01`

Both appear only as `مكرر` in current live data and no canonical active row was found in earlier archive search. Do not repair/delete blindly.

Line IDs `3637-02`, `3647-01`, `3651-02` render literally in live read; write/read format regression remains pending.

## Invoice / Ready Sweep — inventory complete, correctness NOT green

Detailed report:
`docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`

### Live duplicate drafts
Current `حسابات - مسودات الفواتير`:
- 50 Ready Sweep rows.
- 47 unique Order IDs.
- duplicate orders:
  - `3577`: `DR-ceed6b65`, `DR-3466cb0d`
  - `3572`: `DR-fe3c766a`, `DR-69e8cb63`
  - `3569`: `DR-55d94661`, `DR-19c18636`

`glaPrepare_()` performs find -> append/update without ScriptLock.

`REG-20 = FAIL — LIVE + SOURCE`.

### Finalized -> Ready Sweep regression
Ready Sweep looks only for operational status `جاهز للاستلام` / `تم التنفيذ` and does not check final-invoice state.

After finalization, accounting lines are closed while operational line may still be ready for pickup. Next sweep can select the same order and `glaPrepare_()` can overwrite the draft from `تم التقفيل` back to `يحتاج تسعير/اعتماد` with subtotal 0.

`REG-22 = FAIL — SOURCE CONTRACT`.

Required future rule: finalized financial state is ineligible for Ready Sweep unless explicit reopen/revision exists.

### Pricing safety
All 50 inspected current Ready Sweep drafts have:
- proposed total 0.
- `يحتاج تسعير/اعتماد`.
- `لا توجد بنود معتمدة بسعر بيع.` blocker.

No invented price observed.

`REG-24 = PASS — LIVE + SOURCE`.

### Final writer
`saveAccountingFinalInvoice_()` has ScriptLock + persisted request-key duplicate protection, but finalization is multi-sheet/non-transactional. If failure happens after final-invoice append but before all accounting lines close, same-key retry returns through duplicate branch without explicitly completing line closure. Repair-state gap remains.

### Notification
`glaSendReady_()` has no durable logical notification key; repeated finalize can avoid duplicate invoice but still resend WhatsApp.

## Attendance / Clock-in — inventory complete, correctness NOT green

Detailed report:
`docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`

Operational attendance business date uses `Africa/Cairo` through `V1932_TZ` + `v1932DateKey_()`.

### Live settings
Current `إعدادات الدوام` includes:
- Workday start required.
- Presence check 30 min / response 10 min.
- default workday start 12:00.
- `ATTENDANCE_CLOCKIN_REQUIRED = نعم`.
- `ATTENDANCE_ONE_CLOCKIN_PER_DAY = نعم`.
- auto-end disabled.

Important: current `attConfig_()` does not read several ATTENDANCE_* setting keys; broader attendance events do not enforce required clock-in.

### Session creation race — LIVE FAILURE
`attStart_()` does:

```text
find today's open session
 -> if none append UUID session
 -> re-find latest session
 -> append start_day pulse
```

No ScriptLock or durable idempotency key.

Current `سجل الدوام` has four employee/date duplicate groups:
- Revan `2026-08-27`: 3 sessions.
- Wael `2026-08-29`: 2 sessions.
- Revan `2026-08-29`: 2 sessions.
- Revan `2026-08-30`: 2 sessions.

5 excess session rows above the one-session/day invariant.

Some duplicate rows also contain the same daily clock-in value, e.g. Revan:
- `2026-08-27` clock-in `09:12` on multiple rows.
- `2026-08-29` clock-in `14:23` on both duplicate sessions.
- `2026-08-30` clock-in `13:19` on both duplicate sessions.

`REG-07 = FAIL — LIVE + SOURCE RACE`.

### Pulse idempotency — LIVE FAILURE
`attAppendPulse_()` blindly `appendRow()`s with no event/request key, lock, debounce, or transition validation.

Wael session `AT-20260829-وائل-5167c552` has four `resume` events within about 20 seconds.

`REG-09 = FAIL — LIVE + SOURCE`.

Wael session `AT-20260830-وائل-4ff8f9e8` has two `start_day` pulses one second apart, consistent with the start-race re-find behavior.

### Required Clock-in not enforced
Live setting says clock-in required, but `attendanceV1_()` only checks for an open session before pause/resume/rest/prayer/confirm/heartbeat/missedCheck/end. It does not check `تسجيل الحضور`.

`REG-10 = FAIL — SOURCE CONTRACT`.

### Day rollover
`attFindToday_()` matches exact Cairo business date; prior-day sessions are not inherited into the next day even if old rows remain open.

`REG-11 = PASS — SOURCE + LIVE BEHAVIOR` for no prior-day inheritance.

Separate data-quality issue: many prior rows have no End Day because AUTO_END_DAY is disabled and there is no visible reconciliation policy in this path.

### Friday / Business Calendar
`attScheduledStart_()` checks exact-date `تشغيل - مواعيد خاصة`; otherwise it falls back to default 12:00. It has no weekday/business-day rule.

Current special schedule only has 2026-08-25 and 2026-08-26. Friday 2026-08-28 has no special row, so current source would use normal default rather than a centralized closed-day policy.

`REG-12/13` remain not green pending shared Business Calendar.

### Timezone observability
Workbook metadata timezone is still `America/Los_Angeles` while operational date keys are Cairo. Live cells can display a prior Gregorian date while their business-date field is the next Cairo date. Do not change workbook timezone blindly; controlled migration is required.

## Current GO/NO-GO

**NO-GO**.

Current confirmed blockers include:
1. Ready Sweep duplicate invoice drafts — live failure.
2. finalized invoice can regress into pricing queue — source failure.
3. Attendance duplicate daily sessions/clock-ins — live failure.
4. Attendance pulse idempotency — live failure.
5. required clock-in not enforced before broader attendance activity — source failure.
6. D1 Orders/Lines source snapshot consistency gap.
7. Cleaning/Press/WhatsApp/Handover inventories and regressions still pending.

Positive current evidence:
- zero active duplicate Line IDs baseline.
- D1 Worker promote transaction verified.
- one-minute sync trigger verified.
- unpriced invoice orders do not invent totals.
- attendance day rollover uses Cairo business-date isolation.

## Phase 0 inventory status

PASS inventories:
- INV-01 Orders/Lines
- INV-02 triggers/cadence
- INV-03 Invoice / Ready Sweep
- INV-04 Attendance / Clock-in
- INV-09A through INV-09J except V2.4 invalidation runtime
- INV-10A/B/C/D deployment identity/routes

Still pending/partial:
- INV-05 Cleaning
- INV-06 Press
- INV-07 WhatsApp
- INV-08 Handover/OPS
- INV-09 overall because V2.4 invalidation/runtime parity pending
- INV-10 full Version 143 project composition

## Exact current stopping point

**Next single action: `INV-05` — inventory Cleaning source and live sheet.**

Inspect read-only:
- `cleaningV1_()` status/complete path.
- check-then-append locking/idempotency.
- employee + businessDate uniqueness.
- schedule dependency on `attScheduledStart_()`.
- Friday/special-date behavior.
- current `تشغيل - النظافة اليومية` live baseline for duplicates.

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
