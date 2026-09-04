# Fokha Knowledge

> Organized reusable knowledge extracted from available conversations, project files, Google Drive working memory and verified GitHub project sources.
> Synced: 2026-09-04.

هذا الملف ليس قاعدة بيانات تشغيلية حية. إذا تعارض عنصر هنا مع Project Black Box أو Runtime Evidence أحدث، فالمصدر الأحدث المتحقق هو المرجع، ويُسجّل الـsupersede بدل محو التاريخ.

## KNOW-2026-000001 — Fokha portfolio architecture
- **Category:** Executive Architecture
- **Project / Scope:** Fokha Global
- **Statement:** Fokha هو العقل التنفيذي فوق المشاريع؛ كل مشروع يحتفظ بذاكرته/صندوقه الأسود الرسمي، بينما Fokha يحتفظ بالروابط والمعرفة القابلة لإعادة الاستخدام والقرارات وأنماط التفكير بدون إنشاء نسخة ثانية من الحقيقة الحية.
- **Classification:** EXPLICIT_USER + VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** FOKHA_BRAIN + Google Sheet decisions + current operating contract
- **Related:** DEC-20260904-001, DEC-20260904-002, DEC-20260904-003, STD-009
- **Reusable:** Yes

## KNOW-2026-000002 — Matbagy design case memory model
- **Category:** Design Knowledge System
- **Project / Scope:** Matbagy Design Workflow
- **Statement:** شغل التصميم يُحوّل إلى Design Cases بمفاتيح ثابتة؛ Order ID عند ثبوته، Case ID، Version ID، Asset ID، Knowledge ID. الاستخراج يبدأ Draft، والحفظ النهائي يحتاج موافقة بشرية صريحة، والنسخ المرفوضة تُحتفظ بها كـNegative Learning.
- **Classification:** VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** `fawakhry/Matbagy-Design-Workflow@agent/initial-mvp -> صندوق_مطبعجي/اقرأني_أولاً.md`
- **Related:** `Order ID <-> Case ID <-> Version ID <-> Asset ID <-> Knowledge ID`
- **Reusable:** Project-first; learning architecture reusable

## KNOW-2026-000003 — Products Catalog Brain schema
- **Category:** Product Knowledge
- **Project / Scope:** Matbagy / TrendOS
- **Statement:** سجل المعرفة للمنتج/الخدمة يستفيد من: اسم المنتج، الوصف، القسم، الصور المرجعية، الخامات المستخدمة، متوسط مدة التنفيذ، والأقسام المشاركة في التنفيذ.
- **Classification:** VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** ChatGPT Library `12_Products_Catalog_Brain.docx`
- **Why useful:** يدعم التسعير، routing، تخطيط الإنتاج، إجابات AI، والـautomation مستقبلًا.
- **Reusable:** Yes

## KNOW-2026-000004 — Awez commerce product model
- **Category:** Marketplace Product
- **Project / Scope:** Awez
- **Statement:** عاوز نموذج Marketplace محلي يبدأ من بنها؛ العميل يبحث ويطلب، والتاجر يدير المنتجات والطلبات. النسخة الموثقة تجمع Web + Android + FastAPI، بينما الانتقال للإنتاج يحتاج Auth حقيقي، قاعدة بيانات مستضافة، مواقع/خرائط، دفع وتوصيل، مزامنة مخزون، Audit/Monitoring/Backups.
- **Classification:** VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** `fawakhry/awez -> README.md`
- **Reusable:** Project-only

## KNOW-2026-000005 — VOKHA product model
- **Category:** Immersive Social Platform
- **Project / Scope:** VOKHA
- **Statement:** VOKHA عالم اجتماعي غامر للموبايل والكمبيوتر وVR، يجمع مدينة VOKHA أصلية مملوكة للمشروع مع تجارب مستوحاة من مدن حقيقية باستخدام مصادر قانونية/مرخصة. التنفيذ يبدأ Pilot صغير عالي الجودة ثم يتوسع منطقة بمنطقة.
- **Classification:** VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** ChatGPT Library `VOKHA_PROJECT_MASTERPLAN_AR.md` + VOKHA Codex prompt packages
- **Reusable:** Project-only; pilot/legal provenance pattern reusable

