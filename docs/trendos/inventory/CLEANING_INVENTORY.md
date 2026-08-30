# TrendOS Phase 0 — Cleaning Inventory

> Scope: read-only source + live Google Sheets inventory. No cleaning record, schedule, setting, or Apps Script code was modified.

## Status

`INV-05 — map Cleaning paths`: **PASS — SOURCE + LIVE DATA MAPPED**.

Cleaning correctness is **NOT green**. Live duplicate records and source-level concurrency/schema/config gaps are confirmed.

## 1. Route and sheet

V1932 route:
- `cleaningV1` -> `cleaningV1_(e)`

Sheet:
- `تشغيل - النظافة اليومية`

Current V1932 intended headers include:
- ID
- business date
- employee / department
- expected start
- completion time
- checklist fields
- status
- problem flag/details
- last update

Business date defaults to `v1932DateKey_()` -> `Africa/Cairo`.

## 2. Current source sequence

For `op=status`:

```text
auth
 -> ensure sheet
 -> business date from request or Cairo today
 -> scan all rows for same date + username
 -> return last matching row / completed boolean
```

For `op=complete`:

```text
auth
 -> ensure sheet
 -> business date
 -> scan all rows for same date + username
 -> if found: duplicatePrevented true
 -> else compute scheduled time via attScheduledStart_(date)
 -> append CLN-<uuid8> row
```

## 3. Check-then-append race

There is **no ScriptLock** and no durable request/event key around:

`find existing employee/date record -> append new record`

Two concurrent Complete requests can both observe no existing row and both append different Cleaning IDs.

The sequential-repeat path is guarded only after a row is visible; it is not concurrency safe.

## 4. Live duplicate evidence

Direct read of the current live Cleaning sheet found:
- **31 data rows**.
- **17 unique employee/business-date combinations**.
- therefore **14 excess duplicate rows** above the intended one-record-per-employee/day invariant.

Confirmed duplicate groups:

| Business date | Employee | Record count |
|---|---|---:|
| 2026-08-24 | جابر | 3 |
| 2026-08-25 | ريفان | 2 |
| 2026-08-25 | جابر | 2 |
| 2026-08-26 | ريفان | 4 |
| 2026-08-27 | وائل | 2 |
| 2026-08-27 | جابر | 2 |
| 2026-08-27 | شريف | 2 |
| 2026-08-29 | ريفان | 2 |
| 2026-08-30 | ريفان | 3 |
| 2026-08-30 | وائل | 2 |

That is 10 employee/date groups with duplicates.

This confirms the source race/idempotency gap in live production data.

`REG-14 = FAIL — LIVE BASELINE + SOURCE RACE`.

## 5. Schema drift in the live Cleaning sheet

The current sheet contains a legacy checklist schema plus newer V1932 fields appended later.

Examples of semantic overlap:
- legacy `تنظيف سطح العمل` vs V1932 `سطح العمل`
- legacy `إزالة مخلفات أمس` vs V1932 `مخلفات أمس`
- legacy `فحص بصري سريع` vs V1932 `فحص بصري`
- legacy `نظافة المكان العام` vs V1932 `نظافة المكان`
- legacy `مشكلة مكتشفة` vs V1932 `مشكلة ظهرت؟`
- legacy `وقت بدء التنظيف` plus V1932 `وقت البدء المتوقع`

`v1932EnsureSheet_()` appends exact missing header strings rather than migrating semantic synonyms.

Live rows show the effect: newer V1932 columns are populated while several older synonym columns remain blank.

Any reporting/UI that still reads legacy headers can therefore disagree with the V1932 backend record.

## 6. Checklist payload is not persisted faithfully

`cleaningV1_()` parses `payload`, but in the supplied backend it uses it only as a department fallback.

On every successful `complete`, the server writes fixed values:
- all checklist fields = `نعم`.
- status = `مكتمل`.
- problem = `لا`.
- problem details = blank.

It does not persist actual checklist booleans/problem details from the supplied payload.

Therefore the stored cleaning record does not prove what the client actually checked or whether a problem was reported. The backend effectively records a canonical all-clear completion.

This is an audit-integrity gap even if the frontend currently prevents submission until all boxes are checked.

## 7. Cleaning configuration is not enforced by this backend path

Live Attendance settings include:
- `CLEANING_PREP_MINUTES = 30`
- `CLEANING_REQUIRED = نعم`
- `CLEANING_ESCALATE_IF_NOT_DONE = مراجعة تشغيلية`

Exact source search in the supplied monolithic `Code.gs` found no use of those configuration key literals.

`cleaningV1_()` calls only:

`attScheduledStart_(date)`

and stores that returned **workday start** as `وقت البدء المتوقع`.

It does not subtract the configured 30-minute preparation window.

It also contains no missing-cleaning escalation path and no server-side `CLEANING_REQUIRED` gate.

This source-search conclusion applies to the supplied monolith; full Version 143 composition remains separately partial under `INV-10`.

## 8. Friday / Business Calendar gap

Cleaning inherits schedule logic from `attScheduledStart_(date)`.

That helper:
1. uses an exact active row from `تشغيل - مواعيد خاصة` when present.
2. otherwise falls back to normal default start time.
3. has no weekday/business-day test.

Current special schedule has only 2026-08-25 and 2026-08-26. There is no Friday 2026-08-28 override.

So a Cleaning complete request for that Friday would still receive a normal default schedule instead of a centralized closed-day rule.

This reinforces the shared Business Calendar requirement. `REG-12/13` remain not green.

## 9. Current live record semantics

All current inspected cleaning records are stored as:
- status `مكتمل`.
- checklist values written by V1932 as all positive.
- problem `لا`.

Because the backend hardcodes these values, the live data cannot be used as independent evidence that all physical checklist steps were actually supplied by the user.

## 10. Required implementation contract

Cleaning integrity needs:
1. shared lock around `(businessDate, employee) -> find/create`.
2. durable Cleaning event/request key.
3. hard one-logical-record-per-employee/business-day invariant.
4. preserve duplicate historical rows without counting them as multiple completions.
5. migrate or explicitly map legacy/new checklist headers.
6. persist and validate actual checklist/problem payload rather than fabricating all-clear data.
7. enforce `CLEANING_PREP_MINUTES` when computing expected preparation start.
8. implement configured required/escalation behavior in a central policy.
9. use shared Business Calendar for Friday/closed/special days.

## Test implications

- `INV-05`: **PASS — SOURCE + LIVE DATA MAPPED**.
- `REG-14` Cleaning submit x2: **FAIL — LIVE BASELINE + SOURCE RACE**.
- `REG-12` Friday without Special Schedule: **PENDING / KNOWN BUSINESS-CALENDAR GAP**.
- `REG-13` Friday with Special Schedule: **PENDING**.
- Attendance/Cleaning GO gate remains **FAIL**.

No production mutation was performed.
