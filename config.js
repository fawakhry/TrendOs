window.TREND_API_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";

// ملفات مطبعجي داخل شبكة المطبعة حالياً على IP جهاز السيرفر.
// بعد Cloudflare Tunnel غيّر السطرين إلى: https://files.matbagy.com
window.MATBAGY_REMOTE_FILES_URL = "http://192.168.1.36:5050";
window.MATBAGY_FILE_SERVER_URL = "http://192.168.1.36:5050";

// الحسابات المسموح لها بزر ملفات مطبعجي داخل شاشة الموظف.
window.MATBAGY_FILES_ALLOWED_EMPLOYEES = ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];

// أزرار الموظف السريعة. تفتح من شاشة الموظف بدون تسجيل دخول منفصل.
window.MATBAGY_SHEETS_URL = "https://fawakhry.github.io/Matbagy/?from=trendos";
window.MATBAGY_ROTET_URL = "https://fawakhry.github.io/TrendOs/?rotet=matbagy";
window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED = ["ضياء", "رحمه", "رحمة", "ريفان", "ريڤان", "جابر", "وائل", "diaa", "rahma", "revan", "rivan", "gaber", "wael"];
window.MATBAGY_EMPLOYEE_TOOL_SSO = true;

// ألغينا رفع العميل المباشر حالياً.
window.MATBAGY_FAST_PRINT_UPLOAD_URL = "";
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = [];

// Patch 11 - حسابات مطبعجي
window.MATBAGY_ACCOUNTING_ALLOWED_EMPLOYEES = ["ضياء", "رحمه", "رحمة", "ريفان", "ريڤان", "وائل", "جابر", "diaa", "rahma", "revan", "rivan", "wael", "gaber", "jaber"];


// Patch 19 - تشغيل الشيتات والحسابات بدون تسجيل دخول منفصل للموظفين.
window.MATBAGY_EMPLOYEE_TOOL_SSO = true;
window.MATBAGY_SHEETS_FORCE_SSO = true;

// Easy Store / مطبخ الحسابات الخارجي. عدّل الرابط لو اسم الريبو مختلف عندك.
window.MATBAGY_EASY_STORE_URL = window.MATBAGY_EASY_STORE_URL || "https://fawakhry.github.io/EasyStore/";
window.MATBAGY_USE_EASY_STORE_FOR_ACCOUNTING = true;
