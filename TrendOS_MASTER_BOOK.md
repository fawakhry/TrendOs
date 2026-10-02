# TrendOS — الكتاب الرئيسي القابل للتحديث

> **MASTER BOOK / Active Zero-Google Core**  
> إصدار الكتاب: **4.10-ZERO-GOOGLE-COMPACT — Entry595 baseline** · تاريخ التنظيف: 2026-10-02 · المستودع: `fawakhry/TrendOs` · فرع العمل: `candidate/t12-full-cloud-cutover-a56-20260929`.

> **الغرض الحالي:** هذا الكتاب يصف **الحالة الحية، ما انتقل فعليًا من Google إلى Cloudflare/D1، وما بقي لإتمام Zero-Google**. التفاصيل التاريخية لمسارات Google التي أُغلقت أو استُبدلت لا تُكرر هنا؛ تبقى محفوظة في Git history والصندوق الأسود ووثائق الـEntry التفصيلية.

> **قاعدة الدليل:** `LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`. لا تعتبر الخطة أو الكود الموجود في GitHub إثباتًا لحالة Production.

> **قاعدة التسجيل:** كل خطوة جديدة تؤثر في Repo / Cloudflare / D1 / Apps Script / Production تُسجل هنا فورًا بالحالة الفعلية والدليل والخطوة التالية. لا تعيد نسخ سلسلة تاريخية كاملة إذا كانت النتيجة النهائية تكفي.

## 1. الحالة النشطة — Production baseline بعد Entry595

### Frontend
- Canonical frontend: Cloudflare Worker `trendos-ui`.
- Entry595 أثبت أن duplicate-order frontend message منشور ومتحقق مستقلًا.
- Active frontend version: `a26589a4-e2e0-4ed5-9abf-e1b19b56ce0e` عند 100%.
- Active frontend deployment: `21a12f7f-e323-4bc2-bb60-7ef4009d708e`.
- Qualified frontend source: `6a9cd90649cfa0ac75b25b725d53e9f779bb2c61`.
- Independent verify: run `36915414626`, job `110548061098` = SUCCESS.
- Root/config/edge/app = HTTP 200.
- Browser Refresh recovery وinitial Edge readiness وduplicate-order Arabic message كلها verified.
- GitHub Pages القديم ليس canonical entrypoint.

### API / D1
- Canonical API Worker: `trendos-d1-api`.
- Entry593: migration `0010_t12_duplicate_order_guard.sql` applied successfully.
- Active API version: `23be0ab2-0a2b-4b81-bf54-e2f05f847989`.
- Active API deployment: `b8497ee0-a487-43c8-bcb3-b3f3ab83d3ff`.
- Active API bundle SHA-256: `2b78dea01c7e5892460ead4581915da9982208d60a41a95ce903beb742698f67`.
- `ORDER_CREATE_MODE=GENERAL`.
- `DUPLICATE_GUARD_READY=YES`.
- Duplicate guard window = 120000 ms.
- `CUSTOMER_WRITE_MODE=GENERAL`.
- `LEGACY_BRIDGE_ENABLED=NO` في حالة Entry593.
- لا توجد pending migrations بعد تثبيت 0010 وفق postflight الخاص بـEntry593.

### Orders
- New Order CREATE authority يعمل Cloud-native على D1 في GENERAL.
- duplicate-order guard live في API والواجهة.
- refresh disappearance defect مغلق بعد owner acceptance + GET-only verification.
- لا تُعد أي historical Google Order writer أو canary أو staging workflow سلطة حالية.
- أي Legacy Orders action ما زال يظهر في Zero-Google audit يُعامل dependency متبقية حتى يثبت Runtime أنه أزيل.

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
