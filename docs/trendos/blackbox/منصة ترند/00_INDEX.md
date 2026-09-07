# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**. لا تبدأ Inventory جديدًا ولا تعِد تصميم المسار؛ ابدأ دائمًا من `01_CURRENT_STATE.md` ثم السجل المرتبط بالـcheckpoint الحالي.

## Current active checkpoint — PERF-CF-02CW

`PERF-CF-02CW — Global Counters / Default Filters / Press Queue Totals`

الحالة: **PRODUCTION TECHNICAL + WORKER + FRONTEND + HOTFIX PASS — USER-VISIBLE VALIDATION PENDING**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md`

ما تم نشره:

- عدادات شاشة القسم تعتمد على `activeSummaryCounts` المحسوب من كامل الحالات الجارية قبل pagination، لا الصفحة الحالية فقط؛
- الفلتر الافتراضي `الحالات الجارية فقط` + `كل الأولويات`؛
- متابعة المكبس تفضّل `heatPressOrders` لإجمالي أوردرات المكبس المميزة؛
- Worker version: `602fdff5-ab0e-4b8e-8f6a-8eb77010c6eb` @100%؛
- Worker preview qualification Run `34050430147` — SUCCESS؛
- Worker promotion Run `34050523165` — SUCCESS؛
- Frontend initial Production commit `40bced5e9a952f15689f45ce3ef18271c9dd2c63`؛
- ظهر بعد النشر خطأ Frontend فقط: `WORK_PROBLEM_STATUS is not defined`؛
- تم إصلاحه بإرجاع fallback العدادات إلى دوال Production القديمة الآمنة مع إبقاء summary الجديد؛
- Production hotfix main: `2eee80b87a3aeccb5569055bc0544a43b22adcb7`؛
- Hotfix Run `34051629854` — SUCCESS؛
- GitHub Pages Run `34051642802` — SUCCESS؛
- app cache-bust الحالي: `trendos-02cw-globalcounts-hotfix-20260906e`؛
- durable patcher correction Run `34051798736` — SUCCESS؛
- latest normal Integrity before bot-only patcher commit: `34051798718` — SUCCESS؛
- current working-branch head after durable patcher correction: `9b607159aaded1ae00e69bb4365e12f6e1082389`.

حدود الأمان المحفوظة:

- لا Apps Script Production deploy؛
- لا D1 business-data write/migration؛
- لا secret rotation / لا تغيير `EDGE_SESSION_SECRET`؛
- Orders writes ما زالت Apps Script / Sheets؛
- `__DEBT__` ما زالت Apps Script؛
- 02CL/reconcile OFF؛
- generic drain OFF.

**لا يتم تسجيل User-Visible PASS لـ02CW حتى يؤكد المستخدم السلوك الحي.** طلب المستخدم استكمال خارطة الطريق لا يُعتبر تأكيدًا مرئيًا للعدادات.

---

## PERF-CF-02CV — CLOSED

`PERF-CF-02CV — Order Status Save / Read-After-Write Consistency`

الحالة: **CLOSED — TECHNICAL + PRODUCTION PASS — USER ACCEPTED CLOSURE — LIVE VALIDATION DEFERRED**

السجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md`

قرار الإغلاق من المستخدم بتاريخ 2026-09-06:

`مفيش عندى حاليا حاجة اجرب عليها اقفله ولو طلع فيه مشاكل فيما بعد نرجعله تانى`

معنى الإغلاق هنا:

- الإصلاح التقني منشور ومؤهل؛
- لا يوجد Test Case حي متاح حاليًا لإعادة الاختبار المرئي؛
- المستخدم وافق على إغلاق 02CV بدل إبقائه معلّقًا؛
- **لم يتم تسجيل User-Visible PASS فعلي**؛ التحقق الحي مؤجل؛
- إذا عادت مشكلة حفظ الحالة أو اختفاء `⚡ طباعة على الطاير` لاحقًا، يتم فتح Checkpoint جديد أو إعادة فتح 02CV مع تسجيل الواقعة الجديدة.

02CV fixes retained:

- stable `lineId` write identity retained؛
- local render immediately after confirmed save؛
- immediate post-save reload removed؛
- status cell supports `⚡ طباعة على الطاير`؛
- lane-stability guard retained؛
- explicit Fly Print values remain authoritative؛
- durable regression remains in normal Integrity.

---

## PERF-CF-02CU — CLOSED

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

الحالة: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**

User confirmation: `ثبت`

---

## Trend Master V1931 — separate track

الحالة: **CANDIDATE CODE + CI PASS — NOT DEPLOYED — APPS SCRIPT PRODUCTION UNCHANGED**

Record:

`TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md`

Candidate commit: `03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

- Trend Master V1931 Resilience CI Run `34006722152` — SUCCESS
- TrendOS Integrity V1 Run `34006722115` — SUCCESS

Apps Script panel endpoint still requires separate Production approval before any deploy.

---

## Shared safety invariants

- Sheets / Apps Script authoritative.
- eligible Orders reads D1-first with fail-open Apps Script fallback.
- Orders writes remain Apps Script / Sheets.
- `__DEBT__` remains Apps Script.
- 02CL / reconcile OFF.
- generic drain OFF.
- no `EDGE_SESSION_SECRET` rotation/change.
- Customer Feedback auto scan OFF.
- Go-Live Autopilot auto sweep OFF.
- Trend Master bounded protections retained.
