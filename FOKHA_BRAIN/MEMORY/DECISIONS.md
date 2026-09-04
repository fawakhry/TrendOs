# Fokha Decisions

> Source: Google Sheet `Fokha - Idea Inbox` / tab `DECISIONS` + verified routing decisions.
> Synced: 2026-09-04.

## DEC-20260904-001
- **Date:** 2026-09-04
- **Decision:** Fokha هو العقل التنفيذي العام، وTrend Mall/TrendOS مشروع واحد تحته وله ذاكرته وصندوقه الأسود الخاص.
- **Context:** فصل هوية المستخدم وطريقة تفكيره عن أي مشروع منفرد.
- **Reason:** حتى يستطيع Fokha إدارة عدة مشاريع واتخاذ قرارات على مستوى صاحب الأعمال، لا على مستوى Trend Mall فقط.
- **Project:** Fokha
- **Status:** Confirmed
- **Outcome / Notes:** قرار تأسيسي.

## DEC-20260904-002
- **Date:** 2026-09-04
- **Decision:** Fokha يكون طبقة الربط العليا بين الأفكار والشات وGoogle Sheet وذاكرات المشاريع وGitHub، مع عدم إنشاء نسخة موازية من حقائق المشاريع.
- **Context:** المستخدم طلب ترابطًا بين أفكار فوخا والشات والستاندرد وكل المصادر.
- **Reason:** منع تشتت المعرفة وتمكين AI من فهم السياق والعلاقات بدون خلط مصادر الحقيقة.
- **Project:** Fokha
- **Status:** Confirmed
- **Outcome / Notes:** Google Sheet = capture/working memory؛ Project Black Boxes = project truth؛ GitHub FOKHA_BRAIN = organized readable memory layer مؤقتًا.

## DEC-20260904-003
- **Date:** 2026-09-04
- **Decision:** عند دخول عقل فوخا يبدأ أي Chat/Agent من GitHub أولًا، وبعد استخراج أي معرفة أو داتا تُكتب فورًا إلى Google Drive كـWorking Memory، ثم تُزامن لاحقًا إلى GitHub بدون تكرار.
- **Context:** تثبيت مسار تشغيل موحد بين القراءة من عقل فوخا والكتابة بعد الاستخراج.
- **Reason:** GitHub نقطة الدخول المنظمة، وGoogle Drive طبقة الالتقاط الفوري للمعرفة الجديدة.
- **Project:** Fokha
- **Status:** Confirmed
- **Outcome / Notes:** `GITHUB READ -> EXTRACT -> DRIVE WRITE -> ORGANIZED GITHUB SYNC`.

## DEC-20260904-004
- **Date:** 2026-09-04
- **Decision:** المستخدم فوّض عقل فوخا في TrendOS باتخاذ القرارات التشغيلية الروتينية والقابلة للرجوع منخفضة المخاطر، وتشخيص التوقف ومحاولة استئناف الشغل تلقائيًا إذا كان ذلك ممكنًا بالأدوات والصلاحيات الحالية.
- **Context:** TrendOS هو الأولوية الحالية، والمستخدم يريد منع توقف المشروع بسبب انتظار قرارات تشغيلية صغيرة أو محادثة واقفة.
- **Reason:** تقليل اعتماد تقدم المشروع على تدخل المستخدم المستمر مع الحفاظ على الأمان ومصدر الحقيقة والـrollback.
- **Project:** Fokha / Trend Mall / TrendOS
- **Status:** Confirmed
- **Outcome / Notes:** Delegation boundary: routine + reversible + low-risk decisions may be taken autonomously. High-impact, irreversible, destructive, financial-commitment, security-sensitive, or authority-changing decisions still require explicit user approval unless a pre-approved project rule specifically authorizes them.

## DEC-20260904-MATBAGY-ROUTING-001
- **Date:** 2026-09-04
- **Decision:** صندوق مطبعجي الرسمي لذاكرة التصميمات هو فقط `fawakhry/Matbagy-Design-Workflow` على branch `agent/initial-mvp`، والمدخل `صندوق_مطبعجي.md`.
- **Context:** وجود Repositories متشابهة الاسم قد يسبب خلط Photo Sheets أو FOKHA_BRAIN بذاكرة التصميمات.
- **Reason:** منع خلط الأدوات أو عقل فوخا أو TrendOS بذاكرة Design Cases.
- **Project:** Matbagy Design Workflow
- **Status:** Confirmed / Active
- **Outcome / Notes:** أي مسار آخر لا يستقبل Design Cases كذاكرة رسمية.

