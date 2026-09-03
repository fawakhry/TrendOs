/* TrendOS D1 live sync for Orders + Order Lines.
 *
 * Purpose:
 * - Keeps the two first-cutover sheets continuously mirrored in D1.
 * - Runs every minute after startD1OrdersLiveSync().
 * - Reuses the safe helpers from D1_Full_Migration.gs.
 * - Google Sheets remains the write source during read-first cutover.
 * - Each pass fully replaces only these two mirrors, so deletes/archives are reflected too.
 *
 * Operational note:
 * - Apps Script marks an execution as "Completed" when a function simply returns,
 *   even if that return represents a skipped sync. This file therefore persists
 *   every attempt/skip and exposes consecutive lock starvation explicitly.
 */

const D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_ENABLED_V1';
const D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_RUN_V1';
const D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_ERROR_V1';
const D1_ORDERS_LIVE_SYNC_LAST_ATTEMPT_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_ATTEMPT_V1';
const D1_ORDERS_LIVE_SYNC_LAST_SKIP_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_LAST_SKIP_V1';
const D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1 = 'D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_V1';
const D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1 = 'd1OrdersLiveSyncTick';
const D1_ORDERS_LIVE_SYNC_BATCH_ROWS_V1 = 80;
const D1_ORDERS_LIVE_SYNC_LOCK_WAIT_MS_V1 = 5000;
const D1_ORDERS_LIVE_SYNC_STARVATION_THRESHOLD_V1 = 5;
const D1_ORDERS_LIVE_SYNC_FRESHNESS_TARGET_MS_V1 = 3 * 60 * 1000;

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

function d1OrdersLiveSyncJsonProp_(props, key) {
  try { return JSON.parse(props.getProperty(key) || 'null'); } catch (err) { return null; }
}

function d1OrdersLiveSyncSetAttempt_(props, payload) {
  props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_ATTEMPT_KEY_V1, JSON.stringify(payload || {}));
}

function d1OrdersLiveSyncRecordSkip_(props, reason, extra) {
  const previous = Number(props.getProperty(D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1) || '0');
  const count = previous + 1;
  const payload = Object.assign({
    at: new Date().toISOString(),
    reason: String(reason || 'unknown'),
    consecutiveSkips: count
  }, extra || {});
  props.setProperty(D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1, String(count));
  props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_SKIP_KEY_V1, JSON.stringify(payload));
  Logger.log('D1 ORDERS LIVE SYNC SKIP: ' + JSON.stringify(payload));
  return payload;
}

function d1OrdersLiveSyncClearSkip_(props) {
  props.setProperty(D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1, '0');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_SKIP_KEY_V1);
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
    return { sheetName: sheetName, copiedRows: 0, sourceLastRow: lastRow, sourceLastCol: lastCol };
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

  return {
    sheetName: sheetName,
    copiedRows: copiedRows,
    sourceLastRow: lastRow,
    sourceLastCol: lastCol
  };
}

function d1OrdersLiveSyncTick() {
  const props = PropertiesService.getScriptProperties();
  const attemptAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1) || '') === '1';
  d1OrdersLiveSyncSetAttempt_(props, { at: attemptAt, enabled: enabled, phase: 'start' });

  if (!enabled) {
    const skipped = d1OrdersLiveSyncRecordSkip_(props, 'disabled', { enabled: false });
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      enabled: false,
      phase: 'skipped',
      reason: skipped.reason,
      consecutiveSkips: skipped.consecutiveSkips,
      durationMs: Date.now() - startedMs
    });
    return { success: false, skipped: true, reason: skipped.reason, message: 'Orders live sync is disabled.' };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_ORDERS_LIVE_SYNC_LOCK_WAIT_MS_V1)) {
    const skipped = d1OrdersLiveSyncRecordSkip_(props, 'script-lock-unavailable', {
      waitMs: D1_ORDERS_LIVE_SYNC_LOCK_WAIT_MS_V1
    });
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      enabled: true,
      phase: 'skipped',
      reason: skipped.reason,
      consecutiveSkips: skipped.consecutiveSkips,
      durationMs: Date.now() - startedMs
    });
    return {
      success: false,
      skipped: true,
      starved: skipped.consecutiveSkips >= D1_ORDERS_LIVE_SYNC_STARVATION_THRESHOLD_V1,
      consecutiveSkips: skipped.consecutiveSkips,
      message: 'Another TrendOS write/sync is running.'
    };
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
    const durationMs = Date.now() - startedMs;
    const run = { at: at, durationMs: durationMs, sheets: results };
    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1, JSON.stringify(run));
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);
    d1OrdersLiveSyncClearSkip_(props);
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      completedAt: at,
      enabled: true,
      phase: 'success',
      durationMs: durationMs,
      sheets: results
    });

    return {
      success: true,
      syncedAt: at,
      durationMs: durationMs,
      sheets: results,
      mirror: d1FullGet_('/v1/mirror/stats')
    };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const failure = {
      at: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      message: message
    };
    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1, JSON.stringify(failure));
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      completedAt: failure.at,
      enabled: true,
      phase: 'error',
      durationMs: failure.durationMs,
      message: message
    });
    Logger.log('D1 ORDERS LIVE SYNC ERROR: ' + message);
    return { success: false, message: message, durationMs: failure.durationMs };
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
  d1OrdersLiveSyncClearSkip_(props);

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
  d1OrdersLiveSyncSetAttempt_(props, {
    at: new Date().toISOString(),
    enabled: false,
    phase: 'stopped'
  });
  return { success: true, message: 'تم إيقاف مزامنة الأوردرات الحية.' };
}

function getD1OrdersLiveSyncStatus() {
  const props = PropertiesService.getScriptProperties();
  const lastRun = d1OrdersLiveSyncJsonProp_(props, D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1);
  const lastError = d1OrdersLiveSyncJsonProp_(props, D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);
  const lastAttempt = d1OrdersLiveSyncJsonProp_(props, D1_ORDERS_LIVE_SYNC_LAST_ATTEMPT_KEY_V1);
  const lastSkip = d1OrdersLiveSyncJsonProp_(props, D1_ORDERS_LIVE_SYNC_LAST_SKIP_KEY_V1);
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1) || '') === '1';
  const consecutiveSkips = Number(props.getProperty(D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1) || '0');
  const triggerCount = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1;
  }).length;
  const lastRunMs = lastRun && lastRun.at ? Date.parse(String(lastRun.at)) : 0;
  const lastRunAgeMs = lastRunMs ? Math.max(0, Date.now() - lastRunMs) : Number.MAX_SAFE_INTEGER;

  return {
    success: true,
    enabled: enabled,
    triggerCount: triggerCount,
    healthyConfiguration: enabled && triggerCount === 1,
    lastRun: lastRun,
    lastAttempt: lastAttempt,
    lastSkip: lastSkip,
    consecutiveSkips: consecutiveSkips,
    starved: consecutiveSkips >= D1_ORDERS_LIVE_SYNC_STARVATION_THRESHOLD_V1,
    lastRunAgeSeconds: lastRunAgeMs === Number.MAX_SAFE_INTEGER ? null : Math.round(lastRunAgeMs / 1000),
    freshByTarget: lastRunAgeMs <= D1_ORDERS_LIVE_SYNC_FRESHNESS_TARGET_MS_V1,
    lastError: lastError,
    config: {
      hasD1ApiUrl: !!String(props.getProperty('D1_API_URL') || '').trim(),
      hasD1MigrationSecret: !!String(props.getProperty('D1_MIGRATION_SECRET') || '').trim()
    },
    mirror: d1FullGet_('/v1/mirror/stats')
  };
}
