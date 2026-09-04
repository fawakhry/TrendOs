/* TrendOS D1 Orders Low-Usage Heartbeat V1
 *
 * Read-only helper for a future controlled Apps Script Web App route.
 * It sanitizes getD1OrdersLowUsageStatusV1() for Edge freshness verification.
 *
 * Safety:
 * - no Sheet writes
 * - no D1 / Cloudflare calls
 * - no Script Property mutation
 * - no secret values
 * - no business row values
 * - display hashes are reduced to presence markers only
 *
 * This helper is NOT reachable from doGet by itself. A separately approved,
 * exact one-line routing insertion is required in the persisted Apps Script Head.
 */

function getD1OrdersLowUsageHeartbeatV1() {
  if (typeof getD1OrdersLowUsageStatusV1 !== 'function') {
    return {
      success: false,
      lowUsage: true,
      code: 'low-usage-status-unavailable'
    };
  }

  const raw = getD1OrdersLowUsageStatusV1() || {};
  const idle = raw.lastIdleCheck && typeof raw.lastIdleCheck === 'object'
    ? raw.lastIdleCheck
    : null;

  function sanitizeSource_(source) {
    if (!Array.isArray(source)) return [];
    return source.map(function(entry) {
      entry = entry || {};
      return {
        sheetName: String(entry.sheetName || ''),
        sourceLastRow: Number(entry.sourceLastRow || 0),
        sourceLastCol: Number(entry.sourceLastCol || 0),
        displayHash: String(entry.displayHash || '') ? 'present' : ''
      };
    });
  }

  const lastError = raw.lastError && typeof raw.lastError === 'object'
    ? {
        present: true,
        at: String(raw.lastError.at || ''),
        phase: String(raw.lastError.phase || ''),
        consecutiveErrors: Number(raw.lastError.consecutiveErrors || raw.consecutiveErrors || 0)
      }
    : null;

  return {
    success: raw.success === true,
    lowUsage: raw.lowUsage === true,
    lightweightIdleDetection: raw.lightweightIdleDetection === true,
    enabled: raw.enabled === true,
    intervalMinutes: Number(raw.intervalMinutes || 0),
    lowUsageTriggerCount: Number(raw.lowUsageTriggerCount || 0),
    legacyV1TriggerCount: Number(raw.legacyV1TriggerCount || 0),
    directV2TriggerCount: Number(raw.directV2TriggerCount || 0),
    lightFingerprintPresent: raw.lightFingerprintPresent === true,
    lastError: lastError,
    consecutiveErrors: Number(raw.consecutiveErrors || 0),
    unchangedD1Writes: Number(raw.unchangedD1Writes || 0),
    unchangedCloudflareRequests: Number(raw.unchangedCloudflareRequests || 0),
    lastIdleCheck: idle ? {
      at: String(idle.at || ''),
      success: idle.success === true,
      lowUsage: idle.lowUsage === true,
      mode: String(idle.mode || ''),
      sourceChanged: idle.sourceChanged === true ? true : false,
      d1RequestMade: idle.d1RequestMade === true ? true : false,
      d1WriteMade: idle.d1WriteMade === true ? true : false,
      intervalMinutes: Number(idle.intervalMinutes || 0),
      source: sanitizeSource_(idle.source)
    } : null
  };
}
