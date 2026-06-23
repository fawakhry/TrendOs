window.TREND_API_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";

// ملفات مطبعجي داخل شبكة المطبعة حالياً.
// بعد تشغيل Cloudflare Tunnel غيّر السطرين إلى: https://files.matbagy.com
window.MATBAGY_REMOTE_FILES_URL = "http://192.168.1.36:5050";
window.MATBAGY_FILE_SERVER_URL = "http://192.168.1.36:5050";

// الحسابات المسموح لها بزر ملفات مطبعجي داخل شاشة الموظف.
window.MATBAGY_FILES_ALLOWED_EMPLOYEES = ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];

// أزرار الموظف السريعة. تفتح من شاشة الموظف بدون تسجيل دخول منفصل.
window.MATBAGY_SHEETS_URL = "https://fawakhry.github.io/Matbagy/?from=trendos";
window.MATBAGY_ROTET_URL = "https://fawakhry.github.io/TrendOs/?rotet=matbagy";
window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED = ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];
window.MATBAGY_EMPLOYEE_TOOL_SSO = true;

// ألغينا رفع العميل المباشر حالياً.
window.MATBAGY_FAST_PRINT_UPLOAD_URL = "";
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = [];

// برنامج الحسابات وحاسبة جابر داخل نفس شاشة الموظف.
window.MATBAGY_ACCOUNTS_URL = "Trend_Accounts_V1857_Calculator_Linked.html";
window.MATBAGY_ACCOUNTS_ALLOWED_EMPLOYEES = ["ضياء", "رحمه", "رحمة", "ريفان", "وائل", "جابر", "diaa", "rahma", "rehma", "revan", "rivan", "wael", "gaber", "jaber"];
window.MATBAGY_ACCOUNTS_EMBEDDED = true;


// Patch 16 - صلاحيات الحسابات وتقفيل الأقسام
window.MATBAGY_ACCOUNTS_SECTION_EMPLOYEES = ["وائل", "جابر", "wael", "gaber", "jaber"];
window.MATBAGY_LASER_CALC_ALLOWED_EMPLOYEES = ["ضياء", "جابر", "diaa", "gaber", "jaber"];
window.MATBAGY_INVOICE_APPROVAL_EMPLOYEES = ["ضياء", "رحمه", "رحمة", "ريفان", "diaa", "rahma", "rehma", "revan", "rivan"];
window.MATBAGY_PROFIT_REPORTS_EMPLOYEES = ["ضياء", "diaa"];

// Patch 17 - ربط برنامج مطبعجي وبرنامج الحسابات في نظام واحد
// برنامج الحسابات يستخدم نفس رابط Apps Script الخاص ببرنامج مطبعجي، بدون خانة ربط منفصلة.
window.MATBAGY_ACCOUNTS_UNIFIED_WITH_TRENDOS = true;
window.MATBAGY_ACCOUNTS_API_URL = window.TREND_API_URL;
