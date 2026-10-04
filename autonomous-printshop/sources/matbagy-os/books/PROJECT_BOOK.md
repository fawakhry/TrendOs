# كتاب مشروع Matbagy OS — صندوق مطبعجي / Project Continuation Book

> المرجع الرسمي الرئيسي للمشروع في جذر الـRepository. لا تبدأ Discovery من الصفر.
>
> **قرار المالك — 2026-10-02:** المشروع لم يعد يُعرّف كأداة داخلية لمطبعجي فقط. الهدف الرسمي هو بناء **Multi-Tenant SaaS / Print Business Operating System** قابل للبيع بالاشتراك للمطابع ومراكز الطباعة والهدايا والتصنيع الشخصي. **مطبعجي هو Tenant 001 ومعمل الاختبار المرجعي للمنتج.**

Project: Matbagy OS
Repository: fawakhry/Matbagy-OS
Default branch: main
Product type: Multi-Tenant SaaS / Print Business Operating System
TENANT_001 = Matbagy
North Star: Operating System for Personalized Manufacturing

## 1) المصدر الرسمي

- Repository: `fawakhry/Matbagy-OS`
- Branch: `main`
- Entry: `صندوق_مطبعجي.md`
- Book: `PROJECT_BOOK.md`
- Detailed Cases: `صندوق_مطبعجي/CASES/`
- Runtime: `runtime/`

`fawakhry/Matbagy` و`fawakhry/Fokha` ليسا ذاكرة المشروع.

## 2) الهوية الرسمية الجديدة للمشروع

الاسم التشغيلي المؤقت:

**Matbagy OS — Print Business Operating System**

التعريف الرسمي:

> منصة SaaS متعددة المستأجرين لإدارة دورة عمل المطبعة والتصميم والإنتاج والذكاء الاصطناعي والمعرفة والأصول والموظفين والعملاء، بحيث يمكن بيعها بالاشتراك لمطابع متعددة مع عزل كامل للبيانات والصلاحيات.

المشروع لا يُبنى بعد الآن على افتراض "مطبعة واحدة فقط".

من هذه النقطة:
- كل Feature جديدة تُقيّم على أساس قابليتها للعمل لدى `10,000+` مطبعة.
- مطبعجي الحالي = `TENANT_001`.
- مطبعجي هو أول بيئة تشغيل حقيقية، Demo Center، ومصدر مشاكل التشغيل الواقعية التي تتحول إلى Product Features.
- نجاح Feature داخل مطبعجي لا يجعلها تلقائيًا Feature عامة؛ يجب فصل القاعدة العامة عن التخصيص المحلي.
- الهدف التجاري طويل المدى هو تحويل الدخل من الاعتماد على التشغيل اليدوي داخل المطبعة إلى **Recurring Subscription Revenue** ومنظومة خدمات رقمية متكررة.

## 3) North Star — رؤية 2050

الرؤية القصوى للمشروع ليست "برنامج أوردرات" ولا "برنامج تصميم".

الرؤية:

**Operating System for Personalized Manufacturing**

أي نظام تشغيل للمنتجات المصنوعة حسب الطلب، يبدأ بالمطابع ثم يمكن أن يمتد إلى:
- الطباعة والصور.
- الليزر والحفر.
- الهدايا.
- الملابس والطباعة عليها.
- التغليف.
- الديكور.
- اللافتات والبنرات.
- أي منتج Personalized / Made-to-Order.

في الصورة النهائية المستهدفة يستطيع النظام أن:
- يفهم نية العميل بدل الاكتفاء بأمر تصميم مباشر.
- يسترجع تفضيلات العميل السابقة بموافقته.
- يقترح المنتج نفسه، وليس التصميم فقط.
- ينشئ التصميم ويفحصه.
- يحسب التكلفة والربح والهالك.
- يختار الماكينة والخامة ومسار الإنتاج.
- يدير الموظفين والطوابير والمواعيد.
- يفحص الجودة بصريًا.
- يتعلم من التشغيل والأخطاء والرفض والاعتماد.
- يبني Digital Twin تشغيلي للماكينات والعملاء والمنتجات.
- يحول الخبرة البشرية المتراكمة إلى `Matbagy Design DNA`.

## 4) المنتج التجاري المستهدف

المنتج الذي يُباع ليس "AI".

