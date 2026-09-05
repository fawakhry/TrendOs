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
- أي مشروع مستقل آخر داخل المستودع.

## قاعدة العمل

أي Checkpoint أو Blackbox جديد خاص بمنصة TrendOS الرئيسية يُكتب داخل هذا المجلد فقط.

تم الاحتفاظ بالملفات الأصلية القديمة في `docs/trendos/blackbox/` كما هي من أجل عدم كسر الروابط أو المراجع التاريخية. النسخ الموجودة هنا هي التصنيف المرجعي للمنصة من الآن.

## آخر نقطة مغلقة بالكامل

`PERF-CF-02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS`

الحالة: **VERIFIED PASS — CLOSED**.

## آخر نقطة تنفيذ / محاولة حالية

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **SAFE BLOCKED — AUTH EXCHANGE FAILED — NO BUSINESS WRITE**.

آخر إعادة محاولة في 2026-09-05 أكدت أن Secretي التأهيل موجودان، وأن Production preflight سليم، لكن تبادل جلسة الموظف عبر canonical `/v1/edge/session` فشل قبل إنشاء أي Order. تم Skip لكل خطوات الـBusiness Write والـpost-write verification، ولم يحدث Production D1 business write أو cutover أو Worker secret rotation.

السجل التفصيلي الأحدث:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md`

السجلات السابقة المهمة لنفس الحاجز:
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_BLOCKED_NO_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_READINESS_RECHECK_NO_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_USERNAME_CASE_DISCOVERY_SESSION_INVALIDATED.md`

## التسلسل المجمع

### 2026-09-04
يبدأ من `BACKEND_UNIFICATION_HANDOFF` ثم مراحل `PERF-CF` من `02R` وحتى `02BG`، بما في ذلك `02AA–02BF`.

### 2026-09-05
يستكمل من `02BH_02BJ` مرورًا بمراحل Staging bridge وProduction Shadow وCloud Write readiness وmigration-ledger reconciliation حتى `02CJ`، ثم سلسلة محاولات `02CK` الآمنة: auth absent → username case discovery → secrets present → canonical auth exchange failed before business write.

## نقطة البداية لأي شات جديد

1. اقرأ هذا الملف أولًا.
2. اقرأ `01_CURRENT_STATE.md` للحالة التنفيذية الدقيقة والحاجز الحالي.
3. اقرأ آخر Blackbox مشار إليه في الحالة الحالية قبل أي تنفيذ.
4. لا تبدأ Inventory جديد ولا تعيد الخطة من الصفر ما لم يظهر تغيير موثّق في المصدر.
5. سجّل كل خطوة تنفيذية مادية داخل هذا المجلد قبل الانتقال لنقطة جديدة.

راجع `01_CURRENT_STATE.md` دائمًا قبل أي خطوة جديدة.
