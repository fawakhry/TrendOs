# Entry665 — إضافة بند لمسودة العميل في D1 دون Google (SOURCE ONLY / OFF)

**النطاق:** الوظيفة السادسة من 9 لبوابة العميل ضمن Zero Google (مصدر واختبارات فقط)، متابعة لـEntry664 [#217](https://github.com/fawakhry/TrendOs/pull/217). لم نكرر كود أوردرات الإنتاج/الموظفين، ولم نعدّل EasyStore أو Printshop أو Matbagy-OS أو Google.

## الفعل المنفذ

- Migration إضافية `0037_customer_portal_native_draft_items_v1.sql` تنشئ جدولا مستقلًا عن أوردرات الإنتاج، ولا تُطبق على D1 الإنتاج حتى موافقة منفصلة.
- `customer-portal-native-draft-item-v0.mjs`: `POST /v1/customer/native/drafts/:draftId/items` **غير مربوط بمدخل Worker**، والـFlag `TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED` OFF افتراضيًا.
- يتأكد من: HMAC bearer لجلسة D1 سارية غير مُبطلة، Account ACTIVE إثبات enrollment مستقل، password session_version، وسياسة GENERAL، وملكية المسودة `draft.customer_id=account.customer_id`، وحالة المسودة `DRAFT`.
- البند يقبل فقط: Department `طباعة/ليزر`، اسم المنتج من 1 إلى 120 حرفًا، Qty 1..99، Notes حتى 1000 حرف، Boolean `heatPress/flyPrint` للطباعة فقط. يمنع إرفاق ملفات أو تنفيذ/تسليم/حسابات؛ أي notes للفرع/التاجر نص غير موثوق ولا يختار صلاحية إنتاج.
- كل عملية لها `requestKey` 128-bit. يعيد نفس `itemId` عند إعادة نفس المفتاح ونفس المحتوى، ويرفض المفتاح إذا تغير المحتوى أو المسودة أو العميل. HMAC للـpayload يؤكد التطابق، و`UNIQUE(draft_id,ordinal)` يمنع تصادم الترتيب. حد 50 بندًا للمسودة، والـitemId يصدر على الخادم.
- حجم الطلب محدود 1800 byte بـReadableStream، Origin allowlist، POST فقط، لا أوردر رسمي أو ربط EasyStore/R2/Printshop.

## الاختبارات

```bash
node --test tests/entry665_customer_native_draft_item_off.test.mjs
python3 tests/entry665_customer_native_draft_item_sqlite.test.py -v
```

اختبارات SQLite disposable تشمل C1/C2، verified session, token revocation, account/session rotation, false-owner, ID reuse, changed payload, state SUBMITTED/CANCELLED, 50 بندًا، الترتيب، department flags، ودليل عدم إنشاء `t12_prod_orders`. GitHub Actions تعيد اختبار Entries660–664 أيضًا.

## لم يكتمل

- 3 وظائف عملاء مصدرية أخرى: `submitCustomerDraft`, `uploadCustomerDraftFile`, `getCustomerPortalAccountsV1859` — الأخيرة تتطلب EasyStore source authority، والأولى تتطلب T12 order exactly-once approval والثانية R2 ACL/ownership.
- وظائف Customer Login/OTP وإصدار جلسات D1 غير منشورة، وGoogle Legacy ما زال في مسارات العميل التسع.
- لا نشر، لا main merge، لا D1 migration حية، لا أحكام على شرعية جلسة/هوية حقيقية أو ترخيص مالي/تشغيل ماكينة.

**SOURCE_CUSTOMER_ACTIONS=6/9 فقط عند نجاح CI**؛ `CUSTOMER_GOOGLE_RETIRED_LIVE=0/9`، `PRODUCTION_ZERO_GOOGLE=NO`.
