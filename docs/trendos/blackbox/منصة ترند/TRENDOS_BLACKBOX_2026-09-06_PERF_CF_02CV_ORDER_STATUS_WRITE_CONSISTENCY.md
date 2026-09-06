# PERF-CF-02CV — Order Status Save / Read-After-Write Consistency

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## User report

After PERF-CF-02CU was closed with user-visible PASS, the user reported a separate production issue:

`بعد كده شوف حالات الاوردر لما بغيرها واعمل حفظ مش بتحفظ`

02CU remains CLOSED. This checkpoint is a separate write/update consistency investigation.

## Root cause

The UI save path calls Apps Script action `updateLine` and then immediately calls `loadRows(true)`.

Two consistency hazards were present:

1. D1 serves `rowNumber` from its mirror snapshot. `updateLine_` in Apps Script trusted a valid `rowNumber` before resolving the stable `lineId`. If rows shifted in Sheets after the D1 snapshot, the mirror row coordinate could refer to a different source row.
2. Even when the Apps Script write succeeded, the immediate post-save `loadRows(true)` could read a D1 mirror that was still physically fresh under the five-minute gate but predated the just-completed Sheets write. The UI could therefore repaint the old status and make a successful save look like it did not persist.

Orders Low-Usage source-change detection runs every five minutes, so D1 is not guaranteed to contain a just-completed authoritative write immediately.

## Safe fix

The fix is frontend-only in `trendos-edge-orders-read-v1.js` and does not change write authority.

Version:

`EDGE_ORDERS_READ_02CV_WRITE_CONSISTENCY_20260906`

Behavior:

- `updateLine` still goes directly to the original Apps Script API.
- When a stable `lineId` exists, the wrapper removes `rowNumber` before forwarding the write. The existing Apps Script `updateLine_` then resolves the current source row by `lineId`.
- Legacy rows without `lineId` retain `rowNumber` as compatibility fallback.
- Only after `writeResult.success === true`, the browser opens a local post-write read barrier.
- Default barrier: 6 minutes, bounded to at most 10 minutes if configured.
- While the barrier is active, eligible Orders reads temporarily use authoritative Apps Script instead of D1, preventing an older D1 mirror from repainting the pre-write state.
- After the barrier expires, normal qualified D1-first + 02CU dual-signal behavior resumes automatically.
- Rejected writes do not open a barrier.

## Authority / safety invariants

- Apps Script / Sheets remain authoritative for writes.
- No status write is routed to D1.
- No Apps Script deployment is required.
- No Worker deployment is required.
- No D1 business-data write is introduced.
- `__DEBT__` remains Apps Script.
- 02CU dual-signal read behavior remains intact outside the short post-write barrier.
- 02CL/reconcile remains OFF.
- generic drain remains OFF.
- no secret rotation / no `EDGE_SESSION_SECRET` change.

## Tests

New durable test:

`tests/frontend_order_status_write_consistency_02cv.test.mjs`

Coverage:

- normal pre-write reads remain D1-first;
- `updateLine` stays on Apps Script;
- stable `lineId` strips stale D1 `rowNumber`;
- `orderId`, `lineId`, `status`, and notes remain preserved;
- confirmed write opens the post-write barrier;
- immediate reload uses Apps Script and does not query the Edge page;
- clearing/expiry returns to D1-first;
- legacy rows without `lineId` retain rowNumber;
- rejected writes do not open the barrier.

The new test was added to the durable TrendOS Integrity workflow.

Integrity Run `34035164288` — **SUCCESS**, including `Run 02CV order status write consistency tests` — **PASS**.

## Production promotion

Production baseline before promotion:

- main: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- Worker: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%

Frontend-only production changes:

1. `trendos-edge-orders-read-v1.js`
2. `config.js` — only loader cache-bust value

New main after the two bounded commits:

`0088ed5625e8359f8551525ae41df3b25248b494`

Compare from the previous main confirms exactly two changed files:

- `config.js`: 1 addition / 1 deletion
- `trendos-edge-orders-read-v1.js`: write consistency guard

No Apps Script or Worker deployment occurred.

GitHub Pages final deployment for `0088ed5625e8359f8551525ae41df3b25248b494` must be SUCCESS before marking Production technical PASS.

## Close condition

After Pages/public-asset qualification succeeds, the remaining validation is user-visible:

1. refresh the platform once;
2. change a real order-line status;
3. press Save;
4. confirm the chosen status remains saved instead of immediately reverting.

Do not mark 02CV CLOSED until user-visible save validation passes.
