/* TrendOS Cloud Write Order V2 — STAGING Apps Script Bridge V1
 *
 * STAGING ONLY. No doGet/doPost is defined in this file.
 *
 * Authentication model:
 * - Cloudflare Staging mints a short-lived signed Edge token with subject
 *   `cloud-write-v2-bridge` using its existing EDGE_SESSION_SECRET.
 * - This handler never knows that secret. It validates the received token by
 *   calling a fixed validation endpoint on the Staging Worker.
 *
 * Safety:
 * - active spreadsheet == ss_() == dedicated Staging workbook;
 * - Production spreadsheet explicitly refused;
 * - Staging guard must show PERF-CF-02BM verified first canonical write;
 * - exact fixed synthetic bridge contract only for qualification;
 * - synthetic staging service account resolved internally; its token is never
 *   returned or logged;
 * - createManualOrder_ remains the only canonical business writer;
 * - no preallocated business Order ID accepted.
 */

var CW_V2_STAGING_BRIDGE_VERSION_V1 =
  "CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1_20260905";
var CW_V2_STAGING_BRIDGE_STAGING_ID_V1 =
  "1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s";
var CW_V2_STAGING_BRIDGE_PRODUCTION_ID_V1 =
  "1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI";
var CW_V2_STAGING_BRIDGE_GUARD_SHEET_V1 =
  "__TRENDOS_V2_CANONICAL_STAGING_GUARD";
var CW_V2_STAGING_BRIDGE_USERNAME_V1 = "cw_stage_service";
var CW_V2_STAGING_BRIDGE_VALIDATE_URL_V1 =
  "https://trendos-d1-staging.trendmall-contact.workers.dev/v1/staging/cloud-write/v2/bridge/validate";
var CW_V2_STAGING_BRIDGE_ACTION_V1 = "cloudWriteOrderV2StagingBridgeV1";
var CW_V2_STAGING_BRIDGE_REQUEST_ID_V1 = "CWV2-STAGE-BRIDGE-001";

function cwV2StagingBridgeTextV1_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function cwV2StagingBridgeFailV1_(code, details) {
  return {
    success: false,
    verified: false,
    version: CW_V2_STAGING_BRIDGE_VERSION_V1,
    code: String(code || "staging-bridge-refused"),
    details: details || null,
    stagingOnly: true,
    syntheticOnly: true,
    tokenReturned: false,
    productionWriteExecuted: false,
    productionCloudWriteChanged: false
  };
}

