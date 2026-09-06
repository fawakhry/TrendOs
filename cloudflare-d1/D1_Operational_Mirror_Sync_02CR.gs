/* TrendOS PERF-CF-02CR — operational mirror sync candidate.
 *
 * DEFAULT OFF / NOT DEPLOYED BY COMMIT.
 * Reads only the authoritative TrendOS spreadsheet and atomically mirrors exactly:
 *   الأوردرات, بنود الأوردرات, العملاء, عملاء منع التسليم بالمديونية
 * into existing D1 sheet_catalog/sheet_rows through /v1/import/sheet.
 *
 * Safety:
 * - Google Sheets remain authoritative; this module never writes to Sheets.
 * - No frontend flag/cutover, Worker deploy, outbox drain, 02CL gate, or secret rotation.
 * - D1_API_URL + D1_MIGRATION_SECRET are read only from Script Properties and never logged/returned.
 * - One-shot entry opens its private gate only for the synchronous call and deletes it in finally.
 */

const D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY = 'TRENDOS_PERF_CF_02CR_OPERATIONAL_SYNC_ENABLED';
const D1_OPERATIONAL_SYNC_02CR_LAST_RESULT_KEY = 'TRENDOS_PERF_CF_02CR_OPERATIONAL_SYNC_LAST_RESULT';
const D1_OPERATIONAL_SYNC_02CR_NOTE = 'PERF-CF-02CR operational mirror V1';
const D1_OPERATIONAL_SYNC_02CR_BATCH_ROWS = 80;
const D1_OPERATIONAL_SYNC_02CR_SPREADSHEET_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const D1_OPERATIONAL_SYNC_02CR_TARGETS = Object.freeze([
  'الأوردرات',
  'بنود الأوردرات',
  'العملاء',
  'عملاء منع التسليم بالمديونية'
]);

function d1OperationalSync02CREnabled_() {
  return String(PropertiesService.getScriptProperties().getProperty(D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY) || '').trim() === '1';
}

function d1OperationalSync02CRApiUrl_() {
  const url = String(PropertiesService.getScriptProperties().getProperty('D1_API_URL') || '').trim().replace(/\/+$/, '');
  if (!url) throw new Error('02CR D1_API_URL is missing from Script Properties.');
  return url;
}

function d1OperationalSync02CRMigrationSecret_() {
  const secret = String(PropertiesService.getScriptProperties().getProperty('D1_MIGRATION_SECRET') || '').trim();
  if (!secret) throw new Error('02CR D1_MIGRATION_SECRET is missing from Script Properties.');
  return secret;
}

function d1OperationalSync02CRSpreadsheet_() {
  const ss = SpreadsheetApp.openById(D1_OPERATIONAL_SYNC_02CR_SPREADSHEET_ID);
  if (!ss || String(ss.getId()) !== D1_OPERATIONAL_SYNC_02CR_SPREADSHEET_ID) {
    throw new Error('02CR authoritative spreadsheet identity mismatch.');
  }
  return ss;
}

function d1OperationalSync02CRSerialize_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value.toISOString();
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  return String(value);
}

function d1OperationalSync02CRRows_(sheet, startRow, count, lastCol) {
  const range = sheet.getRange(startRow, 1, count, lastCol);
  const values = range.getValues();
  const display = range.getDisplayValues();
  const formulas = range.getFormulas();
  return values.map(function(row, i) {
    return {
      rowNumber: startRow + i,
      values: row.map(d1OperationalSync02CRSerialize_),
      display: display[i],
      formulas: formulas[i]
    };
  });
}

function d1OperationalSync02CRParse_(response, context) {
  const code = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); }
  catch (err) { throw new Error('02CR invalid D1 JSON for ' + context + ' HTTP ' + code + '.'); }
  if (code < 200 || code >= 300 || !body.success) {
    throw new Error(String(body.message || ('02CR D1 request failed for ' + context + ' HTTP ' + code)));
  }
  return body;
}

