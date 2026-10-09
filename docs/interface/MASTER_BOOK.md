# Trend Mall / TrendOS — الكتاب الرئيسي للواجهة وتجربة الاستخدام

> **نوع الوثيقة:** UI/UX implementation book — تصميم وتنفيذ تدريجي وتثبيت الشاشات.
> **المستودع:** `fawakhry/TrendOs`
> **المسار الرسمي:** `docs/interface/MASTER_BOOK.md`
> **بدء الكتاب:** 2026-10-09
> **أول إدخال:** UI-000 — قراءة المطبعة الذاتية وتجميع مراجع الواجهة.
> **الحالة:** DESIGN_BASELINE / DOCUMENTATION_ONLY / IMPLEMENTATION_NOT_STARTED_IN_THIS_BOOK.
> **مسار العمل:** كل جزء منفصل؛ اختبار واقعي؛ تثبيت؛ الانتقال للجزء التالي. لا تغيير للواجهة الحية من إنشاء هذا الكتاب.

## 0. الهدف وحدود السلطة

الهدف بناء واجهة متماسكة وسريعة الاستخدام من الهاتف والكمبيوتر تربط بوابة Trend Mall وتجربة تشغيل TrendOS وحسابات EasyStore وإشراف Autonomous Printshop، دون إنشاء نظام بيانات بديل أو إعادة كتابة الوحدات الصالحة أو كسر الصلاحيات.

**الواجهة الموحّدة تعني اتساق الدخول والتنقل والهوية والتصميم، وليس دمج قواعد البيانات أو نقل صلاحيات التنفيذ من الأنظمة المصدرية.**

- TrendOS: مصدر العملاء والأوردرات والتشغيل في المسارات المثبتة بدليل Runtime.
- EasyStore: سلطة الحسابات، المشتريات، المدفوعات، الربحية، العهدة، والتقفيل المالي.
- Autonomous Printshop: Autonomy Control Plane + Owner Exception Console + إشارات الجاهزية/الاستثناءات؛ القراءة فقط بحسب المستوى المؤهل.
- Matbagy-OS: مصدر خبرة التصميم والذكاء الاصطناعي والعزل متعدد المستأجرين، وليس دليلًا على SaaS Production فعّال.
- Fokha: فهرس/موجّه لذاكرة المشاريع، وليس مكان نقل تفاصيل هذا الكتاب.
- أدوات الشيتات، روتيت، فايبر EZCAD، Lead Hunter: أدوات تخصصية مستقلة، تُدمج عبر روابط/عقود مصرح بها بعد إثبات التكامل.
- AI قد يقترح ويحضر ويتابع ضمن السلطة المصرح بها؛ لا يدّعي موافقة العميل أو الدفع أو التسليم ولا يتخذ جزاءات وظيفية.
- لا يُستبدل أمن Backend بإخفاء عنصر من الواجهة، ولا يُعرض إجراء مالي أو إنتاجي محمي إذا كانت الجهة المصدرية غير مؤهلة.

## 1. المصادر التي قُرئت ومستوى اليقين

### A. كتاب المطبعة الذاتية — مرجع إلزامي قبل تعديل أي UI

