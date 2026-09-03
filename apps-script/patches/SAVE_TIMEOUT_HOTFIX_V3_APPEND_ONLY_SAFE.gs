/************************************************************
 * TrendOS Apps Script Save Timeout Hotfix V3 — APPEND ONLY SAFE
 * Date: 2026-09-03 Africa/Cairo
 *
 * Paste this at the VERY END of the live Apps Script project,
 * after TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs if V2 is already pasted.
 *
 * Purpose:
 * - Fix timeout on save/update status buttons.
 * - Make updateLine_ locate the real source row by lineId first.
 * - Avoid using formula-view rowNumber as the source row.
 * - Avoid heavy syncOrderFromLines_ during the user-facing save request.
 * - Return fast so the UI can remove closed/delivered cards without double-clicking.
 ************************************************************/

var TRENDOS_SAVE_TIMEOUT_HOTFIX_V3 = true;
var TRENDOS_SAVE_HOTFIX_SCAN_MAX_ROWS_V3 = 2000;

function st3Text_(v) {
  return String(v == null ? '' : v).trim();
}

function st3Norm_(v) {
  try {
    if (typeof normalize_ === 'function') return normalize_(v);
  } catch (e) {}
  return st3Text_(v);
}

function st3LinesName_() {
  try {
    if (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) return SHEET_NAME_LINES;
  } catch (e) {}
  return 'بنود الأوردرات';
}

function st3OrdersName_() {
  try {
    if (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) return SHEET_NAME_ORDERS;
  } catch (e) {}
  return 'الأوردرات';
}

function st3Ss_() {
  return (typeof ss_ === 'function') ? ss_() : SpreadsheetApp.getActiveSpreadsheet();
}

function st3Sheet_(name) {
  return st3Ss_().getSheetByName(name);
}

function st3HeaderMap_(sheet) {
  var lastCol = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var m = {};
  headers.forEach(function (h, i) {
    h = st3Text_(h);
    if (h && !m[h]) m[h] = i + 1;
  });
  return m;
}

function st3Col_(h, names, fallback) {
  for (var i = 0; i < names.length; i++) {
    if (h[names[i]]) return h[names[i]];
  }
  return fallback || 0;
}

function st3Val_(row, col) {
  return col ? row[col - 1] : '';
}

function st3Ready_(status) {
  status = st3Norm_(status);
  return status === 'جاهز للاستلام' || status === 'تم التسليم' ? 'نعم' : 'لا';
}

function st3Closed_(status) {
  status = st3Norm_(status);
  return status === 'تم التسليم' || status === 'ملغى' || status === 'ملغي' || status === 'مكرر';
}

function st3FindRowByExactValue_(sheet, col, value) {
  value = st3Text_(value);
  if (!sheet || !col || !value) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  // Search newest rows first, bounded, to keep save fast.
  var startRow = Math.max(2, lastRow - TRENDOS_SAVE_HOTFIX_SCAN_MAX_ROWS_V3 + 1);
  var numRows = lastRow - startRow + 1;
  var rng = sheet.getRange(startRow, col, numRows, 1);

  try {
    var finder = rng.createTextFinder(value).matchEntireCell(true);
    var matches = finder.findAll() || [];
    if (matches.length) return matches[matches.length - 1].getRow();
  } catch (e) {}

  // Fallback manual scan only inside the bounded column.
  var vals = rng.getDisplayValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (st3Text_(vals[i][0]) === value) return startRow + i;
  }
  return 0;
}

function st3FindTargetLineRow_(sheet, h, p) {
  var colLineId = st3Col_(h, ['رقم البند', 'Line ID', 'lineId'], 6);
  var colOrderId = st3Col_(h, ['رقم الأوردر', 'Order ID', 'orderId'], 1);
  var lineId = st3Norm_(p.lineId || p.lineID || p.itemId || '');
  var orderId = st3Norm_(p.orderId || p.orderID || '');

  // IMPORTANT: lineId first. rowNumber may be a formula-view row number, not the source row.
  if (lineId) {
    var rowByLine = st3FindRowByExactValue_(sheet, colLineId, lineId);
    if (rowByLine) return rowByLine;
  }

  // Then try orderId only when there is no lineId. This targets the newest matching line.
  if (orderId) {
    var rowByOrder = st3FindRowByExactValue_(sheet, colOrderId, orderId);
    if (rowByOrder) return rowByOrder;
  }

  // Last resort only: direct source row number. Use only if it points inside the source sheet.
  var rowNumber = Number(p.sourceRowNumber || p.rowNumber || 0);
  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) return rowNumber;
  return 0;
}

function st3AppendLightActivity_(info) {
  try {
    if (typeof appendActivityLog_ === 'function') {
      appendActivityLog_(info);
      return;
    }
  } catch (e) {}
}

