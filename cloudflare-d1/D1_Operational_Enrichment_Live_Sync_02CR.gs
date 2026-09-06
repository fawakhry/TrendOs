/* TrendOS PERF-CF-02CR — quota-aware live sync for D1 enrichment support.
 *
 * DEFAULT OFF / NOT DEPLOYED BY COMMIT.
 * Exact scope only:
 *   - العملاء
 *   - عملاء منع التسليم بالمديونية
 *
 * The existing Orders Live Sync V2 remains the sole owner of:
 *   - الأوردرات
 *   - بنود الأوردرات
 *
 * Safety contract:
 * - Google Sheets / Apps Script remain authoritative.
 * - This module never writes to Google Sheets.
 * - It never touches Orders Live Sync V1/V2 properties or triggers.
 * - Unchanged support source => authenticated D1 metadata heartbeat only.
 * - Changed support source => row-level D1 delta only.
 * - Both support sheets advance atomically in one delta batch.
 * - First run / periodic repair => atomic two-sheet full rebase.
 * - D1 quota exhaustion pauses this support lane until the next UTC reset.
 * - No frontend flag, Worker deploy, generic drain, 02CL gate, or secret rotation.
 */

const D1_ENRICHMENT_02CR_ENABLED_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_SYNC_ENABLED';
const D1_ENRICHMENT_02CR_LAST_RUN_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_SYNC_LAST_RUN';
const D1_ENRICHMENT_02CR_LAST_ERROR_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_SYNC_LAST_ERROR';
const D1_ENRICHMENT_02CR_LAST_ATTEMPT_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_SYNC_LAST_ATTEMPT';
const D1_ENRICHMENT_02CR_LAST_FULL_SYNC_AT_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_LAST_FULL_SYNC_AT';
const D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_BASELINE_CHUNKS';
const D1_ENRICHMENT_02CR_BASELINE_PREFIX = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_BASELINE_';
const D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY = 'TRENDOS_PERF_CF_02CR_ENRICHMENT_QUOTA_PAUSE_UNTIL';
const D1_ENRICHMENT_02CR_TRIGGER_FN = 'd1OperationalEnrichmentLiveSyncTick02CR';
const D1_ENRICHMENT_02CR_NOTE = 'PERF-CF-02CR enrichment live sync V1';
const D1_ENRICHMENT_02CR_SPREADSHEET_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const D1_ENRICHMENT_02CR_BATCH_ROWS = 80;
const D1_ENRICHMENT_02CR_LOCK_WAIT_MS = 5000;
const D1_ENRICHMENT_02CR_FULL_REBASE_MS = 24 * 60 * 60 * 1000;
const D1_ENRICHMENT_02CR_FRESHNESS_TARGET_MS = 3 * 60 * 1000;
const D1_ENRICHMENT_02CR_BASELINE_CHUNK_SIZE = 7000;
const D1_ENRICHMENT_02CR_TARGETS = Object.freeze([
  'العملاء',
  'عملاء منع التسليم بالمديونية'
]);

function d1Enrichment02CRApiUrl_() {
  const url = String(PropertiesService.getScriptProperties().getProperty('D1_API_URL') || '').trim().replace(/\/+$/, '');
  if (!url) throw new Error('02CR D1_API_URL is missing from Script Properties.');
  return url;
}

function d1Enrichment02CRMigrationSecret_() {
  const secret = String(PropertiesService.getScriptProperties().getProperty('D1_MIGRATION_SECRET') || '').trim();
  if (!secret) throw new Error('02CR D1_MIGRATION_SECRET is missing from Script Properties.');
  return secret;
}

function d1Enrichment02CRSpreadsheet_() {
  const ss = SpreadsheetApp.openById(D1_ENRICHMENT_02CR_SPREADSHEET_ID);
  if (!ss || String(ss.getId()) !== D1_ENRICHMENT_02CR_SPREADSHEET_ID) throw new Error('02CR authoritative spreadsheet identity mismatch.');
  return ss;
}

function d1Enrichment02CRParse_(response, context) {
  const code = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); }
  catch (err) { throw new Error('02CR invalid D1 JSON for ' + context + ' HTTP ' + code + '.'); }
  if (code < 200 || code >= 300 || body.success !== true) {
    throw new Error(String(body.message || ('02CR D1 request failed for ' + context + ' HTTP ' + code)));
  }
  return body;
}

function d1Enrichment02CRGet_(path) {
  const response = UrlFetchApp.fetch(d1Enrichment02CRApiUrl_() + path, {
    method: 'get', muteHttpExceptions: true, followRedirects: true
  });
  return d1Enrichment02CRParse_(response, 'GET ' + path);
}

