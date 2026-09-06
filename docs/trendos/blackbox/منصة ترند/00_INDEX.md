# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. مسار Trend Master ومسار D1 / Cloudflare موثقان هنا مع إبقاء حدود كل مسار منفصلة.

## PERF-CF-02CU — Stability / Freshness / Resume Guards

الحالة الحالية: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — NAVIGATION/RETURN NO-REFRESH CLOSED WITH TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — QUALIFIED `/02cr` IDLE-AGING ROOT CAUSE CONFIRMED — DUAL-SIGNAL FRESHNESS CANDIDATE + ISOLATED PREVIEW LIVE PASS — PRODUCTION PROMOTION PENDING**

السجل العام:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`

سجل Navigation / Return:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`

سجل تأكيد المستخدم النهائي:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`

سجل 02CR Dual-Signal Idle Freshness الحالي:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`

Production state relevant to 02CU:

- production main: `9552407c5a5136371f9afd452b913c226329d7dc`
- production Worker retained: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- current production frontend still treats required D1 mirrors older than 5 minutes as stale and fails open to Apps Script
- legacy focus / visibility / 3-minute `safeRefresh()` full refresh is suppressed without disabling manual refresh
- residual Attendance visibility `loadState()` and Employee Manager focus refresh are suppressed by a narrow early frontend guard; their periodic timers remain enabled
- user-visible Navigation / Return validation: `تمام ثبت` — **PASS**
- no Apps Script deploy / no production Worker deploy / no D1 business write / no 02CL / no generic drain / no secret rotation in the new heartbeat/freshness candidate work

Navigation / Return is **CLOSED — USER-VISIBLE PASS**.

### Orders Low-Usage / 02CR status

The Low-Usage Apps Script heartbeat route is now confirmed live and healthy; trigger recovery is **not** the blocker.

The root cause is the qualified `/v1/edge/orders/02cr/page` lane: the existing dual-signal idle verifier was available on the generic Orders lane but was not applied to `/02cr`, while the frontend used physical `syncedAt` age only.

Candidate behavior now verified on the working branch:

- stale `بنود الأوردرات` may remain D1-readable only when a recent sanitized heartbeat proves the authoritative Orders + Lines source shape is unchanged;
- Customers and Debt Restrictions remain physically freshness-gated;
- invalid/missing/old heartbeat, source change, shape mismatch, structural mismatch, unauthorized access, or verifier failure all fail closed to Apps Script;
- heartbeat calls are coalesced and successful results cached in-isolate for only 30 seconds to prevent an Apps Script request storm;
- no fake D1 heartbeat write or `syncedAt` mutation is introduced.

Evidence:

- Production read-only stability Run `34031380301` — **SUCCESS**; Lines were physically fresh at about 129–137 seconds during that run
- final candidate Integrity Run `34031601579` — **SUCCESS**
- isolated Preview Worker Run `34031294735` — **SUCCESS**, Preview version `607bccf3-8d7e-45f6-b179-6625aeafa3f8`
- dedicated read-only `/02cr` Preview qualification Run `34031601605` — **SUCCESS**
- live stale-path proof: Lines physical age 419–420 seconds, logical proof mode `verified-idle-source-unchanged`, proof age 124–127 seconds, max proof age 720 seconds
- anonymous `/02cr` fail-closed PASS; repeat stale-path read PASS

**Production is intentionally unchanged by this candidate.** Coordinated Worker + frontend production promotion remains the open 02CU action and requires separate approval.

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
- Frontend D1 Orders read ON للقراءات المؤهلة فقط، مع fail-open إلى Apps Script.
- writes لا تزال Apps Script / Sheets.
- `__DEBT__` يبقى Apps Script fallback.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- أي Apps Script deployment يحتاج نطاق وموافقة مناسبة منفصلة.
- أي Production Worker/frontend promotion للـ02CU dual-signal candidate يحتاج موافقة منفصلة ونشرًا bounded ومؤهلًا.

## checkpoints سابقة — D1 track

- `PERF-CF-02CU` — IN PROGRESS / Navigation Return CLOSED technical + production + user-visible PASS / Low-Usage heartbeat healthy / `/02cr` idle-aging root cause confirmed / dual-signal candidate + isolated Preview live PASS / production promotion pending
- `PERF-CF-02CT` — CLOSED / TECHNICAL PASS + USER-VISIBLE PASS / production frontend D1 read ON / qualified `/02cr` / fallback retained
- `PERF-CF-02CS` — PRODUCTION WORKER ROUTE VERIFIED PASS / frontend OFF at close
- `PERF-CF-02CR` — full field / identity / filtering qualification
- `PERF-CF-02CQ` — screen-view mirror freshness + identity PASS
- `PERF-CF-02CO` — auth pass / stale view blocker
- `PERF-CF-02CN` — candidate / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