function st3MaybeUpdateOrderLight_(orderId, status, now) {
  // Very light order header sync: update only status and updatedAt when headers exist.
  // This avoids full syncOrderFromLines_ inside the user-facing request.
  try {
    if (!orderId) return;
    var orders = st3Sheet_(st3OrdersName_());
    if (!orders || orders.getLastRow() < 2) return;
    var h = st3HeaderMap_(orders);
    var colOrderId = st3Col_(h, ['رقم الأوردر', 'Order ID', 'orderId'], 1);
    var colStatus = st3Col_(h, ['الحالة العامة', 'الحالة', 'Status', 'status'], 12);
    var colUpdated = st3Col_(h, ['آخر تحديث', 'Updated At', 'updatedAt'], 13);
    if (!colOrderId) return;
    var row = st3FindRowByExactValue_(orders, colOrderId, orderId);
    if (!row) return;
    if (colStatus && status) orders.getRange(row, colStatus).setValue(status);
    if (colUpdated) orders.getRange(row, colUpdated).setValue(now || new Date());
  } catch (e) {
    // Never fail the save because of header sync.
  }
}

/***** OVERRIDE: Fast save/update status endpoint. *****/
function updateLine_(e) {
  var started = new Date();
  var p = (e && e.parameter) || {};

  var auth = authorize_(p.username, p.token);
  if (!auth.ok) return { success: false, message: auth.message, hotfix: 'SAVE_TIMEOUT_HOTFIX_V3' };

  var sheet = st3Sheet_(st3LinesName_());
  if (!sheet) return { success: false, message: 'شيت بنود الأوردرات غير موجود.', hotfix: 'SAVE_TIMEOUT_HOTFIX_V3' };

  var h = st3HeaderMap_(sheet);
  var colOrderId = st3Col_(h, ['رقم الأوردر', 'Order ID', 'orderId'], 1);
  var colLineId = st3Col_(h, ['رقم البند', 'Line ID', 'lineId'], 6);
  var colCustomer = st3Col_(h, ['اسم الشات / المكتب', 'اسم العميل', 'Customer Name', 'customerName'], 3);
  var colDept = st3Col_(h, ['القسم', 'Department', 'department'], 5);
  var colStatus = st3Col_(h, ['الحالة', 'Status', 'status'], 11);
  var colReady = st3Col_(h, ['جاهز؟', 'جاهز', 'Ready'], 12);
  var colUpdated = st3Col_(h, ['آخر تحديث', 'Updated At', 'updatedAt'], 13);
  var colNotes = st3Col_(h, ['ملاحظات', 'Notes', 'notes'], 14);

  if (!colStatus) return { success: false, message: 'عمود الحالة غير موجود.', hotfix: 'SAVE_TIMEOUT_HOTFIX_V3' };

  var status = st3Norm_(p.status || p.newStatus || 'طلب جديد');
  var notes = st3Norm_(p.notes || '');
  var targetRow = st3FindTargetLineRow_(sheet, h, p);
  if (!targetRow) return { success: false, message: 'البند غير موجود في الشيت.', hotfix: 'SAVE_TIMEOUT_HOTFIX_V3' };

  var lastCol = Math.max(1, sheet.getLastColumn());
  var rowValues = sheet.getRange(targetRow, 1, 1, lastCol).getValues()[0];
  var oldStatus = st3Norm_(st3Val_(rowValues, colStatus));
  var oldNotes = st3Norm_(st3Val_(rowValues, colNotes));
  var orderId = st3Norm_(p.orderId || st3Val_(rowValues, colOrderId));
  var lineId = st3Norm_(p.lineId || st3Val_(rowValues, colLineId));
  var customer = st3Norm_(st3Val_(rowValues, colCustomer));
  var dept = st3Norm_(st3Val_(rowValues, colDept));
  var now = new Date();

  // Write only the necessary cells. No getDataRange, no full sync.
  var writes = [];
  writes.push({ col: colStatus, value: status });
  if (colReady) writes.push({ col: colReady, value: st3Ready_(status) });
  if (colUpdated) writes.push({ col: colUpdated, value: now });
  if (colNotes && notes !== oldNotes) writes.push({ col: colNotes, value: notes });

  writes.forEach(function (w) {
    if (w.col) sheet.getRange(targetRow, w.col).setValue(w.value);
  });

  // Light order header update only; never heavy full-line sync in the request.
  st3MaybeUpdateOrderLight_(orderId, status, now);

  // Activity log is helpful, but it must not break saving.
  st3AppendLightActivity_({
    time: now,
    orderId: orderId,
    lineId: lineId,
    customer: customer,
    department: dept,
    action: 'تعديل حالة سريع',
    oldStatus: oldStatus,
    newStatus: status,
    oldNotes: oldNotes,
    newNotes: notes,
    by: auth.user && auth.user.username ? auth.user.username : st3Norm_(p.username),
    details: 'SAVE_TIMEOUT_HOTFIX_V3: bounded save, no heavy syncOrderFromLines_ during request'
  });

  try { SpreadsheetApp.flush(); } catch (e2) {}

  return {
    success: true,
    message: 'تم حفظ الحالة بسرعة.',
    rowNumber: targetRow,
    sourceRowNumber: targetRow,
    orderId: orderId,
    lineId: lineId,
    status: status,
    ready: st3Ready_(status),
    shouldRemoveFromCurrentView: st3Closed_(status),
    elapsedMs: new Date().getTime() - started.getTime(),
    hotfix: 'SAVE_TIMEOUT_HOTFIX_V3'
  };
}

function trendosSaveHotfixV3Health_() {
  return { success: true, hotfix: 'SAVE_TIMEOUT_HOTFIX_V3', appendOnly: true };
}
