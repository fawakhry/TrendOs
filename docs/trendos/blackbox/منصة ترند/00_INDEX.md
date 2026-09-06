# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## PERF-CF-02CV — CLOSED

`PERF-CF-02CV — Order Status Save / Read-After-Write Consistency`

الحالة: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md`

قرار الإغلاق من المستخدم بتاريخ 2026-09-06:

`مفيش عندى حاليا حاجة اجرب عليها اقفله ولو طلع فيه مشاكل فيما بعد نرجعله تانى`

معنى الإغلاق هنا:

- الإصلاح التقني منشور ومؤهل؛
- لا يوجد Test Case حي متاح حاليًا لإعادة الاختبار المرئي؛
- المستخدم وافق على إغلاق 02CV بدل إبقائه معلّقًا؛
- **لم يتم تسجيل User-Visible PASS فعلي**؛ التحقق الحي مؤجل؛
- إذا عادت مشكلة حفظ الحالة أو اختفاء `⚡ طباعة على الطاير` لاحقًا، يتم فتح Checkpoint جديد أو إعادة فتح 02CV مع تسجيل الواقعة الجديدة.

Production baseline عند الإغلاق:

- main: `3934fa363b113a4bd494ec501fb5f289f2c48ec1`
- Worker unchanged: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%
- Apps Script deployment: **NO**
- Worker deployment: **NO**
- Orders write authority: Apps Script / Sheets only
- `__DEBT__`: Apps Script
- 02CL/reconcile: OFF
- generic drain: OFF
- no secret rotation

02CV fixes live at closure:

- stable `lineId` write identity retained; stale D1 `rowNumber` is not used when lineId exists;
- local render immediately after confirmed save, so hidden statuses can disappear without manual Refresh;
- immediate post-save `loadRows(true)` removed;
- status cell explicitly supports `⚡ طباعة على الطاير`;
- read-lane stability guard preserves an already-proven Fly Print marker only when a subsequent row payload for the same stable `lineId` omits all Fly Print fields entirely;
- explicit new values (`نعم` / `لا` / blank field present) remain authoritative and are never overridden;
- app cache-bust: `trendos-02cv-flylane-20260906c`.

Qualification evidence:

- post-edit D1/Worker read-only Run `34038294884` — **SUCCESS**, 39/39 Fly Print values preserved;
- candidate Run `34039276230` — **SUCCESS**;
- Production promotion Run `34039313773` — **SUCCESS**;
- GitHub Pages Run `34039321631` — **SUCCESS** on `3934fa363b113a4bd494ec501fb5f289f2c48ec1`;
- durable Integrity regression is active in `tests/frontend_flyprint_lane_stability_02cv.test.mjs`;
- final durable parity Integrity Run `34041121863` — **SUCCESS**.

---

## PERF-CF-02CU — CLOSED

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

User confirmation: `ثبت`

02CU close baseline was main `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`, Worker `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%, D1-first qualified Orders reads, Apps Script fallback retained, Sheets authority retained, 02CL/generic drain OFF, no secret rotation.

---

## Trend Master V1931 — separate track

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

Record:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate commit: `03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

- Trend Master V1931 Resilience CI Run `34006722152` — SUCCESS
- TrendOS Integrity V1 Run `34006722115` — SUCCESS

Apps Script panel endpoint still requires separate Production approval before any deploy.

---

## Shared safety invariants

- Sheets / Apps Script authoritative.
- eligible Orders reads D1-first with fail-open Apps Script fallback.
- Orders writes remain Apps Script / Sheets.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- Customer Feedback auto scan OFF.
- Go-Live Autopilot auto sweep OFF.
- Trend Master bounded protections retained.
