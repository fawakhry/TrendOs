/**
 * TrendOS R4: READ-ONLY authoritative Sheets vs live Cloudflare D1 mirror rows.
 * For owner to run manually in the confirmed original bound Apps Script Head,
 * WITHOUT deploying or re-enabling any synchronization triggers.
 *
 * Calls only existing d1FullGet_ GET endpoints: mirror/sheets and mirror/sheet.
 * Mirror row values may contain sensitive customer/order data; NEVER print
 * remote responses, source rows, order IDs, keys, hashes or URL/secret.
 * Emits aggregate counts and stable-snapshot checks only.
 * Matching rows at a single instant does not guarantee future freshness.
 */
function trendosD1RowsParityReadOnly20260919() {
  var workbook = d1FullSpreadsheet_();
  if (workbook.getName() !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY') {
    throw new Error('R4_ABORT_WRONG_AUTHORITATIVE_WORKBOOK');
  }
  var names = ['الأوردرات', 'بنود الأوردرات'];
  var sourceBefore = d1OrdersLiveSyncV2CaptureAll_();
  if (!sourceBefore || !Array.isArray(sourceBefore.snapshots) ||
      sourceBefore.snapshots.length !== 2 || !sourceBefore.fingerprint) {
    throw new Error('R4_ABORT_SOURCE_CAPTURE_UNAVAILABLE');
  }
  function catalog() {
    var response = d1FullGet_('/v1/mirror/sheets');
    if (!response || response.success !== true || !Array.isArray(response.sheets)) {
      throw new Error('R4_ABORT_REMOTE_CATALOG_UNAVAILABLE');
    }
    return response.sheets;
  }
  function selectSheet(all, name) {
    var found = all.filter(function(s){ return s && s.sheetName === name; });
    if (found.length !== 1) throw new Error('R4_ABORT_REMOTE_SHEET_MISSING_OR_DUPLICATE');
    return found[0];
  }
  function catalogFingerprint(sheet) {
    return JSON.stringify([
      String(sheet.sheetId || ''),
      Number(sheet.rowCount), Number(sheet.sourceLastRow),
      Number(sheet.sourceLastCol), String(sheet.status || ''),
      String(sheet.syncedAt || '')
    ]);
  }
  function safeRowShape(row) {
    if (!row || !Number.isInteger(Number(row.rowNumber)) ||
        !Array.isArray(row.values) || !Array.isArray(row.display) ||
        !Array.isArray(row.formulas)) {
      throw new Error('R4_ABORT_REMOTE_ROW_INVALID');
    }
    return {
      rowNumber: Number(row.rowNumber),
      values: row.values, display: row.display, formulas: row.formulas
    };
  }
  var remoteCatalogBefore = catalog();
  var output = [];
  for (var tab = 0; tab < names.length; tab += 1) {
    var name = names[tab];
    var sourceSheet = sourceBefore.snapshots[tab];
    if (!sourceSheet || sourceSheet.sheetName !== name ||
        !Array.isArray(sourceSheet.rows)) {
      throw new Error('R4_ABORT_SOURCE_SHEET_MISMATCH');
    }
    var remoteSheet = selectSheet(remoteCatalogBefore, name);
    var count = Number(remoteSheet.rowCount);
    if (!Number.isInteger(count) || count < 0 || count > 5000 ||
        remoteSheet.status !== 'ready') {
      throw new Error('R4_ABORT_REMOTE_CATALOG_UNSAFE_OR_TOO_LARGE');
    }
    var remoteRows = Object.create(null);
    var remoteRowsSeen = 0;
    var duplicateRemoteRows = 0;
    var pageSize = 250;
    var firstPageHeadersMatch = null;
    var allPagesMetadataMatch = true;
    for (var offset = 0; offset < count; offset += pageSize) {
      var page = d1FullGet_('/v1/mirror/sheet?name=' +
        encodeURIComponent(name) + '&limit=' + pageSize + '&offset=' + offset);
      var sheet = page && page.sheet;
      if (!page || page.success !== true || !sheet ||
          sheet.sheetName !== name || !Array.isArray(sheet.rows)) {
        throw new Error('R4_ABORT_REMOTE_PAGE_UNAVAILABLE');
      }
      if (firstPageHeadersMatch === null) {
        firstPageHeadersMatch =
          JSON.stringify(sheet.headers) === JSON.stringify(sourceSheet.headers);
      }
      if (catalogFingerprint(sheet) !== catalogFingerprint(remoteSheet) ||
          Number(sheet.offset) !== offset || Number(sheet.limit) !== pageSize) {
        allPagesMetadataMatch = false;
      }
      if (!sheet.rows.length || sheet.rows.length > pageSize ||
          sheet.rows.length !== Math.min(pageSize, count - offset)) {
        throw new Error('R4_ABORT_REMOTE_PAGE_COUNT_INCONSISTENT');
      }
      sheet.rows.forEach(function(row) {
        var shaped = safeRowShape(row);
        var key = String(shaped.rowNumber);
        if (Object.prototype.hasOwnProperty.call(remoteRows, key)) {
          duplicateRemoteRows++;
        } else {
          remoteRows[key] = shaped;
          remoteRowsSeen++;
        }
      });
    }
    var sourceNumbers = Object.create(null);
    var missingInMirror = 0;
    var changedContent = 0;
    sourceSheet.rows.forEach(function(row) {
      var number = String(row.rowNumber);
      sourceNumbers[number] = true;
      if (!Object.prototype.hasOwnProperty.call(remoteRows, number)) {
        missingInMirror++;
      } else if (JSON.stringify(row) !== JSON.stringify(remoteRows[number])) {
        changedContent++;
      }
    });
    var unexpectedInMirror = Object.keys(remoteRows).filter(function(num) {
      return !Object.prototype.hasOwnProperty.call(sourceNumbers, num);
    }).length;
    output.push({
      tabIndex: tab,
      sourceRowCount: sourceSheet.rows.length,
      mirrorCatalogRowCount: count,
      remoteRowsSeen: remoteRowsSeen,
      duplicateRemoteRows: duplicateRemoteRows,
      missingInMirror: missingInMirror,
      changedContent: changedContent,
      unexpectedInMirror: unexpectedInMirror,
      sourceAndMirrorHeadersMatch: firstPageHeadersMatch === null ? false : firstPageHeadersMatch,
      allRemotePageMetadataStable: allPagesMetadataMatch,
      sourceAndMirrorDimensionsMatch:
        Number(remoteSheet.sourceLastRow) === sourceSheet.sourceLastRow &&
        Number(remoteSheet.sourceLastCol) === sourceSheet.sourceLastCol &&
        Number(remoteSheet.rowCount) === sourceSheet.rows.length
    });
  }
  var remoteCatalogAfter = catalog();
  var catalogStable = names.every(function(name) {
    return catalogFingerprint(selectSheet(remoteCatalogBefore, name)) ===
      catalogFingerprint(selectSheet(remoteCatalogAfter, name));
  });
  var sourceAfter = d1OrdersLiveSyncV2CaptureAll_();
  var sourceStable = !!sourceAfter && sourceAfter.fingerprint === sourceBefore.fingerprint;
  var allRowsMatchAtSnapshot = catalogStable && sourceStable &&
    output.every(function(s) {
      return s.mirrorCatalogRowCount === s.remoteRowsSeen &&
        s.duplicateRemoteRows === 0 && s.missingInMirror === 0 &&
        s.changedContent === 0 && s.unexpectedInMirror === 0 &&
        s.sourceAndMirrorHeadersMatch && s.allRemotePageMetadataStable &&
        s.sourceAndMirrorDimensionsMatch;
    });
  var result = {
    audit: 'TRENDOS_D1_ROWS_PARITY_READ_ONLY_20260919',
    mutationPerformed: false,
    remoteMethod: 'GET_ONLY',
    sourceStableDuringComparison: sourceStable,
    remoteCatalogStableDuringComparison: catalogStable,
    rowsByTab: output,
    allRowsMatchAtSnapshot: allRowsMatchAtSnapshot,
    triggerRestartAuthorizedByThisAudit: false,
    note: 'Read-only snapshot. No D1 writes or sync; counts/content comparison never logs source or mirrored customer data. Trigger restart requires separate quota-safe approval.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
