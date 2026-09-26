# TrendOS — Historical archive batches registry

> Extracted from the compacting Master Book on 2026-09-27. These are completed documentation/archive operations, not current runtime state and not mandatory new-chat reading. Original archived documents and Git history remain authoritative for their historical content.

### أول دفعة أرشفة نُفذت فعليًا — 2026-09-24

تمت قراءة ثلاث وثائق إصدار تاريخية كاملة، ونسخ النص الأصلي **مطابقًا للـblob SHA** إلى `docs/archive/trendos-master-book/2026-09-24/`، ثم استبدال نصوصها الطويلة في المسار القديم بوصلة قصيرة إلى الأرشيف وهذا الكتاب. بذلك **لم تُحذف المستندات أو تنكسر روابط المسارات القديمة**، وفي الوقت نفسه النص التاريخي الطويل متاح من الأرشيف فقط. المحتوى التاريخي ليس تعليمات Deploy حديثة؛ خصوصًا نصوص استبدال `Code.gs` وتفعيل triggers.

| الوثيقة التاريخية | كامل الأصل المؤرشف | Blob SHA للنص الأصلي | حالة المسار القديم |
|---|---|---|---|
| `README_V1931.md` | [نص V1931 كامل](docs/archive/trendos-master-book/2026-09-24/README_V1931.md) | `e7f72eae437e4421938b7317d19db89e1fb49c28` | رابط توافق فقط |
| `V1932_RELEASE.md` | [نص V1932 كامل](docs/archive/trendos-master-book/2026-09-24/V1932_RELEASE.md) | `36e65aa067cc6b65dbef49cb2927eb40a6b2c794` | رابط توافق فقط |
| `APPS_SCRIPT_DEPLOY_V1940.md` | [نص V1940 كامل](docs/archive/trendos-master-book/2026-09-24/APPS_SCRIPT_DEPLOY_V1940.md) | `49f0fafea76184832942f4b4861b6f5699442796` | رابط توافق فقط |

**ملخص حفظ محتوى هذه الوثائق في الكتاب:** V1931 يشرح الأرشفة وسرعة pagination وسياسة منع التسليم بقائمة مديونية خاصة وQueue الرسائل والمخزون وقفل اليوم وAttendance Hybrid ويحتوي تعليمات نشر تاريخية لا تُنفَّذ الآن. V1932 يضيف Manager Center وCustomer Manager/WhatsApp وAI/backend/router وأسماء Script Property اللازمة بلا قيم؛ وصف "أضف سطور الراوتر" تاريخي وليس أمر نشر. V1940 يحصي الـbackend المقترح للدوام والتنظيف والموارد البشرية والمكبس والفواتير والـfrontend منفصلًا، وشروط صحة النشر وحدود HR/السعر/الكهرباء؛ ليس دليلًا على وجود/نشر جميع هذه الملفات اليوم. التفاصيل الأصلية الكاملة محفوظة في الأرشيف بالأسماء والبصمات أعلاه.

### دفعة الأرشفة الثانية — 2026-09-24

تمت قراءة ثلاث وثائق تاريخية أخرى **كاملة**، ونقل نسخها الأصلية المطابقة للـblob إلى نفس أرشيف مصادر الكتاب، ثم تحويل المسارات القديمة إلى Redirects قصيرة تحافظ على الروابط القديمة. لم يُحذف أي تاريخ من Git، ولم يتغير أي ملف كود أو Workflow أو Test.

| الوثيقة | كامل الأصل المؤرشف | Blob SHA الأصلي | ما تم استخلاصه للكتاب |
|---|---|---|---|
| `TRENDOS_GO_LIVE_2026-09-01_MASTER.md` | [الخطة التاريخية كاملة](docs/archive/trendos-master-book/2026-09-24/TRENDOS_GO_LIVE_2026-09-01_MASTER.md) | `f102a1ef8b70d4858712cde4e225d5324b58e2b0` | خطة Core الأولى: inventory → integrity foundation → Order/Line → Attendance/Cleaning → Press → Invoice → WhatsApp → Handover/OPS → Dashboard → D1 performance → Regression/E2E. تعليماتها تخص 01/09/2026 Core stabilization وليست خطة إطلاق V1 النهائية في 01/03/2027. |
| `TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md` | [إغلاق RP-07 كاملًا](docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md) | `4388bcd61fc4bc77b14ff1dce76c5bdf943f1206` | لقطة Runtime مؤرخة 12 Sep: `OPEN_CORE_P0_BLOCKERS=0` وجميع مؤشرات P0 المذكورة PASS، مع MASTER/families OFF وعدم منح D1 سلطة كتابة؛ بعدها ترتيب Operator Task ثم Invoice/Material ثم Accounting ثم RP-08. هذه لقطة ناجحة تاريخية، لا تلغي حوادث 19–23 Sep. |
| `CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md` | [تسليم T11 كاملًا](docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md) | `9112278963fb823e5e54c9cccf67addbe244139a` | T11 أغلق Service read: Print/Laser/Press/Service D1-first + Apps Script fallback، `__DEBT__` Apps Script، Worker/Service canary وfrontend cutover PASS في وقتها، ولا Apps Script deploy أو نقل write authority. يشرح أيضًا انتقال 404→401 أثناء propagation واشتراط freshness/heartbeat. |

