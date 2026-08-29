/* TrendOS -> Cloudflare D1 full Google Sheets mirror migration
 *
 * Safe design:
 * - Reads D1_API_URL and D1_MIGRATION_SECRET from Script Properties.
 * - Never logs or hard-codes the secret.
 * - Copies every sheet dynamically; no hard-coded tab list.
 * - Preserves row numbers, raw values, displayed values, and formulas.
 * - Resumable via Script Properties and a 1-minute time trigger.
 * - Google Sheets remains untouched; this is copy-only.
 */

const D1_FULL_MIGRATION_STATE_KEY_V1 = 'D1_FULL_MIGRATION_STATE_V1';
const D1_FULL_MIGRATION_ERROR_KEY_V1 = 'D1_FULL_MIGRATION_LAST_ERROR_V1';
const D1_FULL_MIGRATION_TRIGGER_FN_V1 = 'd1FullMigrationTick';
const D1_FULL_MIGRATION_BATCH_ROWS_V1 = 80;
const D1_FULL_MIGRATION_BUDGET_MS_V1 = 4 * 60 * 1000;

function d1FullConfig_() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = String(props.getProperty('D1_API_URL') || '').trim().replace(/\/+$/, '');
  const secret = String(props.getProperty('D1_MIGRATION_SECRET') || '').trim();
  if (!apiUrl) throw new Error('D1_API_URL غير موجود في Script Properties.');
  if (!secret) throw new Error('D1_MIGRATION_SECRET غير موجود في Script Properties.');
  return { props: props, apiUrl: apiUrl, secret: secret };
}

function d1FullSpreadsheet_() {
  try {
    if (typeof ss_ === 'function') return ss_();
  } catch (err) {}

  const props = PropertiesService.getScriptProperties();
  const id = String(props.getProperty('TRENDOS_SPREADSHEET_ID') || '').trim();
  if (id) return SpreadsheetApp.openById(id);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('لا يمكن فتح ملف TrendOS Google Sheets.');
  return ss;
}

function d1FullSerializeCell_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  return String(value);
}

