# TrendOS — الكتاب الرئيسي القابل للتحديث

> **MASTER BOOK / Active Zero-Google Core**  
> إصدار الكتاب: **4.22-ZERO-GOOGLE-COMPACT — Entry642 deploy-resilient Auth hardening PASS** · تاريخ التحديث: 2026-10-07 · المستودع: `fawakhry/TrendOs` · فرع العمل: `candidate/t12-full-cloud-cutover-a56-20260929`.

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

> **قاعدة التسجيل:** كل خطوة جديدة تؤثر في Repo / Cloudflare / D1 / Apps Script / Production تُسجل هنا فورًا بالحالة الفعلية والدليل والخطوة التالية. ويشمل ذلك: كل محاولة ناجحة أو فاشلة، Runtime drift، rollback/restore، إصلاح hardening، workflow/run/job، deploy، تشخيص سبب الفشل، وفتح/إغلاق أي gate. لا تعتبر أي خطوة مكتملة قبل تسجيلها هنا. ممنوع تسجيل passwords أو Tokens أو password hashes أو session secrets.

## Entry: T12 Customer Lane Safe Release Gate — 2026-10-08

**آخر حقيقة:** `BLOCKED_SAFE / REPO_RELEASE_CI_PASS / PROD_OLD_CREATE_VERSION`. المالك وافق على معالجة مرجع الحالات القديمة بعد فحص آمن وموافقة سابقة على نشر الإصلاح. لم يتم النشر لأن حزمة API الحية تختلف بشكل جوهري عن شجرة GitHub الأخيرة.

**القانون النهائي للعميل + القسم:** الأوردر المفتوح في الطباعة يمنع طباعة جديدة فقط، والأوردر المفتوح في الليزر يمنع ليزر جديد فقط. «متعدد الأقسام» يفتح البند المتاح وحده (أو البندين إذا خاليين)، دون إنشاء مهمة للقسم المشغول. لا Override للموظف. "جاهز للاستلام" يبقى مفتوحًا حتى التسليم الفعلي.

**أوردرات Legacy:** D1 frozen mirror به 767 بندًا فعليًا (768 شاملاً رأس الأعمدة)، مع 15 Runtime overlays. بالوضع النهائي: `638 تم التسليم + 73 جاهز للاستلام + 36 مكرر + 20 ملغى`، ولا توجد حالات أخرى مفتوحة. مقارنة Google Sheets الحي من خلال موصل Google مع D1 read-only أثبتت تطابق جميع هوية وقسم الـ73 بندًا «جاهز للاستلام»؛ FNV32 `orderId:lineId:department:phone:name = 68772830` في المصدرين. توجد 17 هوية تاريخية مكررة/متعارضة مغلقة أو جاهزة للاستلام؛ **لم نغيرها ولم نحذفها**. تقادم وقت مزامنة المرآة وحده ليس دليلًا على اختلاف الحالات الحالية، ولا يوجد مبرر لكتابة حالات عشوائية إلى D1.

**حل السباق:** Migration additive غير مطبقة `cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql`، و`cloudflare-d1/src/t12-general-create.mjs` يحتجز مفتاحًا فريدًا للعميل والقسم في نفس D1 batch المُنشئ للطلب والبنود، مع bounded retry للـMulti غير المتعارض؛ يمنع طلبين بالتوازي ولو اختلفت الأصناف/الكميات. الوحدة والسيرفر والواجهة واختبارات Entry652 الأخيرة = PASS على الفرع `release/t12-customer-lane-safe-20261008`، run `37779637589`.

**بوابة Runtime:** Run `37779969426` فشل عن عمد في فحص التطابق الثنائي للـAPI: Live worker size=1,024,085 بايت SHA256=`f61e58185ec245b996dcf2aa139805d8bbac7d9d068aa7f8a7514835da3398d4`، بينما Source baseline bundle=858,902 بايت SHA256=`65ef2c5cc06735d2838ffaa1b8da4d2c46b5ff1666d9c403c6e8e913991f7872`. عدم التطابق حقيقي حتى بعد إصلاح مسار esbuild؛ **ممنوع رفع Worker من الشجرة الحالية، لأنه قد يمحو تغييرات Production غير محفوظة في المصدر نفسه**. API الحي ما زال `T12_GENERAL_CREATE_20261001_DUP_GUARD_V1`.

**Backup/recovery:** Cloudflare D1 Time Travel bookmark متاح ومخفي؛ timestamp `2026-10-08T12:52:21Z`. هذا استرداد زمني مؤقت وليس Backup مستقل. GitHub repo **PUBLIC**؛ ممنوع تصدير ملف بيانات العملاء إلى Artifacts عامة. لم يحدث D1 write ولا schema apply ولا Deploy ولا UPDATE/DELETE أوردرات.

**خطوة الاستكمال الوحيدة:** تحديد مصدر حزمة Worker الحالية بدقة، ربطه بأحدث الشجرة (فرع candidate تقدّم أثناء العمل إلى `c03bf6a167190acc3d1db918d2268440ad08f8a8`)، مراجعة وضع Frontend المحدث وإجراء source/runtime parity + integration ثم نشر مراقب مع Worker rollback، بعد كل البوابات. سجل التدقيق: `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CUSTOMER_LANE_RELEASE_PREFLIGHT_2026-10-08.md`. لا تعد تنفيذ خطوات READONLY/CI الناجحة من الصفر.

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


#### Entry625 — Jaber frontend canary expansion PASS; waiting real-user smoke
- Initial generated deploy workflow Run `37448969279` failed safely in source qualification before Production preflight or deploy; Production mutation = NO.
- Corrected controlled frontend expansion:
  - workflow `.github/workflows/trendos-entry625-jaber-frontend-canary-expand-controlled.yml`
  - correction commit `4431ce61ad40f1f76003b80b0c6ebf43695abacf`
  - Run `37449031453`
  - Job `112220780513`
  - conclusion = **SUCCESS**.
- Exact-live preflight before deploy:
  ```ini
  FRONTEND_VERSION=98ad8721-1983-4e86-bede-5fe01c889487
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  FRONTEND_CANARY_USERS=['ضياء','وائل']
  GLOBAL_NATIVE_AUTH=OFF
  ```
- New frontend version:
  `58e46dc8-a4df-4f0a-a626-6acbf9a35643`.
- Live config now:
  ```ini
  FRONTEND_CANARY_USERS=['ضياء','وائل','جابر']
  GLOBAL_NATIVE_AUTH=OFF
  FRONTEND_BRIDGE=ON
  FRONTEND_BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- Independent post-deploy Runtime proof before Jaber login:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- No API deploy, D1 auth-control mutation, Accounting mutation, or EasyStore mutation occurred.
- Remaining Entry625 gate:
  1. Jaber performs fresh Production login;
  2. verify Dashboard/basic Ops;
  3. perform legitimate attendance/start-day action;
  4. logout and second login;
  5. verify Runtime becomes `D1_AUTH_USERS=3`, `D1_NATIVE_READY_USERS=3`;
  6. do not add a fourth employee before Entry625 real-user smoke passes.


### Entry626 — Remaining known employees added to explicit Native Auth canary allowlist
- Owner approved continuing the remaining employee rollout without waiting for Jaber's real-user smoke; any employee-specific issue will be reported by name and handled in isolation.
- Known remaining employee names found in the current TrendOS config:
  - Rahma: `رحمه` / `رحمة`
  - Revan: `ريفان` / `ريڤان`
- Important matching behavior:
  - Native Auth canary selection uses trimmed/lowercased exact strings;
  - Arabic letter variants are not canonicalized;
  - both currently used Arabic spellings were therefore included for each employee.
- Manifest:
  `docs/trendos/staging/ENTRY626_REMAINING_EMPLOYEES_NATIVE_CANARY_17_POLICY_MANIFEST.json`
  commit `0e5e6050a509c6a6504de8234e0777ccc735d958`.
- Regression:
  `tests/entry626_remaining_employees_native_canary_17_policy.test.mjs`
  commit `ff7aede96e9b1de93a6340705377e373ad7bbe29`.
- Repo CI:
  `.github/workflows/trendos-entry626-remaining-employees-native-canary-repo-ci.yml`
  commit `ade95b52b5cb955dc860d84bb5fca219ddc9656d`
  Run `37450023983`
  Job `112224072121`
  conclusion = **SUCCESS**.
- Controlled frontend expansion:
  `.github/workflows/trendos-entry626-remaining-employees-frontend-canary-expand-controlled.yml`
  commit `92d65b1bbbfe205ac9b28755c38d8103e32f54d2`
  Run `37450263381`
  Job `112224841727`
  conclusion = **SUCCESS**.
- Exact-live frontend baseline:
  - previous frontend version `58e46dc8-a4df-4f0a-a626-6acbf9a35643`;
  - new frontend version `92a63e14-15df-421a-b9eb-d7b37546a485`.
- Live explicit canary allowlist:
  ```ini
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=true
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=['ضياء','وائل','جابر','رحمه','رحمة','ريفان','ريڤان']
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES=17
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=true
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Production auth count stayed unchanged during the deploy:
  ```ini
  PRE_USER_COUNT=2
  PRE_NATIVE_READY_COUNT=2
  POST_USER_COUNT=2
  POST_NATIVE_READY_COUNT=2
  ```
  Therefore the frontend expansion itself created no D1 users.
- Final independent Runtime proof:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  MUST_CHANGE_COUNT=0
  PLAINTEXT_STORED=false

  BRIDGE=ON
  BRIDGE_SECRET_CONFIGURED=YES
  BRIDGE_POLICY_COUNT=17
  RAW_NATIVE_TOKEN_FORWARDED=false
  PLAINTEXT_PASSWORD_FORWARDED=false

  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ACCOUNTING_AUTHORITATIVE_WRITES=false
  CONTENT=OFF
  COMMS=OFF
  CORE=OFF
  ACCOUNTING_PROGRAM=DEFERRED_EXTERNAL_REPO
  ```
- Boundaries:
  ```ini
  GLOBAL_NATIVE_AUTH=OFF
  API_DEPLOY=NO
  D1_CONTROL_MUTATION=NO
  ACCOUNTING_TOUCHED=NO
  EASYSTORE_TOUCHED=NO
  BRIDGE_POLICY_EXPANSION=NO
  ```
- Operational behavior from this point:
  - Jaber, Rahma, and Revan will bootstrap into D1 on their first successful login if not already native-ready;
  - subsequent logins for each bootstrapped employee should use D1 Native Auth;
  - an unknown employee name remains Legacy because Global Native Auth is still OFF;
  - report any employee-specific failure by employee name before changing policy/global mode.


### Entry627 — Known employee alias gap closed after Revan legacy-only login
- Owner reported Revan's Production login worked.
- Immediate Runtime verification showed:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- Interpretation:
  - Revan's login succeeded operationally;
  - however, no new Native Auth user was created at that moment;
  - therefore Revan had entered through the Legacy path, not Native bootstrap.
- Root cause:
  - frontend canary matching uses trimmed/lowercased exact strings;
  - Arabic letter variants and English aliases are not canonicalized;
  - the current config already uses known employee aliases such as `revan`, `rivan`, `rahma`, `wael`, `gaber`, `jaber`, and `diaa` elsewhere;
  - those English aliases were not yet present in the Native Auth canary allowlist.
- Entry627 explicit alias target:
  ```ini
  ['ضياء','diaa','وائل','wael','جابر','gaber','jaber','رحمه','رحمة','rahma','ريفان','ريڤان','revan','rivan']
  ```
- Global Native Auth remains OFF, so unknown names still remain Legacy.
- Manifest:
  `docs/trendos/staging/ENTRY627_EMPLOYEE_NATIVE_ALIAS_CANARY_MANIFEST.json`
  commit `56aaf93cf2f79e1cfc346d59b1e888eb3af4a48d`.
- Repo regression:
  `tests/entry627_employee_native_alias_canary.test.mjs`
  initial test commit `372a2dd6b6c815cb259d893acf17985e6c505216`.
- Initial CI Run `37452033669` failed safely before Production mutation because the test mock omitted the already-qualified 17 Bridge policies.
- Test correction:
  commit `2f09101c9baddcc915fbc9b4cabf3cbc105e8126`.
- Corrected Repo CI:
  Run `37452103261`
  Job `112230850480`
  conclusion = **SUCCESS**.
- Controlled frontend alias expansion:
  `.github/workflows/trendos-entry627-employee-native-alias-frontend-controlled.yml`
  commit `5a94d293375910f3bebfb04149ccf0a35da551c8`
  Run `37452253368`
  Job `112231331454`
  conclusion = **SUCCESS**.
- Previous frontend version:
  `92a63e14-15df-421a-b9eb-d7b37546a485`.
- New frontend version:
  `488be13f-321b-4dbf-9c60-1dada89bc469`.
- Post-deploy Runtime:
  ```ini
  AUTH=TRANSITIONAL / epoch23
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  BRIDGE=ON
  BRIDGE_POLICY_COUNT=17
  GLOBAL_NATIVE_AUTH=OFF
  API_DEPLOY=NO
  D1_CONTROL_MUTATION=NO
  ACCOUNTING_TOUCHED=NO
  EASYSTORE_TOUCHED=NO
  ```
- The unchanged 2/2 count immediately after deploy is expected; alias expansion alone does not create users.
- Revan's next fresh login with `revan` or `rivan` will now enter the Native bootstrap path. The expected Runtime after successful Revan bootstrap is `3/3`.


#### Entry627 — Revan second login still Legacy due stale frontend session surface
- Owner reported Revan logged in again but login was still slower than Diya/Wael.
- Runtime verification immediately after that login:
  ```ini
  D1_AUTH_USERS=2
  D1_NATIVE_READY_USERS=2
  AUTH=TRANSITIONAL / epoch23
  BRIDGE=ON / 17
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- Therefore Revan did **not** enter Native Auth on that login.
- The live Production config already contains the explicit Revan aliases:
  `ريفان`, `ريڤان`, `revan`, `rivan`.
- Most likely cause is a browser tab/session that loaded the previous config before Entry627 alias deployment. Native canary selection is evaluated by the dispatcher/config already loaded in that page; logout/login inside the same stale page does not guarantee the new allowlist is loaded.
- Required real-user retry:
  1. fully close the existing TrendOS tab;
  2. open a fresh Production TrendOS page or perform a hard refresh;
  3. login Revan again with the same current credentials;
  4. verify Runtime rises from `2/2` to `3/3`;
  5. only the login after bootstrap is expected to have the same fast Native behavior as Diya/Wael.
- No backend/API/D1-control/Accounting/EasyStore change is required for this retry.


#### Entry627 — Jaber Native PASS
- Jaber completed Production login successfully.
- Runtime after login: D1_AUTH_USERS=4, D1_NATIVE_READY_USERS=4.
- Bridge remains 17 policies; Ops GENERAL epoch7; Accounting READONLY epoch2; Global Native Auth remains OFF.


### Entry630 — Comms READONLY cutover PASS; business Bridge dependency = 0
- Entry630 completed the final business read family migration.
- Repo gate:
  - `.github/workflows/trendos-entry630-comms-readonly-repo-ci.yml`
  - Run `37476624460` = SUCCESS.
- Runtime arm:
  - `.github/workflows/trendos-entry630-comms-readonly-runtime-arm-controlled.yml`
  - Run `37476785742` = SUCCESS.
  - Comms moved from `OFF / epoch1` to `READONLY / epoch2`.
  - no business-data mutation, WhatsApp send, OpenAI call, R2 write, Accounting mutation, or EasyStore mutation.
- Backend read smoke:
  - workflow `.github/workflows/trendos-entry630-comms-readonly-backend-smoke.yml`
  - initial Run `37482871509` safely exposed that `getOrderConversation` requires an existing order;
  - corrected Run `37483062449` = SUCCESS;
  - `customerManagerV1:inbox`, `customerManagerV1:thread`, `getOrderConversation`, and `goLiveAutopilotV1:listDrafts` all PASS;
  - Business writes = NO.
- Controlled frontend cutover:
  - workflow `.github/workflows/trendos-entry630-comms-readonly-frontend-controlled.yml`
  - preflight-only failures `37483588074`, `37483800216`, `37484025206` made no Production mutation;
  - corrected Run `37484322594` = SUCCESS;
  - new Production frontend version `1d31014e-4e47-4414-933a-3e60a8e80ece`.
- Live frontend now:
  ```ini
  GLOBAL_NATIVE_AUTH=false
  CANARY_NATIVE_USERS=all five known employee identities/aliases
  CORE=READONLY
  CONTENT=READONLY
  COMMS=READONLY
  OPS=GENERAL
  ACCOUNTING=READONLY
  FRONTEND_BRIDGE_POLICY_COUNT=4
  ```
