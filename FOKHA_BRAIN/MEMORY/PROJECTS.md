# Fokha Projects

> Source: Google Sheet `Fokha - Idea Inbox` / tab `PROJECTS` + verified project sources.
> Synced: 2026-09-04.

## Fokha
- **Role in Fokha:** Executive Brain / Business Manager
- **Status:** Building
- **Objective:** تمثيل طريقة التفكير والرؤية والقرارات وإدارة كل المشاريع.
- **Knowledge Source:** GitHub `fawakhry/TrendOs/FOKHA_BRAIN` كمدخل منظم مؤقت + Google Sheet كـWorking Memory سريعة.
- **Next Milestone:** إنشاء Repository مستقل وخاص `fawakhry/Fokha` ثم نقل الذاكرة المنظمة إليه بدون كسر الروابط أو التاريخ.
- **Notes:** المظلة العليا فوق المشاريع؛ لا تستبدل ذاكرة أي مشروع أو Runtime Evidence.

## Trend Mall / TrendOS
- **Role in Fokha:** Managed Project / CURRENT TOP PRIORITY
- **Status:** Active / Production Read Cutover Blocked by D1 Freshness
- **Objective:** إنجاز TrendOS هو الأولوية التنفيذية الحالية لفوخا؛ الاستمرار من آخر Verified checkpoint بدون إعادة بدء أو تشتيت، مع حماية التشغيل الحالي.
- **Knowledge Source:** GitHub `fawakhry/TrendOs` -> `الصندوق الاسود.md` -> `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` -> latest checkpoint/runtime evidence.
- **Next Milestone:** `PERF-CF-02D`: استعادة/التحقق من `d1OrdersLiveSyncTick` بحيث Orders + Lines يتقدمان ذريًا، ثم إضافة `D1_Normalized_Live_Sync.gs` فقط إلى مشروع Apps Script عند توفر مسار source-capable، وإعادة Preview qualification. لا read cutover قبل ثبات freshness <=180s للأوردرات/البنود والكيانات normalized عبر أكثر من observation window.
- **Notes:** Owner priority confirmed 2026-09-04. آخر checkpoint متحقق: Edge/Auth/Safety/Cloud Write rollback/latency = PASS؛ production-fed D1 freshness = FAIL/BLOCKER؛ Orders mirror توقف عند `2026-09-04 00:27:55` في آخر دليل؛ normalized live sync prepared/tested but not production-installed؛ لا read/write cutover؛ Google Sheets + Apps Script ما زالا سلطة الكتابة. توجد متابعة دورية للصندوق الأسود للتغييرات المهمة.

## Matbagy Design Workflow
- **Role in Fokha:** Managed Project / Design Memory
- **Status:** Active
- **Objective:** تحويل تاريخ التصميمات إلى Design Cases وAssets وVersions وKnowledge قابلة للاستدعاء والتعلم.
- **Knowledge Source:** GitHub `fawakhry/Matbagy-Design-Workflow` -> branch `agent/initial-mvp` -> `صندوق_مطبعجي.md` -> `صندوق_مطبعجي/اقرأني_أولاً.md`.
- **Next Milestone:** استمرار استخراج الحالات المعتمدة وربط Assets على Google Drive مع الحفاظ على Case IDs وEvidence.
- **Notes:** الصندوق الرسمي الوحيد لذاكرة التصميمات؛ مستقل عن TrendOS وFokha. لا تستخدم `fawakhry/Matbagy` كبديل.

## Matbagy Photo Sheets
- **Role in Fokha:** Supporting Tool
- **Status:** Active / Separate
- **Objective:** أداة/واجهة Photo Sheets منفصلة.
- **Knowledge Source:** GitHub `fawakhry/Matbagy` -> `README.md` + implementation files.
- **Next Milestone:** الحفاظ عليها كأداة منفصلة وعدم استخدامها كصندوق ذاكرة تصميمات.
- **Notes:** README الرسمي يوجّه أوامر صندوق مطبعجي إلى `Matbagy-Design-Workflow`.

## EasyStore
- **Role in Fokha:** Supporting Accounting / Inventory App
- **Status:** Active / Integrated Legacy
- **Objective:** تشغيل الحسابات والمخزون وأدوات الأقسام مع تكامل قائم مع TrendOS.
- **Knowledge Source:** GitHub `fawakhry/EasyStore` + TrendOS integration code + Runtime/Sheets عند تحديد الحقيقة الحية.
- **Next Milestone:** الحفاظ على التشغيل الحالي أثناء الانتقال التدريجي إلى TrendOS Accounting الموحد.
- **Notes:** مكوّن قائم لا يُلغى أو يُعاد بناؤه فجأة؛ الكود Implementation Evidence وليس بديلًا عن Runtime Truth.

