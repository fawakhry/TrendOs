/************************************************************
 * TrendOS / Matbagy Patch V1898
 * Sprint تشغيل أساسي + أرشفة وتنضيف الأوردرات المقفولة
 *
 * مهم: هذا الملف لا يحتوي doGet/doPost حتى لا يكسر الكود القديم.
 * ضيف السطر التالي في أول doGet وبعد قراءة body في doPost:
 * const v1898Response = trendosV1898TryRoute_(e, typeof payload !== 'undefined' ? payload : null);
 * if (v1898Response) return v1898Response;
 ************************************************************/

const TRENDOS_V1898 = {
  VERSION: 'V1898_BASIC_OPERATIONS_CLEANUP',
  SPREADSHEET_ID: (typeof SPREADSHEET_ID !== 'undefined' ? SPREADSHEET_ID : '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI'),
  ORDERS_SHEET: (typeof SHEET_NAME_ORDERS !== 'undefined' ? SHEET_NAME_ORDERS : 'الأوردرات'),
  LINES_SHEET: (typeof SHEET_NAME_LINES !== 'undefined' ? SHEET_NAME_LINES : 'بنود الأوردرات'),
  ORDERS_ARCHIVE_SHEET: 'أرشيف الأوردرات',
  LINES_ARCHIVE_SHEET: 'أرشيف بنود الأوردرات',
  CLEANUP_LOG_SHEET: 'سجل تنضيف الأوردرات',
  CLOSED_STATUSES: ['تم التسليم', 'مكرر', 'ملغي', 'ملغى'],
  OPEN_EXCLUDED: ['تم التسليم', 'مكرر', 'ملغي', 'ملغى']
};

function trendosV1898TryRoute_(e, body) {
  const params = (e && e.parameter) || {};
  const action = String((body && body.action) || params.action || '').trim();
  if (['previewClosedOrdersCleanup', 'archiveClosedOrdersCleanup', 'trendosV1898Ping'].indexOf(action) === -1) return null;

  if (action === 'trendosV1898Ping') {
    return trendosV1898Json_({ success: true, version: TRENDOS_V1898.VERSION, message: 'TrendOS V1898 Patch is active' }, params.callback);
  }

  try {
    const authResult = trendosV1898Auth_(params, body);
    if (!authResult.ok) return trendosV1898Json_({ success: false, message: authResult.message }, params.callback);

    const payload = Object.assign({}, params, body || {});
    if (action === 'previewClosedOrdersCleanup') {
      return trendosV1898Json_(trendosV1898PreviewCleanup_(payload, authResult.user), params.callback);
    }
    if (action === 'archiveClosedOrdersCleanup') {
      return trendosV1898Json_(trendosV1898ArchiveCleanup_(payload, authResult.user), params.callback);
    }
  } catch (err) {
    return trendosV1898Json_({ success: false, version: TRENDOS_V1898.VERSION, message: String(err && err.message ? err.message : err) }, params.callback);
  }
}

function trendosV1898Auth_(params, body) {
  const username = String((body && body.username) || params.username || '').trim();
  const token = String((body && body.token) || params.token || '').trim();

  try {
    if (typeof authorize_ === 'function') {
      const auth = authorize_(username, token);
      if (!auth || !auth.ok) return { ok: false, message: (auth && auth.message) || 'انتهت الجلسة. سجل الدخول مرة أخرى.' };
      const blob = JSON.stringify(auth.user || {}) + ' ' + username;
      if (!/ضياء|diaa|admin/i.test(blob)) return { ok: false, message: 'التنضيف والأرشفة متاحة لضياء فقط.' };
      return { ok: true, user: auth.user || { username: username } };
    }
  } catch (e) {
    return { ok: false, message: 'تعذر التحقق من صلاحية المستخدم.' };
  }

  if (/ضياء|diaa|admin/i.test(username)) return { ok: true, user: { username: username || 'ضياء' } };
  return { ok: false, message: 'التنضيف والأرشفة متاحة لضياء فقط.' };
}

