/* TrendOS normalized D1 live sync V1.
 *
 * PREPARED / NOT PRODUCTION DEPLOYED.
 *
 * Source of truth remains Google Sheets + Apps Script.
 * This worker-side mirror is for fast read paths only.
 *
 * Safety:
 * - reads source sheets only; never edits them;
 * - uses the protected /v1/import/batch endpoint;
 * - sends chunked upserts with one syncRunId;
 * - D1 freshness advances only on each entity's successful final chunk;
 * - Edge requires ALL normalized entities to be fresh, so a partial run fails closed;
 * - holds ScriptLock only briefly to acquire/release a lease, never during network I/O;
 * - stores presence/status only, never logs secret values.
 */

const D1_NORMALIZED_SYNC_ENABLED_KEY_V1 = 'D1_NORMALIZED_SYNC_ENABLED_V1';
const D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1 = 'D1_NORMALIZED_SYNC_LAST_ATTEMPT_V1';
const D1_NORMALIZED_SYNC_LAST_RUN_KEY_V1 = 'D1_NORMALIZED_SYNC_LAST_RUN_V1';
const D1_NORMALIZED_SYNC_LAST_ERROR_KEY_V1 = 'D1_NORMALIZED_SYNC_LAST_ERROR_V1';
const D1_NORMALIZED_SYNC_LAST_SKIP_KEY_V1 = 'D1_NORMALIZED_SYNC_LAST_SKIP_V1';
const D1_NORMALIZED_SYNC_CLAIM_KEY_V1 = 'D1_NORMALIZED_SYNC_CLAIM_V1';
const D1_NORMALIZED_SYNC_TRIGGER_FN_V1 = 'd1NormalizedLiveSyncTick';
const D1_NORMALIZED_SYNC_CHUNK_V1 = 100;
const D1_NORMALIZED_SYNC_CLAIM_TTL_MS_V1 = 4 * 60 * 1000;
const D1_NORMALIZED_SYNC_CLAIM_LOCK_WAIT_MS_V1 = 700;
const D1_NORMALIZED_SYNC_NOTE_V1 = 'TrendOS normalized live sync V1';
const D1_NORMALIZED_MESSAGES_SHEET_V1 = 'مدير العملاء - الرسائل';
const D1_NORMALIZED_CONVERSATIONS_SHEET_V1 = 'مدير العملاء - المحادثات';

function d1NormalizedJsonProp_(props, key) {
  try { return JSON.parse(props.getProperty(key) || 'null'); } catch (err) { return null; }
}

function d1NormalizedSetJson_(props, key, value) {
  props.setProperty(key, JSON.stringify(value || {}));
}

function d1NormalizedRemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_NORMALIZED_SYNC_TRIGGER_FN_V1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function d1NormalizedAcquireClaim_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_NORMALIZED_SYNC_CLAIM_LOCK_WAIT_MS_V1)) {
    return { ok: false, reason: 'claim-lock-unavailable' };
  }
  try {
    const props = PropertiesService.getScriptProperties();
    const current = d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_CLAIM_KEY_V1);
    const now = Date.now();
    if (current && Number(current.expiresAt || 0) > now && String(current.token || '')) {
      return {
        ok: false,
        reason: 'active-claim',
        activeSince: current.startedAt || '',
        expiresAt: Number(current.expiresAt || 0)
      };
    }
    const token = Utilities.getUuid();
    const claim = {
      token: token,
      startedAt: new Date(now).toISOString(),
      expiresAt: now + D1_NORMALIZED_SYNC_CLAIM_TTL_MS_V1
    };
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_CLAIM_KEY_V1, claim);
    return { ok: true, token: token, claim: claim };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function d1NormalizedReleaseClaim_(token) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_NORMALIZED_SYNC_CLAIM_LOCK_WAIT_MS_V1)) return false;
  try {
    const props = PropertiesService.getScriptProperties();
    const current = d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_CLAIM_KEY_V1);
    if (current && String(current.token || '') === String(token || '')) {
      props.deleteProperty(D1_NORMALIZED_SYNC_CLAIM_KEY_V1);
      return true;
    }
    return false;
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function d1NormalizedSheetObjectsReadOnly_(sheet) {
  if (!sheet) throw new Error('Required source sheet is missing.');
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0].map(function(value) { return String(value || '').trim(); });
  return values.slice(1).map(function(row) {
    const object = {};
    headers.forEach(function(header, index) {
      if (header) object[header] = row[index];
    });
    return object;
  }).filter(function(object) {
    return Object.keys(object).some(function(key) { return String(object[key] || '').trim() !== ''; });
  });
}

