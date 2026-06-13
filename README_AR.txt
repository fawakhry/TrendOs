TrendOS Web V1 - Department Dashboards

الهدف:
إلغاء تعامل الموظفين مع Google Sheet مباشرة.
الشيت يصبح Database فقط.
كل مستخدم يدخل على واجهته حسب الصلاحية.

الملفات:
index.html
styles.css
config.js
app.js
google_apps_script_trendos_web_v1.gs

طريقة التشغيل:
1) افتح شيت TrendOS Operations.
2) Extensions -> Apps Script.
3) الصق google_apps_script_trendos_web_v1.gs.
4) Deploy -> New deployment -> Web app.
5) Execute as: Me
6) Who has access: Anyone
7) انسخ Web App URL.
8) ضعه في config.js مكان PUT_APPS_SCRIPT_WEB_APP_URL_HERE.
9) ارفع ملفات الواجهة على GitHub Pages.

المستخدمين:
يتم القراءة من شيت المستخدمين.
كلمة المرور الافتراضية: 0000.
كل مستخدم يستطيع تغيير كلمة المرور من داخل البرنامج:
القديمة -> الجديدة -> تأكيد الجديدة.

الصلاحيات:
مدير/admin: كل الشاشات.
طباعة: شاشة الطباعة فقط.
ليزر: شاشة الليزر فقط.
مكبس: شاشة المكبس فقط.
خدمة العملاء: شاشة خدمة العملاء فقط.

ملاحظة:
هذا V1 لتشغيل الأقسام ومنع الموظفين من لمس الشيت والمعادلات.
