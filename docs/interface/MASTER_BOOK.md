# Trend Mall / TrendOS — الكتاب الرئيسي للواجهة وتجربة الاستخدام

> **نوع الوثيقة:** UI/UX implementation book — تصميم وتنفيذ تدريجي وتثبيت الشاشات.
> **المستودع:** `fawakhry/TrendOs`
> **المسار الرسمي:** `docs/interface/MASTER_BOOK.md`
> **بدء الكتاب:** 2026-10-09
> **أول إدخال:** UI-000 — قراءة المطبعة الذاتية وتجميع مراجع الواجهة.
> **الحالة المحدثة في 2026-10-25:** UI-001 EXISTING EMPLOYEE BUTTON REORDER / CLOUDFLARE LIVE VERIFIED (100%) / 45 OTHER ASSETS BYTE-IDENTICAL / AUTHENTICATED STAFF ROLE SMOKE NOT PERFORMED. الكتاب موجود في `main` بعد دمج PR #37؛ باقي الواجهة مشروع تدريجي منفصل.
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
| UI-001 | ترتيب أزرار الموظف الحالية فقط (ليس إعادة تصميم App Shell) | **CLOUDFLARE LIVE VERIFIED** / 45 unrelated assets preserved / staff-role smoke pending | [PR #262](https://github.com/fawakhry/TrendOs/pull/262) + [PR #270](https://github.com/fawakhry/TrendOs/pull/270) + [release](https://github.com/fawakhry/TrendOs/actions/runs/40220150159) |
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
- **تحقق نهائي من فرع الكود:** آخر HEAD موثق هنا `d12911ac0a19db51d877e2864c2c18970981e406` بعد تسجيل المرجع في `TrendOS_MASTER_BOOK.md`. UI CI [37971850357](https://github.com/fawakhry/TrendOs/actions/runs/37971850357) وA61 regression [37971850317](https://github.com/fawakhry/TrendOs/actions/runs/37971850317) كلاهما **SUCCESS**. لا يزال Workers Builds لـ `trendos` و `trendos-tasks-v3-t1-preview-20260914` **FAILURE** على نفس HEAD، ولم يتأكد نشر Staging أو Production. تبقى الحالة NOT_FIXED.
- **تمييز السبب:** فحص GitHub check-runs للـbase commit `7d20cfc463ce084ceaba8ac440dffa53512fe662` نفسه أظهر فشل نفس خدمتي Cloudflare Workers Builds قبل UI-01؛ إذن هناك فشل سابق موثّق، ولا دليل حتى الآن أن تعديل الواجهة هو سبب الفشل أو أنه عالجه. يلزم الاطلاع على build logs وإثبات نجاح مسار نشر TrendOS المقصود قبل تثبيت الجزء.



### UI-001-BROWSER — تثبيت جودة التصميم على مستوى الكود والمتصفح، دون نشر (2026-10-09)

- **النتيجة:** `SOURCE_CI_PASS + ISOLATED_CHROMIUM_PASS + STAGING_NOT_TESTED + PRODUCTION_NOT_DEPLOYED`. **لا يُرفع الوسم إلى FIXED أو LIVE**.
- **عيب UX اكتُشف أثناء الاختبار:** `matbagy_theme_v1860.css` يفرض `.top-actions {grid-template-columns:1fr!important}` عند عرض <=980px. أول نسخة من UI-001 استخدمت عمودين دون `!important`، فرسم Chromium القائمة في عمود واحد رغم اجتياز اختبارات JavaScript.
- **الإصلاح الدقيق:** `trendos-ui01-mobile-tools.css` أضاف `!important` إلى `grid-template-columns: repeat(2,minmax(0,1fr))` داخل القاعدة الأكثر تحديدًا `#mainView .top-actions.tm-ui01-mobile-tools` عند <=720px فقط. لا يتغير تنقل العميل أو الكمبيوتر، ولا المنطق أو البيانات.
- **اختبارات عدم العودة:** `tests/trendos_ui01_mobile_tools.test.mjs` يفحص أولوية CSS؛ `tests/trendos_ui01_mobile_tools_browser_smoke.py` يفحص Chromium الفعلي بالمقاسات `360,390,690,720,721,1280` مع محاكاة قاعدة الثيم المتعارضة، إخفاء أدوات الدور، بقاء handler، Escape، إغلاق عند الخروج، وسلامة العرض دون overflow.
- **اختبار محلي:** Chromium HEADLESS على Fixture لا يتصل بـ API/جلسات موظفين؛ الست مقاسات PASS مع grid ثنائي الأعمدة على المحمول، واحتفاظ الكمبيوتر بالواجهة القديمة. هذه ليست شهادة موبايل حي ولا اختبار مستخدم حقيقي.
- **GitHub Actions:** [UI-01 Browser+Node run 37973360327](https://github.com/fawakhry/TrendOs/actions/runs/37973360327) = SUCCESS بكل الوظائف بما فيها `ui01-responsive-chromium`. [A61 transport regression 37973360156](https://github.com/fawakhry/TrendOs/actions/runs/37973360156) = SUCCESS، على source head `3bf3135ee131541c20b9ab311e7071bf601f8a0f`.
- **Cloudflare:** Worker Builds `trendos` و`trendos-tasks-v3-t1-preview-20260914` ما زالا FAILURE. كلا الاختبارين كان FAILURE حتى على source-base `7d20cfc463ce084ceaba8ac440dffa53512fe662` قبل كود UI-001؛ لذلك هما فشل سابق لا يصلح اتهام UI-001 بأنه سببه، **لكنّ سبب الفشل غير معروف من check summary وحده**. يلزم Cloudflare build logs + إثبات مسار نشر واجهة `trendos-ui` المقصودة.
- **Security/Production gate:** PR [#38](https://github.com/fawakhry/TrendOs/pull/38) يظل Draft على فرع المراجعة؛ لم يُدمج ولم يُنشر. Owner Console AP-085 لا تتغير. لا ترقية لمرحلة LIVE أو NEXT UI slice بدون انتهاء smoke مصرح به على staging والقرار المناسب.
- **خطوة المتابعة:** فحص Cloudflare logs/read-only وواجهة الموظف على staging مُعزول؛ التحقق من الدور ومن عدم كسر الجلسة/الزر؛ ثم تقرير مراجعة النشر والرجوع.


### UI-001-FINAL-CODE-REVIEW — QA / logout layout / 2026-10-09

- **تحسين تجربة الهاتف:** بعد تصحيح أعمدة الأدوات، صار زر **خروج** يشغل صفًا بعرض عمودين في نهاية القائمة، لتقليل النقر بالخطأ وتحسين الهرمية البصرية. القاعدة محصورة في `#logoutBtn` عند فتح قائمة أدوات الموظف بالموبايل فقط.
- **منع الانحدار:** `tests/trendos_ui01_mobile_tools_browser_smoke.py` يتحقق أن عرض زر الخروج >= 1.8 من عرض زر عادي عند 360/390/690/720px، وأن دوره والموبايل لا يؤثران على أجهزة 721/1280px.
- **المصدر بعد الاختبار:** `review/ui01-mobile-top-actions-20261009` commit `8b61cc45d9f6b774922b23709e16d03e60b5a486` هو source tested head وقت السجل. [UI-01 GitHub Actions 37973776782](https://github.com/fawakhry/TrendOs/actions/runs/37973776782) = **SUCCESS**: `ui01-mobile-tools` و `ui01-responsive-chromium`. [A61 regression 37973776723](https://github.com/fawakhry/TrendOs/actions/runs/37973776723) = **SUCCESS**.
- **باقي الفشل:** Cloudflare Workers Builds اثنان = FAILURE على head نفسه كما حدث قبل تعديل UI-01؛ التفاصيل تحتاج Build Logs. يمنع ذلك اعتماد نشر جديد دون فحص مستقل لمسار نشر `trendos-ui`.
- **قرار المرحلة:** `CODE_BROWSER_CI_PASS / DRAFT_PR_38 / NOT_DEPLOYED / NOT_FIXED`. كتابة `FIXED` لا تتم إلا بعد اعتماد staging/employee-role smoke ثم نشر مراقب مع rollback.


### UI-001-CFBUILD-ROOTCAUSE — تشخيص Build Logs المرسل من المالك بتاريخ 2026-10-25

**بيان مصدر الدليل:** سجل Cloudflare الذي أرسله المالك يبدأ `2026-10-09T18:27:04Z` وينتهي بفشل `2026-10-09T18:27:17Z`. هو سجل تاريخي مُقدّم يوم 2026-10-25، وليس قراءة لحالة Cloudflare الحية بتاريخ 2026-10-25.

**نص الخطأ الحاسم:**
- Cloudflare ينفذ `npx wrangler versions upload` من Working Directory لم يُثبت فيه entry point أو assets directory.
- Wrangler 4.149.0: `Missing entry-point to Worker script or to assets directory`.
- نجح clone/initialize؛ الفشل يقع **قبل** Bundle/Upload وليس فشلًا لاختبارات UI-001 أو مشكلة D1. ليس في السجل ما يثبت أن أي إصدار رفع أو أن حركة Production تغيرت.

**سبب فشل الإعداد مؤكد ضمن الحدود التالية:**
- Repo root لا يحتوي `wrangler.toml` ولا `wrangler.jsonc` ولا `package.json` يحدد Worker entry لاسم الخدمة المشمولة في Build. GitHub tree على فرع candidate يثبت configs متخصصة داخل `cloudflare-d1/`.
- مصدر Truth للواجهة: `cloudflare-d1/wrangler.frontend.toml` يحدد `name = "trendos-ui"` و `main = "src/frontend-static-worker.mjs"` و `assets.directory = "./frontend-dist"` (المسارات نسبة لمجلد الإعداد).
- `cloudflare-d1/frontend-dist` **لا يوجد جاهزًا في git tree**، بل يُولَّد أثناء Packaging بالنسخ الانتقائي للملفات `*.html,*.js,*.css` من root، كما تفعل `.github/workflows/trendos-entry579-frontend-create-version-only.yml` و`trendos-entry604-login-fast-production.yml`.
- مصدر Truth للـAPI منفصل: `cloudflare-d1/wrangler.toml` يحدد `name = "trendos-d1-api"` و `main = "production-shadow/index.js"` مع D1 binding إنتاجي.
- اسما Cloudflare Builds اللذان ظهرا في GitHub checks: `trendos` و `trendos-tasks-v3-t1-preview-20260914`؛ لا يتطابق أي منهما مع `trendos-ui` أو `trendos-d1-api` في configs المعتمدة. **لا يجوز تبديل اسم API في إعداد الواجهة أو تشغيل `wrangler deploy` لحل مجرد فحص**.

**قرار العمل الآمن:** `BUILD_CONFIGURATION_ROOT_CAUSE_IDENTIFIED / CORRECTION_NOT_APPLIED / NO_DEPLOY`.
1. قراءة إعدادات **Settings → Build** للخدمتين الفاشلتين: Connected repository + Git branch + Root directory + Build command + Deploy command + هل هذه الخدمة مقصود أن تأخذ Builds من TrendOs أساسًا.
2. لو اتضح أن Git Builds غير مطلوبة لهاتين الخدمتين، يصير **قطع Git Builds عنهما أو حصره بالمسار المقصود** قرارًا تشغيليًا مستقلًا؛ لا نفصلهما عشوائيًا. ينص [دليل Cloudflare الرسمي](https://developers.cloudflare.com/workers/ci-cd/builds/) على `Settings → Builds → Disconnect` إن اختير هذا المسار.
3. لو الخدمة مقصودة، يثبت أولًا **Target Worker name** ثم مصدر entry/config الصحيح مع build/package step؛ Cloudflare يسمح بضبط Root directory وDeploy command داخل Build settings. يجب أن تكون خطوة التحقق **preview/no traffic** لا نشر إنتاجي.
4. `versions upload` يحفظ version دون promotion عند إعداد صحيح؛ لا يعني ذلك أن `deploy` آمن أو مسموح.
5. Cloudflare Settings تغيير خارجي لا يمكن توثيق تنفيذه من GitHub وحده؛ حتى يُجرب فعليًا يظل `BLOCKED`. واجهة UI-001 تحت PR #38 Draft حتى staging browser/role smoke وما يلزمه من موافقة.
6. لا يُضاف root `wrangler.toml` لتسكين الـchecks: المستودع متعدد الخدمات، والتكوين الخاطئ قد يربط frontend بـD1 أو خدمة أخرى.

**الخلاصة:** العمل المطلوب الآن ضبط Build Integration للخدمة الصحيحة في Cloudflare بموافقة المالك، **وليس إصلاح كود تصميم**. لم يُدمج PR #38 ولم يُنشر؛ UI-specific Node/Chromium/A61 checks نجحت بالفعل لكن Workers Builds failures منفصلة.


### UI-001 Cloudflare Build Settings — Owner screenshot — 2026-10-25

- **Evidence marker:** `CLOUDFLARE_BUILD_SETTINGS_SCREENSHOT_20261025`. صورة من Cloudflare لـ **Workers & Pages → trendos → Production → Settings → Builds**، أرسلها المالك. الصورة توضح Git repository `fawakhry/TrendOs`, production branch `main`, root directory `/`, build command `None`, deploy command `cd cloudflare-d1 && npx wrangler deploy`, و`Disable builds` = OFF. لا بيانات دخول أو مفاتيح في الصورة.
- **Important distinction:** سجل البناء الفاشل يوم 2026-10-09 كان يشغل `npx wrangler versions upload` بلا config؛ صورة 2026-10-25 تعرض **إعدادًا مختلفًا** ولا تثبت متى أو مَن غيّره أو نجاح Build بعد ذلك.
- **GitHub main risk verified:** `cloudflare-d1/wrangler.toml` على `main` يحتوي `name = "trendos-d1-api"`, `main = "src/index_v2.js"`, وD1 `DB` المرتبطة بـ`trendos-main`. لذلك deploy command الظاهر على خدمة Cloudflare المسماة `trendos` يستطيع استهداف `trendos-d1-api` من `main`، وليس `trendos-ui`. هذا **خطر نشر API غير مقصود**؛ ليس علاجًا لفشل UI-001 ولا دليلًا على وقوعه.
- **Owner recommendation, NOT EXECUTED:** تفعيل `Disable builds` لخدمة `trendos` وحدها وحفظ الإعداد إذا ظهر Save؛ بدون Disconnect أو تغيير Deploy Command أو إيقاف الإنتاج، لحين توثيق ملكية كل Git Build / Worker والـproduction path. هذه توصية احترازية، لا يُدعى تنفيذها إلا بعد إثبات من Cloudflare.
- **State:** `ROOT_CAUSE_LOG_REVIEWED / SETTINGS_MISMATCH_CONFIRMED / AUTO_DEPLOY_RISK_IDENTIFIED / REMEDIATION_PENDING_OWNER / NO_DEPLOY_BY_ASSISTANT`. لا نغيّر `trendos-d1-api` أو `trendos-ui` أو D1، ولا نرقّي PR #38. بعد صورة تأكيد تعطيل البناء، نراجع `trendos-tasks-v3-t1-preview-20260914` بنفس مبدأ هدف النشر قبل تعديل أي شيء.
- **References:** [GitHub PR #38 UI-001](https://github.com/fawakhry/TrendOs/pull/38), [UI book PR #37](https://github.com/fawakhry/TrendOs/pull/37), [Cloudflare Builds docs](https://developers.cloudflare.com/workers/ci-cd/builds/).


### UI-001 — Cloudflare trendos Auto Builds stop confirmed by owner screenshot — 2026-10-25

- **Evidence marker:** `CLOUDFLARE_TRENDOS_DISABLE_BUILDS_ON_SCREENSHOT_20261025`; screenshot provided directly by owner of Cloudflare Dashboard > Workers & Pages > `trendos` > Production > Settings > Builds. Toggle **Disable builds = ON** (purple). Repository `fawakhry/TrendOs` remains connected to production branch `main`. `Deploy Hooks: No deploy hooks defined` appears. No build command or deploy command visible in the follow-up screenshot because builds are disabled.
- **Confirmation scope:** UI screenshot documents toggle enabled at time of capture; assistant did not change Cloudflare settings nor independently verify server-side persistence or runtime health. This mitigates inadvertent Git-triggered builds for **this named service only**. Do not infer changes to `trendos-d1-api`, `trendos-ui`, the task preview worker, or other deploy pathways.
- **Historical error:** October 9 `Missing entry-point` was an earlier build failure; the new screenshot **does not prove the old pipeline configuration was repaired**, only that auto-builds for `trendos` are now visibly disabled.
- **Safety:** NO merge, NO deploy, NO API change, NO D1 write/migration. Preserve `Disable builds` on `trendos` until ownership of Worker targets and config is reconciled.
- **Next:** Read-only inspect **`trendos-tasks-v3-t1-preview-20260914`** Builds settings and decide only after comparing actual Worker name and intended pipeline; meanwhile UI-001 [PR #38](https://github.com/fawakhry/TrendOs/pull/38) remains DRAFT/source browser test PASS, not LIVE or FIXED. Final prerequisite is isolated staging employee-role verification and approved guarded deployment of actual `trendos-ui`.
- **Book tracking:** [UI book PR #37](https://github.com/fawakhry/TrendOs/pull/37) and [TrendOS UI-001 PR #38](https://github.com/fawakhry/TrendOs/pull/38).


### UI-001 — Cloudflare second Builds settings screenshot — 2026-10-25

- **Evidence marker:** `CLOUDFLARE_TASKS_BUILDS_UNCONNECTED_SCREENSHOT_20261025`; owner provided a screenshot after being directed to review `trendos-tasks-v3-t1-preview-20260914` Worker > Settings > Builds. **The cropped image omits the Worker name**; therefore the target's identity remains `ASSUMED_FROM_NAVIGATION / NOT_VERIFIED_IN_IMAGE` until a screenshot with the top breadcrumb or Worker URL is available.
- **Observed:** Builds / Git repository displays `Connect` rather than a connected repository; API token for external CI/CD displays `Create token` (a suggestion, **not** proof no other credentials exist); Cron triggers say `No cron triggers configured`. This shows there is **no Git repository visibly attached through the Cloudflare Builds UI for the depicted Worker**. It does not demonstrate absence of external CI/CD, existing Worker code, versions, manual deployments, or bindings.
- **User action required on this screen:** **None.** Do not click `Connect` or `Create token`, disable any unrelated service, or alter cron/deploy settings. No Cloudflare API token should be created for UI-001.
- **Work state:** `BUILDS_GIT_UNCONNECTED_IN_SCREENSHOT / WORKER_ID_UNVERIFIED / NO_SETTINGS_MUTATION / UI001_CODE_TESTED_ONLY`. Previous `trendos` service shows Disable builds ON by owner's separate screenshot. Both are distinct from a verified safe `trendos-ui` staging deployment.
- **Next read-only gate:** confirm service identity via top breadcrumb or Worker detail URL; independently verify which Worker receives the `trendos-ui` frontend packaging flow, check its staging auth/Access before using real staff sessions, then staging smoke after explicit approval. Existing [UI-001 PR #38](https://github.com/fawakhry/TrendOs/pull/38) remains Draft. No merge or production deploy here.


### UI-001 — Correct Cloudflare Worker identity, independent Operator Task preview — 2026-10-25

- **Evidence marker:** `CLOUDFLARE_OPERATOR_V2_SERVICE_ID_CORRECTION_20261025`. The user's latest screenshot explicitly shows browser URL `/workers/services/view/trendos-operator-task-v2-preview/production/settings` and Cloudflare breadcrumb **`trendos-operator-task-v2-preview`**. This corrects the prior unverified assumption that the cropped "Git repository / Connect" screenshot was necessarily from `trendos-tasks-v3-t1-preview-20260914`; the names **are not equivalent**. The user presented the full screenshot as a follow-up for the same settings page, so earlier Connect state plausibly applies to the V2 service, but that is user-sequence association rather than independent Cloudflare API confirmation.
- **Repo-side independent match:** `cloudflare-d1/preview/wrangler.operator-task-v2.toml` (ref `candidate/t12-full-cloud-cutover-a56-20260929`) declares `name = "trendos-operator-task-v2-preview"`, preview entry `./index.js`, `TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED = "false"`, and `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`. These flags are repo settings, **not verified live values**.
- **CI/CD:** `.github/workflows/trendos-operator-task-cloudflare-preview-v2.yml` uses workflow-gated Wrangler with `workingDirectory: cloudflare-d1/preview`, `command: deploy --config wrangler.operator-task-v2.toml` for an **isolated, default-OFF** preview. It does not require a Git repository attached to that Worker's Cloudflare Builds UI. Don't connect repository, create token, disable Worker, or manually deploy as part of fixing UI-001.
- **Historic failing check:** `Workers Builds: trendos-tasks-v3-t1-preview-20260914` refers to a **different name**; its provenance and settings have NOT been inspected, so mark `UNRESOLVED`, not "verified no Git" and not "resolved". If necessary inspect that service explicitly by exact breadcrumb without changing it.
- **Frontend:** actual UI target uses `cloudflare-d1/wrangler.frontend.toml`, which names `trendos-ui`. `trendos-operator-task-v2-preview` is **not** the frontend staging environment. Neither screenshot proves UI-001 is deployed, nor proves the frontend's staged employee permissions tested.
- **Outcome:** `OPERATOR_V2_ID_CONFIRMED_BY_SCREENSHOT / OTHER_TASKS_V3_CHECK_UNRESOLVED / NO_CLOUDFLARE_MUTATION / UI001_SOURCE_TESTED_ONLY`. Keep [PR #38](https://github.com/fawakhry/TrendOs/pull/38) Draft and [PR #37](https://github.com/fawakhry/TrendOs/pull/37) book Draft, no merge or production promotion. Proceed with staging verification scoped to `trendos-ui`, no need for user to change Operator Task V2 settings.


## 12. بروتوكول التسجيل الإلزامي — قرار المالك 2026-10-25

**توجيه مباشر من المالك:** «اقرا كتاب الواجهة وكل خطوة بتتسجل فيه». هذا الكتاب هو سجل التنفيذ الأساسي الوحيد الخاص بتطوير واجهة Trend Mall/TrendOS. يُراجَع قبل أي تنفيذ جديد، ويُحدّث أثناء العمل وعقب كل خطوة قابلة للإثبات، وليس في نهاية مشروع كبير فقط. كتاب TrendOS الرئيسي يُستخدم لمراجع الأكواد والتبعيات اللازمة دون تكرار السجل التفصيلي هنا.

### قواعد لا استثناء منها

1. **قراءة قبل العمل:** اجلب أحدث نسخة من `docs/interface/MASTER_BOOK.md` وتحقق من branch/commit، ثم حدد آخر جزء لم يُغلق والاعتمادات الحرجة.
2. **سجل لكل حركة مهمة:** القراءة والجرد، قرار التصميم، إضافة/تعديل كود، اكتشاف عيب، إصلاح، تشغيل اختبار، CI، مراجعة Cloudflare، مشكلة، توقف، واسترجاع؛ كل حدث له عنوان/تاريخ/حالة/مرجع وماذا حدث بالفعل.
3. **أدلة بدل الوعود:** لكل كود: repo + branch + file paths + head SHA + PR؛ لكل اختبار: الاسم ونتيجة حقيقية ورابط run أو log؛ لكل معاينة: مصدرها وسياقها (mock/isolated browser/staging/live).
4. **تمييز الحالة:** `PLANNED`, `SOURCE_ONLY`, `TESTED_ISOLATED`, `STAGING_VERIFIED`, `LIVE_VERIFIED`, `FIXED`, `BLOCKED`, `FAILED`, `ROLLED_BACK`. لا يساوي نجاح اختبار Node/Chromium في بيئة معزولة نشرًا أو تثبيتًا.
5. **التوقف عند الخطأ:** يُسجَّل سبب التعطيل أو درجة اليقين، وما الذي يحتاجه الإغلاق، دون وصف التخمين كحقيقة. عند انقطاع الشبكة يُستعاد آخر HEAD وحالة PR والـCI قبل استئناف أي تعديل.
6. **كل جزء منفصل:** يتضمن baseline، تغيير دقيق، أثر على الأدوار والصلاحيات، regression، rollback، اختبار هاتف/كمبيوتر، وموافقة النشر عند الحاجة. لا يُصنّف `FIXED` دون اختبار فعلي مناسب ودليل قابل للاسترجاع.
7. **عدم تغيير الإنتاج ضمن التوثيق:** كتابة سجل في GitHub لا تعني Merge أو Deploy. لا تعديل قاعدة العملاء أو API أو EasyStore أو صلاحيات Cloudflare، ولا اعتماد تلقائي لأي تشغيل ذاتي.
8. **عدم تكرار العمل:** كل إدخال يحمل معرفًا متسلسلًا غير مكرر، ويربط ما سبقه وما يعتمد عليه. عند اكتشاف تصحيح يُضاف إدخال تصحيحي مؤرخ، ولا يُطمس سجل قديم.
9. **سرية البيانات:** لا نضع أسماء/هواتف العملاء أو أسرار API أو كلمات مرور أو لقطات غير منقحة في GitHub؛ نكتفي بإثبات خالٍ من البيانات الحساسة.
10. **حقيقة GitHub:** فرع التوثيق وPR #37 ما زالا Draft، وفرع كود UI-001 وPR #38 Draft؛ يُذكر موضع كل تحديث بالضبط، ولا يُدّعى وصول الكتاب إلى `main` دون دمج فعلي.

### نموذج سجل خطوة قصيرة (إلزامي حتى للتغييرات الصغيرة)

- `Step ID / Date / Actor / Parent UI Gate`:
- `Input & intent`: المطلوب وما اعتُمد من قيود.
- `Before`: ما تم فحصه، branch/commit وحالة الواجهة.
- `Action actually performed`: مسارات الملفات أو Settings التي **تم** تغييرها؛ وإلا `READ_ONLY`.
- `Evidence`: PR/commit/run/screenshot منقحة، مصدر البيانات ووقت المراجعة.
- `Result / Qualification`: `PASS/PARTIAL/FAIL/BLOCKED`، source vs staging vs live.
- `Risk & rollback`: ما قد يتأثر، إجراء الرجوع، موافقة المالك عند أي إنتاج.
- `Next step`: فعل واحد واضح لا يفترض حدوث أي أمر لم يثبت.

### UI-LOG-001 — اعتماد دفتر تنفيذ إلزامي وتحديث حالة الكتاب

- **التاريخ:** 2026-10-25.
- **الحدث:** أمر المالك بقراءة كتاب الواجهة وتسجيل كل خطوة فيه.
- **ما حدث:** تمت قراءة أحدث نسخة موجودة في `fawakhry/TrendOs` على الفرع `docs/trendos-ui-master-book-20261009` (364 سطرًا قبل هذا الإدخال، آخر عنصر `UI-001 — Correct Cloudflare Worker identity`). تمت مراجعة حالة [PR #37](https://github.com/fawakhry/TrendOs/pull/37) و[PR #38](https://github.com/fawakhry/TrendOs/pull/38)، وكلاهما Draft غير مدمج وقت القراءة. أُضيف هذا البروتوكول وتم تحديث رأس الملف من `IMPLEMENTATION_NOT_STARTED` إلى الحالة الموثقة الحقيقية.
- **حالة الجزء الحالي:** UI-001 — `SOURCE_BROWSER_CI_PASS / STAGING_NOT_VERIFIED / NOT_DEPLOYED / NOT_FIXED`. لا يوجد إثبات تشغيله في الإنتاج؛ خدمة `trendos` أظهرها المالك مع `Disable builds ON`، و`trendos-operator-task-v2-preview` منفصلة عن خدمة الواجهة `trendos-ui`.
- **التنفيذ في هذه الخطوة:** `DOCUMENTATION_ONLY` داخل PR #37. لم يُعدّل كود الواجهة أو إعدادات Cloudflare أو صلاحيات API أو بيانات عملاء.
- **الخطوة التالية:** استكمال فحوص UI-001 المصرح بها على `trendos-ui` وفق سياسة الوصول وStaging. بعدها فقط يُطلب قرار التثبيت/النشر مع سجل الإثبات وRollback.


### UI-LOG-002 — تبسيط النطاق: الحفاظ على الواجهة وترتيب الأزرار فقط — 2026-10-25

- **طلب المالك حرفيًا:** «طيب احنا ممكن نسيب الواجهة الموجودة ونغير بس ترتيب الازرار عشان مندخلش فى اكواد جديدة؟».
- **القرار الموثق:** نعم؛ الأولوية الآن للحفاظ على HTML/CSS وتجربة المستخدم الحالية، واستخدام **نفس الأزرار الموجودة** وتغيير ترتيبها المنطقي حسب الاستخدام. لا تغيير ثيم ولا إضافة Menu/JS/CSS جديد ولا تصميم من الصفر.
- **أين توجد الأزرار:** تمت مراجعة `index.html` على `candidate/t12-full-cloud-cutover-a56-20260929` (blob `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1`): `#mainView .top-actions` يضم 10 أزرار تحمل IDs `refreshBtn`, `remoteFilesBtn`, `matbagySheetsBtn`, `matbagyRotetBtn`, `matbagyNoteBtn`, `accountingBtn`, `endDayBtn`, `urgentNotificationsBtn`, `changePassBtn`, `logoutBtn`. التبويبات الأخرى تُرسم من `app.js/renderTabs()` ولا تُمس في خطوة إعادة ترتيب شريط الأدوات الأولى.
- **خطة الكود الصغيرة:** إعادة ترتيب عناصر `<button>` **في نفس مكانها داخل `index.html` فقط**؛ عدم تبديل `id` أو `class` أو `type` أو النص أو handler أو ترتيب عناصر واجهة العميل. إعادة الترتيب في DOM، لا باستخدام CSS `order` الذي قد يجعل ترتيب لوحة المفاتيح مختلفًا عن الترتيب المرئي. مراجعة أي حقن ديناميكي لشريط الأدوات قبل الإغلاق.
- **الترتيب المقترح للمراجعة (أزرار شريط الموظف فقط):** ملفات مطبعجي → حسابات مطبعجي → Trend Mall شيتات → نوت مطبعجي → روتيت مطبعجي → تحديث الآن → تفعيل إشعارات طباعة على الطاير → نهاية اليوم → تغيير كلمة المرور → خروج. يبقى ظهور الأزرار حسب الصلاحية الحالية؛ لا تعديل دور أو backend. **هذا ترتيب مقترح ولم يُنفذ بعد على فرع UI جديد**.
- **إيقاف التجربة السابقة:** [PR #38](https://github.com/fawakhry/TrendOs/pull/38) `[SUPERSEDED — DO NOT MERGE]` تم إغلاقه دون Merge أو Deploy استجابة لاختيار المالك. يظل كمرجع تاريخي لا يُدمج، ولا نعيد استخدامه في تنفيذ خيار الترتيب فقط. لا ادعاء أن الواجهة الحية تغيّرت.
- **المرجع المعماري:** `PR #37` (هذا الكتاب) ما زال Draft؛ كتاب TrendOS القديم المرجع لأسماء الملفات والصلاحيات. تفعيل `Disable builds` السابق في خدمة `trendos` لا يُلغى بقرار UI.
- **اختبارات القبول عند التنفيذ:** diff `index.html` يُظهر تغير ترتيب أسطر الأزرار فقط (لا إضافات أو حذف)، كل ID فريد وثابت، نفس `class` و`type` وlabel، اختبارات أدوار المالك/الموظف، عمل الأزرار، RTL موبايل/كمبيوتر، واختبار لم يُغيّر واجهة العميل. staging/preview أولا، ثم approval منفصل للنشر.
- **النتيجة الآن:** `DECISION_RECORDED / OLD_PR_CLOSED_UNMERGED / REORDER_IMPLEMENTATION_NOT_STARTED / NO_PRODUCTION_CHANGE`.
- **الخطوة التالية:** تغيير ترتيب الأزرار داخل `index.html` فقط على فرع مراجعة صغير مستقل عند اعتماد ترتيب الاستخدام، وتشغيل اختبارات العقد/المرئيات وتسجيل SHA/PR هنا قبل قرار الدمج أو النشر.


### UI-LOG-003 — التنفيذ المبسط: إعادة ترتيب أزرار الموظف الموجودة — 2026-10-25

- **المطلب المعتمد:** الحفاظ على الواجهة القديمة وعدم إدخال JavaScript أو CSS أو قوائم جديدة، والاكتفاء بترتيب الأزرار داخل الصفحة القائمة.
- **مصدر التنفيذ:** `candidate/t12-full-cloud-cutover-a56-20260929`، `index.html` blob قبل `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1`.
- **الفعل المكتمل:** إنشاء `review/ui01-reorder-existing-buttons-20261025` على أساس candidate، وإعادة ترتيب الأزرار العشرة داخل `#mainView .top-actions` **من دون تعديل حرف واحد في أي زر أو أي جزء آخر من الملف**. لا JS/CSS جديد، لا imports جديدة، لا Backend أو قاعدة بيانات أو صلاحية أو تغيير واجهة العملاء.
- **قبل:** `refreshBtn, remoteFilesBtn, matbagySheetsBtn, matbagyRotetBtn, matbagyNoteBtn, accountingBtn, endDayBtn, urgentNotificationsBtn, changePassBtn, logoutBtn`.
- **بعد:** `remoteFilesBtn, accountingBtn, matbagySheetsBtn, matbagyNoteBtn, matbagyRotetBtn, refreshBtn, urgentNotificationsBtn, endDayBtn, changePassBtn, logoutBtn`.
- **الأدلة:** commit `ccf71aad7596fcfa0a6f694e8f6d0d5900d0bf82`، [Draft PR #260](https://github.com/fawakhry/TrendOs/pull/260) نحو candidate وليس production. GitHub `compare_commits`: فرع Ahead 1 commit، **ملف `index.html` فقط**، 4 أسطر إضافة/4 أسطر حذف (خطوط منقولة).
- **تحقق سلامة نصي PASS:** 10 IDs نفسها دون تكرار؛ كل سطر زر منقول حرفيًا دون تعديل النص أو ID/classes/type، والباقي من HTML byte-identical في الفحص. لا يحتوي الملف الأساسي على imports الخاصة بتجربة PR #38 المغلقة.
- **الأمن والنشر:** `SOURCE_MARKUP_VERIFIED / CI_IN_PROGRESS_AT_LOGGING / STAGING_NOT_TESTED / NOT_FIXED / NOT_DEPLOYED`. نجاح مقارنة HTML لا يُثبت صلاحيات الموظفين أو عمل الموبايل في البيئة الفعلية؛ لا Merge ولا Deploy. لا نغيّر إعداد Cloudflare `trendos` أو `trendos-ui` أو API.
- **المخاطر/الرجوع:** الخطر المتبقي هو اختلاف الترتيب المرغوب أو حقن عناصر من JS/الثيم أثناء التشغيل. الرجوع = revert commit `ccf71aad...` فقط؛ لا قاعدة بيانات أو migrations.
- **مسار المراجعة:** اختبار CI المرتبط PR #260، ثم قراءة screenshots موبايل/كمبيوتر من Staging عند توفره، ثم مراجعة ترتيب الأزرار مع المالك قبل تثبيت الجزء.


### UI-LOG-004 — اختبار إعادة الترتيب على GitHub — 2026-10-25

- **Branch / HEAD:** `review/ui01-reorder-existing-buttons-20261025` / `ccf71aad7596fcfa0a6f694e8f6d0d5900d0bf82`.
- **نتيجة CI:** [TrendOS A61 browser Cloud transport regression run #40213501751](https://github.com/fawakhry/TrendOs/actions/runs/40213501751) = **SUCCESS** (`isolated-regression`). تغير `index.html` فقط، بلا JavaScript/CSS جديد.
- **فحص Cloudflare المنفصل:** `Workers Builds: trendos-tasks-v3-t1-preview-20260914` = **FAILURE** على نفس commit (خدمة مستقلة غير مؤكدة المسار ولا تعني بالضرورة فشل كود الواجهة). لم يُصلح في هذا التغيير؛ لا تغييرات Settings من هنا.
- **PR status:** [#260](https://github.com/fawakhry/TrendOs/pull/260) `OPEN DRAFT / 1 file changed / NOT MERGED`. و[PR #38](https://github.com/fawakhry/TrendOs/pull/38) القديم `CLOSED UNMERGED`.
- **الحالة النهائية لهذه المرحلة المصدرية:** `SOURCE_REORDER_PASS / A61_CI_PASS / UNRELATED_CLOUDFLARE_CHECK_FAILED / STAGING_NOT_VERIFIED / NOT_FIXED / NO_DEPLOY`.
- **الخطوة التالية:** معاينة دور موظف/مالك ببيئة staged مؤهلة للموبايل والكمبيوتر. عدم تحويل تغيير ترتيب HTML إلى LIVE/FIXED بناءً على CI فقط.


### UI-LOG-005 — Owner authorization and first merge, 2026-10-25

- **Directive:** «اللى تعمله ادمجه علطول وشغله مش عاوز حاجات مركونة». Authorizes prompt, tested merge and intended release of completed changes. Still requires correct target and zero accidental changes to other Workers, with verification and rollback.
- **Completed:** PR [#260](https://github.com/fawakhry/TrendOs/pull/260) merged using squash to `candidate/t12-full-cloud-cutover-a56-20260929`, result commit `8da5af81a9705db9b6f306c24618c15617e37151`. Original A61 test run [40213501751](https://github.com/fawakhry/TrendOs/actions/runs/40213501751) = success. `index.html` only, +4/-4 lines.
- **Critical discovery:** `main` and candidate differ by ~4,996 commits ahead /173 behind at comparison; do NOT merge whole candidate into main. A small dedicated main port of **the same 10-button DOM order** was prepared from `main` blob `b9856ae00e64a76e0988411758d6ae9a4a4bae6b`.
- **Main port:** `release/ui01-reorder-existing-buttons-main-20261025` commit `90812fa8c07a8340b0a0cf1659e42e41efeba7b7`, [PR #262](https://github.com/fawakhry/TrendOs/pull/262) against `main`. GitHub compare exactly `index.html`, +4/-4 lines, no JS/CSS added or other code changed. Frontend Employee Dispatcher CI [run 40216167699](https://github.com/fawakhry/TrendOs/actions/runs/40216167699) started; confirm final result before promotion.
- **Actual Worker deploy not yet claimed:** Cloudflare `trendos` Git builds are disabled by owner's screenshot; target for UI is `trendos-ui`. Old fixed-SHA publish workflows cannot be replayed blindly; the actual production frontend's source/version and CI/CD pathway must be qualified to prevent deploying large unrelated changes. Browser session and Cloudflare API credentials have not been linked for a direct deploy in this conversation.
- **Current state at this log:** `CANDIDATE_MERGED / MAIN_PORT_PR_OPEN / PRODUCTION_DEPLOY_UNVERIFIED`. Continue logging final main merge and any Worker release with actual evidence. No claim that the button arrangement is on a live URL yet.

### UI-LOG-006 — Main merged following clean CI, 2026-10-25

- **Main pull request:** [#262](https://github.com/fawakhry/TrendOs/pull/262) successfully **MERGED**, squash commit `b4bf8c092e4d9d866786a88caa0f41c9969b69ba`. Candidate PR #260 previously MERGED at `8da5af81a9705db9b6f306c24618c15617e37151`.
- **CI evidence:** Main port's [TrendOS T12 A61 Frontend Employee Dispatcher CI run #40216167699](https://github.com/fawakhry/TrendOs/actions/runs/40216167699) job `qualify` **SUCCESS**. Unrelated `Workers Builds: trendos-tasks-v3-t1-preview-20260914` check was **FAILURE**, not the UI CI; remains separate.
- **GitHub code state:** `main/index.html` now contains the rearranged original ten buttons. No new JS/CSS, accounts work, orders logic, API or D1 migrations. Source-only modification.
- **Production state:** `MERGED_TO_MAIN / LIVE_FRONTEND_NOT_VERIFIED`. No evidence of Worker `trendos-ui` serving merge SHA `b4bf8c09` yet. The old workflows pin qualified SHAs, and `trendos` Git Builds was disabled explicitly by owner. Do not claim that live Cloudflare Worker changed just because GitHub merged.
- **Next:** establish production frontend baseline, active deployed version and compatible guarded release path; publish only to `trendos-ui` after preflight; record evidence and rollback.
 
### UI-LOG-007 — Source and GitHub Pages activated, 2026-10-25

- **Owner release directive:** Merge and run tested changes immediately; avoid parked PRs. Only minimal existing-button reordering is in scope.
- **Confirmed merges:** PR #260 to candidate `8da5af81a9705db9b6f306c24618c15617e37151`; PR #262 to `main` `b4bf8c092e4d9d866786a88caa0f41c9969b69ba`; interface book PR #37 to `main` `99fb050b79e614f9240f70e4ddc7fc895376c61d`. PR #38 remains closed, unmerged (superseded).
- **Main employee dispatcher CI:** [40216167699](https://github.com/fawakhry/TrendOs/actions/runs/40216167699) `qualify=SUCCESS`. The separate Workers Build for `trendos-tasks-v3-t1-preview-20260914` failed and is not UI Worker deployment.
- **Actual public website deployment:** GitHub's **Pages build and deployment** on main `b4bf8c092e4d9d866786a88caa0f41c9969b69ba`, [run 40216285261](https://github.com/fawakhry/TrendOs/actions/runs/40216285261): build/deploy/report **SUCCESS**. Then main `99fb050b79e614f9240f70e4ddc7fc895376c61d`, [run 40216382196](https://github.com/fawakhry/TrendOs/actions/runs/40216382196): build/deploy/report **SUCCESS**. Public URL `https://fawakhry.github.io/TrendOs/` resolves and serves a Trend Mall HTML login page; extracted page metadata matches Trend Mall. **This is Github Pages, not a Cloudflare deployment**.
- **Cloudflare production unchanged/unproven:** `https://trendos-ui.trendmall-contact.workers.dev/` responds to public read-only HTML fetch as Trend Mall, but no proven file fingerprint/version after merges. `trendos` auto builds disabled by owner, and it is not `trendos-ui`. Thus `MAIN_MERGED / GITHUB_PAGES_DEPLOYED / CLOUDFLARE_TRENDOS_UI_NOT_VERIFIED`. Do not claim Cloudflare production deployment or customer login smoke.
- **Blocked extra browser verification:** TinyFish live browser automation could not start due to insufficient independent wallet credits. No paid action was initiated, no retry. Public read-only fetch was possible but does not reveal hidden employee button order.
- **Remaining action:** Cloudflare's actual `trendos-ui` production release requires a verified deploy path or authorized access and safe previous-version guard; preserve runtime and billing/security invariants. No root Wrangler config, D1 change or cross-Worker publishing was performed.


### UI-LOG-008 — Cloudflare exact-live baseline audit and failed-safe rehearsal (2026-10-25)

- **Problem:** user reports no visible difference on the real platform. The earlier main merge and GitHub Pages success were insufficient to prove the UI Worker had changed.
- **Read-only production fingerprint:** [Action 40219284126](https://github.com/fawakhry/TrendOs/actions/runs/40219284126), SUCCESS. `trendos-ui` returned the **original ten-button order**, whereas GitHub Pages returned the new order. Cloudflare served different `config.js` and `app.js` byte content than `main`, therefore publishing all of main would risk changing unrelated live behavior.
- **Before release, precise target:** Cloudflare Worker `trendos-ui`; deployment ID `d7b1e054-ca5d-4883-97f0-b6a217a080cb`; 100% version `899b134a-12bb-495c-9114-3b1bd0de15c8`; live HTML SHA256 `c3024864c77b8ad3a1a6c52730660537c3b388dbc07d4bc7af6f3f6af46384c8`.
- **Safe package design:** guard exact active version & old HTML hash; download the **46 live-served HTML/JS/CSS files**, using the previously qualified asset-name inventory on `2da755ca910b84911378c018d050cf806d8349d5`; reorder only the ten original `#mainView .top-actions` button nodes in the downloaded live `index.html`, preserving each original line; preserve other 45 assets byte-for-byte. Use known `cloudflare-d1/wrangler.frontend.toml` config targeting only `trendos-ui`, with rollback to old version if postflight fails.
- **First rehearsal:** [Action 40219897030](https://github.com/fawakhry/TrendOs/actions/runs/40219897030) stopped **before deployment** because an overly broad regex detected multiple toolbar matches. This was `FAIL_CLOSED / NO_DEPLOY / NO_WORKER_CHANGE`, not a live incident.
- **Repair:** Replace global toolbar matcher with an exact anchored extraction under `<section id="mainView" class="hidden">...`, also preserving all ten existing button rows. [Action 40220029295](https://github.com/fawakhry/TrendOs/actions/runs/40220029295) then **SUCCESS**, `UI001_EXACT_LIVE_BUNDLE=PASS`, `UI001_ASSET_COUNT=46`, `UI001_ONLY_CHANGED_ASSET=index.html`, `UI001_DRY_RUN_NO_DEPLOY=YES`.
- **Result:** `LIVE_BASELINE_PROVEN / DRY_RUN_QUALIFIED / NO_MUTATION_IN_REHEARSAL`.

### UI-LOG-009 — Guarded Cloudflare publication and independent recheck (2026-10-25)

- **Owner instruction:** tested changes must be merged and run, not parked.
- **Code delivery:** [PR #260](https://github.com/fawakhry/TrendOs/pull/260) merged to candidate; [PR #262](https://github.com/fawakhry/TrendOs/pull/262) merged to `main`; [PR #37](https://github.com/fawakhry/TrendOs/pull/37) book merged to `main`; original experimental collapsible-menu [PR #38](https://github.com/fawakhry/TrendOs/pull/38) closed unmerged. [PR #270](https://github.com/fawakhry/TrendOs/pull/270) published the guarded release workflow to `main` (merge `9f42b56c49c3eea19411e2472c458576607403a0`).
- **Production release:** [Action 40220150159](https://github.com/fawakhry/TrendOs/actions/runs/40220150159) **SUCCESS**; pre-version and HTML lease guards both PASS, all 46 assets downloaded from live, **index.html ONLY** changed in byte-exact snapshot. Wrangler deploy target only `trendos-ui`. Post-deploy HTML byte equality PASS, every other **45 files byte-identical** to snapshot, full traffic at 100%, rollback **NOT USED**. No D1/API/EasyStore/Operator Task mutation performed by this release.
- **Pre-Worker-version:** `899b134a-12bb-495c-9114-3b1bd0de15c8`.
- **New Worker version:** `8c5ccf6e-b002-4efb-858b-e0e609cdc730`; new deployment `f6599f59-1e01-482c-9bf5-1560eaa021c2`; at **100% traffic**.
- **Post-HTML SHA256:** `9f06aaec71a679de7e6532bbdc6a0866b42850b3bb45bb2c463b07c577b2858a`. The original live HTML hash was `c3024864c77b8ad3a1a6c52730660537c3b388dbc07d4bc7af6f3f6af46384c8`.
- **Independent public read-only recheck:** [Action 40220254068](https://github.com/fawakhry/TrendOs/actions/runs/40220254068) **SUCCESS**: Cloudflare HTML matches expected new ten-button DOM order; new HTML SHA256 confirmed; new Worker version 100%; `config.js` and `app.js` remain intentionally different from GitHub `main` (because live code was preserved rather than overwritten).
- **Rollback:** previous Cloudflare version `899b134a-12bb-495c-9114-3b1bd0de15c8` remains the known restoration target. Workflow has automatic rollback triggered by post-deploy failure; it was not needed.
- **Honest acceptance boundary:** `UI-001_SOURCE_MERGED / GITHUB_PAGES_DEPLOYED / CLOUDFLARE_LIVE_VERIFIED_STATIC / EXISTING_BUTTON_DOM_ORDER_PASS / 45_ASSETS_PRESERVED / NO_AUTHENTICATED_ROLE_SMOKE`. Real employee login/role click smoke was not run; no claim of verified financial actions or live task handling. The full UI redesign and Owner Console security gate remain separate work.
- **Operational check for owner:** refresh `https://trendos-ui.trendmall-contact.workers.dev/` and open the employee area. Buttons should start `ملفات مطبعجي → حسابات مطبعجي → Trend Mall شيتات → نوت مطبعجي → روتيت مطبعجي`, subject to the original permission/hidden classes.
- **Next UI gate:** document visual/role feedback if any; close UI-001 after normal operating verification, then choose next existing-button group to rearrange without new app code.



### UI-LOG-010 — Product-guided customer WhatsApp-style draft, Matbagy photo rules (2026-10-31)

**Owner priority:** Customer clicks `+ طلب جديد` and goes directly into the *existing* WhatsApp-like TrendOS conversation, selects product from a menu (`سوار، تابلوه، برواز، مج، تيشيرت، منديل` and future categories), uploads original image(s) or documents, types requirements and quantities and submits via the existing authenticated draft backend. The system must apply product-specific dimensions, text/face protection and printing preflight, and must not substitute a new SVG library or a separate customer database. Owner requests Matbagy electric blue, and previously rejected visible template library/import UI on the separate local Matbagy studio.

**Code sources audited:** `index.html@main` already contains `customerShowNewOrderBtn`, `customerNewOrderPanel`, `customerDraftMessages`, `customerOrderFiles`, `customerOrderDocs`, `customerAddDraftItemBtn`, `customerSubmitDraftBtn`, `customerDesignerPanel` (placeholder), and staff/owner chat separately. `app.js@main` currently sets `customerViewMode='newOrder'` on the button, handles upload via `uploadCustomerDraftFile`, creates a draft item via `addCustomerDraftItem`, then creates official order via `submitCustomerDraft`. That established order path must not be replaced or invoked by a duplicate client. `docs/interface/MASTER_BOOK.md` §2, §3 AP-UI-06/07/08/19 and §4 show explicit advisory AI, human proof, source authority and nonproduction controls.

**Source-only implementation in isolated [Draft PR #308](https://github.com/fawakhry/TrendOs/pull/308), head `feature/customer-chat-product-recipes-ui-20261031`, base `main`:**
- `index.html` inserts product + size recipe controls *inside* the existing customer chat composer, above the same WhatsApp attachments; no second page/form, uploaded file endpoint, order endpoint or customer ID. The existing separate `customerShowDesignerBtn` is redirected into the same new-order chat by a staged client-only capture handler; original placeholder is no longer the intended customer path.
- `customer-design-guided-chat-v1.js`: extensible recipe registry with **tablo, frame, mug, shirt, scarf, bracelet, sticker, invitation, other**. Fixed optional size presets (mug 20×9 cm, senior sticker 7×10 cm) vs custom dimensions 1–500 cm with explicit units; no invented standard wrist/scarf size. Shirt garment size separate from artwork size. Check product, dimensions, product name where needed, and explicit checkbox acknowledging the original customer image and faces/text cannot be changed. On **existing add-item click**, prepend a plain-text, tagged `[مواصفات مطبعجي]` block to the *existing notes* and leave the customer's free text intact. Use existing app's `customerOrderItem`, department, images and create/upload/submit flow. No network client, API token or image processing introduced.
- `customer-design-guided-chat-v1.css` gives this block Matbagy blue/RTL and mobile-friendly spacing *within* the current chat; no orange Turbo branding or separate template library UI introduced.
- `tests/customer_design_guided_chat_v1.test.cjs` and `.github/workflows/customer-chat-product-recipes-draft.yml`: Node static/pure-function synthetic checks for products, mandatory fields, original/face fidelity instructions, preservation of user notes (idempotent on retry), and existing chat element and handler reuse. No production deployment or paid API.

**Critical truth gates:** This is **client-side UX/validation + advisory structured text, NOT a backend product-policy enforcement system**. A malicious or old client could bypass it. No actual images were transformed; no AI model, OpenAI billing, print-ready or live authenticated customer smoke was exercised. Image generation can change faces despite instructions; safer long-term design is to keep original image bytes immutable, use compositing/layers rather than regenerating identity pixels where possible, separately version AI artwork, and block print-ready until visual and pixel-size QA on the final exported artifact. An actual order cannot be claimed from a static CI run. The frontend still relies on the existing TrendOS draft upload backend and its current private-storage guarantees (which require independent authorization/tenant checks); no Google-to-Cloudflare data migration or automatic production deployment.

**Release boundary:** current `trendos-ui` production Worker was documented to serve asset hashes different from GitHub `main` as of UI-LOG-009. **Never deploy the full `main` bundle or assume that merging this PR changes production.** No live deployment/merge/paid call authorized here. Before any customer release: verify server policy/permissions and privacy, preserve original image SHA and version, confirm storage retention and multi-tenant boundaries, test authenticated customer flow using synthetic files against an isolated backend, and conduct exact-live baseline/asset diff and owner visual acceptance. For first UX trial, open Draft PR source or an isolated preview *without connecting production customer credentials*.

**Checkpoint:** `CHAT_RECIPES_SOURCE=IMPLEMENTED`, `TRENDOS_EXISTING_DRAFT_BACKEND=REUSED_UNMODIFIED`, `SERVER_SIDE_POLICY=NOT_IMPLEMENTED`, `LIVE_CUSTOMER_E2E=NOT_RUN`, `OPENAI_REAL_GENERATION=OFF`, `TRENDOS_PRODUCTION=UNTOUCHED`.

### UI-LOG-011 — Customer guided-chat Draft PR #308 CI verified (2026-10-31)

- **Release context:** only [Draft PR #308](https://github.com/fawakhry/TrendOs/pull/308), source head `06ebd804356c38037e5d7f96f554e97c21a0f655`. No merge or deploy; original `app.js` and customer draft backend unchanged. Staged browser route is still the existing `customerShowNewOrderBtn -> customerNewOrderPanel` WhatsApp-like view.
- **CI:** [push run #41139343569](https://github.com/fawakhry/TrendOs/actions/runs/41139343569) `completed/success`, [PR check run #41139349128](https://github.com/fawakhry/TrendOs/actions/runs/41139349128) `completed/success` on this exact source SHA. Tests cover existing chat HTML/handlers, six requested product families, common original photo/identity rules, required sizes and garment size, idempotent notes, and no extra API clients. Subsequent fix avoided overriding the existing print/laser department field for bracelets or mixed products.
- **Remaining blockers:** No authenticated end-to-end with synthetic picture against isolated TrendOS backend, no live UI screenshot, no server-side product rule enforcement, no immutable-source proof on the TrendOS upload path, no live Matbagy/OpenAI integration, no print QA/300 DPI preflight, no production release approval. `UI_ONLY=PASS_REPO_CI`; `SERVER_ENFORCEMENT=PENDING`; `REAL_CUSTOMERS=NOT_TESTED`; `DEPLOY=NO_GO`.

### UI-LOG-012 — Customer Portal end-to-end code audit, isolation fixes and backend P0 blockers (2026-10-31)

**Scope reviewed from source, not live production:** `index.html`, `app.js`, `Code.gs`, `employee-api-dispatcher-v1.js`, `config.js`, `customer-design-guided-chat-v1.js`, `tests/customer_portal_order_flow_audit.test.cjs`, and interface MASTER_BOOK. Customer entry/login (code+password), `customerLogin`/logout/session, customer-only home, existing new-order WhatsApp-like draft, image/docs selection and preview, item upload, order submit, list, and demo/visitor preview. `config.js` still points base customer actions to an Apps Script/Google backend; employee native dispatcher deliberately passes `CUSTOMER_SESSION_ACTIONS` downstream without migrating them to D1. **No claim of zero-Google customer drafts.**

**Confirmed positive reference-code behavior:** `customerAuthorize_(customerCode,token)` exists in `Code.gs`; normal session lookup checks stored token, expiration and inactive accounts. `getCustomerOrders_`, `createCustomerDraft_`, `addCustomerDraftItem_`, `uploadCustomerDraftFile_`, `submitCustomerDraft_` all call authorization. The browser uses `sessionStorage` for customer session rather than permanently caching token in localStorage. Existing `uploadCustomerDraftFile` calls Google Drive, limit visible in frontend 25MB/file; legacy raw source is not an immutable private media vault with print QA.

**Client-side security/privacy corrections, isolated PR #308 (no backend changes):**
- In `app.js` `clearCustomerSession()` now calls existing `clearCustomerDraftInputs()`, which revokes any unsent image object URLs and empties pending image/doc list, plus clears password/code, image viewer state, selected marketplace/vendor/branch/customer location and draft, so **a second login in the same tab cannot accidentally inherit the previous user's locally selected images**. `closeVisitorPreview()` similarly purges local draft inputs/recipe. In `doCustomerLogin()`, password field clears on success. `resetCustomerDraft()` also resets product/dimensions/image-keep consent on every new draft.
- `customerShowDesignerBtn` now routes directly through existing `customerShowNewOrderBtn.click()` in original app code, with no competing JS capture listener; legacy empty `customerDesignerPanel` placeholder removed from HTML and `renderCustomerHome` treats `designer` as chat fallback. No new client auth flow, customer DB, order API or key.
- Synthetic regression test `tests/customer_portal_order_flow_audit.test.cjs` validates unchanged login+draft endpoints and order UI, route unification, client cleanup and recipe reset. Together with prior guided chat tests, this establishes **source/UI-only**, not live backend authorization.

**CRITICAL BLOCKERS BEFORE CUSTOMER DESIGN MEDIA RELEASE — reference Code.gs may differ from currently deployed runtime:**
1. **P0 — listing cross-account ambiguity:** `getCustomerOrders_()` currently accepts a row matching the **customer name** even if its `rowCode` does **not match** the authenticated customer's `customerCode`: `if (rowCode !== customer.customerCode && (!nameKey || rowNameKey !== nameKey)) continue;`. Identical customer names can therefore expose other customers' order metadata. Do not claim tenant-safe `getCustomerOrders` until the **deployed backend** is verified; correct to strict verified identity, with separate reviewed migration strategy for legacy rows lacking customer code, before production.
2. **P0 — publicly link-viewable uploaded client photos:** `uploadCustomerDraftFile_()` currently calls `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)` after `DriveApp.createFile`. Even if blocked by some Workspace policy, this is insecure by default for private customer photographs; a copied URL can show an image without customer login. Require private storage and owner-authenticated/tenant-authorized, expiring image access; verify already-uploaded link permissions separately. **No retroactive revoke/permission change applied in this review.**
3. **P1 — server upload size check trust:** upload route compares client-supplied `size` against `CUSTOMER_UPLOAD_MAX_BYTES` before base64-decode but does not verify actual decoded byte length before storing the blob; cap encoded-body length and re-check decoded payload server-side under approved backend change.
4. **P1 — incomplete failed-upload recovery:** browser creates an item through `addCustomerDraftItem` before per-file uploads, and a failed later upload may leave a partial item on the server even if the browser has not appended the item locally. Add same-draft, per-file retry and idempotent reconciliation in a separate backend-gated release.
5. **P1 — media/AI safety not yet implemented:** prompt-level advice to preserve faces is not proof of pixel preservation. For OpenAI only send material with appropriate customer consent, preserve original immutable bytes, AI edits as versioned separate previews, owner/print QA and actual 300 DPI pixel count at final physical size. Never auto-mark print ready.

**Decision:** These backend findings are **REVIEW-ONLY** and cannot justify silently changing live Apps Script, customer master, order creation, Google Drive permissions or existing uploaded assets on a frontend PR. Stage a separate approved backend hardening patch with tests and a migration plan. Keep `TRENDOS_CUSTOMER_DESIGNER_PUBLIC=NO_GO`, `PAID_API=OFF`, `NO_LIVE_CUSTOMER_TEST`, `NO_PRODUCTION_DEPLOY` until authorization, upload privacy and human print gates pass. Since live Worker asset hashes differ from source main, verify exact deployed backend/UI before any release.

### UI-LOG-013 — Matbagy customer portal visual ownership and Zero Google gates (2026-10-31)

**Owner mandate for this UI workstream:** User requests the assistant to take responsibility for the **customer portal interface** in TrendOS, first reviewing the original UI book and Zero Google work, implementing from existing chat rather than replacing it, and showing a high-quality visual preview of the desired result. Scope is this development session and the auditable Draft PR; no implicit ability to monitor or operate asynchronously. Identity is **مطبعجي** with its electric blue/navy/white; **no Turbo DTF**, separate library, chat import gallery or fake production AI claims on the customer design surface.

**Authority/readback performed:**
- `docs/interface/MASTER_BOOK.md@main` latest documented Cloudflare `trendos-ui` exact-live release UI-LOG-009: 46-asset baseline, one HTML patch, all other 45 files preserved; deployed `app.js` and `config.js` **differ from main**. Therefore do not deploy all main assets without new exact-live diff, rollback and owner approval.
- `TrendOS_MASTER_BOOK.md` on Zero Google branch `docs/zero-google-operator-book24-google-proxy-source-audit-20261031` (current snapshot) and frozen catalog `docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG.md` read. Book explicitly says **OLD = ACTIVE_WRITE**, unified catalog frozen/migration-only. Latest BOOK24 checkpoint inventories six routes/two task writers with source 9/9 PASS but Google task proxy still required. Customer migration `ZERO_GOOGLE_CUSTOMER_ACTIONS_RETIRED_LAST_PROVEN=0/9`; T12 attached-file submit, privacy and owner/ledger cutover remain NO_GO. No Zero Google agent source is treated as live.
- Existing customer code `index.html`, `app.js`, `Code.gs` audited: login by code/password, sessionStorage (not localStorage persisted session), current WhatsApp-style `customerNewOrderPanel` for draft/image upload and order submission; source backend still uses Apps Script/Drive, and privacy findings from UI-LOG-012 remain P0.

**Visual changes staged on Draft PR #308 only:**
- Customer-specific blue header with `مطبعجي` logo mark, customer home **«فكرتك تبدأ بمحادثة»** hero and dominant **«＋ أوردر جديد — افتح المحادثة»** service action. Existing marketplace, branches and other authorized services retained.
- `customerNewOrderPanel` remains the sole authenticated customer design conversation, now titled «محادثة أوردر مطبعجي»; its guided product, size, original-face/wording and 300-DPI advisory controls are reused. CSS is scoped to `#customerView`/new-order to avoid altering employee/finance pages. Original `app.js` order creation, API URLs, auth, file upload and staff systems not modified by this visual change.
- Demo preview built *offline as a separate synthetic standalone HTML* for owner review, with computer/home/chat and mobile chat screenshot exports. Preview contains no real customer files and is explicitly not proof of deployed UI, customer auth or live API. Actual PR UI assets/styles are authoritative; the demo is illustrative, not a production replica.
- Synthetic test extension verifies brand node and customer-only CSS scope, button existing IDs and responsive rules. No paid model call; no customer data; no production deployment.

**Release queue / acceptance gates:** (1) owner visual decision against desktop/mobile preview; (2) protect two P0 backend issues — `getCustomerOrders_` ambiguous name-based cross-customer match and `uploadCustomerDraftFile_` public anyone-with-link media — via **separate owner-approved backend security PR**, plus uploaded-file audit; (3) isolated authenticated two-tenant synthetic browser/Drive-D1/R2 E2E, original SHA integrity, MIME/size/retention and retry hardening; (4) Zero Google exact contract and Cloudflare stage cutover with no new customer DB or T12 writer modification; (5) live asset-by-asset Cloudflare UI parity, zero customer leaks, explicit deployment approval and rollback. `UI_SOURCE=DRAFT`, `CUSTOMER_PRODUCTION_RELEASE=NO_GO`, `OPENAI_PAID=OFF`.

### UI-LOG-014 — Owner approves Matbagy customer chat design; source merge with default-OFF production fence (2026-10-31)

**Owner-approved design:** The owner explicitly approved the Matbagy electric-blue customer portal UX and instructed merge + documentation in all relevant GitHub books. Approval is for the *visual design and code integration*; the customer-photo privacy/backend and Zero Google migration have not been certified. The legal/technical boundary is **merge source with release gate OFF, never silently activate production customer media**.

- **Original release/source mismatch read:** `main` HEAD `3bc83c0f809fb30e8a3aac1a724b6e949dd7bea9` and existing UI-LOG-009 guard record establish Cloudflare live 46-asset snapshot with `app.js` and `config.js` intentionally differing from `main`; do not publish the full repo/main bundle to `trendos-ui` automatically.
- **Source PR:** [#308](https://github.com/fawakhry/TrendOs/pull/308); introduces a customer-only blue hero and chat product/size/photo rules, retaining exact original `createCustomerDraft`, `addCustomerDraftItem`, `uploadCustomerDraftFile` and `submitCustomerDraft` backend actions. Session cleanup and designer-card routing fixes stay in the same client module. No private data, key, paid OpenAI calls or production deployment.
- **Important last-minute safety control:** `index.html` marks `customerMatbagyHero`, `customerMatbagyIdentity`, `customerDesignRecipe` `hidden` by default; `customer-design-guided-chat-v1.js` requires `window.TRENDOS_CUSTOMER_CHAT_V1_ENABLED === true` before attaching product UI controls or unveiling sections; `mount` independently rechecks. `customer-design-guided-chat-v1.css` scopes all blue redesign rules to `html.matbagy-ui-enabled` with forced hidden fallback. This is **frontend rollout/UX isolation** only, not a security substitute for Backend auth or private file permissions. Never treat query params or localStorage as authorization or rely on this switch for protecting real data.
- **Dedicated UI agent handoff book:** `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md`, under the existing TrendOS repo, records approved scope, source ownership, priorities, two P0 backend blockers, Zero Google constraints, release gates and next tests. No second repository/customer DB was created.
- **Tests:** existing synthetic chat contract tests + customer portal/session tests + `tests/customer_ui_default_off_gate.test.cjs` in isolated CI. At initial gate HEAD `83ab8161dd7c9c6c0e930501b940809c7fb7c952`, push Action `41141247537`, PR Actions `41141255738`/`41141255776` all **completed/success**; exact post-doc/merge HEAD still needs a final separate check. No authenticated Stage E2E or actual image transformation tested.
- **P0 remains:** `getCustomerOrders_` source name-fallback ambiguity and `uploadCustomerDraftFile_` ANYONE_WITH_LINK private-photo exposure in original Apps Script; not fixed here. Backend hardening needs independent PR, two-customer same-name/tenant test, private media audit, browser authenticated smoke and exact-live baseline check. Zero Google remains `CUSTOMER_GOOGLE_ACTIONS_RETIRED_LAST_PROVEN=0/9`, BOOK24 Google task writer cutover NO_GO. `LIVE_CUSTOMER_UI=OFF`; `LIVE_OPENAI_PAID=OFF`; `PRINT_READY=NO`.
- **Release rule:** A source merge is NOT a Cloudflare/worker release. Do not change `trendos-ui`, customer master/Google files, EasyStore, T12 writers or production traffic until the owner approves a specific guarded deployment after privacy and E2E gates. Owner visual preview is approved; no live customer workflow acceptance is claimed.


### UI-LOG-015 — Owner-approved Matbagy customer UI merged to main with OFF gate (2026-10-31)

- **Executed actual GitHub source merge:** [PR #308](https://github.com/fawakhry/TrendOs/pull/308) merged into `main` as merge commit `f0a36fe40b757751bf98892fcaf771dd48641536`, from exact reviewed feature HEAD `3651ea34ac89c2a3fb0eb67187df94d04bea80ea`, after GitHub Actions exact-HEAD push + two PR workflows completed SUCCESS. Owner approved the Matbagy-blue customer portal and expressly directed merge. No new customer or finance database, API key, image generation, T12 writer or production backend order action touched.
- **Release gate must remain closed:** new customer visual sections in HTML are `hidden`, blue CSS conditional on `html.matbagy-ui-enabled`, and script requires `window.TRENDOS_CUSTOMER_CHAT_V1_ENABLED === true` before mounting; it is **not** enabled in committed application config. This is only a frontend UX flag, not authentication. Existing customer portal markup and some text/session cleanup were modified as part of source merge; do not call the entire web bundle bit-identical to previous deployment.
- **Automatic publishing caution:** GitHub `main` push may trigger GitHub Pages publication separately from the Cloudflare `trendos-ui` worker. A Pages build was observed as `in_progress` after merge; therefore "no production" here means **no intentional Cloudflare Worker deployment or activation of new AI/product recipe UI**, not that no public GitHub Pages file could update. Verify all relevant deployments independently.
- **Hard NO_GO still applies:** existing `Code.gs` source has P0 name-fallback order listing and `ANYONE_WITH_LINK` original-file sharing; customer photos must not be AI processed or assumed private. No authenticated two-customer e2e, Zero Google cutover, media SHA/scan/300DPI/QA or Cloudflare full-live baseline certification. Fix backend in a distinct reviewed PR with actual permission/tenant tests before turning UI on.
- **Owner UI implementation ledger:** `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md` is the dedicated interface workstream book; old ACTIVE_WRITE `TrendOS_MASTER_BOOK.md` remains official cross-project ledger on its existing work branch, unified catalog remains FROZEN. Matbagy-OS `PROJECT_BOOK.md` must cross-reference integration, not pretend a paid AI call has run.


### UI-LOG-016 — Main merge verified; security Stage PR312 blocked by Apps Script A61 boundary (2026-10-31)

- Owner-approved UI PR #308 truly MERGED into `main` at `f0a36fe40b757751bf98892fcaf771dd48641536`. GitHub Pages build #41141540860 and later #41141612661 completed SUCCESS; public GitHub Pages asset changes are possible even though new UI product guidance remains hidden/disabled unless `TRENDOS_CUSTOMER_CHAT_V1_ENABLED===true`. No proof Cloudflare `trendos-ui` live Worker changed, and no manual Worker release performed.
- **Separate protection effort:** [Draft PR #312](https://github.com/fawakhry/TrendOs/pull/312) to harden original Apps Script customer-order code ownership and private photos using strict customer code and staged Drive private upload/real decoded size checks. Isolated dynamic tests with two same-name synthetic customers and mock Drive PASS (#41141920196), but existing **A61 Apps Script Bridge Main CI FAIL** (#41141920267) because Code.gs differs from bridge-only boundary. Do not bypass guard. Stage has NOT deployed; owner folder inherited ACLs and preview authorization remain unproven.
- **Release remains blocked:** Zero Google customer retirement 0/9, no backend privacy certification, no real two-customer Stage, no cloud Worker exact-live validation, no paid OpenAI or print-ready. Detailed handoff is `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md` §8.


### UI-LOG-017 — Owner conditional approval for live customer portal, not release proof (2026-10-31)

- Owner requests: **«اه طالما شغالة يبقى ادمج وسجل»** in response to the distinction between source merging and real customer go-live. Approval is **conditional on proven running/secure customer flow**; prior Matbagy blue layout already merged as PR #308 and source/Pages tests pass, without live Cloudflare launch.
- Rechecked `main` and PR states: #308 MERGED, #312 OPEN/DRAFT; A61 bridge-only CI for #312 FAILED despite its synthetic private-media tests PASS. Customer chat rollout flag remains default-OFF and existing Apps Script/Google Drive privacy blockers are unresolved. No evidence of successful live authenticated two-customer test or private-media denial.
- **Therefore no live enable/Cloudflare deploy** is authorized as a completed action merely from a successful UI test. Documented user approval + precise go/no-go evidence in `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md` §9. Next gate: separately reviewed Backend privacy/security release via allowed A61 ownership path, staged 2-tenant real-auth synthetic upload test, exact-live asset diff and rollback before enabling the feature flag. Preserve Paid OpenAI OFF and no automated print.


### UI-LOG-018 — PR312 protected Apps Script unchanged; isolated P0 candidate and mock CI pass (2026-10-31)

- **Reviewed live source status:** direct read-only web inspection: Cloudflare `trendos-ui` currently renders «دردشة الطلب» older UI; GitHub Pages renders Matbagy new hero/product sections with `hidden`; no real customer login or file submitted. Blue guided chat remains OFF by default.
- **A61 resolution in staging, not live:** [Draft PR #312](https://github.com/fawakhry/TrendOs/pull/312) now has **NO `Code.gs` diff**. A deterministic `customer-portal-p0-stage-patch.cjs` prepares P0 exact-code and photo privacy changes purely in-memory with baseline drift checks, not by mutating protected Apps Script. Existing bridge-only A61 guard left intact. Expanded dynamic Node VM tests validate same-name different-code order isolation, reject cross-tenant file item, validate actual decoded bytes, refuse shared folder, and rollback mock when privacy cannot be verified.
- At candidate HEAD `a90489eba8ca4240a9632d7b860a96daf3ddbb4f` GitHub CI source-only security push #41197389879 PASS, PR #41197393972 PASS, existing guided chat #41197393951 PASS. Earlier A61 failure on original Code.gs edit is historically real, not retroactively relabelled; it does not run now because PR no longer modifies Code.gs.
- Critical limits: No deployed Apps Script patch, inherited Drive ACL verification, historical public link audit, authorized thumbnail proxy, live Stage 2-tenant authenticated flow, or Cloudflare production Worker update. `CUSTOMER_PRIVACY_GO_LIVE=NO_GO`; Zero Google original customer action retirement remains `0/9`.
- Owner's conditional go-live remains accepted as a **goal**, not as authorization to bypass these release checks. Handoff in `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md` §10.


### UI-LOG-019 — Stage security toolkit and offline customer GO/NO-GO audit merged (2026-10-31)

- [PR #312](https://github.com/fawakhry/TrendOs/pull/312) **MERGED** `d8de3171de7d95ac862f07899861f6aaae9f54ae` as three new source-only files: `customer-portal-p0-stage-patch.cjs`, synthetic dynamic authorization/media tests, and Stage CI. Original `Code.gs` **unchanged**, A61 bridge-only guard not bypassed; scripts cannot deploy or touch real users. Source tests PASS. This does not harden deployed Apps Script or revoke public image links.
- [PR #313](https://github.com/fawakhry/TrendOs/pull/313) **MERGED** `1c023663ee9517ae9ae993ee9408371a43342616` as offline `customer-portal-readiness-audit-v1.cjs`, tests and CI. Current main reports `NO_GO`; strict release mode refuses GO with nonzero exit even when candidate source checks pass without real runtime evidence. Its PASS CI qualifies **audit correctness only**, never customer deployment.
- **Zero Google design reuse:** latest source in [Draft #311](https://github.com/fawakhry/TrendOs/pull/311) includes private D1+R2 staged customer draft-file upload Entry666 (5MiB, OFF, session-bound, SHA256, no public download) and read-only private integrity Stage plus immutable quarantine migration 0040 (scan_completed=0, no print). Reuse contract; avoid building new public download / duplicating customer master. 5MiB/25MiB current product limit mismatch, no signed private preview/download or production malware scanner qualification.
- **Go-live remains blocked:** Cloudflare `trendos-ui` direct read-only observation still had old chat vs GitHub Pages hidden blue design; customer UI flag OFF; no real two-customer isolated E2E, Google Drive inherited ACL proof, Apps Script server owner-controlled hotfix, R2 binding, exact-live rollback, Google action retirement (0/9). `PRODUCTION=NO_GO`; no OpenAI paid or AI print.
- Detail: `docs/interface/CUSTOMER_PORTAL_UI_PROJECT_BOOK.md@main` §11.
