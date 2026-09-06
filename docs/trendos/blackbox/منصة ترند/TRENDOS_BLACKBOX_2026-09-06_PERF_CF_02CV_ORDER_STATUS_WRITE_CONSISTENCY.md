# PERF-CF-02CV — Order Status Save / Read-After-Write Consistency

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

## Closure decision

User instruction on 2026-09-06:

`مفيش عندى حاليا حاجة اجرب عليها اقفله ولو طلع فيه مشاكل فيما بعد نرجعله تانى`

Classification of this closure:

- 02CV is closed now by explicit user acceptance;
- there is no suitable live row currently available to repeat the final user-visible test;
- **no user-visible PASS is fabricated or recorded**;
- live validation is intentionally deferred;
- if save/repaint/Fly Print symptoms reappear, reopen 02CV or create a new bounded checkpoint with the new live evidence.

## Initial user report

`بعد كده شوف حالات الاوردر لما بغيرها واعمل حفظ مش بتحفظ`

02CU remained CLOSED. 02CV was opened as a separate order-status write/read consistency checkpoint.

## Confirmed initial root cause

Two consistency hazards were confirmed:

1. D1 `rowNumber` is a mirror coordinate, not a stable write identity. Existing Apps Script `updateLine_` trusted `rowNumber` before stable `lineId`.
2. A successful Sheets write could be followed by an older-but-still-qualified D1 read, repainting the pre-write status and making a successful save appear not to persist.

## Initial fix

Frontend wrapper version:

`EDGE_ORDERS_READ_02CV_WRITE_CONSISTENCY_20260906`

Behavior:

- `updateLine` remains Apps Script / Sheets only;
- when stable `lineId` exists, stale D1 `rowNumber` is omitted before the authoritative write;
- successful writes open a bounded local post-write Apps Script read barrier;
- normal D1-first `/02cr` behavior resumes after the barrier;
- rejected writes do not open the barrier.

Initial Production main after this fix:

`0088ed5625e8359f8551525ae41df3b25248b494`

Initial Pages Run `34035270632` — **SUCCESS**.
Initial Integrity Run `34035164288` — **SUCCESS**.

## Follow-up UX issue

User then reported that:

- save showed success but hidden-status rows did not disappear until Refresh;
- save felt slow because another Orders load started;
- `⚡ طباعة على الطاير` was no longer visible beside status.

The UX fix:

- locally re-renders state immediately after successful `updateLine`;
- removes immediate post-save `loadRows(true)`;
- hidden statuses can disappear immediately without waiting for another page read;
- status rendering uses the existing badge path so `⚡ طباعة على الطاير` is visible;
- no write authority was moved away from Apps Script / Sheets.

Qualified candidate Run `34036609469` — **SUCCESS**.
Production promotion Run `34036640992` — **SUCCESS**.
Production main at that stage: `b4a87493ca9ce7507fc342e9b39f91449395fb46`.
Pages Run `34036646377` — **SUCCESS**.

## Fly Print regression after sheet changes

User then reported:

`العلامة بتظهر بس اول لما اغير حاجة فى الشيت بتطير`

A post-edit read-only qualification proved the source path had **not** lost the Fly Print values:

- D1 Lines mirror: 381 / 381 rows, 82 columns, `ready`;
- D1 data rows: 380;
- affirmative Fly Print rows: **39**;
- Worker print mapper preserved **39/39**.

Read-only Run `34038294884` — **SUCCESS**.

This excluded D1 live sync as the cause.

## Fly Print lane-stability root cause and fix

The frontend replaces `state.rows` when the active read lane changes or refreshes. A later payload for the same line that omitted Fly Print fields could replace a previously complete row and remove the visible badge even though D1 still retained the marker.

Helper added:

`preserveFlyPrintAcrossMissingFields(previousRows, nextRows)`

Guard rules:

1. only stable `lineId` is used for identity;
2. only a previously affirmative Fly Print marker is eligible for carry-forward;
3. carry-forward occurs only if the new payload omits **all** known Fly Print fields;
4. explicit new values remain authoritative, including `لا` and explicit blank;
5. no `orderId` / `rowNumber` fallback is used;
6. the guard performs no backend or D1 business-data write.

Production cache-bust:

`trendos-02cv-flylane-20260906c`

Candidate Run `34039276230` — **SUCCESS**.

Production promotion Run `34039313773` — **SUCCESS**.

Final 02CV Production main:

`3934fa363b113a4bd494ec501fb5f289f2c48ec1`

Production commit message:

`Keep fly-print badge stable across read lanes`

GitHub Pages Run `34039321631` — **SUCCESS** on the same Production head.

## Durable regression and cleanup

Permanent regression retained:

`tests/frontend_flyprint_lane_stability_02cv.test.mjs`

The normal Integrity workflow runs it alongside the existing 02CV write-consistency test.

The permanent test verifies:

- affirmative Fly Print survives a later payload that omits every Fly Print field for the same stable `lineId`;
- explicit `لا` stays authoritative;
- explicit blank stays authoritative;
- unmatched or unstable identities do not receive invented markers;
- Arabic explicit Fly Print fields are respected.

One-use probe/candidate/promotion workflows and the temporary patcher were removed after qualification.

The qualified app logic was also synchronized back to the working branch in a bounded `app.js`-only parity change so the durable regression tests the same protection logic rather than an older working-branch implementation.

Final durable parity Integrity Run before closure documentation:

`34041121863` — **SUCCESS**.

## Production safety invariants retained

- Apps Script / Sheets remain authoritative for all Orders writes.
- No order-status write is routed to D1.
- No Apps Script deployment occurred for 02CV.
- No Worker deployment occurred for 02CV.
- Production Worker remains `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%.
- No D1 business-data write was introduced by the frontend fix.
- D1 live sync was not modified by the Fly Print fix.
- `__DEBT__` remains Apps Script.
- 02CU dual-signal behavior remains intact.
- 02CL/reconcile remains OFF.
- generic drain remains OFF.
- no secret rotation / no `EDGE_SESSION_SECRET` change.

## Deferred live validation

The previously planned live close test was:

1. refresh Production once;
2. identify a real `⚡ طباعة على الطاير` row;
3. change/save something or allow a read-lane update;
4. confirm the same row keeps its marker;
5. verify hidden-status rows disappear immediately after successful save and no second long Orders load occurs.

At closure time, the user had no suitable real row available to perform this test. The user explicitly instructed that the checkpoint be closed now and revisited if a future real case exposes a problem.

## Exact closed stop point

`PERF-CF-02CV CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED / NOT RECORDED AS USER-VISIBLE PASS — MAIN 3934fa363b113a4bd494ec501fb5f289f2c48ec1 — PAGES 34039321631 SUCCESS — PROMOTION 34039313773 SUCCESS — CANDIDATE 34039276230 SUCCESS — POST-EDIT D1/WORKER READ-ONLY 34038294884 SUCCESS (39/39 PRESERVED) — DURABLE FLY-PRINT REGRESSION ACTIVE — DURABLE PARITY INTEGRITY 34041121863 SUCCESS — WORKER 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% UNCHANGED — NO APPS SCRIPT DEPLOY — APPS SCRIPT/SHEETS WRITE AUTHORITY RETAINED — REOPEN 02CV OR OPEN A NEW BOUNDED CHECKPOINT IF THE LIVE SYMPTOM REAPPEARS`
