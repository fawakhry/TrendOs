# PERF-CF-02CV — Order Status Save / Read-After-Write Consistency

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**PRODUCTION TECHNICAL + UX PATCH PASS — USER-VISIBLE VALIDATION PENDING**

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

## Follow-up user report

After the initial 02CV promotion the user reported:

`بيعمل تم الحفظ بس الاوردر مش بيختفر بعد الحفظ لازم اعمل رفريش عشان يختفى وبياخد وقت كبير فى الحفز و الطباعة على الطاير مش بااعلم جنبها يعنى العلامة بتاع طباعة ع الطاير اختفت`

Three UX symptoms were isolated:

1. hidden statuses did not disappear immediately after successful save;
2. the immediate post-save `loadRows(true)` caused another authoritative Apps Script page read during the 02CV barrier, keeping the UI in a loading state and making save feel slow;
3. the Fly Print marker was not visible where the user expected it next to status.

## Fly Print read-only qualification

A temporary read-only D1 probe verified the data path without exposing business-row contents and without any D1 write:

- `بنود الأوردرات` mirror: 378 / 378 rows, 82 columns, `ready`.
- fly header exists as `طباعة على الطاير` at index 44.
- D1 data rows: 377.
- affirmative Fly Print rows: **38**.
- Worker `mapMirrorRows(..., 'print')`: 171 print rows, **all 38 Fly Print rows preserved**.

Read-only mapper qualification Run `34036288004` — **SUCCESS**.

Conclusion: Sheets/D1/Worker did not lose the Fly Print value. The display issue was frontend UX/layout/runtime only.

## Follow-up frontend UX fix

Qualified candidate Run `34036609469` — **SUCCESS**.

Production patch changed only:

1. `app.js`
2. `index.html` — only the `app.js` cache-bust token

Behavior now:

- after `updateLine` returns success, the local row state is re-rendered immediately with `applyFiltersAndRender(false)`;
- hidden statuses disappear immediately without waiting for a second page read;
- the old immediate `loadRows(true)` after save was removed;
- success state now ends with `تم حفظ التعديل في الشيت.` instead of starting another loading cycle;
- the status cell now uses the existing `statusBadges(r)` renderer, so priority + press + `⚡ طباعة على الطاير` are explicitly visible beside status;
- existing work-cell Fly Print badge remains intact;
- `app.js` cache-bust is `trendos-02cv-statusux-20260906b`.

Production promotion Run `34036640992` — **SUCCESS**.

New Production main:

`b4a87493ca9ce7507fc342e9b39f91449395fb46`

Promotion diff was exactly two files, 7 insertions / 3 deletions.

GitHub Pages Run `34036646377` — **SUCCESS** on the new main.

## Authority / safety invariants retained

- Apps Script / Sheets remain authoritative for all Orders writes.
- No order-status write is routed to D1.
- No Apps Script deployment occurred.
- No Worker deployment occurred.
- Production Worker remains `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%.
- No D1 business-data write was introduced by 02CV.
- `__DEBT__` remains Apps Script.
- 02CU dual-signal behavior remains intact.
- 02CL/reconcile remains OFF.
- generic drain remains OFF.
- no secret rotation / no `EDGE_SESSION_SECRET` change.

## Remaining close condition

User-visible validation only:

1. refresh platform once so `app.js?v=trendos-02cv-statusux-20260906b` loads;
2. change a real order status to a hidden status and Save — row should disappear without manual refresh;
3. verify save no longer enters a second long `جاري تحميل الأوردرات` cycle;
4. verify `⚡ طباعة على الطاير` is visible beside status for a Fly Print order.

Do not mark 02CV CLOSED until the user confirms these live behaviors.

## Exact stop point

`PERF-CF-02CV IN PROGRESS — PRODUCTION TECHNICAL + UX PATCH PASS — MAIN b4a87493ca9ce7507fc342e9b39f91449395fb46 — PAGES 34036646377 SUCCESS — CANDIDATE 34036609469 SUCCESS — FLY PRINT D1/WORKER READ-ONLY QUALIFICATION 34036288004 SUCCESS (38/38 PRESERVED) — IMMEDIATE POST-SAVE PAGE READ REMOVED — LOCAL SUCCESS RENDER ACTIVE — FLY STATUS BADGE ACTIVE — WORKER UNCHANGED 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — APPS SCRIPT/SHEETS WRITE AUTHORITY RETAINED — USER-VISIBLE VALIDATION PENDING`
