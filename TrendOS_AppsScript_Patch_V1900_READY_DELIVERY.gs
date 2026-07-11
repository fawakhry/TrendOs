
/************************************************************
 * TrendOS / Matbagy Patch V1900
 * زر ضياء: تحويل كل الجاهز للاستلام إلى تم التسليم بضغطة واحدة
 *
 * لو تستخدم Code.gs مدمج V1900 الجاهز، لا ترفع هذا الملف منفصل.
 * لو سترفعه كملف منفصل، أضف action names داخل router أو استدعِ:
 * const v1900Response = trendosV1900TryRoute_(e, typeof payload !== 'undefined' ? payload : null);
 * if (v1900Response) return v1900Response;
 ************************************************************/

const TRENDOS_V1900 = {
  VERSION: 'V1900_BULK_DELIVER_READY_PICKUP',
  READY_STATUSES: ['في قسم التسليمات', 'جاهز للاستلام', 'جاهز', 'تم التنفيذ'],
  CLOSED_STATUSES: ['تم التسليم', 'مكرر', 'ملغي', 'ملغى'],
  DELIVERED_STATUS: 'تم التسليم',
  BULK_DELIVERY_LOG_SHEET: 'سجل التسليم الجماعي'
};

function trendosV1900TryRoute_(e, body) {
  const params = (e && e.parameter) || {};
  const action = String((body && body.action) || params.action || '').trim();
  if (['previewReadyPickupDelivery', 'deliverReadyPickupBulk', 'trendosV1900Ping'].indexOf(action) === -1) return null;

  if (action === 'trendosV1900Ping') {
    return trendosV1898Json_({ success: true, version: TRENDOS_V1900.VERSION, message: 'TrendOS V1900 Patch is active' }, params.callback);
  }

  try {
    const authResult = trendosV1898Auth_(params, body);
    if (!authResult.ok) return trendosV1898Json_({ success: false, message: authResult.message }, params.callback);
    const payload = Object.assign({}, params, body || {});

    if (action === 'previewReadyPickupDelivery') {
      return trendosV1898Json_(trendosV1900PreviewReadyDelivery_(payload, authResult.user), params.callback);
    }
    if (action === 'deliverReadyPickupBulk') {
      if (String(payload.confirm || '').trim() !== 'DELIVER_READY_PICKUP') {
        return trendosV1898Json_({ success: false, version: TRENDOS_V1900.VERSION, message: 'تأكيد التنفيذ غير صحيح. لم يتم تغيير أي بيانات.' }, params.callback);
      }
      return trendosV1898Json_(trendosV1900DeliverReady_(payload, authResult.user), params.callback);
    }
  } catch (err) {
    return trendosV1898Json_({ success: false, version: TRENDOS_V1900.VERSION, message: String(err && err.message ? err.message : err) }, params.callback);
  }
}

function trendosV1900Headers_(sheet) {
  return trendosV1898Headers_(sheet);
}

function trendosV1900FindCols_(headers, aliases) {
  const cols = [];
  aliases.forEach(function(alias){
    const idx = trendosV1898FindCol_(headers, [alias]);
    if (idx !== -1 && cols.indexOf(idx) === -1) cols.push(idx);
  });
  return cols;
}

function trendosV1900EnsureHeader_(sheet, headerName) {
  let headers = trendosV1900Headers_(sheet);
  let idx = trendosV1898FindCol_(headers, [headerName]);
  if (idx !== -1) return idx;
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue(headerName);
  SpreadsheetApp.flush();
  headers = trendosV1900Headers_(sheet);
  return trendosV1898FindCol_(headers, [headerName]);
}

function trendosV1900StatusIn_(value, list) {
  const s = String(value == null ? '' : value).trim();
  return list.indexOf(s) !== -1;
}

function trendosV1900UserName_(user, payload) {
  return String((user && (user.username || user.name)) || (payload && payload.username) || 'ضياء').trim();
}

