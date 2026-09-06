# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CS — Production Worker Deploy Gate / Authenticated Canary Preflight`

الحالة: **02CR PREVIEW QUALIFIED — PRODUCTION PREDEPLOY CODE/BOUNDARY PASS — AUTH CANARY CREDENTIAL BLOCKED — NO WORKER DEPLOY — FRONTEND D1 READ OFF**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_AUTH_PREFLIGHT_BLOCKED.md`

السجل السابق:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_PREVIEW_SOURCE_PARITY_HEARTBEAT_BOUNDARY_PASS.md`

## الحالة الحالية المختصرة

1. Production order-card read ما زال **Apps Script / Sheets** وD1 Orders read على الواجهة **OFF**.
2. مشكلة نقص الأوردرات في legacy views مغلقة والمستخدم أكد: `كده تمام اشتغل`.
3. 02CR مؤهل بالكامل في Preview:
   - print active `21 / 21`
   - laser active `18 / 18`
   - pagination / filters / search / 38-key field contract PASS
   - enrichment heartbeat PASS
   - `__DEBT__` Apps Script fallback ثابت.
4. المستخدم وافق صراحة على **Worker production deploy فقط بدون تفعيل الواجهة**.
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
9. Same-head Integrity Run `34006450589`: SUCCESS.
10. لا Worker secret rotation، لا `EDGE_SESSION_SECRET` change، لا migration، لا 02CL، لا generic drain.

## نقطة الوقوف الدقيقة

`PERF-CF-02CS AUTH CANARY CREDENTIAL BLOCKED — NO DEPLOY PERFORMED`

المطلوب لفك الحاجز:

- تسجيل دخول TrendOS طبيعي جديد لحساب التأهيل.
- تحديث pair المطابق مباشرة في GitHub Actions Secrets، بدون إرسال أي قيمة في الشات:
  - `TRENDOS_PROD_QUALIFY_USERNAME`
  - `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

بعدها:

1. rerun 02CS auth/boundary preflight,
2. bounded production Worker deploy واحد فقط للمسار المؤهل،
3. authenticated production canary،
4. final boundary,
5. الواجهة تظل OFF حتى قرار activation منفصل.

## ثوابت الأمان

- Sheets / Apps Script authoritative حتى cutover معتمد لاحقًا.
- Frontend D1 Orders read OFF.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- `__DEBT__` يبقى Apps Script fallback.
- لا deploy بدون authenticated-canary readiness PASS.

## checkpoints سابقة

- `PERF-CF-02CR` — PREVIEW QUALIFICATION PASS / production frontend OFF
- `PERF-CF-02CQ` — VERIFIED PASS / CLOSED for freshness + identity parity only
- `PERF-CF-02CO` — auth pass; stale view-mirror blocker
- `PERF-CF-02CN` — candidate prepared / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS / closed
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