function trendosV1898Json_(obj, callback) {
  const json = JSON.stringify(obj || {});
  const cb = String(callback || '').trim();
  const out = cb ? (cb + '(' + json + ');') : json;
  return ContentService
    .createTextOutput(out)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function trendosV1898Spreadsheet_() {
  try {
    if (TRENDOS_V1898.SPREADSHEET_ID) return SpreadsheetApp.openById(TRENDOS_V1898.SPREADSHEET_ID);
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function trendosV1898Headers_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function(h){ return String(h || '').trim(); });
}

function trendosV1898FindCol_(headers, aliases) {
  aliases = aliases || [];
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim();
    if (aliases.indexOf(h) !== -1) return i;
  }
  const low = headers.map(function(h){ return String(h || '').toLowerCase(); });
  for (let a = 0; a < aliases.length; a++) {
    const needle = String(aliases[a] || '').toLowerCase();
    const idx = low.indexOf(needle);
    if (idx !== -1) return idx;
  }
  return -1;
}

function trendosV1898ParseStatuses_(raw) {
  let arr = [];
  try { arr = JSON.parse(String(raw || '[]')); } catch (e) { arr = String(raw || '').split(','); }
  arr = arr.map(function(s){ return String(s || '').trim(); }).filter(Boolean);
  if (!arr.length) arr = ['تم التسليم'];
  if (arr.indexOf('ملغي') !== -1 && arr.indexOf('ملغى') === -1) arr.push('ملغى');
  if (arr.indexOf('ملغى') !== -1 && arr.indexOf('ملغي') === -1) arr.push('ملغي');
  return arr.filter(function(s){ return TRENDOS_V1898.CLOSED_STATUSES.indexOf(s) !== -1; });
}

function trendosV1898ParseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    const d0 = new Date(value.getTime()); d0.setHours(0,0,0,0); return d0;
  }
  const raw = String(value || '').trim();
  if (!raw) return null;
  let m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) { const d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3])); d.setHours(0,0,0,0); return d; }
  m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) { const d = new Date(Number(m[3]), Number(m[1])-1, Number(m[2])); d.setHours(0,0,0,0); return d; }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  d.setHours(0,0,0,0);
  return d;
}

function trendosV1898InRange_(value, fromRaw, toRaw) {
  const from = trendosV1898ParseDate_(fromRaw);
  const to = trendosV1898ParseDate_(toRaw);
  if (!from && !to) return true;
  const d = trendosV1898ParseDate_(value);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function trendosV1898EnsureArchiveSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function trendosV1898EnsureLogSheet_(ss) {
  let sh = ss.getSheetByName(TRENDOS_V1898.CLEANUP_LOG_SHEET);
  if (!sh) sh = ss.insertSheet(TRENDOS_V1898.CLEANUP_LOG_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['التاريخ', 'الإجراء', 'من تاريخ', 'إلى تاريخ', 'الحالات', 'عدد الأوردرات', 'عدد البنود', 'بواسطة', 'الإصدار']);
  }
  return sh;
}

