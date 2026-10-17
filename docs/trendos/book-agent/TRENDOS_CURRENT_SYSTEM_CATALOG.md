# ترند مول | TrendOS — كتالوج المنصة الحالية

<!-- FROZEN_UNIFIED_TRANSITION_NO_AUTO_WRITE_20261016 -->

> ## 🔒 تجميد الكتاب الجديد أثناء النقل — أمر المالك الأحدث
> **الحالة الحالية:** `FROZEN_READ_ONLY_FOR_AGENTS / MIGRATION_ONLY / NO_AUTONOMOUS_EDITS`.
> **كتاب التسجيل الوحيد حاليًا:** [`TrendOS_MASTER_BOOK.md`](../../../TrendOS_MASTER_BOOK.md) على نفس الفرع `agent/trendos-book-audit-v1-20261014`. أي عمل جديد أو إصلاح أو اختبار أو قرار **يُكتب في الكتاب القديم** وليس هنا.
> **يمنع** تحديث فصول هذا الكتاب تلقائيًا أو إضافة تسجيلات أعمال جارية إليه. الاستثناء الوحيد: ترحيل قسم قديم بعملية معلنة، ثم فحص مستقل لمطابقة النص ونسخة أرشيف Git، وبعد النجاح إزالة القسم القديم. عند فشل المطابقة يبقى المصدر كما هو.
> **نقل السلطة النهائي:** بعد الانتهاء الكامل من نقل الكتاب القديم ومصالحة Entry/الأدلة، وبموافقة جديدة من المالك، يُحذف القديم وتتحول الكتابة إلى هذا الكتاب وحده.
> **ملاحظة:** أي عبارة أقدم أدناه تصفه بأنه `ACTIVE_WRITE` أو مرجع التحرير الفوري ملغاة حتى CUTOVER. حماية الكتاب هنا **تعليمات إيحائية/سياسة إيجنت** وليست GitHub branch protection تقنية.

---


> **المرجع الرسمي لتنظيم معرفة المنصة (Canonical Documentation Entry)**
> **الحالة:** `CANONICAL_DOCUMENTATION / PARTIALLY_VERIFIED / NOT_PRODUCTION_CERTIFIED`
> **قرار المالك:** 16 أكتوبر 2026. تم اختيار هذا الكتاب مرجعًا أساسيًا للوظائف الموجودة حاليًا، مع استمرار مراجعة الأدلة. لا يحوّل اعتماد الكتاب وظيفةً غير مثبتة إلى وظيفة منشورة، ولا يخول حذف ملفات أو دمج فروع أو تغيير التشغيل.

## أمر المالك الملزم: كتاب TrendOS واحد فقط — سياسة الأرشفة التدريجية (2026-10-16)

> **OWNER DIRECTIVE — ONE_BOOK_ONLY / MOVE_VERIFY_REMOVE_OLD / PRESERVE_GIT_ARCHIVE.**
> هذا الأمر أحدث ويلغي كل تعليمات «ثلاثة كتب معتمدة» السابقة داخل الوثائق. المرجع التحريري الوحيد لتوثيق TrendOS هو **هذا الملف**؛ لا تُنشأ كتب TrendOS أخرى. لا يشمل ذلك ملفات الكود والاختبارات والسجلات التقنية اللازمة للتشغيل، ولا كتب المشاريع المستقلة المملوكة لها.

**قواعد تنفيذ الأرشفة (إلزامية لكل إيجنت):**

1. **MOVE:** انقل أي جزء قديم من الكتب القديمة إلى الفصل المناسب في هذا الكتاب، أو إلى **ملحق تاريخي داخل نفس الكتاب** إن كان قرارًا أو كودًا متوقفًا أو قصة نقل. حافظ على النص الأصلي أو بصمته مع مصدر Git/SHA؛ لا تضع معلومة قديمة تحت عنوان «LIVE» دون إثبات.
2. **VERIFY:** اقرأ المصدر القديم والجزء الجديد مستقلين من أحدث HEAD، وقارن النص أو البصمة كاملة، وثبت رابط الاسترجاع من فرع الأرشيف `archive/trendos-books-before-single-book-20261016` قبل الحذف. إن فشلت المطابقة أو تعارض HEAD، لا تحذف.
3. **REMOVE OLD AFTER VERIFIED:** **احذف الجزء المنقول من الكتاب القديم فورًا بعد تحقق اكتمال النقل**، دون ترك نسختين تحريريتين من الحقيقة. وعندما ينتهي محتوى كتاب قديم وتُنقل كل أجزائه وتثبت سلامتها، **احذف ملف الكتاب القديم بالكامل**. لا تُحذف ملفات المصدر التشغيلي ولا أرشيف Git.
4. **ONE CANONICAL BOOK:** لا تنشئ ملف «كتاب» أو «كتالوج» بديلًا أو مسودة جديدة. سجل النقل والمطابقة والـSHA وقرار إزالة النص القديم في نفس الكتاب وفي سجلات التنفيذ غير المعتبرة كتبًا؛ الروابط القديمة التاريخية تُعاد توجيهها عند مراجعتها إلى الكتاب الموحد أو Git archive.
5. **SAFETY:** يمنع نشر مصدر خاص/أسرار أو بيانات عميل؛ ويمنع دمج PR أو النشر أو حذف أي كود تشغيلي ضمن مهمة توحيد الكتب. `FULLY_VERIFIED` و`PRODUCTION_VERIFIED` لا يستنتجان من نجاح نقل الوثائق.

**نسخة الاسترجاع المستقلة قبل التوحيد:** [Git archive snapshot](https://github.com/fawakhry/TrendOs/tree/archive/trendos-books-before-single-book-20261016) عند commit `b2788ecb4c187717e020321954a1ea449c1aa0d5`. يظل فرع `archive/trendos-before-legacy-cleanup-20261016` الأقدم محفوظًا كذلك. **الهدف النهائي: ملف كتاب TrendOS واحد فعليًا؛ أما الفهرس/سجل الإجراءات فملفات تشغيلية مساعدة لا كتب.**

---

## بيانات النسخة المعتمدة للتوثيق

- **المستودع:** `fawakhry/TrendOs` — **فرع تأليف ومراجعة:** `agent/trendos-book-audit-v1-20261014`.
- **المصدر المحافظ عليه:** [`TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md`](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md)، Git blob SHA `acded3ba6729eb7f0a5fd8de560ae5091d630b88`، بجميع فصوله **31/31** وبلا حذف للأحكام أو أدلة المصدر أو المشكلات.
- **فحص الإنشاء:** 31 عنوان فصل رئيسي متسلسل من 1 إلى 31 دون تكرار؛ 11 رابطًا داخليًا نسبيًا تم فحصها وكانت 11/11 موجودة في شجرة فرع العمل وقت الترويج. هذه **سلامة بنية وثيقة فقط**، وليست فحص وظائف إنتاجية أو سلامة كل روابط الويب الخارجية.
- **مرجع التاريخ والتغييرات:** [`TrendOS_MASTER_BOOK.md`](../../../TrendOS_MASTER_BOOK.md) (السجل الفني والقرارات/الإصدارات، وليس بديلًا عن كتالوج وظائف اليوم).
- **أصل المنصة القديم:** [`TRENDOS_LEGACY_PRE_SPLIT_BOOK.md`](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) مع [`LEGACY_SOURCE_RECOVERY_REGISTER.md`](LEGACY_SOURCE_RECOVERY_REGISTER.md) و[`GITHUB_LEGACY_CLEANUP_PLAN.md`](GITHUB_LEGACY_CLEANUP_PLAN.md). لا تُدرج الأكواد القديمة كوظائف حية لمجرد وجودها.
- **كتالوج الاختبارات:** [`CURRENT_TEST_EVIDENCE_LEDGER.md`](CURRENT_TEST_EVIDENCE_LEDGER.md)، **قائمة التحقيق** [`TEST_EVIDENCE_QUEUE.md`](TEST_EVIDENCE_QUEUE.md)، و**الأخطاء** [`ISSUE_REGISTER.md`](ISSUE_REGISTER.md)، **السجل** [`AGENT_LOG.md`](AGENT_LOG.md).

**تحديث 16 أكتوبر 2026:** أضيف الفصل **32** لأمان ملفات Cloudflare/R2 وخادم الطباعة المحلي، بتصنيف `SOURCE_ONLY` وربط البلاغات الموجودة لا مضاعفتها. أصبحت الفصول **1–32**؛ الـ31 فصلًا الأولى من المسودة المحفوظة دون فقد.

**بوابة عدم فقد المعرفة عبر الكتب:** [الباب الواحد](TRENDOS_BOOKS_SINGLE_INDEX.md) و[سجل 66 Entry/165 عنوان قسم مفتوحين للمصالحة](BOOKS_NO_LOSS_CROSSWALK_V1.json). الفصول الـ31 المنقولة من المسودة محفوظة متطابقة نصيًا في نطاقها المشترك (213,981 حرفًا)؛ لا يعني ذلك مصالحة سجل التطوير أو اكتمال تغطية كل ملفات المنصة. لا يُسمح بوصف الكتالوج `FULLY_VERIFIED` حتى تُغلق الفجوات بالدليل.

## قواعد الاعتماد على هذا الكتاب

1. **هذا الملف هو مدخل المعرفة الرسمي لمنصة TrendOS الحالية**. مضمونه يُحدَّث بأدلة مراجعة على أحدث HEAD، مع حفظ النسب إلى Commit وملفات التشغيل/الاختبار. لا يُمنح أي فصل ختم `PRODUCTION_VERIFIED` إلا بربط نسخة النشر والفحص الفعلي في البيئة الصحيحة.
2. **مرتبة الدليل:** `PRODUCTION_VERIFIED > DEPLOYED_VERSION_VERIFIED > TESTED_EXACT_SHA > SOURCE_ONLY > HISTORICAL > UNKNOWN/BLOCKED`. وكل حكم في فصل يظل محددًا بزمان ومصدر إثباته، ولا يتحول تلقائيًا إلى حكم على آخر HEAD.
3. **الفصول 1–31 منقولة بأمان من المسودة الأصلية**؛ بعضها تحليل مصدر وتوصيف مشكلات تاريخية؛ لا تعتبر العناوين أو أمثلة الإصلاح شهادة تشغيل، ولا تساوي اختبارات Fake نجاح مسار حي.
4. **أي تطوير جديد:** تُراجع أحدث الحالة الفعلية ومستندات الإصلاح، ثم يُحدَّث الكتالوج الحالي. يُسجَّل القرار والتاريخ في `TrendOS_MASTER_BOOK.md` حين تكون صلاحية تعديل الكتاب متاحة، ولا يُمسح التاريخ في Git.
5. **ملكية المشاريع المنفصلة:** تُربط EasyStore وMatbagy-OS والمطبعة الذاتية وFokha وUbuntu بكتبها، ويُوثّق في هذا الكتاب **مكان التكامل القائم بالدليل** لا يُنسخ الكتاب المستقل ولا يُوصف المخطط كمنشور.
6. **نطاق الصلاحيات:** `DOCUMENTATION_ONLY` لهذا الاعتماد؛ `NO_DELETE`، `NO_FORCE_PUSH`، `NO_MERGE`، `NO_DEPLOY`، `NO_PRODUCTION_MUTATION`.

## شروط اكتمال الكتالوج

هذه **لم تُغلق بعد**: فحص شامل لكل ملفات الواجهة الديناميكية والاستدعاءات، ضبط مراجع الاختبارات على SHA/CI الموافق، حصر كتاب/قارئ كل بيانات حية، التأكد من عدم وجود روابط مكسورة، تطابق النسخة المنشورة والاختبار، حسم القضايا المفتوحة، وموافقة نهائية على اكتمال المعرفة. يصبح وصف الكتاب `FULLY_VERIFIED` فقط بعد أدلة مستقلة لهذه البوابات.

---
# فهرس الأبواب

1. **الغلاف وتعريف النسخة وحالة الأدلة**
2. **من يستخدم النظام: الأدوار والشاشات والصلاحيات**
3. **الواجهة الحالية: سجل كل عنصر وزر وحقل**
4. **مسار التشغيل التقني: Frontend وAPI وData**
5. **فهرس أكواد النظام الحالي ومُلاكها ووظائفها**
6. **قواعد البيانات والكتّاب والقراءة والتبعيات**
7. **كتالوج الاختبارات: الناجح والفاشل والمتوقف**
8. **الأعطال الحالية المعروفة وخطة التشخيص والإصلاح**
9. **إعداد التشغيل والنسخ المعتمدة والاستعادة**
10. **سجل التغطية الكامل وإثبات عدم إسقاط أي جزء**

**الملاحق المحكمة داخل فرع إعداد الكتالوج:**
- [جرد كل ملفات Git بالـSHA](CURRENT_TREE_BASELINE.md): جرد حقيقي للشجرة مع حالات مراجعة محتوى غير مكتملة.
- [كل عناصر واجهة HTML ثابتة](CURRENT_UI_ELEMENT_INDEX.md): يشمل `id` والوسم والسطر، ويرصد فجوة العناصر الديناميكية.
- [ربط الـ97 زرًا بمراجع الـJavaScript](CURRENT_UI_HANDLER_LINKS.md): تطابق ثابت مع app.js، وليس إثبات تشغيل حي.
- [سجل كل ملفات الاختبار ونتائج التشغيل](CURRENT_TEST_EVIDENCE_LEDGER.md): 256 ملف اختبار عند snapshot، يتضمن الفشل والنجاح كوقائع مستقلة، وما لم يُراجَع بعد.
- [قائمة مصالحة اختبارات المصدر المرشح](TEST_EVIDENCE_QUEUE.md): لا تعني أن كودها منشور حيًا.
- [سجل دورات التدقيق](AGENT_LOG.md): ماذا قُرئ وما ثبت وما لم يثبت.

---

# 1. ما يُعد «حاليًا» في هذا الكتاب

| حالة الإثبات | تعريفها | هل تظهر كوظيفة حالية؟ |
|---|---|---|
| `LIVE_VERIFIED` | فحص runtime مؤرخ، والنسخة المنشورة مطابقة، والتحقق من فعل الوظيفة/مسارها | نعم، مع تاريخ الدليل |
| `LIVE_HEALTH_ONLY` | Health GET حقيقي يؤكد الجاهزية أو flags؛ لا يثبت business flow بالكامل | نعم لكن بحكم محدود |
| `REPO_PRESENT` | ملف كود أو UI موجود في branch، لكن لا توجد مطابقة مثبتة إلى المنشور | مرشح للتحقيق فقط |
| `SOURCE_ONLY_OFF` | كود معزول أو flag=OFF أو PR Draft غير مدموج | لا، يُفصل خارج وظائف التشغيل |
| `RETIRED_CONFIRMED` | دليل مثبت أن الخاصية خرجت من الاستخدام ولا يوجد consumer حي | لا يظهر في المتن؛ يبقى في تاريخ Git |
| `UNKNOWN/BLOCKED` | دليل لم يتوفر أو متضارب أو يحتاج صلاحية خاصة | فجوة معلنة، لا اختراع |

**أولوية الأحكام:** latest verified live behavior → deployed build parity → exact source test → static code → historical notes. **لا نحذف شيئًا من مصدر الإنتاج اعتمادًا على أسماء الملفات أو تاريخ سابق.**

## نطاق النظام

- الواجهة الرئيسية لـTrend Mall/TrendOS، صفحات الدخول، وظائف العاملين وخدمة العملاء والطباعة والليزر، الأدوات الملحقة، API endpoints والـWorkers التي تدعمها **بقدر ما يثبته مصدرها الحي**.
- الروابط الخارجية مثل EasyStore أو مطبعجي Files تُوثّق من جهة **تكامل TrendOS الحالي فقط**؛ لا تُستبدل كتب أو مستودعات منتجات أخرى ولا تُنسخ كل أكوادها في هذا الكتاب.
- العميل/بوابة العميل تُذكر وظائفها القائمة فقط؛ أي واجهة غير موصولة في Production، أو مخطط مؤجل أو شروط أمان غير مستوفاة، لا توصف بأنها وظيفة قائمة.

# 2. شاشات الواجهة والأدوار: أول فحص مباشر

**مصدر الـHTML:** [`index.html` عند commit الجرد](https://github.com/fawakhry/TrendOs/blob/bd39647598ec33853181dea8632064d5586404ca/index.html)؛ blob `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1`.  
**مصدر أدوار التشغيل في الكود:** [`app.js`](https://github.com/fawakhry/TrendOs/blob/bd39647598ec33853181dea8632064d5586404ca/app.js)؛ blob `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`.

## بوابة الدخول الموجودة في الـHTML
- `entryView`: زر `employeeEntryBtn` «دخول الموظفين» وزر `customerEntryBtn` «دخول العملاء».
- `loginView`: حقلا `username` و`password`، زر `loginBtn` وزر العودة.
- `customerLoginView`: حقلا `customerCode` و`customerPassword` وزر `customerLoginBtn` وزر العودة. **الوجود في HTML لا يثبت تفعيل customer-native portal في runtime**.
- `mainView`: أزرار `refreshBtn` و`remoteFilesBtn` و`matbagySheetsBtn` و`matbagyRotetBtn` و`matbagyNoteBtn` و`accountingBtn` و`endDayBtn` و`urgentNotificationsBtn` و`changePassBtn` و`logoutBtn`.
- `tabs`: منطقة تنقل تُملأ ديناميكيًا، ويجب تدقيق مسارات JS والصلاحيات قبل وصف جميع التبويبات.

## الأدوار في جزء مصدر `app.js`
- `admin`: `service / print / laser`.
- `service`: `service`؛ `print`: `print`؛ `laser`: `laser`.
- `press`: يُوجّه إلى `print` داخل جدول `roleScreens`، وليس شاشة مستقلة في هذا الجزء.
- الحالات المعرّفة في المصدر: `طلب جديد`، `بدأ التنفيذ`، `تحت التنفيذ`، `جاهز للاستلام`، `تم التسليم`، `متوقف`، `مكرر`، `ملغى`؛ جزء آخر يحدد الحالات التي تُخفى من شاشات المستخدمين.
- `REFRESH_MS=0` في مقدمة هذا المصدر؛ **لا نستنتج أن كل وحدات المنصة بلا تحديث تلقائي**، إذ قد تمتلك مؤقتات أخرى.
- هذه نتائج **مراجعة مصدر الكود** وليست شهادة صلاحيات أو UI runtime شاملة.

## تغطية عناصر الواجهة الفعلية
بالفحص الثابت لـ`index.html` جرى اكتشاف **479 عنصرًا يحمل id** دون تكرار ID ظاهر: **97 button، 180 input، 54 select، 29 section، 4 textarea**، وغير ذلك من العناصر. [فهرس كامل لكل عنصر](CURRENT_UI_ELEMENT_INDEX.md). طوبقت الـ97 زرًا مع مراجعها داخل `app.js` مبدئيًا: **57 لها نمط ربط حدث مباشر مرصود، و40 لها مراجع مصدر تحتاج تدقيقًا أعمق**. لم تُثبت صلاحيات المستخدم، API route، Data writer، واختبار ورؤية المستخدم لهذه الأزرار في runtime. **لا يجوز وصف هذا الباب كمكتمل**.

# 3. تكوين واتصال أجزاء النظام: مصادر فقط

**مصدر التكوين:** [`config.js`](https://github.com/fawakhry/TrendOs/blob/bd39647598ec33853181dea8632064d5586404ca/config.js)؛ blob `8b83d9afd53d9c7fc95d9fb309ec0bfa350121d2`.

| وظيفة | الملاحظة المباشرة من المصدر | مستوى الثبوت |
|---|---|---|
| API base | `MATBAGY_EDGE_ORDERS_API_URL` يشير إلى `trendos-d1-api.trendmall-contact.workers.dev` | SOURCE_ONLY حتى التحقق من live config/deploy |
| Employee API | `MATBAGY_EMPLOYEE_API_URL` يشير إلى نفس Edge URL | SOURCE_ONLY |
| Native auth | `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true`، `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false` في الملف | SOURCE_ONLY؛ انظر health below |
| Operational modes | `OPS=GENERAL`، `CORE=GENERAL`، `ACCOUNTING/CONTENT/COMMS=READONLY` حسب flags المصدر | SOURCE_ONLY + health corroboration مؤرخ |
| شاشة الأقسام | `MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS=['print','laser','press','service']` | SOURCE_ONLY، تخضع لفحص runtime |
| ملفات مطبعجي | `MATBAGY_FILE_SERVER_URL` مسجل | تكامل كود؛ صلاحيات/اعتمادية مجهولة |
| الحسابات | `MATBAGY_USE_EASY_STORE_FOR_ACCOUNTING=true` | تكامل معلن في كود TrendOS؛ لا دليل معاملات مالية هنا |
| صفحات وأدوات خارجية | URLs للـSheets/Rotate/Tools موجودة في التكوين | لا نفترض أنها فعّالة لكل مستخدم |
| Legacy line mode | `MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED=true` | SOURCE_ONLY ثم تحقق deployed عند الحاجة |

**أحدث إثبات عام محدود وصلنا إليه:** [GitHub Actions health #38314577511](https://github.com/fawakhry/TrendOs/actions/runs/38314577511) في 12 أكتوبر 2026 UTC (13 أكتوبر بتوقيت القاهرة): `status=completed`, `conclusion=success`، run head `c6eeba7ee4fe8c08ef045bc757fb9c104865aa48`. سجل Entry656 يقول إنه public GET-only، ويعرض Native Auth/OPS/CORE وread-only family flags. **هذا يثبت health كما رُصد وقت التشغيل، لا يُثبت استكمال كل سيناريو أعمال أو أن نسخ المنظومة ما تغيرتش بعده.**

# 4. دليل الأكواد والتغطية — خط الأساس

**لقطة Git tree مثبتة:** `bd39647598ec33853181dea8632064d5586404ca`، `truncated=false`، **1995 ملفًا + 75 مجلدًا**. كل ملف موجود في [جرد المسارات والـBlob SHA](CURRENT_TREE_BASELINE.md). هذا **ليس ادعاءً بقراءة محتوى كل الملفات**.

| فئة حسب مكان الملف فقط | الملفات | حكم التغطية |
|---|---:|---|
| Code/config candidates | 291 | يجب فحص استيرادها ووظيفتها ورمزها المنشور |
| Workflows | 409 | يجب فحص التفعيل والخطر ونتائج كل run مرتبط بوحدة حية |
| Tests | 256 | يجب ربط كل اختبار بكود/إصدار/CI outcome/failures |
| Migrations | 29 | الوجود لا يثبت أن أي migration طُبِّقت |
| Accounting boundary | 12 | تحقق تكامل TrendOS فقط، مع فصل المنتج المستقل |
| Documentation/history | 762 | خارج متن التشغيل إلا إذا احتوى دليلًا حاضرًا مؤثرًا |
| Separate-project subtree | 233 | خارج نطاق كتالوج TrendOS، إلا اعتماد تكامل محدد |
| Cross-project notes | 3 | خارج نطاق كتالوج التشغيل الحالي |

**قاعدة «كل الأكواد»**: لا يكفي إرفاق اسم الملف. لكل وظيفة حيّة يلزم `UI event → JS caller → API endpoint → authorization → data read/write → return/error → test/run → observability → rollback` مع بصمة الكود ورابطه. **الفجوة الحالية:** لم تُراجَع جميع علاقات القراءة/الكتابة والـimports؛ التعداد 1995 ينفي سقوط الملفات من *جرد المصدر* فقط، ولا ينفي سقوط وظيفة من *الكتالوج* بعد.

# 5. الاختبارات بما فيها الفاشل — أول سجل مراجعته

| الحالة | الاختبار / الدليل | ماذا ثبت | ماذا لا يثبت |
|---|---|---|---|
| **PASS** | [Public API health run #38314577511](https://github.com/fawakhry/TrendOs/actions/runs/38314577511) | `success` على SHA `c6eeba7e...` وفق Actions API | اختبار طلب تجاري متكامل أو parity لكل API |
| **FAIL** | [OTP sandbox run #38316884906](https://github.com/fawakhry/TrendOs/actions/runs/38316884906) | `failure` على SHA `a091a031...` | لا نعتبره فشل Production؛ الـsandbox غير منشور |
| **PASS after earlier FAIL** | [OTP sandbox run #38316935044](https://github.com/fawakhry/TrendOs/actions/runs/38316935044) | `success` على SHA `27224488...` | لم يثبت exact-head PASS لـDraft #130 أو نشر OTP |
| **PASS (source only)** | [OTP SQL offline run #38316390798](https://github.com/fawakhry/TrendOs/actions/runs/38316390798) | `success` على SHA `461fd92c...` | ليس اختبار D1 إنتاجية |

**فصل مهم:** صفوف OTP تخص أعمال كود مرشح **غير موصول حاليًا في Production**؛ موجودة هنا فقط في سجل جودة الاختبارات حتى لا يختفي فشل معروف. **لا تُعرض ضمن خدمات النظام الحالية**. سبب فشل regex المذكور في PR يحتاج Log proof مستقل؛ لم يُثبَّت من سجل jobs في هذه الدورة.

**شروط كل صف اختبار تالٍ:** `Test ID, code SHA, environment, test case, expected, actual, run ID, time, PASS|FAIL|BLOCKED|UNKNOWN, cause/root-cause confidence, fix, re-run SHA, pending regression, book section`. لا يُختصر فشل إلى PASS لاحقًا: كلا الحدثين محفوظان.

# 6. طريقة قراءة الكتالوج والتعامل مع العطل

1. افتح هذا الغلاف وحدد الشاشة أو العملية أو رسالة الخطأ.
2. اتبع عنصر الواجهة إلى كود المصدر والـAPI والجدول/المصدر الذي يستخدمه على نفس الـHEAD.
3. استخدم أحدث دليل Runtime خاص بنفس البيئة والتاريخ؛ لا تستنتج نجاحًا من ملف موجود أو CI لمشروع مرشح.
4. اعرض تاريخ الاختبارات **المؤثر في نفس الوظيفة الحالية** بما فيه الفشل، خطأ الإصلاح، فحصه، ومخاطر الإعادة.
5. عند `UNKNOWN`: وثق الفجوة وتوقف عن أي فعل إنتاجي؛ المراجعة هنا قراءة وكتابة وثائق فقط.

# 7. ما لم يُنجز بعد — شروط عدم إعلان الاكتمال

- لم تُراجع كل محتويات الملفات الـ1995؛ سجل المجلدات يعزل التاريخ وغير المتعلق ويحتاج اعتماد تصنيف لكل عنصر.
- لم يُراجع كل listener وdynamic UI node أو كل endpoint/role/data writer.
- لم يُطابَق كل test file مع كل CI run وكل fail/fix/exact-HEAD.
- لم يُجر فحص read-only مستقل لكل نسخة إنتاج منشورة وكل قناة بيانات.
- يلزم استكمال فصول الوظائف/البنية/البيانات/الاختبارات/الأعطال **ثم** مراجعة بشرية شاملة قبل استبدال `TrendOS_MASTER_BOOK.md` الأصلي.

> **وضع العمل الآن:** `COVER_CREATED; TREE_BASELINE_INVENTORIED; STATIC_UI_INVENTORIED; FIRST_TESTS_VERIFIED; CODE_CONTENT_COVERAGE_OPEN; RUNTIME_PARITY_OPEN; CATALOG_COMPLETE=NO`.


---

# 8. تدقيق محدد: قواعد عرض الأقسام والحالات في واجهة الموظف (16 أكتوبر 2026)

**نطاق الإثبات:** قراءة الأسطر 1–145 من [app.js عند لقطة المصدر](https://github.com/fawakhry/TrendOs/blob/bd39647598ec33853181dea8632064d5586404ca/app.js)، بصمة الملف `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`. هذا وصف لسلوك الدوال المكتوبة، **وليس** إثباتًا لصلاحيات الخادم أو النسخة المنشورة.

| القاعدة | ما يقرره المصدر | ما لا يثبته |
|---|---|---|
| عرض الأقسام حسب الدور | المدير يرى خدمة العملاء والطباعة والليزر؛ كل دور متخصص يرى قسمه؛ دور المكبس القديم يُعرض تحت الطباعة | أن الخادم يمنع طلبات خارج صلاحية المستخدم، أو أن القائمة المنشورة مطابقة |
| الحالات المتاحة في قائمة المصدر | طلب جديد، بدأ التنفيذ، تحت التنفيذ، جاهز للاستلام، تم التسليم، متوقف، مكرر، ملغى | أن كل انتقال حالة مسموح، أو أن التخزين يقبلها كلها |
| الحالات المخفية من شاشات التشغيل | جاهز للاستلام، تم التسليم، مكرر، تم التنفيذ، جاهز للطباعة، ملغى | أن السجلات محذوفة من قاعدة البيانات؛ الإخفاء في الواجهة ليس حذفًا |
| أولوية الفرز | عاجل وVIP قبل عادي ثم مؤجل؛ قيمة غير معروفة تأخذ رتبة متأخرة | أن كل شاشة تستخدم هذا الفرز |
| إظهار اختيار المكبس | عند اختيار قسم «طباعة» أو «متعدد الأقسام»؛ إخفاؤه يلغي تحديده في الواجهة | أن الطلب حُفظ أو عُدّل على الخادم |
| إظهار «طباعة على الطاير» | مشروط بأن يكون القسم «طباعة» | أن الخاصية متاحة في الإنتاج أو أن مسار الحفظ مكتمل |
| حفظ علامة الطباعة السريعة | إذا غاب الحقل من بيانات التحديث وكان بند معروف بنفس `lineId` معلّمًا سابقًا، تحتفظ الدالة بالعلامة في الذاكرة | أن التزامن بين الأجهزة أو استمرارية قاعدة البيانات مضمون |
| فحص المديونية داخل المصدر | `hasDebt` يعتبر علامة المنع أو مبلغ الدين الموجب مؤشرًا على وجود مديونية | أنه بوابة صلاحية كافية وحده للسماح بالتسليم |

**فجوات واجبة قبل ترقية الإثبات:** تحديد مواضع استدعاء كل دالة، ربط الأزرار والطلبات بمسارات الخادم، التحقق من صلاحيات الخادم وتخزين الحالات، مطابقة بصمة النسخة المنشورة، وربط كل قاعدة باختبار ذي نتيجة مثبتة على نفس النسخة. **الحالة: SOURCE_ONLY / التغطية غير مكتملة.**


---

# 9. تدقيق محدد: حالة الجلسة والصلاحيات المحلية وإدخال الأوردرات (16 أكتوبر 2026)

**مصدر القراءة:** [app.js](https://github.com/fawakhry/TrendOs/blob/agent/trendos-book-audit-v1-20261014/app.js) الأسطر 145–330، blob `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`، على فرع إعداد الكتاب. **SOURCE_ONLY**: فحص نص الكود، دون تشغيل واجهة أو اعتماد خادم.

## 9.1 طباعة على الطاير
- `updateFlyPrintVisibility` يُظهر الاختيار لقسم الطباعة فقط؛ عند إخفائه يلغي علامة الاختيار ويستدعي `syncFlyPrintRules`.
- `syncFlyPrintRules` يفرض قيمة الأولوية «عاجل» ويعطل تعديل حقل الأولوية حين يكون الاختيار مفعلًا مع قسم الطباعة، ويعرض نص «طباعة على الطاير = عاجل والتسليم نفس اليوم».
- **حد الإثبات:** قاعدة واجهة محلية، ولا تثبت أن السيرفر يحفظ أولوية عاجل أو موعد تسليم في نفس اليوم، أو أن القاعدة مطبقة في كل نقاط الإدخال.

## 9.2 الحالة المحلية وقراءة الأوردرات
- كائن `state` يحتفظ بـ`user` و`screen` و`rows`، وحقول تحكم في الحفظ والأرشفة وتغيير الحالات بالجملة.
- `serverPaging` يبدأ مفعّلًا بصفحة 1 وحجم صفحة 5، وحقول لعدد الصفوف والصفحات؛ توجد عدادات للحالات والملخص النشط.
- توجد حالات محلية مستقلة لبوابة العميل، المحادثات، الإعلانات، السوق، الفروع، والفواتير والمواد، لكن **وجود المفاتيح لا يثبت تفعيل خدماتها في الإنتاج**.
- الكود يكشف مرجع الكائن على `window.state` و`window.trendosState` للتكامل مع ترقيعات متأخرة؛ لا يثبت هذا بمفرده سلامة الجلسة أو صلاحيات الخادم.

## 9.3 أدوار الموظفين وصلاحيات الواجهة
- `safeRole` يرجع الدور المعروف، وإلا يرجع `service` كقيمة افتراضية **داخل الواجهة فقط**.
- `canAddManualOrder` و`canCodeCustomers` يسمحان وفق المصدر بدور `admin` أو `service` أو مطابقات اسم مستخدم محددة.
- `isEmployeeLoggedIn` يفحص وجود اسم مستخدم أو اسم أو دور داخل الكائن المحلي؛ **ليس إثباتًا لصحة توكن أو جلسة موثقة من الخادم**.
- توجد دوال مطابقة أسماء مستخدمين بعد توحيد بعض الحروف العربية؛ المطابقة تعتمد على الاسم المعروض وليست وحدها آلية authorization موثوقة. **فجوة مراجعة أمنية:** التأكد من أن API يفرض صلاحيات مستقلة عن هذه الشروط المحلية؛ لا يُستنتج وجود ثغرة فعلية قبل فحص الخادم.

## 9.4 تطبيع المدخلات
- `normalizeArabic` يوحّد اختلافات أحرف عربية ومسافات لتسهيل مطابقة أسماء الواجهة.
- `escapeHtml` يستبدل رموز HTML الحساسة في النص المعروض؛ يجب مراجعة جميع مواضع استخدامه قبل تقرير حماية شاملة من حقن HTML.
- `arabicDigitsToEnglish` يحوّل الأرقام العربية إلى إنجليزية، و`whatsappPhone` يطبع بعض أنماط أرقام الهاتف المصرية؛ **لم يُفحص هنا إرسال أي رسالة أو صلاحية استخدام الرقم**.

## 9.5 جدول التغطية التالي
| عنصر يحتاج تتبعًا | اختبار الإثبات المطلوب | الحالة |
|---|---|---|
| إنشاء أوردر يدوي | UI handler → API auth → writer → اختبار على SHA مطابق | OPEN |
| تكويد عميل | UI handler → API auth → writer → اختبار على SHA مطابق | OPEN |
| قاعدة «طباعة على الطاير» | handler والحفظ والموعد الفعلي على السيرفر | OPEN |
| serverPaging | طلب الصفحات، ثبات snapshot، وعدم فقد/تكرار البنود | OPEN |
| الجلسة | التحقق من التوكن والـrole على الخادم، لا الاعتماد على الاسم | OPEN |

**النتيجة:** تم توثيق سلوك مصدر إضافي دون تعديل كود المنتج. لا إعلان باكتمال التغطية أو اعتماد التشغيل.


---

# 10. تتبع إنشاء الأوردر اليدوي: UI → API → Authorization → D1 (16 أكتوبر 2026)

**لقطة المصدر:** فرع `agent/trendos-book-audit-v1-20261014`، HEAD عند بدء التدقيق `d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde`. **الحكم: SOURCE_ONLY**؛ لم تُرسل طلبات إنشاء، ولم تُقرأ/تُغيَّر D1 إنتاجية، ولم يُثبت تطابق الحزمة المنشورة مع الفرع. الرابط إلى المصدر المثبّت في كل خطوة أدناه.

## 10.1 الوظيفة ومدخل الواجهة
- [`index.html` سطر 734](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/index.html#L674-L735): زر `createOrderBtn` تحت نموذج الأوردر؛ القسم، العميل، وصف البند، الكمية، الأولوية، المكبس، و`newFlyPrint`.
- [`app.js` الأسطر 293–304 و4305–4309 و7522–7537](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L7520-L7538): `canAddManualOrder` هو شرط عرض بطاقة الإضافة في **الواجهة** (مدير/خدمة عملاء أو مطابقة مستخدمين بعينهم)؛ الزر مربوط بـ`createOrder`، واختيار قسم الطباعة يضبط ظهور خيار الطاير.
- [`app.js` الأسطر 5835–5964](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L5835-L5964): يجمع `clientRequestId`، وضع عميل مسجل/خارجي، رقم واتصال العميل، القسم، `heatPress`، `flyPrint`، الأولوية والحالة والبند والكمية؛ يرفض بيانات محلية ناقصة، ويمنع الضغط المكرر مؤقتًا بـ`createOrder._busy`. ثم ينفذ `api("createManualOrder", params)`. إذا استُخدم `forceCreate` بعد تحذير واجهة، فلا يعني ذلك قبول الخادم لهذا الحقل؛ يجب الاحتكام إلى الـpayload النهائي.
- [`app.js` 1446–1451 و1478–1484](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L1446-L1484): `authParams` يضيف `username` و`token` من جلسة الموظف؛ **هذه بيانات مدخلة من المتصفح وليست authorization بذاتها**.

## 10.2 طبقة التوجيه والاتصال
- [`employee-api-dispatcher-v1.js` 120–126](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/employee-api-dispatcher-v1.js#L120-L127) يضع `createManualOrder` ضمن `CLOUD_EDGE_ACTIONS`؛ [`trendos-edge-orders-read-v1.js` 907–954](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L907-L955) يعترض الـaction **إذا ثُبّت الـwrapper وكان الـflag مناسبًا**، يتحقق من مطابقة العميل المسجل، ثم يستدعي `t12CreateManualOrder`. لا يوجد fallback إلى Apps Script لإنشاء أوردر جديد في الفرع المرصود.
- [`trendos-edge-orders-read-v1.js` 633–658 و755–822](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L755-L822): قبل `POST /v1/t12/orders/create` يقرأ `GET /v1/t12/orders/create/health`؛ وضع `OFF` يفشل مغلقًا، ويتطلب `schemaReady`. يحوّل مفتاح الطلب لصيغة Cloud، يحتفظ بمفتاح محاولة غير محسومة في `sessionStorage` لإعادة التحقق دون تكرار، ويبني `safeT12CreatePayload` لا يضم `username/token` أو `forceCreate`. يرسل `Bearer` session token؛ عند 401 قد يُجدّد التوكن ويعيد طلبًا واحدًا؛ أخطاء الشبكة الملتبسة لا تُعاد تلقائيًا.
- [`trendos-edge-orders-read-v1.js` 385–406](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L385-L406): يصدر Bearer بعد `POST /v1/edge/orders/session`. [`edge-orders-read-v1.mjs` 130–162](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/edge-orders-read-v1.mjs#L130-L162) يحتوي في هذا المصدر تحقق موظف upstream عبر `APPS_SCRIPT_API_URL` قبل إصدار token يتضمن `sub/role/screens`. وجود Native Auth في ملفات أخرى **لا يثبت إلغاء هذا الاعتماد من كل المسارات أو من الإنتاج**؛ نقطة مصالحة مهمة مع قرار Zero Google.
- [`cloudflare-d1/wrangler.toml`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/wrangler.toml): مدخل مصدر Worker هو `production-shadow/index.js` الذي يستدعي `src/index_v2.js`؛ [`index_v2.js` 149–157](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/index_v2.js#L149-L157) يوجه مسار الإنشاء إلى `handleT12GeneralCreateRequest`. هذا **مسار imports في المصدر** لا شهادة بأن Wrangler نُشر بنفس SHA.

## 10.3 الخادم: المصادقة والسياسة ومنع التكرار
- [`t12-general-create-handler.mjs` 29–38 و91–153](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create-handler.mjs#L91-L153): يتحقق من توقيع ومدة Bearer عبر `verifyOrdersEdgeToken`؛ يرفض غياب `sub` وأدوار `customer/client`، ثم يقرأ D1 control marker/mode. `OFF` يعيد 423؛ `CANARY` يشترط `admin` وتأكيد رقم الأوردر القادم في header؛ `GENERAL` يمر إلى منطق الإنشاء. **فجوة أمنية مصدرية تحتاج مراجعة:** في فرع `GENERAL` المعروض لا يوجد هنا شرط صريح `admin/service` المناظر لشرط عرض الزر؛ أي Employee token بدور آخر يبدو مارًا ببوابة هذا الـhandler. يلزم تحليل باقي الطبقات واختبار رفض صلاحية بدون لمس الإنتاج، ولا نعلن ثغرة مؤكدة من هذا وحده.
- [`t12-general-create.mjs` 131–201](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create.mjs#L131-L201): يطلب actor موثقًا ومفتاح `clientRequestId` بسياق Cloud، يطبّع القصد التجاري ويتحقق من تفعيل الـmode وصلاحية مخطط D1؛ يقارن مفاتيح ledger ويمنع التضارب وإعادة إنشاء طلب مماثل ضمن نافذة 120 ثانية؛ يفحص تعارض أوردر مفتوح لنفس العميل والقسم عبر بيانات Native/Mirror وlane claims، مع إسقاط القسم المتعارض من طلب متعدد الأقسام عند الاقتضاء.
- **تحقق قاعدة الطاير في الـbackend source:** [`cloud-write-order-contract-v2.mjs` 115–132](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/cloud-write-order-contract-v2.mjs#L115-L132) يرفض `flyPrint` خارج قسم الطباعة ويجعل `priority=عاجل` عند التفعيل؛ [`t12-order-create-shadow-intent.mjs` 44–52](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-order-create-shadow-intent.mjs#L44-L52) يثبت علم الطاير في line الطباعة دون الليزر. **لم يظهر في INSERT الخاص بالإنشاء تثبيت تاريخ تسليم اليوم نفسه؛ شرط الموعد يحتاج تتبع مصدر مستقل ثم اختبار**.

## 10.4 كاتب قاعدة البيانات وعلاقاته
- [`t12-general-create.mjs` 210–281](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create.mjs#L210-L281): عند قبول القصد، يُحضّر `db.batch` لتحديث عداد `t12_prod_create_control` وإنشاء `t12_prod_request_ledger` و`t12_prod_orders` و`t12_prod_lines` و`t12_prod_events` و`t12_prod_outbox`، بالإضافة إلى `t12_prod_duplicate_order_guard` و`t12_prod_customer_lane_claim`. بعد الدفعة يتحقق بقراءة مؤكدة؛ في ACK الملتبس يعالج replay أو يرجع `transaction-outcome-unknown-no-retry`. **وجود SQL لا يثبت تطبيق migrations أو وقوع كتابة على D1 الحية**.
- تحديث الواجهة بعد النجاح: [`app.js` 5910–5962](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L5910-L5962) يعرض `orderId` والتسليم المتوقع من الرد أو fallback تقديري، وينسخ رسالة واتساب، ولا يسجل إشعار إرسال إلا بعد تأكيد تفاعلي منفصل؛ ثم يعيد تحميل الصفحة. النص `فشل إضافة الأوردر في الشيت` في أحد فروع الخطأ رسالة UI قديمة لا تعني سلطة Google الحالية.

## 10.5 حالة الإثبات والفجوات وخطة التحقق
| الحلقة | الحكم عند التدقيق | المطلوب لترقيتها |
|---|---|---|
| زر → `createOrder` → API action | SOURCE_ONLY | اختبار واجهة على build مطابق، ورصد action/payload وهمي |
| wrapper → Health → POST Cloud | SOURCE_ONLY | إثبات flags والـwrapper الفعلي ونسخة Worker المنشورة؛ لا نفترض نشر الفرع |
| Bearer + role guard | SOURCE_ONLY / SECURITY_REVIEW_OPEN | اختبارات رفض `print/laser/service` حسب سياسة معتمدة، والتحقق من أصل التوكن ودورة انتهاء/إلغاء الجلسة |
| إنشاء D1 atomic + idempotency | SOURCE_ONLY | اختبار SQLite/D1 تجريبي معزول على نفس SHA، ثم دليل canary مصرح به لاحقًا |
| طاير = عاجل | SOURCE_ONLY | اختبار قبول/رفض على السيرفر ومحاكاة spoofed payload |
| طاير = تسليم اليوم | BLOCKED (دليل قاعدة الموعد غير مكتمل) | تتبع مولّد تاريخ التسليم والـwriter/readback واختبار التوقيت والقسم |
| Production end-to-end | BLOCKED | تطابق deployed SHA وتسجيل تجربة إنتاجية **بتصريح منفصل**؛ ممنوع إنشاء أوردر هنا |

**حالة الفصل:** `SOURCE_ONLY`، مع **فجوات `BLOCKED`** في الـProduction parity والاختبارات الحية. **ليس `TESTED` أو `PRODUCTION_VERIFIED`**. لم يُنفذ endpoint business على بيانات فعلية ولم تُعدَّل إعدادات أو كود المنتج. **الخطوة التالية:** تتبع `createCustomer` من الواجهة حتى `t12_customers`، ثم مراجعة `flyPrint` والتوقيت وPagination والجلسات بالتفصيل.


---

# 11. تتبع تكويد العملاء: شاشة الإدارة → API → صلاحية الخادم → D1 (16 أكتوبر 2026)

**الإثبات:** `SOURCE_ONLY` من ملفات فرع الكتاب بعد الفصل 10. لم نكتب أي سجل عميل حقيقي ولم نفحص بيانات عملاء؛ لا يوجد إثبات `TESTED` أو `PRODUCTION_VERIFIED` لهذه الجولة.

## 11.1 الوظيفة وموضعها
- [`index.html` بطاقة إضافة العميل](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/index.html) تضم اسم العميل، المدير، رقم الهاتف الأساسي/الإضافي، النوع، المديونية، الفرع، التفعيل، والملاحظات؛ زر `createCustomerBtn`.
- [`app.js` 299–304، 4312–4319، 7522–7525](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L4312-L4319) يحدد `canCodeCustomers` محليًا لـ`admin/service` ومستخدمين محددين؛ `toggleAddCustomer` يخفي بطاقة الإضافة بخلاف ذلك. ليس تصريح وصول server-side.
- [`app.js` 5695–5746](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L5695-L5746): `createCustomer` يبني `authParams` مع `customerName/manager/phone/extraPhone/customerType/debtAmount/franchiseBranchCode/franchiseBranchName/active/notes`؛ يرفض الاسم الفارغ، يعطل الزر مؤقتًا ثم يرسل `api("createCustomer", params)`. بعد `success` يعرض رسالة الخادم ويمسح بعض الحقول.

## 11.2 من Action إلى الخادم
- [`employee-api-dispatcher-v1.js` 120–126](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/employee-api-dispatcher-v1.js#L120-L126) يصنف `createCustomer` ضمن أعمال Edge. [`trendos-edge-orders-read-v1.js` 470–505 و907–946](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L470-L505) يكوّن `clientRequestId` من نمط `cust1_`، ويستخرج Edge Bearer token، ثم يرسل `POST /v1/t12/customers/write`؛ محاولة token refresh واحدة عند HTTP 401. فشل Cloud لا يُحوّل المسار في هذا wrapper إلى Google. **تفعيل wrapper وترتيبه في النسخة المنشورة غير مثبت هنا**.
- [`cloudflare-d1/wrangler.toml`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/wrangler.toml) → `production-shadow/index.js` → [`src/index_v2.js` 154–157](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/index_v2.js#L154-L157) يربط الـpath بـ`handleT12CustomerWriteRequest`. هذا اتصال كود، وليس دليل deploy.

## 11.3 مصادقة وصلاحيات وحدود التفعيل
- [`t12-customer-write-handler.mjs` 41–54 و62–130](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-customer-write-handler.mjs#L41-L130): `verifyOrdersEdgeToken` يختبر Bearer، ويشترط `admin` أو `service` أو اسم مستخدم محدد بعد التطبيع؛ وإلا HTTP 403. يقرأ `t12_customer_control`؛ عند `OFF` يرفض HTTP 423، وعند `CANARY` يشترط مديرًا ورقم تأكيد دقيقًا. `GENERAL` يُمرّر المدخل إلى الكاتب. **هذه صلاحية خادم مرئية في المصدر، أقوى من إخفاء البطاقة في المتصفح، لكنها ليست إثباتًا لسلوك النسخة الحية أو سلامة دورة التوكن**.
- [`edge-orders-read-v1.mjs` 130–162](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/edge-orders-read-v1.mjs#L130-L162) يحتوى تحقق session upstream عند استبدال employee token بـEdge Bearer. يجب التثبت من نسخة الـWorker المنشورة ومن وجود أي تبعية Apps Script فعلية قبل وصف الدورة Zero Google.

## 11.4 بيانات العميل ونمط الإنشاء/التعديل
- [`t12-customer-master.mjs` 1–79](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-customer-master.mjs#L1-L79): يطبّع الاسم العربي والهاتف، يحصر `customerType` في قيم محددة، ويقيّد طول بعض الحقول. `safeDebt` يحوّل مبلغ المديونية إلى رقم غير سالب في نطاق محدد؛ **ده حقل customer master وليس كشف حساب مالي معتمد من EasyStore**.
- [`t12-customer-master.mjs` 148–187 و227–270](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-customer-master.mjs#L227-L270): يحدد هل العملية `CREATE` أم `UPDATE` عبر `customerId` الصريح، أو مطابقة هاتف/اسم. أكثر من تطابق يؤدي إلى `ambiguous-customer-match` بدل اختيار عميل عشوائي. توليد كود Cloud الداخلي بالشكل `CUS-C......` يعتمد على عداد التحكم؛ **ليس إثبات تسليم «كود شات» نشط لبوابة العميل**.
- [`t12-customer-master.mjs` 274–361](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-customer-master.mjs#L274-L361): عند CREATE يحدّث `t12_customer_control` ويضيف `t12_customers`؛ وعند UPDATE يستخدم optimistic `version`، ثم `t12_customer_request_ledger` و`t12_customer_events` في `db.batch`. بعد الكتابة يقرأ الـledger مع تطابق actor/epoch/payload والنسخة الفعلية؛ لا يكرر إنشاء العميل عند ACK ملتبس بلا تحقق. هذه **خطة writer في المصدر فقط**.

## 11.5 الترابط مع بقية النظام
- [`t12-customer-master.mjs` 112–145](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-customer-master.mjs#L112-L145) يقدم بحثًا في العملاء النشطين عبر `t12_customers`. [`trendos-edge-orders-read-v1.js` 720–753](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L720-L753) يطلب تطابقًا واحدًا بالاسم والهاتف قبل أوردر عميل مسجل إذا غاب رقم الهاتف؛ فمفتاح العميل في عمليات التكويد يؤثر مباشرة على منع الالتباس عند فتح الأوردر.
- رصيد المديونية الظاهر في واجهة العميل/الكود لا يعني أنه تم مزامنة السداد، الفواتير أو المركز المالي مع EasyStore؛ تتطلب هذه سلطة منفصلة ودليل end-to-end مستقل.

## 11.6 الاختبارات والفجوات
| فحص مطلوب | سبب الاحتياج | الحالة |
|---|---|---|
| صلاحيات `admin/service` والسماح/المنع للأدوار الأخرى | إثبات أن UI وWorker متوافقان | SOURCE_ONLY؛ `TESTED` غير مثبت |
| الاسم/الهاتف المكرر، وتغيير هاتف قائم | منع دمج سجلين بدون تأكيد | SOURCE_ONLY؛ اختبار مع بيانات وهمية مطلوب |
| إبطال/انتهاء Edge Bearer وإعادة المحاولة | ربط الوصول بجلسة شرعية، ومنع الكتابة المكررة | SOURCE_ONLY |
| `OFF/CANARY/GENERAL` والمخطط D1 الحقيقي | التفريق بين وجود الكود والتفعيل | BLOCKED دون دليل parity وتشغيل مصرح به |
| customer ID مقابل chat code، ومصدر المديونية | منع الخلط بين معرف Cloud والعميل المالي والبوابة | BLOCKED إلى أن تُراجع واجهات التكامل |

**اختبارات موجودة للاطلاع وليس لإعلان PASS:** [`tests/t12_customer_master_a53.test.mjs`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/tests/t12_customer_master_a53.test.mjs)، [`tests/t12_customer_master_production_shadow_a53.test.mjs`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/tests/t12_customer_master_production_shadow_a53.test.mjs)، [`tests/frontend_t12_customer_cloud_only_a56.test.mjs`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/tests/frontend_t12_customer_cloud_only_a56.test.mjs). لم تُشغّل ولم تُثبت نتائجها على HEAD في هذه الجولة.

**النتيجة:** تكويد العملاء موثق من الواجهة إلى writer D1 على مستوى المصدر `SOURCE_ONLY`؛ ظهور خاصية عاملة في Production، صلاحية الجلسات، والتكامل المالي ما زال يحتاج إثباتًا. **الخطوة التالية:** فصل تدقيق server-side flyPrint والتسليم، ثم صفحة القراءة وPagination.


---

# 12. قاعدة «طباعة على الطاير»: أولوية التنفيذ وموعد التسليم (16 أكتوبر 2026)

**الوظيفة المراد إثباتها:** إذا اختار الموظف طباعة على الطاير، يقتصر العلم على قسم الطباعة، ويكون الأوردر `عاجل`، مع **موعد تسليم في نفس اليوم** حسب سياسة المطبعة. مستوى التدقيق الحالي `SOURCE_ONLY`؛ لا اختبار حي ولا بيانات إنتاجية.

## 12.1 الواجهة والمصدر
- [`index.html` 684–687](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/index.html#L684-L687) يوجد checkbox `newFlyPrint` في قسم الطباعة؛ [`app.js` 138–165](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L138-L165) يعطّل تعديل الأولوية ويضع `عاجل` عند تفعيل الطاير، ويعرض وعد «التسليم نفس اليوم».
- [`app.js` 5835–5868](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L5835-L5868) عند ضغط الإضافة يبعث `flyPrint=نعم` إذا كان القسم «طباعة» فقط، و`priority=عاجل`، إلى action `createManualOrder`. قاعدة العرض في المتصفح ليست مانعًا من تعديل payload؛ يتحقق الخادم بمعزل عنها.
- [`app.js` 79–100 و4743–4745](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L79-L100) يحتفظ بعلامة الطاير مؤقتًا في memory عندما يغيب حقلها عن نتيجة paging لنفس `lineId`؛ هذا ليس استردادًا مضمونًا بعد إغلاق المتصفح أو عبر الأجهزة.

## 12.2 تحقق مستقل في كود الخادم
- `createManualOrder` يمر بواسطة [`trendos-edge-orders-read-v1.js` 950–954](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/trendos-edge-orders-read-v1.js#L948-L954) إلى [`/v1/t12/orders/create`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create-handler.mjs#L91-L153) **إذا المسار مُثبّت والـmode مفعّل**. لا نفترض Production cutover.
- [`cloud-write-order-contract-v2.mjs` 117–132](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/cloud-write-order-contract-v2.mjs#L117-L132) يتعامل مع boolean `flyPrint`، ويرفضه لو القسم مش طباعة بواسطة `fly-print-requires-print-department`، و**يفرض `priority='عاجل'` على الخادم** حتى لو العميل بعث أولوية أخرى.
- [`t12-order-create-shadow-intent.mjs` 38–53](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-order-create-shadow-intent.mjs#L38-L53) يمرر العلم لبند الطباعة فقط في الأوردر متعدد الأقسام؛ [`t12-general-create.mjs` 233–238](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create.mjs#L233-L238) يتضمن `priority` في جدول الأوردر، ويكتب `fly_print` و`priority` في `t12_prod_lines`، بشرط اجتياز فحوص الكود والـDB control.

## 12.3 فجوة التسليم في نفس اليوم — مصدرها محدد
- **التناقض في سلوك المصدر:** [`app.js` 153–163](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L153-L163) يعرض «التسليم نفس اليوم»، بينما [`expectedDeliveryTextFromNow` في 440–442](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L438-L443) يرجع **تاريخ اليوم + يومين**؛ و[`app.js` 5910](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L5909-L5915) قد يستعمل هذه القيمة الافتراضية إذا لم يأتِ تاريخ من استجابة إنشاء الأوردر.
- [`t12-general-create.mjs` 233–238](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/cloudflare-d1/src/t12-general-create.mjs#L233-L238) لا يدرج `expected_delivery` ضمن الـINSERT الموضح، بل يحفظ القسم والأولوية والملاحظات والبنود؛ لذلك **لم تثبت في هذا writer قاعدة حساب/حفظ موعد التسليم نفس اليوم**. ربما يوجد مسار إثراء آخر؛ لا يُفترض وجوده قبل تتبعه.
- [`app.js` 351–355](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/app.js#L351-L355) يفضّل تاريخ الاستجابة إن وُجد، وإلا fallback الافتراضي. **لا نعلن إصابة Production** دون معرفة الـbuild المنشور ونتيجة reply، لكن التناقض المصدرِي واضح ويحتاج تحقيقًا ذا أولوية.

## 12.4 المصادقة، الاختبار، والإجراءات المطلوبة
| حالة | ما ثبت من المصدر | المطلوب |
|---|---|---|
| `SOURCE_ONLY` | شرط «طباعة فقط» وتحويل الأولوية «عاجل» في canonical server contract | اختبار offline لـspoofed `priority`، `flyPrint` خارج الطباعة وmulti-department |
| `SOURCE_ONLY` | الحقل `fly_print` يصل إلى D1 line INSERT عند المرور في writer | test readback + replay على D1 تجريبية لا الحية |
| `BLOCKED` | لا يظهر في writer موعد نفس اليوم، وfallback الواجهة = يومين | تتبع `expectedDeliveryAt/Text` على كل API read writer/formatter، وتحديد deadline/timezone/الإجازات |
| `BLOCKED` | لا إثبات parity بين branch والنسخة المنتشرة | تأكيد asset hash + Worker version من أدلة deploy مستقلة |
| `TESTED` | **غير محققة في هذه الدورة** | يمكن مراجعة [`tests/t12_general_create.test.mjs`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/tests/t12_general_create.test.mjs) و[`tests/frontend_flyprint_lane_stability_02cv.test.mjs`](https://github.com/fawakhry/TrendOs/blob/d8d3ee9963d9fa9b91742c21f89f673e1f8e7dde/tests/frontend_flyprint_lane_stability_02cv.test.mjs) مع run exact SHA؛ الوجود وحده لا يثبت PASS |

**الخلاصة:** شرط القسم والأولوية **موجودان في كود الخادم**؛ شرط موعد التسليم في نفس اليوم **غير مثبت ومحل تعارض محتمل في fallback المصدر**. لا تعديل لمنطق التشغيل أو قاعدة البيانات في هذه الجولة، والمطلوب التحقق قبل اعتبار الخاصية مكتملة.


---

# 13. مسار Pagination: من شاشة الأوردرات إلى D1 ونتيجة الصفحة (16 أكتوبر 2026)

**الحكم:** `SOURCE_ONLY`؛ فحص ربط واجهة → Edge route → handler → قراءة D1 في مصدر الفرع. **لم يُشغَّل اختبار Pagination مستقل، ولم تُقرأ أي أوردرات حقيقية، ولم يُثبت تماثل كود Production**. **قيد معماري:** رغم اسم `serverPaging`، الـhandler المرصود يجمع صفوف المرايا ويطبق `slice` على الخادم بعد الفلترة، وليس `LIMIT/OFFSET` داخل استعلام SQL النهائي؛ لا نخلط «صفحة مرجعة من الخادم» مع «تقليل حجم قراءة D1».

## 13.1 الوظيفة ومواضع التفعيل في الواجهة
- [`app.js` 175–184](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/app.js#L175-L184): توجد حالة `serverPaging` مبدئيًا `enabled=true`، `page=1`، `pageSize=5`، `totalRows=0`، `totalPages=1`؛ الحالة المحلية لا تعني أن الخادم يستجيب بالفعل بهذا الشكل.
- [`app.js` 4722–4764](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/app.js#L4722-L4764): `loadRows` يستدعي `api("getRowsPageV1931", authParams({screen,page,pageSize,query,statusFilter,priorityFilter,heatPressFilter}))`. عند الرد الناجح يحدث `state.rows` (مع الاحتفاظ المؤقت بعلامة الطاير على `lineId`) و`serverPaging` وفق `res.serverPaged` و`res.pagination`، وعدادات الحالات وdashboard. عند الفشل يحتفظ بجلسة الموظف ويعرض خطأ.
- [`app.js` 5070–5075](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/app.js#L5070-L5075): عند `serverPaging.enabled` لا يعمل `slice` مرة أخرى في جدول الواجهة؛ في الوضع المحلي فقط يقطع قائمة العناصر حسب `pageSize`. [`app.js` 5161–5192](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/app.js#L5161-L5192) يعرض سابق/التالي وأرقام الصفحات؛ الضغط يغير `state.currentPage` ويستدعي `loadRows(true)` في وضع الخادم.
- [`app.js` 4945–4973](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/app.js#L4945-L4973): يوجد فرز/فلترة محلية أيضًا بعد وصول `state.rows`؛ **نقطة تدقيق:** التأكد أن فلاتر الواجهة المتبقية لا تستبعد بعض عناصر الصفحة بعد أن حسب الخادم `totalRows` من مجموع آخر، فتصبح الصفحة أقصر دون سبب واضح للمستخدم. لا دليل تكرار/فقد حقيقي في Production من قراءة المصدر وحدها.

## 13.2 التوجيه وAuthorization
- [`trendos-edge-orders-read-v1.js` 891–908](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/trendos-edge-orders-read-v1.js#L891-L908) يقصر Route المرشح على `getRowsPageV1931` وشاشات مسموحة؛ `__DEBT__` مستثنى من هذا المسار. تشغيل الـwrapper يتطلب `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED===true` في المتصفح، ولذلك **لا يجوز افتراضه مثبتًا لكل مستخدم**.
- [`trendos-edge-orders-read-v1.js` 410–468 و1038–1055](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/trendos-edge-orders-read-v1.js#L410-L468) يحذف `username/token` من querystring ويرسل `GET /v1/edge/orders/02cr/page` مع Bearer؛ dedupe لطلبات متزامنة بنفس الـrequestKey في `inflight`، ومعالجة 401 بجلب token جديد؛ إذا فشل Edge أو freshness يرجع رسالة `ORDERS_CLOUD_UNAVAILABLE` بدل إظهار قائمة قديمة بلا تصريح. **الـdedupe ليس ضمان ثبات ترتيب النتائج بين طلبَي صفحة منفصلين**.
- [`cloudflare-d1/wrangler.toml` و`production-shadow/index.js`](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/wrangler.toml) → [`src/index_v2.js` 116–122](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/src/index_v2.js#L116-L122) → `handleEdgeOrders02CRCanaryRequest`؛ هذه سلسلة imports في repo وليست ضمانًا للنشر.
- [`edge-orders-read-02cr-canary.mjs` 216–229](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L216-L229): `verifyOrdersEdgeToken` يتحقق من Bearer، ثم `screens` claim لمنع الاطلاع على أقسام غير مسموحة. **فجوة مراجعة لاحقة:** شرط المنع هنا ينفّذ فقط لو `screens.length>0`؛ لازم مراجعة كل منشئي الـtoken وسلوك missing/empty screens، وليس إعلان ثغرة حية بمجرد السطر.

## 13.3 مصدر البيانات وترتيب الفلترة وحساب الصفحة
- [`edge-orders-read-02cr-canary.mjs` 162–189](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L162-L189): `readMirror` يقرأ من D1 `sheet_catalog` ثم **جميع** صفوف `sheet_rows` المرتبطة بكل اسم Sheet باستعلام `ORDER BY row_number`، دون `LIMIT/OFFSET` على صفحة الموظف. [الأسطر 231–245](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L231-L245) تقرأ مرآة البنود والعملاء ومنع التسليم وتتحقق من `ready` وrow-count/mirror note؛ وإلا تفشل مغلقة.
- [`edge-orders-read-02cr-canary.mjs` 247–273](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L247-L273): يسقط mirror rows حسب الشاشة، يطبق runtime overlay وCloud-native overlay، ثم enrich/sort، ويحسِب `statusCounts` و`statusOrderCounts` و`activeSummaryCounts` من المجموعة غير المصفاة جزئيًا بحسب غرض كل عدّاد؛ يطبّق `rowMatchesAppsFilters` ويحسب `totalRows` و`totalPages`. `pageSize` يتم حصره بين **5 و100** (القيمة الافتراضية 20)، و`page` تُقلم حتى `totalPages`؛ يتم إرجاع `rows: filtered.slice(start,start+pageSize)` مع `serverPaged:true` و`pagination`.
- **قيد ثبات snapshot:** لا يظهر في `pagination` المُرجعة هنا `snapshotId` أو `cursor` ثابت بين الطلبات، و`dataVersion` مبني على وقت مرآة البنود، وليس عقد قراءة snapshot مثبت للدمج الثلاثي والـoverlay؛ لذلك تغيّر المحتوى بين طلبَي صفحتين قد يغيّر الحدود. هذه **مخاطرة تصميم تُختبر** وليست إثبات أن فقد الصفوف يحدث بالفعل.
- **قيد الأداء:** لأن القراءة تتم لجميع mirror rows قبل slicing، فإن `serverPaging` يقلل حجم الـJSON/الرسم في المتصفح، ولكنه لا يضمن وحده عددًا ثابتًا من DB rows scanned ولا زمنًا مستقرًا مع نمو البيانات.

## 13.4 أدلة الاختبار المطلوبة
| الحالة | المرصود من المصدر | الاختبار اللازم |
|---|---|---|
| SOURCE_ONLY | `getRowsPageV1931` → Edge `02cr/page` → `pagination` | اختبار اصطناعي مع الصفحة 1 والأخيرة وخروج الصفحة عن الحدود وحجم صفحة 5/100 |
| SOURCE_ONLY | الخادم يفلتر بعد merge/sort ويرجع totals | اختبار توقع ثبات `totalRows` و`statusCounts` لكل filter وسيناريو mixed native/legacy |
| BLOCKED | لا يوجد cursor/snapshot contract في الـJSON الموضح | إدخال/تحديث وهمي **بين** طلبين على بيئة disposable وتحديد duplicate/missing IDs |
| BLOCKED | واجهة ترسم فلاتر محلية بعد Server filter | مقارنة client-side row count وUI page labels لنتائج مختلطة |
| BLOCKED | `__DEBT__` يُستثنى من Edge | إثبات مسار المعالجة البديل وصلاحية قراءة المديونية وعدم الرجوع لمسار غير مسموح |
| TESTED | **غير مثبت في هذه الدورة** | فحص source والـrun لـ[`tests/cloudflare_edge_orders_02cr_canary.test.mjs`](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/tests/cloudflare_edge_orders_02cr_canary.test.mjs) و[`tests/cloudflare_edge_orders_read_v1.test.mjs`](https://github.com/fawakhry/TrendOs/blob/58dac8a7fbe90957869a8af79462684f7b25ebb5/tests/cloudflare_edge_orders_read_v1.test.mjs)، ثم CI exact-head |

**النتيجة:** ربط الـPagination من الزر حتى D1 موثق **SOURCE_ONLY**. ليس إثبات `PRODUCTION_VERIFIED` أو كفاءة SQL pagination. **التالي:** صلاحيات الجلسات والموظفين (التحقق، role/screen claims، 401، token rotation/revocation) ثم الأدلة التجريبية.


---

# 14. جلسات الموظفين وصلاحياتهم: Native Auth وEdge tokens وواجهة العرض (16 أكتوبر 2026)

**نطاق التدقيق:** تعقب ملفات الجلسات والـrole guards على فرع الكتاب عند آخر نسخة مقروءة. **`SOURCE_ONLY`**؛ لم يُجر اختبار دخول/خروج حي ولا تغيير بيانات حسابات الموظفين، ولم تُقرأ أسرار أو tokens حقيقية. أي كلام عن فعالية الإنتاج الفعلية يحتاج `PRODUCTION_VERIFIED` مستقل.

## 14.1 واجهة الموظف وحفظ الحالة
- [`index.html` حقول دخول الموظف](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/index.html) → [`app.js` 1896–1930](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/app.js#L1896-L1930): `doLogin` يرسل `api("login", {username,password})`، يستقبل `res.user` ويحدد `state.screen` بناء على `roleScreens`. الأدوار المرئية واسم الموظف داخل `state` لا يشكلان authorization مستقلًا.
- [`app.js` 1667–1725](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/app.js#L1667-L1725): `saveSession` يحفظ نسخة user/screen و`authSessionEpoch` في `sessionStorage`، مع إزالة بعض آثار `localStorage`. `loadSession` يرفض epoch مختلفًا، ثم [`verifyRestoredEmployeeSessionV1` 1727–1776](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/app.js#L1727-L1776) يعيد فحص token على API قبل قبول جلسة مسترجعة. المخزن بالمتصفح ليس مصدر حقيقة لصحة الصلاحية.
- [`app.js` 1779–1865](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/app.js#L1779-L1865): guard دوري (مصدر الاختبار يحدد 5 دقائق) وعند focus أو عودة التبويب يفحص `verifyEmployeeSession`. 401 الصريح يُطلق إعادة الدخول وإيقاف poll/الإشعارات؛ أما خطأ الشبكة غير المصنف رفضًا فلا يمحو جلسة الموظف تلقائيًا. ده فصل مفيد بين انقطاع الشبكة ورفض الهوية.
- [`config.js` 15–39](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/config.js#L15-L39): مصدر flags يشير إلى `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true` و`LEGACY_BRIDGE_V1=false` مع أوضاع `OPS/CORE=GENERAL` وبعض العائلات `READONLY`. هذه قيم **ملف مصدر** وليست إثبات إعدادات منشورة/ناجحة لكل endpoint.

## 14.2 Native employee API (Cloudflare/D1)
- [`employee-api-dispatcher-v1.js` 24–29 و746–799](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/employee-api-dispatcher-v1.js#L746-L799) يصنف `login/logout/verifyEmployeeSession/changePassword` إلى `/v1/employee/auth/*` عند native route enabled، ويمنع `CLOUD_EDGE_ACTIONS` من المرور قبل تجهيز Edge wrapper. الخطأ HTTP 401 في [329–368](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/employee-api-dispatcher-v1.js#L329-L368) ينشئ event `trendos:employee-session-invalid` في حالات محددة مع استثناءات أخطاء كلمة المرور أثناء الدخول أو التغيير.
- [`cloudflare-d1/src/employee-auth-native-v1.mjs` 701–783](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/employee-auth-native-v1.mjs#L701-L783): `handleLogin` يتحقق من `employee_auth_control_v1` والـmode وتفعيل المستخدم، ويتحقق من كلمة مرور PBKDF2-HMAC-SHA256 المحفوظة بصيغة salt/hash (الـplaintext ليس مقصودًا حفظه) ويضع حد محاولات فاشلة (خمس محاولات ثم قفل 15 دقيقة في الثوابت)؛ ينشئ جلسة أصلية عند النجاح. `handleVerify` يرفض الجلسة غير الموجودة أو المنتهية/الملغاة.
- [`employee-auth-native-v1.mjs` 451–540](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/employee-auth-native-v1.mjs#L451-L540): token عشوائي، ويُخزّن `token_fingerprint` بدل token الخام في `employee_auth_sessions_v1`، مع `expires_at_ms` و`revoked_at_ms` و`session_version`. التأكد من session يطابق fingerprint وactive/expiry/version. الإعداد الافتراضي 8 ساعات كما في `EMPLOYEE_AUTH_SESSION_TTL_SECONDS`؛ لا نستنتج مدة الـProduction دون إعداداته.
- [`employee-auth-native-v1.mjs` 786–875](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/employee-auth-native-v1.mjs#L786-L875): Logout يضع `revoked_at_ms` للجلسة المحددة؛ تغيير كلمة المرور يرفع `session_version` ويلغي الجلسات غير الملغاة ويطلب إعادة الدخول. يجب اختبار فشل جزئي بين تحديث كلمة المرور وإلغاء الجلسات، لأن النص يستخدم عمليتي DB مستقلتين داخل `try`، ولا يظهر `db.batch` موحد في المقطع.

## 14.3 صلاحيات الشاشات وجلسة أوردرات Edge: نقطة تكامل مفتوحة
- [`edge-orders-read-v1.mjs` 92–126](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/edge-orders-read-v1.mjs#L92-L126) يصدر Bearer موقّعًا مستقلًا ب`aud/sub/role/screens/iat/exp/jti` (TTL افتراضي 600 ثانية)، ويتحقق من التوقيع والصلاحية الزمنية؛ **هذا token منفصل عن employee session المخزنة في D1**.
- [`edge-orders-read-v1.mjs` 130–162](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/edge-orders-read-v1.mjs#L130-L162): دالة `exchangeSession` الخاصة بأوردرات Edge تستدعي `verifyEmployeeSession` على `APPS_SCRIPT_API_URL` صراحةً في هذا المصدر؛ لذلك **Native employee login قد يكون منشورًا، بينما ترقية جلسته إلى Orders Edge token تعتمد على خدمة قديمة** ما لم توجد طبقة منشورة أخرى مختلفة. لازم reconciliation دقيق مع deploy وhealth؛ لا يجوز اعتماد `ZERO_GOOGLE_COMPLETE`.
- **مراجعة revocation:** `verifyOrdersEdgeToken` في المقطع المرصود يتحقق من HMAC/claims/expiry، **ولا يستعلم عن `employee_auth_sessions_v1` أو `session_version` أو blacklist للـjti في نفس الدالة**. أي token Edge سبق إصداره قد يظل صالحًا حتى انتهاء مدة الـTTL رغم إلغاء Native session، إذا لم يقطع Endpoint آخر الاعتماد. حالة تصميم/اختبار أمني **`BLOCKED`** إلى أن تثبت إعادة الإبطال على المسار الكامل، لا إعلان ثغرة Production.
- [`edge-orders-read-02cr-canary.mjs` 222–229](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L222-L229): يعيد 401 للتوكن غير الموقّع/المنتهي، ويقرأ `screens` للمنع؛ لكن شرط المنع محصور في `allowed.length>0`. اختبار `screens=[]` أو غيابه لازِم، مع سياسة fail closed، خصوصًا لأن العميل قادر على إرسال `screen` مختلف في Query (المقصود Backend claim الموثق، لا UI flag).
- مقارنة write permissions: [`t12-customer-write-handler.mjs` 45–54](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/t12-customer-write-handler.mjs#L45-L54) يتحقق من `admin/service` أو named users؛ بينما [`t12-general-create-handler.mjs` 33–38 و130–141](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/cloudflare-d1/src/t12-general-create-handler.mjs#L130-L141) في `GENERAL` لا يحتوي شرط role مطابق لشرط `canAddManualOrder` في الواجهة. مراجعة policy وحالات `laser/print` مطلوبة؛ لا نصنفها exploited vulnerability.

## 14.4 أدلة الاختبار ونقاط الإغلاق
| الحكم | المعطى | ما يلزم قبل ترقية الإثبات |
|---|---|---|
| SOURCE_ONLY | Native login PBKDF2، D1 fingerprint، TTL، revoke/session-version | اختبارات fake D1 انقضاء/قفل/تغيير كلمة مرور، نتائج Run مرتبطة بـSHA |
| SOURCE_ONLY | `verifyRestoredEmployeeSessionV1` وruntime 401 UI guard | اختبار mock 401 وnetwork outage وسلوك focus/tab switching |
| BLOCKED | Orders Edge token exchange يعتمد على Apps Script في هذا المصدر | إثبات مسار الـdeployment الحالي وhealth لا يستدعي legacy، أو توثيق الاعتماد المتبقي |
| BLOCKED | عدم ربط Edge token بإبطال Native session في `verifyOrdersEdgeToken` | اختبار revoked employee مع Edge token غير منتهٍ على sandbox معزول |
| BLOCKED | write role divergence و`screens=[]` | اختبارات 401/403/role matrix في بيئة synthetic مع ملحق سياسة معتمد |
| TESTED | **لم يُجر هنا** | راجع [`tests/entry652_employee_session_lifecycle_guard.test.mjs`](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/tests/entry652_employee_session_lifecycle_guard.test.mjs) و[`tests/entry652_employee_session_runtime_401_dispatch.test.mjs`](https://github.com/fawakhry/TrendOs/blob/8f29bbc570634ed499303ab426874d6302ee4997/tests/entry652_employee_session_runtime_401_dispatch.test.mjs)، ثم إثبات CI exact-head |

**النتيجة:** الفصل يغطي حدود الموظف محليًا وNative session وOrders Edge scope، لكنه **ليس تصريحًا بصحة كافة الصلاحيات في الإنتاج**. التصنيفات `SOURCE_ONLY` و`BLOCKED` فقط لهذه الجولة؛ `TESTED=NO`، `PRODUCTION_VERIFIED=NO`. لا عمليات مالية أو بيانات أشخاص/أوردرات حقيقية أو نشر/دمج.


---

# 15. تحديث حالة بند الأوردر والملاحظات: UI → Edge runtime → D1 (16 أكتوبر 2026)

**نطاق العمل:** توثيق كود تغيير حالة بند داخل شاشة التشغيل، لا تنفيذ أي تغيير فعلي على طلب عميل. **`SOURCE_ONLY`**: لم تُعدَّل حالات الأوردرات أو فواتير أو قواعد الإنتاج، ولا دليل تشغيل حي على نفس SHA.

## 15.1 شاشة الأوردر ومعالج الحفظ
- [`app.js` 5268–5318](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/app.js#L5268-L5318): `saveLine(row,tr)` يقرأ `.row-status` و`.row-notes`، ويبعث `api("updateLine", authParams({rowNumber,orderId,lineId,status,notes}))`؛ عند النجاح يبدّل الحالة والملاحظات محليًا ويعيد الرسم، وقد يفتح نافذة الفاتورة عند انتقال مناسب. بعض الرسائل ما زالت تقول «الشيت»؛ النص الظاهر لا يثبت مرجع التخزين. فشل الرد لا يرفع status محليًا.
- [`trendos-edge-orders-read-v1.js` 956–993](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/trendos-edge-orders-read-v1.js#L956-L993): في Edge wrapper، إن كان `lineId` معروفًا كـCloud Native يوجه إلى `POST /v1/t12/orders/line-runtime/update`، وبخلافه إذا كان `MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED` يعالج `POST .../legacy-update`؛ في حالات عدم أهلية المستخدم أو عدم وجود lineId ثابت قد يمر لمسار fallback آخر من خلال dispatcher. **توصيف التنفيذ النهائي يعتمد على ترتيب wrappers وflags الفعلية**، وليس مجرد تعليق مصدر.
- [`trendos-edge-orders-read-v1.js` 562–586](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/trendos-edge-orders-read-v1.js#L562-L586): كلا مساري runtime POST يستخدمان Edge bearer، ويعالجان HTTP 401 بتجديد session token ثم إعادة المحاولة مرة واحدة. عند احتمال mutation مع رد شبكة غير مؤكد، وظيفة الـhandler مصممة لقراءة حالة لاحقة؛ يجب فحص تكرار شبكة POST بالتجارب الاصطناعية.

## 15.2 صلاحيات وقواعد الخادم
- [`t12-operational-runtime-handler.mjs` 17–62](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L17-L62): قائمة الحالات المسموحة: «طلب جديد»، «بدأ التنفيذ»، «تحت التنفيذ»، «جاهز للاستلام»، «تم التسليم»، «متوقف»، «مكرر»، «ملغى». `verifyOrdersEdgeToken` يتحقق من Bearer؛ `actorAllowed` يسمح لمدير النظام، أو صاحب `screens` المطابقة لقسم الطباعة/الليزر، كما يسمح بصلاحية `service`. مسار قسم غير معروف يُرجع allowed في الدالة على مستوى المصدر؛ سياسة الأدوار النهائية تحتاج review.
- [`t12-operational-runtime-handler.mjs` 130–172](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L130-L172): يتحقق من `orderId/lineId` وحالة صحيحة وحد طول notes، ومن وجود سطر Native ومن السماح للقسم؛ إذا كانت الحالة/الملاحظات مطابقة يرجع نجاحًا idempotent؛ وإلا يستخدم `db.batch` لكتابة `t12_prod_line_runtime` و`t12_prod_runtime_events` ثم readback مع منع retry أعمى عند نتيجة ملتبسة.
- [`t12-operational-runtime-handler.mjs` 175–219](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L175-L219): مسار Legacy يتحقق أن الهوية ليست Native، ويبحث البند في مرآة D1 ثم `t12_legacy_line_runtime` ويفرض صلاحية القسم؛ يدون الحدث في [`t12-legacy-line-runtime.mjs` 109–142](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-legacy-line-runtime.mjs#L109-L142)، ويؤكد الكتابة بإعادة القراءة. [`t12-legacy-line-runtime.mjs` 70–94](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-legacy-line-runtime.mjs#L70-L94) يجعل runtime overlay غالبًا عند عرض سطر المرآة القديمة، وليس تحديثًا مباشرًا للشيت.
- **فجوة حالة الانتقال:** في مسار Native المعروض يوجد تحقق أن status من القائمة، لكن لا تظهر state-transition matrix صريحة تمنع مثالًا `تم التسليم` ← `طلب جديد`؛ السياسة الفعلية والتأثير على الفاتورة أو المهام يحتاجان تدقيق API واعتماد منتج قبل التعديل.

## 15.3 أولوية سلامة تسليم العميل
- **اختلاف واضح في مصدر الخادم:** [`updateLegacyLine` 197–207](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L197-L207) إذا كانت الحالة الجديدة `تم التسليم` ينفذ `legacyDeliveryGate`، وفي حالة منع التسليم بالمديونية يرجع 409 أو يفشل مغلقًا إذا تعذر الفحص. أما [`updateLine` Native 130–172](https://github.com/fawakhry/TrendOs/blob/1b658d2dbfb6d95841c6a4f25df1507d0d74e676/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L130-L172) فلا يظهر فيه نفس فحص `legacyDeliveryGate` قبل تخزين حالة `تم التسليم`.
- هذا **احتمال عدم تماثل في حماية التسليم** في مصدر مسارين؛ لا نقول إن طلب عميل حقيقي سُلِّم بالخطأ. المطلوب قبل الاعتماد: تعريف سياسة واحدة للمديونية مع EasyStore (رصيد من؟ وقائمة منع التسليم منفصلة؟) ثم اختبار خادم اصطناعي يسمح/يرفض الحالتين Native وLegacy بصورة متساوية.
- كون `saveLine` يفتح نافذة فاتورة عند بعض الانتقالات لا يعني ربطه بإثبات سداد أو مطابقة الحسابات. **المصدر المالي يظل في حدود EasyStore، ولا تعديل له في هذه المراجعة**.

## 15.4 جدول الإثبات والتستات المطلوبة
| عنصر | حالة الإثبات | اختبار/دليل مطلوب |
|---|---|---|
| UI saveLine → updateLine → runtime endpoint | SOURCE_ONLY | اختبار frontend mock لنجاح/رفض الحفظ وعدم تغيير الواجهة عند الفشل |
| role/screen authorization | SOURCE_ONLY | اختبارات أدوار `admin/service/print/laser`، identity غير موجودة و`screens=[]` |
| statuses + readback + event | SOURCE_ONLY | D1 in-memory بمفاتيح وهمية، event واحد لكل تغيير، وحالات ACK الملتبس |
| تسليم عميل مقيَّد | BLOCKED — تماثل Native/Legacy غير مثبت | مقارنة رفض «تم التسليم» لكل مسار مع قائمة منع التسليم والدين، دون بيانات فعلية |
| قائمة الانتقالات والفاتورة | BLOCKED | جدول حالات معتمد، واختبارات downgrade/reopen والربط بإيزي ستور |
| Runtime production | BLOCKED | worker/asset SHA + نتيجة اختبار مصرح به؛ **لم يُنفذ هنا** |

**النتيجة:** writer لحالات الأوردرات موثق داخل مصدر Edge/D1 وبشكل منفصل للـNative والـLegacy، مع فجوة حرجة تستلزم التحقق في بوابة تسليم المديونية. الحالة `SOURCE_ONLY` مع اختبارات `BLOCKED`، ولم نحقق `TESTED` أو `PRODUCTION_VERIFIED`.


---

# 16. بوابة العميل ومسودات الأوردرات والملفات — مسار السلطة الحالي (16 أكتوبر 2026)

**وظيفة الوحدة:** دخول العميل بكود الشات وكلمة المرور، استعراض أوردراته، تكوين مسودة متعددة البنود، رفع مرفقاتها، ثم إرسالها لإنشاء رقم أوردر. **الحالة الإجمالية: `SOURCE_ONLY`؛ العميل Native Portal `BLOCKED / NO_GO`.** المرجع: المصدر عند HEAD `88a45e3f63f2498fd58d933d954313bba8d2ee1e` (أول الجولة)، دون اختبار دخول أو تحميل ملف أو كتابة طلب حقيقي.

## 16.1 واجهة العميل
- [`index.html` س66–84](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/index.html#L66-L84) يوفر `customerLoginView` بكود الشات وكلمة المرور، و[`app.js` س1867–1974](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L1867-L1974) يوضح `doCustomerLogin`: يستدعي `api("customerLogin", {customerCode,password})`، ثم يحتفظ بـ`res.customer` وtoken في `sessionStorage` باسم `matbagy_platform_customer_session`. `loadCustomerSession` يفحص وجود الرمز محليًا؛ **ليس بديلًا عن التحقق على الخادم**. دوال الخروج وتغيير كلمة المرور: [`app.js` س4060–4111](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L4060-L4111).
- [`app.js` س3459–3523](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3459-L3523): `loadCustomerOrders` يرسل `getCustomerOrders` مع `customerCode/token`؛ `renderCustomerOrders` يعرض رقم الأوردر، القسم، الحالة، نوع الشغل، الموعد والملاحظات (مع `escapeHtml`). عرض القائمة لا يثبت تحقق ملكية الطلب خارج الخادم.
- [`index.html` س880–939](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/index.html#L880-L939) يوفر واجهة دردشة المسودة، اختيار `طباعة/ليزر`، الكمّية، خيارات المكبس/الطاير، المرفقات، بند ووصف الطلب، وأزرار إضافة بند وبدء التنفيذ. العرض الشبيه بالشات **ليس دليل تبادل رسائل واتساب أو تسعير/إجابة AI آلي فعلي**.
- [`index.html` س940–954](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/index.html#L940-L954) يعلن مصمم العميل الذكي باعتباره **وظيفة مستقبلية** داخل الواجهة، فلا يُدرج ضمن وظائف الإنتاج المثبتة.

## 16.2 سلسلة المسودة ورفع الملفات
- [`app.js` س3592–3595](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3592-L3595) ينشئ object للمسودة بالمتصفح عند الحاجة؛ [`app.js` س3902–3912](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3902-L3912) يرسل `createCustomerDraft` ويحفظ `draftId`.
- [`app.js` س3935–3994](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3935-L3994): `addCustomerDraftItem` يتحقق محليًا من بند/ملاحظة/ملف واحد على الأقل، ويبعث `addCustomerDraftItem` مع القسم والكمية والملاحظات وعلمي المكبس/الطاير؛ ثم يبدأ رفع المرفقات المتاحة للبند. بعض ملاحظات الفرع/البائع تُضاف كسلسلة نصية؛ **لا يثبت هذا routing أو حجز تنفيذ حقيقي بالبائع**.
- [`app.js` س3913–3933](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3913-L3933): لكل مرفق ≤25MB يتم تحويله إلى Base64 وإرساله عبر `apiPost("uploadCustomerDraftFile")` مع `draftId/itemId`. لا يوجد في هذه القراءة إثبات خادم لسياسة نوع/امتداد الملف أو منع cross-customer file access أو حدود الحمولة بعد Base64؛ **متطلبات اختبار أمني**، وليس حكمًا بوجود ثغرة.
- [`app.js` س3997–4025](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3997-L4025): `submitCustomerDraft` يشترط مسودة برقم ووجود بند، ويطلب تأكيدًا، ثم يبعث `submitCustomerDraft` مع `draftId`؛ على `success` يحفظ `orderId` ويستدعي تحميل أوردرات العميل. لا نعتبر هذا نجاح إنشاء رسمي ما لم يوجد دليل خادم موثق أو اختبار تجربة معزولة. إعادة الإرسال وقت انقطاع ACK تحتاج فحص idempotency على authority الحقيقي.

## 16.3 سلسلة API والسلطة الفعلية
- [`employee-api-dispatcher-v1.js` س108–118](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L108-L118) يصنف `customerLogin/customerLogout/changeCustomerPassword/getCustomerOrders/getCustomerPortalAccountsV1859/createCustomerDraft/addCustomerDraftItem/submitCustomerDraft/uploadCustomerDraftFile` كـ`CUSTOMER_SESSION_ACTIONS` **منفصلة** عن موظفي Native Auth.
- [`employee-api-dispatcher-v1.js` س746–771](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L746-L771) يحيل تلك الـactions إلى downstream/transport الموجود، ولا يحوّلها ضمن هذا المسار إلى كاتب Customer Native مستقل.
- [`browser-api-transport-v1.js` س1–45](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/browser-api-transport-v1.js#L1-L45) يبقي طلب المتصفح داخل Cloud عبر `POST /v1/legacy-api` ويمنع اتصال browser مباشرًا بـGoogle.
- [`cloudflare-d1/src/index_v2.js` س1–55](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/index_v2.js#L1-L55) يربط `/v1/legacy-api` مباشرة بـ`handleLegacyBrowserTransport`؛ [`cloudflare-d1/src/legacy-browser-transport-v1.mjs` س8–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/legacy-browser-transport-v1.mjs#L8-L35) يصنّف نفس تسعة customer actions، و[`cloudflare-d1/src/legacy-browser-transport-v1.mjs` س55–108](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/legacy-browser-transport-v1.mjs#L55-L108) يستثنيها من حظر الموظفين Native-only ثم يعيد تمريرها server-to-server إلى `APPS_SCRIPT_API_URL` بعد فحص قائمة actions وOrigin. **إذًا العميل هنا Cloud transport + Apps Script authority؛ مش Cloud Native مستقل بعد**. عدم وصول المتصفح مباشرةً إلى Google لا يعني `ZERO_GOOGLE_COMPLETE`.
- لم تُراجع في هذا الفصل شفرة handlers لـApps Script المنفَّذة على الخادم المنشور، لذا **لا نثبت** ضوابط ربط `customerCode/token` بـ`draftId`، ولا صلاحية قراءة أوردرات غيره أو التحكم في ملفاته.

## 16.4 تجهيز Native Portal المستقبلي: الأدلة الموجودة وحدودها
- [`cloudflare-d1/src/customer-portal-native-readiness-v0.mjs` س1–37](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/customer-portal-native-readiness-v0.mjs#L1-L37) صريح إن الملف `source-only` وغير مستورد من الـProduction Worker، ويرجع `productionRelease: 'NO_GO'` مهما اكتملت العدادات؛ كمان customer-auth/orders/drafts/files/finance flags `false`.
- [`cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs` س1–16](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs#L1-L16) يوضح أن فحص ملكية الطلبات diagnostic read-only غير موصول بواجهة العميل. [`cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs` س17–70](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs#L17-L70) لا يحول مطابقة الأرقام أو أكواد الشات إلى تصريح ملكية مستقل.
- [`cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs` س1–21](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs#L1-L21) يقدم primitives مصدرية لتذكرة تعيين كلمة المرور بعد OTP موثَّق من الخادم؛ **لا يوجد route حي / SMS / activation مثبت من وجود الملف**، والإصدار `SOURCE_ONLY`.
- [`config.js` س60–69](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L60-L69) يحتوي flags وURL لخدمات العميل، مثل `MATBAGY_CUSTOMER_ACCOUNTS_PORTAL`؛ العلم في المتصفح لا يمنح صلاحية مالية أو يثبت أن بيانات الحساب معتمدة.

## 16.5 الفجوات والاختبارات
| النقطة | الحالة | دليل الإغلاق المطلوب |
|---|---|---|
| UI → Cloud transport → Apps Script | SOURCE_ONLY | رصد مسار deployed ونسخة authority + mock customer session، بلا عملاء حقيقيين |
| دخول/خروج وتغيير كلمة المرور | BLOCKED | اختبار expired/revoked token وrate limiting، واختبار عدم استرجاع جلسة غير صالحة |
| وصول العميل لأوردراته فقط | BLOCKED / SECURITY | اختبار ownership بعميلين وهميين وقيد `customerCode/token` على الخادم |
| إنشاء مسودة والبنود وتحويلها لأوردر | SOURCE_ONLY / BLOCKED | اختبار create/add/submit/replay في isolated datastore مع ضمان منع التكرار |
| المرفقات | BLOCKED / SECURITY | اختبار امتداد ونوع وحجم الملفات وتجاوز حدود Base64 وownership للملف وعدم التسريب |
| الحسابات وكشف العميل | BLOCKED | مراجعة مصدر المديونية والفواتير وصلاحية عرضها عبر EasyStore بدون كشف حساب عميل آخر |
| Customer Native V0 | SOURCE_ONLY، `NO_GO` | يمنع وصفه Live قبل source + ownership + session + deployed parity |
| TESTED | **لم يُختبر في هذه الجولة** | راجع [`tests/entry654_customer_portal_native_readiness_v0.test.mjs`](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry654_customer_portal_native_readiness_v0.test.mjs)، [`tests/entry655_customer_order_ownership_audit.test.mjs`](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry655_customer_order_ownership_audit.test.mjs)، [`tests/entry659_customer_enrollment_ticket_source.test.mjs`](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry659_customer_enrollment_ticket_source.test.mjs) مع نتيجة CI exact SHA |

**الخلاصة:** واجهة العملاء ومسارات الـlegacy Cloud مُحددة بالمصدر، لكن ليس عندنا دليل end-to-end على صلاحيات العميل وملكية الأوردر والمرفقات أو تشغيل Customer Native في الإنتاج. `TESTED=NO` و`PRODUCTION_VERIFIED=NO`. لم يُعدّل كود ولا بيانات حقيقية.


---

# 17. الإشعارات وواتساب ومحادثات الأوردرات — النسخ والتسجيل والإرسال الحقيقي (16 أكتوبر 2026)

**الغرض:** التمييز بين إشعار سطح المكتب، نسخ نص للواتساب، إثبات إرسال يدوي، وإرسال API سحابي. **الدليل `SOURCE_ONLY`**؛ لم تُرسل رسالة، ولم يُفتح شات عميل أو يُستدعَ Meta/Graph أو AI، ولم تُغيَّر حالة إشعار في D1.

## 17.1 إشعارات «طباعة على الطاير» بالمتصفح
- [`index.html` 95–105](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/index.html#L95-L105) يوفر زر تفعيل الإشعارات في الشريط. [`app.js` 1487–1550](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L1487-L1550) يستخدم `Notification` API بعد إذن المتصفح، ويحفظ تفضيل التفعيل في `localStorage` لكل اسم مستخدم. يبني قائمة الطاير من الأوردرات الموجودة في نتيجة القراءة، مستبعدًا المنتهي/المخفي، ثم ينشئ إشعارًا محليًا لكل صف غير مرئي سابقًا.
- **حد آلية التكرار:** [`app.js` 1551–1586](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L1551-L1586): `startUrgentNotificationTimer` ينادي `checkUrgentNotifications` مرة ثم يضع `state.urgentNotificationTimer=null` بتعليق `no automatic refresh/polling`. أي **رصد لحظي/مستمر مع المتصفح مغلق غير مثبت بهذه الآلية**. يحتاج تدقيق كل استدعاءات `checkUrgentNotifications` الأخرى والـService Worker إن وُجد قبل إصدار حكم على إشعارات النظام كله. اسم الزر «مفعلة» لا يثبت Push حقيقي من الخادم.
- `checkUrgentNotifications` يقرأ `api("getRows", {screen})`، فتظهر فجوة فحص وصول هذه العملية لطريق مسموح عند `Native-only` بدل افتراض وجود poll مستقر.

## 17.2 إرسال واتساب اليدوي من شاشة الأوردر
- [`app.js` 444–494](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L444-L494) يكوّن نص التسجيل/الحالة/الجاهزية حسب بيانات الأوردر وحالة الدين. [`app.js` 536–558](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L536-L558) ينسخ النص إلى Clipboard؛ [`app.js` 552–560](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L552-L560) يمكنه فتح WhatsApp Web. **دي خطوات بشرية وليست إرسالًا آليًا**.
- [`app.js` 5219–5264](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L5219-L5264): `sendWhatsApp` ينسخ النص ويسأل الموظف هل أرسل الرسالة، ثم يرسل `markCustomerNotified` لحفظ الإبلاغ. الاعتماد على `confirm()` ليس دليل تسليم الرسالة عند Meta؛ حالة «تم الإبلاغ» هنا إثبات إداري يحتاج مراجعة تعريفه.
- [`trendos-edge-orders-read-v1.js` 995–1006](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/trendos-edge-orders-read-v1.js#L995-L1006) يوجّه `markCustomerNotified` إلى `POST /v1/t12/orders/line-runtime/notify` **فقط إذا كان `lineId` Native موجودًا في قائمة التعرف المحلية**؛ غير ذلك يرجع لمسار legacy-dependent مختلف.
- [`cloudflare-d1/src/t12-operational-runtime-handler.mjs` 222–261](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L222-L261) يتحقق من `orderId/lineId` و`whatsappType` والقسم ثم يسجل `t12_prod_line_runtime` و`t12_prod_runtime_events`. الأنواع المقبولة `ready_notify`, `status_reply`, `registration`. التسجيل هنا لا يستدعي Meta send، ولا يعطي دليل delivered/read receipts.

## 17.3 تعارض صيغة تسجيل واتساب الأوردر الجديد — مهم
- [`app.js` 5748–5760](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L5748-L5760): `recordRegistrationWhatsApp` يرسل `whatsappType:"order_registered"`؛ لكن [`cloudflare-d1/src/t12-operational-runtime-handler.mjs` 222–227](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/t12-operational-runtime-handler.mjs#L222-L227) لا يقبل القيمة دي ويقبل `registration` بدلًا منها. **تعارض عقد واضح في المصدر** إذا وصل هذا الطلب لمسار Native `notify`: متوقع HTTP 400 `whatsapp-type-not-allowed`.
- كذلك `recordRegistrationWhatsApp` ينتظر Promise بدون فحص `res.success` في الفرع الناجح، وقد لا يلاحظ رد `{success:false}` لو transport لم يرمِ Exception؛ أما الوصول إلى مسار Legacy آخر فقد يغيّر النتيجة. **لا نصنفه خلل Production مُعاد إنتاجه** دون اختبار route/response على SHA مطابق.
- **شرط الإغلاق:** توحيد enum بين UI وCloud/Legacy، فحص `res.success`، اختبار missing `lineId` وmulti-line، وعدم وسم «تم الإرسال» دون نتيجة إرسال حقيقية أو تأكيد محدد.

## 17.4 مدير العملاء وEmployee Comms Native
- [`customer-manager-v1.js` 1–27](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/customer-manager-v1.js#L1-L27) يوفر واجهة Inbox ومحادثة واقتراح رد وإرسال وتصعيد وإنهاء؛ `api()` يستدعي `trendosEmployeeApiV1("customerManagerV1",{op,...})`. وجود أزرار «إرسال واتساب» و«رد ذكي» لا يثبت تفعيلها.
- [`config.js` 28–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L28-L35) يحدد `MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE='READONLY'` في مصدر config. [`employee-api-dispatcher-v1.js` 100–107](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L100-L107) يجعل native READONLY لقيم `customerManagerV1:inbox`, `:thread`، `getOrderConversation`، `goLiveAutopilotV1:listDrafts` فقط. لذا **لا يمكن الجزم من الكود إن عمليات `:send` أو `:suggest` مُفعلة Native في نفس إعدادات المصدر**.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 305–339](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L305-L339) يضع gate `OFF/READONLY` بحسب `employee_comms_control_v1` في D1 ويصادق الموظف على الخادم. [`cloudflare-d1/src/employee-comms-native-v1.mjs` 106–130](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L106-L130) يحتوي تنفيذ `sendWhatsApp` عبر Meta Graph، و`suggest` قد يستدعي AI مع فحص تصعيد بعض النصوص، **لكن وجود هذه الدوال لا يعني نجاحها في `READONLY` أو توفر secrets ولا يدل على إرسال رسالة حقيقية**.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 315–325](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L315-L325) يُظهر Health metadata عن `mode/schemaReady/whatsappReady/openAiReady/accountingFinalizeReady`. لم نطلب Health إنتاجي في هذه الجولة، وبالتالي وضع الخدمات وقت الاستخدام `UNKNOWN/BLOCKED`.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 265–280](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L265-L280): خدمة `finalizeAndNotify` تُرجع `accounting-d1-authority-not-ready` صراحةً وتفشل مغلقة بدل تسجيل تقفيل مالي وهمي. ربط إشعار الجاهزية مع الفاتورة/المديونية يحتاج فحص مستقل.

## 17.5 الإثبات والفجوات والاختبار
| السؤال | الحالة | فحص القبول |
|---|---|---|
| هل هناك Push تلقائي مستمر للطاير؟ | SOURCE_ONLY / BLOCKED | تتبع كل trigger والتطبيق المنشور + اختبار Browser Notification permission/focus |
| هل رسالة واتساب نُفِّذت عبر Meta؟ | SOURCE_ONLY / BLOCKED | فصل `copied` و`employee-confirmed` و`provider-accepted` و`delivered` في D1، ومقارنة الـmetaMessageId |
| هل نوع «تسجيل الأوردر» متوافق؟ | **SOURCE_CONTRACT_MISMATCH** | mock Native `notify` لقيمتي `order_registered`/`registration` وتسجيل error/response |
| هل Native Comms يرسل فعلًا؟ | BLOCKED — READONLY source mode | إثبات mode/role/secrets وdeploy hash قبل أي فعل، وعدم الإرسال أثناء تدقيق الكتاب |
| هل التصعيد يمنع ردود AI المالية الحساسة؟ | SOURCE_ONLY | اختبار نصوص خطرة وصلاحيات مدير/خدمة العملاء على بيانات وهمية |
| هل البيانات تُخزن دون كشف رسائل العملاء؟ | BLOCKED | مراجعة access control وretention وملفات المحادثة في R2 |
| TESTED / PRODUCTION_VERIFIED | **NO / NO** | ربط [`tests/entry614_employee_comms_native.test.mjs` 1–30](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry614_employee_comms_native.test.mjs#L1-L30) و[`tests/entry630_employee_comms_readonly_dispatch.test.mjs` 1–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry630_employee_comms_readonly_dispatch.test.mjs#L1-L35) و[`tests/trendos_whatsapp_integrity_v1.test.js` 1–40](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/trendos_whatsapp_integrity_v1.test.js#L1-L40) بنتائج CI exact-head |

**النتيجة:** هناك مساران مختلفان: يدوي لنسخ الرسالة وتأكيد الموظف، وNative Comms API مكتوب لكن مُقيَّد في مصدر الإعدادات بـREADONLY. أبرز فجوة جديدة: `order_registered` ≠ `registration` في Native notification contract. **كلها توثيق مصدر ولم يتم تنفيذ إرسال أو تفعيل أو تعديل تشغيل.**


---

# 18. تكامل الحسابات والذمم: TrendOS ↔ EasyStore ↔ D1 (16 أكتوبر 2026)

**نطاق الفصل:** توثيق حدود صلاحية قراءة/كتابة الحسابات، رصيد العميل، مسار الفاتورة والأوامر المالية، ومكان اتصال التشغيل بالمحاسبة. **`SOURCE_ONLY`** من فرع كتاب TrendOS؛ **لا يثبت سلامة معاملات EasyStore الحقيقية** أو اعتماد تقفيل الحسابات في Production. لا تمس بيانات مالية فعلية في تدقيق الكتب.

## 18.1 واجهة التوجيه والوحدتان المختلفتان
- [`config.js` 18–34](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L18-L34) يجعل `MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE='READONLY'` في ملف المصدر؛ [`employee-api-dispatcher-v1.js` 56–63](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L56-L63) و[`employee-api-dispatcher-v1.js` 237–248](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L237-L248) يوجهان مجموعة قراءة محدودة (مثل `getAccounting/getDeptInvoiceDraftV1887/getPartyAccountV1858`) إلى Native؛ لا يجوز الاستنتاج أن جميع معاملات الحسابات مفعلة، أو أن باقي actions تسلك نفس المسار.
- [`cloudflare-d1/src/index_v2.js` 1–95](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/index_v2.js#L1-L95) يربط `/v1/employee/accounting` عبر `employee-accounting-native-v1.mjs` **وكذلك** `/v1/accounting/...` عبر `accounting-native-module.mjs`. الاسمين متشابهان لكن **الوظيفة والسلطة مختلفة**.
- [`cloudflare-d1/src/accounting-native-module.mjs` 20–51](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/accounting-native-module.mjs#L20-L51): عقد تكامل `TRENDOS_ACCOUNTING_NATIVE_V0_10...` يصرح `mode:'preview-integration-contract'`، `cutover:false`، `authoritativeWrites:false`، ويذكر Google/Sheets كمرجعية في هذا العقد التاريخي. الـdiagnostic/validation endpoints في [`cloudflare-d1/src/accounting-native-module.mjs` 67–113](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/accounting-native-module.mjs#L67-L113) **ليست تنفيذًا لدفتر أستاذ مالي**.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 881–893](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L881-L893): endpoint منفصل يحتوي D1 rows/writers، تحكم `employee_accounting_control_v1` بالأوضاع `OFF/READONLY/GENERAL`. `READONLY` يمنع action غير المدرجة بالقراءة؛ `GENERAL` يمكن أن يسمح بأوامر مالية أخرى. **فحص Health للـD1 control وdeployed SHA قبل الحكم**.

## 18.2 صلاحية الموظفين وقرار الاعتماد
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 82–116](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L82-L116): `accountingMode` يقسم المستخدم إلى `full/final/print/laser/none` بالـrole وبعض مطابقات أسماء المستخدمين، ويحدد حق الوصول لتكاليف/أرباح وخطوط الأقسام والفواتير والشراء؛ [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 93–101](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L93-L101) يستدعي `verifyEmployeeSessionCloudFirst` قبل التنفيذ. **فجوة تصميمية:** تعدد قواعد الصلاحية باسم الموظف يتعارض مع توصية عقد التكامل باستخدام RBAC غير مبني على regex للأسماء؛ يلزم ماتريكس Roles server-side واختبار spoofing.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 801–856](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L801-L856): `finalInvoice` يتطلب وضع `full/final` وأوردرًا، وألا تكون بنود الأقسام مقفلة أو غير معتمدة، ويستخدم `requestId` لمنع إعادة محاولة بنفس المفتاح. **منع الازدواج على اسم requestKey** لا يثبت سياسة فاتورة واحدة لكل أوردر أو تأمين race من دون اختبار DB.

## 18.3 الرصيد وكشف الحساب وحدود هوية العميل
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 167–221](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L167-L221): قراءة قائمة العملاء تجمع `t12_customers` مع `employee_accounting_party_balances_v1` بواسطة `customer_id`، بينما مسار `searchCustomersV1` الموضح في نفس الملف يستخرج الرصيد الأخير من `employee_accounting_party_ledger_v1` عبر **`party_name=customer_name`**. **فجوة اتساق محتملة:** تطابق اسمين أو إعادة تسميتهما قد يؤدي لاختلاف عرض الرصيد بين القائمة والبحث. يلزم استخدام `party_id` كمفتاح مالي مثبت ومقارنة نتائج الاثنين.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 167–170](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L167-L170): `customerBalanceByName` يبحث باسم العميل ثم يأخذ أول customer ID مرتب بآخر تعديل؛ ده مصدر محتمل للتباس هوية عند وجود أسماء متكررة. لا يجوز نسب رصيد لعميل اعتمادًا على الاسم من غير إثبات uniqueness.
- مصدر `t12_customer_master.debtAmount` وحده **مش مصدر ذمة مالية نهائية**؛ إثبات كشف حساب العميل يتطلب مطابقة فواتير/مدفوعات/رصيد افتتاحي/عكس حركات بمفاتيح مستقرة واختبار فعلي.

## 18.4 إنشاء الفاتورة وإقرار الحركات المالية
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 817–857](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L817-L857): في مصدر `finalInvoice` يتم حجز رقم فاتورة وكتابة `employee_accounting_final_invoices_v1` وتعديل `employee_accounting_dept_lines_v1` ضمن `db.batch`، **ثم** استدعاء `partyLedger` لإضافة حركتي `invoice` و`payment_received` (عندما يوجد مدفوع) بمفاتيح مشتقة مستقلة.
- **فجوة الذرّية المهمة:** الحفظ الأساسي للفواتير وحركة حساب العميل لا يظهر في **معاملة ذرية واحدة شاملة**؛ لو فشلت حركة دفتر العميل بعد نجاح حفظ الفاتورة، قد تنشأ حالة تحتاج Recovery/Reconciliation. `requestId` وledger حالة `PREPARED` يقللان مخاطر الإعادة لكنه لا يغنيان عن اختبار fault-injection والتعافي، أو مخطط تعويض معتمد.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` 67–80](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-accounting-native-v1.mjs#L67-L80) لديه `employee_accounting_request_ledger_v1` و`employee_accounting_events_v1` للأثر والتوثيق، ولكن مجرد وجودهما مش إثبات مساواة مجموع الدائن/المدين أو ترابط فواتير EasyStore الخارجية.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 270–280](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L270-L280) يؤكد أن `finalizeAndNotify` في خط Go-Live يرجع `accounting-d1-authority-not-ready` ويقف مغلقًا؛ **فلا ندمج آليًا فواتير الإنتاج مع إشعارات التسليم**.

## 18.5 المخزون والهالك والمصروفات
- [`gaber-easystore-ledger-adapter-v1.js` 1–16](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/gaber-easystore-ledger-adapter-v1.js#L1-L16) محول `PURE / ZERO EXTERNAL WRITES` لحركات مواد EasyStore؛ وجوده دليل عقد حسابي محتمل، وليس posting إنتاجي. [`gaber-ledger-daily-report-v1.js` 29–51](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/gaber-ledger-daily-report-v1.js#L29-L51) يربط أرصدة افتتاحية وكميات مشتريات/صرف/هالك وجرد فعلي لكشف فروق التسوية بشكل pure.
- التزام مالك المشروع: **العمالة والكهرباء مصروفات تشغيل، مش تكلفة مباشرة للبند**؛ **الافتتاحيات والديون والمدفوع منه تظهر في كشف حساب العميل**؛ **الموظف يدخل والمالك يعتمد**؛ **الهالك حسب القسم بموافقة مالك/مسؤول**. الكود المعروض لا يكفي لإثبات مطابقة هذه السياسات end-to-end؛ يجب رفع كل بند لاختبار قبول مستقل قبل اعتماد EasyStore/TrendOS محاسبيًا.

## 18.6 خطة الاختبار والحالة
| ما يجب التأكد منه | الحكم | الاختبار المطلوب |
|---|---|---|
| Mode والجهة المالية المرجعية | SOURCE_ONLY / BLOCKED | فحص deployed config وD1 control وwrite authority بدون writes |
| Role matrix موظف → اعتماد | SOURCE_ONLY | اختبار `full/final/print/laser/none` والاسم المعروض vs subject role موثق |
| البحث عن عميل ومطابقة الرصيد | **SOURCE_INCONSISTENCY_RISK** | عميلان بنفس الاسم وIDs مختلفة، تغيير الاسم، مقارنة list/search/statement |
| إصدار فاتورة + دفع + مديونية | **SOURCE_ATOMICITY_RISK** | fault injection بعد batch وقبل ledger posting مع DB معزولة وتعافٍ مؤكد |
| هالك/مصروفات/عهدة | BLOCKED | اختبارات قبول accounting policy وإثبات ميزان المراجعة والكميات الفعلية |
| Financial production | BLOCKED | ليست هناك هنا أي مصالحة مدققة مع EasyStore الإنتاجي |
| TESTED | **لم تُشغّل هذه الجولة** | [`tests/entry614_employee_accounting_native.test.mjs` 1–20](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry614_employee_accounting_native.test.mjs#L1-L20) إن كان الملف موجودًا بعد تحقق الاسم، و[`tests/gaber_easystore_ledger_adapter_v1.test.mjs` 1–25](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/gaber_easystore_ledger_adapter_v1.test.mjs#L1-L25) و[`tests/gaber_ledger_daily_report_balance_gate_v1.test.mjs` 1–25](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/gaber_ledger_daily_report_balance_gate_v1.test.mjs#L1-L25) وربط CI بآخر SHA |

**نتيجة الفصل:** كشفنا boundaries متداخلة ومخاطر هوية/ذرّية على مستوى المصدر، **وليس حكمًا بفشل مالي حدث فعليًا**. `SOURCE_ONLY`؛ `TESTED=NO`؛ `PRODUCTION_VERIFIED=NO`. ممنوع تشغيل تقفيل أو تعديل بيانات فعلية أثناء توثيق الكتاب.


---

# 19. تشغيل الموظفين والمهام والمطبعة الذاتية — صلاحية القرار والتنفيذ (16 أكتوبر 2026)

**وظيفة الوحدة:** شاشة Core للموظفين (قراءة وتحديث حالات/أرشفة)، مسار Operator Tasks، ومستشار المطبعة الذاتية (Shadow). **مستوى الإثبات `SOURCE_ONLY`**: قراءة imports/handlers/SQL دون تشغيل Task أو إسناد موظف أو إغلاق أوردر.

## 19.1 Core D1: قراءات وأوامر الموظف
- [`config.js` 29–34](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L29-L34) يحدد `CORE=GENERAL` في مصدر إعدادات الواجهة؛ [`employee-api-dispatcher-v1.js` 64–89](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/employee-api-dispatcher-v1.js#L64-L89) يعرّف قائمة `CORE_READ_ACTIONS` (قراءة البنود والملخص والسجل ومركز الإدارة) و`CORE_WRITE_ACTIONS` (bulk status والأرشفة وتحديث بند وتسجيل إشعار)؛ التحويل يعتمد أيضًا على `nativeRouteEnabled`. لازم تأكيد الـruntime control وbuild قبل اعتبارها كلها active.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` 1–61](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L1-L61): `/v1/employee/core` يتطلب توثيق session ويقيد الشاشات والأدوار، مع control `employee_core_control_v1`. [`cloudflare-d1/src/employee-core-native-v1.mjs` 331–392](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L331-L392) يرفض `OFF`، ويقصر `READONLY` على القراءات؛ `GENERAL` يسمح بالأوامر المحددة فقط. Health يرجع `schemaReady/mode/policyEpoch/dataVersion`.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` 77–139](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L77-L139): `coreRows` يدمج Native `t12_prod_lines` مع `employee_core_lines_v1` المستوردة ويتجاهل المؤرشف، ويربط دين/منع التسليم على مستوى مصدر البيانات. مقارنة `02CR` مهمة: Core read alias في [`cloudflare-d1/src/employee-core-native-v1.mjs` 352–364](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L352-L364) يرجع `serverPaged:false` وكامل النتائج؛ لا نخلط هذا مع Edge `02CR serverPaged:true`.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` 165–215](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L165-L215): الطلبات الجماعية والأرشفة تستخدم Ledger لمنع إعادة نفس requestId، وتعرض Activity وسجل الأرشيف. [`cloudflare-d1/src/employee-core-native-v1.mjs` 215–280](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L215-L280): `bulkStatus` يفلتر البنود ويمنع تسجيل `تم التسليم` للصف الذي `deliveryDebtRestricted`، والأرشفة تحتفظ بنسخة Snapshot للبنود/الأوردرات.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` 286–329](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-core-native-v1.mjs#L286-L329): `updateSingleLine` المنفرد لبيانات Native/Imported يتحقق من قائمة الحالات، لكن **لا يظهر نفس فحص `deliveryDebtRestricted` قبل ضبط `تم التسليم`**. دي فجوة source تستحق نفس الأولوية المكتشفة في الفصل 15 لمسار Runtime؛ يجب تغطية كل endpoints الفعلية في اختبارات منع التسليم، لأن إصلاح مسار واحد لا يكفي.

## 19.2 Operator Task V2: وسيط Cloud وليس Task authority
- [`cloudflare-d1/src/operator-task-edge-v2.mjs` 11–18](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/operator-task-edge-v2.mjs#L11-L18): تعريف مسارات `/v1/operator/tasks/status` و`claim-next` و`complete`، وعرض fast print ومرشحي المكبس ومقاييس المدير، مع قدرات `WAEL/GABER/MANAGER` حسب route.
- [`cloudflare-d1/src/operator-task-edge-v2.mjs` 144–182](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/operator-task-edge-v2.mjs#L144-L182): يتطلب flag `TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED`، و`EDGE_SESSION_SECRET` وتوقيع/صلاحية الجلسة و`TRENDOS_OPERATOR_TASK_PROXY_SECRET`، ويطلب idempotency key لعمليات التغيير ويرفض أدوارًا غير مطابقة.
- [`cloudflare-d1/src/operator-task-edge-v2.mjs` 99–139](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/operator-task-edge-v2.mjs#L99-L139): بعد Gate الصلاحيات يرسل `operatorTaskEdgeProxyV2` مع HMAC assertion إلى **`APPS_SCRIPT_API_URL`** عبر server-to-server. **Task CREATE/CLAIM/COMPLETE السلطة الفعلية ليست D1 خالصة في هذا المسار**. لا نفترض نجاح بروتوكول التأكيد أو الإسناد المباشر عند تعطل Apps Script.
- [`cloudflare-d1/src/index_v2.js` 159–164](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/index_v2.js#L159-L164) يركب Handler الـOperator، لكن لا يعني أن الـBrowser UI يستخدمه لكل مهام الموظفين، ولا أن صلاحية Tasks متكاملة مع Core الحالي.

## 19.3 المطبعة الذاتية: مستشار لا مدير تنفيذ
- [`cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs` 12–14](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs#L12-L14) يعرض `/v1/autonomous-printshop/shadow/health` و`/recommend` فقط. [`cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs` 113–152](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs#L113-L152) يحدد `SHADOW_READ_ONLY`، `writesAccepted:false` و`employeeAssignment:false`، ويشترط admin Bearer وscreen مسموحة.
- [`cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs` 153–216](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs#L153-L216) يقرأ مرايا تشغيل D1 بعد freshness gate، ويحسب توصية لأفضل مهمة؛ الاستجابة نفسها تصرح `activeTaskAuthorityConnected:false`, `employeeAvailabilityConnected:false`, `designReadinessConnected:false`, `materialReadinessConnected:false`, `machineReadinessConnected:false`.
- **نتيجة معمارية مهمة:** وجود توصية «الشغل التالي» لا يعني أنها اتنفذت أو اتحجزت على ماكينة أو اتسندت لموظف. الوصول لرؤية المطبعة الذاتية يحتاج linking لاحقًا بين Task authority، حالة المورد/الموظف/الماكينة، وسياسة مراجعة وتأكيد، قبل أي cutover إنتاجي.

## 19.4 حالات الأدلة والاختبارات
| جزء | الحكم | اختبار قبول مطلوب |
|---|---|---|
| D1 Core قراءة وفرز/سجل | SOURCE_ONLY | parity بين `CORE getRows` و`02CR page` مع أحداث Native/Imported |
| تحديث بند منفرد وتسليم مدين | **SOURCE_GUARD_GAP** | اختبار `updateSingleLine` و`bulkStatus` وRuntime Native/Legacy على مستخدم وهمي مديون |
| أرشفة وتكرار requestId | SOURCE_ONLY | fault injection وreplay، تحقق من عدم اختفاء بنود مفتوحة وعدم فقد snapshot |
| Operator Task V2 | SOURCE_ONLY / LEGACY_DEPENDENCY | اختبار HMAC/role/idempotency مع mock Apps Script، لا ادعاء استقلال Google |
| المطبعة الذاتية Shadow | SOURCE_ONLY / BLOCKED | اختبار recommend read-only + عدم وجود writes، ثم تصميم approval gate للإسناد |
| TESTED / PRODUCTION_VERIFIED | **NO / NO** | [`tests/entry650_employee_core_order_page_read.test.mjs` 1–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry650_employee_core_order_page_read.test.mjs#L1-L35) و[`tests/operator_task_edge_v2.test.mjs` 1–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/operator_task_edge_v2.test.mjs#L1-L35) مع نتائج CI exact SHA |

**حالة الفصل:** مصدر فقط؛ اختبارات منع التسليم وجاهزية Task execution والمطبعة الذاتية `BLOCKED`. **لم يُعطِ الإيجنت أي أمر للموظفين أو الماكينات، ولم يعدّل كود النظام أو يدمج PR.**


---

# 20. ملفات المطبعة والمرفقات وبروفات الأوردرات: الوصول والتخزين (16 أكتوبر 2026)

**الوظيفة:** فتح خادم ملفات المطبعة للموظف، مساحة رفع العميل للملفات الجاهزة، مرفقات مسودات العميل، وملفات محادثة الأوردر (R2). **حالة الإثبات: `SOURCE_ONLY`، مع فجوات أمن وصول `BLOCKED`**. لم تُفتح أي روابط ملفات فعلية، ولم نقرأ ملفات عميل، ولم نرفع أو نحذف ملفات.

## 20.1 رابط ملفات الموظف وSSO
- [`config.js` 43–52](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L43-L52): `MATBAGY_FILE_SERVER_URL` يشير إلى `files.matbagy.com` في إعدادات المصدر، وقائمة أسماء موظفين مسموحة بالواجهة.
- [`app.js` 1380–1405](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L1380-L1405): `openRemoteFileServer` يفحص `employeeCanOpenRemoteFiles()` محليًا ووجود token، ثم يفتح `/trendos-sso` مع `username` و`token` داخل **Query String**.
- **فجوة أمنية موثقة في المصدر:** نقل token جلسة الموظف في URL قد يعرّضه إلى سجل المتصفح، سجلات الويب أو تسربات `Referer` بحسب سياسة الطرف المقابل. **لا يعني ثبوت تسريب بالفعل**؛ لكنه يحتاج مراجعة دقيقة للخادم المستقبل وإلغاء الاعتماد على session token مباشر داخل عنوان URL لصالح تذكرة قصيرة العمر ومرة واحدة عبر قناة محمية.
- إخفاء زر الملفات أو مطابقة الاسم في JS **ليس ACL للخادم**. يلزم فحص `/trendos-sso` الفعلي وموفر الملفات بصورة مستقلة على بيئة معزولة.

## 20.2 ملف «طباعة على الطاير» للعميل
- [`app.js` 1408–1445](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L1408-L1445): `customerCanUseFastPrintFolder` يحسب الإتاحة من قيم في `state.customer` أو `MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS` الموجودة بالمتصفح؛ `openCustomerFastPrintFiles` يفتح رابط رفع خارجي إذا كان مضبوطًا.
- [`config.js` 62–68](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/config.js#L62-L68): `MATBAGY_FAST_PRINT_UPLOAD_URL='' ` والقائمة الافتراضية فارغة في مصدر هذه النسخة. **بالتالي مش مثبت وجود مسار رفع ملفات جاهز من زر العميل على النسخة المطابقة للمصدر**. لا نخلط ذلك مع `flyPrint` علم الأوردر نفسه (الفصل 12).
- **فجوة الصلاحية:** الـclient flag يقرر عرض/فتح الزر فقط، ولا يثبت أن السيرفر الخارجي يطبق صلاحية العميل على المجلد أو نوع الملفات.

## 20.3 مرفقات مسودة العميل (Legacy Authority)
- [`app.js` 3902–3933](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3902-L3933): `uploadFilesForDraftItem` يرفض محليًا ملفات أكبر من 25MB، يحول البايتات إلى Base64 ثم يبعث `uploadCustomerDraftFile` مع `draftId/itemId/fileName/mimeType/size`.
- [`cloudflare-d1/src/legacy-browser-transport-v1.mjs` 8–35](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/legacy-browser-transport-v1.mjs#L8-L35) و[`cloudflare-d1/src/legacy-browser-transport-v1.mjs` 85–106](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/legacy-browser-transport-v1.mjs#L85-L106) يظهران أن مسار الرفع تابع لعائلة حساب العميل Legacy التي ينقلها Cloud إلى Apps Script، **مش رفع R2 Native للعميل**. تحقق خادم الرفع الأصلي (هوية العميل وOwnership والحجم والنوع وmime sniffing) غير مثبت في هذه الجولة.
- [`app.js` 3740–3825](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/app.js#L3740-L3825): معاينة صور/مستندات بواسطة روابط `attachmentUrl` وعناصر `href/src`، مع `escapeHtml` في المواضع المرصودة؛ لا يثبت هذا وحده صحة URL scheme أو private-read ACL. يلزم اختبار روابط آمنة بدون كشف ملفات عميل آخر.

## 20.4 ملفات محادثات الأوردر للموظف — Cloudflare R2
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 188–207](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L188-L207): `orderConversation` يقرأ محادثة أوردر وبيانات ملفات `employee_order_conversation_files_v1`، مع `visible_to_customer` علامة مرئية؛ هذه ليست بالضرورة آلية تفويض لكل قراءة ملف.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 207–230](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L207-L230): `uploadOrderFile` يفك Base64، يفرض حجم ≤25MB في المصدر، ويكتب على R2 `FILES` ثم يسجل الملف/بصمة SHA256/metadata ورابطه في D1. **فجوة اتساق:** D1 insert يأتي بعد `R2.put`، دون معاملة ذرية مشتركة؛ فشل تسجيل D1 يترك احتمال R2 object يتيم يحتاج cleanup/reconciliation.
- **ملاحظة أمنية مهمة للغاية (SOURCE_ONLY):** [`cloudflare-d1/src/employee-comms-native-v1.mjs` 226–232](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L226-L232) `serveFile` يقرأ R2 بالـfileId ويرجع bytes، و[`cloudflare-d1/src/employee-comms-native-v1.mjs` 305–315](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L305-L315) يستدعيه لمسار `GET /v1/employee/comms/file/{id}` **قبل** فحص الـOrigin أو session على طلبات `/v1/employee/comms`. لا يظهر فحص `visible_to_customer` أو owner/session في `serveFile` المرصود. **ده مؤشر تصميم خطر يستوجب اختبار وصول غير مصرح في بيئة test وقياس حالة النشر**، وليس إثبات حصول تسريب بيانات فعلية.
- رابط الملف قد يُبنى من `FILES_PUBLIC_BASE_URL` إن كان مضبوطًا؛ فلازم فحص ما إذا كانت R2 objects مكشوفة عبر أصل عام خارج handler أيضًا قبل اعتماد الحماية.
- [`cloudflare-d1/src/employee-comms-native-v1.mjs` 319–326](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/cloudflare-d1/src/employee-comms-native-v1.mjs#L319-L326) يقيّد **POST** حسب `OFF/READONLY/GENERAL`، لكن ترتيب `GET file` السابق يلزم فحص سياسة الملفات على حدة؛ لا يجوز افتراض إن وضع `READONLY` يمنع قراءة مرفقات العميل.

## 20.5 الأدلة والفجوات المطلوبة للإغلاق
| المسار | الحالة | اختبار القبول |
|---|---|---|
| Employee File SSO URL | SOURCE_SECURITY_RISK | تحقق عدم تسرب token في URL/log/history/referrer واستبداله بتذكرة قصيرة العمر |
| Fast Print external folder | BLOCKED | إثبات رابط منشور وخادم يفرض صلاحية مستقلة عن browser flag |
| Customer Draft upload | SOURCE_ONLY | اختبارات MIME/size/path/owner في Authority الأصلي مع حسابين وهميين |
| R2 upload → D1 insert | SOURCE_ATOMICITY_RISK | fault injection بعد R2.put والتأكد من cleanup وعدم ملفات يتيمة |
| GET /employee/comms/file | **SOURCE_AUTH_GAP — CRITICAL REVIEW** | اختبار 401/403 لـanonymous/other user/no-visible file على بيئة معزولة وتثبيت deny-before-read |
| Version/deploy parity | BLOCKED | ربط الملف المرصود بالـWorker والـR2/public URL الفعليين |
| TESTED/PRODUCTION_VERIFIED | **NO/NO** | مراجعة [`tests/entry614_employee_comms_native.test.mjs` 1–40](https://github.com/fawakhry/TrendOs/blob/88a45e3f63f2498fd58d933d954313bba8d2ee1e/tests/entry614_employee_comms_native.test.mjs#L1-L40) واختبارات ملفات جديدة على same SHA |

**الحكم:** الكتاب يسجل **مخاطر مصدرية تحتاج فحصًا سريعًا** دون لمس أي ملفات عملاء أو إصدار طلبات GET/PUT إنتاجية. إصلاحها يقع على إيجنت التطوير الأمني، بينما إيجنت الكتاب يوثق ويراقب دليل الإغلاق فقط.


---

# 21. مراقبة النظام وسلامة المرايا والاختبارات — الفرق بين صحة البيانات وتشغيلها (16 أكتوبر 2026)

**المهمة:** توثيق وسائل فحص مزامنة Google/Cloudflare D1، حدود freshness، مؤشرات الأخطاء، وإثبات نتائج الاختبارات والنسخ الفعلية. **الحالة: `SOURCE_ONLY`**، أما إثبات النسخة الحية والـCI على رأس الفرع فـ`BLOCKED`. لا توجد أي عملية طلب على D1 أو Apps Script الإنتاجيين في هذه الجولة.

## 21.1 المسار الأساسي
- [`cloudflare-d1/src/index_v2.js` س112–138](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/index_v2.js#L112-L138) يربط `/v1/edge/orders/02cr/page` بـ`handleEdgeOrders02CRCanaryRequest` ثم ترميم معرّف البند `repairEdgeOrdersResponse02CX`، بينما `/v1/edge/orders/page` القديم يستدعي `guardEdgeOrdersPageRequest` ثم Canary reader. **دي سلسلتان مختلفتان لقواعد freshness** ولا يجب جمعهما تحت حكم واحد.
- [`cloudflare-d1/src/edge-orders-freshness-gate.mjs` س83–107](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-freshness-gate.mjs#L83-L107) يفحص `sheet_catalog`: `status=ready`، تطابق `rowCount/sourceLastRow`، note تنتمي لنمط live sync، وزمن آخر مزامنة ضمن `EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS` (افتراضي 600 ثانية). [`cloudflare-d1/src/edge-orders-freshness-gate.mjs` س121–228](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-freshness-gate.mjs#L121-L228) يرفض 503 عند فقد metadata/عدم تطابق/قدم البيانات، إلا إذا تحققت حالة unchanged-idle المؤهلة بعد فحص مستقل. تظهر `fallback:'apps-script'` في جسم الـJSON القديم، **لكن الحقل وحده لا ينفّذ الرجوع**.
- [`cloudflare-d1/src/edge-orders-idle-verifier.mjs` س29–58](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-idle-verifier.mjs#L29-L58) يستعلم Server-side عن `getD1OrdersLowUsageHeartbeatV1` من `APPS_SCRIPT_API_URL` عند تفعيل `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED`. [`cloudflare-d1/src/edge-orders-idle-heartbeat.mjs` س51–108](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-idle-heartbeat.mjs#L51-L108) يفحص التوقيع المنطقي للحالة الأخيرة، وحداثتها، وثبات بنية مصدر الأوردرات والبنود وعدم زيادة الكتابات/الأخطاء. **هذا اعتماد مشروط على Apps Script في الـlegacy guard فقط، وليس دليلًا على إيقاف Google بكل النظام**.
- [`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` س131–187](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs#L131-L187) فحص 02CR يبدأ بمنع المخطط غير المؤهل، ويستثني `__DEBT__` من معالجة freshness الموضحة؛ [`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` س185–234](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs#L185-L234) يسمح بالقراءة من snapshot مؤهل بنيويًا حتى لو `synced_at` أقدم من الميزانية، ويسجل `baseSnapshotFreshness.degraded` و`enrichmentFreshness.degraded` مع warnings من [`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` س235–277](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs#L235-L277). **الخطر الذي يستلزم قياسًا:** انتهاء صلاحية snapshot بالمفهوم الزمني قد لا يمنع عرض أوردر Legacy تغيّر بعد آخر sync، ما لم يكن overlay/مصدر التحديث يغطي الحدث؛ مصدر الكود لا يثبت حدوث فقد تحديث فعلي.
- [`trendos-edge-orders-read-v1.js` س1010–1055](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/trendos-edge-orders-read-v1.js#L1010-L1055): عند رفض Edge يعيد `ordersUnavailable` ويفشل مغلقًا، حتى إذا سمّى الحقول الداخلية `fallback`. لذلك لا نسجّل أن المتصفح رجع فعليًا إلى Google أو عرض بيانات قديمة دون اختبار route مطابق.

## 21.2 مراقبة المرايا وسلامة الكتابة
- [`cloudflare-d1/src/mirror-gate.mjs` س67–185](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/mirror-gate.mjs#L67-L185) يعرّف `GET /v1/mirror/sheets`، `/stats`، `/capabilities`، `/sheet` كقراءات Metadata/Rows **بدون schema mutation**، ويعيد حالة `rowCount/status/syncedAt/note`. **قراءة المؤشرات لا تساوي مطابقة فعلية لجميع أوردرات التشغيل**.
- [`cloudflare-d1/src/mirror-gate.mjs` س215–316](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/mirror-gate.mjs#L215-L316): heartbeat لا يحدّث timestamp لمرايا إلا بعد فحص `sourceLastRow/sourceLastCol/rowCount/note`، ويستخدم `db.batch` لتحديث timestamps فقط؛ هذا لا يثبت أن كل محتوى صف مطابق للمنبع حين تبقى counts ثابتة.
- [`cloudflare-d1/src/mirror-delta-gate.mjs` س193–329](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/mirror-delta-gate.mjs#L193-L329): delta import يجري preflight ثم `db.batch` للصفوف والمخططات، وبعده readback لعدّاد الصفوف. **فجوة إثبات:** row-count parity بعد الكتابة لا يثبت payload/display/formula digest parity ولا مقاومة replay/out-of-order من دون اختبار سيناريوهاته. فلا نحكم باكتمال مزامنة D1 بمجرد `rowCount===sourceLastRow`.
- [`cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` س216–295](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L216-L295) يدمج mirror مع Legacy runtime وT12 overlays، ويرجع `dataVersion` من `syncedAt` الخاص بمرايا البنود؛ ذلك **ليس إصدار Snapshot موحدًا مُثبتًا** لكل روافد البيانات. ربطه بـ`serverPaging` سبق توثيقه في الفصل 13.

## 21.3 الملاحظة المركزية والسجلات
- سجلات التشغيل الظاهرة في المصدر تشمل `employee_core_events_v1` و`t12_prod_runtime_events` و`employee_comms_events_v1` و`employee_accounting_events_v1` وLedger requests، لكن وجود جداول أحداث منفصلة لا يثبت لوحة مراقبة مركزية واحدة أو alerting متصل بالمالك. **مطلوب** تحديد event IDs وcorrelation IDs موحدة وعلاقة الإصدار/source لكل حركة.
- [`tests/trendos_integrity_dashboard_v1.test.js` س1–56](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/trendos_integrity_dashboard_v1.test.js#L1-L56) يقرأ ثلاث ملفات `.gs` ويمرر `snap` صناعيًا للتحقق من مؤشرات: البنود المكررة، معرفات خاطئة، تكرار حضور/نظافة/مسودات، مكبس، أعطال automations، والـANDON. **ده مصدر ملف اختبار، مش نتيجة تشغيل الاختبار في هذه الجولة ولا دليل أن لوحة المراقبة منشورة**.
- [`tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs` س1–139](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs#L1-L139) يتضمن أمثلة Mock لحدوث stale/idle-success/heartbeat-error؛ محتاج تشغيل نفس الـSHA وتسجيل نتيجة فعلية قبل `TESTED`.

## 21.4 مراجعة CI وGitHub evidence
- **الفرع المراجع:** `agent/trendos-book-audit-v1-20261014` عند بداية هذا التدقيق HEAD `70a839ba79897e55e0d4e49b2b412f2cbaa6ba50`، وPR [#132](https://github.com/fawakhry/TrendOs/pull/132) كان Draft غير مدموج. استعلام GitHub Actions على نفس الفرع `/actions/runs?branch=...&per_page=5` أعاد **`total_count=0`** في لحظة القراءة؛ الاستعلام لا يثبت عدم وجود Workflows بتاريخ/PR آخر، لكنه **لا يعطينا PASS على HEAD**.
- لا تُنقل نتيجة اختبار تاريخي من SHA مختلف إلى `TESTED` على الكود الحالي. رابط تشغيل GitHub Actions يجب أن يذكر `head_sha` الموافق للوظيفة المراجَعة، أو تفصيلًا يربط code-under-test بدقة.
- **قاعدة الإغلاق:** `SOURCE_ONLY` = كود مرصود؛ `TESTED` = نتيجة اختبار فعلية مع command/وقت/نطاق/SHA؛ `BLOCKED` = شرط غير مستوفى؛ `PRODUCTION_VERIFIED` = إثبات منشور مصرح به. لا يُستعاض بحالة Health وحدها عن كامل تجربة UX → API → Auth → DB.

## 21.5 الاختبارات المطلوبة
| المعرّف | فحص القبول | الحكم |
|---|---|---|
| BOOK21-MIRROR-PAYLOAD | same-count but changed content/hash في D1 Mirror، ومنع false freshness | BLOCKED |
| BOOK21-02CR-STALE | مقارنة stale snapshots مع overlays لطلبات Native/Legacy، وعرض warning الصحيح دون اختفاء أوردر | BLOCKED |
| BOOK21-HEARTBEAT | stale only + wrong source shape + exhausted timeout + zero-idle no D1 changes | SOURCE_ONLY |
| BOOK21-CI-HEAD | ربط run URL + tested SHA + command + conclusion بالفرع | BLOCKED |
| BOOK21-OBSERVABILITY | event correlation end-to-end، Health/alert owner/threshold، دون أي أسرار أو PII في Logs | BLOCKED |

**الحكم النهائي للفصل:** البنية فيها قواعد مفيدة لفحص metadata وheartbeat ومنع القراءة عند بعض حالات عدم الاتساق، لكن لا يوجد في جولة المصدر دليل `TESTED` جديد أو `PRODUCTION_VERIFIED`. لا نغير كود النظام أو نحاول تعديل المرايا لتجهيز الأدلة.


---

# 22. إدارة محتوى المنصة والفروع والسوق والإعلانات — صلاحيات Content D1 (16 أكتوبر 2026)

**الوظيفة:** إدارة أقسام TrendOS، الفروع/الفرنشايز، ربط العملاء بالفروع، مقدمي الخدمة، بائعي ومنتجات Marketplace، العلامة البيضاء، الإعلانات، المعرفة والنوت. **الحالة `SOURCE_ONLY`**؛ لا تعديلات لمنتجات أو فروع أو بيانات عملاء أو ملفات إنتاجية خلال التدقيق.

## 22.1 نقطة دخول الواجهة وحدود Cutover
- [`config.js` س28–34](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/config.js#L28-L34) يضع `MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE='READONLY'` في مصدر إعدادات المتصفح. [`employee-api-dispatcher-v1.js` س87–98](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/employee-api-dispatcher-v1.js#L87-L98) قائمة `CONTENT_READ_ACTIONS` هي تسعة أنواع قراءة، و[`employee-api-dispatcher-v1.js` س269–278](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/employee-api-dispatcher-v1.js#L269-L278) لا يوجه إلى Native Content إلا القراءة عند Native session route enabled؛ أفعال الكتابة ليست ضمن هذا التوجيه.
- [`cloudflare-d1/src/index_v2.js` س7–14](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/index_v2.js#L7-L14) يركّب مسار `/v1/employee/content`. [`cloudflare-d1/src/employee-content-native-v1.mjs` س1–19](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L1-L19) يحدد مجموعتين مستقلتين READ/WRITE. [`cloudflare-d1/src/employee-content-native-v1.mjs` س250–283](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L250-L283) يتحقق من جلسة الموظف و`employee_content_control_v1`؛ `OFF` يرفض و`READONLY` يمنع الكتابات و`GENERAL` قد يسمح بها طبقًا لـ`canManage`. **لا نعتبر أعمال الحفظ Native منشورة بمجرد وجود دوالها**.

## 22.2 نموذج تخزين المحتوى
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س54–81](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L54-L81) يستخدم `employee_content_records_v1` بمفاتيح `collection + record_id`، `record_json`، active/sort/order/version، وجدول `employee_content_events_v1` للأثر. استعلامات list/read تفصل النشط عن غير النشط. `softDelete` يجعل `active=0`، لا يحذف السجل مباشرة.
- **فجوة التزامن:** `upsert` يقرأ version ثم يكتب version+1 دون إظهار شرط `WHERE version=expected` على الـUPDATE. طلبان متزامنان لتغيير نفس السجل ممكن يؤديان إلى overwrite آخر تعديل؛ يحتاج اختبار conflict/optimistic locking ولا نعلن حادثة إنتاج.
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س29–39](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L29-L39): `canManage` يفحص `admin`، وباقي الصلاحيات مبنية جزئيًا على أسماء موظفين محددة أو `role=service`؛ السماح بكل الموظفين في `notes` مقصود حسب الدالة لكن يجب مطابقة الصلاحية مع سياسة المنتج. **لا تستخدم أسماء الموظفين كبديل عن RBAC ممنوح ومراجع باستمرار**.

## 22.3 فروع مطبعجي وربط العملاء
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س155–182](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L155-L182) يقرأ ويحفظ `franchise_branches` و`service_provider_routes` ويسمح بإخفاء الشركاء عن العميل بحسب `customerVisibility` و`branchRole`. إخفاء أحدهم في الاستجابة العامة لا يثبت عدم عرضه في مسارات واجهة أخرى؛ يلزم تحقق متعدد المصادر.
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س123–140](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L123-L140) `assignCustomerBranch` يبحث باستخدام `customer_id` أو أكواد قديمة أو `customer_name_key` ويأخذ `LIMIT 1` بأولوية لمعرف العميل؛ **لو الاسم يطابق أكثر من عميل، ينتج اختيار واحد دون إشارة ambiguity ظاهرة في هذا الكاتب**. مطلوب رفض الالتباس أو الاعتماد على معرف العميل المستقر، ثم اختبار بيانات وهمية بأسماء متشابهة قبل الوثوق بربط الفرع.
- الكتابة الفعلية هنا `UPDATE t12_customers` مع event ضمن `db.batch`، بشرط صلاحية Content و`GENERAL`. لا يعني ذلك تنفيذ تسعير، توزيع شغل أو تفعيل فرع على ماكينة.

## 22.4 سوق Trend Mall ومعرفة الموظفين
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س184–201](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L184-L201) يعالج `marketplace_vendors/products` ويحفظ الأكواد/الأسماء/الترتيب؛ وقد يرفع صورة R2 عند وجود base64. وجود منتجات في D1 **مش برهان وجود بيع/دفع/عمولة أو مخزون موحَّد مع EasyStore**.
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س227–250](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L227-L250) يقرأ/يحفظ `knowledge` و`notes` كوثائق تشغيلة؛ تخزين قواعد المعرفة لا يثبت أنها استُخدمت في إجابة تلقائية صحيحة أو صلاحيات عرض أسرار داخل النص.
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س205–223](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L205-L223) يتعامل مع أرقام عملاء محتملين والإعلانات، وهي بيانات تحتاج سياسة وصول/احتفاظ وموافقة نشر؛ إظهارها في إدارة المحتوى لا يثبت مشاركة العميل لموافقته التسويقية.

## 22.5 ملفات R2 داخل Content
- [`cloudflare-d1/src/employee-content-native-v1.mjs` س83–110](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L83-L110): `uploadPublicFile` يضع الملف على R2 ثم ينشئ metadata في `employee_content_files_v1` ورابط public أو proxy؛ فشل D1 بعد PUT يترك احتمال object يتيم (كما في الفصل 20).
- **ملاحظة مراجعة أمنية مستقلة:** [`cloudflare-d1/src/employee-content-native-v1.mjs` س103–109](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L103-L109) `serveFile` يرجع bytes بمجرد معرفة fileId مع `cache-control: public`، و[`cloudflare-d1/src/employee-content-native-v1.mjs` س250–267](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-content-native-v1.mjs#L250-L267) يعالج GET قبل المصادقة، مع Origin guard لكنه **ليس user authorization**. قد يكون ده مقصودًا لصور إعلانات ومنتجات منشورة، لكن يجب تعريف collection/public policy صريحة والتأكد من منع رفع مواد داخلية ثم كشفها عبر نفس route. **SOURCE_ONLY** وليس دليل كشف بيانات حقيقي.

## 22.6 الاختبارات/الأدلة
| الحالة | المطلوب | التصنيف |
|---|---|---|
| READONLY vs GENERAL | التحقق من flag الواجهة + control الخادم + deploy SHA، والتأكد أن writes لا تعمل في READONLY | SOURCE_ONLY / BLOCKED |
| RBAC collections | موظفون بأدوار مختلفة وقراءة بيانات خاصة وإدارة فروع/إعلانات | BLOCKED |
| تسمية عميل وربط فرع | اسمين متطابقين/أكواد مختلفة، رفض الالتباس أو اختيار معرف صريح | SOURCE_AMBIGUITY_RISK |
| upsert المتزامن | إرسال تعديلين بنفس version واختبار منع lost update | SOURCE_CONCURRENCY_RISK |
| R2 Content GET | عام/خاص لكل collection، anonymous/other user، cache headers، path spoofing | SOURCE_AUTH_POLICY_GAP |
| بازار ومبيعات | إثبات أن marketplace catalog ليس financial order authority بدون عقد دفع/أوردر | BLOCKED |
| TESTED | **لا اختبارات منفذة في هذه الجولة** | راجع [`tests/entry614_employee_content_native.test.mjs` س1–50](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/entry614_employee_content_native.test.mjs#L1-L50) و[`tests/entry629_employee_content_readonly_dispatch.test.mjs` س1–50](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/entry629_employee_content_readonly_dispatch.test.mjs#L1-L50) واربط Run exact SHA |

**الحكم:** وجود Writer للمحتوى وMarketplace لا يعني انتقال سلطة الحفظ بالكامل إلى Cloud Native على الواجهة؛ هناك فجوات وصول/تزامن/هوية تحتاج إثباتًا على نسخة معزولة. `TESTED=NO` و`PRODUCTION_VERIFIED=NO`.


---

# 23. شؤون الموظفين والحضور والنظافة والمكبس — Employee Ops D1 (16 أكتوبر 2026)

**الوظيفة:** إدارة بدء يوم العمل والتسجيل اليومي وبصمات التواجد، طلبات HR، تنظيف وتجهيز المكان، ودورات تشغيل المكبس. **الإثبات `SOURCE_ONLY`**؛ لا تسجيل حضور/تأخير/خروج أو خصم أو تشغيل ماكينة حقيقي ضمن مراجعة الكتاب.

## 23.1 نقطة دخول المستخدم وControl
- [`config.js` س29–34](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/config.js#L29-L34) يعلن `MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE='GENERAL'` في مصدر الواجهة. [`employee-api-dispatcher-v1.js` س38–55](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/employee-api-dispatcher-v1.js#L38-L55) يصنف `attendanceV1/attendanceClockinV1/hrV1/cleaningV1/pressControlV1` ضمن Ops actions، و[`employee-api-dispatcher-v1.js` س221–239](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/employee-api-dispatcher-v1.js#L221-L239) يوجّه `GENERAL` إلى Native. لا يُعتمد التشغيل إلا عند تطابق deployed assets مع `employee_ops_control_v1` في D1.
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س54–96](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L54-L96) `/v1/employee/ops` و`/health` مع schema readiness ودور الموظف الذي تحقق عبر `verifyEmployeeSessionCloudFirst`. [`cloudflare-d1/src/employee-ops-native-v1.mjs` س261–296](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L261-L296) يطبق `OFF/READONLY/GENERAL` قبل dispatch للأفعال الخمسة؛ Health لا يثبت نجاح كتابة التواجد أو حركة المكبس.

## 23.2 الحضور وبصمات التواجد
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س42–48](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L42-L48) يحسب وقت اليوم باستخدام `Africa/Cairo`، و[`cloudflare-d1/src/employee-ops-native-v1.mjs` س101–139](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L101-L139) يأخذ وقت البداية المخصص أو الإعداد الافتراضي (12:00)، ويحتفظ بيوم حضور واحد لكل `username/dateKey` في `employee_attendance_days_v1`، ويسجل pulse البداية في `employee_attendance_pulses_v1` مع حدث تتبع.
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س140–170](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L140-L170) يتيح `pause/resume/restStart/prayerStart/confirm/heartbeat/missedCheck/end` ويضيف pulse منفصلة لكل طلب. **فجوة مصدرية محتملة:** لا يظهر idempotency key لهذه الـpulses؛ تكرار POST أو تأخير الشبكة قد يسجل حدث تواجد مكرر رغم حماية بدء اليوم. لازم اختبار replay بتوكن معتمد على قاعدة وهمية.
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س171–185](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L171-L185) `clockin` يحسب فرق الدقائق بين وقت القاهرة الفعلي وموعد البداية ويكتب وصف «مبكر/متأخر/في الموعد»، مع `duplicatePrevented` إذا فيه clockin قائم. **ده تسجيل موعد دخول، مش دليل صلاحية حساب خصم مالي أو مراقبة فعلية لوجود الموظف على الماكينة**.

## 23.3 HR والنظافة
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س188–218](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L188-L218) `hrAction` يسمح للموظف بإرسال طلب جديد `قيد المراجعة`، و`myRequests` خاصة به، و`requests` لمدير/خدمة عملاء و`employees` للمدير فقط. **لا يوجد في المسار المُراجع هنا approval workflow مالي ولا عقود/رواتب منشورة مثبتة**.
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س219–237](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L219-L237) `cleaningAction` يكتب مرة لكل موظف/يوم أو يرجع `duplicatePrevented` عند وجود تسجيل، ويسجل Problem found وتفاصيل مشكلة. **لا دليل اعتماد مدير على نتيجة التنظيف أو استكمال معالجة العطل** في هذا المسار وحده.
- لازِم ربط سياسات الخصوصية للموظفين وسجل التعديلات والاحتفاظ، خاصةً أن معلومات الالتزام والـattendance حساسة ولا ينبغي عرضها لكل موظف.

## 23.4 جلسة المكبس والتكلفة
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س198–225](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L198-L225) يجمع أوردرات المكبس من `t12_prod_lines` و`employee_core_lines_v1`، مستبعدًا الحالات النهائية ويحسب عدد أوردرات مختلفة وurgent. **العدد لا يقيس تلقائيًا عدد القطع أو دقائق كل ماكينة**.
- [`cloudflare-d1/src/employee-ops-native-v1.mjs` س226–261](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-ops-native-v1.mjs#L226-L261): `pressAction` يقيّد بدء/إيقاف المكبس بدور/أسماء معينة، يمنع فتح جلسة ثانية إذا الأولى موجودة، ويحفظ مدة التشغيل، `ordersPressed`، kWh المقدَّر = `powerKw * minutes / 60`، وتكلفة كهرباء حسب التعريفة في الإعدادات.
- **التمييز المحاسبي:** الكهرباء المحسوبة هنا **تقديرية ومصروف تشغيل** وليست تكلفة مباشرة مثبتة لكل أوردر أو قياس عداد؛ لا يجوز ترحيلها تلقائيًا كمصروف مالي محقق بدون اعتماد EasyStore/محاسبة. `ordersPressed` يدخل يدويًا عند الإغلاق؛ لا يعتبر تشغيلًا أو إتمامًا آليًا للأوردرات.
- **فجوة قرار آلي:** جلسة المكبس لا تثبت جاهزية الورق/التصميم/الخامات أو توافر الموظف قبل إسناد مهمة، وهذا يؤكد أن المطبعة الذاتية ما زالت بحاجة Task/Resource Authority مستقلة (الفصل 19).

## 23.5 الأدلة والاختبار
| السيناريو | المطلوب | الحكم |
|---|---|---|
| Policy / Session | حساب وهمي `admin/service/print/laser` ومحاولات تعديل غير مسموحة | SOURCE_ONLY / BLOCKED |
| attendance replay | بدء يوم مرة واحدة، clockin مكرر، pulse `heartbeat/end` مكرر | BLOCKED |
| timezone | حد منتصف الليل القاهرة وإعداد بداية خاص بيوم محدد | SOURCE_ONLY |
| HR privacy | `myRequests` لا تُرجع طلبات الآخرين، و`employees` للمدير فقط | BLOCKED |
| cleaning replay | طلبان متزامنان لنفس الموظف واليوم + حالة problemFound | BLOCKED |
| press double start / stop | جلسة واحدة فقط، وحساب المدة والتكلفة عند غياب Power/Rate | BLOCKED |
| TESTED | لم تُشغّل اختبارات في هذه الجولة | اقرأ [`tests/entry614_employee_ops_native.test.mjs` س1–42](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/entry614_employee_ops_native.test.mjs#L1-L42) واربط Run/test SHA |

**النتيجة:** Employee Ops يضم تنفيذ D1 مصدرّي لجلسات حضور وHR ونظافة ومكبس، لكنه **ليس برنامجًا إنتاجيًا متحققًا للخصومات أو أتمتة التشغيل**. `TESTED=NO`, `PRODUCTION_VERIFIED=NO`.


---

# 24. المطبعة الذاتية كمشروع مرتبط: التحكم والمشرف والأدلة — دون خلط سلطات (16 أكتوبر 2026)

**حد الكتاب:** المطبعة الذاتية مشروع Orchestration أعلى TrendOS، ولها كتاب Canonical **مستقل** [`autonomous-printshop/MASTER_BOOK.md` 1–55](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/MASTER_BOOK.md#L1-L55)، الذي يمنع نسخ Entries المشروع إلى `TrendOS_MASTER_BOOK.md`. هذا الفصل مجرد **خريطة ربط تقنية** لبوابات TrendOS الحالية، وليس تكرار سجل إنجازات المطبعة الذاتية أو شهادة إنتاج مستقلة. **`SOURCE_ONLY`** لهذا الربط؛ أي Claims Production داخل الكتاب المستقل تحتاج مراجعة أدلتها/الرن تايم بصورة منفصلة.

## 24.1 توزيع المسؤوليات
- [`autonomous-printshop/MASTER_BOOK.md` 1–67](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/MASTER_BOOK.md#L1-L67): TrendOS مصدر أوردرات/عملاء/تشغيل في المسارات المعتمدة؛ Matbagy-OS هو مسؤول AI Orchestrator؛ EasyStore مرجع الحسابات، وOperator Tasks مسؤول عن المهام المادية وفق حدود التفعيل. الهدف تقليل تدخل المالك في الروتين، وليس إلغاء حضور الموظف.
- [`autonomous-printshop/core/autonomy-policy-v1.mjs` 6–58](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/autonomy-policy-v1.mjs#L6-L58) يصنف `AI_AUTO`, `HUMAN_PHYSICAL`, `HUMAN_EXCEPTION`, `OWNER_ONLY`, `BLOCKED`. [`autonomous-printshop/core/autonomy-policy-v1.mjs` 92–150](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/autonomy-policy-v1.mjs#L92-L150) قرار الأتمتة `autopilotEnabled` **OFF افتراضيًا**، والطلبات الناقصة/الجديدة/المحتاجة اعتماد تذهب لاستثناء بشري. هذه سياسة مصدرية؛ ليست دليل تنفيذ تلقائي.
- [`autonomous-printshop/core/operational-reality-v1.mjs` 1–37](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/operational-reality-v1.mjs#L1-L37) يصنف العمل وأسباب التعطل/عدم الأهلية؛ [`autonomous-printshop/core/readiness-evidence-v1.mjs` 9–84](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/readiness-evidence-v1.mjs#L9-L84) يربط لكل `lineId` ثلاث أدلة `DESIGN/MATERIAL/MACHINE` وقيم READY/BLOCKED/UNKNOWN، ويتعامل مع غياب الدليل باعتباره UNKNOWN، لا توافرًا افتراضيًا.

## 24.2 تحضير التصميم والخامة والماكينة
- [`autonomous-printshop/core/design-preflight-v1.mjs` 17–111](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/design-preflight-v1.mjs#L17-L111) يقيّم ملف تصميم ومتطلبات recipe ويعيد `productionReady` فقط بعد PASS؛ لا يتعامل مع صورة العميل على أنها تصميم قابل للطباعة بلا preflight.
- [`autonomous-printshop/core/material-readiness-candidate-v2.mjs` 1–69](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/material-readiness-candidate-v2.mjs#L1-L69) يقيم كفاية الخامة ويولد `BLOCKED` عند النقص؛ توليد READY مشروط بـ`allowReady===true` و`accountingGeneral===true` وشروط إضافية؛ ده يحمي من اتخاذ قرار صرف خامات قبل تأهيل مصدر الرصيد المالي/المخزني.
- [`autonomous-printshop/core/machine-readiness-v1.mjs` 24–85](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/machine-readiness-v1.mjs#L24-L85) يربط الماكينة بالبند وObservation أخير وله مدة صلاحية محدودّة: دليل READY حتى 15 دقيقة، وBLOCKED/MAINTENANCE حتى 8 ساعات، طبقًا للمصدر. **مؤشر تاريخي أو قول موظف غير مؤهل لا يصنع Machine READY دائم**.

## 24.3 مهام Operator بين التصميم والتنفيذ
- [`autonomous-printshop/core/operator-task-authority-v1.mjs` 1–13](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/operator-task-authority-v1.mjs#L1-L13) يعرّف D1 task authority foundation مع شرط task واحدة نشطة للموظف والبند وidempotent claim/complete. [`autonomous-printshop/core/operator-task-authority-v1.mjs` 55–101](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/operator-task-authority-v1.mjs#L55-L101): OFF وSHADOW يمنعان mutation؛ CANARY يقيّد مشغلًا واحدًا؛ GENERAL نظريًا يسمح حسب control. **وجود module لا يعني أنه المسار الذي يستعمله جميع الموظفين**؛ الفصل 19 أثبت أن Edge Operator Task V2 الموجود يرسل assertion إلى Apps Script.
- [`autonomous-printshop/observer/worker.mjs` 61–76](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/observer/worker.mjs#L61-L76): Observer يلتزم `SHADOW` وReadiness `SHADOW`؛ [`autonomous-printshop/observer/worker.mjs` 153–207](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/observer/worker.mjs#L153-L207) يقدّم preview دون business writes ولا إسناد وظيفي. **سجل قرار Shadow أو Observations ليس أوردرًا نُفّذ**.

## 24.4 Control Tower والاستثناءات المحمية
- [`autonomous-printshop/dashboard/worker.mjs` 1–60](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/dashboard/worker.mjs#L1-L60) يقرأ لوحة التحكم من Service Bindings `SHADOW` و`READINESS_COLLECTOR`، مع مؤشرات qualified Canary؛ [`autonomous-printshop/core/control-tower-panel-status-v1.mjs` 1–47](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/control-tower-panel-status-v1.mjs#L1-L47) يفصل Freshness لكل Panel عن اكتمال الحقيقة، ويرجع `UNAVAILABLE` عند نقص الدليل بدل عرض صفر خادع.
- [`autonomous-printshop/core/owner-exception-model-v1.mjs` 1–104](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/core/owner-exception-model-v1.mjs#L1-L104) يصنف أعطال الماكينة ونقص الخامات ورفض العميل والسعر الحساس حسب من يملك القرار؛ لا يُمنح الـAI سلطة خصم أو رد مال أو عقوبة موظف بمجرد وجود توصية.
- [`autonomous-printshop/employee-supervisor/worker.mjs` 88–112](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/employee-supervisor/worker.mjs#L88-L112): المشرف يجمع بلاغات عوائق الموظفين، ويعلن `businessWrites:false` و`employeeAssignment:false` و`writeAuthority:'AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_ONLY'`. هذا ليس تصريحًا بإنهاء الأوردر، بل مسار توثيق حالات الاستثناء.

## 24.5 فجوات الربط وعبور حدود التشغيل
| بوابة | القيد في المصدر | دليل التأهيل المطلوب |
|---|---|---|
| Order Authority | حالة الأوردر/الموعد والـflyPrint ما زالت تحت فصول 10–15 | IDs موحدة وسياسة التسليم، source exact-head |
| Customer Design | بروفات التصميم وملكية العميل قد تبقى Legacy؛ الفصل 16 | دليل owner approval وasset provenance في Matbagy-OS |
| Material | `accountingGeneral` شرط READY في مادة V2 | مصدر مخزون معتمد ورفض CANARY/OFF + دفاتر EasyStore |
| Machine | OBS + TTL لا تعني فرمان تشغيل | إثبات ماكينة/Operator قبل job assignment |
| Task | دالة D1 موجودة لكن V2 Edge قد يستخدم Apps Script | تحديد authority واحد وإثبات claim/complete على نسخة منشورة |
| Owner Exceptions | منع قرار مالي/عقوبة بلا صاحب قرار | سجل approval واضح وتصعيد وإغلاق أدلة |
| Automation | SHADOW/READ_ONLY لا ينفّذان الإنتاج | اختبار CANARY مصرح به بعينات وهمية ثم separate production approval |
| TESTED/PRODUCTION_VERIFIED | لم ننفذ Workflows ولا نتصل بخدمات حية | اختبار وحدات مثل [`autonomous-printshop/tests/autonomous_printshop_shadow_route_v1.test.mjs` 1–30](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/tests/autonomous_printshop_shadow_route_v1.test.mjs#L1-L30) و[`autonomous-printshop/tests/machine_readiness_v1.test.mjs` 1–30](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/autonomous-printshop/tests/machine_readiness_v1.test.mjs#L1-L30) + runtime SHA |

**النتيجة:** تركيب أجزاء المطبعة الذاتية موجود في المستودع، لكن الإيجنت سجل **حدود الصلاحية ودليل الجاهزية**، دون وصف Shadow بأنه تشغيل آلي مكتمل. للاطلاع على تاريخ نشر المطبعة الذاتية وتطور AP-081/AP-082 ارجع للكتاب المستقل، ولا تنقل نتائجه لتصنيف TrendOS ما لم يرتبط بنفس الـruntime والـdeploy.


---

# 25. لوحات المدير والتقارير والتقييمات ومصادر الذكاء (16 أكتوبر 2026)

**حد المراجعة:** واجهة مدير TrendOS، تحميل Trend Master panels، Work Queue القديم، طلب تقييم العميل بعد التسليم، وعقود غرفة AI/استخلاص المعرفة. التوثيق هنا `SOURCE_ONLY`، وليس شهادة أن التقرير يعكس الحقيقة اللحظية أو أن رسائل التقييم تُرسل آليًا في Production.

## 25.1 لوحة المدير مقابل صلاحية Backend
- [`manager-center-v1932.js` س10–23](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/manager-center-v1932.js#L10-L23): الواجهة تعرض «لوحة المدير» فقط حين `isAdmin()` محليًا (admin أو أسماء مستخدمين معينة)، وتحمل `getTrendMasterCenterV1931` من `trendosEmployeeApiV1`. `loadProgressive()` موجودة لكنها لا تظهر مستدعَاة من `load()` أو `open()` في هذا الملف؛ مسار الـmodal الحالي يحمل التجميعة كلها مرة واحدة، لذلك **لا نؤكد أن تقسيم Panels يحمي زمن فتح اللوحة بالفعل**.
- [`trend-master-resilience-v1931.js` س7–41](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/trend-master-resilience-v1931.js#L7-L41) يوجد Reader منفصل للوحة Trend Master panels (summary/archive/messages/stock/employee/debt/dayclose) مع cache/stale وإعادة المحاولة. وجود renderer متقدم لا يضمن استخدامه من زر Manager Center المذكور.
- **مراجعة صلاحيات مهمة:** [`cloudflare-d1/src/employee-core-native-v1.mjs` س200–216](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-core-native-v1.mjs#L200-L216) `trendMaster` يجمع `coreRows('service')` وبيانات المديونيات والقيود وسجلات الموظفين، ثم يرجع `permissions` خاصة بالتحكم؛ [`cloudflare-d1/src/employee-core-native-v1.mjs` س353–382](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-core-native-v1.mjs#L353-L382) dispatch `getTrendMasterCenterV1931` بعد المصادقة ولكنه **لا يظهر شرط Admin/Service أو `screenAllowed(service)` قبل إرجاع هذه البيانات**. إخفاء زر المدير ليس حماية API. يجب اختبار رفض طلب موظف أقل صلاحية لبيانات الدين والسجل؛ لا نعلن كشف بيانات حدث في Production دون إثبات مسار منشور.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` س179–188](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-core-native-v1.mjs#L179-L188) `getActivityLog` يرجع أحداثًا من جداول تشغيل متعددة، ولا يظهر أيضًا شرط screen/role على نفس الـdispatch؛ اختبارات scope لكل مستخدم واجبة لحماية بيانات زملائه وعملائه.

## 25.2 مصدر التقرير ومعنى الصفر
- [`cloudflare-d1/src/employee-core-native-v1.mjs` س200–216](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/cloudflare-d1/src/employee-core-native-v1.mjs#L200-L216) يكوّن employeePerformance من عدد الأحداث، و`messageQueue:[]`، و`dayClose:null`، و`duplicateHealthy:true`، و`overdue` من صفوف `coreRows`. دي **قيم استجابة مُكوّنة في هذا المصدر** وليست كلها قياسًا متكاملاً لجميع الأنظمة (كاشير/واتساب/الجداول/الماكينات).
- [`manager-center-v1932.js` س19–21](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/manager-center-v1932.js#L19-L21): عند غياب صفوف أو فشل source قد يعرض «لا توجد بيانات ... أو لم يكتمل تحميلها»؛ المطلوب التمييز في Dashboard بين `zero` الملاحظ فعليًا و`UNKNOWN` و`FAILED` حتى لا يتحول عدم وصول مصدر إلى مؤشر نجاح.
- [`trend-master-panels-v1931.gs` س1–29](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/trend-master-panels-v1931.gs#L1-L29) Backend قديم قائم على Apps Script/Sheets موصوف `read-only candidate` وغير مثبت النشر، ويكوّن `getTrendMasterPanelV1931`؛ لا تخلط نتائجه مع تقرير D1 الحالي إذا لم يوجد parity/lineage واضح.

## 25.3 Work Queue القديم ومصدر Task authority
- [`work-queue-v1.js` س1–30](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/work-queue-v1.js#L1-L30) واجهة مشروطة بـ`MATBAGY_WORK_QUEUE_V1===true` وتستدعي action `workQueueV1` من Dispatcher؛ [`work-queue-backend-v1.gs` س1–18](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/work-queue-backend-v1.gs#L1-L18) يوضح أن Work Queue V1 يستخدم الحجز والوقت الحقيقي على Apps Script/Sheets، مع قاعدة مهمة عادية واحدة لكل موظف، والاستثناء العاجل للطاير/المكبس.
- [`work-queue-backend-v1.gs` س52–71](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/work-queue-backend-v1.gs#L52-L71) يتطلب تفعيل `WORK_QUEUE_ENABLED` في Properties ويحمي عمليات الدور بقفل Script؛ إذًا **اسم Work Queue لا يثبت أنه Task Authority D1 Native أو أن زر الواجهة مفعّل**. للمقارنة مع Operator Task V2 وD1 Authority الجديد راجع الفصلين 19 و24؛ يمنع ازدواج السلطات عند الترحيل.

## 25.4 تقييم العملاء وAI Knowledge
- [`config.js` س171–179](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/config.js#L171-L179): `MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1=false` في المصدر؛ [`customer-feedback-v1.js` س9–26](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/customer-feedback-v1.js#L9-L26) يعتمد على flag منفصل لتشغيل scan على مؤقت/Focus. وجود الإيجنت لا يعني إرسال طلب تقييم تلقائي.
- [`customer-feedback-backend-v1.gs` س22–43](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/customer-feedback-backend-v1.gs#L22-L43) قد يرسل طلب تقييم بعد `تم التسليم` عبر Meta مع سجل Sheets وWebhook لتلقي 1–5 وتصعيد تقييم ≤3. لا يجوز افتراض أن مسار Backend Legacy ده مستخدم في PROD إذا كانت Comms Native READONLY؛ لازم تحديد سلطة أرقام الأوردر واتساب والتقييم ومنع التكرار end-to-end.
- [`docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md` س58–83](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md#L58-L83) يضع `AI_AUTHORITY=ADVISORY_ONLY` في غرفة AI متعددة النماذج؛ [`docs/trendos/MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md` س128–169](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/docs/trendos/MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md#L128-L169) يفرق بين استخراج Candidate معرفي وبين Memory Approved/Deploy، ولا يعتبر تكامل WhatsApp ingestion وKnowledgeDB مفعلًا تلقائيًا. أي رد تصميم أو قرار سعر أو تقييم AI **استشاري حتى ينتقل عبر Evidence/Owner أو Customer Approval موثّق**.

## 25.5 فحوص الإغلاق
| الملف/الخدمة | الحالة | المطلوب |
|---|---|---|
| Manager D1 API role | SOURCE_AUTH_GAP | mock مستخدم `print/laser` يطلب `getTrendMasterCenterV1931/getActivityLog`؛ تأكيد رفض البيانات الحساسة |
| Manager progressive loading | SOURCE_UI_GAP | فحص زري Open/Refresh والتأخير/failure على مصدر Panel وهمي؛ عدم تمويه الفشل |
| KPI integrity | BLOCKED | تمييز 0/UNKNOWN/STALE + مقارنة Source of Truth لكل KPI |
| Work Queue V1 / V2 | BLOCKED | إثبات writer واحد وعدم تكرار claim، وحالة flags المنشورة |
| Feedback | SOURCE_ONLY / BLOCKED | إثبات auto-scan OFF وطريق send/rating/duplication في Sandbox |
| AI Knowledge | BLOCKED | Role/PII/Data ownership + Evidence/approval قبل promotion، لا إصدار قرار تلقائي |
| TESTED/PRODUCTION_VERIFIED | NO/NO | ملفات [`tests/trendos_integrity_dashboard_v1.test.js` س1–25](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/trendos_integrity_dashboard_v1.test.js#L1-L25) و[`tests/operator_task_edge_v2.test.mjs` س1–30](https://github.com/fawakhry/TrendOs/blob/70a839ba79897e55e0d4e49b2b412f2cbaa6ba50/tests/operator_task_edge_v2.test.mjs#L1-L30) وغيرها تحتاج تشغيل exact-head موثَّق |

**الخلاصة:** اللوحات وWork Queue والتقييم والـAI موجودة كمسارات متعددة، لكن **مصادر الحقيقة وسلطة القراءة والكتابة تختلف**. لا تدع اسم الزر أو وجود الملف ينتقل لحالة تشغيل معتمدة دون اختبار. هذه مراجعة توثيقية فقط.


---

# 26. سلامة مسارات الاستيراد والمرايا وإثبات نسخة النشر الحالية (16 أكتوبر 2026)

**النطاق الحالي فقط:** هذا الفصل يوثّق الـEndpoints **الموجودة في الـWorker المصدرّي حاليًا** والتي تستقبل normalized imports وraw mirror deltas وتقرأ تشخيص المرايا، مع شروط إثبات إصدار Cloudflare Worker وربطه بكود GitHub. **ليس فصلًا عن تاريخ نقل Google إلى D1**؛ ملفات الهجرة التاريخية مراجع Source فقط حين ما زال المسار يستدعيها، لا شهادة cutover. **إثباتنا `SOURCE_ONLY`**: لم نرسل import/GET إلى الإنتاج، ولم نقرأ بيانات Sheets/D1 حقيقية، ولم ننفّذ workflow نشر أو rollback.

## 26.1 سلسلة سلطة المسارات الحالية
- [`cloudflare-d1/wrangler.toml` س1–40](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/wrangler.toml#L1-L40): مصدر إعداد Worker باسم `trendos-d1-api` و`main="production-shadow/index.js"`، DB binding باسم `DB` إلى قاعدة `trendos-main`، مع `MIGRATION_SECRET` مطلوب من Runtime (غير محفوظ بنصه في الملف). هذه **ملفات تعريف** ولا تثبت أن deployed version يحتوي نفس source.
- [`cloudflare-d1/production-shadow/index.js` س22–57](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/production-shadow/index.js#L22-L57) يرسل الطلبات غير المعترَضة إلى `core.fetch`؛ [`cloudflare-d1/src/index_v2.js` س175–195](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/index_v2.js#L175-L195) يربط `POST /v1/import/batch` بـ`normalized-import-gate.mjs`، و`POST /v1/mirror/delta` بـ`mirror-delta-gate.mjs`، ومجموعة GET Mirror بـ`mirror-gate.mjs`.
- [`cloudflare-d1/src/normalized-import-gate.mjs` س55–60](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/normalized-import-gate.mjs#L55-L60) و[`cloudflare-d1/src/mirror-delta-gate.mjs` س51–55](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-delta-gate.mjs#L51-L55) يرفضان import/delta من دون `x-migration-secret` مطابق؛ [`cloudflare-d1/src/mirror-gate.mjs` س60–65](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-gate.mjs#L60-L65) يحمي POST heartbeat/import أيضًا. لا نستنتج أن كتم CORS يعني مصادقة على GET.
- [`cloudflare-d1/D1_Orders_Live_Sync_V2.gs` س1–27](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/D1_Orders_Live_Sync_V2.gs#L1-L27) يصف مصدر التغيرات لأوردرات وبنود Legacy، مع quota-aware delta/heartbeat وعدم تشغيل V1 وV2 معًا. [`cloudflare-d1/D1_Normalized_Live_Sync_V2.gs` س1–37](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/D1_Normalized_Live_Sync_V2.gs#L1-L37) يصرح `PREPARED / NOT PRODUCTION DEPLOYED` في التعليق؛ **لا نعلن active sync منه دون runtime trigger evidence**.

## 26.2 Normalized Import: حدود الإثبات
- [`cloudflare-d1/src/normalized-import-gate.mjs` س211–281](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/normalized-import-gate.mjs#L211-L281): يستقبل `syncFinal` و`syncRunId`، يبني UPSERT لعملاء/أوردرات/رسائل/محادثات، ويرفض source row غير صالح، ثم يحفظ `migration_runs` لِـentity عندما `syncFinal` ليس false داخل نفس D1 batch.
- **فجوة مصدرية `BOOK26-NORMALIZED-FINAL-PROOF` (P1):** `syncFinal` افتراضيًا true إذا لم يُرسل، و`syncRunId` مطلوب فقط لغير النهائي. `sourceRowCounts` يُقرأ من جسم الطلب ولا يظهر فحص مجموع chunks الفعلية أو اكتمال تسلسل run مقابل هذا الرقم قبل `freshnessAdvanced:true`. **فيمكن نظريًا أن يُقبل إعلان final ناقص من جهة مرسلة مصرح لها** ويُكتب metadata يوحي باكتمال المزامنة، حتى لو انقطعت دفعة سابقة. لا ندّعي أن هذا حصل؛ يجب اختبار out-of-order/lost-ACK/final-with-missing-chunk وصحة counters في D1 مع Fake datastore.
- [`tests/cloudflare_normalized_import_v1.test.mjs` س77–140](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/tests/cloudflare_normalized_import_v1.test.mjs#L77-L140) و[`tests/d1_normalized_live_sync_delta_v2.test.mjs` س63–96](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/tests/d1_normalized_live_sync_delta_v2.test.mjs#L63-L96) تتضمن source لاختبارات bad-row/final freshness/rollback وempty final heartbeat. وجودها لا يعالج وحده إثبات missing chunk أو repeated final عبر requestId، ولم ننفذها هنا.

## 26.3 Row-Level Mirror Delta: الذرّية والتنافس
- [`cloudflare-d1/src/mirror-delta-gate.mjs` س62–112](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-delta-gate.mjs#L62-L112): يطبع صفوف الطلب ويزيل رقم الصف المكرر ويقبل per-sheet `baseRowCount/sourceLastRow/expectedNote/rows`، لكن لا يظهر أنه يرفض تكرار صفوف في المصدر أو يحميها بإثبات source hash مستقل.
- [`cloudflare-d1/src/mirror-delta-gate.mjs` س115–190](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-delta-gate.mjs#L115-L190): `preflightSheet` يفحص catalog/status/contiguous rows/row count/expectedNote، ويرفض نمو المصدر مع فقد صف مُلحق. [`cloudflare-d1/src/mirror-delta-gate.mjs` س193–329](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-delta-gate.mjs#L193-L329): بعد preflight يجمع INSERT/DELETE/catalog UPSERT في **`db.batch` واحدة**، ثم يقارن count بالمخطط في readback؛ هذه حماية حقيقية على مستوى الدفعة.
- **فجوة تنافس `BOOK26-DELTA-CAS` (P1):** preflight عبارة عن SELECT قبل `db.batch`، ولا يظهر شرط `CAS`/expected `runId`/hash في نفس المعاملة يضمن أن base ما زال نفسه لحظة الكتابة. طلبان متداخلان لهما نفس `baseRowCount` قد يجتازان preflight ثم يتسابقان على كتابة الصفوف والـmetadata؛ خاصة إذا لم يتغير العدد. **عائق إثبات لا حادثة فقد بيانات**، ويتطلب concurrency/fault-injection test.
- **تكرار قيد سابق:** row-count parity لا يضمن مطابقة قيم/صيغ الصفوف: مسجّل سابقًا في الفصل 21 `BOOK21-MIRROR-PAYLOAD`؛ لا نفتح بلاغًا مكررًا بنفس الفكرة.
- [`tests/d1_orders_live_sync_delta_v2.test.mjs` س147–216](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/tests/d1_orders_live_sync_delta_v2.test.mjs#L147-L216) يعرض اختبارات rollback/stale-base/missing appended row بمخزن اختبار؛ لا يظهر source مماثل لاختبار interleaving لحظي بين preflight والـbatch. `TESTED_THIS_PASS=NO`.

## 26.4 صلاحية الوصول لقراءات المرايا التشخيصية — تنبيه أمني
- [`cloudflare-d1/src/mirror-gate.mjs` س135–190](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-gate.mjs#L135-L190): `GET /v1/mirror/sheet?name=...` يقرأ `sheet_catalog` و`sheet_rows`، ويعيد **قيم الصفوف ونسخة العرض والصيغ** مع pagination، وليس مجرد إحصائيات. هذه Mirror خام قد تحتوي بيانات عملاء أو موظفين أو تفاصيل تشغيل.
- [`cloudflare-d1/src/mirror-gate.mjs` س307–363](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/mirror-gate.mjs#L307-L363): تفرّع `GET` يُنفذ SELECT ثم Response **دون استدعاء `migrationAuthorized` أو تحقق موظف/role/allowed collection ظاهر في هذا handler**، بينما يطبق التحقق بوضوح في فرع `POST`. [`cloudflare-d1/src/index_v2.js` س188–193](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/src/index_v2.js#L188-L193) و[`cloudflare-d1/production-shadow/index.js` س49–57](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/production-shadow/index.js#L49-L57) لا يظهران حارسًا عامًا قبل هذا الـGET. **`SOURCE_AUTH_GAP` عالي الأولوية `BOOK26-MIRROR-GET-AUTH` (P0)**؛ كون المسار read-only لا يجعله آمنًا على بيانات خاصة، وCORS لا يكفي كحماية من طلبات Server-to-Server. يلزم فحص أي Middleware أو Proxy خارج الملفات المرصودة، وبيئة النشر، ثم اختبار 401/403 على Worker mock دون جلب أي صف حقيقي.
- حتى endpoints `/v1/mirror/sheets` و`/stats` و`/capabilities` تبدو متاحة بنفس GET branch؛ يلزم تحديد **سياسة علنية/خاصة** لكل endpoint، وألا يُعمم منع diag العامة إذا كانت مقصودة إلا بعقد واضح. **ممنوع إجراء proof-of-access على Production بلا تفويض.**

## 26.5 التحقق من النشر والإصدارات والتراجع
- [`cloudflare-d1/wrangler.toml` س8–40](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/cloudflare-d1/wrangler.toml#L8-L40) يذكر flags أصل المصدر مثل `TRENDOS_CLOUD_WRITE_V1_ENABLED="false"` و`TRENDOS_R4_RECOVERY_ENABLED="false"`؛ هذه لا تكشف Control Tables أو Settings المنشورة. **مطلوب إثبات version/hash/deployment settings** لمطابقة الكتاب على النسخة الحية.
- [`.github/workflows/trendos-02cw-worker-promote-version-temp.yml` س1–83](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/.github/workflows/trendos-02cw-worker-promote-version-temp.yml#L1-L83) و[`.github/workflows/trendos-02cw-worker-rollback-safe-temp.yml` س1–61](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/.github/workflows/trendos-02cw-worker-rollback-safe-temp.yml#L1-L61) وثائق workflows ذات `workflow_dispatch` من فرع `agent/go-live-2026-09-01-integrity` وتحتوي Target/Safe Worker version IDs معينة؛ **ليست run logs** ولا دليل أن الإصدار المشار إليه الآن active. لا يجوز تشغيلها من إيجنت الكتاب؛ ترقية/rollback يتطلبان موافقة منفصلة وفحص آخر version مثبت.
- [`.github/workflows/trendos-02cw-worker-postdeploy-readonly-temp.yml` س23–64](https://github.com/fawakhry/TrendOs/blob/4580ff5cb278d18434e4410f5be386fbc2ecd2c9/.github/workflows/trendos-02cw-worker-postdeploy-readonly-temp.yml#L23-L64) يصف probes للصحة ومؤشرات catalog وGET غير موثّق على أوردر Edge؛ يحتاج `workflow_run_url` و`run_head_sha` وactive-version proof لكي يتحول لاختبار موثق، وليس مجرد اسم خطوة `_PASS` مطبوع في السكربت.
- **فجوة `BOOK26-DEPLOY-LINEAGE` (P1):** لا يتوافر في جولة الكتاب إثبات مطابق بين HEAD للفرع ونسخة Worker الفعلية ونسخة UI وإعدادات D1 control، ولا نرفع `PRODUCTION_VERIFIED` لمجرد وجود workflow/config/health.

## 26.6 اختبارات ومعايير الإغلاق
| المعرف | الأولوية | المطلوب إثباته على بيئة وهمية/مصرح بها | الحالة |
|---|---|---|---|
| BOOK26-MIRROR-GET-AUTH | **P0** | unauthorized GET للمرايا يرفض قبل `sheet_rows`؛ Admin diagnostic اختياري وفق سياسة المشروع | SOURCE_AUTH_GAP |
| BOOK26-NORMALIZED-FINAL-PROOF | P1 | Final missing chunk/out-of-order/replayed final لا يعلن `freshnessAdvanced` بلا reconciliation | SOURCE_INTEGRITY_RISK |
| BOOK26-DELTA-CAS | P1 | طلبان interleaved يحملان نفس base/sourceCount، أحدهما يتوقف أو يعاد بأمان دون lost update | SOURCE_CONCURRENCY_RISK |
| BOOK26-DEPLOY-LINEAGE | P1 | exact Worker version/source & frontend asset SHA/config + workflow run URL دون تعديل بيانات | BLOCKED |
| BOOK21-MIRROR-PAYLOAD | P1 | بلاغ مكرر من الفصل 21؛ غياب full content hash parity | EXISTING_ID_NO_DUPLICATE |
| TESTED/PRODUCTION_VERIFIED | — | **NO/NO**، لا تنفيذ mock أو CI على HEAD في هذه الجولة | SOURCE_ONLY |

**قرار الإيجنت:** أربعة بنود تفحص حديثًا على HEAD قبل فتح PR إصلاح، مع أولوية عاجلة لحارس GET الخام. لا تغيير في كود الإنتاج أو قاعدة بيانات أو إعدادات Cloudflare أو Google. **نقطة استكمال الكتاب:** الفصل 27 — ربط شاشة التشغيل/الإعدادات والتوثيق الشامل للـUI وعقود اختبارها.


---

# 27. تتبع شاشات TrendOS وأزرار التشغيل والعقود من UI إلى API (16 أكتوبر 2026)

**نطاق فصل أول من فهرسة الواجهة:** تدقيق مُركّز لأزرار الدخول، التحديث، صلاحيات Trend Master، المديونيات، واتساب والتنقل للحسابات. **ليس اعتمادًا نهائيًا للـ479 عنصرًا**؛ نبدأ بعينات مرتفعة الأثر ثم نربط باقي الأزرار ديناميكيًا في فصول لاحقة. **`SOURCE_ONLY`**؛ لم يُشغَّل المتصفح ولم تُنقر أزرار فعلية ولم يُصدر أمر مالي أو رسالة.

## 27.1 مصدر فهرس الواجهة وطريقة تتبعها
- [`index.html` س33–104](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L33-L104) واجهتا دخول الموظف والعميل والشريط الرئيسي؛ [`index.html` س128–176](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L128-L176) شاشة Trend Master والأرشيف ومنع التسليم وقفل اليوم. انطلاقًا من **نفس blob `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1`** يحتوي [`docs/trendos/book-agent/CURRENT_UI_ELEMENT_INDEX.md` س1–18](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/docs/trendos/book-agent/CURRENT_UI_ELEMENT_INDEX.md#L1-L18) الجرد الابتدائي `479` ID فريدًا، منها `97` زرًا في HTML. **هذه static DOM identifiers وليست إحصاء وظائف حية**؛ الواجهة تبني Buttons/AJAX إضافية بالـJavaScript، وتشغيل module gated ومحدد بالنسخة المنشورة.
- [`app.js` س7429–7510](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7429-L7510) يجمع ربط أحداث كثيرة عبر `on(id,event,handler)`، مع bindings منفصلة باستدعاء `addEventListener` في [`app.js` س7538–7607](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7538-L7607). [`config.js` س20–34](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/config.js#L20-L34) يفرق بين Native Employee Auth وقطع Ops/Core GENERAL وAccounting/Content/Comms READONLY. لا يمنح `hidden` ولا دور JS سلطة تنفيذ عملية مالية؛ يُراجع دومًا الـHandler الفعلي.

## 27.2 جدول مسارات الأزرار التي تمت مراجعتها
| UI control | DOM → Listener/Action | Authority/Guard المرصود | الحكم |
|---|---|---|---|
| `loginBtn` | [`index.html` س51–65](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L51-L65) → [`app.js` س7497–7501](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7497-L7501) `doLogin` | Native employee auth حسب cutover؛ سبق §14 | SOURCE_ONLY |
| `customerLoginBtn` | [`index.html` س68–82](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L68-L82) → [`app.js` س7442–7445](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7442-L7445) `doCustomerLogin` | Customer transport Legacy via Cloud؛ سبق §16 | SOURCE_ONLY |
| `remoteFilesBtn` | [`index.html` س95–104](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L95-L104) → [`app.js` س7454–7457](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7454-L7457) ثم patch `onclick` في [`app.js` س8300–8312](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L8300-L8312) | File SSO query-token/privacy سبق §20؛ المتصفح ليس ACL | SOURCE_ONLY / EXISTING |
| `refreshBtn` | [`app.js` س7499–7504](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7499-L7504) `hardRefreshMainScreen` + [`app.js` س8290–8323](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L8290-L8323) `onclick=patch23ReloadOrders` + [`app.js` س8733–8745](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L8733-L8745) binding متأخر | ثلاثة مواقع تحكم بالحدث؛ انظر §27.3 | SOURCE_LISTENER_OVERLAP |
| `endDayBtn` | [`app.js` س7539–7542](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7539-L7542) `showEndDaySummary` من [`app.js` س4550–4587](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L4550-L4587) | **ملخص قسم بالـalert**، **ليس** تقفيلًا محاسبيًا | SOURCE_ONLY |
| `runAccountingCloseBtn` | [`index.html` س137–140](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/index.html#L137-L140) → [`app.js` س7576–7578](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7576-L7578) `runAccountingDayAutomationV1921` بعد `confirm` | [`Code.gs` س12003–12025](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L12003-L12025) يفحص auth/mode=full وblockers في الخادم؛ زر معاينة يحتاج منع الكذب §27.5 | SOURCE_UI_READINESS_RISK |
| `runTrendAutomationBtn` و`installTrendAutomationBtn` | [`app.js` س7572–7576](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7572-L7576) actions `runTrendMasterAutomationV1931/installTrendMasterAutomationV1931` | [`Code.gs` س5181–5184](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L5181-L5184) auth وadmin في Apps Script، وقد يكتب Trigger كل ساعة؛ ليس مجرد زر قراءة | SOURCE_ONLY |
| `refreshTrendMasterBtn`, `archiveSearchBtn`, Prev/Next | [`app.js` س7570–7588](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7570-L7588) `getTrendMasterCenterV1931` مع query/page | مصدر Core D1 أو Legacy طبقًا للقطع؛ اختلاف AUTH لسجل الإدارة سبق §25 | SOURCE_ONLY |
| `saveDebtRestrictionBtn` | [`app.js` س7594–7602](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7594-L7602) `saveDebtDeliveryRestrictionV1931` | [`Code.gs` س4384–4396](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L4384-L4396) يطبق `authorize_` و`canManageDebtRestrictionsV1931_` على Legacy backend؛ الاسم مفتاح الربط، إذًا identity مراجعة §18 | SOURCE_ONLY |
| `open-automation-wa` (dynamic) | [`app.js` س4418–4427](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L4418-L4427) ينشأ من Queue، [`app.js` س7589–7593](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7589-L7593) يفتح WA ثم يرسل `markAutomationMessageSentV1931` | [`Code.gs` س5184–5185](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L5184-L5185) يسجّل «تم الإرسال» إداريًا دون receipt Meta؛ انظر §27.4 | SOURCE_SEND_SEMANTICS |
| `accountingBtn`, dynamic `accountingDayCloseBtn` | [`app.js` س11078–11105](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L11078-L11105) يفتح EasyStore ويبعث SSO `postMessage` للـorigin المحدد | [`app.js` س11002–11021](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L11002-L11021) يحدد شاشة الحسابات من roleMode محلي وsession نصي؛ انظر §27.6 | SOURCE_UI_SCOPE_REVIEW |

## 27.3 مسارات التحديث المتراكبة
- **`BOOK27-REFRESH-OVERLAP` P1:** `refreshBtn` له `addEventListener('click', hardRefreshMainScreen)` [`app.js` س7499–7503](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7499-L7503)، ويُضاف له `onclick` من patches متعددة [`app.js` س8290–8323](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L8290-L8323) و[`app.js` س8734–8747](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L8734-L8747)، مع rebind داخل capture listener/timers. تغيير `onclick` لا يزيل `addEventListener` السابق؛ **قد يسبب أكثر من قراءة وتحديث UI لنقرة واحدة** حسب ترتيب التثبيت والـcapture. `hardRefreshMainScreen` يبدل `state.editing=false` و`state.saving=false` في [`app.js` س6144–6175](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L6144-L6175). لا يجوز الجزم بفقد عمل مكتوب دون اختبار Browser وهمي يحاكي حالة نموذج مفتوح.
- يجب بناء test يراقب عدد نداءات `loadRows` وزمن الـrequests، و`preventDefault/stopImmediatePropagation`، وعدم جعل التحديث يبدل form dirty/saving state أثناء الحفظ.

## 27.4 معنى «تم إرسال رسالة واتساب»
- **`BOOK27-WA-OPEN-IS-SENT` P1:** عند نقر «فتح واتساب» ينفذ [`app.js` س7589–7593](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L7589-L7593) `window.open(waUrl)` ثم `runTrendMasterAction('markAutomationMessageSentV1931')` فورًا، **دون تأكيد المستخدم أو receipt من Meta**. [`Code.gs` س5184–5185](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L5184-L5185) يسجل حالة `تم الإرسال` ووقتًا واسم المستخدم بعد auth فقط. ده **تعارض واضح في دلالة الحالة** عند استعمال هذه الواجهة؛ لا نستنتج أن WhatsApp أرسل الرسالة.
- اربط اختبار هذا المسار بمشكلة «نسخ/تأكيد مقابل Provider ACK» بالفصل 17 بدون تكرار إغلاقها؛ اختبار popup-blocked, user closes WA without sending, double-click, provider-accepted مقابل delivered/read.

## 27.5 معاينة تقفيل اليوم عند فقد البيانات
- **`BOOK27-DAYCLOSE-UNKNOWN` P1:** [`app.js` س4439–4450](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L4439-L4450) يحسب `blockers=(day&&day.blockers)||[]`، ويعرض «كل المراجعات سليمة، يمكن تنفيذ قفلة اليوم» ويجعل الزر enabled عند قائمة فارغة **حتى لو `dayClose` = null أو `{error}`**. في مصدر [`Code.gs` س5155–5168](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L5155-L5168) قد يرجع `dayClose={error:...}` عند فشل حساب المعاينة، وفي Core D1 [`cloudflare-d1/src/employee-core-native-v1.mjs` س200–216](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/cloudflare-d1/src/employee-core-native-v1.mjs#L200-L216) `dayClose:null`.
- **تأثيره UI مضلل، وليس تصريحًا بتنفيذ تقفيل غير آمن:** [`Code.gs` س12003–12025](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/Code.gs#L12003-L12025) يعيد حساب preview ويتحقق من blockers وصلاحية `full` قبل الترحيل. المطلوب `UNKNOWN/ERROR = NOT_READY` في عرض الأزرار، واختبار من دون ربط ببيانات مالية حقيقية.

## 27.6 نقل شاشة الحسابات إلى EasyStore
- **`BOOK27-ACCOUNTING-ROLE-HINT` P1 (اختبار حدود الثقة):** [`app.js` س11001–11018](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L11001-L11018) يحدد دور واجهة EasyStore من نص يشمل الاسم والدور والقسم ونسخة `trendos_session` المخزنة محليًا، ثم [`app.js` س11020–11068](https://github.com/fawakhry/TrendOs/blob/085945acd2f346b9c5b49981c5f59474a8f6627d/app.js#L11020-L11068) يرسل token إلى نافذة origin معلوم بواسطة `postMessage` بعد طلب فتح النافذة. المطابقة عبر Regex لنص Session واسع تصلح *لتوجيه UI فقط*، **وليست إثبات صلاحيات مالية**.
- مراجعة EasyStore المستقل يجب أن تُثبت أن الخادم يتحقق من token وsubject/role/expiry، ومن أن `postMessage` مقتصر على origin وجهة مقصودين، وأن listener لا يقبل رسالة مزيفة؛ **لا نعتبر نقل الرمز عبر postMessage نفسه تسريبًا مثبتًا**. لا تغيير في كتاب EasyStore المستقل من إيجنت TrendOS.

## 27.7 حالة التغطية والاختبارات
- `479` HTML IDs و`97` buttons **جرد static مستمر**؛ هذا الفصل يتتبع **عينة عالية الخطورة فقط**، ولا يغلق بقية الأزرار أو عناصر JavaScript الديناميكية.
- حالات من الفصل 25 تُذكر بالمرجع ولا تضاعف: `BOOK25-MANAGER-AUTH` لنطاق قراءة Core D1؛ `BOOK25-MANAGER-PROGRESSIVE` لمعنى تحميل لوحة المدير، وقضايا Portal/Files راجع الفصول 16 و20.
- **متطلبات اختبار هذا الفصل:** DOM Mock/browser متحكم، assertions لـ`refreshBtn` single action، إرسال واتساب بدون provider claim، `dayClose:null/error` يمنع ready CTA، roleMode غير موثوق مقابل Backend Session، مقارنة frontend SHA/deployed exact assets. `TESTED_THIS_PASS=NO`، `PRODUCTION_VERIFIED=NO`.

**نقطة الاستكمال:** الفصل 28 — بقية عناصر شاشة الأوردرات (البحث/الفلاتر/الأقسام والـbulk action) وربط Events بالـUI Dynamic وD1، ثم فصل ملفات الحسابات/تقارير الموظفين. لا تعلن تغطية جميع 479 ID أو تفعيل جميع الأزرار قبل اكتمال مصفوفة `ID → Event → Action → Role → Writer → Test → Runtime`.


---

# 28. شاشة الأوردرات: البحث والفلاتر والتغيير الجماعي والأرشفة — ربط الواجهة بالسلطة (16 أكتوبر 2026)

**حد الفصل:** ربط المسار الفعلي من `index.html` و`app.js` إلى Employee Core/Edge وLegacy للأوردرات، وفحص الفروق بين العمل على صفحة واحدة وتغيير كل بنود القسم. **الحالة `SOURCE_ONLY`**؛ لا استدعاء أوردرات ولا نقل للأرشيف ولا تعديل أي حالة فعلية. لا يُستنتج أن مسار Legacy أو Core هو السلطة المنشورة دون ضبط flags ونسخة الواجهة وD1 control في نفس الـruntime.

## 28.1 فلترة وقراءة صفحة الأوردرات
- [`app.js` س4722–4759](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4722-L4759): `loadRows` يرسل `getRowsPageV1931` مع `screen/page/pageSize/query/statusFilter/priorityFilter/heatPressFilter` ثم يحفظ `state.serverPaging` اعتمادًا على `res.serverPaged`، ويحدث `statusCounts`، ويعيد عرض النتائج.
- [`app.js` س7545–7557](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L7545-L7557): كل تغيير في البحث أو الأولوية أو الحالة أو المكبس يصفر الصفحة إلى 1؛ عند `serverPaging.enabled` يطلب صفحة أخرى عبر الـAPI مع debounce للبحث، وإلا يفلتر محليًا. [`app.js` س4924–4973](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4924-L4973) يعيد تطبيق نفس معايير البحث والحالة والمكبس على `state.rows` ويعيد ترتيب الصفوف محليًا حتى لو كانت أصلاً صفحة مرتبة من الخادم. هذا يسبب **خطر تناقض إحصاءات/ترتيب الصفحات** سابقًا في الفصل 13؛ لا نكرر البلاغ بل نوسّع اختبار مطابقته.
- [`app.js` س5067–5106](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L5067-L5106) `renderTable` يأخذ كل `rows` الواردة للـserverPaging، ويقطع `slice` فقط في الوضع المحلي؛ [`app.js` س5163–5194](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L5163-L5194) يعرض metadata `totalRows/totalPages` من الخادم في الـserverPaging. **عينة الصفحة ليست عدد الأوردرات الكلي** ولا بد أن يكون متسقًا مع مجموع الفلاتر.
- [`employee-api-dispatcher-v1.js` س60–82](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/employee-api-dispatcher-v1.js#L60-L82) يشمل `getRowsPageV1931` ضمن `CORE_READ_ACTIONS`، ومع `MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE='GENERAL'` في [`config.js` س26–35](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/config.js#L26-L35) يوجه القراءة إلى Core Native. [`cloudflare-d1/src/employee-core-native-v1.mjs` س360–380](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L360-L380) يرجع `getRows/getRowsPageV1931` مع `serverPaged:false` وكل rows؛ فلا نخلط ذلك مع `02CR` Edge التي قد ترجع `serverPaged:true`. [`tests/entry650_employee_core_order_page_read.test.mjs` س8–52](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/tests/entry650_employee_core_order_page_read.test.mjs#L8-L52) يحتوي assertions مصدرية لهذا routing، لا نتيجة اختبار تشغيل هذه الجولة.
- [`trendos-edge-orders-read-v1.js` س898–906](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/trendos-edge-orders-read-v1.js#L898-L906) يستثني حالة `__DEBT__` من qualified 02CR route ويرجع للـdownstream؛ هذا اختلاف authority يحتاج اختبار parity للرصيد والعدد (مذكور بالفصل 13). فلاتر `__OVERDUE__/__TODAY_WORK__/__DELIVERED_TODAY__/__DEBT__` تحسب محليًا في [`app.js` س4934–4964](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4934-L4964)، ولا تثبت الأرقام من مصدر timestamp موحد عبر Legacy/Native.
- [`app.js` س8683–8697](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L8683-L8697) يولد إجرائيات إحصائيات ديناميكية لتبديل فلاتر، و[`app.js` س8239–8250](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L8239-L8250) يوجد mapping قديم بقيم مختلفة مثل `heatPressFilter:'نعم'` مقابل `only` المستخدمة في الفلتر الفعلي؛ **بسبب التداخل الزمني مع patch الواجهة** نعتبر الفجوة `SOURCE_UI_MAPPING_REVIEW` فقط، حتى يُثبت أي Listener يُنفَّذ بالمتصفح، وليس عطل فِلتر مؤكد.

## 28.2 التحويل الجماعي والحسابات المعروضة
- [`app.js` س4784–4821](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4784-L4821) يحسب `bulkStatusMatchDetails` من `state.rows`، لكن عند `serverPaging.enabled` يعرض `res.statusCounts[from]` و`statusOrderCounts[from]` بدل عدد الصفحة فقط. [`app.js` س4841–4882](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4841-L4882) بعد confirmation يرسل `bulkUpdateDepartmentStatusV1926` بـ`screen/fromStatus/toStatus/requestId` **دون قائمة lineIds**: الـauthority ينفذ لكل المطابقين في القسم، حتى غير الظاهرين بالصفحة. مقصود ويحتاج تأكيد نطاق العملية قبل تغييرها.
- [`Code.gs` س4684–4775](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/Code.gs#L4684-L4775): Legacy Apps Script يتحقق من `authorize_` و`bulkStatusCanUseScreenV1926_`، ثم يفلتر ويطبق منع المديونية، ويفحص `trendosDeliveryGateV1931_` للتسليم؛ ينفذ تحت ScriptLock ويحاول caching لـrequestId. **لا نساويه بمسار Core D1**.
- [`cloudflare-d1/src/employee-core-native-v1.mjs` س218–255](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L218-L255): Core D1 يتحقق `screenAllowed` وصحة القيم ويفرض منع تسليم `deliveryDebtRestricted`، ثم يحفظ Runtime/Imported line statuses. الاختلاف في Gate المالي غير المرتبط بقائمة المنع تم توثيقه بالفصل 15؛ فلا يغلق بمجرد نجاح Bulk.
- **فجوة جديدة `BOOK28-BULK-500-SCOPE` P1:** Core يختار `all.filter(...).slice(0,500)` لبنود التحويل والأرشفة [`cloudflare-d1/src/employee-core-native-v1.mjs` س224–229](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L224-L229) و[`cloudflare-d1/src/employee-core-native-v1.mjs` س255–261](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L255-L261)؛ بينما [`app.js` س4847–4867](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4847-L4867) و[`app.js` س4886–4901](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4886-L4901) يعلنان عدد **كل** البنود ويستخدمان عبارات «تحويل كل المطابق» و«سيتم نقل ...» من دون توضيح limit 500 في Native. في الأقسام التي تتجاوز 500 قد يبقى بعض الشغل بعد نجاح الاستدعاء؛ ليس ثبوت حادثة، ويلزم اختبار dataset >500 وتقرير `processed/remaining/continuation` صريح. **لا تطلق Loop تلقائي على بيانات حية دون قواعد تعافٍ وقبول.**

## 28.3 أرشفة المُسلّم وفصل سطور Native/Imported
- [`app.js` س4886–4921](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/app.js#L4886-L4921) يؤكد الموظف عملية `archiveDeliveredDepartmentV1926` ويستخدم `archiveDeliveredRequestId` في إعادة المحاولة. [`cloudflare-d1/src/employee-core-native-v1.mjs` س255–291](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L255-L291) يكتب Snapshot لكل line في `employee_core_archive_lines_v1`؛ ويجعل `employee_core_lines_v1.active=0` للبند imported فقط. [`cloudflare-d1/src/employee-core-native-v1.mjs` س75–127](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L75-L127) يستثني **كلا المصدرين** من شاشة التشغيل عبر LEFT JOIN على `employee_core_archive_lines_v1`، فلا يُعد غياب `active=0` للـ`t12_prod_lines` دليلًا على فشل الأرشفة؛ هذا تصميم أرشفة منطقي.
- محاسبة archive orders تحدث عندما لا يبقى أي سطر من الأوردر، ويمكن لأوردر أن يبقى جزئيًا في الخدمة مع أرشفة بعض البنود. لا يجوز اعتبار `archivedOrders` مساويًا عدد `archivedLines`.
- **فجوة `BOOK28-CORE-RECOVERY` P1:** [`cloudflare-d1/src/employee-core-native-v1.mjs` س164–184](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L164-L184) ينشئ Ledger `PREPARED` قبل كتابة حالات/أرشيف؛ و[`cloudflare-d1/src/employee-core-native-v1.mjs` س250–291](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L250-L291) ينفّذ `db.batch` أولًا ثم تغييرات Orders/Events/Control وأخيرًا `COMMITTED`. عند خطأ بين هذه المراحل، إعادة نفس `requestId` قد تُرفض باعتبارها `request-in-flight` بدل أن تكمل أو تعكس العملية؛ يحتاج fault injection/recovery للـbulk **والأرشفة**، خاصةً مع وجود استدعاءات `.run()` منفردة بعد batch. لا نستنتج فساد قاعدة إنتاجية.

## 28.4 ضوابط صلاحية تحديث بند منفرد — اكتشاف ذو أولوية
- **`BOOK28-CORE-LINE-SCOPE` P0 محتمل:** [`cloudflare-d1/src/employee-core-native-v1.mjs` س293–328](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L293-L328): `updateSingleLine` يقرأ السطر عبر `lineId` ويعدل status/notes، لكن لا يظهر فيه فحص `screenAllowed(user, department)` أو قيد القسم/المستخدم على السطر، ولا يعيد التحقق من `deliveryDebtRestricted` عند `تم التسليم`. استدعاء `handleEmployeeCoreNativeRequest` يطبق **مصادقة الموظف وmode**؛ [`cloudflare-d1/src/employee-core-native-v1.mjs` س356–386](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/cloudflare-d1/src/employee-core-native-v1.mjs#L356-L386) يتحقق من شاشة الموظف عند `getRows/getDashboard` وليس عند `updateLine`. لذا الـCore direct write action يختلف عن bulk.
- **تمييز ضروري:** الـBrowser قد يوجه `updateLine` إلى Runtime Handler آخر أو Legacy عبر [`trendos-edge-orders-read-v1.js` س956–987](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/trendos-edge-orders-read-v1.js#L956-L987)؛ **لا نقرر حدوث تجاوز صلاحيات عبر UI أو Production** من هذا السلوك. لكن endpoint Core المُعرَّف في Worker يستحق اختبار Mock بعامل `print` و`laser` وبنود القسم المقابل، وبند عليه منع تسليم، وأي route-level policy خارجي. الفجوة المتعلقة بالدين تكرار لما سُجّل في §19، والجديد هنا **غياب التحقق من نطاق القسم**.
- لا تعتمد على إخفاء زر أو إرسال `screen` من JavaScript وحده؛ يجب حماية عمليات تغيير السطر داخل Backend اعتمادًا على row.department وemployee subject المثبت بعد session validation.

## 28.5 معايير الإثبات والاختبارات
| ISSUE / الدليل | P | فحص الآمن المقترح | الحالة |
|---|---|---|---|
| BOOK28-CORE-LINE-SCOPE | P0 | اختبار Core `updateLine` على بند من قسم آخر، بمستخدمين وهميين وFake D1؛ 403 و0 writes عند المنع | SOURCE_AUTH_GAP / BLOCKED |
| BOOK28-BULK-500-SCOPE | P1 | dataset 501+ بند؛ تأكد من عدم تضليل UI بشأن العدد المُعالَج والمتبقي، ولو Legacy/Native مختلفين | SOURCE_SCOPE_MISMATCH / BLOCKED |
| BOOK28-CORE-RECOVERY | P1 | fault-injection بعد batch وقبل Ledger COMMITTED وفي منتصف Archive order loop؛ replay آمن دون duplications | SOURCE_RECOVERY_RISK / BLOCKED |
| BOOK13-ORDER-FILTER-PARITY | P1 | رفض خلل counts/paging/02CR/local sorting مع `__DEBT__` وخطوط مكررة | EXISTING_CASE_REUSE |
| BOOK19-DELIVERY-GATES | P0 | التأكد من منع التسليم الفردي/الجماعي/Legacy/Native | EXISTING_CASE_REUSE |
| UI Mapping | P2 | ضغط KPI `مكبس/الطاير/متأخر/دين` مع تتبع event listener الحقيقي وrequest/checkbox | SOURCE_ONLY، لم يثبت كسر |
| TESTED/PRODUCTION_VERIFIED | — | **NO / NO**؛ مراجعة [`tests/entry644_employee_core_general_dispatch.test.mjs` س1–95](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/tests/entry644_employee_core_general_dispatch.test.mjs#L1-L95) و[`tests/entry650_employee_core_order_page_read.test.mjs` س1–83](https://github.com/fawakhry/TrendOs/blob/be3faac2e557809ed78d66fd6f97be35a8ef5699/tests/entry650_employee_core_order_page_read.test.mjs#L1-L83) مع تنفيذ CI exact SHA وتوسيع backend synthetic cases | BLOCKED |

**نتيجة الفصل:** الواجهة تربط Actions مشتركة بمسارات مختلفة حسب Cutover؛ Core D1 يحتوي على حماية لقسم الـbulk، لكن يظهر غياب مماثل داخل `updateSingleLine`، مع حد 500 ومشكلة تعافٍ محتملة تحتاج إثباتًا. `SOURCE_ONLY`، `TESTED=NO`، `PRODUCTION_VERIFIED=NO`. لم يُعدّل كود إنتاج أو إصدار أوردر أو أرشفة فعلية.

**نقطة استكمال الكتاب:** الفصل 29 — شاشات الحسابات ومصروفات التشغيل والتقارير/الصلاحيات end-to-end ثم استكمال فهرس بقية الـUI.


---

# 29. شاشة الحسابات ومصروفات التشغيل والموافقات والتقارير — حدود TrendOS / EasyStore (16 أكتوبر 2026)

**الغاية:** توضيح الصورة الفعلية لـ«الحسابات» داخل واجهة TrendOS، ومسارات Cloud D1 للقراءة والكتابة، والتفريق بين **تكلفة خامة البند** و**مصروف التشغيل** وبين «مدفوع من العميل» و«رصيد مدين»، وشروط موافقة الموظف/المالك. **الدليل `SOURCE_ONLY`** على HEAD المصدر `fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b`؛ لم نفتح EasyStore المنشور أو نلمس دفترًا ماليًا حقيقيًا أو ننفذ أمرًا ماليًا أو اختبارات runtime. قراءة هذا الفصل لا تعني تغيير سلطة مالية أو تفعيل `GENERAL`.

## 29.1 واجهتان للحسابات ومساران للسلطة
- [`index.html` س1082–1195](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/index.html#L1082-L1195) يحتوي `accountingModal` القديم: ملخص مبيعات وتكلفة وربح القسم، بنود الأقسام، تقفيل فاتورة نهائية، إضافة خامات، وأزرار التحديث والتجهيز. [`app.js` س745–842](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/app.js#L745-L842) يحدد `currentAccountingMode` اعتمادًا على الدور/الاسم محليًا، ويظهر الحقول بحسب `full/final/print/laser`؛ **هذا قيد واجهة وليس تفويضًا ماليًا**.
- [`config.js` س46–72](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/config.js#L46-L72) يختار `MATBAGY_USE_EASY_STORE_FOR_ACCOUNTING=true`، و[`app.js` س10995–11090](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/app.js#L10995-L11090) ينشئ طريق `openMatbagyEasyStoreAccountingV1921` لفتح موقع EasyStore مع SSO باستخدام `postMessage` إلى `url.origin`. الـUI يرسل `mode/roleMode` لتوجيه الشاشة لا لمنح الصلاحية، ويجب أن يُثبت EasyStore الصلاحية بنفسه (راجع §27 و`BOOK27-ACCOUNTING-ROLE-HINT`، لا نكرر البلاغ).
- [`config.js` س26–34](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/config.js#L26-L34) و[`employee-api-dispatcher-v1.js` س55–63](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/employee-api-dispatcher-v1.js#L55-L63): Accounting Native في مصدر المتصفح `READONLY`، و[`employee-api-dispatcher-v1.js` س245–253](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/employee-api-dispatcher-v1.js#L245-L253) يوجه **ثلاث قراءات فقط** إلى `/v1/employee/accounting`: `getAccounting/getDeptInvoiceDraftV1887/getPartyAccountV1858`. غيرها يتبع downstream/legacy policy وليس مضمونًا أن يصل إلى D1 Writer. [`employee-api-dispatcher-v1.js` س795–848](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/employee-api-dispatcher-v1.js#L795-L848) و[`tests/frontend_employee_accounting_family_router_entry619.test.mjs` س1–92](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/tests/frontend_employee_accounting_family_router_entry619.test.mjs#L1-L92) يثبتان عقد القطع المصدرّي، **لا إثبات نتيجة اختبار جديدة**. لا نعلن أن الأزرار القديمة تحفظ Native على الإنتاج.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س875–893](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L875-L893): خدمة Employee Accounting D1 منفصلة، لديها `OFF/READONLY/GENERAL` في جدول `employee_accounting_control_v1` وتحقق session عبر `verifyEmployeeSessionCloudFirst`؛ `GENERAL` مصدرّيًا يتيح عمليات كتابة، **لكن Source UI READONLY لا يعلن cutover كتابة**.
- [`cloudflare-d1/src/accounting-native-module.mjs` س20–53](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/accounting-native-module.mjs#L20-L53) عقد تشخيص قديم `preview-integration-contract` مع `cutover:false/authoritativeWrites:false`، و[`cloudflare-d1/src/accounting-finance-api-v1.mjs` س1–62](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/accounting-finance-api-v1.mjs#L1-L62) يرجع `planningOnly:true/persistence:none` لمسار F2 Journal Plan. **لا تخلط مخطط قيد متوازن مع ترحيل فعلي في ميزان مراجعة EasyStore.**

## 29.2 مشكلة عقود الإدخال عند التحويل مستقبلاً إلى Native (جديدة)
- **`BOOK29-DEPT-LINE-FIELD-PARITY` — P1:** [`app.js` س1224–1270](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/app.js#L1224-L1270): `applySmartAccountingCost` يملأ `accDeptLineMaterialQty` و`accDeptLineLaborCost` ويرسل `saveAccountingDeptLine` بمفاتيح `materialQty` و`laborCost`. لكن [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س607–621](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L607-L621) يقرأ `materialConsumption/consumption` و`operatingCost` فقط. عند توجيه نفس Payload القديم مباشرة إلى Native بلا adapter، **الكمية المستهلكة تُقرأ 0 وتكلفة التشغيل تُقرأ 0**، رغم وجودهما بالشاشة؛ ما يؤثر على stock requirements وعلى totalCost/line profit. الـ`materialCost` المرسل بشكل مستقل قد يخفي أثر الكمية ماليًا دون إثبات حركة المخزون. **هذا اختلاف عقد مصدرّي محدد لكنه غير مثبت على Production لأن cutover الحالي READONLY.**
- [`app.js` س1185–1225](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/app.js#L1185-L1225) يحسب `totalCost = materialCost + inkCost + labor` ثم يحفظ labor كتكلفة تشغيل إضافية داخل بند القسم؛ **قرار مالك المشروع**: المرتبات والكهرباء والإيجار مصروفات تشغيل منفصلة وليست تكلفة خامة البند. ينبغي تحديد الفرق بين خدمة تشغيل/مصاريف صناعية مباشرة إن كان لها سياسة محاسبية مصرح بها وبين المرتبات/الكهرباء العامة، وعدم تحوير مصروف عام إلى تكلفة Job تلقائيًا. **اختبار سياسة ضروري** في EasyStore المالي قبل وصف الربح بالصافي.

## 29.3 تقفيل الفاتورة النهائية وIdempotency (جديد)
- **`BOOK29-FINAL-INVOICE-REQUESTID` — P1:** [`app.js` س1320–1365](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/app.js#L1320-L1365) يبعث `saveAccountingFinalInvoice` مع `orderId/customerName/lineIds/manualDescription/paid/remaining` **بدون `requestId`**. [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س815–823](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L815-L823) يطلب `requestId` أو `idempotencyKey` أو `clientRequestId` ويرجع `success:false` لو مفقود. لذلك توجيه Payload شاشة TrendOS القديمة كما هو إلى Native يتعارض مع الكاتب؛ **لا تطبق workaround بإلغاء idempotency من السيرفر**.
- نفس الـPayload يرسل `manualDescription` بينما [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س828–843](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L828-L843) يقرأ `manualItem`، ولا يرسل الواجهة `paymentMethod` التي يضع الكاتب لها افتراضي `آجل`. مطلوب **contract adapter** مع تمييز `manual item`, `payment type`, `paid`, `discount`، وعدم اعتبار default payment type مطابقًا لقيد خزنة معتمد.
- توجد مخاطر atomocity في تسجيل الفاتورة وحركتي ledger مستقلتين سجلها الفصل 18 مسبقًا؛ **يُعاد استخدامها ولا يُفتح بلاغ مكرر لنفس السبب**.

## 29.4 الربح ومصروفات التشغيل — مصدر الحقيقة وليس اسم المؤشر
- **`BOOK29-OPERATING-EXPENSE-PROFIT` — P1:** [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س481–555](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L481-L555) تقرير `dailyDepartmentReportV1` يحسب `report.profit = report.sales - report.actualJobCost - report.netWaste`، مع قراءة Purchases/Waste/Cashbox/Custody؛ **لا يظهر خصم مصروفات التشغيل المستقلة كالرواتب والإيجارات والكهرباء** من ذلك الحقل. لذلك `profit` هنا أقرب لهامش قسم وفق البيانات المرصودة، **وليس صافي ربح المنشأة ولا ميزان مراجعة شامل**. قيمة `5200` لمصروفات التشغيل موجودة في [`cloudflare-d1/src/accounting-finance-core-v1.mjs` س12–27](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/accounting-finance-core-v1.mjs#L12-L27) لكن `/v1/accounting/finance/plan` لا يرحل Ledger فعليًا؛ يلزم reconcile مع EasyStore مصدر المصروفات المعتمد بدل نسخ الشجرة فقط.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س152–165](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L152-L165) `getAccounting` يعيد قوائم `sales/purchases/dailyPurchases/custodyEntries/wasteLines/stockMoves` **فارغة دائمًا في استجابة هذا الكاتب**، رغم وجود مسارات تقارير D1 أخرى؛ لو عرضت واجهة قيمة `[]` باعتبارها «لا مصروفات» يصبح خلط **لم تتم القراءة** بـ**صفر فعلي**. مطلوب metadata `NOT_LOADED/READONLY_LIMITED` للمصادر التي لا يغطيها هذا الاستعلام.
- قيمة الربح النهائية يجب أن تفصل `Gross Profit` عن `Operating Expenses` وعن `Net Profit`، ومعها ميزان المراجعة ذو طرفي مدين/دائن وفترة محاسبية محددة وقيد افتتاحي وحقوق الملكية، وفق قرار EasyStore السابق؛ **غير مثبتة end-to-end في هذه القراءة**.

## 29.5 الموظف يسجل والمالك يعتمد
- **`BOOK29-APPROVAL-OWNER-POLICY` — P1 / قرار صلاحيات:** [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س648–667](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L648-L667) `approveDept` يجيز `full/print/laser` ويخصم المخزون آليًا عند **اعتماد نفس القسم**؛ [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س815–838](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L815-L838) `finalInvoice` يجيز `full/final` لإغلاق الفاتورة. قرار المالك في EasyStore: **الموظف يسجل وأنا أعتمد**. يلزم التأكد هل `approveDept` موافقة فنية على الخامة أم اعتماد مالي، وهل إصدار الفاتورة واعتماد الهالك والمصروفات والعهدة يتطلبان مالكًا مستقلًا. بدون Decision Matrix معتمدة لا نعلن هذا مسار موافقات مطابقًا، ولا نُعطل صلاحيات الإنتاج تلقائيًا.
- [`cloudflare-d1/src/employee-accounting-native-v1.mjs` س691–734](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/cloudflare-d1/src/employee-accounting-native-v1.mjs#L691-L734) يرصد `partyLedger` بقواعد role ومفاتيح طلب، ويمنع `payment_received` أكبر من الدين القائم. اختبارات افتتاحية/فاتورة/سداد/تسوية وعكس حركات العملاء والموردين تحت `partyId` مثبت مطلوب، لكن قضايا تطابق اسم العميل وذرّية ledger متناولة بالفصل 18، بلا تكرار.

## 29.6 اختبار وترتيب قبول قبل أي cutover
| ID | الأولوية | خطوات الإغلاق الآمنة | الحالة |
|---|---|---|---|
| BOOK29-DEPT-LINE-FIELD-PARITY | **P1** | Mock UI → dispatcher → Native writer، `materialQty`/laborCost/otherCost، والتأكد من استهلاك المخزون/totalCost دون احتساب مصروفات عامة كبند مباشر | SOURCE_CONTRACT_MISMATCH |
| BOOK29-FINAL-INVOICE-REQUESTID | **P1** | fake `saveAccountingFinalInvoice`: بدون requestId = رفض آمن؛ مع requestId و`manualItem/paymentMethod` مضبوطين = نجاح idempotent وdouble submit محكوم | SOURCE_CONTRACT_MISMATCH |
| BOOK29-OPERATING-EXPENSE-PROFIT | **P1** | Fake trial balance: Sales–COGS–Operating Expenses–Waste = Net Profit، ومطابقة period/ledger مع EasyStore قبل تسمية المؤشر | SOURCE_REPORTING_GAP |
| BOOK29-APPROVAL-OWNER-POLICY | **P1** | Employee create → department review → owner approve → settlement/close، مع denial لكل role وapproval evidence | SOURCE_POLICY_ALIGNMENT |
| BOOK18-CUSTOMER-IDENTITY / ATOMICITY | existing | إعادة استخدام اختبارات الفصل 18 لهوية العميل وذرّية الفاتورة/ledger | EXISTING_ID_NO_DUPLICATE |
| TESTED / PRODUCTION_VERIFIED | — | **NO / NO**: [`tests/frontend_employee_accounting_family_router_entry619.test.mjs` س1–95](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/tests/frontend_employee_accounting_family_router_entry619.test.mjs#L1-L95), [`tests/entry614_employee_accounting_native.test.mjs` س1–95](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/tests/entry614_employee_accounting_native.test.mjs#L1-L95), [`tests/easystore_a1_day_ops_reads_v1.test.mjs` س1–66](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/tests/easystore_a1_day_ops_reads_v1.test.mjs#L1-L66), [`tests/cloudflare_accounting_f2_finance_core_v1.test.mjs` س1–55](https://github.com/fawakhry/TrendOs/blob/fbff27ea5d7d597e7f61ff28f048ad91b1a8b80b/tests/cloudflare_accounting_f2_finance_core_v1.test.mjs#L1-L55) تحتاج تشغيل وإثبات SHA | BLOCKED |

**نتيجة الفصل:** الحالي هو واجهة EasyStore SSO + Accounting Native READONLY (على مستوى source flags) مع مسارات D1 Writer موجودة، **وليس ترحيلًا مثبتًا لسلطة EasyStore المالية**. تم رصد اختلافات payload مهمة ومنع خلط هامش القسم بصافي الربح أو اعتماد الموظف بموافقة المالك. **`SOURCE_ONLY`، `TESTED=NO`، `PRODUCTION_VERIFIED=NO`**، ولا تعديل على كود التشغيل أو بيانات الحسابات.

**التالي:** الفصل 30 — تتبع الهوية/الجلسة والـSSO بين TrendOS وEasyStore وخادم الملفات، مع فصل owner claims عن UI role hints.


---

# 30. الجلسات وصلاحيات الدخول الموحد: TrendOS وEasyStore وخادم الملفات (16 أكتوبر 2026)

**نطاق الفصل:** هوية الموظف والجلسة من شاشة الدخول، المرور عبر Cloudflare Auth/D1 وLegacy، إصدار Edge Read Tokens، تسليم جلسة EasyStore، والدخول لخادم الملفات، مع فصل جلسة العميل. **درجة الدليل `SOURCE_ONLY`** على HEAD `e486fa6d47907ff0fd65f3cdaa6a03787ae7139f`. لم نختبر حسابات أو بيانات أو خوادم حقيقية، ولا نُعلن تشغيل تكامل SSO مستقلاً عن إجراءات التحقق على EasyStore وخادم Ubuntu.

## 30.1 نقطة الدخول وحفظ الجلسة
- [`config.js` س18–33](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/config.js#L18-L33) يضع `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true` و`EMPLOYEE_AUTH_SESSION_EPOCH=1`، ويعطّل browser legacy bridge، بينما وحدات Core/Ops GENERAL وAccounting/Content/Comms READONLY في المصدر. هذه flags متصفح؛ **إثبات سياسة الخادم المنشور منفصل**.
- [`app.js` س1677–1724](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1677-L1724) يحتفظ بموظف وتوكن داخل `sessionStorage` تحت `trendos_session` وبأسماء مفاتيح فرعية `matbagy_session_token` و`matbagy_username`، ويحذف النسخ القديمة من `localStorage`. `loadSession` يتحقق مبدئيًا من epoch ويسترد الحالة محليًا، **ولا يعد الاسترداد إثباتًا كافيًا لشرعية الجلسة**.
- [`app.js` س1725–1778](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1725-L1778) يفعل `verifyRestoredEmployeeSessionV1` لدى الدخول المستعاد، و[`app.js` س1778–1850](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1778-L1850) لديه Guard لإعادة التحقق والتحويل إلى شاشة الدخول عند 401/جلسة مرفوضة. ملف الاختبار [`tests/entry652_employee_session_lifecycle_guard.test.mjs` س1–55](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/tests/entry652_employee_session_lifecycle_guard.test.mjs#L1-L55) يفحص مسارات السورس وقواعد الإصدار؛ **لم نشغّل هذا الاختبار في مراجعة الكتاب**.
- [`app.js` س1895–1947](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1895-L1947) يفصل حساب العميل `doCustomerLogin` وجلسة `matbagy_platform_customer_session` عن موظف؛ [`cloudflare-d1/src/customer-portal-native-readiness-v0.mjs` س1–22](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/customer-portal-native-readiness-v0.mjs#L1-L22) يصرح أن customer portal readiness **لا يجيز login أو writes Native**، وبالتالي لا نخلط session العميل وSSO الموظف.

## 30.2 Native Employee Auth والخروج وكلمة المرور
- [`cloudflare-d1/src/employee-auth-native-v1.mjs` س3–26](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/employee-auth-native-v1.mjs#L3-L26) يعرض `/v1/employee/auth/login`، `session`، `logout`، `password/change`؛ source default session TTL ثماني ساعات ويمكن ضبطه حتى يوم واحد. [`cloudflare-d1/src/employee-auth-native-v1.mjs` س432–477](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/employee-auth-native-v1.mjs#L432-L477) يخزن **HMAC fingerprint** للجلسة في `employee_auth_sessions_v1`، وليس plaintext token.
- [`cloudflare-d1/src/employee-auth-native-v1.mjs` س479–541](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/employee-auth-native-v1.mjs#L479-L541) يتحقق من fingerprint و`expires_at_ms` و`revoked_at_ms` و`session_version` ومن كون الموظف نشطًا؛ محضر `role/department/screens` يخرج من الخادم، فلا نعتبر اسم الموظف الذي أرسله الـBrowser وحده صلاحية.
- [`cloudflare-d1/src/employee-auth-native-v1.mjs` س777–864](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/employee-auth-native-v1.mjs#L777-L864) يسجّل logout في جدول sessions. تغيير كلمة المرور يرفع `session_version` ويلغي الجلسات، **لكن التحديثين منفصلان**؛ خطورة التعطل بينهما مسجلة في فصل المصادقة سابقًا، فلا نعيد فتح بلاغ مستقل.
- [`cloudflare-d1/src/cloud-session-bridge-v3.mjs` س154–203](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/cloud-session-bridge-v3.mjs#L154-L203) يفضل Native ثم يسمح، **عندما لا يكون NativeOnly مفعلًا**، بـCloud Auth Shadow ثم Apps Script `verifyEmployeeSession`. [`cloudflare-d1/src/legacy-browser-transport-v1.mjs` س57–84](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/legacy-browser-transport-v1.mjs#L57-L84) يمنع عودة موظف إلى Legacy عند NativeOnly؛ Customer Legacy يتم استثناؤه عمدًا. **هذا انتقال صلاحيات متعدد المراحل لا يعني إزالة Google لكل مسارات العملاء أو الموظفين.**

## 30.3 Edge Orders Token — صلاحية قصيرة مستقلة
- [`cloudflare-d1/src/cloud-session-bridge-v3.mjs` س248–284](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/cloud-session-bridge-v3.mjs#L248-L284) يصدر Orders Token بعد تحقق جلسة الموظف، يحمل `sub/role/department/screens`، بحد TTL يقارب **240 ثانية** لمسار الطلبات. [`cloudflare-d1/src/edge-orders-read-v1.mjs` س92–127](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/edge-orders-read-v1.mjs#L92-L127) يتحقق من HMAC وتاريخ الانتهاء والـaudience، بينما [`cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` س219–230](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/edge-orders-read-02cr-canary.mjs#L219-L230) يحمي قراءات 02CR بتوكن Edge.
- **حالة قائمة لا تتكرر:** HMAC Orders token صالح حتى نهاية TTL رغم أن جلسة المصدر قد تُلغى قبلها، ولا يظهر ربط `sessionVersion` لحظة كل قراءة. هذا مُسجل سابقًا في الفصل 14 ضمن مخاطر `Edge token revocation`؛ يحتاج Acceptance test `logout/password-change → old token` لتأكيد أثره في بيئة اختبار. `PRODUCTION_VERIFIED=NO`.
- **`BOOK30-LEGACY-VERIFY-QUERY` P1 — مؤشر خطر إضافي:** [`cloudflare-d1/src/edge-orders-read-v1.mjs` س129–149](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/cloudflare-d1/src/edge-orders-read-v1.mjs#L129-L149) يحتوي `verifyEmployee` Legacy الذي يكوّن GET URL إلى `APPS_SCRIPT_API_URL` ويضع **`username` و`token` في query string**. هذا مختلف عن نقل SSO إلى ملفات مطبعجي في §20، لكنه نفس عائلة مخاطر تسرب session token عبر Request URL/logs/trace. وجود Cloud Session Bridge V3 قد يعني أن المسار القديم غير مستخدم أصلًا؛ **لا إصلاح عشوائي قبل تأكيد Routing وNativeOnly وdeployed version**. يلزم اختبار أن Legacy verifier معطّل أو استبدال GET بـPOST Server-to-Server دون نشر أي توكن.

## 30.4 EasyStore SSO — تذكرة لمرة واحدة لم تُثبت
- [`app.js` س11001–11024](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L11001-L11024) يستخرج اسمًا ودورًا وtoken من `sessionStorage` مع fallback لبيانات قديمة؛ `roleMode` يعتمد على `trendos_session` النصي وRegex، **وهو UI hint فقط**، ومشكلته موثقة في الفصل 27 `BOOK27-ACCOUNTING-ROLE-HINT`.
- [`app.js` س11020–11070](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L11020-L11070) ينشئ `ssoNonce` ويفتح `EasyStore` بـ`screen/mode/username` في URL، ثم يرسل **توكن جلسة TrendOS الأصلي** بـ`window.postMessage` مع `targetOrigin` ثابت؛ لا يوضع الـtoken في EasyStore query، ويحمي استقبال ACK بشرط `origin` و`source` و`nonce`. الاختبار [`tests/frontend_easystore_sso_entry619.test.js` س1–51](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/tests/frontend_easystore_sso_entry619.test.js#L1-L51) يتحقق من هذه الضوابط المصدرية، **وليس قبول EasyStore runtime للتوكن أو رفضه بعد الإلغاء**.
- **`BOOK30-SSO-LOGOUT-RACE` P1:** [`app.js` س11020–11064](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L11020-L11064) يعيد إرسال `postMessage` كل 250ms حتى ACK أو 32 محاولة/حد أقصى 8.5 ثانية، ويحتفظ بقيمة `u.token` المأخوذة لحظة الضغط. **لا يظهر إلغاء المؤقت عند `clearSession` أو `forceEmployeeReloginV2`** في [`app.js` س1713–1730](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1713-L1730) و[`app.js` س1792–1822](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1792-L1822). إذا خرج الموظف قبل ACK، قد يُرسل التوكن القديم لاحقًا إلى نافذة EasyStore إلى نهاية المهلة. هذا ليس إثباتًا بقبول جلسة غير صالحة على EasyStore؛ مطلوب Fake Browser race + اختبار رفض الجلسة الملغاة على الخادم المقابل قبل اعتبار الأمر ثغرة حية.
- **`BOOK30-SSO-AUDIENCE` P1 — حد ثقة يحتاج تصميم:** نقل توكن TrendOS الأصلي إلى تطبيق EasyStore مستقل يجعل الثقة مشتركة بين التطبيقين ما لم تكن هناك **تذكرة تبادل قصيرة العمر/مقيدة بالجهة وبمرة واحدة**. لا يظهر هذا النوع من التذاكر في sender source (الـnonce هنا يُستخدم لتطابق ACK وليس token بديلًا عن جلسة الموظف). افحص EasyStore receiver وBackend session verification والإلغاء والـaudience قبل اعتماد handoff؛ **لا تستنتج إمكانية الاستغلال بمجرد `postMessage`**. لا ترسل source token إلى logs.

## 30.5 خادم ملفات مطبعجي — لا تكرر البلاغ الأمني
- [`config.js` س46–52](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/config.js#L46-L52) يعلن ملف endpoint `files.matbagy.com`، و[`app.js` س1386–1406](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/app.js#L1386-L1406) يفتح `/trendos-sso?username=...&token=...` اعتمادًا على فلتر أسماء بالمتصفح؛ **وجود token في URL خطر مسجّل أصلًا في الفصل 20**، وليس بلاغًا جديدًا.
- لا يثبت source TrendOS أن Ubuntu endpoint ينشئ cookie ذات `HttpOnly/Secure/SameSite` أو ينفّذ check session/version/role/mount ACL على الخادم. مطلوب مراجعة خادم الملفات المستقل وتحديد `Who/Which files/TTL/logout/revocation/audit`، لكن **هذا الفصل لا يدّعي قراءة كود Ubuntu أو تعرض مستخدم لملفات الغير**.
- **`BOOK30-SSO-CROSSSERVICE-REVOKE` P1 / EVIDENCE GAP:** عمليات الإلغاء في Native Auth تكتب في D1؛ لا توجد أدلة نهاية-لنهاية في هذه الجولة على إبطال EasyStore session وFile-server session معًا فور Logout أو Password Change، وعلى إلغاء صلاحية Orders Edge token معًا. ملف JS ليس إثبات إلغاء ولا إثبات بقاء جلسات مستقلة؛ هذا **اختبار توافق وتشغيل** وليس P0 حادثًا.

## 30.6 قبول الفصل ومعيار الأمان
| السيناريو | المعرف | الإجراء المطلوب | الإثبات |
|---|---|---|---|
| EasyStore SSO بعد خروج TrendOS قبل ACK | BOOK30-SSO-LOGOUT-RACE | Fake timers + mock child; منع postMessage بعد logout/401، ثم receiver يرفض توكن ملغى | SOURCE_RACE_RISK |
| Scoped one-time ticket بدل مشاركة session | BOOK30-SSO-AUDIENCE | إيضاح audience/issuer/expiry/one-use/nonce binding من source الطرفين؛ اختبار replay + wrong origin | SOURCE_TRUST_BOUNDARY |
| Legacy employee token في Query upstream | BOOK30-LEGACY-VERIFY-QUERY | إثبات route inactive أو POST بديل؛ fake HTTP log verify بدون توكن | SOURCE_TOKEN_URL_RISK |
| إلغاء جلسات عبر ثلاثة خدمات | BOOK30-SSO-CROSSSERVICE-REVOKE | Logout/Password Change مع EasyStore/Files/Edge sessions وهمية وتوقيت انتهاء/إلغاء | BLOCKED_RUNTIME_PARITY |
| Token file-server URL | **§20 existing** | إعادة استخدام `BOOK20-FILE-SSO-TOKEN`؛ لا Duplicate | EXISTING |
| Edge token after logout | **§14 existing** | إعادة استخدام اختبار الفصل 14؛ لا Duplicate | EXISTING |
| SSO role hint غير موثوق | **§27 existing** | إعادة استخدام `BOOK27-ACCOUNTING-ROLE-HINT` | EXISTING |
| TESTED / PRODUCTION_VERIFIED | — | **NO / NO**؛ ملفات المصدر [`tests/employee_auth_native_a61.test.mjs` س1–40](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/tests/employee_auth_native_a61.test.mjs#L1-L40), [`tests/frontend_easystore_sso_entry619.test.js` س1–52](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/tests/frontend_easystore_sso_entry619.test.js#L1-L52), [`tests/entry652_employee_session_lifecycle_guard.test.mjs` س1–55](https://github.com/fawakhry/TrendOs/blob/e486fa6d47907ff0fd65f3cdaa6a03787ae7139f/tests/entry652_employee_session_lifecycle_guard.test.mjs#L1-L55) لا تعني تشغيل اختبار لهذه الجولة | BLOCKED |

**الخلاصة:** جلسة الموظف Native D1 تتحقق من revocation/version، والجلسة المعروضة لـOrders لها TTL وتفويض منفصل، وEasyStore يتلقى employee token عبر origin-pinned `postMessage`، بينما خادم الملفات يتلقاه عبر URL query. **مسار الإلغاء الشامل من أول Logout إلى إبطال جميع الخدمات غير مثبت**؛ يُغلق بالاختبارات واعتماد بروتوكول SSO موحد، لا بتوقع أن إخفاء زر أو حذف `sessionStorage` يلغي جلسات الخادم.

**نقطة الاستكمال التالية:** الفصل 31 — الخادم الخاص للمطبعة (Ubuntu / files.matbagy.com) وحدود الربط الحالية مع TrendOS وEasyStore والـAgents، وفق الملفات والأدلة المتاحة، دون وصف خدمات غير موجودة بأنها منشورة.


---

# 31. سيرفر TrendosShop المنزلي وخدمات Ubuntu والطباعة/الليزر — حالة الربط الحقيقية (16 أكتوبر 2026)

**حد الفصل:** يربط TrendOS بمسار الاستضافة الخاصة على جهاز `TrendosShop` في **البيت**، ويتناول أربع سلطات منفصلة: نظام تشغيل Ubuntu، عميل Print Server، خادم ملفات `files.matbagy.com`، وإيجنتات الإدارة/المطبعة الذاتية، مع اعتبار **الطباعة والليزر خدمات أولى قابلة لإضافة خدمات أخرى مستقبلًا**، وليس اختزال السيرفر في «الطباعة فقط». هذا **جرد أدلة Read-only في GitHub** لا زيارة للجهاز أو اختبار شبكة. **`SOURCE_ONLY`** و`HOST_OWNER_SCREENSHOTS` للخطوات التي وثقها المالك؛ `RUNTIME_PLATFORM_LINK=BLOCKED/NOT_VERIFIED`، `PRINTING=OFF`. لم يُجرَ SSH أو Git pull أو تنفيذ run.py أو اختبار رابط ملفات الإنتاج.

## 31.1 أين «كتاب السيرفر» المستقل؟
- المرجع الرسمي لتسجيل **كل خطوة Ubuntu فعلية** هو [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س1–34](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L1-L34) في Draft [PR #135](https://github.com/fawakhry/TrendOs/pull/135)، وليس فصل TrendOS بديلًا عنه. نقرأ لقطة مستقلة عند SHA `899481050a690951288f2e0e88917554e1798ad6`، ونترك سجل السيرفر كما هو لأننا **لم ننفذ خطوة على Ubuntu**. يُسجل فيه لكل أمر ونتيجته وتاريخه ودليل الصورة، ولا تُنقل الأسرار/عناوين الشبكة الخاصة إلى GitHub.
- [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س38–105](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L38-L105) يوثق `SERVER-20261016-01…09`، وأكمل في نفس الملف `SERVER-20261016-10…13`: إثبات `HEAD` المحلي، اسم secret دون قيمته، لقطة Secrets metadata، ومراجعة صلاحية قراءة أوردرات القسم. **PR #135 Draft غير مدموج، كما أن ملفه لم يُنقل إلى السيرفر لمجرد وجوده على GitHub**.

## 31.2 مثبت بالصور عن الجهاز — وما ليس مثبتًا
- الجهاز: iMac 12,1، Ubuntu Desktop 24.04.5 LTS، مستخدم `trend-main`، ذاكرة نحو 8 GiB، وSSD داخلي 120 GB؛ المالك حدد الموقع **البيت**، لا شبكة الطابعات بالمطبعة. [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س16–30](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L16-L30).
- `ssh.socket` **active/listening** على المنفذ 22 وفق صورة، بينما `ssh.service` كان `inactive/dead` ضمن نمط socket activation؛ لا يعني هذا أن اتصال SSH من الخارج نجح. UFW كان active مع `deny incoming`، **ولم تظهر** قاعدة Allow للـSSH. [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س32–60](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L32-L60).
- نتيجة `sshd -T` بعد إنشاء `/run/sshd` مؤقتًا: `passwordauthentication yes` و`pubkeyauthentication yes`، و`trend-main` **لم يظهر له** `authorized_keys` غير فارغ. [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س60–88](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L60-L88). **هذه بوابة تأهيل أمنية سابقة وليست ثغرة متحققة عن بُعد**؛ لا يُقفل Password Login قبل إنشاء مفاتيح موثوقة واختبار استخدامها، ولا يُفتح المنفذ للعامة الآن.
- `SERVER-20261016-10` في [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س104–123](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L104-L123): `git -C "$HOME/TrendOs" rev-parse HEAD` ظهر محليًا `a238ce5a830bc5a7968dc020cd8168c85fa8c446`؛ ومقارنة GitHub وقتها مع فرع AP-155 `ab21183f9444b8ebb49932f1b1e4f3c381888851` كشفت **98 commit** إضافيًا على GitHub دون نقلها إلى Ubuntu. رقم `behind 80` السابق اعتمد مرجع تتبع محليًا أقدم. **أي نجاح اختبار فرع AP-155 على GitHub لا ينطبق تلقائيًا على الجهاز**.
- `SERVER-20261016-11…13` في [`autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` س124–150](https://github.com/fawakhry/TrendOs/blob/899481050a690951288f2e0e88917554e1798ad6/autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md#L124-L150) يوثق أن GitHub Actions يحوي **أسماء** Secrets للتأهيل فقط، ولا يثبت صلاحية قيمها أو أنها تخص حسابًا مقيدًا لقسم الطباعة. Token مُستخدم سابقًا ورد عنه `401 Session miss` في شهادة تاريخية؛ **ممنوع إعادة استخدام token مالك محتمل كهوية قراءة Print Server**. لا تنقل أسرار GitHub إلى Ubuntu أو Logs أو GitHub issues.

## 31.3 Print Server الموجود بالمستودع: ليس خدمة استضافة منشورة
- [`autonomous-printshop/print-server/README.md` س1–44](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/README.md#L1-L44): برنامج Local **Windows print-server bridge**؛ بعد Login بموظف يراقب قراءة الأوردرات، والنسخة المرشحة تربط تحول حالة البند إلى `بدأ التنفيذ` أو `تحت التنفيذ` بمجلد محلي. القراءة لا تغيّر حالة الأوردر، ولا تسند موظفًا أو تشغل ماكينة أو تحاسب. بنية مجلدات `طباعة/فوتو/سبلميشن` وما شابه **ليست دليل جهوزية التصميم أو الورق أو اكتمال الطباعة**.
- [`autonomous-printshop/print-server/src/config.py` س10–20](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/config.py#L10-L20): HTTP المحلي الافتراضي على `127.0.0.1:4782`، ومسارات مجلدات داخل التطبيق. [`autonomous-printshop/print-server/src/config.py` س68–80](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/config.py#L68-L80): `trendos.enabled=true` و`pollSeconds=15` و`pollScreens=['service','print','laser','press']`، و`observeOnly=true` في المرشح. [`autonomous-printshop/print-server/src/server.py` س354–376](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/server.py#L354-L376) يرفض **أي bind غير Loopback**، ويمنع بدء العملية في config الافتراضي دون `TRENDOS_PRINTSHOP_ALLOW_LIVE='OWNER_APPROVED'` عندما يكون TrendOS أو Fast Mode مفعّلًا. ده **fail-closed مقصود** وليس تعطلًا ينبغي تجاوزه.
- [`autonomous-printshop/print-server/src/server.py` س28–56](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/server.py#L28-L56) يُنشئ `StateStore` و`OrderFolderService` عند البدء، حتى لو لا توجد `platformBusinessWrites`؛ [`autonomous-printshop/print-server/src/state.py` س12–20](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/state.py#L12-L20) ينشئ state directory، و[`autonomous-printshop/print-server/src/folders.py` س76–86](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/folders.py#L76-L86) ينشئ مجلدَي orders/ready. لذا `observeOnly` **ينفي فولدرات انتقال الحالة، ولا يعني أن تشغيل التطبيق محايد للقرص بالكامل**. تجربة Ubuntu read-only يجب أن تستخدم qualifier المعزول بدل `run.py` بأوضاعه الطبيعية.
- [`autonomous-printshop/print-server/src/trendos_shadow_qualifier.py` س1–35](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/trendos_shadow_qualifier.py#L1-L35) يقدّم `qualify_screen_once` بدون network/login/file/print عند الاستيراد؛ عند إعطائه Client صريحًا يطبق قراءة شاشة واحدة ويعيد summary بدون بيانات عميل، بشرط تأهيل سلطة القراءة خارجيًا. **وجود هذا الملف لا يثبت أنه شُغِّل على Ubuntu أو أن الخدمة العامة موثقة الصلاحيات**.

## 31.4 إشكالية صلاحية «قراءة الطباعة فقط» مقابل أربعة أقسام
- **`BOOK31-PRINT-ONLY-POLL-SCOPE` — P1 / SOURCE_CONTRACT_MISMATCH:** [`autonomous-printshop/print-server/src/platform_bridge.py` س18–31](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/platform_bridge.py#L18-L31) يحمل الشاشات الأربع من config، و[`autonomous-printshop/print-server/src/platform_bridge.py` س111–141](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/platform_bridge.py#L111-L141) يحاول `getRows` لكل شاشة، ثم يرفض `sync_once` بـ`INCOMPLETE_EMPLOYEE_SCREEN_SNAPSHOT` إذا نجحت شاشة واحدة فقط. لكن سياسة الربط الأولى (كتاب السيرفر §13) تشترط هوية **قراءة قسم الطباعة فقط** لا حساب المالك الكامل. بهذا الضبط الافتراضي، حساب `print` مُقيد بحق يتطلبه التصميم الآمن **لن يستطيع إكمال المزامنة** ما لم يُضبط `pollScreens` لنطاقه وتثبت أهلية القراءة Server-side.
- لا نعالج الفجوة بتوسيع صلاحيات الحساب إلى Service/Admin؛ الصواب إثبات أن نطاق المرشح `['print']` (أو دور أدق حسب سياسة الطباعة والمكبس) يعمل مع snapshot completeness لتلك الشاشات فقط، وفصل الليزر لاحقًا بهوية/نطاق مناسبين. [`autonomous-printshop/print-server/src/trendos_client.py` س308–326](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/trendos_client.py#L308-L326) يرسل POST `getRows` مع `screen` وsession الموظف، **والسيرفر لا المتصفح/العميل هو سلطة التفويض**.
- **`BOOK31-HOST-SOURCE-PARITY` — P1 / EVIDENCE_GAP:** الفرع المحلي `a238ce5a...` يختلف عن مرشح GitHub `ab21183f...`؛ التوثيق على AP-155 ليس فعل تثبيت. لا يجوز تحديد مسار `getRows` الذي يعمل على الجهاز أو إعدادات حمايةه قبل إثبات إصدار الكود المحلي وتعريف Runtime فعلي، وعمل اختبار مفصول مع Fake Data.

## 31.5 حدود تعريض HTTP المحلي وملفات العملاء
- **`BOOK31-LOCAL-READ-ACL` — P1 / SECURITY_DESIGN_GATE:** [`autonomous-printshop/print-server/src/server.py` س212–257](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/server.py#L212-L257) يعيد `GET /api/orders`, `/api/state`, `/api/order-files`, `/api/preview` من دون token check على مستوى GET. في الوقت نفسه [`autonomous-printshop/print-server/src/server.py` س258–303](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/src/server.py#L258-L303) يفحص `Host/Origin/Sec-Fetch-Site` وprocess-scoped token **لكل POST**. العرض الحالي مقيّد بـLoopback، ولذلك **لا نسمي GET غير المحمي ثغرة مفتوحة للإنترنت الآن**. لكن توسيع الخدمة لتصبح بوابة Ubuntu لأجهزة المطبعة أو وكلاء AI عبر reverse proxy يقتضي هوية/Scope لكل Reader، وقفل مسارات الحالة/الملفات قبل أي Port Forward أو public domain.
- **أمن Preview والملفات:** أي Preview قد يعيد bytes تصميم، وأسماء المجلدات تتضمن رقم أوردر واسم عميل؛ لذا تتطلب سياسة خادم داخلية تحدد معلومات كل Service (الطباعة/الليزر) وفق الحد الأدنى، وتمنع قراءة ملف خدمة أخرى أو عرض بيانات شخصية في Audit/Telemetry. صلاحية file preview المحلية **ليست** صلاحية تحميل ملف عميل خارجيًا.
- خادم `files.matbagy.com` المذكور في [`config.js` س42–52](https://github.com/fawakhry/TrendOs/blob/3f8aeedf05791ce525e194235097ca69f6dd0217/config.js#L42-L52) و`/trendos-sso` في [`app.js` س1380–1407](https://github.com/fawakhry/TrendOs/blob/3f8aeedf05791ce525e194235097ca69f6dd0217/app.js#L1380-L1407) **مكوّن منفصل** عن localhost Print Server. حالة تنفيذه على Ubuntu وربط المصادقة/الملفات به **غير مثبتة**. خطر session token داخل Query String سبق في `BOOK20-FILE-SSO-TOKEN` فلا نكرره.

## 31.6 تصميم متعدد الخدمات وربط الإيجنتات — خطة لا تشغيل
- **الخدمات المطلوبة من المالك:** Print Service، Laser Service، File Service، ثم أي خدمات أخرى من خلال Service Registry وعقود منفصلة. البنية المقترحة تميز `tenant/service/orderLineId` و`authScope`، وتمنع خدمة الليزر من قراءة مسودات الطباعة أو التعديل على الفواتير. **دي متطلبات مستقبلية وليست ملفات/حاويات منصبة وثبت عملها على الجهاز**.
- ربط مدير فوخا/غرفة الإيجنتات: يلزم Identity لكل Agent، Queue/Event Bus بأدلة `ack/status/retry`، وقواعد `ADVISORY_ONLY` وموافقة المالك لقرارات الأموال/التسليم/صلاحيات موظفين. مرور رسالة في Queue أو ظهور شات لا يعني أن كل إيجنت استلمها ونفّذها. **لم نقرأ أو نشغّل حاوية Agents على Ubuntu**.
- قبل استضافة أوردرات/تصميمات فعلية على قرص 120 GB: فحص Disk free/SMART/backup+restore وخطة نمو مرفقات وحفظ أسرار وتحديثات ونقطة Recovery، واختبار network/HTTPS صادر فقط للـTrendOS؛ لا إثبات لهذه البوابات في صور Terminal الحالية. كون الجهاز بالبيت يجعل إدارة الطابعات على شبكة المطبعة مشروع ربط آخر، **ليس side-effect تلقائيًا لتجهيز SSH**.

## 31.7 حالة الإثبات والاختبارات
| ID | P | إثبات الإغلاق | الحالة |
|---|---|---|---|
| BOOK31-PRINT-ONLY-POLL-SCOPE | P1 | Fake employee print-only يسمح `getRows(print)` ويرفض service/laser؛ Bridge scoped to `['print']` يعمل ويمنع Cross-screen leakage؛ أول Snapshot baseline فقط | SOURCE_CONTRACT_MISMATCH |
| BOOK31-LOCAL-READ-ACL | P1 | HTTP server Mock: GET /state/orders/preview في سياق multi-user/agent وLoopback/Proxy، يجب ألا يرجع Customer PII دون auth/narrow scope | SOURCE_SECURITY_DESIGN_GATE |
| BOOK31-HOST-SOURCE-PARITY | P1 | Owner screenshot read-only `rev-parse HEAD` موجود؛ مقارنة exact installed tree/requirements/config مع candidate قبل أي اختبار وتشغيل معزول | BLOCKED_RUNTIME_PARITY |
| BOOK31-SAFE-START-PROFILE | P2 | Fake/offline safe-mode مع temp directory فقط يثبت أن `run.py` default fail-closed ولا تتحول `observeOnly` إلى رخصة تشغيل حي | BLOCKED/INTENDED_FAIL_CLOSED |
| BOOK20-FILE-SSO-TOKEN | existing | سبق توثيق session in file-server URL في الفصل 20؛ اختبار مستقل لخادم الملفات | EXISTING_ISSUE |
| SSH key/password hardening | existing server-book step | `SERVER-20261016-06/07`: Password allowed + no verified scoped key؛ لا فتح UFW ولا تعطيل Password قبل اختبار key | EXISTING_HOST_GATE |
| TESTED / PRODUCTION_VERIFIED | — | `NO/NO`. اختبارات المصدر [`autonomous-printshop/print-server/tests/test_ap279_bridge_shadow_synthetic.py` س1–40](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/tests/test_ap279_bridge_shadow_synthetic.py#L1-L40)، [`autonomous-printshop/print-server/tests/test_ap277_write_guard_synthetic.py` س1–40](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/tests/test_ap277_write_guard_synthetic.py#L1-L40)، [`autonomous-printshop/print-server/tests/test_ap296_trendos_shadow_schema_synthetic.py` س1–40](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/tests/test_ap296_trendos_shadow_schema_synthetic.py#L1-L40) و[`autonomous-printshop/print-server/tests/test_platform_bridge.py` س1–40](https://github.com/fawakhry/TrendOs/blob/ab21183f9444b8ebb49932f1b1e4f3c381888851/autonomous-printshop/print-server/tests/test_platform_bridge.py#L1-L40)، **لم تُشغّل في هذه الجولة أو على الجهاز** | BLOCKED |

**قرار الإيجنت:** Ubuntu مثبت بالصورة ومقروء، لكن **لا اتصال TrendOS حي مُتحقق، لا SSH خارجي مأذون، لا نشر File Server، لا Print/Laser Runtime مثبت، ولا تنفيذ Agents على الجهاز**. شغل هذا الفصل هو التوثيق وربط الأدلة فقط. لا تغيير Ubuntu/الراوتر/الطابعات، ولا إدارة أسرار أو تحديث Git. **الفصل التالي 32**: أمن الملفات والتصميمات بين العميل والموظف وPrint/Laser services مع Lifecycle الـassets واختبارات ملكية الوصول، ثم باقي وحدات الكتاب.

---

# 32. أمان دورة حياة الملفات والبروفات بين العميل والموظف وPrint/Laser — تدقيق المصدر (16 أكتوبر 2026)

> **حالة الفصل:** `SOURCE_ONLY / DEPLOYMENT_UNKNOWN / NOT_TESTED_THIS_PASS`، وليس اختبارًا حيًا أو تفويضًا لتفعيل خدمة. آخر Source HEAD قبل بداية اعتماد الكتالوج: `69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0`. أي Draft PR غير مدموج يبقى منفصلًا عن المصدر الجاري فحصه.

## 32.1 خريطة مصادر الملفات الحالية في المستودع

| المسار | كاتب الملف أو قارئه من المصدر | إثبات المسار وحالة التحقق |
|---|---|---|
| Cloudflare Employee Comms → R2 | `uploadOrderConversationFile` يخضع لطلب POST وموظف موثّق؛ `uploadOrderFile` يفك Base64 حتى 25MB ويحفظ في `FILES` مع SHA256، ثم يسجل metadata في D1 `employee_order_conversation_files_v1` تشمل `order_id`, `line_id`, `public_url`, `visible_to_customer`, `uploaded_by` | [`employee-comms-native-v1.mjs` س203–226، س320–335](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/cloudflare-d1/src/employee-comms-native-v1.mjs#L203-L226)؛ blob `f415d06ccd15ba241d679c61b7afeb6ec904e4b8`؛ `SOURCE_ONLY` |
| Cloudflare Employee Content → R2 | `uploadPublicFile` يحفظ `employee-content/<collection>/<fileId>/...` بحد 25MB، ويُدخل مرجعًا في `employee_content_files_v1`، ثم يتيح رابطًا عامًا مهيأ أو مسار `GET /v1/employee/content/file/{id}` | [`employee-content-native-v1.mjs` س88–108، س254–275](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/cloudflare-d1/src/employee-content-native-v1.mjs#L88-L108)؛ blob `fab5eeeca0ecc9312380054b32f01a44639f4664`؛ `SOURCE_ONLY` |
| Print Server المحلي | خدمة Python تعطي `/api/order-files` و`/api/preview` للملفات المحلية، وتدير جذر مجلدات الأوردرات ومجلدات `ready`؛ bridge منفصل يقرأ حالة بنود الموظف ولا يغيّر بيانات TrendOS | [`server.py` س200–245](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/server.py#L200-L245) blob `e92e6851ad147f5ae2bea9659b032c125e1fe70d`، [`platform_bridge.py` س128–211](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/platform_bridge.py#L128-L211) blob `7321393be0299863483eb7479dc28b1917039036` |

## 32.2 صلاحيات استرجاع الملفات وحدود إثباتها

- **BOOK20-R2-FILE-AUTH (بلاغ موجود، لا تنشئ مكررًا):** في مصدر `employee-comms-native-v1.mjs` المعاين، طلب GET لمسار `/v1/employee/comms/file/{id}` يُوجَّه إلى `serveFile` **قبل** `authenticate`، و`serveFile` يقرأ الـmetadata ويعيد `FILES.get` دون فحص ظاهر لجلسة/دور الموظف أو مالك الأوردر أو `visible_to_customer`. [ترتيب GET مقابل المصادقة س305–326](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/cloudflare-d1/src/employee-comms-native-v1.mjs#L305-L326). رأس `cache-control: private` ليس إجراء تفويض. **الثابت:** فجوة في مصدر هذا الفرع، **ليس** كشف إنتاجي متحقق أو إثبات امتلاك طرف خارجي لرابط ملف حقيقي.
- **BOOK22-CONTENT-R2-ACL (بلاغ موجود، لا تكرر):** في مصدر `employee-content-native-v1.mjs`، GET `/v1/employee/content/file/{id}` يأتي قبل استدعاء `auth`، و`serveFile` لا يظهر معه فحص مالك السجل/حالته، ويُعيد رأس `cache-control: public,max-age=3600`. قد تكون بعض المجموعات مقصودة للنشر العام، لذلك لا نطالب بمنع كافة الملفات بلا تمييز؛ ينبغي فصل الأصول العامة المثبتة عن الخاصة. [س103–108، س258–275](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/cloudflare-d1/src/employee-content-native-v1.mjs#L258-L275). يوجد إصلاح [Draft PR #161](https://github.com/fawakhry/TrendOs/pull/161)، عند قراءة 16 أكتوبر 2026 كان `OPEN / DRAFT / NOT MERGED` ورأسه `b4fafcf15baffa4ae998736d0ce07456d142fee1`. **لا يُعد إصلاحًا منشورًا**.
- **الربط بمالك الطلب:** عمودا `order_id` و`visible_to_customer` المسجلان في D1 لا يساويان فحص سياسة وصول عند GET. قبل اعتماد الوصول لأي بروفات يُختبر ترتيب `deny-before-FILES.get` باستخدام D1 وR2 وهميين على HEAD الصحيح، ثم فحص نسخة النشر المصرح به.
- **روابط R2 العامة:** وجود `FILES_PUBLIC_BASE_URL` يعطي مسارًا آخر محتملًا للوصول؛ لا يكفي تصحيح GET Worker إذا كان رابط R2 الأصلي متاحًا دون بوابة مناسبة. حالة الإعداد والنشر الفعلي `UNKNOWN`، ولا نختبر روابط العملاء الحقيقية.

## 32.3 خدمة الطباعة المحلية ليست تلقائيًا خادم الملفات الإنتاجي

- `config.py` يضبط مبدئيًا **127.0.0.1:4782**، و`server.py` ينشئ `ThreadingHTTPServer` على host/port المقروءين من إعدادات الخدمة. هذا يصف الوضع الافتراضي في الكود، ولا يثبت وصول الشبكة الفعلي أو أن الخدمة تعمل على Ubuntu. [الإعداد س10–15](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/config.py#L10-L15)، [الربط س310–344](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/server.py#L310-L344).
- `TrendOSReadClient.get_rows` يرسل POST إلى `/v1/employee/core` بعملية `getRows` وجلسة الموظف من الذاكرة؛ ثم `TrendOSStatusBridge` يبدأ بمزامنة baseline دون إنشاء مجلدات تاريخية، ويُنشئ مجلدًا محليًا بعد **تغير** حالة سطر إلى بدء/تحت التنفيذ. ذلك **نقل حدث محلي** وليس رفع ملف Cloudflare تلقائيًا ولا إثبات اتصال طابعة فعلية. [client س310–325](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/trendos_client.py#L310-L325)، [bridge س128–205](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/src/platform_bridge.py#L128-L205).
- داخل الكود المحلي توجد واجهات `/api/preview?path=...` و`POST /api/settings/orders-root` و`POST /api/events/structured-approval`؛ عند قراءة `server.py` لا يظهر مصادقة HTTP مستقلة لكل عملية محلية. الافتراض الأمني الظاهر هو loopback افتراضي. **لا تعرض هذه الواجهات على LAN/Cloudflare/الإنترنت دون سياسة مصادقة وتقييد مسارات وفحص مستقل**. لا يوجد دليل في هذه المراجعة أنها مكشوفة فعليًا.
- ملف [`test_platform_bridge.py`](https://github.com/fawakhry/TrendOs/blob/69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0/autonomous-printshop/print-server/tests/test_platform_bridge.py) blob `fb4cf92ca7d3e969ce02082f812967409b87c378` يتضمن FakeClient وحالات مجلدات، **لم يُشغَّل في هذا الفصل**. اسم الملف ووجوده ليس PASS على السيرفر.

## 32.4 مسار اختبار آمن قبل اعتماد النشر

| اختبار/بوابة | المطلوب بدقة | الحالة |
|---|---|---|
| B32-COMMS-FILE-OWNER-ACL | Fake D1 وR2: مستخدم غير مصرح به ومستخدم مسموح وملف `visible_to_customer=0`، رفض قبل `FILES.get` مع الحفاظ على وصول المستخدم صاحب الصلاحية | `SOURCE_RISK / NOT_RUN_THIS_PASS`؛ مرتبط بـBOOK20 لا بلاغ جديد |
| B32-CONTENT-PUBLIC-SCOPE | Fake collection/active owner: ملفات عامة معلنة فقط قابلة للعرض؛ الملفات الخاصة أو المالك غير النشط 403/404 قبل قراءة R2؛ مراجعة Draft #161 على SHA الدقيق | `DRAFT_EXISTS / NOT_MERGED / PRODUCTION_UNKNOWN` |
| B32-LOCAL-PREVIEW-PATH | ملفات وهمية: منع مسار خارج ordersRoot؛ فحص عدم كشف حالة/إعدادات من origin غير موثوق؛ حماية POST لو تغير loopback bind | `NOT_RUN_THIS_PASS / LIVE_HOST_UNKNOWN` |
| B32-FILE-LIFECYCLE | التحقق من رفع/عرض/حذف/استرجاع البروفات ومراحل الموافقة وحفظ SHA مع منع فقد الملف أو كشف ملف عميل آخر؛ بيئة staging مع ملفات وهمية فقط | `BLOCKED_DEPLOYMENT_EVIDENCE` |
| B32-PRINT-BRIDGE | Fake employee statuses ثم اختبار بيئة محلية مأذونة للنسخة المثبتة، مقارنة تشغيل الخدمة وملفاتها وD1 read authority دون تعديل الأوردر | `REPO_ONLY / PRODUCTION_VERIFIED=NO` |

**قرار الفصل:** إثبات وجود المسارات والمخاطر **SOURCE_ONLY**؛ الـDraft لا يعادل Merge، ولا يُقدَّم لمالك TrendOS ادعاء بأن `files.matbagy.com` أو Ubuntu أو الطابعات أو R2 ACL قد تأهل إنتاجيًا. بلاغات BOOK20/BOOK22 القائمة لا تُكرر. **الخطوة التالية:** ربط ترتيب الـR2 GET وملكية الملف بالاختبارات والتحديثات الفعلية على أحدث فرع تطوير، والتحقق من نسخة النشر وقت الحصول على موافقة القراءة فقط. لا تعديل مصدر، لا استخدام ملفات عملاء، ولا Deploy/Merge/Delete.

---

## الملحق التاريخي أ — الكتاب القديم قبل التقسيم (نص محفوظ بالكامل)

> **ARCHIVED_SOURCE_ONLY / NOT_CURRENT_RUNTIME_AUTHORITY.** هذا الملحق يحفظ النص المنقول من `docs/trendos/book-agent/TRENDOS_LEGACY_PRE_SPLIT_BOOK.md` في نسخة Git SHA `04500f9503f25d49aada9f90b432cd6a6700adb7`. وجود وصف نشاط قديم لا يعني أنه يعمل اليوم. [المصدر الأصلي محفوظ في فرع الأرشيف](https://github.com/fawakhry/TrendOs/blob/archive/trendos-books-before-single-book-20261016/docs/trendos/book-agent/TRENDOS_LEGACY_PRE_SPLIT_BOOK.md).

<!-- BEGIN_VERBATIM_ARCHIVE:LEGACY_PRE_SPLIT_BOOK source=04500f9503f25d49aada9f90b432cd6a6700adb7 -->
# كتاب TrendOS القديم — قبل تقسيم المشاريع (مسودة أرشيفية)

> **قرار المالك 2026-10-16 — LEGACY / PRE-SPLIT ARCHIVE.**
> هذا الكتاب للأكواد والوظائف والقرارات التاريخية للنظام الأصلي، **بما فيها ما توقف أو انتقل إلى مشروع مستقل**. هو مختلف عن `TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md` الذي وثّق وظائف النظام الحالي حتى الفصل 31. لا تُحوَّل ميزة تاريخية إلى ميزة LIVE بمجرد توثيقها هنا.

## 1. ما نريد حفظه

المطلوب استعادة الكود الأصلي قبل التقسيم من: GitHub history/branches، المستودعات السابقة أو المستقلة التي حملت مكونات من الأصل، Google Apps Script، نسخ Google Drive/مكتبة الملفات، وأي أرشيف محلي يقدمه المالك لاحقًا. لكل مكوّن: الاسم، تاريخ/مرحلة النسخة، المصدر، path/blob SHA أو SHA-256، الدور القديم، المنقول إليه حاليًا، هل كان حيًا أم تجربة/مشروعًا متوقفًا، الأخطاء المعروفة، وطريقة الاستعادة.

**الكتاب يفهرس ويشرح الكود ويربط النسخة المحفوظة؛ لا نُدرج مئات الآلاف من الأسطر كنص مكرر ولا ننشر مصدرًا خاصًا قبل فحص الأسرار والحقوق وبيانات العملاء.** الكود الذي لم يُقرأ بالكامل يبقى `FOUND_NOT_FULLY_AUDITED` وليس `ARCHIVE_COMPLETE`.

## 2. أول نسخة خارج GitHub استُرجعت وجرى فحصها

| ID | المصدر | ما تحقق | حالة الحفظ |
|---|---|---|---|
| LEGACY-AS-1932-FULL | **ChatGPT Library**، الملف `TrendOS_Code_FULL_V1932_2026-08-24.gs` | بايتات موجودة؛ 731,855 بايت، **11,811 سطرًا**، **614 تعريف دالة بالتعبير النمطي القديم؛ و620 تعريفًا (617 اسمًا مختلفًا) بتحليل AST الأدق**؛ SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`. أمثلة عائلات الدوال: Orders, Customers, Accounting, Attendance, HR, Cleaning, Press, Router | `PRIVATE_BYTES_RECOVERED`؛ **NOT_PUBLISHED**. فحص نصي أولي رصد أنماطًا قد تمثل بيانات اعتماد؛ لا نص الملف ولا بيانات حقيقية على GitHub العام قبل فحص يدوي وتطهير آمن |
| LEGACY-AS-1932-MANIFEST | ChatGPT Library، `TrendOS_V1932_AppsScript_Deploy_Manifest.txt` | 3,608 بايت؛ SHA-256 `c3f29973a7287b47e632e6a799350494db26a0d6eda3b5b781bffa7b218a254b` | `PRIVATE_BYTES_RECOVERED`؛ للربط والتحقق فقط |
| LEGACY-AS-STAGING | Google Drive: `TEMP TrendOS T2 Code.gs baseline restore 2026-09-17` و`TEMP TrendOS T2 Code.gs diagnostic capture 2026-09-18` و`TEMP TrendOS T2 authoritative source staging 2026-09-18` | **أسماء ووجود ملفات** عبر Drive metadata؛ المحتوى ولمطابقته مع نسخة V1932 لم يُفحصا بعد | `FOUND_METADATA_ONLY` |
| LEGACY-AS-BACKUP-UNRESOLVED | نسخة باسم `TrendOS Apps Script Backup Before V1932 - 2026-08-24` مذكورة في محادثات تاريخية | بحث Drive بالاسم لم يعثر عليها في الفهرس المتاح؛ قد تكون في حساب أو مكان غير متصل | `HISTORICAL_REFERENCE_UNVERIFIED` |
| LEGACY-AS-CURRENT-GIT | [`fawakhry/TrendOs@main/Code.gs`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/Code.gs) | ملف مصدر حجمه نحو 752 KB في المستودع؛ **لم يُثبت تطابقه بايت-ببايت مع نسخة V1932 الخاصة** | `GIT_SOURCE_PRESENT_DIFFERENCE_UNVERIFIED` |

**ممنوع:** حذف النسخة الخارجية أو استبدالها بملف GitHub قبل إثبات التطابق. حساب عدد الدوال ليس إثباتًا أن كل وظيفة بقيت تعمل أو أن كل نسخة المنشور كانت هي المستخدمة.

## 3. استرجاع ما قبل تقسيم «صندوق مطبعجي» — مثبت بالنقل السابق

- المصدر التاريخي: `fawakhry/Matbagy-Design-Workflow@agent/initial-mvp`، commit `01d7fc2fccc2907debd8de70a1018eaf4cff4574`؛ المستودع الأصلي **حُذف يوم 2026-10-02 بعد موافقة المالك** وفق [تقرير النقل الموثق](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FROM_MATBAGY_DESIGN_WORKFLOW.md).
- نُقلت **146** ملفًا إلى [`fawakhry/Matbagy-OS`](https://github.com/fawakhry/Matbagy-OS) (126 مطابقًا، و20 بتغييرات هوية/توجيه مقصودة، 0 مفقود حسب تقرير النقل)؛ يوجد [`MIGRATION_FILE_INVENTORY.json`](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FILE_INVENTORY.json) مع source blobs/digests، و[`ARCHIVE/source-history.bundle`](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/ARCHIVE/source-history.bundle) بحجم 488,751 بايت؛ التقرير يذكر حفظ 263 commit من تاريخ الفرع canonical بالإضافة إلى الفروع الأصلية.
- الحالة: `MIGRATED_ARCHIVED_EXTERNALLY`، **لا تُكرر الملفات أو الـDesign Cases/صور العملاء داخل TrendOS العام**. نكتب في هذا الكتاب **ما كان مرتبطًا بالنظام القديم فقط**، بينما الكتاب الحالي للمشروع SaaS هو `Matbagy-OS/PROJECT_BOOK.md`.

## 4. المستودعات التي تظهر في الحساب وتقرير ملكية الكود

الجرد الأولي وجد **8 مستودعات متاحة**. لا نفترض أن كل مستودع جزء من النظام القديم. في `LEGACY_SOURCE_RECOVERY_REGISTER.md` جدول كامل بالـHEAD ونوع الملكية؛ القرار النهائي لكل ملف بناءً على تاريخ إضافته ووظيفته، لا تشابه الاسم.

- **TrendOs:** المصدر التشغيلي والـApps Script القديم؛ به `Code.gs`, `v1932-router.gs`, وحدات HR/Attendance/Press/WhatsApp/Orders، وفروع تطوير تاريخية كثيرة. جرد `CURRENT_TREE_BASELINE.md` قديم يحتوي **1,995 ملفًا** وليس تصريحًا أن كلها Legacy. الحالة `MIXED_ACTIVE_AND_LEGACY`.
- **Matbagy:** مشروع منفصل موصوف في README بأنه Photo Sheets؛ يحتفظ بـ`app.js`, `app_zoom_pan.js`, `print-export.js`, `google_apps_script_activation.gs`. قد يقدّم سياقًا تاريخيًا للطباعة، **لا يُدمج في TrendOS قبل فحص الأصل والملكية**.
- **EasyStore / Matbagy-OS / Fokha:** كتب ومستودعات مستقلة حالية. الارتباط التاريخي بالقديم يوثَّق بالفهرس فقط، ولا تُنقل أكوادها الحالية إلى هذا الكتاب.
- **trendos-lead-hunter:** أداة مستقلة بحسب README؛ لا تُنقل إلا أجزاء قديمة مثبتة provenance.
- **fiber-auto-max-ezcad:** برنامج ليزر منفصل؛ افصل ملكية الكود عن تاريخ TrendOS.
- **awez:** لا يوجد حتى الآن دليل أنه جزء من TrendOS الأصلي؛ `OUT_OF_SCOPE_PENDING_PROOF`.

## 5. لقطة أمان قبل تنظيف GitHub

تم إنشاء الفرع [`archive/trendos-before-legacy-cleanup-20261016`](https://github.com/fawakhry/TrendOs/tree/archive/trendos-before-legacy-cleanup-20261016) من `main` عند commit `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`، وتُحقّق أن SHA الفرع يساوي SHA المصدر. هذا **snapshot محفوظ عبر Git ref**، ولا يعني Backup خارج GitHub أو اختبار استعادة.

لا يزال **التنظيف غير منفذ**: لا delete/move، لا تعديل source/config/workflows ولا Merge، ولا تغيير مستودع EasyStore/Fokha/Matbagy-OS. سيُعدّ جدول قرار لكل ملف `ACTIVE_KEEP` / `LEGACY_ARCHIVE_CANDIDATE` / `SHARED_DEPENDENCY_KEEP` / `SEPARATE_PROJECT_REFERENCE` / `UNKNOWN_NEEDS_PROOF`، ثم Draft PR مراجعة لكل حزمة صغيرة، وبعد أرشيف متحقق وموافقة على الحذف فقط تبدأ الإزالة من الفروع التشغيلية.

## 6. الملفات والحالات غير المكتملة

- خارجي: **Google Apps Script المنشور** ومدخلاته، ونسخ Google Drive/الجهاز المحلي/البنية القديمة التي لم تُمنح لنا قراءتها؛ لا نستنتج الكمال من بحث Drive.
- محفوظ جزئيًا: ملف V1932 الـPrivate Library محفوظ ومثبت hash، لكن **فحص الأسرار والمقارنة مع GitHub واستخراج خرائط الدوال والتاريخ لم يُكمل**.
- GitHub: Branches كثيرة، وصف الحالية فقط لا يثبت أنها كلها آمنة للحذف؛ Git history مطلوب للحفظ، ولا حذف باستخدام force/rewrites.
- **NEXT:** قراءة فرق نسخة V1932 مقابل نسخ GitHub وتقييم Legacy modules ثم حفظ كود آمن مستقل (بعد مراجعة الأسرار)، والعمل على `GITHUB_LEGACY_CLEANUP_PLAN.md`. الحالة الشاملة `LEGACY_ARCHIVE_IN_PROGRESS`، وليس `BOOK_COMPLETE`.

*تاريخ الإدخال: 2026-10-16. هذه مادة أرشيفية تاريخية وليست امتدادًا للادعاءات الإنتاجية في الفصول 1–31.*

## فصل أرشيفي 1 — مقارنة كود V1932 الأصلي مع GitHub بتاريخ 16 أكتوبر 2026

بدأنا التنفيذ الفعلي بمراجعة **نسخة Apps Script الخاصة المأخوذة يوم 2026-08-24** مقابل تاريخ `Code.gs`، دون نسخ نصها إلى GitHub. أصبح [الفهرس المسموح نشره](TRENDOS_LEGACY_V1932_FUNCTION_NAMES_INDEX.md) يحتوي 614 اسم دالة مع رقم السطر وتصنيف آلي. والتحليل النحوي (AST) للنسخة نفسها أحصى 620 عقدة تعريف لدالة، بينها 13 متداخلة.

**النتائج المؤكدة على مستوى الاسم:** `614/614` اسمًا من النسخة التاريخية موجودة في GitHub `Code.gs` يوم 24 أغسطس، وكذلك نسخة `main` المفحوصة. لذلك **لا يوجد دليل أن دالة اسمها اختفى** ضمن هذه العينة؛ غياب الاسم `0` لا يثبت بقاء السلوك. تاريخ GitHub لـ`Code.gs` على `main` أظهر 8 Commits فقط في المسار المرصود: آخر تعديل 29 سبتمبر 2026 أضاف عشر دوال تخص Employee Legacy Bridge، ونسخة 24 أغسطس تضم سبعة أسماء غير موجودة في النسخة الخاصة نفسها.

**فرق المحتوى:** فحص حدود الدوال في المصدر النصي أعطى `604` دوال متطابقة نصيًا مع نسخة 24 أغسطس على GitHub، و**8 دوال اختلف نصها**، و**دالتين فشل تحليل نهاياتهما** فتبقيان `INCONCLUSIVE`؛ النتائج `SOURCE_ONLY/LEXICAL_HEURISTIC` وليست اختبار تشغيل أو إثبات تطابق كامل. الدوال الثمانية: `syncOrderFromLines_`، `getMatbagyNotes_`، `saveAccountingDeptLine_`، `appendLine_`، `getRows_`، `getTrendMasterCenterV1931_`، `saveCustomerAccountMovementV1915_`، `createManualOrder_`. تحليل دالتَي `trendosPortalRedirectV1931_` و`attFindToday_` يحتاج AST أفضل.

**فارق فرع الكتاب عن فرع الإنتاج المصدري:** `Code.gs` في فرع الكتاب blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2` يتضمن **641 اسمًا مختلفًا** مقابل 631 في `main` (blob `179526ca2f6343067dd7edebd6d290be79a6984b`). أسماء العشر الزائدة في فرع الكتاب هي `trendosLegacyOrderCreateFenceV1_` و`cwReconcileTextV1_` و`cwReconcileBoolV1_` و`cwReconcileSafeEqualV1_` و`cwReconcileCanonicalV1_` و`cwReconcileSha256V1_` و`cwReconcileHeaderIndexV1_` و`cwReconcileOrderMappingV1_` و`cwReconcilePlanV1_` و`trendosCloudWriteReconcileDryRunV1_`. هذه **فروق Branch**، ولا يجوز اعتبارها نسخًا منشورة أو حذفها أثناء التنظيف.

**أرشيف خاص للمستخدم:** ملف `TrendOS_Legacy_V1932_Private_Archive_20261016.zip` يحتوي بايتات Apps Script التاريخية، Deploy Manifest وفهرس AST من 620 عقدة وSHA-256 للنسخ وملف تعليمات تحذيري؛ **ZIP Test=PASS**، حجم 190,214 بايت، SHA-256 `0eb1a5fe785c2ea07f6338713e1c314da6e10a4e03c3412f3cddcaf4976ca10f`. موجود كمرفق خاص بالمحادثة **وليس في GitHub العام**. لا تُغلق فجوة النسخة المستقلة إلا بعد أن يحفظها المالك بأمان خارجي ويُختبر فكها. الفحص النصي الأولي لم يثبت وجود بيانات اعتماد مضمنة، لكنه ليس مراجعة أسرار شاملة.

**المطلوب قبل أي حذف:** تفكيك الفروق الثمانية إلى تغييرات سلوك/تصحيح/تنقل، وحسم سلطة writer/reader في كل زمن؛ فحص مراجع أسماء الجسر العشرة و`CloudWriteReconcile`؛ وإثبات نسخة Apps Script المنشورة وسياسات Secrets ثم إعداد قائمة مسارات دقيقة يتوافق عليها المالك. **الملفات المحذوفة حتى الآن: صفر.**



## 7. نتيجة المقارنة الأولى للدوال واستعادة النسخة الخاصة (16 أكتوبر 2026)

تمت مراجعة النسخة المسترجعة `TrendOS_Code_FULL_V1932_2026-08-24.gs` مقابل `Code.gs` في المستودع، مع عدم نشر ملف المصدر الأصلي. الملف القديم يحمل **620 تعريف دالة بتحليل AST (607 رئيسية و13 متداخلة؛ 617 اسمًا مميزًا)**. مقارنة الأسماء مع نسخة `main` المُثبَّتة أظهرت **614 اسمًا مشتركًا** و**17 اسمًا موجودًا في GitHub فقط** و**3 أسماء قديمة متداخلة فقط**؛ **جميع أسماء الدوال الرئيسية الـ607 القديمة موجودة في كود GitHub من حيث الاسم**.

هناك أيضًا تقرير مقارنة على GitHub بتاريخ 2026-08-24 يسجل **604 مقاطع دوال متطابقة نصيًا، و8 مختلفة، و2 لم يمكن إثبات تطابقهما** بأسلوب تحليل نصي أولي للـ614 تعريفًا الظاهرة في بداية الأسطر. **الثماني المختلفة** هي: `syncOrderFromLines_`، `getMatbagyNotes_`، `saveAccountingDeptLine_`، `appendLine_`، `getRows_`، `getTrendMasterCenterV1931_`، `saveCustomerAccountMovementV1915_`، `createManualOrder_`. **الاثنتان غير الحاسمتين**: `trendosPortalRedirectV1931_` و`attFindToday_`. لا يصح اعتبار تشابه الاسم إثبات تطابق التنفيذ أو تشغيله إنتاجيًا؛ تفاصيل الاختبار والتاريخ في [سجل المصادر](LEGACY_SOURCE_RECOVERY_REGISTER.md).

**مصدر التاريخ:** ملف GitHub عند 24 أغسطس `a39fe9a0dde62232a9f25db92c4697e07af158e9`، ثم إضافة جسر مصادقة Legacy وبعض الدوال في تحديث 29 سبتمبر `f6a501b1466131b7abf16b9cca593ad5e1aa4f61`. جرد الفروع السابق أظهر **269 فرعًا**؛ لا يساوي ذلك 269 نسخة قديمة ولا يبيح حذفها. يجب مراجعة أول/آخر استعمال قبل نقل أي دالة من حالة `ACTIVE_KEEP`.

**النسخة الخاصة:** أُنشئ في مساحة ملفات العمل أرشيف `TrendOS_Legacy_V1932_Private_Archive_20261016.zip`، حجم **190,214 بايت**، بصمة SHA-256 `0eb1a5fe785c2ea07f6338713e1c314da6e10a4e03c3412f3cddcaf4976ca10f`. تم فحص سلامة ZIP واكتمال مكوناته. يحتوي كود Apps Script القديم، قائمة الدوال وبصماتها، وmanifest. **ملف خاص قد يحوي أسرارًا، ولا يُرفع إلى GitHub العام ولا يُعتبر نسخة احتياطية خارج ChatGPT إلا بعد احتفاظ المالك به في مكان آمن**. داخل مكتبة المستخدم الخاصة مجلد `/TrendOS-Legacy-Archive/` يحفظ فهارس وبصمات المصدر **دون أجسام الدوال**.

**القرار:** `PRIVATE_ARCHIVE_IN_WORKSPACE=YES`، `IDENTIFIER_COMPARISON=COMPLETE`، `PARTIAL_BODY_COMPARISON=COMPLETE`، `FULL_SEMANTIC_DIFF=NO`، `DEPLOYED_PARITY=NO`، `SAFE_TO_DELETE=NO`. المرحلة التالية مقارنة وظائف الدوال الثماني، تحديد callers والتبعيات على Google/Worker وتقديم أول قائمة حذف **مقترحة فقط** للموافقة.

## 9. استكمال الأرشفة: مقارنة فرع الكتاب وملفات التكرار (16 أكتوبر 2026)

**نقطة القراءة:** الفرع `agent/trendos-book-audit-v1-20261014` بدأ عند `2fc7c187247b7b0cbd2e95c58cf1da00838e734b`؛ الأرشيف المحمي `archive/trendos-before-legacy-cleanup-20261016` بقي عند `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`. الملف الحالي `Code.gs` blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`، لا يُخلط بينه وبين `main` أو المنشور.

**استعادة المصدر الخاص:** تمت إعادة materialization للملف الأصلي `TrendOS_Code_FULL_V1932_2026-08-24.gs` وتحقق SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`، ومعه Deploy Manifest SHA-256 `c3f29973a7287b47e632e6a799350494db26a0d6eda3b5b781bffa7b218a254b`. AST TypeScript للمصدر الخاص: **620** FunctionDeclaration، **617** اسمًا مختلفًا، **13** تعريفًا متداخلًا، **0** parse diagnostics.

**فرق الفرع الحالي مقابل الأصل:** فحص `^function` وحدود الأقواس النصية: **614** اسمًا أصليًا، **641** اسمًا مختلفًا بالفرع، **600** span متطابق نصيًا، **12** تغير نصها، **2** غير حاسمتين (`trendosPortalRedirectV1931_` و`attFindToday_`)، **0** أسماء أصلية مفقودة، **27** اسمًا جديدًا على فرع الكتاب. الدوال المتغيرة: `doGet`, `doPost`, `authorize_`, `syncOrderFromLines_`, `makeOrderId_`, `getMatbagyNotes_`, `saveAccountingDeptLine_`, `appendLine_`, `getRows_`, `getTrendMasterCenterV1931_`, `saveCustomerAccountMovementV1915_`, `createManualOrder_`. اسم `score` ظهر مرتين داخل المصدر الحالي، ولم يُثبت تصادم النطاقات. **المقارنة نصية استدلالية وليست AST للفرع أو اختبار تشغيل.** [الجدول الكامل](LEGACY_V1932_CURRENT_BRANCH_FUNCTION_DIFF_20261016.md).

**Git Blob duplicate inventory:** شجرة فرع العمل المكتملة تضمنت **2,005** Git blobs عند البداية، وبعد إضافة تقرير المقارنة أصبحت **2,006**؛ جرد التطابق وجد **101** مجموعة blob مكررة، **202** مسارًا متطابقًا، منها **9** مجموعات `.gs` (18 مسارًا) بين الجذر و`autonomous-printshop/sources`. نفس البايتات لا يعني نفس النشر أو عدم استعمال الملف. [الجرد والأسماء وSHAs](LEGACY_DUPLICATE_BLOBS_AUDIT_20261016.md). قائمة أولى: **9** ملفات Mirror مرشحة لمراجعة تنظيف فقط: `UNKNOWN_NEEDS_PROOF`، `CANDIDATES_APPROVED=0`، `DELETIONS=0`.

**نسخة استعادة جديدة خاصة بالمحادثة:** `TrendOS_V1932_Private_Recovery_20261016.zip` حجمها **188,929 بايت**، SHA-256 `faaf42e0bb7cee1e9f94d43bb2a611eeb8c2f2dd286152c2951531bdd39f03dd`، تضم الأصل + manifest + 620-node AST hashes + checksums؛ اختبارات ZIP CRC وبصمات كل المكونات **PASS**. ليست منشورة على GitHub؛ **ARCHIVED_VERIFIED_LOCAL** فقط، `OFFSITE_BACKUP_VERIFIED=NO`. وجود ZIP في المحادثة لا يثبت حفظًا مشفرًا مستقلًا أو استعادة بيئة تشغيل.

**المصادر الأخرى:** قُرئت بيانات وشجرات الفروع الافتراضية لثمانية مستودعات؛ لا تُعد المستودعات كلها تاريخ TrendOS القديم، ومقارنة main لم تثبت ملفًا منقولًا جديدًا بتماثل Git blob. من Google Drive عُثر على مجلد `TrendOS V1932 Apps Script Deploy`، ولم تظهر محتويات مفهرسة بالبحث بالأبناء؛ اسم `TrendOS Apps Script Backup Before V1932` لم يظهر بالحساب المتصل. تبقى مصادر `METADATA_ONLY/MISSING` لا إعلان فقد نهائي.

**الحالة:** `SOURCE_ONLY=YES`، `TESTED=NO` للكود، `PRODUCTION_VERIFIED=NO`، `OFFSITE=BLOCKED`. المطلوب قبل أي حذف: AST ومراجع الاستدعاء ونسخة النشر الفعلي، تاريخ أول/آخر استعمال، أرشيف مستقل واختبار استعادة، قائمة دقيقة وموافقة المالك.

### 9.1. تدقيق محتوى أول 9 أزواج

فُتح كود ملفات الجذر التسعة المتطابقة مع مرايا autonomous-printshop وفُحصت تعريفات الدوال ووجود أسماء API. مجموع تعريفات الدوال **192**. سجل [جدول المصدر التفصيلي](LEGACY_FIRST_MIRROR_PAIR_PROVENANCE_20261016.md) كل Git blob SHA وآخر Commit مسّ مسار الملف؛ هذا ليس تاريخ الإنشاء المثبت ولا آخر استخدام. الوظائف المستنتجة: الصحة والرقابة، النشر، تواصل العملاء وWhatsApp، المكبس، المواد ومهام العاملين. التصنيف مؤقت: SHARED_DEPENDENCY_KEEP / UNKNOWN_NEEDS_PROOF لحين تحقق عضوية النشر والتبعيات. ارتفع إجمالي الملفات المقروء نصها فعلًا من 15 إلى **24** ملفًا. اسم score ظهر بموضعين داخل تعريفات مختلفة ومتداخلة ظاهريًا؛ لا دليل بعد على تعارض نطاق عام.

## 10. تحقق ملكية ملفات المطبعة الذاتية وحسم حدود الدوال — 16 أكتوبر 2026

بدأ هذا التدقيق من HEAD `d89d249a8a544f56c9db1887294eec0ace0621db` بعد تحديثين من إيجنتات أخرى؛ الفرع الاحتياطي ما زال عند `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`.

فُحصت `autonomous-printshop/manifests/SOURCE_REGISTRY_V1.json` و`BUILD_MATRIX_V1.json` وكتاب المطبعة الذاتية. جميع أزواج الـ`.gs` التسعة المتطابقة **مسجلة بالاسم وبصمة Git والمسار المركزي** ضمن مصادر TrendOS للمطبعة الذاتية؛ فهي مراجع منظَّمة وليست ملفات زائدة مثبتة. سجل المصدر يحافظ على upstream لحين اكتمال D1 cutover، ونسخ المصدر داخل المطبعة `REFERENCE_ONLY_NOT_RUNTIME_AUTHORITY`، أي حفظ مرجعي وليس نشرًا مثبتًا. يغطي BUILD_MATRIX ثمانية أزواج (3 مسارات صريحة و5 عبر أقسام)، بينما Operator Task موجود في Registry ولكن بلا مسار مطابق في Matrix؛ لا يثبت ذلك عدم استخدامه.

أعيد فحص دالتي `trendosPortalRedirectV1931_` و`attFindToday_` بناء على نطاق الأسطر المحدد عبر TypeScript AST الخاص بالنسخة الأصلية؛ تطابقت كل منهما بايتًا نصيًا مع نطاقها الحالي (827 و447 حرفًا). الحالة الصحيحة الآن: **602 دالة متطابقة، 12 مختلفة، 0 غير محسومة، 0 أسماء قديمة مفقودة** من 614 تعريفًا بالمسح النصي. هذا ليس اختبارًا للإنتاج ولا مقارنة AST مستقلة لكامل الفرع الجديد.

نتيجة تدقيق 15 ملفًا مختارًا للروابط: 10 Core/Worker، 3 اختبارات، 2 manifest؛ لم يُعثر على ذكر حرفي لأسماء `.gs` التسعة في 13 ملف كود/اختبار مختار، لكن Registry ذكر التسعة وBuild Matrix حمل 3 مراجع مباشرة و5 مراجع مجلدات. البحث انتقائي لا يثبت عدم وجود استدعاء أو عدم النشر.

[تقرير الملكية والاحتفاظ بالتفصيل](LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md). قرار الأرشفة الحالي: الاحتفاظ بجذور الملفات التسعة وبنسخها المرجعية، `SHARED_DEPENDENCY_KEEP` للجذور أثناء التحقق التشغيلي، و`SEPARATE_PROJECT_REFERENCE` للنسخ داخل `autonomous-printshop`. **0 ملفات صالحة للحذف، 0 حذف، 0 دمج، 0 نشر**. الخطوة التالية ربط عضوية نشر Apps Script الفعلية ومرجعيات البناء والاستدعاء بتاريخ الاستبدال، وبعدها الأرشيف المستقل واختبار الاستعادة وموافقة المالك.

### 10.1. سجل الأصول التاريخية للدوال الاثنتي عشرة

أُعيد استعراض تاريخ ملف `Code.gs` على فرع الكتاب؛ أعاد GitHub **12 Commit** لتاريخ هذا المسار، ثم جرى جلب **12/12 نسخة كود كاملة** ومقارنة نص الدوال الاثنتي عشرة عبر الإصدارات المتتالية. [السجل التاريخي المفصل](LEGACY_V1932_CODEGS_COMMIT_LINEAGE_20261016.md). أقدم نسخة ملف ظهرت في السجل المفحوص بتاريخ 11 أغسطس 2026، لا يعني ذلك تاريخ إنشاء النظام نفسه. آخر تعديل للمسار كان 1 أكتوبر 2026، وبصمة الملف `e91d78dcceeeca2804e721d58e065a6a7181bfc2` مطابقة لنسخة فرع الكتاب التي فُحصت.

من الوقائع المهمة للتصنيف: 24 أغسطس تحديثات الحسابات والأوردرات، 4 سبتمبر مسار Cloud Write Dry-Run في `doGet`، 28 سبتمبر منع تخصيص أرقام أوردرات Google القديمة، 29 سبتمبر حراسة تفويض Legacy Bridge، و1 أكتوبر معالجة توكن الموظف. كل ذلك تاريخ مصدر مؤكد النص وليس إثبات تشغيل؛ النسخة الأصلية الخاصة يجب حفظها **لا استبدال حواجز الأمان الأحدث بها**. قرارات الدوال الاثنتي عشرة `ACTIVE_KEEP/SHARED_DEPENDENCY_KEEP` حتى مراجعة العملاء والاستدعاءات ونشر Apps Script الفعلي.

## 11. الربط بالكتالوج الرسمي الجديد — 2026-10-16

**الكتاب المعتمد لفهم الوضع الحالي:** [`TRENDOS_CURRENT_SYSTEM_CATALOG.md`](TRENDOS_CURRENT_SYSTEM_CATALOG.md) (مُعتمد تنظيميًا و`PARTIALLY_VERIFIED` تقنيًا)، ومعه الكتاب الرئيسي [`TrendOS_MASTER_BOOK.md`](../../../TrendOS_MASTER_BOOK.md) لتاريخ التطوير. هذا الكتاب يحتفظ **فقط** بتاريخ الأكواد السابقة والانقسامات وأدلة البصمات. لا يحل محل كتالوج الوظائف الحالية، ولا يمنح صلاحية نقل كود أو حذفه. تم اعتماد مسارات الثلاثة كتب في [`CATALOG_AUTHORITY_MANIFEST_V1.json`](CATALOG_AUTHORITY_MANIFEST_V1.json).
<!-- END_VERBATIM_ARCHIVE:LEGACY_PRE_SPLIT_BOOK -->

---

## الملحق التاريخي ج — غلاف وتعليمات المسودة الأولى (المتن موجود أصلاً بالفصول 1–31)

> نص الفصول الأصلية 1–31 موجود **بنفس أحرفه كاملة** من `# فهرس الأبواب` إلى نهاية الفصل 31 داخل هذا الكتاب. الجزء الفريد من المسودة القديمة الوحيد قبل الفهرس هو هذا الغلاف التاريخي؛ ننقله هنا كي لا يسقط شيء قبل حذف ملف المسودة.
> Source blob `acded3ba6729eb7f0a5fd8de560ae5091d630b88`; [نسخة المسودة على فرع الأرشيف](https://github.com/fawakhry/TrendOs/blob/archive/trendos-books-before-single-book-20261016/docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md).

<!-- BEGIN_VERBATIM_ARCHIVE:DRAFT_INTRO source=acded3ba6729eb7f0a5fd8de560ae5091d630b88 -->
# ترند مول | TrendOS


> **مرجع الأرشيف الجديد — 2026-10-16:** طلب المالك الآن جمع **النظام الأصلي قبل التقسيم**، بما في ذلك الأكواد القديمة/المتوقفة والمصادر الخارجية. الكتاب المنفصل [`TRENDOS_LEGACY_PRE_SPLIT_BOOK.md`](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) هو سجل الأرشيف التاريخي الجديد، ومعه [سجل مصادر الكود](LEGACY_SOURCE_RECOVERY_REGISTER.md) و[خطة التنظيف](GITHUB_LEGACY_CLEANUP_PLAN.md). **الفصول 1–31 أدناه محفوظة كما كُتبت** عن الحالة الحالية/المرصودة، ولا تُغيَّر أحكام `SOURCE_ONLY` إلى `LIVE` ولا تُحذف نسخ قديمة بسبب تبدل نطاق الكتاب.

## الكتالوج الفني الكامل للنظام الحالي
### Current System Technical Catalog — Working Edition

**تاريخ اللقطة الأولى:** 14 أكتوبر 2026  
**المستودع:** `fawakhry/TrendOs`  
**فرع إعداد الكتاب:** `agent/trendos-book-audit-v1-20261014`  
**آخر شجرة جرد مثبتة عند بدء الكتاب:** `bd39647598ec33853181dea8632064d5586404ca`  
**حالة النسخة:** `DRAFT / PARTIALLY VERIFIED` — **ليس كتالوجًا مكتملًا ولا اعتمادًا للإنتاج.**

> **هدف الكتالوج:** وصف الحالة التشغيلية **الحالية فقط**: ماذا يفعل النظام، مكان كل زر وكود وملف وبيانات واختبار وعطل وطريقة إصلاح. لا يحتوي سردًا تاريخيًا عن مراحل الانتقال أو الأجزاء التي أُغلقت. أي كود انتقالي **لا يزال يُستخدم فعليًا** يجب توثيق وظيفته الحالية؛ وأي كود لم تثبت صلته بالحاضر يوضع في فهرس التدقيق خارج متن التشغيل، لا يُحذف من مستودع الإنتاج.
>
> هذا الكتاب يعيد البناء **من الغلاف**؛ يحتفظ `TrendOS_MASTER_BOOK.md` الأصلي بنصه في Git History والفرع الحالي حتى اكتمال المراجعة واعتماد بديله. لا تتبدل سلطة تشغيل بتغيير صياغة وثيقة.

---
<!-- END_VERBATIM_ARCHIVE:DRAFT_INTRO -->

---

## الملحق المرحلي د — نسخة فهرس الكتب الوسيط قبل إلغائه

> `MIGRATION_ONLY / HISTORICAL / SUPERSEDED_BY_OWNER_TWO_BOOK_RULE`. فهرس مرحلي أنشئ قبل أمر المالك الاحدث بالكتابين المؤقتين. تنقل هنا جميع أحرفه لضمان عدم فقد تفاصيل الجرد، **ولا تُنفذ تعليماته القديمة** المخالفة لأمر `OWNER_TRANSITION_TWO_BOOKS_WRITE_GATE_20261016` المسجل في الكتاب القديم. [المصدر المحفوظ](https://github.com/fawakhry/TrendOs/blob/archive/trendos-books-before-single-book-20261016/docs/trendos/book-agent/TRENDOS_BOOKS_SINGLE_INDEX.md).

<!-- BEGIN_TRANSFER_VERBATIM:INTERMEDIATE_SINGLE_INDEX sha=478a58583d0d27c96448199cfe42f765baf76c1d -->
# TrendOS — الباب الواحد للكتب ومنع سقوط المعرفة

> **قرار المالك:** ثلاثة كتب محفوظة، ولكن **باب قراءة واحد** و**جهة تحديث واحدة لوصف المنصة الحالية**. لا يجوز أن تتحول الكتب إلى روايات متعارضة عن حالة الإنتاج.

## من أين يبدأ أي إيجنت؟

| الدور | المرجع | سياسة الكتابة |
|---|---|---|
| **الكتاب الذي يُفتح أولًا دائمًا** | [كتالوج المنصة الحالية — 32 فصلًا](TRENDOS_CURRENT_SYSTEM_CATALOG.md) | وصف الوضع الحالي فقط مع إثبات للوظيفة، ومسارات الكود وبيئة النشر وحالة الاختبار. `PARTIALLY_VERIFIED` حتى استيفاء بوابات الأدلة. |
| سجل التغييرات الهندسية والقرارات | [TrendOS_MASTER_BOOK.md](../../../TrendOS_MASTER_BOOK.md) | الأصل التاريخي لكل Entry والخطط والحوادث؛ لا يُمسح أو يُختصر إلى الكتالوج. لا يسبق أدلة التشغيل الحالية دون تحقق. |
| أرشيف ما قبل تقسيم المشاريع | [TRENDOS_LEGACY_PRE_SPLIT_BOOK.md](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) | مصدر الأكواد الأصلية وخريطة هجرتها؛ لا ينقل وظائف قديمة إلى «LIVE» بالافتراض. |
| المرجع المحفوظ قبل الترقية | [TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md) | `FROZEN / PRESERVED`؛ ممنوع تحديثه بالتوازي أو حذفه لمجرد وجود الكتاب الرسمي. |

**مبدأ واحد:** نكتب الوظيفة الحالية في الكتالوج فقط؛ نربط قرارها وإصدارها بسجل التطوير، ونربط أصلها القديم بالأرشيف. التفاصيل الأصلية تظل في مصدرها، بدل نسخ عدة نسخ قابلة للتعارض.

## ماذا أثبت الفحص الآن؟

- قرأت الملفات الثلاثة من GitHub على SHA مصدر ثابت. `TrendOS_CURRENT_SYSTEM_CATALOG_DRAFT.md` يحمل **31** فصلًا، والكتالوج الرسمي يحمل **32**.
- متن الـ31 فصلًا الأصلية **متطابق نصيًا حرفًا بحرف** بين المسودة والكتالوج الحالي في النطاق المشترك البالغ **213,981 حرفًا** (من «فهرس الأبواب» حتى آخر الفصل 31)، والفصل 32 أضيف منفصلًا. هذه **شهادة عدم فقد أثناء النقل**، لا ضمان اكتمال المعرفة عن كل النظام.
- `TrendOS_MASTER_BOOK.md` يحتوي **165 عنوان قسم/فرع** و**66 رقم Entry مميزًا** ظهر في المتن (منها 58 له عنوان Entry مباشر و8 مذكورة في السياق دون عنوان Entry مطابق). رقم واحد من الـ66 ظاهر حرفيًا في الكتالوج؛ **65 لا يظهر رقمها نصيًا**. عدم ظهور رقم Entry لا يساوي ضياع وظيفته أو وجوب نسخه حرفيًا، لكنه يعني أن **66/66 Entry لم تُحسم خريطتها إلى الكتالوج بعد**.
- الكتاب القديم محفوظ بشكل منفصل وبه **14 عنوانًا** في لقطة الفحص؛ لم يُنقل محتواه إلى كتاب الحاضر تلقائيًا. حفظ أصول V1932 الخاصة والتاريخ والـGit branches شرط قائم.
- الجرد الآلي الكامل في [BOOKS_NO_LOSS_CROSSWALK_V1.json](BOOKS_NO_LOSS_CROSSWALK_V1.json): **66 سجل Entry مع السطر والـSHA والنوع والحالة `OPEN` + 165 عنوان قسم مع رقم السطر + فصول الكتالوج الـ32**. لا شيء في الجدول يُعتبر «مطابق/حالي/مُستغنى عنه» دون فحص موضوعي.

## بوابة منع ضياع أو تكرار أي معلومة

1. **اقرأ باب الكتب هذا، ثم الكتالوج الرسمي، ثم سجل التطوير في موضع القضية، والأرشيف عند ارتباطها بالماضي.** لا تبدأ من ثلاثة كتب مرة واحدة وتعدّلها بلا عقد ملكية.
2. **قبل أي اختصار أو حذف أو نقل:** تحقق من `source_path`, `source_sha`, `destination_path`, `owner`, `function`, `consumer`, `current_runtime_status`, `test_evidence`, `reason`, `reviewed_at`. إن فقد حقلًا جوهريًا فالحالة `OPEN/BLOCKED` وليس `DONE`.
3. **كل Entry من الـ66 يمر بمصالحة إلزامية:** إما `CURRENT_FUNCTION_LINKED` إلى فصل الكتالوج بالـSHA والحالة الصحيحة، أو `HISTORICAL_ONLY_WITH_EVIDENCE` ويبقى في MASTER، أو `SEPARATE_PROJECT_OWNERSHIP_VERIFIED` وبرابط كتابه، أو `UNKNOWN_KEEP`. لا نمحو أصل النص.
4. **أضف أي وظيفة جديدة إلى الكتالوج الرسمي، لا إلى المسودة.** عند تعديل سلطة قرار أو نسخة أضف التاريخ في MASTER إذا سمحت صلاحية الكتاب وتحققت من الحالة الحالية؛ لا تحوّل وصف Master التاريخي إلى معيار تشغيل بمجرد أنه أحدث.
5. **قبل اعتبار مشكلة قديمة قائمة:** تحقق من آخر مصدر/PR والاختبارات والـdeployed SHA؛ لا تكرر Issue ID أو تعيد إصلاحًا موجودًا. سجل `SOURCE_ONLY` و`TESTED` و`PRODUCTION_VERIFIED` كلًا على حدة.
6. **أوقف إعلان الاكتمال** إذا بقيت Entries `OPEN` أو ملفات/أزرار/كاتب بيانات أو اختبارات دون خريطة واضحة. `NO_DELETE / NO_FORCE_PUSH / NO_MERGE / NO_DEPLOY` أثناء التدقيق.

## أولويات المصالحة التالية

- `MASTER_ENTRIES_OPEN=66`، `ENTRIES_EXPLICITLY_MENTIONED_IN_CATALOG=1` (لكن وجود ذكر واحد **لا يغلق المطابقة**)؛ راجع أولًا الحواجز الأمنية ومصادر الأوردرات والحسابات وواجهة الموظف وخدمات الملفات، ثم باقي الوحدات وفق خطورة أثرها على العمل.
- `MASTER_SECTION_HEADINGS_TO_REVIEW=165`؛ أي أقسام بلا Entry مباشر تظل محتفظة بمكانها ورقم سطرها في الجرد. `LEGACY_HISTORY_STATUS=NOT_FULLY_AUDITED`.
- هذه البوابة تنظيمية: لا تؤكد أن كل ملفات المستودع والـUI الديناميكي والـApps Script والـD1 وUbuntu تمت مراجعتها أو تتطابق مع الإنتاج.

## المراجع المثبتة في لحظة الجرد

- [MASTER_BOOK @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md) — Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
- [كتالوج الحاضر @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG.md) — Git blob `53ae4194011e8c28b12d468d0ed02754a1d03448`.
- [كتاب الأصل القديم @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/docs/trendos/book-agent/TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) — Git blob `04500f9503f25d49aada9f90b432cd6a6700adb7`.
- **اسم فرع الكتاب:** `agent/trendos-book-audit-v1-20261014`. هذا **اعتماد توثيق في فرع العمل فقط**؛ ليس دمجًا إلى `main` أو شهادة Live. [عقد الكتب للبرامج](CATALOG_AUTHORITY_MANIFEST_V1.json).

## مقتطف مباشر من جرد الـ66 Entry (الجدول الكامل داخل JSON)

| Entry ID | دليل الاسم/النص في MASTER | هل الرقم مذكور في الكتالوج؟ | حالة المصالحة |
|---:|---|---|---|
| 498 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L2931) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 533 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6647) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 595 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L3032) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 596 | [عنوان مستقل (س71)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L71) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 597 | [عنوان مستقل (س85)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L85) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 628 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6371) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 630 | [عنوان مستقل (س4736)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4736) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 631 | [عنوان مستقل (س4778)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4775) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 632 | [عنوان مستقل (س4826)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4823) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 633 | [عنوان مستقل (س4885)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4885) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 634 | [عنوان مستقل (س4922)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4919) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 635 | [عنوان مستقل (س4975)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4972) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 652 | [عنوان مستقل (س6671)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6671) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 653 | [عنوان مستقل (س6760)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6760) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 654 | [عنوان مستقل (س6771)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6771) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 655 | [عنوان مستقل (س6788)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6788) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 656 | [عنوان مستقل (س6799)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6799) | نعم، مجرد ذكر | OPEN / NOT_RECONCILED |
| 657 | [عنوان مستقل (س6808)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6808) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 658 | [عنوان مستقل (س6819)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6819) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 659 | [عنوان مستقل (س6833)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6833) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |

**التزام صريح:** لا نعتبر أي معلومة قد سقطت لأن رقم Entry لم يظهر؛ هي ما زالت في MASTER كما كانت. لكننا كذلك **لا ندّعي** أنها أُدرجت بالكتالوج قبل إتمام المصالحة. الغرض إبقاء الـ66 عنصرًا بلا نسيان إلى حين التصنيف بالدليل.
<!-- END_TRANSFER_VERBATIM:INTERMEDIATE_SINGLE_INDEX -->

---

## الملحق المرحلي هـ — مخطط الكتاب الوسيط الملغى

> `SOURCE_HISTORY_ONLY / SUPERSEDED`. مخطط سابق كان يتكلم عن ثلاثة كتب ومسودة. **أي قاعدة فيه تتعارض مع أمر التعايش الأحدث (القديم ACTIVE_WRITE والجديد MIGRATION_ONLY) ملغاة**. حفظناه حرفيًا قبل إزالة ملف المخطط حتى لا تضيع معايير التغطية والفهرسة التقنية.

<!-- BEGIN_TRANSFER_VERBATIM:INTERMEDIATE_OUTLINE sha=63cc0ea3622f1bd2a6c0ca5f5fe559b988693023 -->
# TrendOS Current System Catalog — خطة إعادة بناء الكتاب بالكامل من الغلاف


> **تحديث نطاق المالك — 2026-10-16:** هذا المخطط CURRENT_ONLY يحفظ تفاصيل مهمة التوثيق السابقة، **لكن صار تحت مهمة جديدة أعلى أولوية**: أرشفة الكود القديم قبل تقسيم المشاريع، بما في ذلك الكود المتوقف والمنقول، والتجميع من المصادر خارج المستودع، والتمهيد لتنظيف GitHub بعد أرشيف متحقق وموافقة المالك. انظر [كتاب النظام القديم](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) و[سجل المصادر](LEGACY_SOURCE_RECOVERY_REGISTER.md) و[خطة التنظيف](GITHUB_LEGACY_CLEANUP_PLAN.md). لا يعتبر باقي هذا المستند تصريحًا لحذف الكود القديم أو رفضه من كتاب الأرشيف؛ `CURRENT_ONLY` يظل صالحًا فقط لفهرس الحالة الحية السابق.

> OWNER SCOPE CHANGE · 2026-10-14 · `CURRENT_ONLY` · Draft PR #132. **هذه الوثيقة تلغي تصميم VNext السابق الذي خصص بابًا لتاريخ Zero-Google أو نقل المنصة.**

## المطلوب النهائي
إنشاء **كتالوج للنظام الحالي فقط**: الغلاف، التعريف، كل شاشة وعنصر وزر ودور، كل handler/API، كل module حي مع أكواده المؤشرة بالمسار وSHA، المخازن والمخططات والكتّاب، الأخطاء وطرق تشخيصها، **وكل اختبار مرتبط بالكود الحالي بما فيه الفشل والمحاولات المكررة والإصلاحات**. كل بند يبيّن هل هو LIVE_VERIFIED أو LIVE_HEALTH_ONLY أو REPO_PRESENT أو SOURCE_ONLY_OFF أو RETIRED_CONFIRMED أو UNKNOWN.

## لا مكان في متن الكتالوج لـ
- يوميات انتقال النظام بين Google وCloudflare، خطوات migrations القديمة التي انتهت بالفعل، ومقارنات الإصدارات التاريخية التي لا تؤثر في وظيفة حالية.
- سجلات PRs/ci لمزايا لم تُوصَل بالإنتاج بوصفها شاشات أو خدمات حية؛ يمكن حفظ الاختبارات المرتبطة بها في **ملحق تدقيق منفصل** لحماية سجل failures دون تلويث متن الوظائف الحالية.
- الكتب والمستودعات المستقلة (EasyStore والبرنامج المستقل للمطبعة). يوثق **تكامل TrendOS معهم فقط** إذا كان حيًا.
- أي ادعاء أن وجود ملف `Google/Apps Script` يعني أنه قديم ويُحذف، أو وجود `Cloudflare/D1` يعني أنه منشور. **الاستخدام الحالي فقط هو المعيار.**
- إزالة تاريخ الـGit أو أرشيف المصدر أو حذف كود/Workflow منشور أثناء عمل التوثيق. المستخدم طلب تنقية **الكتاب الجديد** وليس تغييرات إنتاج غير قابلة للاسترجاع.

## المخرجات
1. `TRENDOS_CURRENT_SYSTEM_CATALOG.md`: **الكتاب الرسمي للتوثيق الحالي**؛ يستقبل الفصول الجديدة بعد إثباتها، ولا يُسوّق كمكتمل. المسودة القديمة محفوظة كمرجع تاريخي.
2. `CURRENT_TREE_BASELINE.md`: كل file path + blob SHA من recursive tree غير مقطوعة، تصنيف أولي يحتاج مراجعة محتوى وحالة runtime.
3. `CURRENT_UI_ELEMENT_INDEX.md`: كل HTML static ID والحقل والزر؛ ثم تضاف UI dynamic events/routes من JS.
4. `CURRENT_TEST_EVIDENCE_LEDGER.md` (عند إنشائه): لكل اختبار مع `expected/actual/fail/pass/run_head_sha/deployment_context`، ومحاولات الفشل بما فيها CI setup issues، وشروط اعتماد exact-current-head.
5. `TEST_EVIDENCE_QUEUE.md`: backlog تدقيق أولي، **ليس** إثباتًا أن أكواد Source-only أصبحت production.
6. `AGENT_LOG.md`: كل خطوة وثائقية مؤكدة وSHA وروابطها بلا ادعاء نجاح قبل إعادة القراءة.

## فهرس الكتاب النهائي
- غلاف + نسخة + نطاق إثبات الحالية
- مستخدمون وأدوار وصلاحيات وauth
- كل شاشة/زر/مدخل/قائمة مع listener واختبار
- مخطط المعمارية **الحالية** وواجهات الـAPI
- كل وحدة تشغيلية: فهرس المصدر، الدوال، dependencies، paths، current ownership
- جميع المخازن والجداول والحقول/المفاتيح، data provenance والكتابة
- سجل اختبارات الوحدة والتكامل والـCI والـruntime: PASS/FAIL/BLOCKED على SHA محدد
- دليل تشخيص الأعطال الحالية والتعافي والrollback
- البيئة والإعدادات والـversion parity والتشغيل
- جدول التغطية الشامل والفجوات الصريحة

## آلية تغطية لا تسقط عنصرًا
1. ابدأ من **آخر HEAD** وفرع الـDraft وتأكد من عدم وجود upstream drift؛ جرد recursive tree `truncated=false`؛ اربطه بكل code/test/workflow/asset.
2. صنّف كل path: `CURRENT_RUNTIME_SOURCE` / `CURRENT_TEST` / `CURRENT_SUPPORT_CONFIG` / `CURRENT_DEPENDENCY` / `SOURCE_ONLY_OFF` / `RETIRED_CONFIRMED` / `EXTERNAL_BOUNDARY` / `UNKNOWN`. **النوع الأول يحتاج إثبات runtime، لا اسم ملف**.
3. اقرأ المصدر المصدَّق ورمزه الكامل عند الحاجة، استخرج declarations/imports/exports/route registrations وUI element listeners، ثم اربط كل وظيفة حية بكامل call graph.
4. لكل اختبار: اقرأ نفسه، فهرس cases وflags والبيئة، اجمع run evidence؛ **احتفظ بالفشل والنجاح كسطرين منفصلين**، ولا تخلط سبب test harness مع فشل المنتج أو outcome unknown.
5. حدث الكتاب **بابًا واحدًا في كل دورة**، واربط كل حكم بمصدر immutable SHA، ثم راجع الفروق وفهرس coverage/agent log.
6. لا تستبدل النسخة الأصلية قبل `NO_UNMAPPED_LIVE_FUNCTIONS` و`NO_UNEXPLAINED_CURRENT_TESTS` و`NO_UNKNOWN_LIVE_WRITERS` و`NO_BROKEN_LINKS` وموافقة صاحب المشروع.

## اختبار قبول جودة الكتاب
- هل يمكن من كل زر الوصول إلى ملف listener وroute وpermission وwriter وtest وerror handling؟
- هل كل ملف حي معلوم owner/function، وكل جدول حي معلوم reader/writer؟
- هل كل Fail مسجل بوقته وسببه المؤكد أو UNKNOWN وباختبار الإصلاح ونسخته؟
- هل كل فقرة تمثل الحالة الحالية فقط، دون سرد «نقلنا من جوجل» بعد إغلاق المهمة؟
- هل لم يُمس الكود التشغيلي أو الملفات الأصلية والأرشيف خلال التوثيق؟

**الحالة اليوم:** تم تثبيت frozen inventory يشمل 1995 ملفًا/75 مجلدًا، واستخرج 479 static HTML ID، وأنشئ غلاف ومسودة الكتاب. هذا لا يمثل فحص المحتوى الكامل أو runtime parity؛ تلك الأعمال `OPEN`.

## 2026-10-16 — Canonical file routing

**تعديل اعتماد المالك:** [`TRENDOS_CURRENT_SYSTEM_CATALOG.md`](TRENDOS_CURRENT_SYSTEM_CATALOG.md) هو الكتاب الحالي الرسمي **للتوثيق**، والنسخة `TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md` تبقى محفوظة (legacy editorial snapshot) ولا تُحدّث بالتوازي. فصول 1–31 نُقلت مع أحكامها، أُضيف بالفعل الفصل 32 في الملف الرسمي؛ والكتابة التالية تبدأ بالفصل 33. لا يُعتبر `CANONICAL_DOCUMENTATION` مساويًا لـ`FULLY_VERIFIED` أو `PRODUCTION_VERIFIED`. [عقد القراءة للكل](CATALOG_AUTHORITY_MANIFEST_V1.json). خطة الإغلاق القديمة تظل سارية: تغطية الملفات والأزرار والقراء/الكُتاب، اختبارات exact SHA، أخطاء مصالَحة، deployed parity، وروابط سليمة وموافقة المالك.

### سجل منع سقوط المعرفة بين الكتب — 2026-10-16

مرجع انطلاق كل إيجنت هو [`TRENDOS_BOOKS_SINGLE_INDEX.md`](TRENDOS_BOOKS_SINGLE_INDEX.md). يحفظ [`BOOKS_NO_LOSS_CROSSWALK_V1.json`](BOOKS_NO_LOSS_CROSSWALK_V1.json) جميع 66 رقم Entry المكتشفة في `TrendOS_MASTER_BOOK.md` و165 عنوان قسم، وتظل جميعها `OPEN` للمطابقة مع 32 فصلًا حاليًا. تمت مقارنة متن الفصول الـ31 القديمة بدقة `EXACT_TEXT_MATCH` للنطاق المشترك بطول 213981 حرفًا، لكن لم تثبت تغطية Master كاملة. لا تسقط أي وظيفة أو قرار دون حسم CURRENT / HISTORICAL / SEPARATE PROJECT بدليل ثابت.
<!-- END_TRANSFER_VERBATIM:INTERMEDIATE_OUTLINE -->

---

## الملحق التاريخي و — ترحيل نقطة تنظيف الكتاب في 2 أكتوبر 2026

> **التصنيف:** `HISTORICAL` — سجل قرار تنظيف توثيقي قديم، **وليس** إثباتًا لحالة Production الحالية.  
> **مهمة النقل:** `TRENDOS-TWO-BOOKS-CONTINUATION-AND-SAFE-MIGRATION-20261016`.  
> **المصدر الأصلي:** [TrendOS_MASTER_BOOK.md عند نقطة البداية](https://github.com/fawakhry/TrendOs/blob/e42a9978fd361284d6887b069449272528d7430d/TrendOS_MASTER_BOOK.md)، Git blob SHA `e7a55dadda6d736ae50bca0fcc4b8013503f8fd5`، قسم `## 10. Cleaning checkpoint — 2026-10-02` (الأسطر 3113–3122 في snapshot البداية).  
> **الأرشيف المستقل للاسترجاع:** [فرع الأرشيف الثابت](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob SHA `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.  
> **قرار التاريخ:** 2026-10-02؛ **تاريخ إجراء الترحيل:** 2026-10-16.  
> **سلامة النقل:** النص التالي منقول حرفيًا من نطاق القسم في Git؛ عند الإزالة من الكتاب القديم يبقى نصه الكامل هنا وفي الأرشيف، ولا يُستخدم في اتخاذ حكم Runtime آني.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_CLEANING_CHECKPOINT_20261002 -->
## 10. Cleaning checkpoint — 2026-10-02

تم تنظيف الكتاب بناءً على قرار المالك أثناء مشروع النقل Google → Cloud:
- أزيلت من الكتاب الحي التفاصيل المطولة الخاصة بمراحل Google التي انتقلت أو أصبحت historical/superseded.
- لم تُحذف أي dependency Google ما زالت مثبتة كحالة تشغيلية.
- لم يحدث أي Runtime/Cloudflare/D1/Apps Script mutation بسبب هذا التنظيف.
- Git history يحتفظ بالنسخة السابقة كاملة عند blob `9f5af80f436effbd3154751d05032608d657462a`.
- المرجع التفصيلي التاريخي يبقى الصندوق الأسود وتقارير Entries.
- أي Cutover لاحق يجب أن يحذف من قسم dependencies فقط بعد Runtime verification، لا بعد source/CI وحدهما.


<!-- END_VERBATIM_MIGRATION:MASTER_CLEANING_CHECKPOINT_20261002 -->

---

## الملحق التاريخي ز — Entry597 / تأهيل Legacy Line Runtime قبل النشر

> **التصنيف التاريخي:** `HISTORICAL`، مع أدلة `TESTED_EXACT_SHA` المذكورة في النص عند تاريخها **غير المعاد تشغيلها هنا**. هذا توثيق لمرحلة تأهيل المصدر؛ لا يمثل حكمًا جديدًا عن حالة Production الحالية.
> **تاريخ الأصل:** 2026-10-02 (سياق Entry596–600). **تاريخ النقل:** 2026-10-16.
> **المصدر:** [TrendOS_MASTER_BOOK.md عند HEAD الأصل](https://github.com/fawakhry/TrendOs/blob/cce96674fb573788b5d9d8d44d81cca24fbe9675/TrendOS_MASTER_BOOK.md)، Git blob `986761be5262e39961ebe0ed64df0fe70641319e`، قسم `Entry597`.
> **الاسترجاع:** [نسخة الأرشيف غير المعدلة](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **حدود النقل:** نص Entry597 فقط، بدون Entry596 أو Entry598–600، وبدون تكرار هوية أي أوردر أو ملاحظة عميل. النص التالي مطابق حرفيًا للقديم والأرشيف.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY597 -->
### Entry597 — Legacy Line Runtime Overlay مؤهل في Repo فقط
- الاسم العربي للبحث: **إصلاح البند غير موجود / تقفيل الأوردرات القديمة من Cloud / Legacy Line Runtime / تشغيل البنود القديمة على D1**.
- Migration جديدة additive فقط: `cloudflare-d1/migrations/0011_t12_legacy_line_runtime.sql`؛ تنشئ `t12_legacy_line_runtime` + event ledger بدون `DROP/ALTER` وبدون تعديل `sheet_rows`.
- Runtime module: `cloudflare-d1/src/t12-legacy-line-runtime.mjs` يحل هوية Legacy من D1 mirror مع 02CX date-coercion repair، ويحفظ status/notes كـoverlay منفصل قابل للتدقيق.
- API endpoint المؤهل Repo-only: `/v1/t12/orders/line-runtime/legacy-update`.
- مسار القراءة 02CR يطبق Legacy runtime overlay **قبل** active filtering/paging، ثم يدمج Cloud-native rows.
- Frontend source المؤهل Repo-only يوجه `updateLine` ذو Line ID ثابت إلى D1 عند `MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED=true`؛ لا يرجع Apps Script في هذا المسار، مع read-after-write barrier.
- بوابة `تم التسليم` للـLegacy runtime تعيد فحص D1 mirrors للعملاء + قائمة منع التسليم بالمديونية وتفشل مغلقًا إذا gate غير جاهزة أو العميل restricted.
- Entry597 CI run `37020236957`, job `110881395106` = **SUCCESS**:
  - `ENTRY597_T12_LEGACY_LINE_RUNTIME=PASS`
  - `PERF_CF_02CR_OPERATIONAL_CANARY_CONTRACT_PASS`
  - `T12 read overlay isolated PASS`
  - `PERF_CF_02CX_LINE_ID_AND_REFRESH_WRITE_CONSISTENCY_PASS`
  - duplicate-order frontend regression PASS
  - `ENTRY597_STATIC_SAFETY=PASS`
- A61 browser regression بعد تغييرات الواجهة: run `37020203740` = SUCCESS.
- 02CR visibility regression بعد تعديل القراءة: run `37020169082` = SUCCESS.
- Duplicate Guard CI بعد نقل cache tag: run `37020380457` = SUCCESS.
- التشخيص الكامل مؤرشف في: `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_STALE_LEGACY_ORDERS_DIAGNOSIS_ENTRY_596_2026-10-02.md`.
- Entry597 أصبح historical qualification بعد نشر Entry599/600.
- الحالة الحالية: `REPO_QUALIFIED=YES`, `PRODUCTION_FIX_DEPLOYED=YES`, `STALE_15_RECONCILED=YES`.

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY597 -->

---

## الملحق التاريخي ح — Entry598 / فحص ما قبل إصلاح Legacy Orders

> **الحالة:** `HISTORICAL` — قراءة وفحص ما قبل النشر في 2026-10-02؛ قيم «Active» وتوصيات النشر أدناه تعود إلى **لحظة إجراء الفحص فقط**، وقد تلتها إصلاحات Entries599/600. لا تُفسَّر كحالة منشورة حاليًا.
> **إثبات التنفيذ الوارد في المصدر:** `SOURCE_RECORDED_HISTORICAL_RUN`؛ لم نكرر اختبار Cloudflare/D1 هنا.
> **مصدر النقل:** [الكتاب القديم عند 0bd4a36e3986](https://github.com/fawakhry/TrendOs/blob/0bd4a36e39869ea5b6fa4bf6513e659d70f7c187/TrendOS_MASTER_BOOK.md)، blob `a56766f63eef4f8d1d11aaa708118c2b4a7309a1`؛ **تاريخ النقل:** 2026-10-16.
> **الاسترجاع:** [Snapshot أرشيف الكتب](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **المجال:** Entry598 كاملًا بدون Entry596 أو Entry599/600، النص أدناه منقول حرفيًا.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY598 -->
### Entry598 — Production preflight لإصلاح الأوردرات القديمة = PASS
- Production preflight Read-only: run `37020759452`, job `110882922276` = **SUCCESS**.
- Active API لم يتحرك: version `23be0ab2-0a2b-4b81-bf54-e2f05f847989`، deployment `b8497ee0-a487-43c8-bcb3-b3f3ab83d3ff`، live SHA-256 `2b78dea01c7e5892460ead4581915da9982208d60a41a95ce903beb742698f67`.
- API target المؤهل للإصلاح يُبنى من source `c491d3ed9b7e87c5d5f7d7ee0a57e02c3e530281`، والـCloudflare API delta عن source الحي = **4 ملفات فقط**: migration 0011 + legacy runtime module + operational runtime handler + 02CR read overlay. Target bundle SHA-256 = `7550c3a82b30acf0f34c52565568df8d7e7d6092ca322b36bbac7726256a0bc6`.
- Active Frontend لم يتحرك: version `a26589a4-e2e0-4ed5-9abf-e1b19b56ce0e`، deployment `21a12f7f-e323-4bc2-bb60-7ef4009d708e` عند 100%؛ Legacy runtime frontend flag **غير منشور** بعد.
- D1 table `t12_legacy_line_runtime` = absent؛ pending migrations = **0011 فقط**.
- stale D1 set ما زال **بالضبط 15**، وmirror timestamp ما زال `2026-09-26 18:33:08`.
- Order Create ما زال `GENERAL` وDuplicate Guard = ready؛ current native runtime health = PASS.
- preflight لم يغير D1/Cloudflare/Frontend/Apps Script/Order Status.
- Production scope المطلوب للإغلاق، إذا صرّح به المالك صراحة: **apply 0011 فقط → deploy API target فقط → reconcile exactly the verified 15 rows to `تم التسليم` داخل legacy runtime overlay → deploy qualified frontend only → read-only postflight**. لا تغيير Order IDs، لا Google write، لا Apps Script v159، ولا business CREATE test.

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY598 -->

---

## الملحق التاريخي ط — فهرس الأرشيف وقواعد منع تضخم الكتاب القديم

> **التصنيف:** `HISTORICAL` / `ARCHIVAL_NAVIGATION`، مع حفظ قواعد التوثيق القديمة كمرجع للقرار؛ أي وصف للكتاب القديم كمرجع الحالة الجارية **ملغى بسياسة التعايش الأحدث في صدر هذا الكتاب**. لا تُغير هذه الإضافة سياسة `FROZEN / MIGRATION_ONLY` ولا تعطي صلاحية ترحيل كتب EasyStore أو المطبعة الذاتية.
> **الأصل:** [TrendOS_MASTER_BOOK.md @ 168b0bec04da](https://github.com/fawakhry/TrendOs/blob/168b0bec04da6910fa9f27860a7348d377ada79d/TrendOS_MASTER_BOOK.md)، Git blob `9243105da4a54a809c20e9cf2e7faaa79bcf4266`، القسمان `§8` و`§8A` والفرع `قواعد منع تضخم الكتاب`.
> **الاسترجاع:** [فرع الأرشيف عند commit b2788ecb](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`. **تاريخ النقل:** 2026-10-16.
> **معيار التحقق:** يجب بقاء الـ2617 حرفًا التالية متطابقة تمامًا مع المصدر والأرشيف قبل حذفها من الكتاب القديم.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ARCHIVE_NAV_POLICY -->
## 8. ما لا يعود جزءًا من القراءة اليومية

تم إخراج التفاصيل التالية من الـActive Book لأنها تاريخية/superseded:
- Entry-by-entry diagnostic narration القديمة.
- T11/T10/02xx/PERF-CF staging history.
- TEST D1 mirror fixture chronology.
- historical Google writer maps التي استُبدلت بمسارات Cloud live.
- Apps Script staging harnesses وrehearsal procedures غير المستخدمة في Production الحالي.
- historical promotion failures التي أعقبها independent Production PASS.
- inventory/full-read batches والـmetadata-only coverage.

للتدقيق أو rollback archaeology: استخدم Git history و`docs/trendos/blackbox/منصة ترند/` والـEntry reports بدل إعادة تضخيم هذا الكتاب.

## 8A. فهرس الأرشيف — أين توجد التفاصيل التي خرجت من الكتاب الحي

> **قاعدة الأرشفة:** الكتاب الرئيسي هو مرجع الحالة الحية والتشغيل والصيانة والخارطة الحالية. لا نعيد إليه السرد التاريخي المطول بعد إغلاق الموضوع. الأرشيف يحفظ التاريخ والدليل، والكتاب يشير إليه فقط.

| ما الذي تبحث عنه؟ | المرجع الأساسي |
|---|---|
| التحقيقات، الأدلة، تفاصيل الأعطال والـEntries القديمة | `docs/trendos/blackbox/` |
| سجل التنفيذ التاريخي المتسلسل | `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` |
| قرارات المشروع ولماذا اتُخذت | `docs/trendos/TRENDOS_DECISIONS.md` |
| حالة وتسليم العمل بين الجلسات/المطورين | `docs/trendos/TRENDOS_HANDOFF.md` |
| ذاكرة المشروع التاريخية | `docs/trendos/TRENDOS_PROJECT_MEMORY.md` |
| سجلات العمل القديمة | `docs/trendos/TRENDOS_WORKLOG.md` |
| نقاط التحقق المحفوظة | `docs/trendos/checkpoints/` |
| جرد وتحليلات المكونات القديمة | `docs/trendos/inventory/` |
| تفاصيل التنفيذ الفنية | `docs/trendos/implementation/` |
| مواد وتجارب الـstaging التاريخية | `docs/trendos/staging/` |
| مواد الكتاب القديمة/المجزأة | `docs/trendos/master-book/` |
| تاريخ الحسابات التفصيلي | `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` و`docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md` |
| خارطة المنتج الأصلية حتى 01/03/2027 | `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md` |
| أي نسخة أو معلومة أزيلت من الملفات الحالية | Git history، مع baseline قبل تنظيف 2026-10-02 عند blob `9f5af80f436effbd3154751d05032608d657462a` |

### قواعد منع تضخم الكتاب
1. لا يُنقل السرد التاريخي من الأرشيف إلى الكتاب الرئيسي لمجرد أنه مفيد للتدقيق؛ يوضع مرجع له فقط.
2. النتيجة التشغيلية الحالية تبقى في الكتاب؛ خطوات الوصول القديمة إليها تذهب للأرشيف.
3. إذا عاد موضوع مؤرشف ليصبح dependency حية، يُعاد **ملخص حالته الحالية فقط** إلى الكتاب، لا تاريخه كاملًا.
4. أي موضوع يُؤرشف مستقبلًا يجب أن يترك في الكتاب: اسم الموضوع، النتيجة النهائية، مكان الأرشيف، وآخر دليل موثوق.
5. الأرشيف لا يعلو على Runtime الحالي عند التعارض؛ ترتيب الدليل في مقدمة الكتاب يظل الحاكم.

<!-- END_VERBATIM_MIGRATION:MASTER_ARCHIVE_NAV_POLICY -->

---

## الملحق التاريخي ي — سجل حالات الإصدار عند Entry595 (نسخة 2026-10-02)

> **التصنيف:** `HISTORICAL`، و`RECORDED_STATE_AT_ENTRY595` فقط. قيم `FRONTEND_ACTIVE_VERSION` و`API_ACTIVE_VERSION` و`EMPLOYEE_LOGIN` و`CUSTOMER_MASTER_ROWS` أدناه ليست حكمًا على الحالة الحية الآن. كل الادعاءات داخل كتلة INI تاريخية. لا تُستخدم لدفع نشر أو لاستنتاج صفر Google.
> **المصدر:** [TrendOS_MASTER_BOOK.md @ e18818a007ec](https://github.com/fawakhry/TrendOs/blob/e18818a007ec2f59ac29799b6c7cbff040fb6511/TrendOS_MASTER_BOOK.md)، Git blob `220a246698aec558da8d2066af4fdf107677bbd8`. **تاريخ الترحيل:** 2026-10-16.
> **الاسترجاع:** [أرشيف ما قبل التوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **سلامة البيانات:** النص التالي بالكامل 508 أحرف مطابق حرفيًا لقسم §9 في الكتاب القديم والأرشيف، دون إدخال بيانات عميل فردية.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY595_BASELINE_BLOCK -->
## 9. آخر Evidence يجب حمله لأي شات جديد

```ini
MASTER_BOOK_BASELINE=ENTRY595
FRONTEND=CLOUDFLARE
FRONTEND_ACTIVE_VERSION=a26589a4-e2e0-4ed5-9abf-e1b19b56ce0e
FRONTEND_VERIFY_RUN=36915414626
API=CLOUDFLARE_WORKER
API_ACTIVE_VERSION=23be0ab2-0a2b-4b81-bf54-e2f05f847989
DATABASE=D1
ORDER_CREATE_MODE=GENERAL
DUPLICATE_GUARD_READY=YES
CUSTOMER_WRITE_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
EMPLOYEE_LOGIN=GOOGLE_BACKED
APPS_SCRIPT_VERSION=159
ZERO_GOOGLE_COMPLETE=NO
NEXT_PROGRAM=CONTINUE_ZERO_GOOGLE_PLAN
```

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY595_BASELINE_BLOCK -->

---

## الملحق التاريخي ك — Entries601/602 / تشخيص بطء تسجيل دخول الموظفين

> **التصنيف:** `HISTORICAL` / `SOURCE_RECORDED_READONLY_DIAGNOSIS`؛ أرقام التأخير وحقول التفعيل أدناه تخص وقت Entry601/602 فقط، **وليست قياسًا جديدًا أو إثباتًا لحالة الإنتاج الحالية**. لاحقًا تغير مسار Native Auth؛ تُقرأ الحالة الأحدث من أدلة وقتها.
> **المصدر المباشر:** [TrendOS_MASTER_BOOK.md @ 1bd666beb6c9](https://github.com/fawakhry/TrendOs/blob/1bd666beb6c9cdd38e81aebb03f55225bbafe4f2/TrendOS_MASTER_BOOK.md)، Git blob `8daeaaeb7d490d1c7df1fc684449a1f616bc05ef`، كتلة Entry601/602 كاملة.
> **الأرشيف المحفوظ:** [لقطة ما قبل توحيد الكتب](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`. **الترحيل:** 2026-10-16.
> **حدود النقل:** جزء محدد مستقل لا يحتوي معرّفات أو ملاحظات أوردرات فردية؛ النص التالي محفوظ حرفيًا، وممنوع استعمال أوامر التاريخ كتعليمات لإجراء Production mutation الآن.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY601_602 -->
### Entry601/602 — بطء واجهة/تسجيل دخول الموظفين — Root cause confirmed
- الاسم العربي للبحث: **الدخول بطيء / واجهة الدخول بطيئة / تسجيل دخول الموظف بطيء / Apps Script login latency / Employee Auth**.
- Entry601 read-only latency diagnosis:
  - Static root ≈ `0.15s`.
  - `config.js` ≈ `0.14s`.
  - `app.js` حجمه ≈ `580731 bytes` ووصل ≈ `0.22s` في القياس.
  - direct Cloud API health ≈ `0.36–0.45s`.
  - legacy empty Login عبر `/v1/legacy-api` وصل Apps Script ثم رجع في محاولة ≈ `1.90s`.
  - محاولة تالية علقت ≈ `28.53s` وانتهت `502 LEGACY_UPSTREAM_UNAVAILABLE`.
- هذا القياس الفارغ لا ينفذ password hash ولا session write؛ لذلك يثبت أن جزءًا كبيرًا من البطء موجود في **Cloudflare → Apps Script/Google hop نفسه** قبل منطق الدخول الحقيقي.
- Login الحقيقي أبطأ إضافيًا لأن Apps Script `login_` يعمل:
  1. `findUser_` → فتح/قراءة Users Sheet.
  2. `passwordHashV1922_` → 1200 SHA-256 rounds للحسابات المهاجرة.
  3. كتابة Token.
  4. كتابة Last Login.
  5. `SpreadsheetApp.flush()`.
- Frontend الحالي ما زال:
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
  ```
  لذلك Login authority الحالية Google-backed عبر `/v1/legacy-api`.
- تحميل شاشة الدخول يحمل `app.js` الكبير وconfig يبدأ 18 dynamic modules؛ هذا حمل Frontend ثانوي يمكن تخفيفه، لكنه **ليس** سبب الـ28.5s.
- Entry602 read-only native-auth readiness:
  ```ini
  AUTH_SCHEMA_READY=YES
  AUTH_CONTROL_MODE=OFF
  AUTH_ENV_ENABLED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  NATIVE_AUTH_SESSIONS=0
  LIVE_NATIVE_SESSIONS=0
  PLAINTEXT_STORED=NO
  ```
- لذلك ممنوع مجرد قلب Native Auth إلى ON: لا يوجد مستخدمون مهاجرون حاليًا وسيؤدي ذلك إلى كسر الدخول/الأعمال القديمة.
- الحل الجذري: staged Employee Auth cutover إلى D1 مع enrollment + compatibility bridge/Cloud migration للـlegacy employee actions، ثم تفعيل Native Login بعد إثبات readiness.
- تحسين Frontend وحده (defer non-login modules) مسموح كتحسين مستقل لكنه لا يُعد إغلاقًا لمشكلة Login latency.
- التشخيص فقط: لا Production mutation، لا Auth toggle، لا Google write، لا Apps Script deploy.
- Entry601 runs: `37040400844` و`37040549662`.
- Entry602 run: `37040933704` = SUCCESS.
- الخطوة التالية: **Repo-qualify staged native employee login cutover + login-surface module deferral**، ثم Production preflight قبل أي تفعيل.

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY601_602 -->

---

## الملحق التاريخي ل — Entries603–605 / نشر وتحسين واجهة Login-fast

> **التصنيف:** `HISTORICAL` / `SOURCE_RECORDED_DEPLOYED_VERSION_VERIFIED_AT_EVENT_TIME`. تسلسل Repo qualification وProduction publish وpostflight قديم، مع الإبقاء على نجاح CI وفشل postflight المدمج كما هو دون قلبهما لحكم على Latest Production. لم يُعد تشغيل الاختبارات أو فحص نشر جديد في هذه الدورة.
> **المصدر الكامل:** [TrendOS_MASTER_BOOK.md @ 5aa548e86ede](https://github.com/fawakhry/TrendOs/blob/5aa548e86edef2c7a88b18bc1c7de4b11da2f2c7/TrendOS_MASTER_BOOK.md)، Git blob `95471182cac9c6ead230cf44187875dd65feb937`، قسم `Entry603/604/605`.
> **نسخة الاستعادة:** [الأرشيف السابق للتوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`؛ **تاريخ الترحيل:** 2026-10-16.
> **نطاق النسخ:** النص الأصلي الكامل (1885 حرفًا) دون أي بيانات عميل؛ استنتاجات «LIVE» تخص زمن Entry605 فقط.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY603_605 -->
### Entry603/604/605 — Login-fast Frontend Production = CLOSED PASS
- الهدف: تقليل زمن ظهور/تفاعل واجهة الدخول بدون تغيير Employee Auth authority.
- Entry603 Repo qualification:
  - `tests/frontend_login_fast_surface_entry603.test.mjs` يثبت أن unauthenticated config ينشئ **0 dynamic employee module requests**.
  - بعد session: critical modules = 2 (`trendos-edge-orders-read-v1.js` + resume guard).
  - deferred authenticated modules = 16 بعد 250ms.
  - `bootMain()` يبدأ authenticated loader قبل تحميل Rows، مع بقاء `loadInitialRowsWhenEdgeReady()` fail-closed.
  - Entry603 CI final = run `37042691120` SUCCESS.
  - Duplicate Guard CI = run `37042720774` SUCCESS.
  - Entry597 legacy runtime CI = run `37042779029` SUCCESS.
  - A61 full browser transport regression = run `37042884091` SUCCESS.
- Entry604 Production publish:
  - أول run `37043068818` وقف قبل إنشاء Version بسبب uploader qualification marker قديم؛ **no Production mutation**.
  - run `37043168584`: qualification/pre-guard/package PASS، created version `adfb5056-af23-4d7f-8e12-7de6417dfce2` zero-traffic ثم promote accepted إلى 100%.
  - postflight المدمج وقف بعد promote في static marker phase؛ لم يُعاد deploy.
- Entry605 independent read-only postflight:
  - run `37043542864` = **SUCCESS**.
  - UI version `adfb5056-af23-4d7f-8e12-7de6417dfce2` @100%.
  - UI deployment `a066abb8-4c33-4050-813b-123df4140450`.
  - assets ready on attempt 1، root/config/app/edge HTTP 200.
  - login-fast markers = YES.
  - Native Auth frontend remains OFF.
  - Duplicate Guard UI + Browser Refresh fix preserved.
  - API create/runtime health preserved؛ no API deploy، no D1 mutation، no Apps Script touch.
- الحالة:
```ini
LOGIN_FAST_FRONTEND_LIVE=YES
UNAUTHENTICATED_DYNAMIC_EMPLOYEE_MODULES=0
AUTH_CRITICAL_MODULES_AFTER_SESSION=2
AUTH_DEFERRED_MODULES_AFTER_SESSION=16
EMPLOYEE_NATIVE_AUTH=OFF
APPS_SCRIPT_TOUCHED=NO
```

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY603_605 -->

---

## الملحق التاريخي م — Entry606 / بوابة Native Employee Auth قبل التفعيل

> **الحالة:** `HISTORICAL` / `PRE_CUTOVER_BLOCKER_AT_EVENT_TIME`، وليس وصفًا لأحدث Employee Login Runtime. أسماء متغيرات Bridge المذكورة أدناه ليست قيم أسرار، ويحظر تفعيل أي إعداد من هذا السجل التاريخي دون preflight جديد وتصريح منفصل.
> **المصدر:** [الكتاب القديم عند SHA d3ae3a06817c](https://github.com/fawakhry/TrendOs/blob/d3ae3a06817c5733adc542f0bf8423a684b00653/TrendOS_MASTER_BOOK.md)، blob `fba70f07e46cc3a200d7b75c1d37241718c0754b`، قسم Entry606.
> **الأرشيف:** [Snapshot ثابت قبل التوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`؛ **تاريخ الترحيل:** 2026-10-16.
> **قاعدة عدم الفقد:** النص التالي نُسخ حرفيًا بطول 1444 حرفًا ولا يشير إلى تفعيل Production في دورة النقل.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY606 -->
### Entry606 — Native Employee Auth cutover gate بعد إصلاح سرعة الواجهة
- D1 native auth foundation/schema موجود ومؤهل، لكن Production readiness الحالي:
```ini
AUTH_CONTROL_MODE=OFF
AUTH_ENV_ENABLED=NO
NATIVE_AUTH_USERS=0
NATIVE_READY_USERS=0
NATIVE_AUTH_SESSIONS=0
LEGACY_BRIDGE_ENABLED=NO
LEGACY_BRIDGE_SECRET_CONFIGURED=NO
LEGACY_BRIDGE_ALLOWED_POLICY_COUNT=0
```
- الـA61 source يحتوي staged bootstrap/session-enrollment canaries ويستطيع تحويل أول Login إلى D1 ثم إثبات second login native، لكن التفعيل الدائم يحتاج Employee Legacy Bridge لأن أجزاء الموظفين غير المهاجرة بعد يجب أن تعمل بعد إصدار Native token.
- Apps Script Version159 يحتوي bridge verification code بالفعل، لكنه يعتمد على Script Properties:
  - `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED`
  - `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`
- لا يوجد في المستودع `clasp` أو Apps Script API credential/deploy path أو authorized maintenance endpoint لضبط هاتين الخاصيتين بأمان. لذلك **لا يتم تفعيل Native Auth/Frontend flag الآن**؛ هذا fail-closed وليس نقصًا في D1.
- لا يجوز استخدام secret مكشوف في repo أو إعادة استخدام migration secret كبديل.
- الخطوة التالية الوحيدة لإكمال Zero-Google login: ضبط bridge property/secret في Apps Script بطريقة آمنة ومصرح بها، ثم Cloudflare bridge secret/policies، ثم TRANSITIONAL bootstrap، ثم frontend native flag، ثم postflight/canary. إلى أن يحدث ذلك يظل login الفعلي Google-backed وقد يتأثر بزمن Apps Script، رغم أن واجهة الدخول نفسها أصبحت أخف.

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY606 -->

---

## الملحق التاريخي ن — Entry607 / استئناف العمل بعد انقطاع سابق للإنترنت

> **التصنيف:** `HISTORICAL` / `RECOVERY_CHECKPOINT_AT_EVENT_TIME`. هذا السجل من فترة Login-fast وNative Auth القديمة وليس نقطة استئناف صالحة لشغل 2026-10-16 تلقائيًا. أوامر «لا تعِد» و`RESUME_FROM` داخله هي وصف تاريخي؛ يُستأنف العمل الآن بناءً على أحدث HEAD ودليل Runtime مناسب.
> **المصدر الأصلي:** [TrendOS_MASTER_BOOK.md @ ecc399063e95](https://github.com/fawakhry/TrendOs/blob/ecc399063e95843b102b2ce6a0168afafbfe8676/TrendOS_MASTER_BOOK.md)، Git blob `defb99946c3a78ba463957e7c2df9973ddac52be`؛ **تاريخ الترحيل:** 2026-10-16.
> **استعادة مستقلة:** [أرشيف قبل توحيد الكتب](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **سلامة:** نُسخ النص التاريخي بحرفيته دون ادعاء إعادة اختبار أو تغيير Production. الفحص التالي يقارن كامل الـ3175 حرفًا قبل حذف المصدر.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY607 -->
### Entry607 — نقطة استئناف بعد انقطاع النت — Current truth / لا تخمين
- سبب الـEntry: المالك طلب مراجعة ما اكتمل وما بقي بعد انقطاع الاتصال أثناء تنفيذ تحسين Login/Auth.
- Git branch الحالي عند المراجعة: `candidate/t12-full-cloud-cutover-a56-20260929`.
- آخر commit قبل نقطة الاستئناف: `e6b2e6bde6777e5a0dc1c152c82120a90a497510` — `docs: close login-fast frontend and record native auth gate`.
- **ما اكتمل فعلًا قبل الانقطاع:**
  1. تشخيص Login latency Entry601/602.
  2. Login-fast frontend optimization Entry603 qualified.
  3. Login-fast frontend نُشر Production عبر Entry604 ثم أُثبت مستقلًا في Entry605.
  4. Active UI = `adfb5056-af23-4d7f-8e12-7de6417dfce2` @100%.
  5. Active UI deployment = `a066abb8-4c33-4050-813b-123df4140450`.
  6. unauthenticated employee dynamic modules = `0`.
  7. بعد employee session: critical modules = `2` فورًا، deferred modules = `16` بعد 250ms.
  8. Duplicate Guard UI + Browser Refresh recovery + Legacy Line Runtime markers محفوظة.
  9. Entry605 independent postflight run `37043542864` = SUCCESS.
- **لا تعِد Entry604 publish.** run `37043168584` أنشأ/promote النسخة، وEntry605 أثبتها Live. أي failure داخل Entry604 بعد promote superseded بنتيجة Entry605 الناجحة.
- **ما لم يُنفذ قبل الانقطاع: Native Employee Auth cutover.**
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
  AUTH_CONTROL_MODE=OFF
  AUTH_ENV_ENABLED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  NATIVE_AUTH_SESSIONS=0
  LEGACY_BRIDGE_ENABLED=NO
  LEGACY_BRIDGE_SECRET_CONFIGURED=NO
  LEGACY_BRIDGE_ALLOWED_POLICY_COUNT=0
  ```
- السبب في التوقف مقصود Fail-closed: Native login لا يمكن تشغيله مع `NATIVE_AUTH_USERS=0`، والـlegacy employee actions تحتاج Compatibility Bridge بعد إصدار Native token.
- Apps Script Version159 يحتوي كود التحقق من الـbridge لكنه يحتاج Script Properties مشتركة وآمنة:
  - `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED`
  - `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`
- المستودع لا يحتوي حاليًا على `clasp`/Apps Script API credential path/authorized maintenance endpoint يسمح بضبط الـScript Properties بأمان من CI؛ لذلك لم يتم إنشاء secret مكشوف أو قلب flags بشكل عشوائي.
- **المتبقي الحقيقي فقط لمسار Login الجذري:**
  1. توفير/اعتماد طريقة آمنة لضبط Bridge secret + enable property في Apps Script أو نقل legacy employee actions اللازمة إلى Cloud بحيث لا نحتاج bridge.
  2. ضبط Cloudflare bridge secret + allowed policies بنفس السر.
  3. تشغيل TRANSITIONAL bootstrap/enrollment بصورة bounded.
  4. إثبات first-login bootstrap ثم second-login native لمستخدم canary.
  5. بعد readiness: تفعيل Frontend Native Auth flag ثم read-only postflight.
  6. إغلاق Apps Script auth fallback بعد نقل الاعتمادات المطلوبة.
- **الحالة الحالية بعد الانقطاع:**
  ```ini
  LOGIN_FAST_FRONTEND_LIVE=YES
  EMPLOYEE_LOGIN_AUTHORITY=GOOGLE_APPS_SCRIPT
  EMPLOYEE_NATIVE_AUTH=OFF
  EMPLOYEE_NATIVE_AUTH_PRODUCTION_CUTOVER_DONE=NO
  APPS_SCRIPT_VERSION=159
  APPS_SCRIPT_TOUCHED_BY_LOGIN_FAST=NO
  PRODUCTION_MUTATION_IN_ENTRY607=NO
  RESUME_FROM=NATIVE_AUTH_BRIDGE_GATE
  ```
- نقطة الاستئناف الإلزامية لأي شات لاحق: **لا تعيد تشخيص Login-fast ولا تعيد Frontend publish؛ ابدأ من Native Auth Bridge Gate في Entry606/607.**


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY607 -->

---

## الملحق التاريخي س — Entry608 / مراجعة Native Auth بعد انقطاع سابق

> **الحالة:** `HISTORICAL` / `SOURCE_RECORDED_READONLY_AUDIT`. جميع الإصدارات والنتائج والقيم أدناه تخص **اللحظة التاريخية لعمل Entry608**؛ لا تمثل حالة Runtime الحالية، ولا تفويضًا لتفعيل Auth أو ضبط Secrets.
> **طريقة النقل:** ثلاثة مقاطع نصية أصلية متتابعة؛ تلصق محتويات العلامات PART_1 وPART_2 وPART_3 دون تعديل وتُقارن كوحدة واحدة كاملة قبل حذف Entry608 من الكتاب القديم. لا توجد كتب جديدة.
> **المصدر الأصلي:** [الكتاب القديم على 49e962d0737c](https://github.com/fawakhry/TrendOs/blob/49e962d0737cb9997bdc8d60840cb1f052e57a06/TrendOS_MASTER_BOOK.md)، Git blob SHA `9314ba36d5e8387b3f1d996b14154f20cdae2c1a`.
> **الاسترجاع:** [أرشيف ما قبل التوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob SHA `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`. **قرار الترحيل:** 2026-10-16.
> **الخصوصية:** لا تُنقل بيانات عميل فردية أو قيم Secrets؛ أسماء مفاتيح الإعداد في النص التاريخي ليست قيمًا فعلية.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_1 -->
### Entry608 — Native Auth read-only assessment after disconnect
- الاسم العربي للبحث: **استكمال بطء الدخول / Native Auth بعد انقطاع النت / Bridge Gate / مراجعة فعلية بدون إعادة نشر**.
- بدأنا من Entry606/607 كما يفرض الكتاب؛ **لم تتم إعادة Entry603/604/605** ولم يحدث rollback أو frontend re-deploy.
- Git branch وقت المراجعة: `candidate/t12-full-cloud-cutover-a56-20260929`.
- HEAD الفعلي وقت المراجعة: `4216890cff461968e61224bb4a6bc69c4bea9db1` — `docs: audit checkpoints 121 through 135`.
- مقارنة HEAD الحالي مع آخر HEAD المذكور وقت الانقطاع `e6b2e6bde6777e5a0dc1c152c82120a90a497510`: الفرع متقدم **64 commit**، والفرق المرصود في المقارنة وثائقي/كتالوجات فقط؛ لم يظهر تغير Runtime source في هذه المسافة.
- آخر GitHub Actions المؤثر في Production ما زال Entry605: run `37043542864`, job `110959245541` = **SUCCESS**. فشل Entry604 بعد promote لا يُستخدم كحكم نهائي؛ Entry605 supersedes it.
- Live frontend read-only:
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false`.
  - `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false`.
  - `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=[]`.
  - Login-fast module deferral موجود Live.
  - Refresh recovery markers `postWriteBarrierRecoveries` + `recoverPostWriteBarrier` موجودة Live.
  - Duplicate Guard marker وLegacy line route `/v1/t12/orders/line-runtime/legacy-update` محفوظان Live.
- Live Native Auth health:
  ```ini
  AUTH_SCHEMA_READY=YES
  AUTH_CONTROL_MODE=OFF
  AUTH_ENV_ENABLED=NO
  LEGACY_BOOTSTRAP_ENABLED=NO
  LEGACY_SESSION_ENROLL_ENABLED=NO
  NATIVE_ONLY=NO
  ENROLL_CANARY_CONFIGURED=NO
  ENROLL_NONCE_CONFIGURED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  PLAINTEXT_STORED=NO
  ```
- Live Cloudflare Employee Legacy Bridge health:
  ```ini
  LEGACY_BRIDGE_ENABLED=NO
  LEGACY_BRIDGE_UPSTREAM_CONFIGURED=YES
  LEGACY_BRIDGE_SECRET_CONFIGURED=NO
  LEGACY_BRIDGE_ALLOWED_POLICY_COUNT=0
  RAW_NATIVE_TOKEN_FORWARDED=NO
  PLAINTEXT_PASSWORD_FORWARDED=NO
  ```
- Apps Script v159 source contains the compatibility verification path `cloudEmployeeLegacyBridgeExecuteV1` and reads only these Script Properties:
  - `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED`
  - `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`
- **Apps Script property value/secret presence is not safely observable through the current authorized repo/runtime read-only interfaces without either privileged Script Properties access or a mutation/deploy.** لذلك الحكم الحالي fail-closed: `APPS_SCRIPT_BRIDGE_RUNTIME_READY=NOT_PROVEN`. لا نفترض وجود secret لمجرد وجود الكود.
- Employee action inventory من A58/A61، بعد تصحيح `hrV1` و`attendanceClockinV1`: **67 top-level observed runtime actions**.
  - Cloud/Edge employee-routed actions الحالية التي لا يجب إرجاعها إلى Apps Script: `searchCustomers, createCustomer, createManualOrder, getRowsPageV1931, updateLine, markCustomerNotified`.
  - Employee auth control-plane: `login, logout, changePassword, verifyEmployeeSession` -> D1 native auth routes عند التفعيل.
  - Customer-session actions = 9 وتبقى على authority الخاصة بها.
  - Maintenance blocked = `ensureDemoCustomer, initAccounting, recalculateAccountingMaterials`.
  - **46 top-level employee legacy business actions** ستحتاج Compatibility Bridge مباشرةً في dispatcher عند Native mode، ما لم تُنقل إلى Cloud أولًا.
  - Multiplexed bridge actions التي يجب أن تكون policy = `action:op`: `attendanceV1, attendanceClockinV1, cleaningV1, customerFeedbackV1, customerManagerV1, goLiveAutopilotV1, hrV1, pressControlV1`.
  - يوجد fallback إضافي يحتاج bridge عند بعض Legacy الحالات: `updateLine` إذا لم يوجد stable Line ID، و`markCustomerNotified` للـlegacy rows. `getRowsPageV1931` الحالي Cloud read ويفشل مغلقًا بدل legacy read fallback.
- طريقة enrollment الآمنة الموجودة في source لا تستخرج plaintext password من Google/D1:
  1. `/v1/employee/auth/enroll-legacy-session` يعمل فقط في `TRANSITIONAL` ومع enable صريح + canary user + nonce؛ يتحقق من **legacy session token** مع Apps Script ثم يبني PBKDF2 verifier من كلمة المرور التي يدخلها المستخدم وقت enrollment، ولا يخزن plaintext.
  2. login bootstrap البديل يستطيع في TRANSITIONAL التحقق من أول password عبر Apps Script ثم تخزين PBKDF2 فقط؛ لكنه يبقي first-bootstrap login معتمدًا على Google ولذلك ليس النهاية المطلوبة.
- Staged cutover المؤهل تصميميًا، بدون تنفيذ Production الآن:
  ```text
  OFF
    -> bridge secret/config readiness proven on Apps Script + Cloudflare
    -> exact bridge allowlist qualified (read-only pilot first, then required writes)
    -> TRANSITIONAL auth control
    -> bounded legacy-session enrollment/bootstrap canary
    -> first canary enrollment PASS
    -> second canary login D1-native PASS
    -> compatibility actions PASS with native token never sent to Apps Script
    -> frontend native flag controlled enable
    -> read-only postflight
    -> expand employees/policies gradually
    -> NATIVE only after remaining Google employee dependencies are removed
  ```
- Fail-closed blockers الآن:
  1. `NATIVE_AUTH_USERS=0`.
  2. Cloudflare bridge secret absent.
  3. Cloudflare bridge policies empty.
  4. Apps Script bridge property/secret readiness غير مثبت Runtime.
  5. لذلك **Auth ON الآن ممنوع**.
- صورة المالك أثناء المراجعة تتوافق مع Entry605: login surface تظهر وتحمل static assets؛ لا تُستخدم كدليل على نجاح post-click Auth، لكنها تدعم أن مشكلة ما قبل الضغط ليست هي blocker الحالي.
- هذه الجولة حتى هذه النقطة Read-only على Production؛ لم نغيّر D1/Auth/Cloudflare/App Script/Orders/Customers.
- التسجيل:
  ```ini
  STATUS=READONLY_ASSESSMENT_PASS_WITH_BRIDGE_GATE_BLOCK
  RUN_ID=NONE_DIRECT_READONLY
  JOB_ID=NONE_DIRECT_READONLY
  LAST_VERIFIED_ACTION_RUN=37043542864
  LAST_VERIFIED_ACTION_JOB=110959245541
  COMMIT=PENDING_THIS_BOOK_UPDATE
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=CREATE_AND_RUN_DEDICATED_READONLY_ENTRY608_CONTROL_PLANE_CHECK; NO_AUTH_ENABLE
  ```
<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_1 -->

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_2 -->
- Dedicated read-only workflow created in commit `27387a7e02c305fab46a24a0309bee544d31f24d`.
- First assessment run `37120602621`, job `111195790507` = **FAIL before Production checks**.
- Failure cause: historical `tests/employee_legacy_action_classification_a61.test.mjs` still asserts that seven modules contain direct `TREND_API_URL|API_URL`; current source has already rerouted those modules through `trendosEmployeeApiV1`. This is a **stale test expectation**, not a runtime rollback.
- Run1 boundary:
  ```ini
  STATUS=FAIL_STALE_TEST_EXPECTATION
  RUN_ID=37120602621
  JOB_ID=111195790507
  COMMIT=27387a7e02c305fab46a24a0309bee544d31f24d
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=PATCH_READONLY_WORKFLOW_TO_USE_CURRENT_DISPATCHER_INVENTORY_AND_RERUN
  ```
- Read-only workflow patched in commit `21addc5dc449679dba24c68ba8399f5905e74ea4` to test current dispatcher truth instead of the stale direct-URL assertion.
- Run2 `37120688311`, job `111196031173` = **SUCCESS**.
- Run2 verified:
  ```ini
  API_VERSION=ce156662-a698-47fc-b73c-dfd4657be9f5
  API_DEPLOYMENT=477ee04d-10ac-4fc3-9ba6-e81691bcd286
  API_TRAFFIC=100
  UI_VERSION=adfb5056-af23-4d7f-8e12-7de6417dfce2
  UI_DEPLOYMENT=a066abb8-4c33-4050-813b-123df4140450
  UI_TRAFFIC=100
  CF_BRIDGE_SECRET_PRESENT=NO
  AUTH_MODE=OFF
  AUTH_ENV_ENABLED=NO
  AUTH_USERS=0
  NATIVE_READY_USERS=0
  D1_SESSION_COUNT=0
  D1_LIVE_SESSION_COUNT=0
  LEGACY_BOOTSTRAP_ENABLED=NO
  LEGACY_SESSION_ENROLL_ENABLED=NO
  ENROLL_CANARY_CONFIGURED=NO
  ENROLL_NONCE_CONFIGURED=NO
  BRIDGE_ENABLED=NO
  BRIDGE_UPSTREAM_CONFIGURED=YES
  BRIDGE_SECRET_CONFIGURED=NO
  BRIDGE_ALLOWED_POLICY_COUNT=0
  PLAINTEXT_STORED=NO
  RAW_NATIVE_TOKEN_FORWARDED=NO
  PLAINTEXT_PASSWORD_FORWARDED=NO
  ORDER_CREATE_BASELINE=PASS
  LEGACY_LINE_RUNTIME_BASELINE=PASS
  LOGIN_FAST_MARKERS=PASS
  DUPLICATE_GUARD_UI_PRESERVED=YES
  REFRESH_FIX_PRESERVED=YES
  LEGACY_LINE_ROUTE_PRESERVED=YES
  ```
- Apps Script bridge probe in Run2 returned HTTP 302 because the diagnostic curl did not follow the Apps Script redirect, so:
  ```ini
  APPS_SCRIPT_BRIDGE_ENABLED=NOT_PROVEN
  APPS_SCRIPT_BRIDGE_SECRET_PRESENCE=NOT_PROVEN
  ```
  This is a diagnostic limitation, not a runtime failure. The next safe action is a read-only redirect-following probe only.
- Run2 boundary:
  ```ini
  STATUS=READONLY_ASSESSMENT_PASS_APPS_SCRIPT_GATE_NOT_YET_PROVEN
  RUN_ID=37120688311
  JOB_ID=111196031173
  COMMIT=21addc5dc449679dba24c68ba8399f5905e74ea4
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=FOLLOW_APPS_SCRIPT_REDIRECT_READONLY_AND_RECORD_RESULT; NO_AUTH_ENABLE
  ```
<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_2 -->

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_3 -->
- Run3 `37120854362`, job `111196510135` = **SUCCESS** after enabling redirect following.
- All Cloudflare/D1/frontend baseline checks remained PASS and unchanged.
- Apps Script diagnostic returned HTTP `405` because the probe used `curl -L` together with explicit `-X POST`; curl therefore forced POST onto the redirected `script.googleusercontent` content URL instead of following the redirect semantics used by the application fetch. No application request path or Production code changed.
- Run3 boundary:
  ```ini
  STATUS=READONLY_PASS_PROBE_METHOD_STILL_INCONCLUSIVE
  RUN_ID=37120854362
  JOB_ID=111196510135
  COMMIT=f2e29f3d101e3ba9a85acfe2a61ca3c95a4cd94a
  APPS_SCRIPT_PROBE_HTTP=405
  APPS_SCRIPT_BRIDGE_ENABLED=NOT_PROVEN
  APPS_SCRIPT_BRIDGE_SECRET_PRESENCE=NOT_PROVEN
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=REMOVE_FORCED_POST_FROM_READONLY_CURL_REDIRECT_PROBE_AND_RERUN
  ```
- Run4 `37121042270`, job `111197046754` = **SUCCESS** with redirect semantics aligned to the application path.
- Apps Script live probe result:
  ```ini
  APPS_SCRIPT_BRIDGE_PROBE_HTTP=200
  APPS_SCRIPT_BRIDGE_ROUTE_LIVE=YES
  APPS_SCRIPT_BRIDGE_ENABLED=NO
  APPS_SCRIPT_BRIDGE_SECRET_PRESENCE=NOT_OBSERVABLE_WHILE_DISABLED
  APPS_SCRIPT_SECRET_VALUE_LOGGED=NO
  ```
- Independent Cloudflare runtime remains:
  ```ini
  CF_BRIDGE_SECRET_PRESENT=NO
  BRIDGE_ENABLED=NO
  BRIDGE_SECRET_CONFIGURED=NO
  BRIDGE_ALLOWED_POLICY_COUNT=0
  AUTH_MODE=OFF
  D1_USER_COUNT=0
  ```
- Runtime therefore agrees with the safe interpretation of Entries606/607: the compatibility bridge code exists on both sides, but **the Production bridge is not configured/armed**. Native Auth must remain OFF.
- Run4 boundary:
  ```ini
  STATUS=ENTRY608_READONLY_ASSESSMENT_PASS
  RUN_ID=37121042270
  JOB_ID=111197046754
  COMMIT=fc1dc2f17ddcf97e97bc1122ab220e9e3e284027
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=REPO_ONLY_BRIDGE_AND_ENROLLMENT_QUALIFICATION; PRODUCTION_SECRET_CONFIG_OR_AUTH_ENABLE_REQUIRES_EXPLICIT_APPROVAL
  ```
- لا نغيّر Product code بسبب هذا الفشل؛ نعدّل أداة الفحص فقط كي تقيس current truth بدل contract تاريخي superseded.
- Run2 final read-only result:
  - workflow commit: `21addc5dc449679dba24c68ba8399f5905e74ea4`.
  - Run `37120688311`, Job `111196031173` = **SUCCESS**.
  - Active API version/deployment unchanged: `ce156662-a698-47fc-b73c-dfd4657be9f5` / `477ee04d-10ac-4fc3-9ba6-e81691bcd286`, traffic 100%.
  - Active UI version/deployment unchanged: `adfb5056-af23-4d7f-8e12-7de6417dfce2` / `a066abb8-4c33-4050-813b-123df4140450`, traffic 100%.
  - Cloudflare secret-name list read succeeded; `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1` = **ABSENT**. No secret value was printed.
  - Auth health and direct D1 read agree:
    ```ini
    AUTH_MODE=OFF
    AUTH_ENV_ENABLED=NO
    D1_USER_COUNT=0
    D1_NATIVE_READY_COUNT=0
    D1_SESSION_COUNT=0
    D1_LIVE_SESSION_COUNT=0
    LEGACY_BOOTSTRAP_ENABLED=NO
    LEGACY_SESSION_ENROLL_ENABLED=NO
    NATIVE_ONLY=NO
    ENROLL_CANARY_CONFIGURED=NO
    ENROLL_NONCE_CONFIGURED=NO
    PLAINTEXT_STORED=NO
    ```
  - Bridge health:
    ```ini
    BRIDGE_ENABLED=NO
    BRIDGE_UPSTREAM_CONFIGURED=YES
    BRIDGE_SECRET_CONFIGURED=NO
    BRIDGE_ALLOWED_POLICY_COUNT=0
    RAW_NATIVE_TOKEN_FORWARDED=NO
    PLAINTEXT_PASSWORD_FORWARDED=NO
    ```
  - Orders safety baseline preserved: GENERAL create + duplicate guard PASS; legacy line runtime PASS; frontend duplicate guard/refresh recovery/legacy-line route PASS.
  - Apps Script invalid-assertion probe returned HTTP 302 before useful JSON classification, therefore Script Properties secret/enablement remain **NOT_PROVEN** from read-only public runtime. No mutation was attempted to resolve that ambiguity.
  - Owner screenshot during Run2 shows `جارٍ تسجيل الدخول...` after submit; this is consistent with the remaining legacy Auth hop and is not evidence of a frontend static-load regression.
  - Final Run2 boundary:
    ```ini
    STATUS=READONLY_ASSESSMENT_PASS_BRIDGE_GATE_BLOCKED
    RUN_ID=37120688311
    JOB_ID=111196031173
    COMMIT=21addc5dc449679dba24c68ba8399f5905e74ea4
    Production_touched=NO
    D1_touched=NO
    Apps_Script_touched=NO
    Secrets_touched=NO
    Auth_mode_changed=NO
    Order_Customer_data_changed=NO
    NEXT_ACTION=REPO_ONLY_EXACT_BRIDGE_POLICY_AND_ENROLLMENT_CUTOVER_PLAN; PRODUCTION_MUTATION_REQUIRES_EXPLICIT_APPROVAL
    ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY608_PART_3 -->

---

## الملحق التاريخي ع — Entry609 / جرد وظائف Compatibility Bridge أثناء التأهيل

> **التصنيف:** `HISTORICAL` / `SOURCE_RECORDED_REPO_ONLY`. أرقام الوظائف والسياسات والاختبارات أدناه تعكس snapshot هندسيًا قديمًا، ولا تُعد مصدر صلاحية أحدث Native Auth أو تكافؤ Production.
> **المصدر:** [TrendOS_MASTER_BOOK.md عند 1bdba339bc86](https://github.com/fawakhry/TrendOs/blob/1bdba339bc869f2be120b7cd49d068b172511390/TrendOS_MASTER_BOOK.md)، blob `7719c426968b6cc8d5b9403a80ca80223961d3f1`؛ **تاريخ نقل المعلومات:** 2026-10-16.
> **نسخة الاسترجاع المستقلة:** [أرشيف الكتب السابق للتوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **المجال:** قسم Entry609 وحده، دون نقل Entry610 أو أي كتاب مشروع مستقل.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY609 -->
### Entry609 — Native Auth staged cutover inventory / repo-only qualification
- الاسم العربي للبحث: **جرد وظائف الموظفين بعد Native Login / سياسات Compatibility Bridge / خطة الترحيل التدريجي**.
- بدأ بعد Entry608 read-only PASS؛ لا يوجد أي Production mutation في هذه الخطوة.
- Added current-truth inventory test:
  - file: `tests/entry609_native_auth_cutover_inventory.test.mjs`
  - commit: `4ab986949d787186449e2210d96ac73fb33104a6`
- الهدف من الاختبار: تثبيت classification الحالية بدل الاعتماد على A61 historical assertions القديمة التي كانت تتوقع direct `TREND_API_URL/API_URL`.
- Current inventory contract المثبت في test:
  ```ini
  ACTIVE_EMPLOYEE_LEGACY_TOP_LEVEL=46
  TRANSPORT_EMPLOYEE_CANDIDATES=51
  DORMANT_TRANSPORT_ONLY=5
  ACTIVE_OP_POLICIES=29
  FULL_ACTIVE_PARITY_POLICY_COUNT=69
  READONLY_PILOT_POLICY_COUNT=26
  ```
- الـ5 الموجودة في legacy transport لكن ليست top-level active runtime في A58/A61 corrected inventory:
  `getTrendMasterPanelV1931, operatorTaskV2, prepareReadyInvoice, updateRowV1931, workQueueV1`.
- Full active parity = 38 non-op legacy employee actions + 29 exact `action:op` policies + 2 hybrid fallback policies `updateLine` و`markCustomerNotified`.
- Read-only pilot current-truth = 26 policies. تم استبعاد:
  - `getRowsPageV1931` لأنه Cloud/Edge authority وليس bridge policy.
  - `cleaningV1:status` لأنه stale/unsupported؛ backend الحالي لـCleaning يقبل `complete` فقط.
- هذه الخطوة Repository-only:
  ```ini
  STATUS=REPO_ONLY_INVENTORY_ADDED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=4ab986949d787186449e2210d96ac73fb33104a6
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_AND_RUN_ENTRY609_READONLY_CI
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY609 -->

---

## الملحق التاريخي ف — Entry610 / تأهيل Repository-only لسياسات Native Auth

> **التصنيف:** `HISTORICAL` / `TEST_RECORDED_AT_EXACT_HISTORICAL_SHA` / `NOT_NEW_PRODUCTION_PROOF`. نجاحات CI وأعطال طرق الفحص وتطور عدد السياسات أدناه تخص Entry610 وقتها ولم يُعد اختبارها الآن.
> **تصحيح مهم داخل التاريخ:** Entry609 سجل `READONLY_PILOT_POLICY_COUNT=26` في snapshot أولي؛ التدقيق التاريخي اللاحق في Entry610 أعاده إلى **27** بعد تصحيح دعم `cleaningV1:status`. لا تفسّر أيهما كعدد سياسات أحدث Runtime بدون فحص جديد.
> **المصدر الأصلي:** [TrendOS_MASTER_BOOK.md @ b4e9c5702812](https://github.com/fawakhry/TrendOs/blob/b4e9c5702812dfe6219c76fe58a92c22c3dcc727/TrendOS_MASTER_BOOK.md)، blob `2594e6a3d14e20cf2170de4bb4bf87cc2a42ebb2`، النص الكامل Entry610.
> **نسخة الاسترجاع:** [فرع الأرشيف الأصلي](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **تاريخ عملية النقل:** 2026-10-16. لا تغيير للمنتج أو Production.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY610 -->
### Entry610 — Repo-only bridge and enrollment qualification
- الاسم العربي للبحث: **تأهيل Native Auth + Compatibility Bridge بدون لمس Production**.
- نقطة البداية: Entry608 closed read-only with Runtime proving:
  - API/UI expected versions live at 100%.
  - Auth mode OFF.
  - D1 employee users/sessions = 0.
  - Cloudflare bridge OFF, shared secret absent, policies empty.
  - Apps Script bridge route live but bridge flag OFF.
- أول repo-only تصحيح: الاختبار التاريخي `tests/employee_legacy_action_classification_a61.test.mjs` كان يتوقع direct `TREND_API_URL/API_URL` في سبعة employee modules رغم أن current source نقلها بالفعل إلى `trendosEmployeeApiV1`.
- تم تحديث الاختبار ليطلب dispatcher صراحةً ويمنع رجوع direct legacy API aliases في:
  - attendance-clockin-ui-v1.js
  - attendance-live-timer-v1.js
  - employee-cleaning-prep-v1.js
  - customer-manager-v1.js
  - customer-feedback-v1.js
  - go-live-autopilot-v1.js
  - hr-v1.js
  - press-control-v1.js
- Commit: `6ee6c2b97ac8a150396a4024ddb4c14a1cfc8a66`.
- هذا التعديل **test-only**؛ لا Product runtime code تغير.
- التسجيل:
  ```ini
  STATUS=REPO_ONLY_TEST_CONTRACT_UPDATED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=6ee6c2b97ac8a150396a4024ddb4c14a1cfc8a66
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=VERIFY_TRIGGERED_A61_CI_THEN_RUN_FULL_ENTRY610_REPO_ONLY_QUALIFICATION
  ```
- أثناء إضافة workflow مستقل حصل GitHub Contents conflict `409` لأن branch HEAD تحرك من commit آخر بين القراءة والكتابة. GitHub رفض الكتابة قبل commit؛ لا يوجد overwrite ولا Production mutation.
  ```ini
  STATUS=BLOCK_BRANCH_RACE_REBASE_REQUIRED
  RUN_ID=NONE
  JOB_ID=NONE
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=REFRESH_HEAD_AND_CREATE_ENTRY610_READONLY_WORKFLOW
  ```
- Read-only qualification workflow created successfully after refreshing HEAD:
  - file: `.github/workflows/trendos-entry610-native-auth-cutover-readonly.yml`
  - commit: `753c40d3deae83914da579ab65104800048da3d3`
  - it runs current A61 dispatcher contract + Entry609 inventory, follows the Apps Script 302 redirect with POST preserved for boolean-only bridge probing, and rechecks Production flags read-only.
  ```ini
  STATUS=ENTRY610_READONLY_WORKFLOW_CREATED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=753c40d3deae83914da579ab65104800048da3d3
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_ENTRY610_RUN_AND_RECORD_RESULT
  ```
- Entry610 Run1:
  - Run `37121251255`
  - Job `111197645665`
  - conclusion: **SUCCESS**
  - current inventory PASS: 46 active employee legacy top-level actions; 51 server transport candidates; 5 dormant transport-only; 29 active op policies; 69 full active parity policies; 26 current read-only pilot policies.
  - Production baseline still PASS: Auth OFF, Bridge OFF, frontend flags OFF.
  - Apps Script probe with POST preserved across redirect returned HTTP `405`; therefore bridge enable/secret presence remained `NOT_PROVEN`. This is a probe-method limitation, not an Auth/runtime failure.
  - no Product/Production mutation.
  ```ini
  STATUS=ENTRY610_RUN1_PASS_APPS_PROBE_INCONCLUSIVE
  RUN_ID=37121251255
  JOB_ID=111197645665
  COMMIT=753c40d3deae83914da579ab65104800048da3d3
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=FIX_READONLY_REDIRECT_PROBE_METHOD_AND_RERUN
  ```
- Apps Script redirect probe method fixed repo-only:
  - removed forced POST preservation on redirected `script.googleusercontent.com` response;
  - original request remains POST via `--data-binary`, standard 302 follow becomes GET for the generated output URL.
  - commit: `d3fd89a86843eb6aa8a8ec1a815a366c07ffda98`.
  ```ini
  STATUS=ENTRY610_PROBE_METHOD_FIXED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=d3fd89a86843eb6aa8a8ec1a815a366c07ffda98
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_ENTRY610_RUN2
  ```
- Entry610 Run2 after fixing redirect semantics:
  - Run `37121323955`
  - Job `111197852535`
  - conclusion: **SUCCESS**
  - Apps Script probe: HTTP 200, bridge route live, bridge enabled = NO.
  - Production Auth/Bridge/frontend flags remained OFF and baseline PASS.
  - no Product/Production mutation.
- Latest classification pin commit `bfc38b23808e782eced4dd4dea5a2c0c8cb99654` triggered:
  - Entry610 Run3 `37121355420`, job `111197941597` = **SUCCESS**
  - A61 browser Cloud transport run `37121355400` = **SUCCESS**
  - Production mutation = NO.
- Static handler audit corrected one Entry609 statement:
  - `cleaningV1:status` is supported by current `Code.gs`; it is read-only.
  - `attendanceV1:config`, `attendanceV1:heartbeat`, and `hrV1:employees` are also supported by the backend, but only the current frontend-required op set counts toward the 29 active op policies.
  - therefore **29 active frontend op policies remains correct**, while the minimal read-only Bridge pilot must include `cleaningV1:status` and is **27 policies**, not 26.
  - `getRowsPageV1931` remains excluded because it is Cloud/Edge authority.
- Inventory test correction commit: `cf1badb4d027d44d8e602b000587bab0a96f2480`.
- التسجيل:
  ```ini
  STATUS=ENTRY610_RUNTIME_POLICY_CORRECTION_PENDING_CI
  RUN_ID=37121355420
  JOB_ID=111197941597
  COMMIT=cf1badb4d027d44d8e602b000587bab0a96f2480
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_CI_FOR_CF1BADB_AND_CLOSE_REPO_ONLY_QUALIFICATION_IF_PASS
  ```
- Entry610 Run4 after the Runtime-policy correction:
  - Run `37121571016`
  - Job `111198537591`
  - conclusion: **SUCCESS**
  - `ENTRY609_ACTIVE_EMPLOYEE_LEGACY_TOP_LEVEL=46`
  - `ENTRY609_TRANSPORT_EMPLOYEE_CANDIDATES=51`
  - `ENTRY609_DORMANT_TRANSPORT_ONLY=5`
  - `ENTRY609_ACTIVE_OP_POLICIES=29`
  - `ENTRY609_FULL_ACTIVE_PARITY_POLICY_COUNT=69`
  - `ENTRY609_READONLY_PILOT_POLICY_COUNT=27`
  - `ENTRY609_CLEANING_STATUS_SUPPORTED=YES`
  - Apps Script bridge route live, bridge enabled = NO.
  - Production Auth/Bridge/frontend flags remain OFF.
  - no Product/Production mutation.
- Entry610 repo-only qualification is therefore closed PASS.
- Safe staged-cutover contract now pinned:
  1. keep Production Auth/Bridge OFF;
  2. prepare canary routing/enrollment code default-OFF;
  3. qualify exact 69 full-active-parity policies and 27 read-only pilot policies;
  4. only after explicit Production approval: shared bridge secret/config, bridge enable, TRANSITIONAL auth/enrollment canary, controlled native login canary, postflight;
  5. no global Native Auth ON while D1 native users = 0.
- التسجيل:
  ```ini
  STATUS=ENTRY610_REPO_ONLY_QUALIFICATION_PASS
  RUN_ID=37121571016
  JOB_ID=111198537591
  COMMIT=cf1badb4d027d44d8e602b000587bab0a96f2480
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ENTRY611_PREPARE_DEFAULT_OFF_CANARY_NATIVE_LOGIN_ROUTING_REPO_ONLY
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY610 -->

---

## الملحق التاريخي ق — Entry611 / إعداد Native Auth Canary بوضع Default-OFF

> **تصنيف النص المنقول:** `HISTORICAL` / `REPO_ONLY_CI_RECORDED` / `NOT_NEW_PRODUCTION_PROOF`. ما يلي سجل تنفيذ واختبارات تاريخية، وليس إثباتًا أن إعدادات Production الحالية كما كانت وقت الاختبار.
> **المصدر وقت النقل:** [`TrendOS_MASTER_BOOK.md`](https://github.com/fawakhry/TrendOs/blob/e7c0965807f0b7578fdc7084cd1393c6582421e3/TrendOS_MASTER_BOOK.md) — Git blob `c7dd30d2ea094e65b70e19b07c8398018f6b3383`.
> **الأرشيف غير القابل للتعديل:** [`b2788ecb4c187717e020321954a1ea449c1aa0d5`](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md) — Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **نطاق النقل:** Entry611 كاملًا فقط، بلا خلط مع Entry612 أو سجلات SERVER الحديثة.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY611 -->
### Entry611 — Native Auth canary routing default-OFF
- الاسم العربي للبحث: **Canary Native Login لموظف واحد بدون Big Bang / Fail-closed / Repository-only**.
- يبدأ بعد Entry610 repo-only qualification PASS.
- الهدف: تجهيز frontend dispatcher لاختيار مستخدم canary واحد أو أكثر لاحقًا، مع بقاء كل الموظفين الآخرين على Legacy login حتى صدور موافقة Production صريحة.
- التصميم:
  - global Native Auth flag يظل `false`.
  - canary mode له flag مستقل default `false` وقائمة مستخدمين فارغة.
  - عند تشغيل canary مستقبلًا، المستخدم غير الموجود بالقائمة يبقى Legacy بدون تغيير.
  - المستخدم canary لا يُسمح له بالـNative login إلا بعد read-only preflight على Cloud Auth + Bridge health والسياسات؛ أي نقص = fail closed، لا fallback صامت.
  - لا Secret values في frontend/repo.
  - لا password logging/storage.
  - أول canary native login يمكنه الاعتماد على TRANSITIONAL legacy bootstrap بعد تأهيله؛ subsequent login يصبح D1-native.
- هذه المرحلة Repository-only فقط؛ **لا Frontend deploy ولا API deploy ولا Auth ON ولا D1 mutation ولا Apps Script change ولا Secret change**.
- التسجيل:
  ```ini
  STATUS=ENTRY611_STARTED_REPO_ONLY
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=PENDING
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_DEFAULT_OFF_CANARY_CONFIG_AND_DISPATCHER_FAIL_CLOSED_ROUTING_WITH_TESTS
  ```
- Default-OFF canary frontend config added Repository-only:
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=false
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=[]
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES=69
  ```
- Global `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false` and bridge flag remain unchanged.
- Commit: `9ecb6c3a94e235a5857950f322aa33385e74d4be`.
- This commit is **not deployed**.
- التسجيل:
  ```ini
  STATUS=ENTRY611_DEFAULT_OFF_CANARY_CONFIG_ADDED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=9ecb6c3a94e235a5857950f322aa33385e74d4be
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=IMPLEMENT_CANARY_DISPATCHER_PREFLIGHT_AND_TESTS_REPO_ONLY
  ```
- Canary-aware employee dispatcher implemented Repository-only:
  - non-canary employees preserve exact Legacy route while global Native Auth is OFF;
  - canary selection is case-insensitive from the configured allowlist;
  - canary login/session/business routing performs read-only health preflight;
  - preflight requires TRANSITIONAL D1 auth readiness, bridge enabled/configured, shared-secret presence reported by Cloud runtime, assertion hygiene, and at least the configured policy minimum;
  - any missing canary prerequisite fails closed with `EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED`; there is no silent fallback to Legacy login for a selected canary;
  - logout and password-change recovery remain available for an already-native canary even if the bridge later becomes unhealthy;
  - successful canary native session is remembered only in memory for routing; no password/secret is stored.
- Dispatcher commit: `af5b2b7f915c05b4cc426e92047e678206b50c83`.
- This source is **not deployed**.
- التسجيل:
  ```ini
  STATUS=ENTRY611_CANARY_DISPATCHER_IMPLEMENTED_REPO_ONLY
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=af5b2b7f915c05b4cc426e92047e678206b50c83
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_CANARY_REGRESSION_TESTS_AND_RUN_REPO_ONLY_CI
  ```
- Fail-closed behavior tightened before qualification:
  - missing frontend bridge/policy readiness fails before any Native login POST;
  - Cloud health network/HTTP failures are normalized to `EMPLOYEE_NATIVE_CANARY_PREFLIGHT_FAILED`;
  - selected canary never silently falls back to Legacy login when preflight cannot be proven.
- Commit: `172fce835284b06d59d99aa325c5ba0a7f18728e`.
- Repository-only / not deployed.
- التسجيل:
  ```ini
  STATUS=ENTRY611_CANARY_FAIL_CLOSED_HARDENED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=172fce835284b06d59d99aa325c5ba0a7f18728e
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_ENTRY611_CANARY_TESTS
  ```
- Canary session identity handling hardened for business bridge calls:
  - after successful canary native login/session verification, the selected username is remembered in-memory only;
  - bridged calls can recover that username if a module omits it while still requiring the native bearer token;
  - logout/password force-relogin clears the remembered canary identity.
- Commit: `6d6d15767b0764410f91594a21abd54e52483555`.
- Repository-only / not deployed.
- التسجيل:
  ```ini
  STATUS=ENTRY611_CANARY_SESSION_IDENTITY_HARDENED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=6d6d15767b0764410f91594a21abd54e52483555
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_ENTRY611_CANARY_REGRESSION_TEST
  ```
- Entry611 canary regression test added:
  - file: `tests/frontend_employee_native_canary_entry611.test.mjs`
  - covers default-OFF exact legacy behavior, non-canary legacy preservation, local preflight fail-closed, Runtime health fail-closed, case-insensitive canary selection, D1 Native login route, bridge bearer-only forwarding, password/token stripping, exact bridge policy denial, and logout recovery.
- Commit: `6044411bab9d571949b5f5783399876e10ca9d31`.
- No Production mutation.
- التسجيل:
  ```ini
  STATUS=ENTRY611_CANARY_REGRESSION_TEST_ADDED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=6044411bab9d571949b5f5783399876e10ca9d31
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ADD_AND_RUN_ENTRY611_REPO_ONLY_CI
  ```
- Dedicated Entry611 repository-only CI added:
  - file: `.github/workflows/trendos-entry611-native-auth-canary-repo-ci.yml`
  - runs canary regression + existing A61 dispatcher/module/no-direct-Google/native-auth/bridge/inventory suites;
  - verifies repo flags remain default-OFF;
  - verifies Production Auth/Bridge are still OFF and the Entry611 canary source has **not** been deployed.
- Workflow commit: `d1cbf415aa5d3576a36b4e626e7ab9fa391aef5b`.
- التسجيل:
  ```ini
  STATUS=ENTRY611_REPO_ONLY_CI_CREATED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=d1cbf415aa5d3576a36b4e626e7ab9fa391aef5b
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_ENTRY611_CI_AND_FIX_REPO_ONLY_IF_NEEDED
  ```
- Entry611 repo-only qualification:
  - Run `37122396731`
  - Job `111200937020`
  - conclusion: **SUCCESS**
- Verified:
  ```ini
  ENTRY611_SYNTAX=PASS
  ENTRY611_NATIVE_AUTH_CANARY=PASS
  ENTRY611_DEFAULT_OFF_PRESERVES_LEGACY=YES
  ENTRY611_NON_CANARY_PRESERVES_LEGACY=YES
  ENTRY611_CANARY_PREFLIGHT_FAIL_CLOSED=YES
  ENTRY611_CANARY_LOGIN_TO_D1=YES
  ENTRY611_CANARY_BRIDGE_BEARER_ONLY=YES
  ENTRY611_PLAINTEXT_TO_BRIDGE=NO
  A61_FRONTEND_EMPLOYEE_DISPATCHER=PASS
  A61_LEGACY_MODULE_DISPATCH=PASS
  A61_NO_BROWSER_GOOGLE_TRANSPORT=PASS
  ENTRY609_FULL_ACTIVE_PARITY_POLICY_COUNT=69
  ENTRY609_READONLY_PILOT_POLICY_COUNT=27
  A61_NATIVE_AUTH_FOUNDATION=PASS
  A61_LEGACY_AUTH_BRIDGE_CONTRACT=PASS
  ENTRY611_REPO_DEFAULT_OFF=YES
  ENTRY611_PRODUCTION_AUTH_OFF=YES
  ENTRY611_PRODUCTION_BRIDGE_OFF=YES
  ENTRY611_CANARY_NOT_DEPLOYED=YES
  ```
- Production boundary from the same run:
  ```ini
  Production_touched=NO
  D1_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  AUTH_MODE_CHANGED=NO
  ORDER_CUSTOMER_DATA_CHANGED=NO
  ```
- Entry611 source is qualified **repo-only** and remains not deployed.
- Production activation prerequisites are still missing by design: shared bridge secret, Apps Script bridge enablement, Cloudflare bridge enablement/policies, TRANSITIONAL auth/bootstrap, canary identity, and frontend canary deployment.
- التسجيل النهائي:
  ```ini
  STATUS=ENTRY611_REPO_ONLY_QUALIFICATION_PASS
  RUN_ID=37122396731
  JOB_ID=111200937020
  COMMIT=d1cbf415aa5d3576a36b4e626e7ab9fa391aef5b
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=ENTRY612_PRODUCTION_MUTATION_PREFLIGHT_ONLY; DO_NOT_ENABLE_OR_DEPLOY_WITHOUT_EXPLICIT_APPROVAL
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY611 -->

---

## الملحق التاريخي ر — Entry612 / Production mutation preflight (قراءة فقط)

> **التصنيف:** `HISTORICAL / PREFLIGHT_RECORDED / NOT_CURRENT_PRODUCTION_PROOF`. سجل بوابات وقرارات مرحلة سابقة، دون تفويض جديد بالنشر أو تفعيل Auth/Bridge.
> **المصدر:** [الكتاب القديم قبل النقل](https://github.com/fawakhry/TrendOs/blob/db8ba181002246997359589270403ff5fa15850f/TrendOS_MASTER_BOOK.md)، blob `dbe5c9bdcc298a7a97dcd7d6466832d02aa03382`.
> **الاسترجاع:** [أرشيف ما قبل التوحيد](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY612 -->
### Entry612 — Production mutation preflight only
- الاسم العربي للبحث: **بوابة ما قبل تفعيل Native Auth Canary في Production — قراءة فقط**.
- يبدأ بعد Entry611 repo-only qualification PASS.
- لا توجد موافقة في هذه المرحلة على:
  - Cloudflare secret write.
  - Apps Script Script Properties write.
  - Apps Script deploy/version.
  - D1 auth control mutation.
  - API/Frontend deploy.
  - employee enrollment/bootstrap.
  - Auth/Bridge enablement.
- قرار migration الآمن:
  - **لا نحتاج تخزين كلمة مرور موظف في GitHub Secrets ولا استخراجها.**
  - عند نافذة canary المعتمدة مستقبلًا، الموظف المختار يدخل كلمة مروره من واجهة TrendOS إلى Cloudflare عبر HTTPS.
  - أول bootstrap canary فقط يتحقق من Legacy ثم يحفظ PBKDF2 verifier في D1؛ plaintext لا يُخزن.
  - subsequent login لنفس الموظف يصبح D1-native.
- Compatibility prerequisite قبل أي frontend canary:
  - shared bridge secret مضبوط على Cloudflare + Apps Script بدون كشف القيمة.
  - Apps Script bridge flag ON.
  - Cloudflare bridge ON.
  - exact full-active-parity policy count = 69.
  - Auth mode = TRANSITIONAL، auth env enabled، native-only = OFF.
  - legacy bootstrap enabled للـfirst canary migration فقط.
- تحذير workflows تاريخية:
  - توجد workflows TEMP قديمة مثل `trendos-t12-a61-diya-native-bootstrap-canary-v2-temp.yml` و`trendos-t12-a61-diya-session-enroll-canary-temp.yml` قادرة على Production mutation عند push على ملفها.
  - **ممنوع تعديل/trigger هذه workflows ضمن Entry612**؛ لا نعيد canary تاريخي ولا نستخدم stored employee credential secrets.
- blocker معروف قبل التفعيل:
  - Cloudflare bridge secret حاليًا absent.
  - Apps Script bridge حاليًا OFF.
  - لا توجد أداة متاحة في هذه الجلسة لقراءة/تعديل Script Properties مباشرةً بطريقة آمنة؛ لا نخمن وجود secret. أي property mutation مستقبلية تحتاج مسار كتابة مصرح/واضح أو تنفيذ المالك بعد موافقة Production.
- التسجيل:
  ```ini
  STATUS=ENTRY612_STARTED_READONLY_PREFLIGHT
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=PENDING
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=BUILD_DEDICATED_ENTRY612_READONLY_PRODUCTION_GATE
  ```
- Dedicated Entry612 read-only Production preflight added:
  - file: `.github/workflows/trendos-entry612-native-auth-production-readonly-preflight.yml`
  - verifies Entry611 source qualification;
  - verifies exact API/UI active versions/deployments;
  - reads Cloudflare settings + secret **names only** without secret values;
  - reads D1 Auth control/users/sessions with SELECT only;
  - rechecks Auth/Bridge/Orders/Customers/frontend Production baselines;
  - probes Apps Script bridge boolean state only;
  - ends at an explicit approval gate and performs no mutation.
- Commit: `c0ab3bd4b010d70d0e05b6f66f5ede29d24ccc73`.
- التسجيل:
  ```ini
  STATUS=ENTRY612_READONLY_PREFLIGHT_WORKFLOW_CREATED
  RUN_ID=PENDING
  JOB_ID=PENDING
  COMMIT=c0ab3bd4b010d70d0e05b6f66f5ede29d24ccc73
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_ENTRY612_PREFLIGHT_RUN_AND_RECORD_RESULT
  ```
- Entry612 Production read-only preflight:
  - Run `37122751617`
  - Job `111201950977`
  - conclusion: **SUCCESS**
- Runtime truth:
  ```ini
  ENTRY612_QUALIFIED_SOURCE=PASS
  ENTRY612_FULL_ACTIVE_PARITY_POLICIES=69
  ENTRY612_READONLY_PILOT_POLICIES=27

  API_VERSION=ce156662-a698-47fc-b73c-dfd4657be9f5
  API_DEPLOYMENT=477ee04d-10ac-4fc3-9ba6-e81691bcd286
  API_TRAFFIC=100

  UI_VERSION=adfb5056-af23-4d7f-8e12-7de6417dfce2
  UI_DEPLOYMENT=a066abb8-4c33-4050-813b-123df4140450
  UI_TRAFFIC=100

  CF_AUTH_ENV_ENABLED=NO
  CF_BOOTSTRAP_ENABLED=NO
  CF_NATIVE_ONLY=NO
  CF_SESSION_ENROLL_ENABLED=NO
  CF_BRIDGE_ENABLED=NO
  CF_BRIDGE_POLICIES_EMPTY=YES
  CF_BRIDGE_SECRET_PRESENT=NO

  D1_AUTH_MODE=OFF
  D1_USER_COUNT=0
  D1_NATIVE_READY_COUNT=0
  D1_SESSION_COUNT=0
  D1_LIVE_SESSION_COUNT=0

  AUTH_HEALTH=PASS_OFF
  BRIDGE_HEALTH=PASS_OFF
  ORDER_CREATE_BASELINE=PASS
  DUPLICATE_GUARD=PASS
  LEGACY_LINE_RUNTIME=PASS
  CUSTOMER_WRITE_BASELINE=PASS

  FRONTEND_NATIVE_AUTH_OFF=YES
  FRONTEND_BRIDGE_OFF=YES
  ENTRY611_CANARY_NOT_LIVE=YES
  REFRESH_FIX_PRESERVED=YES
  DUPLICATE_GUARD_UI_PRESERVED=YES

  APPS_SCRIPT_BRIDGE_ROUTE_LIVE=YES
  APPS_SCRIPT_BRIDGE_ENABLED=NO
  APPS_SCRIPT_SECRET_VALUE_READ=NO
  APPS_SCRIPT_DEPLOYMENT_NUMBER=NOT_OBSERVABLE_FROM_PUBLIC_ROUTE
  ```
- Approval gate:
  ```ini
  PRODUCTION_ENABLE_NOW=NO
  EXPLICIT_PRODUCTION_APPROVAL_REQUIRED=YES
  CANARY_EMPLOYEE_SELECTION_REQUIRED=YES
  EMPLOYEE_PASSWORD_GITHUB_SECRET_REQUIRED=NO
  REQUIRED_MUTATION_1=SHARED_BRIDGE_SECRET_CLOUDFLARE_AND_APPS_SCRIPT
  REQUIRED_MUTATION_2=ENABLE_BRIDGE_WITH_69_POLICIES
  REQUIRED_MUTATION_3=TRANSITIONAL_AUTH_AND_LEGACY_BOOTSTRAP
  REQUIRED_MUTATION_4=DEPLOY_FRONTEND_CANARY_FOR_ONE_APPROVED_EMPLOYEE
  ```
- No Production mutation occurred in Entry612.
- التسجيل النهائي:
  ```ini
  STATUS=ENTRY612_READONLY_PREFLIGHT_PASS_WAITING_EXPLICIT_PRODUCTION_APPROVAL
  RUN_ID=37122751617
  JOB_ID=111201950977
  COMMIT=c0ab3bd4b010d70d0e05b6f66f5ede29d24ccc73
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=WAIT_FOR_EXPLICIT_APPROVAL_AND_CANARY_USERNAME_BEFORE_ANY_PRODUCTION_MUTATION
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY612 -->

---

## الملحق التاريخي ش — Entry613 / محاولة Canary معتمدة تاريخيًا ثم ملغاة بقرار أحدث

> **التصنيف:** `HISTORICAL / SUPERSEDED_BY_ZERO_GOOGLE_FUNCTIONS_FIRST / NOT_CURRENT_PRODUCTION_APPROVAL`. أي موافقة تاريخية داخل النص لم تعد تفويضًا للتنفيذ؛ هذه المحاولة أُغلقت دون تفعيل Bridge أو نقل Auth، ثم استُبدلت بسياسة نقل الوظائف إلى Cloudflare/D1 أولًا.
> **المصدر:** [القديم عند نقطة النقل](https://github.com/fawakhry/TrendOs/blob/2c3d2794eb55ab25e2f0cea1134afe1bb03e37a8/TrendOS_MASTER_BOOK.md)، Git blob `5664d6013c26a56dde5aba23af55cfa26e2b0ffb`.
> **الاسترجاع:** [الأرشيف](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **نطاق الخصوصية:** يحتوي السجل التاريخي على الاسم الأول للموظف المحدد آنذاك دون كلمة مرور أو قيمة سرية؛ النقل ضمن نطاق التوثيق التاريخي نفسه.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY613 -->
### Entry613 — Approved Production Canary for ضياء
- الموافقة الصريحة المستلمة: **موافق على Production Canary، نفذ، والموظف: ضياء**.
- الاسم العربي للبحث: **تنفيذ Canary Native Auth لموظف ضياء — staged production cutover**.
- هذه الموافقة تسمح ببدء Production mutations المطلوبة للـcanary ضمن حدود الأمان المؤهلة في Entry610/611/612، مع منع Big Bang أو Global Native Auth.
- Canary identity:
  ```ini
  CANARY_USERNAME=ضياء
  CANARY_SCOPE=ONE_EMPLOYEE_ONLY
  GLOBAL_NATIVE_AUTH=FORBIDDEN
  NATIVE_ONLY=FORBIDDEN_UNTIL_POST_BOOTSTRAP_PROOF
  ```
- ترتيب التنفيذ الإلزامي:
  1. تثبيت shared bridge secret نفسه في Cloudflare + Apps Script بدون إظهاره.
  2. إثبات Apps Script bridge enabled + secret configured عبر challenge غير صالح فقط.
  3. نشر Worker runner-only TRANSITIONAL: Auth enabled, legacy bootstrap enabled, native-only OFF, Bridge enabled, exact 69 policies.
  4. D1 auth control من OFF إلى TRANSITIONAL فقط بعد نجاح 1–3.
  5. postflight كامل Orders/Customers/refresh/duplicate guard.
  6. نشر Frontend canary لضياء فقط؛ بقية الموظفين Legacy.
  7. أول دخول ضياء من الواجهة يعمل bootstrap من Legacy إلى PBKDF2/D1 بدون تخزين plaintext.
  8. إثبات second login = `d1-native-employee-v1` ثم Bridge business smoke.
- ممنوع استخدام workflows التاريخية TEMP الخاصة بـDiya credentials أو تخزين كلمة مرور ضياء في GitHub.
- blocker التنفيذي الحالي: نحتاج جلسة Browser Profile مصادق عليها إلى **Cloudflare Dashboard + Google Apps Script** لضبط السر المشترك وApps Script property بأمان؛ لا توجد API connector مباشرة لـScript Properties في الجلسة.
- التسجيل:
  ```ini
  STATUS=ENTRY613_APPROVED_EXECUTION_STARTED
  APPROVAL=YES
  CANARY_USERNAME=ضياء
  Production_touched=NO_YET
  D1_touched=NO_YET
  Apps_Script_touched=NO_YET
  Secrets_touched=NO_YET
  NEXT_ACTION=QUALIFY_EXACT_ACTIVATION_MANIFEST_THEN_AUTHENTICATE_BROWSER_PROFILE_FOR_SECRET_INSTALL
  ```
- Exact activation manifest pinned:
  - file: `docs/trendos/staging/ENTRY613_DIYA_PRODUCTION_CANARY_MANIFEST.json`
  - commit: `f292b8e4cbe034ea01b23daa42555abdd5e37de9`
  - canary = `ضياء`
  - exact bridge policies = 69
  - global Native Auth remains forbidden.
- Manifest regression added:
  - file: `tests/entry613_diya_production_canary_manifest.test.mjs`
  - commit: `63e1fb146ff892a8f51fd84fe182f7357eefc4a0`
- Dedicated manifest CI:
  - workflow commit: `467b6065b84dba55dfa120240d560797ebdb7f68`
  - Run `37124017425`
  - Job `111205584637`
  - conclusion: **SUCCESS**
  - verified `ENTRY613_CANARY_USERNAME=ضياء`, `ENTRY613_POLICY_COUNT=69`, `ENTRY613_GLOBAL_NATIVE_AUTH=NO`, `ENTRY613_REPO_DEFAULT_OFF=YES`.
  - Production pre-mutation Auth/Bridge remained OFF.
- Current execution gate is now only the authenticated secret/property installation on both Cloudflare and Google Apps Script.
- التسجيل:
  ```ini
  STATUS=ENTRY613_MANIFEST_QUALIFIED_WAITING_BROWSER_AUTH
  RUN_ID=37124017425
  JOB_ID=111205584637
  COMMIT=467b6065b84dba55dfa120240d560797ebdb7f68
  CANARY_USERNAME=ضياء
  BRIDGE_POLICY_COUNT=69
  Production_touched=NO_YET
  D1_touched=NO_YET
  Apps_Script_touched=NO_YET
  Secrets_touched=NO_YET
  NEXT_ACTION=AUTHENTICATE_TINYFISH_PROFILE_TO_CLOUDFLARE_AND_GOOGLE_APPS_SCRIPT_THEN_INSTALL_SHARED_SECRET
  ```

- قرار المالك بعد التأهيل وقبل أي mutation: **لا نفعّل Compatibility Bridge على Production؛ ننقل كل وظائف الموظفين إلى Cloudflare/D1 أولًا ونُنهي Zero-Google، ثم ننقل Login/Auth كآخر خطوة.**
- Entry613 أصبح superseded قبل secret install / bridge enable / D1 TRANSITIONAL / frontend canary.
- لا Google Script Property تغيرت، لا Cloudflare secret أضيف، لا Auth mode تغير، لا deploy Production تم.
- إغلاق Entry613:
  ```ini
  STATUS=SUPERSEDED_BY_ZERO_GOOGLE_FUNCTIONS_FIRST
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  NEXT_ACTION=ENTRY614_ZERO_GOOGLE_EMPLOYEE_FUNCTIONS_FIRST
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY613 -->

---

## الملحق التاريخي ت — Entry614 / Zero-Google Employee Functions First

> **التصنيف:** `HISTORICAL / REPO_ONLY_QUALIFICATION_RECORDED / NOT_CURRENT_PRODUCTION_PROOF`. نقل تاريخي لمصادر واختبارات Cloudflare/D1، دون اعتبار الخطوات قد نُشرت حاليًا.
> **المصدر:** [القديم عند النقل](https://github.com/fawakhry/TrendOs/blob/3b8f245d82c9765b11b1c9828af65d4bacd85fe1/TrendOS_MASTER_BOOK.md)، blob `891df6327d4e4daae46bed6c0cd6dc1249f0474c`.
> **الأرشيف:** [نسخة الاسترجاع](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
> **نسخ على جزأين، ولا إزالة قبل VERIFY كامل.**

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY614 -->
### Entry614 — Zero-Google Employee Functions First
- الاسم العربي للبحث: **انقل كل وظائف الموظفين من Google/Apps Script إلى Cloudflare + D1 أولًا ثم اقفل Google نهائيًا**.
- قرار المالك صريح: **لا Compatibility Bridge Production**. لا نضيف Shared Secret ولا Script Properties جديدة على Google.
- الهدف النهائي لهذه السلسلة:
  ```ini
  EMPLOYEE_BUSINESS_ACTIONS_APPS_SCRIPT=0
  EMPLOYEE_RUNTIME_GOOGLE_DEPENDENCY=0
  EMPLOYEE_LOGIN=D1_NATIVE
  EMPLOYEE_SESSION=D1_NATIVE
  APPS_SCRIPT_AUTH_FALLBACK=0
  ZERO_GOOGLE_COMPLETE=YES
  ```
- نقطة البداية الحالية من Runtime/Entries609-612:
  - 46 top-level active legacy employee business actions.
  - 29 active op-scoped policies.
  - 2 hybrid legacy fallbacks: `updateLine`, `markCustomerNotified`.
  - 69 full-active-parity policy keys were bridge-equivalent inventory; الآن ستستخدم كمصفوفة نقل، لا كBridge allowlist.
  - `getRowsPageV1931` Cloud/Edge بالفعل.
  - Orders create/customer write/duplicate guard/refresh fix/legacy line baseline يجب الحفاظ عليهم.
- استراتيجية النقل:
  1. read-only inventory: D1 schema + action→handler→data-source map.
  2. نقل read-only actions إلى Cloud/D1 أولًا.
  3. نقل writes لكل عائلة مع idempotency/audit/versioning.
  4. إزالة frontend legacy fallbacks لكل عائلة بعد qualification.
  5. تكرار حتى `EMPLOYEE_BUSINESS_ACTIONS_APPS_SCRIPT=0`.
  6. بعدها فقط Employee Login/Auth → D1 Native، ثم حذف Apps Script employee runtime.
- لا Big Bang Production. كل family لها repo qualification → read-only preflight → controlled deploy → postflight.
- التسجيل:
  ```ini
  STATUS=ENTRY614_STARTED_ZERO_GOOGLE_FUNCTIONS_FIRST
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READONLY_D1_SCHEMA_AND_ACTION_DATA_SOURCE_INVENTORY
  ```
- Static current-source scan pinned **46 active legacy employee top-level actions** from Entry609 against current `Code.gs` router/handlers; no Production mutation.
- Dedicated D1/Runtime read-only inventory workflow created:
  - `.github/workflows/trendos-entry614-zero-google-d1-inventory-readonly.yml`
  - commit `6e73eea786d2749651611e2b41aa47b657758358`
  - reads Production auth/bridge/order/customer baselines, D1 sqlite schema, mirror catalog, and key counts using SELECT only.
- التسجيل:
  ```ini
  STATUS=ENTRY614_READONLY_INVENTORY_WORKFLOW_CREATED
  COMMIT=6e73eea786d2749651611e2b41aa47b657758358
  RUN_ID=PENDING
  JOB_ID=PENDING
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=READ_ENTRY614_D1_INVENTORY_RUN_AND_BUILD_MIGRATION_FAMILIES
  ```
- Entry614 inventory Run1:
  - Run `37129335398`
  - Job `111221130746`
  - conclusion = **FAIL after useful read-only inventory**.
- Failure cause: final key-count query referenced nonexistent generic tables `orders` / `order_lines`; current D1 uses T12 production tables such as `t12_prod_orders` / `t12_prod_lines`.
- Before failure, Runtime proved:
  - Auth OFF, Bridge OFF, Orders GENERAL, Customers GENERAL.
  - D1 object count = **34**.
  - D1 has dedicated Order/Customer/Auth runtime tables plus generic `sheet_catalog/sheet_rows`, but **no dedicated native D1 tables yet for Attendance/HR/Cleaning/Press/Accounting/Platform/Marketplace/etc.**
  - `sheet_catalog` contains 87 historical mirrored sheet datasets, including HR, attendance, cleaning, press, accounting, marketplace, conversations, platform, notes, etc.; these mirror timestamps are historical and are **seed/migration evidence only, not current authority**.
- This establishes the core Zero-Google requirement: employee families need D1-owned schemas + Cloud handlers; simply reading historical `sheet_rows` cannot be the final Zero-Google authority.
- التسجيل:
  ```ini
  STATUS=ENTRY614_READONLY_RUN1_FAIL_BAD_COUNT_TABLE_NAMES
  RUN_ID=37129335398
  JOB_ID=111221130746
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=PATCH_READONLY_COUNT_QUERY_TO_CURRENT_T12_TABLES_AND_RERUN
  ```
- Entry614 inventory Run2:
  - Run `37129432965`
  - Job `111221415747`
  - conclusion = **FAIL only in optional aggregate count query**.
- Runtime schema + 87-sheet mirror catalog were re-read successfully and unchanged; no mutation occurred. The optional multi-table count statement remains nonessential to the migration design and is dropped from the critical gate rather than spending more rounds on diagnostics.
- Authoritative structural conclusion:
  ```ini
  D1_NATIVE_EMPLOYEE_DOMAIN_TABLES=NOT_PRESENT
  D1_GENERIC_HISTORICAL_SHEET_MIRROR=PRESENT
  ORDERS_CUSTOMERS_AUTH_NATIVE_TABLES=PRESENT
  ZERO_GOOGLE_REQUIRES_NEW_D1_DOMAIN_SCHEMAS=YES
  ```
- التسجيل:
  ```ini
  STATUS=ENTRY614_INVENTORY_SUFFICIENT_OPTIONAL_COUNT_DIAGNOSTIC_FAILED
  RUN_ID=37129432965
  JOB_ID=111221415747
  COMMIT=9177b420460f9cd92cf567ac46a82522ed9ca17d
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=BUILD_ZERO_GOOGLE_DOMAIN_SCHEMAS_AND_CLOUD_HANDLERS_REPO_ONLY
  ```
- Zero-Google operational family source built repo-only:
  - migration `0012_employee_ops_zero_google_v1.sql` commit `65eacba00ffb093e0381cb246300f86c050288fb`.
  - D1-owned schemas added for Attendance, attendance pulses/config/special-times, HR employees/requests/skills/performance, Cleaning daily, Press settings/sessions, request ledger and audit events.
  - control row `ENTRY614_EMPLOYEE_OPS_V1` defaults `OFF`; applying schema alone cannot cut traffic over.
  - Cloud handler `cloudflare-d1/src/employee-ops-native-v1.mjs` commit `32d80569165c4eda797d7d4030c2e3683a98712d`.
  - routes implemented for `attendanceV1`, `attendanceClockinV1`, `hrV1`, `cleaningV1`, `pressControlV1`.
  - business logic contains **zero Apps Script/Google calls**; temporary auth verification can use existing Cloud session bridge until final D1-auth cutover.
  - Worker route wired in `index_v2.js` commit `c1e21c7a8cfeaed27716cc6ab4ef06d6f183ddf8`.
  - regression test `tests/entry614_employee_ops_native.test.mjs` commit `a69f0036442edfe1c92a76e776a643ea68260924`.
- None of these commits are deployed; D1 migration 0012 is **not applied yet**.
- التسجيل:
  ```ini
  STATUS=ENTRY614_OPS_FAMILY_SOURCE_BUILT_REPO_ONLY
  COMMIT=a69f0036442edfe1c92a76e776a643ea68260924
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  NEXT_ACTION=RUN_OPS_NATIVE_CI_THEN_BUILD_NEXT_ZERO_GOOGLE_FAMILIES
  ```
- Employee Ops native repo CI:
  - Run `37130008916`
  - conclusion = **SUCCESS**
  - schema default-OFF verified, no Order/Customer schema mutation, Production Auth/Bridge stayed OFF, Orders baseline PASS.
- التسجيل:
  ```ini
  STATUS=ENTRY614_OPS_FAMILY_REPO_QUALIFIED
  RUN_ID=37130008916
  COMMIT=6139ba339a09686621ffff9a172946d1dbd518fc
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  NEXT_ACTION=BUILD_CONTENT_CONFIG_CONVERSATION_ACCOUNTING_FAMILIES_REPO_ONLY
  ```
- Content/Config Zero-Google family started Repository-only:
  - migration `0013_employee_content_zero_google_v1.sql` commit `135d6de491d4fd102ea2b4eca05d4a6f8b2dc79c`.
  - adds default-OFF `employee_content_control_v1`, D1-native content records, file metadata, audit events, and seed records for original Platform Sections / HQ Franchise / Service Route defaults.
  - native handler `employee-content-native-v1.mjs` commit `557488e52d927d5273fcaf1f9a4df2d2e71235da`.
  - covers Platform Sections, Franchise branches + customer branch assignment, Service Routes, Marketplace vendors/products, White-label, lead phones, Platform Ads, Knowledge, Matbagy Notes.
  - file/image writes target Cloudflare R2 binding `FILES`; **no Google Drive runtime path is used**. If R2 is absent, file writes fail closed.
  - Worker route wired in `index_v2.js` commit `c1e0f6c219cf1f51809ad0224ee3196e66d8cfbf`.
- All Content control remains default-OFF. Migration 0013 not applied and source not deployed.
- التسجيل:
  ```ini
  STATUS=ENTRY614_CONTENT_FAMILY_SOURCE_BUILT_REPO_ONLY
  COMMIT=c1e0f6c219cf1f51809ad0224ee3196e66d8cfbf
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  R2_touched=NO
  NEXT_ACTION=ADD_CONTENT_NATIVE_REGRESSION_AND_REPO_CI
  ```
- Content native regression added:
  - `tests/entry614_employee_content_native.test.mjs`
  - commit `c3a9450f9d7b9b7b8cc1d7a79cfadf4575e6d4f7`
  - checks 20 action contracts, default-OFF schema, D1 authority marker, zero Google business calls, R2 file target, Worker routing.
- Dedicated repo-only CI added:
  - `.github/workflows/trendos-entry614-employee-content-native-ci.yml`
  - commit `b86ebe6876f98b67e1da05538350dc982953121b`
  - Production checks are read-only; no D1/R2/API/Apps Script mutation.
- التسجيل:
  ```ini
  STATUS=ENTRY614_CONTENT_REPO_CI_CREATED
  COMMIT=b86ebe6876f98b67e1da05538350dc982953121b
  RUN_ID=PENDING
  JOB_ID=PENDING
  Production_touched=NO
  D1_touched=NO
  R2_touched=NO
  Apps_Script_touched=NO
  NEXT_ACTION=READ_CONTENT_REPO_CI
  ```
- Content native repo CI:
  - Run `37130621716`
  - Job `111224828304`
  - conclusion = **SUCCESS**
  - 20 Content/Config actions covered.
  - Google business calls = 0.
  - file target = R2.
  - migration default-OFF; no Production/D1/R2/API/App Script mutation.
- التسجيل:
  ```ini
  STATUS=ENTRY614_CONTENT_FAMILY_REPO_QUALIFIED
  RUN_ID=37130621716
  JOB_ID=111224828304
  COMMIT=b86ebe6876f98b67e1da05538350dc982953121b
  Production_touched=NO
  D1_touched=NO
  R2_touched=NO
  Apps_Script_touched=NO
  API_DEPLOY=NO
  NEXT_ACTION=BUILD_CUSTOMER_COMMS_AUTOMATION_NATIVE_FAMILY
  ```
- Customer Comms / Feedback / Go-Live family built Repository-only:
  - migration `0014_employee_comms_zero_google_v1.sql` commit `84a99cadfd93c161c5337317885b1eef9cab70c5`.
  - adds default-OFF control, feedback requests, go-live drafts, order-conversation R2 file metadata, audit events.
  - native handler `employee-comms-native-v1.mjs` commit `56f440a6c9e741d2d47a4a24596036853f657342`.
  - covers `customerManagerV1`, `customerFeedbackV1`, `goLiveAutopilotV1`, `getOrderConversation`, `sendOrderConversationMessage`, `uploadOrderConversationFile`.
  - WhatsApp is called directly from Cloudflare using Cloudflare-held Meta credentials; AI suggestions call OpenAI directly from Cloudflare; files target R2.
  - Meta webhook path is moved to Cloudflare source: `/v1/employee/comms/webhook`.
  - `finalizeAndNotify` intentionally fails closed with `accounting-d1-authority-not-ready` until Accounting D1 authority is built; it does **not** fall back to Apps Script.
  - Worker route wired in `index_v2.js` commit `19f0e48882fca52ef78eee1f01b978597e996dd7`.
  - regression `tests/entry614_employee_comms_native.test.mjs` commit `7c7b427a509cb3e770e53b66cd498a70ee621b57`.
- Source business paths contain zero Google/Apps Script calls. Migration/source not deployed.
- التسجيل:
  ```ini
  STATUS=ENTRY614_COMMS_FAMILY_SOURCE_BUILT_REPO_ONLY
  COMMIT=7c7b427a509cb3e770e53b66cd498a70ee621b57
  Production_touched=NO
  D1_touched=NO
  R2_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  NEXT_ACTION=RUN_COMMS_NATIVE_REPO_CI
  ```


- Zero-Google final active business gap audit:
  - Entry609 active legacy top-level actions = **46**.
  - Qualified native family coverage before Core = **40**:
    - Ops = 5.
    - Content/Config = 20.
    - Comms/Feedback/Go-Live = 6.
    - Accounting/Party Ledger = 9.
  - remaining active top-level actions = **6**:
    `archiveDeliveredDepartmentV1926`, `bulkUpdateDepartmentStatusV1926`, `getActivityLog`, `getDashboard`, `getRows`, `getTrendMasterCenterV1931`.
  - hybrid `updateLine` + `markCustomerNotified` already have Cloud operational runtime routes and will have frontend legacy fallback removed only after data/cutover qualification.
- Employee Core Zero-Google source built Repository-only:
  - migration `0016_employee_core_zero_google_v1.sql`
    - initial commit `8182ee288efc8909d41b1ec29e66cb892ed694a3`
    - delivery restriction authority added commit `9717a092853017774fc04ca7509268c4a1718f41`.
  - Cloud handler `employee-core-native-v1.mjs` commit `da15abb86c6827011867d4df3dad05844d25bbd6`.
  - Worker route wired commit `33727783166e5983cf3cc03eaaa7cd2722f93e45`.
  - coverage test commit `06c4bcb118994060dad260c2c76dbe54d407374e`.
  - combined repo-only CI workflow commit `2052e38fbd69119c1e3cc5ff9eacae1d47bbb93e`.
  - source control defaults OFF; migration is **not applied**, API/frontend are **not deployed**.
  - Core archive uses additive D1 archive snapshots and never deletes `t12_prod_orders/t12_prod_lines`.
  - Core business source contains no direct Google/Apps Script calls; current employee session verification remains temporary until final Auth cutover.
- Full business coverage CI Run1:
  - Run `37132362436`
  - Job `111229836717`
  - conclusion = **FAIL in test syntax only**.
  - All four previously built family regressions and all handler syntax checks passed before the failure.
  - failure: malformed regex literal in new coverage test at the `ENTRY614_EMPLOYEE_CORE_V1` marker assertion.
  - no Production/D1/Apps Script mutation occurred.
- التسجيل:
  ```ini
  STATUS=ENTRY614_FULL_BUSINESS_COVERAGE_RUN1_FAIL_TEST_SYNTAX
  RUN_ID=37132362436
  JOB_ID=111229836717
  COMMIT=2052e38fbd69119c1e3cc5ff9eacae1d47bbb93e
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  NEXT_ACTION=FIX_COVERAGE_TEST_REGEX_ONLY_AND_RERUN
  ```


- Full Zero-Google employee business coverage rerun after test-only regex fix:
  - Coverage Run `37132441990`
  - Job `111230069890`
  - conclusion = **SUCCESS**
  - Browser transport regression Run `37132442037`
  - Job `111230070035`
  - conclusion = **SUCCESS**
- Qualified source result:
  ```ini
  ENTRY614_ZERO_GOOGLE_EMPLOYEE_BUSINESS_COVERAGE=PASS
  ENTRY614_ACTIVE_LEGACY_TOP_LEVEL=46
  ENTRY614_NATIVE_FAMILY_COVERED_TOP_LEVEL=46
  ENTRY614_UNCOVERED_ACTIVE_TOP_LEVEL=0
  ENTRY614_HYBRID_UPDATE_NOTIFY_CLOUD_RUNTIME=YES
  ENTRY614_CORE_GOOGLE_BUSINESS_CALLS=0
  ENTRY614_ALL_NEW_CONTROLS_DEFAULT_OFF=YES
  A61_NO_BROWSER_GOOGLE_TRANSPORT=PASS
  ```
- Production remained unchanged during qualification:
  ```ini
  ENTRY614_PRODUCTION_AUTH_OFF=YES
  ENTRY614_PRODUCTION_BRIDGE_OFF=YES
  ENTRY614_ORDER_BASELINE=PASS
  ENTRY614_CUSTOMER_BASELINE=PASS
  Production_touched=NO
  D1_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  ```
- Source coverage is now complete for all **46 currently active employee business top-level actions**, but Zero-Google is **not yet complete** because the new D1 domain tables have not been populated from current Production data and the frontend/API controls are still OFF. Current-data backfill/parity is the next mandatory gate.
- التسجيل:
  ```ini
  STATUS=ENTRY614_FULL_EMPLOYEE_BUSINESS_SOURCE_COVERAGE_PASS
  RUN_ID=37132441990
  JOB_ID=111230069890
  SECONDARY_RUN_ID=37132442037
  SECONDARY_JOB_ID=111230070035
  COMMIT=6f7cd6f474aa6e3d9e3e22eec855593d623e41b7
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=BUILD_CURRENT_DATA_BACKFILL_AND_PARITY_GATE_FOR_0012_TO_0016
  ```


- Latest Entry614 qualification after removing runtime sheet-mirror dependency:
  - Zero-Google business coverage Run `37133424459`
  - Job `111232962114`
  - conclusion = **SUCCESS**
  - Browser transport regression Run `37133424434`
  - Job `111232961923`
  - conclusion = **SUCCESS**
- Current repo truth:
  ```ini
  ENTRY614_ZERO_GOOGLE_EMPLOYEE_BUSINESS_COVERAGE=PASS
  ENTRY614_ACTIVE_LEGACY_TOP_LEVEL=46
  ENTRY614_NATIVE_FAMILY_COVERED_TOP_LEVEL=46
  ENTRY614_UNCOVERED_ACTIVE_TOP_LEVEL=0
  ENTRY614_HYBRID_UPDATE_NOTIFY_CLOUD_RUNTIME=YES
  ENTRY614_CORE_GOOGLE_BUSINESS_CALLS=0
  ENTRY614_RUNTIME_SHEET_MIRROR_DEPENDENCY=0
  ENTRY614_CURRENT_ORDER_AUTHORITY=D1_NATIVE
  ENTRY614_ALL_NEW_CONTROLS_DEFAULT_OFF=YES
  A61_NO_BROWSER_GOOGLE_TRANSPORT=PASS
  ```
- Source-only Zero-Google business migration is now complete, but the D1 native domain tables are still empty/not applied in Production and the live frontend/API routing is still unchanged. Therefore **current-data backfill + parity** is now the blocking stage.
- التسجيل:
  ```ini
  STATUS=ENTRY614_ZERO_GOOGLE_BUSINESS_SOURCE_COMPLETE
  RUN_ID=37133424459
  JOB_ID=111232962114
  SECONDARY_RUN_ID=37133424434
  SECONDARY_JOB_ID=111232961923
  COMMIT=f59840978424d40467ac01fbac07a79603ce439e
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  NEXT_ACTION=ENTRY615_CURRENT_DATA_BACKFILL_INVENTORY_AND_PARITY_PLAN
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY614 -->

---

## الملحق التاريخي ث — Entry616 / إطلاق Backend مع تعطيل جميع العائلات افتراضيًا

> `HISTORICAL / DEPLOYMENT_RECORDED_AT_HISTORICAL_VERSION / NOT_CURRENT_PRODUCTION_PROOF`. يحفظ السجل إثبات مرحلة نشر سابقة وليس إثبات النسخة الحية اليوم.
> مصدر النقل: [Git source](https://github.com/fawakhry/TrendOs/blob/8ae89f4cff7a1bc267ade75169c5b4cf9a6e5fa2/TrendOS_MASTER_BOOK.md)، blob `0f3b11ecdc57ba115c4b5f78c67b848c22f8cd05`.
> نسخة الاسترجاع: [archive](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY616 -->
### Entry616 — Zero-Google backend deployed safely with all family controls OFF
- بدأ التنفيذ من Entry615 بدون إعادة 614/615 أو Backfill.
- Branch head قبل خطوة التنفيذ كان `0f646ae4aa68de84fdf85045af572b43a9dcc876`.
- تم تثبيت qualification على source الحالي:
  - all five Zero-Google family handlers wired through `cloudflare-d1/src/index_v2.js`.
  - Entry614 46/46 business coverage preserved.
  - Session Shadow TTL = **43200 seconds / 12h** preserved.
  - Native Employee Auth = OFF.
  - Employee Legacy Bridge = OFF.
  - Orders GENERAL + Duplicate Guard preserved.
  - Customers GENERAL preserved.
  - Line Runtime preserved.
- Qualification Run #1 `37201212337` stopped **before deploy** because the old Entry614 content regression still expected the historical `service_provider_routes` seed in migration 0013. Runtime/source capability itself was still present.
- Regression-only correction commit:
  - `76c600a447a903189d047939a22e207494ef9a8a`
  - changed the stale assertion to verify the live D1 handler capability instead of the removed historical seed.
- Qualification Run #2 `37201348711` passed full source qualification then stopped **before deploy** on an exact-version lock mismatch.
- Runtime truth from `wrangler deployments list` proved the actual predeploy Production version was:
  - `62cad7e7-6c4d-4f56-9b37-849f2e7256c7`
  - the older book text `62cad27e-76c4d-...` was a transcription typo and has been corrected.
- Final controlled workflow commit:
  - `a6aaf6390b0572feb5715736ed88cda8c8ade9c2`
- Final workflow:
  - Run `37201395905`
  - Job `111433654098`
  - conclusion = **SUCCESS**
- Predeploy gate proved:
  ```ini
  PRE_VERSION=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  OPS=OFF
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  ORDERS=GENERAL
  DUPLICATE_GUARD=PASS
  CUSTOMERS=GENERAL
  LINE_RUNTIME=PASS
  ZERO_GOOGLE_FAMILY_ROUTES_PREDEPLOY=NOT_LIVE_404
  ```
- Deployment was code-only with no migrations, no D1 data mutation, no family-control mutation, no secret write, no frontend deploy and no Apps Script mutation.
- New Production API version:
  - `de2c825d-ef63-407d-90dc-8059a9d4f192`
- Postdeploy workflow + independent public health verification:
  ```ini
  EMPLOYEE_AUTH=OFF
  EMPLOYEE_BRIDGE=OFF
  OPS=OFF / schemaReady=true / googleBusinessCalls=0
  CONTENT=OFF / schemaReady=true / googleBusinessCalls=0
  COMMS=OFF / schemaReady=true / googleBusinessCalls=0
  ACCOUNTING=OFF / schemaReady=true / googleBusinessCalls=0
  CORE=OFF / schemaReady=true / googleBusinessCalls=0
  ORDERS=GENERAL / duplicateGuardReady=true
  CUSTOMERS=GENERAL / customerCount=251
  LINE_RUNTIME=PASS / cloud-native+legacy-overlay
  REFRESH_FIX=PASS
  SESSION_SHADOW_TTL_12H=PRESERVED
  ```
- Frontend refresh recovery remains live:
  - `postWriteBarrierRecoveries` present.
  - `recoverPostWriteBarrier` present.
- External readiness exposed by the newly live OFF-state health routes:
  - Content: `r2Ready=false`.
  - Comms: `r2Ready=false`, `whatsappReady=false`, `openAiReady=false`.
  - these do not invalidate Entry616 because all families remain OFF, but Content/Comms must not be promoted to GENERAL until their required external bindings are qualified.
- Ops is the safest first family for the next READONLY cutover because its schema is ready and it has no R2/WhatsApp/OpenAI dependency.
- التسجيل:
  ```ini
  STATUS=ENTRY616_ZERO_GOOGLE_BACKEND_OFF_DEPLOY_HEALTH_REGRESSION_PASS
  RUN_ID=37201395905
  JOB_ID=111433654098
  WORKFLOW_COMMIT=a6aaf6390b0572feb5715736ed88cda8c8ade9c2
  PREVIOUS_PRODUCTION_API_VERSION=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  PRODUCTION_API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  FAMILY_CONTROLS=ALL_OFF
  AUTH=OFF
  BRIDGE=OFF
  ORDERS_BASELINE=PASS
  CUSTOMERS_BASELINE=PASS
  LINE_RUNTIME=PASS
  REFRESH_FIX=PASS
  GOOGLE_APPS_SCRIPT_TOUCHED=NO
  BACKFILL_RERUN=NO
  NEXT_ACTION=QUALIFY_OPS_READONLY_CUTOVER_WITH_AUTH_AND_BRIDGE_STILL_OFF
  ```

<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY616 -->

---

## الملحق التاريخي خ — Entry617 / Ops read-only cutover checkpoint

> `HISTORICAL / DEPLOYED_VERSION_RECORDED / NOT_NEW_PRODUCTION_PROOF`. النص تاريخي فقط ولا يثبت وضع عائلة Ops أو Auth اليوم.
> مصدر: [كتاب قديم](https://github.com/fawakhry/TrendOs/blob/81e7b64641f6366ec3b1cdb3a1b2579d7883ee33/TrendOS_MASTER_BOOK.md)، blob `c6317516e9d5bf37c82c3d11f49adb839acccfcd`.
> أرشيف: [snapshot](https://github.com/fawakhry/TrendOs/blob/b2788ecb4c187717e020321954a1ea449c1aa0d5/TrendOS_MASTER_BOOK.md)، blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.

<!-- BEGIN_VERBATIM_MIGRATION:MASTER_ENTRY617 -->
### Entry617 — Ops family READONLY cutover on live frontend baseline
- الهدف: بدء family-by-family cutover بأول عائلة فقط، مع إبقاء:
  - Employee Auth = OFF.
  - Employee Bridge = OFF.
  - Content/Comms/Accounting/Core = OFF.
  - Apps Script/Google runtime untouched.
- Repo-only qualification:
  - Ops family router أضيف default-OFF ثم اختُبر أن:
    - OFF يحافظ على Legacy behavior كما هو.
    - READONLY يرسل فقط Ops reads المؤهلة إلى `/v1/employee/ops`.
    - Ops writes تبقى على المسار الحالي في READONLY.
    - GENERAL source path موجود لمرحلة لاحقة فقط.
  - Source qualification Run `37201844919`, Job `111434981506` = **SUCCESS**.
- Live frontend drift audit:
  - كل top-level frontend assets طابقت repo baseline byte-for-byte ما عدا:
    - `config.js`
    - `employee-api-dispatcher-v1.js`
  - السبب: Production ظل على A61 dispatcher الأساسي، بينما candidate يحتوي Entry611 Native Auth Canary repo-only وغير منشور.
  - Live exact hashes قبل القطع:
    ```ini
    config.js=840d444e3469050a5724547a62103b3ef2cc2a77b151b37b430b85c31de54a31
    employee-api-dispatcher-v1.js=4f36ba86fccb5ef010bec7f77bb59932be01c63978f09e05dc17ad69ed106fa2
    ```
  - القرار: عدم نشر Entry611 Canary ضمن Ops؛ تم بناء patch فوق Live A61 نفسه.
- Controlled cutover Run #1:
  - Run `37202743542`, Job `111437583201`.
  - Preflight = PASS.
  - توقف **قبل أي D1 mutation أو frontend deploy** بسبب anchor هش في generator.
- Generator hardened in commit:
  - `fd1dc768e2393e1fc8ff356955ac322e4391c0aa`
- Controlled cutover Run #2:
  - Run `37202851769`
  - Job `111437912816`
  - conclusion = **SUCCESS**
- Pre-cutover state:
  ```ini
  PRODUCTION_API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  PRE_FRONTEND_VERSION=adfb5056-af23-4d7f-8e12-7de6417dfce2
  OPS=OFF
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  ORDERS=GENERAL_DUPLICATE_GUARD_PASS
  CUSTOMERS=GENERAL
  LINE_RUNTIME=PASS
  ```
- Mutation boundary:
  - only `employee_ops_control_v1` changed from OFF → READONLY.
  - API Worker deploy = NO.
  - Apps Script mutation = NO.
  - Secret write = NO.
  - Native Auth enable = NO.
  - Legacy Bridge enable = NO.
- READONLY runtime semantics were proved without using a real employee:
  - qualified read request reaches session verification and returns `401 employee-session-rejected` for the deliberately invalid probe token.
  - write request is blocked before auth with `503 employee-ops-readonly`.
  - therefore READONLY gate permits the approved read policy set and blocks writes.
- Frontend deploy was built from exact Live baseline:
  - Entry611 canary config/routing was explicitly excluded.
  - `MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE='READONLY'`.
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false`.
  - `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false`.
  - new frontend version:
    - `ad121526-8f86-4ce9-b13e-757c89810b06`.
- Final workflow postflight:
  ```ini
  OPS=READONLY
  AUTH=OFF
  BRIDGE=OFF
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  ORDERS=GENERAL_DUPLICATE_GUARD_PASS
  CUSTOMERS=GENERAL
  LINE_RUNTIME=PASS
  REFRESH_FIX=PASS
  ENTRY611_CANARY_DEPLOYED=NO
  ```
- Independent public API verification after the workflow:
  ```ini
  OPS_MODE=READONLY
  OPS_POLICY_EPOCH=2
  OPS_SCHEMA_READY=true
  OPS_GOOGLE_BUSINESS_CALLS=0
  OPS_APPS_SCRIPT_BUSINESS_AUTHORITY=false
  AUTH=OFF
  BRIDGE=OFF
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  ORDERS=GENERAL / duplicateGuardReady=true
  CUSTOMERS=GENERAL / customerCount=251
  LINE_RUNTIME=cloud-native+legacy-overlay
  ```
- Important gate before GENERAL:
  - source + control semantics are PASS, but a real authenticated employee-session read smoke must be completed from the Production UI before Ops writes are moved to D1.
  - do not enable Native Auth or Bridge for this smoke; use the existing employee session path.
  - do not promote Ops to GENERAL unless that authenticated READONLY smoke passes.
- التسجيل:
  ```ini
  STATUS=ENTRY617_OPS_READONLY_CUTOVER_PASS_PENDING_AUTHENTICATED_LIVE_READ_SMOKE_BEFORE_GENERAL
  RUN_ID=37202851769
  JOB_ID=111437912816
  WORKFLOW_COMMIT=fd1dc768e2393e1fc8ff356955ac322e4391c0aa
  PRODUCTION_API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  PRODUCTION_FRONTEND_VERSION=ad121526-8f86-4ce9-b13e-757c89810b06
  OPS=READONLY
  OPS_POLICY_EPOCH=2
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  ENTRY611_CANARY_DEPLOYED=NO
  API_DEPLOY=NO
  APPS_SCRIPT_TOUCHED=NO
  NEXT_ACTION=AUTHENTICATED_OPS_READONLY_LIVE_READ_SMOKE_THEN_PROMOTE_OPS_GENERAL_ONLY_IF_PASS
  ```


<!-- END_VERBATIM_MIGRATION:MASTER_ENTRY617 -->
