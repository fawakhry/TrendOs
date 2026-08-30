# TrendOS Phase 0 — Attendance / Clock-in Inventory

> Scope: read-only source + live Google Sheets inventory. No attendance session, clock-in, pulse, setting, schedule, or Apps Script code was modified.

## Status

`INV-04 — map Attendance / Clock-in paths`: **PASS — SOURCE + LIVE DATA MAPPED**.

Attendance correctness is **NOT green**. Live duplicates and source-level idempotency/concurrency gaps are confirmed.

## 1. Routes and source of truth

V1932 routes:
- `attendanceV1` -> `attendanceV1_(e)`
- `attendanceClockinV1` -> `attendanceClockinV1_(e)`

Sheets:
- `سجل الدوام` — one intended operational session per employee/business day.
- `نبض الحضور` — append-only attendance/activity pulse log.
- `إعدادات الدوام` — operational attendance configuration.
- `تشغيل - مواعيد خاصة` — date-specific schedule override.

Operational time helpers use:

`V1932_TZ = 'Africa/Cairo'`

and `v1932DateKey_()` formats the business date with that timezone.

## 2. Current live settings

Direct read of `إعدادات الدوام` confirms active configuration including:
- `WORKDAY_REQUIRE_START = نعم`
- presence check every 30 minutes.
- presence response window 10 minutes.
- daily rest 30 minutes.
- `AUTO_END_DAY = لا`.
- missed check = human review only.
- `DEFAULT_WORKDAY_START = 12:00`.
- cleaning required.
- `ATTENDANCE_CLOCKIN_REQUIRED = نعم`.
- `ATTENDANCE_SCHEDULE_START = 12:00`.
- late grace = 0 minutes.
- `ATTENDANCE_ONE_CLOCKIN_PER_DAY = نعم`.

Important source mismatch:
`attConfig_()` does not currently read/expose the `ATTENDANCE_CLOCKIN_REQUIRED`, `ATTENDANCE_SCHEDULE_START`, `ATTENDANCE_LATE_GRACE_MINUTES`, `ATTENDANCE_TRACK_LATENESS`, or `ATTENDANCE_ONE_CLOCKIN_PER_DAY` setting keys. Clock-in behavior is implemented directly in `attendanceClockinV1_()`, while the broader Attendance event path does not enforce a required prior clock-in.

## 3. Session lookup

`attFindToday_(username, openOnly)`:
- reads attendance rows.
- computes `today` using Cairo business date.
- searches newest to oldest for same employee + business date.
- with `openOnly=true`, skips only rows whose exact state is `انتهى اليوم`.

Positive consequence:
- prior business-day sessions are not selected as today's session.

`REG-11` source contract therefore isolates day rollover by business date.

## 4. Session start race

`attStart_(auth)` performs:

```text
ensure sheets
 -> attFindToday_(username, true)
 -> if found, reuse
 -> otherwise create new UUID session row
 -> attFindToday_ again
 -> append start_day pulse
```

There is **no ScriptLock** or durable event/idempotency key around the check -> append sequence.

Concurrent start calls can both observe no row and both append different session IDs for the same employee/date.

After appending, each execution re-runs `attFindToday_()`, so both may target the last-created session for `start_day`, creating another possible symptom: an orphan session plus duplicate `start_day` pulses on the session that wins the final lookup.

## 5. Live duplicate-session evidence

Current `سجل الدوام` contains 25 data rows in the inspected range and four employee/date groups with more than one session:

| Business date | Employee | Live attendance rows | Session count |
|---|---|---|---:|
| `2026-08-27` | ريفان | rows 12, 13, 14 | 3 |
| `2026-08-29` | وائل | rows 18, 19 | 2 |
| `2026-08-29` | ريفان | rows 21, 22 | 2 |
| `2026-08-30` | ريفان | rows 24, 25 | 2 |

That is 5 excess session rows above the intended one-session-per-employee/day invariant.

The pulse timings strongly match a race/retry pattern:
- 2026-08-27 Revan has three distinct `start_day` sessions only seconds apart.
- 2026-08-29 Revan has two session starts about two seconds apart.
- 2026-08-30 Revan has two session starts about four seconds apart.
- 2026-08-29 Wael has two distinct sessions whose `start_day` pulses have the same displayed second.

Therefore the start-session race is confirmed by live state, not only theoretical source review.

## 6. Clock-in idempotency

`attendanceClockinV1_()`:
1. authenticates.
2. finds today's attendance row with `openOnly=false`.
3. if none, calls `attStart_()` then re-finds.
4. if the selected row already has `تسجيل الحضور`, returns `duplicatePrevented:true`.
5. otherwise computes scheduled/actual time and writes clock-in fields.

### Strength
Within one already-selected session row, a later repeat call does not overwrite an existing clock-in value.

### Gap
There is no lock around:

`find today -> maybe start -> check clock-in -> write clock-in`

and uniqueness is not enforced across multiple attendance rows for the same employee/date.

Live data confirms duplicate daily attendance state:
- Revan 2026-08-27 has multiple sessions and two rows with clock-in `09:12`.
- Revan 2026-08-29 has two sessions and both show clock-in `14:23`.
- Revan 2026-08-30 has two sessions and both show clock-in `13:19`.

So `ATTENDANCE_ONE_CLOCKIN_PER_DAY = نعم` is not guaranteed by the current persistence model.

`REG-07 = FAIL — LIVE BASELINE + SOURCE RACE` for the one-operational-session/clock-in invariant.

## 7. Pulse/event idempotency

`attAppendPulse_()` directly calls `appendRow(...)`.

It has:
- no event ID.
- no request ID.
- no dedupe key.
- no lock.
- no transition validation/debounce.

