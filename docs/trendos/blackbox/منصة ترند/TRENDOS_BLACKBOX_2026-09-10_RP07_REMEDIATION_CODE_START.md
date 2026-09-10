# TrendOS Blackbox — RP-07 Remediation Code Start

Date: 2026-09-10  
Repository: `fawakhry/TrendOs`  
Branch: `agent/go-live-2026-09-01-integrity`

## Status

`RP-07 REMEDIATION CODE STARTED — GITHUB-ONLY — NO RUNTIME MUTATION AUTHORIZED`

## Trigger

The RP-07 live read-only recheck proved new post-baseline CORE-P0 blockers after RP-06 Recovery completed successfully:

- new Attendance duplicate employee/day groups;
- new Cleaning duplicate employee/day groups;
- `CLOSED_ORDERS_WITH_DRAFT > 0`;
- `PRESS_COMPLETED_WITHOUT_SESSION > 0`.

RP-06 remains CLOSED and must not be rerun for these new operational failures.

## Root-cause direction confirmed before code mutation

- `v1932-router.gs` still routes legacy `attendanceV1`, `attendanceClockinV1`, and `cleaningV1` actions directly to legacy backends.
- legacy `cleaningV1_` performs check-then-append without `ScriptLock`.
- legacy `attendanceClockinV1_` performs find/start/write without `ScriptLock`.
- legacy `attendanceStartV1_` performs find-then-append without `ScriptLock`.
- the prepared Integrity Attendance/Cleaning path already serializes sensitive mutations, but its family is not authorized for runtime activation.

## Authorized scope for this checkpoint

GitHub-only remediation candidate work is authorized. The immediate containment objective is to prevent future duplicate creation while preserving current legacy route names and without activating Integrity feature flags.

Planned candidate boundaries:

1. add a narrow RP-07 legacy containment module that serializes mutating Attendance / Clock-in / Cleaning requests with the ScriptLock;
2. wire only the three existing legacy route actions through the containment module when that module is present, otherwise retain the current fallback;
3. normalize Cleaning business-date input before the legacy check/append path;
4. add contract tests proving lock coverage, fallback behavior, and no historical-row deletion;
5. inspect Invoice and Press separately before any candidate change to those families.

## Explicitly not authorized

- no Apps Script Production deploy;
- no Script Property or feature-flag change;
- no Registry mutation;
- no Source Sheet business-data edit or cleanup;
- no D1 write/migration;
- no `Code.gs` mutation;
- no trigger change;
- no merge to `main`;
- no RP-08 execution.

Existing duplicate rows remain untouched. Existing Drafts `3839` / `3841` remain untouched. Existing Press traceability gaps remain untouched until their evidence model is inspected and separately bounded.
