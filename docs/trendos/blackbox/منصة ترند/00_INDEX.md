# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو التصنيف الرسمي والمستقل لذاكرة **منصة TrendOS الرئيسية** ومسار نقلها إلى Cloudflare.

## النطاق

يشمل فقط:
- TrendOS Main Platform.
- Cloudflare Worker / D1 / Edge Gateway / Orders mirror.
- Production Shadow.
- Production Cloud Write.
- مراحل التحقق، السلامة، الـCI، والـcutover الخاصة بالمنصة الرئيسية.

لا يشمل:
- برنامج الحسابات أو أي ملفات Accounting.
- EasyStore.
- WhatsApp-specific work.
- أي مشروع مستقل آخر داخل المستودع.

## قاعدة العمل

أي Checkpoint أو Blackbox جديد خاص بمنصة TrendOS الرئيسية يُكتب داخل هذا المجلد فقط.

تم الاحتفاظ بالملفات الأصلية القديمة في `docs/trendos/blackbox/` كما هي من أجل عدم كسر الروابط أو المراجع التاريخية. النسخ الموجودة هنا هي التصنيف المرجعي للمنصة من الآن.

## آخر نقطة مغلقة بالكامل

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**.

السجل المرجعي الأحدث:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md`

## ملخص إغلاق 02CK

بعد سلسلة محاولات Auth آمنة وتشخيص الحاجز:

- ثبت أن `رحمه` غير موجودة في allowlist الخاصة بـ`verifyEmployeeSession_` لهذا المسار.
- تم تجهيز موظف تأهيل مؤقت محدود باسم `wael` لأنه مسموح في العقد الحالي.
- أول محاولة `wael` فشلت لأن Token مكتوب يدويًا لم يكن مصحوبًا بـ`آخر دخول` حقيقي.
- تم تنفيذ Login طبيعي واحد لـ`wael` لتوليد Session حقيقية.
- Probe آمن أثبت أن GitHub Secret يطابق الـToken الجديد دون كشف قيمته.
- 02CK نجح في Run `33975124471`، attempt `2`، Job `101331797697`.
- `/v1/edge/session`: PASS.
- تم إنشاء Order صناعي واحد فقط:
  `CW-PROD-QUAL-33975124471`.
- إعادة نفس الطلب بنفس idempotency key رجعت نفس الأوردر ولم تنشئ Duplicate.
- pending outbox انتقل من `0` إلى `1` بالضبط.
- Production Shadow ظل mutation-free.
- `cutover=false` ظل كما هو.
- Sheets / Apps Script ظلت authoritative.
- لم يحدث Worker deploy أو `EDGE_SESSION_SECRET` rotation.
- بعد PASS تم تعطيل `wael` ومسح Token الخاص به.

## Production state after 02CK

- Production Cloud Write: **ON**
- `writesAccepted=true`
- `schemaReady=true`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Full frontend cutover: **NO**
- Normalized-data cutover: **NO**
- Sheets / Apps Script authority: **YES**
- qualification synthetic D1 order: **1**
- qualification pending Sheets outbox item: **1**

02CK PASS لا يعني نقل السلطة إلى Cloudflare ولا يصرح تلقائيًا بتفعيل الـcutover.

## السجلات المهمة لسلسلة 02CK

- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_WAEL_AUTH_FAILED_MISSING_LAST_LOGIN_NO_BUSINESS_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_WAEL_PROVISIONED.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_VALID_SESSION_BUT_ALLOWLIST_BLOCK.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_AUTH_EXCHANGE_RETRY3_FAILED_NO_BUSINESS_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_BLOCKED_NO_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_READINESS_RECHECK_NO_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_USERNAME_CASE_DISCOVERY_SESSION_INVALIDATED.md`

## التسلسل المجمع

### 2026-09-04
يبدأ من `BACKEND_UNIFICATION_HANDOFF` ثم مراحل `PERF-CF` من `02R` وحتى `02BG`، بما في ذلك `02AA–02BF`.

### 2026-09-05
يستكمل من `02BH_02BJ` مرورًا بمراحل Staging bridge وProduction Shadow وCloud Write readiness وmigration-ledger reconciliation حتى `02CJ`، ثم 02CK: auth blockers → Rahma allowlist diagnosis → temporary `wael` qualifier → real-login session correction → bounded Production Cloud Write qualification **PASS**.

## نقطة البداية لأي شات جديد

1. اقرأ هذا الملف أولًا.
2. اقرأ `01_CURRENT_STATE.md` للحالة التنفيذية الدقيقة.
3. اقرأ `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md` قبل أي خطوة Cloudflare جديدة.
4. اعتبر 02CK مغلق PASS ولا تعيد اختباره من الصفر.
5. لا تبدأ Inventory جديد ولا تعيد الخطة من الصفر ما لم يظهر تغيير موثّق في المصدر.
6. لا تفعل Production/full-frontend cutover تلقائيًا بسبب 02CK PASS؛ حدد checkpoint التالي الموثق أولًا.
7. سجّل كل خطوة تنفيذية مادية داخل هذا المجلد قبل الانتقال لنقطة جديدة.

راجع `01_CURRENT_STATE.md` دائمًا قبل أي خطوة جديدة.
