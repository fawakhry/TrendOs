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

**PHASE 1 INSTALL PASS — ALL INTEGRITY FLAGS OFF — NO DEPLOYMENT — NEXT: PHASE 2 READ-ONLY RUNTIME QUALIFICATION — RP-07 STILL OPEN**

Newest record:

`TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE1_INSTALL_PASS.md`

Phase 1 verified facts:

- approved candidate checkpoint: `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`;
- containment installed exact: `47d932c76498593063ea6f0289e9c9a663686b0d`;
- Integrity Router installed exact: `34ae925b35fcf8295a8857dfe587cfa26b48b6b8`;
- Press Integrity installed exact: `e63473445a338179ac50f39cb7d3b82424e30af3`;
- Invoice Integrity installed exact: `18dd8783bbf7bf14531bcf7bf7d870d938d82473`;
- `trendosV1932TryRoute_` patched narrowly inside `Code.gs` only;
- whole `Code.gs` replacement did not occur;
- standalone `v1932-router.gs` was not added;
- patched V1932 SHA-256: `891fce66bae761b8cc668fc142f3a2b7bb76053196448451fa1e0f28e74ad534`;
- V1932 definition count after install: `1`;
- containment wrapper definition counts: one each;
- no candidate-induced duplicate symbols;
- legacy duplicates `getRows_`, `updateLine_`, `getDashboard_` remain pre-existing and unchanged;
- Save/Reload succeeded without syntax/load issue;
- all nine Integrity flags remain semantic OFF;
- post-install dependency health: `success=true`, `codeReady=true`, `missing=[]`, `requiredCount=26`, version `TRENDOS_INTEGRITY_ROUTER_V1_20260910_RP07`;
- no deployment/version/trigger/business-data/Registry/D1/Cloudflare/Operator Task/RP-08 mutation;
- Phase 2 was not started in the Phase 1 boundary.

### NEXT ALLOWED STEP

Only:

**RP-07 Phase 2 — READ-ONLY runtime qualification.**

Phase 2 must keep all flags OFF and prove loadability, dependency health, guarded-router decline/fallback behavior, and absence of unintended business mutation. No source/property/deployment/trigger/business-data/Registry/D1/Cloudflare/Operator Task/RP-08 mutation is permitted.

After Phase 2 PASS, RP-07 still requires separate handling of retained live P0 blockers and a fresh final health gate proving `OPEN_CORE_P0_BLOCKERS=0` before closure.

Known retained blockers:

- Attendance post-baseline duplicates;
- Cleaning post-baseline duplicates;
- invoice Drafts for `3839` and `3841`;
- Press Line `3796-01` exact-Line evidence gap.

Until RP-07 closes PASS:

**OPERATOR TASK RUNTIME PROHIBITED — RP-08 PROHIBITED.**

Supporting RP-07 records:

- `TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`

## Operator Task Workflow V2

Status: **OT-00 DESIGN/PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**

Owner-locked roadmap order:

`RP-07 -> Operator Task V2 -> RP-08`

Operator Task V2 is the immediate next production track after RP-07 closes PASS.

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
- all Integrity flags currently semantic OFF.
- no Production deploy without separate approval.
- standalone `v1932-router.gs` must not be added live.
- Operator Task D1 write authority remains OFF/not authorized.
- Operator Task runtime starts only after RP-07 full closure.
- RP-08 not started.
