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

## 14) كشف عملي لمشكلة البند الجزئي عند فشل المرفقات — 2026-11-01

**النطاق:** استكمال ملف واجهة العملاء من أحدث `main` دون تعديل `app.js` أو `Code.gs` أو تفعيل واجهة أو اعتماد إطلاق. الفرع: `feature/customer-portal-p1-partial-upload-audit-off-20261101`.

- مراجعة الكود الأصلي أكدت أن `addCustomerDraftItem()` يرسل `addCustomerDraftItem` إلى الخادم **قبل** `uploadFilesForDraftItem()`. عند فشل رفع أحد المرفقات يُنشأ بند في الخادم، لكن لا يُضاف لقائمة البنود المحلية؛ وعند إعادة الإرسال يمكن إنشاء بند آخر. هذه مخاطرة **P1 قائمة** وليست إصلاحًا أُنجز.
- تمت إضافة اختبار Node بمعطيات وهمية يقتطع الدالة الأصلية من `app.js` ويشغلها داخل VM مع API معزول؛ يحقن فشل رفع بعد إنشاء البند، ثم يُعيد المحاولة ويتحقق من وجود بندين وهميين في الخادم وبند واحد في الحالة المحلية. **لا اتصالات حية ولا صور أو حسابات فعلية.**
- `customer-portal-readiness-audit-v1.cjs` أصبح يكشف ترتيب إنشاء البند قبل المرفقات داخل `sourceObservations.createsItemBeforeAttachmentUpload`، ويحافظ على `sourceChecks.draftUploadRecovery=false` وعوائق صريحة للتراجع وidempotent retry وE2E. يجب ألا تُقرأ عبارة PASS للاختبار كحل لمشكلة الرفع؛ هي إثبات تكاثر حالة الفشل.
- Workflow `customer-portal-readiness-audit-v1.yml` شُمل فيه الاختبار الجديد. نتيجة GitHub Actions / رقم PR تُضاف بعد التحقق؛ هذا القيد **NO_GO** حتى يثبت تنفيذ Backend ذري/مستأنف يربط itemId والملفات بمفتاح idempotency محفوظ، واختبار ربط D1/R2 بالمسودة والعميل ومراجعة حد 5MiB مقابل 25MB.
- تبقى قرارات المالك السابقة: الأزرق معتمد؛ الواجهة الجديدة OFF، إصلاح `Code.gs` لم يُنشر؛ Zero Google `0/9` إيقافات مثبتة آخر مرة؛ منع صورة عامة أو معاينة دون scanner attestation؛ Cloudflare إنتاج لم يُنشر من هذا العمل؛ `OPENAI_PAID=OFF`, `CUSTOMER_PRODUCTION=NO_GO`.

- **سجل CI وسبب التصحيح:** PR #317 أول فحص على HEAD `c2753fc02a172453f7599d6edb1056720bf800bb`: اختبار Guided Chat نجح (Run #41294022011)، اختبار Stage P0 نجح (#41294021990)، لكن Readiness Audit فشل (#41294021988) بسبب `ensureCustomerDraftStarted` غير معرّفة في VM الاختباري بعد نجاح الرفع الوهمي. هذه دالة من `app.js` الأصلية ولم تتغير في الإنتاج؛ أُضيف mock للدالة في الاختبار فقط وأُعيد تشغيل CI على commit أحدث. لا تُعتبر المحاكاة ناجحة إلا بعد إثبات PASS الجديد.

