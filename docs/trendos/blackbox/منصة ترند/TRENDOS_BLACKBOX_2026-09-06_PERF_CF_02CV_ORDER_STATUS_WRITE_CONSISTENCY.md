# PERF-CF-02CV — Order Status Save / Read-After-Write Consistency

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**PRODUCTION TECHNICAL PASS — USER-VISIBLE SAVE VALIDATION PENDING**

## User report

After PERF-CF-02CU was closed with user-visible PASS, the user reported a separate production issue:

`بعد كده شوف حالات الاوردر لما بغيرها واعمل حفظ مش بتحفظ`

02CU remains CLOSED. This checkpoint is a separate write/update consistency fix.

## Root cause

The UI save path calls Apps Script action `updateLine` and then immediately calls `loadRows(true)`.

Two consistency hazards were confirmed:

1. D1 serves `rowNumber` from its mirror snapshot. The existing Apps Script `updateLine_` trusted a valid `rowNumber` before resolving the stable `lineId`. If source rows shifted after the D1 snapshot, the mirror coordinate could point to a different source row.
2. Even when the Apps Script write succeeded, the immediate reload could read a D1 mirror that was still physically fresh under the five-minute freshness gate but predated the just-completed Sheets write. The UI could repaint the old status and make the save look unsuccessful.

Orders Low-Usage source-change detection runs every five minutes, so D1 is not guaranteed to contain a just-completed authoritative write immediately.

## Safe fix

Frontend-only change in:

`trendos-edge-orders-read-v1.js`

Version:

`EDGE_ORDERS_READ_02CV_WRITE_CONSISTENCY_20260906`

Behavior:

- `updateLine` still writes only through the original Apps Script API.
- When a stable `lineId` exists, the wrapper removes D1 `rowNumber` before forwarding the write, forcing the existing Apps Script backend to resolve the current row by `lineId`.
- Legacy rows without `lineId` retain `rowNumber` as compatibility fallback.
- A successful write opens a same-browser post-write read barrier.
- Default barrier is 6 minutes, bounded to 10 minutes maximum if configured.
- During the barrier, eligible Orders reads temporarily use authoritative Apps Script so an older D1 mirror cannot repaint pre-write state.
- After the barrier expires, normal qualified D1-first + 02CU dual-signal behavior resumes automatically.
- Failed/rejected writes do not open a barrier.

## Authority / safety invariants

- Apps Script / Sheets remain authoritative for writes.
- No order-status write is routed to D1.
- No Apps Script deployment occurred.
- No Worker deployment occurred.
- No D1 business-data write was introduced by 02CV.
- `__DEBT__` remains Apps Script.
- 02CU dual-signal read behavior remains intact outside the short post-write barrier.
- 02CL/reconcile remains OFF.
- generic drain remains OFF.
- no secret rotation / no `EDGE_SESSION_SECRET` change.

## Tests

Durable test:

`tests/frontend_order_status_write_consistency_02cv.test.mjs`

Coverage:

- pre-write reads remain D1-first;
- `updateLine` stays Apps Script-only;
- stable `lineId` strips stale D1 `rowNumber`;
- `orderId`, `lineId`, status, and notes are preserved;
- successful write opens the barrier;
- immediate reload uses Apps Script without querying the Edge page;
- barrier clear/expiry restores D1-first;
- legacy rows without `lineId` retain rowNumber;
- rejected writes do not open a barrier.

The test was added to durable `TrendOS Integrity V1`.

Integrity Run `34035164288` — **SUCCESS**, including `Run 02CV order status write consistency tests` — **PASS**.

## Production promotion

Production baseline before promotion:

- main: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- Worker: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%

Production frontend changed exactly:

1. `trendos-edge-orders-read-v1.js`
2. `config.js` — only the Edge wrapper cache-bust loader value

New Production main:

`0088ed5625e8359f8551525ae41df3b25248b494`

Compare from `eab0dd...` confirms exactly two changed files:

- `config.js`: 1 addition / 1 deletion
- `trendos-edge-orders-read-v1.js`: 02CV write consistency guard

GitHub Pages final deployment:

- Run `34035270632` — **SUCCESS**
- deployed head: `0088ed5625e8359f8551525ae41df3b25248b494`

No Apps Script or Worker deployment was performed for 02CV.

## Remaining close condition

Only user-visible validation remains:

1. refresh the platform once so the new cache-busted frontend loads;
2. change a real order-line status;
3. press Save;
4. confirm the chosen status remains saved instead of immediately reverting.

Do not mark 02CV CLOSED until the user confirms the live save behavior.

## Exact stop point

`PERF-CF-02CV IN PROGRESS — ROOT CAUSE CONFIRMED: D1 MIRROR ROWNUMBER WAS NOT A STABLE WRITE IDENTITY + IMMEDIATE POST-WRITE D1 READ COULD REPAINT PRE-WRITE STATE — FRONTEND-ONLY WRITE-CONSISTENCY FIX PROMOTED — INTEGRITY 34035164288 SUCCESS — PRODUCTION MAIN 0088ed5625e8359f8551525ae41df3b25248b494 — PAGES 34035270632 SUCCESS — WORKER UNCHANGED 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — APPS SCRIPT/SHEETS WRITE AUTHORITY RETAINED — USER-VISIBLE STATUS SAVE VALIDATION PENDING`