function d1NormalizedCustomersFromOrders_(orders) {
  const seen = {};
  const customers = [];
  (orders || []).forEach(function(row) {
    const phone = String(
      row['رقم الهاتف'] ||
      row['رقم العميل الأساسي'] ||
      row['هاتف العميل'] ||
      row['موبايل'] ||
      row['رقم الموبايل'] ||
      ''
    ).replace(/[^0-9]/g, '');
    if (!/^01[0125]\d{8}$/.test(phone) || seen[phone]) return;
    seen[phone] = true;
    customers.push({
      phone: phone,
      customerName: row['اسم الشات / المكتب'] || row['اسم العميل'] || row['العميل'] || '',
      customerCode: row['كود العميل'] || ''
    });
  });
  return customers;
}

function d1NormalizedSourceSnapshot_() {
  const spreadsheet = ss_();
  const ordersName = (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS)
    ? SHEET_NAME_ORDERS
    : 'الأوردرات';
  const ordersSheet = spreadsheet.getSheetByName(ordersName);
  const messagesSheet = spreadsheet.getSheetByName(D1_NORMALIZED_MESSAGES_SHEET_V1);
  const conversationsSheet = spreadsheet.getSheetByName(D1_NORMALIZED_CONVERSATIONS_SHEET_V1);

  // Read-only: intentionally do NOT call cmEnsureAll_(), insertSheet(), appendRow(), or setValues().
  if (!ordersSheet) throw new Error('شيت الأوردرات غير موجود.');
  if (!messagesSheet) throw new Error('شيت مدير العملاء - الرسائل غير موجود.');
  if (!conversationsSheet) throw new Error('شيت مدير العملاء - المحادثات غير موجود.');

  const orders = d1NormalizedSheetObjectsReadOnly_(ordersSheet);
  return {
    customers: d1NormalizedCustomersFromOrders_(orders),
    orders: orders,
    messages: d1NormalizedSheetObjectsReadOnly_(messagesSheet),
    conversations: d1NormalizedSheetObjectsReadOnly_(conversationsSheet)
  };
}

function d1NormalizedPost_(body) {
  // Reuses the existing protected migration helper and its Script Properties.
  return d1JsonFetch_('/v1/import/batch', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body)
  });
}

function d1NormalizedSyncEntity_(entity, rows, runId) {
  rows = Array.isArray(rows) ? rows : [];
  const total = rows.length;
  let imported = 0;
  let chunks = 0;

  if (!total) {
    const emptyBody = {
      syncRunId: runId,
      syncFinal: true,
      sourceRowCounts: {},
      note: D1_NORMALIZED_SYNC_NOTE_V1
    };
    emptyBody[entity] = [];
    emptyBody.sourceRowCounts[entity] = 0;
    const emptyResult = d1NormalizedPost_(emptyBody);
    if (!emptyResult || emptyResult.success !== true || !emptyResult.sync || emptyResult.sync.final !== true) {
      throw new Error('Normalized empty finalization failed for ' + entity);
    }
    return { entity: entity, sourceRows: 0, importedRows: 0, chunks: 1, final: true };
  }

  for (let start = 0; start < total; start += D1_NORMALIZED_SYNC_CHUNK_V1) {
    const chunk = rows.slice(start, start + D1_NORMALIZED_SYNC_CHUNK_V1);
    const final = start + chunk.length >= total;
    const body = {
      syncRunId: runId,
      syncFinal: final,
      sourceRowCounts: {},
      note: D1_NORMALIZED_SYNC_NOTE_V1
    };
    body[entity] = chunk;
    body.sourceRowCounts[entity] = total;

    const result = d1NormalizedPost_(body);
    const importedNow = Number(result && result.imported && result.imported[entity] || 0);
    imported += importedNow;
    chunks += 1;

    if (!result || result.success !== true || !result.sync || result.sync.final !== final) {
      throw new Error('Normalized chunk contract failed for ' + entity + ' at row ' + start);
    }
    if (!final && result.sync.freshnessAdvanced === true) {
      throw new Error('Freshness advanced before final chunk for ' + entity);
    }
    if (final && result.sync.freshnessAdvanced !== true) {
      throw new Error('Freshness did not advance on final chunk for ' + entity);
    }
  }

  return {
    entity: entity,
    sourceRows: total,
    importedRows: imported,
    chunks: chunks,
    final: true
  };
}

