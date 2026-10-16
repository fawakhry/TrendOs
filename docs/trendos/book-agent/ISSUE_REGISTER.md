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


## الفصل 25 — إدخال البلاغات (2026-10-16، دون ادعاء فشل إنتاجي)

**مصدر التسجيل:** [الفصل 25](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md) في كتاب الإيجنت، كتابة المصدر بcommit `67b346ac43005da2c43d016dcc02426fa010b039`. فرع الكتاب `agent/trendos-book-audit-v1-20261014` عند فحص التوثيق HEAD `4b7a40630eb2dd8b10570697f6e8cb1f3aab4440` (قد يتغير). **كل بند هنا `UNVERIFIED_HISTORICAL_FINDING` بغرض triage على أحدث كود فعلي ثم تمييز ما صلح/ما زال مفتوحًا؛ `TESTED=NO` و`PRODUCTION_VERIFIED=NO`**. قائمة اختباراتهم في `TEST_EVIDENCE_QUEUE.md`، ولا يُعاد إنشاء بلاغ مكرر عند ظهور المشكلة في فصل آخر.

| ID | الأولوية | ملاحظة المصدر عند تسجيل الفصل | المسار/المصدر | مطلوب إثباته |
|---|---|---|---|---|
| BOOK25-MANAGER-AUTH | P0 | زر المدير مخفي بالواجهة، لكن dispatch `getTrendMasterCenterV1931/getActivityLog` في Core لا يظهر معه نفس فحص role/screen قبل جمع الديون والنشاط | `manager-center-v1932.js` blob `3d83a67f23056e2428b184c29e984fea871627b3`؛ `cloudflare-d1/src/employee-core-native-v1.mjs` blob `90b8d2d2353b3cbb2d85f8500e54bc64cfc3c82e` | أحدث HEAD + جميع middleware/role guards + test mock 401/403 وكشف بيانات وهمية |
| BOOK25-MANAGER-PROGRESSIVE | P2 | `loadProgressive` مُعرّفة لكن `load()` ما زالت تستخدم `getTrendMasterCenterV1931` في موضع القراءة | `manager-center-v1932.js`; `trend-master-resilience-v1931.js` | تأكد أن مسار الواجهة الحالي يستعملها/لا يستعملها، واختبر failure/timeout |
| BOOK25-KPI-TRUTH | P1 | بعض القيم المحسوبة أو الافتراضية `messageQueue:[]/dayClose:null/duplicateHealthy:true` لا تكفي لتقرير صحة كل المصادر | `cloudflare-d1/src/employee-core-native-v1.mjs` | مقارنة المصادر الحية بعد إذن، و`UNKNOWN` مقابل الصفر المرصود |
| BOOK25-WORKQUEUE-MIGRATION | P1 | Work Queue V1 Apps Script وOperator Task V2/Cloud D1 لديهم عقود منفصلة | `work-queue-v1.js`/`work-queue-backend-v1.gs`؛ `cloudflare-d1/src/operator-task-edge-v2.mjs` | إثبات Task Writer واحد على النسخة المنشورة، وreplay/claim race مع Mock |
| BOOK25-FEEDBACK-AUTOMATION | P1 | AUTO_SCAN=false في config المصدر، وbackend تقييم العميل legacy قابل للإرسال بعد `تم التسليم` | `config.js`/`customer-feedback-v1.js`/`customer-feedback-backend-v1.gs` | تحقق flag الفعلي ومنع إرسال مكرر وتعامل receipt/rating في sandbox بلا رسائل حقيقية |
| BOOK25-AI-APPROVAL | P1 | عقد AI/Knowledge يفرض `ADVISORY_ONLY` ولا يجوز تفسير الاقتراح كاعتماد | `docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md`/`MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md` | اختبار مسارات اعتماد العميل/المالك ومنع انتقال القرار المحمي تلقائيًا |

**الخطوة التالية لكل بند:** اقرأ أحدث `CURRENT_TARGET_HEAD` وكود المسار بالكامل، ابحث عن الإصلاحات السابقة والفروع المتداخلة، ثم سجل إحدى حالات `ALREADY_FIXED_VERIFIED_SOURCE`, `ALREADY_FIXED_TESTED`, `STILL_PRESENT_SOURCE`, `BLOCKED_CURRENT_STATE_UNKNOWN`, `DUPLICATE_OF`. إصلاح عند الحاجة فقط بفرع منفصل وCI ودليل Commit؛ لا ترقية إلى `PRODUCTION_VERIFIED` دون صلاحية واختبار.

## الفصل 26 — بلاغات سلامة الاستيراد والمرايا والنسخ (2026-10-16)

المصدر: الفصل 26 في TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md؛ commit 032c8b4b25c8c5af0d917a6906a4ae8d46bf8529؛ نقطة فحص المصدر HEAD 4580ff5cb278d18434e4410f5be386fbc2ecd2c9. كل البلاغات UNVERIFIED_HISTORICAL_FINDING لحين مراجعة أحدث TARGET_HEAD؛ TESTED=NO، PRODUCTION_VERIFIED=NO. لا تكرار لبلاغ BOOK21-MIRROR-PAYLOAD.

| ID | أولوية | SOURCE / BLOB SHA | وصف وخطوة التحقق | الحالة |
|---|---|---|---|---|
| BOOK26-MIRROR-GET-AUTH | P0 | cloudflare-d1/src/mirror-gate.mjs @ d9321c3a9c1678fd7a53abc6a24df73dbee25ebc؛ index_v2.js @ 4a555efb4b3f44ba371549d5cec055cc7ce1777f | GET /v1/mirror/sheet يُرجع raw values/display/formulas بدون auth صريح ظاهر في GET branch. تتبع middleware وdeployed version واختبر deny-before-read على Fake D1. ممنوع اختبار الوصول لبيانات العملاء الحقيقيين. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_AUTH_GAP |
| BOOK26-NORMALIZED-FINAL-PROOF | P1 | cloudflare-d1/src/normalized-import-gate.mjs @ 116398e82baae83260a5698e4a8e859665a9a68e | syncFinal=true default ومصدر sourceRowCounts هو طلب caller؛ لا يظهر اكتمال جميع chunks قبل freshnessAdvanced. اختبر missing/out-of-order/replay مع SQLite Mock. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_INTEGRITY_RISK |
| BOOK26-DELTA-CAS | P1 | cloudflare-d1/src/mirror-delta-gate.mjs @ 7822080e6f615d34065b0f2bc042c438443431de | preflight مستقل عن D1 batch وغياب apparent CAS/expected hash؛ اختبر interleaved writes بنفس baseRowCount ولا تدّع lost update في Production. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_CONCURRENCY_RISK |
| BOOK26-DEPLOY-LINEAGE | P1 | cloudflare-d1/wrangler.toml + .github/workflows/trendos-02cw-worker-promote-version-temp.yml وrollback-safe-temp.yml | source config وWorkflow definitions لا تثبت deployed SHA/Worker version. اطلب run URL وdeployed assets parity/read-only evidence مصرحًا به. | UNVERIFIED_HISTORICAL_FINDING / EVIDENCE_MISSING |

التصنيف قبل أي إصلاح: ALREADY_FIXED_VERIFIED_SOURCE أو ALREADY_FIXED_TESTED أو STILL_PRESENT_SOURCE أو BLOCKED_CURRENT_STATE_UNKNOWN أو DUPLICATE_OF. استخدم CURRENT_TARGET_HEAD/CURRENT_BLOB_SHA/RELATED_PR ثم اختبارات Regression على نفس SHA وDraft PR بلا Merge أو Deploy.
