# TrendOS Work Queue V1 — Candidate (2026-09-09)

Status: **CODE CANDIDATE ONLY — NOT DEPLOYED / NOT ENABLED**

This candidate implements the requested employee-order control without changing the current production roadmap or authority model.

## Employee contract

### Gaber
- The normal queue is hidden.
- `هات تاسك جديد` atomically reserves only the next eligible Laser line.
- The line is revealed only after reservation.
- `فتح الأوردر وبدء التنفيذ` starts the authoritative server timer and moves the source line through the existing `updateLine_` path.
- One active regular task maximum.
- Pause/resume is supported with a reason.
- Timer closes only on `جاهز للاستلام` or `تم التسليم`.

### Wael
Same hidden normal queue for ordinary Printing work, plus two exceptions:

1. **طباعة ع الطاير**
   - Active Fly Print orders remain directly visible to Wael.
   - They are excluded from the hidden normal queue.
   - Wael can `فتح وبدء` one directly; it still becomes his single active task and uses the same timer.

2. **تشغيل دفعة مكبس**
   - The Press list is not permanently visible.
   - Wael explicitly opens Press mode.
   - Only currently eligible Heat Press lines are returned.
   - Wael selects multiple lines and starts one batch.
   - One batch timer is recorded once for all selected orders.
   - Selected Line IDs are persisted as batch members.
   - Ending the batch records duration and closes the list again.
   - Press completion does not automatically mark the whole order Ready/Delivered; it records the Press stage only.

## Queue ordering
Default:
1. Priority: urgent/VIP first.
2. Expected delivery earliest first.
3. Source row order as deterministic fallback.

Default normal pending status is `طلب جديد`.

Optional Script Property:
`TRENDOS_WORK_QUEUE_PENDING_STATUSES_V1`
can provide a comma-separated approved pending-status list later.

Press-ready defaults:
`بدأ التنفيذ,تحت التنفيذ,جاهز للطباعة,تم التنفيذ`

Optional Script Property:
`TRENDOS_WORK_QUEUE_PRESS_READY_STATUSES_V1`
can override that list later.

## Data
When enabled and first mutated, the module creates only its dedicated operational sheets:
- `تشغيل - مهام الأوردرات V1`
- `تشغيل - دفعات المكبس V1`
- `تشغيل - بنود دفعات المكبس V1`

It does not create Inventory and does not write D1.

Source order-status mutations stay on the existing Apps Script/Sheets `updateLine_` authority.

## Safety / activation
Installing code alone is inert.

Backend mutation additionally requires:
`TRENDOS_WORK_QUEUE_V1_ENABLED = true`
in Apps Script Script Properties.

Frontend additionally requires:
`window.MATBAGY_WORK_QUEUE_V1 = true`
and loading `work-queue-v1.js`.

Do **not** set either activation flag during the current CORE-P0 RP-06/RP-07 hold.

Recommended later activation boundary:
1. Finish RP-06 Registry Write.
2. RP-07 HEALTH must PASS.
3. Obtain separate RP-08 / ORDER_LINE activation approval.
4. Install `work-queue-backend-v1.gs` into the verified TrendOS Apps Script project.
5. Verify the `workQueueV1` router route.
6. Add the frontend loader with the frontend flag still false.
7. Run read-only/status contract checks.
8. Perform a separately approved bounded mutation test with one test/controlled Line.
9. Enable for Gaber/Wael only after regression PASS.
10. Keep D1 writes OFF.

## Manager metrics
`metrics` returns:
- completed tasks,
- unique completed orders per employee,
- total work seconds,
- average work seconds per unique order,
- Press batch count,
- orders in Press batches,
- total/average Press batch time.

## Line ID safety
The candidate includes bounded repair for historical date/serial-coerced Line IDs only when the identity is provable from numeric Order ID + first day of month. It does not guess arbitrary IDs.

## Files
- `work-queue-backend-v1.gs`
- `work-queue-v1.js`
- `v1932-router.gs` route addition
- `tests/work_queue_v1_contract.test.mjs`

## Local validation
`node --check`:
- backend: PASS
- frontend: PASS
- router: PASS

`node --test tests/work_queue_v1_contract.test.mjs`:
- 11 tests PASS
- 0 failed