function d1Enrichment02CRPost_(path, payload) {
  const response = UrlFetchApp.fetch(d1Enrichment02CRApiUrl_() + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-migration-secret': d1Enrichment02CRMigrationSecret_() },
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
    followRedirects: true
  });
  return d1Enrichment02CRParse_(response, 'POST ' + path);
}

function d1Enrichment02CRSerialize_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value.toISOString();
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  return String(value);
}

function d1Enrichment02CRDigestHex_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function d1Enrichment02CRCaptureSheet_(sheet) {
  const sheetName = String(sheet.getName());
  const sheetId = String(sheet.getSheetId());
  const lastRow = Number(sheet.getLastRow() || 0);
  const lastCol = Number(sheet.getLastColumn() || 0);
  if (lastRow < 1 || lastCol < 1) throw new Error('02CR target has no header grid: ' + sheetName);
  const range = sheet.getRange(1, 1, lastRow, lastCol);
  const values = range.getValues();
  const display = range.getDisplayValues();
  const formulas = range.getFormulas();
  const headers = display[0].map(function(h) { return String(h || '').trim(); });
  const rows = values.map(function(row, i) {
    return {
      rowNumber: i + 1,
      values: row.map(d1Enrichment02CRSerialize_),
      display: display[i],
      formulas: formulas[i]
    };
  });
  const hash = d1Enrichment02CRDigestHex_(JSON.stringify({ sheetName:sheetName, sheetId:sheetId, sourceLastRow:lastRow, sourceLastCol:lastCol, headers:headers, rows:rows }));
  return { sheetName:sheetName, sheetId:sheetId, sourceLastRow:lastRow, sourceLastCol:lastCol, headers:headers, rows:rows, hash:hash };
}

function d1Enrichment02CRCaptureAll_() {
  const ss = d1Enrichment02CRSpreadsheet_();
  const snapshots = D1_ENRICHMENT_02CR_TARGETS.map(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error('02CR target sheet missing: ' + name);
    return d1Enrichment02CRCaptureSheet_(sheet);
  });
  const customer = snapshots.filter(function(x) { return x.sheetName === 'العملاء'; })[0];
  if (!customer || customer.sourceLastRow <= 1) throw new Error('02CR customers source is header-only; sync refused.');
  const fingerprint = d1Enrichment02CRDigestHex_(JSON.stringify(snapshots.map(function(s) {
    return { sheetName:s.sheetName, sourceLastRow:s.sourceLastRow, sourceLastCol:s.sourceLastCol, hash:s.hash };
  })));
  return { snapshots:snapshots, fingerprint:fingerprint };
}

function d1Enrichment02CRBuildBaseline_(capture) {
  return {
    version:1,
    savedAt:new Date().toISOString(),
    fingerprint:capture.fingerprint,
    sheets:capture.snapshots.map(function(snapshot) {
      return {
        sheetName:snapshot.sheetName,
        sourceLastRow:snapshot.sourceLastRow,
        sourceLastCol:snapshot.sourceLastCol,
        rowCount:snapshot.rows.length,
        hash:snapshot.hash,
        rowHashes:snapshot.rows.map(function(row) {
          return [row.rowNumber, d1Enrichment02CRDigestHex_(JSON.stringify(row))];
        })
      };
    })
  };
}

function d1Enrichment02CRSaveBaseline_(props, baseline) {
  const oldCount = Number(props.getProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY) || '0');
  const raw = JSON.stringify(baseline || {});
  const chunks = [];
  for (let i = 0; i < raw.length; i += D1_ENRICHMENT_02CR_BASELINE_CHUNK_SIZE) chunks.push(raw.slice(i, i + D1_ENRICHMENT_02CR_BASELINE_CHUNK_SIZE));
  chunks.forEach(function(chunk, index) { props.setProperty(D1_ENRICHMENT_02CR_BASELINE_PREFIX + index, chunk); });
  for (let i = chunks.length; i < oldCount; i += 1) props.deleteProperty(D1_ENRICHMENT_02CR_BASELINE_PREFIX + i);
  props.setProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY, String(chunks.length));
}

function d1Enrichment02CRLoadBaseline_(props) {
  const count = Number(props.getProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY) || '0');
  if (!count || count < 1 || count > 100) return null;
  let raw = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = props.getProperty(D1_ENRICHMENT_02CR_BASELINE_PREFIX + i);
    if (chunk == null) return null;
    raw += chunk;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === 1 ? parsed : null;
  } catch (err) { return null; }
}

