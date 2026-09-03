/************************************************************
 * TrendOS Apps Script Timeout Hotfix V1 — APPEND ONLY
 * Date: 2026-09-03 Africa/Cairo
 *
 * Purpose:
 * - Stop frequent "server timeout" errors while production remains on Google Sheets / Apps Script.
 * - Replace heavy read endpoints with bounded reads + short cache.
 * - Remove read-path writes from getRows_ so opening a screen does not write to Sheets.
 *
 * Deployment rule:
 * - Paste this file at the VERY END of the live Apps Script project.
 * - Do not delete the old functions during the emergency fix.
 * - Because these functions are declared later, they override previous getRows_ and getDashboard_.
 ************************************************************/

const TRENDOS_TIMEOUT_HOTFIX_V1 = true;
const TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V1 = 120;
const TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V1 = 200;
const TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V1 = 1200;
const TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V1 = 20;

function trendosHotfixTextV1_(v) {
  return String(v == null ? '' : v).trim();
}

function trendosHotfixNormalizeV1_(v) {
  try {
    if (typeof normalize_ === 'function') return normalize_(v);
  } catch (e) {}
  return trendosHotfixTextV1_(v);
}

function trendosHotfixDateTextV1_(v) {
  try {
    if (typeof dateText_ === 'function') return dateText_(v) || v;
  } catch (e) {}
  if (v instanceof Date) {
    try { return Utilities.formatDate(v, 'Africa/Cairo', 'dd/MM/yyyy HH:mm'); } catch (err) {}
  }
  return v;
}

function trendosHotfixCleanPhoneV1_(v) {
  try {
    if (typeof cleanPhone_ === 'function') return cleanPhone_(v);
  } catch (e) {}
  return trendosHotfixTextV1_(v).replace(/\D/g, '');
}

