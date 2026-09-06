# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CR — Orders Completeness / Operational D1 Preview Qualification`

الحالة: **USER-VISIBLE COMPLETENESS PASS — PREVIEW SOURCE/IDENTITY/PAGING/FILTER/FIELD-CONTRACT PASS — ENRICHMENT HEARTBEAT PASS — FINAL BOUNDARY PASS — PRODUCTION FRONTEND D1 READ OFF**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_PREVIEW_SOURCE_PARITY_HEARTBEAT_BOUNDARY_PASS.md`

السجلات السابقة لنفس checkpoint:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_USER_VALIDATED_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## الحالة الحالية المختصرة

1. Production order-card read ما زال **Apps Script / Sheets** وD1 Orders read على الواجهة **OFF**.
2. مشكلة نقص الأوردرات في legacy views تم إصلاحها من source-range caps، والمستخدم أكد: `كده تمام اشتغل`.
3. Existing Orders Live Sync V2 يظل المالك الوحيد لـ`الأوردرات + بنود الأوردرات`.
4. 02CR enrichment sync للعملاء/منع التسليم Live وheartbeat شغال كل دقيقة.
5. Preview 02CR تطابق مباشرة مع `بنود الأوردرات` الحالية:
   - Print active `21 / 21`
   - Laser active `18 / 18` = `13 طلب جديد + 4 تحت التنفيذ + 1 متوقف`
6. Preview pagination pageSize=5 أعاد نفس الصفوف بالترتيب بلا فقد أو تكرار:
   - print: 5 pages
   - laser: 4 pages
7. status / priority / heat / Order ID search partitions PASS.
8. كل active row يحمل عقد `38` field keys المطلوب.
9. `__DEBT__` ما زال Apps Script fallback (`409 apps-script-required`).
10. آخر heartbeat proof:
    - `العملاء` 239/239, age ~42s
    - منع التسليم 1/1, age ~43s
11. Final boundary PASS:
    - `cutover=false`
    - `sheetsAuthoritative=true`
    - 02CL OFF
    - generic drain OFF
    - `pendingOutbox=0`
    - unauth Orders = 401
    - frontend D1 Orders read OFF
12. Integrity Run `34005845901`: SUCCESS.
13. Temporary parity/boundary workflows تم حذفها بعد جمع الدليل.

## نقطة الوقوف الدقيقة

`PERF-CF-02CR` مؤهل بالكامل في **Preview**، لكنه **غير مفعّل على production frontend**.

الخطوة التالية تحتاج **Production gate/checkpoint جديد وموافقة صريحة**:

1. bounded production Worker deployment للمسار المؤهل، والواجهة تظل OFF.
2. production canary بعد النشر.
3. إذا نجح، قرار منفصل لتفعيل frontend D1 read تدريجيًا.

## ثوابت الأمان

- Sheets / Apps Script authoritative حتى cutover معتمد لاحقًا.
- Frontend D1 Orders read OFF.
- 02CL OFF.
- generic drain OFF.
- لا تدوير `EDGE_SESSION_SECRET`.
- `__DEBT__` يبقى Apps Script fallback.
- لا production Worker deploy أو frontend cutover بدون موافقة جديدة.

## checkpoints سابقة

- `PERF-CF-02CQ` — VERIFIED PASS / CLOSED for freshness + identity parity only
- `PERF-CF-02CO` — auth pass; stale view-mirror blocker
- `PERF-CF-02CN` — candidate prepared / CI PASS / default OFF
- `PERF-CF-02CM` — read-only preflight PASS / closed
- `PERF-CF-02CL` — VERIFIED PASS / closed
- `PERF-CF-02CK` — VERIFIED PASS / closed
