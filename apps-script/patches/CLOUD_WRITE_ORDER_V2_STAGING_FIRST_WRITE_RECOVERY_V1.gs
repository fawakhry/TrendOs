/* TrendOS Cloud Write Order V2 — Isolated Staging First Write Recovery V1
 *
 * RECOVERY ONLY after the first canonical staging write created Order 3885 /
 * Line 3885-01 but the original verifier read the legacy date-formatted Line ID
 * through getValue(). This helper MUST NOT create a new order.
 *
 * It proves the existing write, recovers the exact V1908 idempotency key from
 * Script Properties internally, replays that same key once, and requires zero
 * Orders/Lines row growth.
 */

var CW_V2_FIRST_WRITE_RECOVERY_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1_20260905";
var CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1 = "3885";
var CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1 = "3885-01";
var CW_V2_FIRST_WRITE_RECOVERY_ORDERS_ROWS_V1 = 275;
var CW_V2_FIRST_WRITE_RECOVERY_LINES_ROWS_V1 = 316;
var CW_V2_FIRST_WRITE_RECOVERY_PROP_PREFIX_V1 = "TRENDOS_CREATE_ORDER_V1908_";

function cwV2RecoveryTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2RecoveryFailV1_(code, details) {
  return {
    success: false,
    verified: false,
    version: CW_V2_FIRST_WRITE_RECOVERY_VERSION_V1,
    code: String(code || "staging-first-write-recovery-refused"),
    details: details || null,
    replayAttempted: false,
    replayVerified: false,
    requestKeyReturned: false,
    tokenReturned: false,
    productionWriteExecuted: false,
    productionCloudWriteChanged: false
  };
}

