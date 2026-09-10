# TrendOS Operator Task Workflow V2 — Candidate

Date: 2026-09-10
Status: **GITHUB CODE CANDIDATE — NOT DEPLOYED / NOT ENABLED**

Authoritative requirement record:
`docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

## Wael / Printing

- Ordinary Printing backlog is not returned as a browsable/selectable queue.
- `هات تاسك جديد وابدأ` atomically selects the next eligible ordinary Task, starts the server timer, and moves the source line to `بدء التنفيذ`.
- Dispatch order is exactly: `Urgent first -> Delivery Due Date ASC -> Order ID/sequence ASC`.
- Missing/invalid delivery due dates are excluded from automatic dispatch and counted as exceptions.
- One active ordinary Task maximum.
- `جاهز للاستلام` or `تم التسليم` closes the Task and returns persisted actual work seconds.
- `الطباعة على الطاير` is permanently visible, read-only from this Task module, and completely outside Task assignment/timing.
- `فلتر المكبس` is available only to Wael and returns only Press-bearing Order/Line identities for preparation visibility. It does not expose the ordinary backlog and V2 does not start/stop Press batches.

## Gaber / Laser

- Same hidden ordinary-backlog and server-dispatched Task model.
- Laser department only.
- No Fly Print lane.
- No Press filter or Press action.

## Safety / activation

Backend activation requires:
`TRENDOS_OPERATOR_TASK_V2_ENABLED=true`

Frontend activation additionally requires:
`window.MATBAGY_OPERATOR_TASK_V2=true`

No code in this candidate sets either activation value.

Installing files alone must remain inert. Current RP-07 runtime hold remains authoritative; this document does not authorize Apps Script installation, deployment, feature/property changes, Source Sheet writes, Registry/D1 mutation, `main` merge, or RP-08.

## Files

- `operator-task-workflow-v2.gs`
- `operator-task-workflow-v2.js`
- `v1932-router.gs` — isolated `operatorTaskV2` route candidate only
- `tests/operator_task_workflow_v2_contract.test.mjs`
- `.github/workflows/trendos-operator-task-workflow-v2-ci.yml`

## Superseded candidate

`WORK_QUEUE_V1_CANDIDATE.md` / Work Queue V1 is superseded and must not be deployed or enabled for Wael/Gaber. Its Fly Print, split claim/start, source-row tie-break, and mutable Press-batch behavior no longer match the owner-approved contract.

## Qualification

The V2 candidate is not considered qualified until the dedicated GitHub Actions workflow `TrendOS Operator Task Workflow V2 CI` passes on the final candidate composition. A separate blackbox PASS record is required after that evidence exists.
