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
