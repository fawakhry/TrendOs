# TrendOS — الكتاب الرئيسي القابل للتحديث

> **MASTER BOOK / Active Zero-Google Core**  
> إصدار الكتاب: **4.17-ZERO-GOOGLE-COMPACT — Entry607 post-disconnect resume checkpoint** · تاريخ التحديث: 2026-10-03 · المستودع: `fawakhry/TrendOs` · فرع العمل: `candidate/t12-full-cloud-cutover-a56-20260929`.

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
- Active frontend version: `adfb5056-af23-4d7f-8e12-7de6417dfce2` عند 100%.
- Active frontend deployment: `a066abb8-4c33-4050-813b-123df4140450`.
- Login-fast qualified source: `9150049fb169c9ca122003b5dc0b2bd960de61ed`.
- Unauthenticated login/entry surface no longer eagerly fetches the 18 employee runtime modules; 2 critical modules start only after employee session boot, and the remaining 16 are deferred 250ms after authenticated boot.
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
- التقرير التفصيلي المؤرشف: `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_ORDERS_PRODUCTION_REPAIR_ENTRY_599_600_2026-10-02.md`.
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


### Entry615 — Zero-Google current-data backfill preview
- الاسم العربي للبحث: **نسخ آخر بيانات Google الحية إلى D1 Native بدون إبقاء Google Runtime**.
- يبدأ بعد Entry614 الذي أثبت:
  - Employee business source coverage = **46/46**.
  - `sheet_rows/sheet_catalog` runtime dependency = **0**.
  - كل العائلات الجديدة default-OFF.
  - Production لم تُلمس.
- بعد انقطاع النت تم الرجوع للحالة الفعلية: آخر HEAD قبل Entry615 كان `f59840978424d40467ac01fbac07a79603ce439e`; لا يوجد Backfill Production منفذ ولا Entry615 مسجل في الكتاب.
- تم تصدير نسخة XLSX read-only من Google Sheet التشغيل الحالي:
  - Spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
  - Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
  - observed sheets = **91**
  - snapshot SHA256: `f36ca58ad8ec42901f54e3145c3b313374aaaf950a44d973d8bf4ca8470974db`
- لا تعديل على Google/Apps Script تم؛ القراءة/export فقط.
- Backfill mapping مؤهل محليًا من الـXLSX الحالي إلى D1 native families. أهم source counts:
  ```ini
  CURRENT_ORDERS=222
  CURRENT_LINES=250
  ARCHIVE_ORDERS=3361
  ARCHIVE_LINES=4628
  ORDER_EVENTS=12724
  ATTENDANCE_DAYS_SOURCE=119
  ATTENDANCE_PULSES=186
  CLEANING_SOURCE=207
  FEEDBACK_SOURCE=176
  GO_LIVE_DRAFT_SOURCE=41
  NOTES=264
  KNOWLEDGE=14
  ACCOUNTING_DEPT_LINES=18
  ACCOUNTING_FINAL_INVOICES=3
  PARTY_LEDGER_ROWS=7
  ```
- Canonical D1 target counts after deterministic dedupe:
  ```ini
  ATTENDANCE_DAYS=87
  ATTENDANCE_PULSES=186
  CLEANING_ROWS=80
  FEEDBACK_REQUESTS=166
  GO_LIVE_DRAFTS=39
  CURRENT_ORDERS=222
  CURRENT_LINES=234
  ARCHIVE_ORDERS=3361
  ARCHIVE_LINES=3565
  ORDER_EVENTS=12724
  CONTENT_RECORDS=284
  CONVERSATIONS=1
  MESSAGES=6
  RETAINED_LEGACY_ROWS=1250
  ```
- Deduplication لا يحذف التاريخ:
  - attendance extras = 32.
  - cleaning extras = 127.
  - feedback extras = 10.
  - go-live draft extras = 2.
  - current-line duplicates = 16.
  - archive-line repeated snapshots = 1063.
  - كل الـ**1250** row الزائدة تُحفظ في `employee_zero_google_legacy_rows_v1` مع source sheet/row/reason/raw JSON.
- Parity guards:
  ```ini
  ATTENDANCE_PULSE_ORPHANS_AFTER_REMAP=0
  CURRENT_LINE_MISSING_CURRENT_ORDER_PARENT=0
  RUNTIME_SHEET_MIRROR_DEPENDENCY=0
  EMPLOYEE_BUSINESS_TOP_LEVEL_COVERAGE=46/46
  ```
- تم إصلاح source قبل Backfill:
  - stale default Service Route seed أزيل من migration 0013 في commit `5784cbe6f087ff609b2005aa5fe0f8c5f5f6103e`.
  - retention/parity migration `0018_zero_google_backfill_retention_v1.sql` أضيف في commit `8f87c201663255a69f39d0a9d386344abe1d6f29`.
  - Entry615 manifest أضيف في commit `bea226e3be0442505346e63f24e24c6892a8b527`.
  - aggregate preview evidence أضيف في commit `b5f0d12c1f24467aec53f6393d9bdba2bb525405`.
- Backfill generator/package:
  - تم بناء generator محلي robust من الـXLSX الحالي.
  - نتج SQL محلي ≈ 35 MB، وحزمة مضغوطة ≈ 1.2 MB.
  - **Production data داخل SQL لم تُرفع إلى GitHub عمدًا**.
  - الحزمة مخصصة للتنفيذ اليدوي على D1 بعد تطبيق migrations 0012→0018 والتحقق من OFF controls.
- مهم: source snapshot الحالي أظهر 2 attendance pulse session IDs غير موجودة كسطور مستقلة في سجل الدوام، لكن كلاهما لنفس employee/date له canonical attendance session؛ generator يعيد ربطهما بالـcanonical session، لذلك `ATTENDANCE_PULSE_ORPHANS_AFTER_REMAP=0`.
- الحالة التشغيلية لم تتغير:
  ```ini
  Employee_Auth=OFF
  Employee_Bridge=OFF
  Employee_Ops_Control=NOT_APPLIED_OR_OFF
  Employee_Content_Control=NOT_APPLIED_OR_OFF
  Employee_Comms_Control=NOT_APPLIED_OR_OFF
  Employee_Accounting_Control=NOT_APPLIED_OR_OFF
  Employee_Core_Control=NOT_APPLIED_OR_OFF
  Google_Employee_Runtime=STILL_LIVE
  ZERO_GOOGLE_COMPLETE=NO
  ```
- لا نعتبر Zero-Google مكتملًا قبل:
  1. تطبيق migrations 0012→0018 مع controls OFF.
  2. Backfill SQL APPLY.
  3. D1 parity = PASS.
  4. family-by-family READONLY ثم GENERAL cutover.
  5. frontend legacy business fallback = 0.
  6. Employee Login/Auth → D1 Native كآخر خطوة.
  7. إيقاف Apps Script employee runtime وGoogle migration/sync.