ما يُباع هو:
- تقليل ضياع الأوردرات.
- تقليل أخطاء التنفيذ.
- معرفة حالة كل شغلانة.
- معرفة الربح الحقيقي لكل أوردر.
- تقليل الهالك.
- تقليل وقت التصميم والإدارة.
- تسليم أسرع.
- إدارة الموظفين والمراحل.
- ذاكرة قابلة للبحث.
- أتمتة الأعمال المتكررة.
- Intelligence يساعد صاحب المطبعة على اتخاذ قرار أفضل.

الـAI طبقة داخل المنتج، وليس المنتج كله.

## 5) نموذج الـSaaS الإجباري من الآن

كل الكيانات الجديدة التي تُصمم معماريًا يجب أن تكون Tenant-aware.

الحد الأدنى المطلوب في أي Data Model مناسب:
- `tenant_id`
- `branch_id` عند الحاجة
- `user_id` / actor identity
- timestamps
- audit provenance
- ownership / access scope

كيانات مستقبلية متوقعة:
- Tenant
- Branch
- User
- Role
- Customer
- Order
- Design Case
- Asset
- Product
- Recipe
- Template
- Machine
- Material
- Inventory Item
- Job
- Production Step
- Approval
- Payment
- Delivery
- Knowledge Item
- AI Memory
- Audit Event

**ممنوع تصميم Core جديد يفترض Tenant واحد ضمنيًا إذا كان سيصبح جزءًا من المنتج التجاري.**

## 6) عزل البيانات والمعرفة

يجب فصل المعرفة إلى مستويين على الأقل:

### Global Platform Knowledge
معرفة عامة قابلة للاستخدام بين المستأجرين، مثل:
- قواعد الطباعة العامة.
- مبادئ Bleed / DPI / Color.
- أنواع Workflows العامة.
- قواعد سلامة الإنتاج العامة.
- Recipes عامة غير مملوكة لعميل بعينه.

### Private Tenant Knowledge
تظل ملكًا للمطبعة وحدها، مثل:
- العملاء.
- الأسعار الخاصة.
- الموظفون.
- الموردون.
- ملفات العملاء.
- التصميمات الخاصة.
- قواعد التسعير الداخلية.
- أسرار التشغيل.
- تاريخ الأرباح.
- Templates الخاصة.
- ذاكرة العميل الخاصة.

لا يجوز للـAI أو البحث أو التحليلات تسريب Private Tenant Knowledge إلى Tenant آخر.

## 7) مسار العميل المستهدف

الصورة المستهدفة للدورة:

`Customer Intent -> Intake -> Quote -> Case -> Design -> Review -> Approval -> Production Plan -> Machine/Material -> QC -> Delivery -> Learning`

مع الوقت يمكن أن تصبح:

`Intent -> AI Product Proposal -> Costing -> Design -> Automated Preflight -> Production Scheduling -> Machine Execution -> Vision QC -> Delivery -> Memory`

## 8) دورة الاعتماد الرسمية

يجب الفصل بين الحالات التالية:

`DRAFT -> AI_REVIEWED -> OPERATOR_REVIEWED -> CUSTOMER_APPROVED -> READY_FOR_PRODUCTION -> IN_PRODUCTION -> QC_PASSED -> DELIVERED`

قواعد:
- `archival_final` لا يساوي `customer_approved`.
- AI لا يملك إعلان موافقة العميل.
- AI لا يملك إعلان التسليم.
- AI authority تظل `ADVISORY_ONLY` في القرارات البشرية الحساسة.
- كل Transition حساس يجب أن يكون له Actor/Audit واضح.

## 9) مسار المنتج التجاري الأول

قبل الوصول إلى رؤية 2050، الـCommercial Core الأول يستهدف:

- Customers & Orders.
- Job/Case tracking.
- ملفات وصور مرتبطة بالأوردر.
- Pricing / Cost / Margin.
- Products / Recipes / Templates.
- موظفين وصلاحيات.
- Production stages.
- مواعيد وتنبيهات.
- Audit trail.
- Search.
- Dashboard أساسي.
- AI intake وتحويل الطلب إلى Job Card.
- AI retrieval من الشغل السابق.
- Visual QA / Preflight.

ثم تأتي طبقات:
- Inventory.
- Accounting integrations.
- WhatsApp / messaging.
- Customer portal.
- Multi-branch.
- Machine telemetry.
- Predictive maintenance.
- Autonomous scheduling.
- Marketplace / suppliers / shipping.