- The four frontend Bridge policy names remain in config only for the old canary preflight contract; the dispatcher now routes all four to D1 Comms before Bridge evaluation.
- Therefore:
  ```ini
  ENTRY630_BUSINESS_BRIDGE_ACTIONS=0
  BACKEND_BRIDGE_ENABLED=true
  BACKEND_BRIDGE_POLICY_COUNT=17
  ```
- The Backend Bridge remains only as a temporary auth-canary preflight dependency. Entry631 must remove that preflight dependency before the Bridge can be disabled safely.


### Entry631 — Frontend bridge-free Native canary PASS
- Goal: remove the compatibility Bridge from known-employee login preflight without enabling Global Native Auth.
- Repo gate:
  - manifest `docs/trendos/staging/ENTRY631_BRIDGE_FREE_CANARY_AUTH_PREFLIGHT_MANIFEST.json`;
  - regression `tests/entry631_bridge_free_canary_preflight.test.mjs`;
  - CI Run `37485518441` = SUCCESS.
- Dispatcher contract:
  - bridge-free mode requires all of:
    - frontend Bridge OFF;
    - frontend Bridge policies = 0;
    - minimum Bridge policies = 0;
    - required Native-ready count > 0;
  - Production target requires `nativeReadyCount >= 5`;
  - if ready count is 4/5, login fails closed;
  - bridge-free preflight fetches Auth health only and does not fetch Bridge health;
  - unknown employee names remain Legacy because Global Native Auth stays OFF.
- Controlled frontend cutover:
  - workflow `.github/workflows/trendos-entry631-bridge-free-canary-frontend-controlled.yml`;
  - Run `37485927274`;
  - Job `112345774950`;
  - conclusion = SUCCESS;
  - Production frontend version `8bcf0fe4-92db-4c2b-b32f-2dc418d0a03d`.
- Live frontend:
  ```ini
  GLOBAL_NATIVE_AUTH=false
  NATIVE_AUTH_CANARY=true
  CANARY_REQUIRED_NATIVE_READY_COUNT=5
  CANARY_MIN_BRIDGE_POLICIES=0
  FRONTEND_BRIDGE_ENABLED=false
  FRONTEND_BRIDGE_POLICY_COUNT=0
  OPS=GENERAL
  ACCOUNTING=READONLY
  CORE=READONLY
  CONTENT=READONLY
  COMMS=READONLY
  ```
- Real live dispatcher smoke with qualification credentials:
  ```ini
  ENTRY631_LIVE_DISPATCHER_LOGIN=PASS
  ENTRY631_LIVE_BRIDGE_HEALTH_CALLS=0
  ENTRY631_LIVE_BRIDGE_ACTION_CALLS=0
  ENTRY631_LIVE_LOGOUT=PASS
  ```
- Backend Bridge remains temporarily enabled with 17 policies only as rollback safety; it is not used by the live frontend.
- No API code deploy, D1 control mutation, Accounting mutation, or EasyStore mutation occurred.
- Entry632 may disable the Backend Bridge only after proving its enablement mechanism and preserving rollback safety.


### Entry632 — Backend compatibility Bridge disabled; PASS
- Entry631 had already removed the Bridge from the live frontend:
  - frontend Bridge OFF;
  - frontend Bridge policies = 0;
  - canary preflight = Auth-only;
  - five known employees Native-ready.
- A settings candidate created during the Entry632 investigation was activated automatically by Cloudflare when `PATCH /settings` succeeded. The following controlled workflow correctly stopped because its old precondition expected Bridge=ON.
- Runtime truth after the activation:
  ```ini
  AUTH=TRANSITIONAL
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  NATIVE_ONLY=false

  BACKEND_BRIDGE_ENABLED=false
  BACKEND_BRIDGE_POLICY_COUNT=17
  BRIDGE_SECRET_CONFIGURED=true

  CORE=READONLY / epoch1
  CONTENT=READONLY / epoch2
  COMMS=READONLY / epoch2
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  GLOBAL_NATIVE_AUTH=false
  ```
- Read-only post-activation proof:
  - workflow `.github/workflows/trendos-entry632-post-activation-proof.yml`;
  - commit `7c03d30417c18a8770eb91bfdeb7fd0ea6444c67`;
  - Run `37488533064`;
  - Job `112354849701`;
  - conclusion = **SUCCESS**.
- Cloudflare proof:
  ```ini
  ACTIVE_VERSION_CHANGED=YES
  BINDING_COUNT=33
  PLAIN_TEXT_BINDING_COUNT=27
  SECRET_BINDING_COUNT=5
  D1_BINDING_PRESENT=YES
  TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
  WORKER_CODE_ETAG_UNCHANGED=PASS
  WORKER_CODE_CHANGE=NO
  ```
- Disabled-route proof:
  ```ini
  ENTRY632_DISABLED_ROUTE_FAIL_CLOSED=PASS
  ENTRY632_UPSTREAM_FORWARD_FROM_DISABLED_PROOF=NO
  ```
- No new mutation was performed by the proof workflow.
- Entry632 result:
  ```ini
  FRONTEND_BRIDGE=OFF
  FRONTEND_BRIDGE_POLICY_COUNT=0
  BACKEND_BRIDGE=OFF
  BUSINESS_BRIDGE_ACTIONS=0
  WORKER_CODE_CHANGE=NO
  ```
- Remaining legacy dependency to assess next is employee Auth legacy bootstrap itself. Do not change Accounting/EasyStore as part of that assessment.


### Entry633 — Native username canonicalization PASS
- Before retiring legacy Auth bootstrap, D1 identity rows were audited read-only.
- D1 contains exactly five Native-ready identity groups:
  ```ini
  DIAA=ضياء
  WAEL=وائل
  JABER=جابر
  RAHMA=رحمه
  REVAN=ريفان
  ```
- Read-only identity audit:
  - `.github/workflows/trendos-entry633-auth-alias-readonly-audit.yml`
  - Run `37489148664` = SUCCESS.
- Exact D1 key classification:
  - `.github/workflows/trendos-entry633-auth-native-key-classification.yml`
  - Run `37489375899` = SUCCESS.
- Dispatcher canonicalization maps known aliases to those exact five keys before all Native employee routes.
- Repo CI:
  - `.github/workflows/trendos-entry633-native-username-canonicalization-ci.yml`
  - Run `37489882275` = SUCCESS.
- Controlled frontend deployment:
  - `.github/workflows/trendos-entry633-native-alias-frontend-controlled.yml`
  - Run `37490159993`;
  - Job `112360466601`;
  - conclusion = SUCCESS;
  - frontend version `9f1ea548-ff16-4360-a16e-fd225e5e112b`.
- Live proof used the known alias `diaa` with the qualification credential and verified:
  ```ini
  diaa -> ضياء
  AUTH_SOURCE=d1-native-employee-v1
  BRIDGE_CALLS=0
  LOGOUT=PASS
  ```
- No API deploy or Auth flag change occurred in Entry633.
- Entry634 target: disable `TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED` only, while keeping `NATIVE_ONLY=false` for a separate later gate.


### Entry634 — Legacy employee login bootstrap disabled; PASS
- Entry633 first canonicalized every known login alias to the exact D1 key.
- Repo qualification:
  - manifest `docs/trendos/staging/ENTRY634_DISABLE_LEGACY_AUTH_BOOTSTRAP_MANIFEST.json`;
  - regression `tests/entry634_disable_legacy_auth_bootstrap.test.mjs`;
  - CI Run `37490697061` = SUCCESS.
- Controlled Cloudflare settings workflow:
  - `.github/workflows/trendos-entry634-disable-legacy-bootstrap-controlled.yml`;
  - Run `37491028261`.
- The settings PATCH succeeded and auto-activated a settings-only version before the workflow later hit a shell syntax error.
- Evidence recorded before the syntax error:
  ```ini
  SETTINGS_PATCH_HTTP=200
  NON_TARGET_BINDINGS_UNCHANGED=PASS
  BOOTSTRAP_BINDING=false
  SECRET_BINDINGS_PRESERVED=PASS
  SETTINGS_PATCH_AUTO_ACTIVATED=YES
  WORKER_CODE_ETAG_UNCHANGED=PASS
  WORKER_CODE_CHANGE=NO
  ```
- Runtime truth after the run:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=false
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  BACKEND_BRIDGE=false
  CORE=READONLY
  CONTENT=READONLY
  COMMS=READONLY
  OPS=GENERAL
  ACCOUNTING=READONLY
  ```
- Post-activation proof:
  - `.github/workflows/trendos-entry634-post-activation-smoke.yml`;
  - Run `37491279083`;
  - Job `112364351717`;
  - conclusion = SUCCESS.
- Proof:
  ```ini
  MISSING_NATIVE_LOGIN=FAIL_CLOSED
  APPS_SCRIPT_BOOTSTRAP_UNREACHABLE=PASS
  LIVE_ALIAS_LOGIN_WITH_BOOTSTRAP_OFF=PASS
  LIVE_BRIDGE_CALLS=0
  LIVE_LOGOUT=PASS
  ```
- Business data mutation = NO; qualification Auth session was created and revoked only.
- Entry635 target: set Backend Native-only as defense-in-depth while keeping frontend Global Native Auth OFF.


### Entry635 — Backend Native-only hardening; PASS
- Entry635 first updated the live employee dispatcher so Bridge-free canary preflight accepts `nativeOnly=true` only when the frontend is already Bridge-free and the required Native-ready count is satisfied.
- Repo qualification:
  - manifest `docs/trendos/staging/ENTRY635_NATIVE_ONLY_BRIDGE_FREE_MANIFEST.json`;
  - regression `tests/entry635_native_only_bridge_free_preflight.test.mjs`;
  - CI Run `37491779456` = SUCCESS.
- Controlled frontend compatibility deployment:
  - `.github/workflows/trendos-entry635-native-only-preflight-frontend-controlled.yml`;
  - Run `37491967675`;
  - Job `112366733247`;
  - conclusion = SUCCESS;
  - frontend version `31e2c68d-6bb0-49bb-8535-7b8fecdb7458`.
- Frontend compatibility proof before the backend hardening:
  ```ini
  FRONTEND_COMPAT_NATIVE_LOGIN=PASS
  FRONTEND_COMPAT_BRIDGE_CALLS=0
  FRONTEND_COMPAT_LOGOUT=PASS
  BACKEND_NATIVE_ONLY=false
  BACKEND_BOOTSTRAP=false
  BACKEND_BRIDGE=false
  ```
- Controlled settings-only Backend hardening:
  - `.github/workflows/trendos-entry635-native-only-binding-controlled.yml`;
  - commit `3e487b0b22b5a77f122c05d974323fccb7a7b0f3`;
  - Run `37492693215`;
  - Job `112369217889`;
  - conclusion = SUCCESS.
- Cloudflare settings proof:
  ```ini
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=true
  TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
  TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
  NON_TARGET_BINDINGS_UNCHANGED=PASS
  SECRET_BINDINGS_PRESERVED=PASS
  WORKER_CODE_ETAG_UNCHANGED=PASS
  D1_CONTROL_MUTATION=NO
  ```
- Final live proof:
  - `.github/workflows/trendos-entry635-native-only-live-proof.yml`;
  - commit `783f0564a46c2fcdf796b3c9bb89c9fe8238b06d`;
  - Run `37493577765`;
  - Job `112372274162`;
  - conclusion = SUCCESS.
- Final runtime truth:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP_ENABLED=false
  LEGACY_SESSION_ENROLL_ENABLED=false
  NATIVE_ONLY=true
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  MUST_CHANGE=0

  FRONTEND_GLOBAL_NATIVE_AUTH=false
  FRONTEND_NATIVE_CANARY=true
  FRONTEND_BRIDGE=false
  BACKEND_BRIDGE=false

  CORE=READONLY / epoch1
  CONTENT=READONLY / epoch2
  COMMS=READONLY / epoch2
  OPS=GENERAL / epoch7
  ACCOUNTING=READONLY / epoch2
  ```
- Final live alias proof:
  ```ini
  diaa -> ضياء
  AUTH_SOURCE=d1-native-employee-v1
  BRIDGE_CALLS=0
  BRIDGE_HEALTH_CALLS=0
  APPS_SCRIPT_CALLS=0
  LOGOUT=PASS
  ```
- Business data mutation = NO; the qualification Auth session was revoked.
- Entry636 must be a read-only completeness audit before any global frontend Native Auth switch. Do not assume the five D1 identities are the entire active employee roster until runtime/authoritative evidence proves it.


### Entry636 — Global Native Auth completeness audit; BLOCKED on one active account
- Purpose: prove the authoritative active employee-login population is completely represented in D1 before any global frontend Native Auth switch.
- Authoritative Google source inspected read-only:
  - Spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
  - Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
  - login authority tab: `المستخدمين`
  - secondary HR tab: `HR - الموظفين`
- Sensitive columns were deliberately not read:
  - no password column;
  - no token column.
- Safe login-authority columns showed active rows for:
  ```text
  ضياء
  وائل
  رحمه
  ريفان
  شريف
  جابر
  wael
  Rahma
  ```
- Classification:
  - `wael` is covered by the existing canonical mapping to `وائل` and had qualification-note history.
  - `Rahma` is explicitly marked TEST ONLY and is covered by the canonical mapping to `رحمه`.
  - `شريف` is marked active (`مفعل؟ = نعم`), has a recorded last login on 2026-08-27, has no TEST ONLY note, and is not represented by the five Native-ready D1 identities.
- Current D1 Native keys remain exactly:
  ```text
  ضياء
  وائل
  جابر
  رحمه
  ريفان
  ```
- Therefore the unresolved active Native gap is:
  ```ini
  UNRESOLVED_ACTIVE_NATIVE_GAP=شريف
  ```
- Repo evidence:
  - manifest `docs/trendos/staging/ENTRY636_GLOBAL_NATIVE_COMPLETENESS_AUDIT.json`;
  - guard `tests/entry636_global_native_completeness_guard.test.mjs`;
  - CI `.github/workflows/trendos-entry636-global-native-completeness-guard.yml`;
  - initial guard Run `37494142551` failed only because the test incorrectly compared repo-default Canary state with Production live Canary state; no runtime mutation occurred.
  - corrected commit `e7f1b3d9753f635797275d5f06f931623fabff85`;
  - corrected guard Run `37494241269`, Job `112374539777` = SUCCESS;
  - browser transport regression Run `37494241574` = SUCCESS.
- Guard result:
  ```ini
  ENTRY636_GLOBAL_NATIVE_GUARD=PASS
  ENTRY636_UNRESOLVED_ACTIVE_NATIVE_GAP=شريف
  ENTRY636_GLOBAL_NATIVE_FRONTEND=OFF
  PRODUCTION_MUTATION=NO
  D1_MUTATION=NO
  GOOGLE_MUTATION=NO
  ```
- Runtime remains:
  ```ini
  BACKEND_NATIVE_ONLY=true
  LEGACY_BOOTSTRAP=false
  BACKEND_BRIDGE=false
  FRONTEND_GLOBAL_NATIVE_AUTH=false
  FRONTEND_NATIVE_CANARY=true
  D1_NATIVE_READY=5/5
  ```
- **Decision gate:** do not enable Global Native Auth until the owner confirms whether the active `شريف` login must remain usable.
  - If yes: migrate that account to D1 through a bounded, credential-safe enrollment/bootstrap procedure, then re-run completeness.
  - If no: deactivate/remove that authoritative login row through the Google-side owner workflow, then re-run completeness.
- Do not read or copy the password/token columns to resolve this gate.


### Entry637 — Sherif Native migration handoff checkpoint — IN PROGRESS
- Owner explicitly changed the Entry636 decision and requested: **migrate Sherif and continue**.
- Important: this Entry637 section is a **handoff checkpoint**, not a completion claim. At the moment of this record, the bounded Sherif migration workflow is still running.

