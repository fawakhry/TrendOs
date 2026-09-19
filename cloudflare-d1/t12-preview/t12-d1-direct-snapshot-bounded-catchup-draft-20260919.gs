/**
 * TrendOS R4 draft — ONE-TIME, MANUAL, SOURCE-TO-D1 atomic delta.
 * NOT AUTHORIZED FOR LIVE EXECUTION. Leave the gate below false until
 * a separately reviewed owner approval and explicit revision of this file.
 * Original bound Apps Script Head only, no web-app Deploy, no triggers.
 *
 * Never run this to "test" production. Do NOT auto retry after a timeout.
 * No local V2 baseline, Script Properties or authoritative Sheet writes.
 * Nothing sensitive from snapshots / delta is returned or logged.
 */
function trendosD1DirectSnapshotBoundedCatchupDraft20260919() {
  // Compile/test-safe manual execution barrier; this draft performs NO read
  // or write if someone copies it prematurely into the original project.
  var LIVE_WRITE_AUTHORIZED = false;
  if (!LIVE_WRITE_AUTHORIZED) {
    var blocked = {
      audit: 'TRENDOS_D1_DIRECT_CATCHUP_DRAFT_20260919',
      mutationPerformed: false,
      liveExecutionBlocked: true,
      approvalRequired: true,
      note: 'Draft only. Do not change authorization gate until owner approves the exact one-shot write.'
    };
    Logger.log(JSON.stringify(blocked));
    return blocked;
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('R4_CATCHUP_ABORT_LOCK_NOT_AVAILABLE');
  var postAttempted = false, postConfirmed = false, postflightOk = false;
  var changedRows = 0, payloadBytes = 0, result = null;
  var maxRowsPerTab = 2500, maxChangedRows = 80;
  var maxGrowPerTab = 5, maxPayloadBytes = 250000, pageSize = 200;
  var names = ['الأوردرات', 'بنود الأوردرات'];
  function fail(code) { throw new Error(code); }
  function catalog() {
    var reply = d1FullGet_('/v1/mirror/sheets');
    if (!reply || reply.success !== true || !Array.isArray(reply.sheets)) {
      fail('R4_CATCHUP_ABORT_REMOTE_CATALOG_GET');
    }
    return reply.sheets;
  }
  function select(all, name) {
    var matches = all.filter(function(s){return s && s.sheetName === name;});
    if (matches.length !== 1) fail('R4_CATCHUP_ABORT_REMOTE_TAB_NOT_UNIQUE');
    return matches[0];
  }
  function tag(s) {
    return JSON.stringify([
      String(s.sheetId || ''), Number(s.rowCount),
      Number(s.sourceLastRow), Number(s.sourceLastCol),
      String(s.status || ''), String(s.syncedAt || ''), String(s.note || '')
    ]);
  }
  function readRemote(name, cat) {
    var rows = Object.create(null);
    var count = Number(cat.rowCount);
    for (var offset = 0; offset < count; offset += pageSize) {
      var response = d1FullGet_('/v1/mirror/sheet?name=' +
        encodeURIComponent(name) + '&limit=' + pageSize + '&offset=' + offset);
      var page = response && response.sheet;
      if (!response || response.success !== true || !page ||
          page.sheetName !== name || !Array.isArray(page.rows) ||
          tag(page) !== tag(cat) ||
          Number(page.offset) !== offset || Number(page.limit) !== pageSize ||
          page.rows.length !== Math.min(pageSize, count - offset)) {
        fail('R4_CATCHUP_ABORT_REMOTE_PAGE_OR_METADATA_UNSTABLE');
      }
      if (JSON.stringify(page.headers) !== JSON.stringify(cat.expectedSourceHeaders)) {
        fail('R4_CATCHUP_ABORT_HEADERS_MISMATCH');
      }
      page.rows.forEach(function(row, index) {
        var n = Number(row && row.rowNumber);
        if (!Number.isInteger(n) || n !== offset + index + 1 ||
            !Array.isArray(row.values) || !Array.isArray(row.display) ||
            !Array.isArray(row.formulas)) {
          fail('R4_CATCHUP_ABORT_REMOTE_ROW_SHAPE');
        }
        rows[String(n)] = {
          rowNumber: n, values: row.values,
          display: row.display, formulas: row.formulas
        };
      });
    }
    return rows;
  }
  try {
    var wb = d1FullSpreadsheet_();
    if (wb.getName() !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY') {
      fail('R4_CATCHUP_ABORT_WRONG_SOURCE_WORKBOOK');
    }
    var tracked = {
      d1OrdersLowUsageTickV1:true,
      d1OperationalEnrichmentLiveSyncTick02CR:true,
      d1OrdersLiveSyncTickV2:true,
      d1OrdersLiveSyncTick:true
    };
    if (ScriptApp.getProjectTriggers().some(function(t){
      return tracked[String(t.getHandlerFunction() || '')] === true;
    })) fail('R4_CATCHUP_ABORT_SYNC_TRIGGERS_ACTIVE');
    var source = d1OrdersLiveSyncV2CaptureAll_();
    if (!source || !Array.isArray(source.snapshots) ||
        source.snapshots.length !== 2 || !source.fingerprint) {
      fail('R4_CATCHUP_ABORT_SOURCE_CAPTURE_INVALID');
    }
    var remoteBefore = catalog(), deltaSheets = [], perTab = [];
    names.forEach(function(name, index) {
      var snap = source.snapshots[index], cat = select(remoteBefore,name);
      if (!snap || snap.sheetName !== name || !Array.isArray(snap.rows) ||
          snap.rows.length !== snap.sourceLastRow ||
          snap.rows.length < 1 || snap.rows.length > maxRowsPerTab ||
          !Number.isInteger(Number(cat.rowCount)) ||
          Number(cat.rowCount) < 1 ||
          Number(cat.rowCount) > maxRowsPerTab ||
          Number(cat.rowCount) !== Number(cat.sourceLastRow) ||
          String(cat.sheetId) !== String(snap.sheetId) ||
          Number(cat.sourceLastCol) !== Number(snap.sourceLastCol) ||
          cat.status !== 'ready' ||
          cat.note !== 'TrendOS orders live sync V2 quota-aware') {
        fail('R4_CATCHUP_ABORT_SOURCE_REMOTE_SHAPE_OR_NOTE');
      }
      var growth = snap.sourceLastRow - Number(cat.rowCount);
      if (growth < 0 || growth > maxGrowPerTab) {
        fail('R4_CATCHUP_ABORT_NEGATIVE_OR_EXCESSIVE_GROWTH');
      }
      cat.expectedSourceHeaders = snap.headers;
      var byNumber = readRemote(name, cat);
      var updates = [];
      snap.rows.forEach(function(row,index) {
        if (Number(row.rowNumber) !== index + 1) {
          fail('R4_CATCHUP_ABORT_SOURCE_ROWS_NOT_CONTIGUOUS');
        }
        var remoteRow = byNumber[String(row.rowNumber)];
        if (!remoteRow || JSON.stringify(row) !== JSON.stringify(remoteRow)) {
          updates.push(row);
        }
      });
      if (Object.keys(byNumber).length !== Number(cat.rowCount)) {
        fail('R4_CATCHUP_ABORT_REMOTE_ROW_COUNT_MISMATCH');
      }
      changedRows += updates.length;
      if (changedRows > maxChangedRows) {
        fail('R4_CATCHUP_ABORT_EXCESSIVE_CHANGED_ROWS');
      }
      perTab.push({
        tabIndex:index,sourceRows:snap.rows.length,
        mirrorRows:Number(cat.rowCount),changedOrNewRows:updates.length,
        appendedRows:growth
      });
      deltaSheets.push({
        sheetName:name,sheetId:snap.sheetId,headers:snap.headers,
        sourceLastRow:snap.sourceLastRow,sourceLastCol:snap.sourceLastCol,
        baseRowCount:Number(cat.rowCount),
        expectedNote:'TrendOS orders live sync V2 quota-aware',
        note:'TrendOS orders live sync V2 quota-aware',
        rows:updates
      });
    });
    var remoteAfter = catalog();
    if (!names.every(function(n) {
      return tag(select(remoteBefore,n)) === tag(select(remoteAfter,n));
    })) fail('R4_CATCHUP_ABORT_REMOTE_CATALOG_CHANGED_BEFORE_POST');
    var sourceAfter = d1OrdersLiveSyncV2CaptureAll_();
    if (!sourceAfter || sourceAfter.fingerprint !== source.fingerprint) {
      fail('R4_CATCHUP_ABORT_SOURCE_CHANGED_BEFORE_POST');
    }
    var payload = {runId:'manual-direct-catchup-'+Date.now()+'-'+
      Utilities.getUuid().slice(0,8),sheets:deltaSheets};
    payloadBytes = Utilities.newBlob(JSON.stringify(payload)).getBytes().length;
    if (payloadBytes > maxPayloadBytes) {
      fail('R4_CATCHUP_ABORT_PAYLOAD_TOO_LARGE');
    }
    if (changedRows === 0) {
      result = {
        audit:'TRENDOS_D1_DIRECT_CATCHUP_DRAFT_20260919',
        mutationPerformed:false,alreadyInParity:true,
        changedOrNewRows:0,perTab:perTab,
        localBaselineChanged:false,scheduledTriggersChanged:false,
        automaticRetryAllowed:false
      };
      Logger.log(JSON.stringify(result));
      return result;
    }
    // Exactly ONE cross-tab atomic D1 delta. If this call fails or times out,
    // actual D1 outcome is UNKNOWN; use read-only parity to reconcile.
    postAttempted = true;
    var reply = d1FullPost_('/v1/mirror/delta',payload);
    if (!reply || reply.success !== true || reply.atomic !== true ||
        reply.action !== 'delta' || reply.rowLevelDelta !== true ||
        Number(reply.changedRows) !== changedRows ||
        Number(reply.deletedRows) !== 0 ||
        Number(reply.catalogRowsTouched) !== 2) {
      fail('R4_CATCHUP_REMOTE_POST_UNEXPECTED_NO_RETRY');
    }
    postConfirmed = true;
    // Final source-vs-D1 check performed separately by existing audited
    // GET-only parity helper: no local baseline writes in this draft.
    result = {
      audit:'TRENDOS_D1_DIRECT_CATCHUP_DRAFT_20260919',
      mutationPerformed:true,remoteAtomicPostConfirmed:true,
      changedOrNewRows:changedRows,perTab:perTab,
      payloadBytes:payloadBytes,localBaselineChanged:false,
      scheduledTriggersChanged:false,postflightRowParityVerified:false,
      automaticRetryAllowed:false,
      note:'D1 write response only. Run fresh GET-only full source-vs-D1 row parity before considering any further action.'
    };
  } catch(e) {
    result = {
      audit:'TRENDOS_D1_DIRECT_CATCHUP_DRAFT_20260919',
      mutationPerformed:postAttempted,postAttempted:postAttempted,
      postConfirmed:postConfirmed,
      outcomeUnknown:postAttempted && !postConfirmed,
      automaticRetryAllowed:false,
      errorCode:postAttempted ? 'R4_CATCHUP_POST_OUTCOME_UNCERTAIN_NO_RETRY' :
        (/^R4_CATCHUP_[A-Z0-9_]+$/.test(String(e && e.message || '')) ?
         String(e.message) : 'R4_CATCHUP_ABORT_UNKNOWN_PREFLIGHT'),
      note:'Never retry after error or disconnect. Reconcile by GET-only source-vs-D1 parity. Original local baseline unchanged.'
    };
  } finally {
    lock.releaseLock();
  }
  Logger.log(JSON.stringify(result));
  return result;
}
