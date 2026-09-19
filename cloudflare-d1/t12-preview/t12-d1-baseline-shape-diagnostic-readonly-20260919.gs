/**
 * R4 G1 baseline shape diagnosis after R4_G1_ABORT_BASELINE_SHAPE_UNSAFE.
 * READ ONLY: one local V2 baseline load + one D1 mirror catalog GET.
 * Only aggregate counts/boolean shape flags, no raw identifiers,
 * hashes, rows, Script Property values, URL or secret in output.
 * This DOES NOT repair the baseline or grant permission for sync.
 */
function trendosD1BaselineShapeDiagnosticReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var baseline = d1OrdersLiveSyncV2LoadBaseline_(props);
  var names = ['الأوردرات', 'بنود الأوردرات'];
  var response = d1FullGet_('/v1/mirror/sheets');
  if (!response || response.success !== true || !Array.isArray(response.sheets)) {
    throw new Error('R4_G1_DIAG_ABORT_D1_CATALOG_INVALID');
  }
  var baseTabs = baseline && Array.isArray(baseline.sheets) ? baseline.sheets : [];
  var reports = names.map(function(name, index) {
    var sourceMatches = baseTabs.filter(function(x){return x && x.sheetName === name;});
    var catalogMatches = response.sheets.filter(function(x){return x && x.sheetName === name;});
    var old = sourceMatches.length === 1 ? sourceMatches[0] : null;
    var cat = catalogMatches.length === 1 ? catalogMatches[0] : null;
    var count = old ? Number(old.rowCount) : NaN;
    var lastRow = old ? Number(old.sourceLastRow) : NaN;
    var lastCol = old ? Number(old.sourceLastCol) : NaN;
    var remoteIdNumber = cat ? Number(cat.sheetId) : NaN;
    var checks = {
      baselineTabPresentExactlyOnce: sourceMatches.length === 1,
      catalogTabPresentExactlyOnce: catalogMatches.length === 1,
      baselineRowCountIntegerInRange:
        Number.isInteger(count) && count >= 1 && count <= 2500,
      baselineLastRowMatchesRowCount:
        Number.isInteger(lastRow) && count === lastRow,
      remoteSheetIdNumericNonnegative:
        Number.isInteger(remoteIdNumber) && remoteIdNumber >= 0,
      baselineLastColIntegerPositive:
        Number.isInteger(lastCol) && lastCol >= 1,
      baselineRowHashesArray: !!old && Array.isArray(old.rowHashes),
      baselineRowHashEntryCountMatchesRows:
        !!old && Array.isArray(old.rowHashes) && old.rowHashes.length === count
    };
    return {
      tabIndex: index,
      baselineRowCount: Number.isFinite(count) ? count : null,
      baselineSourceLastRow: Number.isFinite(lastRow) ? lastRow : null,
      baselineSourceLastCol: Number.isFinite(lastCol) ? lastCol : null,
      baselineHashEntryCount: old && Array.isArray(old.rowHashes) ? old.rowHashes.length : null,
      catalogRowCount: cat && Number.isFinite(Number(cat.rowCount)) ? Number(cat.rowCount) : null,
      checks: checks,
      failedCheckNames: Object.keys(checks).filter(function(k){return checks[k] !== true;})
    };
  });
  var result = {
    audit: 'TRENDOS_D1_BASELINE_SHAPE_DIAGNOSTIC_READ_ONLY_20260919',
    mutationPerformed: false,
    remoteMethod: 'GET_ONLY',
    baselineVersion2Loaded: !!baseline && baseline.version === 2,
    baselineTabCount: baseTabs.length,
    tabs: reports,
    allPriorShapeChecksPass: reports.every(function(x){return x.failedCheckNames.length === 0;}),
    mirrorParityVerified: false,
    retryOriginalHelperAuthorized: false,
    note: 'Sanitized shape diagnosis only. No D1 write, property modification, sync or trigger recreation.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
