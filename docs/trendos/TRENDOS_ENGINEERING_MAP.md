# TrendOS Engineering Map — خريطة المستودع الهندسية

> الحالة: **IN_PROGRESS**
>
> الفرع: `candidate/t12-full-cloud-cutover-a56-20260929`
>
> الغرض: تحويل جرد المستودع الكامل إلى خريطة تشغيل وصيانة موثقة، مع قراءة محتوى الملفات نفسها وربطها بالشاشات، الدوال، المسارات، البيانات، الاختبارات، وRuntime Evidence. هذا الملف لا يستبدل `TrendOS_MASTER_BOOK.md`؛ بل هو المرجع الهندسي التفصيلي المرتبط به.

## 1) Baseline الجرد

- إجمالي الملفات في الكتالوج: **1435**
- docs/: **713**
- .github/workflows/: **220**
- tests/: **200**
- cloudflare-d1/: **159**
- ملفات root: **95**
- apps-script/: **18**
- accounting/: **12**
- tools/: **12**
- مسارات أخرى: **6**

المرجع الخام لكل المسارات:
`docs/trendos/TRENDOS_REPOSITORY_CATALOG.md`

## 2) تصنيف الحالة

كل ملف يُصنف فقط بدليل، وليس بالاسم:

- **LIVE**: مثبت أنه داخل المسار التشغيلي الحالي.
- **TRANSITIONAL**: مستخدم أثناء نقل/توافق مؤقت وما زال له أثر فعلي أو dependency قائمة.
- **CANDIDATE**: كود/خطة جاهزة أو مجربة لكن غير مثبت نشرها كسلطة حالية.
- **TEST**: اختبار/fixture/diagnostic لا يساوي Production authority.
- **HISTORICAL**: محفوظ للتاريخ/الاسترجاع ولا يمثل الحالة الحالية.
- **DOC**: توثيق؛ قوته تعتمد على حداثته والدليل الذي يشير إليه.
- **UNKNOWN**: لم يكتمل دليل حالته بعد.

ترتيب الدليل:
`LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`.

## 3) سجل التغطية

| Batch | النطاق | الملفات المقروءة فعليًا | الحالة |
|---|---|---:|---|
| B00 | Repository catalog / baseline | 1 | DONE |
| B01 | Root frontend + runtime entrypoints | 27 | DONE |
| B02 | Cloudflare D1 primary worker/src | 34 | DONE |
| B03 | D1 migrations/schema | 16 | DONE |
| B04 | Apps Script + Code.gs families | 25 | DONE |
| B05 | Attendance/Cleaning/HR/Press | 7 | DONE |
| B06 | Customers/Feedback/Manager | 0 | PENDING |
| B07 | Accounting + material control | 0 | PENDING |
| B08 | Integrity/queue/operator tasks | 0 | PENDING |
| B09 | GitHub Actions current + historical workflows | 0 | PENDING |
| B10 | tests/ | 0 | PENDING |
| B11 | docs/ active engineering docs | 0 | PENDING |
| B12 | archive/historical docs + cross-check | 0 | PENDING |
| B13 | Coverage audit: screens/buttons/functions/data | 0 | PENDING |

## 4) قواعد القراءة والحفظ

1. كل Batch يقرأ **محتوى الملفات** وليس الاسم فقط.
2. لكل ملف كود نسجل عند الإمكان: SHA، الغرض، exports/functions، routes/actions، storage/table dependencies، callers/callees، والحالة بالدليل.
3. لا نرفع ملفًا إلى LIVE لمجرد أنه موجود في GitHub.
4. الاختبارات والـworkflows تُربط بالكود الذي تثبته، ولا تُستخدم وحدها لإثبات Production.
5. أي تضارب بين توثيق قديم وRuntime يُسجل، والحالة الحالية تتبع Runtime.
6. بعد كل Batch يتم commit فوري لهذا الملف؛ وبالتالي يمكن الاستئناف من آخر Batch بدون إعادة القراءة من البداية.

## 5) معيار الإغلاق النهائي

لا يصبح هذا الملف COMPLETE إلا عندما يتحقق:

```ini
REPOSITORY_PATHS_INDEXED=1435
CONTENT_REVIEW_REQUIRED=YES
LIVE_FUNCTION_WITHOUT_BOOK_MAP=0
LIVE_CODE_WITH_UNKNOWN_OWNER_OR_PURPOSE=0
LIVE_DATA_WITH_UNKNOWN_SOURCE_OR_DESTINATION=0
SCREEN_ACTION_WITHOUT_BACKEND_MAP=0
```

## 6) سجل التنفيذ

### 2026-10-02 — Engineering Map initialized
- تم ربط الخريطة بالكتالوج الكامل.
- لم يتم الادعاء بقراءة الملفات التي لم تُقرأ بعد.
- نقطة الاستئناف: **B01 — Root frontend + runtime entrypoints**.


## 7) B01 — Root frontend + runtime entrypoints — DONE

### 7.1 نقطة الدخول الحية للواجهة

تمت قراءة محتوى الملفات التالية فعليًا:
- `index.html` — SHA `02f677f0d44cbde96de953e0ab3300be01b72056`
- `config.js` — SHA `5085108b899df317225b89e11b43e7fdce34fda6`
- `app.js` — SHA `f2984cba24b9752c7cbc0cce9d0b4004cc154026`
- `browser-api-transport-v1.js` — SHA `274d99dc7a96a07aea2e5a2eb8d79e1cd487305d`
- `employee-api-dispatcher-v1.js` — SHA `0463f935993f361ab5c81291d452036cb40bc5de`
- `trendos-return-traffic-quiet-v1.js` — SHA `f75258a481dbb62c101189204caf6a3561432c74`
- `styles.css` — SHA `da463cba976d46fe3a9e28386f1a8f8cb09eac13`
- `matbagy_theme_v1860.js` — SHA `5f0b8bdc6ad685dbe2fe922ee3be3461a30c78d8`
- `matbagy_theme_v1860.css` — SHA `18971a36b3dfd6743c48115afaf806c11181a101`

