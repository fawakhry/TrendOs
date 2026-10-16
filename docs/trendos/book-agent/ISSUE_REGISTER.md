# TrendOS — كتاب الأخطاء والتحقق من المشكلات (Issue Verification Register)

**قرار المالك — 2026-10-16 | قاعدة ملزمة لكل إيجنتات الكتاب والتطوير والأعطال**

> المشكلات التي يستخرجها إيجنت الكتاب خلال جرد النظام من أوله لآخره **اكتشافات تاريخية/مؤشرات**؛ قد تكون شُخّصت في نسخة قديمة ثم صُلحت لاحقًا في فرع أحدث أو نُشرت إصلاحاتها. **لا تُصنّف مشكلةً حالية ولا يبدأ إصلاحها حتى يتم التحقق من أحدث حالة ذات صلة.**

## مسار إلزامي قبل كل إصلاح

1. **INTAKE / تسجيل فقط:** احتفظ بالنص الأصلي والملف/الدالة والفصل والـSHA الذي قرأه إيجنت الكتاب، وتاريخ الملاحظة وأولوية الخطر؛ الحالة `UNVERIFIED_HISTORICAL_FINDING`. لا تنسخ حالة OPEN من كتاب قديم إلى backlog حالي تلقائيًا.
2. **IDENTIFY CURRENT TARGET:** اجلب آخر `HEAD` للفرع المستهدف فعليًا، وSHA الخاص بمصدر الكود؛ حدّد `main` وPRs المكدسة والفروع ذات العلاقة، وأي نسخة منشورة **فقط بدليل مستقل**. كون `main` أقدم من Draft أو افتقاره للملف لا يثبت أن الإصلاح غير موجود في نسخة أخرى.
3. **COMPARE / منع الإصلاح المكرر:** طابق المسار الوظيفي الكامل من مدخل الطلب إلى الصلاحية/البيانات؛ راجع commits/PRs ذات الصلة، القارئات والوسطاء، شروط التفعيل والإعداد، واختبارات regression الحالية. لا تعتمد على لقطة من الكتاب، أو نص `TODO`، أو نتائج CI لنسخة SHA مختلفة.
4. **CLASSIFY WITH EVIDENCE:** `ALREADY_FIXED_VERIFIED_SOURCE` إذا كود الإصلاح موجود في HEAD المعني مع أدلة مناسبة؛ `ALREADY_FIXED_TESTED` فقط إذا جرى تشغيل الاختبار الصحيح على SHA معروف؛ `STILL_PRESENT_SOURCE` إذا مسار المشكلة قائم في HEAD؛ `BLOCKED_CURRENT_STATE_UNKNOWN` إذا تعذّر إثبات أيهما؛ `DUPLICATE_OF:<ID>` للمكرر. لا تساوِ `SOURCE_ONLY` أو CI المعزول بــ`PRODUCTION_VERIFIED`.
5. **FIX ONLY IF NEEDED:** إذا ثبت استمرار الخلل، أنشئ فرع إصلاح منفصلًا من أحدث HEAD الموافق عليه، أصغر Patch آمن، اختبارات سلبية وإيجابية وهمية (خصوصًا deny-before-read)، CI/Regression على نفس SHA، Draft PR، مراجعة دون دمج/Deploy. إذا سبق إصلاحه **لا تُعد كتابة الإصلاح**؛ سجّل دليل الإصلاح وأغلق البلاغ كمكتشف تاريخيًا ومُعالَج.
6. **CLOSE / RECORD:** لا يُغلق بلاغ إلا مع `FINDING_SHA` و`CURRENT_TARGET_HEAD` و`AFFECTED_BLOB_SHA` و`FIX_SHA` (إن وجد) و`TEST_COMMAND` و`TEST_RUN_SHA` و`CI_URL` و`RUNTIME_EVIDENCE` (أو `NOT_VERIFIED`) وقرار الإغلاق. احفظ تاريخ الإخفاقات والبلاغات ولا تمحُها؛ ارفعها من قائمة المشاكل **النشطة** فقط بعد الإثبات.

