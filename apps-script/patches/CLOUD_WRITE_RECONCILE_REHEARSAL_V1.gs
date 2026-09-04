/* TrendOS Cloud Write -> Sheets Reconciliation REHEARSAL V1
 *
 * CONTROLLED SHADOW-SHEET WRITE REHEARSAL.
 * This source is default-OFF and cannot target the live Orders sheet.
 * It can append one known synthetic CW-STAGE-* order only to the fixed
 * pre-existing shadow sheet __TRENDOS_CLOUD_WRITE_REHEARSAL.
 *
 * Required Script Properties for a future manual rehearsal:
 * - TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED = 1
 * - TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET = <separate rehearsal secret>
 *
 * Safety:
 * - fixed shadow-sheet target only
 * - never creates a Sheet
 * - never updates or deletes an existing row
 * - exact synthetic identity only
 * - Orders headers and rehearsal headers must have the same fingerprint
 * - one append maximum for a new ID
 * - identical replay is a no-op
 * - conflicting replay fails closed
 */

var CW_REHEARSAL_SHEET_V1 = "__TRENDOS_CLOUD_WRITE_REHEARSAL";
var CW_REHEARSAL_ENABLED_KEY_V1 = "TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED";
var CW_REHEARSAL_SECRET_KEY_V1 = "TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET";

function cwRehearsalEnabledV1_(props) {
  return cwReconcileTextV1_(props.getProperty(CW_REHEARSAL_ENABLED_KEY_V1)) === "1";
}

function cwRehearsalHeadersV1_(sheet) {
  var lastColumn = Math.max(1, sheet.getLastColumn());
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(cwReconcileTextV1_);
}

