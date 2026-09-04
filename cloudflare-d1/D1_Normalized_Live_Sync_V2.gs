/* TrendOS normalized D1 live sync V2 — quota-aware delta upsert.
 *
 * PREPARED / NOT PRODUCTION DEPLOYED.
 *
 * Source of truth remains Google Sheets + Apps Script.
 * Safety / quota contract:
 * - source sheets are read-only;
 * - unchanged source => one final request with empty entity arrays, advancing
 *   freshness with only migration_run writes;
 * - changed source => upsert only changed/new normalized records;
 * - first run and periodic daily rebase => full upsert snapshot;
 * - no delete/prune semantics are introduced here; this preserves V1 behavior;
 * - freshness advances for all 4 entities together on one successful final batch;
 * - partial non-final upserts never advance freshness;
 * - D1 free-tier quota exhaustion backs off locally until the next UTC reset;
 * - V1 and V2 triggers never run together after V2 activation.
 */

const D1_NORMALIZED_SYNC_V2_ENABLED_KEY = 'D1_NORMALIZED_SYNC_V2_ENABLED';
const D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT_KEY = 'D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT';
const D1_NORMALIZED_SYNC_V2_LAST_RUN_KEY = 'D1_NORMALIZED_SYNC_V2_LAST_RUN';
const D1_NORMALIZED_SYNC_V2_LAST_ERROR_KEY = 'D1_NORMALIZED_SYNC_V2_LAST_ERROR';
const D1_NORMALIZED_SYNC_V2_CLAIM_KEY = 'D1_NORMALIZED_SYNC_V2_CLAIM';
const D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY = 'D1_NORMALIZED_SYNC_V2_BASELINE_CHUNKS';
const D1_NORMALIZED_SYNC_V2_BASELINE_PREFIX = 'D1_NORMALIZED_SYNC_V2_BASELINE_';
const D1_NORMALIZED_SYNC_V2_LAST_FULL_SYNC_AT_KEY = 'D1_NORMALIZED_SYNC_V2_LAST_FULL_SYNC_AT';
const D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY = 'D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL';
const D1_NORMALIZED_SYNC_V2_TRIGGER_FN = 'd1NormalizedLiveSyncTickV2';
const D1_NORMALIZED_SYNC_V2_CHUNK = 100;
const D1_NORMALIZED_SYNC_V2_CLAIM_TTL_MS = 4 * 60 * 1000;
const D1_NORMALIZED_SYNC_V2_CLAIM_LOCK_WAIT_MS = 700;
const D1_NORMALIZED_SYNC_V2_FULL_REBASE_MS = 24 * 60 * 60 * 1000;
const D1_NORMALIZED_SYNC_V2_BASELINE_CHUNK_SIZE = 7000;
const D1_NORMALIZED_SYNC_V2_NOTE = 'TrendOS normalized live sync V2 quota-aware';
const D1_NORMALIZED_MESSAGES_SHEET_V2 = 'مدير العملاء - الرسائل';
const D1_NORMALIZED_CONVERSATIONS_SHEET_V2 = 'مدير العملاء - المحادثات';
const D1_NORMALIZED_ENTITIES_V2 = ['customers', 'orders', 'messages', 'conversations'];

function d1NormalizedV2JsonProp_(props, key) {
  try { return JSON.parse(props.getProperty(key) || 'null'); } catch (err) { return null; }
}

function d1NormalizedV2SetJson_(props, key, value) {
  props.setProperty(key, JSON.stringify(value || {}));
}

function d1NormalizedV2RemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_NORMALIZED_SYNC_V2_TRIGGER_FN) ScriptApp.deleteTrigger(trigger);
  });
}

function d1NormalizedV2DigestHex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function d1NormalizedV2CleanPhone_(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.indexOf('0020') === 0) digits = digits.slice(2);
  if (digits.indexOf('20') === 0 && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}

