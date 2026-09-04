/* TrendOS D1 quota-aware live sync V2 for Orders + Order Lines.
 *
 * Safety contract:
 * - Google Sheets remains authoritative.
 * - V1 and V2 never run together.
 * - Unchanged source => authenticated metadata heartbeat only.
 * - Changed source => row-level delta only (changed/appended rows + tail deletes).
 * - Both Orders + Lines advance in one D1 batch.
 * - Periodic full atomic rebase repairs drift.
 * - D1 free-tier quota exhaustion triggers local backoff until next UTC reset.
 */

const D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY = 'D1_ORDERS_LIVE_SYNC_V2_ENABLED';
const D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_RUN';
const D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR';
const D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT';
const D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT';
const D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY = 'D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNKS';
const D1_ORDERS_LIVE_SYNC_V2_BASELINE_PREFIX = 'D1_ORDERS_LIVE_SYNC_V2_BASELINE_';
const D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY = 'D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL';
const D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN = 'd1OrdersLiveSyncTickV2';
const D1_ORDERS_LIVE_SYNC_V2_BATCH_ROWS = 80;
const D1_ORDERS_LIVE_SYNC_V2_LOCK_WAIT_MS = 5000;
const D1_ORDERS_LIVE_SYNC_V2_FULL_REBASE_MS = 24 * 60 * 60 * 1000;
const D1_ORDERS_LIVE_SYNC_V2_FRESHNESS_TARGET_MS = 3 * 60 * 1000;
const D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNK_SIZE = 7000;
const D1_ORDERS_LIVE_SYNC_V2_NOTE = 'TrendOS orders live sync V2 quota-aware';

function d1OrdersLiveSyncV2Names_() {
  return [
    (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) ? SHEET_NAME_ORDERS : 'الأوردرات',
    (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) ? SHEET_NAME_LINES : 'بنود الأوردرات'
  ];
}

function d1OrdersLiveSyncV2RemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN) ScriptApp.deleteTrigger(trigger);
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
  const rows = (lastRow > 0 && lastCol > 0) ? d1FullBuildRows_(sheet, 1, lastRow, lastCol) : [];
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
  const fingerprint = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(snapshots.map(function(s) {
    return {
      sheetName: s.sheetName,
      sourceLastRow: s.sourceLastRow,
      sourceLastCol: s.sourceLastCol,
      hash: s.hash
    };
  })));
  return { snapshots: snapshots, fingerprint: fingerprint };
}

function d1OrdersLiveSyncV2BuildBaseline_(capture) {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    fingerprint: capture.fingerprint,
    sheets: capture.snapshots.map(function(snapshot) {
      return {
        sheetName: snapshot.sheetName,
        sourceLastRow: snapshot.sourceLastRow,
        sourceLastCol: snapshot.sourceLastCol,
        rowCount: snapshot.rows.length,
        hash: snapshot.hash,
        rowHashes: snapshot.rows.map(function(row) {
          return [row.rowNumber, d1OrdersLiveSyncV2DigestHex_(JSON.stringify(row))];
        })
      };
    })
  };
}

function d1OrdersLiveSyncV2SaveBaseline_(props, baseline) {
  const oldCount = Number(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  const raw = JSON.stringify(baseline || {});
  const chunks = [];
  for (let i = 0; i < raw.length; i += D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNK_SIZE) {
    chunks.push(raw.slice(i, i + D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNK_SIZE));
  }
  chunks.forEach(function(chunk, index) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_PREFIX + index, chunk);
  });
  for (let i = chunks.length; i < oldCount; i += 1) {
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_PREFIX + i);
  }
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY, String(chunks.length));
}

function d1OrdersLiveSyncV2LoadBaseline_(props) {
  const count = Number(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  if (!count || count < 1 || count > 100) return null;
  let raw = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = props.getProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_PREFIX + i);
    if (chunk == null) return null;
    raw += chunk;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === 2 ? parsed : null;
  } catch (err) {
    return null;
  }
}

function d1OrdersLiveSyncV2ClearBaseline_(props) {
  const count = Number(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  for (let i = 0; i < count; i += 1) props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_PREFIX + i);
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY);
}

function d1OrdersLiveSyncV2Capabilities_() {
  const payload = d1FullGet_('/v1/mirror/capabilities');
  const caps = payload && payload.capabilities ? payload.capabilities : null;
  if (!payload || payload.success !== true || !caps || caps.schemaMutationFree !== true) {
    throw new Error('D1 mirror capability probe failed closed.');
  }
  if (caps.atomicSupported !== true) throw new Error('D1 atomic staging schema is not ready.');
  return caps;
}

