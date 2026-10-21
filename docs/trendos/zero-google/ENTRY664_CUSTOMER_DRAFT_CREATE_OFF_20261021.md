# Entry664 — إنشاء مسودة أوردر العميل من Cloudflare D1 (غير منشور)

**الحالة: Source-only / Default OFF / NO_GO.** متابعة للسلسلة #213 → #214 → #215 → #216. القاعدة: لا نعيد بناء أنظمة الطلبات الحقيقية أو الموظفين أو EasyStore والمطبعة الذاتية. مسار Google القديم `createCustomerDraft` ما زال فعّالًا في `/v1/legacy-api`.

## ماذا أُنجز فعليًا؟

- Migration إضافية مؤجلة `0036_customer_portal_native_draft_create_v1.sql` تنشئ جدول `customer_portal_native_drafts_v1`. **لم تُطبّق على إنتاج D1**؛ الجدول منفصل عن `t12_prod_orders` و`t12_prod_lines` والفواتير، ولا يملك أي آلية لتشغيل الطلبات أو الطباعة.
- `customer-portal-native-draft-create-v0.mjs` يجهز `POST /v1/customer/native/drafts` لكنه **غير مستورد من Worker**، والـFlag `TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED` يظل OFF ما لم يُفعّل يدويًا في Runtime منفصل بعد الموافقات.
- تحقق من جلسة Native الموجودة في Entry660 باستخدام HMAC وعدم صلاحية الجلسة المنتهية أو المبَطلة، مع حساب ACTIVE وإثبات enrollment مستقل ونسخة session_version وارتباط portal_code، ومراجعة عدم تكرار الكود.
- `requestKey` عشوائي سداسي 128-bit يحدده العميل، فريد على D1 لكل طلب مسودة؛ `draftId` عشوائي من الخادم. تنفيذ `INSERT OR IGNORE ... SELECT` مشروط بالجلسة، ثم `SELECT` مشروط بنفس جلسة ومالك المسودة. عند إعادة نفس المفتاح من العميل المصرح نفسه يرجع نفس ID من غير إنشاء مسودة جديدة؛ أي عميل آخر لا يستطيع رؤيته.
- حد مصدرى 20 مسودة خلال 24 ساعة للعميل الموثق، بجانب محدودية المدخلات JSON 256 bytes، POST فقط وOrigin في Allowlist. هذا **ليس** مانعًا عامًا لهجمات الإنترنت؛ يتطلب Cloudflare WAF/rate limit في النشر الفعلي.
- لا تُقبل من العميل أية `customerId` أو اسم أو تليفون أو بند أو مبلغ أو سعر أو مرفق في هذا المسار. كتابة **مسودة فارغة فقط** وليست إرسال طلب.

## الاختبارات
```bash
node --test tests/entry664_customer_native_draft_create_off.test.mjs
python3 tests/entry664_customer_native_draft_create_sqlite.test.py -v
```
12 سيناريو SQLite على migrations الحقيقية داخل `:memory:` الوهمية؛ جلسات C1/C2، replay، cross-customer، revoked، expired، account version، OFF/CANARY، cap 20/24h، قيود قاعدة البيانات، وعدم تغير جدول الأوردرات الرسمية. اختبارات Node تجريبية لـHTTP وحد البيانات وتأكيد `Worker index NOT IMPORTED`. جميع الاختبارات السابقة 660–663 مجدولة في CI نفسه.

## الحدود والقرارات المؤجلة

1. Identity وOTP والعميل الحقيقي غير مؤهلة إنتاجيًا، فلا يوجد Cutover مسموح.
2. تنفيذ `addCustomerDraftItem` يحتاج RBAC للمالك وCAS على بنود المسودة وتحديد قواعد الأقسام، وليس نقل أسماء الموظفين أو التعديلات القائمة في T12.
3. `submitCustomerDraft` يحتاج exactly-once ربط CREATE الرسمي بـD1 وتحقق المالية والموافقة على الانتقال؛ **ممنوع أن يتحول إنشاء المسودة إلى إنشاء أوردر رسمي تلقائيًا**.
4. `uploadCustomerDraftFile` يتبع R2 وACL وعدم تمكين وصول عميل لملفات غيره.
5. `getCustomerPortalAccountsV1859` يخص حدود EasyStore المالية؛ لا نقل للمديونيات من جداول قديمة بدون مراجعة المسؤول.
6. Cloudflare current bundle + D1 migrations + protected stage + backup/restore وrollback وGO-LIVE موافقة مستقلة قبل النشر.

**الحالة العددية:** `CUSTOMER_NATIVE_SOURCE_ACTIONS_PREPARED=5/9` (بما فيها هذه المسودة)، و`CUSTOMER_ACTIONS_REMOVED_FROM_LIVE_GOOGLE=0/9`. أي اطمئنان لاختبارات Source لا يثبت وصوله للإنتاج.
