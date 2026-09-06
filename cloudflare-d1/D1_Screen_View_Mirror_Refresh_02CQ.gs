/* TrendOS PERF-CF-02CQ — bounded screen-view mirror refresh candidate.
 *
 * SAFETY / SCOPE:
 * - Candidate only. Default OFF via Script Property.
 * - Reads Google Sheets and copies ONLY the four department view tabs to D1.
 * - Reuses D1_Full_Migration.gs helpers so D1_API_URL and D1_MIGRATION_SECRET
 *   remain in Apps Script Script Properties and are never logged or committed.
 * - Uses atomic stage for every target, then ONE atomic promote for all four.
 * - Does not modify Google Sheets.
 * - Does not enable frontend D1 reads or change Sheets authority.
 * - Does not touch Cloud Write outbox/reconciliation gates.
 */

const D1_SCREEN_VIEW_REFRESH_02CQ_ENABLED_KEY = 'TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_ENABLED';
const D1_SCREEN_VIEW_REFRESH_02CQ_LAST_RESULT_KEY = 'TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_LAST_RESULT';
const D1_SCREEN_VIEW_REFRESH_02CQ_NOTE = 'PERF-CF-02CQ bounded screen view atomic refresh';
const D1_SCREEN_VIEW_REFRESH_02CQ_BATCH_ROWS = 80;
const D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS = Object.freeze([
  'واجهة خدمة العملاء',
  'واجهة الطباعة',
  'واجهة الليزر',
  'واجهة المكبس'
]);

function d1ScreenViewRefresh02CQEnabled_() {
  return String(
    PropertiesService.getScriptProperties().getProperty(D1_SCREEN_VIEW_REFRESH_02CQ_ENABLED_KEY) || ''
  ).trim() === '1';
}

function d1ScreenViewRefresh02CQRunId_() {
  const stamp = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd-HHmmss');
  return 'PERF-CF-02CQ-' + stamp + '-' + Utilities.getUuid().slice(0, 8);
}

function d1ScreenViewRefresh02CQSaveResult_(result) {
  const safe = result || {};
  PropertiesService.getScriptProperties().setProperty(
    D1_SCREEN_VIEW_REFRESH_02CQ_LAST_RESULT_KEY,
    JSON.stringify(safe)
  );
}

function d1ScreenViewRefresh02CQSourceStats_(ss) {
  return D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS.map(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('02CQ target sheet missing: ' + sheetName);
    return {
      sheetName: sheetName,
      sheetId: String(sheet.getSheetId()),
      lastRow: Number(sheet.getLastRow() || 0),
      lastCol: Number(sheet.getLastColumn() || 0)
    };
  });
}

function d1ScreenViewRefresh02CQStageOne_(runId, ss, source) {
  const sheet = ss.getSheetByName(source.sheetName);
  if (!sheet) throw new Error('02CQ target sheet missing during stage: ' + source.sheetName);

  const headers = d1FullHeaders_(sheet, source.lastRow, source.lastCol);
  let nextRow = 1;
  let firstBatch = true;

  if (source.lastRow < 1 || source.lastCol < 1) {
    throw new Error('02CQ target has no header grid: ' + source.sheetName);
  }

  while (nextRow <= source.lastRow) {
    const numRows = Math.min(
      D1_SCREEN_VIEW_REFRESH_02CQ_BATCH_ROWS,
      source.lastRow - nextRow + 1
    );
    const rows = d1FullBuildRows_(sheet, nextRow, numRows, source.lastCol);
    const final = (nextRow + numRows - 1) >= source.lastRow;

    const staged = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'stage',
      runId: runId,
      sheetName: source.sheetName,
      sheetId: source.sheetId,
      headers: headers,
      sourceLastRow: source.lastRow,
      sourceLastCol: source.lastCol,
      reset: firstBatch,
      final: final,
      rows: rows,
      note: D1_SCREEN_VIEW_REFRESH_02CQ_NOTE
    });

    if (!staged || staged.success !== true || staged.atomic !== true || staged.action !== 'stage') {
      throw new Error('02CQ atomic stage rejected: ' + source.sheetName);
    }

    firstBatch = false;
    nextRow += numRows;
  }

  return {
    sheetName: source.sheetName,
    sourceLastRow: source.lastRow,
    sourceLastCol: source.lastCol
  };
}