function d1NormalizedV2AcquireClaim_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_NORMALIZED_SYNC_V2_CLAIM_LOCK_WAIT_MS)) {
    return { ok: false, reason: 'claim-lock-unavailable' };
  }
  try {
    const props = PropertiesService.getScriptProperties();
    const current = d1NormalizedV2JsonProp_(props, D1_NORMALIZED_SYNC_V2_CLAIM_KEY);
    const now = Date.now();
    if (current && Number(current.expiresAt || 0) > now && String(current.token || '')) {
      return { ok: false, reason: 'active-claim', expiresAt: Number(current.expiresAt || 0) };
    }
    const token = Utilities.getUuid();
    const claim = { token: token, startedAt: new Date(now).toISOString(), expiresAt: now + D1_NORMALIZED_SYNC_V2_CLAIM_TTL_MS };
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_CLAIM_KEY, claim);
    return { ok: true, token: token };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function d1NormalizedV2ReleaseClaim_(token) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_NORMALIZED_SYNC_V2_CLAIM_LOCK_WAIT_MS)) return false;
  try {
    const props = PropertiesService.getScriptProperties();
    const current = d1NormalizedV2JsonProp_(props, D1_NORMALIZED_SYNC_V2_CLAIM_KEY);
    if (current && String(current.token || '') === String(token || '')) {
      props.deleteProperty(D1_NORMALIZED_SYNC_V2_CLAIM_KEY);
      return true;
    }
    return false;
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function d1NormalizedV2SheetObjectsReadOnly_(sheet) {
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

function d1NormalizedV2CustomersFromOrders_(orders) {
  const seen = {};
  const customers = [];
  (orders || []).forEach(function(row) {
    const phone = d1NormalizedV2CleanPhone_(
      row['رقم الهاتف'] || row['رقم العميل الأساسي'] || row['هاتف العميل'] ||
      row['موبايل'] || row['رقم الموبايل'] || ''
    );
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

function d1NormalizedV2SourceSnapshot_() {
  const spreadsheet = ss_();
  const ordersName = (typeof SHEET_NAME_ORDERS !== 'undefined' && SHEET_NAME_ORDERS) ? SHEET_NAME_ORDERS : 'الأوردرات';
  const ordersSheet = spreadsheet.getSheetByName(ordersName);
  const messagesSheet = spreadsheet.getSheetByName(D1_NORMALIZED_MESSAGES_SHEET_V2);
  const conversationsSheet = spreadsheet.getSheetByName(D1_NORMALIZED_CONVERSATIONS_SHEET_V2);
  if (!ordersSheet) throw new Error('شيت الأوردرات غير موجود.');
  if (!messagesSheet) throw new Error('شيت مدير العملاء - الرسائل غير موجود.');
  if (!conversationsSheet) throw new Error('شيت مدير العملاء - المحادثات غير موجود.');

  const orders = d1NormalizedV2SheetObjectsReadOnly_(ordersSheet);
  return {
    customers: d1NormalizedV2CustomersFromOrders_(orders),
    orders: orders,
    messages: d1NormalizedV2SheetObjectsReadOnly_(messagesSheet),
    conversations: d1NormalizedV2SheetObjectsReadOnly_(conversationsSheet)
  };
}

function d1NormalizedV2Key_(entity, row) {
  if (entity === 'customers') return d1NormalizedV2CleanPhone_(row.phone || row.customerPhone || row['الهاتف']);
  if (entity === 'orders') return String(row.orderId || row.order_id || row['رقم الأوردر'] || '').trim();
  if (entity === 'messages') return String(row.id || row.ID || '').trim();
  if (entity === 'conversations') return d1NormalizedV2CleanPhone_(row.phone || row['الهاتف']);
  return '';
}

function d1NormalizedV2Capture_() {
  const source = d1NormalizedV2SourceSnapshot_();
  const entities = {};
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    const rows = Array.isArray(source[entity]) ? source[entity] : [];
    const seen = {};
    rows.forEach(function(row) {
      const key = d1NormalizedV2Key_(entity, row);
      if (!key) throw new Error('Normalized V2 source row missing key for ' + entity);
      if (seen[key]) throw new Error('Normalized V2 duplicate source key for ' + entity + ': ' + key);
      seen[key] = true;
    });
    entities[entity] = {
      entity: entity,
      rows: rows,
      sourceRows: rows.length,
      hash: d1NormalizedV2DigestHex_(JSON.stringify(rows))
    };
  });
  const fingerprint = d1NormalizedV2DigestHex_(JSON.stringify(D1_NORMALIZED_ENTITIES_V2.map(function(entity) {
    return { entity: entity, sourceRows: entities[entity].sourceRows, hash: entities[entity].hash };
  })));
  return { entities: entities, fingerprint: fingerprint };
}

function d1NormalizedV2BuildBaseline_(capture) {
  const entities = {};
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    const snapshot = capture.entities[entity];
    entities[entity] = {
      sourceRows: snapshot.sourceRows,
      hash: snapshot.hash,
      rowHashes: snapshot.rows.map(function(row) {
        return [d1NormalizedV2Key_(entity, row), d1NormalizedV2DigestHex_(JSON.stringify(row))];
      })
    };
  });
  return { version: 2, savedAt: new Date().toISOString(), fingerprint: capture.fingerprint, entities: entities };
}

function d1NormalizedV2SaveBaseline_(props, baseline) {
  const oldCount = Number(props.getProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  const raw = JSON.stringify(baseline || {});
  const chunks = [];
  for (let i = 0; i < raw.length; i += D1_NORMALIZED_SYNC_V2_BASELINE_CHUNK_SIZE) {
    chunks.push(raw.slice(i, i + D1_NORMALIZED_SYNC_V2_BASELINE_CHUNK_SIZE));
  }
  chunks.forEach(function(chunk, index) {
    props.setProperty(D1_NORMALIZED_SYNC_V2_BASELINE_PREFIX + index, chunk);
  });
  for (let i = chunks.length; i < oldCount; i += 1) props.deleteProperty(D1_NORMALIZED_SYNC_V2_BASELINE_PREFIX + i);
  props.setProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY, String(chunks.length));
}

function d1NormalizedV2LoadBaseline_(props) {
  const count = Number(props.getProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  if (!count || count < 1 || count > 100) return null;
  let raw = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = props.getProperty(D1_NORMALIZED_SYNC_V2_BASELINE_PREFIX + i);
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

function d1NormalizedV2ClearBaseline_(props) {
  const count = Number(props.getProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY) || '0');
  for (let i = 0; i < count; i += 1) props.deleteProperty(D1_NORMALIZED_SYNC_V2_BASELINE_PREFIX + i);
  props.deleteProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY);
}

function d1NormalizedV2ComputePlan_(capture, baseline, full) {
  const changed = {};
  let changedRows = 0;
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    const snapshot = capture.entities[entity];
    if (full || !baseline || !baseline.entities || !baseline.entities[entity]) {
      changed[entity] = snapshot.rows.slice();
      changedRows += changed[entity].length;
      return;
    }
    const old = baseline.entities[entity];
    if (old.hash === snapshot.hash && Number(old.sourceRows || 0) === snapshot.sourceRows) {
      changed[entity] = [];
      return;
    }
    const oldHashes = {};
    (old.rowHashes || []).forEach(function(pair) {
      if (Array.isArray(pair) && pair.length >= 2) oldHashes[String(pair[0])] = String(pair[1] || '');
    });
    changed[entity] = snapshot.rows.filter(function(row) {
      const key = d1NormalizedV2Key_(entity, row);
      const hash = d1NormalizedV2DigestHex_(JSON.stringify(row));
      return oldHashes[key] !== hash;
    });
    changedRows += changed[entity].length;
  });
  return { changed: changed, changedRows: changedRows };
}

