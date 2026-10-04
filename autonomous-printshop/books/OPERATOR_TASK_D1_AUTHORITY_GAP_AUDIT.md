# Operator Task V2 — D1 Authority Gap Audit

Date: 2026-10-05  
Project: Autonomous Printshop  
Status: REPO AUDIT / NO RUNTIME MUTATION

## Finding

The Operator Task product contract is valuable and should be reused, but there is **no current D1 Operator Task authority schema/engine** in migrations 0012–0018.

### Existing D1 Ops is not Operator Task authority

Migration `0012_employee_ops_zero_google_v1.sql` covers Attendance / HR / Cleaning / Press-related operational facts. It does not define the ordinary task ledger required by Operator Task V2.

Migrations 0013–0018 also do not provide a task-assignment table/claim engine.

### Existing Operator Task mutation authority is historical Apps Script/Sheet

`operator-task-workflow-v2.gs` stores tasks in:

`تشغيل - مهام المشغلين V2`

and performs:
- active-task lookup;
- dispatch;
- claim/start;
- source status write;
- complete;
- metrics

using Spreadsheet/Apps Script authority.

### Existing Cloudflare module is a proxy, not authority

`cloudflare-d1/src/operator-task-edge-v2.mjs` provides the stable public routes:

- `GET /v1/operator/tasks/status`
- `POST /v1/operator/tasks/claim-next`
- `POST /v1/operator/tasks/complete`
- `GET /v1/operator/fly-print`
- `GET /v1/operator/press-candidates`
- `GET /v1/operator/tasks/metrics`

but mutating operations are still proxied to Apps Script through a dedicated HMAC bridge.

## Reuse decision

**Keep the public API and product invariants. Replace the authority adapter.**

Target:

```
Operator UI
 -> Cloudflare Operator Task API
 -> D1 Operator Task Authority
 -> TrendOS Order/Line status transition
 -> Autonomy/Material events
```

No browser dual-write and no Cloudflare->Apps Script Task mutation in the final autonomous target.

## D1 V1 schema needed

Minimum entities:

### operator_tasks
- task_id PK
- line_id
- order_id
- employee_key
- department
- state: STARTING/RUNNING/COMPLETED/FAILED/CANCELLED
- claimed_at
- started_at
- completed_at
- work_sec
- final_status
- priority_snapshot
- due_at_snapshot
- order_sequence_snapshot
- source_status_before
- task_payload_json
- material_close_id nullable
- created_at / updated_at

Required uniqueness/guards:
- at most one active task per employee;
- at most one active ordinary task per line;
- exact Line/Order consistency;
- deterministic/replay-safe mutation identity.

### operator_task_events
Append-only:
- event_id PK
- task_id
- event_type
- actor
- at
- idempotency_key
- request_hash
- result_hash/status
- evidence_json

### operator_task_control
- mode OFF / SHADOW / CANARY / GENERAL
- epoch
- enabled departments/users
- updated_at

## Dispatch contract retained

```
Urgent DESC
-> Delivery Due Date ASC
-> Order Sequence ASC
-> Line ID final deterministic tie-break
```

Missing/invalid due date:
`HUMAN_EXCEPTION / SUPERVISOR_QUEUE`

Never let the employee browse and select ordinary work as fallback.

## Atomic claim requirement

D1 claim-next must atomically:

1. verify operator has no active ordinary task;
2. select first eligible unlocked line by server ordering;
3. prevent a second operator claiming the same line;
4. create task/event;
5. transition source Line to `بدء التنفيذ` through the qualified TrendOS order/line write contract;
6. return one task.

Any partial failure requires rollback/compensation so an orphan STARTING task or orphan source status is not silently left behind.

## Complete requirement

Complete must:

1. authenticate task owner/capability;
2. replay-check idempotency key;
3. run material/QC gates applicable to the department;
4. transition exact Order/Line to allowed final status;
5. finalize task timestamps and work_sec;
6. append event;
7. emit completion signal for downstream AI/QC/customer workflows.

## What can be deleted after D1 cutover

Only after verified GENERAL + rollback evidence:
- Apps Script Task Sheet as mutation authority;
- Operator Task proxy HMAC dependency;
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` for this path.

Historical records remain archive evidence.

## Gate result

```ini
OPERATOR_TASK_PRODUCT_CONTRACT=REUSE
OPERATOR_TASK_PUBLIC_API=REUSE
CURRENT_D1_TASK_AUTHORITY=ABSENT
CURRENT_APPS_SCRIPT_TASK_AUTHORITY=HISTORICAL_CANDIDATE_PATH
TARGET_TASK_AUTHORITY=D1
NEW_D1_ENGINE_REQUIRED=YES
NEXT=DESIGN_MIGRATION_AND_PURE_D1_TASK_CORE_DEFAULT_OFF
```
