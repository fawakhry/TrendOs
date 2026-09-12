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

## CURRENT RP-07 CHECKPOINT — 2026-09-12

Status:

**MASTER+HEALTH REPORTED OFF — OWNER REPORTS TEMP HELPER DELETED — NEXT: READ-ONLY CLEANUP VERIFICATION — PHASE 1 STILL BLOCKED**

Newest record:

`TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_HELPER_OWNER_DELETED_PENDING_VERIFY.md`

Current reported facts:

- MASTER raw=`"false"` => semantic false;
- HEALTH raw=`"false"` => semantic false;
- all business-family flags raw=`null` => semantic false;
- corrective helper executed exactly one additional time;
- no deploy or trigger mutation;
- no business-data, Registry, D1, Operator Task, or RP-08 mutation;
- owner reports `TEMP_RP07_FLAG_DISABLE_20260912.gs` deleted.

The deletion is not yet independently reverified. Therefore the only next allowed step is:

**RP-07 Temporary Helper Cleanup Verification — READ ONLY**

It must prove the temporary file/function are absent, no trigger references them, and all nine Integrity flags remain semantically OFF.

Until that passes:

**PHASE 1 PROHIBITED — DEPLOY PROHIBITED — OPERATOR TASK RUNTIME PROHIBITED — RP-08 PROHIBITED.**

RP-07 remains **OPEN**.

Supporting RP-07 records:

- `TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_SETTER_PRECONDITION_FAIL_RAW_VALUES.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_FLAG_DISABLE_BOUNDARY_FAIL_NO_SETTER.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_CLOSURE_VERIFICATION_HOLD.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`

After cleanup verification PASS, RP-07 still requires collision-safe candidate installation, read-only runtime qualification, remaining P0 remediation, fresh final health proving `OPEN_CORE_P0_BLOCKERS=0`, and an explicit closure record.

## Operator Task Workflow V2

Status: **OT-00 DESIGN/PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**

Owner-locked roadmap order:

`RP-07 -> Operator Task V2 -> RP-08`

Operator Task V2 is the immediate next production track after RP-07 closes PASS.

Authoritative references:

- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`
- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`
- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_OWNER_PRIORITY_LOCK.md`
- `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

## RP-06

Status: **CLOSED — RECOVERY COMPLETE**

Final record:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Shared safety invariants

- Sheets / Apps Script authoritative for business writes.
- eligible Orders reads D1-first with Apps Script fallback.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- no business-family activation under the current hold.
- no Production deploy without separate approval.
- standalone `v1932-router.gs` must not be added live because `trendosV1932TryRoute_` is owned by `Code.gs`.
- Operator Task D1 write authority remains OFF/not authorized.
- RP-08 not started.
