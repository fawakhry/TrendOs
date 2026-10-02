# TrendOS — الكتاب الرئيسي القابل للتحديث

> **MASTER BOOK / Active Zero-Google Core**  
> إصدار الكتاب: **4.14-ZERO-GOOGLE-COMPACT — Entry600 legacy Orders Production repair verified live** · تاريخ التحديث: 2026-10-02 · المستودع: `fawakhry/TrendOs` · فرع العمل: `candidate/t12-full-cloud-cutover-a56-20260929`.

> # ⚠️ اقرأ هذا أولًا — تعليمات إلزامية لأي شات أو مطور
>
> عند بدء أي شات جديد وطلب «اقرأ كتاب TrendOS»، **ابدأ بهذه التعليمات قبل أي تحليل أو تنفيذ**:
>
> 1. **ممنوع التخمين.** لا تستنتج حالة جزء من اسمه أو من وجود ملف كود. إذا لم يوجد دليل كافٍ، اكتب بوضوح: «غير مثبت بعد» وابحث عن الدليل.
> 2. **اقرأ الحي أولًا ثم الأرشيف عند الحاجة.** الحالة الحية في هذا الكتاب هي نقطة البداية، لكن أي بحث عن عطل/قرار/كود/وظيفة/تغيير قديم يجب أن يشمل فهرس الأرشيف في §8A وGit history والصندوق الأسود عند الحاجة.
> 3. **البحث موحّد: حي + أرشيف.** إذا طلب المالك «ابحث عن X»، ابحث أولًا في أقسام الكتاب الحية، ثم في المراجع المؤرشفة المرتبطة، ولا تقل «غير موجود» قبل فحص الاثنين. أعد النتيجة مع تحديد: حي / انتقالي / مؤرشف / غير مثبت.
> 4. **اشرح للمالك بالعربي البسيط.** النتيجة الأساسية تكون عربية مفهومة بدون إغراق في المصطلحات؛ ثم ضع أسماء الملفات والدوال والمسارات والـcommits التقنية الدقيقة عند الحاجة للمطور أو الصيانة.
> 5. **Runtime هو الحكم.** ترتيب قوة الدليل هو: `LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`. وجود كود أو خطة أو migration في GitHub لا يثبت أنه يعمل في Production.
> 6. **لا تُسقط أي جزء من المنصة.** الهدف النهائي للدليل هو تغطية كل شاشة، زر، action، function، ملف حي، Worker، جدول/حقل بيانات، dependency، مسار إدخال/إخراج، عطل معروف، طريقة تشخيص، وطريقة استرجاع.
> 7. **أي ميزة جديدة غير مكتملة بدون توثيقها.** لا تعتبر المهمة منتهية حتى تُضاف خريطتها للكتاب: ماذا تفعل → أين تظهر → نقطة الدخول → الكود → السيرفر → التخزين → النتيجة → الاعتمادات → التشخيص → الاسترجاع/rollback → الدليل الحي.
> 8. **لا تخلط الأرشيف بالحالة الحالية.** التاريخ مهم للبحث والتشخيص لكنه لا يصبح سلطة حالية إلا إذا أثبت Runtime أنه عاد للاستخدام.
> 9. **قبل أي تعديل Production:** تحقق read-only من الحالة الحالية، ثم سجّل النتيجة والخطوة بوضوح. لا تنفذ من ذاكرة شات قديم إذا اختلف الدليل الحالي.
> 10. **معيار اكتمال الكتاب:** لا يُقال إن الكتاب «كامل ومقفول» إلا بعد Coverage Audit يثبت: `LIVE_FUNCTION_WITHOUT_BOOK_MAP=0` و`LIVE_CODE_WITH_UNKNOWN_OWNER_OR_PURPOSE=0` و`LIVE_DATA_WITH_UNKNOWN_SOURCE_OR_DESTINATION=0`، مع تغطية البحث الحي والأرشيف.
>
> **قاعدة تسكين البحث بالعربي:** لكل جزء تقني يُضاف للكتاب، سجّل اسمًا عربيًا واضحًا ومرادفات البحث الشائعة بالعربي بجانب الاسم التقني، حتى يمكن الوصول إليه بالبحث العربي حتى لو كان اسم الملف أو الدالة بالإنجليزية.
>
> **فهرس المستودع الكامل:** `docs/trendos/TRENDOS_REPOSITORY_CATALOG.md` — جرد بحثي كامل للشجرة الحالية: **1,435 ملفًا + 35 مجلدًا = 1,470 مسارًا**، مع كلمات بحث بالعربي لكل مسار. استخدمه مع §8A للبحث في الحي والأرشيف، ولا تعتبر تصنيف المسار إثباتًا لحالة Production.

