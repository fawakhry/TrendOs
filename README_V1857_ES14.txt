# TrendOS V1857 + EasyStore ES14 Accounting Merge

## الملفات
- `index.html`, `app.js`, `styles.css`, `config.js`: واجهة TrendOS V1857.
- `Google_Apps_Script_V1857_ES14_Accounting_Merge.gs`: Backend Google Apps Script المحدث.
- `appsscript.json`: Manifest Apps Script.
- `Trend_Accounts_V1857_Calculator_Linked.html`: نسخة مرجعية للحاسبة ومكونات الصنف بعد تصحيح صلاحيات المشتريات.
- `TrendOS_AI_Knowledge_Sheet_Template.xlsx`: قالب معرفة واتس AI كما تم رفعه.

## أهم تعديلات V1857
1. تثبيت TrendOS كواجهة تشغيل رئيسية.
2. تحديث ربط EasyStore إلى `es14-v1857-accounting-merge`.
3. المشتريات عند ضياء / رحمه / ريفان فقط.
4. وائل / جابر: فاتورة قسم فقط، حالة الشغل، هوالك، وحاسبة جابر، بدون مشتريات وبدون تكلفة أو أرباح.
5. Apps Script أضاف توافق `recalcAccountingMaterialsCascade` مع `recalculateAccountingMaterials`.
6. `getAccounting` يرجع صلاحيات صريحة: `canEnterPurchaseInvoice`, `canSeeCosts`, `canSeeProfitReports`.
7. إخفاء أرقام التكلفة/الربح من بيانات غير ضياء قدر الإمكان على مستوى السيرفر.

## طريقة التركيب
1. ارفع ملفات `index.html`, `app.js`, `styles.css`, `config.js` إلى GitHub Pages بدل النسخة الحالية.
2. افتح Apps Script، واستبدل الكود بملف `Google_Apps_Script_V1857_ES14_Accounting_Merge.gs`.
3. تأكد أن `appsscript.json` فيه نفس الصلاحيات.
4. اعمل Deploy جديد للـ Web App لو غيرت السكريبت، أو استخدم نفس الرابط لو بتعدل نفس المشروع.
5. افتح الرابط مع كسر الكاش: `?v=1857-es14-accounting-merge`.

## ملاحظة مهمة
ملف EasyStore الكامل لم يكن ضمن نفس الأسماء بعد رفع ملفات TrendOS لأن `app.js` الحالي هو TrendOS. هذا الباتش يجهز ربط TrendOS وBackend ويجبر روابط EasyStore على ES14، ويحتاج رفع/تطبيق نفس صلاحيات ES14 داخل مستودع EasyStore إذا كانت ملفاته منفصلة.


==============================
V1857 Fix 5 - تعديلات ضياء بعد التجربة
==============================
1) إغلاق قائمة فاتورة العميل عند الضغط خارجها أو اختيار أي أمر.
2) الصنف الموقوف يظهر له زر تفعيل ويرجع للاختيارات بعد التفعيل.
3) زر تعديل في الأصناف/مطبخ الحسابات يحمّل البيانات للفورم لتعديل الأسعار.
4) إضافة نوع خامة paper pack / باكيت ورق لحساب تكلفة الورقة من سعر الباكو وعدد الورق.
5) فاتورة القسم تدعم اختيار كل أصناف القسم وإضافة أكثر من صف/باند ثم تسجيلهم.

مهم:
- ملفات TrendOS تترفع على repo TrendOS.
- مجلد EasyStore_ES14_Fix5_patch يترفع محتواه على repo EasyStore لأن لقطات الشاشة من EasyStore نفسه.
- ملف Google_Apps_Script_V1857_ES14_Accounting_Merge.gs يتنسخ في Apps Script.
