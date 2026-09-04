# Matbagy Auto Final Selection — Fokha Memory

**Date:** 2026-09-04  
**Status:** USER DECISION / ACTIVE  
**Project:** Matbagy Design Workflow

## القرار

المستخدم لا يريد أي بوابة تأكيد بشرية أثناء استخراج وحفظ محادثات التصميم القديمة، لا لحفظ الـCase ولا لاختيار النسخة النهائية المحفوظة للأرشفة.

المسار المعتمد:

`READ CHAT -> EXTRACT -> DEDUP -> CREATE/UPDATE CASE -> AUTO-SELECT ARCHIVAL FINAL -> UPLOAD AVAILABLE ASSETS -> PERSIST -> OPTIONAL VERIFY`

## سياسة اختيار Final Asset للأرشفة

1. استخدم نسخة عليها اعتماد/Final واضح داخل الشات نفسه إذا وجدت.
2. وإلا استخدم آخر Result ناجح لم يُرفض ولم يأتِ بعده طلب تعديل واضح.
3. وإلا استخدم آخر Result عليه قبول/إعجاب واضح ولم يُرفض لاحقًا.
4. إذا لا توجد أي نتيجة صالحة، سجّل `NO_VALID_FINAL_ASSET` ولا تخترع نتيجة.

## فصل مهم

Final Asset الأرشيفية ليست ادعاء Customer Approval.

إذا لا توجد موافقة عميل موثقة، تستخدم حالة مستقلة مثل:

`customer_approval_status: NOT_DOCUMENTED`

وده لا يمنع الحفظ ولا اختيار Final Asset الأرشيفية.

## روابط التحقق

بعد الحفظ تعرض روابط Google Drive للتأكد الاختياري فقط. فتح المستخدم للروابط أو عدم فتحها لا يوقف الحفظ ولا Final Selection.

## مصدر الحقيقة

التفاصيل التنفيذية الرسمية تبقى داخل:

Repository: `fawakhry/Matbagy-Design-Workflow`  
Branch: `agent/initial-mvp`

Canonical contracts:
- `صندوق_مطبعجي/SCHEMA/AUTO_PERSISTENCE_POLICY.md`
- `صندوق_مطبعجي/SCHEMA/APPROVAL_COMMAND_ROUTER.md`
- `صندوق_مطبعجي/PROMPTS/AI_ROOM_CHATGPT_PROMPT.md`
- `صندوق_مطبعجي/PROMPTS/AI_ROOM_GEMINI_PROMPT.md`

هذا الملف هو ذاكرة فوخا للقرار، وليس بديلًا عن صندوق مطبعجي نفسه.