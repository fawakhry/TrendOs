/* TrendOS D1 Orders Low-Usage Control V1
 *
 * Install alongside D1_Orders_Live_Sync_V2.gs.
 * Purpose:
 * - Check source every 5 minutes.
 * - If source fingerprint is unchanged: ZERO Cloudflare requests and ZERO D1 writes.
 * - If source changed: delegate to V2 row-level delta sync.
 * - V1 every-minute trigger is removed.
 * - Sheets remain authoritative; this controller never changes source sheet data.
 */

const D1_ORDERS_LOW_USAGE_TRIGGER_FN_V1 = 'd1OrdersLowUsageTickV1';
const D1_ORDERS_LOW_USAGE_LAST_IDLE_CHECK_KEY_V1 = 'D1_ORDERS_LOW_USAGE_LAST_IDLE_CHECK_V1';
const D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1 = 5;

function d1OrdersLowUsageRemoveTriggersV1_() {
  const removable = {
    d1OrdersLiveSyncTick: true,
    d1OrdersLiveSyncTickV2: true,
    d1OrdersLowUsageTickV1: true
  };
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = String(trigger.getHandlerFunction() || '');
    if (removable[fn]) ScriptApp.deleteTrigger(trigger);
  });
}

function d1OrdersLowUsageAssertV2V1_() {
  const required = [
    'd1OrdersLiveSyncTickV2',
    'd1OrdersLiveSyncV2CaptureAll_',
    'd1OrdersLiveSyncV2LoadBaseline_',
    'd1OrdersLiveSyncV2ClearBaseline_'
  ];
  required.forEach(function(name) {
    if (typeof globalThis[name] !== 'function') {
      throw new Error('Missing required D1 Orders V2 function: ' + name);
    }
  });
}

function d1OrdersLowUsageTickV1() {
  d1OrdersLowUsageAssertV2V1_();
  const props = PropertiesService.getScriptProperties();
  const enabled = String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1';
  const checkedAt = new Date().toISOString();

  if (!enabled) {
    return {
      success: false,
      skipped: true,
      lowUsage: true,
      reason: 'disabled',
      d1RequestMade: false,
      d1WriteMade: false
    };
  }

  const capture = d1OrdersLiveSyncV2CaptureAll_();
  const baseline = d1OrdersLiveSyncV2LoadBaseline_(props);
  const unchanged = !!(baseline && baseline.fingerprint === capture.fingerprint);

  if (unchanged) {
    const idle = {
      at: checkedAt,
      success: true,
      lowUsage: true,
      mode: 'unchanged-no-d1-request',
      sourceChanged: false,
      d1RequestMade: false,
      d1WriteMade: false,
      intervalMinutes: D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1
    };
    props.setProperty(D1_ORDERS_LOW_USAGE_LAST_IDLE_CHECK_KEY_V1, JSON.stringify(idle));
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ATTEMPT_KEY, JSON.stringify(idle));
    return idle;
  }

  // Only a real source change reaches Cloudflare. V2 then performs row-level delta
  // (or a safe full rebase if its baseline contract requires it).
  const result = d1OrdersLiveSyncTickV2();
  return Object.assign({}, result || {}, {
    lowUsage: true,
    sourceChanged: true,
    d1RequestMade: true,
    intervalMinutes: D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1
  });
}

function startD1OrdersLowUsageSyncV1() {
  d1OrdersLowUsageAssertV2V1_();
  const props = PropertiesService.getScriptProperties();

  d1OrdersLowUsageRemoveTriggersV1_();
  props.setProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0');
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '1');
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_LAST_ERROR_KEY);
  props.deleteProperty(D1_ORDERS_LIVE_SYNC_V2_QUOTA_PAUSE_UNTIL_KEY);

  // Establish a trusted V2 baseline exactly once at activation. This is the only
  // intentional full sync caused by activation. Subsequent unchanged checks do not
  // call Cloudflare at all.
  d1OrdersLiveSyncV2ClearBaseline_(props);
  const firstRun = d1OrdersLiveSyncTickV2();
  if (!firstRun || firstRun.success !== true) {
    props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
    d1OrdersLowUsageRemoveTriggersV1_();
    throw new Error((firstRun && firstRun.message) || 'Low-usage D1 first sync failed.');
  }

  d1OrdersLowUsageRemoveTriggersV1_();
  ScriptApp.newTrigger(D1_ORDERS_LOW_USAGE_TRIGGER_FN_V1)
    .timeBased()
    .everyMinutes(D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1)
    .create();

  return {
    success: true,
    lowUsage: true,
    intervalMinutes: D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1,
    unchangedD1Writes: 0,
    unchangedCloudflareRequests: 0,
    firstRun: firstRun,
    message: 'D1 Orders low-usage sync active: 5-minute source check; unchanged = zero D1 requests/writes; changed = V2 delta.'
  };
}

function stopD1OrdersLowUsageSyncV1() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY, '0');
  props.setProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0');
  d1OrdersLowUsageRemoveTriggersV1_();
  return {
    success: true,
    lowUsage: true,
    enabled: false,
    message: 'D1 Orders low-usage sync stopped; no recurring Orders sync trigger remains.'
  };
}

function getD1OrdersLowUsageStatusV1() {
  const props = PropertiesService.getScriptProperties();
  const handlers = ScriptApp.getProjectTriggers().map(function(trigger) {
    return String(trigger.getHandlerFunction() || '');
  });
  let lastIdleCheck = null;
  try {
    lastIdleCheck = JSON.parse(props.getProperty(D1_ORDERS_LOW_USAGE_LAST_IDLE_CHECK_KEY_V1) || 'null');
  } catch (err) {}
  return {
    success: true,
    lowUsage: true,
    enabled: String(props.getProperty(D1_ORDERS_LIVE_SYNC_V2_ENABLED_KEY) || '') === '1',
    intervalMinutes: D1_ORDERS_LOW_USAGE_INTERVAL_MINUTES_V1,
    lowUsageTriggerCount: handlers.filter(function(fn) { return fn === D1_ORDERS_LOW_USAGE_TRIGGER_FN_V1; }).length,
    legacyV1TriggerCount: handlers.filter(function(fn) { return fn === 'd1OrdersLiveSyncTick'; }).length,
    directV2TriggerCount: handlers.filter(function(fn) { return fn === 'd1OrdersLiveSyncTickV2'; }).length,
    lastIdleCheck: lastIdleCheck,
    unchangedD1Writes: 0,
    unchangedCloudflareRequests: 0
  };
}
