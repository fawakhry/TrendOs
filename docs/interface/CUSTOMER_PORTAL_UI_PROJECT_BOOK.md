# Matbagy Customer Portal UI — سجل مشروع واجهة العملاء

> **المسؤولية:** تنفيذ واجهة العملاء في TrendOS من داخل المستودع الأصلي، بالتنسيق مع Matbagy-OS وZero Google، مع المحافظة على جهة إنشاء الأوردر الحالية. هذا سجل تطوير واضح قابل للتسليم ولا يمنح صلاحية نشر إنتاج أو تشغيل استهلاك API تلقائيًا.
>
> **القرار المعتمد من المالك:** 31 أكتوبر 2026 — اعتماد الشكل الأزرق «مطبعجي» فقط، واستعمال محادثة طلب شبيهة بواتساب، وطلب دمج تغييرات الواجهة وتسجيل العمل في الكتب.
>
> **حالة الإصدار:** `SOURCE_UI_APPROVED`; `CUSTOMER_LIVE_ACTIVATION=OFF`; `CUSTOMER_SECURITY_GATE=NO_GO`; `OPENAI_PAID=OFF`.

## 1) نطاقي المعتمد

- واجهة العميل من تسجيل الدخول حتى فتح محادثة الأوردر، ورفع الصور والمستندات، وتحديد نوع المنتج والمقاس والعدد، وإضافة تعليمات العميل، ثم متابعة الأوردر.
- منتجات المرحلة الأولى: تابلوه، برواز، مج، تيشيرت، منديل، سوار، استيكر، دعوة/كارت، وأخرى. مقاسات معروفة كالمج 20×9 سم، مع إدخال القياسات النهائية بدقة وعدم اختراع قياسات للمنتجات التي تعتمد على خامة العميل.
- خصوصية صورة العميل: **الأصل غير قابل للاستبدال داخل وظيفة التصميم**؛ النسخ الناتجة عن AI منفصلة؛ الملامح والنصوص تُراجع بشريًا؛ لا يُعتَبر تغيير بيانات DPI تحويلًا حقيقيًا إلى 300 DPI.
- الهوية: «مطبعجي» الكهربائية الزرقاء + كحلي وأبيض، من غير Turbo DTF، أو مكتبة تصميمات منفصلة، أو «وارد نمذج الشات» في تجربة العميل.

## 2) الجهات المرجعية

| الجهة | المرجع | سلطة العمل |
|---|---|---|
| TrendOS | `index.html`, `app.js`, `Code.gs` + `docs/interface/MASTER_BOOK.md` | بوابة العميل والأوردرات الأصلية |
| الكتاب القديم النشط | `TrendOS_MASTER_BOOK.md` في `agent/trendos-book-audit-v1-20261014` | سجل الحالة الهندسية الجاري |
| كتالوج TrendOS الموحد | `docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG.md` | **مجمَّد للقراءة فقط**، الترحيل المصرح به منفصل |
| Zero Google | كتب وفرع `docs/zero-google-operator-book24-google-proxy-source-audit-20261031` | هجرة غير مثبتة للإنتاج؛ `0/9` مسارات العملاء مثبت تعطيلها |
| Matbagy-OS | `PROJECT_BOOK.md`, Draft #22/#23 | محرك التصميم الخاص، وليس بديلًا لقاعدة العملاء |

## 3) التنفيذ المعتمد

