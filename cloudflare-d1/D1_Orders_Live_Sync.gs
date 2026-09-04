/* TrendOS D1 ATOMIC live sync for Orders + Order Lines.
 *
 * Safety contract:
 * - Google Sheets remains the authoritative write source.
 * - Orders + Order Lines are staged under one runId.
 * - The live D1 mirror remains untouched until BOTH stages are complete.
 * - Both sheets are promoted in one Worker/D1 batch.
 * - A failed stage/promote leaves the previous live mirror readable.
 * - Every attempt/skip/error is persisted so a "Completed" Apps Script
 *   execution cannot be mistaken for a successful sync.
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
const D1_ORDERS_LIVE_SYNC_NOTE_V1 = 'TrendOS orders live sync V1';

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

function d1OrdersLiveSyncRunId_() {
  return 'orders-' + new Date().getTime() + '-' + Utilities.getUuid().slice(0, 8);
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
  Logger.log('D1 ORDERS ATOMIC LIVE SYNC SKIP: ' + JSON.stringify(payload));
  return payload;
}

function d1OrdersLiveSyncClearSkip_(props) {
  props.setProperty(D1_ORDERS_LIVE_SYNC_CONSECUTIVE_SKIPS_KEY_V1, '0');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_SKIP_KEY_V1);
}

function d1OrdersLiveSyncCapabilities_() {
  const payload = d1FullGet_('/v1/mirror/capabilities');
  const caps = payload && payload.capabilities ? payload.capabilities : null;
  if (!payload || payload.success !== true || !caps || caps.schemaMutationFree !== true) {
    throw new Error('D1 mirror capability probe failed closed.');
  }
  if (caps.atomicSupported !== true) {
    throw new Error(
      'D1 atomic staging schema is not ready: ' +
      JSON.stringify({ missingTables: caps.missingTables || [] })
    );
  }
  return caps;
}

function d1OrdersLiveSyncStageOneSheet_(sheet, runId) {
  const sheetName = sheet.getName();
  const sheetId = sheet.getSheetId();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = d1FullHeaders_(sheet, lastRow, lastCol);

  if (lastRow < 1 || lastCol < 1) {
    const emptyResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: sheetName,
      sheetId: sheetId,
      headers: headers,
      sourceLastRow: lastRow,
      sourceLastCol: lastCol,
      reset: true,
      final: true,
      rows: [],
      note: D1_ORDERS_LIVE_SYNC_NOTE_V1
    });
    if (!emptyResult || emptyResult.success !== true || emptyResult.atomic !== true) {
      throw new Error('Atomic empty-stage failed for ' + sheetName);
    }
    return {
      sheetName: sheetName,
      copiedRows: 0,
      sourceLastRow: lastRow,
      sourceLastCol: lastCol,
      stage: emptyResult
    };
  }

  let startRow = 1;
  let copiedRows = 0;
  let firstBatch = true;
  let finalResult = null;

  while (startRow <= lastRow) {
    const numRows = Math.min(D1_ORDERS_LIVE_SYNC_BATCH_ROWS_V1, lastRow - startRow + 1);
    const rows = d1FullBuildRows_(sheet, startRow, numRows, lastCol);
    const final = (startRow + numRows - 1) >= lastRow;

    finalResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: sheetName,
      sheetId: sheetId,
      headers: headers,
      sourceLastRow: lastRow,
      sourceLastCol: lastCol,
      reset: firstBatch,
      final: final,
      rows: rows,
      note: D1_ORDERS_LIVE_SYNC_NOTE_V1
    });

    if (!finalResult || finalResult.success !== true || finalResult.atomic !== true || finalResult.action !== 'stage') {
      throw new Error('Atomic stage failed for ' + sheetName + ' at row ' + startRow);
    }

    copiedRows += rows.length;
    firstBatch = false;
    startRow += numRows;
  }

  if (copiedRows !== lastRow) {
    throw new Error(
      'Atomic staging row mismatch for ' + sheetName +
      ': copied=' + copiedRows + ', source=' + lastRow
    );
  }

  if (!finalResult || finalResult.final !== true || Number(finalResult.copiedRows || 0) !== lastRow) {
    throw new Error(
      'Atomic final-stage parity failed for ' + sheetName +
      ': worker=' + Number(finalResult && finalResult.copiedRows || 0) +
      ', source=' + lastRow
    );
  }

  return {
    sheetName: sheetName,
    copiedRows: copiedRows,
    sourceLastRow: lastRow,
    sourceLastCol: lastCol,
    stage: finalResult
  };
}

function d1OrdersLiveSyncTick() {
  const props = PropertiesService.getScriptProperties();
  const attemptAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1) || '') === '1';
  d1OrdersLiveSyncSetAttempt_(props, { at: attemptAt, enabled: enabled, phase: 'start', atomic: true });

  if (!enabled) {
    const skipped = d1OrdersLiveSyncRecordSkip_(props, 'disabled', { enabled: false, atomic: true });
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      enabled: false,
      atomic: true,
      phase: 'skipped',
      reason: skipped.reason,
      consecutiveSkips: skipped.consecutiveSkips,
      durationMs: Date.now() - startedMs
    });
    return {
      success: false,
      atomic: true,
      skipped: true,
      reason: skipped.reason,
      message: 'Orders live sync is disabled.'
    };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_ORDERS_LIVE_SYNC_LOCK_WAIT_MS_V1)) {
    const skipped = d1OrdersLiveSyncRecordSkip_(props, 'script-lock-unavailable', {
      waitMs: D1_ORDERS_LIVE_SYNC_LOCK_WAIT_MS_V1,
      atomic: true
    });
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      enabled: true,
      atomic: true,
      phase: 'skipped',
      reason: skipped.reason,
      consecutiveSkips: skipped.consecutiveSkips,
      durationMs: Date.now() - startedMs
    });
    return {
      success: false,
      atomic: true,
      skipped: true,
      reason: skipped.reason,
      starved: skipped.consecutiveSkips >= D1_ORDERS_LIVE_SYNC_STARVATION_THRESHOLD_V1,
      consecutiveSkips: skipped.consecutiveSkips,
      message: 'Another TrendOS write/sync is running.'
    };
  }

  const runId = d1OrdersLiveSyncRunId_();

  try {
    const capabilities = d1OrdersLiveSyncCapabilities_();
    const ss = d1FullSpreadsheet_();
    const names = d1OrdersLiveSyncNames_();
    const staged = [];

    // Phase 1: BOTH sheets are copied into staging only.
    names.forEach(function(name) {
      const sheet = ss.getSheetByName(name);
      if (!sheet) throw new Error('شيت غير موجود: ' + name);
      staged.push(d1OrdersLiveSyncStageOneSheet_(sheet, runId));
    });

    // Phase 2: one atomic Worker/D1 promote for BOTH staged snapshots.
    const promote = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'promote',
      runId: runId,
      sheetNames: names
    });

    if (!promote || promote.success !== true || promote.atomic !== true || promote.action !== 'promote') {
      throw new Error('D1 atomic promote failed closed for run ' + runId);
    }

    const promotedNames = (promote.promotedSheets || []).map(function(item) {
      return String(item && item.sheetName || '');
    });
    names.forEach(function(name) {
      if (promotedNames.indexOf(name) === -1) {
        throw new Error('D1 atomic promote omitted sheet: ' + name);
      }
    });

    const at = new Date().toISOString();
    const durationMs = Date.now() - startedMs;
    const run = {
      at: at,
      runId: runId,
      atomic: true,
      durationMs: durationMs,
      capabilities: {
        atomicSupported: capabilities.atomicSupported === true,
        schemaMutationFree: capabilities.schemaMutationFree === true
      },
      staged: staged,
      promote: promote
    };

    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_RUN_KEY_V1, JSON.stringify(run));
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);
    d1OrdersLiveSyncClearSkip_(props);
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      completedAt: at,
      enabled: true,
      atomic: true,
      phase: 'success',
      runId: runId,
      durationMs: durationMs,
      staged: staged.map(function(item) {
        return {
          sheetName: item.sheetName,
          copiedRows: item.copiedRows,
          sourceLastRow: item.sourceLastRow,
          sourceLastCol: item.sourceLastCol
        };
      })
    });

    return {
      success: true,
      atomic: true,
      runId: runId,
      syncedAt: at,
      durationMs: durationMs,
      sheets: staged,
      promote: promote,
      mirror: d1FullGet_('/v1/mirror/stats')
    };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const failure = {
      at: new Date().toISOString(),
      runId: runId,
      atomic: true,
      durationMs: Date.now() - startedMs,
      message: message
    };
    props.setProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1, JSON.stringify(failure));
    d1OrdersLiveSyncSetAttempt_(props, {
      at: attemptAt,
      completedAt: failure.at,
      enabled: true,
      atomic: true,
      phase: 'error',
      runId: runId,
      durationMs: failure.durationMs,
      message: message
    });
    Logger.log('D1 ORDERS ATOMIC LIVE SYNC ERROR: ' + message);
    return {
      success: false,
      atomic: true,
      runId: runId,
      message: message,
      durationMs: failure.durationMs
    };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function startD1OrdersLiveSync() {
  const props = PropertiesService.getScriptProperties();

  // Read-only preflight. Never rely on a GET endpoint to create schema.
  const capabilities = d1OrdersLiveSyncCapabilities_();

  d1OrdersLiveSyncRemoveTriggers_();
  props.setProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '1');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_LAST_ERROR_KEY_V1);
  d1OrdersLiveSyncClearSkip_(props);

  const firstRun = d1OrdersLiveSyncTick();
  if (!firstRun.success) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_ENABLED_KEY_V1, '0');
    d1OrdersLiveSyncRemoveTriggers_();
    throw new Error(firstRun.message || 'تعذر بدء المزامنة الذرية للأوردرات مع D1.');
  }

  // Install exactly one trigger only after an atomic first-run PASS.
  d1OrdersLiveSyncRemoveTriggers_();
  ScriptApp.newTrigger(D1_ORDERS_LIVE_SYNC_TRIGGER_FN_V1)
    .timeBased()
    .everyMinutes(1)
    .create();

  return {
    success: true,
    atomic: true,
    capabilities: {
      atomicSupported: capabilities.atomicSupported === true,
      schemaMutationFree: capabilities.schemaMutationFree === true
    },
    message: 'تم تشغيل المزامنة الذرية للأوردرات وبنود الأوردرات كل دقيقة.',
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
    atomic: true,
    phase: 'stopped'
  });
  return { success: true, atomic: true, message: 'تم إيقاف مزامنة الأوردرات الحية.' };
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

  let capabilities = null;
  let capabilityError = '';
  try {
    capabilities = d1FullGet_('/v1/mirror/capabilities');
  } catch (err) {
    capabilityError = String(err && err.message ? err.message : err);
  }

  return {
    success: true,
    atomic: true,
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
    capabilities: capabilities,
    capabilityError: capabilityError,
    mirror: d1FullGet_('/v1/mirror/stats')
  };
}

function testD1OrdersAtomicLiveSync() {
  const result = d1OrdersLiveSyncTick();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function logD1OrdersLiveSyncStatusAtomic() {
  Logger.log(JSON.stringify(getD1OrdersLiveSyncStatus(), null, 2));
}
