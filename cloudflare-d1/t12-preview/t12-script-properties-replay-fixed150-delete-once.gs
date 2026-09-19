/**
 * TrendOS R2 — ONE-TIME EMERGENCY DELETE, exact private-backup cohort only.
 * Owner explicitly accepted risk of replaying a >7-day-old client request
 * causing duplicate order creation. Run ONLY in original bound Apps Script
 * Head, NEVER as web-app deployment. Re-run is forbidden after timeout:
 * inspect Execution log and READ-ONLY property audit instead.
 *
 * This function DOES NOT select any new oldest records, create a backup,
 * add triggers, deploy, edit Sheets, or change D1 baseline/secrets/counters.
 * It only removes up to 150 exact key-value-matched V1908 replay properties
 * after re-verifying the existing PRIVATE backup and authoritative Sheet IDs.
 * Never share backup filename/ID/URL/raw contents, key names, or order IDs.
 */
function trendosReplayFixed150DeleteOnce20260919() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var attemptedDeletes = 0;
  var removed = 0;
  var postMissing = 0;
  var source = PropertiesService.getScriptProperties();
  var prefix = 'TRENDOS_R2_PRIVATE_REPLAY_BACKUP_20260919_';
  var keyPattern = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
  var result = {
    audit: 'TRENDOS_R2_FIXED150_DELETE_ONCE_20260919',
    success: false, executionStarted: true, complete: false,
    backedUpRecordCount: 0, uniqueOrderCount: 0,
    preflightAll150ExactMatch: false, authoritativeOrderParityPass: false,
    attemptedDeletes: 0, confirmedMissingAfterRun: 0,
    noNonReplayKeysTouched: true, noBackupChanged: true,
    retryAllowedAutomatically: false,
    note: 'Never retry after timeout/disconnect. Check fresh read-only quota audit and original Execution log.'
  };
  try {
    var matches = [];
    var it = DriveApp.getRootFolder().getFiles();
    while (it.hasNext()) {
      var file0 = it.next();
      var name0 = file0.getName();
      if (name0.indexOf(prefix) === 0 && /\.json$/.test(name0)) matches.push(file0);
      if (matches.length > 1) break;
    }
    if (matches.length !== 1) throw new Error('R2_DELETE_ABORT_BACKUP_COUNT_NOT_ONE');
    var file = matches[0];
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE ||
        file.getEditors().length !== 0 || file.getViewers().length !== 0) {
      throw new Error('R2_DELETE_ABORT_BACKUP_NOT_PRIVATE');
    }
    var backup = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
    if (!backup || backup.format !== 'TRENDOS_R2_REPLAY_PRIVATE_BACKUP_V1' ||
        !Array.isArray(backup.records) || backup.records.length !== 150) {
      throw new Error('R2_DELETE_ABORT_BACKUP_FORMAT');
    }
    result.backedUpRecordCount = 150;
    var now = Date.now(), sevenDays = 7 * 24 * 60 * 60 * 1000;
    var ids = Object.create(null), seen = Object.create(null), originals = [];
    backup.records.forEach(function(rec) {
      if (!rec || typeof rec.key !== 'string' || typeof rec.value !== 'string' ||
          !keyPattern.test(rec.key) || seen[rec.key]) {
        throw new Error('R2_DELETE_ABORT_BACKUP_KEY_INVALID_OR_DUPLICATE');
      }
      seen[rec.key] = true;
      var parsed;
      try { parsed = JSON.parse(rec.value); }
      catch (e) { throw new Error('R2_DELETE_ABORT_BACKUP_RESPONSE_INVALID'); }
      var id = String(parsed && parsed.orderId || '').trim();
      var keyMs = Number(keyPattern.exec(rec.key)[1]);
      var savedMs = Date.parse(String(parsed && parsed.savedAt || ''));
      if (!parsed || parsed.success !== true || !id ||
          !isFinite(keyMs) || keyMs > now || now - keyMs < sevenDays ||
          !isFinite(savedMs) || savedMs > now || now - savedMs < sevenDays) {
        throw new Error('R2_DELETE_ABORT_RESPONSE_OR_AGE_INVALID');
      }
      var current = source.getProperty(rec.key);
      if (current === null || current !== rec.value) {
        throw new Error('R2_DELETE_ABORT_CURRENT_REPLAY_MISSING_OR_CHANGED');
      }
      originals.push(rec);
      ids[id] = {summary:false, lines:false};
    });
    result.preflightAll150ExactMatch = originals.length === 150;
    result.uniqueOrderCount = Object.keys(ids).length;
    // Verify this backup is the previously vetted 150->119 cohort, not a new
    // selection or overwritten file, before any mutation.
    if (result.uniqueOrderCount !== 119) throw new Error('R2_DELETE_ABORT_COHORT_119_MISMATCH');
    var ss = ss_();
    if (ss.getName() !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY') {
      throw new Error('R2_DELETE_ABORT_WRONG_AUTHORITATIVE_WORKBOOK');
    }
    var tabs = [
      {name:'الأوردرات', group:'summary', mandatory:true},
      {name:'بنود الأوردرات', group:'lines', mandatory:true},
      {name:'أرشيف الأوردرات', group:'summary', mandatory:false},
      {name:'أرشيف بنود الأوردرات', group:'lines', mandatory:false}
    ];
    tabs.forEach(function(t) {
      var sheet = ss.getSheetByName(t.name);
      if (!sheet) {
        if (t.mandatory) throw new Error('R2_DELETE_ABORT_REQUIRED_SHEET_MISSING');
        return;
      }
      if (sheet.getLastColumn() < 1) throw new Error('R2_DELETE_ABORT_SHEET_HEADER_EMPTY');
      var h = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
      var col = -1;
      h.forEach(function(cell,i) {
        var label = String(cell||'').replace(/[\u200e\u200f\u200b]/g,'').trim().toLowerCase();
        if (label === 'رقم الأوردر' || label === 'order id' || label === 'رقم الطلب') col=i+1;
      });
      if (col < 1) throw new Error('R2_DELETE_ABORT_ORDER_ID_COLUMN_MISSING');
      var n = Math.max(0,sheet.getLastRow()-1);
      if (!n) return;
      sheet.getRange(2,col,n,1).getDisplayValues().forEach(function(row) {
        var id = String(row[0]||'').trim();
        if (Object.prototype.hasOwnProperty.call(ids,id)) ids[id][t.group] = true;
      });
    });
    var unmatched = Object.keys(ids).filter(function(id) {
      return !ids[id].summary || !ids[id].lines;
    }).length;
    if (unmatched) throw new Error('R2_DELETE_ABORT_AUTHORITATIVE_ORDER_PARITY');
    result.authoritativeOrderParityPass = true;

    // Final exact-value preflight under the SAME createOrder Script Lock.
    originals.forEach(function(rec) {
      if (source.getProperty(rec.key) !== rec.value) {
        throw new Error('R2_DELETE_ABORT_FINAL_SOURCE_MISMATCH');
      }
    });
    // Only the 150 enumerated, exact-match keys can reach this mutation path.
    originals.forEach(function(rec) {
      attemptedDeletes += 1;
      source.deleteProperty(rec.key);
      removed += 1;
    });
    originals.forEach(function(rec) {
      if (source.getProperty(rec.key) === null) postMissing += 1;
    });
    result.attemptedDeletes = attemptedDeletes;
    result.confirmedMissingAfterRun = postMissing;
    result.complete = (attemptedDeletes === 150 && postMissing === 150);
    result.success = result.complete;
    if (!result.complete) result.errorCode='R2_DELETE_INCOMPLETE_CHECK_AUDIT_NO_RETRY';
  } catch (err) {
    result.errorCode = String(err && err.message || 'R2_DELETE_UNKNOWN_ERROR')
      .replace(/[^A-Za-z0-9_]/g,'').slice(0,110);
    // Counts in this report describe attempts, not proof of actual deletion.
    result.attemptedDeletes = attemptedDeletes;
    if (attemptedDeletes > 0) result.errorCode='R2_DELETE_PARTIAL_OR_UNCERTAIN_CHECK_AUDIT_NO_RETRY';
  } finally {
    lock.releaseLock();
  }
  Logger.log(JSON.stringify(result));
  return result;
}
