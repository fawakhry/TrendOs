# TrendOS Blackbox — Operator Task Workflow V2 — Hybrid Cloudflare Design / Preparation

Date: 2026-09-10
Status: **OWNER-APPROVED ARCHITECTURE DIRECTION — DESIGN/PREP ACTIVE — CODE CANDIDATE EXISTS — NOT DEPLOYED / NOT ENABLED**
Scope: Wael/Printing + Gaber/Laser operator task workflow integration into the current TrendOS production architecture.

This record defines the approved placement, authority model, API contract direction, rollout order, and safety gates for Operator Task Workflow V2. It does **not** authorize any live Apps Script edit, Cloudflare production deploy, Script Property mutation, D1 business-write cutover, Source Sheet mutation, Registry mutation, `main` merge, or RP-08.

Authoritative requirements:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

Current GitHub candidate:

`OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

Current candidate files:

- `operator-task-workflow-v2.gs`
- `operator-task-workflow-v2.js`
- `tests/operator_task_workflow_v2_contract.test.mjs`
- `.github/workflows/trendos-operator-task-workflow-v2-ci.yml`

The current candidate is GitHub-only and remains inert/not deployed.

---

## 1. Owner-approved placement in the roadmap

Operator Task Workflow V2 is now an **owner-prioritized insertion immediately after RP-07 is fully closed PASS**.

Approved order:

1. finish current `RP-07` runtime qualification/remediation path;
2. prove the final fresh RP-07 gate required for closure, including `OPEN_CORE_P0_BLOCKERS=0`;
3. execute a separate Operator Task runtime boundary and rollout;
4. validate Wael/Printing and Gaber/Laser in production;
5. only then continue the broader roadmap / `RP-08` unless the owner explicitly changes priority again.

Therefore Operator Task V2 does **not** need to wait for the entire Cloudflare migration or for all future RP stages. It also must **not** be activated on top of the unresolved RP-07 runtime state.

Current state while RP-07 remains open:

**DESIGN + CODE PREPARATION MAY CONTINUE IN GITHUB. RUNTIME ACTIVATION IS PROHIBITED.**

---

## 2. Approved architecture — Cloudflare-facing UI/API, Google write authority first

The intended first production architecture is hybrid:

`Operator browser -> TrendOS Cloudflare frontend/API -> Apps Script/Sheets authoritative Task write adapter -> D1 mirror/read path`

Key rule:

**There must be one business-write authority for a Task transition at a time.**

During the first Operator Task rollout:

- the employee-facing surface should be Cloudflare-facing / TrendOS web UI;
- Cloudflare Worker should expose the stable Operator Task API surface;
- authoritative Task mutations remain in the current Google Apps Script / Sheets authority initially;
- D1 may be used only for qualified reads/mirror/shadow data where freshness is proven;
- no button may independently write the same Task transition to both Google and D1;
- no client-side dual write is allowed;
- no D1 Task write authority is enabled merely because Cloudflare is the user-facing API.

This preserves the current TrendOS authority model while avoiding a second UI/backend rewrite later.

Long-term cutover:

`Cloudflare UI/API -> D1 authoritative Task engine`

The frontend/API contract should remain stable when the internal authority adapter changes from Google to D1.

---

## 3. Adapter boundary

The Worker-facing task service must be designed around a replaceable authority adapter.

### Phase A — initial live authority: `GoogleTaskAuthorityAdapter`

Responsibilities:

- resolve the next eligible Task from authoritative Google data;
- claim/start under the strongest available server-side lock and current Apps Script project rules;
- persist server timestamps;
- persist the Task ledger row;
- update the authoritative Order/Line execution state;
- complete the Task idempotently;
- return exact Task/Order/Line evidence.

### Phase B — later Cloudflare cutover: `D1TaskAuthorityAdapter`

Responsibilities must preserve the same external contract and state machine while changing the persistence/transaction layer to D1.

The browser must not need to know which adapter is authoritative.

---

## 4. Stable Cloudflare API contract direction

The following route family is reserved for Operator Task V2 implementation:

- `GET /v1/operator/tasks/status`
- `POST /v1/operator/tasks/claim-next`
- `POST /v1/operator/tasks/complete`
- `GET /v1/operator/fly-print`
- `GET /v1/operator/press-candidates`
- `GET /v1/operator/tasks/metrics`

### Status
Returns authenticated role/capabilities, current active Task, authoritative persisted start time, and safe exception/availability metadata. It must **not** return the ordinary selectable backlog to Wael/Gaber.

### Claim-next
Server-authoritative mutation. It must authenticate operator identity server-side, enforce one active ordinary Task initially, select by `Urgent first -> Delivery Due Date ASC -> Order Sequence ASC -> Line ID tie-break`, exclude invalid due-date rows into exception handling, claim+start as one logical operation, persist the start timestamp, move source state to `بدء التنفيذ`, return exact Task/Order/Line identity, and enforce idempotency. The client cannot choose an arbitrary ordinary Order.

### Complete
Allowed initial business final states are `جاهز للاستلام` and `تم التسليم`. Completion must validate Task/operator/state, use a server completion timestamp, derive actual duration from persisted timestamps, and be idempotent.

### Fly Print
Wael only. `الطباعة على الطاير` is outside Tasks and permanently visible to Wael. It must not claim a Task, start the ordinary Task timer, consume/reorder the ordinary queue, or expose unrelated backlog. Gaber has no capability for this lane.

### Press candidates
Wael only. Read/batching visibility only for Press-bearing Orders/Lines, preserving exact Line IDs. It must never become a general ordinary-work browser and must not weaken RP-07 Press exact-Line evidence rules.

### Metrics
Manager-only reporting based on persisted task evidence: completed Tasks, unique Orders, total actual work seconds, average duration, and operator/date/department breakdown.

---

## 5. Role capability matrix

### Wael / Printing

- ordinary backlog browser: **DENY**
- system claim-next: **ALLOW**
- one active ordinary Task: **YES initially**
- authoritative timer/status: **ALLOW**
- approved completion actions: **ALLOW subject to runtime validation**
- always-visible Fly Print lane: **ALLOW**
- Fly Print inside Task dispatcher: **DENY**
- Press candidate batching view: **ALLOW**
- unrelated backlog through Press: **DENY**

### Gaber / Laser

- ordinary backlog browser: **DENY**
- system claim-next: **ALLOW**
- one active ordinary Task: **YES initially**
- authoritative timer/status: **ALLOW**
- approved completion actions: **ALLOW subject to runtime validation**
- Fly Print: **DENY**
- Press candidates/actions: **DENY**

### Manager

- Task metrics: **ALLOW**
- exception visibility: **ALLOW**
- override/reassignment: **NOT YET AUTHORIZED / separate design**

All capability enforcement must be server-side. UI hiding alone is insufficient.

---

## 6. Initial state machine and timer authority

Initial ordinary Task state machine:

`UNASSIGNED -> RUNNING -> COMPLETED`

Claim-next performs `UNASSIGNED -> RUNNING` and starts timing in the same logical operation.

`COMPLETED` stores one approved final business status: `جاهز للاستلام` or `تم التسليم`.

There is no operator Pause/Resume/Reassign state in the initial rollout.

The browser timer is display-only. Authoritative values are server-persisted `claimed_at`, `started_at`, `completed_at`, and `work_sec`. Refresh/reconnect must reconstruct elapsed time from persisted `started_at`; closing the browser must not reset timing.

---

## 7. Idempotency and concurrency invariants

- double-click/retry on claim-next cannot assign two Tasks;
- one operator cannot hold two initial-version active ordinary Tasks;
- one Line cannot be actively claimed by two operators;
- repeated identical completion returns the already-completed result where appropriate;
- conflicting state transitions fail closed;
- exact Task ID / Line ID / Order ID evidence is preserved;
- Worker must not implement an independent competing Task state machine while Google remains authoritative.

---

## 8. Read strategy during the hybrid period

### Must read/verify against Google authority initially

- current active Task;
- claim eligibility at mutation time;
- completion state;
- authoritative timer timestamps;
- any read whose staleness could authorize a wrong mutation.

### D1-first is allowed only when freshness and field completeness are proven

- non-mutating display/supporting data;
- Fly Print display;
- Press candidate display with exact Line IDs;
- historical manager metrics after parity is proven.

If freshness is not proven, fallback must be Google or fail closed according to operation criticality. Stale D1 data must never authorize a Task mutation.

---

## 9. Existing Apps Script routing constraint

Runtime Phase 0 proved the live owner of `trendosV1932TryRoute_` is inside live `Code.gs`, one definition only.

Therefore:

**DO NOT install the GitHub standalone `v1932-router.gs` as a second live file.**

When Operator Task runtime installation is authorized after RP-07, use a fresh live inventory and an exact-owner integration strategy. Current preferred plan:

- exact-verify and install/update the dedicated `operator-task-workflow-v2.gs` module;
- patch only the exact existing routing owner boundary if still required;
- do not replace/rebuild full `Code.gs` from GitHub;
- record exact pre/post boundary/hash;
- keep all Operator Task activation gates OFF during installation/qualification;
- production deploy requires its own owner-approved Operator Task boundary.

If a safer existing router extension point is found in the fresh post-RP-07 inventory, use it instead of editing `Code.gs`.

---

## 10. Activation gates

Current candidate activation controls include:

- Apps Script backend property: `TRENDOS_OPERATOR_TASK_V2_ENABLED=true`
- frontend candidate flag: `window.MATBAGY_OPERATOR_TASK_V2=true`

The hybrid Worker implementation must add its own fail-closed Operator Task route gate before production exposure. Exact env name is to be fixed in code/CI before deployment.

Required activation order:

1. install code inert;
2. verify exact files/routes/loadability;
3. backend Task flag OFF;
4. Worker Operator Task gate OFF;
5. frontend exposure OFF;
6. read-only smoke checks PASS;
7. separate owner approval for canary;
8. smallest safe canary enabled;
9. validate exact live write/evidence;
10. expand only after PASS.

No deployment may silently enable the feature.

---

## 11. Rollout order

### OT-00 — Design / preparation — **ACTIVE NOW**
Allowed: architecture/spec, GitHub-only preparation, tests/CI, Worker gate/adapter preparation while not deployed, disabled UI preparation, blackbox updates.

Forbidden: live Apps Script mutation, Operator production activation, D1 Task write authority, Source Sheet business mutation, RP-08.

### RP-07 — current blocking gate
Must be fully closed PASS first.

### OT-01 — Runtime install, inert
After RP-07 closure and separate approval: fresh live inventory, exact candidate verification, collision-safe module/route install, all Operator Task gates OFF.

### OT-02 — Cloudflare façade qualification
Worker routes behind OFF gate; authentication/capability enforcement; Worker -> Google authority adapter; no D1 Task authority; no dual write; fail-closed/fallback tests.

### OT-03 — Wael canary
Prove hidden ordinary backlog, server dispatch order, timer evidence, Fly Print always visible/outside Tasks, scoped Press view.

### OT-04 — Gaber canary
Prove Laser-only Tasks, no Press, no Fly Print, correct timer/completion evidence.

### OT-05 — Metrics / stabilization
Throughput/time reporting, exception visibility, rollback evidence, operational validation.

### OT-06 — D1 authority migration — **LATER**
Only after broader Cloudflare write-cutover prerequisites: D1 transaction schema, parity/reconciliation, controlled adapter switch, never uncontrolled dual-authoritative writes, then retire Google Task authority after verified cutover.

---

## 12. Future D1 schema direction

Later D1 authority should preserve two concepts without changing the external API:

### `operator_tasks_v2`
Logical minimum: task_id, line_id, order_id, operator_id, department, state, priority, expected_delivery, claimed_at, started_at, completed_at, work_sec, final_status, created_at, updated_at.

### `operator_task_events_v2`
Append/audit evidence: event_id, task_id, event_type, actor/operator, at, idempotency_key, authority_source, payload/evidence.

Exact D1 migration is **not authorized now**; this is recorded to prevent later API redesign.

---

## 13. UI composition

### Wael
1. current Task / `هات تاسك جديد وابدأ`;
2. authoritative running timer;
3. completion actions;
4. permanently visible `الطباعة على الطاير` outside Tasks;
5. scoped `المكبس` filter/view;
6. no ordinary backlog table/search/pagination.

### Gaber
1. current Task / `هات تاسك جديد وابدأ`;
2. authoritative running timer;
3. completion actions;
4. no Fly Print;
5. no Press;
6. no ordinary backlog table/search/pagination.

The current GitHub frontend candidate already follows much of this UI, but its transport must be refactored toward the stable Cloudflare Operator Task API before production activation.

---

## 14. Rollback model

Initial hybrid rollback must be gate-based and evidence-preserving:

- disable frontend exposure;
- disable Worker Operator Task route gate;
- disable Apps Script Operator Task backend flag if required under approved rollback procedure;
- preserve historical Task rows/evidence;
- never delete/clear Task history as rollback;
- preserve approved legacy operational fallback.

---

## 15. Immediate GitHub-only preparation backlog

While RP-07 remains open, the allowed preparation sequence is:

1. refactor frontend transport to stable Cloudflare Operator Task routes rather than direct Apps Script transport;
2. implement a fail-closed Worker Operator Task gate, not deployed/enabled;
3. implement Worker -> Google authority adapter/proxy contract with no D1 business writes;
4. add tests proving ordinary backlog is never returned to Wael/Gaber;
5. add idempotency/auth/capability tests;
6. add tests proving Fly Print is outside claim-next and Press is Wael-only/read-only;
7. add hybrid route composition CI;
8. record exact final code blobs + CI PASS before any runtime installation.

---

## 16. Current decision summary

- Build/design now in GitHub: **YES**
- Activate before RP-07 closes: **NO**
- Operator rollout immediately after RP-07: **YES**
- Must wait for full Cloudflare migration: **NO**
- User-facing path should be Cloudflare: **YES**
- Initial Task mutation authority remains Google: **YES**
- D1 authoritative Task writes now: **NO**
- Dual authoritative writes: **PROHIBITED**
- Fly Print part of Tasks: **NO**
- Press filter for Wael: **YES, scoped read/batching view**
- Press/Fly Print for Gaber: **NO**
- Resume RP-08 before Operator rollout: **NO, unless owner explicitly reprioritizes**

This record is the canonical architecture/design reference for the Operator Task V2 hybrid integration.