#### Authoritative Sherif facts proven without sensitive credential reads
- Google login authority source remains:
  - Spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
  - Spreadsheet ID `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
  - sheet `المستخدمين`
- Safe columns only were read. Password and Token columns were not read.
- Sherif row:
  ```ini
  USERNAME=شريف
  DEPARTMENT=فنيل
  PERMISSION=تشغيل
  ACTIVE=true
  LAST_LOGIN=2026-08-27
  ```
- The old `role/department/permissions/active` compatibility columns for Sherif are empty, so no role/screen mapping was guessed from Google.

#### Safe D1 user-shape audit
- Workflow:
  `.github/workflows/trendos-entry637-native-user-shape-readonly.yml`
- Commit:
  `f57943a03c4547d8ef5c5948bac7234f2cd944ff`
- Run:
  `37496559329`
- Result: SUCCESS.
- The audit read only safe structural fields:
  `employee_id, username_key, canonical_username, active, role, department, screens_json, must_change, session_version`.
- No password hash and no session token were read.
- Existing five Native user shapes:
  ```text
  جابر  -> role=laser,   department=ليزر,        screens=["laser",""]
  رحمه  -> role=service, department=خدمة عملاء, screens=["service",""]
  ريفان -> role=print,   department=طباعة,       screens=["print","press",""]
  ضياء  -> role=admin,   department=الادارة,     screens=["service","print","laser","press",""]
  وائل  -> role=print,   department=طباعة,       screens=["print","press",""]
  ```

#### Sherif alias/canary frontend preparation
- Dispatcher aliases added:
  ```text
  شريف  -> شريف
  sherif -> شريف
  sheriff -> شريف
  sharif -> شريف
  ```
- Alias commit:
  `e95f4d59dd6b98b445b4cd468d22d5901f061931`
- Controlled frontend workflow:
  `.github/workflows/trendos-entry637-sherif-canary-frontend-controlled.yml`
- Workflow commit:
  `8858fa8365f67efea7985dd8d2e1cb82503e119b`
- Run:
  `37497341136`
- Job:
  `112385160615`
- Result: SUCCESS.
- New Production frontend version:
  `697f2afb-87c2-47cc-9889-3e986e7f0863`
- Post-deploy proof:
  ```ini
  SHERIF_CANARY_FRONTEND=PASS
  SHERIF_PRE_ENROLL_FAIL_CLOSED=PASS
  BACKEND_NATIVE_ONLY=true
  BACKEND_BOOTSTRAP=false
  BACKEND_BRIDGE=false
  D1_USER_COUNT=5
  PRODUCTION_BUSINESS_MUTATION=NO
  ```
- Live frontend now includes Sherif aliases in the Native canary list.
- Frontend Global Native Auth remains OFF.
- Frontend Bridge remains OFF with zero policies.

#### Bounded Sherif bootstrap window — CURRENTLY RUNNING AT HANDOFF
- Workflow:
  `.github/workflows/trendos-entry637-sherif-bounded-bootstrap-window.yml`
- Workflow commit:
  `7724a0f698c13199a5af72da5e07ab95787ddb08`
- Run:
  `37497698732`
- Job:
  `112386380610`
- At handoff:
  - workflow status = **in_progress**;
  - `Exact preflight` = SUCCESS;
  - step `Open bounded window, wait for Sherif, restore hardening` = IN PROGRESS;
  - D1 row verification step has not run yet.
- Window design:
  - maximum internal wait = 600 seconds;
  - runner timeout = 15 minutes;
  - temporary settings during the window:
    ```ini
    NATIVE_ONLY=false
    LEGACY_BOOTSTRAP=true
    LEGACY_SESSION_ENROLL=false
    BACKEND_BRIDGE=false
    ```
  - it polls Auth health every 10 seconds;
  - success condition = `userCount=6` AND `nativeReadyCount=6`;
  - on success it restores the exact pre-window version;
  - on timeout/failure it also attempts emergency restore of the exact pre-window version;
  - expected hardened restored state:
    ```ini
    NATIVE_ONLY=true
    LEGACY_BOOTSTRAP=false
    BACKEND_BRIDGE=false
    ```
- Runtime truth captured during this handoff while the window is open:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP=true
  LEGACY_SESSION_ENROLL=false
  NATIVE_ONLY=false
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  MUST_CHANGE=0
  PLAINTEXT_STORED=false
  BACKEND_BRIDGE=false
  ```
- Therefore **Sherif has not yet been proven migrated at this checkpoint**.
- Do NOT create another bootstrap window or another Sherif migration run while Run `37497698732` is active.
- The next chat must first inspect Run `37497698732` and Runtime truth:
  1. if run succeeds, require restored hardening and `6/6`, then inspect the Sherif D1 row proof and continue;
  2. if it fails or times out, first prove `NATIVE_ONLY=true`, `LEGACY_BOOTSTRAP=false`, Bridge OFF before any retry;
  3. never leave the temporary bootstrap window open;
  4. do not read Google password/token columns;
  5. do not manually insert a guessed Sherif role/screens row while the bounded bootstrap workflow is the active migration mechanism.

#### Current employee migration baseline at handoff
- Five previously migrated employees remain Native-ready:
  `ضياء, وائل, جابر, رحمه, ريفان`.
- Sherif is now selected by frontend canary but not yet proven Native-ready.
- Global frontend Native Auth is still OFF.
- Core/Content/Comms are READONLY, Ops GENERAL, Accounting READONLY.
- EasyStore/Accounting must remain outside this employee migration step.
- Runtime truth remains higher priority than this checkpoint if any status changes after this commit.


#### Entry637 — Bounded Sherif bootstrap attempt 1 failed safely; hardening restored
- Handoff Run `37497698732`, Job `112386380610` completed with conclusion **FAILURE** after the full bounded wait.
- Exact preflight remained PASS.
- The bounded window opened as designed:
  ```ini
  NATIVE_ONLY=false
  LEGACY_BOOTSTRAP=true
  LEGACY_SESSION_ENROLL=false
  BACKEND_BRIDGE=false
  ```
- All 60 ten-second polls stayed exactly:
  ```ini
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  ```
- Therefore no Sherif bootstrap was observed during the 600-second window; no sixth Native user was created.
- Workflow log recorded:
  ```ini
  ENTRY637_WINDOW_CLOSED=PASS
  ENTRY637_BOUNDED_MIGRATION_FAIL=Sherif did not login during bounded window
  ```
- The D1 Sherif-row verification step was skipped because migration did not occur.
- Immediate external Runtime verification was repeated after propagation and proved hardening is restored:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  NATIVE_ONLY=true
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  MUST_CHANGE=0
  PLAINTEXT_STORED=false
  BACKEND_BRIDGE=false
  ```
- The first external read taken immediately after job completion briefly still observed the window settings during deployment propagation; a fresh cache-busted read then confirmed the hardened state above. Runtime truth after propagation is authoritative.
- No password/token/hash/session secret was read or logged.
- No Accounting/EasyStore mutation occurred.
- Retry rule:
  - do not manually insert Sherif or guess role/screens;
  - do not open another window unless Sherif can perform a real login during that bounded window;
  - any retry must begin from the proven hardened state above and must again restore hardening on success/failure.
- Current Entry637 status:
  ```ini
  ENTRY637_ATTEMPT_1=FAIL_NO_SHERIF_LOGIN
  ENTRY637_HARDENING_RESTORED=PASS
  SHERIF_NATIVE_READY=NO
  D1_NATIVE_READY=5/5
  GLOBAL_NATIVE_AUTH=OFF
  ACCOUNTING=READONLY
  NEXT_ACTION=RETRY_SAME_BOUNDED_BOOTSTRAP_ONLY_WHEN_SHERIF_REAL_LOGIN_CAN_OCCUR
  ```


#### Entry637 — Runtime drift repaired; bounded Sherif bootstrap attempt 2 failed safely
- Resume after client/network interruption began from Runtime truth, not from the older checkpoint.
- Before Attempt 2, a live cache-busted Auth read unexpectedly showed:
  ```ini
  LEGACY_BOOTSTRAP=true
  NATIVE_ONLY=false
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  BACKEND_BRIDGE=false
  ```
  while GitHub showed no active or queued workflow run. This was treated as Runtime drift and repaired before any new Sherif window was started.
- Family boundaries were rechecked first and remained safe for this employee-auth step:
  ```ini
  CORE=READONLY
  CONTENT=READONLY
  COMMS=READONLY
  OPS=GENERAL
  ACCOUNTING=READONLY
  BACKEND_BRIDGE=false
  ```
- Existing hardening paths were reused; no parallel repair workflow was created.
- Entry634 repair:
  - Run `37491028261`, attempt 2;
  - preflight = PASS;
  - the existing workflow again ended FAILURE because of its known shell `unexpected end of file` after the Cloudflare settings mutation;
  - Runtime truth nevertheless proved the intended target was active:
    ```ini
    LEGACY_BOOTSTRAP=false
    NATIVE_ONLY=false
    D1_NATIVE_READY=5/5
    BACKEND_BRIDGE=false
    ```
- Entry635 repair:
  - Run `37492693215`, attempt 2;
  - Job `112426615715`;
  - conclusion = SUCCESS;
  - Runtime truth after propagation:
    ```ini
    LEGACY_BOOTSTRAP=false
    LEGACY_SESSION_ENROLL=false
    NATIVE_ONLY=true
    D1_AUTH_USERS=5
    D1_NATIVE_READY_USERS=5
    PLAINTEXT_STORED=false
    BACKEND_BRIDGE=false
    ```
- Only after that hardened baseline was re-proven, the existing Entry637 failed run was retried; no duplicate workflow/window was created.
- Entry637 Attempt 2:
  - Run `37497698732`, run_attempt = 2;
  - Job `112427001942`;
  - Exact preflight = SUCCESS;
  - bounded window opened at 2026-10-06 18:13:21Z;
  - all 60 ten-second polls remained exactly `USERS=5 READY=5`;
  - no `ENTRY637_SHERIF_BOOTSTRAP_OBSERVED=YES` was emitted;
  - window closed at 2026-10-06 18:23:50Z with `ENTRY637_WINDOW_CLOSED=PASS`;
  - final failure reason at 2026-10-06 18:23:59Z:
    ```text
    ENTRY637_BOUNDED_MIGRATION_FAIL Sherif did not login during bounded window
    ```
  - D1 Sherif row verification and Boundary steps were skipped because no migration occurred.
- Post-run live Runtime verification proves hardening restored again:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  NATIVE_ONLY=true
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  MUST_CHANGE=0
  PLAINTEXT_STORED=false
  BACKEND_BRIDGE=false
  ```
- No Sherif row was manually inserted; no role/screens were guessed; no Google password/token column, password hash, session token, or credential secret was read.
- No EasyStore mutation occurred. Accounting remained READONLY and was not modified by this employee migration step.
- Current truth:
  ```ini
  ENTRY637_ATTEMPT_1=FAIL_NO_SHERIF_LOGIN
  ENTRY637_ATTEMPT_2=FAIL_NO_SHERIF_LOGIN
  ENTRY637_HARDENING_RESTORED=PASS
  SHERIF_NATIVE_READY=NO
  D1_NATIVE_READY=5/5
  GLOBAL_NATIVE_AUTH=OFF
  BACKEND_BRIDGE=OFF
  ACCOUNTING=READONLY
  ```
- Next action remains credential-safe and event-dependent: do not open a third bounded bootstrap window until Sherif is actually available to perform a real login during that same window. A third blind retry would only repeat the already-proven 600-second failure mode.


#### Entry637 — Attempt 3 diagnosis; staged window proved valid but no successful Sherif login reached Backend
- Owner explicitly approved Attempt 3 while Sherif was reported ready.
- Initial hardened preflight before Attempt 3:
  ```ini
  NATIVE_ONLY=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  BACKEND_BRIDGE=false
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  PLAINTEXT_STORED=false
  ACTIVE_AUTH_RUNS=0
  ```
- Re-running the original Entry637 job as run_attempt 3:
  - Run `37497698732`, attempt 3;
  - Job `112434775593`;
  - `Exact preflight` = SUCCESS;
  - the bounded-window step failed before opening a window with:
    ```text
    ENTRY637_BOUNDED_MIGRATION_FAIL nativeOnly precondition
    ```
- Important diagnosis: public Runtime was hardened, but Cloudflare script `/settings` still represented a later, non-deployed staged window version where `NATIVE_ONLY=false`. This is a control-plane/latest-version drift, not a live-runtime hardening failure.
- A narrow controlled repair workflow was added:
  `.github/workflows/trendos-entry637-hardened-settings-baseline-repair.yml`
  - initial commit `728a650ae8e128c781ff7fcd592075d3cfaf54e2`;
  - follow-up commit `d577eab916646503db8eba1fbe004433f2800037`;
  - diagnostic commit `6be07a78cdf592c857a7d5a54f8fecfa62b94c8e`.
- The repair did not mutate Runtime because Cloudflare rejected `PATCH /settings` with error `10214`:
  ```text
  Script edit failed. You attempted to deploy the latest version with modified settings,
  but the latest version isn't currently deployed.
  ```
- Therefore the safe strategy changed from editing stale latest settings to reusing that exact staged version only after proving:
  - staged latest settings are exactly the intended Sherif window:
    ```ini
    NATIVE_ONLY=false
    LEGACY_BOOTSTRAP=true
    LEGACY_SESSION_ENROLL=false
    BACKEND_BRIDGE=false
    ```
  - binding count = 33;
  - secret binding count = 5;
  - D1 binding exists;
  - staged worker code ETag exactly matches the currently active hardened worker code ETag.
- Controlled staged-window workflow:
  `.github/workflows/trendos-entry637-sherif-bounded-staged-window.yml`
- Commit:
  `21759031dfd135f25f071ed765a163ff46973010`
- Run:
  `37512561162`
- Job:
  `112437181175`
- Preflight proof:
  ```ini
  ENTRY637_STAGED_WINDOW_PREFLIGHT=PASS
  ENTRY637_STAGED_CODE_ETAG_MATCH=PASS
  ENTRY637_STAGED_BRIDGE=false
  ```
- Live frontend was also re-read during the window and proved:
  - Global Native Auth remains OFF;
  - Native Canary remains ON;
  - Sherif aliases remain present:
    `شريف, sherif, sheriff, sharif`;
  - frontend Bridge remains OFF;
  - dispatcher canonicalizes Sherif aliases to `شريف`.
- The staged Sherif window opened successfully at 2026-10-06T18:36:15Z:
  ```ini
  ENTRY637_WINDOW_OPEN=PASS
  ENTRY637_WINDOW_NATIVE_ONLY=false
  ENTRY637_WINDOW_BOOTSTRAP=true
  ENTRY637_WINDOW_BRIDGE=false
  ENTRY637_WINDOW_MAX_SECONDS=600
  ```
- All 60 ten-second polls remained exactly:
  ```ini
  USERS=5
  READY=5
  ```
- No `ENTRY637_SHERIF_BOOTSTRAP_OBSERVED=YES` was emitted.
- The window closed at 2026-10-06T18:46:37Z:
  ```ini
  ENTRY637_WINDOW_CLOSED=PASS
  ```
- Final workflow reason:
  ```text
  ENTRY637_STAGED_MIGRATION_FAIL Sherif did not login during bounded window
  ```
- This means no **successful** Sherif login reached the Backend during the entire bounded window. It does not prove whether a browser-side attempt was made; if the user saw an error, capture that error rather than opening another blind window.
- D1 Sherif-row verification was skipped because the row was not created.
- Final cache-busted Runtime verification after closure:
  ```ini
  AUTH=TRANSITIONAL
  AUTH_ENABLED=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  NATIVE_ONLY=true
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  MUST_CHANGE=0
  PLAINTEXT_STORED=false
  BACKEND_BRIDGE=false
  ```
- No password, token, password hash, or session secret was read or logged.
- No guessed Sherif role/screens row was inserted.
- EasyStore was not touched. Accounting remained READONLY and was not modified by this employee-auth step.
- Current truth:
  ```ini
  ENTRY637_ATTEMPT_1=FAIL_NO_SHERIF_LOGIN
  ENTRY637_ATTEMPT_2=FAIL_NO_SHERIF_LOGIN
  ENTRY637_ATTEMPT_3=FAIL_NO_SUCCESSFUL_SHERIF_LOGIN
  ENTRY637_STAGED_WINDOW_MECHANISM=PROVEN_VALID
  ENTRY637_HARDENING_RESTORED=PASS
  SHERIF_NATIVE_READY=NO
  D1_NATIVE_READY=5/5
  GLOBAL_NATIVE_AUTH=OFF
  BACKEND_BRIDGE=OFF
  ACCOUNTING=READONLY
  ```
- Next action is not another blind bounded window. First obtain the exact browser/login result from Sherif (success screen or error text/screenshot). If the browser login failed, diagnose that failure while keeping Runtime hardened; only reopen a bounded window after the specific failure cause is resolved.


#### Entry637 — Post-login report verification; Sherif still not Native-ready
- Owner reported that Sherif had entered the platform after Attempt 3.
- Runtime was verified immediately after that report:
  ```ini
  NATIVE_ONLY=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  BACKEND_BRIDGE=false
  D1_AUTH_USERS=5
  D1_NATIVE_READY_USERS=5
  PLAINTEXT_STORED=false
  ```