function d1NormalizedV2Post_(body) {
  return d1JsonFetch_('/v1/import/batch', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body)
  });
}

function d1NormalizedV2SendPlan_(capture, plan, runId) {
  const remaining = {};
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    remaining[entity] = (plan.changed[entity] || []).slice();
  });

  let nonFinalChunks = 0;
  let nonFinalRows = 0;
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    while (remaining[entity].length > D1_NORMALIZED_SYNC_V2_CHUNK) {
      const chunk = remaining[entity].splice(0, D1_NORMALIZED_SYNC_V2_CHUNK);
      const body = {
        syncRunId: runId,
        syncFinal: false,
        sourceRowCounts: {},
        note: D1_NORMALIZED_SYNC_V2_NOTE
      };
      body[entity] = chunk;
      body.sourceRowCounts[entity] = capture.entities[entity].sourceRows;
      const result = d1NormalizedV2Post_(body);
      if (!result || result.success !== true || !result.sync || result.sync.final !== false || result.sync.freshnessAdvanced === true) {
        throw new Error('Normalized V2 non-final chunk failed for ' + entity);
      }
      nonFinalChunks += 1;
      nonFinalRows += chunk.length;
    }
  });

  const finalBody = {
    syncRunId: runId,
    syncFinal: true,
    sourceRowCounts: {},
    note: D1_NORMALIZED_SYNC_V2_NOTE
  };
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    finalBody[entity] = remaining[entity];
    finalBody.sourceRowCounts[entity] = capture.entities[entity].sourceRows;
  });

  const finalResult = d1NormalizedV2Post_(finalBody);
  if (!finalResult || finalResult.success !== true || !finalResult.sync ||
      finalResult.sync.final !== true || finalResult.sync.freshnessAdvanced !== true) {
    throw new Error('Normalized V2 final freshness batch failed.');
  }
  const completed = finalResult.sync.completedEntities || [];
  D1_NORMALIZED_ENTITIES_V2.forEach(function(entity) {
    if (completed.indexOf(entity) === -1) throw new Error('Normalized V2 final batch omitted entity: ' + entity);
  });

  const finalRows = D1_NORMALIZED_ENTITIES_V2.reduce(function(sum, entity) {
    return sum + remaining[entity].length;
  }, 0);
  return {
    nonFinalChunks: nonFinalChunks,
    nonFinalRows: nonFinalRows,
    finalRows: finalRows,
    changedRows: plan.changedRows,
    freshnessRows: D1_NORMALIZED_ENTITIES_V2.length,
    estimatedRowWrites: plan.changedRows + D1_NORMALIZED_ENTITIES_V2.length,
    final: finalResult
  };
}

