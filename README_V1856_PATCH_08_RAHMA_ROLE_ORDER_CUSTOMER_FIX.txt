Matbagy Egypt V1856 Patch 08 - Rahma Role + Add Order + Customer Edit Fix

الهدف:
- رجوع كارت إضافة أوردر عند ضياء ورحمه.
- تقليل صلاحيات شاشة رحمه وإخفاء الحاجات المفتوحة زيادة.
- رحمه تشوف فقط ما تحتاجه في خدمة العملاء: متابعة الأوردرات وحالاتها، إضافة/تعديل عميل، إضافة أوردر، وإرسال/تقفيل بند فاتورة من زر التسعير.
- شاشة تعديل العميل: لو العميل موجود بنفس الاسم أو الرقم، يتم تعديل بياناته بدل رفض الحفظ أو عمل تكرار.
- الحفاظ على أزرار ملفات مطبعجي / مطبعجي شيتات / روتيت مطبعجي من Patch 07.
- دمج سيرفر الملفات المصحح 04M الذي اشتغل محلياً.

الملفات المعدلة:
- app.js
- index.html
- config.js
- Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs
- remote_file_server/* من نسخة 04M المصححة

صلاحيات ضياء:
- لوحة كاملة كما كانت.
- إضافة أوردر.
- إضافة/تعديل عميل.
- ملفات مطبعجي / شيتات / روتيت.

صلاحيات رحمه:
- شاشة خدمة العملاء.
- رؤية الأوردرات وحالاتها.
- إضافة أوردر.
- إضافة/تعديل العملاء.
- فتح فاتورة/تسعير من الأوردر لإرسال بند الفاتورة.
- لا يظهر لها: الماركت بليس، الإعلانات، الفرنشايز، White Label، الردود والذكاء، ربط الخدمات، أرقام العملاء المسحوبة.

ملاحظة config.js:
- مضبوط حالياً على IP السيرفر الداخلي الذي اشتغل:
  http://192.168.1.36:5050
- بعد تشغيل Cloudflare Tunnel غيّر السطرين إلى:
  https://files.matbagy.com

خطوات الرفع على GitHub:
1) ارفع index.html
2) ارفع app.js
3) ارفع styles.css
4) ارفع config.js
5) افتح البرنامج:
   https://fawakhry.github.io/TrendOs/?v=1856-patch08
6) اعمل Ctrl + F5

خطوات Apps Script:
1) افتح Apps Script.
2) استبدل ملف Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs.
3) Deploy > Manage deployments > Edit > New version > Deploy.

علامة نجاح النسخة:
✅ Matbagy Egypt V1856 Patch 08 Applied Successfully - Rahma Permissions + Add Order + Customer Edit Ready