function d1ScreenViewRefresh02CQVerifyOne_(source) {
  const payload = d1FullGet_(
    '/v1/mirror/sheet?name=' + encodeURIComponent(source.sheetName) + '&limit=1&offset=0'
  );
  const sheet = payload && payload.sheet;
  if (!sheet) throw new Error('02CQ mirror verification missing: ' + source.sheetName);

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

  result.pass =
    result.d1SourceLastRow === result.googleLastRow &&
    result.d1SourceLastCol === result.googleLastCol &&
    result.d1RowCount === result.googleLastRow &&
    result.d1Status === 'ready' &&
    result.d1Note === D1_SCREEN_VIEW_REFRESH_02CQ_NOTE;

  return result;
}

function refreshD1ScreenViewMirrors02CQ() {
  if (!d1ScreenViewRefresh02CQEnabled_()) {
    return {
      success: false,
      enabled: false,
      mutated: false,
      checkpoint: 'PERF-CF-02CQ',
      message: '02CQ screen-view refresh is default-OFF. No D1 mutation performed.'
    };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return {
      success: false,
      enabled: true,
      mutated: false,
      checkpoint: 'PERF-CF-02CQ',
      message: '02CQ refresh already running.'
    };
  }

  let runId = '';
  try {
    // Reuse existing production-safe config. Secret value is never returned/logged.
    d1FullConfig_();
    d1FullGet_('/v1/mirror/stats');

    const ss = d1FullSpreadsheet_();
    const source = d1ScreenViewRefresh02CQSourceStats_(ss);
    const printSource = source.filter(function(x) { return x.sheetName === 'واجهة الطباعة'; })[0];

    // 02CQ must never promote another header-only print snapshot.
    if (!printSource || printSource.lastRow <= 1) {
      throw new Error('02CQ print source is header-only; promotion refused.');
    }

    runId = d1ScreenViewRefresh02CQRunId_();
    const staged = source.map(function(item) {
      return d1ScreenViewRefresh02CQStageOne_(runId, ss, item);
    });

    const promoted = d1FullPost_('/v1/import/sheet', {
      atomicAction: 'promote',
      runId: runId,
      sheetNames: D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS.slice()
    });

    if (!promoted || promoted.success !== true || promoted.atomic !== true || promoted.action !== 'promote') {
      throw new Error('02CQ atomic promote rejected.');
    }

    const verification = source.map(d1ScreenViewRefresh02CQVerifyOne_);
    const pass = verification.every(function(x) { return x.pass === true; });
    const print = verification.filter(function(x) { return x.sheetName === 'واجهة الطباعة'; })[0];

    if (!pass || !print || print.d1SourceLastRow <= 1) {
      throw new Error('02CQ post-promote mirror freshness verification failed.');
    }

    const result = {
      success: true,
      enabled: true,
      mutated: true,
      checkpoint: 'PERF-CF-02CQ',
      runId: runId,
      targetCount: D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS.length,
      staged: staged,
      verification: verification,
      checkedAt: new Date().toISOString(),
      message: '02CQ four-view mirror refresh and D1 catalog parity passed.'
    };
    d1ScreenViewRefresh02CQSaveResult_(result);
    return result;
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const result = {
      success: false,
      enabled: true,
      mutated: false,
      checkpoint: 'PERF-CF-02CQ',
      runId: runId,
      checkedAt: new Date().toISOString(),
      message: message
    };
    d1ScreenViewRefresh02CQSaveResult_(result);
    return result;
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function getD1ScreenViewMirrorRefresh02CQStatus() {
  const props = PropertiesService.getScriptProperties();
  let lastResult = null;
  try {
    lastResult = JSON.parse(props.getProperty(D1_SCREEN_VIEW_REFRESH_02CQ_LAST_RESULT_KEY) || 'null');
  } catch (err) {}
  return {
    success: true,
    checkpoint: 'PERF-CF-02CQ',
    enabled: d1ScreenViewRefresh02CQEnabled_(),
    targets: D1_SCREEN_VIEW_REFRESH_02CQ_TARGETS.slice(),
    lastResult: lastResult
  };
}