function d1NormalizedV2IsQuotaError_(message) {
  const m = String(message || '').toLowerCase();
  return m.indexOf('free tier daily row write limit') !== -1 ||
    (m.indexOf('exceeded') !== -1 && m.indexOf('row write') !== -1 && m.indexOf('d1') !== -1);
}

function d1NormalizedV2NextQuotaReset_() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 2, 0, 0)).toISOString();
}

function d1NormalizedLiveSyncTickV2() {
  const props = PropertiesService.getScriptProperties();
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_NORMALIZED_SYNC_V2_ENABLED_KEY) || '') === '1';
  if (!enabled) return { success: false, skipped: true, reason: 'disabled', version: 2 };

  const pauseUntil = String(props.getProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || '');
  const pauseMs = pauseUntil ? Date.parse(pauseUntil) : 0;
  if (pauseMs && Date.now() < pauseMs) {
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT_KEY, {
      at: startedAt, enabled: true, phase: 'skipped', reason: 'd1-quota-backoff', quotaPauseUntil: pauseUntil
    });
    return { success: false, skipped: true, reason: 'd1-quota-backoff', quotaPauseUntil: pauseUntil, version: 2 };
  }
  if (pauseMs && Date.now() >= pauseMs) props.deleteProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY);

  const claim = d1NormalizedV2AcquireClaim_();
  if (!claim.ok) return { success: false, skipped: true, reason: claim.reason, version: 2 };

  const runId = 'normalized-v2-' + Date.now() + '-' + claim.token.slice(0, 8);
  try {
    const capture = d1NormalizedV2Capture_();
    const baseline = d1NormalizedV2LoadBaseline_(props);
    const lastFullAt = String(props.getProperty(D1_NORMALIZED_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || '');
    const lastFullMs = lastFullAt ? Date.parse(lastFullAt) : 0;
    const fullDue = !baseline || !lastFullMs || (Date.now() - lastFullMs) >= D1_NORMALIZED_SYNC_V2_FULL_REBASE_MS;
    const sourceChanged = !baseline || baseline.fingerprint !== capture.fingerprint;
    const mode = fullDue ? 'full-upsert' : (sourceChanged ? 'delta-upsert' : 'heartbeat');
    const plan = d1NormalizedV2ComputePlan_(capture, baseline, fullDue);
    const result = d1NormalizedV2SendPlan_(capture, plan, runId);

    if (mode !== 'heartbeat') d1NormalizedV2SaveBaseline_(props, d1NormalizedV2BuildBaseline_(capture));
    if (fullDue) props.setProperty(D1_NORMALIZED_SYNC_V2_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());

    const completedAt = new Date().toISOString();
    const run = {
      at: completedAt,
      runId: runId,
      version: 2,
      quotaAware: true,
      deltaUpsert: true,
      deletePrune: false,
      mode: mode,
      sourceChanged: sourceChanged,
      durationMs: Date.now() - startedMs,
      changedRows: result.changedRows,
      estimatedRowWrites: result.estimatedRowWrites,
      sourceRows: D1_NORMALIZED_ENTITIES_V2.reduce(function(out, entity) {
        out[entity] = capture.entities[entity].sourceRows;
        return out;
      }, {}),
      result: result
    };
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_LAST_RUN_KEY, run);
    props.deleteProperty(D1_NORMALIZED_SYNC_V2_LAST_ERROR_KEY);
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT_KEY, {
      at: startedAt, completedAt: completedAt, enabled: true, phase: 'success',
      runId: runId, version: 2, mode: mode, changedRows: result.changedRows,
      estimatedRowWrites: result.estimatedRowWrites, durationMs: run.durationMs
    });
    return { success: true, runId: runId, version: 2, mode: mode, changedRows: result.changedRows, estimatedRowWrites: result.estimatedRowWrites };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const quotaLimited = d1NormalizedV2IsQuotaError_(message);
    if (quotaLimited) props.setProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY, d1NormalizedV2NextQuotaReset_());
    const failure = {
      at: new Date().toISOString(), runId: runId, version: 2,
      durationMs: Date.now() - startedMs, message: message,
      quotaLimited: quotaLimited,
      quotaPauseUntil: String(props.getProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || '')
    };
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_LAST_ERROR_KEY, failure);
    d1NormalizedV2SetJson_(props, D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT_KEY, Object.assign({
      at: startedAt, completedAt: failure.at, enabled: true, phase: 'error'
    }, failure));
    Logger.log('D1 NORMALIZED LIVE SYNC V2 ERROR: ' + message);
    return Object.assign({ success: false }, failure);
  } finally {
    d1NormalizedV2ReleaseClaim_(claim.token);
  }
}

