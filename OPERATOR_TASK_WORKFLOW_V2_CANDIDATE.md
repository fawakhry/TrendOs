# TrendOS Operator Task Workflow V2 — Candidate

Date: 2026-09-10
Status: **GITHUB CODE CANDIDATE — HYBRID CLOUDFLARE INTEGRATION PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**

Authoritative requirement record:
`docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

Authoritative architecture / rollout record:
`docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`

## Wael / Printing

- Ordinary Printing backlog is not returned as a browsable/selectable queue.
- `هات تاسك جديد وابدأ` atomically selects the next eligible ordinary Task, starts the server timer, and moves the source line to `بدء التنفيذ`.
- Dispatch order is exactly: `Urgent first -> Delivery Due Date ASC -> Order ID/sequence ASC`.
- Missing/invalid delivery due dates are excluded from automatic dispatch and counted as exceptions.
- One active ordinary Task maximum in the initial rollout.
- `جاهز للاستلام` or `تم التسليم` closes the Task and returns persisted actual work seconds.
- `الطباعة على الطاير` is permanently visible, read-only from this Task module, and completely outside Task assignment/timing.
- `فلتر المكبس` is available only to Wael and returns only Press-bearing Order/Line identities for preparation visibility. It does not expose the ordinary backlog and V2 does not start/stop Press batches.

## Gaber / Laser

- Same hidden ordinary-backlog and server-dispatched Task model.
- Laser department only.
- No Fly Print lane.
- No Press filter or Press action.

## Target integration architecture

The production-facing target is now:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets Task authority initially -> D1 mirror/read support`

Later, after the broader Cloudflare write-cutover gates are qualified, the internal Task authority adapter may move from Google to D1 without changing the operator-facing API contract.

Rules:

- Cloudflare-facing UI/API from first live Operator rollout;
- Google remains the single authoritative Task mutation source initially;
- D1 Task business-write authority is not enabled now;
- no client-side or server-side uncontrolled dual-authoritative write;
- Operator rollout is scheduled immediately after RP-07 is fully closed PASS and before RP-08 unless the owner explicitly reprioritizes.

## Safety / activation

Backend activation requires:
`TRENDOS_OPERATOR_TASK_V2_ENABLED=true`

Current frontend candidate activation additionally requires:
`window.MATBAGY_OPERATOR_TASK_V2=true`

The future Cloudflare façade must add its own fail-closed Worker route gate before production exposure.

No current code sets these values automatically.

Installing files alone must remain inert. Current RP-07 runtime hold remains authoritative; this document does not authorize Apps Script installation, deployment, feature/property changes, Source Sheet writes, Registry/D1 mutation, `main` merge, or RP-08.

## Files

- `operator-task-workflow-v2.gs`
- `operator-task-workflow-v2.js`
- `v1932-router.gs` — GitHub route candidate/reference only; **DO NOT install as a standalone live Apps Script file**
- `tests/operator_task_workflow_v2_contract.test.mjs`
- `.github/workflows/trendos-operator-task-workflow-v2-ci.yml`

## Critical live routing constraint

RP-07 Runtime Phase 0 proved that live `trendosV1932TryRoute_` is already defined once inside live `Code.gs`.

Therefore a standalone live `v1932-router.gs` containing the same global function would collide.

For the future Operator Task runtime boundary:

- re-inventory the live router after RP-07 closure;
- install/update the dedicated Task module only after exact verification;
- integrate `operatorTaskV2` through the exact existing owner/extension point;
- never rebuild/replace the whole live `Code.gs` from the repository;
- keep all Operator Task gates OFF during install/qualification;
- any live routing change or deployment requires separate owner approval.

## Superseded candidate

`WORK_QUEUE_V1_CANDIDATE.md` / Work Queue V1 is superseded and must not be deployed or enabled for Wael/Gaber. Its Fly Print, split claim/start, source-row tie-break, and mutable Press-batch behavior no longer match the owner-approved contract.

## Qualification

The Apps Script/UI V2 candidate is not considered fully qualified until the dedicated GitHub Actions workflow `TrendOS Operator Task Workflow V2 CI` passes on the final candidate composition and a separate blackbox PASS record captures the exact evidence.

The hybrid Cloudflare façade will require its own route/auth/idempotency/capability CI before runtime installation.