# TrendOS Work Queue V1 — SUPERSEDED

Status: **SUPERSEDED BY OPERATOR TASK WORKFLOW V2 — DO NOT DEPLOY / DO NOT ENABLE**

Owner requirements changed on 2026-09-10. This V1 candidate must not be used for Wael/Gaber rollout because it conflicts with the current approved contract in material ways:

- V1 turns `طباعة ع الطاير` into an active Task/timer; current requirement says Fly Print is permanently visible and **outside Tasks**.
- V1 separates claim from start; current requirement says pulling the next Task must immediately start authoritative timing and move the source to `بدء التنفيذ`.
- V1 uses source-row fallback; current requirement requires Order sequence/order number as the tie-break after delivery due date.
- V1 includes Press batch mutation; current V2 scope exposes a scoped Press view for Wael without turning it into ordinary free-selection work.

Authoritative replacement files:

- `operator-task-workflow-v2.gs`
- `operator-task-workflow-v2.js`
- `tests/operator_task_workflow_v2_contract.test.mjs`
- `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`

The historical V1 implementation files remain in GitHub only for lineage/reference. `TRENDOS_WORK_QUEUE_V1_ENABLED` and `MATBAGY_WORK_QUEUE_V1` must remain disabled.

---

## Historical V1 record — retained for audit only

Original status: **CODE CANDIDATE ONLY — NOT DEPLOYED / NOT ENABLED**

### Employee contract

#### Gaber
- The normal queue is hidden.
- `هات تاسك جديد` atomically reserves only the next eligible Laser line.
- The line is revealed only after reservation.
- `فتح الأوردر وبدء التنفيذ` starts the authoritative server timer and moves the source line through the existing `updateLine_` path.
- One active regular task maximum.
- Pause/resume is supported with a reason.
- Timer closes only on `جاهز للاستلام` or `تم التسليم`.

#### Wael
Same hidden normal queue for ordinary Printing work, plus two historical V1 exceptions:

1. **طباعة ع الطاير** — V1 made it claimable as the active task. **This behavior is obsolete.**
2. **تشغيل دفعة مكبس** — V1 supported mutable Press batches. **This is not the current V2 operator-task contract.**

### Historical queue ordering
1. Priority: urgent/VIP first.
2. Expected delivery earliest first.
3. Source row order as deterministic fallback.

**This ordering is obsolete.** Current V2 ordering is:
`Urgent first → Delivery Due Date ASC → Order Sequence/Order ID ASC`.

### Historical data / activation
V1 could create:
- `تشغيل - مهام الأوردرات V1`
- `تشغيل - دفعات المكبس V1`
- `تشغيل - بنود دفعات المكبس V1`

Historical activation keys:
- `TRENDOS_WORK_QUEUE_V1_ENABLED`
- `window.MATBAGY_WORK_QUEUE_V1`

These must not be enabled for the current rollout.
