# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Current active checkpoint — PERF-CF-02CV

`PERF-CF-02CV — Order Status Save / Read-After-Write Consistency`

الحالة: **IN PROGRESS — PRODUCTION TECHNICAL PASS — USER-VISIBLE STATUS SAVE VALIDATION PENDING**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md`

المشكلة المبلغ عنها:

`تغيير حالة الأوردر ثم حفظ يبدو كأنه لا يُحفظ / يرجع للحالة القديمة.`

Root cause confirmed:

- D1 `rowNumber` هو mirror coordinate وليس stable write identity، بينما Apps Script `updateLine_` كان يثق في rowNumber قبل `lineId`.
- بعد write ناجح إلى Sheets، `loadRows(true)` كان يستطيع قراءة D1 mirror سابقًا للكتابة لكنه ما زال physically fresh، فيعيد رسم الحالة القديمة.

Production fix الحالي:

- main: `0088ed5625e8359f8551525ae41df3b25248b494`
- Worker unchanged: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%
- Apps Script deployment: **NO**
- Worker deployment: **NO**
- `updateLine` write authority: Apps Script / Sheets only
- stable `lineId` now causes stale D1 `rowNumber` to be omitted before write
- after successful write, same browser temporarily reads Orders from authoritative Apps Script for 6 minutes, then resumes normal D1-first reads
- legacy rows without `lineId` retain rowNumber fallback
- `__DEBT__` unchanged on Apps Script
- 02CU dual-signal behavior retained outside the short post-write barrier

Evidence:

- durable 02CV test added to Integrity
- Integrity Run `34035164288` — **SUCCESS**, including 02CV write consistency test PASS
- exact production diff from prior main: only `trendos-edge-orders-read-v1.js` + one cache-bust line in `config.js`
- GitHub Pages Run `34035270632` — **SUCCESS** on head `0088ed5625e8359f8551525ae41df3b25248b494`

Remaining close condition:

**User-visible test: change a real order status → Save → verify it remains saved.**

---

## PERF-CF-02CU — CLOSED

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

User confirmation:

`ثبت`

Records:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_USER_VISIBLE_PASS.md`

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
