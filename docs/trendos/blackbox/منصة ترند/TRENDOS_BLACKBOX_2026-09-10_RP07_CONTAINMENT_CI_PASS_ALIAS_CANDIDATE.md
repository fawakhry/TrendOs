# TrendOS Blackbox — RP-07 Containment CI Pass / Integrity Alias Candidate

Date: 2026-09-10  
Repository: `fawakhry/TrendOs`  
Branch: `agent/go-live-2026-09-01-integrity`

## Status

`RP-07 ATTENDANCE/CLEANING CONTAINMENT CI PASS — GUARDED LEGACY ALIAS CUTOVER CANDIDATE ADDED — NO RUNTIME MUTATION`

## Attendance / Cleaning containment

GitHub candidate changes:

- new `trendos-rp07-legacy-containment-v1.gs`;
- `v1932-router.gs` now prefers the RP-07 containment wrapper for legacy `attendanceV1`, `attendanceClockinV1`, and `cleaningV1`, while preserving legacy fallback if the wrapper is absent;
- mutating Attendance / Clock-in / Cleaning calls are serialized by `ScriptLock`;
- Cleaning business-date input is canonicalized before the legacy duplicate scan/append path;
- no historical duplicate row is deleted or edited by the containment module.

Validation:

- `TrendOS RP-07 Remediation Containment CI` Run `34488605009` — **SUCCESS**.
- normal `TrendOS Integrity V1` Run `34488604958` on the same candidate commit — **SUCCESS**.

## Integrity cutover alias defect confirmed and patched in GitHub

A second architectural defect was confirmed: the Integrity router only recognized new action names such as `trendosAttendanceV1`, `trendosPressControlV1`, and `trendosGoLiveAutopilotV1`, while currently deployed frontends/legacy routing use action names such as `attendanceV1`, `pressControlV1`, and `goLiveAutopilotV1`.

Therefore merely enabling an Integrity family would not necessarily intercept the existing action name.

GitHub candidate `trendos-integrity-router-v1.gs` now adds guarded aliases:

- `updateLine` -> `trendosUpdateLineV1_` under `ORDER_LINE`;
- `attendanceV1` -> `trendosAttendanceV1_` under `ATTENDANCE_CLEANING`;
- `attendanceClockinV1` -> `trendosAttendanceClockinV1_` under `ATTENDANCE_CLEANING`;
- `cleaningV1` -> `trendosCleaningV1_` under `ATTENDANCE_CLEANING`;
- `pressControlV1` -> `trendosPressControlV1_` under `PRESS`;
- `goLiveAutopilotV1` -> `trendosGoLiveAutopilotV1_` under `INVOICE`.

`trendosAttendanceClockinV1_` was also added to dependency health requirements.

All aliases remain inert unless BOTH the Integrity master flag and the relevant family flag are enabled. No flag was changed in this checkpoint.

The normal Integrity CI run for this alias commit is still a gate to be observed before the alias candidate can be called code-pass.

## Press evidence finding

Live read-only workbook inspection confirmed legacy `تشغيل - جلسات المكبس` stores aggregate counts, not exact completed Line IDs. It cannot be promoted to exact traceability evidence for line `3796-01`.

The prepared `trendos-press-integrity-v1.gs` uses `تشغيل - بنود جلسات المكبس V1` and requires exact `completedLineIds` at stop; it explicitly rejects count-only completion when `ordersPressed > 0`.

Therefore the existing Press blocker remains unresolved and no fake/hypothetical session evidence was written.

## Runtime boundary

Still prohibited without separate owner approval:

- Apps Script Production deploy;
- any Integrity master/family flag change;
- Source Sheet business-data cleanup;
- Registry mutation;
- D1 write/migration;
- `Code.gs` mutation;
- trigger changes;
- main merge;
- RP-08.
