# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders Completeness / Operational D1 Parity / Frontend Runtime Recovery`

الحالة: **ENRICHMENT SYNC PASS — FRONTEND D1 READ OFF — STALE FRONTEND RUNTIME PROVEN — CACHE-BUST DEPLOYED — USER RECHECK PENDING — FULL PARITY NOT CLOSED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## الحالة الحالية المختصرة

1. تم rollback تفعيل D1 Orders على `main` سابقًا:
   - `f7c3af17b3a28858d1be9d5c57455d54b4256126`
2. production order-card read ما زال **Apps Script / Sheets**.
3. Existing Orders Live Sync V2 يظل المالك الوحيد لـ`الأوردرات + بنود الأوردرات`.
4. المستخدم نشر وشغّل 02CR enrichment sync يدويًا من Apps Script IDE.
5. التحقق الخارجي أثبت:
   - `العملاء`: `239 × 47`, row parity, note `PERF-CF-02CR enrichment live sync V1`
   - قائمة منع التسليم: `1 × 10`, row parity, نفس note
   - `بنود الأوردرات`: `355` row, ownership note ما زال `TrendOS orders live sync V2 quota-aware`
6. production boundary بعد الـsync:
   - `cutover=false`
   - `sheetsAuthoritative=true`
   - 02CL OFF
   - generic drain OFF
   - `pendingOutbox=0`
   - unauth Orders route = `401`
7. Preview full parity توقف بسبب GitHub qualification employee token يرجع Apps Script `success=false`; لا يتم تسجيل أو طلب قيمة token.
8. المستخدم أبلغ أن شاشة الطباعة ما زالت تعرض أوردرات ناقصة.
9. المصدر الحالي `بنود الأوردرات` يحتوي أوردرات طباعة جارية أكثر بكثير من الشاشة.
10. screenshot المستخدم عرض `كل صفحة 3 أوردرات` بينما current `main/app.js` يعرّف `5` أوردرات للصفحة؛ هذا أثبت stale frontend runtime/cache.
11. تم cache-bust production فقط في `index.html + reset-cache.html`:
    - commit `f82c76fc9421e5f8021b94bbd64244a5fde24061`
    - cache tag `trendos-runtime-recovery-20260906a`
12. GitHub Pages deployment:
    - Run `34005021133`
    - **SUCCESS**
13. لا production Worker deploy، لا secret rotation، لا authority transfer.

## نقطة الوقوف الدقيقة

المطلوب الآن من المستخدم إعادة فتح/تحديث المنصة والتأكد أن أسفل القائمة أصبح:

`كل صفحة 5 أوردرات`

بدل `3`.

- لو ظهرت `5` وعادت الأوردرات كاملة: نسجل frontend runtime recovery PASS ثم نكمل 02CR Preview parity.
- لو ظهرت `5` وما زال العدد ناقصًا: ننتقل مباشرة لتشخيص **Apps Script Web App deployed version / runtime**؛ لا نفعّل D1 على production frontend.

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