function trendosHotfixNumV1_(v, fallback) {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

function trendosHotfixLimitV1_(e) {
  const p = (e && e.parameter) || {};
  const raw = trendosHotfixNumV1_(p.limit, TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V1);
  return Math.max(1, Math.min(raw, TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V1));
}

function trendosHotfixScreenV1_(e) {
  const p = (e && e.parameter) || {};
  return trendosHotfixNormalizeV1_(p.screen || 'service').toLowerCase();
}

function trendosHotfixHeaderMapV1_(headers) {
  const m = {};
  (headers || []).forEach(function (h, i) {
    const key = trendosHotfixTextV1_(h);
    if (key) m[key] = i + 1;
  });
  return m;
}

function trendosHotfixFirstColV1_(h, names, fallback) {
  for (let i = 0; i < names.length; i++) {
    if (h[names[i]]) return h[names[i]];
  }
  return fallback || 0;
}

function trendosHotfixValueV1_(row, col) {
  return col ? row[col - 1] : '';
}

function trendosHotfixGetSheetV1_(name) {
  const ss = typeof ss_ === 'function' ? ss_() : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function trendosHotfixViewNameForScreenV1_(screen) {
  screen = String(screen || '').toLowerCase();
  if (screen.indexOf('press') !== -1 || screen.indexOf('مكبس') !== -1 || screen.indexOf('heat') !== -1) return 'واجهة المكبس';
  if (screen.indexOf('laser') !== -1 || screen.indexOf('ليزر') !== -1) return 'واجهة الليزر';
  if (screen.indexOf('print') !== -1 || screen.indexOf('طباعة') !== -1) return 'واجهة الطباعة';
  if (screen.indexOf('service') !== -1 || screen.indexOf('customer') !== -1 || screen.indexOf('خدمة') !== -1) return 'واجهة خدمة العملاء';
  return '';
}

function trendosHotfixReadBoundedV1_(sheet, maxRows, maxCols) {
  if (!sheet) return [];
  const lastRow = Math.max(1, sheet.getLastRow());
  const lastCol = Math.max(1, Math.min(sheet.getLastColumn(), maxCols || sheet.getLastColumn()));
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (lastRow < 2) return [header];

  const scanRows = Math.max(1, Math.min(maxRows || TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V1, TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V1));
  const startRow = Math.max(2, lastRow - scanRows + 1);
  const numRows = Math.max(0, lastRow - startRow + 1);
  const body = numRows ? sheet.getRange(startRow, 1, numRows, lastCol).getValues() : [];
  return [header].concat(body);
}

function trendosHotfixStatusIsClosedV1_(status) {
  status = trendosHotfixNormalizeV1_(status);
  return status === 'تم التسليم' || status === 'ملغى' || status === 'ملغي' || status === 'مكرر';
}

function trendosHotfixStatusIsReadyV1_(status, ready) {
  status = trendosHotfixNormalizeV1_(status);
  ready = trendosHotfixNormalizeV1_(ready);
  return status === 'جاهز للاستلام' || ready === 'نعم' || ready.toLowerCase() === 'yes';
}

function trendosHotfixSameDayV1_(v, d) {
  if (!(v instanceof Date) || !(d instanceof Date)) return false;
  return v.getFullYear() === d.getFullYear() && v.getMonth() === d.getMonth() && v.getDate() === d.getDate();
}

function trendosHotfixMatchesScreenV1_(screen, dept, press) {
  try {
    if (typeof dashboardMatchesScreen_ === 'function') return dashboardMatchesScreen_(screen, dept, press);
  } catch (e) {}
  const s = String(screen || '').toLowerCase();
  const d = trendosHotfixNormalizeV1_(dept).toLowerCase();
  if (!s || s === 'service') return true;
  if (s.indexOf('press') !== -1 || s.indexOf('مكبس') !== -1) return !!press || d.indexOf('مكبس') !== -1;
  if (s.indexOf('laser') !== -1 || s.indexOf('ليزر') !== -1) return d.indexOf('ليزر') !== -1 || d.indexOf('laser') !== -1;
  if (s.indexOf('print') !== -1 || s.indexOf('طباعة') !== -1) return d.indexOf('طباعة') !== -1 || d.indexOf('print') !== -1;
  return true;
}

function trendosHotfixPriorityRankV1_(priority) {
  try {
    if (typeof priorityRank_ === 'function') return priorityRank_(priority);
  } catch (e) {}
  priority = trendosHotfixNormalizeV1_(priority);
  if (priority === 'VIP') return 0;
  if (priority === 'عاجل') return 1;
  return 5;
}

/************************************************************
 * OVERRIDE: getRows_
 * Fast path for screen rows.
 * - Reads screen formula views when available.
 * - Bounded default output: 120 rows, max 200.
 * - No writes while reading.
 ************************************************************/
function getRows_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = trendosHotfixScreenV1_(e);
  const limit = trendosHotfixLimitV1_(e);
  const viewName = trendosHotfixViewNameForScreenV1_(screen);
  const sourceSheet = viewName ? trendosHotfixGetSheetV1_(viewName) : null;
  const fallbackLines = trendosHotfixGetSheetV1_(SHEET_NAME_LINES || 'بنود الأوردرات');
  const sheet = sourceSheet || fallbackLines;
  if (!sheet) return { success: false, message: 'مصدر بيانات البنود غير موجود.' };

  const data = trendosHotfixReadBoundedV1_(sheet, 500, 92);
  if (!data.length) return { success: true, rows: [], hotfix: 'TIMEOUT_HOTFIX_V1' };

  const h = trendosHotfixHeaderMapV1_(data[0]);
  const colOrderId = trendosHotfixFirstColV1_(h, ['رقم الأوردر', 'Order ID', 'orderId'], 1);
  const colOrderCode = trendosHotfixFirstColV1_(h, ['كود الأوردر'], 2);
  const colCustomer = trendosHotfixFirstColV1_(h, ['اسم الشات / المكتب', 'اسم العميل', 'Customer Name', 'customerName'], 3);
  const colDept = trendosHotfixFirstColV1_(h, ['القسم', 'القسم الرئيسي', 'Department', 'department'], 5);
  const colLineId = trendosHotfixFirstColV1_(h, ['رقم البند', 'Line ID', 'lineId'], 6);
  const colItem = trendosHotfixFirstColV1_(h, ['اسم البند / نوع الشغل', 'اسم البند', 'وصف مختصر', 'Item Name', 'itemName'], 7);
  const colQty = trendosHotfixFirstColV1_(h, ['الكمية', 'Qty', 'qty', 'عدد البنود'], 8);
  const colAssigned = trendosHotfixFirstColV1_(h, ['مسؤول القسم', 'Assigned To'], 9);
  const colPriority = trendosHotfixFirstColV1_(h, ['الأولوية', 'Priority'], 10);
  const colStatus = trendosHotfixFirstColV1_(h, ['الحالة', 'الحالة العامة', 'Status', 'status'], 11);
  const colReady = trendosHotfixFirstColV1_(h, ['جاهز؟', 'جاهز', 'Ready', 'بنود جاهزة'], 12);
  const colUpdated = trendosHotfixFirstColV1_(h, ['آخر تحديث', 'Updated At', 'updatedAt'], 13);
  const colNotes = trendosHotfixFirstColV1_(h, ['ملاحظات', 'Notes', 'notes'], 14);
  const colPhone = trendosHotfixFirstColV1_(h, ['رقم العميل الخارجي', 'رقم العميل', 'رقم الهاتف', 'Phone', 'customerPhone'], 17);
  const colPress = trendosHotfixFirstColV1_(h, ['مكبس', 'مكبس حراري', 'مكبس؟', 'Press', 'Heat Press'], 18);
  const colFlyPrint = trendosHotfixFirstColV1_(h, ['طباعة على الطاير', 'طباعة ع الطاير', 'طباعة فورية', 'Ready Print', 'Fly Print', 'Quick Print'], 0);
  const colReceivedAt = trendosHotfixFirstColV1_(h, ['تاريخ الاستلام', 'تاريخ الإنشاء', 'Received At'], 0);
  const colExpectedAt = trendosHotfixFirstColV1_(h, ['تاريخ التسليم المتوقع', 'Expected Delivery'], 0);
  const colExpectedText = trendosHotfixFirstColV1_(h, ['الوقت المتوقع'], 0);

  const includeClosed = String(((e && e.parameter) || {}).includeClosed || '').toLowerCase() === 'true';
  const out = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colOrderId)) || trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colOrderCode));
    const lineId = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colLineId));
    const department = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colDept));
    const status = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colStatus)) || 'طلب جديد';
    const press = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colPress));

    if (!orderId && !lineId) continue;
    if (!includeClosed && trendosHotfixStatusIsClosedV1_(status)) continue;
    if (!sourceSheet && !trendosHotfixMatchesScreenV1_(screen, department, press === 'نعم' || String(press).toLowerCase() === 'yes')) continue;

    out.push({
      rowNumber: i + 1,
      orderId: orderId,
      orderCode: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colOrderCode)) || orderId,
      lineId: lineId,
      customer: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colCustomer)),
      customerPhone: trendosHotfixCleanPhoneV1_(trendosHotfixValueV1_(row, colPhone)),
      department: department,
      itemName: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colItem)),
      qty: trendosHotfixValueV1_(row, colQty) || 1,
      assignedTo: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colAssigned)),
      priority: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colPriority)) || 'عادي',
      status: status,
      ready: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colReady)),
      heatPress: press,
      flyPrint: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colFlyPrint)),
      quickPrint: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colFlyPrint)),
      debtAmount: 0,
      debtHold: 'لا',
      debtNotes: '',
      updatedAt: trendosHotfixDateTextV1_(trendosHotfixValueV1_(row, colUpdated)),
      notes: trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colNotes)),
      receivedAt: trendosHotfixDateTextV1_(trendosHotfixValueV1_(row, colReceivedAt)),
      expectedDeliveryAt: trendosHotfixDateTextV1_(trendosHotfixValueV1_(row, colExpectedAt)),
      expectedDeliveryText: trendosHotfixDateTextV1_(trendosHotfixValueV1_(row, colExpectedText) || trendosHotfixValueV1_(row, colExpectedAt)),
      hotfixSource: sourceSheet ? viewName : 'بنود الأوردرات'
    });
  }

  out.sort(function (a, b) {
    const pa = trendosHotfixPriorityRankV1_(a.priority);
    const pb = trendosHotfixPriorityRankV1_(b.priority);
    if (pa !== pb) return pa - pb;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });

  return { success: true, rows: out.slice(0, limit), limited: true, limit: limit, hotfix: 'TIMEOUT_HOTFIX_V1' };
}