- No Auth workflow/window was active at verification time.
- The existing safe Native-user-shape read-only workflow was re-run:
  - workflow `.github/workflows/trendos-entry637-native-user-shape-readonly.yml`;
  - Run `37496559329`, run_attempt = 2;
  - Job `112455040953`;
  - conclusion = SUCCESS.
- The read-only audit returned exactly five Native rows:
  ```text
  جابر
  رحمه
  ريفان
  ضياء
  وائل
  ```
- No row for `شريف` exists in D1.
- No password hash or session token was read.
- Therefore the reported platform entry was not a successful fresh Bootstrap migration event.
- Current truth:
  ```ini
  ENTRY637_POST_LOGIN_REPORT_NATIVE_ROW=ABSENT
  SHERIF_NATIVE_READY=NO
  D1_NATIVE_READY=5/5
  HARDENING_RESTORED=PASS
  BACKEND_BRIDGE=OFF
  GLOBAL_NATIVE_AUTH=OFF
  ```
- Next safe action: Sherif must fully log out / close the old authenticated tab first. Only after that should one new bounded window be opened, followed by a fresh login during that live window. Do not count an already-authenticated platform session as migration proof.


#### Entry637 — Attempt 4 fresh-login window failed safely
- بعد إثبات أن الدخول السابق لم ينشئ صفًا Native، تم اشتراط Logout كامل قبل المحاولة التالية.
- Run: `37512561162`, run_attempt = 2.
- Job: `112458240473`.
- Preflight: `ENTRY637_STAGED_WINDOW_PREFLIGHT=PASS`, `ENTRY637_STAGED_CODE_ETAG_MATCH=PASS`, `ENTRY637_WINDOW_OPEN=PASS`.
- النافذة فتحت عند 2026-10-06T19:24:41Z.
- كل الـ60 polls بقيت `USERS=5 READY=5`.
- `ENTRY637_WINDOW_CLOSED=PASS` عند 2026-10-06T19:35:10Z.
- النهاية: `Sherif did not login during bounded window`.
- رسالة `الحساب لم يكتمل نقله إلى تسجيل الدخول السحابي.` تم تتبعها إلى fail-closed Native login branch في `cloudflare-d1/src/employee-auth-native-v1.mjs`: تظهر لمستخدم غير migrated عندما Bootstrap غير متاح / Native-only مفعّل، وبالتالي المحاولة وصلت بعد إغلاق النافذة وليست دليل password rejection.
- Runtime رجع للحالة المقفولة بعد الإغلاق.
- `ENTRY637_ATTEMPT_4=FAIL_NO_SHERIF_LOGIN`
- `HARDENING_RESTORED=PASS`
- `SHERIF_NATIVE_READY=NO`
- `D1_NATIVE_READY=5/5`


#### Entry637 — Attempt 5 PASS; Sherif completed Native migration
- Run: `37512561162`, run_attempt = 3.
- Job: `112464374923`.
- Workflow conclusion: `SUCCESS`.
- Window opened: 2026-10-06T19:38:48Z.
- Polls 1–5: `USERS=5 READY=5`.
- Poll 6: `USERS=6 READY=6`.
- `ENTRY637_SHERIF_BOOTSTRAP_OBSERVED=YES`
- `ENTRY637_WINDOW_CLOSED=PASS`
- `ENTRY637_HARDENING_RESTORED=PASS`
- `ENTRY637_NATIVE_READY=6_OF_6`
- `ENTRY637_BOUNDED_MIGRATION=PASS`
- `ENTRY637_SHERIF_D1_ROW=PASS`
- Safe row shape: `USERNAME_KEY=شريف`, `ROLE=service`, `DEPARTMENT=فنيل`, `SCREENS=["service",""]`.
- `ENTRY637_SHERIF_PASSWORD_HASH_LOGGED=NO`.
- Final Runtime: `NATIVE_ONLY=true`, `LEGACY_BOOTSTRAP=false`, `LEGACY_SESSION_ENROLL=false`, `D1_AUTH_USERS=6`, `D1_NATIVE_READY_USERS=6`, `PLAINTEXT_STORED=false`, `BACKEND_BRIDGE=false`.
- No manual D1 user insertion was used.
- No password, raw token, password hash, or session secret was recorded.
- Accounting remained READONLY; EasyStore was not mutated by this Auth migration.
- `ENTRY637_FINAL=PASS_6_OF_6`
- `SHERIF_NATIVE_READY=YES`
- `GLOBAL_NATIVE_AUTH=OFF`
- Detailed evidence: `docs/trendos/staging/ENTRY637_FINAL_SUCCESS_20261006.md`.


#### Entry638 — Post-Entry637 Native readiness / completeness gate
- Re-audit performed after Entry637 success; Entry636 remains historical evidence of the previous gap.
- Public Runtime: `D1_AUTH_USERS=6`, `D1_NATIVE_READY_USERS=6`, `NATIVE_ONLY=true`, `LEGACY_BOOTSTRAP=false`, `LEGACY_SESSION_ENROLL=false`, `BACKEND_BRIDGE=false`, `PLAINTEXT_STORED=false`.
- Safe source-side completeness re-audit was performed without exporting password/Token values into repository documentation.
- Completeness gate result: no unresolved canonical active Native gap remains after the sixth identity migration.
- Frontend remains staged: `FRONTEND_GLOBAL_NATIVE_AUTH=false`, `FRONTEND_NATIVE_CANARY=true`, `FRONTEND_BRIDGE=false`.
- Pre-cutover drift: deployed frontend canary is ON; branch `config.js` currently shows canary OFF / empty canary list; deployed readiness threshold remains 5 while Runtime proves 6 Native-ready users.
- Runtime/deployed truth is authoritative. Reconcile this drift only inside the separate controlled Global Native frontend cutover gate.
- `ENTRY638_RUNTIME_READINESS_6_OF_6=PASS`
- `ENTRY638_COMPLETENESS_GATE=PASS`
- `UNRESOLVED_ACTIVE_NATIVE_GAP=NONE`
- `GLOBAL_NATIVE_FRONTEND_PREP=PASS`
- `GLOBAL_NATIVE_FRONTEND_CUTOVER=NOT_YET_EXECUTED`
- `ACCOUNTING=READONLY`
- `EASYSTORE_MUTATION=NO`
- Public Runtime evidence: `docs/trendos/staging/ENTRY638_RUNTIME_NATIVE_READINESS_20261006.md`.


#### Entry638 — Documentation closure and recording integrity
- Entry637 final public evidence commit: `e0feeeb4a59bb8d35920be875212d2ffbea1725c`.
- Entry638 public Runtime readiness evidence commit: `612b9ef911d407faa504c3e291f600291734120a`.
- First Master Book recorder workflow creation commit: `a249164a247fd9235fba0a7472469b705e38d910`.
- First recorder Run `37521916964` failed before creating a job because generated YAML block indentation was invalid. No Runtime/Production/D1 mutation occurred from that failed documentation run.
- Recorder YAML fix commit: `a2d73a462203df12777753b0febf133eb91a9bfe`.
- Corrected recorder Run `37522117630` = SUCCESS; all job steps passed.
- Master Book content commit produced by the successful recorder: `e9b2a74b15a8960ecc09f289695899088b3a142c`.
- First finalize workflow creation commit: `464fc0affa4da3d8db0a1f6b77fa91ce802f6423`.
- First finalize Run `37522271690` failed before creating a job for the same YAML block-indentation class; no Runtime/Production/D1 mutation occurred.
- This corrected finalize execution Run: `37522385167`.
- Corrected finalize workflow source SHA: `a48a6b420bfe4abba98513a70023aae1b6b5897d`.
- Verification before this finalizer confirmed the book already contained:
  - strict mandatory recording rule;
  - Attempt 4 failure record;
  - `ENTRY637_FINAL=PASS_6_OF_6`;
  - `ENTRY638_RUNTIME_READINESS_6_OF_6=PASS`;
  - `ENTRY638_COMPLETENESS_GATE=PASS`.
- Recording policy explicitly requires logging every success, failure, Runtime drift, rollback/restore, hardening repair, workflow/run/job, deploy, diagnosis, and gate transition.
- Secrets, passwords, Tokens, password hashes, and session secrets remain prohibited from documentation.
- `ENTRY638_DOCUMENTATION_CLOSURE=PASS`


#### Entry639 — Global Native frontend cutover PASS
- Scope: Employee frontend Auth cutover only. No D1 business mutation, no Accounting mutation, no EasyStore mutation.
- Evidence file: `docs/trendos/staging/ENTRY639_GLOBAL_NATIVE_FRONTEND_CUTOVER_20261007.md`.
- Evidence commit: `79d66bb079359360549d3679977cc17b093699b2`.

##### Attempt 1 — stopped safely before Deploy
- Workflow source commit: `5164ec36e34c9b9bde6780350dae6e8fea6e5718`.
- Run: `37542306567`.
- Job: `112537960050`.
- Failure occurred in `Exact Runtime and repository preflight`; all deploy/reconcile steps were skipped.
- Production frontend mutation from Attempt 1: NO.
- Cause: the guard pinned historical Accounting `policyEpoch=2`, while Runtime truth had advanced to:
  - `mode=READONLY`
  - `policyEpoch=8`
  - `authoritativeWrites=false`
  - `writeAuthorityMode=OFF`
  - `googleBusinessCalls=0`
  - `appsScriptBusinessAuthority=false`
- This was treated as legitimate Runtime drift. Accounting was not changed or rolled back.
- Guard-fix commit: `8e356f7c7661ee36d625c08516b2fb5aa9d8dae3`.
- Corrected rule validates READONLY safety invariants instead of pinning an obsolete epoch.

##### Attempt 2 — PASS
- Run: `37542439809`.
- Job: `112538399521`.
- Workflow conclusion: `SUCCESS`.
- Preflight:
  - `ENTRY639_RUNTIME_PREFLIGHT=PASS`
  - `ENTRY639_NATIVE_READY=6_OF_6`
  - `ENTRY639_BACKEND_NATIVE_ONLY=true`
  - `ENTRY639_BACKEND_BOOTSTRAP=false`
  - `ENTRY639_BACKEND_BRIDGE=false`
  - `ENTRY639_REPO_DRIFT_BASELINE=PASS`
  - `ENTRY639_EXACT_LIVE_BASELINE=PASS`
- Frontend version transition:
  - previous: `697f2afb-87c2-47cc-9889-3e986e7f0863`
  - current: `ecba8460-e9c1-4fc7-81a2-1cf5c054943a`
  - propagation proof: attempt 4.
