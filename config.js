// TrendOS / Matbagy Benha - unified accounting configuration.
// TrendOS and EasyStore must use the same Apps Script deployment so invoices and debts stay in sync.
window.WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";
window.TREND_API_URL = window.WEB_APP_URL;
window.API_URL = window.WEB_APP_URL;
window.TRENDOS_SHEET_ID = "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
window.TRENDOS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/edit";
window.OPERATION_TIMEZONE = "Africa/Cairo";
window.TRENDOS_UNIFIED_ACCOUNTING_BACKEND = true;
window.MATBAGY_SECURE_API_PROXY_URL = "";

// D1 Orders read cutover is loaded but stays OFF until the Production Worker gate passes.
// Writes remain on Apps Script/Sheets and the wrapper always falls back to Apps Script on any Edge error.
window.MATBAGY_EDGE_ORDERS_API_URL = "https://trendos.trendmall-contact.workers.dev";
window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false;

window.MATBAGY_REMOTE_FILES_URL = "https://files.matbagy.com";
window.MATBAGY_FILE_SERVER_URL = "https://files.matbagy.com";
window.MATBAGY_SHEETS_URL = "https://fawakhry.github.io/Matbagy/?from=trendos";
window.MATBAGY_ROTET_URL = "https://fawakhry.github.io/TrendOs/?rotet=matbagy";
window.MATBAGY_EASY_STORE_URL = "https://fawakhry.github.io/EasyStore/";
window.MATBAGY_LEAD_HUNTER_URL = "https://fawakhry.github.io/trendos-lead-hunter/";
window.MATBAGY_EASYSTORE_VERSION_PARAM = 'es50-v1925-fast-read-write-20260812a';

window.MATBAGY_FILES_ALLOWED_EMPLOYEES = ['ضياء','جابر','وائل','diaa','gaber','jaber','wael'];
window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED = ['ضياء','ريفان','ريڤان','وائل','diaa','revan','rivan','wael'];
window.MATBAGY_LEAD_HUNTER_ALLOWED_EMPLOYEES = ['ضياء','رحمه','رحمة','ريفان','ريڤان','diaa','rahma','revan','rivan'];
window.MATBAGY_ACCOUNTING_ALLOWED_EMPLOYEES = ['ضياء','رحمه','رحمة','ريفان','ريڤان','وائل','جابر','diaa','rahma','revan','rivan','wael','gaber','jaber'];
window.MATBAGY_ACCOUNTING_PURCHASE_EMPLOYEES = ['ضياء','diaa'];
window.MATBAGY_ACCOUNTING_DEPT_ONLY_EMPLOYEES = ['وائل','جابر','wael','gaber','jaber'];

window.MATBAGY_EMPLOYEE_TOOL_SSO = true;
window.MATBAGY_SHEETS_FORCE_SSO = true;
window.MATBAGY_SHEETS_DISABLE_PHONE = true;
window.MATBAGY_SHEETS_DISABLE_ACTIVATION = true;
window.MATBAGY_USE_EASY_STORE_FOR_ACCOUNTING = true;
window.MATBAGY_CUSTOMER_ACCOUNTS_PORTAL = true;
window.MATBAGY_AUTO_INVOICE_REVIEW_LINK = true;
window.MATBAGY_FAST_PRINT_UPLOAD_URL = '';
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = [];

window.MATBAGY_BUILD_VERSION = 'TrendOS V1932 Platform Fixes 2026-08-24';
window.MATBAGY_BATCH_VERSION = 'V1932_PLATFORM_FIXES_20260824';
window.MATBAGY_PATCH29_DEPT_INVOICE = false;
window.MATBAGY_ES14_ACCOUNTING_MERGE = true;
window.MATBAGY_EASYSTORE_FIX5 = false;
window.MATBAGY_V1896_DEBT_ADDORDER_CATALOG_HARD_LOCK = true;
window.MATBAGY_V1860_ES17_INTERNATIONAL_UI_THEME = true;
window.MATBAGY_UI_THEME_VERSION = 'V1932_DAILY_MGMT_HR_PRESS_CLOCKIN';
window.MATBAGY_FIBER_EZCAD_URL = "https://fawakhry.github.io/fiber-auto-max-ezcad/";
window.MATBAGY_V1900_BULK_DELIVER_READY = true;
window.MATBAGY_V1904_INVOICE_ROWS_ENTER_TAB = true;
window.MATBAGY_SHEETS_ALLOWED_EMPLOYEES = ['ضياء','ريفان','ريڤان','وائل','diaa','revan','rivan','wael'];
window.MATBAGY_V1906_SHEETS_ACCESS = true;
window.MATBAGY_V1921_SEMI_AUTOMATIC_ACCOUNTING = true;
window.MATBAGY_V1922_UNIFIED_SAFE_BUILD = true;
window.MATBAGY_V1923_OPEN_ORDER_VISIBILITY = true;
window.MATBAGY_V1926_BULK_STATUS = true;
window.MATBAGY_V1926_ARCHIVE_DELIVERED = true;
window.MATBAGY_V1931_TREND_MASTER = true;
window.MATBAGY_V1931_SERVER_PAGING = true;
window.MATBAGY_V1931_DEBT_RESTRICTION_LIST = true;
window.MATBAGY_V1931_AUTOMATION_CENTER = true;