function cwV2RecoveryHeaderIndexV1_(headers, aliases) {
  headers = Array.isArray(headers) ? headers : [];
  aliases = Array.isArray(aliases) ? aliases : [];
  var normalized = headers.map(function(v){ return cwV2RecoveryTextV1_(v).toLowerCase(); });
  for (var i = 0; i < aliases.length; i++) {
    var idx = normalized.indexOf(cwV2RecoveryTextV1_(aliases[i]).toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function cwV2RecoveryDisplayedLastIdV1_(sheet, aliases) {
  if (!sheet || sheet.getLastRow() < 2) return "";
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  var idx = cwV2RecoveryHeaderIndexV1_(headers, aliases);
  if (idx < 0) return "";
  var cell = sheet.getRange(sheet.getLastRow(), idx + 1);
  if (cell && typeof cell.getDisplayValue === "function") {
    return cwV2RecoveryTextV1_(cell.getDisplayValue());
  }
  return cwV2RecoveryTextV1_(cell.getValue());
}

function cwV2RecoveryFindSavedRequestKeyV1_(props) {
  var all = props && typeof props.getProperties === "function" ? props.getProperties() : {};
  var matches = [];
  Object.keys(all || {}).forEach(function(key) {
    if (String(key).indexOf(CW_V2_FIRST_WRITE_RECOVERY_PROP_PREFIX_V1) !== 0) return;
    var parsed = null;
    try { parsed = JSON.parse(String(all[key] || "")); } catch (err) { parsed = null; }
    if (!parsed || parsed.success !== true) return;
    if (cwV2RecoveryTextV1_(parsed.orderId) !== CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1) return;
    if (parsed.lineId && cwV2RecoveryTextV1_(parsed.lineId) !== CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1) return;
    var requestKey = String(key).slice(CW_V2_FIRST_WRITE_RECOVERY_PROP_PREFIX_V1.length);
    if (!/^CW-STAGE-FIRST-WRITE-[A-Za-z0-9_-]+$/.test(requestKey)) return;
    matches.push({ key: requestKey, saved: parsed });
  });
  if (matches.length !== 1) {
    return { success: false, code: "saved-idempotency-key-not-unique", matches: matches.length };
  }
  return { success: true, requestKey: matches[0].key, saved: matches[0].saved };
}

function trendosCloudWriteOrderV2StagingRecoverFirstWriteV1_() {
  if (typeof cwV2FirstWriteResolveTargetsV1_ !== "function" ||
      typeof cwV2FirstWritePinScriptIdentityV1_ !== "function" ||
      typeof cwV2FirstWriteResolveSyntheticAuthV1_ !== "function") {
    return cwV2RecoveryFailV1_("first-write-harness-dependency-required");
  }
  if (typeof createManualOrder_ !== "function") {
    return cwV2RecoveryFailV1_("canonical-create-manual-order-required");
  }

  var target = cwV2FirstWriteResolveTargetsV1_();
  if (!target || target.success !== true) return target || cwV2RecoveryFailV1_("staging-target-required");

  var orders = target.canonical.getSheetByName("الأوردرات");
  var lines = target.canonical.getSheetByName("بنود الأوردرات");
  var guard = target.canonical.getSheetByName("__TRENDOS_V2_CANONICAL_STAGING_GUARD");
  if (!orders || !lines || !guard) return cwV2RecoveryFailV1_("staging-recovery-sheets-missing");

  var before = {
    orders: Number(orders.getLastRow() || 0),
    lines: Number(lines.getLastRow() || 0)
  };
  if (before.orders !== CW_V2_FIRST_WRITE_RECOVERY_ORDERS_ROWS_V1 ||
      before.lines !== CW_V2_FIRST_WRITE_RECOVERY_LINES_ROWS_V1) {
    return cwV2RecoveryFailV1_("recovery-baseline-mismatch", before);
  }

  var observedOrderId = cwV2RecoveryDisplayedLastIdV1_(orders, ["رقم الأوردر", "Order ID"]);
  var observedLineOrderId = cwV2RecoveryDisplayedLastIdV1_(lines, ["رقم الأوردر", "Order ID"]);
  var observedLineId = cwV2RecoveryDisplayedLastIdV1_(lines, ["رقم البند", "Line ID"]);
  if (observedOrderId !== CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1 ||
      observedLineOrderId !== CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1 ||
      observedLineId !== CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1) {
    return cwV2RecoveryFailV1_("existing-first-write-not-observed", {
      orderId: observedOrderId,
      lineOrderId: observedLineOrderId,
      lineId: observedLineId
    });
  }

  var scriptPin = cwV2FirstWritePinScriptIdentityV1_(target.props);
  if (!scriptPin || scriptPin.success !== true) return scriptPin || cwV2RecoveryFailV1_("script-pin-required");

  var saved = cwV2RecoveryFindSavedRequestKeyV1_(target.props);
  if (!saved.success) return cwV2RecoveryFailV1_(saved.code, { matches: saved.matches });

  var auth = cwV2FirstWriteResolveSyntheticAuthV1_(target.canonical);
  if (!auth || auth.success !== true) return auth || cwV2RecoveryFailV1_("synthetic-auth-required");

  // createManualOrder_ checks auth, then the V1908 saved-response store before
  // any new order fields are required. Only the exact recovered request key is
  // supplied, so a missing replay guard fails closed instead of creating work.
  var replayRaw = createManualOrder_({
    parameter: {
      username: auth.username,
      token: auth.token,
      clientRequestId: saved.requestKey
    }
  }) || {};

  var after = {
    orders: Number(orders.getLastRow() || 0),
    lines: Number(lines.getLastRow() || 0)
  };
  var replayOrderId = cwV2RecoveryTextV1_(replayRaw.orderId);
  var replayLineId = cwV2RecoveryTextV1_(replayRaw.lineId);
  if (replayRaw.success !== true || replayRaw.duplicatePrevented !== true ||
      replayOrderId !== CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1 ||
      (replayLineId && replayLineId !== CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1) ||
      after.orders !== before.orders || after.lines !== before.lines) {
    return {
      success: false,
      verified: false,
      version: CW_V2_FIRST_WRITE_RECOVERY_VERSION_V1,
      code: "saved-idempotency-replay-verification-failed",
      before: before,
      after: after,
      replayObserved: {
        success: replayRaw.success === true,
        duplicatePrevented: replayRaw.duplicatePrevented === true,
        orderId: replayOrderId,
        lineId: replayLineId
      },
      replayAttempted: true,
      replayVerified: false,
      requestKeyReturned: false,
      tokenReturned: false,
      productionWriteExecuted: false,
      productionCloudWriteChanged: false
    };
  }

  guard.getRange(18, 1, 3, 2).setValues([
    ["firstCanonicalWriteStatus", "PASS_RECOVERED"],
    ["firstCanonicalOrderId", CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1],
    ["firstCanonicalLineId", CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1]
  ]);

  return {
    success: true,
    verified: true,
    version: CW_V2_FIRST_WRITE_RECOVERY_VERSION_V1,
    stagingSpreadsheetId: CW_V2_FIRST_WRITE_STAGING_ID_V1,
    orderId: CW_V2_FIRST_WRITE_RECOVERY_ORDER_ID_V1,
    lineId: CW_V2_FIRST_WRITE_RECOVERY_LINE_ID_V1,
    lineIdVerificationMode: "display-value-legacy-date-format-compatible",
    before: before,
    after: after,
    replayAttempted: true,
    replayVerified: true,
    duplicatePreventedOnReplay: true,
    requestKeyPresent: true,
    requestKeyReturned: false,
    tokenPresent: true,
    tokenReturned: false,
    productionWriteExecuted: false,
    productionCloudWriteChanged: false,
    nextRequiredGate: "post-write-staging-live-verification"
  };
}

function runTrendOSCloudWriteOrderV2StagingRecoverFirstWrite() {
  var result = trendosCloudWriteOrderV2StagingRecoverFirstWriteV1_();
  Logger.log("CLOUD_WRITE_V2_STAGING_FIRST_WRITE_RECOVERY=" + JSON.stringify(result));
  return result;
}
