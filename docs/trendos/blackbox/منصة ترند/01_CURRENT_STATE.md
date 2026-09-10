# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-10

## Canonical project identity — READ BEFORE EXECUTION

Authoritative locator: `00_PROJECT_LOCATOR.md`

- Production Google Sheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Working branch: `agent/go-live-2026-09-01-integrity`
- Blackbox root: `docs/trendos/blackbox/منصة ترند/`

Any new chat/session must read `00_PROJECT_LOCATOR.md` first. Do not substitute a BACKUP/STAGING workbook and do not use the workbook tab `سكريبت Apps Script` as live Head authority.

## Owner-prioritized Operator Task Workflow V2 — OT-00 DESIGN/PREP ACTIVE

Status: **REQUIREMENTS APPROVED — GITHUB V2 CANDIDATE EXISTS — HYBRID CLOUDFLARE DESIGN/PREP ACTIVE — RUNTIME NOT DEPLOYED / NOT ENABLED**

Authoritative records:

- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`
- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`
- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_OWNER_PRIORITY_LOCK.md`
- root candidate reference: `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

### OWNER-LOCKED ROADMAP ORDER

`CURRENT: RP-07 -> IMMEDIATELY NEXT: Operator Task V2 (OT-01 onward) -> THEN: RP-08 / broader roadmap`

This is the current owner-approved mandatory execution order. After RP-07 reaches full PASS, Operator Task V2 is the next production implementation track and must not be skipped in favor of RP-08 unless the owner explicitly changes priority later.

The feature does **not** wait for the entire Cloudflare migration, but runtime activation is blocked until RP-07 is fully closed and a fresh gate proves the required zero-blocker state.

Approved first-live architecture:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets Task authority initially -> D1 mirror/read support`

Later, a separate qualified cutover may replace the internal Google authority adapter with D1 while keeping the Cloudflare-facing API/UI stable.

Key invariants:

- ordinary backlog hidden from Wael/Gaber server-side;
- system dispatches next ordinary Task: urgent first -> delivery due date ASC -> Order sequence ASC;
- pull/claim starts the authoritative timer immediately and moves the work to `بدء التنفيذ`;
- `جاهز للاستلام` or `تم التسليم` stops the timer and persists actual duration;
- initial rule: one active ordinary Task maximum per operator;
- Wael: `الطباعة على الطاير` permanently visible and fully outside Tasks;
- Wael: scoped Press candidate/batching visibility only;
- Gaber/Laser: no Fly Print and no Press capability;
- no uncontrolled Google+D1 dual-authoritative Task writes;
- D1 Task business-write authority remains not authorized;
- current standalone GitHub `v1932-router.gs` must not be installed live because live `trendosV1932TryRoute_` is already owned by `Code.gs`.

Current allowed work during `OT-00`:

- GitHub-only architecture/code/test/CI preparation;
- Cloudflare route/gate/adapter preparation while inert and not deployed;
- frontend transport preparation while disabled;
- blackbox updates.

Current prohibited Operator actions:

- no live Apps Script Operator install;
- no Operator production deploy/activation;
- no Operator feature flag/property change;
- no D1 Task write-authority cutover;
- no source business mutation as part of preparation.

The next Operator runtime stage is `OT-01 — Runtime install, inert`, and it becomes the immediate next production implementation after RP-07 full closure, under a separate explicit owner-approved runtime boundary.

---

## Active RP-07 execution state

Status: **RP-07 CODE CANDIDATE PASS — DIRECT RUNTIME PHASE 0 FOUND LIVE PROJECT — ACTIVE FLAG + BLOB/COLLISION MISMATCH — SESSION PAUSED AT PHASE 0B — HOLD BEFORE PHASE 1 / RP-08**

Current records:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_WORK_LIMIT_STOP_CHECKPOINT.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_LIVE_INVENTORY_BLOCKED.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- prior live fail evidence: `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`

Current facts:

- RP-06 remains COMPLETE; Registry latest exact 33 mappings remain active and final Registry data-row count remains 99.
- RP-07 prevention/containment code is qualified at candidate checkpoint `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`.
- Final candidate composition evidence remains green: RP-07 Remediation Containment CI Run `34490458581` SUCCESS and normal Integrity CI Run `34490458493` SUCCESS.
- Direct ChatGPT Work read-only inspection found the actual live Apps Script project and exact file list.
- `trendosV1932TryRoute_` has one live definition owned by `Code.gs` at line 11868.
- No duplicate RP-07/Integrity definitions were reported in current Head.
- Current Script Properties are **not all OFF**: `TRENDOS_INTEGRITY_V1_ENABLED=true` and `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED=true`; all business-family flags reported false.
- Live router version reported `TRENDOS_INTEGRITY_ROUTER_V1_20260830`.
- Existing live Router/Press/Invoice blobs do not match the RP-07 candidate blobs.
- Live blobs reported: Router `3d747b99bb06e4865b9936de2a2d42104b3deccc`; Press `99857aacc757e9e80589ba5bcab310d8330e6391`; Invoice `08128d35fcc0ac1876a8790564cf7377f8869c47`.
- RP-07 containment functions `trendosRp07LegacyAttendanceV1_`, `trendosRp07LegacyAttendanceClockinV1_`, and `trendosRp07LegacyCleaningV1_` are absent from live Head.
- Standalone `v1932-router.gs` installation is prohibited because it would duplicate the current `trendosV1932TryRoute_` in `Code.gs`.
- Deployment/version inventory was not inspected because the Work run stopped immediately on the active-flag mismatch per fail-closed instruction.
- ChatGPT Work usage limit was then reached before Phase 0B could be performed. This is an operational pause only; no runtime action is pending or partially applied.
- Exact continuation point is **Runtime Phase 0B READ ONLY**. Do not repeat RP-06, RP-07 code qualification, or Runtime Phase 0 unless newer evidence invalidates them.
- The existing live P0 data blockers remain unresolved: post-baseline Attendance duplicates, post-baseline Cleaning duplicates, closed/delivered Orders `3839` and `3841` with surviving invoice Drafts, and Press line `3796-01` without acceptable exact-Line session evidence.
- No Apps Script Head change, Production deploy, feature-flag change, Script Property mutation, Source Sheet business-data mutation, Health sheet rewrite, Registry mutation, D1 mutation, main merge, or RP-08 execution occurred.

Owner rule effective 2026-09-10 remains active: every material execution step, gate result, decision, blocker, mutation, and explicit no-mutation stop must be recorded in the blackbox before continuing.

### Current RP-07 safety boundary

**RP-07 HOLD. SESSION PAUSED. PHASE 1 PROHIBITED. RP-08 PROHIBITED.**

The next allowed RP-07 action when ChatGPT Work becomes available again is **Runtime Phase 0B READ ONLY** to complete deployment/version inventory and prove the exact runtime impact of `master=true` + `HEALTH=true`. Do not change either property during Phase 0B.

Only after Phase 0B can a separate explicit owner-approved mutation boundary be considered to disable the active Integrity properties if proven safe. Phase 1 Head installation remains blocked until that state is resolved and re-verified.

A fresh RP-07 gate must eventually prove `OPEN_CORE_P0_BLOCKERS=0` before RP-07 closure. Immediately after that closure, start Operator Task V2 `OT-01` before RP-08, unless the owner explicitly supersedes the priority-lock record.

---

## RP-06 — CLOSED

Status: **RP-06 RECOVERY COMPLETE — REGISTRY LATEST EXACT 33 MAPPINGS ACTIVE**

Final record: `TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

