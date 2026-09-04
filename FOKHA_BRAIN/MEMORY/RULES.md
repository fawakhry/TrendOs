# Fokha Rules

> Source: Google Sheet `Fokha - Idea Inbox` / tab `RULES`.
> Synced: 2026-09-04.
> هذه قواعد مستقرة نسبيًا داخل عقل فوخا. لا تستخدم كبديل عن الحقيقة التشغيلية الخاصة بأي مشروع.

| Rule ID | Rule | Origin | Scope | Confidence | Last Updated |
|---|---|---|---|---|---|
| RULE-001 | التقاط الفكرة فورًا أهم من تنظيمها لحظة ظهورها؛ التنظيم والتصنيف يمكن أن يتم لاحقًا. | طلب المستخدم: عايز أنجز عشان ألحق الأفكار اللي بتيجي فجأة. | Fokha / Personal Workflow | High | 2026-09-04 |
| RULE-002 | ابنِ المنظومة كوحدة مترابطة، وليس كتطبيقات أو ملفات منفصلة؛ كل مشروع ووحدة يجب أن تعرف موقعها وعلاقتها بالباقي. | TrendOS GitHub D-001 + Architecture | Fokha / Business Architecture | High | 2026-09-04 |
| RULE-003 | فرّق دائمًا بين المخطط، والمجهز، والمنفذ، والمختبر، والمنشور، والمتحقق فعليًا؛ أحدث دليل متحقق يتغلب على الافتراضات الأقدم. | TrendOS evidence hierarchy / black box | Fokha / Decision & Evidence | High | 2026-09-04 |
| RULE-004 | صحة النظام ونزاهة البيانات والأمان تسبق السرعة؛ تحسين الأداء لا يجوز أن يضعف الصلاحيات أو الدقة أو مصدر الحقيقة. | TrendOS D-008 + integrity code | Fokha / Execution | High | 2026-09-04 |
| RULE-005 | لا تحذف التاريخ الصحيح أو الفشل لمجرد أنه قديم؛ احتفظ بالـaudit trail والتعلم السلبي، واجعل الجديد يعلو على القديم مع بقاء الأصل قابلًا للتتبع. | TrendOS black box + knowledge extraction | Fokha / Memory | High | 2026-09-04 |
| RULE-006 | كل كيان أو فكرة أو قرار مهم يحتاج ID ثابت وروابط مرجعية؛ لا تعتمد على الاسم وحده لربط الأنظمة أو المعرفة. | TrendOS Order ID / Line ID + Knowledge cross-system keys | Fokha / Linking Standard | High | 2026-09-04 |
| RULE-007 | الـAI ينظم ويحلل ويقترح، لكنه لا يخترع الحقائق الحية؛ البيانات التشغيلية والمالية والحالة الحالية تأتي من Source of Truth موثوق. | TrendOS D-011 / D-012 | Fokha / AI Authority | High | 2026-09-04 |
| RULE-008 | أي تغيير مؤثر يحتاج Expected / Actual / PASS\|FAIL ومسار Rollback واضح قبل التوسع للخطوة التالية. | TrendOS black box / execution ledger | Fokha / Execution Safety | High | 2026-09-04 |
| RULE-009 | قلّل الخطوات اليدوية بالأتمتة كلما أمكن، لكن افصل بين التجهيز والتثبيت والتفعيل، وفعّل تدريجيًا ببوابات تحقق قابلة للرجوع. | TrendOS GitHub automation + feature flags + deployment model | Fokha / Automation | High | 2026-09-04 |
| RULE-010 | حوّل الشغل المغلق إلى Evidence ثم Lessons ثم Knowledge Candidates؛ ليس كل تجربة أو رأي AI يصبح قاعدة عامة، والـScope لازم يظل واضحًا. | MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE | Fokha / Learning | High | 2026-09-04 |

## استخدام هذه القواعد

- القواعد العامة توجه التحليل والاقتراحات، لكنها لا تلغي Project-specific rules.
- عند التعارض مع مصدر أحدث متحقق، يتم تسجيل supersede بدل حذف التاريخ.
- لا يتم تحويل استنتاج AI جديد إلى Rule ثابت بدون Evidence كافٍ.
