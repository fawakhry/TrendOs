// TrendOS / Matbagy Benha - unified accounting configuration.
// TrendOS and EasyStore must use the same Apps Script deployment so invoices and debts stay in sync.
window.TREND_API_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";
window.API_URL = window.TREND_API_URL;
window.TRENDOS_UNIFIED_ACCOUNTING_BACKEND = true;
// اضبطه على رابط secure-proxy بعد نشره. عند تركه فارغًا يُستخدم Apps Script POST مباشرة.
window.MATBAGY_SECURE_API_PROXY_URL = "";

// ملفات مطبعجي يجب أن تعمل عبر HTTPS فقط حتى لا تنتقل الجلسة مكشوفة على الشبكة.
window.MATBAGY_REMOTE_FILES_URL = "https://files.matbagy.com";
window.MATBAGY_FILE_SERVER_URL = "https://files.matbagy.com";

// روابط أدوات الموظفين
window.MATBAGY_SHEETS_URL = "https://fawakhry.github.io/Matbagy/?from=trendos";
window.MATBAGY_ROTET_URL = "https://fawakhry.github.io/TrendOs/?rotet=matbagy";
window.MATBAGY_EASY_STORE_URL = "https://fawakhry.github.io/EasyStore/";
window.MATBAGY_LEAD_HUNTER_URL = "https://fawakhry.github.io/trendos-lead-hunter/";
window.MATBAGY_EASYSTORE_VERSION_PARAM = 'es50-v1925-fast-read-write-20260812a';

// صلاحيات الملفات والأدوات
window.MATBAGY_FILES_ALLOWED_EMPLOYEES = ['ضياء','جابر','وائل','diaa','gaber','jaber','wael'];
window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED = ['ضياء','ريفان','ريڤان','وائل','diaa','revan','rivan','wael'];
window.MATBAGY_LEAD_HUNTER_ALLOWED_EMPLOYEES = ['ضياء','رحمه','رحمة','ريفان','ريڤان','diaa','rahma','revan','rivan'];
window.MATBAGY_ACCOUNTING_ALLOWED_EMPLOYEES = ['ضياء','رحمه','رحمة','ريفان','ريڤان','وائل','جابر','diaa','rahma','revan','rivan','wael','gaber','jaber'];
window.MATBAGY_ACCOUNTING_PURCHASE_EMPLOYEES = ['ضياء','diaa'];
window.MATBAGY_ACCOUNTING_DEPT_ONLY_EMPLOYEES = ['وائل','جابر','wael','gaber','jaber'];

// SSO وتشغيل الحسابات
window.MATBAGY_EMPLOYEE_TOOL_SSO = true;
window.MATBAGY_SHEETS_FORCE_SSO = true;
window.MATBAGY_SHEETS_DISABLE_PHONE = true;
window.MATBAGY_SHEETS_DISABLE_ACTIVATION = true;
window.MATBAGY_USE_EASY_STORE_FOR_ACCOUNTING = true;
window.MATBAGY_CUSTOMER_ACCOUNTS_PORTAL = true;
window.MATBAGY_AUTO_INVOICE_REVIEW_LINK = true;

// رفع العميل المباشر متوقف حالياً
window.MATBAGY_FAST_PRINT_UPLOAD_URL = '';
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = [];

// Clean build flags
window.MATBAGY_BUILD_VERSION = 'TrendOS V1931 Trend Master';
window.MATBAGY_BATCH_VERSION = 'V1931_TREND_MASTER';
window.MATBAGY_PATCH29_DEPT_INVOICE = false;
window.MATBAGY_ES14_ACCOUNTING_MERGE = true;
window.MATBAGY_EASYSTORE_FIX5 = false;
window.MATBAGY_V1896_DEBT_ADDORDER_CATALOG_HARD_LOCK = true;
window.MATBAGY_V1860_ES17_INTERNATIONAL_UI_THEME = true;
window.MATBAGY_UI_THEME_VERSION = 'V1931_TREND_MASTER';

window.MATBAGY_V1896_DEBT_ADDORDER_CATALOG_HARD_LOCK = true;

// V1899 tools
window.MATBAGY_FIBER_EZCAD_URL = "https://fawakhry.github.io/fiber-auto-max-ezcad/";
window.MATBAGY_V1900_BULK_DELIVER_READY = true;

// V1903 External / Walk-in customers
window.MATBAGY_V1904_INVOICE_ROWS_ENTER_TAB = true;

// V1906 Matbagy Sheets Access
window.MATBAGY_SHEETS_ALLOWED_EMPLOYEES = ['ضياء','ريفان','ريڤان','وائل','diaa','revan','rivan','wael'];
window.MATBAGY_V1906_SHEETS_ACCESS = true;
window.MATBAGY_BUILD_VERSION = 'TrendOS V1931 Trend Master';
window.MATBAGY_BATCH_VERSION = 'V1931_TREND_MASTER';
window.MATBAGY_UI_THEME_VERSION = 'V1931_TREND_MASTER';
window.MATBAGY_V1921_SEMI_AUTOMATIC_ACCOUNTING = true;
window.MATBAGY_V1922_UNIFIED_SAFE_BUILD = true;
window.MATBAGY_V1923_OPEN_ORDER_VISIBILITY = true;
window.MATBAGY_V1926_BULK_STATUS = true;
window.MATBAGY_V1926_ARCHIVE_DELIVERED = true;
window.MATBAGY_V1931_TREND_MASTER = true;
window.MATBAGY_V1931_SERVER_PAGING = true;
window.MATBAGY_V1931_DEBT_RESTRICTION_LIST = true;
window.MATBAGY_V1931_AUTOMATION_CENTER = true;

// V1932 management layer
window.MATBAGY_MANAGER_CENTER_V1932 = true;
window.MATBAGY_CUSTOMER_MANAGER_V1 = true;
window.MATBAGY_DISABLE_DEMO_OPERATIONS = true;

function trendLoadModuleV1932(id, src){
  if (document.getElementById(id)) return;
  var s=document.createElement('script'); s.id=id; s.src=src; s.defer=true;
  (document.head || document.documentElement).appendChild(s);
}

// Attendance / daily employee operation V1
window.MATBAGY_ATTENDANCE_V1 = true;
trendLoadModuleV1932('trendAttendanceV1Loader','attendance-v1.js?v=20260824f');

// Manager command center is admin-only by design.
trendLoadModuleV1932('trendManagerCenterV1932Loader','manager-center-v1932.js?v=20260824f');

// Customer Manager probes the backend first and stays hidden until the V1932 Apps Script route is deployed.
trendLoadModuleV1932('trendCustomerManagerV1Loader','customer-manager-v1.js?v=20260824f');

// Employee V2: two independent strips — coach + direct manager follow-up.
window.MATBAGY_EMPLOYEE_OPS_COACH_V1 = false;
window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2 = true;
trendLoadModuleV1932('trendEmployeeManagerStripsV2Loader','employee-manager-strips-v2.js?v=20260824f');

// Go-Live 01/09: Ready -> invoice draft -> authorized final invoice -> WhatsApp ready message.
window.MATBAGY_GO_LIVE_AUTOPILOT_V1 = true;
trendLoadModuleV1932('trendGoLiveAutopilotV1Loader','go-live-autopilot-v1.js?v=20260824f');