> **الغرض الحالي:** هذا الكتاب يصف **الحالة الحية، ما انتقل فعليًا من Google إلى Cloudflare/D1، وما بقي لإتمام Zero-Google**. التفاصيل التاريخية لمسارات Google التي أُغلقت أو استُبدلت لا تُكرر هنا؛ تبقى محفوظة في Git history والصندوق الأسود ووثائق الـEntry التفصيلية.

> **قاعدة الدليل:** `LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`. لا تعتبر الخطة أو الكود الموجود في GitHub إثباتًا لحالة Production.

> **قاعدة التسجيل:** كل خطوة جديدة تؤثر في Repo / Cloudflare / D1 / Apps Script / Production تُسجل هنا فورًا بالحالة الفعلية والدليل والخطوة التالية. لا تعيد نسخ سلسلة تاريخية كاملة إذا كانت النتيجة النهائية تكفي.

## 1. الحالة النشطة — Production baseline بعد Entry600

### Frontend
- Canonical frontend: Cloudflare Worker `trendos-ui`.
- Active frontend version: `ff4a2517-042c-48f0-8b43-98621c2a6957` عند 100%.
- Active frontend deployment: `dafdd5bf-b6bd-4467-9fa0-a938e66ea2cf`.
- Qualified frontend source: `c491d3ed9b7e87c5d5f7d7ee0a57e02c3e530281`.
- `MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED=true` live.
- Legacy `updateLine` ذو stable Line ID يذهب إلى `/v1/t12/orders/line-runtime/legacy-update` بدل Apps Script.
- Root/config/edge/app = HTTP 200.
- Browser Refresh recovery وinitial Edge readiness وduplicate-order Arabic message كلها preserved بعد Entry600.
- Independent read-only verify: run `37027847139` = SUCCESS.
- GitHub Pages القديم ليس canonical entrypoint.

### API / D1
- Canonical API Worker: `trendos-d1-api`.
- Migration `0010_t12_duplicate_order_guard.sql` applied.
- Migration `0011_t12_legacy_line_runtime.sql` applied.
- Active API version: `ce156662-a698-47fc-b73c-dfd4657be9f5`.
- Active API deployment: `477ee04d-10ac-4fc3-9ba6-e81691bcd286`.
- Active API bundle SHA-256: `7550c3a82b30acf0f34c52565568df8d7e7d6092ca322b36bbac7726256a0bc6`.
- `ORDER_CREATE_MODE=GENERAL`.
- `DUPLICATE_GUARD_READY=YES`.
- Duplicate guard window = 120000 ms.
- `CUSTOMER_WRITE_MODE=GENERAL`.
- Legacy line runtime health = PASS، `legacySchemaReady=true`، `writeMode=cloud-native+legacy-overlay`.
- `EMPLOYEE_AUTH_MODE=OFF` و`LEGACY_BRIDGE_ENABLED=NO` ما زالا كما هما.
- لا توجد pending migrations بعد Entry600.

### Orders
- New Order CREATE authority يعمل Cloud-native على D1 في GENERAL.
- duplicate-order guard live في API والواجهة.
- refresh disappearance defect مغلق بعد owner acceptance + read-only verification.
- Legacy status/notes update ذو stable Line ID أصبح Cloud/D1 عبر legacy runtime overlay؛ لا يعتمد على Apps Script line lookup لهذا المسار.
- الـ15 stale legacy Orders المؤكدة تم reconcile إلى `تم التسليم` في D1 runtime بدون تغيير Order IDs وبدون Google write.
- Base `sheet_rows` mirror التاريخي بقي كما هو ولم يُعاد كتابته؛ runtime overlay هو طبقة الحالة الحالية.
- لا تُعد أي historical Google Order writer أو canary أو staging workflow سلطة حالية.
- أي Legacy Orders action آخر غير `updateLine` ما زال يظهر في Zero-Google audit يُعامل dependency متبقية حتى يثبت Runtime أنه أزيل.

