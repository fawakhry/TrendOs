/* TrendOS D1 live sync for Orders + Order Lines.
 *
 * Purpose:
 * - Keeps the two first-cutover sheets continuously mirrored in D1.
 * - Runs every minute after startD1OrdersLiveSync().
 * - Reuses the safe helpers from D1_Full_Migration.gs.
 * - Google Sheets remains the write source during read-first cutover.
 * - Each pass fully replaces only these two mirrors, so deletes/archives are reflected too.
 */

const D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_ENABLED_V1';
const D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_RUN_V1';
const D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_ERROR_V1';
const D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1 = 'd1OrdersLiveSyncTick';
const D1_ORDERS_LIVE_SYNC_BATCH_ROWS_V1 = 80;

function d1OrdersLiveSyncRemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function d1OrdersLiveSyncNames_() {
  return [
    (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) ? SHEET_NAME_ORDERS : 'الأوردرات',
    (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) ? SHEET_NAME_LINES : 'بنود الأوردرات'
  ];
}

function d1OrdersLiveSyncOneSheet_(sheet) {
  const sheetName = sheet.getName();
  const sheetId = sheet.getSheetId();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = d1FullHeaders_(sheet, lastRow, lastCol);

  if (lastRow < 1 || lastCol < 1) {
    d1FullPost_('/v1/import/sheet', {
      sheetName: sheetName,
      sheetId: sheetId,
      headers: headers,
      sourceLastRow: lastRow,
      sourceLastCol: lastCol,
      reset: true,
      final: true,
      rows: [],
      note: 'TrendOS orders live sync V1'
    });
    return { sheetName: sheetName, copiedRows: 0, sourceLastRow: lastRow };
  }

  let startRow = 1;
  let copiedRows = 0;
  let firstBatch = true;

  while (startRow <= lastRow) {
    const numRows = Math.min(D1_ORDERS_LIVE_SYNC_BATCH_ROWS_V1, lastRow - startRow + 1);
    const rows = d1FullBuildRows_(sheet, startRow, numRows, lastCol);
    const final = (startRow + numRows - 1) >= lastRow;

    d1FullPost_('/v1/import/sheet', {
      sheetName: sheetName,
      sheetId: sheetId,
      headers: headers,
      sourceLastRow: lastRow,
      sourceLastCol: lastCol,
      reset: firstBatch,
      final: final,
      rows: rows,
      note: 'TrendOS orders live sync V1'
    });

    copiedRows += rows.length;
    firstBatch = false;
    startRow += numRows;
  }

  return { sheetName: sheetName, copiedRows: copiedRows, sourceLastRow: lastRow };
}

function d1OrdersLiveSyncTick() {
  const props = PropertiesService.getScriptProperties();
  if (String(props.getProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1) || '') !== '1') {
    return { success: false, skipped: true, message: 'Orders live sync is disabled.' };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { success: false, skipped: true, message: 'Another TrendOS write/sync is running.' };
  }

  try {
    const ss = d1FullSpreadsheet_();
    const names = d1OrdersLiveSyncNames_();
    const results = [];

    names.forEach(function(name) {
      const sheet = ss.getSheetByName(name);
      if (!sheet) throw new Error('شيت غير موجود: ' + name);
      results.push(d1OrdersLiveSyncOneSheet_(sheet));
    });

    const at = new Date().toISOString();
    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1, JSON.stringify({ at: at, sheets: results }));
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);

    return {
      success: true,
      syncedAt: at,
      sheets: results,
      mirror: d1FullGet_('/v1/mirror/stats')
    };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1, JSON.stringify({ at: new Date().toISOString(), message: message }));
    Logger.log('D1 ORDERS LIVE SYNC ERROR: ' + message);
    return { success: false, message: message };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function startD1OrdersLiveSync() {
  const props = PropertiesService.getScriptProperties();

  // Verify Worker before enabling the trigger.
  d1FullGet_('/v1/mirror/stats');

  d1OrdersLiveSyncRemoveTriggers_();
  props.setProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '1');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);

  const firstRun = d1OrdersLiveSyncTick();
  if (!firstRun.success) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '0');
    throw new Error(firstRun.message || 'تعذر بدء مزامنة الأوردرات مع D1.');
  }

  ScriptApp.newTrigger(D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1)
    .timeBased()
    .everyMinutes(1)
    .create();

  return {
    success: true,
    message: 'تم تشغيل المزامنة الحية للأوردرات وبنود الأوردرات كل دقيقة.',
    firstRun: firstRun
  };
}

function stopD1OrdersLiveSync() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '0');
  d1OrdersLiveSyncRemoveTriggers_();
  return { success: true, message: 'تم إيقاف مزامنة الأوردرات الحية.' };
}

function getD1OrdersLiveSyncStatus() {
  const props = PropertiesService.getScriptProperties();
  let lastRun = null;
  let lastError = null;
  try { lastRun = JSON.parse(props.getProperty(D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1) || 'null'); } catch (err) {}
  try { lastError = JSON.parse(props.getProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1) || 'null'); } catch (err) {}

  return {
    success: true,
    enabled: String(props.getProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1) || '') === '1',
    lastRun: lastRun,
    lastError: lastError,
    mirror: d1FullGet_('/v1/mirror/stats')
  };
}
