/* TrendOS D1 quota-aware live sync V2 for Orders + Order Lines.
 *
 * Goals:
 * - Keep Google Sheets authoritative.
 * - Preserve atomic full snapshot promotion when source content changes.
 * - Avoid rewriting every row every minute when source content is unchanged.
 * - Use an authenticated atomic heartbeat to refresh D1 freshness metadata only.
 * - Force a periodic full rebase to guard against long-lived drift.
 * - Coexist safely with V1 until an explicit production cutover.
 */

const D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY = 'D1_ORDERS_LIVE_SYNC_V2_ENABLED';
const D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_RUN';
const D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR';
const D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT';
const D1_ORDERS_LIVE_SYNC_V2_LAST_FINGERPRINT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_FINGERPRINT';
const D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT';
const D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN = 'd1OrdersLiveSyncTickV2';
const D1_ORDERS_LIVE_SYNC_V2_BATCH_ROWS = 80;
const D1_ORDERS_LIVE_SYNC_V2_LOCK_WAIT_MS = 5000;
const D1_ORDERS_LIVE_SYNC_V2_FULL_REBASE_MS = 6 * 60 * 60 * 1000;
const D1_ORDERS_LIVE_SYNC_V2_FRESHNESS_TARGET_MS = 3 * 60 * 1000;
const D1_ORDERS_LIVE_SYNC_V2_NOTE = 'TrendOS orders live sync V2 quota-aware';

function d1OrdersLiveSyncV2Names_() {
  return [
    (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) ? SHEET_NAME_ORDERS : 'الأوردرات',
    (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) ? SHEET_NAME_LINES : 'بنود الأوردرات'
  ];
}

function d1OrdersLiveSyncV2RemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function d1OrdersLiveSyncV2JsonProp_(props, key) {
  try { return JSON.parse(props.getProperty(key) || 'null'); } catch (err) { return null; }
}

function d1OrdersLiveSyncV2SetAttempt_(props, payload) {
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY, JSON.stringify(payload || {}));
}

function d1OrdersLiveSyncV2DigestHex_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function d1OrdersLiveSyncV2CaptureSheet_(sheet) {
  const sheetName = sheet.getName();
  const sheetId = sheet.getSheetId();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = d1FullHeaders_(sheet, lastRow, lastCol);
  const rows = (lastRow > 0 && lastCol > 0)
    ? d1FullBuildRows_(sheet, 1, lastRow, lastCol)
    : [];

  const hash = d1OrdersLiveSyncV2DigestHex_(JSON.stringify({
    sheetName: sheetName,
    sheetId: String(sheetId),
    sourceLastRow: lastRow,
    sourceLastCol: lastCol,
    headers: headers,
    rows: rows
  }));

  return {
    sheetName: sheetName,
    sheetId: sheetId,
    sourceLastRow: lastRow,
    sourceLastCol: lastCol,
    headers: headers,
    rows: rows,
    hash: hash
  };
}

function d1OrdersLiveSyncV2CaptureAll_() {
  const ss = d1FullSpreadsheet_();
  const snapshots = d1OrdersLiveSyncV2Names_().map(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error('شيت غير موجود: ' + name);
    return d1OrdersLiveSyncV2CaptureSheet_(sheet);
  });

  const combined = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(
    snapshots.map(function(s) {
      return {
        sheetName: s.sheetName,
        sourceLastRow: s.sourceLastRow,
        sourceLastCol: s.sourceLastCol,
        hash: s.hash
      };
    })
  ));

  return { snapshots: snapshots, fingerprint: combined };
}

function d1OrdersLiveSyncV2Capabilities_() {
  const payload = d1FullGet_('/v1/mirror/capabilities');
  const caps = payload && payload.capabilities ? payload.capabilities : null;
  if (!payload || payload.success !== true || !caps || caps.schemaMutationFree !== true) {
    throw new Error('D1 mirror capability probe failed closed.');
  }
  if (caps.atomicSupported !== true) {
    throw new Error('D1 atomic staging schema is not ready.');
  }
  return caps;
}

