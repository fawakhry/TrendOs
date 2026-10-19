# Entry660 — عميل يقرأ أوردراته من D1 (أول مسار Native بدون Google)

**حالة التنفيذ: SOURCE ONLY / OFF / NO_GO.** هذه إضافة داخل مصدر TrendOS الأساسي، ليست إعادة بناء موظفين أو أوردرات ولا تعديلًا في مشاريع EasyStore/Printshop/Matbagy. لم تُربط بالـWorker أو Gateway ولم تطبق migrations 0032/0033 على الإنتاج.

## ما الذي ينفذه الكود بالفعل؟

- `cloudflare-d1/src/customer-portal-native-orders-v0.mjs`: Service+HTTP handler مُجهز، لا يُستدعى من `index_v2.js`، والـFlag الإفتراضي OFF.
- المسار المستقبلي: `GET /v1/customer/native/orders`؛ يحتاج **كلا** `TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED='true'` وD1 customer control `GENERAL` بعد موافقة المالك على نسخة مستقلة.
- رمز جلسة Native عالي العشوائية HMAC-SHA256 server-side، مطلوب سر مستقل لا تقل قوته كمدخل عن 32 حرفًا، مع هوية الحساب من D1 فقط؛ لا يقبل customerId من المستخدم ولا من الاسم أو الهاتف.
- تجديد صلاحية الجلسة كل طلب: not revoked, not expired, <=8h, version equality, ACTIVE PBKDF2 account and independently approved enrollment.
- نتائج فقط من `t12_prod_orders` و`t12_prod_lines` عبر `customer_portal_native_order_ownership_v1` بعد `OWNER_REVIEWED_EXACT_ID` مع proof وإثبات مراجع وحالة VERIFIED، وإقصاء أي تعارض في `external_customer_id`.
- خروج: عناصر أوردر محدودة غير مالية (orderId, lineId, status, itemName, qty, createdAt, department)؛ لا notes ولا customer phone/name ولا debt أو ملفات.
- No Google fallback. D1 failure = 503، invalid session = 401. POST ممنوع. CORS origins مضبوطة. Paging 1–40, offset 0–10000.

## اختبارات

```bash
node --test tests/entry660_customer_native_orders_off.test.mjs
python3 tests/entry660_customer_native_orders_sqlite.test.py -v
```

اختبار SQLite فعلي في الذاكرة يحمّل migrations 0005/0006/0008/0032/0033 إلى **قاعدة مصطنعة مؤقتة**، ثم يختبر جلسة موظف/عميل مختلفة، انتهاءها، تغيير كلمة المرور (session_version)، إبطالها، وضع التحكم OFF/CANARY، تطابق portal_code، ملكية VERIFIED/REVOKED، mismatch في external_customer_id، وقائمة البنود الآمنة. جميع الهوية والقيم في الاختبار وهمية.

## حدود العمل وعقود المشاريع الأخرى

- لم نُنشئ customer login أو OTP sender أو session issuer جديدًا. هذه مسؤولية عمل Entries654–659 [PR #130](https://github.com/fawakhry/TrendOs/pull/130) وتحتاج تحققًا مستقلًا، وليس مصدرًا جاهزًا للإنتاج.
- لم نصل لحساب EasyStore: هذا المسار لا يقرأ أو يُنشئ مبالغ أو مديونيات أو فواتير.
- لم نغيّر أي مهمة في BOOK24 Single Writer ولا إطلاق المطبعة الذاتية.
- لا نقرأ الأوردرات القديمة غير الموثقة في `t12_prod_orders` حتى لا نستنتج ملكية خطأ من Sheets.
- ما زالت وظائف بوابة العملاء التسع تُوجَّه لـApps Script في التنفيذ الحالي؛ إضافة هذا **البديل** لا تعني فصل `getCustomerOrders` أو Zero Google.

## Decisions deferred, دون إيقاف التطوير

1. إثبات current deployed Cloudflare Worker SHA وبصمة session issuer.
2. owner-reviewed identity/OTP/verified ownership مع سجل تدقيق وعدم تسريب بيانات.
3. stage معزول، rollback، واختبارات صلاحيات وتعدد عملاء من الإنتاج من دون تعطيل حركة الأوردرات.
4. إقرار cutover لـ`getCustomerOrders` وحده بعد المقارنة، ثم باقي 8 أفعال العملاء بقرار منفصل.
5. BOOK24 task writer وEasyStore finance boundary تحت إشراف مشاريعهم الأصلية.

**NO DEPLOY / NO MAIN MERGE / NO LIVE GOOGLE OR D1 CALL / NO CUSTOMER DATA / NO MIGRATION APPLY.**
