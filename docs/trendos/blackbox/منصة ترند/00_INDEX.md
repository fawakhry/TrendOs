# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**.

## READ FIRST — Canonical Project Identity

قبل أي تنفيذ جديد اقرأ أولًا:

`00_PROJECT_LOCATOR.md`

Canonical production identities:

- Production Google Sheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Working branch: `agent/go-live-2026-09-01-integrity`

Startup order for every new chat/session:

1. `00_PROJECT_LOCATOR.md`
2. `00_INDEX.md`
3. `01_CURRENT_STATE.md`
4. current checkpoint records referenced by `01_CURRENT_STATE.md`

Do not substitute any BACKUP/STAGING workbook, and do not treat the workbook tab `سكريبت Apps Script` as live Apps Script Head authority.

## Owner-prioritized Operator Task Workflow V2

Authoritative requirements:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

Canonical architecture / rollout design:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`

GitHub candidate reference:

`OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

Current status:

**PRODUCT REQUIREMENTS APPROVED — V2 GITHUB CANDIDATE EXISTS — HYBRID CLOUDFLARE DESIGN/PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**

Roadmap placement approved by owner:

`Finish RP-07 PASS -> Operator Task V2 runtime rollout/validation -> resume RP-08 / broader roadmap`

Operator Task V2 does not need to wait for the full Cloudflare migration, but it must not be activated while RP-07 remains unresolved.

Architecture direction:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets Task authority initially -> D1 mirror/read support`

Later, under a separate qualified D1 write cutover, the internal Task authority can move to D1 without changing the operator-facing API.

Non-negotiable operator behavior:

- ordinary production backlog is not freely browsable/selectable by Wael/Gaber;
- ordinary work is delivered as server-controlled Tasks;
- dispatch order: urgent first -> delivery due date ASC -> Order sequence ASC;
- pulling a Task starts authoritative timing and moves it to `بدء التنفيذ`;
- completion at `تم التسليم` or `جاهز للاستلام` records actual elapsed time;
- Wael/Printing keeps `الطباعة على الطاير` permanently visible **outside Tasks**;
- Wael gets a scoped Press batching view only;
- Gaber/Laser gets neither Press nor `الطباعة على الطاير`;
- no uncontrolled Google+D1 dual-authoritative Task writes;
- current GitHub standalone `v1932-router.gs` must not be installed live because Runtime Phase 0 proved `trendosV1932TryRoute_` already exists inside live `Code.gs`.

Current preparation phase: `OT-00 — Design / Preparation`.

Allowed during OT-00 while RP-07 remains open: GitHub-only design/code/test/CI preparation with all runtime gates OFF. Live Apps Script mutation, production Operator activation, D1 Task write authority, and RP-08 remain prohibited.

## Active RP-07 execution checkpoint — 2026-09-10

الحالة: **RP-07 CODE CANDIDATE PASS — DIRECT RUNTIME PHASE 0 FOUND LIVE PROJECT — ACTIVE FLAG + BLOB/COLLISION MISMATCH — SESSION PAUSED AT PHASE 0B — HOLD BEFORE PHASE 1 / RP-08**

السجلات الحالية:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_WORK_LIMIT_STOP_CHECKPOINT.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_LIVE_INVENTORY_BLOCKED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_START.md`

Current facts:

- RP-06 remains COMPLETE; Registry latest exact 33 mappings remain active; Registry data rows remain `99`.
- RP-07 prevention/containment code candidate is locked at `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`.
- final candidate CI is green: RP-07 Remediation Containment Run `34490458581` SUCCESS and normal Integrity Run `34490458493` SUCCESS.
- Direct ChatGPT Work inspection found the actual live Apps Script project.
- live owner of `trendosV1932TryRoute_`: `Code.gs` line 11868, one definition only.
- active property mismatch: `TRENDOS_INTEGRITY_V1_ENABLED=true` and `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED=true`; business-family flags reported false.
- live router version: `TRENDOS_INTEGRITY_ROUTER_V1_20260830`.
- live Router/Press/Invoice blobs differ from the qualified RP-07 candidate blobs.
- RP-07 legacy containment functions are not present in live Head.
- standalone `v1932-router.gs` would collide with the existing `Code.gs` definition and must not be installed.
- deployment/version inventory remains incomplete because the Work pass stopped fail-closed on the active flags.
- ChatGPT Work usage limit was reached before Phase 0B; this is an operational pause only and no runtime action is partially applied.
- live P0 blockers remain: Attendance duplicates, Cleaning duplicates, invoice Drafts for delivered Orders `3839` and `3841`, and Press exact-Line evidence gap for `3796-01`.
- no Apps Script Head mutation, Save, Deploy, Script Property mutation, Source Sheet write, Registry write, D1 write, `Code.gs` edit, main merge, or RP-08 occurred.

**Next allowed RP-07 step:** Runtime Phase 0B READ ONLY — inspect deployment/version inventory and exact runtime exposure of the currently active master+HEALTH flags. Do not change those flags in Phase 0B.

Only after that evidence may a separate explicit owner-approved mutation boundary be considered for disabling the two active properties before Phase 1.

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

الحالة: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — CORE GO/NO-GO HOLD ON LIVE P0 + RUNTIME PHASE0 STATE MISMATCH**

Evidence retained:

- E2E Run `34111129906`, retry job `101744446892` — SUCCESS;
- authenticated D1 read PASS;
- `__DEBT__` Apps Script fallback PASS;
- Sheets authoritative=true; cutover=false; reconcile OFF; generic drain OFF;
- RP-06 recovery production PASS;
- RP-07 candidate CI PASS.

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
- no business-family activation.
- no Script Property mutation without a separate approved boundary.
- Operator Task V2 runtime activation waits for RP-07 full closure.
- Operator Task V2 D1 write authority remains OFF/not authorized.
- RP-08 not started and is sequenced after the owner-prioritized Operator Task rollout unless reprioritized.
- deferred Save Timeout / reconcile work remains deferred by owner unless explicitly reopened.