## KNOW-2026-000006 — Safe Lead Hunter model
- **Category:** Growth Workflow
- **Project / Scope:** TrendOS Lead Hunter
- **Statement:** Lead Hunter يقلل وقت البحث عن العملاء عبر جدول لفتح روابط بحث فيسبوك، تدوير كلمات البحث، الحفظ اليدوي للفرص، تحليل محلي، ردود مقترحة، منع التكرار، hot leads والمتابعات. التصميم الموثق يتجنب Scraping تلقائي للبوستات أو التعليقات.
- **Classification:** VERIFIED_SOURCE
- **Confidence:** HIGH
- **Evidence / Source:** `fawakhry/trendos-lead-hunter -> README_PRO.md`
- **Reusable:** Yes, مع احترام شروط المنصات والخصوصية

## KNOW-2026-000007 — Fiber laser image-processing target
- **Category:** Production Tool Knowledge
- **Project / Scope:** Fiber Auto Max EZCAD
- **Statement:** مسار تجهيز صور الفايبر يعطي أولوية للحفاظ على الإطار المستطيل الكامل وعدم فقد تفاصيل العين/الوجه أثناء المعالجة، ضمن هدف أوسع لإنتاج بورتريه عالي الجودة للحفر بالـFiber Laser/EZCAD.
- **Classification:** VERIFIED_SOURCE + repeated user requirements
- **Confidence:** HIGH
- **Evidence / Source:** `fawakhry/fiber-auto-max-ezcad -> README.md` + project history
- **Reusable:** Project-only

## KNOW-2026-000008 — EasyStore role in the operating stack
- **Category:** Legacy / Supporting System
- **Project / Scope:** Matbagy / TrendOS
- **Statement:** EasyStore مكوّن قائم للحسابات/المخزون وأدوات الأقسام ومتكامل مع TrendOS بصلاحيات حسب الدور. عند بناء TrendOS Accounting الموحد، يُعامل كنظام تشغيل قائم يجب الحفاظ عليه والهجرة منه تدريجيًا بدل إعادة بناء أو إلغاء مفاجئ.
- **Classification:** VERIFIED_SOURCE + project history
- **Confidence:** HIGH
- **Evidence / Source:** `fawakhry/EasyStore` + TrendOS integration code
- **Reusable:** Project-only; migration lesson reusable

## KNOW-2026-000009 — Cross-project implementation discipline
- **Category:** Execution Knowledge
- **Project / Scope:** Fokha Global
- **Statement:** النمط المتكرر عبر TrendOS وMatbagy وVOKHA هو: افحص النظام الحالي أولًا، حافظ على السلوك الشغال، نفّذ تغييرًا صغيرًا وقابلًا للرجوع، اختبر المسارات المتأثرة، وافصل بين تجهيز الكود واختباره ونشره والتحقق منه في Runtime.
- **Classification:** INFERRED_PATTERN
- **Confidence:** HIGH
- **Evidence / Source:** TrendOS Codex book + AGENTS + VOKHA prompts + TrendOS black box
- **Related:** RULE-003, RULE-008, RULE-009, RULE-011, TM-012
- **Reusable:** Yes

## Promotion contract

- لا تتحول معلومة Project-only إلى FOKHA_GLOBAL بدون دليل كافٍ.
- لا يتحول رأي AI إلى حقيقة أو قرار.
- المعرفة الحية مثل الأسعار/المخزون/الدفع/حالة الأوردر تُقرأ من Source of Truth وقت الحاجة ولا تُجمّد هنا كحقيقة نهائية.
- عند ظهور Evidence أحدث: update/supersede مع الاحتفاظ بالمصدر والتاريخ.