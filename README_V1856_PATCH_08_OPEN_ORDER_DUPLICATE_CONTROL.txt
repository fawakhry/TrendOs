Matbagy Egypt V1856 - Patch 08
Open Order Duplicate Control

الهدف:
إضافة كنترول قبل تسجيل أوردر جديد من رحمة أو ضياء، بحيث يظهر تنبيه إذا كان العميل له أوردر مفتوح سابقاً.

الجديد في النسخة:
1) عند كتابة/اختيار اسم العميل أو رقم التليفون في إضافة أوردر جديد، البرنامج يفحص الأوردرات المفتوحة.
2) يظهر صندوق تحذير داخل فورم إضافة الأوردر لو العميل له أوردر مفتوح.
3) عند الضغط على إضافة الأوردر، البرنامج يوقف التسجيل مؤقتاً ويعرض أرقام الأوردرات المفتوحة.
4) المستخدم يختار:
   - موافق: تسجيله كأوردر جديد فعلاً.
   - إلغاء: وقف التسجيل ومراجعة الأوردر القديم.
5) السيرفر نفسه يمنع التسجيل بدون تأكيد duplicateOverride، حتى لو الواجهة لم تفحص.
6) الفحص يعتمد على رقم العميل إن موجود، أو اسم الشات/العميل لو الرقم غير موجود.
7) الحالات التي تعتبر مقفولة ولا تظهر في التحذير:
   - تم التسليم
   - ملغى
   - مكرر
8) جاهز للاستلام يعتبر أوردر مفتوح لأنه لم يتم تسليمه للعميل بعد.

الملفات المتغيرة:
- index.html
- app.js
- styles.css
- config.js
- Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs

خطوات GitHub:
1) ارفع الملفات:
   index.html
   app.js
   styles.css
   config.js
2) افتح البرنامج:
   https://fawakhry.github.io/TrendOs/?v=1856-patch08
3) اعمل Ctrl + F5

خطوات Apps Script:
1) افتح Apps Script.
2) استبدل ملف Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs.
3) Deploy > Manage deployments > Edit > New version > Deploy.

مهم:
- هذه النسخة أبقت رابط ملفات مطبعجي الداخلي على:
  http://192.168.1.36:5050
- بعد تشغيل Cloudflare Tunnel، غيّر config.js إلى:
  https://files.matbagy.com

علامة النجاح:
✅ Matbagy Egypt V1856 Patch 08 Applied Successfully - Open Order Duplicate Control Ready
