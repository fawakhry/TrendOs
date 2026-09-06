# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. مسار Trend Master ومسار D1 / Cloudflare موثقان هنا مع إبقاء حدود كل مسار منفصلة.

## PERF-CF-02CU — Stability / Freshness / Resume Guards

الحالة الحالية: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — D1 STALE-READ FAIL-SAFE LIVE — RETURN/FOCUS FULL AUTO-REFRESH + RESIDUAL RETURN TRAFFIC TECHNICAL PASS + PRODUCTION DEPLOYED — USER-VISIBLE RESUME VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING**

السجل العام:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`

سجل Navigation / Return المحدّث:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`

Production state relevant to 02CU:

- production main: `9552407c5a5136371f9afd452b913c226329d7dc`
- stale D1 required mirrors older than 5 minutes fail open to Apps Script
- legacy focus / visibility / 3-minute `safeRefresh()` full refresh is suppressed without disabling manual refresh
- residual Attendance visibility `loadState()` and Employee Manager focus refresh are suppressed by a narrow early frontend guard; their periodic timers remain enabled
- primary no-auto-refresh Pages Run `34027347761` — **SUCCESS**
- residual return-traffic bounded production Run `34028483654` — **SUCCESS**
- residual return-traffic GitHub Pages Run `34028490166` — **SUCCESS**
- dedicated Return Traffic Quiet CI Run `34028439196` — **SUCCESS**
- same-head candidate Integrity Run `34028439136` — **SUCCESS**
- bounded-deploy push Integrity Run `34028483586` — **SUCCESS**
- no Apps Script deploy / no Worker deploy / no D1 write / no 02CL / no generic drain / no secret rotation

User-visible resume validation remains pending. Underlying Orders Live Sync heartbeat recovery remains a separate pending 02CU item. The freshness gate is the safety fallback until that heartbeat is restored and qualified.

---

## Trend Master V1931 — checkpoint منفصل

`TM-V1931-RESILIENCE — Trend Master Panel Resilience Candidate`

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate commit:

`03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

CI:

- Trend Master V1931 Resilience CI — Run `34006722152` — **SUCCESS**
- TrendOS Integrity V1 — Run `34006722115` — **SUCCESS**

النشر الخاص بـTrend Master ما زال غير منفذ؛ Apps Script panel endpoint يحتاج موافقة صريحة منفصلة قبل أي Production deployment.

---

## D1 / Cloudflare — آخر checkpoint مغلق

`PERF-CF-02CT — Production Frontend D1 Orders Read Cutover`

الحالة: **CLOSED — TECHNICAL VERIFIED PASS + USER-VISIBLE PASS — FRONTEND D1 ORDERS READ ON — QUALIFIED `/v1/edge/orders/02cr/page` — APPS SCRIPT FALLBACK RETAINED — SHEETS/APPS SCRIPT AUTHORITATIVE**

السجل التقني:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md`

سجل تأكيد المستخدم النهائي:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_USER_VISIBLE_PASS.md`

### 02CT baseline

- Worker: `trendos-d1-api`
- Worker version: `c77bf453-c590-4cff-a55b-fd9c625b6d76` — 100% Worker traffic
- eligible `getRowsPageV1931` frontend reads: **D1 first**
- qualified route: `/v1/edge/orders/02cr/page`
- any Edge failure: **Apps Script fallback**
- `__DEBT__`: **Apps Script**
- all writes: **Apps Script / Sheets**
- Sheets / Apps Script authority: **YES**
- Worker internal `cutover=false`
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- `pendingOutbox=0`
- secret rotation: **NO**

### 02CT evidence

- qualification Run `34010739030` — **SUCCESS**
- Integrity Run `34010738989` — **SUCCESS**
- production cutover Run `34010864525` — **SUCCESS**
- GitHub Pages Run `34010872232` — **SUCCESS**
- durable regression Run `34011062287` — **SUCCESS**
- same-head Integrity Run `34011062262` — **SUCCESS**
- user-visible validation: `فل` — **PASS**

### نقطة الوقوف الدقيقة — 02CT

`PERF-CF-02CT CLOSED — TECHNICAL PASS + USER-VISIBLE PASS — PRODUCTION FRONTEND D1 ORDERS READ ON THROUGH QUALIFIED /02CR ROUTE — APPS SCRIPT FALLBACK RETAINED — SHEETS/APPS SCRIPT AUTHORITY RETAINED`

## ثوابت الأمان المشتركة

- Sheets / Apps Script تظل authoritative.
- Frontend D1 Orders read ON للقراءات المؤهلة فقط، مع freshness fail-open إلى Apps Script.
- writes لا تزال Apps Script / Sheets.
- `__DEBT__` يبقى Apps Script fallback.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- أي Apps Script deployment يحتاج نطاق وموافقة مناسبة منفصلة.

## checkpoints سابقة — D1 track

- `PERF-CF-02CU` — IN PROGRESS / freshness fail-safe live / full return auto-refresh suppressed / residual return traffic quiet guard deployed / user-visible resume validation + sync heartbeat recovery pending
- `PERF-CF-02CT` — CLOSED / TECHNICAL PASS + USER-VISIBLE PASS / production frontend D1 read ON / qualified `/02cr` / fallback retained
- `PERF-CF-02CS` — PRODUCTION WORKER ROUTE VERIFIED PASS / frontend OFF at close
- `PERF-CF-02CR` — full field / identity / filtering qualification
- `PERF-CF-02CQ` — screen-view mirror freshness + identity PASS
- `PERF-CF-02CO` — auth pass / stale view blocker
- `PERF-CF-02CN` — candidate / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