## 10) نموذج الإيراد المستهدف

المشروع يجب أن يسمح بعدة مصادر دخل وليس اشتراكًا واحدًا فقط:

- Monthly / Annual Subscriptions.
- Starter / Business / Pro / Factory tiers.
- AI usage allowances.
- AI Design add-on.
- WhatsApp / Automation add-on.
- Inventory / Advanced Finance add-on.
- Multi-Branch add-on.
- Marketplace commission.
- Supplier commission.
- Payments commission حيثما يكون قانونيًا ومناسبًا.
- Premium automation / autonomous production features.

قاعدة تجارية:
**لا تسمح تكلفة الـAI أو التخزين أو الأتمتة الثقيلة أن تلتهم هامش الاشتراك دون Usage Controls.**

## 11) Product Moat — الميزة التي يصعب تقليدها

الميزة الأساسية ليست الوصول إلى نموذج AI بعينه.

الميزة المستهدفة:

**Matbagy Design DNA**

وهي الخبرة المنظمة الناتجة عن:
- Design Cases.
- Version history.
- Accepted / Rejected outcomes.
- Negative Learning.
- Product Recipes.
- Production outcomes.
- Machine behavior.
- Cost and waste patterns.
- Customer preference history بموافقة العميل.
- Human decisions and audit evidence.

الهدف أن يتحسن النظام من الاستخدام الحقيقي دون خلط ملكية أو خصوصية بيانات المستأجرين.

## 12) هدف المشروع التشغيلي الحالي

صندوق مطبعجي هو ذاكرة مستقلة + Runtime تدريجي لشغل التصميمات، وهو الآن الأساس الذي سيُعاد استخدامه داخل Matbagy OS.

`Chat -> Case -> Versions -> Assets -> Decisions -> Lessons -> Knowledge -> Runtime`

هذا المسار لا يُلغى؛ بل يصبح Domain Module داخل المنتج الأكبر.

## 13) سياسة الذاكرة

- `AUTO_PERSIST` هو الوضع الرسمي.
- الحفظ لا ينتظر اعتمادًا يدويًا.
- الحفظ لا يساوي اعتمادًا نهائيًا ولا أمر تنفيذ.
- الفشل والرفض يُحتفظ بهما كـNegative Learning.
- AI authority = `ADVISORY_ONLY`.

## 14) مصادر الحقيقة

- GitHub: Case state / contracts / metadata / knowledge.
- Google Drive: الصور والأصول الفعلية.
- Drive File ID أقوى من الاسم أو المسار.
- حقائق Order/Payment/Inventory/Delivery تأتي من النظام التشغيلي المختص عند الربط مستقبلًا.
- في SaaS Production النهائي يجب أن تكون مصادر الحقيقة Tenant-scoped صراحة.

## 15) Google Drive

Canonical Project Root ID:
`1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`

Canonical Case path:
`01_Design_Cases/YYYY/<CASE_ID>/`

Runtime Sandbox folder:
- `99_Runtime_Sandbox`
- ID: `1pTM4Xw98qnd1XoPKpBDVel21CXCQpZoF`

صور العملاء الحقيقية تبقى في Drive، وGitHub العام يحتفظ بالـmetadata والـIDs والروابط فقط في المعمارية الحالية.

قبل Commercial Production يجب مراجعة استراتيجية التخزين لتناسب Multi-Tenant security / tenancy / retention / deletion / encryption requirements.

## 16) قواعد التصميم والإنتاج — خطوط عريضة

- الحفاظ على الملامح وعدم إضافة فلاتر أو تغيير الوجه بدون طلب صريح.
- تعديل المطلوب فقط.
- المقاس والخلفية والاستروك عند طلبهم قيود إنتاج.
- `استخراج التصميم للطباعة` يعني Artwork نظيفًا.
- التعلم والقرارات يعتمدون على Evidence موثق.

هذه القواعد الخاصة بمطبعجي تُعامل كـTenant 001 Knowledge ما لم تكن قاعدة عامة صالحة للمنصة.

## 17) الفصل بين المشاريع

- كل مشروع يحتفظ بتفاصيله داخل Repository/Branch الرسمي الخاص به.
- FOKHA_BRAIN يحتفظ فقط بفهرس وروابط عامة.
- لا تُكرر حقيقة حية في أكثر من مشروع.
- Git history القديم ليس Source of Truth حاليًا.

