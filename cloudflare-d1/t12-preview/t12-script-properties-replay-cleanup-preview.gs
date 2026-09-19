/**
 * TrendOS R2 PREVIEW ONLY / 2026-09-19.
 * Reads Script Properties in the original confirmed Apps Script project.
 * No delete, no writes, no copying of keys, customer data, or secret values
 * to logs, GitHub, Sheets, Drive, or network destinations.
 *
 * Reports candidates for a later SEPARATELY APPROVED bounded cleanup.
 */
function trendosReplayCleanupPreviewReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  var newerThan48HoursMs = 48 * 60 * 60 * 1000;
  var keyPattern = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
  var eligible = [];
  var skipped = {
    tooRecent: 0, malformedKey: 0, corruptResponse: 0,
    responseNotSuccess: 0, missingBusinessOrderId: 0,
    savedAtMissingInvalidOrRecent: 0, keyTimestampInFuture: 0
  };
  var candidatesSeen = 0;
  var totalReplayCount = 0;
  var totalReplayBytesApprox = 0;
  function utf8Bytes(value) {
    return Utilities.newBlob(String(value == null ? '' : value)).getBytes().length;
  }
  props.getKeys().forEach(function(key) {
    var name = String(key || '');
    if (name.indexOf('TRENDOS_CREATE_ORDER_V1908_') !== 0) return;
    totalReplayCount += 1;
    var raw = props.getProperty(name);
    totalReplayBytesApprox += utf8Bytes(name) + utf8Bytes(raw);
    var match = keyPattern.exec(name);
    if (!match) { skipped.malformedKey += 1; return; }
    var requestTime = Number(match[1]);
    if (!isFinite(requestTime) || requestTime > now) {
      skipped.keyTimestampInFuture += 1; return;
    }
    // Keep the newest 48 hours under ALL circumstances; use a 7-day threshold.
    if (now - requestTime < newerThan48HoursMs || now - requestTime < sevenDaysMs) {
      skipped.tooRecent += 1; return;
    }
    candidatesSeen += 1;
    var parsed;
    try { parsed = JSON.parse(raw || ''); }
    catch (err) { skipped.corruptResponse += 1; return; }
    if (!parsed || parsed.success !== true) {
      skipped.responseNotSuccess += 1; return;
    }
    if (!String(parsed.orderId || '').trim()) {
      skipped.missingBusinessOrderId += 1; return;
    }
    var savedAt = Date.parse(String(parsed.savedAt || ''));
    if (!isFinite(savedAt) || savedAt > now || now - savedAt < sevenDaysMs) {
      skipped.savedAtMissingInvalidOrRecent += 1; return;
    }
    eligible.push({ time: requestTime, bytesApprox: utf8Bytes(name) + utf8Bytes(raw) });
  });
  eligible.sort(function(a, b) { return a.time - b.time; });
  var previewBatch = eligible.slice(0, 150);
  var result = {
    audit: 'TRENDOS_REPLAY_CLEANUP_PREVIEW_ONLY_20260919',
    mutationPerformed: false,
    pendingOwnerApprovalForDeletion: true,
    totalReplayCount: totalReplayCount,
    totalReplayBytesApprox: totalReplayBytesApprox,
    eligibleOver7DaysWithSuccessSavedAtAndOrderId: eligible.length,
    oldestFirstProposedBatchCount: previewBatch.length,
    proposedBatchBytesApprox: previewBatch.reduce(function(n, item) { return n + item.bytesApprox; }, 0),
    skipped: skipped,
    important: 'Preview only. Removing replay keys weakens duplicate protection for old requests; backup/reconciliation and explicit approval required before deleting any property.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