## TrendOS Lead Hunter
- **Role in Fokha:** Growth Tool
- **Status:** Active Prototype
- **Objective:** تقليل وقت البحث عن فرص العملاء وتنظيم المتابعات والردود المقترحة بطريقة آمنة.
- **Knowledge Source:** GitHub `fawakhry/trendos-lead-hunter` -> `README_PRO.md`.
- **Next Milestone:** تحديد نقطة الربط المستقبلية مع CRM/Growth في TrendOS بعد وضوح Authority/Data Contract.
- **Notes:** Safe/manual opportunity capture + dedupe + hot leads؛ لا يعتمد على Scraping تلقائي للبوستات أو التعليقات.

## Fiber Auto Max EZCAD
- **Role in Fokha:** Production AI Tool
- **Status:** Active
- **Objective:** تحسين الصور والبورتريه للحفر بالـFiber Laser/EZCAD مع الحفاظ على التفاصيل والإطار الكامل.
- **Knowledge Source:** GitHub `fawakhry/fiber-auto-max-ezcad` -> `README.md` + implementation/history.
- **Next Milestone:** رفع جودة المعالجة وربطها تدريجيًا بسير إنتاج مطبعجي بعد اختبار الجودة فعليًا.
- **Notes:** قيد جودة ثابت موثق: full rectangular frame وعدم فقد تفاصيل العين/الوجه.

## Awez
- **Role in Fokha:** Marketplace Product
- **Status:** Prototype v0.2
- **Objective:** محرك بحث وطلبات محلي يبدأ من بنها؛ العميل يبحث ويطلب والتاجر يدير المنتجات والطلبات.
- **Knowledge Source:** GitHub `fawakhry/awez` -> `README.md` + deploy workflow/tests.
- **Next Milestone:** الانتقال من demo/localStorage إلى auth حقيقي + hosted DB/API + maps/location + delivery/payment + audit/monitoring/backups.
- **Notes:** Web + Android + FastAPI prototype. التحقق من الإنتاج يجب أن يمر عبر deploy path وليس raw prototype فقط.

## VOKHA
- **Role in Fokha:** Immersive Social / VR Platform
- **Status:** Building / Local project evidence
- **Objective:** عالم اجتماعي غامر يجمع مدينة VOKHA الأصلية وتجارب مستوحاة من مدن حقيقية، للموبايل والكمبيوتر وVR.
- **Knowledge Source:** ChatGPT Library: `VOKHA_PROJECT_MASTERPLAN_AR.md` + VOKHA Codex prompt packages.
- **Next Milestone:** Pilot صغير عالي الجودة وقانوني ثم توسع منطقة بمنطقة، مع provenance/license لكل أصل أو مصدر بيانات.
- **Notes:** لا يوجد Repository مستقل VOKHA ضمن قائمة GitHub المملوكة التي تم التحقق منها في مراجعة 2026-09-04؛ لذلك ملفات Library دليل مشروع حالي وليست Runtime Truth.

## TrendOS Portal
- **Role in Fokha:** Separate Initiative / Front Door
- **Status:** Building / Partially Embedded
- **Objective:** بوابة للزائر والعميل والموظف: catalog + landing + login، مع ربط تدريجي لاحقًا بـTrendOS.
- **Knowledge Source:** قرارات ومحادثات المشروع السابقة + routes/portal context داخل TrendOS عند وجوده.
- **Next Milestone:** تثبيت حدوده كمبادرة مستقلة قبل الدمج الكامل وتحديد Source of Truth لكل جزء.
- **Notes:** لا يوجد Repository مستقل موثّق له ضمن قائمة GitHub التي تم فحصها في 2026-09-04.

## قاعدة ربط المشاريع

`Fokha -> Project -> Canonical Project Memory / Black Box -> Runtime Evidence`

Fokha يحتفظ بالخلاصة والروابط والقواعد والمعرفة القابلة لإعادة الاستخدام. الحقيقة التنفيذية التفصيلية تبقى داخل المصدر الرسمي للمشروع، وأحدث Evidence متحقق يتغلب على الملخصات التاريخية.