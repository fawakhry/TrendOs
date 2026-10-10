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
- Production UI root-cause follow-up after the owner opened EasyStore Accounting:
  - second live-tail Run `37208172774` confirmed the same preflight, then observed **0** requests to `/v1/employee/accounting` while the Accounting screen was visibly open.
  - the EasyStore screen showed the banner: session expired / login again.
  - root cause was before the D1 API:
    - canonical TrendOS is hosted on `trendos-ui.trendmall-contact.workers.dev`.
    - EasyStore Accounting is hosted on `fawakhry.github.io/EasyStore/`.
    - the historical handoff stored the employee token in TrendOS `localStorage`, but browser storage is origin-scoped, so EasyStore could not read that token.
    - token was intentionally not placed in the URL, which remains the security requirement.
    - additionally, EasyStore Production `config.js` still pointed its generic API directly at Apps Script; therefore the independent EasyStore screen bypassed the Entry619 TrendOS dispatcher.
- Secure cross-origin remediation:
  - design: TrendOS opener → exact-origin `postMessage` with one-time nonce/fresh timestamp → EasyStore validates origin + `window.opener` source + nonce + freshness → EasyStore stores the session only in its own `sessionStorage`.
  - raw employee token in URL = **NO**.
  - EasyStore routes only the three Entry619 READONLY actions to D1:
    - `getAccounting`
    - `getDeptInvoiceDraftV1887`
    - `getPartyAccountV1858`
  - all non-qualified/write actions remain on the existing path while Accounting is READONLY.
- EasyStore repository remediation:
  - repo: `fawakhry/EasyStore`.
  - candidate branch: `candidate/entry619-d1-readonly-sso-20261004`.
  - secure receiver + D1 READONLY router commit: `5d0533a0ed8e53f6a53bcdfffb29b9e0d0142289`.
  - D1 READONLY config commit: `d001839772e68a27b85c0b29bb10580181259048`.
  - cache-bust commit: `0161bb0fc26f0d28af8e406acae1b84ee4f44113`.
  - qualification tests/workflow commits: `d665e617b98d6ea84346331b858e000ad24b701e`, `81826554799b5fa0e9a4325b6ffa1936d37aab89`.
  - two initial CI failures were stale historical cache-tag assertions only; they were corrected in `bf3aa943b5a2819b59216e0fc87770efb63ae6ad` and `e17d447b183f2bb33b8f99254fe77dfe519052ed`.
  - final EasyStore qualification Run `37208981388` = **SUCCESS**; all existing suites + Entry619 secure SSO/D1 test PASS.
  - EasyStore `main` was fast-forwarded from `79d5fa1965d42996de49f949a4c34121a4231157` to `e17d447b183f2bb33b8f99254fe77dfe519052ed`.
  - GitHub Pages deployment Run `37209034589` = **SUCCESS**.
- TrendOS sender remediation:
  - source commits `251110c70dfbc23998c031a347a25b960049f561` and `d6b5b5c8f241488d78f056c89315e47cd8dd4224`.
  - dedicated source qualification Run `37208772063` = **SUCCESS**.
  - independent standard regressions including browser Cloud transport, duplicate guard, customer cloud-only, legacy line runtime, and login surface also remained PASS.
  - controlled exact-live frontend workflow commit `b55af26a89e472a5fe25e6cdbfc954ae058f0b7d`.
  - Run `37209211366` = **SUCCESS**.
  - no API deploy, no D1 mutation, no Apps Script touch.
  - new Production frontend version:
    - `011a01ee-b51b-44d2-84ff-b08d88712d85`.
  - Ops GENERAL / epoch 7 preserved.
  - Accounting READONLY / epoch 2 preserved.
  - Auth and Bridge remained OFF.
  - Entry611 Canary remained NOT DEPLOYED.
  - refresh recovery preserved.
- Independent SSO post-success reconciliation:
  - workflow commit `170863f14274a5a3520d5c777b10991b9b5a6b26`.
  - Run `37209322493`.
  - Job `111457081225`.
  - conclusion = **SUCCESS**.
  - confirmed EasyStore Pages live with D1 READONLY receiver/router, TrendOS sender live, token-in-URL = NO, and all family/runtime controls unchanged.
- remediation registration:
  ```ini
  ENTRY619_EASYSTORE_CROSS_ORIGIN_SSO_REMEDIATION=PASS
  EASYSTORE_MAIN=e17d447b183f2bb33b8f99254fe77dfe519052ed
  EASYSTORE_PAGES_RUN=37209034589
  TRENDOS_SSO_DEPLOY_RUN=37209211366
  TRENDOS_SSO_RECONCILE_RUN=37209322493
  PRODUCTION_FRONTEND_VERSION=1f4a4faa-b532-45d5-8ea7-f5f79c8d2ac7
  TOKEN_IN_URL=NO
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  AUTH=OFF
  BRIDGE=OFF
  APPS_SCRIPT_TOUCHED=NO
  NEXT_GATE=REAL_AUTHENTICATED_EASYSTORE_ACCOUNTING_D1_READ_SMOKE
  ```
- Post-remediation live observation attempts:
  - Run `37209757544`, Job `111458355016`: preflight PASS; 43 Worker events observed; 0 requests to `/v1/employee/accounting`.
  - Run `37210035507`, Job `111459174028`: preflight PASS; 22 Worker events observed; 0 requests to `/v1/employee/accounting`.
  - both runs were non-mutating and read no credentials.
  - interpretation: no Accounting request was observed inside either live-tail window; this is **not** evidence of a failed authenticated read and must not be promoted to PASS or FAIL for the business read itself.
  - Accounting remains READONLY / epoch 2 and GENERAL promotion remains blocked until a synchronized authenticated read is observed as HTTP 200 from EasyStore.
- CORS diagnostic after synchronized smoke:
  - workflow commit `d7a661f13b28707efc4d624006a9bdc0af460b9f`.
  - Run `37210738593`.
  - Job `111461230214`.
  - conclusion = **SUCCESS**.
  - browser preflight from `https://fawakhry.github.io` returned:
    - HTTP 204.
    - `Access-Control-Allow-Origin: https://fawakhry.github.io`.
    - methods include POST.
    - headers include Authorization + Content-Type.
  - therefore the missing live request was not a Cloudflare CORS block.
- Synchronized live-tail attempt after owner pressed `تحديث البيانات`:
  - Run `37210279478`.
  - Job `111459882979`.
  - 45 Worker events observed, but 0 requests to `/v1/employee/accounting`.
  - no mutation and no credential read.
  - this isolated the remaining issue to EasyStore client timing/runtime, not API reachability.
- SSO2 race remediation:
  - EasyStore now schedules one read-only `getAccounting` refresh after secure SSO acceptance once any in-flight load clears.
  - visible non-sensitive runtime badge added:
    - `D1 READONLY` or `LEGACY READ`.
    - `SSO OK` or `SSO WAIT`.
  - no secret/token value is displayed.
  - EasyStore retry source commit: `139cbf3bb682b0abf303f162d9fe08366e3bcda3`.
  - SSO2 cache-tag/test hardening culminated at `41c522d0d63b1897394bedfe836b975d5119bca2`.
  - EasyStore qualification Run `37210978298` = **SUCCESS**.
  - EasyStore `main` fast-forwarded to `41c522d0d63b1897394bedfe836b975d5119bca2`.
  - GitHub Pages deployment Run `37211003672` = **SUCCESS**.
  - live EasyStore cache tag:
    - `entry619-d1-readonly-sso2-20261004`.
- TrendOS SSO2 cache-tag rollout:
  - source commits `5f89fc9c8f4249acfb5e0b8389f931ea0297bfc4` and `6d8bdbabc4e2bf60605ddfd99ea6fa2669783eb8`.
  - source qualification and browser Cloud transport regressions remained PASS.
  - controlled frontend workflow commit `87d77bcc05461781782b1d5aca0d2fe16ee5d577`.
  - Run `37211142855`.
  - Job `111462424161`.
  - conclusion = **SUCCESS**.
  - tag-only exact-live patch; API deploy = NO; D1 mutation = NO; Apps Script touched = NO.
  - new Production frontend version:
    - `1f4a4faa-b532-45d5-8ea7-f5f79c8d2ac7`.
  - Accounting remains READONLY / epoch 2.
  - Ops remains GENERAL / epoch 7.
  - Auth/Bridge remain OFF.
- Independent SSO2 reconciliation:
  - workflow commit `0013798e0b043b4daeaa9e0a522493a72d86f6ca`.
  - Run `37211240358`.
  - Job `111462711527`.
  - conclusion = **SUCCESS**.
  - confirmed exact API/frontend versions, EasyStore SSO2 Pages live, runtime badge ready, and post-SSO read retry ready.
- SSO2 registration:
  ```ini
  ENTRY619_EASYSTORE_SSO2_RACE_REMEDIATION=PASS
  EASYSTORE_MAIN=41c522d0d63b1897394bedfe836b975d5119bca2
  EASYSTORE_PAGES_RUN=37211003672
  EASYSTORE_CACHE_TAG=entry619-d1-readonly-sso2-20261004
  TRENDOS_SSO2_DEPLOY_RUN=37211142855
  TRENDOS_SSO2_RECONCILE_RUN=37211240358
  PRODUCTION_FRONTEND_VERSION=1f4a4faa-b532-45d5-8ea7-f5f79c8d2ac7
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  AUTH=OFF
  BRIDGE=OFF
  NEXT_GATE=REOPEN_ACCOUNTING_FROM_TRENDOS_AND_OBSERVE_D1_READ_200_WITH_SSO2
  ```
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
  PRODUCTION_FRONTEND_VERSION=1f4a4faa-b532-45d5-8ea7-f5f79c8d2ac7
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

## 13. Accounting / EasyStore pause checkpoint — 2026-10-04

> **قرار المالك:** إيقاف التحقيق في الحسابات مؤقتًا والانتقال إلى المشكلة الحالية الأخرى، مع حفظ نقطة الاستئناف بدون فقد أي سياق.

- برنامج الحسابات ليس جزءًا من Repo TrendOS فقط؛ له Repo مستقل:
  - `fawakhry/EasyStore`
- ملفات EasyStore الأساسية المؤكدة:
  - `app.js`
  - `config.js`
  - `index.html`
  - `Code.gs`
  - `tests/`
- `config.js` الحالي في EasyStore يضبط:
  - `EASYSTORE_ACCOUNTING_D1_READONLY = true`
  - `EASYSTORE_ACCOUNTING_D1_URL = https://trendos-d1-api.trendmall-contact.workers.dev/v1/employee/accounting`
  - cache tag: `entry619-d1-readonly-sso2-20261004`
- Runtime UI observation من المالك:
  - EasyStore فتح من TrendOS.
  - الشارة أصبحت `D1 READONLY / SSO OK`.
  - هذا يثبت نجاح handoff المرئي للجلسة داخل EasyStore، لكنه لا يثبت وحده وصول `getAccounting` إلى D1.
- Live-tail evidence قبل الإيقاف:
  - Run `37210279478` استُخدم لمراقبة `/v1/employee/accounting`.
  - المحاولات المكتملة حتى لحظة الإيقاف لم ترصد طلب Accounting فعليًا أثناء الضغط على «تحديث البيانات».
  - محاولة لاحقة كانت ما تزال `in_progress` لحظة قرار الإيقاف؛ لا تُعتبر PASS أو FAIL حتى تُراجع نتيجتها عند الاستئناف.
- مصدر التحقيق الصحيح عند العودة:
  1. ابدأ من Repo `fawakhry/EasyStore`، لا من تكرار تشخيص TrendOS وحده.
  2. افحص `ES27.load(true)` -> `api('getAccounting', ...)` -> شرط `EASYSTORE_ACCOUNTING_D1_READONLY` -> `fetch(EASYSTORE_ACCOUNTING_D1_URL)`.
  3. اربط ذلك بنتيجة Runtime/Network أو Cloudflare tail.
  4. لا تُدخل فاتورة أو بيانات إنتاج لمجرد إثبات القراءة.
  5. لا تُرقِّ Accounting من `READONLY` إلى `GENERAL` قبل إثبات authenticated D1 read حقيقي.
- الحالة عند الإيقاف:
  ```ini
  ACCOUNTING=READONLY
  SSO_UI=OK
  AUTHENTICATED_D1_READ=NOT_PROVEN
  EASYSTORE_REPO=fawakhry/EasyStore
  NEXT_RESUME_POINT=DIAGNOSE_EASYSTORE_GETACCOUNTING_RUNTIME_PATH
  OWNER_DECISION=PAUSE_AND_SWITCH_TO_CURRENT_ISSUE
  ```

### Entry620 — Attendance D1 response/UI contract hotfix
- البلاغ التشغيلي: الموظف يسجل الدخول وتظهر شاشة **«تسجيل حضور وبدء اليوم»**؛ بعد الضغط لا تُفتح المنصة ويظل Start overlay مانع التشغيل.
- Root cause المؤهل من source:
  - بعد Entry618 أصبحت Ops = `GENERAL` على D1.
  - `attendance-v1.js` كان يتوقع عقد Apps Script التاريخي:
    - `{ success:true, state:{...}, config:{...} }`
  - D1 `employee-ops-native-v1.mjs` يرجع:
    - `{ success, date, started, attendance, pulses, config }`
  - لذلك `doEvent("start")` كان ينجح على مسار D1 لكن `out.state` يكون غير موجود، فتتعامل الواجهة مع الحالة كأنها `not_started` ويظل Start overlay ظاهرًا.
- الإصلاح:
  - Frontend-only compatibility normalizer داخل `attendance-v1.js`.
  - يحافظ على عقد Apps Script القديم كما هو إذا كان `out.state` موجودًا.
  - يحول رد D1 الحالي إلى `state` متوافق مع UI، ويعيد بناء الحالة من `attendance + pulses`:
    - working / paused / rest / prayer / review / ended.
    - work/pause/rest minutes.
    - review state + timestamps.
  - لا API code change.
  - لا D1 schema/control mutation.
  - لا Apps Script touch.
  - لا Auth/Bridge change.
- Source:
  - hotfix commit: `833de950417102a971a637cbf3a97c28a6e01ff2`.
  - regression test commit: `89d9202ea21dec631a8c6c7aefb6ad5263bec0cf`.
  - source CI workflow commit: `73c09238677e10ff3ec5e18f99fa54dfee0a3e01`.
  - source CI Run `37215620142`, Job `111475401206` = **SUCCESS**.
  - regression proves:
    - D1 started response -> UI `working`.
    - pause/resume/review/end transitions.
    - deterministic work/pause totals for ended session.
    - legacy `out.state` contract preserved unchanged.
- Controlled Production frontend deploy:
  - workflow commit: `5f13406bc61de3aba1f2eaa6ae3e3f5e531ec1ae`.
  - Run `37215751609`, Job `111475791868` = **SUCCESS**.
  - preflight locked exact previous frontend version:
    - `1f4a4faa-b532-45d5-8ea7-f5f79c8d2ac7`.
  - exact live attendance asset blob before patch:
    - `4472b66306a31c365a5a3e2b98e73dece85e93f1`.
  - patched attendance blob:
    - `d7f2625aa03c18486069ee274d960adbf8cdcee4`.
  - cache tag changed only for attendance module:
    - `20260930-a61-cloud-transport` -> `20261004-entry620-d1-state-contract`.
  - propagation PASS on attempt 8.
  - new Production frontend version:
    - `bfcc6f85-a748-4b66-a334-b605c72108f7`.
- Post-deploy runtime controls preserved:
  ```ini
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  AUTH=OFF
  BRIDGE=OFF
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  API_DEPLOY=NO
  D1_MUTATION=NO
  APPS_SCRIPT_TOUCHED=NO
  ```