window.MATBAGY_MANAGER_CENTER_V1932 = true;
window.MATBAGY_CUSTOMER_MANAGER_V1 = true;
window.MATBAGY_DISABLE_DEMO_OPERATIONS = true;

function trendLoadModuleV1932(id, src){
  if (document.getElementById(id)) return;
  var s=document.createElement('script'); s.id=id; s.src=src; s.defer=true;
  (document.head || document.documentElement).appendChild(s);
}

// Shared read-poll guard. Modules also retain local guards so startup remains
// fail-safe even if this small coordinator has not finished loading yet.
trendLoadModuleV1932('trendPollCoordinatorV1Loader','trendos-poll-coordinator-v1.js?v=20260904a');
trendLoadModuleV1932('trendEdgeOrdersReadV1Loader','trendos-edge-orders-read-v1.js?v=20260904a');

window.MATBAGY_ATTENDANCE_V1 = true;
trendLoadModuleV1932('trendAttendanceV1Loader','attendance-v1.js?v=20260824j');
window.__TRENDOS_ATTENDANCE_REST_LIMIT__ = 30;
trendLoadModuleV1932('trendAttendanceLiveTimerV1Loader','attendance-live-timer-v1.js?v=20260824a');

window.MATBAGY_ATTENDANCE_CLOCKIN_V1 = true;
window.TRENDOS_ATTENDANCE_START = '12:00';
trendLoadModuleV1932('trendAttendanceClockinV1Loader','attendance-clockin-ui-v1.js?v=20260824a');

window.MATBAGY_PRAYER_PREP_V1 = true;
trendLoadModuleV1932('trendPrayerPrepV1Loader','employee-prayer-prep-v1.js?v=20260824a');

// Daily pre-opening machine/place cleaning. Uses Cairo time and supports special-day overrides.
window.MATBAGY_CLEANING_PREP_V1 = true;
window.TRENDOS_DEFAULT_WORKDAY_START = '12:00';
window.TRENDOS_CLEANING_PREP_MINUTES = 30;
window.TRENDOS_WORKDAY_OVERRIDES = {'2026-08-25':'10:00','2026-08-26':'10:00'};
trendLoadModuleV1932('trendCleaningPrepV1Loader','employee-cleaning-prep-v1.js?v=20260824b');

// Compact HR self-service for all staff; admin receives broader HR data after backend deploy.
window.MATBAGY_HR_V1 = true;
trendLoadModuleV1932('trendHrV1Loader','hr-v1.js?v=20260824b');

// Press batch control for Rivan/Wael/admin.
window.MATBAGY_PRESS_CONTROL_V1 = true;
trendLoadModuleV1932('trendPressControlV1Loader','press-control-v1.js?v=20260904a');

trendLoadModuleV1932('trendManagerCenterV1932Loader','manager-center-v1932.js?v=20260824h');
trendLoadModuleV1932('trendCustomerManagerV1Loader','customer-manager-v1.js?v=20260824g');

window.MATBAGY_CUSTOMER_FEEDBACK_V1 = true;
trendLoadModuleV1932('trendCustomerFeedbackV1Loader','customer-feedback-v1.js?v=20260904a');

window.MATBAGY_EMPLOYEE_OPS_COACH_V1 = false;
window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2 = true;
trendLoadModuleV1932('trendEmployeeManagerStripsV2Loader','employee-manager-strips-v2.js?v=20260904a');

window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_DRAG_V2 = true;
trendLoadModuleV1932('trendEmployeeManagerStripsDragV2Loader','employee-manager-strips-drag-v2.js?v=20260824b');

window.MATBAGY_EMPLOYEE_ANDON_V1 = true;
trendLoadModuleV1932('trendEmployeeAndonV1Loader','employee-andon-v1.js?v=20260824b');

window.MATBAGY_GO_LIVE_AUTOPILOT_V1 = true;
trendLoadModuleV1932('trendGoLiveAutopilotV1Loader','go-live-autopilot-v1.js?v=20260824g');

// Unified floating tools, visible version, and one refresh point.
window.MATBAGY_OPERATIONS_HUB_V1 = true;
trendLoadModuleV1932('trendOperationsHubV1Loader','operations-hub-v1.js?v=20260904a');
