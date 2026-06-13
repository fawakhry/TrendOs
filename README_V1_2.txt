TrendOS Web V1.2
=================

التعديلين المطلوبين:
1) إظهار رقم العميل الخارجي في واجهات التشغيل، خصوصًا للطباعة والليزر.
2) إضافة فورم خدمة العملاء/الإدارة لإضافة أوردر جديد بدون دخول الشيت.

الملفات التي ترفع على GitHub:
- index.html
- app.js
- styles.css

لا تستبدل config.js لو هو مضبوط بالفعل.

Apps Script:
- استبدل الكود بـ google_apps_script_trendos_web_v1_2.gs
- Save
- Deploy -> Manage deployments -> Edit -> New version -> Deploy

افتح الموقع:
https://fawakhry.github.io/TrendOs/?v=1201

صلاحية إضافة الأوردر:
- admin
- service

وائل print لا يضيف أوردر، يرى الطباعة فقط مع رقم العميل.
جابر laser يرى الليزر فقط مع رقم العميل.
