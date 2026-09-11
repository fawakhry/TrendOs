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

Owner priority lock:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_OWNER_PRIORITY_LOCK.md`

GitHub candidate reference:

`OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

Current status:

**PRODUCT REQUIREMENTS APPROVED — V2 GITHUB CANDIDATE EXISTS — HYBRID CLOUDFLARE DESIGN/PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**

### AUTHORITATIVE ROADMAP ORDER

`CURRENT: RP-07 -> IMMEDIATELY NEXT: Operator Task V2 (OT-01 onward) -> THEN: RP-08 / broader roadmap`

This order is owner-approved and mandatory unless the owner explicitly reprioritizes later. Operator Task V2 is not an optional backlog item after RP-07 and must not be skipped in favor of RP-08.

Architecture direction:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets Task authority initially -> D1 mirror/read support`

Current preparation phase: `OT-00 — Design / Preparation`.

Allowed during OT-00 while RP-07 remains open: GitHub-only design/code/test/CI preparation with all runtime gates OFF. Live Apps Script mutation, production Operator activation, D1 Task write authority, and RP-08 remain prohibited.

## Active RP-07 execution checkpoint — 2026-09-11

الحالة: **RUNTIME PHASE 0B READ-ONLY PASS — READY FOR SEPARATE FLAG DISABLE BOUNDARY — PHASE 1 STILL BLOCKED**

Newest authoritative runtime record:

- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`

Supporting records:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`

Current verified facts:

- RP-06 remains COMPLETE; Registry latest exact 33 mappings remain active; Registry data rows remain `99`.
- RP-07 prevention/containment code candidate remains locked at `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb` with prior CI PASS.
- Runtime Phase 0B directly inspected the real bound Apps Script Head and completed read-only PASS.
- Active deployments: `2`; archived deployments: `153`.
- active Web Apps: Version `155` and Version `113`; no active deployment points to Head.
- current Head is newer than active Version `155`.
- current Script Properties remain:
  - MASTER=true
  - HEALTH=true
  - ORDER_LINE=false
  - ATTENDANCE_CLEANING=false
  - PRESS=false
  - INVOICE=false
  - WHATSAPP=false
  - OPS=false
  - AUTOMATION=false
- HEALTH is the only currently active Integrity family.
- no Integrity business-family mutation is reachable with business-family flags false.
- Health diagnostics/dashboard remain reachable; dashboard refresh may rewrite only the diagnostic Health sheet.
- no Integrity Health scheduled trigger was found.
- current time-based triggers reported are `d1OperationalEnrichmentLiveSyncTick02CR` and `d1OrdersLowUsageTickV1`, with no Health dependency found.
- disabling MASTER + HEALTH is assessed safe from current live source/trigger evidence, but must occur only in a separate explicit owner-approved mutation boundary.
- external Web App callers of Health cannot be ruled out solely from project source/trigger inventory.
- `trendosV1932TryRoute_` remains owned exclusively by `Code.gs`, lines `11868–11906`, SHA-256 `2ae1281c8de6e808de992983f7cf54d6cb6c6cef048d23f2e7913924af7b17aa`.
- no duplicate definitions are present now.
- standalone `v1932-router.gs` must not be added live because it would collide.
- live Router/Press/Invoice blobs still differ from the approved candidate and RP-07 legacy containment functions remain absent.
- live P0 blockers remain: Attendance duplicates, Cleaning duplicates, invoice Drafts for `3839` and `3841`, and Press exact-Line evidence gap for `3796-01`.
- Phase 0B performed no flag, source, deployment, business-data, Registry, D1, Operator Task, or RP-08 mutation.

### NEXT ALLOWED RP-07 STEP

A separate **Flag Disable Boundary** may now be executed only after explicit owner approval.

That boundary must change exactly these two properties from true to false:

- `TRENDOS_INTEGRITY_V1_ENABLED`
- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED`

It must not change code, deployments, triggers, business data, Registry, D1, or Operator Task state.

Immediately after the change, all Integrity properties must be re-read and MASTER+HEALTH must be proven OFF before Phase 1 can even be considered.

Until then:

**PHASE 1 PROHIBITED — DEPLOY PROHIBITED — RP-08 PROHIBITED.**

After flag normalization, RP-07 still requires collision-safe candidate installation/qualification, separate data-remediation decisions, and a fresh final gate proving `OPEN_CORE_P0_BLOCKERS=0` before closure.

Once RP-07 closes PASS, Operator Task V2 is the immediate next production implementation track before RP-08 unless owner explicitly changes priority.

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

الحالة: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — RUNTIME PHASE 0B PASS — CORE GO/NO-GO HOLD ON FLAG NORMALIZATION + LIVE P0**

Evidence retained:

- E2E Run `34111129906`, retry job `101744446892` — SUCCESS;
- authenticated D1 read PASS;
- `__DEBT__` Apps Script fallback PASS;
- Sheets authoritative=true; cutover=false; reconcile OFF; generic drain OFF;
- RP-06 recovery production PASS;
- RP-07 candidate CI PASS;
- RP-07 Runtime Phase 0B PASS.

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
- no Script Property mutation except under a separately approved exact boundary.
- current next RP-07 mutation candidate is MASTER+HEALTH Flag Disable only.
- Operator Task V2 runtime activation waits for RP-07 full closure.
- once RP-07 closes PASS, Operator Task V2 is the immediate next production implementation track before RP-08 unless owner explicitly changes priority.
- Operator Task V2 D1 write authority remains OFF/not authorized.
- RP-08 not started.
- deferred Save Timeout / reconcile work remains deferred by owner unless explicitly reopened.