- Global frontend Auth state:
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true`
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=false`
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=[]`
  - `MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT=6`
  - `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false`
  - `MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=[]`
- Family routing preserved from deployed Runtime truth:
  - `OPS=GENERAL`
  - `CORE=READONLY`
  - `CONTENT=READONLY`
  - `COMMS=READONLY`
  - `ACCOUNTING=READONLY / policyEpoch=8`
- Live production smoke:
  - `ENTRY639_GLOBAL_NATIVE_LOGIN=PASS`
  - `ENTRY639_LEGACY_BRIDGE_CALLS=0`
  - `ENTRY639_GLOBAL_NATIVE_LOGOUT=PASS`
  - `ENTRY639_RUNTIME_POSTFLIGHT=PASS`
  - `ENTRY639_GLOBAL_NATIVE_FRONTEND=PASS`
- Automatic rollback was armed to the previous frontend version and was not invoked because all production checks passed.
- Repo/deployed config drift was reconciled after successful production proof.
- Repo config reconciliation commit: `302386136af2a694f7c8447eb741419308a52a82`.
- `ENTRY639_REPO_CONFIG_RECONCILED=PASS`.

##### Stable final truth
```ini
ENTRY639=PASS
ENTRY639_GLOBAL_NATIVE_FRONTEND_CUTOVER=PASS
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
FRONTEND_BRIDGE=false
FRONTEND_REQUIRED_NATIVE_READY=6
BACKEND_NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
D1_AUTH_USERS=6
D1_NATIVE_READY_USERS=6
MUST_CHANGE=0
PLAINTEXT_STORED=false
OPS=GENERAL
CORE=READONLY
CONTENT=READONLY
COMMS=READONLY
ACCOUNTING=READONLY / policyEpoch8
ACCOUNTING_AUTHORITATIVE_WRITES=false
ACCOUNTING_GOOGLE_BUSINESS_CALLS=0
EASYSTORE_MUTATION=NO
```
- Entry638's earlier `GLOBAL_NATIVE_FRONTEND_CUTOVER=NOT_YET_EXECUTED` remains historical truth for that point in time and must not be rewritten.
- This Master Book recorder Run: `37542737379`.
- Recorder workflow source SHA: `355f40991c2cbe0c389032eba2fa52a25db8cb1a`.
- `ENTRY639_DOCUMENTATION=PASS`


#### Entry640 — Employee Auth control TRANSITIONAL → NATIVE; PASS
- بعد نجاح Entry639 Global Native frontend، تم فحص migration/schema والكود قبل أي mutation.
- migration `cloudflare-d1/migrations/0009_employee_auth_native_v1.sql` يثبت أن control mode يدعم صراحةً `OFF | TRANSITIONAL | NATIVE`.
- الكود `cloudflare-d1/src/employee-auth-native-v1.mjs` يثبت:
  - Native-ready login يعمل عندما control mode ليس OFF؛
  - legacy-session enrollment يتطلب `mode=TRANSITIONAL`;
  - first-login bootstrap يتطلب `mode=TRANSITIONAL` وBootstrap enabled؛
  - لذلك الانتقال إلى `NATIVE` هو إغلاق defense-in-depth للمسارات الانتقالية وليس تغييرًا في بيانات المستخدمين.
- Workflow: `.github/workflows/trendos-entry640-auth-control-native-controlled.yml`.
- Workflow source commit: `748f20c9db3bdfe6e92adbad2cb8e0a0f3d46211`.
- Run: `37543328267`.
- Job: `112541292439`.
- Conclusion: `SUCCESS`.

##### Preflight
- `ENTRY640_RUNTIME_PREFLIGHT=PASS`.
- `ENTRY640_AUTH_PRE_MODE=TRANSITIONAL`.
- `ENTRY640_NATIVE_READY=6_OF_6`.
- `ENTRY640_FRONTEND_GLOBAL_NATIVE_PREFLIGHT=PASS`.
- Backend pre-state remained hardened:
  - `LEGACY_BOOTSTRAP=false`
  - `LEGACY_SESSION_ENROLL=false`
  - `NATIVE_ONLY=true`
  - `BACKEND_BRIDGE=false`
  - `D1_AUTH_USERS=6`
  - `D1_NATIVE_READY_USERS=6`
  - `MUST_CHANGE=0`
  - `PLAINTEXT_STORED=false`
- Frontend remained:
  - `FRONTEND_GLOBAL_NATIVE_AUTH=true`
  - `FRONTEND_NATIVE_CANARY=false`
  - `FRONTEND_BRIDGE=false`
  - required ready count = 6.

##### Exact D1 control transition
- D1 pre-state was read without exposing password hash values:
  - `mode=TRANSITIONAL`
  - `policyEpoch=23`
  - `Native-ready=6/6`
  - `PASSWORD_HASH_VALUE_LOGGED=NO`.
- Target epoch was derived dynamically: `24`.
- Conditional single-row control mutation:
  - `TRANSITIONAL epoch23 → NATIVE epoch24`.
- Proof:
  - `ENTRY640_D1_CONTROL_MUTATION=PASS`
  - `ENTRY640_AUTH_CONTROL=NATIVE`
  - `ENTRY640_AUTH_POLICY_EPOCH=24`.

##### Transitional-path closure and Native login proof
- Public Runtime propagated to `mode=NATIVE` on propagation attempt 1.
- `ENTRY640_LEGACY_SESSION_ENROLL_CONTROL_CLOSED=PASS`.
- `ENTRY640_UNKNOWN_USER_BOOTSTRAP_CLOSED=PASS`.
- Real login/logout smoke used the existing qualification credential stored in GitHub Secrets; no password/token value was logged:
  - `ENTRY640_NATIVE_LOGIN=PASS`
  - auth source = `d1-native-employee-v1`
  - `ENTRY640_LEGACY_BRIDGE_CALLS=0`
  - `ENTRY640_NATIVE_LOGOUT=PASS`.
- Final D1 proof:
  - `ENTRY640_FINAL_D1_CONTROL=NATIVE`
  - `ENTRY640_FINAL_AUTH_POLICY_EPOCH=24`
  - `ENTRY640_FINAL_NATIVE_READY=6_OF_6`
  - `ENTRY640_PASSWORD_HASH_VALUE_LOGGED=NO`.
- Final Runtime proof:
  - `ENTRY640_RUNTIME_FINAL=PASS`
  - `ENTRY640_AUTH_MODE=NATIVE`.

##### Rollback and boundaries
- Exact rollback was armed for any post-mutation failure:
  - `NATIVE epoch24 → TRANSITIONAL epoch23`.
- Rollback step was `SKIPPED` because every post-mutation test passed.
- No API code deploy.
- No frontend deploy.
- No Apps Script touch.
- No Accounting mutation.
- No EasyStore mutation.
- No business-data mutation.
- Family Runtime after closure:
  - `CORE=READONLY / epoch1`
  - `CONTENT=READONLY / epoch2`
  - `COMMS=READONLY / epoch2`
  - `OPS=GENERAL / epoch7`
  - `ACCOUNTING=READONLY / epoch8`
  - Accounting `authoritativeWrites=false`, `writeAuthorityMode=OFF`, `googleBusinessCalls=0`, `appsScriptBusinessAuthority=false`.

##### Stable final truth
```ini
ENTRY640=PASS
ENTRY640_AUTH_CONTROL_NATIVE=PASS
AUTH_MODE=NATIVE
AUTH_POLICY_EPOCH=24
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
FRONTEND_REQUIRED_NATIVE_READY=6
FRONTEND_BRIDGE=false
BACKEND_NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
D1_AUTH_USERS=6
D1_NATIVE_READY_USERS=6
MUST_CHANGE=0
PLAINTEXT_STORED=false
ACCOUNTING=READONLY / policyEpoch8
EASYSTORE_MUTATION=NO
```
- Evidence file: `docs/trendos/staging/ENTRY640_AUTH_CONTROL_NATIVE_20261007.md`.
- Evidence commit: `5d2c84089c96e9fb5ef6494abf5a3c2d4338bfa3`.
- This Master Book recorder Run: `37543529947`.
- Recorder workflow source SHA: `dfcde40bd66a65c2a2d67cf31c9b34685a51c7f5`.
- `ENTRY640_DOCUMENTATION=PASS`.


#### Entry641 — Legacy Auth retirement read-only audit; Cloudflare hardening drift found
- Scope: read-only audit only. No Cloudflare/D1/Apps Script/frontend/Accounting/EasyStore/business mutation.
- Attempt 1:
  - source commit `7c459c47e4f53ed343c1b95ca2678c8cf9509eb2`
  - Run `37543761337`, Job `112542724821`
  - FAILURE in first read-only Runtime proof.
  - السبب: الـaudit توقع hardening الذي تم إثباته بعد Entry640، لكن Runtime كشف drift: `mode=NATIVE`, `6/6`, `legacyBootstrapEnabled=true`, `nativeOnly=false`.
  - Mutation from Attempt 1: NO.
- Attempt 2:
  - diagnostic source commit `6c2da88c152f98c17a55ae88c652376cb016c8fb`
  - Run `37544005767`, Job `112543538509`
  - Conclusion `SUCCESS`.
- D1/Runtime authority remained:
  - `AUTH_MODE=NATIVE`
  - `NATIVE_READY=6/6`
  - bootstrap remains closed by the NATIVE control mode itself.
- Cloudflare env residue/drift:
  - auth env enabled = YES
  - bootstrap env enabled = YES
  - session enroll env enabled = NO
  - nativeOnly env = NO
  - backend bridge enabled = NO
  - bridge upstream configured = YES
  - bridge secret configured = YES
  - bridge policy count = 17
  - secret value exposed = NO.
- Cloudflare deployment history:
  - current active at 2026-10-06T22:56:20.972111Z = `b1eb1e51-d713-4e30-8da5-a127fd53284b`
  - previous hardened deployment at 2026-10-06T19:39:41.106173Z = `24202d32-cd6f-41bb-9ce3-0565877ef8be`
  - bounded-window deployment at 2026-10-06T19:38:41.535377Z = `59f7c6b3-64f3-4dac-a51f-7d730cb90bbb`.
- Current latest settings:
  - `NATIVE_ONLY=false`
  - `LEGACY_BOOTSTRAP=true`
  - `LEGACY_SESSION_ENROLL=false`
  - `LEGACY_BRIDGE_ENABLED=false`
  - bridge actions still configured
  - bridge secret binding still present.
- No GitHub employee-auth deploy workflow was observed between Entry640 success and the new 22:56:20Z API deployment. Source is recorded as `UNATTRIBUTED`; do not guess attribution.
- Apps Script Version159 bridge read-only probe:
  - invalid assertion probe HTTP 200;
  - rejection happened after bridge-enabled and secret-configured checks;
  - `APPS_SCRIPT_BRIDGE_ENABLED=YES`
  - `APPS_SCRIPT_BRIDGE_SECRET_CONFIGURED=YES`
  - secret value exposed = NO.
- Repo residue:
  - default Cloudflare bridge flag OFF;
  - bridge source code still present;
  - Apps Script bridge route/code still present.
- Decision:
```ini
ENTRY641=READONLY_AUDIT_PASS
ENTRY641_RUNTIME_DRIFT=CF_AUTH_ENV_HARDENING_REGRESSED
ENTRY641_D1_AUTH_CONTROL=NATIVE
ENTRY641_NATIVE_READY=6_OF_6
ENTRY641_NEXT_GATE=DEPLOY_RESILIENT_CF_AUTH_HARDENING
ENTRY641_AFTER_CF_GATE=DISABLE_APPS_SCRIPT_BRIDGE_PROPERTY
```
- Evidence: `docs/trendos/staging/ENTRY641_LEGACY_AUTH_RETIREMENT_READONLY_20261007.md`.
- Evidence commit: `6ef6ac204209ef1927a93fa501364ad9d3c97af5`.
- This recorder Run: `37544239094`.
- Recorder source SHA: `bc161757c8102b86c2d3a659ec80a2612fd7275c`.
- `ENTRY641_DOCUMENTATION=PASS`.


#### Entry642 — Deploy-resilient employee Auth hardening; PASS
- الهدف: إصلاح Cloudflare Auth env drift المكتشف في Entry641 وجعل repo defaults نفسها hardened لأي deploy مستقبلي.
- لا D1 mutation، لا Apps Script mutation، لا frontend deploy، لا Accounting mutation، لا EasyStore mutation، ولا business-data mutation.
- Evidence: `docs/trendos/staging/ENTRY642_DEPLOY_RESILIENT_AUTH_HARDENING_20261007.md`.
- Evidence commit: `6fbd1cf4b0f4e05fb6ea90f66995a3ed21a84195`.

##### Entry641 follow-up rerun before Entry642
- تم rerun لنفس Entry641 read-only job بدون أي Push جديد:
  - Run `37544005767`, run_attempt = 2
  - Job `112544607661`
  - Conclusion `SUCCESS`.
- النتيجة: لم يظهر أي API deployment جديد؛ active version ظل `b1eb1e51-d713-4e30-8da5-a127fd53284b` بنفس timestamp `2026-10-06T22:56:20.972111Z`.
- بالتالي commits العادية التي حدثت أثناء نافذة المراقبة لم تثبت أنها تسبب API auto-deploy.

##### Attempt 1 — failure before mutation
- Workflow source: `d1aec76dec9fd9098ed9dd51dbe0cc1b86c9d2ed`.
- Run `37544706079`, Job `112545806855`, conclusion `FAILURE`.
- Preflight PASS:
  - Auth authority `NATIVE`, Native-ready `6/6`
  - pre env: `BOOTSTRAP=true`, `NATIVE_ONLY=false`, session enroll false
  - Bridge OFF, policies 17, secret configured
  - frontend Global Native PASS
  - repo drift precondition PASS.
- Cloudflare pre active version: `b1eb1e51-d713-4e30-8da5-a127fd53284b`.
- binding count = 33.
- failure code: Cloudflare `10057`; Settings API `inherit.version_id` accepts only literal `latest`, not a version UUID.
- PATCH did not occur; rollback reported `ENTRY642_ROLLBACK_NOT_NEEDED=PRE_PATCH_FAILURE`.
- Production mutation from Attempt 1: NO.

##### Attempt 2 — PASS
- Fix commit: `af82f152377ec56f052eca6a08541e4519616e69`.
- Run `37544785002`, Job `112546068390`, conclusion `SUCCESS`.
- Workflow first proved `latest == active`, then safely used literal `latest` inheritance.
- Cloudflare:
  - pre version: `b1eb1e51-d713-4e30-8da5-a127fd53284b`
  - `ENTRY642_CF_SETTINGS_PATCH=PASS`
  - new version: `e4322cbd-ac74-4f7c-b1ff-5833ea524e5a`
  - `ENTRY642_CF_EXPLICIT_DEPLOY=NO` (Cloudflare activated settings version automatically)
  - `ENTRY642_CF_CODE_ETAG_UNCHANGED=PASS`.
- Production target:
  - Auth enabled = true
  - Bootstrap = false
  - Native-only = true
  - Legacy-session-enroll = false
  - Backend Bridge = false
  - Bridge actions/policies = empty/0.
- Bridge secret binding intentionally retained for rollback safety; secret value was never read or logged.
- Production proof:
  - propagation attempt = 2
  - family postflight PASS
  - `ENTRY642_NATIVE_LOGIN=PASS`
  - `ENTRY642_LEGACY_BRIDGE_CALLS=0`
  - `ENTRY642_NATIVE_LOGOUT=PASS`
  - `ENTRY642_UNKNOWN_USER_FAIL_CLOSED=PASS`
  - `ENTRY642_PRODUCTION_HARDENING=PASS`
  - `ENTRY642_CF_BRIDGE_POLICY_COUNT=0`.
- Exact pre-version rollback was armed but not invoked because all production checks passed.

##### Repo deploy-resilience
- Only `cloudflare-d1/wrangler.toml` was reconciled after production proof.
- Commit: `db0e850ff096c12b3f663c3df20edc7e0b506999`.
- `ENTRY642_WRANGLER_RECONCILED=PASS`.
- Repo defaults now:
  - `TRENDOS_EMPLOYEE_AUTH_V1_ENABLED="true"`
  - `TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED="false"`
  - `TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1="true"`
  - `TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED="false"`
  - `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED="false"`
  - `EMPLOYEE_LEGACY_BRIDGE_ACTIONS=""`.

##### Final stable truth
```ini
ENTRY642=PASS
ENTRY642_DEPLOY_RESILIENT_AUTH_HARDENING=PASS
AUTH_MODE=NATIVE
D1_AUTH_USERS=6
D1_NATIVE_READY_USERS=6
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
NATIVE_ONLY=true
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0
BACKEND_BRIDGE_SECRET_RETAINED=true
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
FRONTEND_BRIDGE=false
WRANGLER_AUTH_DEFAULTS=HARDENED
APPS_SCRIPT_BRIDGE=STILL_ENABLED_FROM_ENTRY641_AUDIT
```
- Accounting كان read-only observation فقط؛ في final stability read وصل مستقلًا إلى `READONLY / epoch10` مع `authoritativeWrites=false`, `writeAuthorityMode=OFF`, `googleBusinessCalls=0`, `appsScriptBusinessAuthority=false`. Entry642 لم يعدله.
- Next gate: disable Apps Script bridge enabled property while retaining secret/deployment for rollback.
- This recorder Run: `37545009058`.
- Recorder source SHA: `f785b22f204103eaa29fc7bd9e670a6565e4589c`.
- `ENTRY642_DOCUMENTATION=PASS`.


#### Entry643 — إغلاق جسر اعتماد الموظفين في Apps Script؛ Attempt 1 BLOCKED / FAIL before mutation
- الاسم العربي للبحث: **إغلاق جسر دخول الموظفين القديم / تعطيل Apps Script Employee Auth Bridge / Entry643**.
- وقت الأدلة: 2026-10-06T23:20–23:23Z (2026-10-07 بتوقيت القاهرة).
- النطاق المصرح: تعديل خاصية `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED` فقط من true إلى false إذا كانت true؛ الاحتفاظ بالـsecret والـdeployment للـrollback. لا تعديل كود أو deployment أو بيانات.
- البداية: بعد Entry642 PASS؛ لم تُعد أي خطوة migration أو hardening.
- Repo preflight HEAD: `26a10953eac5a3683430166065c831b8b672f45a`.
- آخر Auth Actions التي تمت قراءتها من GitHub:
  - Entry642 hardening Run `37544785002` = completed / success، source `af82f152377ec56f052eca6a08541e4519616e69`.
  - Entry642 recorder Run `37545009058` = completed / success، source `f785b22f204103eaa29fc7bd9e670a6565e4589c`.
  - Latest branch Run `37545387310` = completed / success (Autonomous Printshop CI؛ قراءة metadata فقط، ليس دليل Employee Auth runtime).
- قراءة الكتاب الحالي أكدت أن الخطوة التالية هي إغلاق خاصية Apps Script وأن Entry642 هي آخر Auth PASS.

##### Current runtime preflight — unavailable, not drift proof
- GET read-only إلى Production `/v1/employee/auth/health` = HTTP 403.
- GET read-only إلى `/v1/employee/legacy-action/health` = HTTP 403.
- GET read-only إلى `/v1/employee/accounting/health` = HTTP 403؛ لا Accounting mutation.
- GET frontend `config.js` = HTTP 403.
- هذه أخطاء وصول من بيئة التنفيذ، وليست دليلًا أن قيم Runtime تغيرت؛ current AUTH_MODE / D1_NATIVE_READY / BACKEND_BRIDGE / FRONTEND_GLOBAL_NATIVE_AUTH = UNVERIFIED في هذه المحاولة.
- Entry642 historical last verified baseline يبقى NATIVE / 6/6 / backend bridge false / frontend global native true؛ لا يُرفع إلى current runtime truth بدون قراءة مستقلة ناجحة.

##### Apps Script access attempt
- فتح Project URL المحدد `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo` حوّل المتصفح إلى صفحة Apps Script العامة `https://developers.google.com/apps-script/`؛ لم تظهر إعدادات المشروع.
- الضغط على Sign in أعاد صفحة Google Accounts بخطأ `502 Bad Gateway / [Errno 111] Connection refused`.
- إعادة تحميل واحدة منخفضة المخاطر أعادت نفس الخطأ؛ توقفت محاولة الوصول.
- لم تظهر صفحة Script Properties، لذلك القيمة النصية السابقة للخاصية = NOT_READ؛ لم يُفترض أنها true من الرد وحده.
- PROPERTY_MUTATION=NO؛ لا save ولا toggle ولا إعادة كتابة.
- Secret value لم تُقرأ أو تُطبع؛ لم تُفتح أو تُعدل أي ملفات Apps Script أو Deployment.

##### Independent safe invalid-assertion probe — bridge still enabled
- استُخدم نفس Production Apps Script URL من `cloudflare-d1/wrangler.toml`.
- Request: action `cloudEmployeeLegacyBridgeExecuteV1`، targetAction `getDashboard` (قراءة فقط)، username اصطناعي `entry643-probe`، assertion غير صالح فقط `cfv1.invalid.invalid`، بدون password/token/credential حقيقي.
- HTTP 200؛ message حرفيًا: `اعتماد الموظف السحابي غير صالح.`.
- لم يرجع الرد المطلوب `مسار اعتماد الموظف السحابي غير مفعل.`.
- APPS_SCRIPT_BRIDGE_ENABLED=YES؛ الرد يثبت كذلك أن فحص configured-secret مر قبل رفض assertion، دون قراءة قيمة الـsecret.
- APPS_SCRIPT_BRIDGE_SECRET_RETAINED=YES (موجود بحسب سلوك فحص الـbridge؛ لم يُمس).
- لا business action فعلي؛ assertion رفض قبل target dispatch.

##### Postflight / rollback / boundaries
- Post-mutation postflight = NOT_RUN (لم تحدث mutation).
- ROLLBACK_USED=NO؛ ROLLBACK_STATUS=NOT_NEEDED_PRE_MUTATION_BLOCK.
- شرط الاستئناف: وصول Google إلى المشروع المحدد + fresh successful Runtime preflight، ثم قراءة الخاصية المحددة وحدها وإغلاقها، والتحقق المستقل؛ إذا فشل post-check بعد true→false، إعادة نفس الخاصية فقط إلى true والتحقق وتسجيل الفشل.
- لا إصلاحات جانبية ولا إعادة migration.
```ini
ENTRY643=FAIL
ENTRY643_STATUS=BLOCKED_BEFORE_MUTATION
APPS_SCRIPT_BRIDGE_ENABLED=YES
APPS_SCRIPT_BRIDGE_SECRET_RETAINED=YES
SCRIPT_PROPERTY_PRE_VALUE=NOT_READ
SCRIPT_PROPERTY_CHANGED=NO
AUTH_MODE=UNVERIFIED_CURRENT
D1_NATIVE_READY=UNVERIFIED_CURRENT
BACKEND_BRIDGE=UNVERIFIED_CURRENT
FRONTEND_GLOBAL_NATIVE_AUTH=UNVERIFIED_CURRENT
SECRET_VALUE_LOGGED=NO
CODE_MUTATION=NO
DEPLOYMENT_MUTATION=NO
D1_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
SPREADSHEET_MUTATION=NO
ROLLBACK_USED=NO
MASTER_BOOK_RECORDED=YES
```
- Entry643 غير مكتملة؛ هذه وثيقة المحاولة الفاشلة فقط، وليست PASS.