## 18) حالة الذاكرة

- Integrity pass: مكتمل كأساس.
- Drive duplicate/path cleanup الأساسي: مكتمل.
- Watch/Knowledge registry: تم تحديثهما.
- التعليمات المتعارضة مع Auto-Persist: تم تصحيحها.

## 19) Runtime — الحالة التقنية الحالية

آخر حالة تقنية مؤكدة تظل:

`RUNTIME_V0.9 / LIVE_AI_SANDBOX_CODE_READY / CLOUD_SANDBOX_PERSISTENCE_CODE_READY / CI_GREEN / NOT_DEPLOYED`

الطبقات المبنية وصلت إلى:
- Orchestrator + Storage + HTTP.
- Auth/Audit/Resilience.
- GitHub/Drive Sandbox isolation.
- CI + Readiness gates.
- Cloudflare Worker boundary.
- Live OpenAI/Gemini provider adapters.
- Optional GitHub/Drive sandbox persistence adapters.

قرار SaaS الجديد لا يُعتبر دليلًا أن Multi-Tenant runtime تم تنفيذه بالفعل. هو اتجاه معماري ملزم للأعمال القادمة.

## 20) Sandbox verification

- GitHub sandbox create/read/delete smoke: PASS.
- Drive sandbox create/read/delete smoke: PASS.
- Canonical Cases/production targets لم تُستخدم في اختبارات الـsandbox.
- External Worker persistence يظل OFF افتراضيًا حتى ينجح Live AI deployment أولًا.

## 21) القرار المعماري الحالي للـRuntime

تم اعتماد المسار:

`Cloudflare Worker Sandbox -> OpenAI + Gemini`

ثم بعد نجاح Live AI smoke فقط:

`Cloudflare Worker Sandbox -> GitHub Sandbox + Drive Sandbox`

لا يوجد قرار معماري معلق لهذه المرحلة.

## 22) Current Technical Gate

`CREDENTIAL_SETUP_AND_CLOUDFLARE_DEPLOY`

محاولة Deploy فعلية وصلت إلى Secret Validation، والـRuntime tests نجحت، لكن النشر لم يتم لأن External Environment Secrets لم تكن مجهزة وقت المحاولة.

هذا Gate ليس Production approval.

## 23) Runtime Safety Boundary

غير مفعّل حتى الآن:
- أي canonical GitHub/Drive write من الـWorker.
- Production customer data.
- Production auth/identity.
- Production public endpoint/domain.
- أي ادعاء أن Cloudflare deployment أو live AI smoke تم قبل وجود Evidence فعلي.

Production يظل قرارًا منفصلًا بعد نجاح الـLive Sandbox بالكامل.

## 24) أولويات التحول إلى SaaS

بعد إغلاق Live Sandbox gate، الأولويات المعمارية قبل أي Commercial Production هي:

1. **Tenant Foundation**
   - Tenant identity.
   - Tenant isolation.
   - Roles/permissions.
   - Tenant-scoped audit.
   - Tenant-scoped storage and AI memory.

2. **Schema Reconciliation**
   - إزالة أي افتراض Single-Tenant من Core schemas.
   - توحيد جميع IDs/roots القديمة والجديدة.
   - مراجعة Design Case schema قبل Production writes.

3. **Unified Case / Job Intake**
   - نموذج موحد لاستقبال الشغل.
   - Product / size / quantity / assets / deadline / notes / production constraints.

4. **Product Recipes**
   - تحويل خبرة مطبعجي إلى Recipes قابلة لإعادة الاستخدام.
   - فصل Global Recipe عن Tenant-specific Recipe.

5. **Visual QA / Preflight**
   - dimensions.
   - DPI.
   - background.
   - stroke/cut readiness.
   - text presence.
   - image/face-change policy checks حيثما يمكن إثباتها.
   - production bounds.

6. **Commercial Core**
   - Orders / costing / pricing / margin / jobs / employees / status / delivery.

## 25) قاعدة التنفيذ من الآن

أي مهمة جديدة تُصنف أولًا إلى واحد من ثلاثة أنواع:

### A. Tenant 001 Operational Feature
خاص بمطبعجي الحالي.

### B. Platform Feature
قابل للبيع لكل المطابع ويجب أن يكون Tenant-safe.

### C. Experimental / Future Feature
جزء من رؤية 2050 ويحتاج Proof قبل إدخاله في الـCore.