## حقول السجل القياسية

| الحقل | المطلوب |
|---|---|
| ID / SOURCE_CHAPTER | معرف ثابت، مرجع فصل الكتاب ونسخة الملاحظة |
| FINDING_SHA / SOURCE_PATH | نسخة الشك الأصلية، الملف/الدالة/المسار |
| CURRENT_TARGET_BRANCH / CURRENT_TARGET_HEAD | الفرع الحالي المراد إصلاحه وآخر SHA مثبت قبل التعديل |
| CURRENT_BLOB_SHA / RELATED_PR | كود الحالي والـPR/commit الذي قد يكون أصلحه |
| ROOT_CAUSE / IMPACT | الوصف بعد تتبع المسار، لا بالافتراض |
| STATUS / PRIORITY | `UNVERIFIED_HISTORICAL_FINDING` / `ALREADY_FIXED_VERIFIED_SOURCE` / `ALREADY_FIXED_TESTED` / `STILL_PRESENT_SOURCE` / `BLOCKED_CURRENT_STATE_UNKNOWN` / `DUPLICATE_OF`; P0-P3 |
| FIX_SHA / TEST_COMMAND / TEST_RUN_SHA / CI_URL | حقائق اختبار وتعديل مثبتة أو `NOT_RUN` |
| DEPLOYED_SHA / PRODUCTION_VERIFIED | لا تكتب `YES` دون إذن ودليل من النسخة المنشورة |
| DECISION / NEXT_ACTION | قرار محدد دون تكرار العمل أو رفع حالة نجاح دون دليل |

## البلاغ الجاري — BOOK20-R2-FILE-AUTH (P0)

- **مصدر الإدخال:** الفصل 20 من `TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md`: الوصول إلى `/v1/employee/comms/file/{id}` عبر `serveFile()` قبل جلسة الموظف، وعدم إثبات صلاحيات الأوردر و`visible_to_customer` واحتمال رابط عام `FILES_PUBLIC_BASE_URL`.
- **فحص نسختين:** الملف `cloudflare-d1/src/employee-comms-native-v1.mjs` موجود على فرع كتاب المنصة `agent/trendos-book-audit-v1-20261014` وكذلك فرع المطبعة `audit/printshop-28-issues-triage-20261016` بنفس **blob SHA `f415d06ccd15ba241d679c61b7afeb6ec904e4b8`**؛ وعلى `main` الحالي الملف غير موجود في الموضع نفسه. هذا لا يثبت ما هو منشور في الإنتاج ولا يمنع وجود إصلاح في فرع آخر.
- **علامة المصدر المرصودة:** في الملف المقروء، مسار GET (السطر 312) يستدعي `serveFile` مباشرة، بينما `authenticate` تستدعى لاحقًا لمسارات POST (السطر 326). **الحالة: `STILL_PRESENT_SOURCE` على فرعي المصدر المذكورين، و`PRODUCTION_VERIFIED=NO`**. يلزم فحص الصلاحيات الخارجية وR2/public URL قبل تقرير مدى الاستغلال، ولا يُطلب اختبار الإنتاج دون إذن.
- **الخطوة التالية:** تحقيق أمني منفصل على أحدث HEAD للفروع المعتمدة وباختبارات ملفات وموظفين وهميين؛ إن ثبتت الفجوة يصلح المصدر فقط في فرع منفصل مع CI وDraft PR، ولا تُعدَّل Cloudflare Production أو روابط R2 العامة.

## تذكير للكتاب

الفصل الذي يصف تاريخ تطور النظام ليس دليلًا أن كل فجوة رآها قائمة الآن. **المصدر الحالي + النسخة المنشورة الموثقة + نتيجة الاختبار المرتبطة بنفس SHA** هي أساس الحالة؛ حافظ على سجل تاريخ الإصلاحات منفصلًا عن قائمة الأعطال النشطة.
