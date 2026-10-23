# Entry668 — قراءة رصيد العميل من EasyStore D1 بمعرّف موثق (OFF)

**التاريخ:** 23 أكتوبر 2026. **الحالة:** SOURCE ONLY / READ-ONLY PREVIEW / NO_GO. استكمال الفرع الموجود قبل انقطاع المحادثة، من غير البدء من الصفر أو تعديل EasyStore أو Printshop.

## ملكية النظام ومصدر البيانات

- EasyStore هو المالك الوحيد للحسابات. نستخدم **جدوله الموجود** `employee_accounting_party_balances_v1` المنشأ في migration `0024_employee_accounting_party_balances_v1.sql` و`employee_accounting_control_v1` من migration `0015...`.
- لا ننشئ جدول مديونيات جديدًا، ولا نعيد حساب رصيد من اسم العميل أو Ledger عمليات غير مكتمل.
- شرط `b.party_type='customer' AND b.party_id=a.customer_id` مع `a.customer_id` مشتق من **Native D1 session**، لا من request أو رقم الموبايل أو اسم العميل؛ يلزم إثبات مستقل أن EasyStore `party_id` يساوي نفس Customer ID فعلاً في الإنتاج.
- قراءة الحساب المالي تخضع أيضًا لبصمة جلسة HMAC D1، صلاحيتها وعدم إبطالها، نسخة كلمة المرور، تفعيل الحساب ومصدر العميل `cloud-native`، تطابق portal_code وعدم تكراره، و`customer_portal_native_control_v1.mode='GENERAL'`. كذلك `employee_accounting_control_v1.mode IN ('READONLY','GENERAL')`.
- **شروط الإفراج متعمدة:** `customerFinancialMappingAttested === true` و`easyStoreBalanceParityCertified === true`، لكن تلك Boolean inputs في النموذج غير المنشور ليست شهادة تشغيل حي. المنتج الفعلي يحتاج مصادقة تشغيل/موافقة مستقلة ومؤشرات زمنية لحداثة البيانات.
- يمنع عرض الرصيد إذا كان عمر آخر تحديث أكبر من 24 ساعة، أو رقمه/تقريبه بالقرش غير سليم، أو حالة الحساب/الماليات غير مصرح بها. عند عدم وجود row exact-ID لا يعتبر الرصيد صفرًا.
- الاستجابة هي `financialPreviewOnly=true`, `financeAuthoritative=false`, `financeWriteAuthorized=false`. لا تُعرض قيود الموردين أو ملاحظات الفواتير أو سجلات موظفين.

## حدود المصدر المؤكدة

`cloudflare-d1/src/customer-portal-easystore-finance-id-read-v0.mjs` محفوظ في GitHub لكنه **ليس مستوردًا من `index_v2.js`** ولا له مسار HTTP. لا تُطبق تغييرات D1 ولا تُرسل طلبات إلى Google أو EasyStore الإنتاج. هذا ليس تحويلًا حيًا للفعل `getCustomerPortalAccountsV1859` بعد.

## اختبارات المصدر

```bash
node --test tests/entry668_customer_finance_id_read_off.test.mjs
python3 tests/entry668_customer_finance_id_read_sqlite.test.py -v
```

اختبارات Node ترفض التخويل الذاتي، وتتحقق من HMAC session، عدم قبول customerId من المتصفح، إخفاء PII، عدم قبول أرقام مديونية ناقصة/قديمة أو استجابة قاعدة ملتبسة.

12 اختبار SQLite `:memory:` يحمّل **migrations T12 0005/0006/0008 + identity 0032/0033 + EasyStore finance 0015/0024** ثم ينشئ حسابي عميل وهميين ورصيدين مختلفين وموردًا بالاسم نفسه. تختبر حالة customer id exact، العزل، المورد، mismatch في party_id، الجلسة المنتهية/المبطلة، تغيير كلمة المرور، تعطيل سياستي العملاء والحسابات، الكود المكرر، وعدم وجود الرصيد. GitHub CI يعيد اختبارات Entries660–667 أيضًا.

## قرار المالية مع Zero Google

**P0:** الإجراء القديم في `/v1/legacy-api` ما زال يستدعي Google لعرض حساب العميل. وهذا المسار الجديد **ليس تكافؤًا وظيفيًا** مع الدفتر القديم (يعرض رصيد Preview فقط، لا تفاصيل كشف حساب أو مستحقات/دفعات). لا يُنقل العميل إليه إلا بمراجعة EasyStore نفسها: mapping ومقارنة الرصيد والفواتير والتفاصيل، وحدود تاريخ التحديث ومصدر السلطة المالية.

**P0:** فحص `submitCustomerDraft` موجود في Entry667 #220 كـ**preflight قراءة فقط**؛ ليس إنشاء أوردر إنتاج. لا يجوز إعادة تنفيذ Writer T12 هنا، ولا تحويل الأرصدة إلى أوامر إنشاء/سداد. BOOK24 Single Writer وCustomer OTP والـCloudflare current deployment وStage rollback لم تتأهل بعد.

**الحصيلة:** سبعة أفعال مصدرية لعميل، وثامن `submitCustomerDraft` فحص فقط، وتاسع `getCustomerPortalAccountsV1859` **رصيد Preview مؤمّن مصدرًا فقط**. عدد الأفعال المنقولة من Google بالفعل في الإنتاج = `0/9`. `FINANCE_AUTHORITATIVE=NO`; `EASYSTORE_ACCOUNTS_PARITY=UNVERIFIED`; `ZERO_GOOGLE_LIVE_COMPLETE=NO`; `PRODUCTION_DEPLOY=NO`.

## Entry669 — رفض الرصيد المفقود قبل التحويل الرقمي (23 أكتوبر 2026)

- اكتُشفت فجوة Fail-Closed في نموذج Entry668: التحويل `Number(row.balance)` يحوّل `null` أو النص الفارغ إلى صفر، رغم أن جدول `0024` الأصلي يمنع NULL. أي Adapter أو تغيير Schema لاحق لا يجوز له اختراع رصيد صفر.
- أُضيف شرط صريح `typeof row.balance === 'number'` مع finite/nonnegative قبل العرض، واختبار Node ضد `null`/`undefined`/الفراغ/النصوص/boolean/negative، مع السماح فقط بصفر رقمي حقيقي. `employee_accounting_party_balances_v1` يظل المصدر كما هو، دون تعديل مالي أو Migration.
- **حالة الاختبارات:** راجع Workflow exact-head بعد commit؛ لا تحوّل هذه الحماية إلى إقرار بختم `EasyStore` أو نشر.
- **قرار P0 معلق:** ربط `party_id` الحقيقي والدفاتر/الفواتير/الحركات المالية وإثبات حداثة وملكية المصدر، بتوقيع موثوق من مالك EasyStore، قبل تركيب Route أو تحويل `getCustomerPortalAccountsV1859`. لا تتحول Boolean params الاختبارية إلى attestation تشغيلية.
- **الحالة:** SOURCE_OFF / PREVIEW_ONLY / ZERO_GOOGLE_LIVE=0/9 / NO_MERGE / NO_DEPLOY. PR #221.
