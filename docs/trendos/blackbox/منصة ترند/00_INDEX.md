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

**PHASE 0B PASS — FLAG NORMALIZATION PASS — TEMP HELPER REMOVED — ALL INTEGRITY FLAGS OFF — NEXT: SEPARATE PHASE 1 REVIEW — RP-07 STILL OPEN**

Newest record:

`TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md`

Verified current facts:

- live parser: `trendosRouterBoolV1_` in `trendos-integrity-router-v1.gs`;
- MASTER raw=`"false"` => semantic false;
- HEALTH raw=`"false"` => semantic false;
- all business-family flags raw=`null` => semantic false;
- all nine Integrity flags semantically OFF;
- `trendosIntegrityDependencyHealthV1` independently confirmed MASTER=false and all family flags=false;
- temporary file `TEMP_RP07_FLAG_DISABLE_20260912.gs` removed from Head;
- temporary function `trendosRp07TemporaryFlagDisable20260912` absent after cleanup;
- no helper trigger exists;
- no deployment, business-data, Registry, D1, Operator Task, RP-08, or Phase 1 mutation occurred in the corrective boundary.

### NEXT ALLOWED STEP

Only a separately approved:

**RP-07 Phase 1 — collision-safe candidate installation/review boundary**

Safety constraint:

- live `trendosV1932TryRoute_` is owned by `Code.gs`;
- standalone `v1932-router.gs` must not be added live;
- no parallel Router/Press/Invoice copies that create duplicate globals/functions.

Approved RP-07 candidate checkpoint:

`2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`

After Phase 1, RP-07 still requires read-only runtime qualification, remaining live P0 remediation, fresh final health proving `OPEN_CORE_P0_BLOCKERS=0`, and an explicit closure record.

Known retained live P0 blockers:

- Attendance post-baseline duplicates;
- Cleaning post-baseline duplicates;
- invoice Drafts for `3839` and `3841`;
- Press Line `3796-01` exact-Line evidence gap.

Until RP-07 closes PASS:

**OPERATOR TASK RUNTIME PROHIBITED — RP-08 PROHIBITED.**

Supporting RP-07 records:

- `TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_HELPER_OWNER_DELETED_PENDING_VERIFY.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_SETTER_PRECONDITION_FAIL_RAW_VALUES.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_FLAG_DISABLE_BOUNDARY_FAIL_NO_SETTER.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_CLOSURE_VERIFICATION_HOLD.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`

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
- all Integrity flags are currently semantic OFF.
- no Production deploy without separate approval.
- standalone `v1932-router.gs` must not be added live because `trendosV1932TryRoute_` is owned by `Code.gs`.
- Operator Task D1 write authority remains OFF/not authorized.
- Operator Task runtime starts only after RP-07 full closure.
- RP-08 not started.