Any repeated client retry/click can append another logical event.

### Live evidence: repeated Resume
For session `AT-20260829-وائل-5167c552`, the pulse sheet contains four `resume` events within about 20 seconds after a prayer break:
- 15:16:24 displayed source timestamp
- 15:16:30
- 15:16:34
- 15:16:44

The compute state machine does not multiply work time because it only opens work when no work interval is open, but the logical audit trail contains duplicate Resume events.

`REG-09 = FAIL — LIVE + SOURCE`.

### Live evidence: duplicate start pulse on same session
Session `AT-20260830-وائل-4ff8f9e8` has two `start_day` pulses one second apart.

This is consistent with the `attStart_()` race where concurrent executions can re-select the same latest session after their separate check/append attempts.

## 8. Required clock-in is not enforced before activity

Live configuration says:

`ATTENDANCE_CLOCKIN_REQUIRED = نعم`

But `attendanceV1_()` only requires an **open attendance session** for pause/resume/rest/prayer/confirm/heartbeat/missedCheck/end.

It does not verify the row's `تسجيل الحضور` before appending those activity events.

Also `attendanceV1 op=start` directly calls `attStart_()` independently of `attendanceClockinV1_()`.

Therefore a work session/activity event can exist before official clock-in, despite the active setting saying clock-in is required.

`REG-10 = FAIL — SOURCE CONTRACT` against the intended no-operational-activity-before-required-clock-in rule.

## 9. State computation and repeated events

`attCompute_()` reconstructs state from pulses:
- `start_day`, `resume`, `presence_confirmed` open work if not already open.
- `pause` closes work/rest.
- `rest_start` opens rest.
- `prayer_break_start` closes work/rest.
- `missed_check` sets review.
- `end_day` closes work/rest and sets ended.

This reduces some arithmetic damage from repeated Resume, but it does not make the underlying event log idempotent and it does not reject invalid transitions such as Resume while already working.

## 10. `attState_()` is not read-only

A state/config read ultimately calls `attState_()`, which recomputes from pulses and writes derived values back to the attendance row:
- end time.
- total presence.
- work time.
- pause time.
- rest usage.
- day status.
- last pulse.

So normal state reads can mutate the Attendance sheet.

This is not automatically wrong, but it complicates concurrency and should be explicit in the integrity design.

## 11. Day rollover

`attFindToday_()` matches exact Cairo business date, so a previous day's open row is not inherited into a new day's lookup.

Live data contains many prior sessions still lacking `نهاية اليوم`, but new business dates use new session IDs rather than inheriting those old rows.

Therefore:
- `REG-11 = PASS — SOURCE + LIVE BEHAVIOR` for no previous-day session inheritance.
- separate data-quality/operational issue remains: stale sessions can remain open forever because `AUTO_END_DAY = لا` and there is no reconciliation/finalization policy visible in this path.

## 12. Business calendar / Friday gap

`attScheduledStart_(dateKey)`:
1. checks `تشغيل - مواعيد خاصة` for an exact active date.
2. if found, returns that start time.
3. otherwise returns `DEFAULT_WORKDAY_START` or `12:00`.

Current special-schedule sheet only contains:
- `2026-08-25` 10:00–22:00
- `2026-08-26` 10:00–22:00

There is no special row for Friday `2026-08-28`.

The function contains no weekday/business-day test. Therefore Friday without a special schedule falls through to the normal default `12:00` schedule rather than a centralized closed/non-working-day rule.

This confirms the need for the planned shared Business Calendar. `REG-12/REG-13` cannot be considered green under the current source contract.

## 13. Timezone / observability mismatch

Operational date/time functions intentionally use `Africa/Cairo`, while the spreadsheet file metadata is still `America/Los_Angeles`.

Live evidence shows this clearly: some session business dates are `2026-08-27` while displayed timestamp cells render as `8/26/2026` because the sheet's display timezone differs from the operational Cairo date key.

This is not evidence that the business-date string is wrong; it is an observability/display mismatch that can confuse manual review.

Do not change the workbook timezone blindly. Existing platform settings explicitly require a controlled date migration first.

## 14. Required implementation contract

Attendance integrity needs:
1. one shared lock around `find today's session -> create/reuse`.
2. durable uniqueness/event key such as `(businessDate, employee, eventType, logicalEventId)`.
3. hard one-active-session-per-employee/business-day invariant.
4. clock-in uniqueness across the business day, not just within the selected row.
5. enforce `ATTENDANCE_CLOCKIN_REQUIRED` before operational activity when enabled.
6. debounce/idempotency for Resume/Pause/Presence/Heartbeat/MissedCheck/End.
7. centralized Business Calendar including Friday/special schedules.
8. stale-session reconciliation policy.
9. keep Cairo as business timezone while planning controlled spreadsheet display/date migration.

## Test implications

- `INV-04`: **PASS — SOURCE + LIVE DATA MAPPED**.
- `REG-07` Clock-in x2 / one operational session: **FAIL — LIVE BASELINE + SOURCE RACE**.
- `REG-08` fallback/retry after Clock-in: **PENDING**, but current no-lock session creation makes it unsafe.
- `REG-09` Resume x5 rapidly: **FAIL — LIVE + SOURCE**.
- `REG-10` activity before required Clock-in: **FAIL — SOURCE CONTRACT**.
- `REG-11` day rollover: **PASS — SOURCE + LIVE BEHAVIOR** for no prior-day inheritance.
- `REG-12` Friday without Special Schedule: **PENDING / KNOWN BUSINESS-CALENDAR GAP**; source applies normal default schedule.
- `REG-13` Friday with active Special Schedule: **PENDING**; exact-date override exists but centralized business-day regression is not yet tested.

No production mutation was performed.