- Postdeploy asset proof:
  - live `attendance-v1.js` contains `normalizeAttendanceBackendResponse`.
  - live `config.js` points attendance loader to `20261004-entry620-d1-state-contract`.
  - Entry619 SSO/accounting router and orders refresh recovery markers remain present.
- Real employee Production smoke:
  - المالك أكد بعد التحديث أن الموظف ضغط **«تسجيل حضور وبدء اليوم»**.
  - الـStart overlay أُغلق والمنصة فتحت وعملت طبيعيًا.
  - النتيجة: **PASS**.
- الحالة:
  ```ini
  STATUS=ENTRY620_ATTENDANCE_UI_HOTFIX_RUNTIME_PASS
  PRODUCTION_FRONTEND_VERSION=bfcc6f85-a748-4b66-a334-b605c72108f7
  AUTOMATED_REGRESSION=PASS
  REAL_EMPLOYEE_START_DAY_SMOKE=PASS
  OWNER_CONFIRMATION=PLATFORM_OPENED_AND_WORKED_AFTER_START_DAY
  NEXT_ACTION=NONE_FOR_ENTRY620; MONITOR_NORMAL_OPERATION
  ```

### Entry621 — TrendOS-first Zero-Google scope lock + Employee Auth/Session read-only audit

#### Owner scope decision
- القرار: **نكمل قفل TrendOS أولًا، ونؤجل EasyStore Accounting لأنه Repo مستقل**.
- Accounting repo:
  - `fawakhry/EasyStore`
- Accounting freeze boundary:
  - لا ترقية `ACCOUNTING` إلى `GENERAL` الآن.
  - لا تعديل EasyStore ضمن برنامج قفل TrendOS الحالي.
  - تبقى الحالة الحالية:
    ```ini
    ACCOUNTING=READONLY
    ACCOUNTING_POLICY_EPOCH=2
    ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
    ```
- لا يجوز إعلان `ZERO_GOOGLE_COMPLETE=YES` للنظام بالكامل طالما EasyStore أو أي Runtime خارجي مطلوب ما زال يعتمد على Google.
- يجوز لاحقًا تسجيل إغلاق TrendOS نفسه بشكل منفصل فقط بعد إثباته Runtime، مثل:
  `TRENDOS_ZERO_GOOGLE=PASS`
  مع بقاء:
  `ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO`
  حتى إغلاق EasyStore مستقلًا.

#### Read-only Auth/Session audit
- Dedicated workflow commit:
  - `a3dfaedfa5753438abcc69aa41982ee960102610`
- Workflow:
  - `.github/workflows/trendos-entry621-auth-session-readonly-audit.yml`
- Run:
  - `37218299039`
- Job:
  - `111483244583`
- conclusion = **SUCCESS**.
- Active Production deployments observed:
  ```ini
  API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
  API_TRAFFIC=100
  UI_VERSION=bfcc6f85-a748-4b66-a334-b605c72108f7
  UI_TRAFFIC=100
  ```
- Current Employee Auth runtime:
  ```ini
  AUTH_MODE=OFF
  AUTH_ENV_ENABLED=false
  D1_AUTH_POLICY_EPOCH=22
  D1_USER_COUNT=0
  D1_NATIVE_READY_COUNT=0
  D1_SESSION_COUNT=0
  D1_LIVE_SESSION_COUNT=0
  PLAINTEXT_STORED=false
  ```
- Current compatibility bridge runtime:
  ```ini
  BRIDGE_ENABLED=false
  BRIDGE_SECRET_CONFIGURED=false
  BRIDGE_POLICY_COUNT=0
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false
  CF_BRIDGE_SECRET_PRESENT=false
  CF_BRIDGE_POLICIES_EMPTY=true
  APPS_SCRIPT_BRIDGE_ROUTE_LIVE=true
  APPS_SCRIPT_BRIDGE_ENABLED=NO
  ```
- Cloudflare auth switches:
  ```ini
  CF_AUTH_ENABLED=false
  CF_BOOTSTRAP_ENABLED=false
  CF_NATIVE_ONLY=false
  CF_SESSION_ENROLL_ENABLED=false
  CF_BRIDGE_ENABLED=false
  ```
- Live frontend:
  ```ini
  FRONTEND_NATIVE_AUTH=OFF
  FRONTEND_BRIDGE=OFF
  FRONTEND_NATIVE_CANARY=ABSENT
  FRONTEND_OPS=GENERAL
  FRONTEND_ACCOUNTING=READONLY
  ```
- Other current family controls preserved:
  ```ini
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ```
- Audit boundary:
  ```ini
  PRODUCTION_MUTATION=NO
  D1_MUTATION=NO
  API_DEPLOY=NO
  FRONTEND_DEPLOY=NO
  APPS_SCRIPT_TOUCHED=NO
  SECRETS_TOUCHED=NO
  AUTH_MODE_CHANGED=NO
  ACCOUNTING_TOUCHED=NO
  ```

#### Current interpretation
- TrendOS employee login/session authority **لم ينتقل بعد إلى D1**.
- D1 Native Auth foundation موجود ومؤهل source-wise، لكن Runtime ما زال OFF ولا يوجد أي native-ready employee أو D1 employee session.
- Compatibility Bridge موجود في الكود والمسار على Apps Script live، لكنه غير مسلح:
  - no shared secret;
  - no policies;
  - enable = OFF.
- لذلك أول خطوة انتقالية حقيقية لاحقة ليست تغيير Login مباشرة؛ هي **Gate 1: إعداد Compatibility Bridge وهو ما زال OFF**:
  1. shared bridge secret على Cloudflare + Apps Script بدون إظهار القيمة؛
  2. read-only pilot policies فقط؛
  3. إبقاء bridge enable = OFF؛
  4. إبقاء Auth = OFF؛
  5. postflight يثبت عدم تغير سلوك الموظفين.
- هذه الخطوة التالية تمس Secrets / Apps Script Script Properties، لذلك **لا تُنفذ ضمن هذا الـread-only audit** وتحتاج موافقة تنفيذ صريحة منفصلة.

#### Registration
```ini
STATUS=ENTRY621_TRENDOS_FIRST_SCOPE_LOCK_AND_AUTH_READONLY_AUDIT_PASS
TRENDOS_PROGRAM=CONTINUE_ZERO_GOOGLE
ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
EMPLOYEE_LOGIN=GOOGLE_BACKED
EMPLOYEE_SESSION=D1_NATIVE_NOT_STARTED
D1_NATIVE_READY_USERS=0
D1_LIVE_SESSIONS=0
BRIDGE=OFF
BRIDGE_SECRET=ABSENT
BRIDGE_POLICIES=0
NEXT_GATE=PREPARE_COMPATIBILITY_BRIDGE_SECRET_AND_READONLY_POLICIES_WHILE_AUTH_AND_BRIDGE_REMAIN_OFF
NEXT_GATE_REQUIRES_EXPLICIT_MUTATION_APPROVAL=YES
```

### Entry622 — Compatibility Bridge Gate 1 preparation (partial, fail-closed)
- الهدف: تجهيز Compatibility Bridge الخاص بـTrendOS فقط بينما يظل:
  - Employee Auth = OFF.
  - Employee Bridge = OFF.
  - Accounting = READONLY ومؤجل إلى Repo `fawakhry/EasyStore`.
- تم تصحيح الـread-only pilot من الخطة التاريخية لأن Runtime تغيّر:
  - Ops أصبح `GENERAL` على D1، لذلك لا نعيد Ops read policies إلى legacy bridge.
  - Accounting مؤجل، لذلك لا نضيف Accounting policies للـbridge.
  - manifest الحالي = **17 TrendOS-only read policies**.
- Policy manifest:
  - `docs/trendos/staging/ENTRY622_TRENDOS_BRIDGE_READONLY_POLICIES.json`
  - commit `82c4db5ecb54d6ae1b96ed68af81c63b10f44baa`
- Qualification test:
  - `tests/entry622_trendos_bridge_readonly_policies.test.mjs`
  - commit `c5fe320ef28d06f202a01e87fc7dc0fc4326680b`
  - proves exactly 17 policies, Accounting excluded, already-native Ops policies excluded.
- Controlled workflow:
  - `.github/workflows/trendos-entry622-bridge-policies-off-controlled.yml`
- Attempt 1:
  - Run `37218676765` failed before Production mutation بسبب خطأ count في أداة الفحص فقط.
  - Production mutation = NO.
- Count fix:
  - commit `d80e99ff988a5ecb540a70a4eac390a4ebf9fb99`.
- Attempt 2:
  - Run `37218709830`, Job `111484461273`.
  - manifest qualification = PASS.
  - exact Production preflight = PASS:
    ```ini
    API_VERSION=de2c825d-ef63-407d-90dc-8059a9d4f192
    UI_VERSION=bfcc6f85-a748-4b66-a334-b605c72108f7
    AUTH=OFF
    BRIDGE=OFF
    BRIDGE_SECRET_CONFIGURED=false
    BRIDGE_POLICY_COUNT=0
    OPS=GENERAL / epoch 7
    ACCOUNTING=READONLY / epoch 2
    CONTENT=OFF
    COMMS=OFF
    CORE=OFF
    ```
  - policy install stopped fail-closed before mutation:
    - Cloudflare error `10053`: binding `EMPLOYEE_LEGACY_BRIDGE_ACTIONS` already exists as a non-secret binding, so `wrangler secret put` cannot replace it.
  - no policy value changed.
  - no secret was installed.
  - no API/frontend deploy.
  - no D1 mutation.
  - no Apps Script mutation.
- Current blocker:
  - Gate 1 needs the same new shared bridge secret on:
    1. Cloudflare Worker secret `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`.
    2. Apps Script Script Property `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`.
  - Cloudflare `EMPLOYEE_LEGACY_BRIDGE_ACTIONS` must be edited as its existing plain binding to the exact 17-policy value, not converted to a secret.
  - Apps Script project ID / property-write API is not available from repo/connected Drive; safest continuation is authenticated control-plane browser access.
  - browser profiles exist, but no Google/Cloudflare sign-in is recorded for them, so control-plane mutation is paused until the owner opens an authenticated setup session.
- Fail-closed state:
  ```ini
  STATUS=ENTRY622_GATE1_PARTIAL_BLOCKED_ON_AUTHENTICATED_CONTROL_PLANE_SESSION
  AUTH=OFF
  BRIDGE=OFF
  BRIDGE_SECRET_CONFIGURED=false
  BRIDGE_POLICY_COUNT=0
  ACCOUNTING=READONLY
  PRODUCTION_BEHAVIOR_CHANGED=NO
  NEXT_ACTION=OWNER_AUTHENTICATES_GOOGLE_APPS_SCRIPT_AND_CLOUDFLARE_BROWSER_PROFILE; THEN_INSTALL_SHARED_SECRET_AND_17_POLICIES_WITH_BRIDGE_STILL_OFF
  ```

#### Entry622 Gate 1 — manual control-plane completion and cleanup correction
- Owner completed the private temporary-bootstrap path manually against the confirmed Production Apps Script project.
- Production Apps Script deployment remained on **Version 159** and was not repointed.
- Reported verified state:
  ```ini
  APPS_SCRIPT_PROJECT_MATCH=YES
  PRODUCTION_DEPLOYMENT_VERSION=159
  PRODUCTION_DEPLOYMENT_CHANGED=NO
  TEMP_BOOTSTRAP_ACCESS=ONLY_MYSELF
  SECRET_GENERATED_WITH_WEB_CRYPTO=YES
  SECRET_IN_SOURCE=NO
  SECRET_IN_URL=NO
  SECRET_IN_LOGS=NO
  APPS_SCRIPT_BRIDGE_SECRET_CONFIGURED=YES
  APPS_SCRIPT_BRIDGE_ENABLED=NO
  CLOUDFLARE_BRIDGE_SECRET_CONFIGURED=YES
  CLOUDFLARE_BRIDGE_POLICY_COUNT=17
  CLOUDFLARE_BRIDGE_ENABLED=NO
  AUTH=OFF
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  TEMP_BOOTSTRAP_SOURCE_REMOVED=YES
  D1_MUTATION=NO
  ```
- Cleanup evidence from Apps Script **Manage deployments**:
  - Production deployment remains active on Version 159.
  - the temporary Entry622 deployment is shown under **Archived**, not Active.
- Apps Script UI semantics correction:
  - versioned deployments are archived rather than permanently deleted from the deployment record;
  - therefore `TEMP_BOOTSTRAP_DEPLOYMENT_DELETED=NO` by itself is **not a Gate failure** when the temporary deployment is archived and inactive.
- Effective cleanup registration:
  ```ini
  TEMP_BOOTSTRAP_DEPLOYMENT_ARCHIVED=YES
  TEMP_BOOTSTRAP_DEPLOYMENT_ACTIVE=NO
  TEMP_BOOTSTRAP_SOURCE_REMOVED=YES
  PRODUCTION_DEPLOYMENT_VERSION=159
  ```
- Gate result:
  ```ini
  STATUS=ENTRY622_COMPATIBILITY_BRIDGE_GATE1_PASS
  AUTH=OFF
  BRIDGE=OFF
  BRIDGE_SECRET_CONFIGURED=YES
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL
  OPS_POLICY_EPOCH=7
  ACCOUNTING=READONLY
  ACCOUNTING_POLICY_EPOCH=2
  D1_MUTATION=NO
  PRODUCTION_APPS_SCRIPT_VERSION=159
  NEXT_GATE=NATIVE_AUTH_TRANSITIONAL_BOOTSTRAP_CANARY_WITH_BRIDGE_STILL_FAIL_CLOSED_UNTIL_EXPLICIT_ENABLE
  ```

### Entry623 — Native Auth single-employee canary requalification after Entry622 Gate1
- Trigger: المالك قال `نفذ` بعد إغلاق Entry622 Gate1.
- Current-truth audit أُعيد من Runtime بدل إعادة استخدام Entry613 historical 69-policy plan.
- Read-only current-truth workflow:
  - `.github/workflows/trendos-entry623-native-auth-canary-preflight.yml`
  - final audit commit: `ab6507b1730245c9cdc8f1dbc83f4d2805afb079`
  - Run `37227572231`
  - Job `111510293777`
  - conclusion = **SUCCESS**.
- Runtime observed:
  ```ini
  API_VERSION=22201b84-6bff-41be-8ce5-b2f6382aa0db
  UI_VERSION=bfcc6f85-a748-4b66-a334-b605c72108f7
  AUTH_MODE=OFF
  AUTH_ENV_ENABLED=false
  LEGACY_BOOTSTRAP_ENABLED=false
  NATIVE_ONLY=false
  AUTH_USER_COUNT=0
  NATIVE_READY_COUNT=0
  BRIDGE_ENABLED=false
  BRIDGE_SECRET_CONFIGURED=true
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF / epoch 1
  COMMS=OFF / epoch 1
  CORE=OFF / epoch 0
  D1_AUTH_POLICY_EPOCH=22
  D1_SESSION_COUNT=0
  D1_LIVE_SESSION_COUNT=0
  ```
- Live frontend current truth:
  - global Native Auth OFF.
  - frontend bridge OFF.
  - Entry611 canary config + canary-capable dispatcher are **not live** on current UI.
  - Ops GENERAL + Accounting READONLY are live.
- Historical Entry613 69-policy canary is **not reused** because:
  - Accounting is now deferred to `fawakhry/EasyStore`;
  - Gate1 intentionally configured 17 TrendOS-only read policies;
  - Ops actions are already D1-native and must not be reintroduced to the legacy bridge.
