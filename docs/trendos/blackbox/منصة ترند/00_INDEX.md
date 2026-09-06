# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders Completeness / Operational D1 Parity / Legacy View Formula Repair`

الحالة: **ENRICHMENT SYNC PASS — FRONTEND D1 READ OFF — LEGACY VIEW RANGE CAP ROOT CAUSE PROVEN — FOUR VIEW FORMULAS FIXED LIVE — USER RECHECK PENDING — FULL D1 PARITY NOT CLOSED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## الحالة الحالية المختصرة

1. Production order-card read ما زال **Apps Script / Sheets** وD1 Orders read على الواجهة **OFF**.
2. Existing Orders Live Sync V2 يظل المالك الوحيد لـ`الأوردرات + بنود الأوردرات`.
3. 02CR enrichment sync للعملاء/منع التسليم تم تشغيله والتحقق منه بنجاح.
4. المستخدم أبلغ أن الطباعة والليزر يعرضان عدد أوردرات ناقصًا.
5. `بنود الأوردرات` يحتوي حاليًا أوردرات تشغيلية أحدث بكثير من المعروض.
6. root cause النهائي للواقعة الحالية ثبت داخل Google Sheets legacy views:
   - `واجهة الطباعة` و`واجهة الليزر` و`واجهة المكبس` كانت محصورة في source ranges حتى row `311` فقط.
   - `واجهة خدمة العملاء` كانت محصورة حتى row `270` فقط.
7. تم تعديل **A2 formula فقط** في الأربع Views إلى open-ended ranges؛ لم يتم تعديل أي صف أوردر/عميل.
8. التحقق بعد الإصلاح:
   - `واجهة الطباعة` توسعت فورًا وتشمل source orders حتى `3920` في snapshot الحالي.
   - `واجهة الليزر` توسعت فورًا وتشمل source orders حتى `3918` في snapshot الحالي.
9. cache-bust السابق على GitHub Pages ما زال deployed بنجاح:
   - production commit `f82c76fc9421e5f8021b94bbd64244a5fde24061`
   - Pages Run `34005021133` SUCCESS.
10. لا Worker deploy، لا D1 Orders frontend enable، لا secret rotation، لا authority transfer، لا 02CL.

## نقطة الوقوف الدقيقة

المطلوب الآن من المستخدم Refresh للمنصة ثم فتح الطباعة والليزر والتأكد أن الأوردرات الجديدة بعد 3874 ظهرت.

لو ظهرت الأوردرات الجديدة، نسجل user-visible completeness recovery PASS ثم نعود لإكمال 02CR Preview full field/paging/filter parity.

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