function trendosV1898CollectCleanup_(payload) {
  const ss = trendosV1898Spreadsheet_();
  const ordersSheet = ss.getSheetByName(TRENDOS_V1898.ORDERS_SHEET);
  const linesSheet = ss.getSheetByName(TRENDOS_V1898.LINES_SHEET);
  if (!ordersSheet) throw new Error('شيت الأوردرات غير موجود: ' + TRENDOS_V1898.ORDERS_SHEET);

  const statuses = trendosV1898ParseStatuses_(payload.statuses);
  if (!statuses.length) throw new Error('لا توجد حالات صالحة للتنضيف. المسموح: تم التسليم، مكرر، ملغي.');

  const ordersHeaders = trendosV1898Headers_(ordersSheet);
  const orderIdCol = trendosV1898FindCol_(ordersHeaders, ['رقم الأوردر', 'كود الأوردر', 'Order ID', 'orderId', 'order_id']);
  const statusCol = trendosV1898FindCol_(ordersHeaders, ['الحالة', 'status', 'Status']);
  const dateCol = trendosV1898FindCol_(ordersHeaders, ['تاريخ الأوردر', 'تاريخ التسجيل', 'تاريخ الإنشاء', 'تاريخ الاستلام', 'آخر تحديث', 'createdAt', 'Created At', 'receivedAt']);
  if (orderIdCol === -1 || statusCol === -1) throw new Error('أعمدة رقم الأوردر أو الحالة غير موجودة في شيت الأوردرات.');

  const orderValues = ordersSheet.getLastRow() > 1 ? ordersSheet.getRange(2, 1, ordersSheet.getLastRow() - 1, ordersSheet.getLastColumn()).getDisplayValues() : [];
  const selectedOrders = [];
  const ids = {};
  const counts = { delivered: 0, duplicate: 0, cancelled: 0 };

  orderValues.forEach(function(row, idx){
    const status = String(row[statusCol] || '').trim();
    if (statuses.indexOf(status) === -1) return;
    if (dateCol !== -1 && !trendosV1898InRange_(row[dateCol], payload.fromDate, payload.toDate)) return;
    const orderId = String(row[orderIdCol] || '').trim();
    selectedOrders.push({ rowNumber: idx + 2, row: row, orderId: orderId, status: status });
    if (orderId) ids[orderId] = true;
    if (status === 'تم التسليم') counts.delivered++;
    else if (status === 'مكرر') counts.duplicate++;
    else if (status === 'ملغي' || status === 'ملغى') counts.cancelled++;
  });

  let selectedLines = [];
  let lineHeaders = [];
  if (linesSheet && linesSheet.getLastRow() > 1) {
    lineHeaders = trendosV1898Headers_(linesSheet);
    const lineOrderIdCol = trendosV1898FindCol_(lineHeaders, ['رقم الأوردر', 'كود الأوردر', 'Order ID', 'orderId', 'order_id']);
    if (lineOrderIdCol !== -1) {
      const lineValues = linesSheet.getRange(2, 1, linesSheet.getLastRow() - 1, linesSheet.getLastColumn()).getDisplayValues();
      selectedLines = lineValues.map(function(row, idx){ return { rowNumber: idx + 2, row: row, orderId: String(row[lineOrderIdCol] || '').trim() }; })
        .filter(function(x){ return x.orderId && ids[x.orderId]; });
    }
  }

  return { ss: ss, ordersSheet: ordersSheet, linesSheet: linesSheet, ordersHeaders: ordersHeaders, lineHeaders: lineHeaders, orders: selectedOrders, lines: selectedLines, counts: counts, statuses: statuses };
}

function trendosV1898PreviewCleanup_(payload, user) {
  const data = trendosV1898CollectCleanup_(payload);
  return {
    success: true,
    version: TRENDOS_V1898.VERSION,
    preview: true,
    ordersCount: data.orders.length,
    linesCount: data.lines.length,
    counts: data.counts,
    message: 'معاينة فقط. لم يتم حذف أي بيانات.'
  };
}

function trendosV1898ArchiveCleanup_(payload, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = trendosV1898CollectCleanup_(payload);
    if (!data.orders.length) {
      return { success: true, version: TRENDOS_V1898.VERSION, ordersCount: 0, linesCount: 0, counts: data.counts, message: 'لا توجد أوردرات مطابقة للتنضيف.' };
    }

    const ordersArchive = trendosV1898EnsureArchiveSheet_(data.ss, TRENDOS_V1898.ORDERS_ARCHIVE_SHEET, data.ordersHeaders);
    const linesArchive = trendosV1898EnsureArchiveSheet_(data.ss, TRENDOS_V1898.LINES_ARCHIVE_SHEET, data.lineHeaders.length ? data.lineHeaders : ['رقم الأوردر']);

    data.orders.forEach(function(x){ ordersArchive.appendRow(x.row); });
    data.lines.forEach(function(x){ linesArchive.appendRow(x.row); });

    // حذف من أسفل لأعلى حتى لا تتغير أرقام الصفوف.
    data.lines.map(function(x){ return x.rowNumber; }).sort(function(a,b){ return b-a; }).forEach(function(r){ if (data.linesSheet) data.linesSheet.deleteRow(r); });
    data.orders.map(function(x){ return x.rowNumber; }).sort(function(a,b){ return b-a; }).forEach(function(r){ data.ordersSheet.deleteRow(r); });

    const log = trendosV1898EnsureLogSheet_(data.ss);
    log.appendRow([
      new Date(),
      'أرشفة وتنضيف',
      payload.fromDate || '',
      payload.toDate || '',
      data.statuses.join(', '),
      data.orders.length,
      data.lines.length,
      (user && (user.name || user.username)) || payload.username || '',
      TRENDOS_V1898.VERSION
    ]);

    return {
      success: true,
      version: TRENDOS_V1898.VERSION,
      ordersCount: data.orders.length,
      linesCount: data.lines.length,
      counts: data.counts,
      message: 'تم نقل البيانات للأرشيف وحذفها من شيت التشغيل.'
    };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