function d1OrdersLiveSyncV2StageSnapshot_(snapshot, runId) {
  const totalRows = snapshot.rows.length;

  if (totalRows === 0) {
    const emptyResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: snapshot.sheetName,
      sheetId: snapshot.sheetId,
      headers: snapshot.headers,
      sourceLastRow: snapshot.sourceLastRow,
      sourceLastCol: snapshot.sourceLastCol,
      reset: true,
      final: true,
      rows: [],
      note: D1_ORDERS_LIVE_SYNC_V2_NOTE
    });
    if (!emptyResult || emptyResult.success !== true || emptyResult.atomic !== true) {
      throw new Error('Atomic empty-stage failed for ' + snapshot.sheetName);
    }
    return {
      sheetName: snapshot.sheetName,
      copiedRows: 0,
      sourceLastRow: snapshot.sourceLastRow,
      sourceLastCol: snapshot.sourceLastCol,
      stage: emptyResult
    };
  }

  let offset = 0;
  let firstBatch = true;
  let finalResult = null;

  while (offset < totalRows) {
    const batch = snapshot.rows.slice(offset, offset + D1_ORDERS_LIVE_SYNC_V2_BATCH_ROWS);
    const final = (offset + batch.length) >= totalRows;

    finalResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: snapshot.sheetName,
      sheetId: snapshot.sheetId,
      headers: snapshot.headers,
      sourceLastRow: snapshot.sourceLastRow,
      sourceLastCol: snapshot.sourceLastCol,
      reset: firstBatch,
      final: final,
      rows: batch,
      note: D1_ORDERS_LIVE_SYNC_V2_NOTE
    });

    if (!finalResult || finalResult.success !== true || finalResult.atomic !== true || finalResult.action !== 'stage') {
      throw new Error('Atomic stage failed for ' + snapshot.sheetName + ' at offset ' + offset);
    }

    firstBatch = false;
    offset += batch.length;
  }

  if (!finalResult || finalResult.final !== true || Number(finalResult.copiedRows || 0) !== snapshot.sourceLastRow) {
    throw new Error('Atomic final-stage parity failed for ' + snapshot.sheetName);
  }

  return {
    sheetName: snapshot.sheetName,
    copiedRows: totalRows,
    sourceLastRow: snapshot.sourceLastRow,
    sourceLastCol: snapshot.sourceLastCol,
    stage: finalResult
  };
}

function d1OrdersLiveSyncV2Heartbeat_(snapshots) {
  const result = d1FullPost_('/v1/mirror/heartbeat', {
    sheets: snapshots.map(function(s) {
      return {
        sheetName: s.sheetName,
        sourceLastRow: s.sourceLastRow,
        sourceLastCol: s.sourceLastCol,
        rowCount: s.rows.length,
        expectedNote: D1_ORDERS_LIVE_SYNC_V2_NOTE
      };
    })
  });

  if (!result || result.success !== true || result.atomic !== true || result.action !== 'heartbeat') {
    throw new Error('D1 atomic heartbeat failed closed.');
  }
  return result;
}

function d1OrdersLiveSyncV2FullSync_(snapshots, runId) {
  const staged = snapshots.map(function(snapshot) {
    return d1OrdersLiveSyncV2StageSnapshot_(snapshot, runId);
  });

  const names = snapshots.map(function(s) { return s.sheetName; });
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

  return { staged: staged, promote: promote };
}