function d1OrdersLiveSyncV2StageSnapshot_(snapshot, runId) {
  const totalRows = snapshot.rows.length;
  if (totalRows === 0) {
    const emptyResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage', runId: runId, sheetName: snapshot.sheetName,
      sheetId: snapshot.sheetId, headers: snapshot.headers,
      sourceLastRow: snapshot.sourceLastRow, sourceLastCol: snapshot.sourceLastCol,
      reset: true, final: true, rows: [], note: D1_ORDERS_LIVE_SYNC_V2_NOTE
    });
    if (!emptyResult || emptyResult.success !== true || emptyResult.atomic !== true) {
      throw new Error('Atomic empty-stage failed for ' + snapshot.sheetName);
    }
    return { sheetName: snapshot.sheetName, copiedRows: 0, sourceLastRow: snapshot.sourceLastRow };
  }

  let offset = 0;
  let firstBatch = true;
  let finalResult = null;
  while (offset < totalRows) {
    const batch = snapshot.rows.slice(offset, offset + D1_ORDERS_LIVE_SYNC_V2_BATCH_ROWS);
    const final = (offset + batch.length) >= totalRows;
    finalResult = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage', runId: runId, sheetName: snapshot.sheetName,
      sheetId: snapshot.sheetId, headers: snapshot.headers,
      sourceLastRow: snapshot.sourceLastRow, sourceLastCol: snapshot.sourceLastCol,
      reset: firstBatch, final: final, rows: batch, note: D1_ORDERS_LIVE_SYNC_V2_NOTE
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
  return { sheetName: snapshot.sheetName, copiedRows: totalRows, sourceLastRow: snapshot.sourceLastRow };
}

function d1OrdersLiveSyncV2FullSync_(capture, runId) {
  const staged = capture.snapshots.map(function(snapshot) {
    return d1OrdersLiveSyncV2StageSnapshot_(snapshot, runId);
  });
  const names = capture.snapshots.map(function(s) { return s.sheetName; });
  const promote = d1FullPost_('/v1/import/sheet', {
    atomicAction: 'promote', runId: runId, sheetNames: names
  });
  if (!promote || promote.success !== true || promote.atomic !== true || promote.action !== 'promote') {
    throw new Error('D1 atomic promote failed closed for run ' + runId);
  }
  const promotedNames = (promote.promotedSheets || []).map(function(item) {
    return String(item && item.sheetName || '');
  });
  names.forEach(function(name) {
    if (promotedNames.indexOf(name) === -1) throw new Error('D1 atomic promote omitted sheet: ' + name);
  });
  return { staged: staged, promote: promote };
}