## DEC-20260904-MATBAGY-AUTOPERSIST-001
- **Date:** 2026-09-04
- **Decision:** استخراج شاتات صندوق مطبعجي يحفظ ويرفع تلقائيًا بدون انتظار `اعتمد وسجل`؛ بعد الحفظ تعرض روابط Google Drive للتأكيد الاختياري فقط.
- **Context:** المستخدم سيستخرج عددًا كبيرًا من محادثات ChatGPT ثم يحذفها، ويريد تقليل التدخل اليدوي ومنع تعطيل كل Case ببوابة موافقة.
- **Reason:** تسريع ingestion مع الحفاظ على الفصل بين حفظ الذاكرة واعتماد التصميم النهائي وأوامر التنفيذ.
- **Project:** Matbagy Design Memory
- **Status:** Confirmed / Active
- **Outcome / Notes:** `extract -> dedup -> create/update case -> upload available assets -> persist GitHub -> show Drive links`. Final design approval remains evidence-based.

## DEC-20260904-ACCOUNTING-001
- **Date:** 2026-09-04
- **Decision:** TrendOS Accounting يكون برنامج/تطبيق حقيقي وليس Spreadsheet كمنتج نهائي، مع فصل نسب الشركاء والمستثمرين وأصحاب الماكينات وتوزيعات الأرباح إلى Profit Engine.
- **Context:** تصميم مسار الحسابات وربطه بـTrendOS Operations.
- **Reason:** منع خلط المحاسبة الفعلية بقواعد توزيع الأرباح والحفاظ على حدود مسؤولية واضحة.
- **Project:** Trend Mall / TrendOS
- **Status:** Active / Approved
- **Outcome / Notes:** Project-only؛ التفاصيل التشغيلية تبقى في ذاكرة/وثائق TrendOS Accounting الرسمية.

## DEC-20260904-ACCOUNTING-002
- **Date:** 2026-09-04
- **Decision:** Order ID هو مفتاح ربط الأوردر بين Operations وAccounting، وLine ID إلزامي للربط والربحية على مستوى البند.
- **Context:** الأوردر الواحد قد يحتوي بنودًا بجهات تنفيذ وتكاليف ومخزون مختلفة.
- **Reason:** منع الربط الهش بالاسم/الهاتف ومنع ضياع تكلفة وربحية البنود داخل إجمالي الأوردر.
- **Project:** Trend Mall / TrendOS
- **Status:** Active / Approved
- **Outcome / Notes:** الحفاظ أيضًا على IDs المتخصصة مثل Item/Invoice/Payment/Stock Movement حسب العقود الرسمية.

## DEC-20260904-ACCOUNTING-003
- **Date:** 2026-09-04
- **Decision:** المخزون/BOM في TrendOS Accounting يكون Generic ويدعم Raw Material وSemi-Finished وFinished Product وService، مع BOM متداخل وتكوين تلقائي عند الحاجة.
- **Context:** التكوين اليدوي للمنتجات الوسيطة يبطئ سير العمل.
- **Reason:** استهلاك الخامات الصحيحة وحساب التكلفة وحركة مخزون audit-safe دون hard-code لصنف بعينه.
- **Project:** Trend Mall / TrendOS
- **Status:** Designed / Approved Requirement
- **Outcome / Notes:** أمثلة المنتجات لا تتحول إلى قواعد عامة؛ المطلوب recursive/generic BOM + atomic/replay-safe stock behavior.

## قاعدة القرار

- لا يتم تحويل توصية AI إلى قرار Confirmed إلا إذا اعتمدها المستخدم صراحة أو وُجد عقد اعتماد موثق.
- Project-only decisions تبقى scoped للمشروع ولا تتحول إلى Fokha Global تلقائيًا.
- أحدث Evidence متحقق يمكن أن supersede حالة تنفيذ قديمة بدون حذف القرار التاريخي.
- التفويض التنفيذي لا يلغي سلطة المستخدم النهائية؛ هو يقلل الانتظار في القرارات الروتينية الآمنة فقط.