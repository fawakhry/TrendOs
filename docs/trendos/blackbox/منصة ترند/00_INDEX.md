# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. مسار Trend Master ومسار D1 / Cloudflare موثقان هنا مع إبقاء حدود كل مسار منفصلة.

## PERF-CF-02CU — Stability / Freshness / Resume Guards

الحالة الحالية: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — NAVIGATION/RETURN NO-REFRESH CLOSED WITH TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — DUAL-SIGNAL `/02cr` WORKER + FRONTEND PRODUCTION TECHNICAL PASS — USER-VISIBLE IDLE-AGING VALIDATION PENDING**

السجل العام:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`

سجل Navigation / Return:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`

سجل تأكيد المستخدم النهائي لـ Navigation / Return:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`

سجل 02CR Dual-Signal candidate التاريخي:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`

سجل Production promotion الحالي:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md`

Production state relevant to 02CU:

- production main: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- production Worker: `trendos-d1-api`
- production Worker version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` — **100% traffic**
- eligible Orders reads: D1 first through `/v1/edge/orders/02cr/page`
- frontend now accepts a bounded `verified-idle-source-unchanged` proof for physically stale `بنود الأوردرات` only
- Customers and Debt Restrictions remain physically freshness-gated
- Apps Script fallback retained for any failed qualification
- `__DEBT__` remains Apps Script
- all writes remain Apps Script / Sheets
- Sheets / Apps Script remain authoritative
- legacy focus / visibility / 3-minute `safeRefresh()` full refresh remains suppressed without disabling manual refresh
- residual Attendance visibility `loadState()` and Employee Manager focus refresh remain suppressed by the narrow early guard; their periodic timers remain enabled
- user-visible Navigation / Return validation: `تمام ثبت` — **PASS**
- no Apps Script deploy / no D1 business write / no 02CL enable / no generic drain / no secret rotation during 02CU promotion

Navigation / Return is **CLOSED — USER-VISIBLE PASS**.

### Orders Low-Usage / Dual-Signal production status

The Low-Usage Apps Script heartbeat route is confirmed live and healthy; trigger recovery is **not** the blocker and no Apps Script redeploy was required.

The root cause was the qualified `/v1/edge/orders/02cr/page` lane: the existing idle verifier was not applied to that route, while the frontend used physical `syncedAt` age only.

The qualified Production behavior is now:

- fresh `بنود الأوردرات`: normal D1 read without heartbeat proof;
- physically stale `بنود الأوردرات`: D1 remains eligible only when a recent sanitized heartbeat proves authoritative Orders + Lines source shape is unchanged;
- Customers and Debt Restrictions must remain physically fresh;
- invalid/missing/old heartbeat, source change, shape mismatch, structural mismatch, unauthorized access, verifier failure, stale enrichment, or Edge error all fall back to Apps Script;
- heartbeat calls are coalesced and successful results cached in-isolate for only 30 seconds to prevent a request storm;
- no fake D1 heartbeat write or `syncedAt` mutation is introduced.

Production evidence:

- exact Worker preview requalification Run `34033006309` — **SUCCESS**
- Worker Production promotion Run `34033058006` — **SUCCESS**
- Worker version `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` — **100% traffic**
- frontend bounded production Run `34034029239` — **SUCCESS**
- production main `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- GitHub Pages Run `34034051695` — **SUCCESS**
- public frontend asset qualification: PASS
- post-frontend authenticated Production `/02cr` qualification: PASS
- `__DEBT__` fallback: PASS
- Sheets authoritative / cutover false / pendingOutbox 0 / 02CL false / generic drain false: PASS
- rollback: not required

The Production qualification happened while Lines were physically fresh. The stale-Lines path was already exercised live on isolated Preview Run `34031601605` with Lines age 419–420 seconds and logical mode `verified-idle-source-unchanged`, plus repeat-read PASS.

**Worker + frontend Production technical promotion is complete. The only remaining 02CU close condition is user-visible idle-aging validation.**

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
- Worker version at 02CT close: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
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
- Frontend D1 Orders read ON للقراءات المؤهلة فقط، مع fail-open إلى Apps Script.
- writes لا تزال Apps Script / Sheets.
- `__DEBT__` يبقى Apps Script fallback.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- أي Apps Script deployment يحتاج نطاق وموافقة مناسبة منفصلة.
- 02CU Worker + frontend promotion تم bounded وبنجاح؛ لا يُغلق 02CU نهائيًا قبل user-visible idle-aging validation.

## checkpoints سابقة — D1 track

- `PERF-CF-02CU` — IN PROGRESS / Navigation Return CLOSED technical + production + user-visible PASS / Low-Usage heartbeat healthy / dual-signal Worker + frontend Production technical PASS / user-visible idle-aging validation pending
- `PERF-CF-02CT` — CLOSED / TECHNICAL PASS + USER-VISIBLE PASS / production frontend D1 read ON / qualified `/02cr` / fallback retained
- `PERF-CF-02CS` — PRODUCTION WORKER ROUTE VERIFIED PASS / frontend OFF at close
- `PERF-CF-02CR` — full field / identity / filtering qualification
- `PERF-CF-02CQ` — screen-view mirror freshness + identity PASS
- `PERF-CF-02CO` — auth pass / stale view blocker
- `PERF-CF-02CN` — candidate / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