function d1OrdersLiveSyncV2Heartbeat_(capture) {
  const result = d1FullPost_('/v1/mirror/heartbeat', {
    sheets: capture.snapshots.map(function(s) {
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

function d1OrdersLiveSyncV2ComputeDelta_(capture, baseline) {
  if (!baseline || baseline.version !== 2 || !Array.isArray(baseline.sheets)) return null;
  const oldByName = {};
  baseline.sheets.forEach(function(sheet) { oldByName[String(sheet.sheetName || '')] = sheet; });
  const sheets = [];
  let changedRows = 0;
  let deletedRows = 0;

  for (let i = 0; i < capture.snapshots.length; i += 1) {
    const snapshot = capture.snapshots[i];
    const old = oldByName[snapshot.sheetName];
    if (!old || Number(old.rowCount || 0) !== Number(old.sourceLastRow || 0)) return null;

    const oldHashes = {};
    (old.rowHashes || []).forEach(function(pair) {
      if (Array.isArray(pair) && pair.length >= 2) oldHashes[String(pair[0])] = String(pair[1] || '');
    });

    const rows = [];
    snapshot.rows.forEach(function(row) {
      const hash = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(row));
      if (oldHashes[String(row.rowNumber)] !== hash) rows.push(row);
    });

    const deleted = Math.max(0, Number(old.rowCount || 0) - snapshot.sourceLastRow);
    changedRows += rows.length;
    deletedRows += deleted;
    sheets.push({
      sheetName: snapshot.sheetName,
      sheetId: snapshot.sheetId,
      headers: snapshot.headers,
      sourceLastRow: snapshot.sourceLastRow,
      sourceLastCol: snapshot.sourceLastCol,
      baseRowCount: Number(old.rowCount || 0),
      expectedNote: D1_ORDERS_LIVE_SYNC_V2_NOTE,
      note: D1_ORDERS_LIVE_SYNC_V2_NOTE,
      rows: rows
    });
  }

  return { sheets: sheets, changedRows: changedRows, deletedRows: deletedRows };
}

function d1OrdersLiveSyncV2Delta_(delta, runId) {
  const result = d1FullPost_('/v1/mirror/delta', {
    runId: runId,
    sheets: delta.sheets
  });
  if (!result || result.success !== true || result.atomic !== true || result.action !== 'delta' || result.rowLevelDelta !== true) {
    throw new Error('D1 row-level delta failed closed.');
  }
  return result;
}

function d1OrdersLiveSyncV2IsQuotaError_(message) {
  const m = String(message || '').toLowerCase();
  return m.indexOf('free tier daily row write limit') !== -1 ||
    (m.indexOf('exceeded') !== -1 && m.indexOf('row write') !== -1 && m.indexOf('d1') !== -1);
}

function d1OrdersLiveSyncV2NextQuotaReset_() {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 2, 0, 0
  )).toISOString();
}

function d1OrdersLiveSyncTickV2() {
  const props = PropertiesService.getScriptProperties();
  const attemptAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1';
  const quotaPauseUntil = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || '');
  const quotaPauseMs = quotaPauseUntil ? Date.parse(quotaPauseUntil) : 0;

  if (!enabled) return { success: false, skipped: true, version: 2, reason: 'disabled' };
  if (quotaPauseMs && Date.now() < quotaPauseMs) {
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt, enabled: true, phase: 'skipped', version: 2,
      reason: 'd1-quota-backoff', quotaPauseUntil: quotaPauseUntil
    });
    return {
      success: false, skipped: true, version: 2,
      reason: 'd1-quota-backoff', quotaPauseUntil: quotaPauseUntil
    };
  }
  if (quotaPauseMs && Date.now() >= quotaPauseMs) props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY);

  d1OrdersLiveSyncV2SetAttempt_(props, { at: attemptAt, enabled: true, phase: 'start', version: 2, quotaAware: true });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_ORDERS_LIVE_SYNC_V2_LOCK_WAIT_MS)) {
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt, enabled: true, phase: 'skipped', version: 2,
      reason: 'script-lock-unavailable', durationMs: Date.now() - startedMs
    });
    return { success: false, skipped: true, version: 2, reason: 'script-lock-unavailable' };
  }

  const runId = 'orders-v2-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8);

  try {
    const capabilities = d1OrdersLiveSyncV2Capabilities_();
    const capture = d1OrdersLiveSyncV2CaptureAll_();
    const baseline = d1OrdersLiveSyncV2LoadBaseline_(props);
    const lastFullAt = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || '');
    const lastFullMs = lastFullAt ? Date.parse(lastFullAt) : 0;
    const fullRebaseDue = !lastFullMs || (Date.now() - lastFullMs) >= D1_ORDERS_LIVE_SYNC_V2_FULL_REBASE_MS;
    const sourceChanged = !baseline || baseline.fingerprint !== capture.fingerprint;

    let mode = 'heartbeat';
    let result;
    let delta = null;

    if (!baseline || fullRebaseDue) {
      mode = 'full';
      result = d1OrdersLiveSyncV2FullSync_(capture, runId);
      props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());
      d1OrdersLiveSyncV2SaveBaseline_(props, d1OrdersLiveSyncV2BuildBaseline_(capture));
    } else if (sourceChanged) {
      delta = d1OrdersLiveSyncV2ComputeDelta_(capture, baseline);
      if (!delta) {
        mode = 'full';
        result = d1OrdersLiveSyncV2FullSync_(capture, runId);
        props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());
      } else {
        mode = 'delta';
        result = d1OrdersLiveSyncV2Delta_(delta, runId);
      }
      d1OrdersLiveSyncV2SaveBaseline_(props, d1OrdersLiveSyncV2BuildBaseline_(capture));
    } else {
      mode = 'heartbeat';
      result = d1OrdersLiveSyncV2Heartbeat_(capture);
    }

    const at = new Date().toISOString();
    const durationMs = Date.now() - startedMs;
    const run = {
      at: at,
      runId: runId,
      version: 2,
      quotaAware: true,
      rowLevelDelta: true,
      atomic: true,
      mode: mode,
      sourceChanged: sourceChanged,
      fullRebaseDue: fullRebaseDue,
      durationMs: durationMs,
      deltaChangedRows: delta ? delta.changedRows : 0,
      deltaDeletedRows: delta ? delta.deletedRows : 0,
      estimatedRowWrites: result && result.estimatedRowWrites != null ? Number(result.estimatedRowWrites) : null,
      capabilities: {
        atomicSupported: capabilities.atomicSupported === true,
        schemaMutationFree: capabilities.schemaMutationFree === true
      },
      result: result
    };

    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY, JSON.stringify(run));
    props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
    d1OrdersLiveSyncV2SetAttempt_(props, {
      at: attemptAt, completedAt: at, enabled: true, phase: 'success', version: 2,
      quotaAware: true, rowLevelDelta: true, mode: mode, runId: runId,
      durationMs: durationMs, deltaChangedRows: run.deltaChangedRows,
      deltaDeletedRows: run.deltaDeletedRows, estimatedRowWrites: run.estimatedRowWrites
    });

    return {
      success: true, atomic: true, version: 2, quotaAware: true, rowLevelDelta: true,
      mode: mode, runId: runId, syncedAt: at, durationMs: durationMs,
      sourceChanged: sourceChanged, fullRebaseDue: fullRebaseDue,
      deltaChangedRows: run.deltaChangedRows, deltaDeletedRows: run.deltaDeletedRows,
      estimatedRowWrites: run.estimatedRowWrites, result: result
    };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const quotaLimited = d1OrdersLiveSyncV2IsQuotaError_(message);
    const baseMismatch = message.indexOf('Delta base preflight failed') !== -1 ||
      message.indexOf('Delta growth is missing appended source rows') !== -1;
    if (quotaLimited) {
      props.setProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY, d1OrdersLiveSyncV2NextQuotaReset_());
    }
    if (baseMismatch) d1OrdersLiveSyncV2ClearBaseline_(props);

    const failure = {
      at: new Date().toISOString(), runId: runId, version: 2,
      quotaAware: true, rowLevelDelta: true, atomic: true,
      durationMs: Date.now() - startedMs, message: message,
      quotaLimited: quotaLimited,
      quotaPauseUntil: String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || ''),
      baselineCleared: baseMismatch
    };
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY, JSON.stringify(failure));
    d1OrdersLiveSyncV2SetAttempt_(props, Object.assign({
      at: attemptAt, completedAt: failure.at, enabled: true, phase: 'error'
    }, failure));
    Logger.log('D1 ORDERS LIVE SYNC V2 ERROR: ' + message);
    return Object.assign({ success: false }, failure);
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function startD1OrdersLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  const caps = d1OrdersLiveSyncV2Capabilities_();

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = trigger.getHandlerFunction();
    if (fn === 'd1OrdersLiveSyncTick' || fn === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN) ScriptApp.deleteTrigger(trigger);
  });

  props.setProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0');
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '1');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY);
  d1OrdersLiveSyncV2ClearBaseline_(props);

  const firstRun = d1OrdersLiveSyncTickV2();
  if (!firstRun.success) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
    d1OrdersLiveSyncV2RemoveTriggers_();
    throw new Error(firstRun.message || 'تعذر بدء مزامنة D1 V2.');
  }

  d1OrdersLiveSyncV2RemoveTriggers_();
  ScriptApp.newTrigger(D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN).timeBased().everyMinutes(1).create();

  return {
    success: true,
    version: 2,
    quotaAware: true,
    rowLevelDelta: true,
    atomic: true,
    capabilities: {
      atomicSupported: caps.atomicSupported === true,
      schemaMutationFree: caps.schemaMutationFree === true
    },
    firstRun: firstRun,
    message: 'تم تشغيل D1 Orders Live Sync V2: heartbeat عند عدم التغيير وrow-level delta عند التغيير.'
  };
}

