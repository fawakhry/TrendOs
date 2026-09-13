# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**.

## Startup order

كل شات/جلسة جديدة تقرأ بالترتيب:

1. `00_PROJECT_LOCATOR.md`
2. `00_INDEX.md`
3. `01_CURRENT_STATE.md`
4. أحدث checkpoint مشار إليه في `01_CURRENT_STATE.md`

Canonical production identity:

- Spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Working branch: `agent/go-live-2026-09-01-integrity`

Do not substitute BACKUP/STAGING workbooks. The workbook tab `سكريبت Apps Script` is not live Head authority.

## CURRENT CHECKPOINT — RP-07 CLOSED / PASS — 2026-09-13

Status:

**RP-07 PASS / CLOSED — FINAL PRODUCTION HEALTH GATE = ZERO CORE P0 BLOCKERS — NEXT TRACK OPERATOR TASK V2**

Newest authoritative record:

`TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`

Final production health result:

- `OPEN_CORE_P0_BLOCKERS = 0`
- `Status = PASS`
- `Last Updated = 9/12/2026 18:21:09`
- `IDs JSON = []`
- `derivedFrom = []`
- temporary `RP07_TEMP_RUN` file removed after the one-shot health rebuild: YES.

Final P0 health metrics are PASS:

- `ACTIVE_DUPLICATE_LINE_IDS = 0`
- `INVALID_LINE_IDS = 0`
- `DUPLICATE_ATTENDANCE_SESSIONS = 0`
- `DUPLICATE_CLEANING_RECORDS = 0`
- `DUPLICATE_INVOICE_DRAFTS = 0`
- `CLOSED_ORDERS_WITH_DRAFT = 0`
- `PRESS_COMPLETED_WITHOUT_SESSION = 0`
- `AUTOMATION_LAST_ERROR = 0`

RP-07 closure does not itself change the retained Phase 2 safety baseline:

- all nine Integrity flags remain semantically OFF unless separately authorized;
- no RP-07 production deployment/version/trigger is retained;
- standalone `v1932-router.gs` remains prohibited live;
- no D1 write authority or Cloudflare authority cutover is implied by closure.

Supporting RP-07 records:

- `TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_READONLY_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE1_INSTALL_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`

## Operator Task Workflow V2

Status: **IMMEDIATE NEXT PRODUCTION TRACK — DESIGN/PREP + GITHUB CANDIDATE EXIST — RUNTIME/DEPLOYMENT/AUTHORITY CHANGE NOT YET IMPLIED BY RP-07 CLOSURE**

Owner-locked roadmap order:

`Operator Task V2 -> Department Invoice + Material Shadow/Parity (Gaber LASER + Wael PRINT) -> Laser + Print Accounting Control -> RP-08`

Operator Task V2 may now proceed under its own controlled boundary because RP-07 is CLOSED/PASS.

## RP-06

Status: **CLOSED — RECOVERY COMPLETE**

Final record:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Shared safety invariants

- Sheets / Apps Script authoritative for business writes until an explicitly approved authority cutover.
- eligible Orders reads D1-first with Apps Script fallback.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- no Production deploy without separate approval.
- no Integrity flag mutation without a separate approved boundary.
- standalone `v1932-router.gs` must not be added live.
- Operator Task D1 write authority remains OFF/not authorized until its own boundary approves it.
- Department Invoice + Material Shadow/Parity follows Operator Task V2.
- Laser + Print Accounting Control follows that track before RP-08.
- RP-08 not started.
