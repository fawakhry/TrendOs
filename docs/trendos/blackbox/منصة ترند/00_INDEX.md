# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Active RP-07 execution checkpoint — 2026-09-10

الحالة: **RP-07 REMEDIATION CODE CANDIDATE PASS — RUNTIME DEPLOYMENT BOUNDARY PREPARED — LIVE P0 DATA BLOCKERS REMAIN — HOLD BEFORE RUNTIME / RP-08**

السجلات الحالية:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- live fail evidence: `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`
- start record: `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_START.md`

Current facts:

- RP-06 remains COMPLETE; Registry latest exact 33 mappings remain active; Registry data rows remain `99`.
- the stored `إدارة - صحة النظام` tab is stale from 2026-09-01 and is not accepted as a fresh RP-07 result;
- bounded live source inspection proved new post-baseline P0 failures in Attendance, Cleaning, Invoice Draft lifecycle, and Press exact-Line traceability;
- Attendance: 9 new unacknowledged duplicate employee/day groups, minimum unresolved excess `10`;
- Cleaning: 12 new unacknowledged duplicate employee/day groups, minimum unresolved excess `30`;
- `CLOSED_ORDERS_WITH_DRAFT` is confirmed non-zero for Orders `3839` and `3841`;
- `PRESS_COMPLETED_WITHOUT_SESSION` is confirmed non-zero for `3796-01` under the current exact-Line session contract;
- the old stored `INVALID_LINE_IDS=229` snapshot is obsolete under the display-value remediation adapter;
- RP-07 prevention/containment code candidate is locked at `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`;
- final CI composition is green: RP-07 Remediation Containment Run `34490458581` SUCCESS and normal Integrity Run `34490458493` SUCCESS;
- candidate code covers Attendance/Cleaning serialization, guarded legacy-action aliases into Integrity, Press exact-Line completion, and prevention of new/renewed Invoice Draft preparation for delivered/closed orders;
- `Code.gs` remains untouched;
- runtime deployment is **not executed** and all business-family flags remain OFF;
- exact live Apps Script source inventory/collision detection is mandatory before any Head install; do not blindly add `v1932-router.gs` if `trendosV1932TryRoute_` is already defined in another live file;
- existing P0 data remediation remains separate and unapproved;
- RP-08 was not started;
- no Source Sheet business-data mutation, Health sheet rewrite, Registry mutation, D1 write, Deploy, `Code.gs` edit, or main merge occurred in this checkpoint.

Owner recording rule from 2026-09-10 remains in force: **any material execution, gate result, decision, blocker, mutation, or explicit no-mutation stop must be recorded in this blackbox before continuing.**

---

## RP-06 — CLOSED

الحالة: **RP-06 RECOVERY COMPLETE — REGISTRY LATEST EXACT 33 MAPPINGS ACTIVE**

السجل النهائي:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

- Apps Script Head writer exact blob `81e994945af7fefdd38538a7ca569e73483f3d24`;
- Normal Preview33 PASS;
- Recovery Preview33 PASS;
- Recovery Write PASS exactly once;
- `recovered=33`, `totalRegistryRows=99`, `sourceSheetsMutated=false`;
- latest exact 33 mappings active / zero inactive;
- required Press Entity Keys stored as actual strings;
- no new recovery auto-rollback.

RP-06 is not reopened by the new RP-07 operational failures.

---

## Current roadmap checkpoint — CORE-P0-11

`CORE-P0-11 — Regression / Full E2E / Core GO-NO-GO`

الحالة: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — CORE GO/NO-GO HOLD ON LIVE P0 BLOCKERS**

Evidence retained:

- normal Regression/Integrity Run `34111130037` — SUCCESS؛
- durable read-only E2E workflow `.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml`؛
- E2E Run `34111129906`, retry job `101744446892` — SUCCESS؛
- authenticated D1 read PASS؛
- `__DEBT__` => 409 / Apps Script fallback PASS؛
- Sheets authoritative=true؛ cutover=false؛ reconcile OFF؛ generic drain OFF؛
- RP-06 Patch33 and Recovery Patch CI PASS؛
- RP-06 Recovery production execution PASS؛
- RP-07 final candidate CI PASS؛
- RP-07 runtime/data health remains HOLD until installation/activation/data-remediation evidence plus fresh `OPEN_CORE_P0_BLOCKERS=0`.

---

## Operational checkpoint — PERF-CF-02CW

`PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals`

الحالة: **PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md`

- Worker `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb` @100%;
- Production main `2eee80b87a3aeccb5569055bc0544a43b22adcb7`;
- app cache-bust `trendos-02cw-globalcounts-hotfix-20260906e`.

**02CW is not recorded as User-Visible PASS until the user explicitly validates the final live behavior.**

---

## PERF-CF-02CV — CLOSED

الحالة: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

---

## PERF-CF-02CU — CLOSED

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

User confirmation: `ثبت`

---

## Trend Master V1931 — separate track

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

Record:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate commit: `03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

---

## Shared safety invariants

- Sheets / Apps Script authoritative for writes.
- eligible Orders reads D1-first with Apps Script fallback.
- Orders writes remain Apps Script / Sheets.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- business-family flags remain OFF.
- RP-08 not started.
- Customer Feedback auto scan OFF.
- Go-Live Autopilot auto sweep OFF.
- Trend Master bounded protections retained.
- deferred Save Timeout / reconcile work remains deferred by owner unless explicitly reopened.