- التسجيل:
  ```ini
  STATUS=ENTRY615_BACKFILL_PREVIEW_PASS_WAITING_MANUAL_D1_APPLY
  COMMIT=b5f0d12c1f24467aec53f6393d9bdba2bb525405
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  NEXT_ACTION=MANUAL_APPLY_MIGRATIONS_0012_TO_0018_WITH_CONTROLS_OFF_THEN_APPLY_ENTRY615_BACKFILL_SQL_AND_RUN_PARITY
  ```
- Final read-only Runtime check after Entry615 preview:
  ```ini
  EMPLOYEE_AUTH_MODE=OFF
  EMPLOYEE_AUTH_ENV_ENABLED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  LEGACY_BRIDGE_ENABLED=NO
  LEGACY_BRIDGE_SECRET_CONFIGURED=NO
  LEGACY_BRIDGE_ALLOWED_POLICY_COUNT=0
  ORDER_CREATE_MODE=GENERAL
  DUPLICATE_GUARD_READY=YES
  CUSTOMER_WRITE_MODE=GENERAL
  CUSTOMER_COUNT_RUNTIME=251
  LINE_RUNTIME_SCHEMA=READY
  LINE_RUNTIME_WRITE_MODE=cloud-native+legacy-overlay
  ```
- Runtime supersedes the older historical customer count in §9; current count is **251**.
- No mutation occurred in this check.
- التسجيل:
  ```ini
  STATUS=ENTRY615_PREVIEW_AND_RUNTIME_POSTCHECK_PASS
  Production_touched=NO
  D1_touched=NO
  Apps_Script_touched=NO
  Secrets_touched=NO
  NEXT_ACTION=OWNER_MANUAL_D1_SCHEMA_AND_BACKFILL_APPLY
  ```
- Owner manual D1 migration attempt 0012 Run1:
  - Cloudflare D1 Console returned: `SQL code did not contain a statement.`
  - immediate verification query returned: `no such table: employee_ops_control_v1`.
  - therefore migration **0012 did not apply** and no employee ops schema/control was created.
  - this is treated as a failed/no-op schema attempt; no cutover or backfill occurred.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0012_RUN1_FAIL_NO_SCHEMA_CHANGE
  D1_touched=NO_EFFECT
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=RETRY_0012_WITH_D1_CONSOLE_CLEAN_SQL_NO_COMMENTS_NO_PRAGMA
  ```
- Owner manual D1 migration 0012 retry with D1-console-clean SQL:
  - Cloudflare Console: **This query successfully executed.**
  - verification:
    ```ini
    singleton=1
    marker=ENTRY614_EMPLOYEE_OPS_V1
    mode=OFF
    policy_epoch=1
    ```
  - therefore 0012 schema is applied and its control remains safely OFF.
  - no family cutover/backfill/API/frontend/Auth mutation occurred.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0012_APPLIED_PASS
  MIGRATION=0012_employee_ops_zero_google_v1
  D1_touched=YES_SCHEMA_ONLY
  EMPLOYEE_OPS_MODE=OFF
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=APPLY_0013_EMPLOYEE_CONTENT_ZERO_GOOGLE_V1_KEEP_OFF
  ```


### Entry615A — Pause for Cloud Auth Shadow idle-expiry production bug
- أثناء التنفيذ اليدوي بعد نجاح migration 0012، ظهر في TrendOS Production:
  ```text
  طلب موظف قديم أو غير مؤكد تم إيقافه على Cloud؛ الجلسة الحالية لم تُلغَ.
  ```
- تم إيقاف أي migration جديدة فورًا؛ **0013 لم يتم تنفيذه**.
- المصدر الدقيق للرسالة:
  - `cloudflare-d1/src/legacy-browser-transport-v1.mjs`
  - code: `EMPLOYEE_SESSION_SHADOW_REQUIRED`
  - employee business actions تمر عبر `/v1/legacy-api` وتحتاج Cloud Auth Shadow hit.
- Runtime/source diagnosis:
  ```ini
  TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED=true
  CLOUD_AUTH_SHADOW_TTL_SECONDS=300
  CLOUD_AUTH_SHADOW_MAX_SECONDS_IN_SOURCE=900
  APPS_SCRIPT_EMPLOYEE_SESSION_TTL_DEFAULT_HOURS=12
  ```
- Root cause: Cloud Shadow expires after **5 minutes idle**, while the real employee session remains valid up to **12 hours**. After idle >5m, the next employee business action fails before reaching Apps Script.
- This bug is independent from migration 0012:
  - 0012 only created new D1 tables.
  - `employee_ops_control_v1.mode=OFF`.
  - no frontend/API routing was changed by 0012.
- Immediate safe recovery for an affected browser is a fresh employee login, which creates a new Cloud shadow; however that is only a temporary workaround because the 5-minute idle-expiry remains.
- التسجيل:
  ```ini
  STATUS=ENTRY615A_PAUSED_FOR_CLOUD_AUTH_SHADOW_IDLE_EXPIRY_BUG
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=NOT_APPLIED
  EMPLOYEE_OPS_MODE=OFF
  ROOT_CAUSE=CLOUD_AUTH_SHADOW_5_MIN_IDLE_EXPIRY
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=QUALIFY_REPO_ONLY_SHADOW_TTL_FIX_BEFORE_RESUMING_0013
  ```
- Repo-only permanent fix prepared:
  - `cloudflare-d1/src/cloud-auth-shadow-v1.mjs`
    - default/max shadow TTL changed from 300/900 seconds to **43200 seconds (12h)**.
    - commit `4feca2a9ccb917f3005b607b231a215d53928828`.
  - `cloudflare-d1/wrangler.toml`
    - `CLOUD_AUTH_SHADOW_TTL_SECONDS="43200"`.
    - Native Auth remains OFF.
    - Legacy Bridge remains OFF.
    - commit `370abd188e76384fa0388bbdfaffeaf23b09bfa6`.
  - dedicated regression test `tests/cloud_auth_shadow_idle_ttl_entry615a.test.mjs`
    - commit `0523ef3d34b8de7c044e086fcc77ac62374d9615`.