- Apps Script Head writer exact blob: `81e994945af7fefdd38538a7ca569e73483f3d24`.
- Normal Preview33 PASS.
- Recovery Preview33 PASS.
- Recovery Write PASS exactly once.
- `recovered=33`, `totalRegistryRows=99`, `sourceSheetsMutated=false`.
- Latest exact mappings: 33 active / 0 inactive.
- Required Press Entity Keys stored as real text strings.
- New `AUTO_ROLLBACK_RECOVERY`: zero.

RP-06 must not be rerun merely because RP-07 found new post-baseline operational failures.

---

## Current roadmap checkpoint — CORE-P0-11

`CORE-P0-11 — Regression / Full E2E / Core GO-NO-GO`

Status: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — CORE GO/NO-GO HOLD ON LIVE P0 + RUNTIME PHASE0 STATE MISMATCH**

Retained evidence:

- normal Regression/Integrity Run `34111130037` — SUCCESS;
- E2E Run `34111129906`, retry job `101744446892` — SUCCESS;
- authenticated D1 read PASS;
- `__DEBT__` => Apps Script fallback PASS;
- Sheets authoritative=true; cutover=false; reconcile OFF; generic drain OFF;
- RP-06 Patch33 and Recovery Patch CI PASS;
- RP-06 Recovery production execution PASS;
- RP-07 final candidate CI PASS.

### Core GO/NO-GO

**HOLD.**

The RP-07 code candidate is qualified, but Runtime Phase 0 proves active Integrity property state and live candidate/blob mismatches that must be resolved before installation. Existing live P0 data failures also remain unresolved.

### Safety boundary

- no Apps Script Production deploy;
- no Registry mutation or writer retry;
- no D1 business-data write/migration;
- no `EDGE_SESSION_SECRET` rotation/change;
- Orders writes remain Apps Script / Sheets;
- eligible reads remain D1-first with Apps Script fallback;
- `__DEBT__` remains Apps Script;
- 02CL/reconcile OFF;
- generic drain OFF;
- no business-family activation;
- no active Integrity property mutation without a separate explicit owner-approved boundary;
- Operator Task OT-00 may continue GitHub-only preparation but cannot activate runtime before RP-07 closure;
- after RP-07 closure, Operator Task V2 is the immediate next production track before RP-08 unless owner explicitly changes priority;
- RP-08 not started;
- Save Timeout/reconcile remains `DEFERRED_BY_OWNER`.

---

## Operational checkpoint — PERF-CF-02CW

Status: **PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

Current Worker `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb` @100%; current Production main `2eee80b87a3aeccb5569055bc0544a43b22adcb7`; app cache-bust `trendos-02cw-globalcounts-hotfix-20260906e`.

---

## PERF-CF-02CV — CLOSED

Status: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

---

## PERF-CF-02CU — CLOSED

Status: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

---

## Trend Master V1931 — separate track

Status: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

Any Apps Script Production deployment still requires separate approval.
