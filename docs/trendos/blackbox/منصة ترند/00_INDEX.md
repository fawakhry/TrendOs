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

Do not substitute BACKUP/STAGING workbooks. The workbook tab `سكريبت Apps Script` is not live Head authority.

## CURRENT CHECKPOINT — T6B CLOUD AUTH SHADOW PASS — 2026-09-13

Status:

**T6B PASS / RETAINED IN PRODUCTION — D1 AUTH SHADOW ENABLED — FRONTEND EDGE ORDERS READ STILL OFF — SHEETS WRITE AUTHORITY UNCHANGED**

Newest authoritative record:

`TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md`

Final production evidence:

- workflow run `34768601492` — SUCCESS
- job `103753950827`
- Worker Version ID `3b819fd3-e73d-46f8-9150-f73c282706ab`
- Apps Script verification miss: `4105 ms`
- D1 auth-shadow hit: `129 ms`
- Orders-session D1 auth-shadow hit: `122 ms`
- auth-shadow TTL: `300 s`
- raw employee token stored in D1: NO

Retained boundary after T6B:

- Sheets / Apps Script remain authoritative for business writes;
- frontend `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` remains false;
- no Task mutation/authority rollout;
- no Gaber Material Control rollout;
- no secret rotation/change;
- no Apps Script production deploy by T6B.

Immediate next controlled stage:

**read-only Cloud/D1 Orders parity + freshness + latency qualification while the frontend flag stays OFF.**

A later user-visible frontend Orders cutover is a separate decision boundary.

## RP-07 — CLOSED / PASS

Authoritative closure record:

`TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`

Final production health result:

- `OPEN_CORE_P0_BLOCKERS = 0`
- `Status = PASS`
- all eight final P0 health metrics PASS
- temporary `RP07_TEMP_RUN` removed after the one-shot health rebuild.

Supporting RP-07 records:

- `TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_READONLY_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE1_INSTALL_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`

## Operator Task track

Status: **ISOLATED DESIGN/PREP ONLY — PRODUCTION TASK MUTATIONS OFF**

Old Operator Task V2 must not be reintroduced into the main Apps Script hot path. Any continuation uses its own controlled isolation boundary.

Owner-locked business roadmap remains:

`Operator Task -> Department Invoice + Material Shadow/Parity (Gaber LASER + Wael PRINT) -> Laser + Print Accounting Control -> RP-08`

## RP-06

Status: **CLOSED — RECOVERY COMPLETE**

Final record:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Shared safety invariants

- Sheets / Apps Script authoritative for business writes until an explicitly approved authority cutover.
- frontend Edge Orders Read remains OFF until qualification plus a separate cutover decision.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- no Apps Script Production deploy without separate approval.
- no Integrity flag mutation without a separate approved boundary.
- standalone `v1932-router.gs` must not be added live.
- Operator Task D1 write authority remains OFF/not authorized.
- Department Invoice + Material Shadow/Parity follows Operator Task.
- Laser + Print Accounting Control follows that track before RP-08.
- RP-08 not started.