function d1OperationalSync02CRPost_(path, payload) {
  const response = UrlFetchApp.fetch(d1OperationalSync02CRApiUrl_() + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-migration-secret': d1OperationalSync02CRMigrationSecret_() },
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
    followRedirects: true
  });
  return d1OperationalSync02CRParse_(response, 'POST ' + path);
}

function d1OperationalSync02CRGet_(path) {
  const response = UrlFetchApp.fetch(d1OperationalSync02CRApiUrl_() + path, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true
  });
  return d1OperationalSync02CRParse_(response, 'GET ' + path);
}

function d1OperationalSync02CRSources_(ss) {
  return D1_OPERATIONAL_SYNC_02CR_TARGETS.map(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('02CR target sheet missing: ' + sheetName);
    const lastRow = Number(sheet.getLastRow() || 0);
    const lastCol = Number(sheet.getLastColumn() || 0);
    if (lastRow < 1 || lastCol < 1) throw new Error('02CR target has no header grid: ' + sheetName);
    return { sheetName: sheetName, sheetId: String(sheet.getSheetId()), lastRow: lastRow, lastCol: lastCol };
  });
}

function d1OperationalSync02CRStage_(runId, ss, source) {
  const sheet = ss.getSheetByName(source.sheetName);
  const headers = sheet.getRange(1, 1, 1, source.lastCol).getDisplayValues()[0];
  let nextRow = 1;
  let first = true;
  while (nextRow <= source.lastRow) {
    const count = Math.min(D1_OPERATIONAL_SYNC_02CR_BATCH_ROWS, source.lastRow - nextRow + 1);
    const final = nextRow + count - 1 >= source.lastRow;
    const response = d1OperationalSync02CRPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: source.sheetName,
      sheetId: source.sheetId,
      headers: headers,
      sourceLastRow: source.lastRow,
      sourceLastCol: source.lastCol,
      reset: first,
      final: final,
      rows: d1OperationalSync02CRRows_(sheet, nextRow, count, source.lastCol),
      note: D1_OPERATIONAL_SYNC_02CR_NOTE
    });
    if (!response || response.atomic !== true || response.action !== 'stage') {
      throw new Error('02CR atomic stage rejected: ' + source.sheetName);
    }
    first = false;
    nextRow += count;
  }
}

function d1OperationalSync02CRVerify_(source) {
  const payload = d1OperationalSync02CRGet_('/v1/mirror/sheet?name=' + encodeURIComponent(source.sheetName) + '&limit=1&offset=0');
  const sheet = payload && payload.sheet;
  if (!sheet) throw new Error('02CR mirror verification missing: ' + source.sheetName);
  const result = {
    sheetName: source.sheetName,
    googleLastRow: source.lastRow,
    googleLastCol: source.lastCol,
    d1SourceLastRow: Number(sheet.sourceLastRow || 0),
    d1SourceLastCol: Number(sheet.sourceLastCol || 0),
    d1RowCount: Number(sheet.rowCount || 0),
    d1Status: String(sheet.status || ''),
    d1Note: String(sheet.note || ''),
    pass: false
  };
  result.pass = result.d1SourceLastRow === result.googleLastRow &&
    result.d1SourceLastCol === result.googleLastCol &&
    result.d1RowCount === result.googleLastRow &&
    result.d1Status === 'ready' &&
    result.d1Note === D1_OPERATIONAL_SYNC_02CR_NOTE;
  return result;
}