/************************************************************
 * OVERRIDE: getDashboard_
 * Fast dashboard with short cache.
 ************************************************************/
function getDashboard_(e) {
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const screen = trendosHotfixScreenV1_(e);
  const cacheKey = 'trendos_dash_hotfix_v1_' + screen;
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (cacheReadErr) {}

  const lines = trendosHotfixGetSheetV1_(SHEET_NAME_LINES || 'بنود الأوردرات');
  if (!lines) return { success: false, message: 'شيت بنود الأوردرات غير موجود.' };

  const dashboard = (typeof emptyDashboard_ === 'function') ? emptyDashboard_(screen) : {
    screen: screen,
    departmentName: screen,
    todayOrders: 0,
    todayWorkOrders: 0,
    todayWorkLines: 0,
    todayWorkSheets: 0,
    todayWorkDoneLines: 0,
    activeOrders: 0,
    activeLines: 0,
    activeSheets: 0,
    urgent: 0,
    normal: 0,
    overdue: 0,
    readyForPickup: 0,
    readyOrders: 0,
    delivered: 0,
    deliveredToday: 0,
    duplicate: 0,
    heatPress: 0,
    debtOrders: 0,
    completionPercent: 0,
    timeScore: 100,
    performanceScore: 0,
    byDepartment: { 'طباعة': 0, 'ليزر': 0, 'مكبس': 0 }
  };

  const data = trendosHotfixReadBoundedV1_(lines, TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V1, 92);
  const h = trendosHotfixHeaderMapV1_(data[0] || []);
  const colOrderId = trendosHotfixFirstColV1_(h, ['رقم الأوردر', 'Order ID'], 1);
  const colOrderCode = trendosHotfixFirstColV1_(h, ['كود الأوردر'], 2);
  const colDept = trendosHotfixFirstColV1_(h, ['القسم', 'Department'], 5);
  const colQty = trendosHotfixFirstColV1_(h, ['الكمية', 'Qty'], 8);
  const colPriority = trendosHotfixFirstColV1_(h, ['الأولوية', 'Priority'], 10);
  const colStatus = trendosHotfixFirstColV1_(h, ['الحالة', 'Status'], 11);
  const colReady = trendosHotfixFirstColV1_(h, ['جاهز؟', 'جاهز', 'Ready'], 12);
  const colUpdated = trendosHotfixFirstColV1_(h, ['آخر تحديث', 'Updated At'], 13);
  const colPress = trendosHotfixFirstColV1_(h, ['مكبس', 'مكبس حراري', 'مكبس؟', 'Press', 'Heat Press'], 18);
  const colDebt = trendosHotfixFirstColV1_(h, ['مديونية العميل'], 0);

  const today = new Date();
  const activeOrderSet = {};
  const readyOrderSet = {};
  const deliveredTodayOrderSet = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colOrderId)) || trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colOrderCode));
    const dept = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colDept)) || 'غير محدد';
    const status = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colStatus)) || 'طلب جديد';
    const ready = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colReady));
    const priority = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colPriority)) || 'عادي';
    const qty = Number(trendosHotfixValueV1_(row, colQty)) || 1;
    const press = trendosHotfixNormalizeV1_(trendosHotfixValueV1_(row, colPress));
    const updatedRaw = trendosHotfixValueV1_(row, colUpdated);

    if (!orderId && !dept) continue;
    if (!trendosHotfixMatchesScreenV1_(screen, dept, press === 'نعم' || String(press).toLowerCase() === 'yes')) continue;

    if (dashboard.byDepartment && dashboard.byDepartment[dept] !== undefined) dashboard.byDepartment[dept] += 1;
    if (dept.indexOf('طباعة') !== -1 && dashboard.byDepartment) dashboard.byDepartment['طباعة'] = (dashboard.byDepartment['طباعة'] || 0) + 1;
    if (dept.indexOf('ليزر') !== -1 && dashboard.byDepartment) dashboard.byDepartment['ليزر'] = (dashboard.byDepartment['ليزر'] || 0) + 1;
    if (dept.indexOf('مكبس') !== -1 && dashboard.byDepartment) dashboard.byDepartment['مكبس'] = (dashboard.byDepartment['مكبس'] || 0) + 1;

    dashboard.todayWorkLines += trendosHotfixSameDayV1_(updatedRaw, today) ? 1 : 0;
    dashboard.todayWorkSheets += qty;
    if (status === 'تم التسليم') {
      dashboard.delivered += 1;
      if (trendosHotfixSameDayV1_(updatedRaw, today)) {
        dashboard.deliveredToday += 1;
        if (orderId) deliveredTodayOrderSet[orderId] = true;
      }
      continue;
    }
    if (status === 'مكرر') dashboard.duplicate += 1;
    if (press === 'نعم' || String(press).toLowerCase() === 'yes') dashboard.heatPress += 1;
    if (priority === 'عاجل' || priority === 'VIP') dashboard.urgent += 1; else dashboard.normal += 1;
    if (trendosHotfixStatusIsReadyV1_(status, ready)) {
      dashboard.readyForPickup += 1;
      if (orderId) readyOrderSet[orderId] = true;
    }
    if (!trendosHotfixStatusIsClosedV1_(status)) {
      dashboard.activeLines += 1;
      dashboard.activeSheets += qty;
      if (orderId) activeOrderSet[orderId] = true;
    }
    if (Number(trendosHotfixValueV1_(row, colDebt)) > 0) dashboard.debtOrders += 1;
  }

  dashboard.activeOrders = Object.keys(activeOrderSet).length;
  dashboard.readyOrders = Object.keys(readyOrderSet).length;
  dashboard.deliveredTodayOrders = Object.keys(deliveredTodayOrderSet).length;
  dashboard.todayWorkOrders = dashboard.activeOrders;
  const totalLines = dashboard.activeLines + dashboard.delivered;
  dashboard.completionPercent = totalLines ? Math.round((dashboard.delivered / totalLines) * 100) : 0;
  dashboard.timeScore = dashboard.overdue ? Math.max(0, 100 - dashboard.overdue * 5) : 100;
  dashboard.performanceScore = Math.round((dashboard.completionPercent * 0.6) + (dashboard.timeScore * 0.4));
  dashboard.updatedAt = Utilities.formatDate(new Date(), 'Africa/Cairo', 'dd/MM/yyyy HH:mm:ss');

  const result = { success: true, dashboard: dashboard, cachedForSeconds: TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V1, hotfix: 'TIMEOUT_HOTFIX_V1' };
  try { CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V1); } catch (cacheWriteErr) {}
  return result;
}

function trendosTimeoutHotfixV1Health_(e) {
  return {
    success: true,
    hotfix: 'TIMEOUT_HOTFIX_V1',
    defaultLimit: TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V1,
    maxLimit: TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V1,
    maxScanRows: TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V1,
    dashboardCacheSeconds: TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V1,
    readPathWritesAllowed: false,
    deployedAt: Utilities.formatDate(new Date(), 'Africa/Cairo', 'dd/MM/yyyy HH:mm:ss')
  };
}
