# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. مسار Trend Master الحالي ومسار D1 / Cloudflare موثقان هنا مع إبقاء حدود كل مسار منفصلة.

## آخر checkpoint في شات Trend Master

`TM-V1931-RESILIENCE — Trend Master Panel Resilience Candidate`

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED — FRONTEND D1 READ OFF**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate code commit:

`03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

CI evidence:

- Trend Master V1931 Resilience CI — Run `34006722152` — **SUCCESS**
- TrendOS Integrity V1 — Run `34006722115` — **SUCCESS**

### سبب المشكلة المؤكد

`loadTrendMasterCenter()` كان يعتمد على `getTrendMasterCenterV1931` كطلب مركب واحد، بينما backend يجمع عدة قراءات وحسابات ثقيلة داخله. مع timeout عام يصل إلى 90 ثانية وعدم وجود retry حقيقي أو cleanup كامل لحالات Panels، failure/بطء جزء واحد كان يمكن أن يؤخر المركز كله ويترك `جاري التحميل...` أو `جاري الحساب...` ظاهرًا بلا نهاية.

### الـcandidate المنفذ

Hybrid محافظ على التوافق:

- legacy center endpoint يظل موجودًا كـcompatibility fallback.
- endpoint قراءة فقط جديد: `getTrendMasterPanelV1931`.
- تحميل مستقل لـ Summary / Archive / Messages / Stock / Employee KPI / Debt control / Day close.
- per-panel loading/error/retry.
- retry bounded إلى محاولتين بحد أقصى.
- timeouts مخصصة 12–18 ثانية.
- last-good in-memory cache + stale indicator/timestamp.
- concurrent-call dedup + center batch guard لمنع request storms.
- auth username/token يمران بدون إسقاط.
- لا PII payload logging.

### حالة النشر

**لا يوجد Production deployment لهذا الـcheckpoint.**

- لا Apps Script New Version / deploy.
- تعديل `.gs` على GitHub لا يعني أن Web App المنشور اتحدث.
- لا frontend production activation.
- Production Trend Master ما زال على النسخة المنشورة الحالية حتى موافقة المستخدم الصريحة.

### نقطة الوقوف الدقيقة — Trend Master

`TM-V1931 RESILIENCE CANDIDATE — CODE + CI PASS — APPS SCRIPT PRODUCTION DEPLOYMENT REQUIRES EXPLICIT USER APPROVAL`

---

## مسار D1 / Cloudflare — آخر checkpoint

`PERF-CF-02CS — Production Worker D1 Read Route`

الحالة: **VERIFIED PASS — QUALIFIED D1 READ ROUTE DEPLOYED TO PRODUCTION WORKER — FRONTEND D1 READ OFF — SHEETS / APPS SCRIPT AUTHORITATIVE**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_ROUTE_PASS_FRONTEND_OFF.md`

### النسخة المنشورة

Production Worker:

`trendos-d1-api`

Current qualified Worker version:

`c77bf453-c590-4cff-a55b-fd9c625b6d76` — **100% Worker traffic**

Previous production version retained as rollback reference:

`0ec782a9-5943-4c9d-8820-51b7d0393210`

### Production evidence

Exact-version deploy / canary:

- Run `34010288672`
- Job `101424793692`
- Result: **SUCCESS**

Production canary after deployment:

- employee Edge session: PASS on attempt `1`
- print active: `21`, identity parity PASS, 38-field contract PASS
- laser active: `18`, identity parity PASS, 38-field contract PASS
- print ordering: `طباعة على الطاير → عاجل/VIP → عادي → مؤجل` PASS
- laser ordering: `عاجل/VIP → عادي → مؤجل` PASS; Fly Print does not affect laser
- support mirrors ready / row-count parity PASS
- `__DEBT__` remains `409 apps-script-required` / Apps Script fallback

Final production boundary:

- `cutover=false`
- `sheetsAuthoritative=true`
- frontend D1 Orders read: **OFF**
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- `pendingOutbox=0`
- unauthenticated Orders route: `401`
- no `EDGE_SESSION_SECRET` rotation
- no D1 migration
- no authority transfer

### نقطة الوقوف الدقيقة — D1

`PERF-CF-02CS CLOSED — PRODUCTION WORKER D1 READ ROUTE VERIFIED PASS — FRONTEND D1 READ OFF — NEXT STEP REQUIRES SEPARATE CUTOVER AUTHORIZATION`

## ثوابت الأمان المشتركة

- Sheets / Apps Script authoritative حتى cutover معتمد لاحقًا.
- Frontend D1 Orders read OFF.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- `__DEBT__` يبقى Apps Script fallback.
- لا Apps Script deployment خاص بـTrend Master بدون موافقة صريحة من المستخدم.

## checkpoints سابقة — D1 track

- `PERF-CF-02CS` — PRODUCTION WORKER ROUTE VERIFIED PASS / frontend OFF
- `PERF-CF-02CR` — PREVIEW QUALIFICATION PASS / production frontend OFF
- `PERF-CF-02CQ` — VERIFIED PASS / CLOSED for freshness + identity parity only
- `PERF-CF-02CO` — auth pass; stale view-mirror blocker
- `PERF-CF-02CN` — candidate prepared / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS / closed
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