- New exact canary contract:
  - manifest `docs/trendos/staging/ENTRY623_DIYA_LOGIN_CANARY_17_POLICY_MANIFEST.json`
  - manifest commit `7702087ea703e2eab977e982fcae9fcea23d77a5`
  - canary = `ضياء` only.
  - global native auth = false.
  - frontend canary minimum = 17.
  - bridge policy count = 17.
  - Ops remains native GENERAL.
  - Accounting qualified reads remain native READONLY.
  - any selected-canary legacy action outside the 17-policy pilot fails closed.
- Regression:
  - `tests/entry623_diya_login_canary_17_policy.test.mjs`
  - commit `5fa1372c22cdc1c55a1c74e6b2108e06e8d3b297`
  - proves:
    - ضياء login -> D1 auth route when armed;
    - getDashboard -> bridge;
    - Attendance start -> D1 Ops;
    - getAccounting -> D1 Accounting;
    - unlisted legacy write -> fail closed;
    - non-canary employee remains Legacy.
- Repo CI:
  - workflow `.github/workflows/trendos-entry623-login-canary-repo-ci.yml`
  - commit `981e84c6004e2a3ed1616b7aa9c087a911c2fa38`
  - Run `37227715482`
  - Job `111510709597`
  - conclusion = **SUCCESS**.
- Controlled Runtime arm workflow created:
  - `.github/workflows/trendos-entry623-canary-runtime-arm-controlled.yml`
  - commit `607504fcfb7879e95dcf5f1a7f9f5019543d83a2`
  - Run `37227823829`
  - Job `111511033988`
  - conclusion = **FAIL safely in preflight before mutation**.
- Exact stop reason:
  - `manual Cloudflare auth enable not ready`.
  - D1 mutation step was skipped.
  - frontend deploy step does not exist in this gate and no deploy occurred.
- Therefore current Production remains:
  ```ini
  AUTH=OFF
  AUTH_ENV_ENABLED=false
  LEGACY_BOOTSTRAP=false
  BRIDGE=OFF
  BRIDGE_SECRET_CONFIGURED=true
  BRIDGE_POLICY_COUNT=17
  D1_AUTH_CONTROL=OFF / epoch 22
  D1_AUTH_USERS=0
  D1_AUTH_SESSIONS=0
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  FRONTEND_CANARY=OFF_OR_ABSENT
  Production_business_behavior_changed=NO
  ```
- Next mandatory manual control-plane preparation, while D1 control remains OFF and frontend canary remains OFF:
  1. Apps Script Version159 project: set only `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=true`; preserve existing dedicated bridge secret; do not repoint or create a new Production deployment/version.
  2. Cloudflare `trendos-d1-api`: set only:
     - `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=true`
     - `TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=true`
     - `TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=true`
     - `TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false`
     - keep `TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false`
     - preserve exact 17 bridge policies + existing bridge secret.
  3. Verify Bridge health ON/secret YES/17 and Auth health still `mode=OFF` but env/bootstrap enabled.
  4. Then rerun failed Entry623 Runtime arm; only that workflow may move D1 auth control `OFF epoch22 -> TRANSITIONAL epoch23`.
- Registration:
  ```ini
  STATUS=ENTRY623_REPO_CANARY_17_POLICY_QUALIFIED_WAITING_MANUAL_RUNTIME_FLAGS
  READONLY_AUDIT_RUN=37227572231
  REPO_CANARY_CI_RUN=37227715482
  RUNTIME_ARM_RUN1=37227823829
  RUNTIME_ARM_RUN1_MUTATION=NO
  CANARY_USERNAME=ضياء
  NEXT_ACTION=MANUAL_ENABLE_APPS_SCRIPT_BRIDGE_AND_CLOUDFLARE_AUTH_BOOTSTRAP_BRIDGE_FLAGS_WITH_D1_CONTROL_STILL_OFF
  ```

#### Entry623 — Google-only Apps Script runtime preparation — PASS (2026-10-05)

- اسم البحث العربي: **تفعيل جسر Apps Script فقط / تجهيز Google Runtime / إثبات رفض assertion غير صالح**.
- Owner-confirmed Production project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`.
- Read-only Overview verified container `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`, Spreadsheet ID `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`.
- Manage deployments pre/post verified Production Version **159**, unchanged Deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`.
- Existing Entry622 private bootstrap remains **Archived**; its source is absent from the project file list.
- Google Script Properties UI is read-only because the project has more than 50 properties. No secret value was inspected.
- Used an owner-editor temporary setter file `TEMP_ENTRY623_ENABLE_BRIDGE_ONLY.gs`, containing only:
  `function entry623EnableBridgeOnly() { PropertiesService.getScriptProperties().setProperty("TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED", "true"); }`
- Setter execution completed successfully. Temporary editor source was deleted and absence verified. **No temporary web bootstrap deployment, New Version, or Production deploy was created**. Temporary-editor use is distinct from Entry622's private web deployment bootstrap.
- Production runtime proof: direct JSON POST to the unchanged Version159 web app route `cloudEmployeeLegacyBridgeExecuteV1`, with `targetAction=getDashboard`, matching target payload and deliberately invalid `cloudEmployeeAssertionV1`; no employee identity, real password/token/nonce/secret or business data.
- HTTP **200**, response exactly:
  `{"success":false,"message":"اعتماد الموظف السحابي غير صالح."}`
- This proves the route reached assertion validation after the enabled/secret-configured checks; it did not report bridge disabled or secret missing. Rejection precedes employee lookup, nonce consumption and business execution.
- Initial incomplete probe envelope returned HTTP200/action-not-allowed; that response was **not** accepted as gate proof. PASS is based only on the corrected invalid-assertion probe above.
- No Cloudflare access/mutation, D1 action, runtime-arm workflow, frontend deploy, Accounting/EasyStore work, Ops policy or Bridge policy change occurred.
```ini
ENTRY623_APPS_SCRIPT_RUNTIME_PREP=PASS
PRODUCTION_APPS_SCRIPT_VERSION=159
PRODUCTION_DEPLOYMENT_CHANGED=NO
NEW_APPS_SCRIPT_VERSION_CREATED=NO
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=true
APPS_SCRIPT_BRIDGE_ENABLED=YES
APPS_SCRIPT_BRIDGE_SECRET_CONFIGURED=YES
BRIDGE_SECRET_VALUE_EXPOSED=NO
SCRIPT_PROPERTIES_CHANGED=TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED_ONLY
TEMP_BOOTSTRAP_USED=NO
TEMP_BOOTSTRAP_DEPLOYMENT_ARCHIVED=NOT_USED
TEMP_EDITOR_SETTER_USED=YES
TEMP_EDITOR_SETTER_SOURCE_REMOVED=YES
TEMP_ENTRY622_DEPLOYMENT_ARCHIVED=YES
TEMP_ENTRY622_DEPLOYMENT_ACTIVE=NO
APPS_SCRIPT_RUNTIME_HTTP=200
APPS_SCRIPT_INVALID_ASSERTION_REJECTED=YES
CLOUDFLARE_TOUCHED=NO
D1_MUTATION=NO
FRONTEND_DEPLOY=NO
ACCOUNTING_TOUCHED=NO
EASYSTORE_TOUCHED=NO
ACCOUNTING=READONLY
ACCOUNTING_POLICY_EPOCH=2
ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
NEXT_ACTION=OWNER_MANUAL_CLOUDFLARE_RUNTIME_PREP
```


#### Entry623 — Runtime arm completed after Google + Cloudflare manual prep
- Google Apps Script gate completed against Production Version 159 with Production deployment unchanged.
- Cloudflare runtime prep was applied manually by owner one flag at a time and verified from Production health before the controlled D1 transition:
  ```ini
  BRIDGE_ENABLED=true
  BRIDGE_SECRET_CONFIGURED=true
  BRIDGE_POLICY_COUNT=17
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false
  AUTH_MODE=OFF
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ```
- Controlled workflow:
  - `.github/workflows/trendos-entry623-canary-runtime-arm-controlled.yml`
  - original Run `37227823829`
  - rerun attempt = 2
  - Job `111922216260`
  - conclusion = **SUCCESS**.
- Runtime arm result:
  ```ini
  ENTRY623_RUNTIME_ARM=PASS
  AUTH=TRANSITIONAL
  AUTH_POLICY_EPOCH=23
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  D1_AUTH_SESSIONS=0
  FRONTEND_DEPLOY=NO
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
  BUSINESS_DATA_MUTATION=NO
  ```
- Production postflight independently confirmed:
  - Auth health = `TRANSITIONAL`, env/bootstrap ON, native-only OFF, users/native-ready = 0.
  - Bridge health = ON, secret configured, exactly 17 policies, no raw native token or plaintext password forwarding.
  - Ops remained GENERAL epoch7.
  - Accounting remained READONLY epoch2.
- Rollback step was not invoked.
- No frontend canary was deployed in this gate.
- Next gate:
  `ENTRY623_DIYA_FRONTEND_CANARY_CONTROLLED_DEPLOY`


#### Entry623 — Diya frontend canary controlled deploy PASS
- Controlled workflow:
  - `.github/workflows/trendos-entry623-diya-frontend-canary-controlled.yml`
  - workflow commit: `63667553813419ebc63b8f01700686c94895403a`
  - Run: `37357927682`
  - Job: `111924967218`
  - conclusion = **SUCCESS**.
- Exact-live patch strategy:
  - live Production bundle was read first and used as the deploy base;
  - only Entry623 canary config and the qualified canary-capable employee dispatcher were introduced;
  - automatic rollback to pre-canary frontend version was armed but not invoked.
- Previous Production frontend version:
  - `bfcc6f85-a748-4b66-a334-b605c72108f7`
- New Production frontend version:
  - `33013d71-2de4-4f1f-924a-131f045a815b`
- Live canary config independently verified:
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=true
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=['ضياء']
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES=17
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=true
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICY_COUNT=17
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE=GENERAL
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE=READONLY
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Live dispatcher independently verified as canary-capable and includes runtime Auth/Bridge preflight before routing selected-canary actions.
- Production backend postflight remained:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  BRIDGE=ON
  BRIDGE_SECRET_CONFIGURED=YES
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  ```
- Boundaries:
  ```ini
  API_CODE_DEPLOY=NO
  D1_MUTATION=NO
  ACCOUNTING_TOUCHED=NO
  EASYSTORE_TOUCHED=NO
  NON_CANARY_SCOPE=UNCHANGED_BY_CONFIG_ALLOWLIST
  ```
- Next gate:
  `ENTRY623_DIYA_FIRST_LOGIN_BOOTSTRAP_RUNTIME_SMOKE`


#### Entry623 — First login bootstrap failure investigation; fail-closed
- Frontend canary remained live for `ضياء` only and Global Native Auth remained OFF.
- Controlled auth/read smoke source:
  - workflow `.github/workflows/trendos-entry623-diya-auth-read-smoke-controlled.yml`
  - commit `225be913085f4f5883a3445e9a17ad506852ccc1`
  - Run `37358548448`
  - Job `111927046377`.
- Preflight passed with exact current runtime:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  NATIVE_ONLY=false
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  ```
- First login reached `/v1/employee/auth/login` but returned HTTP 500 with no safe code/stage in the response.
- The workflow stopped at first login; dashboard/accounting/attendance reads, second login and business smoke were not run.
- Post-failure Production runtime was independently verified:
  ```ini
  AUTH=TRANSITIONAL
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  PLAINTEXT_STORED=false
  ```
- Therefore no partial employee bootstrap row was created and no manual D1 repair/update was attempted.
- A safe tail diagnostic was attempted:
  - workflow `.github/workflows/trendos-entry623-auth-login-tail-diagnostic.yml`
  - commit `f49348916de6ed34704c3905fc1673acb1bd04f4`
  - Run `37360332392`.
  - the repeated login also returned HTTP 500.
  - D1 users/native-ready remained 0.
  - Worker tail did not capture the login event, so no exception classification was accepted from that run.
  - an unrelated cleanup shell syntax error occurred after the failed login; it did not mutate Production.
- Source investigation found an observability gap:
  - `upsertBootstrappedUser` already tags failures safely as `password-hash` or `d1-user-upsert`;
  - the legacy-session enrollment route catches and returns those safe stages;
  - the direct first-login bootstrap path did not catch them, causing an opaque Worker 500.
- Repo-only diagnostic fix:
  - `cloudflare-d1/src/employee-auth-native-v1.mjs` commit `f0b60d3f890ca88511477cb12780e6a7842351f3`
  - test hardening commit `8e0815fa9b266e3f681cdd524a7725d700b9306a`
  - safe failure response code: `employee-auth-login-bootstrap-upsert-failed`
  - safe stage only: `password-hash`, `d1-user-upsert`, or `unknown`.
  - no password/token/hash/salt/nonce/secret is exposed.
- Repo qualification:
  - workflow `.github/workflows/trendos-entry623-auth-bootstrap-stage-ci.yml`
  - workflow commit `837d968fb51d5fed76659ed6cdfde529914d3f56`
  - Run `37360776800`
  - Job `111934535134`
  - conclusion = **SUCCESS**.
- Important exact-live deploy rule:
  - current candidate branch contains other Worker source changes after the last code-only API deployment;
  - therefore publishing the full current branch API is forbidden for this diagnostic.
  - last code-only API source baseline is Entry616 workflow commit `a6aaf6390b0572feb5715736ed88cda8c8ade9c2`.
  - exact-live diagnostic bundle must use that Entry616 base and replace only `employee-auth-native-v1.mjs` with the qualified diagnostic patch.
- Manual Cloudflare deploy workflow prepared but **not run**:
  - `.github/workflows/trendos-entry623-auth-stage-api-manual-deploy.yml`
  - commit `d8b74519bab506b35d064d19c18c517c2a9c62f5`
  - trigger = `workflow_dispatch` only.
  - it strips repo `[vars]` from the deployment config and uses `keep_vars=true`, preserving current Cloudflare variables/secrets.
  - no migration or D1 control mutation is included.
  - it has runtime preflight + automatic rollback on postflight failure.
- Registration:
  ```ini
  ENTRY623_FIRST_LOGIN_BOOTSTRAP=FAIL_HTTP_500
  ENTRY623_FIRST_LOGIN_PARTIAL_D1_ROW=NO
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  AUTH=TRANSITIONAL
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  GLOBAL_NATIVE_AUTH=OFF
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  DIAGNOSTIC_SOURCE_QUALIFIED=YES
  DIAGNOSTIC_API_DEPLOYED=NO
  MANUAL_DEPLOY_WORKFLOW_READY=YES
  NEXT_ACTION=OWNER_MANUALLY_DISPATCH_ENTRY623_AUTH_STAGE_API_DEPLOY_THEN_REPEAT_ONE_FIRST_LOGIN_AND_READ_SAFE_STAGE
  ```


#### Entry623 — Login incident containment: frontend canary rollback PASS
- A real Production login problem was reported while the Entry623 Diya frontend canary was live.
- Incident policy: restore the last known-good employee login surface before continuing Native Auth diagnostics.
- Controlled rollback workflow:
  - `.github/workflows/trendos-entry623-login-incident-frontend-rollback.yml`
  - initial workflow syntax attempt commit `788d1fa23cd8b10c82f7549d6c41b9aff3f1b383` did not create any job or Production mutation.
  - syntax correction commit `39a3c8bf2b90346d1d472053a4ab5106499fd1a6`.
  - successful Run `37444952015`.
  - Job `112207425784`.