إذا كانت Feature بدأت كحل لمطبعجي ويمكن تعميمها، يجب فصل:
- Platform Core.
- Tenant Configuration.
- Tenant Private Knowledge.

## 26) المراجع التقنية

- Runtime details: `runtime/README.md`
- Latest technical checkpoint: `صندوق_مطبعجي/CHECKPOINT_RUNTIME_2026-09-12.md`
- Sandbox targets: `runtime/SANDBOX_TARGETS.md`
- Cloudflare deployment runbook: `runtime/CLOUDFLARE_SANDBOX_DEPLOYMENT.md`

## 27) Startup Protocol

عند قول:
`كمل مشروع صندوق مطبعجي`
أو
`كمل Matbagy OS`

نفذ:

1. اقرأ هذا الكتاب أولًا.
2. اعتبر **Multi-Tenant Print Business OS** هو تعريف المشروع الرسمي الأعلى.
3. اعتبر مطبعجي `TENANT_001`.
4. اقرأ أحدث Runtime checkpoint إذا المهمة تقنية.
5. افحص commits بعد آخر checkpoint فقط.
6. لا تعد Discovery من الصفر.
7. لا تبدأ من MVP القديم في root إلا إذا كانت المهمة تخصه صراحة.
8. لا تنفذ Feature جديدة في الـCore بطريقة Single-Tenant دون سبب موثق.
9. لا تعتبر رؤية 2050 Feature منجزة لمجرد تسجيلها في الكتاب.

## 28) Latest Strategic Continuation Point — 2026-10-02

### قرار المالك
الهدف النهائي هو بناء برنامج للمطابع يُباع باشتراكات، بحيث يتحول المشروع من أداة داخلية إلى Business مستقل قابل للتوسع، ويقل اعتماد المالك مستقبلًا على التشغيل اليومي للمطبعة.

### الحالة الاستراتيجية
- Product identity: `Matbagy OS / Print Business Operating System`.
- Business model direction: `Multi-Tenant SaaS`.
- First tenant / proving ground: `TENANT_001 = Matbagy`.
- North Star: `Operating System for Personalized Manufacturing`.
- Revenue direction: Subscriptions + Usage + Add-ons + future marketplace/platform revenue.
- Platform AI: جزء من النظام وليس المنتج وحده.
- Core architectural mandate: Tenant isolation من الجذور.

### الحالة التقنية
- Runtime: v0.10 Multi-Tenant/D1 foundation code-ready حسب آخر تحقق تقني موثق.
- Sandbox isolation smoke: PASS.
- Runtime CI: GREEN حتى آخر تحقق تقني مسجل.
- Live AI architecture: Cloudflare Sandbox معتمد.
- أول Cloudflare deploy attempt: توقف عند Secret Validation؛ لم يتم النشر.
- Production: غير مفعّل.
- Current technical gate: `CREDENTIAL_SETUP_AND_CLOUDFLARE_DEPLOY`.

### الاتجاه التالي بعد إغلاق Gate التقني
`TENANT_FOUNDATION -> SCHEMA_RECONCILIATION -> UNIFIED_INTAKE -> PRODUCT_RECIPES -> VISUAL_QA -> COMMERCIAL_CORE`


## 29) Vision Lock — Founder Outcome + Matbagy OS 2050

### الهدف الشخصي/التجاري للمالك

الهدف ليس فقط تحسين تشغيل مطبعجي الحالي.

الهدف النهائي هو بناء **شركة برمجيات باشتراكات متكررة** تجعل دخل المشروع منفصلًا تدريجيًا عن وجود المالك اليومي داخل المطبعة.

المسار المقصود:

`Operate Matbagy -> Productize Matbagy Knowledge -> Sell Matbagy OS -> Grow Recurring Revenue -> Reduce Owner Daily Operations Dependence`

مطبعجي لا يُلغى؛ يتحول إلى:
- `TENANT_001`.
- أول عميل حقيقي.
- مختبر تشغيل حي.
- Demo Center.
- مصدر حالات واقعية وتحسينات Product.
- مرجع لإثبات أن الـSoftware يوفر وقتًا وفلوسًا ويقلل الأخطاء والهالك.

### الرؤية النهائية للمنتج

في 2050 لا يكون Matbagy OS مجرد:
- برنامج أوردرات.
- CRM.
- برنامج مخزون.
- برنامج تصميم.
- Chatbot AI.

