# TrendOS Autonomous Printshop — 60-Day Execution Program

**Owner mandate date:** 2026-10-05  
**Target:** by 2026-12-04, daily printshop operations run without routine owner involvement.  
**Operating principle:** AI executes every qualified digital task. Employees receive only physical work and qualified exception work. Owner receives only protected high-risk decisions and emergency escalation.

## 1. North-star operating contract

The target operating model is:

```
Customer / WhatsApp
  -> AI Intake
  -> AI Customer + Order Context
  -> AI Quote / Rules
  -> AI Design or Template Composition
  -> AI Preflight
  -> AI Production Scheduler
  -> Operator Task V2 for physical execution only
  -> AI Quality Gate
  -> AI Customer Update
  -> Delivery / Handover
  -> Controlled Finance Link
  -> Learning + KPI loop
```

### Required end-state KPIs

```ini
OWNER_ROUTINE_TOUCHES_PER_DAY=0
OWNER_EXCEPTION_TOUCHES_PER_DAY_TARGET<=1
UNOWNED_OPERATIONAL_TASKS=0
DIGITAL_TASKS_ROUTED_TO_HUMAN_TARGET<=5%
AI_AUTO_DECISION_TARGET>=95%
PHYSICAL_TASKS_WITH_AI_INSTRUCTIONS=100%
ORDER_WITHOUT_NEXT_ACTION=0
OVERDUE_WITHOUT_ESCALATION=0
CRITICAL_FAILURE_WITHOUT_ALERT=0
EMPLOYEE_FREE_CHOICE_OF_NEXT_NORMAL_JOB=NO
```

This is a target operating contract, not permission to bypass safety, data integrity, financial controls, or employment protections.

## 2. Human work policy

Employees should only receive:

1. physical production work that software cannot perform: loading media, operating machines that require manual handling, pressing, assembly, packing, handover;
2. exception work where confidence, data, quality, or customer approval is insufficient;
3. maintenance, cleaning, stock receiving, and other real-world actions;
4. recovery work during a declared degraded mode.

Employees should not routinely decide:

- what job to do next;
- what customer to answer first;
- what standard design template to use;
- whether a standard file passes preflight;
- how to prioritize normal orders;
- when to chase a customer for missing standard information;
- which normal production queue item is next.

Those are system responsibilities.

## 3. AI supervisor policy for employees

AI may autonomously:

- assign the next qualified task;
- sequence work using due date, priority, machine availability, setup cost, and dependency state;
- provide exact execution instructions;
- check task completion evidence;
- detect lateness, inactivity, repeated rework, and queue imbalance;
- coach the employee on the current task;
- rebalance normal workloads;
- request operational clarification;
- produce performance analytics.

AI must not autonomously execute adverse employment decisions such as termination, suspension, pay reduction, or punitive disciplinary action. Those remain protected owner/authorized-manager decisions.

## 4. Control model

Every operational action is classified by `autonomy-policy-v1.mjs` into one of:

- `AI_AUTO`: system executes;
- `HUMAN_PHYSICAL`: Operator Task V2 receives the physical task;
- `HUMAN_EXCEPTION`: human handles an exception;
- `OWNER_ONLY`: protected high-risk decision;
- `BLOCKED`: safety/integrity state prevents execution.

Autopilot is **default OFF** at source level until a task family passes its qualification gate. Rollout is shadow -> canary -> partial auto -> general auto.

## 5. Existing TrendOS components to reuse

Do not create a parallel operating system.

Reuse:

- D1 / Cloudflare as the current cloud authority where already qualified;
- Employee Native Auth migration track;
- Operator Task Workflow V2 as the physical-work queue;
- existing customer/order Cloud paths;
- existing print/laser material-control work;
- Matbagy AI knowledge assets as the future controlled AI layer;
- EasyStore as the separate accounting program while Accounting remains deferred/read-only.

`work-queue-v1.js` is superseded for normal operator assignment and is not the basis of this program.

## 6. 60-day execution sequence

### Days 1-7 — Autonomy Control Plane

Deliver:

- autonomy policy engine;
- action taxonomy;
- event/audit contract;
- shadow-decision log;
- exception queue contract;
- Owner Emergency Queue contract;
- current workflow inventory mapped to AI / physical / exception / owner;
- baseline KPIs: owner touches, employee choices, rework, overdue, queue wait.

Exit gate:

```ini
AUTONOMY_POLICY_ENGINE=PASS
ALL_LIVE_WORKFLOW_FAMILIES_CLASSIFIED=YES
UNKNOWN_NEXT_ACTION_RATE=0
RUNTIME_BEHAVIOR_CHANGED=NO
```

### Days 8-14 — AI Customer Intake + Order Completeness

Deliver:

- WhatsApp/inbox intent extraction;
- customer identity resolution;
- product, dimensions, quantity, deadline, source files and required fields extraction;
- deterministic missing-information prompts;
- order draft generation;
- duplicate protection;
- owner-free normal order admission.

Exit gate: standard customer request can become a complete order draft without employee intervention.

### Days 15-21 — Pricing + Design Automation

Deliver:

