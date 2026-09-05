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

## قاعدة العمل من الآن

أي Checkpoint أو Blackbox جديد خاص بمنصة TrendOS الرئيسية يُكتب داخل هذا المجلد فقط.

تم الاحتفاظ بالملفات الأصلية القديمة في `docs/trendos/blackbox/` كما هي من أجل عدم كسر الروابط أو المراجع التاريخية. النسخ الموجودة هنا هي التصنيف المرجعي للمنصة من الآن.

## آخر نقطة تنفيذ موثقة

`PERF-CF-02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS`

الحالة: **VERIFIED PASS — CLOSED**.

## التسلسل المجمع

### 2026-09-04
يبدأ من `BACKEND_UNIFICATION_HANDOFF` ثم مراحل `PERF-CF` من `02R` وحتى `02BG`، بما في ذلك `02AA–02BF`.

### 2026-09-05
يستكمل من `02BH_02BJ` مرورًا بمراحل Staging bridge وProduction Shadow وCloud Write readiness وmigration-ledger reconciliation حتى `02CJ`.

راجع `01_CURRENT_STATE.md` للحالة التنفيذية الحالية قبل أي خطوة جديدة.