بل يصبح:

**Autonomous Print & Personalized Manufacturing Operating System**

أي طبقة تشغيل ذكية تدير دورة العمل من نية العميل حتى التسليم والتعلم.

الرؤية المستهدفة طويلة المدى:

`Customer Intent -> Product Discovery -> Quote -> Design -> Approval -> Production Planning -> Machine Execution -> Vision QC -> Delivery -> Memory -> Learning`

### قدرات 2050 المستهدفة

#### Intent Engine
العميل يستطيع وصف المناسبة أو الإحساس أو الهدف، والنظام يحوله إلى منتجات وتصميمات ومسارات تنفيذ قابلة للبيع.

#### Customer Preference Twin
بموافقة العميل، يبني النظام Profile تفضيلات يساعد على اقتراح منتجات وتصميمات أقرب لذوقه مستقبلاً دون ادعاء معرفة غير موثقة.

#### Memory Layer
إمكانية بناء أرشيف طويل الأجل للعميل/العائلة بموافقته، بحيث يمكن تحويل تاريخ الصور والمناسبات والمنتجات السابقة إلى منتجات جديدة وتجارب تذكارية.

#### AI Product Inventor
الـAI لا يقترح تصميمًا فقط؛ يمكنه اقتراح Product جديد، خاماته، طريقة تصنيعه، تكلفته، سعره المتوقع ومسار إنتاجه قبل اعتماده بشريًا.

#### Autonomous Production
بعد اعتماد الأوردر يستطيع النظام مستقبلاً:
- اختيار الماكينة.
- اختيار الخامة.
- عمل imposition/nesting.
- تقليل الهالك.
- جدولة التشغيل.
- إصدار Job Pack.
- إرسال خطوات التنفيذ للماكينة/المشغل.
- تتبع حالة التنفيذ.

#### Vision Quality Control
كاميرات/Computer Vision تقارن المنتج الفعلي بالمطلوب وتكتشف:
- قص غير صحيح.
- انحراف لون واضح.
- عناصر ناقصة.
- عيوب سطحية قابلة للرصد.
- Barcode/QR غير صالح.
- خطأ في النسخة/المقاس.

وتنتج:
`PASS / REVIEW / REPRINT`

#### Machine Digital Twins
كل ماكينة يمكن أن يكون لها Digital Twin تشغيلي يتابع:
- تاريخ الأعطال.
- الأحمال.
- الاستهلاك.
- القطع.
- الصيانة.
- الإشارات المبكرة للفشل.

والهدف الانتقال من Reactive Maintenance إلى Predictive Maintenance حيث تتوفر Evidence كافية.

#### AR / Spatial Sales
العميل يمكنه معاينة المنتج في مكانه قبل التصنيع:
- تابلوه على الحائط.
- لافتة على الواجهة.
- تغليف/هدية في الحجم الحقيقي.
- مقارنات أحجام وإطارات وخامات.

#### Real-Time Cost & Profit Engine
السعر لا يعتمد على قائمة ثابتة فقط، بل يمكن أن يتأثر ضمن قواعد واضحة بـ:
- الخامات.
- وقت الماكينة.
- الهالك.
- ضغط الإنتاج.
- موعد التسليم.
- تكلفة الـAI.
- تكلفة الشحن/الخدمات.

مع بقاء قواعد التسعير والتحكم تحت سلطة الـTenant.

#### Multi-Agent Business Brain
يمكن أن يحتوي Matbagy OS على Agents متخصصة مثل:
- Customer Agent.
- Design Agent.
- Production Agent.
- Quality Agent.
- Inventory Agent.
- Finance Agent.
- Maintenance Agent.
- Marketing/Trend Agent.

وفوقهم Orchestrator موحد يحافظ على الصلاحيات والـaudit وحدود كل Agent.

### نموذج الشركة المستهدف

الدخل المستهدف لا يعتمد على قناة واحدة:

`Subscriptions + AI Usage + Add-ons + Multi-Branch + Payments + Marketplace + Supplier/Shipping Integrations + Premium Automation`

الهدف هو بناء **Recurring Revenue Engine** وليس بيع نسخة برنامج مرة واحدة.

### قاعدة استراتيجية ملزمة

كل Feature جديدة يجب أن تجيب على ثلاثة أسئلة:

