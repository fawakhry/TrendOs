// TrendOS / Matbagy Benha - unified accounting configuration.
// Legacy authority stays on its existing server-side deployment. Browser uses explicit Cloud transport.
window.WEB_APP_URL = ""; // Deprecated: upstream URL is server-only; aliases are not repointed.
window.TREND_API_URL = window.WEB_APP_URL;
window.API_URL = window.WEB_APP_URL;
window.TRENDOS_SHEET_ID = "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
window.TRENDOS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/edit";
window.OPERATION_TIMEZONE = "Africa/Cairo";
window.TRENDOS_UNIFIED_ACCOUNTING_BACKEND = true;
window.MATBAGY_SECURE_API_PROXY_URL = "";

// Production Orders read cutover 02CT: qualified D1 route first for getRowsPageV1931 only.
// Legacy actions use Cloud transport; Orders freshness failures fail closed.
window.MATBAGY_EDGE_ORDERS_API_URL = "https://trendos-d1-api.trendmall-contact.workers.dev";

// T12 A61 employee API dispatcher foundation. Default-OFF: no runtime change
// until native employee auth and the temporary legacy bridge are separately qualified.
window.MATBAGY_EMPLOYEE_API_URL = window.MATBAGY_EDGE_ORDERS_API_URL;
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = true;
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1 = false;
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS = [];
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_MIN_BRIDGE_POLICIES = 0;
window.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT = 6;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false;
window.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = [];
// Entry617: Ops family READONLY cutover. Auth and Bridge remain OFF.
window.MATBAGY_EMPLOYEE_OPS_CUTOVER_MODE = 'GENERAL';
window.MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE = 'READONLY';
window.MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE = 'GENERAL';
window.MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE = 'READONLY';
window.MATBAGY_EMPLOYEE_COMMS_CUTOVER_MODE = 'READONLY';

window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true;
window.MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED = true;
window.MATBAGY_EDGE_ORDERS_CANARY_ONLY = false;
window.MATBAGY_EDGE_ORDERS_CANARY_USERS = ['وائل','wael'];
window.MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS = ['print','laser','press','service'];
// Stale D1 Orders mirrors fail closed; no direct Google fallback.
window.MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS = 5 * 60 * 1000;

window.MATBAGY_REMOTE_FILES_URL = "https://files.matbagy.com";
window.MATBAGY_FILE_SERVER_URL = "https://files.matbagy.com";
window.MATBAGY_SHEETS_URL = "https://fawakhry.github.io/Matbagy/?from=trendos";
window.MATBAGY_ROTET_URL = "https://trendos-ui.trendmall-contact.workers.dev/?rotet=matbagy";
window.MATBAGY_EASY_STORE_URL = "https://fawakhry.github.io/EasyStore/";
window.MATBAGY_LEAD_HUNTER_URL = "https://fawakhry.github.io/trendos-lead-hunter/";
window.MATBAGY_EASYSTORE_VERSION_PARAM = 'entry619-d1-readonly-sso2-20261004';

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

// Trend Master safe resilience: manual/on-demand only. The app hotfix keeps platform-load fanout disabled.
// At most two Apps Script panel reads may run together; no automatic retry and no automatic day-close preview.
window.MATBAGY_TREND_MASTER_RESILIENCE_V1 = true;
window.MATBAGY_TREND_MASTER_MAX_CONCURRENCY = 2;
window.MATBAGY_TREND_MASTER_MAX_ATTEMPTS = 1;
window.MATBAGY_TREND_MASTER_PANEL_TIMEOUTS = {
  summary: 30000,
  archive: 60000,
  messages: 30000,
  stock: 30000,
  employee: 30000,
  debt: 30000,
  dayclose: 120000
};

window.MATBAGY_MANAGER_CENTER_V1932 = true;
window.MATBAGY_CUSTOMER_MANAGER_V1 = true;
window.MATBAGY_DISABLE_DEMO_OPERATIONS = true;

function trendLoadModuleV1932(id, src){
  if (document.getElementById(id)) return;
  var s=document.createElement('script'); s.id=id; s.src=src; s.defer=true;
  (document.head || document.documentElement).appendChild(s);
}