**قاعدة تفسير هذه الدفعة:** كلمة `PASS` داخل وثيقة تاريخية تبقى مرتبطة بتاريخها واختبارها المحدد. أحدث حادث أو رصد تشغيل يتقدم عليها في وصف الحالة الحالية، مع الاحتفاظ بالنجاح القديم كدليل regression/rollback.

### دفعة الأرشفة الثالثة — تسليم T12 المؤرخ 19 سبتمبر 2026

بعد قراءة الوثيقة التاريخية كاملة، نُسخ أصل `CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md` **حرفيًا** إلى [أرشيف تسليم T12 القديم](docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md)، original blob `89662d847d1950d4176864e9899942f033d6e07c`. أُعيدت قراءة الأصل المؤرشف والتأكد من تطابق **blob SHA والنص بالكامل** قبل اختصار المسار القديم إلى Redirect فيه الكتاب وسجل T12 الحالي والتسليم الحالي. المسار القديم ما زال يعمل، ولم يُحذف من Git history.

**المعلومات التي أُدمجت في الكتاب وسجلت حدودها:** هذه وثيقة **19 سبتمبر** وليست نقطة استكمال حديثة. في ذلك الوقت كان Shadow Create المعزول على GitHub حاصلًا على isolated CI PASS عند commit `b1d506ca076651907e80dd1bce53829b5ba6d89f` وworkflow run `35450375982`؛ وكان كود Cloud Create افتراضيًا OFF، غير مربوط بالـWorker الإنتاجي، ولا يخصص Order ID أو Line ID تجاريًا. نسخة Apps Script المنشورة **Version155** كانت مرصودة من واجهة Executions فقط، ونسخة المصدر الفعلية الدقيقة ظلت غير مثبتة. منع تشغيل Google وCloud كجهتين منفصلتين لتوليد نفس رقم الأوردر كان وما زال حدًا معماريًا حاسمًا. ملاحظة نمو مفتاح `TRENDOS_CREATE_ORDER_V1908_<requestKey>` في Script Properties كانت احتمال سبب quota، **وليست إثبات السبب المنفرد للحادثة الحية**. وثيقة Sep19 قالت إن Production غير متغير في حدود خطوة Shadow-CI القديمة؛ **الحوادث/المزامنة اللاحقة بعد ذلك لها سجل زمني مستقل ولا يجوز مسحها أو استعمال وصف Sep19 كحالة النظام اليوم**. كامل قائمة الملفات والاختبارات وعقد rollback والقيود التاريخية محفوظ بنصه الأصلي في الأرشيف.

### دفعة أرشفة رابعة — تسليم T11 الحالي سابقًا قبل اجتياز مسار Service

تمت قراءة **كامل** الوثيقة التاريخية `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md` (الأصل blob `7df1f1e16094ceadcecacc4554aefd78d22bbcd8`)، وحفظ [النص الأصلي كاملًا في أرشيف T11](docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md) ثم تحققنا مستقلًا من تطابق **SHA والنص كله** قبل تحويل مسار الملف القديم إلى Redirect يحفظ الروابط. لا حذف لبيانات الأعمال أو ملفات الكود أو Git history.

**ماذا تثبت الوثيقة زمنيًا؟** كانت لقطة **ما قبل إنهاء Service T11**: Print/Laser/Press مؤهلة D1-first حينها، وService ما زالت Apps Script. سجلت نتائج T6A/T6B التاريخية وتحويل Auth Session إلى POST وHMAC fingerprints في D1 بدل الخام، ونجاح مطابقة Service المرشحة **35/35** مع 9 استبعادات approved، ثم ثلاث محاولات Canary: خطأ جلسة HTTP 502، محاولة تالية اعترضها login timeout، والأخيرة أعادت 404 سريعًا لمسار Service قبل rollback ناجح، والنسخة المستقرة التي أُعيدت آنذاك `3b819fd3-e73d-46f8-9150-f73c282706ab`. اقتراحها التالي «افحص Service route قبل cutover» **لم يعد خطوة الاستكمال الحالية**: [تسليم T11 COMPLETE المحفوظ](docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md) يثبت نجاح Service canary/cutover بمرحلة لاحقة؛ ثم وقعت حوادث T12/R5 في سبتمبر. الأرقام والنسخ السابقة لا تُعرض بوصفها حالة الإنتاج الآن؛ احتفظ بالتسلسل لفهم السبب والـrollback.

