/* TrendOS D1 staged read cutover for Orders + Order Lines.
 *
 * Stage 1 only: verify D1 read freshness/parity and prepare safe enable/disable flags.
 * This file DOES NOT replace getRows_() yet. Google Sheets remains the live fallback.
 */

const D1_ORDERS_PRIMARY_READ_ENABLED_KEY_V1 = 'D1_ORDERS_PRIMARY_READ_ENABLED_V1';
const D1_ORDERS_PRIMARY_READ_LAST_PROBE_KEY_V1 = 'D1_ORDERS_PRIMARY_READ_LAST_PROBE_V1';
const D1_ORDERS_PRIMARY_READ_LAST_ERROR_KEY_V1 = 'D1_ORDERS_PRIMARY_READ_LAST_ERROR_V1';
const D1_ORDERS_READ_MAX_STALENESS_MS_V1 = 3 * 60 * 1000;
const D1_ORDERS_READ_PAGE_SIZE_V1 = 500;

function d1OrdersReadApiUrl_() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = String(props.getProperty('D1_API_URL') || '').trim().replace(/\/+$/, '');
  if (!apiUrl) throw new Error('D1_API_URL غير موجود في Script Properties.');
  return apiUrl;
}

function d1OrdersReadGetJson_(path) {
  const response = UrlFetchApp.fetch(d1OrdersReadApiUrl_() + path, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true
  });
  const code = response.getResponseCode();
  const text = response.getContentText() || '{}';
  let data;
  try { data = JSON.parse(text); } catch (err) {
    throw new Error('D1 رجّع JSON غير صالح. HTTP ' + code);
  }
  if (code < 200 || code >= 300 || !data.success) {
    throw new Error(String((data && data.message) || ('D1 HTTP ' + code)));
  }
  return data;
}

function d1OrdersReadSheetName_(kind) {
  if (kind === 'orders') {
    return (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) ? SHEET_NAME_ORDERS : 'الأوردرات';
  }
  return (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) ? SHEET_NAME_LINES : 'بنود الأوردرات';
}

function d1OrdersReadFetchSheet_(sheetName) {
  let offset = 0;
  let catalog = null;
  const rows = [];

  while (true) {
    const path = '/v1/mirror/sheet?name=' + encodeURIComponent(sheetName) +
      '&limit=' + D1_ORDERS_READ_PAGE_SIZE_V1 + '&offset=' + offset;
    const payload = d1OrdersReadGetJson_(path);
    const sheet = payload.sheet;
    if (!sheet) throw new Error('D1 لم يرجّع الشيت: ' + sheetName);
    if (!catalog) {
      catalog = {
        sheetName: sheet.sheetName,
        headers: Array.isArray(sheet.headers) ? sheet.headers : [],
        sourceLastRow: Number(sheet.sourceLastRow || 0),
        sourceLastCol: Number(sheet.sourceLastCol || 0),
        rowCount: Number(sheet.rowCount || 0),
        status: String(sheet.status || ''),
        syncedAt: String(sheet.syncedAt || ''),
        note: String(sheet.note || '')
      };
    }
    const batch = Array.isArray(sheet.rows) ? sheet.rows : [];
    Array.prototype.push.apply(rows, batch);
    offset += batch.length;
    if (!batch.length || rows.length >= catalog.rowCount) break;
  }

  catalog.rows = rows;
  return catalog;
}

function d1OrdersReadSheetStatsFromGoogle_(sheetName) {
  const sheet = d1FullSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('شيت Google غير موجود: ' + sheetName);
  return {
    sheetName: sheetName,
    lastRow: Number(sheet.getLastRow() || 0),
    lastCol: Number(sheet.getLastColumn() || 0)
  };
}

function d1OrdersReadParseTime_(value) {
  const t = Date.parse(String(value || ''));
  return Number.isFinite(t) ? t : 0;
}