function cwRehearsalFindRowsV1_(sheet, orderColumn, entityId) {
  var matches = [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return matches;
  var values = sheet.getRange(2, orderColumn, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (cwReconcileTextV1_(values[i][0]) === entityId) matches.push(i + 2);
  }
  return matches;
}

function cwRehearsalSyntheticPayloadV1_(payload) {
  return cwReconcileTextV1_(payload.customerName) === "Staging Cloud Write Qualification" &&
    cleanPhone_(payload.customerPhone) === "01001112233" &&
    payload._cloudWriteV1 === true;
}

function cwRehearsalPlannedRowV1_(headers, plan) {
  var row = Array(headers.length).fill("");
  plan.forEach(function (item) {
    if (item && item.column > 0 && item.column <= row.length) row[item.column - 1] = item.value;
  });
  return row;
}

function cwRehearsalMappedReplayEqualV1_(sheet, rowNumber, plan) {
  var width = Math.max(1, sheet.getLastColumn());
  var current = sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  for (var i = 0; i < plan.length; i++) {
    var item = plan[i];
    var actual = current[item.column - 1];
    var expected = item.value;
    if (cwReconcileCanonicalV1_(actual) !== cwReconcileCanonicalV1_(expected)) return false;
  }
  return true;
}

function trendosCloudWriteReconcileRehearsalV1_(e) {
  var p = (e && e.parameter) || e || {};
  var props = PropertiesService.getScriptProperties();

  if (!cwRehearsalEnabledV1_(props)) {
    return { success: false, code: "rehearsal-disabled", sheetsWritten: false, mutationCount: 0 };
  }

  var configuredSecret = cwReconcileTextV1_(props.getProperty(CW_REHEARSAL_SECRET_KEY_V1));
  if (!configuredSecret) {
    return { success: false, code: "rehearsal-secret-not-configured", sheetsWritten: false, mutationCount: 0 };
  }
  if (!cwReconcileSafeEqualV1_(configuredSecret, p.rehearsalSecret)) {
    return { success: false, code: "unauthorized", sheetsWritten: false, mutationCount: 0 };
  }

  var entityType = cwReconcileTextV1_(p.entityType || "order");
  var operation = cwReconcileTextV1_(p.operation || "upsert_order_to_sheets");
  var entityId = cwReconcileTextV1_(p.entityId || p.orderId);
  if (entityType !== "order" || operation !== "upsert_order_to_sheets") {
    return { success: false, code: "unsupported-contract", sheetsWritten: false, mutationCount: 0 };
  }
  if (entityId.indexOf("CW-STAGE-") !== 0) {
    return { success: false, code: "staging-id-required", sheetsWritten: false, mutationCount: 0 };
  }

  var payload = p.payload;
  if (!payload && p.payloadJson) {
    try { payload = JSON.parse(String(p.payloadJson)); }
    catch (err) {
      return { success: false, code: "invalid-payload-json", sheetsWritten: false, mutationCount: 0 };
    }
  }
  payload = payload && typeof payload === "object" ? payload : {};

  var payloadOrderId = cwReconcileTextV1_(payload.orderId || payload.order_id || payload["رقم الأوردر"]);
  if (payloadOrderId !== entityId) {
    return { success: false, code: "order-id-mismatch", sheetsWritten: false, mutationCount: 0 };
  }
  if (!cwRehearsalSyntheticPayloadV1_(payload)) {
    return { success: false, code: "synthetic-payload-required", sheetsWritten: false, mutationCount: 0 };
  }

  var spreadsheet = ss_();
  var ordersSheet = spreadsheet.getSheetByName(SHEET_NAME_ORDERS);
  if (!ordersSheet) {
    return { success: false, code: "orders-sheet-missing", sheetsWritten: false, mutationCount: 0 };
  }
  var rehearsalSheet = spreadsheet.getSheetByName(CW_REHEARSAL_SHEET_V1);
  if (!rehearsalSheet) {
    return { success: false, code: "rehearsal-sheet-missing", targetSheet: CW_REHEARSAL_SHEET_V1, sheetsWritten: false, mutationCount: 0 };
  }
  if (CW_REHEARSAL_SHEET_V1 === SHEET_NAME_ORDERS || rehearsalSheet.getName() === ordersSheet.getName()) {
    return { success: false, code: "production-target-refused", sheetsWritten: false, mutationCount: 0 };
  }

  var ordersHeaders = cwRehearsalHeadersV1_(ordersSheet);
  var rehearsalHeaders = cwRehearsalHeadersV1_(rehearsalSheet);
  var ordersFingerprint = cwReconcileSha256V1_(ordersHeaders);
  var rehearsalFingerprint = cwReconcileSha256V1_(rehearsalHeaders);
  if (ordersFingerprint !== rehearsalFingerprint) {
    return {
      success: false,
      code: "rehearsal-schema-drift",
      ordersSchemaFingerprint: ordersFingerprint,
      rehearsalSchemaFingerprint: rehearsalFingerprint,
      sheetsWritten: false,
      mutationCount: 0
    };
  }

  var mapping = cwReconcileOrderMappingV1_(rehearsalHeaders);
  if (!mapping.orderId.column || !mapping.customerName.column || !mapping.status.column) {
    return { success: false, code: "rehearsal-schema-incompatible", sheetsWritten: false, mutationCount: 0 };
  }

  var planned = cwReconcilePlanV1_(mapping, payload);
  var matches = cwRehearsalFindRowsV1_(rehearsalSheet, mapping.orderId.column, entityId);
  if (matches.length > 1) {
    return { success: false, code: "duplicate-rehearsal-order-id", existingMatches: matches.length, sheetsWritten: false, mutationCount: 0 };
  }
  if (matches.length === 1) {
    var same = cwRehearsalMappedReplayEqualV1_(rehearsalSheet, matches[0], planned.plan);
    return same ? {
      success: true,
      rehearsal: true,
      idempotent: true,
      decision: "replay_noop",
      targetSheet: CW_REHEARSAL_SHEET_V1,
      entityId: entityId,
      sheetsWritten: false,
      mutationCount: 0
    } : {
      success: false,
      code: "conflicting-rehearsal-replay",
      existingRow: matches[0],
      sheetsWritten: false,
      mutationCount: 0
    };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { success: false, code: "rehearsal-lock-busy", sheetsWritten: false, mutationCount: 0 };
  }
  try {
    var recheck = cwRehearsalFindRowsV1_(rehearsalSheet, mapping.orderId.column, entityId);
    if (recheck.length !== 0) {
      return { success: false, code: "rehearsal-race-refused", existingMatches: recheck.length, sheetsWritten: false, mutationCount: 0 };
    }
    var row = cwRehearsalPlannedRowV1_(rehearsalHeaders, planned.plan);
    rehearsalSheet.appendRow(row);
    return {
      success: true,
      rehearsal: true,
      idempotent: false,
      decision: "shadow_inserted",
      targetSheet: CW_REHEARSAL_SHEET_V1,
      entityId: entityId,
      schemaFingerprint: rehearsalFingerprint,
      payloadSha256: cwReconcileSha256V1_(payload),
      sheetsWritten: true,
      mutationCount: 1
    };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}