- [TrendOS PR #308](https://github.com/fawakhry/TrendOs/pull/308): صفحة عميل بالهوية الزرقاء ومسار أوردر جديد ظاهر، يفتح **المحادثة الأصلية** وليس فورمًا مكررًا.
- قائمة المنتجات في محادثة الأوردر، رفع الصور من مدخلات TrendOS الأصلية، حفظ قواعد المقاس والحفاظ على الصورة في ملاحظات البنود نفسها، بدون استدعاء مدفوع.
- تنظيف الصور المختارة محليًا وواجهات المعاينة والمعلومات الشخصية في الخروج/تغيير المسودة؛ دعم RTL والموبايل.
- **قفل تشغيل افتراضي:** `TRENDOS_CUSTOMER_CHAT_V1_ENABLED` لا يساوي `true` ⇒ لا تتفعّل الواجهة الجديدة، ولا يربط المصمم المستقل حدث إضافة البند، وتظل عناصر الهوية/المقاسات الجديدة `hidden`. تنسيقات الأزرق مقيدة بالفئة `html.matbagy-ui-enabled`. يسمح ذلك بدمج الكود إلى `main` بدون إعلان جاهزية نشره للعملاء.
- الاختبارات المصدرية فقط باستخدام Node.js، وبيانات تركيبية لا صور عملاء، ومراجعة للمسارات القديمة والمخاطر.
- المعاينات المرئية في محادثة المالك لا تتطلب API؛ ليست صورة من تطبيق Cloudflare المنشور.

## 4) المشكلات التي تمنع الإطلاق

1. **P0 / عرض أوردرات عميل آخر:** `Code.gs:getCustomerOrders_` يجيز مطابقة الاسم عند اختلاف كود العميل؛ يلزم تعديل سياسة ملكية الأوردر في Backend، واختبار عميلين يحملان الاسم نفسه مع أكواد مختلفة.
2. **P0 / الصور المشتركة بروابط عامة:** `Code.gs:uploadCustomerDraftFile_` يستخدم `ANYONE_WITH_LINK`؛ يلزم تخزين خاص ووصول مصدق ومحدد المالك، ومراجعة الملفات القديمة بدون تغيير جماعي غير معتمد.
3. **P1 / الحجم والملفات:** الحجم الفعلي بعد فك base64 غير مثبت في Backend؛ فشل رفع لاحق قد يترك بندًا جزئيًا؛ يلزم حد حجم حقيقي وإعادة إرسال آمنة.
4. **Zero Google:** آخر حالة موثقة `0/9` إيقافات مسارات العميل، وT12/المرفقات وأمر العامل الواحد BOOK24 ما زالت NO_GO. منع فتح مسار إنتاج موازٍ أو نقل قاعدة العملاء.
5. **Cloudflare Production:** أحدث نسخة معروفة `trendos-ui` لا تطابق كامل `main`. أي نشر يحتاج بصمة حية وdiff للأصول وصلاحيات وrollback واختبار عميلين وهميين مع موافقة نشر مستقلة.
6. **AI/الطباعة:** لا تحويل مدفوع ولا نسخة طباعة معتمدة قبل إذن المالك، فحص SHA للأصل، 300 DPI الفعلي، الدقة العربية ووجوه العملاء.

## 5) بروتوكول التسليم بين المحادثات

- اقرأ `docs/interface/MASTER_BOOK.md` وأحدث هذا السجل والكتاب القديم النشط ثم Zero Google، ولا تعتمد على ملخص شات قديم وحده.
- في كل تعديل: راجع أحدث HEAD وPR وCI، ضع تغييرًا محصورًا واختبره، وسجّل المشاكل والحدود الحقيقية دون ادعاء تشغيل خارجي.
- لا تكتب في كتالوج الكتاب الموحد المجمّد. لا تمس EasyStore، نظام الموظفين، الحسابات أو مسارات T12 الأصلية.
- حالة القفل عند الاعتماد: `UI_DESIGN=APPROVED`; `FRONTEND_RELEASE_SWITCH=OFF`; `BACKEND_PRIVACY=BLOCKED`; `PRODUCTION=NO_GO`. يجب تحديث هذه الحالة بدليل وليس بالاستنتاج.

## 6) سجل تسليم 2026-10-31

- المالك وافق على شكل بوابة العميل والمحادثة وطلب الدمج والحفظ في كل الكتب.
- جرى فحص HEAD/CI وفرق إصدار Cloudflare؛ **الدمج البرمجي مسموح فقط مع تفعيل واجهة العملاء الجديدة OFF**، إلى أن تُحل ثغرات الخصوصية. 
- تحديث حالة الدمج والاختبارات والبصمات النهائية مسجل في `docs/interface/MASTER_BOOK.md`، وسجل الكتاب القديم النشط بشكل مستقل.


## 7) تسليم الدمج إلى main — 2026-10-31

- **اعتماد المالك:** تم اعتماد تصميم مطبعجي الأزرق وتجربة الأوردر بمحادثة شبه واتساب، وطلب الدمج وتوثيق التنفيذ في كتب GitHub.
- **الدمج منفذ فعليًا:** PR #308 → `main`, merge SHA `f0a36fe40b757751bf98892fcaf771dd48641536`. مصدر التطوير النهائي `3651ea34ac89c2a3fb0eb67187df94d04bea80ea`؛ CI النهائي على المصدر قبل الدمج = SUCCESS، يشمل مسارات واجهة العميل الأصلية، تنقية الجلسة، حماية النص ومعلومات المنتج، وتعطيل الواجهة الحديثة افتراضيًا.
- **التشغيل:** `TRENDOS_CUSTOMER_CHAT_V1_ENABLED` غير مضبوط إلى `true` ⇒ قفل واجهة المنتجات الجديدة. Backend Customer Draft على Google/Apps Script لم يتغير. ليس مُعلنًا كتطبيق إنتاجي أو تكامل صور حقيقي؛ no API spend.
- **التوزيع:** GitHub Pages نشر تلقائي ممكن بعد merge (رصد Workflow جارٍ)، لكنه **ليس** إثبات نشر/اختبار Cloudflare `trendos-ui`. ليس هناك إذن تفعيل مستخدمين حقيقيين أو تجاوز الامتناع عن الصور.
- **باقي مسؤولية واجهة العميل:** P0 خصوصية قائمة الأوردرات والملفات، P1 الحجم الحقيقي + رفع متعدد دون بنود معلّقة، اختبار حسابين وهميين على Stage، ثم بصمة Cloudflare الدقيقة/rollback وتصريح إطلاق منفصل. ابدأ بإغلاق خصوصية backend قبل أي `UI_ENABLED=true`.
- **كتب مرتبطة:** `docs/interface/MASTER_BOOK.md` UI-LOG-015، و`TrendOS_MASTER_BOOK.md` على الفرع ACTIVE_WRITE، و`Matbagy-OS/PROJECT_BOOK.md` على فرع التطوير المختص، وكتاب Zero Google الجاري. لا كتابة في الكتالوج الموحد المجمد.


## 8) إصلاحات P0 في Stage فقط — PR #312 (2026-10-31)

**نتيجة الدمج النهائية:** PR #308 → `main` `f0a36fe40b757751bf98892fcaf771dd48641536`، واختبارات واجهة العميل نجحت؛ GitHub Pages نشر الأصول العامة تلقائيًا على Actions #41141540860 ثم #41141612661 (SUCCESS). **ليس** دليلًا على تغيير `trendos-ui` Cloudflare؛ لم يُنفذ Deploy Worker يدوي، ولا يوجد في الكود مفتاح تفعيل الواجهة الجديدة `true`.

**متابعة فعلية للأمان بعد الدمج:** [Draft PR #312](https://github.com/fawakhry/TrendOs/pull/312)، Head `8b343b94c4559232eac7659492c2d27aeb59f525`، على فرع `security/customer-portal-p0-private-media-stage-20261031`، **لم يُدمج في main، ولم يُنشر Apps Script**:
- `Code.gs:getCustomerOrders_` يعتمد كود العميل المطابق فقط، ولا يستخدم تشابه الاسم؛ يرفض القراءة إذا لم يوجد عمود كود العميل. يمنع كشف بيانات العملاء ذوي الأسماء المتطابقة لكنه قد يخفي أوردرات قديمة بلا كود حتى إكمال ترحيل موثق.
- `Code.gs:uploadCustomerDraftFile_` يتحقق من صيغة base64 وحجم البايتات الفعلي (25MB) ويمنع رفع الملفات إلى فولدر يعلن مشاركة عامة، ويطلب `DriveApp.Access.PRIVATE` + `DriveApp.Permission.VIEW` ثم يتحقق ويُرسل الملف الجديد للمهملات إذا فشلت الخصوصية. **لا يثبت صلاحيات المجلدات الموروثة أو المشاركة الفردية، ولا يمكن استبدال صور المعاينة العامة قبل وجود بروكسي قراءة مصدق.**
- اختبار Node يعزل ويشغّل دوال Apps Script الحقيقية بمحاكاة عميلين بنفس الاسم وكودين مختلفين، ورفع ملف إلى فولدر خاص/عام، وحالة فشل المشاركة، ومطابقة الحجم بعد فك التشفير. Source-only tests **PASS**: Actions #41141917009، #41141920196؛ اختبار واجهة العميل PR #41141920313 PASS.
- **قيد حقيقي لم يحل:** CI الحارس `TrendOS T12 A61 Apps Script Bridge Main CI` يرفض تعديل `Code.gs` خارج حدوده bridge-only (Actions #41141920267 = FAIL). لا نلغي هذا الحارس أو نتجاوز الحماية لمجرد نجاح اختبارات Stage. إصلاح P0 يحتاج طريق نشر/فرع ملكية Backend معتمد وفحص Google Drive حقيقي على بيانات وهمية، بعدها مراجعة الترحيل والـLive parity.

**الحقيقة:** `UI_SOURCE=MERGED` / `NEW_UI_ENABLED=OFF` / `P0_SECURITY_STAGE=MOCK_TEST_PASS_BUT_BRIDGE_GUARD_FAIL` / `APPS_SCRIPT_PRODUCTION_UNCHANGED` / `ZERO_GOOGLE_CUSTOMER_RETIRED=0/9` / `OPENAI_PAID=OFF` / `CUSTOMER_RELEASE=NO_GO`.

**الأولوية التالية:** إعداد خدمة عرض صور خاصة بموافقة المالك أو استخدام عقد Zero Google R2 المؤهل عند جاهزيته؛ ثم مسار تصحيح Backend مؤهل واختبار حسابين وهميين متطابقي الاسم، واختبار صلاحيات الفولدر الموروثة، ثم إصدار Cloudflare guarded بعد تصريح جديد.


## 9) قرار المالك: تفعيل ودمج الواجهة بشرط إثبات تشغيلها وأمانها — 2026-10-31

**قرار المستخدم الصريح:** «اه طالما شغالة يبقى ادمج وسجل» بعد طلب عرض البوابة فعليًا داخل TrendOS. يُفسَّر هذا كاعتماد **مشروط** لتفعيل النسخة الجديدة عند إثبات نجاحها في التشغيل الحقيقي وفحوصات الخصوصية، لا كتنازل عن شروط الأمان ولا كإذن بتعديل قاعدة العملاء أو مشاركات صورهم أو الدفع تلقائيًا.

**إعادة التحقق الفعلي في هذه النقطة:**
- [PR #308](https://github.com/fawakhry/TrendOs/pull/308) = MERGED إلى `main`, merge SHA `f0a36fe40b757751bf98892fcaf771dd48641536`. صفحة GitHub Pages بنَت الملفات بنجاح، آخر Run مثبت #41142077873 عند Source HEAD `122fc695b1a74ec1995ca4abbb8a4822d61043f3`. لا يُساوي هذا اختبار تشغيل `trendos-ui` أو اعتماد Backend.
- التصميم الجديد ما زال `TRENDOS_CUSTOMER_CHAT_V1_ENABLED !== true`، ولا توجد شهادة حماية ملفات العميل أو توجيه صلاحيات وسيط قراءة خاص به.
- [Security PR #312](https://github.com/fawakhry/TrendOs/pull/312) = OPEN/DRAFT، لم يُدمج؛ Source Mock tests PASS ولكن `TrendOS T12 A61 Apps Script Bridge Main CI` FAIL على `Code.gs` bridge-only boundary (#41141920267). لم نعدّل الحارس ولم ننشر Apps Script.
- مشكلتا P0 على Backend الأصلي كما وردتا في UI-LOG-012 و#312: مطابقة الاسم بدل كود العميل في بعض أوردرات `getCustomerOrders_`، وروابط صور عامة `ANYONE_WITH_LINK` في `uploadCustomerDraftFile_`. كما أن حفظ الصور في Google Drive لم يُرحّل ويُثبت عزله؛ Zero Google = 0/9 customer actions retired last proven.

**قرار تنفيذ صالح الآن:** `UI_CODE_MERGED=YES`، `DESIGN_APPROVED=YES`، `FRONTEND_ACTIVATION=NO_GO`، `CLOUDFLARE_DEPLOY=NOT_DONE`، `BACKEND_PRIVACY=NOT_CERTIFIED`، `API_PAID=OFF`. لا يجوز استخدام نجاح CI أو Pages لإعلان البوابة الجديدة «شغالة للعملاء». لا نغير أي Customer/Order/Files production data.

**اختبارات التفعيل المطلوبة:** (1) مراجعة صلاحيات ملكية الأوردرات مع عميلين وهميين لهما الاسم نفسه؛ (2) اختبار Google Drive/R2 بصور تركيبية وإثبات رفض الوصول غير المصرح وإصلاح المعاينات الخاصة؛ (3) تسوية تعارض A61 من جهة مالك Backend المعتمدة بدون تعطيل الحارس؛ (4) اختبار تسجيل الدخول ومحادثة المنتج والرفع وتسجيل الأوردر في Stage مع صورة وهمية؛ (5) بصمة أصول Cloudflare المباشرة ونسخة Rollback وخطة إصدار محددة؛ (6) بعد النجاح، تشغيل محادثة التصميم فقط، مع OpenAI المدفوع والطباعة الآلية OFF حتى اجتياز بوابات مستقلة.

**سجل المالك:** الاعتماد المشروط محفوظ؛ لا حاجة لإعادة طلب موافقة على الألوان أو بنية الشات. أي قرار نشر فعلي عالي التأثير يراجع حالة الـStage والعميل/الصور والإنتاج وقت التنفيذ.


## 10) تجاوز تعارض A61 دون تغيير Code.gs — مرشح أمان في الذاكرة (2026-10-31)

- **استكمال تنفيذ فعلي:** تم إعادة `Code.gs` في [Draft PR #312](https://github.com/fawakhry/TrendOs/pull/312) إلى نسخة `main` الأصلية **حرفيًا**. لم نلغِ أو نضعّف أو نعدّل حارس A61؛ هو لا يطبَّق على PR312 الحالي لأن الملف المحمي لا يتغير في الـDiff. هذا ليس شهادة اعتماد للنشر، بل فصل مبدئي للمسؤوليات.
- **بديل قابل للمراجعة والاختبار:** `customer-portal-p0-stage-patch.cjs` يُكوّن في الذاكرة فقط نسخة مرشحة للدالتين `getCustomerOrders_` و`uploadCustomerDraftFile_`. يعمل بصيغة `--dry-run` فقط مع فحص توافق المقاطع حرفيًا وSHA256، ويُسجل `SOURCE_CODE_GS_UNMODIFIED=YES`، ولا يكتب `Code.gs` أو ينشر Apps Script.
- **محتوى مرشح الأمان:** (أ) منع استعلام أوردرات آخرين بسبب تشابه الاسم، مع اشتراط مطابقة كود العميل؛ (ب) منع رفع ملف إلى بند مسودة لا يطابق كود العميل؛ (ج) فحص Base64 وحجم الملف الفعلي؛ (د) رفض فولدر معلن كمشارك، والتحقق من خصوصية الملف الجديد، ومحاولة نقله للمهملات في حالة الفشل. **تحذير:** `DriveApp.getSharingAccess(PRIVATE)` ليس دليلًا على غياب الصلاحيات الموروثة أو المشاركة الفردية، ومعاينات Drive الحالية تحتاج وسيط قراءة مصدقًا.
- **اختبارات GitHub على HEAD `a90489eba8ca4240a9632d7b860a96daf3ddbb4f`:** Actions push #41197389879 = PASS، PR security #41197393972 = PASS، واجهة العميل PR #41197393951 = PASS؛ اختبارات بمحاكاة مستخدمَين لهما الاسم نفسه وكودان مختلفان، ومحاولات رفع ملف إلى بند مستخدم آخر، وفحص الحجم والرفض/التراجع الوهمي.
- **فحص مباشر read-only للواجهتين:** الموقع `trendos-ui.trendmall-contact.workers.dev` ما زال يعرض «دردشة الطلب» القديمة، في حين GitHub Pages `fawakhry.github.io/TrendOs/` يحتوي عناصر Matbagy الزرقاء الجديدة **مخفية افتراضيًا**. لا يوجد إثبات تشغيل جديد للعملاء، ولا جرى تشغيل `TRENDOS_CUSTOMER_CHAT_V1_ENABLED=true`.
- **حالة حقيقية:** `FRONTEND_MERGED=YES`, `SECURITY_STAGE_MOCK_PASS=YES`, `CODE_GS_PRODUCTION_UNCHANGED=YES`, `A61_GUARD_INTACT=YES`, `PRIVATE_MEDIA_LIVE_E2E=NOT_RUN`, `CLOUDFLARE_DEPLOY=NO`, `PAID_OPENAI=OFF`, `CUSTOMER_RELEASE=NO_GO`.
- **الخطوة التالية:** تحديد مسار تطبيق Backend بإدارة موثقة من مالك النظام دون تجاوز A61، وتأمين عرض الصور الخاصة، واختبار حسابين وصور تركيبية على بيئة معزولة بتصريح خدمة حقيقي، ثم مقارنة بصمة Cloudflare وجدول تراجع. لا تفتح البوابة الآن ولا تنقل قاعدة العملاء.


## 11) إنجاز PR312 وPR313 في main — أدوات الأمان وقفل جاهزية التشغيل (2026-10-31)

**قرار التنفيذ الفعلي:** استكمال المالك «كمل»؛ تم دمج حزمتين مصدرّيتين آمنتين فقط، دون تشغيل عميل أو تعديل Google Apps Script أو Cloudflare:
- [PR #312](https://github.com/fawakhry/TrendOs/pull/312) `MERGED` → `main` SHA `d8de3171de7d95ac862f07899861f6aaae9f54ae`: ثلاث ملفات جديدة فقط (سكريبت `customer-portal-p0-stage-patch.cjs` لتجهيز مرشح Backend في الذاكرة و`tests/customer_portal_p0_private_media_stage.test.cjs` وWorkflow CI). **ملف `Code.gs` لم يتغير إطلاقًا** بعد إعادة ضبطه، وحارس T12 A61 ظل كما هو. CI لـStage وواجهة العميل PASS على HEAD `a90489eba8ca4240a9632d7b860a96daf3ddbb4f`. المرشح يقترح حماية ملكية أوردر وملف المسودة وحجم البايت وفحص مجلد Drive الخاص، لكنه **ليس إصلاحًا منشورًا أو مثبتًا على Google Drive**.
- [PR #313](https://github.com/fawakhry/TrendOs/pull/313) `MERGED` → `main` SHA `1c023663ee9517ae9ae993ee9408371a43342616`: `customer-portal-readiness-audit-v1.cjs` + اختبارات + Workflow. أداة محلية للقراءة فقط تقارن كود المصدر بتوقعات ملكية أوردر/خصوصية الصور وتفعيل UI، ثم تُخرج **`NO_GO` قسريًا** حتى لو كانت تعديلات المصدر سليمة؛ تحتاج شهادة Backend حي/صلاحيات صور/اختبار حسابين/بصمة Cloudflare/Zero Google وفحص ملفات. `--require-go` يخرج بخطأ مقصود إذا محاولة إصدار غير مؤهل. اختبارات push/PR كلها PASS على HEAD `293aa82742f981618dd13ffdcae7d6a3df788c5f`.
- **Zero Google reuse:** على Zero Google [Draft PR #311](https://github.com/fawakhry/TrendOs/pull/311) توجد وحدة `cloudflare-d1/src/customer-portal-native-draft-file-r2-v0.mjs` من Entry666: PRIVATE R2، session D1/HMAC، ملكية مسودة وبند، SHA256، body cap 5MiB، PENDING/READY، default OFF، لا رابط عام ولا route لتنزيل. وحدة `cloudflare-d1/customer-stage/private-r2-integrity-ro-v0.mjs` تراجع التطابق دون رد بايتات، وMigration 0040 يفرض `QUARANTINED`, `scan_completed=0`, `print_release_authorized=0` وimmutable؛ **لا تسمح الحالية بتأكيد CLEAN أو إتاحة معاينة محتوى خاص من R2**. لذلك لا تبنِ media-download proxy موازيًا أو تخطِّ فحص scanner. لا يتم تغيير PR311 دون مراجعة مالكه.
- **فارق قابلية المنتج:** R2 source يحدد 5MiB للملف، بينما بوابة Google القديمة تصل 25MB. التوافق غير مثبت، وليس من الصحيح تفعيل رفع العملاء قبل تصميم chunk/multipart آمن أو اعتماد الحد الجديد بقرار واضح.
- **نتيجة حقيقة:** Source merge لـ#308,#312,#313 = نعم؛ GitHub Pages قد ينشر الأصول تلقائيًا، لكن `trendos-ui` Cloudflare لا يساوي GitHub Pages ولم يتم تشغيل Flag `TRENDOS_CUSTOMER_CHAT_V1_ENABLED=true`، ولم يتغير Backend Google/ملفات العملاء. `CUSTOMER_GO_LIVE=NO_GO`, `PRIVATE_MEDIA_RUNTIME_E2E=NO`, `ZERO_GOOGLE_CUSTOMER_ACTIONS_RETIRED=0/9_LAST_PROVEN`, `OPENAI_PAID=OFF`.
- **الخطوة القادمة:** مسار Backend معتمد لتطبيق إصلاح الملكية والخصوصية، وفحص حالة ACL على حساب اختبار حقيقي مع دور محروم، ثم وسيط عرض مصدق لملف بعد scanner وproof خاص؛ تنفيذ Stage حسابين ومرفقين وهميين، وبعدها بصمة نشر Cloudflare وrollback. لا تعمل migration أو deploy أو دفع أو بيانات حقيقية تلقائيًا.


## 12) عرض حالة الملف لصاحبه فقط — Source-only PR #314 (2026-10-31)

**آخر تنفيذ:** أُنشئ [Draft PR #314](https://github.com/fawakhry/TrendOs/pull/314) فوق فرع [Zero Google PR #311](https://github.com/fawakhry/TrendOs/pull/311) بدل عمل Backend صور جديد أو لمس خطوط إنتاج TrendOS. الفرع `feature/customer-private-preview-status-off-20261031`، HEAD `15a0e8ff69ff36830199388eb928ec401b7677ab`.

- وحدة `cloudflare-d1/customer-stage/private-file-status-ro-v0.mjs` توضح للعميل المعتمد حالة الملف الخاص به فقط (`STORED_QUARANTINED` أو `UPLOAD_PENDING_QUARANTINED`) عبر D1 Native HMAC session ثم ربط customer_id بالمسودة والبند والملف وتطابق سجل Quarantine 0040. تُعاد مراجعة الجلسة بعد القراءة. **لا ترجع صورة ولا بايتات ولا SHA ولا object key ولا رابط، ولا تفتح R2 أصلًا.** كل الاستجابات تقول `previewAvailable=false`, `scanCompleted=false`, `printReleaseAuthorized=false`؛ حالة READY لا تعني أن المرفق فُحص أو أُذن بطباعته.
- تجريبي OFF: لا Import في Worker الإنتاج، لا R2 Binding، لا D1 migration، لا إطلاق Route، لا Google fallback، ولا استهلاك API. أعلام `TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED` OFF و`TRENDOS_CUSTOMER_CHAT_V1_ENABLED` OFF. هذا ليس منفذ معاينة صور فعليًا.
- تحقق Node وهمي لعميلين + سحب صلاحيات الجلسة وOrigin/طرق غير مصرح بها، و**SQLite حقيقي داخل الذاكرة** بالـmigrations والبيانات الوهمية الموجودة في Entry666 و0040: عزل صاحب المسودة والملف، رفض المسودة المرسلة/الملغاة، ثبات الحجر وعدم كتابة T12.
- CI مؤكد على Source HEAD: push [#41204473318](https://github.com/fawakhry/TrendOs/actions/runs/41204473318) **SUCCESS** وPR [#41204477642](https://github.com/fawakhry/TrendOs/actions/runs/41204477642) **SUCCESS**؛ 6 اختبارات Node و5 اختبارات SQLite معزولة. التوثيق الأصلي في `docs/trendos/zero-google/CUSTOMER_PRIVATE_FILE_STATUS_OFF_20261031.md` على فرع PR314.
- **الحواجز:** لا نقدر نعرض نفس الصورة للعميل بأمان حتى يتثبت scanner attestation حقيقي وليس مجرد ملاحظة offline، وسلامة SHA للبايتات من R2، ووسيط قراءة خاص ومصادق ومحدود الصلاحية، واختبار عميلين على Stage بمرفقات وهمية. Existing Google Drive ANYONE_WITH_LINK على backend القديم ما زال خطورة محتملة، Zero Google customer retirement آخر مؤكد 0/9، وR2 المصدر 5MiB بدل 25MB القديم.
- **الحقيقة:** `CUSTOMER_UI_SOURCE=MERGED`؛ `SOURCE_STATUS_LANE=STAGED_TESTED_DRAFT`؛ `PRIVATE_IMAGE_VIEWER=NOT_IMPLEMENTED`؛ `PRODUCTION_GO_LIVE=NO_GO`؛ `REAL_CUSTOMER_MEDIA_UNTOUCHED`؛ `PAID_OPENAI=OFF`. الإضافة ملكية مسار Zero Google PR311 ولا تُدمج مباشرة إلى `main` بدون مراجعة التكامل.


## 13) دمج حالة المرفقات واختبار HTTP/D1 متكامل داخل Zero Google — 2026-10-31

**تنفيذ جديد ومثبت:** تم إكمال ودمج [PR #314](https://github.com/fawakhry/TrendOs/pull/314) إلى فرع `integration/zero-google-one-package-v1-20261031` فقط (merge `dc9068e06ecfb0e1fb56b1185bcfdfe57cdad251`)؛ ثم [PR #315](https://github.com/fawakhry/TrendOs/pull/315) إلى نفس الفرع (merge `7827ea06e68704ae518679a8c35da2d551384190`). **ليس `main` ولم يتم تفعيل مسار عميل أو Worker حي.** Zero Google PR #311 يظل Draft/owner-controlled.

- PR314: مسار قراءة حالة المرفق لمالكه فقط من D1 Native HMAC session + file/draft/item + immutable quarantine. لا تظهر صورة أو bytes أو SHA أو R2 object key أو رابط، ولا يتم طلب R2. الفلاج OFF وغير مربوط بالـWorker.
- PR315: أول **اختبار تكامل محلي من HTTP الأصلي حتى قاعدة SQLite مبنية من migrations الفعلية**؛ Python ينشئ قاعدة وهمية بها حسابان مختلفان بالاسم الظاهر نفسه، token HMAC لكل واحد، ومسودتان وبندان وملفان في الحجر. Node 22 `node:sqlite` يمرر الاستعلامات إلى `handleCustomerPrivateFileStatusStageV0`. تأكد رفض عميل B ملف A، والجلسة المسحوبة، والمسودة المرسلة، وغياب quarantine schema، وطلبات Origin المختلفة، وعدم تسريب أية URLs أو bytes أو تغيير أوردرات T12.
- الاختبارات: PR315 [push #41220581158](https://github.com/fawakhry/TrendOs/actions/runs/41220581158) PASS، [PR #41220603613](https://github.com/fawakhry/TrendOs/actions/runs/41220603613) PASS، [فحص الحالة #41220603610](https://github.com/fawakhry/TrendOs/actions/runs/41220603610) PASS، [A61 #41220603665](https://github.com/fawakhry/TrendOs/actions/runs/41220603665) PASS؛ Source HEAD `96ff382bc89b0d5075804c184d050c8cbcac84b0`. تم توثيق التقدم داخل ملف PR311: `docs/trendos/zero-google/CUSTOMER_PRIVATE_FILE_STATUS_OFF_20261031.md`.
- **الحواجز الحقيقية لم تتغير:** الفحص ليس جلسة حقيقية على Cloudflare أو R2/GDrive؛ scanner attestation ليس مصدّقًا، لا طريقة إرجاع صورة خاصة بموافقة العميل، لا رفع 25MB مكافئ، Live Apps Script P0 لم يعالج، Zero Google `CUSTOMER_GOOGLE_ACTIONS_RETIRED_LAST_PROVEN=0/9`. `CUSTOMER_CHAT_V1_ENABLED=OFF`, `NATIVE_STATUS_LIVE=OFF`, `PRIVATE_IMAGE_VIEWER=NO`, `CUSTOMER_PRODUCTION=NO_GO`, `OPENAI_PAID=OFF`.
- **المتابعة التالية:** تأهيل pipeline فحص الصور قبل read bytes وإصدار مصدر موثوق attestation + private viewer read-once/tenant-bound، ثم حسابين ببيانات وهمية في Cloudflare Stage مع D1/R2 منفصلة وAccess، مع بصمة الـWorker وخطة تراجع. لا تغييرات في بيانات الإنتاج ولا فتح روابط الصور الحالية.
