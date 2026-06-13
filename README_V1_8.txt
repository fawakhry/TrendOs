TrendOS Web V1.8 - Stable Current Order + Live Refresh
======================================================

الإصلاحات:
1) حل نهائي لمشكلة:
   currentOrderDepartments is not defined

2) الأوردر الحالي حسب المستخدم:
   - وائل / print: طباعة فقط
   - جابر / laser: ليزر فقط
   - ريفان: طباعة فقط
   - رحمة: طباعة + ليزر
   - ضياء / admin: طباعة + ليزر

3) الترتيب:
   - عاجل أولاً
   - ثم الأقدم إلى الأحدث حسب ترتيب الصف في الشيت.

4) التحديث اللحظي:
   - بعد إضافة أوردر: تحديث فوري للواجهة.
   - بعد حفظ حالة أو ملاحظة: تحديث فوري للواجهة.
   - كل الأجهزة المفتوحة تعمل تحديث تلقائي كل 10 ثواني.
   - عند الرجوع للتبويب يتم تحديث البيانات تلقائياً.
   - Apps Script يعمل SpreadsheetApp.flush() بعد كل كتابة.

الرفع:
1) على GitHub استبدل:
   index.html
   app.js
   styles.css
   config.js

2) في Apps Script استبدل الكود بملف:
   google_apps_script_trendos_web_v1_8.gs

3) Save
4) Deploy -> Manage deployments -> Edit -> New version -> Deploy

5) افتح:
https://fawakhry.github.io/TrendOs/?v=1801
