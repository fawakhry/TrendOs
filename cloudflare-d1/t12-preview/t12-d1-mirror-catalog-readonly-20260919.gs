/**
 * TrendOS R4 / mirror catalog snapshot — READ ONLY.
 * Read the two authoritative source tab dimensions and D1 sheet-catalog
 * metadata through existing GET /v1/mirror/sheets; report counts only.
 *
 * It never uploads customer data, logs endpoint/keys/secret/rows,
 * creates a trigger, changes Script Properties, or synchronizes D1.
 * A matching row count is NOT proof of row-content parity.
 */
function trendosD1MirrorCatalogReadOnly20260919() {
  var workbook = d1FullSpreadsheet_();
  if (workbook.getName() !== 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY') {
    throw new Error('R4_ABORT_WRONG_SOURCE_WORKBOOK');
  }
  var names = ['الأوردرات','بنود الأوردرات'];
  var source = names.map(function(name, index) {
    var sh = workbook.getSheetByName(name);
    if (!sh) throw new Error('R4_ABORT_MISSING_SOURCE_TAB_' + index);
    return {
      tabIndex: index,
      sourceLastRow: sh.getLastRow(),
      sourceLastCol: sh.getLastColumn(),
      sourceRowCountIncludingHeader: sh.getLastRow()
    };
  });
  // d1FullGet_ uses GET and raises on HTTP/backend failure. It only
  // receives public catalog metadata, never sends Sheet rows.
  var remote = d1FullGet_('/v1/mirror/sheets');
  if (!remote || remote.success !== true || !Array.isArray(remote.sheets)) {
    throw new Error('R4_ABORT_INVALID_D1_CATALOG_GET');
  }
  var matches = names.map(function(name, index) {
    return remote.sheets.filter(function(item) {
      return item && item.sheetName === name;
    });
  });
  var mirror = matches.map(function(group, index) {
    if (group.length !== 1) return {
      tabIndex: index, matchCount: group.length,
      presentExactlyOnce: false, mirrorRowCount: null,
      mirrorSourceLastRow: null, mirrorSourceLastCol: null,
      mirrorStatusReady: false, mirrorSyncedAt: null,
      rowCountMatchesSource: false, sourceLastRowMatches: false,
      sourceLastColMatches: false
    };
    var item = group[0];
    return {
      tabIndex: index, matchCount: 1, presentExactlyOnce: true,
      mirrorRowCount: Number(item.rowCount),
      mirrorSourceLastRow: Number(item.sourceLastRow),
      mirrorSourceLastCol: Number(item.sourceLastCol),
      mirrorStatusReady: item.status === 'ready',
      mirrorSyncedAt: item.syncedAt || null,
      rowCountMatchesSource: Number(item.rowCount) === source[index].sourceLastRow,
      sourceLastRowMatches: Number(item.sourceLastRow) === source[index].sourceLastRow,
      sourceLastColMatches: Number(item.sourceLastCol) === source[index].sourceLastCol
    };
  });
  var allCatalogDimensionsMatch = mirror.every(function(x) {
    return x.presentExactlyOnce && x.mirrorStatusReady &&
      x.rowCountMatchesSource && x.sourceLastRowMatches && x.sourceLastColMatches;
  });
  var result = {
    audit: 'TRENDOS_D1_MIRROR_CATALOG_READ_ONLY_20260919',
    mutationPerformed: false,
    remoteMethod: 'GET',
    source: source,
    mirror: mirror,
    allCatalogDimensionsMatch: allCatalogDimensionsMatch,
    rowContentParityVerified: false,
    triggerRestartAuthorizedByThisAudit: false,
    note: 'Catalog/row-count check only. Matching dimensions do not prove actual row-content parity. No D1 writes, no trigger or property mutation.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
