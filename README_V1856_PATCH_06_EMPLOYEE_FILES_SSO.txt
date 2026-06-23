مطبعجي مصر V1856 Patch 06 - Employee Files SSO

الهدف:
- زر ملفات مطبعجي داخل شاشة الموظف.
- الموظف لا يكتب يوزر وباسورد مرة ثانية في بوابة الملفات.
- المسموح فقط: ضياء، وائل، جابر.
- حذف fokha من صلاحيات ملفات السيرفر.
- إلغاء ظهور رفع العميل المباشر حالياً.

مكان الزر:
- بعد دخول الموظف في برنامج مطبعجي، ستجد زر: 📁 ملفات مطبعجي في الشريط العلوي بجانب تحديث الآن.
- يظهر فقط لحسابات ضياء / وائل / جابر.

آلية الدخول:
- البرنامج يفتح رابط /trendos-sso ويرسل اسم الموظف + توكن جلسة TrendOS.
- سيرفر الملفات يتحقق من Apps Script action=verifyEmployeeSession.
- بعد التحقق يفتح فولدر الموظف تلقائياً.

صلاحيات الملفات:
- ضياء: D:\Matbagy_Files بالكامل + رفع + حذف + إنشاء فولدر.
- وائل: D:\Matbagy_Files\print فقط + رفع + إنشاء فولدر بدون حذف.
- جابر: D:\Matbagy_Files\laser فقط + رفع + إنشاء فولدر بدون حذف.

خطوات GitHub:
1) ارفع index.html و app.js و styles.css و config.js.
2) Commit باسم: V1856 Patch 06 - Employee Files SSO
3) افتح: https://fawakhry.github.io/TrendOs/?v=1856-patch06
4) اعمل Ctrl+F5.

خطوات Apps Script:
1) استبدل ملف GS.
2) Deploy > Manage deployments > Edit > New version > Deploy.

خطوات جهاز السيرفر:
1) اقفل شاشة السيرفر السوداء.
2) انسخ محتويات remote_file_server إلى D:\Matbagy_Remote_Files.
3) شغل setup_folders.bat.
4) شغل run_matbagy_remote_files.bat.
5) جرّب من برنامج مطبعجي زر 📁 ملفات مطبعجي.

ملاحظة للتجربة قبل Cloudflare:
- في config.js اجعل MATBAGY_REMOTE_FILES_URL = "http://127.0.0.1:5050" فقط أثناء التجربة على نفس جهاز السيرفر.
- بعد Cloudflare رجعها إلى https://files.matbagy.com.

علامة نجاح النسخة:
✅ Matbagy Egypt V1856 Patch 06 Applied Successfully - Employee Files SSO Ready - Diaa/Wael/Gaber Only