`index.html` يحمّل مباشرة:
`trendos-return-traffic-quiet-v1.js -> config.js -> browser-api-transport-v1.js -> app.js -> employee-api-dispatcher-v1.js -> matbagy_theme_v1860.js`
مع `styles.css` و`matbagy_theme_v1860.css`.

**تصنيف:** ملفات نقطة الدخول والتحميل أعلاه = **LIVE frontend source** بالاقتران مع Evidence الكتاب الحي الذي يثبت Cloudflare frontend ونجاح root/config/edge/app في Entry595. هذا التصنيف لا يعني أن كل feature داخل `app.js` Cloud-native.

### 7.2 Cloud transport في المتصفح

`browser-api-transport-v1.js`:
- ينشئ `window.trendosLegacyApiTransportV1`.
- يرسل POST إلى `https://trendos-d1-api.trendmall-contact.workers.dev/v1/legacy-api`.
- timeout افتراضي 120 ثانية.
- `credentials: omit`, `cache: no-store`, `redirect: error`.
- أخطاء صريحة: `CLOUD_API_INVALID_JSON`, `CLOUD_API_UNAVAILABLE`, `CLOUD_API_TIMEOUT`.

**تصنيف:** **LIVE transport**, لكنه يحمل اسم legacy لأن عدداً من actions القديمة ما زال يمر عبر Cloud compatibility endpoint.

### 7.3 API abstraction داخل app.js

`app.js` لا ينادي Apps Script مباشرة من دالة `api`; بل:
- `api(action, params) -> window.trendosSecureApiV1922(action, params)`
- `apiPost(action, payload) -> window.trendosSecureApiV1922(action, payload)`

تم استخراج 58 action صريحة من الملف، منها:
`login`, `customerLogin`, `createManualOrder`, `searchCustomers`, `createCustomer`, `getRows`, `getRowsPageV1931`, `updateLine`, `markCustomerNotified`, `getOrderConversation`, `sendOrderConversationMessage`, `initAccounting`, `getAccounting`, `saveAccountingMaterial`, `saveAccountingDeptLine`, `saveAccountingFinalInvoice`, `getTrendMasterCenterV1931`, `getKnowledge`, `saveKnowledge`, `getMarketplace`, `getPlatformSections`, `getServiceProviderRoutes`, `getFranchiseBranches`, `saveWhiteLabelSettings`, `getCustomerPortalAccountsV1859`.

**مهم:** وجود action في `app.js` = واجهة/طلب موجود؛ لا يثبت أن backend الخاص به D1-native. Authority لكل عائلة تُحدد في B02/B04 وما بعدهما.

### 7.4 Orders path في الواجهة

