/* TrendOS D1 Zero-Idle Control V1
 *
 * Purpose:
 * - Stop recurring D1 sync/migration triggers that can consume Cloudflare/D1 quota while idle.
 * - Leave Google Sheets + Apps Script authoritative and untouched.
 * - Keep D1 sync available only as explicit one-shot V2 operations until an event-driven cutover is approved.
 *
 * This file does not create any trigger and does not call Cloudflare/D1 during activation/status checks.
 */

const D1_ZERO_IDLE_MODE_KEY_V1 = 'D1_ZERO_IDLE_MODE_V1';
const D1_ZERO_IDLE_LAST_ACTIVATED_KEY_V1 = 'D1_ZERO_IDLE_LAST_ACTIVATED_V1';
const D1_ZERO_IDLE_KNOWN_TRIGGER_HANDLERS_V1 = [
  'd1OrdersLiveSyncTick',
  'd1OrdersLiveSyncTickV2',
  'd1NormalizedLiveSyncTick',
  'd1NormalizedLiveSyncTickV2',
  'd1FullMigrationTick'
];
const D1_ZERO_IDLE_ENABLED_KEYS_V1 = [
  'D1_ORDERS_LIVE_SYNC_ENABLED_V1',
  'D1_ORDERS_LIVE_SYNC_V2_ENABLED',
  'D1_NORMALIZED_SYNC_ENABLED_V1',
  'D1_NORMALIZED_SYNC_V2_ENABLED'
];

function d1ZeroIdleKnownHandler_(handler) {
  return D1_ZERO_IDLE_KNOWN_TRIGGER_HANDLERS_V1.indexOf(String(handler || '')) !== -1;
}

function d1ZeroIdleLooksD1Recurring_(handler) {
  const value = String(handler || '');
  return /^d1/i.test(value) && /(sync|migration)/i.test(value) && /(tick|run)/i.test(value);
}

function d1ZeroIdleRemoveKnownTriggers_() {
  const removed = [];
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const handler = String(trigger.getHandlerFunction() || '');
    if (!d1ZeroIdleKnownHandler_(handler)) return;
    ScriptApp.deleteTrigger(trigger);
    removed.push(handler);
  });
  return removed;
}

function activateD1ZeroIdleMode() {
  const props = PropertiesService.getScriptProperties();
  const removed = d1ZeroIdleRemoveKnownTriggers_();

  D1_ZERO_IDLE_ENABLED_KEYS_V1.forEach(function(key) {
    props.setProperty(key, '0');
  });

  const activatedAt = new Date().toISOString();
  props.setProperty(D1_ZERO_IDLE_MODE_KEY_V1, '1');
  props.setProperty(D1_ZERO_IDLE_LAST_ACTIVATED_KEY_V1, activatedAt);

  const remaining = ScriptApp.getProjectTriggers().map(function(trigger) {
    return String(trigger.getHandlerFunction() || '');
  }).filter(d1ZeroIdleLooksD1Recurring_);

  return {
    success: remaining.length === 0,
    zeroIdle: true,
    activatedAt: activatedAt,
    removedTriggerCount: removed.length,
    removedTriggers: removed,
    remainingD1RecurringTriggers: remaining,
    recurringD1WritesEnabled: false,
    cloudflareRequestMade: false,
    d1WriteMade: false,
    message: remaining.length
      ? 'Zero-idle removed known D1 recurring triggers, but unknown D1 recurring triggers still require review.'
      : 'Zero-idle active: no known recurring D1 sync/migration trigger remains.'
  };
}

function getD1ZeroIdleStatus() {
  const props = PropertiesService.getScriptProperties();
  const allHandlers = ScriptApp.getProjectTriggers().map(function(trigger) {
    return String(trigger.getHandlerFunction() || '');
  });
  const knownActive = allHandlers.filter(d1ZeroIdleKnownHandler_);
  const recurringD1 = allHandlers.filter(d1ZeroIdleLooksD1Recurring_);

  return {
    success: true,
    zeroIdle: String(props.getProperty(D1_ZERO_IDLE_MODE_KEY_V1) || '') === '1',
    lastActivatedAt: String(props.getProperty(D1_ZERO_IDLE_LAST_ACTIVATED_KEY_V1) || ''),
    knownActiveTriggerCount: knownActive.length,
    knownActiveTriggers: knownActive,
    recurringD1TriggerCount: recurringD1.length,
    recurringD1Triggers: recurringD1,
    enabledFlags: {
      ordersV1: String(props.getProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1') || '') === '1',
      ordersV2: String(props.getProperty('D1_ORDERS_LIVE_SYNC_V2_ENABLED') || '') === '1',
      normalizedV1: String(props.getProperty('D1_NORMALIZED_SYNC_ENABLED_V1') || '') === '1',
      normalizedV2: String(props.getProperty('D1_NORMALIZED_SYNC_V2_ENABLED') || '') === '1'
    },
    recurringD1WritesEnabled: knownActive.length > 0,
    cloudflareRequestMade: false,
    d1WriteMade: false
  };
}

function d1ZeroIdleRunOrdersV2Once() {
  if (typeof d1OrdersLiveSyncTickV2 !== 'function') {
    throw new Error('D1 Orders Live Sync V2 is not installed in this Apps Script project.');
  }
  const props = PropertiesService.getScriptProperties();
  d1ZeroIdleRemoveKnownTriggers_();
  props.setProperty('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0');
  props.setProperty('D1_ORDERS_LIVE_SYNC_V2_ENABLED', '1');
  try {
    return d1OrdersLiveSyncTickV2();
  } finally {
    props.setProperty('D1_ORDERS_LIVE_SYNC_V2_ENABLED', '0');
    d1ZeroIdleRemoveKnownTriggers_();
    props.setProperty(D1_ZERO_IDLE_MODE_KEY_V1, '1');
  }
}

function d1ZeroIdleRunNormalizedV2Once() {
  if (typeof d1NormalizedLiveSyncTickV2 !== 'function') {
    throw new Error('D1 Normalized Live Sync V2 is not installed in this Apps Script project.');
  }
  const props = PropertiesService.getScriptProperties();
  d1ZeroIdleRemoveKnownTriggers_();
  props.setProperty('D1_NORMALIZED_SYNC_ENABLED_V1', '0');
  props.setProperty('D1_NORMALIZED_SYNC_V2_ENABLED', '1');
  try {
    return d1NormalizedLiveSyncTickV2();
  } finally {
    props.setProperty('D1_NORMALIZED_SYNC_V2_ENABLED', '0');
    d1ZeroIdleRemoveKnownTriggers_();
    props.setProperty(D1_ZERO_IDLE_MODE_KEY_V1, '1');
  }
}

function d1ZeroIdleRunAllV2Once() {
  const orders = d1ZeroIdleRunOrdersV2Once();
  if (!orders || orders.success !== true) {
    return { success: false, zeroIdle: true, phase: 'orders', orders: orders };
  }
  const normalized = d1ZeroIdleRunNormalizedV2Once();
  return {
    success: !!(normalized && normalized.success === true),
    zeroIdle: true,
    orders: orders,
    normalized: normalized,
    status: getD1ZeroIdleStatus()
  };
}
