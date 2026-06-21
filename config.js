window.TREND_API_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";

// V1856 Patch 06 - ملفات مطبعجي من شاشة الموظف بدون تسجيل دخول منفصل.
// بعد تشغيل Cloudflare Tunnel استخدم: https://files.matbagy.com
window.MATBAGY_REMOTE_FILES_URL = "http://127.0.0.1:5050";
// للتجربة على نفس جهاز السيرفر قبل تفعيل Cloudflare، يمكن مؤقتاً جعل الرابط أعلاه: http://127.0.0.1:5050
window.MATBAGY_FILE_SERVER_URL = "http://127.0.0.1:5050";

// الحسابات المسموح لها برؤية زر ملفات مطبعجي داخل شاشة الموظف.
window.MATBAGY_FILES_ALLOWED_EMPLOYEES = ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];

// ألغينا رفع العميل المباشر حالياً. اتركها فاضية حتى لا يظهر زر للعميل.
window.MATBAGY_FAST_PRINT_UPLOAD_URL = "";
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = [];