#### Entry643 — Attempt 1 follow-up: independent Runtime re-verification PASS
- بعد فشل بيئة Work في قراءة Cloudflare بـ HTTP 403، تم تنفيذ قراءة مستقلة لاحقة من بيئة أخرى بدون أي mutation.
- هذه القراءة تثبت أن 403 السابق كان access-path/environment-specific وليس Runtime drift proof.
- Current public Runtime after the failed pre-mutation Apps Script attempt:
  ```ini
  AUTH_MODE=NATIVE
  AUTH_ENABLED=true
  D1_AUTH_USERS=6
  D1_NATIVE_READY_USERS=6
  MUST_CHANGE=0
  PLAINTEXT_STORED=false
  NATIVE_ONLY=true
  LEGACY_BOOTSTRAP=false
  LEGACY_SESSION_ENROLL=false
  BACKEND_BRIDGE=false
  BACKEND_BRIDGE_POLICY_COUNT=0
  FRONTEND_GLOBAL_NATIVE_AUTH=true
  FRONTEND_NATIVE_CANARY=false
  FRONTEND_BRIDGE=false
  FRONTEND_REQUIRED_NATIVE_READY=6
  ```
- Apps Script bridge state remains unchanged from Attempt 1 proof:
  - `APPS_SCRIPT_BRIDGE_ENABLED=YES`
  - property mutation = NO
  - secret retained; secret value not read.
- Entry643 overall remains NOT PASS because Apps Script property closure is still blocked by Google project access.
  ```ini
  ENTRY643_INDEPENDENT_RUNTIME_REVERIFY=PASS
  ENTRY643_RUNTIME_HEALTH=PASS
  ENTRY643_APPS_SCRIPT_PROPERTY_CHANGED=NO
  ENTRY643_APPS_SCRIPT_BRIDGE_ENABLED=YES
  ENTRY643=FAIL_BLOCKED_PRE_MUTATION
  ```


#### Entry643 — Attempt 2: Google access restored; Script Properties UI limit blocks exact closure
- Date: 2026-10-07 Cairo; execution/probe window 2026-10-06T23:29–23:31Z.
- User requested retry of cloud-browser access; original exact-property authorization and prohibitions remain in force.
- First resumed tab was stale (`Unknown CDP tab 3`); a new tab opened the exact authorized Production Project ID successfully, with a positive signed-in Google account signal. No credential value read or entered.
- Project ID verified from current URL: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`.
- Current Master Book re-read included Entry643 Attempt 1 and its independent Runtime follow-up; no earlier migration/hardening step repeated.

##### Independent current Runtime preflight PASS
- Direct HTTPS curl from execution environment succeeded after previous urllib access failures; browser health navigation separately reported `net::ERR_BLOCKED_BY_CLIENT`. No environment/security setting changed.
- Production auth health HTTP 200:
  - mode=NATIVE; envEnabled=true; userCount=6; nativeReadyCount=6.
  - legacyBootstrapEnabled=false; legacySessionEnrollEnabled=false; nativeOnly=true.
  - mustChangeCount=0; plaintextStored=false.
- Production bridge health:
  - enabled=false; allowedPolicyCount=0.
  - upstreamConfigured=true; secretConfigured=true (booleans only).
  - rawNativeTokenForwarded=false; plaintextPasswordForwarded=false.
- Fresh frontend config:
  - MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true.
  - MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=false.
  - MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false.
- Accounting read-only health:
  - mode=READONLY / policyEpoch10; authoritativeWrites=false; writeAuthorityMode=OFF.
  - googleBusinessCalls=0; appsScriptBusinessAuthority=false.
- No Runtime drift found in these authorized boundaries.

##### Script Properties UI inspection — blocker discovered before mutation
- Opened Project Settings only; did not edit or run Apps Script files.
- To avoid reading/logging secret values, only property-name inputs and control metadata were inspected; no full settings snapshot or screenshot exposing property values was emitted.
- `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1` name is present at propertyName39. Its value was not read.
- Target `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED` was not among the 50 displayed property names; this does NOT prove the property is absent.
- Google explicitly displays:
  > Your script has more than 50 properties. The above list shows the first 50 and is read-only. To manage or view all of your properties, do so programmatically using the Properties service.
- Thus current Script Properties UI cannot expose/edit the requested property. Previous 502 login blocker is resolved; new blocker is the first-50/read-only UI limit.
- Did not click save/edit, add/delete properties, alter code, run a setter, or create/change a deployment.
- Exact target pre-value remains NOT_READ; no speculative creation, toggle or rewrite.

##### Independent Apps Script invalid-assertion probe
- Same Production URL sourced from repository wrangler.toml; invalid assertion only `cfv1.invalid.invalid`, synthetic username `entry643-probe`, read-only target `getDashboard`.
- Probe completed 2026-10-06T23:31:27.923065Z.
- Response message: `اعتماد الموظف السحابي غير صالح.`.
- Bridge remains enabled; assertion rejected before business action. No real credential supplied.
- Secret presence proved by existing UI key and bridge configured-secret gate behavior; secret retained, value not read/logged.

##### Outcome / rollback / next boundary
- Entry643 overall remains FAIL/BLOCKED_BEFORE_MUTATION. Google access restoration alone is not closure.
- No post-mutation check or rollback required because no property mutation occurred.
- Next step needs a supported exact-property access mechanism that complies with owner prohibitions; do not silently modify Code.gs, add a helper file, run an unknown setter, or redeploy to bypass this UI limit.
- Project Settings tab retained open for the owner.
```ini
ENTRY643=FAIL
ENTRY643_STATUS=BLOCKED_SCRIPT_PROPERTIES_FIRST_50_READONLY
ENTRY643_RUNTIME_PREFLIGHT=PASS
APPS_SCRIPT_BRIDGE_ENABLED=YES
APPS_SCRIPT_BRIDGE_SECRET_RETAINED=YES
SCRIPT_PROPERTY_PRE_VALUE=NOT_READ
SCRIPT_PROPERTY_CHANGED=NO
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
SECRET_VALUE_LOGGED=NO
CODE_MUTATION=NO
DEPLOYMENT_MUTATION=NO
D1_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
SPREADSHEET_MUTATION=NO
ROLLBACK_USED=NO
MASTER_BOOK_RECORDED=YES
```


#### Entry643 — Attempt 3: authorized temporary helper added then removed; execution blocked
- Date: 2026-10-07 Cairo. User explicitly authorized a temporary helper in Production Code.gs only, one execution of `entry643DisableEmployeeLegacyBridgeOnce_`, removal, no deployment.
- Master Book re-read confirmed Attempt 2 recorded in `2ab48942046cfe8ab799d26f42c2e5e0739bcccd`; prior attempts preserved.
- Fresh branch HEAD inspected: `ba50aab4` (Autonomous Printshop commit; no changes to that project here).
- Fresh Production preflight PASS: AUTH_MODE=NATIVE, userCount=6, nativeReadyCount=6, nativeOnly=true, legacyBootstrapEnabled=false, legacySessionEnrollEnabled=false; backend enabled=false, allowedPolicyCount=0; frontend global native=true, native canary=false, bridge=false.
- Exact Apps Script Project ID retained: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`.

##### Helper and editor actions
- A first insertion landed near the file beginning due editor navigation/context timing; immediately undone before save. No execution.
- Editor Go to Line established original final line count 12556.
- Appended the exact owner-supplied helper to the end of Code.gs and saved:
```javascript
function entry643DisableEmployeeLegacyBridgeOnce_() {
  PropertiesService
    .getScriptProperties()
    .setProperty("TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED", "false");
}
```
- Run dropdown remained `doGet`; the helper was absent from its options, including after reloading the saved editor. No Run/Debug click occurred.
- Exact helper with trailing underscore was not selectable. No renamed helper, wrapper, other function execution, or hidden/API invocation was substituted.
- Helper removed without execution. During removal, one trailing helper brace remained and save was rejected with `SyntaxError: Unexpected token '}' line: 12556 file: Code.gs`; removed that leftover helper brace and saved successfully.
- Final source tail matches the observed original closing sequence; Go to Line reports 12556 lines again, and Save project to Drive is disabled after successful save. No original business logic was intentionally changed.
- TEMP_HELPER_ADDED=YES; TEMP_HELPER_EXECUTED=NO; RUN_CLICK_COUNT=0; TEMP_HELPER_REMOVED=YES.
- There was a temporary saved source addition, but no deployment action. Do not claim CODE_MUTATION=NO for this attempt.

##### Sensitive-output incident — recorded without values
- On navigation from Project Settings to Editor, an immediate full AX observation captured the previous Settings page before the transition completed, accidentally emitting secret/property values in tool output.
- SECRET_VALUE_LOGGED=YES_ACCIDENTAL_TOOL_OUTPUT. This violates the owner's required no-secret-output boundary; do not report NO for this attempt.
- No sensitive values are copied into this Master Book entry, a repository artifact, or the final answer. No secret was changed/deleted; no rotation or other unapproved remediation was attempted.
- Subsequent checks used narrowly scoped controls and safe editor views. Owner was informed of the accidental exposure in commentary.

##### Fresh postflight and safe Production probe
- Auth health: NATIVE, 6 users, 6 native-ready, nativeOnly=true, bootstrap=false, enroll=false, plaintextStored=false, mustChangeCount=0.
- Backend bridge health: enabled=false, allowedPolicyCount=0, secretConfigured=true, upstreamConfigured=true; password/native-token forwarding false.
- Frontend config: global native=true, canary=false, bridge=false.
- Accounting observation only: READONLY / epoch10; authoritativeWrites=false, writeAuthorityMode=OFF, googleBusinessCalls=0, appsScriptBusinessAuthority=false.
- Same Production Apps Script URL, synthetic username `entry643-probe`, invalid assertion only `cfv1.invalid.invalid`, read-only target `getDashboard`; no real password/token and no business mutation.
- Response: `اعتماد الموظف السحابي غير صالح.`; bridge remains enabled. Required disabled response was not observed.
- SCRIPT_PROPERTY_CHANGED=NO; target property value NOT_READ. Secret retained as evidenced by previous property-name inspection and current configured-secret rejection path.
- Property rollback not used because helper was never executed and property was not changed. Source helper cleanup completed.
- No New/Manage/Edit Deployment action used. No D1 users, Spreadsheet, Accounting, or EasyStore mutation.
- Next technical blocker: exact helper ending in underscore is not selectable in editor Run dropdown; owner instructions explicitly require that function name, so no alternative name was run.
```ini
ENTRY643=FAIL
ENTRY643_STATUS=EXACT_HELPER_NOT_SELECTABLE_AND_SENSITIVE_OUTPUT_INCIDENT
APPS_SCRIPT_BRIDGE_ENABLED=YES
APPS_SCRIPT_BRIDGE_SECRET_RETAINED=YES
TEMP_HELPER_ADDED=YES
TEMP_HELPER_EXECUTED_ONCE=NO
TEMP_HELPER_EXECUTED=NO
TEMP_HELPER_REMOVED=YES
SCRIPT_PROPERTY_CHANGED=NO
DEPLOYMENT_MUTATION=NO
D1_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
SPREADSHEET_MUTATION=NO
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
BACKEND_BRIDGE=false
FRONTEND_GLOBAL_NATIVE_AUTH=true
ROLLBACK_USED=NO
MASTER_BOOK_RECORDED=YES
```


#### Entry643 — Attempt 4: corrected temporary helper executed once; Production bridge closure PASS
- Execution date: 2026-10-06 UTC / 2026-10-07 Cairo. Scope: Entry643 only, following Entry642 PASS and historical Entry643 Attempts 1–3; those entries are preserved unchanged.
- Owner explicitly authorized the corrected temporary public helper (without trailing underscore), one execution, removal and source save; no deployment.
- Re-read current Master Book and verified Attempt 3 commit `67a5e8d68ff6db87bafbc4b589a9a9f6c864963e`. Branch head inspected: `5b3fecd9e7040d79dc88a46a2821554b6cc5168c`; preceding commit `f35be5573c06e0f72a05441216a795f66b0968c5` is unrelated Autonomous Printshop documentation.
- Latest branch Actions metadata: Run `37548046154`, Autonomous Printshop Policy V1 CI, completed/success at head `5b3fecd9`; also Runs `37547847546` and `37547709577` completed/success. These CI runs are historical/repository evidence, not Employee Auth Runtime proof. No workflow was dispatched by this attempt.

##### Fresh read-only Runtime preflight — PASS before mutation
- Direct HTTPS reads of Production auth health, legacy-action health and frontend config confirmed:
```ini
AUTH_MODE=NATIVE
D1_AUTH_USERS=6
D1_NATIVE_READY_USERS=6
NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
FRONTEND_BRIDGE=false
```
- No material Runtime drift; proceeded after this proof. No earlier migration or Entry642 hardening repeated.
- Target property pre-value = NOT_READ in this attempt, as required by the no-properties-read boundary. Last verified Production behavior from Attempt 3 was bridge enabled; do not equate behavioral evidence with a literal property-value read.

##### Corrected helper — append, save, select, execute once
- Used Editor only at exact Production Project ID `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`. Project Settings was not opened; no Script Properties values or secrets read/displayed.
- Appended only this helper to the end of Code.gs, following the original final closing brace; saved successfully:
```javascript
function entry643DisableEmployeeLegacyBridgeOnce() {
  PropertiesService
    .getScriptProperties()
    .setProperty("TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED", "false");
}
```
- The corrected function appeared as a Run dropdown option. An initial option click failed with no visible match because the menu was not open; no execution occurred during that failed UI selection. Opened the dropdown after save, used End to reach the last option, selected the exact corrected helper and independently verified its selected option.
- Run clicked exactly ONCE with `entry643DisableEmployeeLegacyBridgeOnce` selected. No doGet, Debug or other function run.
- Execution log displayed `4:53:09 PM — Execution started` and `4:53:11 PM — Execution completed` (UI-local displayed times, not converted to UTC).
- No new Google authorization prompt occurred. Helper contains only a single setProperty of the specified enabled flag; it does not retrieve/read the secret or any other property.

##### Independent deployed Apps Script probe — PASS
- Same existing Production Apps Script endpoint from `cloudflare-d1/wrangler.toml`; no new deployment or endpoint substituted.
- Request action `cloudEmployeeLegacyBridgeExecuteV1`; targetAction `getDashboard`; synthetic username `entry643-probe`; targetPayload contains the same read-only action/username; assertion field `cloudEmployeeAssertionV1` contains only deliberately invalid `cfv1.invalid.invalid`.
- No real password/token/assertion supplied; disabled gate rejected before business dispatch.
- curl completed successfully (exit 0); probe observation timestamp `2026-10-06T23:54:03.259181Z`.
- Response success=false and exact message: `مسار اعتماد الموظف السحابي غير مفعل.`.
- Enabled-bridge rejection `اعتماد الموظف السحابي غير صالح.` was not returned. This independently proves APPS_SCRIPT_BRIDGE_ENABLED=NO on the existing deployed bridge.
- SCRIPT_PROPERTY_POST_VALUE=false is established by successful exact setter execution plus independent disabled-gate response, without reading Script Properties.

##### Helper cleanup and fresh postflight — PASS
- After disabled response, used Undo code edit once to remove only the single appended helper; saved source successfully.
- Save project to Drive disabled after save; corrected helper option count became 0; Go to Line reported original total 12556 lines again and current final line 12556, character1. Source restoration completed; no business logic edits.
- A temporary saved source addition/removal did occur; do not report CODE_MUTATION=NO for this authorized attempt. Final helper residue=NO.
- Fresh independent Runtime postflight completed `2026-10-06T23:54:46.856229Z`:
  - Auth success/schemaReady=true; mode=NATIVE; envEnabled=true; userCount=6; nativeReadyCount=6; mustChangeCount=0; plaintextStored=false.
  - nativeOnly=true; legacyBootstrapEnabled=false; legacySessionEnrollEnabled=false.
  - Backend bridge enabled=false; allowedPolicyCount=0; upstreamConfigured=true; secretConfigured=true (booleans only); rawNativeTokenForwarded=false; plaintextPasswordForwarded=false.
  - Frontend Global Native=true; Native Canary=false; frontend bridge=false.
  - Accounting read-only observation: READONLY / policyEpoch10; authoritativeWrites=false; writeAuthorityMode=OFF; googleBusinessCalls=0; appsScriptBusinessAuthority=false.
