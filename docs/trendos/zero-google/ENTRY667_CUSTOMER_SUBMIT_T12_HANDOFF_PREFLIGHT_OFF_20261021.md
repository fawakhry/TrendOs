# Entry667 — تجهيز تسليم مسودة عميل إلى T12 (PRE-FLIGHT ONLY, لا ينشئ أوردر)

**قرار معماري مهم:** `submitCustomerDraft` مازال يتجه إلى Google في الإنتاج. مشروع TrendOS يملك بالفعل `createT12GeneralOrder` وهو الكاتب الرسمي للأوردرات، والـHTTP handler الخاص به يحتاج جلسة **موظف**. لا يجوز نسخ الكاتب داخل بوابة العميل، ولا منح العميل رمز موظف وهميًا، ولا تجاوز BOOK24/Single Writer.

## المنفذ برمجيًا
- `cloudflare-d1/src/customer-portal-native-submit-preflight-v0.mjs` يقرأ D1 قراءة فقط، غير مستورد من Worker وغير متاح كمسار HTTP، ولا يستدعي `createT12GeneralOrder` أو أي Writer آخر.
- نفس HMAC session fingerprint من Entry660، يراجع صلاحية الجلسة غير المبَطلة ونسخة الحساب، إثبات تفعيل الهوية، ارتباط العميل بالمسودة، `GENERAL` و`t12_customers.source='cloud-native'`، ثم يقرأ بنود المسودة والمرفقات **داخل D1 فقط**.
- يحترم نموذج T12 الفعلي عبر **نفس `buildT12OrderCreateShadowIntent`** و`classifyT12ClientRequestKey`، ويشتق مفتاح T12 ثابتًا من وقت إنشاء المسودة وID عشوائي مخزن، من غير أن يستلم `customerId` أو هاتف/اسم العميل من المتصفح. العميل لا يرى بيانات T12 المالية أو بيانات هويته الخام في نتيجة Preflight.
- **Fail closed:** T12 General Create الحالي يكوّن سطرًا أو سطرين من **نفس المنتج** في قسمي طباعة/ليزر. مسودة العميل تسمح 50 بندًا مستقلًا؛ لا بد من رفض أي مسودة ليست بندًا واحدًا إلى أن يتم اعتماد mapping كامل يمنع ضياع البنود.
- **Fail closed:** T12 لا يملك في عقد Create الحالي نظام إرفاق R2 لهذه المسودة؛ تُرفض أي مسودة بها ملف، سواء PENDING أو READY، بدل إرساله ناقصًا.
- نتيجة النجاح تقول `preflightEligible=true` و`officialOrderCreated=false` و`needsTrustedEmployeeDelegate=true` و`productionWriteAuthorized=false`. لا توجد كتابة في D1 أو Google أو R2.

## حدود الإنتاج
**لا يمكن اعتبار هذه وظيفة submitCustomerDraft كاملة أو ترحيلها عن Google بعد.** إكمالها يتطلب عقدًا معتمدًا بين عميل D1 وT12 Create actor الحاضر، وحفظ حالة المسودة وقيد الطلب والمفتاح في **نفس معاملة D1** قدر الإمكان قبل ادعاء exactly-once، ومراجعة EasyStore debt/finance، وR2 attachments، وBOOK24 Single Writer. إنشاء الأوردر موجود فعلًا؛ لا تُعاد كتابته.

المسار المسموح لاحقًا: Customer Native Session ⇒ D1 draft owner ⇒ validated immutable snapshot + document manifest ⇒ trusted create authority (not customer bearer) ⇒ existing `createT12GeneralOrder` ⇒ verified order ledger ⇒ mark draft submitted atomically or explicit reconciliation with rollback. ممنوع إبراز نتيجة النجاح للعميل قبل تحقق الربط الرسمي.

## الاختبارات
```bash
node --test tests/entry667_customer_draft_submit_preflight_off.test.mjs
python3 tests/entry667_customer_draft_submit_preflight_sqlite.test.py -v
```
تُستخدم بيانات عملاء ومسودات ومرفقات وهمية وقواعد SQLite من migrations الفعلية، مع حالات تسرب ملكية بين العملاء، انتهاء/إبطال Session، الحساب المشكوك فيه، تعدد البنود، الملفات غير المرفوعة والمرفوعة كاملة، وتأكيد انعدام أي Writer.

**الحالة النهائية:** `T12_NATIVE_DRAFT_SUBMIT_PREFLIGHT=PREPARED_SOURCE_OFF` وليس `submitCustomerDraft=IMPLEMENTED`. الـ7 وظائف السابقة مجهزة برمجيًا، والفعل الثامن **فحص جاهزية فقط**، والفعل التاسع `getCustomerPortalAccountsV1859` يحتاج EasyStore كمرجع للحسابات دون بناء دفتر مالي ثانٍ. `CUSTOMER_LIVE_GOOGLE_RETIRED=0/9`, `ZERO_GOOGLE_COMPLETE=NO`, `DEPLOY=NO`.

## Entry670 — عدم فقد خصائص البند في تهيئة T12 (23 أكتوبر 2026)

أُضيفت حماية SOURCE_ONLY ترفض بنود الليزر التي تحمل `heatPress` أو `flyPrint`، وأي قيم أعلام خارج 0/1، لأن تطبيع T12 يُسقط هذه الخصائص لليزر. يرفض Preflight كذلك أي اختلاف في القسم، ملاحظات البند، مصدر الأوردر أو الأعلام بين بيانات D1 ونتيجة `buildT12OrderCreateShadowIntent` حتى لا يُعلن البند قابلًا للإرسال إذا تغير محتواه. اختبارات Node تشمل الرفض والسماح لبند متوافق فقط. يحظر الإعلان عن إرسال رسمي؛ ما زالت متطلبات multi-item + R2 + trusted actor + writer authority وBOOK24 قائمة. `SUBMIT=READONLY_PREFLIGHT`, `CLOUD_DEPLOY=NO`.

## Entry674 — Identity + T12 ledger replay preflight (SOURCE_ONLY / 23 أكتوبر 2026)

- أعيد استخدام **نفس دالة T12 الأصلية** `customerLaneIdentityMaterial` لتجنب أن يعلن Preflight نجاح عميل مسجل برقم قصير أو هوية يرفضها كاتب T12 نفسه. لا يُستخدم اسم العميل كإثبات ملكية.
- أضيفت قراءة `t12_prod_request_ledger` **الموجود بالفعل** بمفتاح Cloud المشتق من المسودة: أي صف سابق سواء `PREPARED` أو `COMMITTED` أو حالة غير مألوفة يوقف الإرسال ويطلب trusted reconciliation. لا `INSERT/UPDATE` ولا كشف `order_id` ولا استدعاء Order Writer ولا تلقائية لإعادة المحاولة بعد ACK ملتبس.
- الاختبارات: Node يحاكي المفتاح/الجلسة ويمنع replay ويحظر الهاتف الضعيف؛ SQLite المعزولة تستخدم جدول T12 canonical وتثبت قراءة `PREPARED/COMMITTED` وعدم mutation. الاختبارات لا تثبت ضمان exactly-once بين فحصين قراءة منفصلين؛ عند التنفيذ الحقيقي يلزم trusted atomic handoff وسجل idempotency الأصلي.
- لا تُفعّل وظيفة إرسال العميل أو Route. `T12_OFFICIAL_CUSTOMER_SUBMIT=NOT_IMPLEMENTED`, `ZERO_GOOGLE_LIVE=0/9`, `DEPLOY=NO`.
