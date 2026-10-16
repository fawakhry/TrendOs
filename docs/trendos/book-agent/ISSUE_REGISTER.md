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

## BOOK20-R2-FILE-AUTH — نتيجة دورة الإصلاح المعزولة (2026-10-16)

- **قرار التحقق من قِدَم البلاغ:** راجعنا نسخة المصدر الفعلية أولًا، لا فصل الكتاب وحده. `cloudflare-d1/src/index_v2.js` يوجّه مسار الملف إلى `handleEmployeeCommsNativeRequest` مباشرة، ووجدنا على فرعي الكتاب/المطبعة في blob `f415d06ccd15ba241d679c61b7afeb6ec904e4b8` مرور GET إلى `serveFile` قبل التحقق المحلي من الجلسة. `main` عند الفحص لم يحتوي هذا الملف في المسار نفسه؛ لا ادعاء بنسخة إنتاجية.
- **فرع إصلاح منفصل:** `fix/book20-r2-employee-file-auth-20261016` انطلق من HEAD المثبت `4b7a40630eb2dd8b10570697f6e8cb1f3aab4440`؛ [Draft PR #136](https://github.com/fawakhry/TrendOs/pull/136) مكدس على فرع كتاب المنصة. لا دمج أو نشر.
- **سبب المشكلة المؤكد على المصدر:** GET العام كان يقرأ بيانات D1 ثم `FILES.get(r2_key)` بلا جلسة موظف أو صلاحية أوردر داخل هذا handler؛ `FILES_PUBLIC_BASE_URL` كان يُستخدم لصناعة رابط مباشرة إلى R2 وقد يتجاوز أي handler.
- **التصحيح على الفرع فقط:** `cloudflare-d1/src/employee-comms-native-v1.mjs` يتحقق من Bearer + اسم الموظف في Header `X-Employee-Username` وrole صريح وأوردر موجود وتكليف للموظف غير الإداري قبل قراءة R2؛ ويرفض العميل عند غياب مسار تفويض العملاء أو غياب سياسة رؤية صالحة. أوقف توليد روابط R2 العامة وفشل مغلقًا عند وجود `FILES_PUBLIC_BASE_URL`. `app.js` يجلب الملفات المخولة بـfetch موثق ويصنع Blob URL مؤقتًا بلا token في URL. تم تقييد MIME وتعطيل Cache.
- **ملفات الإصلاح:** `cloudflare-d1/src/employee-comms-native-v1.mjs`, `app.js`, `tests/book20_employee_comms_r2_access.test.mjs`, `tests/book20_r2_employee_attachment_ui.test.mjs`, `.github/workflows/trendos-book20-r2-file-auth-synthetic-ci.yml`.
- **آخر FIX/TEST_RUN_SHA المعتمد:** `d304d305c698e9eafaddecb62b9e56521392d2a6`. اختبارات fake-only: **12/12** صلاحيات/جلسات/R2/رفض قبل القراءة/metadata/upload و**3/3** واجهة عرض مؤمنة؛ اختبار `tests/entry614_employee_comms_native.test.mjs` القديم PASS، وsyntax checks PASS. [GitHub Actions #38908425048](https://github.com/fawakhry/TrendOs/actions/runs/38908425048) PASS؛ [A61 browser regression #38908424627](https://github.com/fawakhry/TrendOs/actions/runs/38908424627) PASS على نفس SHA. لا اتصالات إنتاجية في harness.
- **الحالة:** `STILL_PRESENT_SOURCE -> PATCHED_TESTED_ON_DRAFT`؛ **P0 / BLOCKED_PRODUCTION**. التصحيح البرمجي **TESTED (synthetic)** وليس `PRODUCTION_VERIFIED` وليس مغلقًا إنتاجيًا.
- **مانع الإغلاق:** لا إثبات بأن R2 bucket/custom domain لم يكن أو لم يعد متاحًا علنًا؛ قد تظل الروابط القديمة تعمل خارج handler، ويتطلب الأمر مراجعة إعدادات Cloudflare وتعطيل الربط العام/معالجة الروابط القديمة بإذن منفصل. كذلك مطلوب اختبار staging مصرح به لصلاحيات المستخدم الفعلية وعرض الملفات ومطابقة Worker SHA قبل اعتماد نشر. لا تتطلب هذه الملاحظة وحدها الاتصال بالإنتاج.


## الفصل 27 — UI Event Findings (2026-10-16)

**مصدر البلاغات:** الفصل 27، commit `c6d3021cda7c0b298ac06e4412e9a9a78e5f7498`، `app.js` blob `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`، `Code.gs` blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`. الحالة المبدئية `UNVERIFIED_HISTORICAL_FINDING` حتى فحص أحدث مستهدف/إصلاحات ذات صلة. `TESTED_THIS_PASS=NO` / `PRODUCTION_VERIFIED=NO`. لا يُعاد فتح `BOOK25-MANAGER-AUTH` أو مشكلة العام/الخاص للملفات من فصل سابق.

| ID | P | السبب المرصود من source | النتيجة المطلوب اختبارها بأداة وهمية | الحالة |
|---|---|---|---|---|
| BOOK27-REFRESH-OVERLAP | P1 | `refreshBtn` في app.js:7502 يستدعي `hardRefreshMainScreen` بـaddEventListener، ثم app.js:8294 و:8743 يضيفان/يغيران `onclick` مع capture إعادة ربط. | نقرة واحدة = تحديث واحد، عدم تضارب `state.editing/state.saving` أو فقد الحقول. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_LISTENER_OVERLAP |
| BOOK27-WA-OPEN-IS-SENT | P1 | app.js:7592 يفتح WhatsApp URL ويسجل فورًا `markAutomationMessageSentV1931`، وCode.gs:5184 يكتب «تم الإرسال» دون Provider ACK. | popup-blocked أو إغلاق نافذة دون إرسال يجب ألا يسجل `sent`؛ فصل `opened/confirmed/providerAccepted/delivered`. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_SEND_SEMANTICS |
| BOOK27-DAYCLOSE-UNKNOWN | P1 | app.js:4441 `dayClose=null/error` يتحول إلى `blockers=[]` وReady CTA، رغم إمكانية فشل معاينة Code.gs:5157؛ خادم التقفيل نفسه يعيد التحقق. | preview null/error/timeout = NOT_READY في العرض ولا إطلاق أمر تقفيل بدون مراجعة مؤكدة. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_UI_READINESS_RISK |
| BOOK27-ACCOUNTING-ROLE-HINT | P1 | app.js:11001 roleMode يقرأ الاسم/الدور ونص `trendos_session` كاملًا من browser، واختيار شاشة EasyStore ثم token `postMessage` إلى origin الهدف في app.js:11020+. | tampered storage وspoofed sender وexpired token يرفضهم EasyStore backend؛ UI role hint لا يمنح صلاحية. | UNVERIFIED_HISTORICAL_FINDING / SOURCE_UI_SCOPE_REVIEW |

**تنبيه:** واجهة `getTrendMasterCenterV1931` قد تختار Native D1 أو Apps Script وفق flags والـdispatcher؛ صحة authorization لكل Lane مسجلة مسبقًا تحت `BOOK25-MANAGER-AUTH`، **لا تكررها**. لا إثبات للنسخة المنشورة أو وصول لبيانات حقيقية في هذا التدقيق. كل إصلاح يتطلب مقارنة أحدث HEAD/PRs واختبارات regression، Branch وDraft PR بلا Merge أو Deploy.

## 2026-10-16 — CH25/CH26 runtime triage from current HEAD (10 existing IDs, no duplicates)

**Owner instruction:** All 10 IDs already existed in this register/TEST_EVIDENCE_QUEUE as historical Book Agent findings; do not add duplicate bugs. Checked **Book Agent baseline HEAD `085945acd2f346b9c5b49981c5f59474a8f6627d`** (not `main`/deployed Worker). This section updates *current inspected source* and evidence. Any later draft HEAD must be compared again before another repair. The fix branches below are **DRAFT/UNMERGED**, so this register still points to vulnerable baseline code until reviewed and merged with authorization.

| ID | P | Baseline blob / current inspected source result | Repair or next safe test | Classification / production |
|---|---|---|---|---|
| **BOOK26-MIRROR-GET-AUTH** | P0 | `mirror-gate.mjs` blob `d9321c3a9c1678fd7a53abc6a24df73dbee25ebc`; GET `/sheet` exposes row values/formulas, `/sheets` catalog, `/stats` aggregates, `/capabilities` schema before any auth; `index_v2.js` routes to it, `production-shadow/index.js` forwards to core in source. | `fix/book25-26-p0-auth-20261016`: require migration operator secret **before D1 read**, 8 fake tests + existing Mirror Safety V1 PASS on SHA `08d5e39d2ae89fb17ebf1ad2240efe9f74575704`; [CI #38909856464](https://github.com/fawakhry/TrendOs/actions/runs/38909856464); [Draft PR #137](https://github.com/fawakhry/TrendOs/pull/137). Inventory authorized consumers before deploy. | `STILL_PRESENT_SOURCE -> PATCHED_TESTED_ON_DRAFT`; `PRODUCTION_VERIFIED=NO`. |
| **BOOK25-MANAGER-AUTH** | P0 | `employee-core-native-v1.mjs` blob `90b8d2d2353b3cbb2d85f8500e54bc64cfc3c82e`: employee session authenticated, but `getActivityLog` and `getTrendMasterCenterV1931` had **no role gate** before private employee/finance queries; UI `manager-center-v1932.js` hides button only. | Same [PR #137](https://github.com/fawakhry/TrendOs/pull/137): require explicit role `admin` before private SQL. 8 synthetic P0 tests covering denied print/laser/service, anonymous/expired, authorized admin and mirror; old manager direct regression PASS in [CI #38909856464](https://github.com/fawakhry/TrendOs/actions/runs/38909856464). Review real admin-role policy before staging. | `STILL_PRESENT_SOURCE -> PATCHED_TESTED_ON_DRAFT`; `PRODUCTION_VERIFIED=NO`. |
| **BOOK26-NORMALIZED-FINAL-PROOF** | P1 | `normalized-import-gate.mjs` blob `116398e82baae83260a5698e4a8e859665a9a68e`; `syncFinal!==false` made omitted final flag TRUE; `sourceRowCounts` caller-supplied, with no durable per-chunk manifest. V1/V2 producers do send explicit markers, but missing/out-of-order/replay may still advance freshness. | [Draft PR #139](https://github.com/fawakhry/TrendOs/pull/139) strictly requires explicit boolean final, runId, nonnegative integer counts; fake 4/4 + SQLite import regression PASS at `5401d9abbab3d6529c8d20f8c2cd6ed421c3950b`, [CI #38910255737](https://github.com/fawakhry/TrendOs/actions/runs/38910255737). **Partial guard only**; still needs durable manifest / chunk completeness & idempotent final/replay/ACK recovery against fake D1 before closing full issue. | `STILL_PRESENT_SOURCE -> PARTIAL_PATCH_TESTED / BLOCKED_FULL_PROOF`; not production. |
| **BOOK26-DELTA-CAS** | P1 | `mirror-delta-gate.mjs` blob `7822080e6f615d34065b0f2bc042c438443431de`; preflight checks counts/note before D1.batch, but catalog UPDATE does not compare expected version in *same transaction*. This establishes an absent source-level CAS, not an observed production lost update. | **No unsafe edit**. Required: isolated SQLite/D1 transactional race, interleaved conflicting writers, CAS of snapshot/epoch/version and lost-ACK idempotency, then small reviewed patch. The existing `t12-existing-test-mirror-packed-cas-qualification` is for an **isolated test-only different route** and does not fix this handler. | `STILL_PRESENT_SOURCE / BLOCKED_TEST_AND_PROTOCOL`. |
| **BOOK26-DEPLOY-LINEAGE** | P1 | `wrangler.toml` blob `579b06e4918a9ed965be183e69742205f03cdc74`, `production-shadow/index.js` blob `cabf0237c3aea2479b56ab237eeb9877c86254a4`. Configured entrypoint and workflows do not prove actual Worker deployed version or frontend asset SHA. | Read-only artifact/rollout audit: exact deployed Worker version/SHA, UI bundle SHA, flags, CI at source SHA, rollback evidence. **No deploy or rollback performed**. | `BLOCKED_CURRENT_STATE_UNKNOWN / EVIDENCE_MISSING`. |
| **BOOK25-KPI-TRUTH** | P1 | Core native blob `90b8d2d2353b3cbb2d85f8500e54bc64cfc3c82e`; returns `duplicateHealthy:true`, `messageQueue:[]`, `dayClose:null` without all underlying authoritative checks. `true/[]` can be mistaken for real healthy/empty state. | Stubbed-authority/partial-failure UI regression; change response/UI to explicit `UNKNOWN/UNAVAILABLE` without treating false/missing as zeros; verify actual sources before populating. **No code change yet.** | `STILL_PRESENT_SOURCE / SOURCE_KPI_INTEGRITY_RISK`. |
| **BOOK25-WORKQUEUE-MIGRATION** | P1 | `work-queue-v1.js` blob `12f084f0ec8f3fc86f4034bf65eda726d09dd84a` → Apps Script `work-queue-backend-v1.gs` blob `87a82c18889c1c5533d94ed3f965c875c1533485`; Operator Edge V2 blob `7ef7aa4a52246d6423ccd8c27c9457b76bcc8643` proxies Apps Script under flag; independent D1 Operator authority blob `a6423d65c2f5434fcf435e66d232a999bed78b17` has OFF/SHADOW/CANARY/GENERAL contract. | Never activate both writers. Need effective deployed flags, authority table for line ownership, fake concurrent claim, replay, OFF/SHADOW/CANARY negative tests and writer exclusivity across V1/V2/D1. | `BLOCKED_CURRENT_STATE_UNKNOWN / SOURCE_SPLIT_AUTHORITY`. |
| **BOOK25-FEEDBACK-AUTOMATION** | P1 | `config.js` blob `8b83d9afd53d9c7fc95d9fb309ec0bfa350121d2` sets `MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1=false`. `customer-feedback-v1.js` respects that in repo; server `customer-feedback-backend-v1.gs` has lock/scan logic. | **Already safe at source** for AUTO_SCAN OFF. Do not re-enable. Fake-only delivery/duplicate/send-ACK/rating1..5/escalation + verify deployed flag independently; no WhatsApp. | `ALREADY_FIXED_VERIFIED_SOURCE` for *auto-scan off only*; full feedback flow `BLOCKED`. |
| **BOOK25-AI-APPROVAL** | P1 | `docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md` and `MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md` express architecture; documents are not runtime role enforcement or proof of consent for real customer data. | Trace live AI action/router/knowledge writer to owner/customer approval events, default-deny unauthorized price/refund/closing/promotion; synthetic denied-advice-to-mutation tests, data minimization. | `BLOCKED_CURRENT_STATE_UNKNOWN`. |
| **BOOK25-MANAGER-PROGRESSIVE** | P2 | `manager-center-v1932.js` blob `3d83a67f23056e2428b184c29e984fea871627b3`: `load()` calls a **monolithic** `getTrendMasterCenterV1931`; `loadProgressive()` exists but not called; existing Entry646 test asserts this intentionally direct behavior. Progressive reader `trend-master-resilience-v1931.js` targets separate legacy panel API. | **Do not blindly switch** Cloud D1 manager to Apps Script panel reader: that changes data authority and can regress behavior. Fake independent-source availability, timeout/retry and staleness tests, then approved architecture choice. | `STILL_PRESENT_SOURCE / BLOCKED_UI_AUTHORITY_DESIGN`. |

**Global gates:** Never infer production state from historical book chapters, configured flags or draft PR. `TARGET_BASE_HEAD=085945acd2f346b9c5b49981c5f59474a8f6627d`; `PRODUCTION_READ=NO`; `CUSTOMER_DATA=FAKE_ONLY`; `DEPLOY=NO`; `MERGE=NO`; Draft PRs are not fixes applied to users.
