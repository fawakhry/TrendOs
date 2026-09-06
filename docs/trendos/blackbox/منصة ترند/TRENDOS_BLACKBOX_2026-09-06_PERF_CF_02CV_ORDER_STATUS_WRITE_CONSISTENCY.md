# PERF-CF-02CV — Order Status Save / Read-After-Write Consistency

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**PRODUCTION TECHNICAL + UX + FLY-PRINT LANE-STABILITY PASS — DURABLE INTEGRITY GUARD ACTIVE — USER-VISIBLE VALIDATION PENDING**

## Initial user report

`بعد كده شوف حالات الاوردر لما بغيرها واعمل حفظ مش بتحفظ`

02CU remains CLOSED. 02CV is a separate order-status write/read consistency checkpoint.

## Initial root cause and fix

Two hazards were confirmed:

1. D1 `rowNumber` is a mirror coordinate, not a stable write identity. Apps Script `updateLine_` trusted rowNumber before `lineId`.
2. A successful Sheets write could be followed by an older-but-still-qualified D1 read, repainting the pre-write status.

Frontend wrapper fix `EDGE_ORDERS_READ_02CV_WRITE_CONSISTENCY_20260906`:

- `updateLine` remains Apps Script / Sheets only.
- if stable `lineId` exists, the wrapper omits D1 `rowNumber` before the write.
- successful writes open a bounded local post-write Apps Script read barrier.
- normal D1-first `/02cr` behavior resumes after the barrier.
- rejected writes do not open the barrier.

Initial Production main: `0088ed5625e8359f8551525ae41df3b25248b494`.
Initial Pages Run `34035270632` — **SUCCESS**.
Integrity Run `34035164288` — **SUCCESS**.

## First follow-up user report

`بيعمل تم الحفظ بس الاوردر مش بيختفر بعد الحفظ لازم اعمل رفريش عشان يختفى وبياخد وقت كبير فى الحفز و الطباعة على الطاير مش بااعلم جنبها يعنى العلامة بتاع طباعة ع الطاير اختفت`

Three UX symptoms were isolated:

1. hidden statuses did not disappear immediately after successful save;
2. the immediate post-save `loadRows(true)` caused another authoritative Apps Script page read during the 02CV barrier, keeping the UI in a loading state and making save feel slow;
3. the Fly Print marker was not visible where the user expected it next to status.

### First Fly Print read-only qualification

A temporary read-only D1 probe verified the data path without exposing business-row contents and without any D1 write:

- `بنود الأوردرات` mirror: 378 / 378 rows, 82 columns, `ready`;
- fly header exists as `طباعة على الطاير` at index 44;
- D1 data rows: 377;
- affirmative Fly Print rows: 38;
- Worker `mapMirrorRows(..., 'print')`: 171 print rows, all 38 Fly Print rows preserved.

Read-only mapper qualification Run `34036288004` — **SUCCESS**.

### First follow-up UX fix

Qualified candidate Run `34036609469` — **SUCCESS**.

Production patch changed only `app.js` + `index.html` cache-bust and made these changes:

- after `updateLine` success, local row state is re-rendered immediately with `applyFiltersAndRender(false)`;
- hidden statuses disappear immediately without waiting for a second page read;
- immediate post-save `loadRows(true)` removed;
- success state ends with `تم حفظ التعديل في الشيت.`;
- status cell uses existing `statusBadges(r)` so priority + press + `⚡ طباعة على الطاير` are visible beside status;
- cache-bust became `trendos-02cv-statusux-20260906b`.

Production promotion Run `34036640992` — **SUCCESS**.
Production main became `b4a87493ca9ce7507fc342e9b39f91449395fb46`.
GitHub Pages Run `34036646377` — **SUCCESS**.

## Second follow-up user report — Fly Print marker disappears after sheet change

User then reported:

`العلامة بتظهر بس اول لما اغير حاجة فى الشيت بتطير`

This narrowed the issue: the marker could render correctly initially but disappear after a later sheet/read refresh.

### Post-edit live read-only proof

A new read-only probe was run **after the user's sheet edit**.

Run `34038294884` — **SUCCESS**.

Live D1 state at that time:

- Lines sourceLastRow: 381;
- Lines sourceLastCol: 82;
- Lines rowCount: 381;
- catalog status: `ready`;
- note: `TrendOS orders live sync V2 quota-aware`;
- Fly Print header still index 44 as `طباعة على الطاير`;
- D1 data rows: 380;
- affirmative Fly Print rows: **39**;
- Worker print mapper rows: 173;
- Worker mapped Fly Print rows: **39**.

Therefore the user's sheet change did **not** erase Fly Print from Sheets→D1 mirror semantics, and the Worker preserved all 39/39 values.

This excluded D1 sync as the cause. No D1 sync code was changed.

### Read-lane/frontend root cause class

The main frontend `loadRows()` replaces `state.rows` with the active read response. The platform can legitimately switch between qualified D1-first and an Apps Script fallback/barrier lane.

If a subsequent row payload for the same line omits Fly Print fields entirely, replacing the prior complete row removes the only fields used by `isFlyPrint(...)`, so the visible badge disappears although D1 still contains the affirmative marker.

The GitHub Apps Script source itself maps `flyPrint` / `quickPrint`; a direct live Apps Script comparison probe could not be treated as authoritative because the stored qualification credential returned `success:false` before rows were returned. No conclusion about the deployed Apps Script payload was inferred from that failed auth probe.