- No post-check failure, no property rollback needed; ROLLBACK_USED=NO.
- No New/Manage/Edit Deployment action used; existing deployment retained. Only source Save and one helper Run were used. No D1 user, Accounting, EasyStore, Spreadsheet or other business mutation.
- Apps Script bridge secret retained untouched. Retention evidence is prior recorded configured-secret/name proof plus this helper's exact single-key setter and no other property mutation; the disabled response itself does not re-prove secret presence because it exits at the disabled gate.
- SECRET_VALUE_LOGGED=NO for Attempt 4 only. Historical Attempt 3 accidental exposure remains recorded and is not erased or reclassified.
- NEXT_SECURITY_GATE=SEPARATE_EMPLOYEE_LEGACY_BRIDGE_SECRET_ROTATION_REQUIRED_AFTER_ATTEMPT3_EXPOSURE. Rotation was not performed; owner explicitly placed it outside Entry643 scope.

##### Current final truth — Entry643 complete
```ini
ENTRY643=PASS
SCRIPT_PROPERTY_PRE_VALUE=NOT_READ
SCRIPT_PROPERTY_POST_VALUE=false
APPS_SCRIPT_BRIDGE_ENABLED=NO
APPS_SCRIPT_BRIDGE_SECRET_RETAINED=YES
TEMP_HELPER_ADDED=YES
TEMP_HELPER_EXECUTED_ONCE=YES
TEMP_HELPER_EXECUTED=YES
RUN_CLICK_COUNT=1
TEMP_HELPER_REMOVED=YES
FINAL_HELPER_RESIDUE=NO
TEMP_SOURCE_MUTATION=YES_AUTHORIZED_AND_REVERTED
BUSINESS_LOGIC_MUTATION=NO
DEPLOYMENT_MUTATION=NO
D1_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
SPREADSHEET_MUTATION=NO
SECRET_VALUE_LOGGED=NO_THIS_ATTEMPT
AUTH_MODE=NATIVE
D1_AUTH_USERS=6
D1_NATIVE_READY_USERS=6
D1_NATIVE_READY=6/6
NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
FRONTEND_BRIDGE=false
ROLLBACK_USED=NO
ROLLBACK_STATUS=NOT_NEEDED_ALL_POSTCHECKS_PASS
MASTER_BOOK_RECORDED=YES
NEXT_SECURITY_GATE=SEPARATE_SECRET_ROTATION_AFTER_ATTEMPT3_EXPOSURE
```


#### Entry644 — Employee Core READONLY → GENERAL — PASS
- الاسم العربي للبحث: **نقل Core الموظفين للكتابة السحابية / Core GENERAL / Entry644**.
- التاريخ: 2026-10-07 Cairo.
- البداية كانت من Runtime مثبت: Auth=NATIVE 6/6، Backend Bridge=false/0 policies، Core=READONLY epoch1، Content=READONLY، Comms=READONLY، Ops=GENERAL، Accounting=READONLY/writeAuthorityMode=OFF.
- تم تأهيل Dispatcher بحيث READONLY يظل يوجه 4 Core reads فقط، بينما GENERAL يوجه نفس 4 reads + 4 D1-native writes: `bulkUpdateDepartmentStatusV1926`, `archiveDeliveredDepartmentV1926`, `updateLine`, `markCustomerNotified`.
- Repo Attempt 1: Run `37550415394` / Job `112564269742` = FAIL بسبب test-harness Edge call خاطئ بعد نجاح Core 8/8؛ لا Production mutation. الإصلاح commit `d0f12b07d122690b56bda8208ab2fe3efca271fc`.
- Repo Attempt 2: Run `37550477764` / Job `112564471855` = FAIL بسبب Entry628 historical assertion قديم يتوقع Core=OFF؛ لم يتم تغيير الاختبار التاريخي. Gate fix commit `4237107e27f8b8b94f149eb052ef5698e53576af`.
- Repo Attempt 3: Run `37550529017` = SUCCESS؛ `ENTRY644_REPO_GATE=PASS`.
- Runtime arm workflow commit `53d8348d84f5fad968b917e535035bf0a1f66050`; Run `37550634418` / Job `112564985475` = SUCCESS.
- D1 Core control تغير بشرط exact من `READONLY/epoch1` إلى `GENERAL/epoch2` فقط. Safe unauthenticated write-shaped probe وصل auth وأوقف قبل business mutation. Rollback كان armed ولم يُستخدم.
- independent between-stage proof أثبت Backend Core=GENERAL/2 بينما Frontend ظل Core=READONLY قبل deploy؛ Auth/Bridge/Content/Comms/Ops/Accounting ظلت ضمن الحدود.
- Frontend controlled workflow commit `d56e9fc14cd40c1ca96fc9c9dd76d187d36044da`; Run `37551016683` / Job `112566231841` = SUCCESS.
- Frontend version: `ecba8460-e9c1-4fc7-81a2-1cf5c054943a` → `9c84a8ca-49f9-458a-9714-8a0dc03cfcd6`; propagation attempt 4.
- Authenticated smoke: Native login PASS؛ Core write-shaped `updateLine` على synthetic nonexistent line وصل D1 Core ورفض `line-not-found` بدون business mutation؛ Legacy Bridge calls=0؛ logout PASS.
- Root repo config reconciled to Core GENERAL in commit `db217eea8a83c58c05fe16325d6bd09a9c5511e3`.
- config reconciliation شغّل historical workflows قديمة وفشل 9 منها بسبب assertions محفوظة لحالات superseded مثل Native=false / Core=OFF / Content=OFF / Comms=OFF. Runs: `37551156457`, `37551156482`, `37551156578`, `37551156455`, `37551156528`, `37551156541`, `37551156506`, `37551156450`, `37551156516`. هذه ليست Runtime regression ولم يتم تزوير التاريخ بتعديل assertions القديمة.
- Evidence: `docs/trendos/staging/ENTRY644_CORE_GENERAL_CUTOVER_20261007.md`.
```ini
ENTRY644=PASS
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0
CORE=GENERAL
CORE_POLICY_EPOCH=2
FRONTEND_CORE=GENERAL
CORE_GOOGLE_BUSINESS_CALLS=0
CORE_APPS_SCRIPT_BUSINESS_AUTHORITY=false
OPS=GENERAL
CONTENT=READONLY
COMMS=READONLY
ACCOUNTING=READONLY
ACCOUNTING_AUTHORITATIVE_WRITES=false
ACCOUNTING_WRITE_AUTHORITY_MODE=OFF
BUSINESS_DATA_MUTATION_FROM_ENTRY644=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED=NO
MASTER_BOOK_RECORDED=YES
```
- Next gate: qualify Content beyond READONLY without touching Accounting/EasyStore.


#### Entry645 — Content R2 foundation — Attempt 1 BLOCKED_SAFE
- التاريخ: 2026-10-07 Cairo.
- الهدف: تجهيز R2 لـEmployee Content مع إبقاء Content `READONLY / epoch2`؛ لا GENERAL cutover في هذه المحاولة.
- Workflow source commit: `d919b3b94c0ac7dc9a7ca9dfc6d9e80a96781d73`.
- Run `37551605425` / Job `112568154452`.
- Exact Runtime preflight = PASS: Auth=NATIVE 6/6، Bridge=false، Core=GENERAL/2، Content=READONLY/2 و`r2Ready=false`، Comms=READONLY، Ops=GENERAL، Accounting=READONLY/writeAuthorityMode=OFF.
- R2 bucket step فشل قبل أي mutation: Cloudflare R2 API رجع HTTP 403 / code 10000 Authentication error. الـCI token الحالي لا يملك صلاحية list/create R2 buckets.
- Worker settings patch/activation/postflight كلها SKIPPED؛ rollback غير مطلوب لأن الفشل قبل patch.
- لا API code deploy، لا D1/business mutation، لا Accounting/EasyStore mutation.
- Evidence: `docs/trendos/staging/ENTRY645_CONTENT_R2_FOUNDATION_ATTEMPT1_20261007.md`.
- Safe next prerequisite: إنشاء bucket واحد فقط باسم `trendos-employee-content-files` من Cloudflare Dashboard، ثم استكمال binding qualification آليًا.
```ini
ENTRY645_ATTEMPT1=BLOCKED_SAFE
CONTENT_MODE=READONLY
CONTENT_POLICY_EPOCH=2
CONTENT_R2_READY=false
R2_API_AUTH=403
WORKER_SETTINGS_MUTATION=NO
D1_MUTATION=NO
BUSINESS_DATA_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED=NO
```

#### Entry646 — Manager Center Core-direct stabilization — PASS
- الاسم العربي للبحث: **المركز / مركز الإدارة / لوحة المدير / Manager Center / Trend Master Center**.
- التاريخ: 2026-10-07 Cairo.
- التشخيص الحي: `config.js` يحمل `trend-master-resilience-v1931.js` قبل `manager-center-v1932.js`. الـResilience يطلب `getTrendMasterPanelV1931`، لكن الـDispatcher والـD1 Core الحاليين لا يؤهلان هذا action، بينما `getTrendMasterCenterV1931` مؤهل Native على `/v1/employee/core`.
- لذلك كان Manager Center يفضّل مسار Progressive غير مؤهل لمجرد وجود `trendMasterPanelResilienceV1` بدل fallback السحابي الصحيح.
- Entry646 غيّر **المركز فقط** ليستخدم Snapshot واحد مباشر من `getTrendMasterCenterV1931`. لم يتم تغيير D1 أو Backend API أو Content أو Comms أو Accounting/EasyStore.
- Workflow source commit: `eda1828f0c6b6b17617b7649a048d414635ef293`.
- Run `37554583893` / Job `112577762263` = SUCCESS.
- Repo patch commit: `463a2523a9ddf1457f113112254f7bc5176d082a`.
- Frontend version: `9c84a8ca-49f9-458a-9714-8a0dc03cfcd6` → `cfff20f6-5a9d-46cb-8dfb-6c378c4f0eb5`; propagation attempt 4.
- Authenticated Production smoke: Native login PASS؛ Manager Center snapshot من Core PASS؛ Legacy Bridge calls=0؛ Business write=NO؛ Native logout PASS.
- Runtime postflight: Auth=NATIVE 6/6، Core=GENERAL/2، Ops=GENERAL، Content=READONLY، Comms=READONLY، Accounting=READONLY/writeAuthorityMode=OFF؛ rollback لم يُستخدم.
- Evidence: `docs/trendos/staging/ENTRY646_MANAGER_CENTER_CORE_DIRECT_20261007.md`.
```ini
ENTRY646=PASS
MANAGER_CENTER_ROUTE=CORE_DIRECT
MANAGER_CENTER_ACTION=getTrendMasterCenterV1931
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
BACKEND_BRIDGE=false
CORE=GENERAL
CORE_POLICY_EPOCH=2
CONTENT=READONLY
COMMS=READONLY
OPS=GENERAL
ACCOUNTING=READONLY
D1_MUTATION=NO
BUSINESS_WRITE=NO
CONTENT_MUTATION=NO
COMMS_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED=NO
MASTER_BOOK_RECORDED=YES
```


#### Entry647 — Employee Auth + Attendance Runtime Repair — PASS
- الاسم العربي للبحث: **تسجيل دخول الموظفين / الحضور بيظهر تاني / Canary Native Auth غير جاهز / إصلاح Attendance Runtime**.
- التاريخ: 2026-10-07 Cairo.
- بلاغ التشغيل: بعد دخول الموظف والضغط على تسجيل الحضور/بداية اليوم كانت شاشة البداية تظهر مرة أخرى. ضياء ظهر له أيضًا `Canary Native Auth غير جاهز على Cloud.`.
- Read-only diagnostic Run `37614146869` / Job `112768316417` أثبت:
  - Auth Runtime = NATIVE / nativeOnly=true / 6 users / 6 native-ready.
  - Ops=GENERAL/epoch7.
  - Frontend global Native=true، Canary=false.
  - live `app.js`, dispatcher و`attendance-clockin-ui-v1.js` مطابقون للـrepo.
  - live `attendance-v1.js` كان stale hash `4472b66306a31c365a5a3e2b98e73dece85e93f1` بينما qualified repo hash `d7f2625aa03c18486069ee274d960adbf8cdcee4`.
  - الملف الحي القديم كان يفتقد `normalizeAttendanceBackendResponse`؛ لذلك كانت كتابة D1 تنجح لكن UI لا يفهم الرد ويعيد Start overlay.
  - D1 قراءة فقط وقت التشخيص: 2 attendance days + 2 clockins + 2 start pulses، فلا يوجد فقد كتابة.
- Repair source commit `0ee185b18d4a855c3572acc26296674333e451cc`: Restore attendance normalization + cache-bust للملفات الحرجة + stale-Canary compatibility guard بحيث Runtime NATIVE authoritative لا يُحجب بواسطة Canary frontend state قديم.
- Repo CI Run `37614885337` = SUCCESS.
- Controlled deploy history:
  - Attempt1 Run `37615132869` = BLOCKED_SAFE قبل deploy بسبب frontend version drift؛ لا Production mutation.
  - drift كان بسبب Secure EasyStore SSO repair مستقل غيّر app.js فقط وأنتج version `e2717f15-5166-43ac-b1df-702d0e76642a`; Entry647 أُعيد base عليه للحفاظ على إصلاح SSO.
  - Attempt2 Run `37615380360` نشر مؤقتًا ثم rollback آلي إلى `e2717f15...` بسبب Cache-Control verification غير صالح للنمط الحالي؛ repair asset checks نفسها PASS.
  - Attempt3 Run `37615605269` نشر مؤقتًا ثم rollback آلي مرة ثانية بعد إثبات أن Static Assets لا تمر بمسار header rewrite المقترح؛ لم يُفتح تغيير معماري أوسع.
  - Attempt4 Run `37615852582` نشر مؤقتًا ونجح Runtime/asset postflight ثم rollback آلي لأن مقارنة D1 قارنت Wrangler execution metadata المتغيرة بدل business counts؛ business counts لم تتغير.
  - Attempt5 Run `37616027251` / Job `112774437142` = SUCCESS.
- Final frontend version: `e2717f15-5166-43ac-b1df-702d0e76642a` → `3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03`.
- Final propagation attempt=4.
- Final proof:
  - live attendance normalizer restored PASS.
  - dispatcher hardened PASS.
  - pre-existing secure SSO app.js preserved exactly.
  - attendance-clockin-ui preserved exactly.
  - Auth postflight=NATIVE 6/6.
  - frontend global Native=true / Canary=false.
  - D1 attendance counts before/after Entry647 deploy exactly unchanged: `attendanceDays=2, clockins=2, startPulses=2`.
  - Accounting mutation=NO; EasyStore mutation=NO; final rollback used=NO.
- Evidence: `docs/trendos/staging/ENTRY647_ENTRY648_EMPLOYEE_LOGIN_ATTENDANCE_REPAIR_20261007.md`.

```ini
ENTRY647=PASS
FRONTEND_VERSION=3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
ATTENDANCE_UI_CONTRACT=RESTORED
ATTENDANCE_WRITE_LOSS=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED_FINAL_ATTEMPT=NO
```

#### Entry648 — Employee Login Matrix Diagnostic — PASS READONLY
- الاسم العربي للبحث: **كل الموظفين مش بيدخلوا / ضياء دخل والباقي لأ / فحص حسابات الموظفين بدون كلمات مرور**.
- التاريخ: 2026-10-07 Cairo.
- Workflow commit `d1f26ad5bf7a6befed9eafdfc2872beb1b32918f`; Run `37617351984` / Job `112778800227` = SUCCESS.
- Runtime locks: frontend `3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03`; Auth NATIVE 6/6؛ Global Native=true؛ attendance runtime PASS.
- Read-only matrix فقط؛ لم تُقرأ أي password value أو password hash أو token value أو secret.
- كل الستة: active=1، lockedNow=0، mustChange=0، failedAttempts=0.
- ضياء: activeSessions=2؛ last login 2026-10-07 14:30 Cairo.
- وائل: activeSessions=1؛ last login 2026-10-07 14:00 Cairo؛ attendanceStartedToday=1؛ clockinToday=1؛ attendanceOpenToday=1.
- رحمه: activeSessions=14؛ last login 2026-10-07 14:34 Cairo؛ attendanceStartedToday=1؛ clockinToday=1؛ attendanceOpenToday=1.
- جابر: activeSessions=0؛ last login 2026-10-06 14:13 Cairo.
- ريفان: activeSessions=0؛ last login 2026-10-06 19:29 Cairo.
- شريف: activeSessions=0؛ last login 2026-10-06 22:39 Cairo.
- الاستنتاج التشغيلي:
  - لا يوجد D1 readiness gap، disabled account، lockout أو must-change blocker لأي موظف.
  - وائل ورحمه لديهم Native sessions وحضور اليوم مثبت، وبالتالي Cloud login + attendance path يعملان فعليًا.
  - جابر/ريفان/شريف لا توجد لهم جلسة حالية ومع ذلك failedAttempts بقي 0؛ هذا يتوافق مع أن المحاولة الحالية من أجهزتهم لا تصل إلى Native login handler، وليس رفضًا من الحساب.
  - Immediate recovery للعميل stale: إغلاق كل تبويبات TrendOS على جهاز الموظف وفتح root URL cache-busted جديد ثم تسجيل الدخول الطبيعي. لا يوجد دليل يبرر password reset.
