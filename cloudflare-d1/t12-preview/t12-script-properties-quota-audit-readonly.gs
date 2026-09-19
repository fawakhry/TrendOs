/**
 * TrendOS R1 / 2026-09-19 — READ-ONLY live Apps Script property quota inventory.
 * No property values, secret key names, order ids, customer data or tokens are logged.
 * This function must be run ONLY in the confirmed bound original Apps Script
 * project; it does not deploy and does not alter any properties/triggers/sheets.
 * Do not copy the entire Script Properties table or this report's underlying values.
 */
function trendosPropertyQuotaAuditReadOnly20260919() {
  var props = PropertiesService.getScriptProperties();
  var keys = props.getKeys();
  var now = Date.now();
  var names = ['CREATE_ORDER_V1908_REPLAYS', 'D1_ORDERS_V2_BASELINE_CHUNKS',
    'D1_SYNC_OTHER', 'ALL_REMAINING_PROPERTIES'];
  var groups = {};
  names.forEach(function(name) {
    groups[name] = { count: 0, bytesApprox: 0 };
  });
  var replayOlderThan48Hours = 0;
  var replayOlderThan7Days = 0;
  var replayAgeUndetermined = 0;
  var baselineHighestIndex = -1;
  function utf8Bytes(value) {
    return Utilities.newBlob(String(value == null ? '' : value)).getBytes().length;
  }
  keys.forEach(function(key) {
    var name = String(key || '');
    var group = 'ALL_REMAINING_PROPERTIES';
    if (name.indexOf('TRENDOS_CREATE_ORDER_V1908_') === 0) {
      group = 'CREATE_ORDER_V1908_REPLAYS';
      var match = /^TRENDOS_CREATE_ORDER_V1908_co_(\d{13})_/.exec(name);
      var createdAt = match ? Number(match[1]) : NaN;
      if (!isFinite(createdAt) || createdAt > now || createdAt <= 0) {
        replayAgeUndetermined += 1;
      } else {
        if (now - createdAt >= 48 * 60 * 60 * 1000) replayOlderThan48Hours += 1;
        if (now - createdAt >= 7 * 24 * 60 * 60 * 1000) replayOlderThan7Days += 1;
      }
    } else if (/^D1_ORDERS_LIVE_SYNC_V2_BASELINE_\d+$/.test(name)) {
      group = 'D1_ORDERS_V2_BASELINE_CHUNKS';
      var index = Number(name.replace('D1_ORDERS_LIVE_SYNC_V2_BASELINE_', ''));
      if (index > baselineHighestIndex) baselineHighestIndex = index;
    } else if (/^(D1_ORDERS_|D1_FAST_|D1_DASHBOARD_|TRENDOS_CLOUD_WRITE_)/.test(name)) {
      group = 'D1_SYNC_OTHER';
    }

    // Values are read into a local variable ONLY for byte-counting, NEVER logged.
    var value = props.getProperty(name);
    groups[group].count += 1;
    groups[group].bytesApprox += utf8Bytes(name) + utf8Bytes(value);
  });
  var result = {
    audit: 'TRENDOS_PROPERTIES_QUOTA_READ_ONLY_20260919',
    totalProperties: keys.length,
    totalBytesApprox: names.reduce(function(n, name) { return n + groups[name].bytesApprox; }, 0),
    groups: groups,
    replayOlderThan48Hours: replayOlderThan48Hours,
    replayOlderThan7Days: replayOlderThan7Days,
    replayAgeUndetermined: replayAgeUndetermined,
    baselineHighestIndexObserved: baselineHighestIndex,
    baselineChunkCountObserved: groups.D1_ORDERS_V2_BASELINE_CHUNKS.count,
    notes: 'Approximate stored key + UTF-8 value bytes only; no values printed; no mutation.'
  };
  Logger.log(JSON.stringify(result));
  return result;
}