- Dedicated CI:
  - Workflow commit `891ab6b06f80b5d451cc84758c2a8aafae602f60`.
  - Run `37195215253`.
  - Job `111415550894`.
  - conclusion = **SUCCESS**.
  - proved:
    ```ini
    ENTRY615A_SOURCE_TTL_12H=YES
    ENTRY615A_IDLE_OVER_5_MINUTES=PASS
    ENTRY615A_EXACT_FINGERPRINT_REVOKE=PASS
    ENTRY504_STALE_EMPLOYEE_TOKEN_RACE_GUARD=PASS
    A61_SERVER_SIDE_LEGACY_TRANSPORT=PASS
    ENTRY533_EMPLOYEE_SESSION_ISOLATION=PASS
    ENTRY615A_PRODUCTION_NATIVE_AUTH_OFF=YES
    ENTRY615A_PRODUCTION_BRIDGE_OFF=YES
    PRODUCTION_DEPLOY=NO
    D1_MUTATION=NO
    FRONTEND_DEPLOY=NO
    APPS_SCRIPT_TOUCHED=NO
    ```
- Immediate workaround before the Worker fix is deployed: a fresh employee logout/login creates a new 5-minute shadow and restores the current browser temporarily. This is not a permanent fix.
- 0013 remains paused until the Production API worker carries the qualified 12-hour shadow fix and the affected employee screen is rechecked.
- التسجيل:
  ```ini
  STATUS=ENTRY615A_SHADOW_TTL_FIX_QUALIFIED_WAITING_PRODUCTION_API_DEPLOY
  RUN_ID=37195215253
  JOB_ID=111415550894
  COMMIT=891ab6b06f80b5d451cc84758c2a8aafae602f60
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=NOT_APPLIED
  Production_API_fix_deployed=NO
  NEXT_ACTION=OWNER_DEPLOY_QUALIFIED_TRENDOS_D1_API_SHADOW_TTL_FIX_THEN_RELOGIN_AND_VERIFY_BEFORE_0013
  ```
- Owner completed the isolated Production API hotfix deployment from the exact hotfix package.
- Cloudflare deployment verification from Wrangler:
  ```ini
  PREVIOUS_VERSION=ce156662-a698-47fc-b73c-dfd4657be9f5
  NEW_VERSION=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  TRAFFIC=100%
  CREATED=2026-10-04T10:46:45.432Z
  AUTHOR=trendmall.contact@gmail.com
  ```
- Immediate public postflight after deployment:
  ```ini
  EMPLOYEE_AUTH_MODE=OFF
  EMPLOYEE_AUTH_ENV_ENABLED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  LEGACY_BRIDGE_ENABLED=NO
  LEGACY_BRIDGE_SECRET_CONFIGURED=NO
  ORDER_CREATE_MODE=GENERAL
  DUPLICATE_GUARD_READY=YES
  CUSTOMER_WRITE_MODE=GENERAL
  CUSTOMER_COUNT_RUNTIME=251
  LINE_RUNTIME_SCHEMA=READY
  LINE_RUNTIME_WRITE_MODE=cloud-native+legacy-overlay
  ```
- No 0013 migration has been applied yet. Entry615 remains paused until a browser employee session survives >5 minutes and a legacy employee business action succeeds.
- التسجيل:
  ```ini
  STATUS=ENTRY615A_HOTFIX_DEPLOYED_WAITING_6_MINUTE_BROWSER_PROOF
  PRODUCTION_API_VERSION=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=NOT_APPLIED
  Employee_Auth=OFF
  Employee_Bridge=OFF
  NEXT_ACTION=EMPLOYEE_LOGOUT_LOGIN_WAIT_OVER_5_MINUTES_THEN_RUN_BUSINESS_ACTION
  ```

- To prevent accidental publication of unrelated Zero-Google repo work, a minimal Production hotfix branch was created from the exact qualified API source base used for the live Entry599/600 target:
  ```ini
  HOTFIX_BRANCH=hotfix/entry615a-cloud-auth-shadow-12h-20261004
  HOTFIX_BASE=c491d3ed9b7e87c5d5f7d7ee0a57e02c3e530281
  HOTFIX_HEAD=2bcba927946275c21eb4ad14ec997a96cbcab583
  AHEAD_BY=2
  BEHIND_BY=0
  CHANGED_FILES=2
  ```
- Exact hotfix diff:
  1. `cloudflare-d1/src/cloud-auth-shadow-v1.mjs`: 300/900 sec → 43200/43200 sec.
  2. `cloudflare-d1/wrangler.toml`: `CLOUD_AUTH_SHADOW_TTL_SECONDS=300` → `43200`.
- No migrations, Orders code, Customers code, frontend, Apps Script, Native Auth flags, Bridge flags, or Zero-Google family handlers are included in the hotfix diff.
- Hotfix file content SHAs are identical to the CI-qualified candidate copies:
  ```ini
  cloud-auth-shadow-v1.mjs=96d1a8ea0925d8594ead3a282757d7f8da723a63
  wrangler.toml=7ade68ce256f82f72cb2db14ab8e115f82c1106a
  ```
- Production API remains unchanged until owner explicitly deploys this hotfix.



- Owner elected to continue migration 0013 before completing the >5 minute browser proof in order to save time.
- The Entry615A session hotfix remains live on Production API version `62cad7e7-6c4d-4f56-9b37-849f2e7256c7`; browser proof is deferred, not waived.
- If `EMPLOYEE_SESSION_SHADOW_REQUIRED` reappears, pause migrations and return to Entry615A diagnostics immediately.
- التسجيل:
  ```ini
  STATUS=ENTRY615_RESUMED_WITH_SESSION_BROWSER_PROOF_DEFERRED
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=NEXT
  SESSION_HOTFIX_VERSION=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  SESSION_BROWSER_PROOF=DEFERRED
  NEXT_ACTION=APPLY_0013_EMPLOYEE_CONTENT_ZERO_GOOGLE_V1_KEEP_OFF
  ```


- Owner manual D1 migration 0013:
  - Cloudflare Console: **This query successfully executed.**
  - verification:
    ```ini
    singleton=1
    marker=ENTRY614_EMPLOYEE_CONTENT_V1
    mode=OFF
    policy_epoch=1
    ```
  - therefore 0013 schema is applied and its control remains safely OFF.
  - 0012 remains applied/OFF; no family cutover or backfill yet.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0013_APPLIED_PASS
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  EMPLOYEE_OPS_MODE=OFF
  EMPLOYEE_CONTENT_MODE=OFF
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=APPLY_0014_EMPLOYEE_COMMS_ZERO_GOOGLE_V1_KEEP_OFF
  ```


- Owner manual D1 migration 0014:
  - Cloudflare Console: **This query successfully executed.**
  - verification:
    ```ini
    singleton=1
    marker=ENTRY614_EMPLOYEE_COMMS_V1
    mode=OFF
    policy_epoch=1
    ```
  - therefore 0014 schema is applied and its control remains safely OFF.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0014_APPLIED_PASS
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  EMPLOYEE_OPS_MODE=OFF
  EMPLOYEE_CONTENT_MODE=OFF
  EMPLOYEE_COMMS_MODE=OFF
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=APPLY_0015_EMPLOYEE_ACCOUNTING_ZERO_GOOGLE_V1_KEEP_OFF
  ```