function d1OrdersReadParityOne_(sheetName) {
  const d1 = d1OrdersReadFetchSheet_(sheetName);
  const google = d1OrdersReadSheetStatsFromGoogle_(sheetName);
  const ageMs = d1OrdersReadParseTime_(d1.syncedAt) ? Math.max(0, Date.now() - d1OrdersReadParseTime_(d1.syncedAt)) : Number.MAX_SAFE_INTEGER;
  const rowParity = d1.rowCount === google.lastRow && d1.sourceLastRow === google.lastRow;
  const colParity = d1.sourceLastCol === google.lastCol;
  const ready = d1.status === 'ready';
  const liveSyncNote = d1.note === 'TrendOS orders live sync V1';
  const fresh = ageMs <= D1_ORDERS_READ_MAX_STALENESS_MS_V1;

  return {
    sheetName: sheetName,
    googleLastRow: google.lastRow,
    googleLastCol: google.lastCol,
    d1RowCount: d1.rowCount,
    d1SourceLastRow: d1.sourceLastRow,
    d1SourceLastCol: d1.sourceLastCol,
    d1Status: d1.status,
    d1SyncedAt: d1.syncedAt,
    d1AgeSeconds: Math.round(ageMs / 1000),
    d1Note: d1.note,
    rowParity: rowParity,
    colParity: colParity,
    ready: ready,
    fresh: fresh,
    liveSyncNote: liveSyncNote,
    pass: rowParity && colParity && ready && fresh && liveSyncNote
  };
}

function testD1OrdersReadCutover() {
  const props = PropertiesService.getScriptProperties();
  try {
    const orders = d1OrdersReadParityOne_(d1OrdersReadSheetName_('orders'));
    const lines = d1OrdersReadParityOne_(d1OrdersReadSheetName_('lines'));
    const pass = !!(orders.pass && lines.pass);
    const result = {
      success: true,
      pass: pass,
      orders: orders,
      lines: lines,
      checkedAt: new Date().toISOString(),
      message: pass
        ? 'D1 Orders Read Cutover probe passed. جاهز لمرحلة ربط getRowsPageV1931 مع D1 + Sheets fallback.'
        : 'D1 Read Cutover probe لم ينجح. لا يتم تحويل القراءة الآن.'
    };
    props.setProperty(D1_ORDERS_PRIMARY_READ_LAST_PROBE_KEY_V1, JSON.stringify(result));
    props.deleteProperty(D1_ORDERS_PRIMARY_READ_LAST_ERROR_KEY_V1);
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    props.setProperty(D1_ORDERS_PRIMARY_READ_LAST_ERROR_KEY_V1, JSON.stringify({ at: new Date().toISOString(), message: message }));
    Logger.log('D1 ORDERS READ CUTOVER ERROR: ' + message);
    return { success: false, pass: false, message: message };
  }
}

function enableD1OrdersPrimaryRead() {
  const props = PropertiesService.getScriptProperties();
  const probe = testD1OrdersReadCutover();
  if (!probe.success || !probe.pass) {
    props.setProperty(D1_ORDERS_PRIMARY_READ_ENABLED_KEY_V1, '0');
    return {
      success: false,
      enabled: false,
      message: 'لم يتم التفعيل لأن فحص D1 لم ينجح.',
      probe: probe
    };
  }
  props.setProperty(D1_ORDERS_PRIMARY_READ_ENABLED_KEY_V1, '1');
  return {
    success: true,
    enabled: true,
    message: 'تم تجهيز Flag القراءة الأساسية من D1. لم يتم تعديل getRows_ بعد.',
    probe: probe
  };
}

function disableD1OrdersPrimaryRead() {
  PropertiesService.getScriptProperties().setProperty(D1_ORDERS_PRIMARY_READ_ENABLED_KEY_V1, '0');
  return { success: true, enabled: false, message: 'تم إلغاء Flag القراءة الأساسية من D1.' };
}

function getD1OrdersPrimaryReadStatus() {
  const props = PropertiesService.getScriptProperties();
  let probe = null;
  let lastError = null;
  try { probe = JSON.parse(props.getProperty(D1_ORDERS_PRIMARY_READ_LAST_PROBE_KEY_V1) || 'null'); } catch (err) {}
  try { lastError = JSON.parse(props.getProperty(D1_ORDERS_PRIMARY_READ_LAST_ERROR_KEY_V1) || 'null'); } catch (err) {}
  return {
    success: true,
    enabled: String(props.getProperty(D1_ORDERS_PRIMARY_READ_ENABLED_KEY_V1) || '') === '1',
    probe: probe,
    lastError: lastError
  };
}
