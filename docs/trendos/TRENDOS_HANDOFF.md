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
12. `docs/trendos/TRENDOS_TEST_MATRIX.md`
13. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

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

## Current authentication baseline — inventory complete

Mapped current flow:

```text
authorize_
 -> findUser_
    -> ensureUsersSetup_
       -> Users sheet lookup
       -> header check for Token / آخر دخول
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
- current visible used range: 194 rows including header.
- 35 rows have status `مكرر`.
- **no Line ID has more than one non-`مكرر` live row** in the inspected baseline.

Therefore current baseline `zero active duplicate Line IDs` = PASS, while concurrency regression remains pending.

Noted data-quality cases:
- `3216-02`
- `3536-01`

Both appear only as `مكرر` in current live data and no canonical active row was found in the earlier archive search. Do not delete/repair blindly.

Current Line IDs `3637-02`, `3647-01`, `3651-02` render literally in live read; write/read format regression still pending.

## Invoice / Ready Sweep inventory — complete, correctness NOT green

Detailed source/live report:
`docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`

### Ready Sweep candidate logic
`glaReadyOrders_()` selects live operational lines with status:
- `جاهز للاستلام`
- `تم التنفيذ`

It only deduplicates Order IDs inside one invocation. It does not check final-invoice state.

### Draft creation race — LIVE FAILURE
`glaPrepare_()` performs find -> update/append without ScriptLock.

Current live `حسابات - مسودات الفواتير` contains:
- **50 Ready Sweep rows**
- **47 unique Order IDs**
- three confirmed duplicate Order IDs:
  - `3577`: rows 16/17, IDs `DR-ceed6b65` and `DR-3466cb0d`
  - `3572`: rows 18/19, IDs `DR-fe3c766a` and `DR-69e8cb63`
  - `3569`: rows 20/21, IDs `DR-55d94661` and `DR-19c18636`

`REG-20 = FAIL — LIVE BASELINE + SOURCE`.

### Draft schema drift
Live draft sheet contains legacy + appended V1932 semantic duplicates, e.g.:
- `Draft ID` + `ID`
- `رقم العميل` + `الهاتف`
- `مدفوع مقترح` + `المدفوع المقترح`

`v1932EnsureSheet_()` appends exact missing headers rather than migrating synonyms.

### Pricing safety — PASS
All 50 current Ready Sweep rows show:
- proposed total 0
- `يحتاج تسعير/اعتماد`
- blocker `لا توجد بنود معتمدة بسعر بيع.`

No invented price observed.

`REG-24 = PASS — LIVE + SOURCE`.

### Final invoice writer — stronger but not fully repairable
`saveAccountingFinalInvoice_()`:
- ScriptLock 20s.
- persisted request key in `مفتاح العملية`.
- repeat request key returns `duplicatePrevented:true`.
- server computes approved totals.

However finalization is multi-sheet, non-transactional:
1. append final invoice.
2. mirror sales.
3. mark accounting lines closed.
4. finance/ledger.
5. held payment/activity.

If failure occurs after final invoice append but before all lines close, same-request retry returns early through duplicate branch and does not explicitly complete line closure. Repair state remains a CORE gap.

### CORE-P0 finalized -> Ready Sweep regression
After successful finalization, the operational line can remain `جاهز للاستلام` until customer delivery.

Next Ready Sweep can select the same Order again, while accounting lines are already closed. `glaPricing_()` then finds no open approved priced lines and `glaPrepare_()` can overwrite the draft back from `تم التقفيل` to `يحتاج تسعير/اعتماد` with subtotal 0.

`REG-22 = FAIL — SOURCE CONTRACT`.

Required future rule:
**financially finalized order must be ineligible for Ready Sweep unless explicit reopen/revision state exists.**

### Notification idempotency gap
`glaSendReady_()` always calls Meta send when invoked and has no durable logical-event key.

Repeated `finalizeAndNotify` can prevent duplicate final invoice via request key but still resend WhatsApp.

## Current GO/NO-GO

**NO-GO**.

Current blockers include:
1. Ready Sweep duplicate drafts — live failure.
2. finalized invoice can regress into pricing queue — source failure.
3. D1 Orders/Lines source snapshot consistency gap.
4. remaining Attendance/Cleaning/Press/WhatsApp/Handover inventories and regressions not yet closed.

Positive current evidence:
- zero active duplicate Line IDs baseline.
- D1 Worker promote transaction verified.
- one-minute sync trigger verified.
- unpriced invoice orders do not invent totals.

## Phase 0 inventory status

PASS:
- INV-01 Orders/Lines
- INV-02 triggers/cadence
- INV-03 Invoice / Ready Sweep path inventory
- INV-09A through INV-09J except V2.4 invalidation runtime
- INV-10A/B/C/D deployment identity/routes

Still pending/partial:
- INV-04 Attendance/Clock-in
- INV-05 Cleaning
- INV-06 Press
- INV-07 WhatsApp
- INV-08 Handover/OPS
- INV-09 overall because V2.4 invalidation/runtime parity pending
- INV-10 full Version 143 project composition

## Exact current stopping point

**Next single action: `INV-04` — inventory Attendance + Clock-in source and live sheets.**

Inspect read-only:
- `attendanceV1_` / `attendanceClockinV1_` / `attStart_` / pulse handlers and routes.
- start-day check-then-append locking.
- pulse duplicate/idempotency behavior.
- session/day rollover logic.
- configured business timezone/schedule interaction.
- live `سجل الدوام`, `نبض الحضور`, `إعدادات الدوام` baseline.

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
