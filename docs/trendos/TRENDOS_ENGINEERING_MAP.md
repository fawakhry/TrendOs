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
| B02 | Cloudflare D1 primary worker/src | 0 | PENDING |
| B03 | D1 migrations/schema | 0 | PENDING |
| B04 | Apps Script + Code.gs families | 0 | PENDING |
| B05 | Attendance/Cleaning/HR/Press | 0 | PENDING |
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
