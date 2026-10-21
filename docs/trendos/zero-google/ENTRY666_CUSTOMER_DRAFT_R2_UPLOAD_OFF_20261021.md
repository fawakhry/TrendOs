# Entry666 — رفع مرفق المسودة من العميل إلى R2 دون Google (OFF/SOURCE ONLY)

**العمل:** تجهيز بديل مصدرّي للفعل `uploadCustomerDraftFile` على فرع تابع لـEntry665 [#218](https://github.com/fawakhry/TrendOs/pull/218). أُنشئ كود جديد خاص **بتخزين المرفق قبل إرسال الأوردر**، ولا يتداخل مع كود إدارة ملفات التشغيل بعد إنشاء الأوردر في `autonomous-printshop`، ولا مع EasyStore.

## الميزات المجهزة

- `cloudflare-d1/migrations/0038_customer_portal_native_draft_file_r2_v1.sql` جدول metadata خاص بمرفقات المسودات، لا يُطبَّق إنتاجيًا. يحفظ D1 فقط ID ملف عشوائي، صاحب المسودة، مفتاح Object خاص، بصمة SHA256، نوع/حجم الملف، وحالة `PENDING/READY`.
- `cloudflare-d1/src/customer-portal-native-draft-file-r2-v0.mjs` يجهز مستقبليًا `POST /v1/customer/native/drafts/:draftId/items/:itemId/files`، غير مستورد من `index_v2.js` والـFlag `TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED` يظل OFF؛ **ملف `cloudflare-d1/wrangler.toml` لا يحتوي الآن على binding لـR2** ولا يجوز نشر المسار قبل تأهيل Bucket مستقل وخاص.
- يتحقق من D1 session fingerprint HMAC، token expiry/revocation، account ACTIVE وإثبات enrollment، `session_version`، سياسة GENERAL، ملكية المسودة والبند وأن المسودة `DRAFT`، وحد أقصى 5 ملفات للبند.
- يقبل ملفات `image/png`, `image/jpeg`, `application/pdf` فقط حتى 5MiB حاليًا، ويفحص بصمة الـmagic bytes مقابل MIME مع stream cap. يُرفض SVG وHTML والأسماء/الروابط المباشرة والامتدادات غير المسموحة. حدود المصدر 5MiB **أقل من واجهة Google القديمة 25MB** عمداً؛ لن يُعدّ هذا تكافؤًا إنتاجيًا بدون قرار منتج واختبارات ملفات كبيرة.
- `x-idempotency-key` 128-bit، SHA256 للمحتوى، حجز D1 أولًا `PENDING` بفحص المالك، ثم `R2.put` في `customer-drafts/CDF-...` الخاص، ثم `UPDATE ... state='READY'` بشرط صلاحية الجلسة مرة ثانية. `READY` فقط يُعتبر ناجحًا، وأي خطأ غير محسوم لا يمنح نجاحًا أو رابطًا عامًا. إعادة نفس الطلب لـ`READY` ترجع ID السابق من غير رفع جديد.
- لا يوجد endpoint تحميل أو نشر عام. البادئة `customer-drafts/` ليست عنوان URL عامًا. الملفات تعتبر محتوى غير موثوق ويجب فحص الفيروسات والمحتوى قبل استخدامها لاحقًا مع الأجهزة.

## لماذا النقل الحقيقي غير جاهز؟

**P0 — عدم ذريّة R2+D1:** عملية `R2.put` وتأكيد `D1 READY` مش Transaction واحدة بين مخزنين. أي فشل في R2 أو في ACK بعد الكتابة يترك سجل `PENDING`، وربما Object خاص من غير READY. الـSource الحالي يرفض replay المحتوى المعلق ويحتاج **Reconciler معتمد، TTL وحذف orphan/احتفاظ آمن وتدقيق** قبل النشر. ممنوع الجزم بنجاح أو تنظيف أو حذف Object بغير سجل موثوق.

**P0 — أمن الملفات:** scanner/antivirus، سياسة file type/size عند المنتج، R2 bucket private + least privilege + تشفير وأرشفة/محو، وفحص محتوى الملف (لا تفتح PDF خطر تلقائيًا)، حدود استهلاك، وضبط rate-limit. ليست مؤهلة بمجرد فحص magic bytes.

**P0 — العملاء:** Native OTP/session enrollment في Entry654–659 لم تُفعّل، ولا يوجد current deployed parity أو Stage/D1 migration حقيقية. هذا المسار غير مربوط بواجهة العميل الحالية `app.js` التي ترسل Base64 إلى Google، لذلك **كل التسعة Legacy actions ما زالت تتجه إلى Google**.

## الاختبارات

```bash
node --test tests/entry666_customer_native_r2_file_off.test.mjs
python3 tests/entry666_customer_native_r2_file_sqlite.test.py -v
```
Node يستخدم Fake R2 مُنعزلًا ويختبر body caps، MIME/magic، stage/finalize، retry/no leakage وOFF. SQLite `:memory:` يقرأ migrations 0005/0006/0008 و0032/0033 و0036/0037/0038 ويختبر حسابين وهميين، session expiry/revocation، cross-customer file, replay, cap5, state DRAFT, failed finalize and constraints. CI يعيد Entries660–665.

## القرار الموثق
- الاحتفاظ بكل مسارات العملاء القديمة لحين staged customer auth + identity proof وقبول 25MB أو آلية رفع مجزأ إلى R2.
- تهيئة وربط R2 فقط بعد معرفة owner/bucket وقيود الاحتفاظ والـscanner والـreconciler.
- لا تغيير في المطبعة الذاتية (ملفات ما بعد الأوردر) أو EasyStore (حسابات)، ولا تكرار وظائفهما.
- وظيفة `submitCustomerDraft` بعد ذلك تحتاج الربط بـT12 exactly-once وسلطة Single Writer. حسابات العميل `getCustomerPortalAccountsV1859` تحتاج صاحب نظام EasyStore.

**الحالة:** 7 من 9 وظائف العملاء مجهزة كـSource (إذا نجحت CI)، و0 من 9 محوّلة عن Google في الإنتاج. `ZERO_GOOGLE_COMPLETE=NO`, `R2_BINDING_PRESENT=NO`, `DEPLOY=NO`, `MIGRATION_APPLIED=NO`.
