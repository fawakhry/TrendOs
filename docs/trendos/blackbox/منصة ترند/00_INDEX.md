# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders Completeness / Operational D1 Parity / Legacy View Formula Repair`

الحالة: **ENRICHMENT SYNC PASS — FRONTEND D1 READ OFF — LEGACY VIEW RANGE CAP FIXED — USER-VISIBLE ORDER COMPLETENESS VERIFIED PASS — FULL D1 PARITY NOT CLOSED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_USER_VALIDATED_PASS.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## الحالة الحالية المختصرة

1. Production order-card read ما زال **Apps Script / Sheets** وD1 Orders read على الواجهة **OFF**.
2. Existing Orders Live Sync V2 يظل المالك الوحيد لـ`الأوردرات + بنود الأوردرات`.
3. 02CR enrichment sync للعملاء/منع التسليم تم تشغيله والتحقق منه بنجاح.
4. سبب نقص الأوردرات في الطباعة/الليزر ثبت في Google Sheets legacy views: source ranges كانت متوقفة عند row 311، وخدمة العملاء عند row 270.
5. تم تعديل **A2 formula فقط** في الأربع Views إلى open-ended ranges؛ لم يتم تعديل أي صف أوردر/عميل.
6. التحقق بعد الإصلاح أظهر أن الطباعة وصلت لأوردرات أحدث حتى `3920` والليزر حتى `3918` في snapshot الفحص.
7. المستخدم عمل Refresh للمنصة وأكد صراحة أن النظام عاد يعمل بشكل صحيح: `كده تمام اشتغل`.
8. النتيجة الرسمية للواقعة: **USER-VISIBLE ORDER COMPLETENESS RECOVERY — VERIFIED PASS**.
9. cache-bust السابق على GitHub Pages ما زال deployed بنجاح:
   - production commit `f82c76fc9421e5f8021b94bbd64244a5fde24061`
   - Pages Run `34005021133` SUCCESS.
10. لا Worker deploy، لا D1 Orders frontend enable، لا secret rotation، لا authority transfer، لا 02CL.

## نقطة الوقوف الدقيقة

مشكلة نقص الأوردرات في الواجهة الحالية **مغلقة ومثبتة من المستخدم**.

الخطوة التالية داخل 02CR هي استكمال **Preview full field/paging/filter parity** لمسار D1 المعزول فقط. لا يتم إعادة تفعيل D1 على production frontend قبل نجاح الـparity بالكامل.

## ثوابت الأمان

- Sheets / Apps Script authoritative.
- Frontend D1 Orders read OFF.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- `__DEBT__` يبقى Apps Script fallback.
- لا production Worker deploy أو frontend cutover قبل full parity PASS.

## checkpoints سابقة

- `PERF-CF-02CQ` — VERIFIED PASS / CLOSED for freshness + identity parity only
- `PERF-CF-02CO` — auth pass; stale view-mirror blocker
- `PERF-CF-02CN` — candidate prepared / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS / closed
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