The frontend fix therefore handles only the safe schema-omission case and does not fabricate a source value.

## Fly Print lane-stability fix

Helper added to the frontend:

`preserveFlyPrintAcrossMissingFields(previousRows, nextRows)`

Rules:

1. only a stable `lineId` is used for matching;
2. only a previously affirmative Fly Print marker is eligible for carry-forward;
3. carry-forward occurs only when the new row omits **all** known Fly Print fields:
   - `flyPrint`
   - `quickPrint`
   - `fastPrint`
   - `طباعة على الطاير`
   - `طباعة ع الطاير`
4. if the new row explicitly contains any Fly Print field, its value is respected — including `لا` or an explicit blank;
5. no `orderId` or `rowNumber` fallback is used;
6. no backend or D1 write is performed by the guard.

`loadRows()` now normalizes the next row page through this helper before replacing `state.rows`.

Cache-bust changed to:

`trendos-02cv-flylane-20260906c`

### Candidate qualification

Final Candidate Run `34039276230` — **SUCCESS**.

It verified:

- `PERF_CF_02CV_FLYPRINT_LANE_STABILITY_PASS`;
- `PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY_PASS`;
- `PERF_CF_02CV_ORDER_STATUS_UX_PASS`;
- JavaScript syntax PASS;
- exact candidate diff only `app.js` + `index.html`.

Two earlier candidate failures were test-harness-only path/cache-bust expectation issues; the focused lane-stability test itself had already passed. They made no Production change.

### Production promotion

Production baseline was hard-locked to:

`b4a87493ca9ce7507fc342e9b39f91449395fb46`

Promotion Run `34039313773` — **SUCCESS**.

The exact production scope was:

1. `app.js` — lane-stability helper + row replacement normalization;
2. `index.html` — one `app.js` cache-bust line.

New Production main:

`3934fa363b113a4bd494ec501fb5f289f2c48ec1`

Commit message:

`Keep fly-print badge stable across read lanes`

GitHub Pages Run `34039321631` — **SUCCESS** on head `3934fa363b113a4bd494ec501fb5f289f2c48ec1`.

## Durable Integrity guard and cleanup

The focused regression is now permanent:

`tests/frontend_flyprint_lane_stability_02cv.test.mjs`

The normal working-branch Integrity workflow now executes it together with the existing 02CV write-consistency contract. The permanent test verifies:

- affirmative Fly Print is preserved when a later payload for the same stable `lineId` omits every Fly Print field;
- an explicit `لا` remains authoritative;
- an explicit blank field remains authoritative;
- unmatched or unstable identities do not receive an invented marker;
- Arabic explicit Fly Print fields are respected.

After Production promotion, the following one-use artifacts were removed from the working branch:

- 02CV Fly Print D1 read-only workflow;
- 02CV Fly Print live-lanes read-only workflow;
- 02CV Fly Print lane-stability candidate workflow;
- 02CV Fly Print promotion workflow;
- `tools/patch_02cv_flyprint_lane_stability.py`.

The production code and durable regression test remain. Cleanup did not touch `main`, Apps Script, Worker, or D1 business data.

## Authority / safety invariants retained

- Apps Script / Sheets remain authoritative for all Orders writes.
- No order-status write is routed to D1.
- No Apps Script deployment occurred.
- No Worker deployment occurred.
- Production Worker remains `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%.
- No D1 business-data write was introduced by this fix.
- D1 live sync was not modified because post-edit proof showed it retained 39/39 Fly Print values.
- `__DEBT__` remains Apps Script.
- 02CU dual-signal behavior remains intact.
- 02CL/reconcile remains OFF.
- generic drain remains OFF.
- no secret rotation / no `EDGE_SESSION_SECRET` change.

## Remaining close condition

User-visible validation only:

1. refresh once so `app.js?v=trendos-02cv-flylane-20260906c` loads;
2. identify a real Fly Print order and confirm `⚡ طباعة على الطاير` is visible;
3. change/save something or let the sheet/read lane update;
4. confirm the same Fly Print row keeps the marker;
5. verify hidden-status save still removes the row immediately and no second long Orders loading cycle appears.

Do not mark 02CV CLOSED until the user confirms these live behaviors.

## Exact stop point

`PERF-CF-02CV IN PROGRESS — PRODUCTION TECHNICAL + UX + FLY-PRINT LANE-STABILITY PASS — DURABLE INTEGRITY GUARD ACTIVE — MAIN 3934fa363b113a4bd494ec501fb5f289f2c48ec1 — PAGES 34039321631 SUCCESS — PROMOTION 34039313773 SUCCESS — CANDIDATE 34039276230 SUCCESS — POST-EDIT D1/WORKER READ-ONLY 34038294884 SUCCESS (39/39 PRESERVED) — D1 SYNC UNCHANGED — FRONTEND CARRY-FORWARD ONLY FOR MISSING FLY FIELDS AND STABLE lineId — EXPLICIT SOURCE VALUES AUTHORITATIVE — TEMP FLY-PRINT PROBE/CANDIDATE/PROMOTION WORKFLOWS + ONE-USE PATCHER CLEANED — PERMANENT REGRESSION TEST RETAINED AND WIRED INTO NORMAL INTEGRITY — WORKER UNCHANGED 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — NO APPS SCRIPT DEPLOY — APPS SCRIPT/SHEETS WRITE AUTHORITY RETAINED — USER-VISIBLE VALIDATION PENDING`