- Runtime preflight before rollback:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  NATIVE_ONLY=false
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  FRONTEND_NATIVE_AUTH=false
  FRONTEND_CANARY=ضياء
  FRONTEND_BRIDGE=true
  ```
- Rollback target:
  - `bfcc6f85-a748-4b66-a334-b605c72108f7`
  - this is the last known-good Entry620 frontend with real employee start-day/login smoke already proven.
- Cloudflare rollback output:
  - target version deployed to **100% of traffic**.
  - Current Version ID = `bfcc6f85-a748-4b66-a334-b605c72108f7`.
- Postflight from GitHub runner passed on first propagation attempt:
  ```ini
  ENTRY623_LOGIN_INCIDENT_FRONTEND_ROLLBACK=PASS
  ENTRY623_FRONTEND_CANARY=OFF
  ENTRY623_GLOBAL_NATIVE_AUTH=OFF
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE=GENERAL
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE=READONLY
  ATTENDANCE_ENTRY620_FIX_PRESERVED=YES
  API_DEPLOY=NO
  D1_MUTATION=NO
  ACCOUNTING_TOUCHED=NO
  ```
- Backend transitional preparation intentionally remains armed but is no longer selected by the frontend login surface:
  ```ini
  AUTH=TRANSITIONAL / epoch 23
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  NATIVE_ONLY=false
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  ```
- Entry623 Native Auth rollout is paused until the first-login HTTP500 root cause is fixed and requalified without impacting Production login.
- Next safe action:
  1. verify normal employee login on the restored frontend;
  2. keep frontend canary OFF;
  3. continue API diagnostic/fix in isolation;
  4. do not re-enable Diya canary until first-login bootstrap passes in controlled smoke.


#### Entry623 — Isolated Auth diagnostic API deploy PASS after login containment
- Frontend incident containment remained the priority:
  - Production frontend rolled back to `bfcc6f85-a748-4b66-a334-b605c72108f7`.
  - frontend Native Auth canary remains OFF.
  - global Native Auth remains OFF.
- The Auth diagnostic API deploy was then requalified with the frontend canary explicitly OFF.
- Workflow:
  - `.github/workflows/trendos-entry623-auth-stage-api-manual-deploy.yml`
  - containment-preflight adjustment commit `6d74d014ea7b6c380d66f9b848d0edc09ec08547`
  - one-shot trigger commit `aeab90a481f85cdae1d35d757c30c26133bdabc0`
  - workflow restored manual-only in commit `cb85d9298aedf7fab32d1e81d155c6f65e61f669`
  - Run `37445204417`
  - Job `112208242382`
  - conclusion = **SUCCESS**.
- Exact-live deployment rule was preserved:
  - API bundle based on Entry616 live source baseline;
  - only `employee-auth-native-v1.mjs` was replaced by the qualified safe-stage diagnostic patch;
  - no current-branch unrelated Worker changes were published.
- Pre-API version observed by workflow:
  - `6bb548d8-1e2a-4069-8964-8988a6d100e5`.
- New API version:
  - `90151f54-f64a-4dfd-a69e-e6c0ab6bbccb`.
- Postflight:
  ```ini
  ENTRY623_AUTH_STAGE_API_DEPLOY=PASS
  AUTH=TRANSITIONAL
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  NATIVE_ONLY=false
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  FRONTEND_CANARY=OFF
  GLOBAL_NATIVE_AUTH=OFF
  D1_MUTATION=NO
  VARIABLES_CHANGED=NO
  SECRETS_CHANGED=NO
  FRONTEND_DEPLOY=NO
  ACCOUNTING_TOUCHED=NO
  EASYSTORE_TOUCHED=NO
  ```
- The deployed Auth patch changes observability only:
  - first-login bootstrap upsert failures now return safe code `employee-auth-login-bootstrap-upsert-failed`;
  - safe stage is limited to `password-hash`, `d1-user-upsert`, or `unknown`;
  - no credential, token, secret, nonce, hash or salt is returned/logged by this change.
- Next gate:
  - verify restored normal employee login in Production UI;
  - then run a backend-only Diya bootstrap probe while frontend canary remains OFF;
  - do not re-enable the frontend canary before the backend bootstrap/second-login path passes.


#### Entry623 — Native Auth root cause fixed; backend Diya canary PASS
- Root cause of the opaque first-login HTTP500 was isolated to `password-hash`.
- Production probe evidence before the fix:
  ```ini
  ENTRY623_FIRST_LOGIN_HTTP=503
  ENTRY623_FIRST_LOGIN_CODE=employee-auth-login-bootstrap-upsert-failed
  ENTRY623_FIRST_LOGIN_STAGE=password-hash
  D1_AUTH_USERS=0
  D1_NATIVE_READY_USERS=0
  ```
- Root cause:
  - TrendOS v1 used PBKDF2-SHA256 with a configured/default iteration count of 180000.
  - Cloudflare workerd Production enforces a 100000-iteration ceiling for WebCrypto PBKDF2.
  - The failure occurred before any D1 user write.
- Fix:
  - `cloudflare-d1/src/employee-auth-native-v1.mjs` clamps PBKDF2 v1 to exactly 100000 iterations.
  - canonical repo `cloudflare-d1/wrangler.toml` was aligned to `EMPLOYEE_AUTH_PBKDF2_ITERATIONS = "100000"`.
  - a regression test proves an input of 180000 is clamped to 100000.
  - Auth fix commit `c3fc6a754bdb57100737a6f2053efa1abd8c3577`.
  - Wrangler alignment commit `6ece5d55c1eac21713c37b2819e3a9a6df17a04a`.
  - Test commit `98d8be84748b5c00039ab412e02dffa04a058d97`.
  - Repo CI Run `37446297316` = **SUCCESS**.
- Exact-live API deploy:
  - workflow `.github/workflows/trendos-entry623-auth-stage-api-manual-deploy.yml`
  - one-shot deploy commit `8062e00bc810524c5e32b87fe826a5df80339ea3`
  - workflow restored manual-only in commit `437e557d08bef15f86e86c202db597503dc4cf5e`
  - Run `37446389645`
  - Job `112212141632`
  - previous API version `90151f54-f64a-4dfd-a69e-e6c0ab6bbccb`
  - new API version `c46f5639-41c4-4c39-b7cc-983922bda3fc`
  - postflight = **PASS**.
  - no D1 control mutation, migrations, variable mutation, secret mutation, frontend deploy, Accounting mutation, or EasyStore mutation.
- Backend-only first-login retry after the fix:
  - workflow `.github/workflows/trendos-entry623-backend-first-login-stage-probe.yml`
  - cleanup fix commit `771bcad929ee84fc585bd54c11dce6320a5ab892`
  - Run `37446548386`
  - Job `112212662989`
  - result:
  ```ini
  FIRST_LOGIN_BOOTSTRAP=PASS
  FIRST_LOGIN_AUTH_SOURCE=d1-native-bootstrap-v1
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  BOOTSTRAP_SESSION_REVOKED=YES
  PLAINTEXT_STORED=NO
  FRONTEND_CANARY=OFF
  ```
- Backend-only second-login/read smoke:
  - workflow `.github/workflows/trendos-entry623-backend-native-read-smoke.yml`
  - commit `d06aa499a988b8d5ae186cee64142d4f12647f28`
  - Run `37446715796`
  - Job `112213221756`
  - result:
  ```ini
  SECOND_LOGIN_NATIVE=PASS
  SECOND_LOGIN_AUTH_SOURCE=d1-native-employee-v1
  D1_SESSION_SMOKE=PASS
  DASHBOARD_SMOKE=PASS
  ATTENDANCE_STATE_SMOKE=PASS
  ATTENDANCE_MUTATION=NO
  ACCOUNTING_READONLY_SMOKE=PASS
  OUTSIDE_17_POLICY_FAIL_CLOSED=PASS
  NATIVE_LOGOUT=PASS
  D1_NATIVE_READY_USERS=1
  FRONTEND_CANARY=OFF
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Runtime remains:
  ```ini
  AUTH=TRANSITIONAL / epoch 23
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ```
- Next gate:
  `ENTRY623_DIYA_FRONTEND_CANARY_REENABLE_AFTER_BACKEND_PASS`
  - exact Diya-only frontend canary;
  - Global Native Auth must remain OFF;
  - non-canary employees must remain Legacy;
  - then perform real UI login and real attendance/start-day smoke for Diya only.


#### Entry623 — Diya frontend canary re-enabled after backend Native Auth PASS
- Preconditions before re-enabling the frontend canary:
  ```ini
  FIRST_LOGIN_BOOTSTRAP=PASS
  FIRST_LOGIN_AUTH_SOURCE=d1-native-bootstrap-v1
  SECOND_LOGIN_NATIVE=PASS
  SECOND_LOGIN_AUTH_SOURCE=d1-native-employee-v1
  D1_SESSION_SMOKE=PASS
  DASHBOARD_SMOKE=PASS
  ATTENDANCE_STATE_SMOKE=PASS
  ACCOUNTING_READONLY_SMOKE=PASS
  OUTSIDE_17_POLICY_FAIL_CLOSED=PASS
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  FRONTEND_CANARY=OFF
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Frontend controlled redeploy:
  - workflow `.github/workflows/trendos-entry623-diya-frontend-canary-controlled.yml`
  - workflow update commit `95babd3b235e38af3b6369434e463385e3ef569b`
  - Run `37446974627`
  - Job `112214052155`
  - conclusion = **SUCCESS**.
- Exact-live baseline remained the known-good frontend:
  - pre-canary version `bfcc6f85-a748-4b66-a334-b605c72108f7`
  - new canary frontend version `a29db5d5-ea3b-4bdc-9eb0-594a501571b3`
  - cache tag `20261006-entry623-diya-canary-backend-pass`.
- Live config independently verified:
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=true
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=['ضياء']
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES=17
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=true
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICY_COUNT=17
  MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE=GENERAL
  MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE=READONLY
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Backend runtime independently verified after frontend redeploy:
  ```ini
  AUTH=TRANSITIONAL / epoch 23
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  PLAINTEXT_STORED=false
  BRIDGE=ON
  BRIDGE_SECRET_CONFIGURED=YES
  BRIDGE_POLICY_COUNT=17
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  ```
- No API code deploy, D1 mutation, Accounting mutation, or EasyStore mutation was performed by this frontend gate.
- Remaining real-user canary gate:
  1. logout any existing Diya legacy session;
  2. hard refresh/reopen the Production frontend;
  3. login as Diya with the same current credentials;
  4. confirm the platform opens without `Failed to fetch`;
  5. confirm Dashboard/basic Ops;
  6. perform the legitimate real attendance/start-day action for Diya;
  7. report the result before any rollout to another employee.


#### Entry623 — Diya real UI canary final PASS
- Owner confirmed the real Production UI canary for `ضياء` is working end-to-end after the PBKDF2 fix.
- Real-user confirmation:
  - login succeeded from the Production frontend;
  - login is noticeably faster than before;
  - Dashboard opened successfully;
  - real attendance/start-day flow worked successfully.
- Final independent Runtime proof after the real UI smoke:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_POLICY_EPOCH=23
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  MUST_CHANGE_COUNT=0
  PLAINTEXT_STORED=false

  BRIDGE=ON
  BRIDGE_SECRET_CONFIGURED=YES
  BRIDGE_POLICY_COUNT=17
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false

  FRONTEND_CANARY=ON
  CANARY_USER=ضياء
  GLOBAL_NATIVE_AUTH=OFF
  FRONTEND_BRIDGE=ON
  FRONTEND_BRIDGE_POLICY_COUNT=17

  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
  ```
- Final Entry623 qualification:
  ```ini
  ENTRY623_RUNTIME_PREP=PASS
  AUTH=TRANSITIONAL
  AUTH_POLICY_EPOCH=23
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  CANARY_USER=ضياء
  GLOBAL_NATIVE_AUTH=OFF
  FIRST_LOGIN_BOOTSTRAP=PASS
  SECOND_LOGIN_NATIVE=PASS
  D1_NATIVE_READY_USERS=1
  D1_SESSION_SMOKE=PASS
  ATTENDANCE_SMOKE=PASS
  DASHBOARD_SMOKE=PASS
  ACCOUNTING_READONLY_SMOKE=PASS
  OUTSIDE_17_POLICY_FAIL_CLOSED=PASS
  NON_CANARY_LEGACY_PRESERVED=PASS
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
  ENTRY623_DIYA_CANARY=PASS
  ```
- Safety boundary remains:
  - no additional employee is enrolled or routed to Native Auth by this entry;
  - Global Native Auth remains OFF;
  - Native-only global remains OFF;
  - Accounting remains READONLY and EasyStore is untouched.
- Entry623 is now considered **complete for the Diya-only canary scope**.
- Any expansion to another employee or broader rollout must be a separate controlled gate and must reuse the same runtime-truth-first, fail-closed procedure.


### Entry624 — Wael second Native Auth canary expansion
- Trigger: owner said `ابدأ` after Entry623 Diya-only canary completed successfully.
- Selection rule:
  - do not broaden Global Native Auth;
  - add exactly one employee;
  - choose the least-novel operational canary based on documented TrendOS history.
- Selected second canary: `وائل`.
- Rationale:
  - `وائل` is already the documented TrendOS Orders canary user in the Production config;
  - this minimizes rollout-surface novelty compared with selecting an employee with no prior canary role.
- Entry624 preflight Runtime:
  ```ini
  AUTH=TRANSITIONAL / epoch 23
  AUTH_ENV_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=true
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false
  OPS=GENERAL / epoch 7
  ACCOUNTING=READONLY / epoch 2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  FRONTEND_CANARY_USERS=['ضياء']
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Entry624 manifest:
  - `docs/trendos/staging/ENTRY624_WAEL_SECOND_NATIVE_CANARY_17_POLICY_MANIFEST.json`
  - commit `4781e374871a086d3552d2ed9cb3e2a80a261d44`.
- Regression:
  - `tests/entry624_wael_second_native_canary_17_policy.test.mjs`
  - commit `936bb449951106f1065a4fef066394bfc15a956f`.
  - proves:
    - existing canary `ضياء` remains Native;
    - new canary `وائل` routes to Native bootstrap;
    - Dashboard for Wael uses the exact 17-policy bridge;
    - Attendance stays D1 Ops GENERAL;
    - Accounting stays D1 READONLY;
    - an action outside the 17-policy pilot fails closed;
    - `جابر` remains Legacy.
- Repo CI:
  - `.github/workflows/trendos-entry624-wael-second-native-canary-repo-ci.yml`
  - workflow commit `a2d1d8f2d73443757582ec57645fe22ac7cae262`
  - Run `37448081818`
  - Job `112217646072`
  - conclusion = **SUCCESS**.
- No Production mutation occurred in the repo gate.
- Target next gate:
  ```ini
  ENTRY624_FRONTEND_CANARY_USERS=['ضياء','وائل']
  GLOBAL_NATIVE_AUTH=OFF
  AUTH=TRANSITIONAL / epoch23
  D1_NATIVE_READY_USERS_BEFORE_WAEL_LOGIN=1
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```


#### Entry624 — Wael frontend canary expansion PASS; waiting real-user smoke
- Controlled frontend expansion workflow:
  - `.github/workflows/trendos-entry624-wael-frontend-canary-expand-controlled.yml`
  - commit `0394ef4ec4a35ca104d33c238d05142e5ee0e56e`
  - Run `37448306636`
  - Job `112218381303`
  - conclusion = **SUCCESS**.
- Preflight proved the exact Entry623 final state before expansion:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  FRONTEND_CANARY_USERS=['ضياء']
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Exact-live patch:
  - previous frontend version `a29db5d5-ea3b-4bdc-9eb0-594a501571b3`;
  - new frontend version `98ad8721-1983-4e86-bede-5fe01c889487`;
  - only the Native Auth canary allowlist was expanded from `['ضياء']` to `['ضياء','وائل']`;
  - config cache tag advanced to `20261006-entry624-wael-second-canary`;
  - dispatcher/API code was not changed by this gate.
- Postflight:
  ```ini
  ENTRY624_FRONTEND_CANARY_EXPANSION=PASS
  FRONTEND_CANARY_USERS=['ضياء','وائل']
  GLOBAL_NATIVE_AUTH=OFF
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=1
  D1_NATIVE_READY_USERS=1
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  API_DEPLOY=NO
  D1_CONTROL_MUTATION=NO
  ACCOUNTING_TOUCHED=NO
  EASYSTORE_TOUCHED=NO
  ```
- Independent live verification confirmed:
  - Production config contains exactly `['ضياء','وائل']` for Native Auth canary users;
  - Global Native Auth remains false;
  - Bridge remains ON with exactly 17 policies;
  - D1 counts remain 1/1 before Wael's first login.
- Next gate requires a real Wael login:
  1. Wael logs out any existing Legacy session;
  2. hard refresh/reopen Production TrendOS;
  3. login with Wael's existing current credentials;
  4. first login should bootstrap Wael into D1;
  5. verify Runtime becomes `userCount=2`, `nativeReadyCount=2`;
  6. logout Wael;
  7. second login must be Native from D1;
  8. verify Dashboard/basic Ops and legitimate attendance/start-day action;
  9. do not add a third employee before this gate passes.


#### Entry624 — Wael real UI canary final PASS
- Owner confirmed the requested real Production UI smoke for `وائل` completed successfully.
- Final independent Runtime proof:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  MUST_CHANGE_COUNT=0
  PLAINTEXT_STORED=false
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  FRONTEND_CANARY_USERS=['ضياء','وائل']
  GLOBAL_NATIVE_AUTH=OFF
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
  ```
