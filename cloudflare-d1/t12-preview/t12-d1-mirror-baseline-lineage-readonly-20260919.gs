/**
 * TrendOS R4 G1. Existing local V2 baseline vs D1 mirror Orders/Lines,
 * read only. Owner-run manually in ORIGINAL bound Apps Script Head only after
 * explicit instruction. No Deploy, no sync, no trigger restoration.
 *
 * GET sheet catalogs and paginated rows without writing. Never print
 * source/remote row values, customer IDs, backup data, hashes or credentials.
 * A passing snapshot is a prerequisite, NOT authority to run a D1 delta.
 */
function trendosD1MirrorBaselineLineageReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var base = d1OrdersLiveSyncV2LoadBaseline_(props);
  if (!base || base.version !== 2 || !Array.isArray(base.sheets) ||
      base.sheets.length !== 2 || typeof base.fingerprint !== 'string') {
    throw new Error('R4_G1_ABORT_BASELINE_INVALID');
  }
  var names = ['الأوردرات', 'بنود الأوردرات'];
  function readCatalog() {
    var response = d1FullGet_('/v1/mirror/sheets');
    if (!response || response.success !== true || !Array.isArray(response.sheets)) {
      throw new Error('R4_G1_ABORT_D1_CATALOG_INVALID');
    }
    return response.sheets;
  }
  function select(all, name) {
    var items = all.filter(function(s){return s && s.sheetName === name;});
    if (items.length !== 1) throw new Error('R4_G1_ABORT_D1_TAB_MISSING_OR_DUPLICATED');
    return items[0];
  }
  function catalogTag(s) {
    return JSON.stringify([
      String(s.sheetId || ''), Number(s.sourceLastRow),
      Number(s.sourceLastCol), Number(s.rowCount),
      String(s.status || ''), String(s.note || ''), String(s.syncedAt || '')
    ]);
  }
  var catalogBefore = readCatalog();
  var tabs = [];
  var captured = [];
  var maxRows = 2500;
  var pageSize = 200;
  names.forEach(function(name, tabIndex) {
    var old = base.sheets.filter(function(s){return s && s.sheetName === name;});
    if (old.length !== 1) throw new Error('R4_G1_ABORT_BASELINE_TAB_MISSING_OR_DUPLICATED');
    old = old[0];
    var cat = select(catalogBefore, name);
    var count = Number(old.rowCount), lastRow = Number(old.sourceLastRow);
    var sheetId = Number(cat.sheetId);
    if (!Number.isInteger(count) || count < 1 || count > maxRows ||
        count !== lastRow || !Number.isInteger(sheetId) || sheetId < 0 ||
        !Number.isInteger(Number(old.sourceLastCol)) || Number(old.sourceLastCol) < 1 ||
        !Array.isArray(old.rowHashes) || old.rowHashes.length > count ||
        typeof old.hash !== 'string' || !/^[a-f0-9]{64}$/.test(old.hash) ||
        !/^[a-f0-9]{64}$/.test(base.fingerprint)) {
      throw new Error('R4_G1_ABORT_BASELINE_SHAPE_UNSAFE');
    }
    var dimensionsMatch = String(cat.sheetId) === String(sheetId) &&
      Number(cat.sourceLastRow) === lastRow &&
      Number(cat.sourceLastCol) === Number(old.sourceLastCol) &&
      Number(cat.rowCount) === count && cat.status === 'ready' &&
      cat.note === 'TrendOS orders live sync V2 quota-aware';
    var expected = Object.create(null);
    var malformedBaselineHashes = 0;
    old.rowHashes.forEach(function(pair) {
      var n = pair && pair.length === 2 ? Number(pair[0]) : NaN;
      if (!Number.isInteger(n) || n < 1 || n > count ||
          typeof pair[1] !== 'string' || !/^[a-f0-9]{64}$/.test(pair[1]) ||
          Object.prototype.hasOwnProperty.call(expected, String(n))) {
        malformedBaselineHashes += 1;
      } else expected[String(n)] = pair[1];
    });
    if (malformedBaselineHashes) throw new Error('R4_G1_ABORT_BASELINE_HASHES_INVALID');
    var indexedBaselineRows = Object.keys(expected).length;
    var baselineRowsWithoutStoredHash = count - indexedBaselineRows;
    var headers = null, rows = [], mismatch = 0, missing = 0, wrongNumbers = 0;
    var pageMetadataStable = true;
    for (var offset = 0; offset < count; offset += pageSize) {
      var response = d1FullGet_('/v1/mirror/sheet?name=' +
        encodeURIComponent(name) + '&limit=' + pageSize + '&offset=' + offset);
      var page = response && response.sheet;
      if (!response || response.success !== true || !page || page.sheetName !== name ||
          !Array.isArray(page.rows) || !Array.isArray(page.headers)) {
        throw new Error('R4_G1_ABORT_D1_PAGE_INVALID');
      }
      if (headers === null) headers = page.headers;
      if (JSON.stringify(page.headers) !== JSON.stringify(headers) ||
          catalogTag(page) !== catalogTag(cat) ||
          Number(page.offset) !== offset || Number(page.limit) !== pageSize) {
        pageMetadataStable = false;
      }
      var needed = Math.min(pageSize, count - offset);
      if (page.rows.length !== needed) throw new Error('R4_G1_ABORT_D1_PAGE_LENGTH_MISMATCH');
      page.rows.forEach(function(row, index) {
        var rowNumber = Number(row && row.rowNumber);
        if (!Number.isInteger(rowNumber) || rowNumber !== offset + index + 1 ||
            !Array.isArray(row.values) || !Array.isArray(row.display) ||
            !Array.isArray(row.formulas)) {
          wrongNumbers++;
          return;
        }
        var shaped = {
          rowNumber: rowNumber, values: row.values,
          display: row.display, formulas: row.formulas
        };
        rows.push(shaped);
        if (!Object.prototype.hasOwnProperty.call(expected, String(rowNumber))) {
          missing++;
        } else if (Object.prototype.hasOwnProperty.call(expected, String(rowNumber)) &&
            d1OrdersLiveSyncV2DigestHex_(JSON.stringify(shaped)) !==
            expected[String(rowNumber)]) mismatch++;
      });
    }
    var snapshotHash = rows.length === count ? d1OrdersLiveSyncV2DigestHex_(
      JSON.stringify({
        sheetName: name, sheetId: sheetId, sourceLastRow: Number(cat.sourceLastRow),
        sourceLastCol: Number(cat.sourceLastCol), headers: headers, rows: rows
      })
    ) : '';
    var entireSnapshotHashMatch = snapshotHash === old.hash;
    tabs.push({
      tabIndex: tabIndex, baselineRows: count,
      indexedBaselineRows: indexedBaselineRows,
      baselineRowsWithoutStoredHash: baselineRowsWithoutStoredHash,
      mirrorCatalogRows: Number(cat.rowCount),
      comparedRows: rows.length, mismatchedRowHashes: mismatch,
      absentBaselineRowNumbers: missing, malformedRemoteRowNumbers: wrongNumbers,
      baselineDimensionsAndV2NoteMatch: dimensionsMatch,
      pageMetadataStable: pageMetadataStable,
      fullSheetSnapshotHashMatch: entireSnapshotHashMatch,
      sparseIndexCoveredByFullSnapshotHash: baselineRowsWithoutStoredHash > 0 &&
        entireSnapshotHashMatch
    });
    captured.push({
      sheetName: name, sourceLastRow: Number(cat.sourceLastRow),
      sourceLastCol: Number(cat.sourceLastCol), hash: snapshotHash
    });
  });
  var catalogAfter = readCatalog();
  var catalogStable = names.every(function(name) {
    return catalogTag(select(catalogBefore, name)) ===
      catalogTag(select(catalogAfter, name));
  });
  var remoteBaselineFingerprint = d1OrdersLiveSyncV2DigestHex_(JSON.stringify(captured));
  var allMirrorRowsMatchLocalBaseline = catalogStable &&
    /^[a-f0-9]{64}$/.test(remoteBaselineFingerprint) &&
    remoteBaselineFingerprint === base.fingerprint && tabs.every(function(t) {
      return t.baselineRows === t.comparedRows &&
        t.indexedBaselineRows + t.baselineRowsWithoutStoredHash === t.baselineRows &&
        t.baselineRows === t.mirrorCatalogRows &&
        t.mismatchedRowHashes === 0 && t.absentBaselineRowNumbers === 0 &&
        t.malformedRemoteRowNumbers === 0 &&
        t.baselineDimensionsAndV2NoteMatch && t.pageMetadataStable &&
        t.fullSheetSnapshotHashMatch;
    });
  var result = {
    audit: 'TRENDOS_D1_MIRROR_BASELINE_LINEAGE_READ_ONLY_20260919',
    mutationPerformed: false,
    remoteMethod: 'GET_ONLY',
    baselineVersion2: true,
    baselineSavedAt: typeof base.savedAt === 'string' ? base.savedAt : null,
    mirrorCatalogStableDuringRead: catalogStable,
    tabs: tabs,
    allMirrorRowsMatchLocalBaseline: allMirrorRowsMatchLocalBaseline,
    deltaExecutionAuthorizedByThisAudit: false,
    triggerRestartAuthorizedByThisAudit: false,
    note: 'Sparse row-hash indexes are permitted only with exact full-sheet snapshot SHA-256 and combined baseline fingerprint equality. This GET-only read does not compare current source, sync or authorize any mutation.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