function d1Enrichment02CRClearBaseline_(props) {
  const count = Number(props.getProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY) || '0');
  for (let i = 0; i < count; i += 1) props.deleteProperty(D1_ENRICHMENT_02CR_BASELINE_PREFIX + i);
  props.deleteProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY);
}

function d1Enrichment02CRCapabilities_() {
  const payload = d1Enrichment02CRGet_('/v1/mirror/capabilities');
  const caps = payload && payload.capabilities;
  if (!caps || caps.schemaMutationFree !== true || caps.atomicSupported !== true) throw new Error('02CR D1 atomic mirror capabilities are not ready.');
  return caps;
}

function d1Enrichment02CRStageSnapshot_(snapshot, runId) {
  let offset = 0;
  let first = true;
  let finalResult = null;
  while (offset < snapshot.rows.length) {
    const batch = snapshot.rows.slice(offset, offset + D1_ENRICHMENT_02CR_BATCH_ROWS);
    const final = offset + batch.length >= snapshot.rows.length;
    finalResult = d1Enrichment02CRPost_('/v1/import/sheet', {
      atomicAction:'stage', runId:runId, sheetName:snapshot.sheetName, sheetId:snapshot.sheetId,
      headers:snapshot.headers, sourceLastRow:snapshot.sourceLastRow, sourceLastCol:snapshot.sourceLastCol,
      reset:first, final:final, rows:batch, note:D1_ENRICHMENT_02CR_NOTE
    });
    if (!finalResult || finalResult.atomic !== true || finalResult.action !== 'stage') throw new Error('02CR atomic stage failed for ' + snapshot.sheetName + '.');
    first = false;
    offset += batch.length;
  }
  if (!finalResult || finalResult.final !== true || Number(finalResult.copiedRows || 0) !== snapshot.sourceLastRow) throw new Error('02CR final-stage parity failed for ' + snapshot.sheetName + '.');
  return { sheetName:snapshot.sheetName, copiedRows:snapshot.rows.length, sourceLastRow:snapshot.sourceLastRow, sourceLastCol:snapshot.sourceLastCol };
}

function d1Enrichment02CRFullSync_(capture, runId) {
  const staged = capture.snapshots.map(function(snapshot) { return d1Enrichment02CRStageSnapshot_(snapshot, runId); });
  const names = capture.snapshots.map(function(s) { return s.sheetName; });
  const promote = d1Enrichment02CRPost_('/v1/import/sheet', { atomicAction:'promote', runId:runId, sheetNames:names });
  if (!promote || promote.atomic !== true || promote.action !== 'promote') throw new Error('02CR atomic support promote failed closed.');
  return { staged:staged, promote:promote };
}

function d1Enrichment02CRHeartbeat_(capture) {
  const result = d1Enrichment02CRPost_('/v1/mirror/heartbeat', {
    sheets:capture.snapshots.map(function(s) {
      return { sheetName:s.sheetName, sourceLastRow:s.sourceLastRow, sourceLastCol:s.sourceLastCol, rowCount:s.rows.length, expectedNote:D1_ENRICHMENT_02CR_NOTE };
    })
  });
  if (!result || result.atomic !== true || result.action !== 'heartbeat') throw new Error('02CR support heartbeat failed closed.');
  return result;
}

function d1Enrichment02CRComputeDelta_(capture, baseline) {
  if (!baseline || baseline.version !== 1 || !Array.isArray(baseline.sheets)) return null;
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
    (old.rowHashes || []).forEach(function(pair) { if (Array.isArray(pair) && pair.length >= 2) oldHashes[String(pair[0])] = String(pair[1] || ''); });
    const rows = [];
    snapshot.rows.forEach(function(row) {
      const hash = d1Enrichment02CRDigestHex_(JSON.stringify(row));
      if (oldHashes[String(row.rowNumber)] !== hash) rows.push(row);
    });
    const deleted = Math.max(0, Number(old.rowCount || 0) - snapshot.sourceLastRow);
    changedRows += rows.length;
    deletedRows += deleted;
    sheets.push({
      sheetName:snapshot.sheetName, sheetId:snapshot.sheetId, headers:snapshot.headers,
      sourceLastRow:snapshot.sourceLastRow, sourceLastCol:snapshot.sourceLastCol,
      baseRowCount:Number(old.rowCount || 0), expectedNote:D1_ENRICHMENT_02CR_NOTE,
      note:D1_ENRICHMENT_02CR_NOTE, rows:rows
    });
  }
  return { sheets:sheets, changedRows:changedRows, deletedRows:deletedRows };
}