- Owner manual D1 migration 0015 Run1:
  - Cloudflare D1 Console returned `incomplete input: SQLITE_ERROR`.
  - visible truncation occurred while parsing `CREATE TABLE employee_accounting_dept_lines_v1`, around the `approved_by` column.
  - therefore 0015 is **PARTIAL / NOT COMPLETE**. Earlier complete statements may already exist; later statements must not be assumed applied.
  - no cutover/backfill occurred and Accounting control, if created, remains default-OFF by schema.
- Recovery rule:
  - do not DROP any partially created objects.
  - resume with smaller idempotent chunks using `CREATE ... IF NOT EXISTS` / `INSERT OR IGNORE`.
  - verify full accounting table set and OFF control only after all chunks execute.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0015_RUN1_PARTIAL_SQLITE_INCOMPLETE_INPUT
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  MIGRATION_0015=PARTIAL
  EMPLOYEE_ACCOUNTING_CUTOVER=NO
  Backfill_applied=NO
  NEXT_ACTION=RESUME_0015_IN_SMALL_IDEMPOTENT_D1_CONSOLE_CHUNKS
  ```


- Owner manual D1 migration 0015 completed successfully using idempotent chunks A→E after the first large Console paste truncated.
- Final verification:
  ```ini
  singleton=1
  marker=ENTRY614_ACCOUNTING_V1
  mode=OFF
  next_invoice_number=1
  policy_epoch=1
  ```
- therefore Accounting schema is fully applied and control remains safely OFF.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0015_APPLIED_PASS
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  MIGRATION_0015=APPLIED_PASS
  EMPLOYEE_OPS_MODE=OFF
  EMPLOYEE_CONTENT_MODE=OFF
  EMPLOYEE_COMMS_MODE=OFF
  EMPLOYEE_ACCOUNTING_MODE=OFF
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=APPLY_0016_EMPLOYEE_CORE_ZERO_GOOGLE_V1_KEEP_OFF
  ```


