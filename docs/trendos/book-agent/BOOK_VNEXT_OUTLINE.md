# TrendOS Current System Catalog — خطة إعادة بناء الكتاب بالكامل من الغلاف
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
1. `TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md`: **الكتاب نفسه** من الغلاف، يضاف إليه كل قسم بعد مراجعته؛ لا يُسوّق كمكتمل.
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
