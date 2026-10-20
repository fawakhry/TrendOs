# Entry663 — استبدال كلمة مرور العميل من D1 بدون Google (Source Only)

**حالة الإصدار: OFF / SOURCE ONLY / NO_GO**. فرع تابع لـ Entry662 #215 ثم Entry661 #214 وEntry660 #213، وليس نظام موظفين/أوردرات جديدًا، ولا تغييرًا في EasyStore أو Printshop.

## المنفذ
- وظيفة `rotateNativeCustomerPasswordV0` تطلب جلسة Native D1 حالية موثقة وكلمة المرور القديمة الصحيحة وكلمة مرور جديدة. لا تثق بـ Customer ID أو اسم أو تليفون مرسل من المتصفح.
- إعادة استخدام Entry657 PBKDF2 SHA256 (100000 iteration) وEntry660 session token HMAC من نفس وحدات TrendOS.
- `CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0` يثبت حالة الحساب ACTIVE مع إثبات OTP enrollment، العملاء الفعالين، نسخ الجلسة، صلاحية زمنية 8 ساعات، وعدم إبطال الجلسة وتحكم GENERAL.
- `CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0` يعمل `UPDATE` واحدًا مع مطابقة Hash/Salt القديمة وإصدار الحساب والجلسة الحالية عند لحظة التنفيذ. بعد النجاح يرفع `session_version` ويبطل **كل جلسات العميل السابقة**؛ أي ACK غير محدد يعتبر 503، ولا يُعلن نجاحًا وهميًا.
- غير متصل بـ `cloudflare-d1/src/index_v2.js` ولا واجهة Login عامة. لا اتصالات Google أو D1 Production. يلزم مسار HTTP منفصل محمي ضد CSRF/credential stuffing عند صدور قرار تشغيل الهوية.

## الاختبارات
```sh
node --test tests/entry663_customer_native_change_password_off.test.mjs
python3 tests/entry663_customer_native_change_password_sqlite.test.py -v
```

SQLite `:memory:` تُنشأ من migrations T12 0005/0006/0008 والمصدرين Entry654/655 0032/0033، بأوردرات وعملاء وكلمات مرور **وهمية فقط**. فحوص حالات: Session expiry/revocation، session version race، تغير Hash، إبطال كل جلسات العميل، منع التعديل على حساب عميل آخر، عدم تفعيل OFF، والتحقق من عدم تسريب الأسرار. CI يعيد اختبارات وظائف Entry660–662 بالكامل.

## ماذا لم يحدث
وظائف بوابة العملاء التسع ما زالت فعليًا Legacy Google. مصادر 4 Actions باتت موجودة (customerLogin, customerLogout, getCustomerOrders, changeCustomerPassword) لكن **0/9 تم تحويلها فعليًا في Production**. لا OTP/SMS، لا SQL migrations حية، لا ربط Worker ولا Cloudflare Deployment. نحتفظ بـ `PRODUCTION_GO=NO` إلى حين إثبات الهوية وقرار المالك، المطابقة مع التطبيقات المنشورة، ومراحل Stage/rollback.

**NEXT:** إعداد واجهة محمية لربط الخدمات الأربعة فقط بعد اعتماد OTP والحد من محاولات الدخول ومطابقة D1 الحقيقي، ثم بقية 5 إجراءات العميل بنطاقها الخاص مع عدم تدخل في حدود EasyStore/Task BOOK24.
