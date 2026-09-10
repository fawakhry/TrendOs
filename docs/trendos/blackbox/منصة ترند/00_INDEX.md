# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Active RP-06 execution checkpoint — 2026-09-10

الحالة: **RP-06 RECOVERY COMPLETE — REGISTRY LATEST EXACT 33 MAPPINGS ACTIVE — READY FOR RP-07**

السجل النهائي:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

Current facts:

- Apps Script Head writer exactly matches blob `81e994945af7fefdd38538a7ca569e73483f3d24`;
- Normal Preview33: PASS;
- Recovery Preview33: PASS;
- exact plan hash: `5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab`;
- exact recovery hash: `ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82`;
- owner-authorized temporary setter executed once and was removed before Recovery Write;
- Recovery Write executed once: `recovered=33`, `totalRegistryRows=99`, `sourceSheetsMutated=false`;
- latest exact 33 mappings are active; latest inactive mappings: zero;
- all required numeric-looking Press Entity Keys were read back as actual text strings;
- no new `AUTO_ROLLBACK_RECOVERY`, D1 write, Source Sheet mutation, Deploy, flag change, `Code.gs` edit, main merge, or RP-07 execution occurred.

Owner recording rule from 2026-09-10 remains in force: **any material execution, gate result, decision, blocker, mutation, or explicit no-mutation stop must be recorded in this blackbox before continuing.**

---

## Current roadmap checkpoint — CORE-P0-11

`CORE-P0-11 — Regression / Full E2E / Core GO-NO-GO`

الحالة: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — CORE GO/NO-GO HOLD ON RP-06 REGISTRY RECOVERY**

السجل:

`TRENDOS_BLACKBOX_2026-09-07_CORE_P0_11_REGRESSION_E2E_GO_NOGO.md`

Evidence:

- normal Regression/Integrity Run `34111130037` — SUCCESS؛
- durable read-only E2E workflow: `.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml`؛
- durable no-write contract: `tests/core_p0_11_readonly_gate_contract.test.mjs`؛
- first E2E attempt stopped fail-closed on expired qualification session 401؛
- exact retry of the same run succeeded: Run `34111129906`, retry job `101744446892`؛
- authenticated D1 read PASS؛
- live summary at qualification: pageRows=5, activeTotal=25, activeOrders=25, heatPress=6, heatPressOrders=6؛
- `__DEBT__` => 409 / Apps Script fallback PASS؛
- Sheets authoritative=true؛ cutover=false؛ reconcile OFF؛ generic drain OFF؛
- RP-06 Patch33 CI and live Preview33 previously passed;
- Registry Write auto-rolled back due to confirmed Sheets DATE coercion of Press Entity Keys;
- Recovery Patch CI is now PASS, but fresh live Preview + RecoveryPreview and a separate recovery-write approval remain required;
- no Production deploy/flag activation/D1 mutation occurred.

---

## Operational checkpoint — PERF-CF-02CW

`PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals`

الحالة: **PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md`

- عدادات شاشة القسم تعتمد على `activeSummaryCounts` من كامل الحالات الجارية قبل pagination؛
- الفلتر الافتراضي `الحالات الجارية فقط` + `كل الأولويات`؛
- متابعة المكبس تفضّل `heatPressOrders`؛
- Worker version `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb` @100%؛
- current Production main `2eee80b87a3aeccb5569055bc0544a43b22adcb7`؛
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

Apps Script panel endpoint still requires separate Production approval before any deploy.

---

## Shared safety invariants

- Sheets / Apps Script authoritative.
- eligible Orders reads D1-first with fail-open Apps Script fallback.
- Orders writes remain Apps Script / Sheets.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- Customer Feedback auto scan OFF.
- Go-Live Autopilot auto sweep OFF.
- Trend Master bounded protections retained.
- deferred Save Timeout / reconcile work remains deferred by owner unless explicitly reopened.
