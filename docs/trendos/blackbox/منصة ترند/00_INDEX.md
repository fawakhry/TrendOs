# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Active RP-07 execution checkpoint — 2026-09-10

الحالة: **RP-07 CODE CANDIDATE PASS — RUNTIME PHASE 0 PARTIAL — DIRECT APPS SCRIPT INVENTORY BLOCKED — HOLD BEFORE PHASE 1 / RP-08**

السجلات الحالية:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_LIVE_INVENTORY_BLOCKED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_START.md`

Current facts:

- RP-06 remains COMPLETE; Registry latest exact 33 mappings remain active; Registry data rows remain `99`.
- RP-07 prevention/containment code candidate is locked at `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`.
- final candidate CI is green: RP-07 Remediation Containment Run `34490458581` SUCCESS and normal Integrity Run `34490458493` SUCCESS.
- Runtime Phase 0 was started read-only.
- the connected production workbook is accessible and contains the expected operational tabs plus a stored `سكريبت Apps Script` tab.
- the connected Drive surface exposes no native Apps Script project files (`application/vnd.google-apps.script` searches returned zero results).
- the stored `سكريبت Apps Script` tab is stale/incomplete and is not accepted as live Head authority: it contains an older `trendosV1932TryRoute_` but lacks current Integrity/RP-06 Recovery symbols that are known to exist in the actual runtime history.
- exact live Apps Script file ownership, duplicate-symbol collision checks, Integrity Script Property states, and deployment/version state therefore remain unproven.
- Phase 1 Head installation is fail-closed BLOCKED until direct Apps Script project evidence is available.
- live P0 blockers remain: Attendance duplicates, Cleaning duplicates, invoice Drafts for delivered Orders `3839` and `3841`, and Press exact-Line evidence gap for `3796-01`.
- all business-family flags remain unactivated by this work; no runtime mutation, deploy, Source Sheet business-data write, Registry write, D1 write, `Code.gs` edit, main merge, or RP-08 execution occurred.

Owner recording rule remains in force: every material execution step, gate result, decision, blocker, mutation, and explicit no-mutation stop must be recorded in this blackbox before continuing.

---

## RP-06 — CLOSED

الحالة: **RP-06 RECOVERY COMPLETE — REGISTRY LATEST EXACT 33 MAPPINGS ACTIVE**

السجل النهائي: `TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

- Recovery Write PASS exactly once;
- `recovered=33`, `totalRegistryRows=99`, `sourceSheetsMutated=false`;
- latest exact 33 mappings active / zero inactive;
- required Press Entity Keys stored as actual strings;
- no new recovery auto-rollback.

---

## Current roadmap checkpoint — CORE-P0-11

الحالة: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — CORE GO/NO-GO HOLD ON LIVE P0 + RUNTIME PHASE0 BLOCKER**

Evidence retained:

- E2E Run `34111129906`, retry job `101744446892` — SUCCESS;
- authenticated D1 read PASS;
- `__DEBT__` Apps Script fallback PASS;
- Sheets authoritative=true; cutover=false; reconcile OFF; generic drain OFF;
- RP-06 recovery production PASS;
- RP-07 candidate CI PASS.

**Next allowed step:** acquire the missing actual Apps Script project inventory read-only. Do not install Head code or activate a family until that inventory proves exact ownership/collision state and all Integrity property states.

---

## Operational checkpoint — PERF-CF-02CW

الحالة: **PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

---

## PERF-CF-02CV — CLOSED

الحالة: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

---

## PERF-CF-02CU — CLOSED

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

---

## Trend Master V1931 — separate track

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

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
- deferred Save Timeout / reconcile work remains deferred by owner unless explicitly reopened.