function startD1NormalizedLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  const cfg = d1MigrationConfig_();
  if (!cfg.apiUrl || !cfg.secret) throw new Error('D1 migration config is incomplete.');

  // Do not allow V1 and V2 normalized triggers to coexist.
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = trigger.getHandlerFunction();
    if (fn === 'd1NormalizedLiveSyncTick' || fn === D1_NORMALIZED_SYNC_V2_TRIGGER_FN) ScriptApp.deleteTrigger(trigger);
  });
  props.setProperty('D1_NORMALIZED_SYNC_ENABLED_V1', '0');
  props.setProperty(D1_NORMALIZED_SYNC_V2_ENABLED_KEY, '1');
  props.deleteProperty(D1_NORMALIZED_SYNC_V2_LAST_ERROR_KEY);
  props.deleteProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY);
  d1NormalizedV2ClearBaseline_(props);

  const firstRun = d1NormalizedLiveSyncTickV2();
  if (!firstRun.success) {
    props.setProperty(D1_NORMALIZED_SYNC_V2_ENABLED_KEY, '0');
    d1NormalizedV2RemoveTriggers_();
    throw new Error(firstRun.message || firstRun.reason || 'Normalized D1 V2 first sync failed.');
  }

  d1NormalizedV2RemoveTriggers_();
  ScriptApp.newTrigger(D1_NORMALIZED_SYNC_V2_TRIGGER_FN).timeBased().everyMinutes(1).create();
  return { success: true, version: 2, quotaAware: true, deltaUpsert: true, firstRun: firstRun };
}

function stopD1NormalizedLiveSyncV2() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_NORMALIZED_SYNC_V2_ENABLED_KEY, '0');
  d1NormalizedV2RemoveTriggers_();
  props.deleteProperty(D1_NORMALIZED_SYNC_V2_CLAIM_KEY);
  return { success: true, version: 2, message: 'تم إيقاف normalized D1 live sync V2.' };
}

function getD1NormalizedLiveSyncStatusV2() {
  const props = PropertiesService.getScriptProperties();
  const triggers = ScriptApp.getProjectTriggers();
  const v2TriggerCount = triggers.filter(function(t) { return t.getHandlerFunction() === D1_NORMALIZED_SYNC_V2_TRIGGER_FN; }).length;
  const v1TriggerCount = triggers.filter(function(t) { return t.getHandlerFunction() === 'd1NormalizedLiveSyncTick'; }).length;
  return {
    success: true,
    version: 2,
    quotaAware: true,
    deltaUpsert: true,
    deletePrune: false,
    enabled: String(props.getProperty(D1_NORMALIZED_SYNC_V2_ENABLED_KEY) || '') === '1',
    triggerCount: v2TriggerCount,
    v1TriggerCount: v1TriggerCount,
    baselinePresent: Number(props.getProperty(D1_NORMALIZED_SYNC_V2_BASELINE_COUNT_KEY) || '0') > 0,
    lastFullSyncAt: String(props.getProperty(D1_NORMALIZED_SYNC_V2_LAST_FULL_SYNC_AT_KEY) || ''),
    quotaPauseUntil: String(props.getProperty(D1_NORMALIZED_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY) || ''),
    lastRun: d1NormalizedV2JsonProp_(props, D1_NORMALIZED_SYNC_V2_LAST_RUN_KEY),
    lastAttempt: d1NormalizedV2JsonProp_(props, D1_NORMALIZED_SYNC_V2_LAST_ATTEMPT_KEY),
    lastError: d1NormalizedV2JsonProp_(props, D1_NORMALIZED_SYNC_V2_LAST_ERROR_KEY),
    config: {
      hasD1ApiUrl: !!String(props.getProperty('D1_API_URL') || '').trim(),
      hasD1MigrationSecret: !!String(props.getProperty('D1_MIGRATION_SECRET') || '').trim()
    }
  };
}

function testD1NormalizedLiveSyncV2() {
  const result = d1NormalizedLiveSyncTickV2();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