function d1Enrichment02CRDelta_(delta, runId) {
  const result = d1Enrichment02CRPost_('/v1/mirror/delta', { runId:runId, sheets:delta.sheets });
  if (!result || result.atomic !== true || result.action !== 'delta' || result.rowLevelDelta !== true) throw new Error('02CR row-level support delta failed closed.');
  return result;
}

function d1Enrichment02CRIsQuotaError_(message) {
  const m = String(message || '').toLowerCase();
  return m.indexOf('free tier daily row write limit') !== -1 || (m.indexOf('exceeded') !== -1 && m.indexOf('row write') !== -1 && m.indexOf('d1') !== -1);
}

function d1Enrichment02CRNextQuotaReset_() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 2, 0, 0)).toISOString();
}

function d1Enrichment02CRRunId_() {
  return 'PERF-CF-02CR-enrich-' + new Date().getTime() + '-' + Utilities.getUuid().slice(0, 8);
}

function d1OperationalEnrichmentLiveSyncTick02CR() {
  const props = PropertiesService.getScriptProperties();
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const enabled = String(props.getProperty(D1_ENRICHMENT_02CR_ENABLED_KEY) || '') === '1';
  if (!enabled) return { success:false, skipped:true, checkpoint:'PERF-CF-02CR', reason:'disabled' };

  const pauseUntil = String(props.getProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY) || '');
  const pauseMs = pauseUntil ? Date.parse(pauseUntil) : 0;
  if (pauseMs && Date.now() < pauseMs) return { success:false, skipped:true, checkpoint:'PERF-CF-02CR', reason:'quota-pause', quotaPauseUntil:pauseUntil };
  if (pauseMs && Date.now() >= pauseMs) props.deleteProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(D1_ENRICHMENT_02CR_LOCK_WAIT_MS)) return { success:false, skipped:true, checkpoint:'PERF-CF-02CR', reason:'script-lock-unavailable' };
  const runId = d1Enrichment02CRRunId_();
  try {
    d1Enrichment02CRCapabilities_();
    const capture = d1Enrichment02CRCaptureAll_();
    const baseline = d1Enrichment02CRLoadBaseline_(props);
    const lastFullMs = Date.parse(String(props.getProperty(D1_ENRICHMENT_02CR_LAST_FULL_SYNC_AT_KEY) || '')) || 0;
    const fullRebaseDue = !lastFullMs || Date.now() - lastFullMs >= D1_ENRICHMENT_02CR_FULL_REBASE_MS;
    const sourceChanged = !baseline || baseline.fingerprint !== capture.fingerprint;
    let mode = '';
    let result = null;
    let delta = null;

    if (!baseline || fullRebaseDue) {
      mode = 'full-rebase';
      result = d1Enrichment02CRFullSync_(capture, runId);
      props.setProperty(D1_ENRICHMENT_02CR_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());
    } else if (!sourceChanged) {
      mode = 'heartbeat';
      result = d1Enrichment02CRHeartbeat_(capture);
    } else {
      delta = d1Enrichment02CRComputeDelta_(capture, baseline);
      if (!delta) {
        mode = 'full-rebase';
        result = d1Enrichment02CRFullSync_(capture, runId);
        props.setProperty(D1_ENRICHMENT_02CR_LAST_FULL_SYNC_AT_KEY, new Date().toISOString());
      } else {
        mode = 'row-delta';
        result = d1Enrichment02CRDelta_(delta, runId);
      }
    }

    d1Enrichment02CRSaveBaseline_(props, d1Enrichment02CRBuildBaseline_(capture));
    props.deleteProperty(D1_ENRICHMENT_02CR_LAST_ERROR_KEY);
    const completedAt = new Date().toISOString();
    const run = {
      success:true, checkpoint:'PERF-CF-02CR', runId:runId, mode:mode,
      sourceChanged:sourceChanged, fullRebaseDue:fullRebaseDue,
      deltaChangedRows:delta ? delta.changedRows : 0,
      deltaDeletedRows:delta ? delta.deletedRows : 0,
      startedAt:startedAt, completedAt:completedAt, durationMs:Date.now() - startedMs,
      targets:D1_ENRICHMENT_02CR_TARGETS.slice()
    };
    props.setProperty(D1_ENRICHMENT_02CR_LAST_RUN_KEY, JSON.stringify(run));
    props.setProperty(D1_ENRICHMENT_02CR_LAST_ATTEMPT_KEY, JSON.stringify(run));
    return run;
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (d1Enrichment02CRIsQuotaError_(message)) props.setProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY, d1Enrichment02CRNextQuotaReset_());
    const failure = {
      success:false, checkpoint:'PERF-CF-02CR', runId:runId, startedAt:startedAt,
      completedAt:new Date().toISOString(), durationMs:Date.now() - startedMs,
      message:message, quotaPauseUntil:String(props.getProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY) || '')
    };
    props.setProperty(D1_ENRICHMENT_02CR_LAST_ERROR_KEY, JSON.stringify(failure));
    props.setProperty(D1_ENRICHMENT_02CR_LAST_ATTEMPT_KEY, JSON.stringify(failure));
    return failure;
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function d1Enrichment02CRRemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_ENRICHMENT_02CR_TRIGGER_FN) ScriptApp.deleteTrigger(trigger);
  });
}

