# Approval / Persistence Router — صندوق مطبعجي

> الهدف: جعل حفظ الذاكرة واختيار النسخة النهائية للأرشفة تلقائيين، مع إبقاء أوامر التنفيذ منفصلة وعدم اختراع Customer Approval.

## الحالة

`ACTIVE / REQUIRED / AUTO_PERSIST / AUTO_FINAL_SELECTION`

هذا العقد له الأولوية على أي تعليمات أقدم تطلب `اعتمد وسجل` أو تأكيدًا جديدًا قبل حفظ الـCase أو اختيار Final Asset للأرشفة.

## 1) Auto-Persist هو الوضع الافتراضي

بعد استخراج أي شات تصميم أو Case:

1. افهم المحادثة كاملة.
2. افصل الحالات المستقلة.
3. امنع التكرار وابحث عن Case موجودة قبل إنشاء واحدة جديدة.
4. أنشئ أو حدّث Case تلقائيًا بدون انتظار موافقة المستخدم.
5. خصص/حافظ على Case ID وAsset IDs وVersion IDs.
6. اختَر Final Asset للأرشفة تلقائيًا حسب سياسة الاختيار أدناه.
7. ارفع كل Asset متاح فعليًا إلى Google Drive داخل Project Root الرسمي.
8. سجّل Drive File ID الحقيقي لكل ملف تم رفعه.
9. سجّل المحاولات والنتائج والفشل والقبول والرفض كما حدثت.
10. احفظ GitHub metadata والـRoom/Storage records.
11. بعد نجاح الحفظ اعرض للمستخدم روابط Google Drive للصور/Case folder للتأكيد الاختياري فقط.

لا توجد Human Approval Gate لحفظ الذاكرة أو اختيار Final Asset الأرشيفية.

## 2) عبارات الاعتماد لم تعد مطلوبة للحفظ أو Final Selection

الأوامر:
- `اعتمد وسجل`
- `تمام سجل`
- `اعتمد التصميم النهائي`
- `ده النهائي`

ليست مطلوبة كشرط للحفظ أو اختيار Final Asset للأرشفة.

إذا قالها المستخدم، تعامل معها كـEvidence إضافي فقط، ولا تشغّل Image Generation بسببها.

## 3) سياسة Final Selection التلقائية

اختيار النسخة النهائية المحفوظة للأرشفة يتم تلقائيًا بهذا الترتيب:

1. نسخة عليها Final/Approval صريح داخل الشات نفسه.
2. آخر نتيجة ناجحة لم تُرفض ولم يأتِ بعدها طلب تعديل واضح.
3. آخر نتيجة عليها قبول/إعجاب واضح ولم تُرفض لاحقًا.
4. إذا لا توجد أي نتيجة صالحة:
   `archival_final_status: NO_VALID_FINAL_ASSET`

عند اختيار نسخة تلقائيًا استخدم:

- `archival_final_status: AUTO_SELECTED`
- `archival_final_version_id`
- `archival_final_asset_id`
- `archival_final_basis`

## 4) لا تخلط Final Asset الأرشيفية مع Customer Approval

اختيار Final Asset للأرشفة لا يعني أن العميل وافق عليها.

حالة موافقة العميل — إن احتجناها — تبقى مستقلة:

`customer_approval_status: CONFIRMED | NOT_DOCUMENTED | REJECTED`

إذا لا يوجد دليل موافقة عميل:

`customer_approval_status: NOT_DOCUMENTED`

وده لا يمنع الحفظ ولا Final Selection الأرشيفية.

## 5) أوامر التنفيذ منفصلة

الأوامر مثل:
- `استخرج`
- `نفذ`
- `اعمل التصميم`
- `عدل الصورة`
- `جرب تاني`

هي أوامر تنفيذ/توليد/تعديل حسب السياق.

لا يجوز تحويل Auto-Persist أو اختيار Final Asset الأرشيفية إلى إعادة توليد صورة.

## 6) بعد فشل Image Generation

إذا فشل توليد/تعديل الصورة أو لم ينتج ملفًا قابلًا للمراجعة:

1. سجل المحاولة كـ`FAILED_NO_RESULT`.
2. لا تنشئ `result_asset_id` وهمي.
3. أكمل حفظ الـCase تلقائيًا رغم الفشل.
4. لا تعاود تشغيل التوليد إلا بأمر تنفيذ جديد وصريح.
5. إذا توجد نتيجة ناجحة أقدم غير مرفوضة، يمكن اختيارها Final Asset للأرشفة تلقائيًا.

## 7) روابط التحقق الاختيارية

بعد Auto-Persist الناجح، اعرض عند توفرها:
- Case folder URL على Google Drive.
- روابط كل Asset مرفوع فعليًا.
- Case ID.
- عدد LINKED / PENDING_UPLOAD / MISSING.
- archival_final_status / archival_final_asset_id.

هذه الروابط للتأكيد الاختياري فقط، وليست Gate لإتمام الحفظ أو Final Selection.

## 8) Safe to delete

بعد Auto-Persist يمكن اعتبار الشات آمنًا للحذف فقط إذا تم التحقق من:
- Case record محفوظ فعليًا.
- Timeline والمحاولات محفوظة.
- كل Asset متاح تم ربطه أو وسمه بوضوح `PENDING_UPLOAD/MISSING`.
- Final Selection الأرشيفية سُجلت أو تم تسجيل `NO_VALID_FINAL_ASSET` بوضوح.
- لا توجد بيانات مهمة معروفة ما زالت فقط داخل الشات.

عند تحقق ذلك:

`SAFE_TO_DELETE_CHAT`

إذا فشل الحفظ أو لم يمكن التحقق منه:

`NOT_SAFE_TO_DELETE_CHAT — PERSISTENCE_NOT_CONFIRMED`

## 9) قاعدة نهائية

`AUTO PERSISTENCE + AUTO ARCHIVAL FINAL SELECTION != CUSTOMER APPROVAL != EXECUTION COMMAND`

الحفظ واختيار Final Asset للأرشفة تلقائيان. موافقة العميل حقيقة مستقلة إن وُجدت. التنفيذ يحتاج أمر تنفيذ مستقل.