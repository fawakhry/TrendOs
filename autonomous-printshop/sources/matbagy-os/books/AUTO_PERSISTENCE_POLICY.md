# Auto Persistence Policy — صندوق مطبعجي

> **SaaS tenancy:** Auto-Persist لا يملك اختيار Tenant من محتوى المستخدم. الـTenant يأتي من authenticated runtime context، وكل dedupe/write/link يجب أن يكون Tenant-scoped. Legacy missing tenant may map to `TENANT_001` during migration only. راجع `TENANCY_CONTRACT.md`.

**Status:** `ACTIVE / USER_APPROVED / OVERRIDES_OLD_HUMAN_SAVE_GATE_AND_FINAL_CONFIRMATION_GATE`

## القرار

المستخدم لا يريد انتظار أي موافقة بشرية بعد استخراج كل شات، لا لحفظ الـCase ولا لاختيار النسخة النهائية المحفوظة للأرشفة.

الوضع الرسمي من الآن:

`READ CHAT -> EXTRACT -> DEDUP -> CREATE/UPDATE CASE -> AUTO-SELECT ARCHIVAL FINAL RESULT -> UPLOAD AVAILABLE ASSETS -> WRITE DRIVE IDS -> PERSIST GITHUB -> SHOW DRIVE LINKS FOR OPTIONAL VERIFICATION`

## قاعدة الأولوية

هذا الملف يلغي أي تعليمات أقدم داخل المشروع تقول:
- أنشئ Draft ثم انتظر موافقة المستخدم قبل الحفظ.
- لا ترفع الصور قبل `اعتمد وسجل`.
- انتظر من المستخدم تأكيدًا جديدًا قبل اختيار النسخة النهائية المحفوظة للأرشفة.

إذا ظهر تعارض، هذه السياسة هي الأحدث والأعلى أولوية.

## التنفيذ

عند طلب استخراج شات أو عند تشغيل صندوق مطبعجي على محادثة قديمة:

1. اقرأ المحادثة كاملة.
2. استخرج كل Design Case مستقلة.
3. ابحث عن Duplicate قبل إنشاء Case جديدة.
4. حدّث Case موجودة أو أنشئ Case ID جديد تلقائيًا.
5. استخرج Facts / Requests / Text / Dimensions / Assets / Versions / Feedback / Acceptance / Rejection / Failures / Rules / Tags.
6. اختَر النسخة النهائية المحفوظة للأرشفة تلقائيًا وفق سياسة Final Selection أدناه.
7. ارفع كل ملف/صورة متاحة فعليًا إلى Google Drive داخل:
   `My Drive/مشروع مطبعجي - Matbagy Project/01_Design_Cases/YYYY/<CASE_ID>/`
8. سجّل `drive_file_id` الحقيقي والرابط لكل Asset تم رفعه.
9. إذا الملف غير متاح للأداة، استخدم `PENDING_UPLOAD` أو `MISSING` ولا توقف حفظ باقي الـCase.
10. احفظ Case metadata والـTimeline والـVersions والـRoom/Storage records على GitHub.
11. اعرض للمستخدم بعد الانتهاء روابط Google Drive للـCase/Assets المرفوعة للتأكد إذا أحب فقط.

## لا يوجد Approval Gate للحفظ

المستخدم لا يحتاج أن يقول:
- `اعتمد وسجل`
- `تمام سجل`

هذه العبارات ليست شرطًا للحفظ بعد الآن.

## لا يوجد Final Confirmation Gate للأرشفة

لا تنتظر من المستخدم قول:
- `اعتمد التصميم النهائي`
- `ده النهائي`
- `اعتمد النسخة دي`

حتى تختار Final Asset محفوظة للأرشفة.

### سياسة الاختيار التلقائي للنسخة النهائية

استخدم هذا الترتيب:

1. **Explicit Final Evidence**: إذا يوجد داخل الشات نفسه اعتماد واضح لنسخة/صورة بعينها، استخدمها.
2. **Latest Successful Non-Rejected Result**: إذا لا يوجد اعتماد صريح، استخدم آخر Result ناجح لم يتم رفضه ولم يأتِ بعده طلب تعديل واضح.
3. **Latest Explicitly Liked / Partially Accepted Result**: إذا لا يوجد Result لاحق صالح، يمكن استخدام آخر نسخة نالت قبولًا أو إعجابًا واضحًا ولم تُرفض لاحقًا.
4. إذا كل المحاولات فشلت أو كل النتائج رُفضت، لا تخترع Final Asset واستخدم:
   `archival_final_status: NO_VALID_FINAL_ASSET`

عند الاختيار التلقائي استخدم:

- `archival_final_status: AUTO_SELECTED`
- `archival_final_version_id: <VERSION_ID>`
- `archival_final_asset_id: <ASSET_ID>`
- `archival_final_basis: EXPLICIT_FINAL | LATEST_SUCCESSFUL_NON_REJECTED | LATEST_ACCEPTED`

## فرق مهم: Final Asset المحفوظة ليست ادعاء موافقة عميل

الحفظ التلقائي واختيار Final Asset للأرشفة لا يعني اختراع Customer Approval.

احتفظ — عند الحاجة — بحقل منفصل:

`customer_approval_status: CONFIRMED | NOT_DOCUMENTED | REJECTED`

إذا لا توجد موافقة عميل موثقة، استخدم `NOT_DOCUMENTED`، لكن هذا **لا يمنع** اختيار Final Asset للأرشفة ولا يمنع الحفظ.

## فشل الصور

إذا فشل Image Generation/Image Edit:
- سجل المحاولة `FAILED_NO_RESULT`.
- لا تخترع Result Asset.
- أكمل Auto-Persist.
- لا تعاود التوليد تلقائيًا بسبب الحفظ.

إذا كانت هناك نتيجة ناجحة أقدم غير مرفوضة، يمكن أن تكون هي Final Asset الأرشيفية حسب القواعد أعلاه.

## التأكيد الاختياري بعد الحفظ

بعد النجاح اعرض باختصار:
- `CASE_ID`
- Case folder link
- Asset links
- `LINKED` count
- `PENDING_UPLOAD` count
- `MISSING` count
- `archival_final_status`
- `archival_final_asset_id` عند وجوده
- `SAFE_TO_DELETE_CHAT` فقط إذا persistence verified بالكامل.

المستخدم يستطيع فتح الروابط للتأكد إذا أراد، لكن عدم فتحها لا يمنع الحفظ ولا اختيار النسخة النهائية للأرشفة.

## قاعدة نهائية

`AUTO_PERSIST_FIRST; AUTO_SELECT_ARCHIVAL_FINAL; OPTIONAL_VERIFY_AFTER`

ولا تستخدم التأكيد البشري كعنق زجاجة لاستخراج المحادثات القديمة أو اختيار النسخة النهائية المحفوظة.