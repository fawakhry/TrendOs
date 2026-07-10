TrendOS V1898 - Basic Operations + Cleanup
==========================================

الرفع على GitHub Pages:
1) ارفع الملفات التالية مكان القديمة في repo TrendOS:
- index.html
- app.js
- styles.css
- config.js
- appsscript.json
- matbagy_theme_v1860.css
- matbagy_theme_v1860.js
- Trend_Accounts_V1857_Calculator_Linked.html

تحديث Apps Script:
1) افتح مشروع Apps Script الحالي.
2) أضف ملف جديد باسم: TrendOS_AppsScript_Patch_V1898.gs
3) انسخ محتوى الملف المرفق بنفس الاسم.
4) في أول doGet(e) أضف:
const v1898Response = trendosV1898TryRoute_(e, null);
if (v1898Response) return v1898Response;

5) في doPost(e) بعد قراءة JSON في payload أضف:
const v1898Response = trendosV1898TryRoute_(e, payload);
if (v1898Response) return v1898Response;

6) Deploy > Manage deployments > Edit > Version: New version > Deploy.

اختبارات سريعة:
- افتح TrendOS وسجل دخول ضياء.
- تأكد أن الحالات الجديدة ظهرت في إضافة الأوردر وتعديل الحالة.
- اضغط عداد جاهز للاستلام أو تم التسليم اليوم أو مكرر أو ملغي وتأكد أنه يفلتر الجدول.
- افتح كارت تنضيف وأرشفة الأوردرات المقفولة من حساب ضياء.
- اضغط معاينة قبل التنضيف ثم نفذ بعد التأكد.

الرجوع للنسخة السابقة:
- ارجع ملفات app_original_v1897.js / index_original_v1897.html / styles_original_v1897.css / config_original_v1897.js لو احتجت.
- أو اعمل Revert للـ commit على GitHub.


---
تحديث V1899:
- تم إضافة زر جديد باسم: مراقب مطبعجى.
- الرابط: https://fawakhry.github.io/trendos-lead-hunter/
- الظهور فقط لحسابات: ضياء، رحمه، ريفان.
- لا يحتاج تعديل Apps Script؛ التعديل Frontend فقط في index.html + app.js + config.js.
