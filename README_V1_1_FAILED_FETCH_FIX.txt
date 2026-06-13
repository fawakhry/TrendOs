TrendOS Web V1.1 - Failed to fetch Fix

سبب المشكلة:
GitHub Pages بيحاول يعمل fetch مباشر لـ Google Apps Script، وده ممكن يتمنع بسبب CORS فتظهر رسالة Failed to fetch.

التعديل:
- app.js أصبح يستخدم JSONP بدل fetch.
- Apps Script أصبح يرجع JavaScript callback لو موجود callback في الرابط.

طريقة الرفع:
1) استبدل app.js على GitHub.
2) افتح Apps Script الخاص بـ TrendOS Web.
3) استبدل الكود بـ google_apps_script_trendos_web_v1.gs الموجود هنا.
4) Deploy -> Manage deployments -> Edit -> New version -> Deploy.
5) افتح الموقع بكسر كاش:
https://fawakhry.github.io/TrendOs/?v=1101

مهم:
config.js يظل فيه رابط Apps Script الجديد.