function d1NormalizedLiveSyncTick() {
  const props = PropertiesService.getScriptProperties();
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_NORMALIZED_SYNC_ENABLED_KEY_V1) || '') === '1';

  d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
    at: startedAt,
    enabled: enabled,
    phase: 'start'
  });

  if (!enabled) {
    const skipped = { at: startedAt, reason: 'disabled' };
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_SKIP_KEY_V1, skipped);
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
      at: startedAt,
      enabled: false,
      phase: 'skipped',
      reason: 'disabled',
      durationMs: Date.now() - startedMs
    });
    return { success: false, skipped: true, reason: 'disabled' };
  }

  const claim = d1NormalizedAcquireClaim_();
  if (!claim.ok) {
    const skipped = {
      at: startedAt,
      reason: claim.reason,
      activeSince: claim.activeSince || '',
      expiresAt: claim.expiresAt || 0
    };
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_SKIP_KEY_V1, skipped);
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
      at: startedAt,
      enabled: true,
      phase: 'skipped',
      reason: claim.reason,
      durationMs: Date.now() - startedMs
    });
    return { success: false, skipped: true, reason: claim.reason };
  }

  const runId = 'normalized-' + Date.now() + '-' + claim.token.slice(0, 8);
  try {
    const snapshot = d1NormalizedSourceSnapshot_();
    const entities = ['customers', 'orders', 'messages', 'conversations'];
    const results = [];

    entities.forEach(function(entity) {
      results.push(d1NormalizedSyncEntity_(entity, snapshot[entity], runId));
    });

    const completedAt = new Date().toISOString();
    const run = {
      at: completedAt,
      runId: runId,
      durationMs: Date.now() - startedMs,
      entities: results
    };
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_RUN_KEY_V1, run);
    props.deleteProperty(D1_NORMALIZED_SYNC_LAST_ERROR_KEY_V1);
    props.deleteProperty(D1_NORMALIZED_SYNC_LAST_SKIP_KEY_V1);
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
      at: startedAt,
      completedAt: completedAt,
      enabled: true,
      phase: 'success',
      runId: runId,
      durationMs: run.durationMs,
      entities: results
    });
    return { success: true, runId: runId, entities: results, durationMs: run.durationMs };
  } catch (err) {
    const failure = {
      at: new Date().toISOString(),
      runId: runId,
      durationMs: Date.now() - startedMs,
      message: String(err && err.message ? err.message : err)
    };
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ERROR_KEY_V1, failure);
    d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
      at: startedAt,
      completedAt: failure.at,
      enabled: true,
      phase: 'error',
      runId: runId,
      durationMs: failure.durationMs,
      message: failure.message
    });
    Logger.log('D1 NORMALIZED LIVE SYNC ERROR: ' + failure.message);
    return { success: false, runId: runId, message: failure.message, durationMs: failure.durationMs };
  } finally {
    d1NormalizedReleaseClaim_(claim.token);
  }
}

function startD1NormalizedLiveSync() {
  const props = PropertiesService.getScriptProperties();
  // Config check only; values are never logged.
  const cfg = d1MigrationConfig_();
  if (!cfg.apiUrl || !cfg.secret) throw new Error('D1 migration config is incomplete.');

  d1NormalizedRemoveTriggers_();
  props.setProperty(D1_NORMALIZED_SYNC_ENABLED_KEY_V1, '1');
  props.deleteProperty(D1_NORMALIZED_SYNC_LAST_ERROR_KEY_V1);

  const firstRun = d1NormalizedLiveSyncTick();
  if (!firstRun.success) {
    props.setProperty(D1_NORMALIZED_SYNC_ENABLED_KEY_V1, '0');
    d1NormalizedRemoveTriggers_();
    throw new Error(firstRun.message || firstRun.reason || 'Normalized D1 first sync failed.');
  }

  d1NormalizedRemoveTriggers_();
  ScriptApp.newTrigger(D1_NORMALIZED_SYNC_TRIGGER_FN_V1)
    .timeBased()
    .everyMinutes(1)
    .create();

  return {
    success: true,
    trigger: D1_NORMALIZED_SYNC_TRIGGER_FN_V1,
    everyMinutes: 1,
    firstRun: firstRun
  };
}

function stopD1NormalizedLiveSync() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_NORMALIZED_SYNC_ENABLED_KEY_V1, '0');
  d1NormalizedRemoveTriggers_();
  props.deleteProperty(D1_NORMALIZED_SYNC_CLAIM_KEY_V1);
  d1NormalizedSetJson_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1, {
    at: new Date().toISOString(),
    enabled: false,
    phase: 'stopped'
  });
  return { success: true };
}

function getD1NormalizedLiveSyncStatus() {
  const props = PropertiesService.getScriptProperties();
  const enabled = String(props.getProperty(D1_NORMALIZED_SYNC_ENABLED_KEY_V1) || '') === '1';
  const triggers = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === D1_NORMALIZED_SYNC_TRIGGER_FN_V1;
  });
  return {
    success: true,
    enabled: enabled,
    triggerCount: triggers.length,
    healthyConfiguration: enabled && triggers.length === 1,
    lastAttempt: d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_LAST_ATTEMPT_KEY_V1),
    lastRun: d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_LAST_RUN_KEY_V1),
    lastError: d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_LAST_ERROR_KEY_V1),
    lastSkip: d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_LAST_SKIP_KEY_V1),
    activeClaim: d1NormalizedJsonProp_(props, D1_NORMALIZED_SYNC_CLAIM_KEY_V1),
    config: {
      hasD1ApiUrl: !!String(props.getProperty('D1_API_URL') || '').trim(),
      hasD1MigrationSecret: !!String(props.getProperty('D1_MIGRATION_SECRET') || '').trim()
    }
  };
}