- Accounting/EasyStore untouched.

```ini
ENTRY648=PASS_READONLY_DIAGNOSTIC
ALL_6_ACTIVE=YES
ALL_6_LOCKED_NOW=NO
ALL_6_MUST_CHANGE=NO
ALL_6_FAILED_ATTEMPTS=0
WAEL_NATIVE_SESSION=YES
WAEL_ATTENDANCE_TODAY=YES
RAHMA_NATIVE_SESSION=YES
RAHMA_ATTENDANCE_TODAY=YES
JABER_CURRENT_NATIVE_SESSION=NO
REVAN_CURRENT_NATIVE_SESSION=NO
SHERIF_CURRENT_NATIVE_SESSION=NO
PASSWORD_VALUE_READ=NO
PASSWORD_HASH_READ=NO
TOKEN_VALUE_READ=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
MASTER_BOOK_RECORDED=YES
```


##### Entry648 — Owner production confirmation
- 2026-10-07 Cairo: بعد فتح النسخة الجديدة من TrendOS، أكد المالك أن باقي الموظفين دخلوا بنجاح.
- هذا يؤكد تشغيليًا أن مشكلة الدخول المتبقية كانت Client/frontend stale state وليست عطلًا في حسابات D1 Native.
- لا يوجد أي password reset أو account mutation مطلوب.
- لا يوجد Runtime mutation إضافي في هذه الخطوة.
```ini
ENTRY648_ALL_EMPLOYEES_LOGIN_CONFIRMED_BY_OWNER=YES
EMPLOYEE_LOGIN_INCIDENT=CLOSED
ADDITIONAL_RUNTIME_MUTATION=NO
```


##### Entry649 — Structured Employee Andon frontend cutover to Autonomous Printshop
- Date: 2026-10-07 Cairo.
- This entry records only the direct TrendOS Production runtime change required by the Autonomous Printshop Manager Center migration. Architectural details are recorded in `autonomous-printshop/MASTER_BOOK.md` AP-076.
- Production `employee-andon-v1.js` was cut from legacy `saveMatbagyNote / OPS_REPLY` to the isolated Autonomous Printshop Employee Supervisor structured blocker service.
- The deployment rebuilt from the exact live frontend snapshot and preserved unrelated frontend assets.
- No Auth policy, employee account, password, Accounting control, EasyStore, Content/R2, Operator Task, employee assignment, Order, or Line authority was changed.
- No synthetic Production blocker event was created.

```ini
ENTRY649=PASS
ENTRY649_DEPLOY_RUN=37646897563
ENTRY649_PRE_FRONTEND_VERSION=3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03
ENTRY649_POST_FRONTEND_VERSION=f96fc299-f98c-470a-9869-0e49a9752e73
ENTRY649_EMPLOYEE_ANDON=STRUCTURED_SHADOW_SERVICE
ENTRY649_LEGACY_OPS_REPLY_FRONTEND=OFF
ENTRY649_SYNTHETIC_BLOCKER_CREATED=NO
EMPLOYEE_SUPERVISOR_CONTROL=SHADOW
EMPLOYEE_SUPERVISOR_EPOCH=2
EMPLOYEE_SUPERVISOR_EVENT_ROWS=0
OPERATOR_TASK=OFF
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
BACKEND_LEGACY_BRIDGE=false
ACCOUNTING_FINAL_MODE=READONLY
ACCOUNTING_FINAL_POLICY_EPOCH=33
ACCOUNTING_MUTATION_BY_ENTRY649=NO
EASYSTORE_MUTATION=NO
CONTENT_R2_MUTATION=NO
ROLLBACK_USED=NO
```


##### Entry650 — Pending Comms aggregate projected to Autonomous Printshop Owner Console
- Date: 2026-10-07 Cairo.
- This entry records the Manager Center responsibility migration only. No TrendOS application worker, frontend, Comms control, customer record, message, or business row was mutated by this step.
- Autonomous Printshop now reads the already-qualified D1-native Comms source as an aggregate-only signal and projects it into Control Tower + Owner Exception Console.
- The first aggregate exposed 166 historical Feedback pending rows. Because `feedbackEnabledAtMs=0`, those rows were corrected to dormant diagnostic-only before Owner Console activation.
- Live operational pending count is currently one conversation whose latest direction is inbound.
- Open WhatsApp / copy/send actions remain outside Autonomous Printshop.

```ini
ENTRY650=PASS
CONTROL_TOWER_COMMS_SOURCE_COMMIT=6d8ab01024ccb2d3ec0e4ad0aa9fd7e27b344e44
CONTROL_TOWER_COMMS_CORRECTION_COMMIT=0385e75924fbe6777c7a044160bb2bc5d16c1ba0
OWNER_CONSOLE_COMMS_COMMIT=e4aa59000b59ed8ab064f6c1070857d0946fbd9d
CONTROL_TOWER_COMMS_RUN=37655984075
OWNER_CONSOLE_DEPLOY_RUN=37656472999
PRODUCTION_SHADOW_VERSION=a6c29a6c-f416-4aae-a142-55a5f6c4bab7
OWNER_CONSOLE_VERSION=d46c4582-60f8-4058-950b-f82eb754a496
COMMS_MODE=READONLY
COMMS_POLICY_EPOCH=2
FEEDBACK_ENABLED_AT_MS=0
OPERATIONAL_PENDING_SIGNALS=1
FEEDBACK_DORMANT_BACKLOG=166
COMMS_SEND_AUTHORITY=NO
CUSTOMER_PII_EXPOSED=NO
MESSAGE_TEXT_EXPOSED=NO
TRENDOS_MAIN_WORKER_CHANGED=NO
D1_MUTATION=NO
MC_15=LIVE
MC_16=NOT_MIGRATED
```


##### Entry651 — Restored employee sessions verified before frontend boot
- Date: 2026-10-08 Cairo.
- Incident observed on Wael/print workstation: TrendOS restored the employee name and opened the main UI from browser session storage, while Cloud services rejected the stored token with `Employee session rejected`.
- Root cause: `loadSession()` only checked for a stored token and the startup path called `bootMain()` immediately, without qualifying the restored employee session against the Native Cloud auth endpoint.
- Backend/account status was healthy before the repair: Employee Auth `NATIVE`, `nativeOnly=true`, `6/6` native-ready users, `mustChangeCount=0`.
- Frontend repair:
  - restored employee sessions call `verifyEmployeeSession` before `bootMain()`;
  - valid sessions preserve the existing token and refresh canonical user metadata;
  - rejected/expired restored sessions are cleared by the dedicated startup-only `clearRejectedRestoredEmployeeSessionV1()` helper and returned to the employee login screen;
  - the username is retained in the login form and the password field is cleared;
  - transient verification/network failure does not boot the main UI.
- Session-isolation boundary preserved: the original `clearSession()` remains explicit-logout-only; Entry533 session-isolation contract passes.
- Controlled production deploy used exact-live frontend snapshot, replaced `app.js` only, preserved live config/dispatcher, and retained automatic rollback.
- Production proof:
```ini
ENTRY651=PASS
SOURCE_COMMIT=f8f188403d5c8b729d69159e6218773a155bbbaa
DEPLOY_GATE_COMMIT=961b8d37cb73124fe0d8135066d0f5f2faa3fd79
WORKFLOW_RUN=37767635255
PRE_FRONTEND_VERSION=a24bff04-f0ea-484e-90c7-38be02ab57a1
POST_FRONTEND_VERSION=42872c38-c1c9-4cae-9b93-de562dc9c477
SESSION_RESTORE_VERIFY_GUARD=PASS
ENTRY533_EMPLOYEE_SESSION_ISOLATION=PASS
STALE_EMPLOYEE_SESSION_AUTO_BOOT=NO
REJECTED_SESSION_FORCES_RELOGIN=YES
AUTH_MODE=NATIVE
NATIVE_READY=6/6
MUST_CHANGE_COUNT=0
AUTH_BACKEND_CHANGED=NO
BUSINESS_D1_MUTATION=NO
ROLLBACK_USED=NO
```
- Operator recovery: reload the affected workstation once; a stale token is now rejected before main UI boot and the employee is sent to the login form to enter the existing current password. No password reset is required solely for this incident.


##### Entry652 — Permanent Employee Session Lifecycle Guard
- Date: 2026-10-08 Cairo.
- This entry closes the class of stale employee-session failures that produced a half-open TrendOS UI such as `Employee session rejected` after a previously stored browser token became invalid.
- Entry651 already prevented stale sessions from booting without Cloud verification. Entry652 hardens the full employee-session lifecycle after boot as well.

Implemented layers:
1. Boot verification remains mandatory before `bootMain()`.
2. Session Epoch contract added through `MATBAGY_EMPLOYEE_AUTH_SESSION_EPOCH=1`; future major Auth migrations can invalidate stored browser sessions centrally by incrementing the epoch.
3. Runtime 401/session-rejected guard added so employee API rejection dispatches one central `trendos:employee-session-invalid` event.
4. The central runtime guard stops refresh/timers, clears only the rejected restored employee session, and returns the employee to the login screen instead of leaving a half-working UI.
5. Periodic Cloud session re-verification runs every 5 minutes while active.
6. Session re-verification is also triggered when the browser regains focus / visibility.
7. Structured Andon and Edge order/session exchange paths participate in the same invalid-session event contract.
8. Entry533 isolation remains preserved: the original `clearSession()` stays explicit-logout-only.
9. No password reset, account reset, Auth-backend mutation, or business D1 mutation was required.

Primary implementation commit:
`e3a41512297c88f448bea0c773e75f3edc6c21b7`

Follow-up regression-contract alignment:
- `6ef0129bab6c914fbca53b742dab748315bccbbb`
- `7176d6135ee36457c696a36932928472e47c02ca`
- `e7e4213284eb49dc6da80ccaaee77ef7d85a694f`

Controlled Production deploy:
```ini
WORKFLOW=TrendOS Entry652 Employee Session Lifecycle Guard Controlled
RUN=37770495211
RESULT=SUCCESS
PRE_FRONTEND_VERSION=42872c38-c1c9-4cae-9b93-de562dc9c477
POST_FRONTEND_VERSION=9699b0d0-8c21-4b5b-92fe-1983219110f6
PROPAGATION_ATTEMPT=9
UNRELATED_ASSETS_PRESERVED=PASS
ROLLBACK_USED=NO
```

Qualification:
```ini
ENTRY651_SESSION_RESTORE_VERIFY_GUARD=PASS
ENTRY652_EMPLOYEE_SESSION_LIFECYCLE_GUARD=PASS
ENTRY652_RUNTIME_401_DISPATCH=PASS
ENTRY533_EMPLOYEE_SESSION_ISOLATION=PASS
A61_FRONTEND_EMPLOYEE_DISPATCHER=PASS
ENTRY603_LOGIN_FAST_SURFACE=PASS
ENTRY649_EMPLOYEE_ANDON_STRUCTURED_REPO=PASS

BOOT_VERIFY=YES
RUNTIME_401_FORCE_RELOGIN=YES
SESSION_EPOCH=1
PERIODIC_REVERIFY=5_MINUTES
FOCUS_VISIBILITY_REVERIFY=YES
WRONG_OLD_PASSWORD_401_INVALIDATES=NO
NATIVE_TOKEN_TO_APPS_SCRIPT=NO
```

Auth runtime remained unchanged:
```ini
AUTH_MODE=NATIVE
NATIVE_ONLY=true
USER_COUNT=6
NATIVE_READY=6
MUST_CHANGE_COUNT=0
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
PLAINTEXT_STORED=false
AUTH_BACKEND_CHANGED=NO
PASSWORD_RESET=NO
BUSINESS_D1_MUTATION=NO
```

Operational effect:
- a stale/expired/revoked employee session can no longer keep the main UI half-open;
- the employee is returned to login once, using the existing current password;
- future major Auth migrations can invalidate old browser sessions centrally by incrementing the frontend Auth Session Epoch instead of manual cache/session cleanup per workstation.

Current branch HEAD after regression-contract cleanup:
`e7e4213284eb49dc6da80ccaaee77ef7d85a694f`.

Result: **PASS — EMPLOYEE SESSION RESTORE AND RUNTIME SESSION LIFECYCLE ARE NOW GUARDED END-TO-END; STALE OR REJECTED SESSIONS FAIL CLOSED TO RELOGIN WITHOUT PASSWORD RESET OR BUSINESS-DATA MUTATION.**


## Entry: تدقيق تكرار الأوردرات والحزمة الحية — 2026-10-08 Cairo / PREPARE

- الهدف: متابعة `Customer + Department Lane` فقط من الإصدار `5029d95be3c7dc69feec9fe0cf58a659b5feda9c`؛ لا إعادة Auth/Accounting/AP أو أي نشر. فرع التدقيق المنفصل `audit/t12-customer-lane-runtime-20261008` يحفظ فروع العمل المتوازي.
- أحدث refs بعد fetch: candidate=`0e3d35f0283773b2e0c65070fa91d46d3fd477be`، fix=`b8d4172ea3edce398a26f8334bae895330553e54`، release=`5029d95be3c7dc69feec9fe0cf58a659b5feda9c`. تغييرات candidate بعد baseline تخص AP-079/AP-080؛ لا تُمسح ولا تُدمج عشوائيًا.
- Runtime مستقل في هذه الجلسة: GET create/health HTTP 200، `T12_GENERAL_CREATE_20261001_DUP_GUARD_V1`، `GENERAL`، nextOrderNumber=4796 وقت الفحص فقط. هذا دليل أن الإصلاح المرشح لم يحل التكرار على Production بعد.
- GitHub API أعاد تأكيد run `37779637589` SUCCESS وكل خطوات job `113319183797` ناجحة؛ run `37779969426` FAILURE. لا اعتبار لفشل بوابة الحزمة كنجاح.
- SOURCE_ONLY: الاختبارات المحلية القائمة نجحت، لكن probes SQLite جديدة كشفت قبول طباعة رغم Legacy مفتوح بقسم `مكبس`، وفقد phone بالأرقام العربية في legacy mapper عند اختلاف الاسم. كذلك health لا يفحص جدول 0012: يعلن schemaReady=true مع CREATE غير جاهز. هذه نتائج كود محلية؛ انتشار بيانات الحالات المتأثرة على Production غير مثبت بعد. لم تُغير الملفات التطبيقية.
- حزم esbuild@0.25.10 أعادت SHA السابقة exact: BASE=`65ef2c5cc06735d2838ffaa1b8da4d2c46b5ff1666d9c403c6e8e913991f7872`، RELEASE=`09087d1a2fe72de00cde5a76585875ecd82ec65e2eed9e027153a7555b1ae777`. keepNames يغير الناتج؛ فرق البايتات لا يثبت وحده فقد وظائف، ولا يسمح بتجاوز بوابة تطابق المصدر.
- الخطوة الجديدة الضرورية: workflow read-only باستخدام Cloudflare bindings الموجودة أصلًا في GitHub Actions، يفحص جميع JS modules والـentry الحقيقي ومقارنة plain/keepNames/Wrangler dry-run، وحالة 0012 عبر SELECT. لا نشر، لا CREATE تجاري، لا export بيانات العملاء أو الحزمة الحية إلى المستودع العام. التقرير المحتفظ به sanitized identifiers/hashes/schema aggregates فقط.
- PREPARE=SOURCE_ONLY؛ نتيجة تشغيل الـworkflow لم تُثبت بعد. النشر `BLOCKED_SAFE` حتى حسم الحزمة والثغرات وإعادة التأهيل وخطة نشر يؤكدها المالك.