### Entry596 — أوردرات Legacy قديمة ظاهرة Active رغم أنها مُسلّمة
- الاسم العربي للبحث: **الأوردرات القديمة لا تقفل / البند غير موجود / أوردرات مسلمة ظاهرة / stale legacy orders / legacy line identity**.
- Root cause مؤكد Read-only: D1 Lines mirror متوقف عند `2026-09-26 18:33:08` ويعرض **15 بندًا قديمًا كـ`طلب جديد`**، بينما نفس الـ15 بند في Google الحالي كلها **`تم التسليم`**.
- Google الحالي: 768 بندًا؛ Active = 0؛ `تم التسليم=639`، `جاهز للاستلام=73`، `مكرر=36`، `ملغى=20`.
- D1 read-only diagnosis: run `37018544009`, job `110875375520` = SUCCESS؛ D1 mirror source/row count = 768، stale-active = 15.
- الـ15 المتأثرة: `TM2606150097`, `TM2606150098`, `TM2606150105`, `TM2606160146`, و`4310, 4312-4321`.
- للأوردرات `4310..4321` ثبت date-coercion في Line ID؛ D1 يصلح الهوية للقراءة إلى مثل `4310-01` بينما raw legacy identity تاريخية، ومسار Apps Script `updateLine_` يفشل بالمقارنة ويعيد حرفيًا: `البند غير موجود في الشيت.`
- لا يوجد فقد للأوردرات نفسها؛ المشكلة **stale D1 snapshot + legacy Line-ID write mismatch**.
- ممنوع إصلاحها بالاعتماد على stale `rowNumber` لأن الصف قد يتحرك.
- المسار الدائم المعتمد للتأهيل: **D1-native legacy-line runtime overlay** يطبق status/notes فوق الـmirror قبل الفلترة، ثم ينقل legacy updateLine إلى Cloud؛ لا تعديل Apps Script v159.
- التشخيص لم يغيّر D1 أو Google أو Order Status أو Production.
- الحالة الحالية بعد Entry600: `ROOT_CAUSE_CONFIRMED=YES`, `PRODUCTION_FIX_DEPLOYED=YES`, `BUSINESS_RECONCILIATION_DONE=YES`, `STALE_15_RECONCILED=YES`.
- هذه المشكلة مغلقة Production؛ لا تُعاد معالجة الـ15 مرة أخرى.

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

### Entry599/600 — إصلاح Production للأوردرات القديمة = CLOSED PASS
- المالك صرّح صراحة بالنطاق: `0011 + API + reconcile الـ15 + frontend فقط`.
- إعادة تحقق Google read-only قبل التنفيذ أثبتت أن الـ15 كلها ما زالت `تم التسليم`؛ ملاحظة Order `4317` الحالية `@koko.1072` وتم الحفاظ عليها.
- Entry599 workflow run `37027377098` نفّذ بنجاح:
  - preflight/source qualification = PASS.
  - migration `0011_t12_legacy_line_runtime.sql` = applied.
  - API deploy = PASS؛ active API version بعده `ce156662-a698-47fc-b73c-dfd4657be9f5`.
  - API live bundle SHA-256 = `7550c3a82b30acf0f34c52565568df8d7e7d6092ca322b36bbac7726256a0bc6`.
  - legacy runtime health before reconcile = PASS.
  - exact 15 rows reconciled إلى `تم التسليم`.
  - exact 15 reconciliation events written.
  - frontend target created ثم promoted إلى 100%؛ version `ff4a2517-042c-48f0-8b43-98621c2a6957`.
- أول final postflight داخل Entry599 فشل **بعد نجاح كل mutations** أثناء asset marker check مباشرة بعد promote. طبقنا قاعدة failure-after-mutation: لم نعد أي mutation أو deploy، وعملنا reconcile/read-only مستقل فقط.
- Entry600 independent read-only postflight run `37027847139` = **SUCCESS**:
  - API version `ce156662-a698-47fc-b73c-dfd4657be9f5` @100%.
  - API deployment `477ee04d-10ac-4fc3-9ba6-e81691bcd286`.
  - API SHA exact target = YES.
  - UI version `ff4a2517-042c-48f0-8b43-98621c2a6957` @100%.
  - UI deployment `dafdd5bf-b6bd-4467-9fa0-a938e66ea2cf`.
  - API bindings/vars = PASS.
  - runtime/create/customer/auth/bridge health boundaries = PASS.
  - `t12_legacy_line_runtime` rows = 15، كلها `تم التسليم`.
  - reconciliation events = 15.
  - exact identity set = الـ15 المؤكدة فقط.
  - `4317` note preserved = YES.
  - base mirror unchanged: timestamp `2026-09-26 18:33:08`, row/source count 768.
  - frontend assets passed on independent check attempt 1؛ legacy runtime flag/route + duplicate message + refresh fix all present.