function stopD1OrdersLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
  d1OrdersLiveSyncV2RemoveTriggers_();
  d1OrdersLiveSyncV2SetAttempt_(props, {
    at: new Date().toISOString(), enabled: false, phase: 'stopped', version: 2
  });
  return { success: true, version: 2, message: 'تم إيقاف D1 Orders Live Sync V2.' };
}

function getD1OrdersLiveSyncStatusV2() {
  const props = PropertiesService.getScriptProperties();
  const lastRun = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_RUN_KEY);
  const lastError = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
  const lastAttempt = d1OrdersLiveSyncV2JsonProp_(props, D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY);
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1';
  const triggers = ScriptApp.getProjectTriggers();
  const triggerCount = triggers.filter(function(t) { return t.getHandlerFunction() === D1_ORDERS_LIVE_SYNC_V2_TRIGGER_FN; }).length;
  const v1TriggerCount = triggers.filter(function(t) { return t.getHandlerFunction() === 'd1OrdersLiveSyncTick'; }).length;
  const lastRunMs = lastRun && lastRun.at ? Date.parse(String(lastRun.at)) : 0;
  const ageMs = lastRunMs ? Math.max(0, Date.now() - lastRunMs) : Number.MAX_SAFE_INTEGER;
  return {
    success: true,
    version: 2,
    quotaAware: true,
    rowLevelDelta: true,
    enabled: enabled,
    triggerCount: triggerCount,
    v1TriggerCount: v1TriggerCount,
    healthyConfiguration: enabled && triggerCount === 1 && v1TriggerCount === 0,
    lastRun: lastRun,
    lastAttempt: lastAttempt,
    lastError: lastError,
    baselinePresent: Number(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_BASELINE_COUNT_KEY) || '0') > 0,
    lastFullSyncAt: String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || ''),
    quotaPauseUntil: String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || ''),
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