function cwV2StagingBridgeHeaderIndexV1_(headers, aliases) {
  headers = Array.isArray(headers) ? headers : [];
  aliases = Array.isArray(aliases) ? aliases : [];
  var normalized = headers.map(function(v){ return cwV2StagingBridgeTextV1_(v).toLowerCase(); });
  for (var i = 0; i < aliases.length; i++) {
    var idx = normalized.indexOf(cwV2StagingBridgeTextV1_(aliases[i]).toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function cwV2StagingBridgeResolveTargetV1_() {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet || typeof ss_ !== "function") {
    return cwV2StagingBridgeFailV1_("staging-spreadsheet-runtime-required");
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  var activeId = active && active.getId ? cwV2StagingBridgeTextV1_(active.getId()) : "";
  if (activeId === CW_V2_STAGING_BRIDGE_PRODUCTION_ID_V1) {
    return cwV2StagingBridgeFailV1_("production-active-spreadsheet-refused");
  }
  if (activeId !== CW_V2_STAGING_BRIDGE_STAGING_ID_V1) {
    return cwV2StagingBridgeFailV1_("unexpected-active-spreadsheet", { activeSpreadsheetId: activeId });
  }

  var canonical = ss_();
  var canonicalId = canonical && canonical.getId ? cwV2StagingBridgeTextV1_(canonical.getId()) : "";
  if (canonicalId === CW_V2_STAGING_BRIDGE_PRODUCTION_ID_V1) {
    return cwV2StagingBridgeFailV1_("production-canonical-target-refused");
  }
  if (canonicalId !== activeId || canonicalId !== CW_V2_STAGING_BRIDGE_STAGING_ID_V1) {
    return cwV2StagingBridgeFailV1_("canonical-staging-target-mismatch", {
      activeSpreadsheetId: activeId,
      canonicalSpreadsheetId: canonicalId
    });
  }

  var props = PropertiesService.getScriptProperties();
  var configured = cwV2StagingBridgeTextV1_(props.getProperty("TRENDOS_SPREADSHEET_ID"));
  if (configured === CW_V2_STAGING_BRIDGE_PRODUCTION_ID_V1) {
    return cwV2StagingBridgeFailV1_("production-script-property-target-refused");
  }
  if (configured && configured !== CW_V2_STAGING_BRIDGE_STAGING_ID_V1) {
    return cwV2StagingBridgeFailV1_("unexpected-script-property-target-refused");
  }
  return { success: true, spreadsheet: canonical, activeId: activeId, canonicalId: canonicalId };
}

function cwV2StagingBridgeGuardMapV1_(spreadsheet) {
  var sh = spreadsheet.getSheetByName(CW_V2_STAGING_BRIDGE_GUARD_SHEET_V1);
  if (!sh) return null;
  var values = sh.getRange(1, 1, 20, 2).getDisplayValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var key = cwV2StagingBridgeTextV1_(values[i][0]);
    if (key) map[key] = cwV2StagingBridgeTextV1_(values[i][1]);
  }
  return { banner: cwV2StagingBridgeTextV1_(values[0][0]), map: map };
}

function cwV2StagingBridgeVerifyGuardV1_(spreadsheet) {
  var guard = cwV2StagingBridgeGuardMapV1_(spreadsheet);
  if (!guard) return cwV2StagingBridgeFailV1_("staging-guard-missing");
  var g = guard.map;
  if (guard.banner !== "TRENDOS V2 CANONICAL WRITE STAGING — DO NOT USE FOR PRODUCTION" ||
      g.stagingSpreadsheetId !== CW_V2_STAGING_BRIDGE_STAGING_ID_V1 ||
      g.sourceProductionSpreadsheetId !== CW_V2_STAGING_BRIDGE_PRODUCTION_ID_V1 ||
      g.productionCloudWrite !== "OFF" ||
      g.productionSpreadsheetMutationAllowed !== "NO" ||
      g.productionAccountUsed !== "NO" ||
      g.v2GateConclusion !== "PASS" ||
      g.latestCheckpoint !== "PERF-CF-02BM" ||
      g.firstCanonicalWriteStatus !== "PASS_RECOVERED" ||
      g.firstCanonicalOrderId !== "3885" ||
      g.firstCanonicalLineId !== "3885-01" ||
      g.canonicalInvocationAllowed.indexOf("STAGING FIRST WRITE VERIFIED") !== 0) {
    return cwV2StagingBridgeFailV1_("staging-guard-contract-mismatch");
  }
  return { success: true };
}

function cwV2StagingBridgeValidateEdgeTokenV1_(bridgeToken) {
  bridgeToken = cwV2StagingBridgeTextV1_(bridgeToken);
  if (!bridgeToken) return cwV2StagingBridgeFailV1_("bridge-token-required");
  if (typeof UrlFetchApp === "undefined" || !UrlFetchApp.fetch) {
    return cwV2StagingBridgeFailV1_("urlfetch-required");
  }
  var response;
  try {
    response = UrlFetchApp.fetch(CW_V2_STAGING_BRIDGE_VALIDATE_URL_V1, {
      method: "post",
      muteHttpExceptions: true,
      contentType: "application/json",
      headers: { Authorization: "Bearer " + bridgeToken },
      payload: JSON.stringify({ purpose: "cloud-write-v2-staging-bridge" })
    });
  } catch (err) {
    return cwV2StagingBridgeFailV1_("bridge-token-validation-unavailable");
  }
  var code = Number(response.getResponseCode() || 0);
  var body = {};
  try { body = JSON.parse(String(response.getContentText() || "{}")); }
  catch (err) { return cwV2StagingBridgeFailV1_("bridge-token-validation-invalid-json"); }
  if (code !== 200 || body.success !== true || body.bridgeAuthorized !== true ||
      body.stagingOnly !== true || body.subject !== "cloud-write-v2-bridge") {
    return cwV2StagingBridgeFailV1_("bridge-token-rejected", { httpCode: code, code: body.code || "" });
  }
  return { success: true, subject: body.subject };
}

function cwV2StagingBridgeVerifySyntheticParamsV1_(p) {
  p = p && typeof p === "object" ? p : {};
  if (cwV2StagingBridgeTextV1_(p.orderId || p.order_id || p["رقم الأوردر"])) {
    return cwV2StagingBridgeFailV1_("business-order-id-preallocation-refused");
  }
  var expected = {
    clientRequestId: CW_V2_STAGING_BRIDGE_REQUEST_ID_V1,
    customerName: "Staging Cloud Write V2 Bridge Qualification",
    customerPhone: "01001112233",
    customerMode: "خارجي / عابر",
    externalCustomerId: "988",
    department: "طباعة",
    itemName: "V2 Bridge Qualification Item",
    qty: "1",
    priority: "عادي",
    status: "طلب جديد",
    heatPress: "نعم",
    flyPrint: "لا",
    source: "TrendOS Staging V2 Bridge",
    notes: "Synthetic staging-only V2 bridge qualification"
  };
  var keys = Object.keys(expected);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (cwV2StagingBridgeTextV1_(p[key]) !== expected[key]) {
      return cwV2StagingBridgeFailV1_("synthetic-bridge-contract-mismatch", { field: key });
    }
  }
  return { success: true, params: expected };
}

function cwV2StagingBridgeResolveAuthV1_(spreadsheet) {
  var users = spreadsheet.getSheetByName("المستخدمين");
  if (!users || users.getLastRow() < 2) return cwV2StagingBridgeFailV1_("staging-users-sheet-required");
  var values = users.getRange(1, 1, users.getLastRow(), users.getLastColumn()).getValues();
  var headers = values[0] || [];
  var cUsername = cwV2StagingBridgeHeaderIndexV1_(headers, ["اسم المستخدم", "Username", "username"]);
  var cDepartment = cwV2StagingBridgeHeaderIndexV1_(headers, ["القسم", "Department", "department"]);
  var cRole = cwV2StagingBridgeHeaderIndexV1_(headers, ["الصلاحية", "Role", "role"]);
  var cActive = cwV2StagingBridgeHeaderIndexV1_(headers, ["مفعل؟", "مفعل", "Active", "active"]);
  var cLastLogin = cwV2StagingBridgeHeaderIndexV1_(headers, ["آخر دخول", "Last Login"]);
  var cToken = cwV2StagingBridgeHeaderIndexV1_(headers, ["Token"]);
  if ([cUsername, cDepartment, cRole, cActive, cLastLogin, cToken].some(function(x){ return x < 0; })) {
    return cwV2StagingBridgeFailV1_("staging-auth-columns-missing");
  }
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (cwV2StagingBridgeTextV1_(values[i][cUsername]) === CW_V2_STAGING_BRIDGE_USERNAME_V1) {
      rowIndex = i; break;
    }
  }
  if (rowIndex < 1) return cwV2StagingBridgeFailV1_("synthetic-staging-user-missing");
  var row = values[rowIndex];
  var username = cwV2StagingBridgeTextV1_(row[cUsername]);
  var department = cwV2StagingBridgeTextV1_(row[cDepartment]);
  var role = cwV2StagingBridgeTextV1_(row[cRole]);
  var active = cwV2StagingBridgeTextV1_(row[cActive]);
  var token = cwV2StagingBridgeTextV1_(row[cToken]);
  if (username !== CW_V2_STAGING_BRIDGE_USERNAME_V1 || department.indexOf("STAGING") === -1 ||
      department.indexOf("خدمة") === -1 || active !== "نعم" || !token || token.indexOf("cw-stage-") !== 0) {
    return cwV2StagingBridgeFailV1_("synthetic-staging-auth-contract-mismatch");
  }
  if (typeof roleFromArabic_ !== "function" || roleFromArabic_(role, department) !== "service" ||
      typeof canCreateOrder_ !== "function" || canCreateOrder_({ username: username, name: username, role: role, department: department, active: active }) !== true) {
    return cwV2StagingBridgeFailV1_("synthetic-service-role-required");
  }
  users.getRange(rowIndex + 1, cLastLogin + 1).setValue(new Date());
  return { success: true, username: username, token: token, tokenReturned: false };
}