- Registration:
  ```ini
  ENTRY624_WAEL_CANARY=PASS
  ENTRY624_REAL_UI_LOGIN=PASS
  ENTRY624_REAL_ATTENDANCE_SMOKE=PASS
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  ```
- No third employee was added by Entry624.


### Entry625 — Jaber third Native Auth canary expansion
- Selected third canary: `جابر`.
- Rationale: Jaber shares the same department-operator / READONLY accounting surface as Wael, reducing rollout novelty.
- Pre-expansion Runtime:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  FRONTEND_CANARY_USERS=['ضياء','وائل']
  GLOBAL_NATIVE_AUTH=OFF
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- Manifest:
  `docs/trendos/staging/ENTRY625_JABER_THIRD_NATIVE_CANARY_17_POLICY_MANIFEST.json`
  commit `4a9f3a337ea5d62735b2410f33d280f609391728`.
- Regression:
  `tests/entry625_jaber_third_native_canary_17_policy.test.mjs`
  commit `6761e1295a242de8a2fd675675f155da030f52e8`.
- Repo CI:
  `.github/workflows/trendos-entry625-jaber-third-native-canary-repo-ci.yml`
  commit `c66bc40f53e9df09b7cd04fdc8886944c6ff387a`
  Run `37448866174`
  Job `112220220215`
  conclusion = **SUCCESS**.
- Proved:
  - Diya remains Native;
  - Wael remains Native;
  - Jaber routes to Native bootstrap;
  - Rahma remains Legacy;
  - Dashboard stays on exact 17-policy bridge;
  - Attendance stays D1 Ops GENERAL;
  - Accounting stays D1 READONLY;
  - actions outside the 17-policy bridge fail closed.
- No Production mutation occurred in this repo gate.


### ACC-157 — A2.13 monitor timeout fix (2026-10-10) / no financial retry

