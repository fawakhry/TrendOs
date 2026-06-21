مطبعجي مصر V1856 Patch 05 - ملغى + فلتر مكبس

الملفات المتعدلة:
- app.js
- index.html
- styles.css
- Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs
- config.js كما هو

الجديد:
1) إضافة حالة / باند جديد باسم: ملغى
   - تظهر في اختيار حالة البند داخل جدول الأوردرات.
   - تظهر في فلتر الحالة.
   - عند اختيارها وحفظها يختفي الأوردر من الشاشة اليومية الافتراضية حتى لا يزحم التشغيل.
   - يمكن عرض الأوردرات الملغاة من فلتر الحالة: ملغى.
   - رد واتساب الحالة لو الأوردر ملغى يرسل رسالة إلغاء مناسبة.

2) تثبيت فلتر المكبس:
   - فلتر: كل الأوردرات / مكبس فقط / بدون مكبس.
   - يعمل مع البحث والحالة والأولوية.
   - يظهر عداد مكبس في شريط الإحصائيات.

3) تحديث Apps Script:
   - إضافة ملغى إلى قوائم التحقق Data Validation للحالة في شيت بنود الأوردرات وشيت الأوردرات.
   - اعتبار ملغى حالة مخفية من التشغيل اليومي مثل تم التسليم وجاهز للاستلام.

خطوات GitHub:
1) ارفع الملفات: index.html و app.js و styles.css و config.js.
2) Commit باسم:
   V1856 Patch 05 - Cancelled Orders and Heat Press Filter
3) افتح الرابط:
   https://fawakhry.github.io/TrendOs/?v=1856-patch05
4) اعمل Ctrl + F5 عند أول فتح.

خطوات Apps Script:
1) افتح Apps Script الحالي.
2) استبدل الكود بملف Google_Apps_Script_V1856_Full_WhatsApp_Marketplace_Rahma.gs من هذا الباتش.
3) Save.
4) Deploy > Manage deployments > Edit > Version: New version > Deploy.
5) لتحديث قوائم التحقق في الشيت افتح مرة واحدة رابط الـ API مع:
   ?action=resetTrendOSValidations

اختبار النجاح:
- افتح أوردر، غيّر الحالة إلى ملغى، واضغط حفظ.
- الأوردر يختفي من الشاشة الافتراضية.
- اختر فلتر الحالة ملغى، يظهر الأوردر الملغى.
- اختر فلتر مكبس فقط، تظهر أوردرات المكبس فقط.

علامة نجاح النسخة:
✅ Matbagy Egypt V1856 Patch 05 Applied Successfully - Cancelled Status + Heat Press Filter Ready - Core Features Preserved