- Owner manual D1 migration 0016:
  - Cloudflare Console: **This query successfully executed.**
  - verification:
    ```ini
    singleton=1
    marker=ENTRY614_EMPLOYEE_CORE_V1
    mode=OFF
    policy_epoch=0
    data_version=1
    ```
  - therefore 0016 core schema is applied and remains safely OFF.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0016_APPLIED_PASS
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  MIGRATION_0015=APPLIED_PASS
  MIGRATION_0016=APPLIED_PASS
  EMPLOYEE_CORE_MODE=OFF
  Production_cutover=NO
  Backfill_applied=NO
  NEXT_ACTION=APPLY_0017_EMPLOYEE_CORE_CURRENT_ORDERS_V1
  ```


- Owner manual D1 migration 0017:
  - Cloudflare Console: **This query successfully executed.**
  - verification before backfill:
    ```ini
    employee_core_orders_v1=0
    employee_core_lines_v1=0
    ```
  - therefore current-order authority tables are present and empty as expected before Entry615 backfill.
- التسجيل:
  ```ini
  STATUS=ENTRY615_MANUAL_0017_APPLIED_PASS
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  MIGRATION_0015=APPLIED_PASS
  MIGRATION_0016=APPLIED_PASS
  MIGRATION_0017=APPLIED_PASS
  BACKFILL_APPLIED=NO
  Production_cutover=NO
  NEXT_ACTION=APPLY_0018_ZERO_GOOGLE_BACKFILL_RETENTION_V1
  ```


- Owner manual D1 migration 0018:
  - Cloudflare Console: **This query successfully executed.**
  - verification before backfill:
    ```ini
    backfill_runs=0
    retained_rows=0
    parity_rows=0
    ```
- Schema phase is now complete:
  ```ini
  MIGRATION_0012=APPLIED_PASS
  MIGRATION_0013=APPLIED_PASS
  MIGRATION_0014=APPLIED_PASS
  MIGRATION_0015=APPLIED_PASS
  MIGRATION_0016=APPLIED_PASS
  MIGRATION_0017=APPLIED_PASS
  MIGRATION_0018=APPLIED_PASS
  ALL_FAMILY_CONTROLS=OFF
  BACKFILL_APPLIED=NO
  Production_cutover=NO
  ```
- Large Entry615 backfill must not be pasted into Cloudflare D1 Console because the generated SQL is ~35 MB and the Console already demonstrated truncation on large migration input. Use Wrangler D1 remote file execution instead.
- التسجيل:
  ```ini
  STATUS=ENTRY615_SCHEMA_0012_TO_0018_COMPLETE_WAITING_BACKFILL_APPLY
  NEXT_ACTION=RUN_ENTRY615_BACKFILL_SQL_VIA_WRANGLER_REMOTE_FILE_THEN_PARITY
  ```


- Fresh read-only Google Sheet snapshot was taken immediately after schema 0012→0018 completed, before any backfill APPLY.
- Current snapshot:
  ```ini
  SNAPSHOT_SHA256=1f9b510723be29eb97932cc7fc95a562c0340873001b3ffea2108bd1a8903b2f
  RUN_ID=ENTRY615-1F9B510723BE29EB
  GENERATED_AT=2026-10-04T11:27:51.148814Z
  CURRENT_ORDERS_SOURCE=222
  CURRENT_LINES_SOURCE=250
  CURRENT_LINES_CANONICAL=234
  ARCHIVE_ORDERS_SOURCE=3361
  ARCHIVE_LINES_SOURCE=4628
  ARCHIVE_LINES_CANONICAL=3565
  ATTENDANCE_SOURCE=122
  ATTENDANCE_CANONICAL=90
  ATTENDANCE_PULSES=191
  CLEANING_SOURCE=216
  CLEANING_CANONICAL=83
  RETAINED_LEGACY_ROWS=1256
  ```
- Drift from the older preview is expected because Google remained live during schema work:
  - attendance 119→122; canonical 87→90.
  - pulses 186→191.
  - cleaning 207→216; canonical 80→83.
  - retained legacy rows 1250→1256.
  - orders/core/archive counts remained stable.
- A D1-import-compatible SQL was regenerated from this fresh snapshot; explicit `PRAGMA foreign_keys`, `BEGIN TRANSACTION`, and `COMMIT` wrappers were removed for Wrangler D1 file import compatibility.
- Final import SQL:
  ```ini
  FILE=ENTRY615_BACKFILL_CURRENT_D1.sql
  SIZE_BYTES=36414456
  SQL_SHA256=49b43222c80114066838ad8da32d8b8f6b08e579c93b7697f78b228b892de5c4
  Production_data_committed_to_GitHub=NO
  ```
- التسجيل:
  ```ini
  STATUS=ENTRY615_FRESH_BACKFILL_PACKAGE_READY
  MIGRATIONS_0012_TO_0018=APPLIED_PASS
  ALL_FAMILY_CONTROLS=OFF
  BACKFILL_APPLIED=NO
  NEXT_ACTION=CAPTURE_D1_TIME_TRAVEL_BOOKMARK_THEN_WRANGLER_REMOTE_FILE_IMPORT
  ```


- Owner executed the refreshed Entry615 backfill through Wrangler against remote `trendos-main`.
- Source snapshot:
  ```ini
  RUN_ID=ENTRY615-1F9B510723BE29EB
  SOURCE_SNAPSHOT_SHA256=1f9b510723be29eb97932cc7fc95a562c0340873001b3ffea2108bd1a8903b2f
  D1_IMPORT_SQL_SHA256=49b43222c80114066838ad8da32d8b8f6b08e579c93b7697f78b228b892de5c4
  GENERATED_AT=2026-10-04T11:27:51.148814Z
  ```
- Time Travel bookmark was captured before import.
- Wrangler remote import result:
  ```ini
  TOTAL_QUERIES_EXECUTED=22307
  ROWS_READ=116252
  ROWS_WRITTEN=65596
  DATABASE_SIZE_MB=86.88
  RESULT=SUCCESS
  ```
- No family control has been enabled yet; cutover remains blocked on parity.
- Current refreshed canonical expectations:
  ```ini
  ATTENDANCE_DAYS=90
  ATTENDANCE_PULSES=191
  ATTENDANCE_SETTINGS=25
  SPECIAL_TIMES=2
  HR_EMPLOYEES=4
  HR_SKILLS=9
  CLEANING_ROWS=83
  PRESS_SETTINGS=10
  PRESS_SESSIONS=2
  CONTENT_RECORDS=284
  CONVERSATIONS=1
  MESSAGES=6
  FEEDBACK_REQUESTS=166
  GO_LIVE_DRAFTS=39
  ACCOUNTING_MATERIALS=2
  ACCOUNTING_TEMPLATES=1
  ACCOUNTING_DEPT_LINES=18
  ACCOUNTING_FINAL_INVOICES=3
  ACCOUNTING_PARTY_LEDGER=7
  CORE_ORDERS=222
  CORE_LINES=234
  CORE_ARCHIVE_ORDERS=3361
  CORE_ARCHIVE_LINES=3565
  CORE_EVENTS=12724
  RETAINED_LEGACY_ROWS=1256
  ```
- التسجيل:
  ```ini
  STATUS=ENTRY615_BACKFILL_APPLY_SUCCESS_WAITING_PARITY
  MIGRATIONS_0012_TO_0018=APPLIED_PASS
  BACKFILL_APPLIED=YES
  FAMILY_CONTROLS=OFF
  Production_cutover=NO
  NEXT_ACTION=RUN_D1_PARITY_COUNTS_AND_CONTROL_OFF_CHECK
  ```


- Immediate public Production postflight after Entry615 backfill:
  ```ini
  EMPLOYEE_AUTH_MODE=OFF
  EMPLOYEE_AUTH_ENV_ENABLED=NO
  NATIVE_AUTH_USERS=0
  NATIVE_READY_USERS=0
  LEGACY_BRIDGE_ENABLED=NO
  LEGACY_BRIDGE_SECRET_CONFIGURED=NO
  ORDER_CREATE_MODE=GENERAL
  DUPLICATE_GUARD_READY=YES
  NEXT_ORDER_NUMBER=4523
  CUSTOMER_WRITE_MODE=GENERAL
  CUSTOMER_COUNT_RUNTIME=251
  LINE_RUNTIME_SCHEMA=READY
  LINE_RUNTIME_WRITE_MODE=cloud-native+legacy-overlay
  ```
- D1 returned to normal service after the import window. No employee family control was enabled by the backfill.
- التسجيل:
  ```ini
  STATUS=ENTRY615_BACKFILL_POSTFLIGHT_PASS_WAITING_PARITY_COUNTS
  BACKFILL_RUN=ENTRY615-1F9B510723BE29EB
  FAMILY_CONTROLS=OFF
  NEXT_ACTION=PARITY_COUNTS_AND_INTEGRITY_CHECK
  ```


- Entry615 parity Run1 (read-only) in Cloudflare D1 Console returned:
  ```text
  too many terms in compound SELECT: SQLITE_ERROR
  ```
- This was a **read-only/no-op query failure** caused by the long compound `UNION ALL` form in the Console. No data/control mutation occurred.
- Recovery: split parity counts into smaller read-only query groups.
- التسجيل:
  ```ini
  STATUS=ENTRY615_PARITY_RUN1_FAIL_CONSOLE_COMPOUND_SELECT_LIMIT
  D1_MUTATION=NO
  FAMILY_CONTROLS=OFF
  NEXT_ACTION=RUN_SPLIT_PARITY_QUERIES
  ```


- Entry615 split parity — Ops/Content/Comms:
  ```ini
  attendance_days=90 PASS
  attendance_pulses=191 PASS
  attendance_settings=25 PASS
  special_times=2 PASS
  hr_employees=4 PASS
  hr_skills=9 PASS
  cleaning=83 PASS
  press_settings=10 PASS
  press_sessions=2 PASS
  content_records=284 PASS
  conversations=1 PASS
  messages=6 PASS
  feedback_requests=166 PASS
  go_live_drafts=39 PASS
  ```
- All values exactly match refreshed Entry615 snapshot expectations.
- التسجيل:
  ```ini
  STATUS=ENTRY615_PARITY_OPS_CONTENT_COMMS_PASS
  FAMILY_CONTROLS=OFF
  NEXT_ACTION=RUN_ACCOUNTING_CORE_AND_INTEGRITY_PARITY
  ```


- Entry615 split parity — Accounting/Core:
  ```ini
  accounting_materials=2 PASS
  accounting_templates=1 PASS
  accounting_dept_lines=18 PASS
  accounting_final_invoices=3 PASS
  accounting_party_ledger=7 PASS
  core_orders=222 PASS
  core_lines=234 PASS
  core_archive_orders=3361 PASS
  core_archive_lines=3565 PASS
  core_events=12724 PASS
  retained_legacy_rows=1256 PASS
  ```
- All values exactly match refreshed Entry615 snapshot expectations.
- Combined parity status so far:
  ```ini
  OPS=PASS
  CONTENT=PASS
  COMMS=PASS
  ACCOUNTING=PASS
  CORE=PASS
  ```
- No family control has been enabled yet.
- التسجيل:
  ```ini
  STATUS=ENTRY615_ALL_DOMAIN_COUNT_PARITY_PASS_WAITING_INTEGRITY_AND_OFF_CONTROL_CHECK
  FAMILY_CONTROLS=OFF
  NEXT_ACTION=RUN_INTEGRITY_AND_CONTROL_OFF_CHECK
  ```


- Entry615 final integrity/control checks:
  - D1 screenshots confirmed:
    ```ini
    orphan_attendance_pulses=0
    orphan_core_lines=0
    orphan_archive_lines_vs_archive_orders_only=60
    backfill_run_id=ENTRY615-1F9B510723BE29EB
    backfill_mode=APPLY
    backfill_status=COMMITTED
    OPS=OFF
    CONTENT=OFF
    COMMS=OFF
    ACCOUNTING=OFF
    CORE=OFF
    ```
- The 60 archive-line rows are **not true missing-parent data loss**. Read-only audit of the refreshed Google source proved:
  ```ini
  CANONICAL_ARCHIVE_LINES=3565
  ARCHIVE_LINES_WITHOUT_ARCHIVE_ORDER=60
  DISTINCT_PARENT_ORDERS=58
  PARENTS_PRESENT_IN_CURRENT_ORDERS=58
  ARCHIVE_LINES_PARENT_PRESENT_IN_CURRENT_ORDERS=60
  ARCHIVE_LINES_MISSING_FROM_BOTH_CURRENT_AND_ARCHIVE=0
  ```
- Interpretation: these are historical/partial archive-line snapshots whose order still exists in the current-order authority. The first integrity query was intentionally strict but semantically too narrow because it required every archive line parent to already be in `employee_core_archive_orders_v1`.
- Correct integrity rule for Zero-Google Core: every archive line must have its parent in **either** `employee_core_archive_orders_v1` **or** `employee_core_orders_v1`.
- No repair/mutation is required for these 60 rows; inserting synthetic archive parents would create false historical state.
- التسجيل:
  ```ini
  STATUS=ENTRY615_COUNTS_PASS_BACKFILL_COMMITTED_CONTROLS_OFF_WAITING_CORRECTED_ARCHIVE_PARENT_D1_PROOF
  TRUE_ARCHIVE_PARENT_ORPHANS_FROM_SOURCE=0
  NEXT_ACTION=RUN_D1_CORRECTED_ARCHIVE_PARENT_INTEGRITY_QUERY
  ```


### Entry615 — Final parity integrity correction and resume gate
- بعد اكتمال Backfill `ENTRY615-1F9B510723BE29EB` تم التحقق من integrity النهائي.
- نتيجة الفحص الأول المباشر على archive lines كانت:
  ```ini
  orphan_attendance_pulses=0
  orphan_core_lines=0
  orphan_archive_lines_vs_archive_orders_only=60
  ```
- تم فحص الـ60 صف بدل اعتبارها Orphans:
  - `archive_lines_missing_any_parent=0`
  - `archive_lines_parent_is_current=60`
- التفسير الصحيح:
  - الـ60 archive line ليسوا orphan rows.
  - parent order الخاص بهم موجود في `employee_core_orders_v1` (current orders) وليس في `employee_core_archive_orders_v1`.
  - لذلك integrity rule الصحيح أثناء مرحلة الانتقال هو: archive line يجب أن يجد parent في **archive orders OR current orders**.
- Backfill ledger:
  ```ini
  run_id=ENTRY615-1F9B510723BE29EB
  mode=APPLY
  status=COMMITTED
  source_snapshot_sha256=1f9b510723be29eb97932cc7fc95a562c0340873001b3ffea2108bd1a8903b2f
  ```
- Family controls final pre-cutover state:
  ```ini
  ops=OFF
  content=OFF
  comms=OFF
  accounting=OFF
  core=OFF
  ```
- Domain count parity already PASS:
  ```ini
  OPS=PASS
  CONTENT=PASS
  COMMS=PASS
  ACCOUNTING=PASS
  CORE=PASS
  retained_legacy_rows=1256 PASS
  ```
- Final integrity:
  ```ini
  ATTENDANCE_PULSE_ORPHANS=0
  CURRENT_CORE_LINE_ORPHANS=0
  ARCHIVE_LINES_MISSING_ANY_PARENT=0
  ARCHIVE_LINES_PARENT_IS_CURRENT=60
  INTEGRITY=PASS
  ```
- Important deployment boundary:
  - Production API currently runs the isolated Entry615A session hotfix version `62cad7e7-6c4d-4f56-9b37-849f2e7256c7`.
  - Zero-Google backend family handlers from the candidate branch are **not yet deployed to Production**.
  - therefore do **not** switch any family control to READONLY/GENERAL before deploying the Zero-Google backend source with all controls still OFF and completing a Production health/regression pass.
- التسجيل:
  ```ini
  STATUS=ENTRY615_BACKFILL_PARITY_INTEGRITY_PASS_READY_FOR_ZERO_GOOGLE_BACKEND_OFF_DEPLOY
  MIGRATIONS_0012_TO_0018=APPLIED_PASS
  BACKFILL=APPLIED_COMMITTED
  DOMAIN_PARITY=PASS
  INTEGRITY=PASS
  FAMILY_CONTROLS=OFF
  AUTH=OFF
  BRIDGE=OFF
  PRODUCTION_API_SESSION_HOTFIX=62cad7e7-6c4d-4f56-9b37-849f2e7256c7
  ZERO_GOOGLE_BACKEND_HANDLERS_DEPLOYED=NO
  NEXT_ACTION=QUALIFY_AND_DEPLOY_ZERO_GOOGLE_BACKEND_WITH_ALL_FAMILY_CONTROLS_OFF_THEN_HEALTH_REGRESSION_BEFORE_READONLY_CUTOVER
  ```

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


### Entry618 — Ops authenticated READONLY proof + GENERAL cutover
- الهدف: إغلاق عائلة Ops بالكامل على D1 بعد Entry617، مع إبقاء Employee Auth وEmployee Bridge وباقي العائلات خارج النطاق.
- تم احترام بوابة Entry617 وعدم الانتقال إلى GENERAL قبل دليل جلسة موظف حقيقية.
- محاولة المصادقة الأولى:
  - workflow commit `dc5da1596f0fb857f4147efc1fd4aa7083758a1c`
  - Run `37203775432`
  - Job `111440624895`
  - توقفت fail-closed قبل أي Login أو Production mutation عندما كشف الفحص وجود Cloud Auth Shadow session نشطة على حساب qualification.
  - القرار: عدم إنشاء Login جديد لأن Apps Script الحالي يحتفظ بتوكن موظف واحد في الصف، وأي Login جديد قد يستبدل جلسة موظف حية.
- تم إثبات مسار الـSmoke بدون لمس الجلسة:
  - `attendance-v1.js` يرسل تلقائيًا `attendanceV1:state` عند وجود موظف logged-in ويعيد القراءة كل 60 ثانية.
  - Cloudflare live-tail تم تأهيله في Run `37205678651`.
  - الدليل الحاسم Run `37205782765` التقط عدة:
    - `POST /v1/employee/ops`
    - HTTP `200`
    - Origin + Referer = `https://trendos-ui.trendmall-contact.workers.dev`
    - Browser user agents فعلية.
  - في نفس النافذة، probe الاصطناعي invalid رجع `401`.
  - لأن Ops كان READONLY، فإن HTTP 200 من Production UI يثبت أن request كان من READ allowlist واجتاز employee-session verification ووصل D1 handler.
  - النتيجة:
    `ENTRY618_AUTHENTICATED_OPS_READONLY_LIVE_READ_SMOKE=PASS`