- deterministic price rules as source-of-truth;
- AI may explain or compose a quote, not invent price;
- Smart Designer templates for highest-volume products first;
- print-file normalization;
- image placement rules;
- cut/stroke rules;
- standard wording/data insertion;
- version lineage.

First product families:

- Mug 20x9;
- 7x10 cutouts / Senior;
- collage/poster;
- standard invitations;
- common laser/vector name designs.

Exit gate: at least the highest-volume standard products reach proof-ready output automatically.

### Days 22-28 — AI Preflight + Production Dispatcher

Deliver:

- size/aspect/DPI checks;
- missing-image and low-quality checks;
- text/data completeness checks;
- stroke/cut readiness checks where relevant;
- print-ready package;
- production routing by department/machine;
- Operator Task V2 integration;
- no employee browsing of the normal order pool.

Exit gate:

```ini
NORMAL_NEXT_JOB_CHOSEN_BY_SYSTEM=100%
PHYSICAL_TASK_HAS_MACHINE_AND_INSTRUCTIONS=100%
DIGITAL_PREPARATION_DONE_BEFORE_OPERATOR=YES
```

### Days 29-35 — AI QC + Rework Loop

Deliver:

- expected-vs-produced QC evidence model;
- file/proof verification;
- photo/sample capture contract for physical QC where applicable;
- defect classification;
- automatic rework task creation;
- customer-impact escalation.

Exit gate: every completed production task has a recorded QC result before delivery eligibility.

### Days 36-42 — Inventory + Procurement Autopilot

Deliver:

- material consumption projection from order lines;
- reorder thresholds;
- shortage prediction;
- purchase suggestions;
- approved supplier/range rules;
- owner escalation only for out-of-policy spend or supplier exception.

Exit gate: no standard order reaches production without material readiness state.

### Days 43-49 — AI Employee Supervisor

Deliver:

- shift workload plan;
- automatic next-task assignment;
- lateness/blocker detection;
- task coaching;
- break/availability-aware dispatch;
- productivity/rework analytics;
- manager exception queue;
- protected employment-action boundary.

Exit gate:

```ini
EMPLOYEE_NORMAL_JOB_SELECTION=0
UNASSIGNED_READY_PHYSICAL_TASKS=0
AI_SUPERVISOR_COVERAGE=100%
ADVERSE_EMPLOYMENT_ACTION_AUTO=NO
```

### Days 50-56 — Owner Removal Rehearsal

Operate in owner-silent mode for routine work.

Owner dashboard changes from a work console to an exception console only.

Allowed owner notifications:

- safety/security incident;
- production outage affecting deadlines;
- financial exposure beyond configured threshold;
- legal/regulated issue;
- protected employment decision;
- major customer exception beyond policy;
- systemic data-integrity failure.

Exit gate: 7 consecutive operating days with zero routine owner actions.

### Days 57-60 — Autonomous Burn-in + Go/No-Go

Run the shop with:

```ini
AUTOPILOT_SCOPE=QUALIFIED_GENERAL
OWNER_ROUTINE_TOUCHES=0
EMPLOYEE_SCOPE=PHYSICAL_PLUS_EXCEPTIONS
OWNER_VIEW=EXCEPTIONS_ONLY
```

Go only if:

- no silent lost orders;
- no uncontrolled financial mutation;
- no queue starvation;
- no critical alert gap;
- rollback works;
- every autonomous action is auditable;
- exception ownership is deterministic.

## 7. Owner dashboard end-state

The owner should not manage queues.

The owner screen should answer only:

- Is the shop healthy?
- Is any deadline at risk?
- Is any exception waiting specifically for me?
- Are cash/material/security thresholds breached?
- Is Autopilot degraded?

Normal healthy state:

```ini
SHOP_HEALTH=GREEN
OWNER_ACTION_REQUIRED=NO
ORDERS_AT_RISK=0
UNOWNED_EXCEPTIONS=0
AUTOPILOT_DEGRADED=NO
```

## 8. Non-negotiable engineering rules

- Runtime truth > deployed > tested > repo-only > historical.
- Every mutation is idempotent or explicitly protected.
- No AI-generated final price if price authority is unavailable.
- No AI claim about order/payment/stock state without source-of-truth lookup.
- Unknown task family does not auto-execute.
- Every auto action records input, policy decision, confidence, execution result and rollback/audit reference.
- Every autonomous subsystem has an OFF switch.
- Rollout is canary-first and fail-closed.
- EasyStore/accounting remains outside this program until its separate gate is reopened.

## 9. First implementation checkpoint

Created on 2026-10-05:

- `cloudflare-d1/src/autonomy-policy-v1.mjs`
- `tests/trendos_autonomy_policy_v1.test.mjs`
- `.github/workflows/trendos-autonomy-policy-v1-ci.yml`

This checkpoint changes no Production runtime behavior. It establishes the classification contract required before AI can take operational control.

## 10. Immediate next gate

After the policy CI is green:

1. classify every currently live operational action against the autonomy taxonomy;
2. create the append-only autonomy event schema;
3. add shadow decisions without taking action;
4. measure 24-hour mismatch rate between AI recommendation and actual human action;
5. only then enable a first low-risk automatic task family.