- المصدر: `fawakhry/TrendOs/autonomous-printshop/MASTER_BOOK.md` على الفرع `review/ap083-failclosed-ci-staging-gates-20261008`.
- تمت مراجعة ملف الكتاب كاملًا عند تأسيس هذا الإدخال: 7,317 سطرًا، من تعريف النجاح، ومتطلبات Operator Task V2 والخامات والتصميم والـ60 يوم، حتى AP-085.
- GitHub blob SHA وقت القراءة: `3b38ff447075da3433ab249b9588fe327d3409e0`.
- آخر توثيق متاح في الفرع: AP-085 وتأكيدات CI بتاريخ 2026-10-09. المرجع المعماري هنا قابل للتحديث وفق Runtime حديث؛ **لا يُدّعى أن كل وثائقه deployed أو أن أحواله الحالية لم تتغير**.
- لا يوجد ملف `autonomous-printshop/MASTER_BOOK.md` في `main` عند هذه المراجعة؛ لذلك الروابط إلى هذا الكتاب يجب أن تتضمن الفرع صراحة.
- [الكتاب المرجعي](https://github.com/fawakhry/TrendOs/blob/review/ap083-failclosed-ci-staging-gates-20261008/autonomous-printshop/MASTER_BOOK.md)
- [PR #36 — AP-084/AP-085 review](https://github.com/fawakhry/TrendOs/pull/36)؛ [PR #34 — AP-083](https://github.com/fawakhry/TrendOs/pull/34).
- متطلبات لوحة المالك المهمة: AP-069، AP-071، AP-073، AP-074، AP-076، AP-077، AP-078، AP-079، AP-080..085؛ appendix A ص. 452-761 ضمن نفس الملف.
- المرجع التفصيلي لجرد Manager Center: `autonomous-printshop/manifests/MANAGER_CENTER_MIGRATION_INVENTORY_V1.json` **على فرع المرجع**. لا تُنسخ حالة الجرد التاريخية كحقيقة Runtime حالية.

### B. ملفات الواجهة والبرامج التي قُرئت

- TrendOS: `index.html`, `app.js`, `styles.css`, `matbagy_theme_v1860.css`, `employee-manager-strips-v2.js`, `employee-andon-v1.js`, `customer-manager-v1.js`؛ مع التمييز بين `main` وفرع المراجعة.
- EasyStore: `fawakhry/EasyStore@main/index.html`, `app.js`, `styles.css`. يتضمن أدوار ضياء، جابر، وائل، رحمة/ريفان ومسارات منفصلة.
- Matbagy-OS: `fawakhry/Matbagy-OS@main/PROJECT_BOOK.md` و`runtime/README.md`؛ `AI_AUTHORITY=ADVISORY_ONLY` حيث لم يؤهل خلاف ذلك.
- Fokha: `fawakhry/Fokha@main/اقرأني_أولا.md` و`MEMORY/PROJECTS.md` و`MEMORY/SOURCE_LINKS.md`.
- `fawakhry/Matbagy@main/index.html`: إعداد شيتات الصور.
- `fawakhry/fiber-auto-max-ezcad@main/index.html`: حفر صورة الشخص/العين ومعايرة الماكينة؛ أداة مستقلة.
- `fawakhry/trendos-lead-hunter@main/index.html`: جمع الفرص والكلمات والمصادر.
- صور الهاتف التي قدّمها المالك في المحادثة: مدخل العميل، بوابة العميل، مركز إدارة Trend Mall، خدمة العملاء، إضافة أوردر وعميل، الطباعة، الليزر، الماركت بليس، الفرنشايز، الإعلانات، نوت مطبعجي، White Label، EasyStore (لوحة، موردين، مطبخ، مبيعات، مشتريات، تقفيل نهائي، عهدة، تصنيف قديم، تقارير، أقسام). **لا تُرفع الصور الأصلية التي قد تحتوي أسماء أو أرقام عملاء إلى GitHub.**
- النموذج المرئي التفاعلي المُعد في المحادثة = مرجع تصميم *غير منفّذ/غير منشور/غير متصل بالبيانات*. أي أرقام أو أسماء فيه توضيحية.

**قاعدة الإثبات:** `LIVE VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL > MOCKUP`. الصفر الحقيقي لا يُقبل إذا كانت الجهة المصدرية غير مكتملة أو stale أو مصدرًا تجريبيًا.

## 2. رؤية واجهة المنظومة

### المجالات الخمسة الأساسية

1. **Owner / Control Tower:** صحة التشغيل، التأخير، استثناءات المالك، المصادر/الأدلة، أوضاع التشغيل الذاتي، جاهزية المرشحين، أعطال الأنظمة؛ شاشة منفصلة محمية.
2. **Operations / TrendOS:** استقبال العميل والأوردر، قوائم الأقسام، التواصل، إثبات البروفة، الملفات والتسليم، «المهمة التالية» مستقبلًا.
3. **Finance / EasyStore:** حسابات الأقسام، مواد وأصناف، الموردون، العملاء، المشتريات، المبيعات، الفواتير النهائية، المخزون، المصروفات، العهد، الإقفال والتقارير؛ الأصل المالي يبقى في EasyStore.
4. **Customer + Commerce / Trend Mall:** كتالوج، طلب جديد، تصميم ذاتي، متابعة طلب، أقرب مزود معتمد، بائعون ومنتجات ومساحات، فروع وفرنشايز.
5. **Platform & Growth:** الإعلانات، نوت مطبعجي / معرفة Whats AI، White Label، صياد العملاء، المستخدمون، الصلاحيات، التكاملات، حالة النظام.

### بنية التنقل المقترحة

على الكمبيوتر: شريط علوي ثابت (بحث شامل مفوض + حالة المصادر + المستخدم + الإشعارات)، قائمة جانبية RTL في مجموعات، منطقة محتوى واحدة، ومسارات تفصيلية Breadcrumbs.

على الهاتف: الرئيسية/المهام، الأوردرات، التصميم/الإنتاج، الحسابات *فقط إن سمح الدور*، «المزيد». أقسام الإدارة المتخصصة تُفتح من «المزيد» بقائمة قابلة للبحث؛ لا شريط 13 تبويبًا ولا تمرير أفقي لمهام متكررة.

العميل يستقبل تنقلًا مستقلًا مناسبًا للتجارة. لوحة المالك ليست زرًا عامًا يكشف state لأي مستخدم؛ يدخل إليها المالك فقط بعد إثبات التحكم في الوصول.

### نظام التصميم

- عربي RTL أولًا مع عزل اتجاه حقول الأكواد والهواتف والأرقام التقنية عند الحاجة.
- هوية Trend Mall: أسود/كحلي في الـheader، أخضر تركواز كلون تشغيل أساسي، أزرق لإجراء صريح، أحمر للخطر، كهرماني للتحذير، وخلفيات فاتحة. لا نستخدم الألوان وحدها لبيان الحالة.
- الخط العربي واضح ومقروء، ومساحات الضغط مناسبة للموبايل؛ بطاقات موجزة وجداول متجاوبة؛ fallback نصي واضح.
- عناصر عامة: `AppShell`, `SectionNav`, `RoleAwareAction`, `SourceStatus`, `OrderCard`, `OwnerExceptionCard`, `AndonBlocker`, `ReadinessGate`, `InvoiceReview`, `StepForm`, `ConfirmProtectedAction`. هذه أسماء تصميمية، لا ادعاء وجودها ككود.
- تفصيل الأوردر في مساحة مخصصة، وبقية الأفعال تحت «المزيد»: بروفة، واتساب، محادثة، فاتورة، سجل، نسخ رسالة.
- لا Popup عائم مستمر يغطي الأزرار، خصوصًا نافذة المكبس أو مركز التشغيل؛ استبدالها بإشعار صغير قابل للفتح/الإغلاق.
- نماذج العميل/الأوردر/الفاتورة تكون مرحلية مع ملخص قبل الحفظ؛ لا نحذف الحقول التجارية المهمة لمجرد تبسيط الشكل.
- حالات UI موحدة: `LOADING`, `READY`, `EMPTY_QUALIFIED`, `SOURCE_INCOMPLETE`, `STALE_DIAGNOSTIC`, `UNAVAILABLE`, `ERROR`, `OFF`, `SHADOW`, `CANARY`, `GENERAL` وفق مصادر مؤهلة.

## 3. شاشات المطبعة الذاتية التي يجب حجز مكان لها منذ الآن

هذه ليست تعهدًا بتفعيل الوظائف، بل **عقود UI مستقبلية قابلة للإضافة** حتى لا نضطر إلى إعادة تصميم جذرية:

| الرمز | جزء الواجهة | البيانات/السلوك المطلوب | الوضع والسلطة |
|---|---|---|---|
| AP-UI-01 | Owner Exception Inbox | سبب، خطورة، مسؤول، AI state، هل قرار المالك مطلوب، next safe action، وقت المصدر | عرض محمي فقط؛ no unauthorized state |
| AP-UI-02 | Deadline Risk | `OVERDUE`, `AT_RISK_24H`, `WATCH_48H` حسب القسم، دون كشف raw IDs في التجميع | شواهد AP-073؛ تجميع لا تحكم بالأوردر |
| AP-UI-03 | Control Tower Health | تشغيل/قسم/موظف/عوائق/جاهزية/اتصالات/مالية/تعلم/أدلة، مع freshness مستقل لكل panel | read-only؛ `STALE` لا يعني LIVE |
| AP-UI-04 | «مهمتي الآن» | next physical task، آلة، موعد، ملفات، تعليمات، زر بدء/إنهاء مع إثبات | الجزء التنفيذي مُعطّل ما دام Operator Task OFF |
| AP-UI-05 | Andon / Blockers | ستة أسباب structured؛ مفتوح/معترف به/تم الحل؛ لكل عائق معرف وإجراء مستقل | مصدر Employee Supervisor المؤهل؛ retry/idempotency |
| AP-UI-06 | AI Customer Intake | رسالة العميل، اكتمال المقاسات/الكمية/الموعد/الملف، مسودة وتكرار | اقتراح/مسودة؛ لا ادعاء موافقة أو حقيقة مصطنعة |
| AP-UI-07 | Design Studio + Proof | نسخة الملف والـSHA/المرجع، شروط must_keep/must_avoid، proof، مصدر الموافقة | الموافقة البشرية/العميل مثبتة، لا synthetic approval |
| AP-UI-08 | Preflight | DPI، aspect، missing media، مقاسات، قص/استروك، جودة وختم الفحص | UNKNOWN/BLOCKED إذا الدليل ناقص |
| AP-UI-09 | Readiness Triple Gate | DESIGN + MATERIAL + MACHINE **للنفس order/line/artifact**، والتاريخ/المصدر | لا READY من جمع أخضر تجريبي أو cross-line |
| AP-UI-10 | Machines | هوية مؤكدة من nameplate، قدرات، صلاحية، observation وmaintenance | no invented machine identity |
| AP-UI-11 | Work Folders / Print Server | المستخدم يختار مجلد الشغل؛ فتح Explorer، ربط الملف الآمن؛ لا اختيار تلقائي خطِر | Windows helper اختياري؛ human start |
| AP-UI-12 | Material Ledger | issued = consumed + returned + reusable offcut + waste، مراجع الحركة وبند الأوردر | no double decrement؛ EasyStore financial authority |
| AP-UI-13 | QC / Rework | عينة/صورة الجودة، سبب العيب، إعادة الشغل، قرار التسليم | التسليم النهائي ليس AI assertion |
| AP-UI-14 | Comms | منتظر رد، تصعيد مدير، Inbox وتشغيل WhatsApp مع مراقبة الموافقات | read-only aggregate؛ لا نقل سلطة الإرسال |
| AP-UI-15 | Finance Warnings | تحذير مديونية، مورد، اعتماد فواتير، تقفيل اليوم، اكتمال المصدر | لا تصفية مديونية أو صرف أو تقفيل من Control Tower |
| AP-UI-16 | Employee Intelligence | توفر وحضور بشري، جودة وعوائق/coaching، لا عقوبة آلية | لا قرار فصل/خصم/جزاء تلقائي |
| AP-UI-17 | Autonomy & Evidence Inspector | mode/epoch، strictEligible، blockers، evidence source/age، why OFF، Canary qualification | read-only، لا زر «فعّل» قبل تصريح صريح |
| AP-UI-18 | Action/Audit Trail | حقائق المصدر، قرار policy، actor، correlation ID، idempotency، rollback/evidence ref | تفويض وخصوصية؛ عدم نسخ PII في الملخص |
| AP-UI-19 | AI Designer Product Recipes | Mug 20×9، 7×10 Senior، collage، دعوات، ليزر vector، version lineage | لا template من تصميم مرفوض |
| AP-UI-20 | Procurement Suggestions | نقص الخامات، حدود إعادة الطلب، المورد والاقتراح والتصعيد | اقتراح فقط إذا authority غير مؤهل |

**ملاحظة أساسية:** المشروع يستهدف في النهاية `OWNER_ROUTINE_TOUCHES_PER_DAY=0` و`EMPLOYEE_NORMAL_JOB_SELECTION=0`، لكنها **أهداف نجاح** وليست تصاريح تفعيل أو أرقامًا منجزة.

## 4. حواجز السلامة الملزمة لأي تصميم أو تنفيذ

### 4.1 لوحة المالك — Security P0

- AP-084/AP-085 يوثّقان اختبار قراءة غير مصادق عليها لـ `workers.dev/state` في 2026-10-08، ولم يُثبت علاج الإنتاج في آخر تقرير.
- `OWNER_CONSOLE_ACCESS_GATE=FAILED` في آخر وثيقة تمت مراجعتها؛ أحدث Runtime مستقل مطلوب قبل أي قول بأنه أُغلق.
- قبل عرض بيانات الحالة الخاصة على UI: توثيق Cloudflare Access / auth للمسارات `/`، `/dashboard`، `/owner`، `/manager-center`، `/state`، `/api/state` وعلى كل origins بما فيها `workers.dev`.
- اختبارات منفصلة: anonymous denial؛ owner-auth success؛ non-owner denial؛ لا تخريب للتحقق الصحي أو التراجع عند الخطأ. لا طلب كلمات مرور/مفاتيح خام في المحادثات أو المستودع.
- تغييرات الأمان الإنتاجية تحتاج موافقة المالك وإجراءً منفصلًا؛ لا تُنفذ ضمن تجميل CSS.

### 4.2 المصداقية / تقادم البيانات

- لكل panel مصدر وتوقيت آخر قراءة وعمر snapshot وavailability/partial failure؛ صحة snapshot لا تساوي اكتمال مصدر التمويل.
- `SOURCE_INCOMPLETE / UNKNOWN_SOURCE_COMPLETENESS` تظهر غير متاح أو قيد التحقق، **لا صفر نظيف**.
- `STALE_DIAGNOSTIC` محدود العمر هو مؤشر تشخيصي فقط، وليس إذنًا لإظهار قرار محمي/finance READY.
- لا نقل إلى «جاهز للإنتاج» اعتمادًا على بيانات mock أو كاش أو عدم وجود صفوف. `CANARY` التجريبي معزول عن أرقام العملاء والإنتاج.
- AP-083 shared cache (KV-like) مقابل Durable Object = قرار مؤجل؛ لا إنشاء namespace/binding أو تكلفة بقرار UI.

### 4.3 القرارات المحمية

- كل حساب/فاتورة/تحصيل/مديونية/تقفيل/عهدة داخل EasyStore فقط وفي الصلاحيات التي يحددها backend.
- لا Owner-console debt restriction write، ولا financial day-close mutation.
- لا نشر بروفة، إرسال واتساب، تعديل حالة حساسة، Restore archive، assignment أو machine actuation من widget جديد دون endpoint موثق+مصرح+مؤهل.
- الموظف يرى action/buttons المسموح بها فقط، لكن **التحقق الحقيقي في السيرفر**.
- لكل تعديل: authorization، audit، idempotency أو confirmation، rollback، واختبار تحديث/إعادة إرسال/فشل اتصال.

### 4.4 الأولوية العملية والسلامة التشغيلية

- الـAutonomy `SHADOW`، Readiness `SHADOW`، Operator Task `OFF`، Accounting `READONLY epoch39` حسب آخر **توثيق** AP-085، وليس قياسًا جديدًا.
- أول Order CANARY فعلي يحتاج إثبات DESIGN + MATERIAL + MACHINE على نفس السطر، موافقة بشرية/عميل، مؤهل تشغيل، وموافقة مالك صريحة.
- خطط الـ60 يوم ليست مواعيد ضمان أو مبررًا لقفز بوابة تحقق.

## 5. ما لاحظناه من الصور الفعلية — UX debt

1. قائمة TrendOS على الموبايل تجمع روابط كثيرة وأزرارًا متشابهة، ومركز الإدارة يكدس نماذج ضخمة في صفحة واحدة.
2. نافذة متابعة المكبس ومركز التشغيل تظل فوق المدخلات وأزرار الحفظ؛ نستبدلها بمركز تنبيه غير حاجب.
3. بطاقات الأوردر تكرر ستة أزرار ثابتة وزر حفظ، ما ينتج تمريرًا طويلًا ومخاطر نقر خاطئ.
4. نموذج إضافة أوردر/عميل طويل؛ يحتاج خطوات قصيرة وتثبيت ملخص المراجعة.
5. بوابة العميل نصية وبها أماكن كتالوج غير مكتملة؛ تحتاج كروت مرئية وأزرار أساسية قليلة.
6. EasyStore يستخدم شريط تبويبات أفقي متعدد الصفحات على الموبايل وملخصات مالية قد تكون غير مكتملة المصدر.
7. إضافات الإدارة: Marketplace، Franchise، White Label، Ads Studio، Knowledge WhatsAI، Supplier/Client، تحتاج صفحات منفصلة.
8. لا نحول «المكبس» إلى قسم جديد؛ يبقى مسار/خاصية داخل الطباعة حسب المصدر الحالي.

## 6. استراتيجية التنفيذ: جزء يشتغل ويتثبت

### تعريف كلمة «يتثبت»

لا يُكتب `FIXED/LOCKED` إلا بعد:
- عقد UX مكتوب للشاشة: user journey، قواعد الصلاحية، الحالات، مصدر البيانات ومالك كل endpoint.
- تجربة الموبايل الحقيقي والكمبيوتر، RTL، قابلية النقر، keyboard/focus/contrast حيث يلزم.
- اختبار وظيفي على Backend مؤهل وبأوردر اختبار مصرح به، لا بيانات غير معروفة ولا mock كدليل.
- اختبار دور مسموح ودور ممنوع + source error/empty/stale + duplicate submit + اتصال ضعيف.
- قبل وبعد: صور ذات بيانات منقحة، CI ذو SHA مطابق، رابط staging/deploy مثبت إن حصل، عدم انكسار بقية الأقسام.
- Rollback معروف وتراجع سليم ومراقبة أول استخدام.
- رصد مشاكل مفتوحة وقرار واضح: `PASS / PARTIAL / FAIL / BLOCKED`. إذا PARTIAL لا ادعاء اكتمال.
- مراجعة/موافقة المالك لكل نشر إنتاجي ذي أثر، وتوثيق ما تم **فعلًا**.

**معنى تثبيت الجزء:** نمنع التغييرات العرضية عليه في المراحل التالية باختبارات regression، مع إمكانية hotfix محكوم. ليس وعدًا بعدم إصلاح عيب حقيقي.

### ترتيب المراحل المقترح

| UI Gate | الجزء | مخرجاته | شرط القفل |
|---|---|---|---|
| UI-00 | الأمن + خط الأساس | جرد الإصدارات الحية والأدوار والأصول، خطة الباك أب والرجوع، اختبار خصوصية لوحة المالك | لا تسريب owner؛ لا كتابة |
| UI-01 | Design System + App Shell | RTL، هوية، navigation responsive، بطاقات وحالات SourceStatus، feature flags | اختبار تنقل وصلاحيات + عدم كسر النسخة الحية |
| UI-02 | خدمة العملاء والأوردرات | بحث وفلاتر، بطاقات مختصرة، تفاصيل، إضافة أوردر مرحلية، واتساب/بروفة | مسار الأوردر الحالي سليم بلا ازدواج أو فقد بيانات |
| UI-03 | موظف الإنتاج | صف الطباعة والليزر، تمييز المكبس، مهام اليوم وAndon من مصدره | roles مثبتة وAndon idempotent؛ لا fake task assignment |
| UI-04 | التصميم والملفات | مكتبة الأدوات، القوالب، الإصدارات، إثبات البروفة، Preflight informational | لا موافقة مصطنعة ولا READY بلا evidence |
| UI-05 | EasyStore Finance UI | شاشات المورد/العميل/الفواتير/الخامات/التقفيل والعهد للموظف المناسب | finance regression والصلاحيات والمصدر مكتمل حسب الحالة |
| UI-06 | بوابة العميل | كتالوج، خدمة/ملف/كمية، طلب، متابعة، مطبعة/فرع، Designer | حفظ الطلب وتتبعه والخصوصية دون تغيير مصدر الحقيقة |
| UI-07 | التجارة والتوسع | Marketplace، Franchise، White Label، Ads، Knowledge، Lead Hunter | tenant/branch isolation واختبارات المسموح والممنوع |
| UI-08 | Owner Read-only Experience | مصدر لوحة المالك المحمي، Exceptions، Deadline، Finance/Comms، stale panels | Access gate مُثبت + fail-closed + no private data for anonymous |
| UI-09 | Readiness / Operator / QC Future UI | بوابات evidence، task queue، machine readiness، material ledger، QC | عرض فقط أولًا؛ أي CANARY لاحقًا مشروع موافقة منفصل |
| UI-10 | إخراج وإطلاق موحد | اختبار رحلات الأطراف، الأداء، حالات الفشل، وثيقة تسليم وتدريب | سجل إثبات لكل جزء، freeze/regression مستمر |

**التوازي المسموح:** رسم/تصميم مرئي للمالك يمكن قبل UI-00؛ **لكن** عرض بيانات Owner Console الخاصة أو نشر وحدة متصلة يتوقف على أمن UI-00. وباقي المراحل يُعدل ترتيبها فقط عبر إدخال قرار موثق لا يتجاوز حواجز الأمن.

### قواعد GitHub والإصدارات

- كل Gate على branch واضح وPR قابل للمراجعة؛ لا تعديلات مباشرة على `main` الإنتاجي من جلسة التصميم.
- تغيير feature واحد مع قائمة ملفات دقيقة وبقاء بقية البنايات hash-stable إن أمكن.
- الاختبار على بيئة غير إنتاجية معزولة، ولا نفترض وجود Staging لمجرد وجود اسم/سطر إعداد.
- لا Merge ولا نشر ولا Cloudflare Access أو دفع تكلفة دون تحقق gate وصلاحية وموافقة مناسبة.
- استخدام progressive/feature flags مع safe fallback، وعدم حذف الواجهة القديمة إلا بعد نجاح cutover ورجوع مؤهل.
- توثيق change id، base SHA، PR، target SHA، اختبار CI، smoke، حالة تشغيل فعلية، rollback hash.
- عند ارتباط خطوة بـAutonomous Printshop يُضاف **رابط مرجعي** إلى AP book؛ لا نكتب AP entries هنا أو ننقل تفاصيله إلى TrendOS_MASTER_BOOK.

## 7. قالب شرح كل جزء أثناء التركيب — إلزامي

يُنسخ السجل التالي مع كل خطوة ويملأ من evidence حقيقي:

### UI-XXX — اسم الشاشة أو الوحدة
- **التاريخ:**
- **الحالة:** `PLANNED | SOURCE_ONLY | STAGING_QUALIFIED | CANARY | LIVE_VERIFIED | FIXED | PARTIAL | BLOCKED | ROLLED_BACK`
- **الهدف والمشكلة الحالية:**
- **الواجهة الحالية:** المسار/الشاشة/السلوك + baseline screenshot منقحة.
- **التصميم الجديد:** user journey + موبايل + كمبيوتر + RTL + responsiveness.
- **الدور والصلاحيات:** من يرى ومن يعدل + Backend permission contract.
- **مصدر الحقيقة:** repo/branch/file + endpoint/data contract + feature flags.
- **مسارات الخطأ:** loading, error, permission denied, empty qualified, stale, source incomplete, offline.
- **الملفات التي تغيرت:** path + SHA قبل/بعد.
- **الإجراء المسموح/المحمي:** read-only vs mutation، حدود AI.
- **التجارب:** Unit / integration / e2e mobile / regression + CI run.
- **Staging evidence:** رابط ورقم إصدار وحالة Access إن وجدت.
- **Production evidence:** version + exact smoke + timestamp إن أُجيز النشر.
- **Rollback:** ما الذي سيُعاد وكيف تم التحقق.
- **النتيجة:** PASS/PARTIAL/FAIL/BLOCKED مع أسباب.
- **قرار التثبيت:** من وافق، ما الذي تجمّد، وما الاختبارات التي تحميه.
- **الاعتمادات المعلقة:** AP/EasyStore/TrendOS dependencies وروابطها.
- **الخطوة التالية:** gate واحد واضح، لا تنفيذ خلفي تلقائي.

## 8. فهرس متابعة التثبيت

| الإدخال | النطاق | الوضع الحالي | GitHub Evidence |
|---|---|---|---|
| UI-000 | الكتاب والخريطة المقترحة | DOCUMENTATION_ONLY | يُملأ برابط commit/PR لهذا الكتاب |
| UI-00 | الأمن وخط الأساس | BLOCKED_BY_OWNER_CONSOLE_ACCESS_GATE_FOR_PRIVATE_VIEW | [AP-085](https://github.com/fawakhry/TrendOs/blob/review/ap083-failclosed-ci-staging-gates-20261008/autonomous-printshop/MASTER_BOOK.md) |
| UI-01 | أدوات الموظف على الموبايل — أول جزء من App Shell | SOURCE_ONLY / UI CONTRACT CI PASS / NOT FIXED | [PR #38](https://github.com/fawakhry/TrendOs/pull/38) |
| UI-02..UI-10 | بقية واجهات المنصة | PLANNED / NOT STARTED | غير موجود؛ لا يُختلق |

**قاعدة التحديث:** كل إدخال جديد يُضاف بالتاريخ مع إثبات SHA/CI ولا يغيّر حقائق قديمة دون إيضاح من صححها ومصدره. أول مرحلة تنفيذ لا تبدأ إلا بعد baseline واستهداف جزء محدد.

## 9. المعايير النهائية للقبول

- رحلة العميل: إنشاء طلب / ملف / مراجعة / موافقة / متابعة / تسليم مفهومة؛ عدم توليد بيانات وهمية.
- رحلة الموظف: يرى أوردراته ومهامه المسموحة، تعليمات الجهاز، Andon وملفات الشغل دون زحام أزرار.
- رحلة المالية: الحسابات منفصلة حسب الدور، لا double-post ولا double-decrement، الإيراد والربح من مصادر مكتملة، تقفيل محمي.
- رحلة المالك: «هل المطبعة سليمة؟ ما الخطر؟ هل هناك قرار لي؟» خلال ثوانٍ، مع غياب أي Owner state عام أو stale-as-live.
- سلوك تفاعلي حقيقي: عناوين واضحة، أقل إجراءات متكررة، بحث متسامح، حفظ مع feedback، فشل network لا يخدع المستخدم.
- الأداء وقابلية الاستخدام: موبايل 360px أولًا + تابلت + Desktop، RTL سليم، أعطال/empty states مصممة، لا نوافذ تغطي أزرار مهمة.
- الاستدامة: كل جزء مثبت بمواصفة وRegression ولا يحتاج إعادة هيكلة لإضافة Operator Task أو QC أو Material Evidence مستقبلًا.

## 10. UI-000 — قرار التأسيس 2026-10-09

1. قرأنا كتاب المطبعة الذاتية `autonomous-printshop/MASTER_BOOK.md` قبل اعتماد الخريطة، وأخذنا متطلبات Next Task، Proof/Preflight، Readiness same-line، Material Ledger، QC، Andon، Owner Exceptions، Comms/Finance read-only وstale semantics.
2. استلمنا صور الواجهة الحالية من المالك، وخططنا لإعادة تنظيمها ضمن وحدات واضحة بدل الصفحات الطويلة والنوافذ العائمة.
3. أُقر مبدأ **«جزء جزء، واللي يشتغل يتثبت»** كقاعدة واجبة في كل مرحلة.
4. هذا الإدخال **توثيق فقط على فرع مراجعة**؛ لا UI deploy، لا تغيير بيانات، لا تحديث EasyStore، لا Operator Task activation، لا تعديل Cloudflare Access أو متطلبات مالية.
5. **أول إجراء تالٍ:** جرد/تأكيد الحالة الحية وتحقق خاص من أمن لوحة المالك، ثم توثيق baseline UI-00؛ اختيار أول وحدة بسيطة مستقلة من UI-01 للتنفيذ بعد الاتفاق على المدى والاختبارات.
6. يُضاف commit/PR لهذا الكتاب هنا بعد التأكد من كتابته على GitHub.

— نهاية تأسيس الكتاب؛ الإدخالات التالية يجب أن تسجل ما تم تنفيذه واختباره وتثبيته فعلًا.

## 11. UI-001 — أول تنفيذ كود: تجميع أزرار الموظف على الموبايل — 2026-10-09

- **الحالة:** `SOURCE_ONLY / NODE_CONTRACT_CI_PASS / STAGING_NOT_VERIFIED / NOT_FIXED`.
- **طلب المالك:** البدء جزءًا جزءًا، وأن يُثبت كل جزء بعد عمله واختباره. كتاب TrendOS هو الدليل على الكود المصدر، وليس مصدرًا ثانيًا للواجهة.
- **المرجع التقني:** `TrendOS_MASTER_BOOK.md` على `candidate/t12-full-cloud-cutover-a56-20260929`؛ قرئ كتابه الكامل (6,758 سطرًا) قبل أول تعديل، بما فيه تعليمات §0، خريطة الكود §12، السجل حتى Entry648 والـT12 guard الأخير.
- **PR كود مستقل:** [#38 — UI-01](https://github.com/fawakhry/TrendOs/pull/38) — Draft، يقترح الدمج في `candidate/t12-full-cloud-cutover-a56-20260929` فقط بعد بوابات تحقق.
- **الفرع:** `review/ui01-mobile-top-actions-20261009`، انطلق من `7d20cfc463ce084ceaba8ac440dffa53512fe662`. لا تعديل لفرع candidate أو main مباشرة.
- **الحد الوظيفي:** زر `☰ قائمة الأدوات` في مساحة `#mainView .top-actions` عند عرض هاتف حتى 720px، يفتح/يغلق كل أزرار الموظف القائمة أصلًا. لا حذف ولا نقل DOM ولا تغيير handler أو API أو server permissions. على الكمبيوتر (721px فأعلى) يبقى شريط الأدوات الأصلي. لا تغيير شاشة Login أو Customer Portal.
- **الملفات:** `trendos-ui01-mobile-tools.js`؛ `trendos-ui01-mobile-tools.css`؛ رابطا CSS/JS إضافيان في `index.html`؛ `tests/trendos_ui01_mobile_tools.test.mjs`؛ `.github/workflows/trendos-ui01-mobile-tools-ci.yml`.
- **حالات الاختبار:** عدم تكرار mount؛ الحفاظ على كائنات الأزرار الأصلية وكلاسات `hidden`؛ فتح وإغلاق `aria-expanded`؛ زر Escape والتركيز؛ غلق عند Desktop / Logout؛ استمرار handler؛ تأخير تشغيل الكود حتى `DOMContentLoaded`؛ عدم استخدام `fetch` أو تخزين محلي أو تغيير HTML ديناميكي.
- **GitHub UI CI:** [Run 37971599789](https://github.com/fawakhry/TrendOs/actions/runs/37971599789) **SUCCESS** على commit `45df16e9467fd972cbc682b53795d5bd62f49269`. كذلك [Run 37971570913](https://github.com/fawakhry/TrendOs/actions/runs/37971570913) SUCCESS.
- **GitHub A61 browser Cloud transport regression:** run `37971599713` **SUCCESS** في مراجعة checks على نفس SHA.
- **تحذير:** Cloudflare Workers Builds على SHA ذاته أظهر `trendos` و`trendos-tasks-v3-t1-preview-20260914` **FAILURE**. مصدر الخطأ لم يُشخص بعد، ولا يجوز تسميته إصلاحًا ناجحًا أو تجاهله عند قرار النشر. لا دليل على أنه ناتج عن كود UI-01 أو مستقل عنه حتى تحقيق build logs.
- **غير المؤهل بعد:** تجربة متصفح هاتف على نسخة TrendOS كاملة ببيانات منقحة وجلسات موظفين حقيقية مخولة؛ اختبار staging معزول؛ إثبات cloud build؛ موافقة نشر وpostdeploy smoke؛ لم يُسجل أي Live deployment.
- **قاعدة التثبيت:** ممنوع تحويل UI-001 إلى `FIXED` حتى انغلاق كل بوابات الأمن والـbuild والنشر والتحقق من أن كل دور ما زال يصل إلى وظائفه. `UI-00` أمن لوحة المالك مطلوب قبل توصيل Owner Console (موضوع مستقل عن هذا الجزء).
- **الرجوع:** حذف استيراد ملف CSS وJS من `index.html` (أو revert PR إذا لم يُدمج) يُعيد شريط أدوات الموظف الحالي كما كان؛ لا تغيير بيانات / migrations / sessions / المالية.
- **الخطوة التالية:** Diagnose Cloudflare build failure، Browser mobile/desktop role smoke على بيئة معزولة، ثم قرار اعتماد النشر. الاحتفاظ بالفرع Draft إلى ذلك الحين.

