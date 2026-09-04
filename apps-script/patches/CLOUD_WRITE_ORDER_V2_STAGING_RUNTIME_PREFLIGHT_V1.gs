/* TrendOS Cloud Write Order V2 — Staging Runtime Preflight V1
 *
 * READ-ONLY first-write safety preflight for an isolated Apps Script runtime.
 *
 * It refuses any spreadsheet except the dedicated staging workbook and validates
 * the visible staging guard plus the pre-write Orders / Order Lines baselines.
 *
 * IMPORTANT: A PASS here does NOT authorize createManualOrder_. Authentication
 * and canonical side-effect isolation are separate gates and remain unresolved.
 */

var CW_V2_STAGING_PREFLIGHT_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1_20260904";
var CW_V2_STAGING_SPREADSHEET_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";
var CW_V2_PRODUCTION_SPREADSHEET_ID_V1 =
  "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
var CW_V2_STAGING_GUARD_SHEET_V1 =
  "__TRENDOS_V2_CANONICAL_STAGING_GUARD";
var CW_V2_STAGING_ORDERS_BASELINE_V1 = 274;
var CW_V2_STAGING_LINES_BASELINE_V1 = 315;

function cwV2StagingPreflightTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2StagingPreflightFailV1_(code, details) {
  return {
    success: false,
    version: CW_V2_STAGING_PREFLIGHT_VERSION_V1,
    code: String(code || "staging-preflight-refused"),
    details: details || null,
    readOnly: true,
    stagingTargetVerified: false,
    authBridgeQualified: false,
    externalSideEffectsQualified: false,
    canonicalInvocationAllowed: false,
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function cwV2StagingGuardMapV1_(sheet) {
  var values = sheet.getRange(1, 1, 8, 2).getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var key = cwV2StagingPreflightTextV1_(values[i][0]);
    if (key) map[key] = cwV2StagingPreflightTextV1_(values[i][1]);
  }
  return {
    banner: cwV2StagingPreflightTextV1_(values[0][0]),
    map: map
  };
}

function trendosCloudWriteOrderV2StagingRuntimePreflightV1_() {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet) {
    return cwV2StagingPreflightFailV1_("spreadsheet-runtime-required");
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet || !spreadsheet.getId) {
    return cwV2StagingPreflightFailV1_("active-spreadsheet-required");
  }

  var spreadsheetId = cwV2StagingPreflightTextV1_(spreadsheet.getId());
  if (!spreadsheetId) return cwV2StagingPreflightFailV1_("spreadsheet-id-required");
  if (spreadsheetId === CW_V2_PRODUCTION_SPREADSHEET_ID_V1) {
    return cwV2StagingPreflightFailV1_("production-spreadsheet-refused");
  }
  if (spreadsheetId !== CW_V2_STAGING_SPREADSHEET_ID_V1) {
    return cwV2StagingPreflightFailV1_("unexpected-staging-spreadsheet", {
      spreadsheetId: spreadsheetId
    });
  }

  var guardSheet = spreadsheet.getSheetByName(CW_V2_STAGING_GUARD_SHEET_V1);
  if (!guardSheet) return cwV2StagingPreflightFailV1_("staging-guard-missing");

  var guard = cwV2StagingGuardMapV1_(guardSheet);
  var expectedBanner = "TRENDOS V2 CANONICAL WRITE STAGING — DO NOT USE FOR PRODUCTION";
  if (guard.banner !== expectedBanner) {
    return cwV2StagingPreflightFailV1_("staging-guard-banner-mismatch");
  }

  var g = guard.map;
  var guardChecks = {
    stagingSpreadsheetId: g.stagingSpreadsheetId === CW_V2_STAGING_SPREADSHEET_ID_V1,
    sourceProductionSpreadsheetId: g.sourceProductionSpreadsheetId === CW_V2_PRODUCTION_SPREADSHEET_ID_V1,
    productionCloudWriteOff: g.productionCloudWrite === "OFF",
    syntheticPrefix: g.allowedSyntheticOrderPrefix === "CW-STAGE-",
    stagingOnlyTarget: g.canonicalWriteTarget === "THIS STAGING COPY ONLY",
    productionMutationRefused: g.productionSpreadsheetMutationAllowed === "NO",
    checkpoint: g.checkpoint === "PERF-CF-02BF"
  };

  var guardKeys = Object.keys(guardChecks);
  for (var i = 0; i < guardKeys.length; i++) {
    if (guardChecks[guardKeys[i]] !== true) {
      return cwV2StagingPreflightFailV1_("staging-guard-contract-mismatch", {
        failedCheck: guardKeys[i]
      });
    }
  }

  var orders = spreadsheet.getSheetByName("الأوردرات");
  var lines = spreadsheet.getSheetByName("بنود الأوردرات");
  if (!orders || !lines) {
    return cwV2StagingPreflightFailV1_("canonical-sheets-missing");
  }

  var ordersLastRow = Number(orders.getLastRow() || 0);
  var linesLastRow = Number(lines.getLastRow() || 0);
  if (ordersLastRow !== CW_V2_STAGING_ORDERS_BASELINE_V1 ||
      linesLastRow !== CW_V2_STAGING_LINES_BASELINE_V1) {
    return cwV2StagingPreflightFailV1_("prewrite-baseline-mismatch", {
      expectedOrdersLastRow: CW_V2_STAGING_ORDERS_BASELINE_V1,
      actualOrdersLastRow: ordersLastRow,
      expectedLinesLastRow: CW_V2_STAGING_LINES_BASELINE_V1,
      actualLinesLastRow: linesLastRow
    });
  }

  return {
    success: true,
    version: CW_V2_STAGING_PREFLIGHT_VERSION_V1,
    readOnly: true,
    spreadsheetId: spreadsheetId,
    productionSpreadsheetRefused: true,
    stagingTargetVerified: true,
    stagingGuardVerified: true,
    guardChecks: guardChecks,
    allowedSyntheticOrderPrefix: "CW-STAGE-",
    ordersLastRow: ordersLastRow,
    orderLinesLastRow: linesLastRow,
    prewriteBaselineVerified: true,
    authBridgeQualified: false,
    externalSideEffectsQualified: false,
    canonicalInvocationAllowed: false,
    nextRequiredGates: [
      "staging-auth-bridge",
      "canonical-side-effect-isolation"
    ],
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0
  };
}

function runTrendOSCloudWriteOrderV2StagingRuntimePreflight() {
  var result = trendosCloudWriteOrderV2StagingRuntimePreflightV1_();
  Logger.log("CLOUD_WRITE_V2_STAGING_RUNTIME_PREFLIGHT=" + JSON.stringify(result));
  return result;
}