function refreshD1OperationalMirrors02CR() {
  if (!d1OperationalSync02CREnabled_()) {
    return { success:false, checkpoint:'PERF-CF-02CR', enabled:false, productionMirrorMutated:false, stagingMayHaveMutated:false, message:'02CR operational sync is default-OFF.' };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { success:false, checkpoint:'PERF-CF-02CR', enabled:true, productionMirrorMutated:false, stagingMayHaveMutated:false, message:'02CR operational sync already running.' };
  }

  let runId = '';
  let promoted = false;
  try {
    d1OperationalSync02CRApiUrl_();
    d1OperationalSync02CRMigrationSecret_();
    d1OperationalSync02CRGet_('/v1/mirror/stats');
    const ss = d1OperationalSync02CRSpreadsheet_();
    const sources = d1OperationalSync02CRSources_(ss);
    const lines = sources.filter(function(x) { return x.sheetName === 'بنود الأوردرات'; })[0];
    const customers = sources.filter(function(x) { return x.sheetName === 'العملاء'; })[0];
    if (!lines || lines.lastRow <= 1) throw new Error('02CR lines source is header-only; promotion refused.');
    if (!customers || customers.lastRow <= 1) throw new Error('02CR customers source is header-only; promotion refused.');

    runId = 'PERF-CF-02CR-' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 8);
    sources.forEach(function(source) { d1OperationalSync02CRStage_(runId, ss, source); });

    const promote = d1OperationalSync02CRPost_('/v1/import/sheet', {
      atomicAction: 'promote',
      runId: runId,
      sheetNames: D1_OPERATIONAL_SYNC_02CR_TARGETS.slice()
    });
    if (!promote || promote.atomic !== true || promote.action !== 'promote') throw new Error('02CR atomic promote rejected.');
    promoted = true;

    const verification = sources.map(d1OperationalSync02CRVerify_);
    if (!verification.every(function(x) { return x.pass === true; })) throw new Error('02CR post-promote verification failed.');

    const result = {
      success:true,
      checkpoint:'PERF-CF-02CR',
      enabled:true,
      productionMirrorMutated:true,
      stagingMayHaveMutated:true,
      runId:runId,
      targetCount:D1_OPERATIONAL_SYNC_02CR_TARGETS.length,
      verification:verification,
      checkedAt:new Date().toISOString(),
      message:'02CR four operational mirrors promoted atomically and verified.'
    };
    PropertiesService.getScriptProperties().setProperty(D1_OPERATIONAL_SYNC_02CR_LAST_RESULT_KEY, JSON.stringify(result));
    return result;
  } catch (err) {
    const result = {
      success:false,
      checkpoint:'PERF-CF-02CR',
      enabled:true,
      productionMirrorMutated:promoted,
      stagingMayHaveMutated:!!runId,
      runId:runId,
      checkedAt:new Date().toISOString(),
      message:String(err && err.message ? err.message : err)
    };
    PropertiesService.getScriptProperties().setProperty(D1_OPERATIONAL_SYNC_02CR_LAST_RESULT_KEY, JSON.stringify(result));
    return result;
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function runD1OperationalMirrorSync02CROnce() {
  const props = PropertiesService.getScriptProperties();
  const before = String(props.getProperty(D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY) || '').trim();
  if (before === '1') {
    return { success:false, checkpoint:'PERF-CF-02CR', enabled:true, productionMirrorMutated:false, stagingMayHaveMutated:false, gateClosed:false, message:'02CR gate was already ON; one-shot execution refused.' };
  }
  try {
    props.setProperty(D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY, '1');
    return refreshD1OperationalMirrors02CR();
  } finally {
    props.deleteProperty(D1_OPERATIONAL_SYNC_02CR_ENABLED_KEY);
  }
}

function getD1OperationalMirrorSync02CRStatus() {
  const props = PropertiesService.getScriptProperties();
  let lastResult = null;
  try { lastResult = JSON.parse(props.getProperty(D1_OPERATIONAL_SYNC_02CR_LAST_RESULT_KEY) || 'null'); } catch (err) {}
  return {
    success:true,
    checkpoint:'PERF-CF-02CR',
    enabled:d1OperationalSync02CREnabled_(),
    authoritativeSpreadsheetId:D1_OPERATIONAL_SYNC_02CR_SPREADSHEET_ID,
    targets:D1_OPERATIONAL_SYNC_02CR_TARGETS.slice(),
    note:D1_OPERATIONAL_SYNC_02CR_NOTE,
    lastResult:lastResult
  };
}
