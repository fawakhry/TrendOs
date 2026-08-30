# Phase 3 — Attendance + Cleaning Integrity Checkpoint

Status: **PREPARED + TESTED ON GITHUB BRANCH / NOT DEPLOYED**

Working branch: `agent/go-live-2026-09-01-integrity`

## Files

- `trendos-integrity-v1.gs`
- `trendos-attendance-cleaning-integrity-v1.gs`
- `tests/trendos_attendance_cleaning_integrity_v1.test.js`
- `.github/workflows/trendos-integrity-v1.yml`

Latest CI run: `33319559363` — **SUCCESS**.

## Attendance contracts implemented

### Shared business calendar

All new attendance/cleaning decisions use `trendosBusinessSchedule_()` from the shared integrity foundation.

This means:
- Cairo business date is centralized.
- Friday is closed by default.
- an enabled exact-date Special Schedule reopens Friday/other exceptions.
- attendance and cleaning now consume the same business-day decision instead of separate hardcoded schedulers.

### Start + Clock-in

`trendosAttendanceV1_(op=start)` now performs Start + Clock-in under the same ScriptLock.

The separate future `attendanceClockinV1` replacement is `trendosAttendanceClockinV1_()` and uses the same lock/canonical session logic.

Consequences:
- concurrent Start / Clock-in cannot create two new sessions.
- pressing Start then the existing delayed Clock-in UI call becomes safe: the second call returns `alreadyRecorded`.
- Clock-in is written on the same canonical daily session.
- no new session is created on a closed business day.

### Canonical daily session

The new session resolver scans all rows for `employee + businessDate` and chooses one canonical row deterministically.

Preference:
1. clocked-in + not ended.
2. clocked-in.
3. not ended.
4. earliest remaining row.

Historical duplicate rows are not deleted or silently rewritten.

The response surfaces `duplicateSessionsDetected` so existing duplicate history remains visible as an integrity warning while the new code refuses to create another daily session.

### Operational events require Clock-in

When Attendance config `requireStart` is enabled, Pause / Resume / Rest / prayer break / presence events / End require the canonical session to contain `تسجيل الحضور`.

This closes the current source gap where an open session alone allowed operational events before formal Clock-in.

### Attendance event dedupe

State-aware idempotency prevents repeated logical state transitions:
- Pause while already paused -> no-op.
- Resume while already working -> no-op.
- Rest while already Rest -> no-op.
- prayer break while already active -> no-op.
- missed-check while already in review -> no-op.
- End repeated after end -> same logical result / no new mutation.

Non-heartbeat identical event types also get a 60-second duplicate debounce.

Heartbeat remains repeatable by design.

This directly addresses the observed rapid repeated Resume pulses without suppressing legitimate periodic heartbeat behavior.

## Cleaning contracts implemented

### One employee/day record under ScriptLock

`trendosCleaningV1_()` performs `employee + businessDate` scan -> decision -> append under the shared ScriptLock.

If a record already exists:
- no new row is appended.
- response returns `alreadyDone` / `duplicatePrevented`.
- existing historical duplicate count is surfaced as `duplicateRowsDetected`.

Historical duplicates are not deleted by this patch.

### Friday / Special Schedule

Closed business day returns:
- `closedDay:true`
- `noCleaningRequired:true`

and appends no Cleaning row.

An enabled Special Schedule uses the shared calendar and allows the normal flow.

### No invented checklist completion

Current/older Cleaning backends hardcode checklist items to `نعم` / `تم`.

The integrity replacement requires explicit values for all six checklist items:
- machine.
- work surface.
- previous-day waste.
- visual check.
- materials/tools arrangement.
- general place cleanliness.

It accepts multiple legacy/Arabic key aliases, but if any item is missing or unparsable it fails closed with `checklistRequired:true` rather than inventing success.

Actual false values are stored as `لا`.

Problem/issue text is persisted when supplied rather than hardcoding “no problem”.

The module writes only headers that actually exist, supporting both the current 14-column live schema and the older/merged V1932 naming lineage without performing a blind schema rewrite.

## Automated tests passing

Tests cover:
- Start creates one session and one `start_day` pulse.
- Start retry reuses the same session and Clock-in.
- Pause -> Resume -> repeated Resume produces one logical Resume.
- historical duplicate attendance session is detected; canonical clocked session is reused; no third session is created.
- closed business day creates no Attendance or Cleaning row.
- incomplete Cleaning checklist is rejected.
- explicit false Cleaning checklist value persists as `لا`.
- Cleaning issue text persists.
- repeated Cleaning complete creates no second row.
- existing Cleaning duplicates are surfaced in status.
- ScriptLock / Business Calendar / no-hardcoded-checklist static guards.

## Not yet wired

Do not change production routes yet.

Future controlled wiring after source-composition/deployment checkpoint:
- `attendanceV1` -> `trendosAttendanceV1_`
- `attendanceClockinV1` -> `trendosAttendanceClockinV1_`
- `cleaningV1` -> `trendosCleaningV1_`

The current UI must also be checked before deployment because the new Cleaning contract intentionally requires real checklist payload values instead of accepting the current server-side “everything completed” assumption.

No production Apps Script, Sheet row, trigger, D1 table or deployment was changed.

## Phase 3 status

**IMPLEMENTED ON WORKING BRANCH + AUTOMATED TESTS PASS.**

Not yet `DEPLOYED` or `RUNTIME VERIFIED`.

Next implementation lane: **Press integrity**.
