/* TrendOS Production Cloud Write -> Sheets Reconciliation Qualification V1
 *
 * PREPARED / NOT ROUTED / DEFAULT-OFF.
 * This is a one-record qualification writer for the single synthetic record
 * created by PERF-CF-02CK. It must not be used as a generic outbox drain.
 *
 * Dependencies already present in CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs:
 * - cwReconcileTextV1_
 * - cwReconcileSafeEqualV1_
 * - cwReconcileSha256V1_
 * - cwReconcileOrderMappingV1_
 * - cwReconcilePlanV1_
 *
 * Required Script Properties before any future live qualification:
 * - TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_ENABLED = 1
 * - TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET = <dedicated secret>
 *
 * Safety contract:
 * - exact Order ID only: CW-PROD-QUAL-33975124471
 * - exact synthetic 02CK payload identity only
 * - exact operation only: upsert_order_to_sheets
 * - explicit confirmation literal required
 * - payload SHA-256 is mandatory and verified
 * - existing duplicate Order IDs fail closed
 * - identical existing row is a no-op success
 * - conflicting existing row fails closed
 * - new row is appended once under ScriptLock and then re-read/verified
 * - no header creation, no existing-row update, no delete
 */

var CW_PROD_RECONCILE_QUAL_TARGET_V1 = "CW-PROD-QUAL-33975124471";
var CW_PROD_RECONCILE_QUAL_REQUEST_V1 = "prod-qual-33975124471";
var CW_PROD_RECONCILE_QUAL_CONFIRM_V1 = "QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471";
var CW_PROD_RECONCILE_QUAL_ENABLED_KEY_V1 = "TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_ENABLED";
var CW_PROD_RECONCILE_QUAL_SECRET_KEY_V1 = "TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET";

function cwProdReconcileQualEnabledV1_(props) {
  return cwReconcileTextV1_(props.getProperty(CW_PROD_RECONCILE_QUAL_ENABLED_KEY_V1)) === "1";
}