function trendosV1900CollectReadyDelivery_() {
  const ss = trendosV1898Spreadsheet_();
  const ordersSheet = ss.getSheetByName(TRENDOS_V1898.ORDERS_SHEET);
  const linesSheet = ss.getSheetByName(TRENDOS_V1898.LINES_SHEET);
  if (!ordersSheet) throw new Error('شيت الأوردرات غير موجود: ' + TRENDOS_V1898.ORDERS_SHEET);
  if (!linesSheet) throw new Error('شيت بنود الأوردرات غير موجود: ' + TRENDOS_V1898.LINES_SHEET);

  const ready = TRENDOS_V1900.READY_STATUSES;
  const closed = TRENDOS_V1900.CLOSED_STATUSES;
  const orderIds = {};
  const readyOrders = [];
  const readyLines = [];

  const oh = trendosV1900Headers_(ordersSheet);
  const orderIdColO = trendosV1898FindCol_(oh, ['رقم الأوردر', 'كود الأوردر', 'Order ID', 'orderId', 'order_id']);
  const orderStatusCols = trendosV1900FindCols_(oh, ['الحالة العامة', 'الحالة', 'Status', 'status']);
  if (orderIdColO === -1 || !orderStatusCols.length) throw new Error('أعمدة رقم الأوردر أو الحالة غير موجودة في شيت الأوردرات.');
  const orderValues = ordersSheet.getLastRow() > 1 ? ordersSheet.getRange(2, 1, ordersSheet.getLastRow() - 1, ordersSheet.getLastColumn()).getValues() : [];

  orderValues.forEach(function(row, idx){
    const orderId = String(row[orderIdColO] || '').trim();
    if (!orderId) return;
    const isReady = orderStatusCols.some(function(c){ return trendosV1900StatusIn_(row[c], ready); });
    if (!isReady) return;
    orderIds[orderId] = true;
    readyOrders.push({ rowNumber: idx + 2, orderId: orderId, row: row });
  });

  const lh = trendosV1900Headers_(linesSheet);
  const orderIdColL = trendosV1898FindCol_(lh, ['رقم الأوردر', 'كود الأوردر', 'Order ID', 'orderId', 'order_id']);
  const lineIdCol = trendosV1898FindCol_(lh, ['رقم البند', 'Line ID', 'lineId', 'line_id']);
  const lineStatusCol = trendosV1898FindCol_(lh, ['الحالة', 'Status', 'status']);
  if (orderIdColL === -1 || lineStatusCol === -1) throw new Error('أعمدة رقم الأوردر أو الحالة غير موجودة في شيت بنود الأوردرات.');
  const lineValues = linesSheet.getLastRow() > 1 ? linesSheet.getRange(2, 1, linesSheet.getLastRow() - 1, linesSheet.getLastColumn()).getValues() : [];

  lineValues.forEach(function(row, idx){
    const orderId = String(row[orderIdColL] || '').trim();
    if (!orderId) return;
    const status = String(row[lineStatusCol] || '').trim();
    const readyLine = trendosV1900StatusIn_(status, ready);
    const belongsToReadyOrder = !!orderIds[orderId] && !trendosV1900StatusIn_(status, closed);
    if (!readyLine && !belongsToReadyOrder) return;
    orderIds[orderId] = true;
    readyLines.push({ rowNumber: idx + 2, orderId: orderId, lineId: lineIdCol !== -1 ? String(row[lineIdCol] || '').trim() : '', status: status, row: row });
  });

  return {
    ss: ss,
    ordersSheet: ordersSheet,
    linesSheet: linesSheet,
    ordersHeaders: oh,
    lineHeaders: lh,
    orderIdColO: orderIdColO,
    orderStatusCols: orderStatusCols,
    orderValues: orderValues,
    lineStatusCol: lineStatusCol,
    readyOrders: readyOrders,
    readyLines: readyLines,
    orderIds: orderIds
  };
}

function trendosV1900PreviewReadyDelivery_(payload, user) {
  const data = trendosV1900CollectReadyDelivery_();
  const ids = Object.keys(data.orderIds);
  return {
    success: true,
    version: TRENDOS_V1900.VERSION,
    preview: true,
    ordersCount: ids.length,
    linesCount: data.readyLines.length,
    sampleOrders: ids.slice(0, 10),
    message: 'معاينة فقط. لم يتم تغيير أي بيانات.'
  };
}

function trendosV1900EnsureBulkLogSheet_(ss) {
  let sh = ss.getSheetByName(TRENDOS_V1900.BULK_DELIVERY_LOG_SHEET);
  if (!sh) sh = ss.insertSheet(TRENDOS_V1900.BULK_DELIVERY_LOG_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['التاريخ', 'الإجراء', 'عدد الأوردرات', 'عدد البنود', 'الأوردرات', 'بواسطة', 'الإصدار']);
  }
  return sh;
}

