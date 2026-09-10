# TrendOS Blackbox — Operator Task Workflow Requirements — Wael / Gaber

Date: 2026-09-10
Status: **OWNER-APPROVED PRODUCT/OPERATIONS REQUIREMENTS — NOT YET IMPLEMENTED**
Scope: operator-facing work allocation, timing, visibility, and Press batching behavior.

This record is a product/operations requirement only. It does not authorize Apps Script changes, Cloudflare/D1 writes, feature-flag changes, deployment, data mutation, or RP-07 Phase 1.

## 1. Core operating model — task-based work, not free order selection

The operator workflow must move away from showing the worker the full open-order backlog and letting the worker choose work manually.

Normal production work must be presented as **Tasks**.

The worker must not be able to browse the full ordinary queue and choose an order according to personal preference.

For ordinary work:

1. worker requests / pulls the next available Task;
2. the system assigns one eligible Task according to the task-dispatch rules;
3. once the Task is pulled/claimed, timing starts automatically;
4. the Task moves to execution state automatically;
5. the worker works only on the assigned Task;
6. when the Task reaches an approved completion state, the system stops the timer and records actual duration.

The exact dispatch priority algorithm is not defined by this record and must be designed separately. The invariant is that ordinary backlog selection is controlled by the system, not freely browsed/chosen by the operator.

## 2. Wael — Printing operator workflow

### 2.1 Ordinary order visibility

For Wael, ordinary printing jobs/orders must **not** be visible as a complete selectable backlog.

Wael must not see all remaining printing orders in a way that allows him to choose which order to execute next.

Ordinary printing work is delivered to him through the Task workflow only.

### 2.2 "الطباعة على الطاير" exception

`الطباعة على الطاير` is the explicit visibility exception for Wael.

It must remain visible to Wael as directly available work.

Therefore:

- On-the-fly printing may be shown as ready/available work;
- ordinary printing backlog remains hidden from free selection;
- this exception must not expose unrelated ordinary orders.

The business reason is that on-the-fly printing is immediate work and must remain directly actionable.

### 2.3 Pulling a new Task

When Wael pulls a new ordinary printing Task:

- the Task becomes assigned/claimed to Wael;
- the timer starts automatically at the claim/start event;
- task/order execution status becomes `بدء التنفيذ` automatically;
- the start timestamp must be persisted so duration is server-derived rather than trusted from the client/UI.

### 2.4 Completing a Task and actual duration

The timer must stop when the assigned Task reaches either of the approved completion states:

- `تم التسليم`
- `جاهز للاستلام`

At completion the system must persist at minimum:

- Task identifier;
- operator identity;
- Order / Line identity linked to the Task;
- start timestamp;
- completion timestamp;
- final completion status;
- actual elapsed execution time.

Actual duration must be calculated from authoritative timestamps, not manually entered by the worker.

The system must later support management reporting showing at minimum:

- number of Tasks/orders completed by Wael;
- actual total working time;
- actual duration per Task/order;
- enough data to compare throughput and time consumption across work periods.

### 2.5 Press filter — batching exception

Wael needs a dedicated `المكبس` filter/view.

When Wael selects the Press filter, he may see the names/identities of orders that contain Heat Press work.

This Press view is intentionally different from the hidden ordinary backlog because Press work is often prepared and executed in batches. Wael needs visibility across Press-bearing orders so he can prepare a sensible batch instead of running the Press for only one or two orders unnecessarily.

Press view requirements:

- show only orders/lines that actually require Press;
- expose the order names/identities required to prepare the batch;
- do not expose unrelated ordinary printing backlog;
- preserve exact Order/Line traceability so Press completion can later be attributed correctly;
- Press batching visibility must not silently become a general free-selection queue for non-Press work.

The existing RP-07 exact-Line Press integrity rules remain relevant and must not be weakened by this product requirement.

## 3. Gaber — Laser operator workflow

Gaber / Laser uses the same **task-based controlled assignment principle** for ordinary work:

- no full ordinary backlog for free personal selection;
- work should be delivered as assigned Tasks;
- pulling/starting a Task starts authoritative timing;
- completion records actual duration and throughput.

However Gaber has two explicit exclusions:

### 3.1 No Press

Gaber/Laser has no Press workflow or Press filter.

Press-related views/actions must not be shown for this operator role.

### 3.2 No on-the-fly printing

Gaber/Laser has no `الطباعة على الطاير` workflow.

The on-the-fly printing exception that is visible to Wael must not appear for Gaber/Laser.

## 4. Required role/department behavior summary

### Wael / Printing

- Ordinary backlog visible for free selection: **NO**
- Ordinary work delivered as Tasks: **YES**
- Pull Task starts timer automatically: **YES**
- Pull Task changes state to `بدء التنفيذ`: **YES**
- `تم التسليم` stops timer: **YES**
- `جاهز للاستلام` stops timer: **YES**
- Actual duration recorded: **YES**
- Throughput + time reporting required: **YES**
- `الطباعة على الطاير` directly visible: **YES**
- Press filter/view available: **YES**
- Press filter may expose Press-bearing order identities for batching: **YES**

### Gaber / Laser

- Ordinary backlog visible for free selection: **NO**
- Ordinary work delivered as Tasks: **YES**
- Pull Task starts timer automatically: **YES**
- Pull Task changes state to `بدء التنفيذ`: **YES**
- Approved completion states stop timer: **YES**
- Actual duration recorded: **YES**
- Throughput + time reporting required: **YES**
- `الطباعة على الطاير`: **NO**
- Press filter/workflow: **NO**

## 5. Implementation invariants for the future build

When this requirement is implemented, the following invariants must hold:

- task assignment must be server-authoritative;
- worker identity must be server/session-derived;
- start/end timestamps must be server-authoritative;
- a Task must not be claimable concurrently by two operators;
- repeated claim/start/finish requests must be idempotent;
- the system must preserve exact Order ID / Line ID traceability;
- timer state must survive page refresh/reconnect and must not depend only on a browser timer;
- ordinary queue visibility permissions must be enforced server-side, not only hidden in the UI;
- Press batching visibility must be scoped only to eligible Press work;
- role/department capability rules must prevent Gaber/Laser from seeing Press or on-the-fly printing controls;
- reporting must use persisted task events/timestamps, not reconstructed UI guesses;
- no task-state mutation should happen as a hidden side effect of a read request.

## 6. Architecture direction

The strategic target remains the Cloudflare migration. This Task workflow should be designed so the long-term authoritative task engine can live on Cloudflare Workers/D1 rather than creating new long-lived Google-only coupling.

Until the approved write cutover occurs, current authority and RP-07 safety boundaries remain unchanged.

## 7. Not defined yet / separate design decisions

The owner has not yet fixed in this record:

- exact automatic Task priority/dispatch algorithm;
- whether an operator may hold more than one ordinary active Task at once;
- pause/break/rework timer behavior;
- treatment of partial completion or multi-line orders;
- SLA/target-time calculation;
- supervisor override/reassignment behavior;
- detailed management dashboard UI;
- whether `تم التسليم` should be a worker-accessible completion action for every department or only where operationally valid.

These items must be resolved in a later design checkpoint without changing the requirements above.

## 8. Authority

These requirements were supplied directly by the owner on 2026-09-10 and should be treated as the current intended operator workflow for Wael/Printing and Gaber/Laser unless a later blackbox requirement record explicitly supersedes them.