- GENERAL attempt #1:
  - Run `37206022395`, Job `111447254947`.
  - Ops انتقل مؤقتًا إلى GENERAL / epoch 3.
  - frontend version المؤقت `cce7f6d1-5b3a-46fd-b087-efa77619bbd2`.
  - post-deploy check فشل مباشرة أثناء انتشار asset؛ automatic rollback نجح:
    - frontend عاد إلى `ad121526-8f86-4ce9-b13e-757c89810b06`.
    - Ops عاد READONLY.
  - Read-only reconcile Run `37206291054`, Job `111448053014` = PASS:
    - API = `de2c825d-ef63-407d-90dc-8059a9d4f192`
    - frontend = `ad121526-8f86-4ce9-b13e-757c89810b06`
    - Ops = READONLY / epoch 4
    - Auth/Bridge = OFF
    - Content/Comms/Accounting/Core = OFF
    - Orders/Customers/Line/refresh = PASS.
- GENERAL attempt #2:
  - workflow was hardened so policy epoch is locked dynamically from Runtime instead of hardcoding an old epoch، مع bounded frontend propagation polling.
  - Run `37206392285` وصل Ops إلى GENERAL / epoch 5 ثم توقف قبل frontend deploy لأن invalid-token probe دخل external session verification وانتظر upstream timeout.
  - rollback أعاد Ops إلى READONLY / epoch 6؛ frontend لم يتغير في هذه المحاولة.
  - تم تصحيح probe ليصل إلى local auth gate بدون username/token، فيثبت GENERAL write-policy بدون external auth call وبدون business write.