**إغلاق دورة CI بعد تصحيح mock:** على HEAD `1cf5642b0ced98e4cb8c06d3e00f7e3d920344d3`: [Readiness Audit #41294089418](https://github.com/fawakhry/TrendOs/actions/runs/41294089418) = **SUCCESS** (يشمل فشل الرفع الاصطناعي وإعادة المحاولة)، [P0 Security #41294089421](https://github.com/fawakhry/TrendOs/actions/runs/41294089421) = **SUCCESS**، [Customer Chat #41294089391](https://github.com/fawakhry/TrendOs/actions/runs/41294089391) = **SUCCESS**. أُغلقت مشكلة الاختبار التجريبي فقط؛ مشكلة P1 الإنتاجية لم تُصلَح. التغيير [PR #317](https://github.com/fawakhry/TrendOs/pull/317) مصدر/تقارير فقط، و`CUSTOMER_GO_LIVE=NO_GO`. ستُراجع نتيجة HEAD النهائية قبل الدمج.

## 15) إغلاق PR #317: كشف P1 ودمج اختبارات المصادر — 2026-11-01

- **تم الدمج إلى main فعليًا:** [PR #317](https://github.com/fawakhry/TrendOs/pull/317)، Squash merge SHA `14c327570400113d78a425c5cb94f5cb2db79678`، آخر HEAD اختُبر قبل الدمج `e66118af17567a5997b23b479238f783e59d8c74`.
- **CI النهائي على Source HEAD المختبر:** [Readiness #41294151193](https://github.com/fawakhry/TrendOs/actions/runs/41294151193) SUCCESS، [Customer Guided Chat #41294151245](https://github.com/fawakhry/TrendOs/actions/runs/41294151245) SUCCESS، [P0 private-media Stage #41294151219](https://github.com/fawakhry/TrendOs/actions/runs/41294151219) SUCCESS. هذه اختبارات مصادر فقط، وليست Live Cloudflare ولا اعتماداً لرفع ملفات العملاء.
- **الملفات الفعلية المُضافة/المُحدثة:** فحص جاهزية `customer-portal-readiness-audit-v1.cjs`، اختبار محاكاة فشل الرفع وإعادة المحاولة `tests/customer_portal_partial_upload_stage_audit.test.cjs`، فحوصات نفس الأداة، Workflow، وكتابي الواجهة والرئيسي. لم يتغير `app.js` أو `Code.gs`.
- **نتيجة القضية P1:** أكدت المحاكاة إمكانية تكرار بند backend عند فشل إرفاق ملف ثم إعادة المحاولة، وأبقت تقرير الفحص `NO_GO`. **المشكلة نفسها غير محلولة**؛ لا backend idempotent retry أو atomic rollback مفعّل، ولا اختبار مرفقات D1/R2 مباشر.
- **خطوة التنفيذ التالية:** ضمن مالك Zero Google PR #311، مراجعة عقد Entry665 للبنود idempotent وEntry666 للملفات والحجر؛ تصميم استئناف/إتمام مضمون لكل بند ومرفق وربط صلاحيات المالك في Stage، والتحقق من 5MiB/25MB ومراجعة مسار النسخ الخاصة. لا إنشاء Backend موازي، لا تشغيل العملاء، لا تعديل ملفاتهم، ولا Google/Cloudflare deploy تلقائي. `CUSTOMER_LIVE_ACTIVATION=OFF`, `OPENAI_PAID=OFF`, `CUSTOMER_SECURITY_GATE=NO_GO`.

### مراجعة مسار Zero Google المعتمد بعد الدمج (read-only، 2026-11-01)

- [Zero Google Draft PR #311](https://github.com/fawakhry/TrendOs/pull/311) ظل **OPEN/DRAFT** عند الفحص؛ المرجع `integration/zero-google-one-package-v1-20261031` HEAD `0ff6ce9f1dfcc5d9dba319c13bd6a6c553f40009`. لم يُعدَّل الفرع.
- فُحصت وحدة `cloudflare-d1/src/customer-portal-native-draft-item-v0.mjs` الحالية: Entry665 يستخدم `requestKey` وربط payload HMAC؛ الإعادة المطابقة ترجع نفس itemId مع `alreadyAdded=true`، وليس بندًا جديدًا، طالما ظل سياق ملكية العميل والمسودة مصدقًا.
- فُحصت وحدة `cloudflare-d1/src/customer-portal-native-draft-file-r2-v0.mjs` الحالية: Entry666 يستخدم مفتاح idempotency لكل ملف، ومراجعة مالك D1، وR2 خاص حتى 5MiB؛ التكرار المطابق لسجل `READY` يرجع `alreadyUploaded=true`. إذا بقي السجل `PENDING` تُرفض الإعادة التلقائية بـ409 `CUSTOMER_FILE_PENDING_RECONCILIATION` بدلاً من إعادة كتابة مشكوك فيها.
- `cloudflare-d1/src/customer-portal-native-r2-pending-audit-v0.mjs` (Entry675) **موجود بالفعل**: فحص `PENDING` للملف في D1 و`R2.head` بعد مرور 15 دقيقة، للقراءة فقط؛ لا يفحص SHA للبايتات كاملة ولا يسمح بقلبه READY أو بحذفه.
- **قرار منع الازدواج:** لا نبني نظام file writer أو pending reconciler مكررًا. المطلوب التالي ربط واجهة العميل بنفس requestKey/itemId من أول محاولة، مع تعليمات آمنة لحالات 409 والاحتفاظ بمعلومات الاستئناف دون token، ثم اختبار عميلين وهميين على Stage. الـNative handlers كلها source-only OFF وغير معتمدة أو منشورة. `CUSTOMER_GO_LIVE=NO_GO`.

## 16) وحدة استئناف رفع Native معزولة عن الإنتاج — 2026-11-01

**المالك طلب «كمل» بعد تسليم PR317.** تم قراءة الكتاب الحالي وتحديثات `main`، وفحص العقود الفعلية من Zero Google Draft #311 على `integration/zero-google-one-package-v1-20261031`. تم إنشاء فرع `feature/customer-native-upload-coordinator-off-20261101` من أحدث main بدون تعديل PR311 أو مسار Backend حي.

**تطوير مصدر فعلي دون تفعيل:**
- `customer-native-upload-coordinator-off-v0.js`: منسق محلي مستقِل **غير مربوط بـ index.html/app.js** ولا يحتوي أي fetch أو HTTP endpoint أو sessionStorage/localStorage. يطالب بحقن transport خارجي و`getActiveOwnerId` من جلسة Native موثقة مستقبلًا؛ مجرد التطابق المحلي لا يغني عن إثبات ملكية D1 على الخادم.
- يُصدر requestKey عشوائيًا آمنًا (128-bit lowercase hex) *مرة واحدة* للبند وواحدًا منفصلًا لكل ملف، ولا يغيّره عند إعادة المحاولة اليدوية. يتبع عقد Entry665 `requestKey` داخل JSON لإنشاء البند وعقد Entry666 `x-idempotency-key` للملف في أي Adapter يُبنى لاحقًا.
- يقبل فقط محتوى PNG/JPEG/PDF مطابقًا لتوقيع أول بايتات وبحد **5MiB لكل ملف و5 ملفات لكل بند** في نسخة R2 الحالية، ويحفظ نسخة من البايتات في الذاكرة فقط. لا تُنسخ بيانات/صور العملاء إلى تخزين دائم ولا تُحفظ صلاحيات bearer أو password.
- لو فقدنا رد إنشاء البند، تسمح إعادة المحاولة **بنفس مفتاح البند**، مستندةً إلى عقد الخادم idempotent الموجود ولكن غير المنشور. لو فشل ملف بعد احتمال الكتابة، تتوقف عند `FILE_UNCERTAIN` وتحتاج إعادة محاولة صريحة *بنفس مفتاح الملف*، دون إنشاء بند إضافي أو إعادة ملفات ناجحة.
- في حالة `CUSTOMER_FILE_PENDING_RECONCILIATION` (HTTP 409) أو تعارض ملكية/مفتاح، تغلق الإعادة التلقائية وتطالب بمراجعة مستقلة؛ لا تنتقل إلى الملف التالي. ترفض إيصالات الملفات التي تحتوي URL عام، أو لا تثبت `privateObject=true`، أو تطلب إنشاء أوردر رسمي من هذا المسار. تغيير صاحب الجلسة يُتلف النسخ المؤقتة ويوقف الاستكمال.
- **مهم:** لا استئناف بعد Reload للصفحة؛ النسخة الحالية In-memory ومقفولة، فلا نُعلن وعدًا غير مثبت. تنفيذ Session reload مع إثبات هوية وملفات معاد اختيارها، وقيود scanner/quarantine والـStage R2/D1 الحقيقي ما زال مطلوبًا.
- الاختبارات `tests/customer_native_upload_coordinator_off_v0.test.cjs` تستخدم بيانات تركيبية فقط، وتغطي ربط محاولتين بنفس المفتاح، ملف رقم N، حالة PENDING، عميل مختلف، فشل MIME/الحجم والتوقيع، تزامن ضغطة الإرسال، وعدم ربط الواجهة/عدم وجود API حي.
- أُضيف الاختبار وSyntax check إلى workflow الجاهزية القائم. **مصدر تجريبي OFF؛ لا تفعيل عميل، لا Google fallback، لا Cloudflare، لا T12/EasyStore/Code.gs، لا Paid API.** لا يعتبر نجاح الاختبار وحده إثباتًا لعمل نقل ملفات في Worker أو Backend.
- نتيجة CI والـPR والدمج تُسجّل بعد التنفيذ والتحقق. `NATIVE_UI_TRANSPORT=UNWIRED`، `CUSTOMER_PRODUCTION=NO_GO`.

**مراجعة التوافق مع النقل الأصلي قبل الدمج:** تبين في فرع Zero Google #311 أن `customer-native-browser-transport-v0.js` موجود في **جذر المستودع** بالفعل، يفعّل فقط قراءة الطلبات/بعض البيانات العامة عند Flag منفصل ويمنع باقي عمليات الكتابة Native برسالة `CUSTOMER_NATIVE_ACTION_NOT_WIRED`. لا نعتمد على transport جديد منافس، ولا نربط coordinator بهذا dispatcher قبل أن يتأهل موجوده للكتابة ويثبت D1 session/owner/Worker routes. وحدة الاستئناف الجديدة مستقلة لتُستهلك لاحقًا داخل العقد الأصلي ولا تستخدم Token أو Google fallback.

**CI على commit ابتدائي موثق:** [Readiness #41300139702](https://github.com/fawakhry/TrendOs/actions/runs/41300139702) PASS، [P0 Stage #41300139691](https://github.com/fawakhry/TrendOs/actions/runs/41300139691) PASS، [Guided Chat #41300139587](https://github.com/fawakhry/TrendOs/actions/runs/41300139587) PASS على HEAD `39d2fa9049f0208e54d47c197156cd27dc56aaf8`. مراجعة HEAD النهائية لازمة قبل الدمج.

## 17) اعتماد دمج PR #318 ونتيجة CI النهائية — 2026-11-01

- [PR #318](https://github.com/fawakhry/TrendOs/pull/318) **MERGED إلى main** عند Squash SHA `f9ae522e1d2414b6864d6de6c3154cd88fde728e`، وآخر HEAD اجتاز الاختبارات قبل الدمج `0d7f248ceac2bf1ec4f9fb8b803bacefe90c1cab`.
- **النتائج على HEAD الأخير:** [Readiness #41300255472](https://github.com/fawakhry/TrendOs/actions/runs/41300255472) SUCCESS؛ [P0 private-media #41300255509](https://github.com/fawakhry/TrendOs/actions/runs/41300255509) SUCCESS؛ [Guided Chat #41300255606](https://github.com/fawakhry/TrendOs/actions/runs/41300255606) SUCCESS. اختبار جديد قائم على بيانات وهمية فقط؛ لا Worker deployed ولا D1/R2 Stage فعلي ولا صلاحيات صور حية.
- **الملفات المنشورة في المصدر فقط:** `customer-native-upload-coordinator-off-v0.js`، `tests/customer_native_upload_coordinator_off_v0.test.cjs`، تعديل CI، وتوثيق هذا الكتاب والكتاب الرئيسي. **لم يتغير app.js/index.html/Code.gs**؛ وحدة التنسيق غير مُحمّلة تلقائيًا ولا تصنع Request بنفسها.
- **قيود لا يجوز إخفاؤها:** الاستئناف ضمن جلسة الذاكرة فقط؛ لا حفظ حالة آمن عبر Reload؛ لا معالجة آلية لملف `PENDING`؛ لم يتحقق Native customer write transport/Cloudflare Worker؛ لا شهادة مسح malware أو معاينة صورة مصدقة؛ المرفقات 5MiB في Entry666 مقابل حد 25MB في الطريق القديم. نظام الطلبات الحي القديم لم يُصلَح بهذا الدمج.
- **التالي:** على Zero Google Draft #311، تأهيل adapter واجهة العملاء الأصلي (وليس Dispatcher ثانٍ) للتعامل مع Entry665/666 بعد إثبات التوثيق والـWorker؛ ثم Stage بحسابين اختباريين لهما الاسم نفسه ومعرفان مختلفان ومرفقات تركيبية وR2 خاص؛ ووجود إجراءات لمراجعة PENDING دون تسريب أو حذف تعسفي. `CUSTOMER_GO_LIVE=NO_GO`، `OPENAI_PAID=OFF`.

## 18) HTTP Loopback Stage transport مطابق لعقود Native، غير متصل بالإنتاج — 2026-11-01

- **سياق الاستكمال:** بعد دمج PR318 وصيانة كتب `main`، قرأنا Frontend coordinator وZero Google Draft #311 (ما زال Draft، لا نشر Worker). قرار المالك «go» يجيز استكمال التطوير والاختبار، **وليس** إطلاق خدمة صور أو أوردرات حية قبل اجتياز بوابات الخصوصية الموثقة.
- فرع المصدر الجديد `feature/customer-native-upload-loopback-http-stage-off-20261101`. أُضيف `customer-native-upload-loopback-http-stage-off-v0.cjs` فقط كـ**محول بروتوكول HTTP محلي**. يستقبل injected fetch + getter bearer من جلسة Native في الذاكرة وشرط Stage موافقة مستقل، ولا يخزن الـbearer ولا يتصل مباشرة بالخادم العام.
- **قيد صارم افتراضي:** النقل يرفض كل العناوين ما عدا `http://127.0.0.1:<port>` بوقت timeout محدود، ولا يتصل بـ Cloudflare حتى لو أعطاه أحد عنوان Stage. لا ربط `index.html` أو `app.js` أو `customer-native-browser-transport-v0.js` ولا Worker import، ولا Google fallback. لا يتم تمرير بيانات حقيقية أو رموز Cloudflare.
- **المسارات الأصلية فقط:** `POST /v1/customer/native/drafts/:draftId/items` مع `requestKey` في JSON (Entry665)؛ `POST /v1/customer/native/drafts/:draftId/items/:itemId/files` مع `x-idempotency-key` وحمولة PNG/JPEG/PDF ≤5MiB (Entry666). يتحقق من الحقول والبايتات، ويقرأ رد JSON المباشر من المعالج الأصلي؛ لا بروتوكول ملف بديل أو Public URL.
- اختبار `tests/customer_native_upload_loopback_http_stage_off.test.cjs` يفتح HTTP server حقيقي على loopback **لكن خادمه Mock تركيبي وليس Worker أو D1/R2 حقيقيًا**؛ حسابان بالاسم المعروض نفسه وكودين مختلفين، مع bearer اصطناعي لكل واحد. يحاكي: استلام الخادم للبند ثم انقطاع الرد، وإعادة نفس المفتاح؛ استلامه للملف الثاني ثم انقطاع الرد وإعادته بنفس مفتاح الملف؛ رفض الوصول المستعرض 404؛ وفشل 409 PENDING الذي يمنع متابعة رفع باقي الملفات.
- تمت إضافة Syntax check وNode test إلى CI الجاهزية الأصلي، مع الإبقاء على `NO_GO` و`--require-go` الحاجب. **الاختبار لا يثبت** تنفيذ D1 CAS/SQLite Workerd أو R2 HEAD/PUT فعلي، أو خلو Google Drive من المشاركات العامة، أو Scanner attestation، أو 25MB parity. لا يُنفذ official T12 submit.
- **التالي بعد CI:** دراسة ربط عقد النقل في أصل `customer-native-browser-transport-v0.js` لدى مسؤول PR311، وإعداد مرحلة `wrangler dev --local` المعزولة بقاعدة D1/R2 وهمية وثبوت ملكية عميلين. تأهيل R2 PENDING manual reconciliation قبل cloud Stage. لا Deploy أو نشر عام/مرفقات حقيقية بدون شهادة أمان مستقلة.

## 19) إغلاق ودمج PR #319 — HTTP loopback Stage بدون نشر — 2026-11-01

- **دمج فعلي:** [PR #319](https://github.com/fawakhry/TrendOs/pull/319) إلى `main`، Squash merge `c7b8ca95caf2789bf1baad3278edd2034c5de353` بعد موافقة اختبارات Source-only على HEAD `c6331b5bf398ae0d20d73655f1d7315c74bf3510`.
- **نتائج CI في HEAD النهائي:** [Readiness #41300955367](https://github.com/fawakhry/TrendOs/actions/runs/41300955367) SUCCESS، [P0 Security #41300955371](https://github.com/fawakhry/TrendOs/actions/runs/41300955371) SUCCESS، [Guided Chat #41300955270](https://github.com/fawakhry/TrendOs/actions/runs/41300955270) SUCCESS.
- **الكود المدمج:** `customer-native-upload-loopback-http-stage-off-v0.cjs` (HTTP محلي على 127.0.0.1 فقط، ممنوع إرسال إلى Cloudflare الحقيقي)، `tests/customer_native_upload_loopback_http_stage_off.test.cjs` (خادم HTTP وهمي بحسابين، اختبار استئناف الفقد وتعارض ملكية العميل)، تحديث workflow، وسجلات الكتب.
- **تأكيد الحدود:** PASS يثبت سلامة بروتوكول الاختبار المحلي فقط. الخادم التجريبي ليس `workerd` ولا D1/R2 الحقيقي؛ لم يُضف أي Worker route أو Cloudflare binding أو انتقال بيانات عملاء؛ لم تتغير شيفرة `app.js` و`Code.gs` و`index.html`. Frontend feature flag OFF، Zero Google Draft #311 بلا ترحيل منتج مُثبت، `CUSTOMER_GO_LIVE=NO_GO`.
- **المرحلة التالية:** إقامة Worker محلي مع D1 SQLite migrations وR2 خاص وهمي دون مفاتيح إنتاج، مع اختبار عميلين متطابقي الاسم ومختلفي ID؛ ترقية واجهة Native Browser الأصلية فقط بعد اعتماد مسار auth/ownership والـscanner، وعدم التعامل مع `PENDING` تلقائيًا. أي Cloudflare Stage خارجي يحتاج سياسة Access منفصلة وإثبات رد Worker وعزل الملفات قبل الإطلاق.

## 20) تصحيح المسار التالي: اختبار Wrangler/D1/R2 موجود أصلًا — 2026-11-01

**مراجعة مستقلة قبل إنشاء أي حزمة Stage مكررة:** في [Zero Google Draft PR #311](https://github.com/fawakhry/TrendOs/pull/311) HEAD `0ff6ce9f1dfcc5d9dba319c13bd6a6c553f40009` توجد بالفعل وحدة `cloudflare-d1/customer-stage/index.mjs` ذات Route لـ Entry665 item وEntry666 file، مع Flags منفصلة OFF في `cloudflare-d1/wrangler.customer-stage.toml`. الاختبارات `tests/customer_stage_wrangle_local_real_d1_do_e2e.py` تستخدم بالفعل **Wrangler workerd محليًا + D1 migrations 0032–0040 + R2 محلي خاص + durable login DO** وبيانات عميلين وهميين منفصلين، وتجرب رفع ملف خاص وتكرار نفس المفتاح ورفض سرقة ملكية الملف واختبار SHA/حجر Quarantine. لا نعيد بناء هذه الحزمة.
- **شهادة CI على HEAD الحقيقي لفرع PR311:** [Worker D1/DO E2E #41220706810](https://github.com/fawakhry/TrendOs/actions/runs/41220706810) SUCCESS؛ [Zero Google ONE PACKAGE #41220706858](https://github.com/fawakhry/TrendOs/actions/runs/41220706858) SUCCESS؛ [Isolated Worker OFF #41220706800](https://github.com/fawakhry/TrendOs/actions/runs/41220706800) SUCCESS؛ [A61 Browser Transport #41220706882](https://github.com/fawakhry/TrendOs/actions/runs/41220706882) SUCCESS. نتائج مؤرخة بالـHEAD المذكور، وليست Cloudflare Stage عامة أو Google action retirement.
- **القيمة الدقيقة لـPR319:** محوّل HTTP محلي مستقل + فحص سلوك Coordinator لإعادة محاولات فقد الرد على مستويَي البند والملف. اختبار PR319 كان Server Mock وليس Workerd؛ **تكامل المحوّل الجديد ذاته مع Workerd الحقيقي ما زال غير مختبر**. Backend Entry665/666 متأهل محليًا بشكل مستقل على Zero Google، وليس مُفعَّلًا في Browser Native dispatch.
- **الخطوة التالية الصحيحة:** اختبار Coordinator + HTTP Adapter المدمجين في main فوق Worker/D1/R2 المحلي المعتمد في #311 بحزمة تستهلك المصادر الحالية بدل نسخ Backend أو تغيير فروع الملكية. ثم تمهيد Cloudflare **isolated remote Stage** بهوية Access/Binding منفصلتين وأدلة 403/200/404 وrollback؛ لا نشر إنتاج. `CUSTOMER_LIVE_ACTIVATION=OFF`, `PAID_OPENAI=OFF`, `CUSTOMER_GO_LIVE=NO_GO`.

## 21) اختبار منسق الرفع مع Worker/D1/R2 المحلي الأصلي — 2026-11-01

- **الهدف المعتمد بعد §20:** اختبار الربط الفعلي بين `customer-native-upload-coordinator-off-v0.js` + `customer-native-upload-loopback-http-stage-off-v0.cjs` المدمجين في `main`، وBackend Worker/D1/R2 الموجود على Zero Google Draft #311. لا بناء Backend آخر ولا تعديل PR311.
- فرع جديد: `feature/customer-upload-real-wrangler-bridge-off-20261101`، وPR قيد الإعداد. أضيفت فقط حزمة تحقق غير متصلة بالواجهة: `tests/customer_native_upload_real_wrangle_bridge_off.cjs`، `tests/customer_native_upload_real_wrangle_bridge_off.py`، و`.github/workflows/customer-native-upload-real-wrangler-bridge-off.yml`.
- Workflow يعمل بمرجع Zero Google **مثبت SHA** `0ff6ce9f1dfcc5d9dba319c13bd6a6c553f40009` في checkout اختبار مستقل، بلا نسخ Backend إلى main. Python يعيد استخدام وظائف `seed_sql` و`start_dev` ومخطط migratons من `tests/customer_stage_wrangle_local_real_d1_do_e2e.py` الأصلي. يوجد opt-in صريح، ويمنع الـtest أي Cloudflare remote/API credential؛ تشغيل wrangler local فقط مع D1/R2 وDurable Object تجريبيين مؤقتين.
- السيناريو الجديد: تسجيل دخول Native PBKDF2 لحسابين بنفس الاسم المعروض لكن بمعرفين مختلفين؛ إنشاء مسودتين Native من نفس Worker؛ تشغيل Coordinator + HTTP Adapter الأصليين على طلب بند + صورتين/ملفين PNG/PDF وهميين؛ إسقاط رد HTTP **بعد** أن يستلم Worker طلب إنشاء البند، ثم فقد رد رفع الملف الثاني، ثم استئناف بنفس requestKey. التحقق من `alreadyAdded/alreadyUploaded` فعليًا ورفض عميل B الوصول لمسودة A واختبار R2 byte integrity/quarantine ورفض GET. بعد إيقاف Worker يُفحَص SQLite D1 الحقيقي لعدم مضاعفة السجلات، وعدم كتابة أوردر رسمي، وثبات `scan_completed=0`.
- **هذه خطة اختبارات مصدرية أضيفت في ملفات فعلية، وليست إعلان PASS بعد**. يجب تسجيل نتيجة CI ورقم PR وHEAD قبل أي دمج. بعد النجاح يظل الفرق قائمًا بين LOCAL Worker E2E وبين Remote Cloudflare Stage أو تشغيل المستخدمين، ويبقى `CUSTOMER_GO_LIVE=NO_GO`.

## 22) نجاح اختبار Workerd/D1/R2 الفعلي ودمج PR #320 — 2026-11-01

**تم التنفيذ والدمج إلى main:** [PR #320](https://github.com/fawakhry/TrendOs/pull/320) → Squash merge `cab3973245b9c09511427a3c9c73749c44237661`. آخر HEAD اجتاز CI قبل الدمج `79335c53ad160106b84950ea43f2e780dd8c957f`.

- **شهادة الاختبارات على HEAD:** [Original Wrangler D1/R2 upload bridge #41303699508](https://github.com/fawakhry/TrendOs/actions/runs/41303699508) **SUCCESS**، [Customer Readiness #41303699506](https://github.com/fawakhry/TrendOs/actions/runs/41303699506) **SUCCESS**، [Guided Chat #41303699519](https://github.com/fawakhry/TrendOs/actions/runs/41303699519) **SUCCESS**، [P0 Private Media #41303699555](https://github.com/fawakhry/TrendOs/actions/runs/41303699555) **SUCCESS**. نجح اختبار الربط الجديد على كود Worker الأصلي من Zero Google PR311 مع D1 وR2 وDO محليين حقيقيين، وليس مجرد HTTP Mock.
- **سجل اختبار التنفيذ الفعلي:** Native login لحسابين مختلفين بنفس الاسم المعروض، إنشاء مسودتين D1 منفصلتين، إرسال بند وصورة PNG + ملف PDF بحمولة وهمية مع فَقْد رد الخادم بعد كتابة البند وبعد رفع الملف الثاني؛ `resume()` ينجح باستخدام نفس requestKey دون زيادة D1 rows أو R2 files. رفض الوصول المستعرض للملفات الخاصة، والتحقق من R2 byte integrity الخاص، وحجر الملفات وعدم مسح malware/السماح بالطباعة.
- **إثبات SQLite المستقل من Log CI:** بالضبط **2 Native drafts، 2 draft items، 3 READY private files، 3 QUARANTINED rows** بوسم `scan_completed=0` و`print_release_authorized=0`، و**الأوردران الرسميان الوهميان الأصليان كما هما**. لا تحويل أي مسودة إلى T12 order.
- **التغيير المصدر فقط:** أضيفت `tests/customer_native_upload_real_wrangle_bridge_off.cjs` + `.py` وWorkflow جديد وتوثيق. مجلد Zero Google أصلي مثبت SHA `0ff6ce9f1dfcc5d9dba319c13bd6a6c553f40009` يُحمّل **للاختبار فقط** من GitHub؛ لا نسخ Worker جديد ولا تعديل Draft #311. Config D1/R2 ومفاتيح HMAC ومحفظة Wrangler في ملفات مؤقتة داخل Runner تُزال بعد الاختبار.
- **حدود النتيجة:** تشغيل Worker محلي باستخدام Workerd/SQLite D1/Private R2 مختلف عن نشره على خدمة Cloudflare الحساب الفعلي. لا إثبات Access remote ولا Backend legacy Apps Script P0 hotfix/ACL ولا scanner attestation مع توقيعات موثوقة ولا private image viewer ولا Native write/browser rollout ولا استئناف reload؛ 5MiB في Native مقابل 25MB legacy. أصل ملف `index.html` و`app.js` و`Code.gs` لم يتغير، ولم يُسمح ببيانات عملاء حقيقيين أو Cloudflare remote/Google/OpenAI paid.
- **الخطوة التالية من جهة المالك/المسار:** تأهيل واجهة Native Browser الأصلية في #311 لاستدعاء Entry664/665/666 بعد تأمين صاحب الحساب ومراحل P0 وStage سحابي مستقل محمي بواسطة Access، بأدلة حية 200/403/404، rollback، scanner/private viewer ومدقق أمان. **ما زال `CUSTOMER_GO_LIVE=NO_GO` و`PAID_OPENAI=OFF`.**

## 23) تطبيع بيانات فورم العميل قبل Native D1/R2 — 2026-11-01

- آخر مرجع معتمد: §22 ودمج PR320. جرت قراءة كتاب الواجهة من main، ومراجعة أصل `app.js` (الأمر `addCustomerDraftItem()` يُرسِل `qty` كنص و`heatPress/flyPrint` «نعم/لا»، ويستخدم Backend Google legacy فعليًا) وعقد Native الأصلي على Zero Google Draft #311 (ما زال **OPEN/DRAFT**). لا تعديلات على فرع PR311 أو الإنتاج.
- أضيف `customer-native-ui-stage-plan-off-v0.js` إلى فرع `feature/customer-native-ui-payload-plan-off-20261101`: **محوّل فورم/ملف المصدر فقط** من قيم UI الحالية إلى `Entry665/666` Native. يعزل هوية العميل في جلسة موثّقة اصطناعية من حقنة Stage/Local؛ يربط المخطط بصاحب الحساب + `authEpoch` لضمان عدم إعادة استئناف بعد Logout/Relog حتى لنفس المالك؛ يرفض `customerId/token/password/customerCode` وروابط Google والبائع/فرع غير مثبت من الفورم؛ يعتمد الكمية الصحيحة وboolean للخيارات؛ يرفض أكثر من 5 ملفات أو >5MiB ومحتوى غير PNG/JPEG/PDF؛ يقرأ الملف بـ`arrayBuffer()` دون Base64 أو رفع عام. ينفذ `cancel()` وإبطال الطلب عند تغير جلسة Native أثناء قراءة الملف أو رفعه، ولا يتيح إرسال أوردر رسمي.
- **الحدود الأمنية:** الكود غير محمّل من `index.html` أو `app.js`، ولا يحتوي `fetch` أو كلمات مرور أو تخزين محلي أو public media. التصدير الاختباري إلى browser global متاح **فقط** مع `hostname=127.0.0.1` وFlag اختباري صريح؛ الافتراضي OFF. الثقة في `getVerifiedSession` هي **حقنة مخصصة للاختبار المحلي فقط** وليست إثبات صدور جلسة Auth حقيقية من original browser dispatcher. الربط الأخير سيتم من **الناقل الأصلي** داخل PR311 بعد تأهيل Native auth/Stage، وليس إنشاء مصدر token ثان.
- `tests/customer_native_ui_stage_plan_off.test.cjs` تضيف فحوصات تركيبة/UI لتطبيع «نعم/لا» وqty، منع إعادة الإنشاء وبيانات غير مصرح بها، إبطال محاولات الطلب مع تغير صاحب الجلسة أو رقمها، وإلغاء تجهيز ملف أثناء القراءة، وفصل واجهة الإنتاج. تم تعديل اختبار **Workerd/D1/R2 الحقيقي المحلي** السابق `tests/customer_native_upload_real_wrangle_bridge_off.cjs` ليمر من محوّل الـUI الجديد قبل منسق الرفع وHTTP adapter الأصليين، دون زيادة عدد مسودات/عناصر D1 المتوقعة أو تعديل Worker.
- يستعمل Workflow اختبار Stage الأصلي المثبّت SHA من Zero Google #311؛ لم تحدث أي Cloudflare remote calls / customer access / Google writes. **لا يُعلن نجاح CI إلا بعد فحص آخر HEAD والـrun IDs**. Local/Stage source-only، وكل بوابات `CUSTOMER_GO_LIVE=NO_GO` و`OPENAI_PAID=OFF` باقية.

- **CI أول دورة وفشل موثق:** على PR #321 HEAD `7a87a76b9be7775f3c0360412be466e2430f7ef5`، اختبار Real Local Workerd workflow [#41305532904](https://github.com/fawakhry/TrendOs/actions/runs/41305532904) توقف قبل تشغيل Wrangler. السبب test-only false positive: اختبار رفض `localStorage` بحث في نص الملف **بما فيه التعليق** `No bearer, localStorage, ...` واعتبر التعليق خطرًا. اختبارات Mapper السبعة الأخرى نجحت. **لم تُثبت هذه الدورة تكامل Worker الجديد** ولا يُعتبر PR ناجحًا.
- صُحّح `tests/customer_native_ui_stage_plan_off.test.cjs` فقط ليراجع المصدر التنفيذي بعد إزالة التعليقات، بدل حذف سياسة التعليقات أو إضعاف قائمة APIs المحظورة. سبب الفشل وتعافي CI سيُسجَّلان بأرقام تشغيل HEAD النهائي قبل الدمج. لا تغيير في `app.js` أو المصادقة أو الملفات الحية.

## 24) PR #321 اتدمج بعد نجاح اختبار الفورم مع Workerd/D1/R2 المحلي — 2026-11-01

- **تم الدمج إلى main فعليًا:** [PR #321](https://github.com/fawakhry/TrendOs/pull/321)، Squash SHA `9c5599648878e9ce6c88b0f9b5ca57677e800b34`، وآخر Source HEAD تم اختباره `78c431a52b65fedc11e2876bf5b308e0efff5e62`.
- **CI النهائي على نفس HEAD:** [Original Wrangler D1/R2 Upload Bridge #41305626649](https://github.com/fawakhry/TrendOs/actions/runs/41305626649) **SUCCESS**، [Customer Readiness #41305626785](https://github.com/fawakhry/TrendOs/actions/runs/41305626785) **SUCCESS**، [Guided Chat #41305626730](https://github.com/fawakhry/TrendOs/actions/runs/41305626730) **SUCCESS**، [P0 Stage Security #41305626682](https://github.com/fawakhry/TrendOs/actions/runs/41305626682) **SUCCESS**.
- اختبار Workerd الحقيقي أعطى نص إثبات: `PASS: Original independent Native D1 login, main coordinator/adapter, real local Workerd+D1+R2 idempotent retries` و`PASS: Disposable D1 exactly 2 customers' drafts, 2 items, 3 quarantined private files; original 2 official orders untouched`. هذه **اختبارات محلية فعلية** بمفتاح جلسة مجهول وبيانات وهمية، ولا تزعم نشر Cloudflare remote.
- **التغييرات المدمجة:** `customer-native-ui-stage-plan-off-v0.js` جديد، `tests/customer_native_ui_stage_plan_off.test.cjs` جديد، تحديث `tests/customer_native_upload_real_wrangle_bridge_off.cjs` لتمرير نفس الفورم قبل Native Coordinator، تحديث Workflow لاختبارات الفورم والـWorker، وسجلات كتابي الواجهة/الرئيسي. لم يتغير `index.html` ولا `app.js` ولا `Code.gs` ولا Worker production.
- **الإخفاق السابق مُوثّق دون محو:** run #41305532904 فشل فقط بسبب false-positive `localStorage` في تعليق، ثم أُصلح اختبار التعليقات، وأعيد تشغيل CI إلى النجاح على HEAD النهائي المذكور. لم يكن فشلًا في Auth/D1/R2 ولا جرى التعامل معه كنجاح قبل تصحيحه.
- **الحدّ المتبقي:** مصدر Native form mapper هو مصدر **غير محمّل في واجهة العملاء الحية**؛ `getVerifiedSession` مُحقَن داخل اختبار Local، وليس جلسة browser production مؤكدة. يحتاج original Native browser dispatcher في Zero Google Draft #311 إلى دعم كتابة آمن ومفاتيح Idempotency بعد اعتماد auth/owner، ويحتاج Cloudflare isolated remote Stage إلى Access مستقل، بوابة تصوير/Scanner attestations، عرض خاص للصور، 5MiB/25MB parity، وإصلاح P0 legacy media permissions. أي اعتماد تشغيل للعملاء أو نشر Worker من هذا المسار ممنوع. `CUSTOMER_GO_LIVE=NO_GO`, `PAID_OPENAI=OFF`.

## 25) إنجاز صفحة عميل Native متكاملة للتجربة المعزولة — 2026-11-01

- **أمر المالك:** «انجز وقفل الواجهة وخلصها». تم مراجعة الكتاب §24، أصل `app.js/index.html`، وحدات Native form/coordinator المدمجة، والـZero Google Draft #311. الواجهة الحية الحالية تعتمد Apps Script في كتابة المسودات، وLegacy P0 وNative browser auth وCloudflare remote Access لم يعتمدوا بعد؛ لهذا **لا يمكن إعلان إطلاق إنتاج آمن** أو تحويل عملاء فعليين من دون هذه الأدلة.
- **التنفيذ المرئي الحقيقي الجديد:** `customer-portal-native-stage-v0.html` واجهة عربية زرقاء responsive بطابع محادثة مطبعجي بنها/Trend Mall، بها شاشة تسجيل دخول العميل، أوامر متابعة الأوردرات، composer قسم/اسم/كمية/ملاحظات/مكبس/طباعة سريعة، رفع ملفات أصلية PNG/JPEG/PDF، مسودة متعددة البنود، استئناف محاولة الرفع بعد ضياع الرد، زر فحص جاهزية **قراءة فقط**، مسودة جديدة، تسجيل خروج؛ رسائل واضحة حول حجر الملفات ومنع إصدار أوردر رسمي قبل الاعتماد.
- **منطق Controller فعلي:** `customer-portal-native-browser-stage-v0.js` يستدعي فقط Native Login/Orders/Draft Create/Entry665 Item/Entry666 Private R2 File/Preflight/Logout عبر Worker **محلي على 127.0.0.1**. Native token يعيش في ذاكرة المتصفح فقط؛ يتلف محليًا عند logout؛ لا `localStorage`/Google، ولا عرض ملفات خاصة عبر public URL، ولا طباعة/فاتورة/إرسال أوردر رسمي. Backend يفرض ملكية الحساب بواسطة HMAC Native D1 token، لا أسماء الواجهة.
- **إعادة استخدام مصدر موجود:** `customer-native-upload-coordinator-off-v0.js` لا يزال CommonJS للاختبارات، وأُضيف Browser export **فقط** إذا `hostname===127.0.0.1` و`TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY===true`. `customer-native-ui-stage-plan-off-v0.js` كان بالفعل بنفس حارس Local/flag. `index.html` و`app.js` الإنتاجيان **لم يُحمَّلا بأي ملف جديد أو يتغيرا**.
- **Default OFF:** الصفحة لا تُظهر Login أو ترسل طلبات إلا إذا حقن Fixture محلي صريح `TRENDOS_CUSTOMER_NATIVE_PORTAL_TEST_CONFIG.enabled=true` و`apiBase=http://127.0.0.1:<port>` مع flag منفصل. أي hostname عام، أو إعداد ناقص، يظهر «مقفولة» ولا يسمح بأي طلب. لا Web Worker/T12 deploy، لا R2 public bucket، ولا scanner claim.
- **اختبار المتصفح الحقيقي المضاف:** `tests/customer_native_browser_full_ui_real_local.cjs` يستخدم Playwright Chromium لفتح الصفحة مع مصدر config محلي مؤقت، تسجيل C1 ثم قراءة `LOCAL-ORDER-LOCAL-C1` بدون C2، رفع صورة PNG وهمية عبر Native Worker مع D1/R2، عرض حالة `STAGED_NOT_SUBMITTED`، رفض/Preflight الأوردر الرسمي، تسجيل الخروج ثم دخول C2 والتأكد من غياب بيانات C1؛ كذلك يعيد فتح الصفحة بدون config لإثبات default OFF، ويرفض أي مسار HTTP خارج 127.0.0.1.
- **اختبار DB بعد الواجهة:** تحديث `tests/customer_native_upload_real_wrangle_bridge_off.py` لاستخدام Workerd + D1/R2 الأصلي في PR311 pinned، وإطلاق Static Test Server على 127.0.0.1:8000 فقط، وعدّ **3 مسودات، 3 بنود، 4 ملفات private QUARANTINED** (2 للعميلين في اختبار Node ثم بند/ملف من Chromium) وأوردرين رسميين وهميين غير متغيرين. أضيف تثبيت Playwright إلى Workflow المحدود بالاختبارات فقط.
- **النطاق ومتبقي التسليم:** التنفيذ/الاختبار الجديد **لا يعني إطلاق المنصة الحية**. إذا اكتملت CI، نستطيع اعتماد **Stage UI source complete**، لكن التشغيل على remote Cloudflare وتقاعد Google 9/9 وإصلاح permissions/Scanner/Private Viewer واعتماد الموظف وتسليم T12 الرسمي تحتاج مراحل منفصلة وأدلة فعلية. لا غش في `CUSTOMER_GO_LIVE=NO_GO`. سيتم تسجيل PR ونتائج CI بعد اكتمالها فقط.

## 26) إغلاق تنفيذ واجهة العميل Native للـLocal Stage — دمج PR #322 — 2026-11-01

**المصدر اكتمل وتم اختباره داخل Chromium حقيقي، ولكن الإنتاج لم يُفعَّل.** [PR #322](https://github.com/fawakhry/TrendOs/pull/322) **MERGED إلى main** عبر Squash SHA `990ec8bd149c257cf62bf72f640055ce3749f89f`، وأحدث HEAD اجتاز الفحوصات قبل الدمج `27e875d41e074ff05d74aca2fdcabd5bc2d0fe7a`.

- **CI النهائي على HEAD المدمج:** [Real Chromium + Workerd/D1/R2 #41317731760](https://github.com/fawakhry/TrendOs/actions/runs/41317731760) SUCCESS؛ [Readiness source NO-GO #41317731791](https://github.com/fawakhry/TrendOs/actions/runs/41317731791) SUCCESS؛ [Customer Guided Chat #41317731798](https://github.com/fawakhry/TrendOs/actions/runs/41317731798) SUCCESS؛ [P0 Private Media source security #41317731881](https://github.com/fawakhry/TrendOs/actions/runs/41317731881) SUCCESS. المصدر قابل للتدقيق، و**نجاح تدقيق NO-GO ليس موافقة إطلاق**.
- **إثبات CI حرفيًا:** `PASS: REAL Chromium full native customer portal Stage, private file upload, D1 owner history and no live order`، و`PASS: Disposable D1 exactly 2 account owners, 3 drafts, 3 items, 4 quarantined private files; original 2 official orders untouched`. تم التحقق من عزل عميلين ببيانات وهمية، استعراض الأوردرات المسموح بها، تجهيز وإرسال صورة إلى R2 المحلي الخاص، رفض بدء أوردر رسمي، تسجيل الخروج، وعدم تفعيل صفحة الواجهة عند غياب Config.
- **الملفات المدمجة:** `customer-portal-native-stage-v0.html` واجهة عربية زرقاء responsive بمحادثة ومسودات وملفات؛ `customer-portal-native-browser-stage-v0.js` منطق Native الوحيد للصفحة المحلية؛ حارس Browser Local اختياري في `customer-native-upload-coordinator-off-v0.js`؛ `tests/customer_native_browser_full_ui_real_local.cjs`، تحديث `tests/customer_native_upload_real_wrangle_bridge_off.py` وWorkflow؛ وتوثيق §25 وUI-LOG-033. لم يُعدَّل `index.html` أو `app.js` أو `Code.gs` أو `production-shadow` أو مصدر Zero Google Draft #311.
- **تاريخ تصحيحات CI دون إخفاء:** 1) [#41317388386](https://github.com/fawakhry/TrendOs/actions/runs/41317388386) FAIL لأن الاختبار توقع سبب `T12_CUSTOMER_FILE_HANDOFF_NOT_YET_SUPPORTED` لكنه رأى رسالة أخرى. 2) [#41317516407](https://github.com/fawakhry/TrendOs/actions/runs/41317516407) FAIL موثّق بدليل `DRAFT_PREFLIGHT_ROUTE_OFF`، والسبب أن التهيئة الاختبارية لم تفعل `TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED` على Worker محلي؛ أُصلح **في Config المؤقت فقط**. 3) [#41317613376](https://github.com/fawakhry/TrendOs/actions/runs/41317613376) FAIL بسبب أن Chromium سجل HTTP 409 المتوقع في Console على أنه Error؛ عُدّل الفحص ليتحقق من استثناءات JavaScript واتصالات الشبكات الخارجية، ولا يعتبر رفض الـpreflight الأمني سبب فشل. بعد ذلك **#41317731760 SUCCESS** مع بقاء رفض الإصدار الرسمي.
- **قرار إغلاق المرحلة:** `CUSTOMER_STAGE_UI_SOURCE=COMPLETE_AND_LOCAL_E2E_PASS`. **غير صحيح** القول إن العملاء يستطيعون الدخول للإنتاج أو أن Zero Google اكتمل. `CUSTOMER_PRODUCTION=NO_GO`, `CUSTOMER_STAGE_REMOTE=NOT_DEPLOYED`, `GOOGLE_CUSTOMER_ACTIONS_RETIRED_LAST_PROVEN=0/9`, `OPENAI_PAID=OFF`. رابط الملف في GitHub ليس رابط تطبيق عميل مفعل.
- **الموانع المتبقية قبل إطلاق حقيقي (مالك منفصل):** معالجة ثغرات `Code.gs` القديمة (صلاحية العميل وصور ANYONE_WITH_LINK) أو تقاعدها الكامل بعد التحول؛ تأهيل Original Native browser dispatcher الذي يحتفظ بالـBearer في الذاكرة ويملك صيغة customer login authenticated لنقل العميل من صفحة legacy الحية؛ Cloudflare Access **remote isolated Stage** مع D1/R2/Auth bindings حقيقية مستقلة وإثبات 200/401/403/404 وعدم تسرب الصور؛ Scanner attestations معتبرة وصلاحيات private preview/downloader؛ مصالحة ملفات `PENDING` بدليل SHA، فرق 5MiB/25MB وسياسة ملفات مطبعية، وربط handoff الموظف/T12 single-writer مع إنشاء أوردر رسمي دون تكرار وتوثيق rollback. حتى الاعتماد، الصفحة محجوبة افتراضيًا وتحظر أي origin عام. هذه **بوابات إطلاق خارج نطاق PR322** وليست عيوباً أخفاها الاختبار.