- لا Google Sheets write، لا Apps Script touch، لا Order ID change، لا business CREATE test، ولا route command.
- الحالة النهائية:
```ini
ENTRY600_READONLY_POSTFLIGHT=PASS
PRODUCTION_REPAIR_EFFECTIVE=YES
MIGRATION_0011_APPLIED=YES
API_TARGET_LIVE=YES
LEGACY_15_RECONCILED=YES
LEGACY_15_DELIVERED=YES
FRONTEND_TARGET_LIVE=YES
GOOGLE_SHEETS_WRITE=NO
APPS_SCRIPT_TOUCHED=NO
ORDER_IDS_CHANGED=NO
BUSINESS_CREATE_TEST_SENT=NO
```

### Customers
- Customer master = 247 rows في D1.
- Customer search/write authority = D1-native / GENERAL.
- `CUSTOMER_GOOGLE_FALLBACK=NO`.
- سياسة identity المعتمدة: exact phone أولًا، ثم exact normalized name عند مشاركة الرقم، وأي ambiguity متبقٍ fail-closed.
- لا auto-merge أعمى.

## 2. Google — ما تم قطعه وما يجب حذفه من الذاكرة الحية

المسارات التالية **لا تحتاج شرح Google التاريخي داخل هذا الكتاب** بعد الآن:
- Customer search/write authority القديمة على Apps Script/Sheets.
- Browser direct-to-Google transport للأوردرات؛ الواجهة الحالية تستخدم Cloud transport/Edge.
- Google idle-heartbeat كشرط لعرض Orders بعد إصلاح Entry498 وما تلاه.
- مراحل staging/rehearsal القديمة لـCloud Write V150/V1/V2 التي لا تمثل Production الحالي.
- T11 و02xx وPERF-CF historical qualification/canary workflows بعد إغلاقها أو supersede.
- تجارب TEST mirror وpacked-CAS وfresh-start/canary القديمة بعد أن أصبحت Cloud-native GENERAL هي الحالة الفعلية.
- تفاصيل محاولات deploy/promotion الفاشلة التي superseded بنتيجة Production لاحقة ناجحة.
- وصف GitHub Pages كواجهة تشغيل حالية.
- أي نص قديم يقول إن Customer write authority ما زالت Apps Script.

هذه التفاصيل محفوظة تاريخيًا في Git commits والصندوق الأسود ولا تُستخدم كـcurrent authority.

## 3. Google — dependencies ما زالت حية ولا يجوز حذفها الآن

### Employee Login / Auth
الحالة الأخيرة المؤكدة في الكتاب قبل هذا التنظيف ما زالت:
```ini
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
APPS_SCRIPT_VERSION=159
```

لذلك **لا تحذف Apps Script/Auth من الخطة أو من Runtime قبل Cutover متحقق**.

A61 بنى وجرّب foundation لـD1-native auth، migration `0009_employee_auth_native_v1.sql`، native session، dispatcher، وcompatibility bridge، لكن الحالة الحية المسجلة لا تسمح باعتبار Employee Login D1-native مكتملًا.

قواعد Auth:
- لا plaintext passwords.
- لا تخزين pepper أو raw session tokens في Repo/docs.
- لا تدوير `AUTH_PASSWORD_PEPPER` عشوائيًا طالما legacy hashes قد تعتمد عليه.
- أي bridge انتقالي يكون محدودًا ومثبتًا ويُغلق بعد نقل الـactions.
- لا تعتبر D1 auth tables الموجودة دليلًا على أن سلطة Login انتقلت.

الهدف:
```ini
EMPLOYEE_LOGIN=D1_NATIVE
EMPLOYEE_SESSION=D1_NATIVE
APPS_SCRIPT_AUTH_FALLBACK=NO
```

### Legacy business actions
Zero-Google audit السابق أثبت بقايا Google/Apps Script في عائلات تشمل:
- Auth / Session.
- Legacy Orders actions غير المنقولة.
- Attendance / Cleaning / HR / Press.
- Accounting / Party ledger.
- Customer portal / conversations / files / proofs حيث لم يثبت cutover النهائي.
- Trend Master / notes / customer-manager / feedback / automation حيث لم يثبت cutover النهائي.
- Marketplace / platform / franchise / white-label.

**لا تقلب generic API base عالميًا قبل نقل العائلات المطلوبة وإثباتها Runtime.**

## 4. ترتيب Zero-Google من الحالة الحالية

1. Employee Login/Auth/Session → D1-native مع إغلاق Apps Script auth fallback.
2. Legacy Orders actions المتبقية → Cloud/D1، مع الحفاظ على Order IDs/Status وعدم عمل CREATE تجريبي بلا حاجة مثبتة.
3. Attendance / Cleaning / HR / Press.
4. Accounting / Party ledger.
5. Customer portal / conversations / files / proofs.
6. Trend Master / notes / customer-manager / feedback / automation.
7. Platform content / marketplace / franchise / white-label.
8. Flip generic API base فقط بعد إغلاق dependencies المطلوبة.
9. Final Runtime audit لإثبات Zero-Google.