function d1FullPost_(path, payload) {
  const cfg = d1FullConfig_();
  const response = UrlFetchApp.fetch(cfg.apiUrl + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-migration-secret': cfg.secret },
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const text = response.getContentText() || '{}';
  let data = {};
  try { data = JSON.parse(text); } catch (err) {
    throw new Error('D1 رجّع رد غير صالح HTTP ' + code + '.');
  }

  if (code < 200 || code >= 300 || !data.success) {
    throw new Error(String(data.message || ('D1 HTTP ' + code)));
  }
  return data;
}

function d1FullGet_(path) {
  const cfg = d1FullConfig_();
  const response = UrlFetchApp.fetch(cfg.apiUrl + path, {
    method: 'get',
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  const text = response.getContentText() || '{}';
  let data = {};
  try { data = JSON.parse(text); } catch (err) {
    throw new Error('D1 رجّع رد غير صالح HTTP ' + code + '.');
  }
  if (code < 200 || code >= 300 || !data.success) {
    throw new Error(String(data.message || ('D1 HTTP ' + code)));
  }
  return data;
}

function d1FullRemoveTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === D1_FULL_MIGRATION_TRIGGER_FN_V1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function d1FullSaveState_(state) {
  PropertiesService.getScriptProperties().setProperty(
    D1_FULL_MIGRATION_STATE_KEY_V1,
    JSON.stringify(state || {})
  );
}

function d1FullLoadState_() {
  const raw = PropertiesService.getScriptProperties().getProperty(D1_FULL_MIGRATION_STATE_KEY_V1);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (err) { return null; }
}

function d1FullHeaders_(sheet, lastRow, lastCol) {
  if (lastRow < 1 || lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
}

function d1FullBuildRows_(sheet, startRow, numRows, lastCol) {
  if (numRows <= 0 || lastCol <= 0) return [];
  const range = sheet.getRange(startRow, 1, numRows, lastCol);
  const values = range.getValues();
  const display = range.getDisplayValues();
  const formulas = range.getFormulas();
  const rows = [];

  for (let r = 0; r < numRows; r++) {
    rows.push({
      rowNumber: startRow + r,
      values: values[r].map(d1FullSerializeCell_),
      display: display[r],
      formulas: formulas[r]
    });
  }
  return rows;
}

function startD1FullMigration() {
  const cfg = d1FullConfig_();
  const ss = d1FullSpreadsheet_();
  const sheets = ss.getSheets();

  // Verify the new Worker mirror route before scheduling anything.
  d1FullGet_('/v1/mirror/stats');

  d1FullRemoveTriggers_();
  cfg.props.deleteProperty(D1_FULL_MIGRATION_ERROR_KEY_V1);

  const state = {
    version: 1,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    totalSheets: sheets.length,
    sheetIndex: 0,
    nextRow: 1,
    resetSent: false,
    copiedRows: 0,
    completedSheets: 0,
    status: 'running',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finishedAt: ''
  };
  d1FullSaveState_(state);

  ScriptApp.newTrigger(D1_FULL_MIGRATION_TRIGGER_FN_V1)
    .timeBased()
    .everyMinutes(1)
    .create();

  return {
    success: true,
    message: 'بدأ ترحيل كل شيتات TrendOS إلى D1 تلقائيًا.',
    totalSheets: sheets.length,
    state: state
  };
}

function d1FullMigrationTick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { success: false, skipped: true, message: 'Migration tick already running.' };

  try {
    const started = Date.now();
    const cfg = d1FullConfig_();
    const ss = d1FullSpreadsheet_();
    const sheets = ss.getSheets();
    let state = d1FullLoadState_();

    if (!state || state.status !== 'running') {
      d1FullRemoveTriggers_();
      return { success: false, message: 'لا يوجد ترحيل D1 نشط.' };
    }

    while (state.sheetIndex < sheets.length && (Date.now() - started) < D1_FULL_MIGRATION_BUDGET_MS_V1) {
      const sheet = sheets[state.sheetIndex];
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
          note: 'TrendOS full mirror V1'
        });

        state.sheetIndex++;
        state.completedSheets++;
        state.nextRow = 1;
        state.resetSent = false;
        state.updatedAt = new Date().toISOString();
        d1FullSaveState_(state);
        continue;
      }

      const startRow = Math.max(1, Number(state.nextRow || 1));
      const numRows = Math.min(
        D1_FULL_MIGRATION_BATCH_ROWS_V1,
        lastRow - startRow + 1
      );

      if (numRows <= 0) {
        state.sheetIndex++;
        state.completedSheets++;
        state.nextRow = 1;
        state.resetSent = false;
        state.updatedAt = new Date().toISOString();
        d1FullSaveState_(state);
        continue;
      }

      const rows = d1FullBuildRows_(sheet, startRow, numRows, lastCol);
      const final = (startRow + numRows - 1) >= lastRow;
      const reset = state.resetSent !== true;

      d1FullPost_('/v1/import/sheet', {
        sheetName: sheetName,
        sheetId: sheetId,
        headers: headers,
        sourceLastRow: lastRow,
        sourceLastCol: lastCol,
        reset: reset,
        final: final,
        rows: rows,
        note: 'TrendOS full mirror V1'
      });

      state.resetSent = true;
      state.nextRow = startRow + numRows;
      state.copiedRows = Number(state.copiedRows || 0) + rows.length;
      state.updatedAt = new Date().toISOString();

      if (final) {
        state.sheetIndex++;
        state.completedSheets++;
        state.nextRow = 1;
        state.resetSent = false;
      }

      d1FullSaveState_(state);
    }

    if (state.sheetIndex >= sheets.length) {
      state.status = 'completed';
      state.finishedAt = new Date().toISOString();
      state.updatedAt = state.finishedAt;
      d1FullSaveState_(state);
      cfg.props.deleteProperty(D1_FULL_MIGRATION_ERROR_KEY_V1);
      d1FullRemoveTriggers_();
      return {
        success: true,
        completed: true,
        state: state,
        mirror: d1FullGet_('/v1/mirror/stats')
      };
    }

    return { success: true, completed: false, state: state };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    PropertiesService.getScriptProperties().setProperty(
      D1_FULL_MIGRATION_ERROR_KEY_V1,
      JSON.stringify({ at: new Date().toISOString(), message: message })
    );
    Logger.log('D1 FULL MIGRATION ERROR: ' + message);
    return { success: false, message: message, state: d1FullLoadState_() };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function getD1FullMigrationStatus() {
  const props = PropertiesService.getScriptProperties();
  const state = d1FullLoadState_();
  let lastError = null;
  try {
    lastError = JSON.parse(props.getProperty(D1_FULL_MIGRATION_ERROR_KEY_V1) || 'null');
  } catch (err) {}

  let mirror = null;
  try { mirror = d1FullGet_('/v1/mirror/stats'); } catch (err) {
    mirror = { success: false, message: String(err && err.message ? err.message : err) };
  }

  return {
    success: true,
    state: state,
    lastError: lastError,
    mirror: mirror
  };
}

function stopD1FullMigration() {
  d1FullRemoveTriggers_();
  const state = d1FullLoadState_() || {};
  state.status = 'stopped';
  state.updatedAt = new Date().toISOString();
  d1FullSaveState_(state);
  return { success: true, message: 'تم إيقاف ترحيل D1.', state: state };
}
