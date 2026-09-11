# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-11

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

Approved first-live architecture:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets Task authority initially -> D1 mirror/read support`

Later, a separate qualified cutover may replace the internal Google authority adapter with D1 while keeping the Cloudflare-facing API/UI stable.

Key invariants remain:

- ordinary backlog hidden from Wael/Gaber server-side;
- system dispatches next ordinary Task: urgent first -> delivery due date ASC -> Order sequence ASC;
- pull/claim starts authoritative timing and moves work to `بدء التنفيذ`;
- `جاهز للاستلام` or `تم التسليم` stops the timer and persists actual duration;
- one active ordinary Task maximum per operator initially;
- Wael: `الطباعة على الطاير` permanently visible and outside Tasks;
- Wael: scoped Press candidate/batching visibility only;
- Gaber/Laser: no Fly Print and no Press capability;
- no uncontrolled Google+D1 dual-authoritative Task writes;
- D1 Task business-write authority remains not authorized;
- standalone GitHub `v1932-router.gs` must not be installed live because live `trendosV1932TryRoute_` is already owned by `Code.gs`.

OT-00 GitHub-only preparation may continue while RP-07 remains open. Runtime activation remains prohibited until RP-07 is fully closed PASS.

---

## Active RP-07 execution state

Status: **RUNTIME PHASE 0B READ-ONLY PASS — READY FOR SEPARATE FLAG DISABLE BOUNDARY — PHASE 1 PROHIBITED UNTIL FLAGS ARE OFF + REVERIFIED**

Newest authoritative runtime checkpoint:

- `TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md`

Supporting prior records:

- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
- `TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md`
- prior live fail evidence: `TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md`

### Phase 0B verified facts

- actual bound Apps Script Head inspected directly: **YES**;
- active deployments: `2`; archived deployments: `153`;
- active Web Apps are Version `155` and Version `113`;
- no active deployment points to Head;
- current Head is newer than Version `155`;
- current properties remain:
  - `TRENDOS_INTEGRITY_V1_ENABLED=true`
  - `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED=true`
  - ORDER_LINE=false
  - ATTENDANCE_CLEANING=false
  - PRESS=false
  - INVOICE=false
  - WHATSAPP=false
  - OPS=false
  - AUTOMATION=false
- live router version: `TRENDOS_INTEGRITY_ROUTER_V1_20260830`;
- HEALTH is the **only active Integrity family**;
- no Integrity business-family mutation is reachable while all business-family flags are false;
- reachable Health surface is diagnostics/dashboard only;
- `trendosIntegrityDashboardV1` can rebuild the diagnostic Health dashboard sheet, so HEALTH is not purely zero-write, but its write is diagnostic-sheet-only, not a business-family mutation;
- no Integrity Health scheduled trigger was found;
- current triggers are `d1OperationalEnrichmentLiveSyncTick02CR` and `d1OrdersLowUsageTickV1`, with no Health dependency found;
- no internal/frontend Health callers were found beyond route definitions;
- absence of external Web App callers cannot be proven from source/trigger inventory alone;
- based on live source + trigger evidence, disabling MASTER + HEALTH is assessed **SAFE in a separate explicit mutation boundary**.

### Routing / ownership verified

- `doGet`: Integrity router -> `trendosV1932TryRoute_` -> older routers -> legacy switch;
- `doPost`: Integrity webhook -> Integrity action router -> `trendosV1932TryRoute_` -> legacy paths;
- family-gate failure returns `null` and legacy/fallback continues;
- live `trendosV1932TryRoute_` owner remains `Code.gs`;
- live boundary: lines `11868–11906`;
- function-text SHA-256: `2ae1281c8de6e808de992983f7cf54d6cb6c6cef048d23f2e7913924af7b17aa`;
- definition count: `1`;
- no duplicate RP-07/Integrity definitions reported in current Head.

### Candidate/runtime mismatches still blocking Phase 1

Approved RP-07 candidate remains qualified at checkpoint `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`, but live Head still differs:

- Router live `3d747b99bb06e4865b9936de2a2d42104b3deccc` vs candidate `34ae925b35fcf8295a8857dfe587cfa26b48b6b8`;
- Press live `99857aacc757e9e80589ba5bcab310d8330e6391` vs candidate `e63473445a338179ac50f39cb7d3b82424e30af3`;
- Invoice live `08128d35fcc0ac1876a8790564cf7377f8869c47` vs candidate `18dd8783bbf7bf14531bcf7bf7d870d938d82473`;
- RP-07 legacy containment functions are absent from live Head;
- candidate containment blob is `47d932c76498593063ea6f0289e9c9a663686b0d`;
- current V1932 logic is embedded in `Code.gs`; standalone candidate blob `151134f2517db2ce38cecec4fea59dd2745e8b59` must not be added as a duplicate file.

### Current RP-07 gate

**Phase 0B = PASS.**

**Next allowed RP-07 mutation, only with a separate explicit owner-approved boundary:** disable exactly:

- `TRENDOS_INTEGRITY_V1_ENABLED`
- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED`

Then immediately re-read all Integrity properties and verify both are OFF before considering Phase 1.

Until that separate boundary is approved/executed and verified:

**PHASE 1 PROHIBITED. APPS SCRIPT SOURCE INSTALL PROHIBITED. DEPLOY PROHIBITED. RP-08 PROHIBITED.**

The Flag Disable Boundary must not change source code, deployments, business data, triggers, Registry, D1, or Operator Task runtime state.

### Remaining live P0 blockers after runtime flag normalization

These remain separate from the flag boundary and must eventually be remediated/rechecked before RP-07 full closure:

- Attendance post-baseline duplicates;
- Cleaning post-baseline duplicates;
- invoice Drafts for Orders `3839` and `3841`;
- Press Line `3796-01` without acceptable exact-Line session evidence.

A fresh final RP-07 gate must eventually prove `OPEN_CORE_P0_BLOCKERS=0` before RP-07 closes PASS.

Immediately after RP-07 full closure, start Operator Task V2 `OT-01` before RP-08, unless the owner explicitly supersedes the priority-lock record.

No runtime mutation occurred in Phase 0B.

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

Status: **REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — RP-06 COMPLETE — RP-07 CODE CANDIDATE PASS — RP-07 RUNTIME PHASE 0B PASS — CORE GO/NO-GO HOLD ON FLAG NORMALIZATION + LIVE P0**

Retained evidence:

- normal Regression/Integrity Run `34111130037` — SUCCESS;
- E2E Run `34111129906`, retry job `101744446892` — SUCCESS;
- authenticated D1 read PASS;
- `__DEBT__` => Apps Script fallback PASS;
- Sheets authoritative=true; cutover=false; reconcile OFF; generic drain OFF;
- RP-06 Patch33 and Recovery Patch CI PASS;
- RP-06 Recovery production execution PASS;
- RP-07 final candidate CI PASS;
- RP-07 Runtime Phase 0B read-only PASS.

### Core GO/NO-GO

**HOLD.**

The next runtime boundary is flag normalization only. Candidate installation and live P0 remediation remain later separate gates.

### Safety boundary

- no Apps Script source change before approved Flag Disable Boundary completes and OFF state is reverified;
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