function d1OrdersLiveSyncTickV2() {
  const props = PropertiesService.getScriptProperties();
  const attemptAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1';

  d1OrdersLiveSyncV2SetAttempt_(props, {
    at: attemptAt,
    enabled: enabled,
    phase: 'start',
    version: 2,
    quotaAware: true
  });

  if (!enabled) {
    return {
      success: false,
      skipped: true,
      version: 2,
      reason: 'disabled',
      message: 'Orders live sync V2 is disabled.'
    };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_ORDERS_LIVE_SYNC_V2_LOCK_WAIT_MS)) {
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt,
      enabled: true,
      phase: 'skipped',
      version: 2,
      reason: 'script-lock-unavailable',
      durationMs: Date.now() - startedMs
    });
    return {
      success: false,
      skipped: true,
      version: 2,
      reason: 'script-lock-unavailable'
    };
  }

  const runId = 'orders-v2-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);

  try {
    const capabilities = d1OrdersLiveSyncV2Capabilities_();
    const capture = d1OrdersLiveSyncV2CaptureAll_();
    const previousFingerprint = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FINGERPRINT_KEY) || '');
    const lastFullAt = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || '');
    const lastFullMs = lastFullAt ? Date.parse(lastFullAt) : 0;
    const fullRebaseDue = !lastFullMs || (Date.now() - lastFullMs) >= D1_ORDERS_LIVE_SYNC_V2_FULL_REBASE_MS;
    const sourceChanged = !previousFingerprint || previousFingerprint !== capture.fingerprint;
    const mode = (sourceChanged || fullRebaseDue) ? 'full' : 'heartbeat';

    let payload;
    if (mode === 'heartbeat') {
      payload = d1OrdersLiveSyncV2Heartbeat_(capture.snapshots);
    } else {
      payload = d1OrdersLiveSyncV2FullSync_(capture.snapshots, runId);
      props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FINGERPRINT_KEY, capture.fingerprint);
      props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());
    }

    const at = new Date().toISOString();
    const durationMs = Date.now() - startedMs;
    const run = {
      at: at,
      runId: runId,
      version: 2,
      quotaAware: true,
      atomic: true,
      mode: mode,
      sourceChanged: sourceChanged,
      fullRebaseDue: fullRebaseDue,
      fingerprint: capture.fingerprint,
      durationMs: durationMs,
      capabilities: {
        atomicSupported: capabilities.atomicSupported === true,
        schemaMutationFree: capabilities.schemaMutationFree === true
      },
      sheets: capture.snapshots.map(function(s) {
        return {
          sheetName: s.sheetName,
          sourceLastRow: s.sourceLastRow,
          sourceLastCol: s.sourceLastCol,
          rowCount: s.rows.length,
          hash: s.hash
        };
      }),
      result: payload
    };

    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY, JSON.stringify(run));
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt,
      completedAt: at,
      enabled: true,
      phase: 'success',
      version: 2,
      quotaAware: true,
      mode: mode,
      runId: runId,
      durationMs: durationMs
    });

    return {
      success: true,
      atomic: true,
      version: 2,
      quotaAware: true,
      mode: mode,
      runId: runId,
      syncedAt: at,
      durationMs: durationMs,
      sourceChanged: sourceChanged,
      fullRebaseDue: fullRebaseDue,
      sheets: run.sheets,
      result: payload
    };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const failure = {
      at: new Date().toISOString(),
      runId: runId,
      version: 2,
      quotaAware: true,
      atomic: true,
      durationMs: Date.now() - startedMs,
      message: message
    };
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY, JSON.stringify(failure));
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt,
      completedAt: failure.at,
      enabled: true,
      phase: 'error',
      version: 2,
      quotaAware: true,
      runId: runId,
      durationMs: failure.durationMs,
      message: message
    });
    Logger.log('D1 ORDERS LIVE SYNC V2 ERROR: ' + message);
    return {
      success: false,
      atomic: true,
      version: 2,
      quotaAware: true,
      runId: runId,
      message: message,
      durationMs: failure.durationMs
    };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function startD1OrdersLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  const caps = d1OrdersLiveSyncV2Capabilities_();

  // Never run V1 and V2 together. Explicitly remove the known V1 trigger first.
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = trigger.getHandlerFunction();
    if (fn === 'd1OrdersLiveSyncTick' || fn === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  props.setProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0');
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '1');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);

  const firstRun = d1OrdersLiveSyncTickV2();
  if (!firstRun.success) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
    d1OrdersLiveSyncV2RemoveTriggers_();
    throw new Error(firstRun.message || 'تعذر بدء مزامنة D1 V2.');
  }

  d1OrdersLiveSyncV2RemoveTriggers_();
  ScriptApp.newTrigger(D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN)
    .timeBased()
    .everyMinutes(1)
    .create();

  return {
    success: true,
    version: 2,
    quotaAware: true,
    atomic: true,
    capabilities: {
      atomicSupported: caps.atomicSupported === true,
      schemaMutationFree: caps.schemaMutationFree === true
    },
    firstRun: firstRun,
    message: 'تم تشغيل D1 Orders Live Sync V2 مع تقليل استهلاك row writes.'
  };
}

function stopD1OrdersLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
  d1OrdersLiveSyncV2RemoveTriggers_();
  d1OrdersLiveSyncV2SetAttempt_(props, {
    at: new Date().toISOString(),
    enabled: false,
    phase: 'stopped',
    version: 2
  });
  return { success: true, version: 2, message: 'تم إيقاف D1 Orders Live Sync V2.' };
}

function getD1OrdersLiveSyncStatusV2() {
  const props = PropertiesService.getScriptProperties();
  const lastRun = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY);
  const lastError = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
  const lastAttempt = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY);
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1';
  const triggerCount = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN;
  }).length;
  const v1TriggerCount = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === 'd1OrdersLiveSyncTick';
  }).length;
  const lastRunMs = lastRun && lastRun.at ? Date.parse(String(lastRun.at)) : 0;
  const ageMs = lastRunMs ? Math.max(0, Date.now() - lastRunMs) : Number.MAX_SAFE_INTEGER;

  return {
    success: true,
    version: 2,
    quotaAware: true,
    enabled: enabled,
    triggerCount: triggerCount,
    v1TriggerCount: v1TriggerCount,
    healthyConfiguration: enabled && triggerCount === 1 && v1TriggerCount === 0,
    lastRun: lastRun,
    lastAttempt: lastAttempt,
    lastError: lastError,
    lastFingerprintPresent: !!String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FINGERPRINT_KEY) || ''),
    lastFullSyncAt: String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || ''),
    lastRunAgeSeconds: ageMs === Number.MAX_SAFE_INTEGER ? null : Math.round(ageMs / 1000),
    freshByTarget: ageMs <= D1_ORDERS_LIVE_SYNC_V2_FRESHNESS_TARGET_MS,
    config: {
      hasD1ApiUrl: !!String(props.getProperty('D1_API_URL') || '').trim(),
      hasD1MigrationSecret: !!String(props.getProperty('D1_MIGRATION_SECRET') || '').trim()
    },
    mirror: d1FullGet_('/v1/mirror/stats')
  };
}

function testD1OrdersLiveSyncV2() {
  const result = d1OrdersLiveSyncTickV2();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