### دفعة الأرشفة الخامسة — وثيقتا TEST T12 بتاريخ 21 و22 سبتمبر

قُرئت الوثيقتان التاريخيتان **بالكامل**، ثم نُسختا نصًا مطابقًا إلى أرشيف GitHub. بعد النسخ أُعيد جلب كل أصل وكل نسخة أرشيفية؛ تحقق التطابق في **SHA والنص الكامل** لكل منهما قبل تحويل المسار القديم إلى Redirect متوافق. الأولى [توقف TEST 21 Sep](docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_TEST_CLOUDFLARE_OWNER_STOP_HANDOFF_2026-09-21.md) (`aad521382a8a4050322add78bea9044d6abba0f4`) والثانية [تسليم exact-key replay 22 Sep](docs/archive/trendos-master-book/2026-09-24/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md) (`fd4eaf2f31a062e1287b6b0ab969e611758f234b`). §8.1 يدمج التعارض الزمني والاختبارات والأخطاء والحدود؛ أما سلسلة النتائج التفصيلية والنسخ وملفات TEST المرجعية فمحفوظة كاملة في الأصلين بالأرشيف. **المجموع: 10 أصول تاريخية مؤرشفة**، مع بقاء دليل التشغيل الحي والـjournal والتسليم الحالي والأكواد والاختبارات في مساراتها؛ لم تُحذف أي معلومة من Git history.

**تغطية الفهرس:** §11 جرد ثابت **1182 ملفًا** عند commit `2ace8ca1750f23c18cad0ec335668286c44f9947`، وليس شجرة حية. وثيقتا أرشيف TEST أُضيفتا **بعد** هذه اللقطة، ومساراتهما التاريخية تحولت لاحقًا إلى Redirect؛ يجب إدراجهما في تجديد Snapshot تالٍ مع فرز الثغرات المتبقية، لا تعديل 1182 صفًا قديمًا زورًا كي تبدو حية. قائمة 1171 السابقة باقية في Git history.

### دفعة الأرشفة السادسة — دليل نجاح Auth Shadow T6B المؤرخ 13 سبتمبر

تمت قراءة [شهادة T6B كاملة](docs/trendos/blackbox/%D9%85%D9%86%D8%B5%D8%A9%20%D8%AA%D8%B1%D9%86%D8%AF/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md) ودمج تاريخها وتسلسل نجاحها/فشل المحاولات والـrollback والحدود في §8.3 (STEP11/Entry191). بعد ذلك نُسخ الأصل الكامل إلى [الأرشيف المعتمد](docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md)، وتحقّقنا مستقلًا من تطابق النص الكامل (4984 حرفًا) وبصمة Git `ee8b3f56de90097c2c2e75c185ac6059dacdcb24` بين المصدر والأرشيف (STEP12/Entry193). أخيرًا اختُصر المسار القديم إلى [Redirect متوافق](docs/trendos/blackbox/%D9%85%D9%86%D8%B5%D8%A9%20%D8%AA%D8%B1%D9%86%D8%AF/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md) يشير للأصل المحفوظ والكتاب وأحدث سجل/تسليم؛ تحققنا من الروابط والأرشيف بعد الكتابة (STEP13/Entry195). **لا حذف لكود أو لتاريخ Git، ولا تشغيل Workflow أو SQL، ولا استنتاج أن نتيجة Sep13 هي حالة الـWorker أو مرآة Orders اليوم.**

**فرق مهم في جرد الملفات:** جدول §11.3 يظل لقطة تاريخية **1184 مسارًا** عند commit `64d89c88dcc7078dc7fa20215c776312fceb3382`. صف مصدر T6B فيه `P:SCOPED_REVIEW` لأن المصدر كان مستندًا وقت اللقطة، **وليس وصفًا لحالته بعد الاختصار**؛ ملف الأرشيف الجديد لم يكن موجودًا وقت اللقطة. أحدث Git tree فُحص بعد إنشاء الأرشيف وأظهر **1185 ملفًا**: إضافة نسخة واحدة إلى أرشيف GitHub، وتحويل مسار قديم واحد إلى Redirect، مع عدم حذف أي مسار؛ لا تحوّل عدد 1184 إلى 1185 داخل صفوف Snapshot القديمة وكأنها كانت موجودة حينها. **الواقع الآن: 11 أصلًا تاريخيًا محفوظًا +11 Redirects** في شجرة تالية لهذه الدفعة وفق سجل الأرشفة؛ ما يزال فهرس §11 القديم يعرض 10+10 عند تاريخ لقطته. يلزم إعادة بناء فهرس Metadata مثبت عند HEAD جديد لمطابقة الـ1185، ومواصلة المراجعة الدلالية لكل ملف، دون خلط تاريخين أو ادعاء إنجاز 100%.

