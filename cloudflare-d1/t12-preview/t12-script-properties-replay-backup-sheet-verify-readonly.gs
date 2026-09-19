/**
 * TrendOS R2 — VERIFY EXISTING PRIVATE BACKUP + AUTHORITATIVE SHEET, READ ONLY.
 * DO NOT use this function for deletion; it writes/deletes no properties/files/rows.
 * Run in the original bound Apps Script Head. Do not Deploy.
 * Do not share backup file names/IDs/URLs, raw keys, customer details, or order IDs.
 * The original one-time backup helper creates a private JSON file in My Drive root.
 */
function trendosReplayBackupSheetVerifyReadOnly20260919() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var prefix = 'TRENDOS_R2_PRIVATE_REPLAY_BACKUP_20260919_';
    var keyPattern = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_([A-Za-z0-9_-]+)$/;
    var backupFiles = [];
    var iterator = DriveApp.getRootFolder().getFiles();
    while (iterator.hasNext()) {
      var f = iterator.next();
      var n = f.getName();
      if (n.indexOf(prefix) === 0 && /\.json$/.test(n)) backupFiles.push(f);
      if (backupFiles.length > 1) break;
    }
    if (backupFiles.length !== 1) {
      throw new Error('R2_VERIFY_ABORT_EXPECTED_EXACTLY_ONE_PRIVATE_BACKUP_IN_MY_DRIVE_ROOT; found=' + backupFiles.length + '; do not create another backup or delete any key');
    }
    var file = backupFiles[0];
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE ||
        file.getEditors().length !== 0 || file.getViewers().length !== 0) {
      throw new Error('R2_VERIFY_ABORT_BACKUP_ACCESS_NOT_PRIVATE; do not delete any key');
    }
    var content = file.getBlob().getDataAsString('UTF-8');
    var backup = JSON.parse(content);
    if (!backup || backup.format !== 'TRENDOS_R2_REPLAY_PRIVATE_BACKUP_V1' ||
        !Array.isArray(backup.records) || backup.records.length !== 150) {
      throw new Error('R2_VERIFY_ABORT_BACKUP_FORMAT_OR_COUNT; do not delete any key');
    }
    var now = Date.now();
    var oldAge = 7 * 24 * 60 * 60 * 1000;
    var properties = PropertiesService.getScriptProperties();
    var idToRecords = {};
    var duplicateKeys = 0;
    var invalidBackupRecords = 0;
    var currentReplayMissing = 0;
    var currentReplayValueMismatches = 0;
    var notCurrentlyOlderThanSevenDays = 0;
    var uniqueKeys = {};
    backup.records.forEach(function(rec) {
      if (!rec || typeof rec.key !== 'string' || typeof rec.value !== 'string') {
        invalidBackupRecords += 1; return;
      }
      var m = keyPattern.exec(rec.key);
      if (!m) { invalidBackupRecords += 1; return; }
      if (uniqueKeys[rec.key]) { duplicateKeys += 1; return; }
      uniqueKeys[rec.key] = true;
      var parsed;
      try { parsed = JSON.parse(rec.value); }
      catch (err) { invalidBackupRecords += 1; return; }
      var id = String(parsed && parsed.orderId || '').trim();
      var t = Number(m[1]);
      var savedTime = Date.parse(String(parsed && parsed.savedAt || ''));
      if (!parsed || parsed.success !== true || !id || !isFinite(savedTime)) {
        invalidBackupRecords += 1; return;
      }
      if (!isFinite(t) || t > now || savedTime > now ||
          now - t < oldAge || now - savedTime < oldAge) {
        notCurrentlyOlderThanSevenDays += 1;
      }
      var current = properties.getProperty(rec.key);
      if (current === null) currentReplayMissing += 1;
      else if (current !== rec.value) currentReplayValueMismatches += 1;
      idToRecords[id] = (idToRecords[id] || 0) + 1;
    });
    if (invalidBackupRecords || duplicateKeys) {
      throw new Error('R2_VERIFY_ABORT_MALFORMED_OR_DUPLICATE_BACKUP_RECORDS; no source mutation');
    }

    // Authoritative original workbook, as resolved by the deployed code's ss_().
    // Do not fetch all customer/order columns; read ONLY the order-ID column.
    var ss = ss_();
    var workbookName = ss.getName();
    if (workbookName !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY') {
      throw new Error('R2_VERIFY_ABORT_UNEXPECTED_AUTHORITATIVE_WORKBOOK; do not delete any key');
    }
    var sourceSheets = [
      {name: 'الأوردرات', group: 'summary'},
      {name: 'بنود الأوردرات', group: 'lines'},
      {name: 'أرشيف الأوردرات', group: 'summary'},
      {name: 'أرشيف بنود الأوردرات', group: 'lines'}
    ];
    var idSet = Object.create(null);
    Object.keys(idToRecords).forEach(function(id) {
      idSet[id] = {summary: false, lines: false};
    });
    var sheetStats = [];
    var requiredSourcesMissing = 0;
    sourceSheets.forEach(function(source, sourceIndex) {
      var sheet = ss.getSheetByName(source.name);
      if (!sheet) {
        // Main live tabs are mandatory; archive tabs may not exist.
        if (sourceIndex < 2) requiredSourcesMissing += 1;
        sheetStats.push({tab: sourceIndex, status: 'missing', rowsChecked: 0, targetMatches: 0});
        return;
      }
      var lastCol = sheet.getLastColumn();
      if (lastCol < 1) {
        if (sourceIndex < 2) requiredSourcesMissing += 1;
        sheetStats.push({tab: sourceIndex, status: 'empty_header', rowsChecked: 0, targetMatches: 0});
        return;
      }
      var header = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
      var col = -1;
      header.forEach(function(h, i) {
        var normalized = String(h || '').replace(/[\u200e\u200f\u200b]/g, '').trim().toLowerCase();
        if (normalized === 'رقم الأوردر' || normalized === 'order id' || normalized === 'رقم الطلب') col = i + 1;
      });
      if (col < 1) {
        if (sourceIndex < 2) requiredSourcesMissing += 1;
        sheetStats.push({tab: sourceIndex, status: 'order_id_header_missing', rowsChecked: 0, targetMatches: 0});
        return;
      }
      var count = Math.max(0, sheet.getLastRow() - 1);
      var values = count ? sheet.getRange(2, col, count, 1).getDisplayValues() : [];
      var sheetFound = Object.create(null);
      values.forEach(function(row) {
        var id = String(row[0] || '').trim();
        if (idSet[id]) {
          idSet[id][source.group] = true;
          sheetFound[id] = true;
        }
      });
      sheetStats.push({
        tab: sourceIndex, status: 'checked',
        rowsChecked: count, targetMatches: Object.keys(sheetFound).length
      });
    });
    var missingSummary = 0, missingLines = 0, missingBoth = 0;
    var summariesAndLinesFound = 0;
    Object.keys(idSet).forEach(function(id) {
      var ok = idSet[id];
      if (!ok.summary) missingSummary += 1;
      if (!ok.lines) missingLines += 1;
      if (!ok.summary && !ok.lines) missingBoth += 1;
      if (ok.summary && ok.lines) summariesAndLinesFound += 1;
    });
    var verified = !requiredSourcesMissing && !currentReplayMissing &&
      !currentReplayValueMismatches && !notCurrentlyOlderThanSevenDays &&
      !missingSummary && !missingLines && !missingBoth;
    var result = {
      audit: 'TRENDOS_R2_BACKUP_SHEET_VERIFY_READ_ONLY_20260919',
      mutationPerformed: false,
      backupExistsPrivateAndHas150Records: true,
      backedUpRecordCount: backup.records.length,
      uniqueBusinessOrderCount: Object.keys(idToRecords).length,
      currentReplayMissing: currentReplayMissing,
      currentReplayValueMismatches: currentReplayValueMismatches,
      notCurrentlyOlderThanSevenDays: notCurrentlyOlderThanSevenDays,
      requiredSourcesMissing: requiredSourcesMissing,
      missingSummary: missingSummary,
      missingLines: missingLines,
      missingBoth: missingBoth,
      summariesAndLinesFound: summariesAndLinesFound,
      sourceSheetChecks: sheetStats,
      backupAndSheetChecksPass: verified,
      deletionPerformed: false,
      deletionAuthorizedByThisReport: false,
      important: 'Verification only. Old clientRequestId retries can still duplicate orders. Do not delete replay properties on this result alone.'
    };
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}