## 5. معيار الإغلاق النهائي

لا يعلن Zero-Google مكتملًا إلا إذا أثبت Runtime:
```ini
RUNTIME_SCRIPT_GOOGLE_COM=0
RUNTIME_DOCS_GOOGLE_COM=0
APPS_SCRIPT_RUNTIME_FALLBACK=0
GOOGLE_SHEET_RUNTIME_AUTHORITY=0
GOOGLE_RUNTIME_DEPENDENCY=0
ZERO_GOOGLE_COMPLETE=YES
```

وجود historical source أو docs أو Git commits تخص Google لا يعني Runtime dependency؛ المطلوب صفر اعتماد تشغيلي حي.

## 6. قواعد التنفيذ أثناء النقل

- افحص Production read-only قبل أي mutation.
- لا تنشر Apps Script/Worker/Frontend من مجرد وجود source مؤهل.
- كل Production mutation تحتاج scope واضح وpreconditions وpostflight.
- لا تعيد migration تاريخية اعتمادًا على migration list وحده؛ افحص schema/runtime truth.
- حافظ على Secrets/Variables/Bindings/Routes ما لم تكن داخل scope مصرح به.
- افصل create-version عن promote عندما يكون ذلك أكثر أمانًا.
- عند failure بعد mutation محتملة: read-only reconcile أولًا، ولا تكرر العملية عميانيًا.
- لا تستخدم historical workflows كاختصار لإصلاح حالي بدون إعادة تأهيلها.
- لا تغير Order IDs أو Order Status أثناء أعمال Auth migration.
- لا ترسل business CREATE test إلا عند ضرورة مثبتة وتصريح واضح.
- GitHub source لا يساوي live runtime؛ Runtime Evidence هو الحكم.

## 7. خريطة السلطة الحالية

| المجال | السلطة الحالية الموثقة | Google dependency |
|---|---|---|
| Frontend hosting | Cloudflare Worker Assets | لا كاستضافة canonical |
| Customer master/search/write | D1 / Cloudflare GENERAL | لا |
| New Order CREATE | D1 / Cloudflare GENERAL | لا للمسار الجديد |
| Duplicate-order guard | D1 + Cloudflare API/UI | لا |
| Orders refresh/read recovery | Cloudflare Edge/D1 path verified | لا direct browser Google fallback |
| Employee Login/Auth | Google/Apps Script-backed حسب آخر evidence | **نعم** |
| Legacy employee/business actions | Mixed أثناء Zero-Google | **نعم، حتى يثبت نقل كل عائلة** |
| Apps Script | Version 159 موجود في Production حسب Entry595 | **لا يُحذف بعد** |

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

## 10. Cleaning checkpoint — 2026-10-02

تم تنظيف الكتاب بناءً على قرار المالك أثناء مشروع النقل Google → Cloud:
- أزيلت من الكتاب الحي التفاصيل المطولة الخاصة بمراحل Google التي انتقلت أو أصبحت historical/superseded.
- لم تُحذف أي dependency Google ما زالت مثبتة كحالة تشغيلية.
- لم يحدث أي Runtime/Cloudflare/D1/Apps Script mutation بسبب هذا التنظيف.
- Git history يحتفظ بالنسخة السابقة كاملة عند blob `9f5af80f436effbd3154751d05032608d657462a`.
- المرجع التفصيلي التاريخي يبقى الصندوق الأسود وتقارير Entries.
- أي Cutover لاحق يجب أن يحذف من قسم dependencies فقط بعد Runtime verification، لا بعد source/CI وحدهما.


## 11. خارطة الطريق بعد Zero-Google — TrendOS V1 المستهدف 01/03/2027

> **قاعدة الاستئناف:** لا تبدأ هذه الخارطة كبرنامج التنفيذ الرئيسي قبل إغلاق §5 وإثبات `ZERO_GOOGLE_COMPLETE=YES`. بعد Zero-Google تُعاد baseline/GO-NO-GO للحالة الفعلية ثم تُستكمل المراحل من أول بوابة غير مغلقة. الهدف 01/03/2027 هدف Product وليس ضمان موعد إذا لم تجتز البوابات.

### Phase 0 — Canonical Memory and Control Plane
**الهدف:** ذاكرة مشروع دائمة، Roadmap، Decision Register، provenance، وhandoff يستطيع أي شات جديد استئناف العمل منه دون المحادثات القديمة.