// Entry603 login-fast surface: no employee runtime modules are fetched on the
// unauthenticated entry/login screen. Critical Cloud routing starts only after
// an employee session exists; non-critical tools are queued after first paint.
var TRENDOS_AUTH_CRITICAL_MODULES_V1 = [
  ['trendEdgeOrdersReadV1Loader','trendos-edge-orders-read-v1.js?v=20261002-legacy-line-runtime'],
  ['trendResumeNoAutoRefreshV1Loader','trendos-resume-no-autorefresh-v1.js?v=20260930-a61-cloud-transport']
];
var TRENDOS_AUTH_DEFERRED_MODULES_V1 = [
  ['trendAttendanceV1Loader','attendance-v1.js?v=20261004-entry620-d1-state-contract'],
  ['trendAttendanceLiveTimerV1Loader','attendance-live-timer-v1.js?v=20260930-a61-cloud-transport'],
  ['trendAttendanceClockinV1Loader','attendance-clockin-ui-v1.js?v=20260930-a61-cloud-transport'],
  ['trendPrayerPrepV1Loader','employee-prayer-prep-v1.js?v=20260930-a61-cloud-transport'],
  ['trendCleaningPrepV1Loader','employee-cleaning-prep-v1.js?v=20260930-a61-cloud-transport'],
  ['trendHrV1Loader','hr-v1.js?v=20260930-a61-cloud-transport'],
  ['trendPressControlV1Loader','press-control-v1.js?v=20260930-a61-cloud-transport'],
  ['trendMasterResilienceSafeV1931Loader','trend-master-resilience-v1931.js?v=20260930-a61-cloud-transport'],
  ['trendManagerCenterV1932Loader','manager-center-v1932.js?v=20261007-entry646-core-direct'],
  ['trendCustomerManagerV1Loader','customer-manager-v1.js?v=20260930-a61-cloud-transport'],
  ['trendCustomerFeedbackV1Loader','customer-feedback-v1.js?v=20260930-a61-cloud-transport'],
  ['trendEmployeeManagerStripsV2Loader','employee-manager-strips-v2.js?v=20260930-a61-cloud-transport'],
  ['trendEmployeeManagerStripsDragV2Loader','employee-manager-strips-drag-v2.js?v=20260930-a61-cloud-transport'],
  ['trendEmployeeAndonV1Loader','employee-andon-v1.js?v=20260930-a61-cloud-transport'],
  ['trendGoLiveAutopilotV1Loader','go-live-autopilot-v1.js?v=20260930-a61-cloud-transport'],
  ['trendOperationsHubV1Loader','operations-hub-v1.js?v=20260930-a61-cloud-transport']
];

window.trendosLoadAuthenticatedCriticalV1 = function(){
  if (window.__TRENDOS_AUTH_CRITICAL_LOADED_V1__) return;
  window.__TRENDOS_AUTH_CRITICAL_LOADED_V1__ = true;
  TRENDOS_AUTH_CRITICAL_MODULES_V1.forEach(function(m){ trendLoadModuleV1932(m[0],m[1]); });
};

window.trendosLoadAuthenticatedModulesV1 = function(){
  window.trendosLoadAuthenticatedCriticalV1();
  if (window.__TRENDOS_AUTH_DEFERRED_QUEUED_V1__) return;
  window.__TRENDOS_AUTH_DEFERRED_QUEUED_V1__ = true;
  setTimeout(function(){
    TRENDOS_AUTH_DEFERRED_MODULES_V1.forEach(function(m){ trendLoadModuleV1932(m[0],m[1]); });
  }, 250);
};

// 02CU resume guard: returning to the platform must not trigger legacy safeRefresh.
window.MATBAGY_DISABLE_RETURN_AUTO_REFRESH_V1 = true;

window.MATBAGY_ATTENDANCE_V1 = true;
window.__TRENDOS_ATTENDANCE_REST_LIMIT__ = 30;
window.MATBAGY_ATTENDANCE_CLOCKIN_V1 = true;
window.TRENDOS_ATTENDANCE_START = '12:00';
window.MATBAGY_PRAYER_PREP_V1 = true;
window.MATBAGY_CLEANING_PREP_V1 = true;
window.TRENDOS_DEFAULT_WORKDAY_START = '12:00';
window.TRENDOS_CLEANING_PREP_MINUTES = 30;
window.TRENDOS_WORKDAY_OVERRIDES = {'2026-08-25':'10:00','2026-08-26':'10:00'};
window.MATBAGY_HR_V1 = true;
window.MATBAGY_PRESS_CONTROL_V1 = true;
window.MATBAGY_CUSTOMER_FEEDBACK_V1 = true;
window.MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1 = false;
window.MATBAGY_EMPLOYEE_OPS_COACH_V1 = false;
window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2 = true;
window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_DRAG_V2 = true;
window.MATBAGY_EMPLOYEE_ANDON_V1 = true;
window.MATBAGY_GO_LIVE_AUTOPILOT_V1 = true;
window.MATBAGY_GO_LIVE_AUTOPILOT_AUTO_SWEEP_V1 = false;
window.MATBAGY_OPERATIONS_HUB_V1 = true;