تم التحقق من كود:
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=true`.
- `loadInitialRowsWhenEdgeReady()` ينتظر تثبيت Edge Orders router قبل أول تحميل rows؛ عند عدم الجاهزية لا يعمل Google fallback بل يعرض خطأ تجهيز Cloud path.
- `createOrder()` يمنع double-submit محليًا عبر `createOrder._busy`.
- `createManualOrder` هو action المستخدم في submit.
- duplicate response يدعم `duplicateBlocked` و`openOrder`.

`trendos-edge-orders-read-v1.js` تمت قراءته فعليًا — SHA `446ebf03d5f3425b76cf5807afee3bf203e01cf6` — ويحتوي على routes:
- `/v1/edge/orders/02cr/page`
- `/v1/edge/orders/service/page`
- `/v1/edge/orders/session`
- `/v1/edge/customers/search`
- `/v1/t12/customers/write`
- `/v1/t12/orders/read-overlay`
- `/v1/t12/orders/line-runtime/update`
- `/v1/t12/orders/line-runtime/notify`
- `/v1/t12/orders/create`
- `/v1/t12/orders/create/health`

كما يحتوي recovery/guard logic منها:
`recoverPostWriteBarrier`, `postWriteBarrierActive`, `validateRequiredMirrors`, `edgeCustomerSearch`, `edgeCustomerWrite`, `t12CreateManualOrder`, `resolveRegisteredCustomerForCloud`.

**تصنيف:** **LIVE** لمسار Orders/Customer Search/Create المثبت في §1 من الكتاب؛ fallback/legacy helper الموجود داخل الملف لا يُصنف سلطة حالية إلا حسب flags/runtime.

### 7.5 Employee API dispatcher / Auth

`employee-api-dispatcher-v1.js` يعرّف:
- `/v1/employee/auth/login`
- `/v1/employee/auth/logout`
- `/v1/employee/auth/session`
- `/v1/employee/auth/password/change`
- `/v1/employee/legacy-action`

Cloud edge actions المعلنة داخله:
`searchCustomers`, `createCustomer`, `createManualOrder`, `getRowsPageV1931`, `updateLine`, `markCustomerNotified`.

لكن `config.js` يثبت حاليًا:
```js
MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = []
```

**تصنيف الملف:** **TRANSITIONAL/LIVE-loaded**. الكود محمّل في الواجهة، لكن native employee auth غير مفعّل، ومتسق مع `EMPLOYEE_LOGIN=GOOGLE_BACKED` في الكتاب الحي.

### 7.6 Dynamic modules المحمّلة من config.js

تمت قراءة محتوى كل الوحدات التالية:

| الملف | SHA | الحالة/الدور |
|---|---|---|
| `trendos-resume-no-autorefresh-v1.js` | `6b906e25b77c5f933a96a257a3abc11a0fb0ef0c` | LIVE frontend guard؛ يمنع legacy safeRefresh عند الرجوع |
| `attendance-v1.js` | `4472b66306a31c365a5a3e2b98e73dece85e93f1` | LIVE-loaded UI؛ backend authority ما زال ضمن Zero-Google المفتوح |
| `attendance-live-timer-v1.js` | `5ea10dd93112723e86d4884e012778337312a9a6` | LIVE-loaded attendance timer |
| `attendance-clockin-ui-v1.js` | `05aaa138b4d134d6573dfc810f6c3e2e5685468b` | LIVE-loaded clock-in UI |
| `employee-prayer-prep-v1.js` | `ab375bd8af4e2f22beaccb7ae42e8160cce40c2f` | LIVE-loaded employee reminder/prep |
| `employee-cleaning-prep-v1.js` | `76a4e492f90ddef8ecb4ea24c5426b9206edec67` | LIVE-loaded cleaning prep UI |
| `hr-v1.js` | `002685be3041a2cf4b077e30f344a38981282011` | LIVE-loaded HR UI؛ backend migration open |
| `press-control-v1.js` | `3a35c53400932052923f2d4372c6b7d9b69a9377` | LIVE-loaded Press control UI |
| `trend-master-resilience-v1931.js` | `105facf54f263ab2eb2fa1a014afb3651b251232` | LIVE-loaded panel resilience/interceptor |
| `manager-center-v1932.js` | `d15220375ec88551f96386a5aaff17d660a1f9f1` | LIVE-loaded manager center |
| `customer-manager-v1.js` | `9627116f22f00eb5d7282638c19dbe95d89332f7` | LIVE-loaded customer manager UI; detailed backend authority pending B06 |
| `customer-feedback-v1.js` | `2426aec33e79f1e16615ad1263fa8244d4742c45` | LIVE-loaded, but auto-scan flag = false |
| `employee-manager-strips-v2.js` | `f4697c717f40fc4cb0c8563b8b62640aa2a05785` | LIVE-loaded manager strips |
| `employee-manager-strips-drag-v2.js` | `b57c93df48378c588b15b6d6d07b7131a453b09e` | LIVE-loaded UI drag/persistence |
| `employee-andon-v1.js` | `ca0e57973b6547735333ab2a5d8a1e118a4efcac` | LIVE-loaded Andon UI |
| `go-live-autopilot-v1.js` | `07e79efe9dc2f72d681820355d1044d6a1713db1` | LIVE-loaded; auto sweep = false |
| `operations-hub-v1.js` | `6c5220daefeb331c9dd6afd948342780c0dafee7` | LIVE-loaded operations hub |

### 7.7 Flags مثبتة من config.js

```ini
MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=true
MATBAGY_EDGE_ORDERS_CANARY_ONLY=false
MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
MATBAGY_ATTENDANCE_V1=true
MATBAGY_ATTENDANCE_CLOCKIN_V1=true
MATBAGY_PRAYER_PREP_V1=true
MATBAGY_CLEANING_PREP_V1=true
MATBAGY_HR_V1=true
MATBAGY_PRESS_CONTROL_V1=true
MATBAGY_MANAGER_CENTER_V1932=true
MATBAGY_CUSTOMER_MANAGER_V1=true
MATBAGY_CUSTOMER_FEEDBACK_V1=true
MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1=false
MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2=true
MATBAGY_EMPLOYEE_MANAGER_STRIPS_DRAG_V2=true
MATBAGY_EMPLOYEE_ANDON_V1=true
MATBAGY_GO_LIVE_AUTOPILOT_V1=true
MATBAGY_GO_LIVE_AUTOPILOT_AUTO_SWEEP_V1=false
MATBAGY_OPERATIONS_HUB_V1=true
```

### 7.8 Zero-Google findings من الواجهة

تم العثور على مراجع Google ما زالت موجودة في source:
- `index.html` يحمل Google Fonts من `fonts.googleapis.com` و`fonts.gstatic.com`.
- `config.js` يحتوي `TRENDOS_SHEET_URL` إلى Google Sheets كوصلة.
- `app.js` يحتوي Google Drive thumbnail URL لبعض الصور.

هذه **ليست تلقائيًا نفس معنى Google business authority**، لكنها يجب أن تدخل final Zero-Google runtime audit حسب تعريف الهدف المطلوب (business authority فقط أم zero Google network dependencies بالكامل).

### 7.9 نتيجة B01

- ملفات frontend المقروءة فعليًا في B01: **27 ملفًا**.
- نقطة الدخول + التحميل المباشر + dynamic modules تم توثيقها.
- API action list الأساسية مستخرجة من `app.js`.
- Orders/Customer Cloud edge route map موثق.
- Auth dispatcher موثق مع إثبات أن native employee auth ما زال OFF.
- نقطة الاستئناف التالية: **B02 — Cloudflare D1 primary worker/src**.


## 8) B02 — Cloudflare D1 primary worker/src — DONE

### 8.1 Production entrypoint الفعلي في المصدر

تمت قراءة:
- `cloudflare-d1/wrangler.toml` — SHA `e519c37a12d68db4d575f3ed81200eba76a557f6`
- `cloudflare-d1/production-shadow/index.js` — SHA `cabf0237c3aea2479b56ab237eeb9877c86254a4`
- `cloudflare-d1/src/index_v2.js` — SHA `0516f88f96d21bb66a55c516a71842c80bc5b8a0`
- `cloudflare-d1/src/index.js` — SHA `b789a87377b769536f422b991ac5485e58c5c3b2`
- `cloudflare-d1/wrangler.frontend.toml` — SHA `335152e5a70870b7daf7718e295192cf3d686816`
- `cloudflare-d1/src/frontend-static-worker.mjs` — SHA `f30211922a65f39dfcd4fe1ec166f89570f12f43`

API config يحدد:
```toml
name = "trendos-d1-api"
main = "production-shadow/index.js"
database_name = "trendos-main"
```

وبالتالي سلسلة الـAPI source هي:
`production-shadow/index.js -> src/index_v2.js -> route modules -> src/index.js base`.

Frontend config يحدد:
`trendos-ui -> src/frontend-static-worker.mjs -> ASSETS`.

### 8.2 Flags المصدر في wrangler.toml

```ini
TRENDOS_CLOUD_WRITE_V1_ENABLED=false
TRENDOS_PRODUCTION_SHADOW_V2_ENABLED=true
TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED=false
TRENDOS_R4_RECOVERY_ENABLED=false
TRENDOS_R5_PERIODIC_ENABLED=false
TRENDOS_T12_PROD_CREATE_CANARY_ENABLED=false
TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED=true
TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED=true
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
```

هذه **source config evidence** وليست بديلًا عن runtime vars الفعلية. بالنسبة لـEmployee Auth تتفق مع آخر runtime evidence في الكتاب: native OFF.

### 8.3 Production router map

`production-shadow/index.js` يمر أولًا على:
1. T12 production create canary.
2. R4 recovery.
3. R5 periodic recovery.
4. production reconcile qualification.
5. production shadow observer.
6. ثم `core.fetch()` من `src/index_v2.js`.

`src/index_v2.js` يوجّه إلى:
- legacy browser transport
- employee native auth
- employee legacy bridge
- cloud session bridge
- Accounting native/preview
- customer search
- Service Orders
- 02CR Orders
- general Edge Orders
- T12 read overlay
- T12 operational runtime
- T12 general CREATE
- T12 customer write
- Operator Tasks edge
- generic edge gateway
- cloud write gate
- normalized import
- mirror delta
- mirror reads
- base API.

### 8.4 الوحدات المقروءة فعليًا في route chain

| الملف | SHA | أهم route/role | تصنيف الحالة |
|---|---|---|---|
| `production-shadow/observer.mjs` | `72dd06bda31e6f9e2db1bb47c8cccb3b49302fb6` | `/v1/cloud/write/v2/production-shadow` | TRANSITIONAL; source flag ON، authority لا تُستنتج |
| `cloud-write-production-reconcile-qualification.mjs` | `5154337c78d5c4074fe2fb6172d83aee69e5f0bf` | qualification reconcile | CANDIDATE/OFF |
| `r4-guarded-recovery-production.mjs` | `e328a6b336a0a6510c0bef5aebb30ab8b5c61073` | admin recovery | CANDIDATE/OFF |
| `t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs` | `4f79b574f4dfd9fea271dcf66e963154124450df` | periodic recovery | CANDIDATE/OFF |
| `t12-production-create-canary-handler.mjs` | `853c234ab85ea00a83a8ced4cec6a0b3cce4cbf5` | create-canary | HISTORICAL/CANDIDATE; flag OFF |
| `legacy-browser-transport-v1.mjs` | `0e308a5a55d54d6feb934d89072b9346b6d4ab57` | `/v1/legacy-api` -> Apps Script upstream | **TRANSITIONAL + LIVE-used for unmigrated actions** |
| `mirror-gate.mjs` | `d9321c3a9c1678fd7a53abc6a24df73dbee25ebc` | mirror/import read controls | TRANSITIONAL/admin path |
| `mirror-delta-gate.mjs` | `7822080e6f615d34065b0f2bc042c438443431de` | `/v1/mirror/delta` | TRANSITIONAL/admin path |
| `edge-gateway.mjs` | `db88e925cbda3ab9a9597860248a3faffa54a8ac` | edge health/session/customer-manager | LIVE route infrastructure; per-feature authority separate |
| `edge-customer-search-v1.mjs` | `35d957a524d5cd262e44a838f3d6a1a307de9917` | `/v1/edge/customers/search` | **LIVE** customer search path |
| `cloud-session-bridge-v3.mjs` | `7b9ad0dd88a22251ed4937d85dbd65fc5605cd3c` | edge session bridge | TRANSITIONAL |
| `employee-auth-native-v1.mjs` | `e7bb20287efa16366fbd267251217fde90a33958` | employee native auth family | CANDIDATE/foundation; OFF |
| `employee-legacy-bridge-v1.mjs` | `e317c9692970d8f31b2980fa07b692e882911928` | `/v1/employee/legacy-action` | CANDIDATE/foundation; OFF |
| `operator-task-edge-v2.mjs` | `7ef7aa4a52246d6423ccd8c27c9457b76bcc8643` | operator task facade | TRANSITIONAL; edge enabled, Apps Script task write authority per code |
| `edge-orders-read-v1-canary.mjs` | `8e43f6ad7e802f181d1ffe7a2a380020c3c55d4d` | `/v1/edge/orders/page` + session | LIVE route family |
| `edge-orders-read-02cr-freshness.mjs` | `5754ddc481b65465bf997842cef3f41ac14ff0fd` | production-read freshness wrapper | LIVE route family |
| `edge-orders-service-v1.mjs` | `3108fb8a82dcf6c7ab7bf251ae8e6576c0a73472` | `/v1/edge/orders/service/page` | LIVE route family |
| `edge-orders-line-id-repair-02cx.mjs` | `5a1690371008e628746c7b300b150d9a313b8836` | Line-ID repair before response | LIVE helper in 02CR chain |
| `edge-orders-freshness-gate.mjs` | `34fe30371fa94b616a9c6555f40097a3ff26e7d4` | Orders mirror readiness/freshness | LIVE guard |
| `edge-orders-idle-verifier.mjs` | `fbb8e257e61e4d6c54c5079a34f0bc8e63fa2842` | Apps Script heartbeat verifier | TRANSITIONAL dependency until Zero-Google |
| `t12-read-overlay-handler.mjs` | `0fc291e51ee832a71bb39cb329e76e916a9ff894` | `/v1/t12/orders/read-overlay` | LIVE T12 read path |
| `t12-operational-runtime-handler.mjs` | `94fbb0648025ca96af7a1d624b25b7c270ccde03` | line runtime update/notify | LIVE T12 operational path |
| `t12-general-create-handler.mjs` | `1acf27e9b0798bb0c0332a08d8e802d1e8edf0fc` | `/v1/t12/orders/create` | **LIVE** GENERAL create route |
| `t12-customer-write-handler.mjs` | `3e604ac731a53b3c8e00994ba9fd0f32c9da4a69` | `/v1/t12/customers/write` | **LIVE** customer write family per book baseline |
| `cloud-write-gate.mjs` | `677e1f6c2478a6e225b9d6b75f0aa0e0680331b2` | generic cloud write gate | OFF / not current authority |
| `normalized-import-gate.mjs` | `116398e82baae83260a5698e4a8e859665a9a68e` | protected normalized import | admin/migration route; not business authority |
| `accounting-preview.mjs` | `e09525d9faf1419599ccfd729d8fa2bf1fe21552` | accounting preview | CANDIDATE/integration; detailed authority B07 |
| `accounting-native-module.mjs` | `65ebbbf37a0cff1bc807bd3f434eaf7b1282d05d` | native accounting router | CANDIDATE/integration; detailed authority B07 |

### 8.5 Employee auth tables/code موجودة لكن السلطة لم تنتقل

`employee-auth-native-v1.mjs` يتعامل مع:
- `employee_auth_control_v1`
- `employee_auth_users_v1`
- `employee_auth_sessions_v1`

Routes:
`/login`, `/session`, `/logout`, `/password/change`, `/health`, `/enroll-legacy-session`.

لكن كل employee-native cutover flags في المصدر OFF، لذلك:
**وجود tables + routes + implementation = foundation فقط، وليس دليلًا على أن Login أصبح D1-native.**

### 8.6 Transitional Google dependencies المرئية داخل Cloud worker

تم إثبات source dependencies إلى `APPS_SCRIPT_API_URL` في:
- `legacy-browser-transport-v1.mjs`
- `edge-gateway.mjs`
- `cloud-session-bridge-v3.mjs`
- `employee-auth-native-v1.mjs` (bootstrap/transitional paths)
- `employee-legacy-bridge-v1.mjs`
- `operator-task-edge-v2.mjs`
- `edge-orders-idle-verifier.mjs`

وبالتالي Zero-Google لم يُغلق هندسيًا حتى لو كانت Orders CREATE/Customer master Cloud-native.

### 8.7 D1 tables الظاهرة من route modules المقروءة

من القراءة المباشرة ظهرت عائلات:
- `sheet_catalog`, `sheet_rows` — mirror/read legacy parity layer.
- `orders`, `customers`, `messages`, `conversations`, `migration_runs` — normalized/base data.
- `t12_prod_orders`, `t12_prod_lines`, `t12_prod_line_runtime`, `t12_prod_runtime_events`.
- `t12_prod_general_create_control`, `t12_prod_create_control`.
- `employee_auth_control_v1`, `employee_auth_users_v1`, `employee_auth_sessions_v1`.
- `cloud_write_outbox`, `cloud_write_events`.

التعريف الدقيق للأعمدة والعلاقات ينتقل إلى B03 migrations/schema.

### 8.8 نتيجة B02

- ملفات Cloudflare entry/router/modules المقروءة فعليًا: **34 ملفًا**.
- Production source entrypoint تم تثبيته من `wrangler.toml`.
- route chain الفعلي تم رسمه من `production-shadow/index.js` و`index_v2.js`.
- تم فصل المسارات LIVE عن OFF/CANDIDATE/TRANSITIONAL حسب flags + الكتاب الحي.
- تم تحديد Google transitional dependencies داخل worker.
- نقطة الاستئناف التالية: **B03 — D1 migrations/schema**.


## 9) B03 — D1 migrations/schema — DONE

تمت قراءة جميع migrations الحالية `0001..0010` وجميع ملفات `cloudflare-d1/schema-prep/` الموجودة في الجرد.

### 9.1 Migrations المطبقة/المسجلة في السلسلة الحالية

| Migration | SHA | الجداول الأساسية | الحالة الهندسية |
|---|---|---|---|
| `0001_init.sql` | `49c58dd275f8364d0632fabd669ef48b562ea895` | customers, orders, messages, conversations, migration_runs | DEPLOYED schema baseline |
| `0002_full_sheet_mirror.sql` | `1857534062b93eb24adbacdf7d3234bcaae69384` | sheet_catalog, sheet_rows, sheet_migration_runs | DEPLOYED mirror baseline |
| `0003_cloud_write_lane.sql` | `b4c81348f9b1e79519130033b5b1dffcc86eaa0b` | cloud_write_events, cloud_write_outbox | DEPLOYED schema; generic lane not current authority |
| `0004_cloud_auth_shadow_v1.sql` | `e514e4675a89c9eb801e4bfd971d640c6f6a01df` | cloud_auth_sessions_v1 | DEPLOYED shadow foundation |
| `0005_t12_production_create_canary.sql` | `95224bb1afa50a6344fd0cf755a40d20ca7b9a6a` | t12_prod_create_control/request_ledger/orders/lines/events/outbox | DEPLOYED T12 create foundation |
| `0006_t12_operational_runtime.sql` | `b2e3431f5132872658d81f065624b0a6e69da2ac` | t12_prod_line_runtime, t12_prod_runtime_events | DEPLOYED operational overlay |
| `0007_t12_general_create_control.sql` | `b21d0f63c6b7bfe5dce3fdc377d9dc8e6170b6af` | t12_prod_general_create_control | DEPLOYED general-create control |
| `0008_t12_customer_master.sql` | `c638b2afca70471c9916d6f644111cdce1157b45` | t12_customer_control/customers/request_ledger/events | DEPLOYED customer master |
| `0009_employee_auth_native_v1.sql` | `20739798d691286b47918299c099049cbcf50c46` | employee_auth_control/users/sessions | DEPLOYED schema foundation; runtime authority still OFF |
| `0010_t12_duplicate_order_guard.sql` | `b1a77430716a78bac85910138e40b0dea72291b2` | t12_prod_duplicate_order_guard | **DEPLOYED and verified in Entry593** |

مرجع الحالة الحية في الكتاب يقول إن `0010` applied ولا توجد pending migrations بعد Entry593. لذلك migrations السابقة جزء من schema lineage الحالي؛ لكن وجود الجدول لا يعني أن كل feature الذي يستخدمه مفعّل.

### 9.2 T12 Orders schema

`0005` ينشئ:
- `t12_prod_create_control`: sequence/budget/policy epoch.
- `t12_prod_request_ledger`: idempotent request key وربطه بـOrder ID.
- `t12_prod_orders`: رأس الأوردر.
- `t12_prod_lines`: السطور مع `UNIQUE(request_key, ordinal)`.
- `t12_prod_events`: أحداث create.
- `t12_prod_outbox`: outbox لكل line/event.

`0006` يفصل الحالة التشغيلية القابلة للتغيير عن create facts:
- `t12_prod_line_runtime`: status/notes/customer notification/WhatsApp/version.
- `t12_prod_runtime_events`: audit event لكل تغيير.

الحالات المسموحة في runtime:
`طلب جديد`, `بدأ التنفيذ`, `تحت التنفيذ`, `جاهز للاستلام`, `تم التسليم`, `متوقف`, `مكرر`, `ملغى`.

### 9.3 Customer master schema

`0008`:
- control mode: `OFF | CANARY | GENERAL`.
- `t12_customers` يحمل الهوية، الاسم normalized key، أرقام الهاتف، النوع، الدين، الفرع، legacy codes، source، version.
- source مقيد إلى `legacy-mirror | cloud-native`.
- indexes للاسم والهاتف/الهاتف الإضافي والحالة.
- request ledger لأوامر CREATE/UPDATE.
- customer events لأحداث create/update/bootstrap.

هذا schema هو أساس Customer master الذي يسجل الكتاب أنه GENERAL حاليًا.

### 9.4 Employee native auth schema

`0009`:
- control mode: `OFF | TRANSITIONAL | NATIVE`.
- users لا يخزنون plaintext؛ الحقول هي scheme/iterations/salt/hash.
- sessions تخزن `token_fingerprint` لا raw token.
- session_version/revocation/expiry موجودة.
- default control = OFF.

**النتيجة:** schema آمن وموجود، لكن authority لم تنتقل لأن runtime flags ما زالت OFF.

### 9.5 Duplicate-order guard schema

`0010`:
- `fingerprint` = PRIMARY KEY.
- `request_key` = UNIQUE.
- `order_id`.
- `canonical_business_json`.
- `claimed_at_ms`, `expires_at_ms`.
- expiry index.

المعنى: الحارس يحتجز fingerprint للعملية خلال نافذة زمنية ويمنع طلب business-equivalent آخر من المرور كأوردر جديد. Runtime baseline يثبت `DUPLICATE_GUARD_READY=YES` ونافذة 120000ms.

### 9.6 Base/mirror/cloud-write schema

- `0001`: normalized customer/order/message/conversation model + migration_runs.
- `0002`: raw/full-sheet mirror layer: `sheet_catalog`, `sheet_rows`, `sheet_migration_runs`.
- `0003`: cloud write events/outbox، لكنه ليس authority الحالية لمجرد وجوده.
- `0004`: bounded employee auth shadow session fingerprints.

هذا يشرح وجود نموذجين متوازيين تاريخيًا:
1. normalized/native data.
2. sheet-mirror parity layer.
T12 native tables أصبحت طبقة business authority للأجزاء التي تم cutover لها، بينما mirror ما زال ظاهرًا في بعض read/transitional paths.

### 9.7 schema-prep — غير مطبق كـmigration

تمت قراءة 6 ملفات prepared schema، وكلها منفصلة عمدًا عن `migrations/`:

| الملف | SHA | الحالة |
|---|---|---|
| `accounting-finance-v1.sql` | `8d3a76316e7da9b0989dfe88d1abec329aeaa784` | **PREPARED ONLY — DO NOT APPLY** |
| `accounting-operations-v1.sql` | `eebf6b188ef50198222f2272e759259006a8aaa1` | **PREPARED ONLY — DO NOT APPLY** |
| `t12-business-create-candidate-v1.sql` | `d524796ee052162f89c403ea4c74f9e1728aaa11` | isolated candidate only |
| `t12-cloud-native-synthetic-create-v1.sql` | `a3aaee2c24aa90f7f54f723a65b2e15185f0e84f` | synthetic qualification only |
| `t12-order-create-shadow-v1.sql` | `17d89f4cc122ae259207650ff42d15003b46a2f4` | shadow prep only |
| `t12-order-id-authority-v1.sql` | `4fd9eb7cf2c9abc24841cde9c4b6edaebe26a150` | isolated sequence candidate |

Accounting finance prep يتضمن append-only journals/entries/idempotency/audit triggers التي تمنع UPDATE/DELETE، لكنه **ليس production schema** حتى يتم cutover منفصل.

### 9.8 نتيجة B03

- ملفات migration/schema المقروءة فعليًا: **16 ملفًا**.
- تم فصل applied migration lineage عن prepared-only schema.
- تم رسم عائلات D1 الأساسية وعلاقات T12 Orders/Runtime/Customers/Auth/Duplicate Guard.
- لم يتم تحويل prepared accounting schema إلى deployed state.
- نقطة الاستئناف التالية: **B04 — Apps Script + Code.gs families**.


## 10) B04 — Apps Script + Code.gs families — DONE

### 10.1 Code.gs الحالي

تمت قراءة `Code.gs` — SHA `e91d78dcceeeca2804e721d58e065a6a7181bfc2`.

خصائص الملف:
- الحجم: نحو 694 KB.
- الأسطر: 12,556.
- الدوال top-level المستخرجة: **644**.
- action/route-like names المستخرجة: **185**.
- Sheet constants الصريحة: **39**.
- Script Properties المستخدمة: **21**.

أول تعليق في الملف يعرّفه كـ:
`TrendOS + EasyStore unified Google Apps Script backend — V1932 FULL Go-Live / HR / WhatsApp / Attendance / Press`.

### 10.2 Entry routing في Apps Script

`doGet(e)`:
1. يستدعي `trendosV1932TryRoute_`.
2. ثم V1900 router.
3. ثم V1898 router.
4. ثم legacy/general action dispatcher.

`doPost(e)`:
1. يفك JSON payload.
2. يعالج مبكرًا `cloudEmployeeLegacyBridgeExecuteV1`.
3. ثم V1932/V1900/V1898.
4. ثم upload/write actions أو يرجع إلى `doGet` كـPOST.

### 10.3 Legacy Order CREATE fence

`Code.gs` يحتوي:
```js
TRENDOS_LEGACY_ORDER_CREATE_DISABLED_V1 = true
```

والـactions المحظورة تشمل:
- `createOrder`
- `createMatbagyOrder`
- `clientCreateOrder`
- `createCustomerPortalOrder`
- `submitCustomerDraft`
- `createManualOrder`
- `trendosCustomerDraftSubmitV1`

الرسالة ترجع `T12_CLOUD_ORDER_ID_AUTHORITY`.

**التصنيف:** هذا جزء **LIVE safety fence** يمنع Apps Script من إصدار official Order IDs بعد Cloud CREATE cutover.

### 10.4 V1932 integrated route families

داخل `Code.gs` route table:
- `attendanceV1`
- `attendanceClockinV1`
- `customerManagerV1`
- `customerFeedbackV1`
- `hrV1`
- `cleaningV1`
- `pressControlV1`
- `goLiveAutopilotV1`

هذه الدوال موجودة فعليًا داخل single-file build الحالي.

### 10.5 Google Sheets surface داخل Code.gs

تم العثور على 39 Sheet constants صريحة، أهمها:
- `المستخدمين`
- `بنود الأوردرات`
- `الأوردرات`
- `العملاء`
- `سجل حركة الأوردرات`
- `سجل تنبيهات التشغيل`
- `تقييم الموظفين اليومي`
- `معرفة واتس AI`
- `إعدادات واتس AI`
- `سجل واتس AI`
- `حسابات - الخامات`
- `حسابات - البنود الثابتة`
- `حسابات - فواتير الأقسام`
- `حسابات - الفواتير النهائية`
- `حسابات - حركة المخزون`
- `مسودات طلبات العملاء`
- `محادثات الأوردرات`
- `مدير العملاء - المحادثات`
- `مدير العملاء - الرسائل`
- `تقييم العملاء`
- `سجل الدوام`
- `تشغيل - النظافة اليومية`
- Marketplace / Franchise / White-label / Platform sheets.

هذه القائمة هي خريطة واضحة لما **ما زال Apps Script قادرًا على التعامل معه**؛ لا تعني أن كل هذه العائلات ما زالت authority الحالية.

### 10.6 Script Properties / integrations

من `Code.gs`:
- `EMPLOYEE_DEFAULT_PASSWORD`
- `TRENDOS_SPREADSHEET_ID`
- `AUTH_PASSWORD_PEPPER`
- `SESSION_TTL_HOURS`
- `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED`
- `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`
- `CUSTOMER_FILES_ROOT_FOLDER_ID`
- `OPENAI_API_KEY`
- `OPENAI_CUSTOMER_MODEL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_VERIFY_TOKEN`
- `TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET`
وغيرها.

External integrations الظاهرة:
- OpenAI Responses API.
- Meta/WhatsApp Graph API.
- Google Drive thumbnail/files.
- Aladhan prayer timings.
- legacy portal URL.

### 10.7 Employee legacy bridge داخل Apps Script

`trendosCloudEmployeeLegacyBridgeExecuteV1_`:
- يرفض forbidden actions.
- يتحقق من Cloud assertion.
- لا يمرر raw employee token إلى action.
- يضع temporary cloud employee context.
- يعيد التوجيه داخليًا إلى `doGet`.

`authorize_` يستطيع قبول `authSource="cloudflare-d1-native-v1"` عندما يكون bridge context صالحًا، وإلا يستعمل stored Apps Script employee session.

لكن بما أن Cloud/Frontend bridge flags ما زالت OFF، فهذا **foundation/transitional code وليس authority الحالية**.

### 10.8 ملفات Apps Script المساندة

تمت قراءة:
- `v1932-router.gs` — SHA `313dfc1eacaa8a5369ff9e0b97a0294a2df5420a`.
- `v1940-deploy-health.gs` — SHA `41e57f19de8e865888a1b8bad2cc478c44c438c3`.
- `build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.manifest.json` — SHA `39540d2862a035e426326b13a10c3f46bb097786`.
- `APPS_SCRIPT_DEPLOY_V1940.md` — archive redirect فقط.
- `README_V1931.md` — archive redirect فقط.
- `V1932_RELEASE.md` — archive redirect فقط.

`v1932-router.gs` هو source adapter منفصل، لكن Production lineage الحالي موثق على single-file `Code.gs`; لذلك لا يُعتبر الملف المنفصل deployment authority وحده.

الـV147 manifest = **HISTORICAL prepared candidate**, وليس تعليمات نشر حالية.

### 10.9 apps-script/patches

تمت قراءة جميع الملفات الـ18 تحت `apps-script/patches/`.

عائلاتها:
- Cloud Write V2 staging canonical adapter/auth bridge/first-write/preflight/recovery/side-effect qualification.
- Production reconcile qualification.
- Reconcile dry-run/rehearsal/self-test/staging pull.
- Timeout hotfix V1/V2.
- Save timeout hotfix V3.
- D1 Orders low-usage heartbeat documentation.

**التصنيف العام:** معظمها **CANDIDATE/HISTORICAL qualification tooling** وليست ملفات منفذة تلقائيًا في Production.

نتيجة مقارنة أسماء الدوال مع single-file `Code.gs`:
- `trendosCloudWriteReconcileDryRunV1_` موجود داخل `Code.gs`.
- V1932 Attendance/Cleaning/Press/HR functions موجودة داخل `Code.gs`.
- أسماء health الخاصة بTimeout V2 وSave Hotfix V3 ليست موجودة بنفس الاسم في `Code.gs`.
- Staging Bridge V2 function غير موجودة بنفس الاسم في single-file.

المعنى: لا يجوز افتراض أن patch file مستقل = deployed source. يجب تتبع ما تم دمجه فعليًا داخل `Code.gs` أو runtime.

### 10.10 Deployment docs القديمة

`APPS_SCRIPT_DEPLOY_V1940.md`, `README_V1931.md`, `V1932_RELEASE.md` أصبحت redirect files إلى archive وتقول صراحة:
**Do not execute historical deployment instructions from this document.**

لذلك تصنيفها = **HISTORICAL LINK COMPATIBILITY**.

### 10.11 نتيجة B04

- ملفات مقروءة فعليًا في B04: **25 ملفًا**.
- single-file Apps Script الحالي تم تحليل router/actions/functions/sheets/properties.
- Order CREATE fence تم إثباته.
- bridge architecture موثقة مع فصل foundation عن runtime authority.
- patch family بالكامل تمت قراءتها وتصنيفها.
- نقطة الاستئناف التالية: **B05 — Attendance/Cleaning/HR/Press**.


## 11) B05 — Attendance / Cleaning / HR / Press — DONE

تمت قراءة ملفات backend المنفصلة ووثيقة Attendance integration:
- `attendance-backend-v1.gs` — SHA `0b77ff05442cff00903274679c0b049f3f8c4285`
- `attendance-clockin-backend-v1.gs` — SHA `a153c377da0f7d1997bba4f309a1b076a7ef5df8`
- `cleaning-backend-v1.gs` — SHA `700e03200fc810ffa00240e8a5f8cd33990c2573`
- `hr-backend-v1.gs` — SHA `5c9dca6b65d9aab4e836b6ed3ec314737f848c2d`
- `press-control-backend-v1.gs` — SHA `ba544600f19bd5ea59dbf7efcde9440a0c758b97`
- `go-live-autopilot-v1.gs` — SHA `78a7fd85d542c6183d9a3787379269a950737c22`
- `ATTENDANCE_V1_INTEGRATION.md` — SHA `d9d01f9349e544be12c97964dc96fcea76a88b82`

### 11.1 Attendance

`attendance-backend-v1.gs` يوفر native family:
- start/pause/resume/rest/end.
- presence pulse.
- state computation.
- productivity fallback.
- prayer timing helper.
- sheets: `سجل الدوام`, `نبض الحضور`, `إعدادات الدوام`, ويقرأ `سجل حركة الأوردرات`.

`attendance-clockin-backend-v1.gs` يسجل أول حضور يومي مقابل schedule ويعتمد على:
- `تشغيل - مواعيد خاصة`
- `إعدادات الدوام`
- `سجل الدوام`.

وثيقة `ATTENDANCE_V1_INTEGRATION.md` تصف نسخة أقدم Hybrid fallback إلى `saveMatbagyNote/getMatbagyNotes/getActivityLog` وتقول إن backend الأصلي "اختياري لاحقًا". **هذه العبارة لم تعد تمثل single-file repo الحالي بالكامل** لأن `Code.gs` الحالي يحتوي فعليًا `attendanceV1_` و`attendanceClockinV1_` داخل V1932 router.

**التصنيف الحالي:** frontend module LIVE-loaded؛ Apps Script backend موجود داخل single-file؛ لكن العائلة ما زالت ضمن Zero-Google open dependencies ولا تُصنف D1-native.

### 11.2 Cleaning

`cleaning-backend-v1.gs`:
- action family `cleaningV1_`.
- يكتب/يقرأ `تشغيل - النظافة اليومية`.
- frontend counterpart محمّل عند `MATBAGY_CLEANING_PREP_V1=true`.

**التصنيف:** LIVE frontend + Apps Script-backed family؛ TRANSITIONAL بالنسبة لهدف Zero-Google.

### 11.3 HR

`hr-backend-v1.gs`:
- employee self-service + admin HR records.
- route family `hrV1_`.
- sheet أساسي ظاهر: `HR - الموظفين`.
- التعليق داخل المصدر يثبت أن **قرارات التوظيف عالية الأثر لا يتم أتمتتها** داخل هذه الوحدة.

**التصنيف:** LIVE-loaded UI + Apps Script backend؛ TRANSITIONAL حتى Cloud cutover مستقل.

### 11.4 Press

`press-control-backend-v1.gs`:
- queue/status/start/stop session logic.
- sheets: `تشغيل - جلسات المكبس`, `تشغيل - إعدادات المكبس`.
- يحمل schedule/مدة التشغيل/قدرة المكبس والطاقة التقديرية.
- permission message في المصدر يقيد التشغيل لريڤان/وائل/الإدارة.

**التصنيف:** LIVE-loaded frontend + Apps Script backend؛ TRANSITIONAL لZero-Google.

### 11.5 Go-Live Autopilot

`go-live-autopilot-v1.gs`:
`Ready -> Draft Invoice -> Final Invoice -> WhatsApp`.

قاعدة أمان صريحة في المصدر:
**تغيير الموظف للأوردر إلى Ready لا ينفذ financial posting تلقائيًا.**
Ready ينشئ/يحدّث draft فقط، وfinalization يعيد استخدام `saveAccountingFinalInvoice_` وصلاحيات/Idempotency الحسابات الحالية.

Frontend file محمّل، لكن `MATBAGY_GO_LIVE_AUTOPILOT_AUTO_SWEEP_V1=false`.

### 11.6 العلاقة مع Code.gs

هذه ملفات modular source مستقلة، لكن Production Apps Script lineage الحالي في الكتاب هو single-file `Code.gs` Version 159. لذلك:
- وجود ملف backend منفصل لا يعني أنه ملف مستقل داخل مشروع Apps Script Production.
- الدوال الرئيسية لهذه العائلات موجودة داخل `Code.gs`.
- الصيانة يجب أن تبدأ من single-file qualified lineage ثم تستخدم الملفات المنفصلة كمرجع/وحدة مصدر عند الحاجة، لا كدليل نشر مستقل.

### 11.7 نتيجة B05

- ملفات مقروءة فعليًا: **7**.
- Attendance/Cleaning/HR/Press/Autopilot تم ربطها بالواجهة وبـApps Script.
- تم رصد توثيق Attendance الهجين القديم وتصحيحه مقابل الواقع الحالي في `Code.gs`.
- نقطة الاستئناف التالية: **B06 — Customers / Feedback / Manager**.