**Exit gate:** فهم scope/current state/next step من GitHub وحده.

### Phase 1 — Core + Cloud
**الهدف:** Core صحيح، idempotent، observable، recoverable وسريع بما يكفي قبل الطبقات الأعلى.

**Work order الأصلي:** inventory للإنتاج والـroutes/triggers/sheets؛ integrity baseline؛ event/lock/idempotency/write/retry map؛ integrity foundation؛ Order/Line integrity؛ Business Calendar؛ Attendance/Cleaning؛ Press؛ Invoice/pricing/drafts؛ WhatsApp idempotency؛ OPS alerts؛ observability؛ D1 atomic sync/read/auth performance؛ regression؛ E2E؛ Core GO/NO-GO.

**Core exit gates:** zero active duplicate Line IDs؛ لا duplicate invoice drafts؛ pricing integrity؛ closed/delivered لا يعودان للطوابير؛ Press parity/sessions؛ Attendance/Cleaning idempotency؛ Line IDs literal text؛ WhatsApp idempotency؛ concurrency/rollback/checkpoint PASS؛ لا CORE-P0 blockers.

**بعد Zero-Google:** لا تعيد تنفيذ البنود التي أصبحت مثبتة Runtime في §1؛ اعمل gap review مقابل البوابات فقط، ثم اقفل Phase 1 رسميًا.

**مسار الأولوية التاريخي داخل Core:** Operator Tasks → Department Invoice + Material Shadow/Parity (Gaber LASER + Wael PRINT) → Laser + Print Accounting Control → RP-08. يعاد تقييمه بعد Zero-Google ولا يُنفذ تلقائيًا من حالته التاريخية.

### Phase 2 — Customer 360 + Unified Communication — Oct 2026 plan
**الهدف:** هوية ورحلة عميل واحدة عبر Orders, Payments, Designs, Messages, Feedback, Loyalty.

**Deliverables:** Customer 360؛ Customer Portal integration؛ Unified Inbox؛ WhatsApp production-safe integration؛ Feedback؛ Points/Loyalty؛ role-based communication permissions؛ customer/order/message linkage.

**Target flow:** `Message -> Customer -> Order -> Status/Payment/Design context -> Reply/Follow-up`.

**Exit gate:** رحلة عميل end-to-end بلا duplicate identity أو unsupported AI facts.

### Phase 3 — Matbagy AI Brain — Nov 2026 plan
**الهدف:** تحويل Matbagy AI إلى طبقة معرفة/مساعد محكومة داخل TrendOS.

**Deliverables:** model health/management؛ exact-memory verification؛ approved-reply + feedback learning؛ tenant-separated memory؛ retrieval/embeddings عند الحاجة؛ TrendOS live connector؛ confidence/escalation policy؛ WhatsApp learning pipeline عند الاعتماد.

**Non-negotiable:** live order status/stock/final price/payment/customer approval تأتي من TrendOS source-of-truth وليس RAG.

### Phase 4 — Smart Designer — Dec 2026 plan
**الهدف:** Design workflow إنتاجي مرتبط بـOrder/Line.

**Priority products:** Mug 20×9؛ Kids 7×10؛ Collage؛ Invitations؛ Graduation؛ Laser/vector.

**Target architecture:** `Template Engine -> Layer Editor -> Local AI -> Premium AI (optional) -> Proof -> Approval -> Print Ready -> Archive`.

**Exit gate:** طلب تصميم شائع يكتمل من Order Line إلى approved print-ready output مع archive/version lineage.

### Phase 5 — Lead Hunter + CRM + Growth — Jan 2027 plan
**الهدف:** تحويل اكتشاف الـLead إلى acquisition pipeline قابل للقياس داخل TrendOS.

**Target flow:** `Source -> Lead -> Qualification -> Customer -> Order -> Revenue attribution`.

**Deliverables:** source tracking؛ lead scoring؛ suggested reply؛ follow-up state؛ conversion workflow؛ CRM integration؛ acquisition analytics.

لا يعتمد Launch على Facebook scraping غير معتمد.

### Phase 6 — Full Integration — 01/02/2027 → 15/02/2027
**الهدف:** لا major new features؛ ربط واختبار دورة المنصة كاملة.

`Lead -> Customer -> Order -> Design -> Approval -> Production -> Invoice -> Payment -> Delivery -> Feedback -> AI Learning`

**Exit gate:** IDs/permissions/audit/state transitions متسقة عبر الوحدات.

### Phase 7 — Launch Hardening — 15/02/2027 → 25/02/2027
Security؛ permissions؛ backup/restore؛ rollback؛ observability؛ performance؛ mobile UX؛ error handling؛ fallback behavior؛ role tests؛ data integrity؛ customer/employee/manager regression.