function cwProdReconcileQualFindRowsV1_(sheet, orderColumn, entityId) {
  var matches = [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return matches;
  var values = sheet.getRange(2, orderColumn, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (cwReconcileTextV1_(values[i][0]) === entityId) matches.push(i + 2);
  }
  return matches;
}

function cwProdReconcileQualSyntheticPayloadV1_(payload) {
  return payload &&
    payload._cloudWriteV1 === true &&
    cwReconcileTextV1_(payload.orderId) === CW_PROD_RECONCILE_QUAL_TARGET_V1 &&
    cwReconcileTextV1_(payload.clientRequestId) === CW_PROD_RECONCILE_QUAL_REQUEST_V1 &&
    cwReconcileTextV1_(payload.customerName) === "TrendOS Production Cloud Write Qualification" &&
    cwReconcileTextV1_(payload.status) === "cloud-qualification" &&
    cwReconcileTextV1_(payload.department) === "SYSTEM-QUALIFICATION" &&
    cwReconcileTextV1_(payload.priority) === "qualification" &&
    Number(payload.total) === 0 &&
    Number(payload.remaining) === 0;
}

function cwProdReconcileQualPlannedRowV1_(headers, plan) {
  var row = Array(headers.length).fill("");
  plan.forEach(function (item) {
    if (item && item.column > 0 && item.column <= row.length) row[item.column - 1] = item.value;
  });
  return row;
}

function cwProdReconcileQualMappedReplayEqualV1_(sheet, rowNumber, plan) {
  var width = Math.max(1, sheet.getLastColumn());
  var current = sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  for (var i = 0; i < plan.length; i++) {
    var item = plan[i];
    var actual = current[item.column - 1];
    var expected = item.value;
    if (cwReconcileSha256V1_(actual) !== cwReconcileSha256V1_(expected)) return false;
  }
  return true;
}

function cwProdReconcileQualResultV1_(extra) {
  var base = {
    qualification: true,
    productionQualificationOnly: true,
    targetOrderId: CW_PROD_RECONCILE_QUAL_TARGET_V1,
    productionCutover: false,
    sheetsAuthoritative: true
  };
  Object.keys(extra || {}).forEach(function (key) { base[key] = extra[key]; });
  return base;
}

function trendosCloudWriteReconcileProductionQualificationV1_(e) {
  var p = (e && e.parameter) || e || {};
  var props = PropertiesService.getScriptProperties();

  if (!cwProdReconcileQualEnabledV1_(props)) {
    return cwProdReconcileQualResultV1_({ success: false, code: "qualification-disabled", persisted: false, sheetsWritten: false, mutationCount: 0 });
  }
  if (cwReconcileTextV1_(p.confirmation) !== CW_PROD_RECONCILE_QUAL_CONFIRM_V1) {
    return cwProdReconcileQualResultV1_({ success: false, code: "confirmation-required", persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var configuredSecret = cwReconcileTextV1_(props.getProperty(CW_PROD_RECONCILE_QUAL_SECRET_KEY_V1));
  if (!configuredSecret) {
    return cwProdReconcileQualResultV1_({ success: false, code: "qualification-secret-not-configured", persisted: false, sheetsWritten: false, mutationCount: 0 });
  }
  if (!cwReconcileSafeEqualV1_(configuredSecret, p.reconcileSecret)) {
    return cwProdReconcileQualResultV1_({ success: false, code: "unauthorized", persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var entityType = cwReconcileTextV1_(p.entityType || "order");
  var operation = cwReconcileTextV1_(p.operation || "upsert_order_to_sheets");
  var entityId = cwReconcileTextV1_(p.entityId || p.orderId);
  if (entityType !== "order" || operation !== "upsert_order_to_sheets") {
    return cwProdReconcileQualResultV1_({ success: false, code: "unsupported-contract", persisted: false, sheetsWritten: false, mutationCount: 0 });
  }
  if (entityId !== CW_PROD_RECONCILE_QUAL_TARGET_V1) {
    return cwProdReconcileQualResultV1_({ success: false, code: "exact-target-required", entityId: entityId, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var payload = p.payload;
  if (!payload && p.payloadJson) {
    try { payload = JSON.parse(String(p.payloadJson)); }
    catch (err) {
      return cwProdReconcileQualResultV1_({ success: false, code: "invalid-payload-json", entityId: entityId, persisted: false, sheetsWritten: false, mutationCount: 0 });
    }
  }
  payload = payload && typeof payload === "object" ? payload : {};
  if (!cwProdReconcileQualSyntheticPayloadV1_(payload)) {
    return cwProdReconcileQualResultV1_({ success: false, code: "exact-synthetic-payload-required", entityId: entityId, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var payloadSha256 = cwReconcileSha256V1_(payload);
  var expectedSha256 = cwReconcileTextV1_(p.payloadSha256).toLowerCase();
  if (!expectedSha256 || expectedSha256 !== payloadSha256) {
    return cwProdReconcileQualResultV1_({ success: false, code: "payload-fingerprint-mismatch", entityId: entityId, payloadSha256: payloadSha256, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var spreadsheet = ss_();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME_ORDERS);
  if (!sheet) {
    return cwProdReconcileQualResultV1_({ success: false, code: "orders-sheet-missing", entityId: entityId, payloadSha256: payloadSha256, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var lastColumn = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(cwReconcileTextV1_);
  var mapping = cwReconcileOrderMappingV1_(headers);
  if (!mapping.orderId.column || !mapping.customerName.column || !mapping.status.column) {
    return cwProdReconcileQualResultV1_({ success: false, code: "orders-schema-incompatible", entityId: entityId, payloadSha256: payloadSha256, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  var planned = cwReconcilePlanV1_(mapping, payload);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return cwProdReconcileQualResultV1_({ success: false, code: "qualification-lock-busy", entityId: entityId, payloadSha256: payloadSha256, persisted: false, sheetsWritten: false, mutationCount: 0 });
  }

  try {
    var matches = cwProdReconcileQualFindRowsV1_(sheet, mapping.orderId.column, entityId);
    if (matches.length > 1) {
      return cwProdReconcileQualResultV1_({ success: false, code: "duplicate-production-order-id", entityId: entityId, payloadSha256: payloadSha256, existingMatchesAfter: matches.length, persisted: false, sheetsWritten: false, mutationCount: 0 });
    }
    if (matches.length === 1) {
      if (!cwProdReconcileQualMappedReplayEqualV1_(sheet, matches[0], planned.plan)) {
        return cwProdReconcileQualResultV1_({ success: false, code: "conflicting-production-replay", entityId: entityId, payloadSha256: payloadSha256, existingMatchesAfter: 1, persisted: false, sheetsWritten: false, mutationCount: 0 });
      }
      return cwProdReconcileQualResultV1_({
        success: true,
        persisted: true,
        idempotent: true,
        decision: "existing_identical_noop",
        entityId: entityId,
        orderId: entityId,
        payloadSha256: payloadSha256,
        existingMatchesAfter: 1,
        sheetsWritten: false,
        mutationCount: 0
      });
    }

    var row = cwProdReconcileQualPlannedRowV1_(headers, planned.plan);
    var writeError = "";
    try {
      sheet.appendRow(row);
      SpreadsheetApp.flush();
    } catch (err) {
      writeError = cwReconcileTextV1_(err && err.message) || "sheet-write-error";
    }

    var after = cwProdReconcileQualFindRowsV1_(sheet, mapping.orderId.column, entityId);
    var persisted = after.length === 1 && cwProdReconcileQualMappedReplayEqualV1_(sheet, after[0], planned.plan);
    if (!persisted) {
      return cwProdReconcileQualResultV1_({
        success: false,
        code: writeError ? "sheet-write-unconfirmed" : "post-write-verification-failed",
        message: writeError,
        entityId: entityId,
        payloadSha256: payloadSha256,
        existingMatchesAfter: after.length,
        persisted: false,
        sheetsWritten: after.length > 0,
        mutationCount: after.length > 0 ? 1 : 0
      });
    }

    return cwProdReconcileQualResultV1_({
      success: true,
      persisted: true,
      idempotent: false,
      decision: writeError ? "insert_verified_after_write_error" : "inserted_and_verified",
      entityId: entityId,
      orderId: entityId,
      payloadSha256: payloadSha256,
      existingMatchesAfter: 1,
      sheetsWritten: true,
      mutationCount: 1
    });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}