function cwV2StagingBridgeSanitizeWriterV1_(result) {
  result = result && typeof result === "object" ? result : {};
  return {
    success: result.success === true,
    orderId: cwV2StagingBridgeTextV1_(result.orderId),
    lineId: cwV2StagingBridgeTextV1_(result.lineId),
    linesCreated: Number(result.linesCreated || 0),
    duplicatePrevented: result.duplicatePrevented === true,
    idempotentReplay: result.idempotentReplay === true,
    reusedOpenOrder: result.reusedOpenOrder === true,
    message: cwV2StagingBridgeTextV1_(result.message)
  };
}

function trendosCloudWriteOrderV2StagingBridgeV1_(payload) {
  payload = payload && typeof payload === "object" ? payload : {};
  if (typeof createManualOrder_ !== "function") return cwV2StagingBridgeFailV1_("canonical-create-manual-order-required");

  var target = cwV2StagingBridgeResolveTargetV1_();
  if (!target.success) return target;
  var guard = cwV2StagingBridgeVerifyGuardV1_(target.spreadsheet);
  if (!guard.success) return guard;
  var edge = cwV2StagingBridgeValidateEdgeTokenV1_(payload.bridgeToken);
  if (!edge.success) return edge;
  var contract = cwV2StagingBridgeVerifySyntheticParamsV1_(payload.canonicalCreateParams);
  if (!contract.success) return contract;
  var auth = cwV2StagingBridgeResolveAuthV1_(target.spreadsheet);
  if (!auth.success) return auth;

  var eventParams = Object.assign({}, contract.params, {
    username: auth.username,
    token: auth.token
  });
  var writer = cwV2StagingBridgeSanitizeWriterV1_(createManualOrder_({ parameter: eventParams }));
  if (!writer.success || !writer.orderId || !writer.lineId) {
    return {
      success: false,
      verified: false,
      version: CW_V2_STAGING_BRIDGE_VERSION_V1,
      code: "canonical-writer-rejected",
      writerResult: writer,
      stagingOnly: true,
      syntheticOnly: true,
      tokenReturned: false,
      productionWriteExecuted: false,
      productionCloudWriteChanged: false
    };
  }
  return {
    success: true,
    verified: true,
    version: CW_V2_STAGING_BRIDGE_VERSION_V1,
    stagingOnly: true,
    syntheticOnly: true,
    bridgeAuthenticated: true,
    canonicalWriterUsed: true,
    clientRequestId: CW_V2_STAGING_BRIDGE_REQUEST_ID_V1,
    orderId: writer.orderId,
    lineId: writer.lineId,
    linesCreated: writer.linesCreated,
    duplicatePrevented: writer.duplicatePrevented,
    idempotentReplay: writer.idempotentReplay,
    tokenReturned: false,
    productionWriteExecuted: false,
    productionCloudWriteChanged: false
  };
}

function trendosV2StagingBridgeTryRoute_(e, payload) {
  payload = payload && typeof payload === "object" ? payload : {};
  var action = cwV2StagingBridgeTextV1_(payload.action || (e && e.parameter && e.parameter.action));
  if (action !== CW_V2_STAGING_BRIDGE_ACTION_V1) return null;
  var result = trendosCloudWriteOrderV2StagingBridgeV1_(payload);
  if (typeof output_ === "function") return output_(result, "");
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
