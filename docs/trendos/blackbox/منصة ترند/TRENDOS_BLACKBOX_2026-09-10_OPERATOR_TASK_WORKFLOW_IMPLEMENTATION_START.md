# TrendOS Blackbox — Operator Task Workflow Implementation Start

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Start checkpoint: `4086d01322eca906a799f6d1d402a0ad7052682d`
Requirements: `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

## Decision

**OWNER AUTHORIZED IMMEDIATE IMPLEMENTATION — GITHUB CODE CANDIDATE ONLY.**

This implementation starts from the existing Work Queue V1 candidate and must update it to the owner-approved Wael/Gaber operating contract.

## Locked requirements

- Ordinary backlog is hidden from Wael and Gaber; normal work is system-dispatched Tasks.
- Dispatch order: `Urgent first -> delivery due date oldest/earliest first -> Order sequence/order number ascending`.
- Missing/invalid delivery due date must fail closed out of automatic worker dispatch.
- Claiming the next ordinary Task must atomically assign it, start authoritative timing immediately, and move execution status to `بدء التنفيذ`.
- Completing at `جاهز للاستلام` or `تم التسليم` stops the authoritative timer and persists actual duration.
- `الطباعة على الطاير` for Wael is permanently visible and is **outside the Task system**; it must not be claimed as an ordinary Task and must not consume/reorder the ordinary task queue.
- Wael gets a scoped Heat Press batching view showing only Press-bearing eligible Order/Line identities.
- Gaber/Laser gets neither Press nor on-the-fly printing.
- Ordinary queue privacy and role capabilities must be server-enforced, not UI-only.

## Existing candidate requiring correction

`WORK_QUEUE_V1_CANDIDATE.md`, `work-queue-backend-v1.gs`, `work-queue-v1.js`, `v1932-router.gs`, and `tests/work_queue_v1_contract.test.mjs` already exist as an inert candidate.

The older candidate differs from the newly approved contract in at least these points:

1. Fly Print currently enters the same single-active-task/timer path; this must be removed because Fly Print is outside Tasks.
2. ordinary queue tie-break currently falls back to source row; it must use Order sequence/order number after delivery date.
3. claim/start is currently split; approved behavior requires pulling the Task to start timing and enter `بدء التنفيذ` immediately.

## Safety boundary

This work may mutate GitHub branch code/tests/docs only.

It does **not** authorize:

- Apps Script Head edits or Save;
- Apps Script deployment;
- Script Property or feature-flag changes;
- activation of `TRENDOS_WORK_QUEUE_V1_ENABLED`;
- Source Sheet business-data mutation;
- Registry mutation;
- D1 business-data mutation;
- merge to `main`;
- RP-07 Phase 1 or RP-08.

Current RP-07 runtime HOLD remains unchanged.

## Qualification target

Before calling this implementation candidate PASS:

- backend/frontend syntax checks must pass;
- task priority behavior must be executable-test proven;
- missing/invalid due date must fail closed from automatic dispatch;
- claim must atomically start timer/status in one locked operation;
- Fly Print must be read-only/directly visible outside Tasks and must not create/occupy Task rows;
- Wael/Gaber role visibility must be proven;
- Press visibility must remain scoped to Press work and preserve exact Line IDs;
- no activation/deploy/property mutation primitive may be introduced;
- dedicated CI must pass.

STOP before any runtime installation or activation even if GitHub qualification passes.
