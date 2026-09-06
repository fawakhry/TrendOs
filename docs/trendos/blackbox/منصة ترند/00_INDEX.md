# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. مسار Trend Master ومسار D1 / Cloudflare موثقان هنا مع إبقاء حدود كل مسار منفصلة.

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

## D1 / Cloudflare — آخر checkpoint

`PERF-CF-02CT — Production Frontend D1 Orders Read Cutover`

الحالة: **TECHNICAL VERIFIED PASS — FRONTEND D1 ORDERS READ ON — QUALIFIED `/v1/edge/orders/02cr/page` — APPS SCRIPT FALLBACK RETAINED — SHEETS/APPS SCRIPT AUTHORITATIVE**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md`

### Production state

- Production main: `943da84e3b3d1591d2ce207ab3411bfe437989b1`
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
- D1 migration: **NO**
- Apps Script deployment during 02CT: **NO**

### 02CT evidence

Pre-cutover qualification:

- Run `34010739030` — Job `101425991751` — **SUCCESS**
- Integrity Run `34010738989` — Job `101425991698` — **SUCCESS**
- print parity `21`, laser parity `18`, 38-field contract PASS

Production cutover:

- Run `34010864525` — Job `101426332138` — **SUCCESS**
- GitHub Pages Run `34010872232` — build/deploy **SUCCESS**
- published wrapper live canary: `PERF_CF_02CT_LIVE_FRONTEND_WRAPPER_PASS rows=5`
- final marker: `PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS=943da84e3b3d1591d2ce207ab3411bfe437989b1`

Durable post-cutover regression:

- working config sync commit `94699da3a7279eeea22df40c3cd383ea33c4f870`
- regression CI commit `1da926e9c9e9be843da1e125790f2c0535d77f71`
- Run `34011062287` — Job `101426859723` — **SUCCESS**
- same-head Integrity Run `34011062262` — Job `101426859662` — **SUCCESS**

### نقطة الوقوف الدقيقة — D1

`PERF-CF-02CT CLOSED — PRODUCTION FRONTEND D1 ORDERS READ ON THROUGH QUALIFIED /02CR ROUTE — APPS SCRIPT FALLBACK RETAINED — SHEETS/APPS SCRIPT AUTHORITY RETAINED`

لا يوجد نقل authority إلى D1. أي خطوة تخص D1 writes / authority / 02CL تحتاج checkpoint وموافقة منفصلة.

## ثوابت الأمان المشتركة

- Sheets / Apps Script تظل authoritative.
- Frontend D1 Orders read ON للقراءات المؤهلة فقط.
- writes لا تزال Apps Script / Sheets.
- `__DEBT__` يبقى Apps Script fallback.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- لا Apps Script deployment خاص بـTrend Master بدون موافقة صريحة من المستخدم.

## checkpoints سابقة — D1 track

- `PERF-CF-02CT` — PRODUCTION FRONTEND D1 READ ON / qualified `/02cr` / fallback retained
- `PERF-CF-02CS` — PRODUCTION WORKER ROUTE VERIFIED PASS / frontend OFF at close
- `PERF-CF-02CR` — full field / identity / filtering qualification
- `PERF-CF-02CQ` — screen-view mirror freshness + identity PASS
- `PERF-CF-02CO` — auth pass / stale view blocker
- `PERF-CF-02CN` — candidate / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