function startD1OperationalEnrichmentLiveSync02CR() {
  const props = PropertiesService.getScriptProperties();
  d1Enrichment02CRCapabilities_();
  d1Enrichment02CRRemoveTriggers_();
  props.setProperty(D1_ENRICHMENT_02CR_ENABLED_KEY, '1');
  props.deleteProperty(D1_ENRICHMENT_02CR_LAST_ERROR_KEY);
  props.deleteProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY);
  d1Enrichment02CRClearBaseline_(props);
  const firstRun = d1OperationalEnrichmentLiveSyncTick02CR();
  if (!firstRun.success) {
    props.setProperty(D1_ENRICHMENT_02CR_ENABLED_KEY, '0');
    d1Enrichment02CRRemoveTriggers_();
    throw new Error(firstRun.message || '02CR enrichment initial sync failed.');
  }
  d1Enrichment02CRRemoveTriggers_();
  ScriptApp.newTrigger(D1_ENRICHMENT_02CR_TRIGGER_FN).timeBased().everyMinutes(1).create();
  return { success:true, checkpoint:'PERF-CF-02CR', quotaAware:true, rowLevelDelta:true, triggerInstalled:true, firstRun:firstRun };
}

function stopD1OperationalEnrichmentLiveSync02CR() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_ENRICHMENT_02CR_ENABLED_KEY, '0');
  d1Enrichment02CRRemoveTriggers_();
  return { success:true, checkpoint:'PERF-CF-02CR', enabled:false, triggerInstalled:false };
}

function getD1OperationalEnrichmentLiveSync02CRStatus() {
  const props = PropertiesService.getScriptProperties();
  const enabled = String(props.getProperty(D1_ENRICHMENT_02CR_ENABLED_KEY) || '') === '1';
  const triggers = ScriptApp.getProjectTriggers();
  const triggerCount = triggers.filter(function(t) { return t.getHandlerFunction() === D1_ENRICHMENT_02CR_TRIGGER_FN; }).length;
  let lastRun = null;
  let lastError = null;
  try { lastRun = JSON.parse(props.getProperty(D1_ENRICHMENT_02CR_LAST_RUN_KEY) || 'null'); } catch (err) {}
  try { lastError = JSON.parse(props.getProperty(D1_ENRICHMENT_02CR_LAST_ERROR_KEY) || 'null'); } catch (err) {}
  const lastRunMs = lastRun && lastRun.completedAt ? Date.parse(String(lastRun.completedAt)) : 0;
  const ageMs = lastRunMs ? Math.max(0, Date.now() - lastRunMs) : Number.MAX_SAFE_INTEGER;
  return {
    success:true, checkpoint:'PERF-CF-02CR', enabled:enabled, triggerCount:triggerCount,
    healthyConfiguration:enabled && triggerCount === 1,
    targets:D1_ENRICHMENT_02CR_TARGETS.slice(), note:D1_ENRICHMENT_02CR_NOTE,
    lastRun:lastRun, lastError:lastError,
    baselinePresent:Number(props.getProperty(D1_ENRICHMENT_02CR_BASELINE_COUNT_KEY) || '0') > 0,
    lastFullSyncAt:String(props.getProperty(D1_ENRICHMENT_02CR_LAST_FULL_SYNC_AT_KEY) || ''),
    quotaPauseUntil:String(props.getProperty(D1_ENRICHMENT_02CR_QUOTA_PAUSE_UNTIL_KEY) || ''),
    lastRunAgeSeconds:ageMs === Number.MAX_SAFE_INTEGER ? null : Math.round(ageMs / 1000),
    freshByTarget:ageMs <= D1_ENRICHMENT_02CR_FRESHNESS_TARGET_MS,
    config:{
      hasD1ApiUrl:!!String(props.getProperty('D1_API_URL') || '').trim(),
      hasD1MigrationSecret:!!String(props.getProperty('D1_MIGRATION_SECRET') || '').trim()
    }
  };
}
