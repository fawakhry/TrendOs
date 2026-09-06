# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Current active checkpoint — PERF-CF-02CV

`PERF-CF-02CV — Order Status Save / Read-After-Write Consistency`

الحالة: **IN PROGRESS — PRODUCTION TECHNICAL + UX PATCH PASS — USER-VISIBLE VALIDATION PENDING**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md`

آخر مشاكل المستخدم التي يغطيها 02CV:

- الحالة تحفظ لكن الصف المخفي لا يختفي إلا بعد Refresh.
- واجهة الحفظ تدخل في دورة تحميل إضافية وتبدو بطيئة.
- علامة `⚡ طباعة على الطاير` لم تعد ظاهرة بجانب الحالة.

Production الآن:

- main: `b4a87493ca9ce7507fc342e9b39f91449395fb46`
- Worker unchanged: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%
- Apps Script deployment: **NO**
- Worker deployment: **NO**
- Orders write authority: Apps Script / Sheets only
- `__DEBT__`: Apps Script
- 02CL/reconcile: OFF
- generic drain: OFF
- no secret rotation

02CV UX follow-up fix:

- local render immediately after confirmed save, so hidden statuses disappear without manual Refresh;
- removed immediate post-save `loadRows(true)` page read;
- success loading state now ends immediately;
- status cell uses `statusBadges(r)` and explicitly shows `⚡ طباعة على الطاير` when the row is Fly Print;
- app cache-bust: `trendos-02cv-statusux-20260906b`.

Fly Print qualification proved D1/Worker data path healthy:

- 377 D1 data rows;
- 38 Fly Print rows;
- Worker print mapper preserved all 38/38.
- read-only Run `34036288004` — **SUCCESS**.

Evidence:

- 02CV write consistency Integrity Run `34035164288` — **SUCCESS**
- UX candidate Run `34036609469` — **SUCCESS**
- UX Production promotion Run `34036640992` — **SUCCESS**
- GitHub Pages Run `34036646377` — **SUCCESS**

Remaining close condition:

**User-visible test: refresh once → save a hidden status and verify the row disappears immediately → verify Fly Print ⚡ is visible.**

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
