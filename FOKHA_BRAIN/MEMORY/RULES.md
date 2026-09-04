# Fokha Rules

> Source: Google Sheet `Fokha - Idea Inbox` / tab `RULES` + verified project evidence.
> Synced: 2026-09-04.
> هذه قواعد مستقرة نسبيًا داخل عقل فوخا. لا تستخدم كبديل عن الحقيقة التشغيلية الخاصة بأي مشروع.

| Rule ID | Rule | Origin | Scope | Confidence | Last Updated |
|---|---|---|---|---|---|
| RULE-001 | التقاط الفكرة فورًا أهم من تنظيمها لحظة ظهورها؛ التنظيم والتصنيف يمكن أن يتم لاحقًا. | طلب المستخدم الصريح | Fokha / Personal Workflow | High | 2026-09-04 |
| RULE-002 | ابنِ المنظومة كوحدة مترابطة، وليس كتطبيقات أو ملفات منفصلة؛ كل مشروع ووحدة يجب أن تعرف موقعها وعلاقتها بالباقي. | TrendOS D-001 + Architecture | Fokha / Business Architecture | High | 2026-09-04 |
| RULE-003 | فرّق دائمًا بين المخطط، والمجهز، والمنفذ، والمختبر، والمنشور، والمتحقق فعليًا؛ أحدث دليل متحقق يتغلب على الافتراضات الأقدم. | TrendOS evidence hierarchy / black box | Fokha / Decision & Evidence | High | 2026-09-04 |
| RULE-004 | صحة النظام ونزاهة البيانات والأمان تسبق السرعة؛ تحسين الأداء لا يجوز أن يضعف الصلاحيات أو الدقة أو مصدر الحقيقة. | TrendOS D-008 + integrity code | Fokha / Execution | High | 2026-09-04 |
| RULE-005 | لا تحذف التاريخ الصحيح أو الفشل لمجرد أنه قديم؛ احتفظ بالـaudit trail والتعلم السلبي، واجعل الجديد يعلو على القديم مع بقاء الأصل قابلًا للتتبع. | TrendOS black box + knowledge extraction | Fokha / Memory | High | 2026-09-04 |
| RULE-006 | كل كيان أو فكرة أو قرار مهم يحتاج ID ثابت وروابط مرجعية؛ لا تعتمد على الاسم وحده لربط الأنظمة أو المعرفة. | TrendOS identifiers + knowledge cross-system keys | Fokha / Linking Standard | High | 2026-09-04 |
| RULE-007 | الـAI ينظم ويحلل ويقترح، لكنه لا يخترع الحقائق الحية؛ البيانات التشغيلية والمالية والحالة الحالية تأتي من Source of Truth موثوق. | TrendOS D-011 / D-012 | Fokha / AI Authority | High | 2026-09-04 |
| RULE-008 | أي تغيير مؤثر يحتاج Expected / Actual / PASS\|FAIL ومسار Rollback واضح قبل التوسع للخطوة التالية. | TrendOS black box / execution ledger | Fokha / Execution Safety | High | 2026-09-04 |
| RULE-009 | قلّل الخطوات اليدوية بالأتمتة كلما أمكن، لكن افصل بين التجهيز والتثبيت والتفعيل، وفعّل تدريجيًا ببوابات تحقق قابلة للرجوع. | TrendOS automation + feature flags + deployment model | Fokha / Automation | High | 2026-09-04 |
| RULE-010 | حوّل الشغل المغلق إلى Evidence ثم Lessons ثم Knowledge Candidates؛ ليس كل تجربة أو رأي AI يصبح قاعدة عامة، والـScope لازم يظل واضحًا. | MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE | Fokha / Learning | High | 2026-09-04 |
| RULE-011 | قبل تعديل نظام شغال: افحص حالته أولًا، حافظ على الوظائف القائمة، ونفّذ Patch صغيرًا قابلًا للاختبار والرجوع بدل إعادة البناء من الصفر. | TrendOS Codex book + VOKHA prompts + cross-project evidence | Fokha / Execution | High | 2026-09-04 |
| RULE-012 | عند وجود أكثر من حل تقني صالح ولا يوجد قرار مانع، فضّل الحل الأبسط والأقل تكلفة والأسهل في التشغيل المحلي، وسجّل الافتراض بدل تعطيل التنفيذ بأسئلة غير ضرورية. | VOKHA Codex prompts + recurring execution preference | Fokha / Technical Choice | Medium | 2026-09-04 |
| RULE-013 | واجهات التشغيل اليومية يجب أن تكون بسيطة ومباشرة ومبنية على صلاحيات الدور؛ لا تكشف التكلفة/الربح أو وظائف حساسة لمستخدم غير مخوّل. | TrendOS/Matbagy AGENTS + EasyStore integration | Matbagy / TrendOS UX & Authorization | High | 2026-09-04 |
| RULE-014 | في شغل تصميمات مطبعجي: حافظ على ملامح الصور الأصلية ولا تستخدم فلتر أو تنعيم أو تغيير وجه إلا إذا طلب المستخدم ذلك صراحة. | Repeated design conversations | Matbagy Design / Image Fidelity | High | 2026-09-04 |
| RULE-015 | في تجهيزات الطباعة والقص: المقاس المطلوب يجب أن يكون دقيقًا، وعند طلب خلفية بيضاء أو استروك أسود مغلق وواضح يتم اعتبارهما قيود إنتاج لا زينة اختيارية. | Repeated print/design conversations | Matbagy Design / Print Production | High | 2026-09-04 |
| RULE-20260904-MATBAGY-ROUTING-001 | عند وجود أكثر من Repository متشابه الاسم، لا يعتمد الـAI على التخمين أو default branch؛ يجب استخدام Repository + Branch + Entry Point الموثقة للمشروع، وأي Repo بديل يعمل Redirect فقط ولا يستقبل ذاكرة المشروع. | Matbagy repository-routing incident and fix | Fokha / Project Routing | High | 2026-09-04 |
| RULE-20260904-ACCOUNTING-001 | لا يتم ربط Operations وAccounting باسم العميل أو الهاتف؛ Order ID هو مرجع الأوردر وLine ID مرجع البند، والربحية التفصيلية تبدأ من Line-level. | TrendOS Accounting integration decision | Trend Mall / TrendOS Accounting | High | 2026-09-04 |
| RULE-20260904-ACCOUNTING-002 | Accounting يحتفظ بالحقائق المالية والتكلفة والربحية؛ Profit Engine يحتفظ بقواعد ونسب توزيع الأرباح والعمولات والشركاء والمستثمرين وأصحاب الماكينات. | TrendOS Accounting architecture decision | Trend Mall / TrendOS Accounting | High | 2026-09-04 |
| RULE-20260904-ACCOUNTING-003 | أي Event من Operations إلى Accounting يجب أن يكون replay-safe/idempotent؛ لا يكرر فاتورة أو خصم مخزون أو حركة مالية عند إعادة نفس الحدث. | TrendOS integrity + Accounting integration | Trend Mall / TrendOS Accounting | High | 2026-09-04 |

## استخدام هذه القواعد

- القواعد العامة توجه التحليل والاقتراحات، لكنها لا تلغي Project-specific rules.
- Project-specific rules لا تُعمم تلقائيًا إلى Fokha Global.
- عند التعارض مع مصدر أحدث متحقق، يتم تسجيل supersede بدل حذف التاريخ.
- لا يتم تحويل استنتاج AI جديد إلى Rule ثابت بدون Evidence كافٍ.