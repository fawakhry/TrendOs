# Entry675 — تدقيق ملفات R2 المعلقة بدون تغيير البيانات (SOURCE_ONLY/OFF)

**التاريخ:** 23 أكتوبر 2026. **المسؤول:** بوابة المسودات في TrendOS، وليس ملفات الإنتاج في المطبعة أو حسابات EasyStore.

## ما تم تنفيذه
- `cloudflare-d1/src/customer-portal-native-r2-pending-audit-v0.mjs` يفحص ملف `PENDING` واحدًا، من **جدول المصدر القائم** `customer_portal_native_draft_files_v1` وبـopaque fileId، ويرفض اختلاف مالك الملف عن المسودة/البند، والمسودة المتوقفة وأخطاء Metadata.
- يفحص `R2.head` فقط بعد مرور 15 دقيقة على آخر تغيير، لتجنّب تدخل مع رفع مازال جارياً. يتحقق من الحجم وMIME ووسم المصدر. **لا يتحقق من محتوى SHA256**، لذلك حتى إن وُجد الملف مطابقًا في metadata يُرجع `PENDING_R2_PRESENT_HASH_AND_AUTH_REVIEW_REQUIRED` وليس `READY`.
- لا توجد `R2.put/get/delete` ولا `D1 UPDATE/INSERT/DELETE` ولا Route عامة، ولا Import من Worker، ولا تشغيل دوري/صلاحيات إنتاج. لا يخرج Object Key أو SHA أو بيانات عميل في الاستجابة.
- إذا كان الملف مفقودًا أو Metadata مختلفة أو D1/R2 غير متاح، تكون النتيجة مراجعة يدوية أو فشل مغلق، **لا تنظيف تلقائي**. تحتاج المصالحة الحقيقية إلى قارئ محتوى آمن، تحقق بصمة كامل، إثبات جلسة/مالك منفصل، احتفاظ وسجل تدقيق وتفويض مشغل معتمد.

## اختبارات
`node --test tests/entry675_customer_r2_pending_audit_off.test.mjs`

`python3 tests/entry675_customer_r2_pending_audit_sqlite.test.py -v`

الاختبارات تستخدم Fake R2 وSQLite disposable من migrations الفعلية، لا أي بيانات/مفاتيح إنتاجية.

## قرارات مانعة
- حد المصدر الحالي 5MiB بدلاً من حد Google القديم الذي قد يصل 25MiB، وعدم ربط R2 Bucket أو scanner/antivirus وعدم وجود صلاحية حقيقية لإكمال `PENDING`: **NO_GO**.
- لا تحويل تلقائي إلى READY أو مسح orphan قبل استكمال التدقيق والموافقات، ولا إحالة الملف إلى T12 أو المطبعة، ولا فصل Google.
- `CUSTOMER_R2_PENDING_AUDIT=OFF_SOURCE_READONLY`; `CUSTOMER_ZERO_GOOGLE_LIVE_RETIRED=0/9`; `DEPLOY=NO`.