1. هل تحل مشكلة حقيقية متكررة في مطبعة فعلية؟
2. هل يمكن تحويلها إلى Platform Capability قابلة للبيع لأكثر من Tenant؟
3. هل تزيد Retention / Revenue / Automation / Data Moat أو تقلل Cost/Risk؟

إذا كانت الإجابة لا، تُعامل كـTenant customization أو Experiment ولا تدخل الـCore مباشرة.

### تعريف النجاح

نجاح Matbagy OS لا يقاس بعدد الـFeatures.

يقاس بقدرة النظام على:
- زيادة أرباح المطبعة.
- تقليل الهالك والأخطاء.
- تقليل زمن إدارة الأوردر.
- تقليل الاعتماد على الأشخاص في الخطوات المتكررة.
- زيادة وضوح التشغيل لصاحب المطبعة.
- تحويل خبرة التشغيل إلى Software قابل للبيع.
- خلق اشتراكات متكررة مستقلة عن ساعات عمل المالك.

**هذه الرؤية أعلى من أي تعريف قديم للمشروع كـDesign Workflow داخلي، وتُستخدم كمرجع استراتيجي عند تعارض اتجاهات مستقبلية.**

## 30) Commercial v1 Execution Roadmap — Target 2027-06-30

الهدف التنفيذي الرسمي للإصدار التجاري الأول:

**Matbagy OS v1.0 General Availability by 2027-06-30**

هذا التاريخ يعني الانتهاء من SaaS تجاري قابل للبيع للمطابع، وليس اكتمال رؤية 2050.

المسار الشهري الملزم:
- October 2026: Tenant Foundation + Schema Reconciliation + Live Sandbox gate.
- November 2026: Customers + Orders + Unified Intake.
- December 2026: Products + Recipes + Pricing/Cost/Margin.
- January 2027: Production OS.
- February 2027: AI Intelligence + Tenant Knowledge.
- March 2027: Visual QA + Automation.
- April 2027: Commercial SaaS Layer + Plans/Billing/Onboarding.
- May 2027: Controlled real-world Beta.
- June 2027: Freeze + Security/Billing/Recovery validation + paid launch + v1.0 GA.

المرجع التنفيذي الكامل:
`ROADMAP_V1_2027-06.md`

قاعدة Scope:
**لا تؤخر Feature من رؤية 2050 إطلاق v1 إلا إذا كانت لازمة للأمان، Tenant isolation، البيانات، billing، recovery أو القيمة التجارية الأساسية.**

### Execution progress — 2026-10-02

بدأ التنفيذ الفعلي لـOctober Foundation، وتم تأهيل ودمج **ثماني دفعات** على `main`:

#### Phase 1 — Tenant Core
- Tenant-scoped Case/Asset memory storage.
- Tenant context داخل AI shared packet وaudit.
- رفض Cross-Tenant Asset.
- Legacy compatibility عبر `TENANT_001`.
- تصحيح Design Case Drive Root.
- Merge: `0e516e070984e7c7c3da7ef2c62d5559df921d27`
- Main CI: `37040638149 = SUCCESS`

#### Phase 2 — Tenant Auth Boundary
- Auth principal مرتبط بـTenant.
- HTTP tenant mismatch = DENY.
- Rate limit وIdempotency أصبحت Tenant-scoped.
- Cloudflare Sandbox identity = `TENANT_001`.
- Merge: `e1a7fcb73b0d8804214b9bfa9382d685d89cc0be`
- Main CI: `37041122220 = SUCCESS`

#### Phase 3 — Tenancy Contract / Schema Reconciliation
- إضافة `صندوق_مطبعجي/SCHEMA/TENANCY_CONTRACT.md`.
- ربط Rooms/Watch/Auto-Persist/Assets/Knowledge/Drive بعقد الـTenancy.
- Legacy paths موثقة كـTenant 001 فقط.
- Merge: `4af2aba2bbd62f2703fd6592e55d600dc7a266a3`
- Main CI: `37041535942 = SUCCESS`

#### Phase 4 — RBAC Foundation
- Permission model صريح بدل الاعتماد على Role name فقط.
- Owner/Admin/Manager/Operator/Designer/Viewer foundations.
- `runtime:turn` permission enforced في HTTP وCloudflare.
- Merge: `c919e08a6bda4f8df6bc2f045476882388253857`
- Main CI: `37042256858 = SUCCESS`