function trendosV1900DeliverReady_(payload, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = trendosV1900CollectReadyDelivery_();
    const ids = Object.keys(data.orderIds);
    if (!ids.length && !data.readyLines.length) {
      return { success: true, version: TRENDOS_V1900.VERSION, ordersCount: 0, linesCount: 0, message: 'لا توجد أوردرات جاهزة للاستلام حالياً.' };
    }

    const now = new Date();
    const by = trendosV1900UserName_(user, payload);

    const lineDeliveredByCol = trendosV1900EnsureHeader_(data.linesSheet, 'تم التسليم بواسطة');
    const lineDeliveredAtCol = trendosV1900EnsureHeader_(data.linesSheet, 'تاريخ التسليم الفعلي');
    const lineUpdatedCol = trendosV1898FindCol_(trendosV1900Headers_(data.linesSheet), ['آخر تحديث', 'Updated At', 'updatedAt']);
    const lineReadyCol = trendosV1898FindCol_(trendosV1900Headers_(data.linesSheet), ['جاهز؟', 'جاهز', 'Ready']);

    data.readyLines.forEach(function(x){
      data.linesSheet.getRange(x.rowNumber, data.lineStatusCol + 1).setValue(TRENDOS_V1900.DELIVERED_STATUS);
      if (lineReadyCol !== -1) data.linesSheet.getRange(x.rowNumber, lineReadyCol + 1).setValue('نعم');
      if (lineUpdatedCol !== -1) data.linesSheet.getRange(x.rowNumber, lineUpdatedCol + 1).setValue(now);
      data.linesSheet.getRange(x.rowNumber, lineDeliveredAtCol + 1).setValue(now);
      data.linesSheet.getRange(x.rowNumber, lineDeliveredByCol + 1).setValue(by);
    });

    const orderDeliveredByCol = trendosV1900EnsureHeader_(data.ordersSheet, 'تم التسليم بواسطة');
    const orderDeliveredAtCol = trendosV1900EnsureHeader_(data.ordersSheet, 'تاريخ التسليم الفعلي');
    const refreshedOrderHeaders = trendosV1900Headers_(data.ordersSheet);
    const orderUpdatedCol = trendosV1898FindCol_(refreshedOrderHeaders, ['آخر تحديث', 'Updated At', 'updatedAt']);
    const orderReadyCol = trendosV1898FindCol_(refreshedOrderHeaders, ['بنود جاهزة']);
    const orderNotReadyCol = trendosV1898FindCol_(refreshedOrderHeaders, ['بنود غير جاهزة']);
    const orderLineCountCol = trendosV1898FindCol_(refreshedOrderHeaders, ['عدد البنود']);

    data.orderValues.forEach(function(row, idx){
      const orderId = String(row[data.orderIdColO] || '').trim();
      if (!orderId || !data.orderIds[orderId]) return;
      const rowNumber = idx + 2;
      data.orderStatusCols.forEach(function(c){ data.ordersSheet.getRange(rowNumber, c + 1).setValue(TRENDOS_V1900.DELIVERED_STATUS); });
      if (orderUpdatedCol !== -1) data.ordersSheet.getRange(rowNumber, orderUpdatedCol + 1).setValue(now);
      data.ordersSheet.getRange(rowNumber, orderDeliveredAtCol + 1).setValue(now);
      data.ordersSheet.getRange(rowNumber, orderDeliveredByCol + 1).setValue(by);
      if (orderLineCountCol !== -1 && orderReadyCol !== -1) data.ordersSheet.getRange(rowNumber, orderReadyCol + 1).setValue(row[orderLineCountCol] || '');
      if (orderNotReadyCol !== -1) data.ordersSheet.getRange(rowNumber, orderNotReadyCol + 1).setValue(0);
    });

    const log = trendosV1900EnsureBulkLogSheet_(data.ss);
    log.appendRow([now, 'تحويل الجاهز للاستلام إلى تم التسليم', ids.length, data.readyLines.length, ids.join(', '), by, TRENDOS_V1900.VERSION]);

    SpreadsheetApp.flush();
    return {
      success: true,
      version: TRENDOS_V1900.VERSION,
      ordersCount: ids.length,
      linesCount: data.readyLines.length,
      sampleOrders: ids.slice(0, 10),
      message: 'تم تحويل كل الجاهز للاستلام / في قسم التسليمات إلى تم التسليم.'
    };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
