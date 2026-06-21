مطبعجي مصر V1856 Patch 01 - معاينة الزائر + أماكن الإعلان + عميل تجربة + حذف الإعلان

النسخة مبنية كـ Patch فوق V1856 ولا تعيد بناء المشروع من الصفر.

الملفات المتعدلة:
- index.html
- app.js
- styles.css
- Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs
- config.js كما هو

الجديد في الواجهة:
1) زر في لوحة ضياء باسم: 👁️ كما يظهر للزائرين
   - يفتح واجهة العميل/الزائر للمعاينة فقط.
   - لا يسجل أوردرات ولا يغير بيانات العملاء.
   - زر الخروج يتحول إلى رجوع للوحة ضياء.

2) زر في إضافة العملاء باسم: تجهيز عميل تجربة ضياء / 1234
   - ينشئ أو يحدث عميل تجربة ثابت.
   - كود الشات: diaa
   - كلمة المرور: 1234
   - لا يطلب تغيير كلمة المرور.

3) تطوير استوديو الإعلانات:
   - اختيار مكان الإعلان:
     * أعلى الواجهة
     * قبل سوق مطبعجي
     * قبل فروع مطبعجي
   - الواجهة تظهر أمام ضياء كمعاينة شبيهة بواجهة العميل.
   - يمكن سحب الإعلان، تكبيره، تصغيره، وتحريكه داخل مكان ظهوره.

4) زر حذف إعلان في لوحة الإدارة:
   - يظهر لكل إعلان في قائمة الإعلانات.
   - يوجد تأكيد قبل الحذف.
   - يحذف صف الإعلان من شيت إعلانات المنصة.
   - يحاول نقل ملف الصورة في Google Drive إلى سلة المهملات.

Actions جديدة في Apps Script:
- ensureDemoCustomer
- deletePlatformAd

تحديثات شيت إعلانات المنصة:
- إضافة عمود: مكان الإعلان

خطوات GitHub:
1) افتح الريبو: https://github.com/fawakhry/TrendOs
2) ارفع الملفات التالية بدل القديمة:
   - index.html
   - app.js
   - styles.css
   - config.js
3) اعمل Commit باسم:
   V1856 Patch 01 - Visitor Preview, Ad Placement, Demo Customer, Delete Ads
4) افتح الرابط بعد الرفع:
   https://fawakhry.github.io/TrendOs/?v=1856-patch01

خطوات Apps Script New Version Deploy:
1) افتح مشروع Apps Script الحالي.
2) استبدل الكود بملف:
   Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs
3) Save.
4) Deploy > Manage deployments.
5) Edit deployment.
6) Version: New version.
7) Deploy.
8) افتح الرابط مرة واحدة لتجهيز أعمدة الإعلانات:
   ?action=initPlatformAds

اختبار سريع بعد النشر:
1) ادخل بحساب ضياء.
2) اضغط 👁️ كما يظهر للزائرين.
3) ارجع للوحة ضياء.
4) افتح تاب رحمة واضغط تجهيز عميل تجربة ضياء / 1234.
5) ادخل من بوابة العملاء بكود diaa وكلمة مرور 1234.
6) ارفع إعلان وحدد مكانه وحركه وكبره.
7) حدث واجهة العميل وتأكد من ظهوره في المكان المحدد.
8) اضغط حذف الإعلان وتأكد من اختفائه.

علامة نجاح النسخة:
✅ Matbagy Egypt V1856 Patch 01 Applied Successfully - Visitor Preview, Demo Customer, Ad Placement, Delete Ads - No Core Features Broken
