# TrendOS Blackbox — Operator Task Workflow Requirements — Wael / Gaber

Date: 2026-09-10
Status: **OWNER-APPROVED PRODUCT/OPERATIONS REQUIREMENTS — GITHUB V2 CANDIDATE EXISTS — HYBRID DESIGN/PREP ACTIVE — NOT DEPLOYED / NOT ENABLED**
Scope: operator-facing work allocation, timing, visibility, dispatch priority, and Press batching behavior.

This record is the authoritative product/operations requirement. It does not authorize Apps Script changes, Cloudflare production deployment, Cloudflare/D1 business writes, feature-flag changes, Source Sheet mutation, Registry mutation, or RP-07 Phase 1.

Current architecture/rollout reference:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`

Current GitHub candidate:

`OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

## 1. Core operating model — task-based work, not free order selection

Normal production work must be presented as **Tasks**. The worker must not be able to browse the full ordinary queue and choose an order according to personal preference.

For ordinary work:

1. worker requests/pulls the next available Task;
2. the system assigns one eligible Task according to the approved server-side dispatch rules;
3. claim and start happen as one logical operation;
4. the authoritative timer starts automatically;
5. execution state becomes `بدء التنفيذ` automatically;
6. the worker works on the assigned Task;
7. an approved completion state stops the timer and persists actual duration.

The invariant is that ordinary backlog selection is controlled by the system, not freely browsed/chosen by the operator.

## 1.1 Approved Task dispatch priority

Default ordinary Task ordering is:

1. **Urgent first** — any Task marked `عاجل` is ahead of non-urgent work.
2. Within the same urgency class, sort from **oldest/earliest to newest/later by delivery due date / ميعاد التسليم**.
3. If due date is equal, break ties by **Order sequence / Order number**, oldest/lower order first.
4. Implementation may use exact Line ID only as a deterministic final tie-break after the owner-approved criteria above.

Conceptually:

`Urgent DESC → Delivery Due Date ASC → Order Sequence ASC → Line ID`

The worker must receive the next Task from this server-controlled order and must not be given a free-choice ordinary backlog.

If delivery due date is missing or invalid, automatic dispatch must fail closed into an exception/supervisor path rather than random ordering or worker choice.

## 2. Wael — Printing operator workflow

### 2.1 Ordinary order visibility

For Wael, ordinary printing jobs/orders must **not** be visible as a complete selectable backlog. Ordinary Printing work is delivered through the Task workflow only.

### 2.2 `الطباعة على الطاير` — permanently visible and OUTSIDE Tasks

`الطباعة على الطاير` is **not part of the Task system** and must remain permanently/directly visible to Wael regardless of the ordinary Task queue.

Therefore:

- always visible to Wael;
- not pulled through `Next Task`;
- not hidden behind Task assignment;
- not included in the ordinary Task priority algorithm;
- does not consume or reorder the ordinary Task queue;
- exposing it must not expose unrelated ordinary Printing orders;
- reporting may measure it separately later, but it must not become an ordinary assigned Task unless the owner explicitly changes this rule.

### 2.3 Pulling a new ordinary Task

When Wael pulls a new ordinary Printing Task:

- the system selects it; Wael does not choose the Order;
- the Task becomes assigned/claimed to Wael;
- timing starts automatically at claim/start;
- source execution status becomes `بدء التنفيذ`;
- start timestamp is server-authoritative and persisted.

### 2.4 Completing a Task and actual duration

The initial approved completion states are:

- `تم التسليم`
- `جاهز للاستلام`

At completion the system must persist at minimum:

- Task ID;
- operator identity;
- exact Order ID / Line ID;
- start timestamp;
- completion timestamp;
- final completion status;
- actual elapsed execution time.

Actual duration must be calculated from authoritative persisted timestamps, not manually entered by the worker and not trusted from a browser timer.

Management reporting must later support at minimum completed Tasks/orders, total actual working time, duration per Task/order, and enough evidence to compare throughput and time consumption.

### 2.5 Press filter — batching exception

Wael needs a dedicated `المكبس` filter/view because Press work is prepared in batches.

Requirements:

- show only Orders/Lines that actually require Press;
- expose only the identity/details needed to prepare the Press batch;
- preserve exact Order/Line traceability;
- do not expose unrelated ordinary Printing backlog;
- do not let this become a general free-selection queue;
- do not weaken separate RP-07 Press exact-Line integrity/evidence rules.

The Operator Task V2 Press view is initially a scoped preparation/read view, not an alternate Press completion engine.

## 3. Gaber — Laser operator workflow

Gaber/Laser uses the same controlled ordinary Task assignment principle:

- no complete ordinary Laser backlog for personal selection;
- work delivered as server-assigned Tasks;
- same priority rule: urgent first, then delivery due date, then Order sequence;
- pull/start begins authoritative timing;
- completion records actual duration and throughput.

Explicit exclusions:

### 3.1 No Press

Gaber/Laser has no Press view, Press filter, or Press action in this workflow.

### 3.2 No on-the-fly printing

Gaber/Laser has no `الطباعة على الطاير` lane.

## 4. Required role/department behavior summary

### Wael / Printing

- Ordinary backlog visible for free selection: **NO**
- Ordinary work delivered as Tasks: **YES**
- Task dispatch: **Urgent → delivery due date ASC → Order sequence ASC**
- Pull Task starts timer automatically: **YES**
- Pull Task changes state to `بدء التنفيذ`: **YES**
- `تم التسليم` stops timer: **YES**
- `جاهز للاستلام` stops timer: **YES**
- Actual duration recorded: **YES**
- Throughput/time reporting required: **YES**
- `الطباعة على الطاير` permanently visible: **YES**
- `الطباعة على الطاير` part of Tasks: **NO**
- Press filter/view: **YES**
- Press view exposes only Press-bearing Order/Line identity needed for batching: **YES**

### Gaber / Laser

- Ordinary backlog visible for free selection: **NO**
- Ordinary work delivered as Tasks: **YES**
- Task dispatch: **Urgent → delivery due date ASC → Order sequence ASC**
- Pull Task starts timer automatically: **YES**
- Pull Task changes state to `بدء التنفيذ`: **YES**
- Approved completion states stop timer: **YES**
- Actual duration recorded: **YES**
- Throughput/time reporting required: **YES**
- `الطباعة على الطاير`: **NO**
- Press filter/workflow: **NO**

## 5. Implementation invariants

- assignment is server-authoritative;
- priority sorting is server-enforced;
- worker identity is server/session-derived;
- start/end timestamps are server-authoritative;
- ordinary backlog permissions are server-side, not UI-only;
- one Line cannot be actively claimed by two operators;
- repeated claim/start/finish requests must be idempotent;
- exact Order ID / Line ID traceability is mandatory;
- timer state survives refresh/reconnect and is not browser-authoritative;
- Fly Print stays outside ordinary Tasks;
- Press batching visibility is scoped only to eligible Press work;
- Gaber/Laser cannot see Press or Fly Print capabilities;
- reporting is based on persisted evidence;
- no Task-state mutation occurs as a hidden side effect of a read request.

Initial rollout decision: **one active ordinary Task maximum per operator**.

## 6. Approved architecture direction

The user-facing first live Operator Task rollout should be Cloudflare-facing, while Google Apps Script / Sheets remains the single authoritative Task mutation source during the bridge period.

Target first-live flow:

`Operator -> Cloudflare TrendOS UI/API -> Google Task authority -> D1 mirror/read support`

Long-term:

`Operator -> Cloudflare TrendOS UI/API -> D1 Task authority`

No uncontrolled dual-authoritative Google+D1 writes are allowed.

The stable Cloudflare API/adapter design and rollout phases are defined in:

`TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`

## 7. Roadmap placement

The owner has approved this feature as the next prioritized production insertion **after RP-07 is fully closed PASS**.

Order:

`Finish RP-07 -> Operator Task runtime rollout/validation -> resume RP-08/broader roadmap`

Design and GitHub-only preparation may continue while RP-07 is open, but live activation may not.

## 8. Still separate/future owner decisions

The following are not required for the initial rollout and must not be invented silently:

- Pause/Resume/Break timer behavior;
- rework handling;
- partial completion/multi-stage Task semantics beyond current Line-linked Task model;
- SLA/target-time calculations;
- manager override/reassignment rules;
- detailed manager dashboard beyond core throughput/time metrics;
- final supervisor workflow for missing/invalid due-date exceptions;
- whether every department should expose `تم التسليم` directly to the operator in later expansions.

## 9. Current implementation status

A GitHub-only V2 candidate now exists and reflects the core owner contract. It is not deployed or enabled.

Current preparation state:

- product requirements: **LOCKED for current scope**;
- V2 Apps Script/UI candidate: **EXISTS IN GITHUB**;
- hybrid Cloudflare architecture: **DESIGNED / PREP ACTIVE**;
- live Apps Script installation: **NOT AUTHORIZED / BLOCKED UNTIL RP-07 CLOSES**;
- Cloudflare Operator Task production route: **NOT DEPLOYED / NOT ENABLED**;
- D1 Task write authority: **NOT AUTHORIZED**.

## 10. Authority

These requirements were supplied directly by the owner on 2026-09-10 and remain authoritative unless a later blackbox requirement record explicitly supersedes them.