- Final controlled cutover:
  - workflow commit `ad29ddfd11de20d2c30b7ce2a8d925e0f5e63803`
  - Run `37206574900`
  - Job `111448891838`
  - conclusion = **SUCCESS**
  - pre-cutover Ops epoch = 6.
  - live authenticated READONLY smoke داخل الـRun = PASS، وتم رصد **6** Production UI Ops reads ناجحة HTTP 200.
  - Ops control:
    - READONLY epoch 6 → GENERAL epoch 7.
  - GENERAL policy probe:
    - write-shaped request وصل local auth gate ورجع 401 لغياب session credentials.
    - external auth call = NO.
    - business write executed = NO.
  - frontend GENERAL candidate مبني فوق exact live Entry617 baseline مع تغيير Ops mode فقط.
  - frontend propagation = PASS من أول attempt.
  - Production frontend version الجديدة:
    - `f1aa4dbf-4bba-40f9-87e2-3e98f3f781b6`.
  - API Worker لم يُنشر؛ بقي:
    - `de2c825d-ef63-407d-90dc-8059a9d4f192`.
  - Auth = OFF.
  - Bridge = OFF.
  - Content/Comms/Accounting/Core = OFF.
  - Entry611 Native Auth Canary = NOT DEPLOYED.
  - Apps Script touched = NO.
  - existing employee session disrupted = NO.
  - Orders GENERAL + duplicate guard = PASS.
  - Customers GENERAL = PASS.
  - Line Runtime = PASS.
  - refresh recovery = PASS.
- Independent post-success reconciliation:
  - workflow commit `799b0c424fedce0fd6f76a54bfc4ed8a929b0c40`
  - Run `37206745167`
  - Job `111449391579`
  - conclusion = **SUCCESS**
  - confirmed independently:
    ```ini
    API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
    FRONTEND_VERSION=f1aa4dbf-4bba-40f9-87e2-3e98f3f781b6
    OPS=GENERAL
    OPS_POLICY_EPOCH=7
    OPS_SCHEMA_READY=true
    OPS_GOOGLE_BUSINESS_CALLS=0
    OPS_APPS_SCRIPT_BUSINESS_AUTHORITY=false
    AUTH=OFF
    BRIDGE=OFF
    CONTENT=OFF
    COMMS=OFF
    ACCOUNTING=OFF
    CORE=OFF
    ORDERS_CUSTOMERS_LINE=PASS
    REFRESH_FIX=PASS
    ```
- اختيار العائلة التالية:
  - Content وComms لا تزالان غير مؤهلتين للـGENERAL بسبب bindings الخارجية الناقصة المثبتة في Entry616.
  - Core يحتوي write actions تمس order/line runtime مباشرة، لذلك لا يُختار كأول خطوة تالية بدون cutover qualification منفصل شديد.
  - Accounting يملك READ actions محددة (`getAccounting`, `getDeptInvoiceDraftV1887`, `getPartyAccountV1858`) ولا يملك dependency R2/WhatsApp/OpenAI ظاهرة في handler؛ لذلك هو المرشح التالي للـREADONLY qualification، مع بقاء Auth/Bridge OFF.
- التسجيل:
  ```ini
  STATUS=ENTRY618_OPS_GENERAL_CUTOVER_PASS
  FINAL_RUN_ID=37206574900
  FINAL_JOB_ID=111448891838
  FINAL_WORKFLOW_COMMIT=ad29ddfd11de20d2c30b7ce2a8d925e0f5e63803
  POSTSUCCESS_RECONCILE_RUN=37206745167
  POSTSUCCESS_RECONCILE_JOB=111449391579
  PRODUCTION_API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  PRODUCTION_FRONTEND_VERSION=f1aa4dbf-4bba-40f9-87e2-3e98f3f781b6
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  CONTENT=OFF
  COMMS=OFF
  ACCOUNTING=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  API_DEPLOY=NO
  APPS_SCRIPT_TOUCHED=NO
  ENTRY611_CANARY_DEPLOYED=NO
  NEXT_ACTION=QUALIFY_ACCOUNTING_READONLY_CUTOVER_WITH_AUTH_AND_BRIDGE_STILL_OFF
  ```


