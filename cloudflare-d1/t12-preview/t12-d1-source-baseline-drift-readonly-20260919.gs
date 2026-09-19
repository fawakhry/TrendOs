/**
 * TrendOS R4 / READ ONLY: original Orders/Lines vs existing local V2 baseline.
 * Run ONCE in the confirmed bound Apps Script Head. DO NOT DEPLOY.
 * This does NOT query the Cloudflare D1 mirror or synchronize it.
 * Do not print hashes, rows, customer data, request keys or property values.
 * No properties, sheets, triggers, or remote services are changed.
 */
function trendosD1SourceBaselineDriftReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var baseline = d1OrdersLiveSyncV2LoadBaseline_(props);
  if (!baseline || baseline.version !== 2 || !Array.isArray(baseline.sheets) ||
      baseline.sheets.length !== 2 || !baseline.fingerprint) {
    throw new Error('R4_ABORT_LOCAL_BASELINE_INVALID_NO_SYNC');
  }
  // Existing V2 capture reads the two original Sheets and computes their
  // per-row fingerprints. It does not call d1FullPost_, d1FullGet_ or write.
  var capture = d1OrdersLiveSyncV2CaptureAll_();
  if (!capture || !Array.isArray(capture.snapshots) ||
      capture.snapshots.length !== 2) {
    throw new Error('R4_ABORT_SOURCE_CAPTURE_INVALID_NO_SYNC');
  }
  var delta = d1OrdersLiveSyncV2ComputeDelta_(capture, baseline);
  var baseByName = Object.create(null);
  baseline.sheets.forEach(function(sheet) {
    baseByName[String(sheet.sheetName || '')] = sheet;
  });
  var pendingByTab = [];
  capture.snapshots.forEach(function(snapshot, index) {
    var prior = baseByName[snapshot.sheetName];
    if (!prior) throw new Error('R4_ABORT_BASELINE_TAB_MISSING_NO_SYNC');
    var previousRowHashes = Object.create(null);
    (prior.rowHashes || []).forEach(function(pair) {
      if (Array.isArray(pair) && pair.length >= 2) {
        previousRowHashes[String(pair[0])] = String(pair[1] || '');
      }
    });
    var changedRows = 0;
    snapshot.rows.forEach(function(row) {
      if (previousRowHashes[String(row.rowNumber)] !==
          d1OrdersLiveSyncV2DigestHex_(JSON.stringify(row))) changedRows++;
    });
    pendingByTab.push({
      tabIndex: index,
      baselineRowCount: Number(prior.rowCount || 0),
      currentRowCount: snapshot.rows.length,
      changedOrNewRows: changedRows,
      deletedTailRows: Math.max(0, Number(prior.rowCount || 0) - snapshot.sourceLastRow),
      schemaOrContentChanged: prior.hash !== snapshot.hash
    });
  });
  var lastFullAt = props.getProperty('D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT') || '';
  var lastFullMs = lastFullAt ? Date.parse(lastFullAt) : NaN;
  var rebaseDue = !isFinite(lastFullMs) ||
    Date.now() - lastFullMs >= 24 * 60 * 60 * 1000;
  var result = {
    audit: 'TRENDOS_D1_SOURCE_BASELINE_DRIFT_READ_ONLY_20260919',
    mutationPerformed: false,
    localBaselineValid: true,
    baselineSavedAt: typeof baseline.savedAt === 'string' ? baseline.savedAt : null,
    sourceChangedSinceBaseline: capture.fingerprint !== baseline.fingerprint,
    rowLevelDeltaComputable: !!delta,
    totalChangedOrNewRows: pendingByTab.reduce(function(n,s){return n+s.changedOrNewRows;},0),
    totalDeletedTailRows: pendingByTab.reduce(function(n,s){return n+s.deletedTailRows;},0),
    pendingByTab: pendingByTab,
    fullRebaseDueBy24HourPolicy: rebaseDue,
    note: 'Source vs local baseline only. Does NOT verify Cloudflare D1 mirror parity, perform sync, or authorize trigger restart.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