#### Phase 5 — Persistent D1 Tenant Foundation
- D1 migrations لـTenants/Memberships/Cases/Watch/Assets/Idempotency/Audit.
- D1 Tenant Directory + Case Store + Asset Metadata Store.
- Persistent writes تفشل مغلقًا بدون explicit `tenant_id`.
- Merge: `f3a9ce4782260b1983db85a019236a4ac37054b6`
- Main CI: `37042677434 = SUCCESS`

#### Phase 6 — Tenant Provisioning / Storage / Search
- Tenant provisioning + owner membership.
- ACTIVE/SUSPENDED/CLOSED lifecycle.
- explicit tenant->storage-root mapping.
- tenant-scoped Case search projection.
- Merge: `404ee46d0d6a295baf14c6c7f4c1f1e01cb35bc1`
- Main CI: `37043049744 = SUCCESS`

#### Phase 7 — Tenant Data Lifecycle
- Tenant-scoped export/backup manifest.
- deletion precondition verification.
- destructive delete = DISABLED حتى Retention/Legal policy.
- Merge: `2961987d4c12b90e7c86dc5f7726378aaec9d1be`
- Main CI: `37043290583 = SUCCESS`

#### Phase 8 — D1 + Live AI Sandbox Deployment Automation
- Worker يدعم D1 Case state عند `TENANT_DB_ENABLED=true`.
- Workflow ينشئ/يعيد استخدام `matbagy-runtime-sandbox-db`.
- يطبق migrations + seed لـ`TENANT_001`.
- ينشر Worker بربط D1 مؤقت من غير تخزين DB ID كـSecret.
- يعمل `/health` + GPT + Gemini + BOOM smoke.
- يتحقق أن Cases الثلاثة اتكتبت في D1.
- GitHub/Drive evidence persistence تظل OFF في Phase A.
- Merge: `c5e42713fe96cd2ca460239dd7e1f097a7ae8359`
- Main CI: `37044184754 = SUCCESS`

### Latest live deploy attempt
- Deploy branch: `sandbox/deploy-live-ai`
- Workflow run: `37044242376`
- Runtime test suite داخل deploy: SUCCESS.
- Secret validation: FAILED.
- القيم الخمس في GitHub Environment `matbagy-sandbox` ظهرت فارغة.
- D1 create/migrations/deploy/smoke: SKIPPED، لذلك لم يتم إنشاء D1 ولم يتم نشر Worker من هذه المحاولة.

### Current external gate
يلزم إعداد هذه Environment Secrets فقط:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `RUNTIME_BEARER_TOKEN`

Cloudflare token يجب أن يكون scoped للحساب المقصود وقادرًا على إدارة Sandbox Worker، ومعه `D1 Edit` لإنشاء/إدارة D1 Sandbox.

بعد إعدادها لا يحتاج المالك إلى إدخال D1 Database ID أو تنفيذ migrations يدويًا؛ الـWorkflow يقوم بذلك تلقائيًا.

### October Foundation — الحالة
- Tenant isolation: DONE.
- Auth tenant boundary: DONE.
- RBAC foundation: DONE.
- Schema reconciliation: DONE كأساس.
- Persistent D1 schema/adapters: DONE ككود.
- Tenant provisioning/lifecycle/storage mapping: DONE ككود.
- Tenant-scoped search foundation: DONE.
- Export/delete safety foundation: DONE.
- Live D1 + AI Sandbox verification: BLOCKED ON EXTERNAL SECRETS.
- Production: OFF.



## Migration checkpoint — 2026-10-02

Canonical source: `fawakhry/Matbagy-OS@main`.
Migration payload commit: `7b3c70d60e6a7f4014e454cbd02f3e3d257c14fe`.
All 146 source files verified by blob SHA; no missing files. 126 exact originals and 20 intentional identity/routing updates before this checkpoint.
Runtime CI run `37025719989`: SUCCESS on canonical `main`; all nine test suites passed.
History preserved in `ARCHIVE/source-history.bundle` (all captured source branches).
Full evidence: `MIGRATION_FROM_MATBAGY_DESIGN_WORKFLOW.md` and `MIGRATION_FILE_INVENTORY.json`.
GitHub Sandbox branch `sandbox/runtime-v06` recreated in this repository; persistence stays OFF.
Current technical gate remains credential setup and Cloudflare deployment. No deployment or Production activation occurred during migration.