### Entry619 — Accounting family READONLY cutover
- الهدف: بدء نقل عائلة Accounting بعد إغلاق Ops على GENERAL، مع إبقاء:
  - Employee Auth = OFF.
  - Employee Bridge = OFF.
  - Content/Comms/Core = OFF.
  - Ops = GENERAL.
  - Apps Script بدون deploy أو تعديل.
- Source qualification:
  - router source commit: `56c760cc1ad585b254f5f663d72f140179271bd9`.
  - default-OFF config commit: `5066b58cdc2765343a793ba5c1c9b7e1091b7b66`.
  - router test commit: `f7fc1c5c9032f891ef25c071dde6f52b3656f2d2`.
  - workflow qualification was corrected for heredoc formatting in `6765f5788caf15a84c89085492356631964d62a0`.
  - generated-live-patch qualification support commit: `62a4d71d11bc3db018112693ac9bd765e6730b82`.
  - source qualification Runs `37207137593` and `37207232366` = **SUCCESS**.
  - A61 browser Cloud transport regression Run `37207232418` = **SUCCESS**.
- READONLY policy في الواجهة يوجّه فقط القراءات المؤهلة إلى D1:
  - `getAccounting`
  - `getDeptInvoiceDraftV1887`
  - `getPartyAccountV1858`
  - Accounting writes تظل على المسار السابق في READONLY.
  - GENERAL source path غير معتمد في Entry619.
- Controlled Production cutover:
  - workflow commit `00843659d5857dc4e023d4ed75f9dc59c4d02f1d`.
  - Run `37207346113`.
  - Job `111451192422`.
  - conclusion = **SUCCESS**.
- Pre-cutover:
  ```ini
  API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  FRONTEND_VERSION=f1aa4dbf-4bba-40f9-87e2-3e98f3f781b6
  OPS=GENERAL / policyEpoch=7
  ACCOUNTING=OFF / policyEpoch=1
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  ORDERS_CUSTOMERS_LINE=PASS
  ```
- Mutation boundary:
  - only `employee_accounting_control_v1` changed OFF → READONLY.
  - Accounting policy epoch 1 → 2.
  - API deploy = NO.
  - Apps Script deploy/mutation = NO.
  - Auth enable = NO.
  - Bridge enable = NO.
  - business write probe executed = NO.
- READONLY runtime semantics:
  - qualified read-shaped probe without credentials reached the local session gate and returned `401 employee-session-rejected`.
  - write-shaped Accounting probe was blocked with `503 employee-accounting-readonly`.
  - external auth call in these probes = NO.
  - therefore the READONLY gate is proven fail-closed without a business write.
- Frontend was deployed from exact live Entry618 baseline with Accounting READONLY added only:
  - `MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE='GENERAL'`.
  - `MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE='READONLY'`.
  - Native Auth remains false.
  - Legacy Bridge remains false.
  - Entry611 Native Auth Canary remains absent.
  - frontend propagation passed on attempt 2.
  - new Production frontend version:
    - `494d279f-5f5a-4271-b1c0-be5997615501`.
- Post-cutover health:
  ```ini
  OPS=GENERAL / policyEpoch=7
  ACCOUNTING=READONLY / policyEpoch=2
  ACCOUNTING_SCHEMA_READY=true
  ACCOUNTING_AUTHORITATIVE_WRITES=false
  ACCOUNTING_GOOGLE_BUSINESS_CALLS=0
  ACCOUNTING_APPS_SCRIPT_BUSINESS_AUTHORITY=false
  AUTH=OFF
  BRIDGE=OFF
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ORDERS=GENERAL_DUPLICATE_GUARD_PASS
  CUSTOMERS=GENERAL
  LINE_RUNTIME=PASS
  REFRESH_FIX=PASS
  ENTRY611_CANARY_DEPLOYED=NO
  ```
- Independent post-success reconciliation:
  - workflow commit `a5c001def8c79f6130e0f41d1587b09560a79cf5`.
  - Run `37207652630`.
  - Job `111452119541`.
  - conclusion = **SUCCESS**.
  - reconfirmed exact API/frontend versions and all controls above with no Production mutation.
- Passive authenticated-smoke observation attempt:
  - workflow commit `43a21ddb9ccab1e0d63ba908cd1fd5ecb4912934`.
  - Run `37207805369`.
  - preflight confirmed Accounting READONLY / epoch 2, Ops GENERAL / epoch 7, Auth/Bridge OFF.
  - Cloudflare live tail observed 22 Worker events but **0** requests to `/v1/employee/accounting` during the 70-second window.
  - therefore the run ended fail-closed with no authenticated Accounting evidence; this is not a runtime failure and does not downgrade Entry619.
  - credentials read = NO; Production mutation = NO; employee session disruption = NO.
- Important gate before Accounting GENERAL:
  - source + READONLY policy semantics + Production health are PASS.
  - still required: real authenticated Production Accounting read smoke through the current employee session path.
  - do not enable Native Auth or Bridge for this smoke.
  - do not promote Accounting to GENERAL unless authenticated READONLY reads pass and no write/regression is observed.
- التسجيل:
  ```ini
  STATUS=ENTRY619_ACCOUNTING_READONLY_CUTOVER_PASS_PENDING_AUTHENTICATED_LIVE_READ_SMOKE_BEFORE_GENERAL
  CUTOVER_RUN_ID=37207346113
  CUTOVER_JOB_ID=111451192422
  CUTOVER_WORKFLOW_COMMIT=00843659d5857dc4e023d4ed75f9dc59c4d02f1d
  RECONCILE_RUN_ID=37207652630
  RECONCILE_JOB_ID=111452119541
  RECONCILE_WORKFLOW_COMMIT=a5c001def8c79f6130e0f41d1587b09560a79cf5
  PRODUCTION_API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  PRODUCTION_FRONTEND_VERSION=494d279f-5f5a-4271-b1c0-be5997615501
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  AUTH=OFF
  BRIDGE=OFF
  API_DEPLOY=NO
  APPS_SCRIPT_TOUCHED=NO
  ENTRY611_CANARY_DEPLOYED=NO
  NEXT_ACTION=AUTHENTICATED_ACCOUNTING_READONLY_LIVE_READ_SMOKE_THEN_PROMOTE_ACCOUNTING_GENERAL_ONLY_IF_PASS
  ```

### Customers
- Customer master = 251 rows في D1 (live health after Entry616).
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
