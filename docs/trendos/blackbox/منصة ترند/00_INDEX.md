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

## مسار D1 / Cloudflare — محفوظ بدون تغيير

آخر checkpoint لهذا المسار:

`PERF-CF-02CS — Production Worker Deploy Gate / Authenticated Canary Preflight`

الحالة: **02CR PREVIEW QUALIFIED — PRODUCTION PREDEPLOY CODE/BOUNDARY PASS — AUTH CANARY CREDENTIAL BLOCKED — NO WORKER DEPLOY — FRONTEND D1 READ OFF**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_AUTH_PREFLIGHT_BLOCKED.md`

### الحالة الحالية المختصرة — D1

1. Production order-card read ما زال **Apps Script / Sheets** وD1 Orders read على الواجهة **OFF**.
2. مشكلة نقص الأوردرات في legacy views مغلقة والمستخدم أكد: `كده تمام اشتغل`.
3. 02CR مؤهل بالكامل في Preview:
   - print active `21 / 21`
   - laser active `18 / 18`
   - pagination / filters / search / 38-key field contract PASS
   - enrichment heartbeat PASS
   - `__DEBT__` Apps Script fallback ثابت.
4. المستخدم وافق سابقًا صراحة على **Worker production deploy فقط بدون تفعيل الواجهة** في مسار D1، لكن هذا لا يخص شات Trend Master.
5. 02CS أعاد اختبارات 02CR: PASS.
6. 02CS production GET-only boundary: PASS:
   - `cutover=false`
   - `sheetsAuthoritative=true`
   - 02CL OFF
   - generic drain OFF
   - `pendingOutbox=0`
   - unauth Orders = 401
   - frontend D1 read OFF.
7. authenticated-canary preflight منع النشر لأن `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` الحالي لم يعد صالحًا، ولا يوجد production Edge secret متاح كـActions secret في المسار المقيد الذي تم فحصه.
8. لذلك **لم يتم تنفيذ Worker deploy**.
9. 02CS Same-head Integrity Run `34006450589`: SUCCESS.
10. لا Worker secret rotation، لا `EDGE_SESSION_SECRET` change، لا migration، لا 02CL، لا generic drain.

### نقطة الوقوف الدقيقة — D1

`PERF-CF-02CS AUTH CANARY CREDENTIAL BLOCKED — NO DEPLOY PERFORMED`

## ثوابت الأمان المشتركة

- Sheets / Apps Script authoritative حتى cutover معتمد لاحقًا.
- Frontend D1 Orders read OFF.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- `__DEBT__` يبقى Apps Script fallback.
- لا Apps Script deployment خاص بـTrend Master بدون موافقة صريحة من المستخدم.

## checkpoints سابقة — D1 track

- `PERF-CF-02CR` — PREVIEW QUALIFICATION PASS / production frontend OFF
- `PERF-CF-02CQ` — VERIFIED PASS / CLOSED for freshness + identity parity only
- `PERF-CF-02CO` — auth pass; stale view-mirror blocker
- `PERF-CF-02CN` — candidate prepared / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS / closed
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