**Feature freeze** باستثناء launch blockers.

### Phase 8 — Launch Rehearsal — 25/02/2027 → 28/02/2027
تشغيل المنظومة كبروفة Launch كاملة لنفس lifecycle؛ لا optional features جديدة؛ كل critical failure يُصلح ويعاد اختباره؛ final backups/checkpoints؛ ثم GO/NO-GO موثق.

### Launch target — 01/03/2027
تعريف V1: دورة تشغيل كاملة تستطيع:

`Find Customer -> Talk -> Sell -> Design -> Produce -> Collect -> Deliver -> Learn -> Grow`

V1 يشمل: Core Operations؛ Customer 360/Communication؛ Matbagy AI controlled assistant؛ Smart Designer للأولويات؛ Lead Hunter/CRM؛ Accounting/operations linkage؛ team/attendance/press/handover integrity؛ administration/control-tower view.

### Post-V1 — ليست Launch blockers
Marketplace؛ supplier network؛ commercial logistics marketplace؛ broader white-label network؛ VR/virtual-city concepts. تبدأ بعد إثبات V1 operational stability.

### مصدر الاستعادة
أعيد هذا القسم من النسخة السابقة للكتاب عند commit `be8df986bc65e4d80e80504e841e50be9301ceb1` ومن `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`. تم حذف وصف Google التاريخي المتقادم من الشجرة القديمة عمدًا؛ خارطة المنتج نفسها محفوظة هنا لتُستأنف بعد Zero-Google.


## 12. الدليل الهندسي للبرنامج — خريطة الكود الحي (المرحلة الأولى)

> **قاعدة الإكمال الجديدة:** أي وظيفة في TrendOS لا تعتبر مكتملة توثيقيًا حتى يكون لها: شرح مالك بسيط + ملفاتها + نقطة الدخول + مسار البيانات + مصدر التخزين + اعتمادها التشغيلي + طريقة التشخيص/الاسترجاع. وجود ملف في GitHub وحده **لا يثبت** أنه مستخدم في Production.

### 12.1 طبقات البرنامج ومداخل الصيانة

| الجزء | ماذا يفعل | أهم ملفات/مجلدات المصدر | الحالة التي يعتمدها هذا الكتاب |
|---|---|---|---|
| الواجهة الرئيسية | الشاشات وتجربة الموظف | `app.js`, `config.js` وملفات الواجهة المساعدة مثل `trendos-edge-orders-read-v1.js` | Cloudflare frontend هو canonical حسب §1؛ الملف الموجود في GitHub لا يساوي النسخة المنشورة إلا بدليل Runtime |
| API السحابي | يستقبل طلبات الواجهة ويقرأ/يكتب D1 | `cloudflare-d1/`, إعداد `cloudflare-d1/wrangler.toml`، ومصادر Worker تحت مجلداته | `trendos-d1-api` هو API canonical للأجزاء المثبت نقلها في §1 |
| قاعدة البيانات | تخزين Cloud الحالي والجداول وتغييرات البنية | `cloudflare-d1/migrations/` | D1 هو authority للأجزاء المثبتة في §1؛ migration file لا يعني أنه طُبق إلا بدليل Runtime |
| Apps Script القديم/الانتقالي | ما زال يحمل وظائف لم تُنقل بالكامل | `Code.gs`, `apps-script/`, وملفات `*.gs` المتخصصة | dependency حية فقط للعائلات المذكورة في §3 حتى يثبت Cutover |
| تسجيل الموظفين | Login/Session ومسار النقل إلى D1 | `employee-api-dispatcher-v1.js`, `D1_Fast_Auth_V2_5_Safe.gs`, auth migration تحت `cloudflare-d1/migrations/` | ما زال GOOGLE_BACKED حسب آخر Runtime evidence؛ كود D1 الموجود foundation وليس إثبات Cutover |
| الأوردرات | إنشاء/قراءة/استرجاع الأوردرات ومنع التكرار | `trendos-edge-orders-read-v1.js`, `cloudflare-d1/`، migrations ومنها duplicate guard | New Order CREATE + read recovery + duplicate guard Cloud/D1 حسب §1؛ أي legacy actions تُراجع منفصلة |
| العملاء | البحث والكتابة وهوية العميل | `trendos-edge-orders-read-v1.js` ومسارات customer في Cloudflare؛ `customer-manager-backend-v1932.gs` لوظائف manager legacy | Customer master/search/write = D1؛ Customer Manager كعائلة أوسع لا تعتبر منقولة لمجرد وجود backend |
| الحضور | حضور الموظفين وعمليات clock-in | `attendance-backend-v1.gs`, `attendance-clockin-backend-v1.gs`, `ATTENDANCE_V1_INTEGRATION.md`, router داخل `Code.gs`/مساراته | ما زال ضمن عائلات Zero-Google المفتوحة في §3 |
| طوابير العمل | توزيع ومتابعة مهام التشغيل | `work-queue-backend-v1.gs`, `work-queue-v1.js`, `WORK_QUEUE_V1_CANDIDATE.md`, `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md` | يحتاج Runtime qualification مستقل قبل وصف أي candidate بأنه live |
| الحسابات | الحسابات والدفاتر والفواتير والرقابة | `accounting/`, `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`, `docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md`, `trendos-invoice-integrity-v1.gs` | Accounting/Party ledger ما زالت عائلة مفتوحة للنقل حسب §3 |
| واتساب/التواصل | رسائل وربط العميل ومراقبة التكرار | `WHATS_AGENT_BOOK.md`, `trendos-whatsapp-integrity-v1.gs`, ووظائف WhatsApp داخل backends ذات الصلة | لا تُعتبر Cloud-native بالكامل إلا حسب evidence لكل مسار |
| سلامة البيانات | منع التكرار وحماية Order/Line/Invoice/Press | `trendos-integrity-v1.gs`, `trendos-order-line-integrity-v1.gs`, `trendos-invoice-integrity-v1.gs`, `trendos-press-integrity-v1.gs` | أدوات/مصادر مهمة؛ Runtime هو الحكم على تفعيل كل واحدة |
| التوثيق والأدلة | يشرح لماذا وكيف تغيّر النظام | `TrendOS_MASTER_BOOK.md`, `docs/trendos/`, `docs/trendos/blackbox/` | الكتاب للحالة الحية؛ §8A هو مدخل الأرشيف |