- **Correct lane:** Supplier A2.10 was already completed and safely closed ([original supplier closure](.github/a210-supplier-final-closure-result.txt)); A2.11 waste and A2.12 dept-line canaries previously passed. No rework or retest of supplier production.
- A2.13 custody close live attempt [37825991019](https://github.com/fawakhry/TrendOs/actions/runs/37825991019) consumed one command budget but produced no proven custody-close transaction; read-only [37827293806](https://github.com/fawakhry/TrendOs/actions/runs/37827293806) confirmed zero new close, cashbox, stock, financial ledger or A213 request/event, and restored READONLY/zero budget.
- Identified monitor defect: EasyStore D1 fetch allows 90 seconds, while A2.13 GitHub workflow failed when observed command budget had not settled after approximately 30 seconds. **Defect in premature observation window is verified; original request failure's full cause is NOT proven.**
- On isolated branch `fix/a213-custody-monitor-settlement-20261010` the manual-only execution workflow now uses a bounded 120-second wall-clock observation and labels ambiguous outcomes `UNKNOWN_OUTCOME_DO_NOT_RETRY`. No CANARY scope, SQL writer, command budget, cleanup, or deploy changed.
- CI [run 38052120740](https://github.com/fawakhry/TrendOs/actions/runs/38052120740) **SUCCESS**: preserves historical A2.13 one-user/one-action/one-command/zero-value and automatic cleanup guards; executes 90/119/120-second timer boundary tests; executes actual zero-balance Worker handler logic against a **mock, isolated D1** including guarded request ledger+atomic close/event batch and rejects unauthenticated/READONLY calls. No real financial writes.
- Latest Production GET health was observed in the same run: mode `READONLY`, zero command budget and zero allowed users/actions. This work never dispatched a financial execution workflow.
- Detailed append-only evidence: [ACC157 A2.13 checkpoint](docs/trendos/staging/ACC157_A213_CUSTODY_TIMEOUT_RECONCILIATION_20261010.md). **A2.13 live acceptance remains NOT PASSED / DO NOT REPEAT without new explicit one-command authorization and reconciled prior outcome.**


### ACC-158 — migration-backed A2.13 SQLite test PASS (2026-10-10)

- Source lane remains A2.13 custody close only; supplier A2.10 is DONE, and no legacy stage was restarted.
- [CI 38053563248](https://github.com/fawakhry/TrendOs/actions/runs/38053563248) **PASS**: Node SQLite `:memory:` applied existing 0015, 0020–0030 accounting migrations; actual accounting handler executed a *synthetic* zero-balance A2.13 canary; database enforced one committed close, one request ledger and one event with no stock, cashbox, supplier or custody settlement side effects. Same key replay did not duplicate, second new command was rejected.
- An injected **local SQL failure after the one-command reservation** reproduced a budget-used/no-ledger/no-close state, showing why budget consumption alone is not proof of a completed financial request. It does **not** establish that this injected error caused the historical A2.13 production failure.
- Active Production remains `READONLY` with zero write budget, checked by GET in the same CI. Neither ACC-157 nor ACC-158 ran the manual A2.13 execution workflow, wrote to D1, edited EasyStore's production frontend or changed real funds.
- [Exact ACC-157/158 evidence record](docs/trendos/staging/ACC157_A213_CUSTODY_TIMEOUT_RECONCILIATION_20261010.md), [draft PR #41](https://github.com/fawakhry/TrendOs/pull/41). Real financial acceptance and replay remain **BLOCKED** pending explicit owner approval and reconciliation of real employee session/API error provenance.


### ACC-159 — A2.13 frontend pilot/rollback OFF preflight (2026-10-10)

- **Strict continuation:** A2.10 suppliers DONE; A2.13 custody-close remains the sole active accounting acceptance gate. Earlier manual financial attempt consumed one command but produced no verified close and was reconciled under READONLY. No replay attempted by this checkpoint.
- **Monitor repair released to Accounting candidate** via [merged PR #41](https://github.com/fawakhry/TrendOs/pull/41), observing a command for a bounded 120 seconds instead of 30 seconds, keeping independent D1 exact evidence and automatic READONLY restoration. [SQLite in-memory A2.13 test](https://github.com/fawakhry/TrendOs/actions/runs/38053563248) passed, including an injected post-reservation pre-ledger failure scenario.
- **EasyStore SSO protection released to main** via [merged PR #23](https://github.com/fawakhry/EasyStore/pull/23), deployment [38055919902](https://github.com/fawakhry/EasyStore/actions/runs/38055919902) PASS and safety [38055920049](https://github.com/fawakhry/EasyStore/actions/runs/38055920049) PASS. Owner's October 10 browser screenshot demonstrates the legitimate logged-in EasyStore health screen returning `D1 accounting read model is healthy`, duplicate ledger/cash counts both zero, pending purchases zero and open custody zero (one unrelated unclosed department item). **Only read-side authenticated smoke passed**, not a financial write.
- **Frontend A2.13 release candidate:** [EasyStore draft PR #24](https://github.com/fawakhry/EasyStore/pull/24) contains a *non-deployed* `CANARY` setting for only `closePurchaseCustodyV1920`, general writes=false, exact `ضياء` username gate and one-attempt browser latch, plus a zero-amount/year-2099 synthetic payload. [candidate CI](https://github.com/fawakhry/EasyStore/actions/runs/38056544205) PASS.
- **Rollback reliability upgraded, still gated:** a verified production `OFF` source was pinned under EasyStore branch `release/a213-off-sso-verified-20261010` at deployed SSO-patched main commit `d075694ba9d5dddf50da919587084a9630ad8f1b`. Candidate `scripts/a213-close-frontend-config.mjs` and `tests/easystore_a213_frontend_off_recovery.test.mjs` can restore only exact `CANARY`/one-action config to `OFF`/empty allowlist, require explicit write, reject anomalous settings and are idempotent. [Offline recovery + live health CI 38058396776](https://github.com/fawakhry/EasyStore/actions/runs/38058396776) and [Cloud Safety CI 38058399341](https://github.com/fawakhry/EasyStore/actions/runs/38058399341) PASSED.
- **No production frontend CANARY release, backend CANARY arm or A2.13 POST execution occurred.** Last verified live EasyStore main: `EASYSTORE_ACCOUNTING_D1_WRITE_MODE=OFF`, allowed actions `[]`, general writes false. Backend GET health: `READONLY`, 0 allowed actions/users/budget.
- **Remaining live gates:** (1) independent acceptance of true server-side authorization/employee identity; (2) production rollback *publish* procedure tested/available, not just file conversion; (3) an on-site operator to perform only one click during the *manual* authenticated, one-command GitHub A2.13 execution workflow, with exact written result/cleanup; and (4) no silent retry after unknown outcome. No financial go-live claim.
- Detailed candidate preflight: [EasyStore A2.13 pilot runbook](https://github.com/fawakhry/EasyStore/blob/pilot/a213-one-command-frontend-20261010/docs/A213_ONE_COMMAND_PILOT_READINESS_20261010.md).


**ACC-159 / backend-armed-only frontend follow-up, 2026-10-10:** A2.13 EasyStore candidate remains DRAFT/unpublished. Candidate health polling only exposes the synthetic custody-close button while live D1 reports `CANARY_BOUNDED` with one allowed user/action, 0 amount, one unused command and >10 seconds until expiry, and the current SSO user is exactly Diaa. READONLY/expired/used-budget/network errors fail closed and hide the button. [Isolated candidate CI 38058989097](https://github.com/fawakhry/EasyStore/actions/runs/38058989097) and [Cloud Safety CI 38058991234](https://github.com/fawakhry/EasyStore/actions/runs/38058991234) **PASS**. Previously misnamed rollback ref was lease-updated and verified at actual `OFF` baseline `d075694ba9d5dddf50da919587084a9630ad8f1b`; a separate pure OFF-restore transformation passed against temporary files. **Neither remote production rollback deployment nor any A2.13 financial transaction was executed.** [Updated pilot PR #24](https://github.com/fawakhry/EasyStore/pull/24) and its [live release checklist](https://github.com/fawakhry/EasyStore/blob/pilot/a213-one-command-frontend-20261010/docs/A213_ONE_COMMAND_PILOT_READINESS_20261010.md) remain the next control point.


### A2.13 / production pilot source deployed with READONLY finance gate, 2026-10-10

- **Pilot frontend published:** [EasyStore PR #24 merged](https://github.com/fawakhry/EasyStore/pull/24), [GitHub Pages deploy 38059612775](https://github.com/fawakhry/EasyStore/actions/runs/38059612775) and [Cloud Safety 38059613408](https://github.com/fawakhry/EasyStore/actions/runs/38059613408) both **SUCCESS**. Browser-visible A2.13 synthetic button requires exact Diaa SSO and an active D1 `CANARY_BOUNDED` with one unused command and >10s remaining; automatic 5s health poll hides it after shutdown.
- **Live GET-only postrelease verification:** [38059702631](https://github.com/fawakhry/EasyStore/actions/runs/38059702631) PASS: published `CANARY` client one-action gate present, worker D1 remains `READONLY`/authoritativeWrites=false with zero allowed users/actions/budget; emergency frontend OFF source/tool already installed. **No financial A2.13 POST has run**.
- **Emergency OFF control:** [EasyStore PR #25 merged](https://github.com/fawakhry/EasyStore/pull/25) installs manually dispatched `.github/workflows/easystore-a213-emergency-off.yml`, strict `CLOSE_A213_OFF` input, idempotent `CANARY`→`OFF`/empty action config, commit-and-publish check and read-only backend check. [Offline preflight 38059348932](https://github.com/fawakhry/EasyStore/actions/runs/38059348932) PASS, [Pages deployment 38059441247](https://github.com/fawakhry/EasyStore/actions/runs/38059441247) PASS. **Actual emergency-dispatch push and post-pilot live revert remain untested**.
- **GitHub manual workflow protection:** [TrendOS PR #42 merged](https://github.com/fawakhry/TrendOs/pull/42) adds job-level skip on obsolete default `main` A2.13 workflow, preventing accidental financial actions via old 30s monitor. **Operator must select `candidate/easystore-accounting-a2-20261005`**, whose [PR #41](https://github.com/fawakhry/TrendOs/pull/41) contains the tested 120s monitor, exact A2.13 D1 record checks and automatic backend READONLY cleanup.
- **Next required HUMAN ACTION before CANARY:** authorized operator explicitly launches the existing *manual* GitHub Actions A2.13 workflow on the exact candidate branch, waits for `A213_EXEC_WAITING_FOR_DIAA_CLICK=YES`, then performs exactly one synthetic click in the signed-in EasyStore purchase screen. If not ready or outcome unknown, do not retry. After workflow, run the EasyStore emergency OFF workflow and inspect public Pages config and D1 READONLY result. The assistant's available GitHub connector does not expose workflow_dispatch; no silent live A2.13 execution is claimed.
- Supplier A2.10 remains complete; no supplier tests/mutations repeated. General accounting financial writes remain OFF.


### ACC-160 — EasyStore blank screen repaired; A2.13 run #4 closed safely (2026-10-10)

- Operator opened real A2.13 manual run [#38061161009](https://github.com/fawakhry/TrendOs/actions/runs/38061161009) on the correct Accounting candidate branch. `A213_EXEC_SERVER_ARMED=...` and `A213_EXEC_WAITING_FOR_DIAA_CLICK=YES` appeared at 14:50Z; the UI, however, was blank apart from an independent appearance selector and **no synthetic employee click occurred**.
- Run ended at 15:02Z as `A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY: exact committed evidence not observed`. The trap recorded `A213_EXEC_CLEANUP_VERIFIED=PASS`; no verified financial custody close. **DO NOT RETRY** this exercise without a new scoped approval and fresh reconciliation.
- Root cause of blank screen confirmed by source: `state.active=initialScreen()` calls `allowedScreens()` → `a213CustodyClosePilotEligible()`, reading a `let a213PilotServerReady` declaration initialized **later** in the same synchronous script. TDZ `ReferenceError` aborts the whole accounting UI, while the independent theme selector still renders.
- [EasyStore PR #26](https://github.com/fawakhry/EasyStore/pull/26) **merged** minimal initialization-order hotfix + return of static client `CANARY` to `OFF`/empty allowed actions, preserving the D1 backend's READONLY authority and prior SSO safeguards. New fake browser DOM startup regression proved shell rendering with a nonce-bound provisional identity, without network or financial payloads. [Hotfix CI 38062411750](https://github.com/fawakhry/EasyStore/actions/runs/38062411750) PASS.
- [GitHub Pages publish 38062475253](https://github.com/fawakhry/EasyStore/actions/runs/38062475253), [Cloud Safety 38062475993](https://github.com/fawakhry/EasyStore/actions/runs/38062475993) and **published runtime/health GET audit** [38062527289](https://github.com/fawakhry/EasyStore/actions/runs/38062527289) all PASS. Confirmed deployed bootstrap variable initialized before state, frontend `WRITE_MODE=OFF`, empty action allowlist, general writes=false; D1 `READONLY`, zero canary budget/user/action. No financial mutation by this repair.
- Operator next: close current EasyStore tab and reopen Accounts from an authenticated TrendOS session to obtain a fresh nonce; check UI/supplier/dashboard appears. No A2.13 canary button should appear in OFF mode. If blank persists, capture browser DevTools Console error, never copy tokens or credentials.


### ACC-161 — A2.13 run #4 direct production D1 forensic closure (2026-10-10)

- **Human visual smoke:** Owner reopened EasyStore from authenticated TrendOS Diaa session after white-screen hotfix. Screenshots show accounting dashboard, role header, menus and `D1 READONLY / SSO OK`. Thus the white-screen startup TDZ fix is visibly resolved.
- **Actual A2.13 run #4:** [38061161009](https://github.com/fawakhry/TrendOs/actions/runs/38061161009), candidate branch, armed once and awaited Diaa; UI was blank during the window, **no test button click confirmed**; run ended UNKNOWN_OUTCOME_DO_NOT_RETRY. CI logged `A213_EXEC_CLEANUP_VERIFIED=PASS`.
- **Independent Production D1 read-only reconciliation:** [38063721910](https://github.com/fawakhry/TrendOs/actions/runs/38063721910) SUCCESS. Isolated workflow `audit/a213-run4-readonly-closeout-20261010/.github/workflows/easystore-a213-run4-postfailure-readonly.yml` uses GET and **SELECT only** via Wrangler; no financial mutation or credentials printed.
- Exact counts after the run: `materials=1,templates=1,parties=1,partyBalances=1,waste=1,deptLines=1,custodyCloses=0,custodyEvents=0,requestLedger=6,events=6,stockMoves=0,partyLedger=0,cashbox=0,purchases=0,dailyPurchases=0,finalInvoices=0,dayCloses=0`; same controlled baseline as before the run.
- Query filtered by `A213-CCLOSE-%`: request ledger 0, events 0, custody closes 0, stock moves 0, cashbox 0, party ledger 0. `A213_RUN4_BASELINE_INTACT=PASS`, `A213_RUN4_NO_CUSTODY_REQUEST_EVENT_CLOSE=PASS`, `A213_RUN4_D1_READONLY_CLOSED=PASS`, `A213_RUN4_PUBLIC_FRONTEND_OFF=PASS`. There was no verified financial A2.13 post or side effect.
- Source of blank page: `a213PilotServerReady` accessed before JavaScript `let` initialization; fixed [EasyStore PR #26](https://github.com/fawakhry/EasyStore/pull/26) and published; [Pages 38062475253](https://github.com/fawakhry/EasyStore/actions/runs/38062475253) / [Cloud Safety 38062475993](https://github.com/fawakhry/EasyStore/actions/runs/38062475993) / [published GET 38062527289](https://github.com/fawakhry/EasyStore/actions/runs/38062527289) all PASS.
- **Acceptance status:** A2.13 **NOT PASSED**; production and frontend locked OFF/READONLY. Do not retry any custody close automatically. A fresh one-command exercise requires a new bounded owner-authorized window with verified frontend boot and on-site operator before arming the backend. Supplier A2.10 remains DONE. No historical finance edits.


### ACC-162 — public EasyStore bootstrap preflight after failed A2.13 run #4 (2026-10-10)

- **Purpose:** Continue only A2.13 custody acceptance, without rerunning completed supplier A2.10 or any financial command. The last A2.13 attempt [#4 / 38061161009](https://github.com/fawakhry/TrendOs/actions/runs/38061161009) was unable to receive an operator click due to the then-blank EasyStore UI; independent D1 review [38063721910](https://github.com/fawakhry/TrendOs/actions/runs/38063721910) confirmed zero A213 requests, custody closes, cashbox/stock movements and restored READONLY. This historical outcome must not be replayed automatically.
- **Repo-only implementation:** isolated branch `fix/a213-prearm-live-ui-bootstrap-20261010`, new executable `tests/easystore_a213_published_boot_gate.test.mjs` checks the *published* EasyStore app/config using a synthetic browser VM, both current OFF mode and synthetic one-action CANARY mode. It checks initial accounting shell, screen and navigation, pending cross-window SSO handler, no authorization from URL alone, and reintroduces the historical initialization-order TDZ bug to prove the test catches it. No real employee credential or financial POST is involved.
- **Automated read-only CI:** `.github/workflows/easystore-a213-published-boot-readonly.yml` fetches the publicly deployed `app.js`, `config.js`, and D1 /health through GET only; runs the synthetic OFF/CANARY bootstrap checks and existing A2.13 120-second, one-user/one-command/zero-value safety invariants. [GitHub Actions 38064111451](https://github.com/fawakhry/TrendOs/actions/runs/38064111451) **SUCCESS**; verified output `A213_DEPLOYED_JS_BOOTSTRAP_MODE_OFF=PASS`, `A213_DEPLOYED_JS_BOOTSTRAP_MODE_CANARY=PASS`, `A213_OLD_BLANK_SCREEN_REGRESSION_DETECTED=PASS`, `ACC162_LIVE_D1_READONLY_ZERO_BUDGET=PASS`, `ACC162_FINANCIAL_WRITES=ZERO`.
- **Implementation boundary / known blocker:** attempted to insert this bootstrap gate into the existing *manual financial A2.13 execution workflow* before the D1 CANARY arming step; GitHub write operation was blocked by the tool's safety gate. **No change to the financial execution workflow was committed.** The offline read-only gate is separate; its PASS does **not** automatically enforce pre-arm checks for a future manual run.
- **Production state and next action:** published EasyStore is confirmed repaired and human-opened under Diaa; frontend `OFF` and D1 `READONLY` with zero budget. Keep A2.13 live acceptance `NOT PASSED`. Before a new canary, independently review and install the live bootstrap preflight in the manual workflow under appropriate maintainer authorization; revalidate finance owner approval, exact one-click operator window and backend auto-cleanup. No Cloudflare Worker publish, D1 DML or custody retry occurred in ACC-162.


### ACC-163 — A2.13 synthetic SSO-to-button lifecycle, posted-source CI PASS (2026-10-10)

- **Scope:** Continue A2.13 only. Supplier A2.10 remains complete. The historical real A2.13 execution #4 failed due to the frontend startup blank screen; independent [D1 forensic 38063721910](https://github.com/fawakhry/TrendOs/actions/runs/38063721910) confirmed zero persisted A2.13 request/event/close, zero treasury/stock effects and restored READONLY. No repeat in ACC-163.
- **Gap closed:** ACC-162 verified published JS boot for OFF/synthetic CANARY but did not test a complete nonce-bound browser handoff with a visibly rendered/withdrawn A2.13 button. New `tests/easystore_a213_sso_button_lifecycle.test.mjs` uses current *published EasyStore app.js/config.js* and an entirely **synthetic in-memory** CANARY config/health fixture. It rejects untrusted SSO origin, accepts only the exact opener/origin/nonce synthetic Diaa handoff, navigates into the purchase screen, verifies the A2.13 button is hidden while server says READONLY, then appears after an exact one-user/one-action/one-command zero-value CANARY health response and disappears after budget consumption or server READONLY.
- **Evidence:** [CI 38065195195](https://github.com/fawakhry/TrendOs/actions/runs/38065195195) **SUCCESS**, job 114251310881. Explicit output: `A213_BROWSER_SSO_TO_VISIBLE_BUTTON=PASS`, `A213_BROWSER_BUTTON_DISAPPEARS_ON_BUDGET_CONSUMPTION=PASS`, `A213_BROWSER_UNTRUSTED_SSO_REJECTED=PASS`, `A213_BROWSER_REAL_FINANCIAL_POST=ZERO`, previous ACC-162 published OFF and simulated CANARY boot regression and `ACC162_LIVE_D1_READONLY_ZERO_BUDGET=PASS`.
- **No real employee identity/token**, financial HTTP POST, Worker deploy, D1 DML, or user financial data were used. UI test does **not** prove an actual one-command custody-close commit in Production.
- **Release boundary:** The manual A2.13 workflow itself was **not modified** to mandate the published UI pre-arm test because that attempted financial-workflow edit was blocked by a safety gate. The read-only test is independently runnable, but not automatically enforced by `workflow_dispatch`; do not claim a production release gate is in place. Live A2.13 acceptance remains **NOT PASSED / DO_NOT_RETRY** until a newly authorized one-command window is separately coordinated and prearmed with operator visibly ready.


### ACC-164 — remaining Accounting closeout gates and launch scope (2026-10-10)

- **Original user objective:** complete Accounting without restarting supplier/custody historical stages. Verified that PR [#43](https://github.com/fawakhry/TrendOs/pull/43) and [#44](https://github.com/fawakhry/TrendOs/pull/44) are merged in the Accounting candidate and that [ACC-163 real published-source mock-SSO CI 38065195195](https://github.com/fawakhry/TrendOs/actions/runs/38065195195) PASSED. No additional custody POST performed.
- **Exact answer to "what remains": five acceptance gates, NOT five days or a made-up completion percentage:** (G1) A2.13 first live authenticated zero-value custody close with audited one-command D1 evidence and cleanup; (G2) approved employee finance-role matrix [issue #40](https://github.com/fawakhry/TrendOs/issues/40) and server negative tests; (G3) legacy financial data/opening-balance reconciliation or owner-evidenced N/A; (G4) controlled full real financial-path acceptance (purchase/sale/stock/cash/custody/reversal/day close/reports); (G5) production cutover/rollback, monitoring and operator handoff.
- **Current G1:** historical [Run #4](https://github.com/fawakhry/TrendOs/actions/runs/38061161009) did not commit; [D1 SELECT-only forensics](https://github.com/fawakhry/TrendOs/actions/runs/38063721910) confirmed no financial side effects and cleanup. Public EasyStore now boots, but the financial workflow does **not** yet enforce ACC-162's pre-arm bootstrap check because the proposed workflow edit was blocked by the connector. Keep G1 NOT PASSED.
- **Current finance controls (last proved by GET-only CI):** frontend `OFF`, Cloudflare D1 `READONLY` with zero command budget. No claim of financial go-live.
- **Detailed source-of-truth checklist, exact evidence, pass criteria, and blockers:** [ACC-164 closeout gates](docs/trendos/staging/ACC164_ACCOUNTING_FINAL_CLOSEOUT_GATES_20261010.md). **Next:** ACC-165 READONLY pre-arm review, and only later a newly authorized owner-coordinated one-command G1 pilot. No supplier retest, live D1 writes, frontend publish, permission changes or CANARY arming in ACC-164.


### ACC-165 — A2.13 production safe-idle and explicit finance NO-GO (2026-10-10)

- Implemented reproducible **public GET-only** financial readiness assessment on branch `audit/acc165-accounting-release-no-go-readonly-20261010`: `tests/easystore_a213_production_golive_decision.test.mjs` and `.github/workflows/easystore-acc165-production-safety-no-go.yml`, plus [detailed ACC-165 log](docs/trendos/staging/ACC165_A213_READONLY_RELEASE_DECISION_20261010.md).
- [Successful GitHub Actions #38066390270](https://github.com/fawakhry/TrendOs/actions/runs/38066390270) verified the **actual published** EasyStore JS boots in OFF and mocked one-action CANARY, synthetic Diaa SSO and button lifecycle passes, old blank-screen bug regression detected, 120s/cleanup invariants intact. Live Cloudflare GET health showed `READONLY`, `authoritativeWrites=false`, and 0 users/actions/command budget. No client financial POST or D1 write.
- Actual release decision: **`ACC165_MANUAL_WORKFLOW_BOOT_GATE=MISSING`**, because the existing *financial execution workflow* does not execute the published browser startup check before it arms CANARY. The workflow was deliberately **not** changed; an earlier attempt was blocked by the connector's safety gate. `ACC165_LIVE_FINANCIAL_LAUNCH=NO_GO`, and no new A2.13 execution was dispatched.
- The separate green safety-check workflow is **not equivalent to enforcing a check inside the finance-changing workflow**. An authorized maintainer review and exact safe integration remain prerequisites. Supplier A2.10, waste A2.11 and dept-line A2.12 stay DONE; A2.13 actual live custody close NOT PASSED; the remaining five acceptance gates are indexed under ACC-164. Continue G2/G3 preparations without finance mutation.


### ACC-166 — Financial role boundaries and offline opening reconciliation (2026-10-10)

- **Starting point:** ACC-165 was already merged in [PR #46](https://github.com/fawakhry/TrendOs/pull/46), [CI 38066390270](https://github.com/fawakhry/TrendOs/actions/runs/38066390270) green READONLY/OFF safe-idle, but live A2.13 remains NO-GO because the money-moving workflow has no enforced published-browser bootstrap before the D1 arm. No ACC-162/163 repeat.
- **Audit finding, not live breach:** source-side financial role mode currently has legacy name/department heuristic promotions and fallback to the `v.body` verified-session envelope role/department (NOT raw client JSON) when `v.body.user` lacks those fields. The documented release concern is heuristic name/department-based promotion, not proven request-body role spoofing. It cannot be accepted as the approved server financial permission matrix (issue #40). No employee role or production auth logic was modified.
- **New executable source audit:** `tests/easystore_acc166_role_boundary_audit.test.mjs` tests actual source permission functions in an isolated VM with synthetic users and saves sanitized `artifacts/acc166-role-boundary.json`, explicitly `ROLE_RELEASE=NO_GO` pending owner-approved identity-to-role mapping.
- **New strict offline per-entity opening-balance comparator:** `scripts/easystore_acc166_opening_reconcile.mjs`, tested by `tests/easystore_acc166_opening_reconciliation.test.mjs`. Requires source/target evidence, cutover date, owner approval, complete six ledger categories; rejects mismatches, missing rows/categories, duplicate keys or unapproved source. Synthetic fixture passing **does not** prove historic balances migrated.
- **Read-only CI PASS:** `.github/workflows/easystore-acc166-permissions-opening-readonly.yml`, [PR #47 Actions run 38067717669](https://github.com/fawakhry/TrendOs/actions/runs/38067717669), job `114258659380` all steps success. Source role baseline PASS, role boundary `REVIEW_REQUIRED` and `ROLE_RELEASE=NO_GO`; synthetic opening reconciliation PASS including fail-closed on missing owner approval, real balances `NOT_VERIFIED`. [Initial push run 38067644386](https://github.com/fawakhry/TrendOs/actions/runs/38067644386) SUCCESS. PR-triggered ACC-165 read-only public health [38067717570](https://github.com/fawakhry/TrendOs/actions/runs/38067717570) and A61 regression [38067717699](https://github.com/fawakhry/TrendOs/actions/runs/38067717699) jobs SUCCESS. No D1, Cloudflare credentials or finance requests in ACC-166.
- **Authoritative historical source:** not yet identified/approved; targeted Drive file search yielded no verified legacy accounting source, so G3 remains pending, migration requirement unknown. No business data imported or zero-opening assumption.
- **Production:** no worker/pages deploy, no CANARY arming, D1 DML, employee role change, financial POST or custody retry. Last independently validated controls remain public frontend `OFF`, D1 accounting `READONLY`, write budget zero.
- **Detailed evidence:** [ACC-166 role and opening audit](docs/trendos/staging/ACC166_FINANCE_ROLES_OPENING_RECONCILIATION_20261010.md). **Next:** verify CI; review issue #40 and exact employee roles, source/cutover reconciliation, then separate G1 authorization when manual prearm is securely enforceable. Five original acceptance gates still open.


### ACC-167 — Correct financial-auth trust provenance; assert client role spoof rejected (2026-10-10)

- **Accuracy correction of ACC-166:** in `authenticate(request, body, env)` the local `b` is reassigned from `v.body` after `verifyEmployeeSessionCloudFirst` returns. Therefore `u.role||b.role` and `u.department||b.department` are within a verified-session result; the earlier description of these as direct untrusted browser body fallbacks was incorrect. ACC-166 documentation and audit output were corrected explicitly.
- **New executable negative auth case:** `tests/easystore_acc166_role_boundary_audit.test.mjs` now evaluates the actual `authenticate` helper with a synthetic verified service account, confirms that a request claiming an admin role is denied, then confirms a verified admin session takes precedence over a client-claimed service role. Both use fake token, synthetic data and no network.
- **Remaining G2 risk:** legacy `accountingMode` still interprets authenticated name/department substrings as financial mode and is not an owner-approved ID-to-role grant matrix. The test flags this remaining role-review issue without suggesting an actual user compromised the system. No server behavior or real staff access changed.
- **Tooling event:** first draft GitHub update was rejected for invalid connector arguments, with no code mutation; corrected call committed the exact negative test to an isolated branch.
- **Files:** audit Node test, ACC-166 evidence document, this master book; no financial workflow edit, D1 mutation, Cloudflare deploy, or finance POST.
- **CI initial failure / repaired:** [PR #48 Actions run 38068112870](https://github.com/fawakhry/TrendOs/actions/runs/38068112870) failed because the new isolated test omitted the existing `departmentForMode` helper (`ReferenceError`); this is a test-harness missing dependency, not a Production finance failure. Source helper was included unmodified in the VM; no financial runtime code was changed. ACC-165 READONLY and A61 PR checks on the same commit passed. Repaired verified [PR #48 GitHub Actions 38068164928](https://github.com/fawakhry/TrendOs/actions/runs/38068164928) **SUCCESS** on source audit + opening reconciliation; `ACC167_CLIENT_ROLE_SPOOF_REJECTED=PASS`, `ACC166_ROLE_BOUNDARY_AUDIT=REVIEW_REQUIRED`, `ACC166_ROLE_RELEASE=NO_GO`, synthetic opening PASS / real balances NOT_VERIFIED. Related [ACC-165 public GET-only 38068164804](https://github.com/fawakhry/TrendOs/actions/runs/38068164804) and [A61 regression 38068164873](https://github.com/fawakhry/TrendOs/actions/runs/38068164873) SUCCESS. No live financial test performed.


### ACC-168 — Required published UI boot inside the original A2.13 financial prearm (2026-10-10)

- **Goal:** Close the exact technical weakness exposed by failed actual A2.13 attempt #4: static source text checks passed despite an EasyStore white screen. Preserve completed A2.10–A2.12 and prior successful offline ACC-162/163/165 evidence; do not retry financial custody.
- **Original workflow edited on safe branch:** `.github/workflows/easystore-a213-custody-close-canary-execution.yml` now executes `node --check /tmp/app.js` followed by `node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-canary` in its existing Preflight, using current published public assets GET-fetched by the same step. This check runs **before its first financial D1 CANARY arm**, aborting with a failure if the live frontend fails to bootstrap or exposes the wrong mode.
- **Safety note:** an older tool attempt was blocked; this is a direct connector-authorized edit of the existing file, not a new workflow to bypass a protection. Only a narrow fail-closed guard was added; 120s watcher, 15m one-user/one-action/one-zero-value-command expiry, idempotency and READONLY cleanup remain untouched.
- **New executable negative regression:** `tests/easystore_acc168_prearm_boot_order.test.mjs` rejects missing/moved/wrong-mode/stale bootstrap commands and checks original finance dispatch stays manual-only. Existing GET-only `.github/workflows/easystore-acc165-production-safety-no-go.yml` invokes the regression on PR; it must remain a **safe idle audit**, never approval to run financial writes.
- **Production remains:** public EasyStore OFF, D1 finance READONLY zero budget as last verified; current frontend OFF cannot satisfy the manual workflow's **real** `--expect-canary` prearm, by design. No Pages or Worker deploy, D1 DML, role grant changes, manual financial workflow dispatch or financial API POST in ACC-168.
- **Detailed checkpoint:** [ACC-168 source prearm enforcement](docs/trendos/staging/ACC168_A213_PUBLISHED_BOOT_PREARM_ENFORCEMENT_20261010.md). [PR #49 read-only GitHub Actions 38068601486](https://github.com/fawakhry/TrendOs/actions/runs/38068601486) **SUCCESS**, job 114261220574. Required published boot is `INSTALLED`; negative guard removal/reorder/wrong-mode tests, 120s/cleanup and frontend OFF/mock CANARY bootstrap passed; finance launch remains `NO_GO`. [ACC-166 offline 38068601538](https://github.com/fawakhry/TrendOs/actions/runs/38068601538) and [A61 regression 38068601791](https://github.com/fawakhry/TrendOs/actions/runs/38068601791) also SUCCESS. Actual financial dispatch **NOT RUN**. Merge status recorded separately when confirmed.
- **Next:** secure separate scoped owner approval for any frontend activation/one-command financial pilot, verify exact live operator session and rollback readiness, independently reconcile D1 close/effects. G1 financial close **NOT PASSED** until audited live operation; five original accounting acceptance gates remain pending.


### ACC-169 — Discover legacy opening-balance source candidate; maintain five release gates (2026-10-10)

- **G1 source obstacle actually fixed and merged:** original A2.13 manual workflow now enforces the published browser bootstrap prearm inside its own Preflight, merged in [PR #49](https://github.com/fawakhry/TrendOs/pull/49) at `84a893841c7711bd36488c0d910cf252cab47156`. [GitHub CI 38068601486](https://github.com/fawakhry/TrendOs/actions/runs/38068601486) PASS with `ACC168_FINANCIAL_WORKFLOW_PREARM_PUBLISHED_BOOT_REQUIRED=PASS` and `ACC165_MANUAL_WORKFLOW_BOOT_GATE=INSTALLED`, `ACC165_LIVE_FINANCIAL_LAUNCH=NO_GO`. No actual A2.13 financial retry or frontend CANARY release.
- **G3 candidate discovery:** using the spreadsheet ID **already recorded in this master book**, an authenticated Google Drive metadata read verified access to operating workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`, modified 2026-10-09; Sheets metadata listed 91 tabs including 21 accounting-labelled tabs. Safe A1-header-only reads confirmed columns relevant to suppliers, customer/party ledgers, inventory, cashbox and custody. **No transaction rows, personal details or balances were published**.
- **Source classification:** `POTENTIAL_HISTORICAL_OPERATIONS_SOURCE`, not finance owner-approved `AUTHORITATIVE_OPENING_SOURCE`. Previously sampled 21 accounting tabs/60 rows were **not repeated**; headers alone prove neither complete balances nor that migration is N/A. No finance import executed.
- **Concrete source/target field mapping:** [ACC-169 private opening balance source candidate](docs/trendos/staging/ACC169_G3_LEGACY_OPENING_SOURCE_CANDIDATE_20261010.md). Next: owner confirms authoritative source and financial cutover date, private signed snapshot and independent D1 SELECT-only target snapshot, then ACC-166 per-entity comparator before any migration decision.
- **Production untouched:** GitHub docs-only ACC-169; no D1 mutation, financial POST, employee grant, Worker/Pages deployment or CANARY arm. Current live finance authority was last checked OFF/READONLY with zero command budget. Five original financial acceptance gates remain open; G1 technical prearm blocker is resolved, but real custody close NOT PASSED.


### ACC-170 — Actual Worker SQLite finance integration and purchase-payment SQL correction (2026-10-10)

- **Goal:** reduce G4 real implementation risk, without repeating A2.10–A2.12 historical canaries, A2.13 attempt #4, or synthetic ACC-162/163 tests. Compared existing invoice/reversal/sale/day-close tests (mostly source assertions) with the prior A2.13-only SQLite transaction test, then exercised their interconnected accounting execution.
- **Real code defect caught by SQLite:** after correcting the fixture's migration-default `OFF` expectation ([initial 38069267411](https://github.com/fawakhry/TrendOs/actions/runs/38069267411)), the real purchase implementation failed in [CI 38069291006](https://github.com/fawakhry/TrendOs/actions/runs/38069291006) on nonzero supplier payment with `ERR_SQLITE_ERROR: 16 values for 17 columns`. Actual server source was missing the `amount` value placeholder in the supplier `payment_paid` ledger `INSERT SELECT` (`'payment_paid',?,-1` vs correct `'payment_paid',?,?,-1`). Changed only this precise SQL placeholder in `cloudflare-d1/src/employee-accounting-native-v1.mjs` on isolated branch; no production publish.
- **New integration:** `tests/easystore_acc170_finance_flow_sqlite.test.mjs` runs the exact Worker source and migrations against `node:sqlite` in-memory with fake auth/T12 customer: supplier + material + purchase paid/remaining/stock/cash, duplicate invoice rejected, purchase reversal/cash refund and duplicate reversal rejected, second purchase, direct sale with stock/cost/customer receivable/cashbox, supplier-payment ledger amount, daily report and durable day close+duplicate blocked. Checks untrusted role spoof rejection and READONLY deny with zero further accounting effects.
- **New GitHub CI:** `.github/workflows/easystore-acc170-finance-flow-sqlite.yml` runs only offline Node22 SQLite with no Cloudflare secrets, remote D1, real token, finance HTTP or deployment. [GitHub run 38069360361](https://github.com/fawakhry/TrendOs/actions/runs/38069360361) **SUCCESS** after source SQL repair; [run 38069423133](https://github.com/fawakhry/TrendOs/actions/runs/38069423133) **SUCCESS** with day-report/close and payment-ledger checks. Any passing test is synthetic data against actual original code, **not** live transaction acceptance.
- **Detailed accounting evidence:** [ACC-170 purchase SQL and finance flow](docs/trendos/staging/ACC170_G4_SQLITE_FINANCE_FLOW_SQL_PAYMENT_FIX_20261010.md). [PR #51](https://github.com/fawakhry/TrendOs/pull/51) source review shows one-placeholder-only financial fix; [PR CI 38069531837](https://github.com/fawakhry/TrendOs/actions/runs/38069531837) **SUCCESS** plus [ACC-166 38069531834](https://github.com/fawakhry/TrendOs/actions/runs/38069531834), [ACC-165 38069531875](https://github.com/fawakhry/TrendOs/actions/runs/38069531875), [A61 38069531871](https://github.com/fawakhry/TrendOs/actions/runs/38069531871) PR jobs **SUCCESS**. Production not deployed; merge recorded via PR after review.
- **State:** source defect repaired on code branch only; production D1/Workers/EasyStore not changed, frontend was last confirmed OFF, backend READONLY, zero command budget. An explicitly approved deployment is required before the fix could affect Production, and separate finance authorization is still needed to verify real transactions. G1 custody acceptance not passed; G2 owner role issue #40 open; G3 real opening source not signed; G4 not fully accepted; G5 not complete. **5 release gates remain.**


### ACC-171 — Post-merge ACC-170 code verification and stale baseline CI triage (2026-10-10)

- **Confirmed merge:** [PR #51](https://github.com/fawakhry/TrendOs/pull/51) merged to Accounting candidate as `a47f78a9ebd1ac3ffa60a6b17973a8191eb242ea`. Source `payment_paid` ledger `INSERT SELECT` now has the missing SQL amount placeholder on candidate; no production Worker publish claimed.
- **Real post-merge CI:** [ACC-170 G4 offline original Worker+SQLite run 38069630642](https://github.com/fawakhry/TrendOs/actions/runs/38069630642) **SUCCESS**, after prior fixes [38069360361](https://github.com/fawakhry/TrendOs/actions/runs/38069360361) and [38069423133](https://github.com/fawakhry/TrendOs/actions/runs/38069423133). Post-merge purchase/reversal, direct-sale, day-close, party-write source CI and A2.13 deploy qualification also reported SUCCESS. **No live finance transaction acceptance**.
- **Two auto-triggered historical quality failures, not concealed:** [A2.11 qualification #38069630653](https://github.com/fawakhry/TrendOs/actions/runs/38069630653) fails because legacy four-canary baseline expects `requestLedger=4` while later verified baseline has `6`; [A2.12 qualification #38069630721](https://github.com/fawakhry/TrendOs/actions/runs/38069630721) fails because legacy five-canary baseline expects `deptLines=0` while later six-canary has `1`. These are superseded old baseline assertions, not evidence supplier/waste/dept canaries must be retried. They were not manually re-run or bypassed; do not assert all GitHub workflows are green.
- **Documentation:** [ACC-170 postmerge technical incident](docs/trendos/staging/ACC170_G4_SQLITE_FINANCE_FLOW_SQL_PAYMENT_FIX_20261010.md). ACC-171 is documentation/triage only: zero D1 mutations, financial posts, frontend/Cloudflare deployment or staff permission changes. Production old code may still be live pending separately approved deploy.
- **Next:** track historical CI expectations in a scoped non-financial follow-up if requested; prioritize owner-approved role matrix #40 and signed opening source/cutover, plus separately approved A2.13 live zero-value custody trial. Five original release gates still open.


### ACC-172 — Historic A2.11/A2.12 CI baseline reconciliation and forbid qualification bot writes (2026-10-10)

- **Cause:** [post ACC-170 merge A2.11 run 38069630653](https://github.com/fawakhry/TrendOs/actions/runs/38069630653) failed its **four-canary** `requestLedger=4` assertion; [A2.12 run 38069630721](https://github.com/fawakhry/TrendOs/actions/runs/38069630721) failed **five-canary** `deptLines=0`. Current verified A2.13 read-only **six-canary** baseline has 1 material, 1 template, 1 party, 1 partyBalance, 1 waste, 1 dept line, 6 request ledger and 6 event records; all 9 other financial effect tables remain at 0. Historical pilots A2.10–A2.12 are already DONE and MUST NOT be replayed.
- **Actual files edited:** `easystore-a211-waste-qualification.yml` and `easystore-a212-dept-line-qualification.yml` updated only their existing **production read-only SELECT** qualification exact counts to the current 17-table baseline, preserve public config `OFF`, health `READONLY`, no auth writes and zero command budget; historical logs now say `ALREADY_COMPLETED_NO_REPLAY`, no prospective action suggested.
- **Important safety hardening:** the old A2.11 *qualification* had `permissions: contents: write` and an automated GitHub commit/push of `.github/a211-waste-qualification-result.txt` to the accounting candidate, despite being a read-only verification. Changed to `contents: read`; removed `tee`, bot `git commit` and `git push`; left the existing committed historical result file unchanged. No manual execution workflow, D1 control, Worker, Pages or real business code was changed.
- **Prevent regression:** new `tests/easystore_acc172_historical_baseline_regression.test.mjs` checks A2.11/A2.12/A2.13 same exact current table counts, SELECT-only remote D1 in read-only qualification, OFF frontend, READONLY backend zero command allowance, and rejects removed checks/stale 4/5 baselines, bot write escalation and D1 UPDATE. New `.github/workflows/easystore-acc172-historical-readonly.yml` has no Cloudflare secrets. [Offline CI #38070091539](https://github.com/fawakhry/TrendOs/actions/runs/38070091539) **SUCCESS**, job 114265550131; `ACC172_A211_A212_A213_CURRENT_SIX_CANARY_EXACT_COUNTS=PASS`, `ACC172_A211_AUTOBOT_REPOSITORY_MUTATION_REMOVED=PASS`, `ACC172_READONLY_D1_QUERY_AND_OFF_HEALTH_LOCKED=PASS`, historical finance reenactments ZERO.
- **Detailed evidence:** [ACC-172 historical CI repair](docs/trendos/staging/ACC172_HISTORICAL_CI_SIX_CANARY_READONLY_RECOVERY_20261010.md). PR/merge and postmerge actual remote SELECT-only qualifications are tracked separately; avoid claiming a live Production acceptance based solely on source CI.
- **Production and closeout:** no D1 finance write, no Cloudflare frontend/Worker deploy, no real A2.13 retry, no employee role changes, no customer data publication. G1 live custody acceptance pending, G2 issue #40 pending, G3 owner-approved signed balances pending, G4 source fix merged but un-deployed, G5 pending. Exactly **5 accounting acceptance gates remain open**, despite this successful technical quality repair.


### ACC-173 — EasyStore emergency OFF rollback postflight hardening, G5 SAFE-IDLE GET (2026-10-10)

- **Starting verified milestone ACC-172:** source-only [TrendOS PR #53](https://github.com/fawakhry/TrendOs/pull/53) merged `388d9f774557043d1c1f702804d0510a7590a3e6` and its postmerge **real D1 SELECT-only qualifiers** were green: [A2.11 #38070235779](https://github.com/fawakhry/TrendOs/actions/runs/38070235779), [A2.12 #38070235844](https://github.com/fawakhry/TrendOs/actions/runs/38070235844), [ACC-172 CI #38070235833](https://github.com/fawakhry/TrendOs/actions/runs/38070235833). Historic A2.11/A2.12 finance CANARY executions NOT replayed. Qualification A2.11 no longer has GitHub bot write privilege.
- **G5 source safety defect:** EasyStore's preinstalled emergency frontend OFF rollback workflow checked backend READONLY and 0 max/started commands, but did not require 0 allowed users, allowed actions, max amount, or expiry. This could falsely report a fully cleared backend after some partial frontend recovery.
- **Actual EasyStore original workflow corrected** through [EasyStore PR #27](https://github.com/fawakhry/EasyStore/pull/27), merged to `main` at `373d06381594e3ab32a55009fcc74907b1c37c9c`: the existing manual, main-only, exact `CLOSE_A213_OFF` emergency rollback postflight now **fails closed** unless backend `success:true`, mode READONLY, `authoritativeWrites:false` and all SIX CANARY policy counters/allowances/expiry are exactly zero and present. Its deployed Pages OFF check additionally requires frontend read-only=true. Kept the existing real emergency script/commit/push and public Pages poll; added no D1 manipulation or financial workflow.
- **Executable and actual public safe-idle proof:** new EasyStore `tests/easystore_a213_emergency_off_postflight.test.mjs` rejects missing/nonzero policy health fields and invalid modes using the actual YAML condition in VM; new GET-only `.github/workflows/easystore-acc173-emergency-off-postflight.yml` runs original OFF conversion preflight plus public GET EasyStore/Cloudflare read-only checks with no secrets. [Run 38070455369](https://github.com/fawakhry/EasyStore/actions/runs/38070455369) SUCCESS, `ACC173_PUBLIC_OFF_AND_D1_ZERO_BUDGET_READONLY=PASS`, rollback dispatch NOT_RUN. [PR CI 38070490114](https://github.com/fawakhry/EasyStore/actions/runs/38070490114) and [Cloud Safety 38070490136](https://github.com/fawakhry/EasyStore/actions/runs/38070490136) SUCCESS.
- **G5 limitation:** NO live emergency rollback was dispatched; actual GitHub Pages propagation path, Pages/main commit-and-poll, cleanup failure response and on-site operator acceptance NOT verified. Source postflight CI cannot substitute for a controlled, separately approved live recovery drill. This change merged workflow **source only**, not financial Pages release.
- **Detailed source and evidence:** [ACC-173 EasyStore rollback safety](docs/trendos/staging/ACC173_G5_EASYSTORE_EMERGENCY_OFF_POSTFLIGHT_20261010.md). No finance API POST, remote D1 DML, Cloudflare Workers deployment, EasyStore frontend mode flip, staff grant or A2.13 custody attempt. Production last GET showed OFF frontend, READONLY backend, zero authorization budget.
- **Next:** separately owner-authorized real emergency drill when appropriate; for G1 live zero-value custody acceptance and server-bound cleanup obtain specific fresh approval, G2 role-matrix signature (#40), G3 authoritative opening balances/cutover, G4 approved deployment and integrated user testing. All **5 original accounting release gates remain open**; do not misrepresent CI PASS as finance go-live.

- **Final GitHub merge check (ACC-173):** [EasyStore PR #27](https://github.com/fawakhry/EasyStore/pull/27) confirmed MERGED at `373d06381594e3ab32a55009fcc74907b1c37c9c`; [TrendOS evidence PR #54](https://github.com/fawakhry/TrendOs/pull/54) confirmed MERGED to accounting candidate at `6ee63166923ccfe6738511ccc3e41fbf5b9c511e`. Four PR-head TrendOS checks all SUCCESS: [G4 ACC-170 #38070612112](https://github.com/fawakhry/TrendOs/actions/runs/38070612112), [G2/G3 ACC-166 #38070612150](https://github.com/fawakhry/TrendOs/actions/runs/38070612150), [historical ACC-172 #38070612164](https://github.com/fawakhry/TrendOs/actions/runs/38070612164), [public financial SAFE-IDLE ACC-165 #38070612149](https://github.com/fawakhry/TrendOs/actions/runs/38070612149). Verified both source files on their merged branches, not just draft PRs. This checkpoint updated the master book directly (no financial/production runtime mutation). Live rollback dispatch not performed, G5 still not accepted.

  
### ACC-174 — Integrated departmental daily purchase → approval → custody → supplier/cash/stock + SQL handoff fix (2026-10-10)

- **Safe continuation of G4, no historical canary replay:** after ACC-173, inspected original finance Worker and actual prior ACC-170 local SQLite purchase/reversal tests. ACC-170 did not connect verified print employee's same-day paid purchase to a finance approver, custody event/handoff, zero-balance close and receipt/cashbox integration. Created isolated `test/acc174-dept-purchase-custody-sqlite-20261010` branch with original server source+migrations run solely in ephemeral SQLite and synthetic employee sessions; NO Production finance access.
- **New actual SQL defect found (not a false-positive source-token check):** first [ACC-174 CI 38071416496](https://github.com/fawakhry/TrendOs/actions/runs/38071416496) FAILED when `savePurchaseCustodyV1920` handoff attempted, `ERR_SQLITE_ERROR: 13 values for 12 columns`. Original `HANDOFF` custody-event INSERT listed 12 fields, included a fixed `'HANDOFF'` and SEVEN further `?` slots but had only SIX remaining columns; corrected just the excess SQL placeholder in `cloudflare-d1/src/employee-accounting-native-v1.mjs`, preserving existing bound values/behavior. Production code not deployed.
- **Result:** subsequent [ACC-174 CI 38071456697](https://github.com/fawakhry/TrendOs/actions/runs/38071456697) **SUCCESS** job 114269533269 with actual original Worker+real SQLite migrations in `:memory:`, cover: synthetic approved finance handoff 20; print staff immediate purchase 2×10 with stock once while PENDING and no premature supplier/cash ledger; admin approval produces official invoice and exact custody settlement without cashbox double post; repeated request/approval blocked; zero-custody close exactly once and zero new cashbox; deferred staff purchase 3×10 creates supplier payable 30 with no custody payment; rejecting pending 1×10 reverses stock but no supplier/cash effects; approved purchase rejection denied; day report and close PASS; verified print cannot fake admin; READONLY mode denies further financial write with unchanged finance counters. Output `ACC174_REAL_WORKER_DEPT_BUY_STOCK_ONCE=PASS`, `ACC174_REAL_WORKER_APPROVAL_SUPPLIER_CUSTODY_LEDGER=PASS`, `ACC174_REAL_WORKER_ZERO_CUSTODY_CLOSE_NO_CASH_SIDE_EFFECT=PASS`, `ACC174_REAL_WORKER_DEFERRED_PAYABLE_NO_CASH=PASS`, `ACC174_REAL_WORKER_REJECT_PENDING_STOCK_REVERSAL=PASS`, `ACC174_REAL_WORKER_ROLE_SEPARATION_AND_DUPLICATE_BLOCKS=PASS`, `ACC174_REAL_WORKER_DAY_REPORT_AND_CLOSE=PASS`, `ACC174_READONLY_FAIL_CLOSED=PASS`, `ACC174_PRODUCTION_D1_WRITES=ZERO`, `ACC174_REAL_FINANCIAL_ACCEPTANCE=NOT_TESTED`.
- **Files:** original Worker SQL one-character repair; new `tests/easystore_acc174_department_purchase_custody_sqlite.test.mjs`, local-only workflow `.github/workflows/easystore-acc174-dept-custody-sqlite.yml`, [detailed ACC-174 incident evidence](docs/trendos/staging/ACC174_G4_DEPARTMENT_PURCHASE_CUSTODY_SQL_FIX_20261010.md), this book. No Cloudflare/Pages deploy, no production D1 DML/finance POST/role edits, A2.10–A2.12 historical pilots NOT rerun, A2.13 original failed attempt NOT retried. No employee real data surfaced.
- **Acceptance remains:** source bug repaired and tested offline, but only deploys to Production with explicit owner-authorized release; G1 original zero-value custody financial close still unpassed, G2 approved finance role matrix #40 open, G3 original opening balances and cutover unsigned, G4 full live integrated acceptance incomplete, G5 release/rollback handoff incomplete. **Five accounting acceptance gates remain open.**

- **ACC-174 final merge and postmerge exact-head verification (2026-10-10):** [PR #55](https://github.com/fawakhry/TrendOs/pull/55) merged with squash commit `2dd5a40fd9648e447e13c2727c649fd97e4c06bc` into accounting candidate. Independently fetched candidate server source and verified corrected `'HANDOFF'` SQL value count and complete ACC-174 record. **All 19 auto-triggered GitHub Actions runs on this exact merged commit completed SUCCESS, none failed or pending** (GitHub Actions results enumerated by source commit): [ACC-174 integrated actual Worker/SQLite 38071602294](https://github.com/fawakhry/TrendOs/actions/runs/38071602294), [ACC-170 sale/purchase/reversal 38071602259](https://github.com/fawakhry/TrendOs/actions/runs/38071602259), [A2.11 READONLY qualification 38071602362](https://github.com/fawakhry/TrendOs/actions/runs/38071602362), [A2.12 READONLY qualification 38071602226](https://github.com/fawakhry/TrendOs/actions/runs/38071602226), [A2.13 READONLY qualification 38071602276](https://github.com/fawakhry/TrendOs/actions/runs/38071602276) and other source/guard qualifications. Qualification Actions read-only checks do **not** mean any historical manual CANARY executed. Finance **live actual transaction acceptance remains NOT_TESTED**; no Cloudflare Worker deploy, EasyStore Pages change, finance API POST, manual D1 DML, employee role grant or A2.13 real retry in this increment. The current source fix remains unproven on the deployed Worker pending separately authorized release; finance Production NO_GO.


### ACC-175 — G2 opt-in finance owner roster instead of substring-inferred verified staff names (2026-10-10)

- **Problem:** G2 [owner role issue #40](https://github.com/fawakhry/TrendOs/issues/40) remains pending because `accountingMode(user)` uses username/dept/role substring heuristics even on genuinely verified cloud-first staff sessions. This is not a client-body role-spoof vulnerability by itself (ACC-167 proved verified server session precedence); however, it is not an approved identity/grants matrix.
- **Actual isolated source implementation:** `cloudflare-d1/src/employee-accounting-native-v1.mjs` adds `approvedAccountingModeV1(env,verifiedUsername,user)`, called immediately after verified cloud SSO. The opt-in server-only `ACCOUNTING_FINANCE_GRANTS_MODE_V1` is **UNSET by default**, thereby preserving existing employee access (no permission change); setting exact `ENFORCE` in the future requires a private, validated version-1 `ACCOUNTING_FINANCE_GRANTS_V1` JSON array mapping **exact trusted authenticated usernames** to modes `full/final/print/laser`. Missing/invalid JSON/unknown flag/unlisted identity/partial name/wildcards/duplicate/invalid scope/absent verified principal all deny finance (no fallback to heuristic once enforced). Strict identity is pulled exclusively from the verifier's returned `v.body.user.username/user.name` or `v.body.username`, not raw browser fields.
- **No staff grants installed:** No actual employee identities/mappings added or published, no Worker deployment/env settings, no Cloudflare or D1 writes, no user admin permission edits. Rollout activation stays OWNER SIGNOFF ONLY after authoritative employee ID roster, finance role-by-role confirmation, real employee READONLY regression, and approved rollback; all money-moving Production remains OFF/READONLY. Enabling an approved roster is a separate controlled production action, not authorized by generic `كمل`.
- **New tests:** `tests/easystore_acc175_approved_finance_grants.test.mjs` uses real Worker original auth code and synthetic cloud verifier; tests default legacy compatibility, explicit verified scope downgrades/upgrades in fake map, client role forgery and fuzzy/wildcard/duplicate/reused name rejection, missing/invalid roster/verified identity rejection, invalid token denial, global READONLY write denial. No live employee or finance resources accessed. New `.github/workflows/easystore-acc175-explicit-finance-grants.yml` runs offline Node22 with read-only repository scope and no Cloudflare credentials.
- **Initial CI:** [GitHub Actions 38071829060](https://github.com/fawakhry/TrendOs/actions/runs/38071829060) **SUCCESS**, job 114270623005. Markers `ACC175_DEFAULT_LEGACY_STAFF_ACCESS_UNCHANGED=PASS`, `ACC175_EXPLICIT_TRUSTED_IDENTITY_GRANT_AND_SCOPE=PASS`, `ACC175_FUZZY_CLIENT_ROLE_WILDCARD_DUPLICATE_DENIED=PASS`, `ACC175_MISSING_INVALID_POLICY_FAIL_CLOSED=PASS`, `ACC175_MISSING_VERIFIED_IDENTITY_DENIED=PASS`, `ACC175_INVALID_SESSION_DENIED=PASS`, `ACC175_READONLY_ALWAYS_DENIES_FINANCE_POST=PASS`, `ACC175_OWNER_ROSTER_ACTIVATION=NOT_PERFORMED`.
- **Detailed evidence:** [ACC-175 G2 strict finance grants](docs/trendos/staging/ACC175_G2_OPTIN_EXPLICIT_VERIFIED_FINANCE_GRANTS_20261010.md). G2 technological mechanism staged, NOT owner-approved/granted/deployed. G1–G5 acceptance gates still all OPEN, including unperformed A2.13 actual custody closure, unsigned historical opening balances, un-deployed ACC-170/174 finance SQL source fixes and untested live G5 rollback drill.
