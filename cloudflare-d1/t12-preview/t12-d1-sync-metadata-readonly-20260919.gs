/**
 * TrendOS R4 — LOCAL Script Properties only; no network, no property writes,
 * no sync, no D1 mutation, no secret values or baseline content in logs.
 * Manually run inside original bound Apps Script Head without Deploy.
 */
function trendosD1SyncMetadataReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var names = [
    'D1_ORDERS_LIVE_SYNC_V2_ENABLED',
    'D1_ORDERS_LIVE_SYNC_V2_LAST_RUN',
    'D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT',
    'D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR',
    'D1_ORDERS_LIVE_SYNC_V2_LAST_FULL_SYNC_AT',
    'D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNKS'
  ];
  function dateOnly(raw) {
    var ms = Date.parse(String(raw || ''));
    return isFinite(ms) ? new Date(ms).toISOString() : null;
  }
  function metadata(key) {
    var raw = props.getProperty(key), value;
    if (!raw) return {present: false, at: null};
    try { value = JSON.parse(raw); }
    catch (e) { return {present: true, parseableJson: false, at: null}; }
    return {
      present: true,
      parseableJson: true,
      at: value && typeof value === 'object' ? dateOnly(value.at) : null
    };
  }
  var count = Number(props.getProperty(names[5]) || '0');
  var validCount = Number.isInteger(count) && count > 0 && count <= 100;
  var rawBaseline = '';
  var missingChunks = 0;
  if (validCount) {
    for (var i = 0; i < count; i += 1) {
      var chunk = props.getProperty('D1_ORDERS_LIVE_SYNC_V2_BASELINE_' + i);
      if (chunk == null) missingChunks += 1;
      else rawBaseline += chunk;
    }
  }
  var baselineJsonValid = false;
  var baselineVersion2 = false;
  if (validCount && !missingChunks) {
    try {
      var parsed = JSON.parse(rawBaseline);
      baselineJsonValid = !!parsed && typeof parsed === 'object';
      baselineVersion2 = baselineJsonValid && parsed.version === 2;
    } catch(e) {}
  }
  var triggers = ScriptApp.getProjectTriggers();
  var tracked = ['d1OrdersLowUsageTickV1','d1OperationalEnrichmentLiveSyncTick02CR'];
  var result = {
    audit: 'TRENDOS_D1_SYNC_METADATA_READ_ONLY_20260919',
    mutationPerformed: false,
    enabledFlagIsOne: String(props.getProperty(names[0]) || '') === '1',
    lowUsageTriggerCount: triggers.filter(function(t){return t.getHandlerFunction() === tracked[0];}).length,
    enrichmentTriggerCount: triggers.filter(function(t){return t.getHandlerFunction() === tracked[1];}).length,
    baselineChunkCount: count,
    baselineChunkCountValid: validCount,
    missingBaselineChunks: missingChunks,
    baselineJsonValid: baselineJsonValid,
    baselineVersion2: baselineVersion2,
    lastRun: metadata(names[1]),
    lastAttempt: metadata(names[2]),
    lastError: metadata(names[3]),
    lastFullSyncAt: dateOnly(props.getProperty(names[4])),
    note: 'Local properties and trigger metadata only; no D1 API request or authoritative-vs-mirror data parity test; no changes.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
