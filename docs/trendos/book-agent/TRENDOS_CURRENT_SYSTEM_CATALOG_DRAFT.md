# ترند مول | TrendOS
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