### 12.2 مسار نموذجي موثق — الأوردر الجديد

بالبلدي: الموظف ينشئ الأوردر من الواجهة → الواجهة تستخدم مسار Cloud المؤهل → API `trendos-d1-api` يتحقق من الطلب ومنع التكرار → البيانات تُكتب في D1 → القراءة/الاسترجاع بعد Refresh تعود من مسار Edge/D1 المثبت.

خريطة الصيانة:
`واجهة/app.js + config.js -> trendos-edge-orders-read-v1.js -> trendos-d1-api -> D1 -> نتيجة الواجهة`.

عند عطل الأوردر الجديد نراجع بالترتيب: الواجهة/config → transport/edge → API active deployment → D1/migration/schema → read-back/refresh. لا نرجع إلى Google writer تاريخي إلا إذا أثبت Runtime أن action بعينها ما زالت legacy.

### 12.3 مسار نموذجي موثق — تسجيل الموظف

بالبلدي: تسجيل الموظف **ليس مقفول Cloud حتى الآن**. توجد بنية وكود نقل إلى D1، لكن آخر دليل حي في §3 يقول إن السلطة ما زالت Google/Apps Script-backed.

خريطة المصدر الحالية أثناء النقل:
`واجهة الموظف -> employee-api-dispatcher-v1.js / المسار الحالي -> Auth/Session authority الحالية`، مع foundation في D1 لا يتحول إلى authority إلا بعد Cutover + Runtime verification.

### 12.4 سجل تغطية الدليل

**جرد مسارات GitHub اكتمل كفهرس بحثي** في `docs/trendos/TRENDOS_REPOSITORY_CATALOG.md`: الشجرة المتحققة غير مبتورة (`truncated=false`) وتغطي 1,435 ملفًا و35 مجلدًا بعد إضافة الكتالوج. هذا لا يعني أن توصيف وظيفة ومكان كل سطر كود اكتمل. **المتبقي لإغلاق الدليل الهندسي:** تصنيف Runtime لكل ملف Live / Transitional / Candidate / Historical / Test بالدليل، ثم خريطة كل شاشة وزر/action والدوال التابعة، ثم جداول D1 والعلاقات، ثم Runbook أعطال لكل عائلة، ثم Coverage audit يثبت أن كل كود حي وكل وظيفة حية لها مرجع في الكتاب.

معيار الإغلاق النهائي للدليل:
`LIVE_FUNCTION_WITHOUT_BOOK_MAP=0`
`LIVE_CODE_WITH_UNKNOWN_OWNER_OR_PURPOSE=0`
`LIVE_DATA_WITH_UNKNOWN_SOURCE_OR_DESTINATION=0`
