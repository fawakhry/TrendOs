/* TrendOS Cloud Write Shadow Rehearsal LIVE Replay-Noop Runner V1
 *
 * Operator-only HEAD execution helper.
 * Requires the already CI-qualified CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs
 * and CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs to exist in the same Apps Script project.
 *
 * Purpose:
 * - prove the already-existing synthetic shadow row is treated as an idempotent replay;
 * - use a separate ephemeral rehearsal secret;
 * - leave rehearsal disabled after execution;
 * - never write to the live Orders sheet;
 * - never append/update/delete a Sheet row itself.
 */

function runTrendOSCloudWriteRehearsalReplayNoop() {
  if (typeof trendosCloudWriteReconcileRehearsalV1_ !== "function") {
    throw new Error("REHEARSAL_LIVE_RUNNER_CANDIDATE_MISSING");
  }
  if (typeof cwReconcileOrderMappingV1_ !== "function" ||
      typeof cwReconcilePlanV1_ !== "function") {
    throw new Error("REHEARSAL_LIVE_RUNNER_DRYRUN_DEPENDENCY_MISSING");
  }

  var enabledKey = "TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED";
  var secretKey = "TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET";
  var shadowName = "__TRENDOS_CLOUD_WRITE_REHEARSAL";
  var entityId = "CW-STAGE-33912472435";
  var props = PropertiesService.getScriptProperties();

  var preEnabled = String(props.getProperty(enabledKey) || "").trim();
  var preSecret = String(props.getProperty(secretKey) || "").trim();
  if (preEnabled === "1") {
    throw new Error("REHEARSAL_LIVE_RUNNER_PREEXISTING_ENABLED_REFUSED");
  }
  if (preSecret) {
    throw new Error("REHEARSAL_LIVE_RUNNER_PREEXISTING_SECRET_REFUSED");
  }

  var spreadsheet = ss_();
  var ordersSheet = spreadsheet.getSheetByName(SHEET_NAME_ORDERS);
  var shadowSheet = spreadsheet.getSheetByName(shadowName);
  if (!ordersSheet) throw new Error("REHEARSAL_LIVE_RUNNER_ORDERS_MISSING");
  if (!shadowSheet) throw new Error("REHEARSAL_LIVE_RUNNER_SHADOW_MISSING");
  if (ordersSheet.getName() === shadowSheet.getName()) {
    throw new Error("REHEARSAL_LIVE_RUNNER_TARGET_COLLISION");
  }

  var shadowHeaders = cwRehearsalHeadersV1_(shadowSheet);
  var ordersHeaders = cwRehearsalHeadersV1_(ordersSheet);
  if (cwReconcileSha256V1_(shadowHeaders) !== cwReconcileSha256V1_(ordersHeaders)) {
    throw new Error("REHEARSAL_LIVE_RUNNER_SCHEMA_DRIFT");
  }

  var mapping = cwReconcileOrderMappingV1_(shadowHeaders);
  if (!mapping.orderId || !mapping.orderId.column) {
    throw new Error("REHEARSAL_LIVE_RUNNER_ORDER_ID_COLUMN_MISSING");
  }

  var beforeShadowMatches = cwRehearsalFindRowsV1_(shadowSheet, mapping.orderId.column, entityId);
  var ordersMapping = cwReconcileOrderMappingV1_(ordersHeaders);
  var beforeOrdersMatches = cwRehearsalFindRowsV1_(ordersSheet, ordersMapping.orderId.column, entityId);
  var beforeShadowLastRow = Number(shadowSheet.getLastRow() || 0);
  var beforeOrdersLastRow = Number(ordersSheet.getLastRow() || 0);

  if (beforeShadowMatches.length !== 1 || beforeShadowMatches[0] !== 2) {
    throw new Error("REHEARSAL_LIVE_RUNNER_SHADOW_PRECONDITION_FAILED");
  }
  if (beforeOrdersMatches.length !== 0) {
    throw new Error("REHEARSAL_LIVE_RUNNER_PRODUCTION_ID_COLLISION");
  }

  var payload = {
    orderId: entityId,
    customerName: "Staging Cloud Write Qualification",
    customerPhone: "01001112233",
    status: "cloud-draft",
    department: "",
    priority: "",
    expectedDelivery: "",
    updatedAt: "2026-09-04T19:42:14.653Z",
    _cloudWriteV1: true
  };

  var ephemeralSecret =
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "");

  var safeResult = null;
  try {
    props.setProperty(secretKey, ephemeralSecret);
    props.setProperty(enabledKey, "1");

    var result = trendosCloudWriteReconcileRehearsalV1_({
      parameter: {
        rehearsalSecret: ephemeralSecret,
        entityType: "order",
        operation: "upsert_order_to_sheets",
        entityId: entityId,
        payload: payload
      }
    }) || {};

    if (result.success !== true || result.decision !== "replay_noop" ||
        result.idempotent !== true || result.sheetsWritten !== false ||
        Number(result.mutationCount || 0) !== 0) {
      throw new Error("REHEARSAL_LIVE_RUNNER_REPLAY_NOT_NOOP:" + String(result.code || result.decision || "unknown"));
    }

    var afterShadowMatches = cwRehearsalFindRowsV1_(shadowSheet, mapping.orderId.column, entityId);
    var afterOrdersMatches = cwRehearsalFindRowsV1_(ordersSheet, ordersMapping.orderId.column, entityId);
    var afterShadowLastRow = Number(shadowSheet.getLastRow() || 0);
    var afterOrdersLastRow = Number(ordersSheet.getLastRow() || 0);

    if (afterShadowMatches.length !== 1 || afterShadowMatches[0] !== 2) {
      throw new Error("REHEARSAL_LIVE_RUNNER_SHADOW_CHANGED");
    }
    if (afterOrdersMatches.length !== 0) {
      throw new Error("REHEARSAL_LIVE_RUNNER_PRODUCTION_CHANGED");
    }
    if (afterShadowLastRow !== beforeShadowLastRow || afterOrdersLastRow !== beforeOrdersLastRow) {
      throw new Error("REHEARSAL_LIVE_RUNNER_ROWCOUNT_CHANGED");
    }

    safeResult = {
      success: true,
      rehearsal: true,
      decision: "replay_noop",
      idempotent: true,
      entityId: entityId,
      targetSheet: shadowName,
      shadowMatchesBefore: beforeShadowMatches.length,
      shadowMatchesAfter: afterShadowMatches.length,
      productionMatchesBefore: beforeOrdersMatches.length,
      productionMatchesAfter: afterOrdersMatches.length,
      shadowLastRowBefore: beforeShadowLastRow,
      shadowLastRowAfter: afterShadowLastRow,
      ordersLastRowBefore: beforeOrdersLastRow,
      ordersLastRowAfter: afterOrdersLastRow,
      sheetsWritten: false,
      mutationCount: 0,
      secretExposed: false
    };
  } finally {
    try { props.deleteProperty(enabledKey); } catch (err) {}
    try { props.deleteProperty(secretKey); } catch (err) {}
  }

  if (!safeResult) throw new Error("REHEARSAL_LIVE_RUNNER_NO_RESULT");

  var finalEnabled = String(props.getProperty(enabledKey) || "").trim();
  var finalSecret = String(props.getProperty(secretKey) || "").trim();
  if (finalEnabled === "1" || finalSecret) {
    throw new Error("REHEARSAL_LIVE_RUNNER_CLEANUP_FAILED");
  }

  safeResult.rehearsalEnabledAfter = false;
  safeResult.rehearsalSecretPresentAfter = false;
  Logger.log("REHEARSAL_REPLAY_NOOP_PASS=" + JSON.stringify(safeResult));
  return safeResult;
}
